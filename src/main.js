import {CanvasMonad, ConfigMonad, InputMonad, RandomMonad, TimeMonad} from "./monads.js";
import { createPlayerEntity } from "./entities.js";
import {
    bulletCleaningSystem,
    composeSystems,
    inputSystem, logSystem,
    physicsSystem, playerCollisionSystem,
    renderSystem,
    shotRequestProcessingSystem
} from "./systems.js";
import {preloadImages} from "./assets-management.js";

// monads
const configMonad = new ConfigMonad(); // handle shared configuration
const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas")); // encapsulate canvas
const assetsMonad = await preloadImages(...Object.values(configMonad.getAssetPaths())); // handle all game assets
let inputMonad = new InputMonad(); // handle input
let timeMonad = TimeMonad.now(); // handle time-related functionality (updated on each game loop iteration)
const randomMonad = new RandomMonad(); // handle random based functionality

// input configuration based on events

// add newly pressed key to inputMonad
window.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
        event.preventDefault(); // prevent page from scrolling
    }

    inputMonad = inputMonad.map(activeKeys => new Set(activeKeys).add(event.key));
})

// delete key from inputMonad after it was "unpressed"
window.addEventListener("keyup", event => {
    inputMonad = inputMonad.map(activeKeys => {
        const updatedKeys = new Set(activeKeys);
        updatedKeys.delete(event.key);
        return updatedKeys;
    });
});

// create all entities
const entities = [
    createPlayerEntity(canvasMonad, assetsMonad, configMonad),
]

// list of all systems to compose
let systems = [
    (entities) => bulletCleaningSystem(entities, canvasMonad),
    (entities) => shotRequestProcessingSystem(entities, timeMonad, assetsMonad, configMonad),
    (entities) => playerCollisionSystem(entities, canvasMonad),
    physicsSystem,
    (entities) => inputSystem(entities, inputMonad, configMonad),
    (entities) => renderSystem(entities, canvasMonad, assetsMonad, configMonad),
]

// if logging is enabled, insert loggingSystem in the first position
systems = configMonad.getDebug().enableLogging ? [logSystem, ...systems] : systems;

// compose all systems
const applySystems = composeSystems(...systems);

// main game loop call
gameLoop(entities, applySystems);

// main game loop function
// to maintain immutability entities are not modified in place (passed as argument to next iteration)
function gameLoop(initialEntities, applySystems) {
    timeMonad = TimeMonad.now(); // update timeMonad with currentTime
    const updatedEntities = applySystems(initialEntities); // apply all systems to entities
    requestAnimationFrame(() => gameLoop(updatedEntities, applySystems)); // continue wih next iteration
}
