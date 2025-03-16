import {AssetsMonad, CanvasMonad} from "./monads.js";
import {hasComponents} from "./components.js";
import {createBulletEntity, createEnemyEntity} from "./entities.js";
import {clamp} from "./utility.js";

// compose system functions into one beefy function
export function composeSystems(...systems) {
    return systems.reduceRight((composed, system) => entities => system(composed(entities)));
}

// handle all rendering in the game
export function renderSystem(entities, canvasMonad, assetsMonad, configMonad) {
    canvasMonad.chain(canvas => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas to construct new frame from scratch

        assetsMonad.chain(assets => {
            const backgroundImage = assets[configMonad.getSection("assetPaths").background];
            if (backgroundImage) {
                ctx.drawImage(
                    backgroundImage,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                ); // draw the background image
            }
            else { // fallback plain color background
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            entities
                // cannot handle entities without position and size
                .filter(entity => hasComponents(entity, "position", "size"))
                .forEach(entity => {
                    const hasImageRenderedComponent = hasComponents(entity, "imageRendered");
                    let imageRenderingFailed = false;
                    if (hasImageRenderedComponent) {
                        const image = assets[entity.imageRendered.imageUrl];
                        if (image) {
                            // render as image
                            ctx.drawImage(
                                image,
                                entity.position.x,
                                entity.position.y,
                                entity.size.width,
                                entity.size.height
                            );
                        }
                        else {
                            imageRenderingFailed = true;
                        }
                    }

                    // fallback simple geometry renderer
                    if (hasComponents(entity, "simplyRendered") &&
                        (!hasImageRenderedComponent || imageRenderingFailed)) {
                        ctx.fillStyle = entity.simplyRendered.color;
                        ctx.fillRect(
                            entity.position.x,
                            entity.position.y,
                            entity.size.width,
                            entity.size.height
                        );
                    }
                });

            return new AssetsMonad(assets);
        });

        return new CanvasMonad(canvas);
    });

    return entities; // entities are not affected by this system
}

// update player entity based on input state
export function inputSystem(entities, inputMonad, configMonad) {
    return inputMonad.chain(activeKeys => {
        // if no keys are pressed, reset player velocity
        if (activeKeys.size === 0) {
            return entities.map(entity =>
                entity.type === "player"
                    ? { ...entity, velocity: { x: 0, y: 0} }
                    : entity);
        }

        const controlsConfig = configMonad.getSection("controls");
        const playerSpeed = configMonad.getSection("player").speed;

        // maps pressed key to velocity
        const keyToVelocity = {
            [controlsConfig.moveLeft]: { x: -playerSpeed, y: 0 },
            [controlsConfig.moveRight]: { x: playerSpeed, y: 0 },
            [controlsConfig.moveUp]: { x: 0, y: -playerSpeed },
            [controlsConfig.moveDown]: { x: 0, y: playerSpeed }
        };

        // get keys that are related to movement
        const activeMovementKeys = Array.from(activeKeys).filter(key => keyToVelocity[key] !== undefined);
        // calculate the final velocity by adding up all velocities for each pressed movement key
        const velocity = activeMovementKeys.reduce((velocity, key) => {
            return {
                x: velocity.x + keyToVelocity[key].x,
                y: velocity.y + keyToVelocity[key].y,
            };
        }, {x: 0, y: 0});

        // if shoot button was pressed - make a shot request
        const shotRequested = activeKeys.has(controlsConfig.shoot);

        // return entities; update player entity with all input influenced data
        return entities.map(entity =>
            entity.type === "player"
                ? {
                    ...entity,
                    velocity: velocity,
                    shooterStatus: {
                        ...entity.shooterStatus, shotRequested: shotRequested
                    }
                }
                : entity);
    });
}

// update physics state of all entities
export function physicsSystem(entities) {
    return entities.map(entity => {
        if (hasComponents(entity, "position", "velocity")) {
            return {
                ...entity,
                position: { // apply velocity
                    x: entity.position.x + entity.velocity.x,
                    y: entity.position.y + entity.velocity.y,
                }
            };
        }

        return entity;
    });
}

