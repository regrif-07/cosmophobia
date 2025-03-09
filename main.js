class CanvasMonad {
    constructor(canvas) {
        this.canvas = canvas;
    }

    isJust() {
        return this.canvas !== null && this.canvas !== undefined;
    }

    map(func) {
        return (this.canvas !== null) ? new CanvasMonad(func(this.canvas)) : new CanvasMonad(null);
    }

    chain(func) {
        return (this.canvas !== null) ? func(this.canvas) : new CanvasMonad(null);
    }

    getOrElse(defaultValue) {
        return (this.canvas !== null) ? this.canvas : defaultValue;
    }

    getContext(type) {
        return (this.canvas !== null) ? this.canvas.getContext(type) : null;
    }
}

class InputMonad {
    constructor(events) {
        this.events = events;
    }

    map(func) {
        return new InputMonad(func(this.events));
    }

    chain(func) {
        return func(this.events);
    }

    getOrElse(defaultValue) {
        return this.events.length ? this.events : defaultValue;
    }
}

function Position(x, y) {
    return {
        position: {
            x: x,
            y: y,
        },
    };
}

function Velocity(x, y) {
    return {
        velocity: {
            x: x,
            y: y,
        },
    };
}

function SimplyRendered(width, height, color) {
    return {
        simplyRendered: {
            width: width,
            height: height,
            color: color,
        },
    };
}

function createEntity(id, ...components) {
    return Object.assign(
        { id },
        ...components
    );
}

function createPlayerEntity(canvasMonad) {
    const playerPositionY = canvasMonad.getOrElse(null).height - 30;
    return createEntity("player",
        Position(0, playerPositionY),
        Velocity(0, 0),
        SimplyRendered(30, 30, "red")
    );
}

function composeSystems(...systems) {
    return systems.reduceRight((composed, system) => entities => system(composed(entities)));
}

function renderSystem(entities, canvasMonad) {
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

function inputSystem(entities, inputMonad) {
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

function physicsSystem(entities) {
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

function gameLoop(initialEntities, applySystems) {
    const updatedEntities = applySystems(initialEntities);
    requestAnimationFrame(() => gameLoop(updatedEntities, applySystems));
}

const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas"));
let inputMonad = new InputMonad([]);

const entities = [
    createPlayerEntity(canvasMonad),
]

const applySystems = composeSystems(
    physicsSystem,
    (entities) => inputSystem(entities, inputMonad),
    (entities) => renderSystem(entities, canvasMonad),
);

window.addEventListener("keydown", event => {
    inputMonad = inputMonad.map(events => [...events, { type: "keydown", key: event.key}]);
})
window.addEventListener("keyup", event => {
    inputMonad = inputMonad.map(events => [...events, { type: "keyup", key: event.key }]);
})

gameLoop(entities, applySystems);

