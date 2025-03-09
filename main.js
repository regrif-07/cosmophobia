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

function physicsSystem(entities) {
    return entities;
}

function gameLoop(initialEntities, applySystems) {
    const updatedEntities = applySystems(initialEntities);
    requestAnimationFrame(() => gameLoop(updatedEntities, applySystems));
}

const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas"));

const entities = [
    createPlayerEntity(canvasMonad),
]

const applySystems = composeSystems(
    physicsSystem,
    (entities) => renderSystem(entities, canvasMonad),
);

gameLoop(entities, applySystems);

