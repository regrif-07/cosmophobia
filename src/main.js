import {CanvasMonad, ConfigMonad, InputMonad, TimeMonad} from "./monads.js";
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

const configMonad = new ConfigMonad();
const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas"));
const assetsMonad = await preloadImages(...Object.values(configMonad.getAssetPaths()));
let inputMonad = new InputMonad();
let timeMonad = TimeMonad.now();

const entities = [
    createPlayerEntity(canvasMonad, assetsMonad, configMonad),
]

const systems = [
    (entities) => bulletCleaningSystem(entities, canvasMonad),
    (entities) => shotRequestProcessingSystem(entities, timeMonad, assetsMonad, configMonad),
    (entities) => playerCollisionSystem(entities, canvasMonad),
    physicsSystem,
    (entities) => inputSystem(entities, inputMonad, configMonad),
    (entities) => renderSystem(entities, canvasMonad, assetsMonad, configMonad),
]
if (configMonad.getDebug().enableLogging) {
    systems.unshift(logSystem);
}

const applySystems = composeSystems(...systems);

window.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
        event.preventDefault(); // prevent page from scrolling
    }

    inputMonad = inputMonad.map(activeKeys => new Set(activeKeys).add(event.key));
})

window.addEventListener("keyup", event => {
    inputMonad = inputMonad.map(activeKeys => {
        const updatedKeys = new Set(activeKeys);
        updatedKeys.delete(event.key);
        return updatedKeys;
    });
});

gameLoop(entities, applySystems);

function gameLoop(initialEntities, applySystems) {
    timeMonad = TimeMonad.now();
    const updatedEntities = applySystems(initialEntities);
    requestAnimationFrame(() => gameLoop(updatedEntities, applySystems));
}
