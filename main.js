import { CanvasMonad, InputMonad } from "./monads.js";
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

const entities = [
    createPlayerEntity(canvasMonad),
]

let currentTime = Date.now();

const applySystems = composeSystems(
    // logSystem,
    (entities) => bulletCleaningSystem(entities, canvasMonad),
    (entities) => shotRequestProcessingSystem(entities, currentTime),
    physicsSystem,
    (entities) => inputSystem(entities, inputMonad),
    (entities) => renderSystem(entities, canvasMonad),
);

window.addEventListener("keydown", event => {
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
    currentTime = Date.now();
    const updatedEntities = applySystems(initialEntities);
    requestAnimationFrame(() => gameLoop(updatedEntities, applySystems));
}