import {AssetsMonad, CanvasMonad} from "./monads.js";
import {hasComponents} from "./components.js";
import {createBulletEntity} from "./entities.js";
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
            ctx.drawImage(
                assets[configMonad.getAssetPaths().background],
                0,
                0,
                canvas.width,
                canvas.height
            ); // draw the background

            entities
                // cannot handle entities without position and size
                .filter(entity => hasComponents(entity, "position", "size"))
                .forEach(entity => {
                    if (hasComponents(entity, "imageRendered")) {
                        // render as image
                        const image = assets[entity.imageRendered.imageUrl];
                        if (image) {
                            ctx.drawImage(
                                image,
                                entity.position.x,
                                entity.position.y,
                                entity.size.width,
                                entity.size.height
                            );
                        }
                    } else if (hasComponents(entity, "simplyRendered")) {
                        // simplified render (not working due to entity size being based on image size)
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

        const controlsConfig = configMonad.getControlsConfig();
        const playerSpeed = configMonad.getPlayerConfig().speed;

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
                configMonad.getPlayerConfig().shootDirection,
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

// clean off-screen bullets
export function bulletCleaningSystem(entities, canvasMonad) {
    let canvas = canvasMonad.getOrElse(null);
    if (canvas === null) {
        return entities; // if canvas is messed up, what are we even cleaning? go fix that bug
    }

    return entities.filter(entity => {
        if (entity.type !== "bullet") {
            return true; // not a bullet - not affected
        }

        // if bullet is out of bounds of the canvas - delete it
        // if it is in bounds - keep it
        return entity.position.x >= -entity.size.width && entity.position.x <= canvas.width &&
            entity.position.y >= -entity.size.height && entity.position.y <= canvas.height;
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

// very intelligent logging system that just spams all entities into console a couple of billions times per second
export function logSystem(entities) {
    entities.forEach(entity => {
        console.log(entity);
    })

    return entities;
}