import {CanvasMonad, InputMonad, TimeMonad} from "./monads.js";
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

const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas"));
const assetsMonad = await preloadImages(
    "assets/player-ship.png",
    "assets/bullet.png",
);
let inputMonad = new InputMonad();
let timeMonad = TimeMonad.now();

const entities = [
    createPlayerEntity(canvasMonad),
]

const applySystems = composeSystems(
    // logSystem,
    (entities) => bulletCleaningSystem(entities, canvasMonad),
    (entities) => shotRequestProcessingSystem(entities, timeMonad),
    (entities) => playerCollisionSystem(entities, canvasMonad),
    physicsSystem,
    (entities) => inputSystem(entities, inputMonad),
    (entities) => renderSystem(entities, canvasMonad, assetsMonad),
);

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
