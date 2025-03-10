import {CanvasMonad} from "./monads.js";
import {hasComponents} from "./components.js";

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
        if (activeKeys.length === 0) {
            return entities;
        }

        const keyToVelocity = {
            "ArrowLeft":  { x: -4, y: 0 },
            "ArrowRight": { x: 4, y: 0 },
            "ArrowUp":    { x: 0, y: -4 },
            "ArrowDown":  { x: 0, y: 4 }
        };

        const velocity = Array.from(activeKeys).reduce((velocity, key) => {
            return {
                x: velocity.x + keyToVelocity[key].x,
                y: velocity.y + keyToVelocity[key].y,
            };
        }, {x: 0, y: 0});

        return entities.map(entity =>
            entity.id === "player"
                ? { ...entity, velocity: velocity }
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
