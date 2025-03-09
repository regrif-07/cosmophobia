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
}

const entities = [
    {
        position: {
            x: 200,
            y: 200,
        },
        size: {
            width: 25,
            height: 25,
        },
    },
    {
        position: {
            x: 500,
            y: 300,
        },
        size: {
            width: 30,
            height: 15,
        },
    }
]

const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas"));

const applySystems = composeSystems(
    physicsSystem,
    (entities) => renderSystem(entities, canvasMonad),
);

gameLoop(entities, applySystems);

function composeSystems(...systems) {
    return systems.reduceRight((composed, system) => entities => system(composed(entities)));
}

function renderSystem(entities, canvasMonad) {
    canvasMonad.chain(canvas => {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        entities.map(entity => {
            if (!entity.position || !entity.size)
            {
                return entity;
            }

            ctx.fillRect(entity.position.x, entity.position.y, entity.size.width, entity.size.height);

            return entity;
        })
    })

    return entities;
}

function physicsSystem(entities) {
    return entities.map(entity => {
        if (!entity.position)
        {
            return entity;
        }

        return {...entity, position: { x: entity.position.x + 1, y: entity.position.y + 1}};
    });
}

function gameLoop(initialEntities, applySystems) {
    const updatedEntities = applySystems(initialEntities);
    requestAnimationFrame(() => gameLoop(updatedEntities, applySystems));
}