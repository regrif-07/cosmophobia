import {CanvasMonad} from "./monads.js";
import {hasComponents} from "./components.js";
import {createBulletEntity} from "./entities.js";

export function composeSystems(...systems) {
    return systems.reduceRight((composed, system) => entities => system(composed(entities)));
}

export function renderSystem(entities, canvasMonad) {
    canvasMonad.chain(canvas => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        entities.filter(entity => hasComponents(entity, "position")).forEach(entity => {
            if (!entity.position)
            {
                return entity;
            }

            if (entity.simplyRendered)
            {
                ctx.fillStyle = entity.simplyRendered.color;
                ctx.fillRect(
                    entity.position.x,
                    entity.position.y,
                    entity.simplyRendered.width,
                    entity.simplyRendered.height
                );
            }
        });

        return new CanvasMonad(canvas);
    })

    return entities;
}

export function inputSystem(entities, inputMonad) {
    return inputMonad.chain(activeKeys => {
        if (activeKeys.size === 0) {
            return entities.map(entity =>
                entity.type === "player"
                    ? { ...entity, velocity: { x: 0, y: 0} }
                    : entity);
        }

        const keyToVelocity = {
            "ArrowLeft":  { x: -4, y: 0 },
            "ArrowRight": { x: 4, y: 0 },
            "ArrowUp":    { x: 0, y: -4 },
            "ArrowDown":  { x: 0, y: 4 }
        };

        const velocity = Array.from(activeKeys).reduce((velocity, key) => {
            if (keyToVelocity[key] === undefined) {
                return { x: 0, y: 0 };
            }

            return {
                x: velocity.x + keyToVelocity[key].x,
                y: velocity.y + keyToVelocity[key].y,
            };
        }, {x: 0, y: 0});

        const shooterStatus = { shotRequested: false };
        if (activeKeys.has(" ")) {
            shooterStatus.shotRequested = true;
        }

        return entities.map(entity =>
            entity.type === "player"
                ? { ...entity, velocity: velocity, shooterStatus }
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

export function shotRequestProcessingSystem(entities) {
    const bulletsToAdd = [];

    const updatedEntities = entities.map(entity => {
        if (!hasComponents(entity, "shooterStatus") || !entity.shooterStatus.shotRequested) {
            return entity;
        }

        bulletsToAdd.push(createBulletEntity());
        return { ...entity, shooterStatus: { shotRequested: false } };
    })

    return updatedEntities.concat(bulletsToAdd);
}

export function bulletCleaningSystem(entities, canvasMonad) {
    return entities.filter(entity => {
        if (entity.type !== "bullet") {
            return true;
        }

        let canvas = canvasMonad.getOrElse(null);
        return entity.position.x >= 0 && entity.position.x <= canvas.width &&
               entity.position.y >= 0 && entity.position.y <= canvas.height;
    })
}

export function logSystem(entities) {
    entities.forEach(entity => {
        console.log(entity);
    })

    return entities;
}