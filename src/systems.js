import {AssetsMonad, CanvasMonad} from "./monads.js";
import {hasComponents} from "./components.js";
import {createBulletEntity} from "./entities.js";
import {clamp} from "./utility.js";

export function composeSystems(...systems) {
    return systems.reduceRight((composed, system) => entities => system(composed(entities)));
}

export function renderSystem(entities, canvasMonad, assetsMonad) {
    canvasMonad.chain(canvas => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        assetsMonad.chain(assets => {
            ctx.drawImage(assets["assets/background.png"], 0, 0, canvas.width, canvas.height);

            entities
                .filter(entity => hasComponents(entity, "position", "size"))
                .forEach(entity => {
                    if (hasComponents(entity, "imageRendered")) {
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
    })

    return entities;
}

export function inputSystem(entities, inputMonad, configMonad) {
    return inputMonad.chain(activeKeys => {
        if (activeKeys.size === 0) {
            return entities.map(entity =>
                entity.type === "player"
                    ? { ...entity, velocity: { x: 0, y: 0} }
                    : entity);
        }

        const playerSpeed = configMonad.getPlayerConfig().speed;
        const keyToVelocity = {
            "ArrowLeft":  { x: -playerSpeed, y: 0 },
            "ArrowRight": { x: playerSpeed, y: 0 },
            "ArrowUp":    { x: 0, y: -playerSpeed },
            "ArrowDown":  { x: 0, y: playerSpeed }
        };

        const activeMovementKeys = Array.from(activeKeys).filter(key => keyToVelocity[key] !== undefined);
        const velocity = activeMovementKeys.reduce((velocity, key) => {
            return {
                x: velocity.x + keyToVelocity[key].x,
                y: velocity.y + keyToVelocity[key].y,
            };
        }, {x: 0, y: 0});

        const shotRequested = activeKeys.has(" ");

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

export function physicsSystem(entities) {
    return entities.map(entity => {
        if (hasComponents(entity, "position", "velocity")) {
            return {
                ...entity,
                position: {
                    x: entity.position.x + entity.velocity.x,
                    y: entity.position.y + entity.velocity.y,
                }
            };
        }

        return entity;
    });
}

export function shotRequestProcessingSystem(entities, timeMonad, assetsMonad, configMonad) {
    const bulletsToAdd = [];
    const currentTime = timeMonad.getOrElse(0);

    const updatedEntities = entities.map(entity => {
        if (!hasComponents(entity, "shooterStatus") ||
            !entity.shooterStatus.shotRequested) {
            return entity;
        }

        const shooterStatus = entity.shooterStatus;
        const isFirstShot = shooterStatus.lastShotTime === null;
        const canShoot = isFirstShot || currentTime - shooterStatus.lastShotTime >= shooterStatus.cooldownMs;

        if (canShoot) {
            bulletsToAdd.push(createBulletEntity(entity, "east", assetsMonad, configMonad));
            return {
                ...entity,
                shooterStatus: {
                    ...entity.shooterStatus,
                    shotRequested: false,
                    lastShotTime: currentTime,
                },
            };
        }

        return {
            ...entity,
            shooterStatus: {
                ...shooterStatus,
                shotRequested: false
            }
        };
    })

    return updatedEntities.concat(bulletsToAdd);
}

export function bulletCleaningSystem(entities, canvasMonad) {
    return entities.filter(entity => {
        if (entity.type !== "bullet") {
            return true;
        }

        let canvas = canvasMonad.getOrElse(null);
        if (canvas === null) {
            return true;
        }

        return entity.position.x >= -entity.size.width && entity.position.x <= canvas.width &&
               entity.position.y >= -entity.size.height && entity.position.y <= canvas.height;
    })
}

export function playerCollisionSystem(entities, canvasMonad) {
    return entities.map(entity => {
        if (entity.type !== "player") {
            return entity;
        }

        let canvas = canvasMonad.getOrElse(null);
        if (canvas === null) {
            return entity;
        }

        return {
            ...entity,
            position: {
                x: clamp(entity.position.x, 0, canvas.width - entity.size.width),
                y: clamp(entity.position.y, 0, canvas.height - entity.size.height),
            },
        };
    });
}

export function logSystem(entities) {
    entities.forEach(entity => {
        console.log(entity);
    })

    return entities;
}