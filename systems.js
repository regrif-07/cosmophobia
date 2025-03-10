import {CanvasMonad} from "./monads.js";

export function composeSystems(...systems) {
    return systems.reduceRight((composed, system) => entities => system(composed(entities)));
}

export function renderSystem(entities, canvasMonad) {
    canvasMonad.chain(canvas => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        entities.forEach(entity => {
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
    return inputMonad.chain(events => {
        return entities.map(entity => {
            if (entity.id !== "player") {
                return entity;
            }

            let velocity = { x: 0, y: 0 };
            events.forEach(event => {
                if (event.type === "keydown") {
                    if (event.key === "ArrowLeft") velocity.x = -2;
                    if (event.key === "ArrowRight") velocity.x = 2;
                    if (event.key === "ArrowUp") velocity.y = -2;
                    if (event.key === "ArrowDown") velocity.y = 2;
                }
                if (event.type === "keyup") {
                    velocity.x = 0;
                    velocity.y = 0;
                }
            });

            return { ...entity, velocity };
        });
    });
}

export function physicsSystem(entities) {
    return entities.map(entity => {
        if (entity.position && entity.velocity) {
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
