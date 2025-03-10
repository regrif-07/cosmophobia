import {Position, SimplyRendered, Velocity} from "./components.js";

export function createEntity(id, ...components) {
    return Object.assign(
        { id },
        ...components
    );
}

export function createPlayerEntity(canvasMonad) {
    const canvas = canvasMonad.getOrElse(null);
    const playerPositionY = canvas ? canvas.height / 2 : 0;

    return createEntity("player",
        Position(50, playerPositionY),
        Velocity(0, 0),
        SimplyRendered(30, 30, "red")
    );
}