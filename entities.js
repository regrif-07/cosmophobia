import {Position, SimplyRendered, Velocity} from "./components.js";

export function createEntity(id, ...components) {
    return Object.assign(
        { id },
        ...components
    );
}

export function createPlayerEntity(canvasMonad) {
    const playerPositionY = canvasMonad.getOrElse(null).height - 30;
    return createEntity("player",
        Position(0, playerPositionY),
        Velocity(0, 0),
        SimplyRendered(30, 30, "red")
    );
}