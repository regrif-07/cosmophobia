import {Position, ShooterStatus, SimplyRendered, Size, Velocity} from "./components.js";

let entityIdCounter = 0;
export function createEntity(type, ...components) {
    let id = entityIdCounter++;
    return Object.assign(
        { id, type },
        ...components
    );
}

export function createPlayerEntity(canvasMonad) {
    const canvas = canvasMonad.getOrElse(null);
    const playerPositionY = canvas ? canvas.height / 2 : 0;

    return createEntity("player",
        Position(50, playerPositionY),
        Velocity(0, 0),
        Size(30, 30),
        SimplyRendered("red"),
        ShooterStatus(),
    );
}

export function createBulletEntity() {
    return createEntity("bullet",
        Position(50, 50),
        Velocity(10, 0),
        Size(30, 10),
        SimplyRendered("black"),
    );
}