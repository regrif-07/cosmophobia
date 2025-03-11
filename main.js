import {CanvasMonad, InputMonad, TimeMonad} from "./monads.js";
import { createPlayerEntity } from "./entities.js";
import {
    bulletCleaningSystem,
    composeSystems,
    inputSystem, logSystem,
    physicsSystem,
    renderSystem,
    shotRequestProcessingSystem
} from "./systems.js";

const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas"));
let inputMonad = new InputMonad();
let timeMonad = TimeMonad.now();

const entities = [
    createPlayerEntity(canvasMonad),
]

const applySystems = composeSystems(
    // logSystem,
    (entities) => bulletCleaningSystem(entities, canvasMonad),
    (entities) => shotRequestProcessingSystem(entities, timeMonad),
    physicsSystem,
    (entities) => inputSystem(entities, inputMonad),
    (entities) => renderSystem(entities, canvasMonad),
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