// process shot requests
export function shotRequestProcessingSystem(entities, timeMonad, assetsMonad, configMonad) {
    const bulletsToAdd = [];
    const currentTime = timeMonad.getOrElse(0);

    const updatedEntities = entities.map(entity => {
        // if entity is not a shooter or if shot is not requested - do not affect it
        if (!hasComponents(entity, "shooterStatus") ||
            !entity.shooterStatus.shotRequested) {
            return entity;
        }

        const shooterStatus = entity.shooterStatus;
        const isFirstShot = shooterStatus.lastShotTime === null;
        // entity can shoot if that's its first shot or if shot cooldown has passed
        const canShoot = isFirstShot || currentTime - shooterStatus.lastShotTime >= shooterStatus.cooldownMs;

        if (canShoot) {
            bulletsToAdd.push(createBulletEntity(
                entity,
                configMonad.getSection("player").shootDirection,
                assetsMonad,
                configMonad
            )); // fulfill the request by creating a new bullet entity
            return { // close the request and update cooldown
                ...entity,
                shooterStatus: {
                    ...entity.shooterStatus,
                    shotRequested: false,
                    lastShotTime: currentTime,
                },
            };
        }

        // if entity requested a shot, but it was not possible at that moment, close the request
        return {
            ...entity,
            shooterStatus: {
                ...shooterStatus,
                shotRequested: false
            }
        };
    })

    // return all updated entities along with new bullets
    return updatedEntities.concat(bulletsToAdd);
}

// clean off-screen entities (bullets, enemies)
export function entityCleaningSystem(entities, canvasMonad) {
    let canvas = canvasMonad.getOrElse(null);
    if (canvas === null) {
        return entities; // if canvas is messed up, what are we even cleaning? go fix that bug
    }

    return entities.filter(entity => {
        switch (entity.type) {
            case "bullet":
                // delete a bullet if it is out of bounds of the canvas
                return entity.position.x >= -entity.size.width && entity.position.x <= canvas.width &&
                    entity.position.y >= -entity.size.height && entity.position.y <= canvas.height;

            case "enemy":
                // delete enemy if it is out of the left bound of the canvas
                return entity.position.x >= -entity.size.width;

            default:
                return true; // other entity types are not affected
        }
    })
}

// handle player collision with canvas borders
export function playerCollisionSystem(entities, canvasMonad) {
    let canvas = canvasMonad.getOrElse(null);
    if (canvas === null) {
        return entities; // if canvas is messed up, what are we even cleaning? go fix that bug
    }

    return entities.map(entity => {
        if (entity.type !== "player") {
            return entity; // not a player - not affected
        }

        return {
            ...entity,
            position: { // fit player position within canvas borders
                x: clamp(entity.position.x, 0, canvas.width - entity.size.width),
                y: clamp(entity.position.y, 0, canvas.height - entity.size.height),
            },
        };
    });
}

// spawns enemies in waves
export function enemySpawnSystem(entities, canvasMonad, assetsMonad, configMonad, randomMonad) {
    const enemyEntitiesCount = entities.filter(entity => entity.type === "enemy").length;
    if (enemyEntitiesCount !== 0) { // if there are no enemies - current wave is in action, don't spawn any enemies
        return entities;
    }

    const enemySpawnConfig = configMonad.getSection("enemySpawn");

    const numberOfEnemiesToSpawn = randomMonad.nextInt(
        enemySpawnConfig.minEnemiesPerWave,
        enemySpawnConfig.maxEnemiesPerWave
    ).getValue();

    const enemiesToAdd = [];
    for (let _ = 0; _ < numberOfEnemiesToSpawn; ++_) {
        enemiesToAdd.push(createEnemyEntity(canvasMonad, assetsMonad, configMonad, randomMonad));
    }

    return entities.concat(enemiesToAdd); // return entities with new enemies
}

// handle enemy collision with canvas top and bottom borders; switch direction of vertical movement on collision
export function enemyCollisionSystem(entities, canvasMonad) {
    let canvas = canvasMonad.getOrElse(null);
    if (canvas === null) {
        return entities; // if canvas is messed up, what are we even cleaning? go fix that bug
    }

    return entities.map(entity => {
        if (entity.type !== "enemy") {
            return entity; // not an enemy - not affected
        }

        if (entity.position.y > 0 && entity.position.y < canvas.height - entity.size.height) {
            return entity; // if there is no collision - don't update enemy
        }

        return {
            ...entity,
            position: { // fit enemy position within canvas top and bottom borders
                ...entity.position,
                y: clamp(entity.position.y, 0, canvas.height - entity.size.height),
            },
            velocity: { // flip the direction of vertical movement
                ...entity.velocity,
                y: -1 * entity.velocity.y,
            },
        };
    });
}

// very intelligent logging system that just spams all entities into console a couple of billions times per second
export function logSystem(entities) {
    entities.forEach(entity => {
        console.log(entity);
    })

    return entities;
}