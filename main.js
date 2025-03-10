import { CanvasMonad, InputMonad } from "./monads.js";
import { createPlayerEntity } from "./entities.js";
import { composeSystems, inputSystem, physicsSystem, renderSystem } from "./systems.js";


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

