import { CanvasMonad, InputMonad } from "./monads.js";
import { createPlayerEntity } from "./entities.js";
import { composeSystems, inputSystem, physicsSystem, renderSystem } from "./systems.js";

function gameLoop(initialEntities, applySystems) {
    const updatedEntities = applySystems(initialEntities);
    requestAnimationFrame(() => gameLoop(updatedEntities, applySystems));
}

const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas"));
let inputMonad = new InputMonad();

const entities = [
    createPlayerEntity(canvasMonad),
    createPlayerEntity(canvasMonad),
    createPlayerEntity(canvasMonad),
    createPlayerEntity(canvasMonad),
    createPlayerEntity(canvasMonad),
    createPlayerEntity(canvasMonad),
]

const applySystems = composeSystems(
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