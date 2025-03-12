import {hasComponents, ImageRendered, Position, ShooterStatus, SimplyRendered, Size, Velocity} from "./components.js";

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
        Size(135, 124),
        ImageRendered("player-ship.png"),
        SimplyRendered("red"),
        ShooterStatus(500),
    );
}

export function createBulletEntity(shootingEntity, direction) {
    if (!hasComponents(shootingEntity, "position", "size", "shooterStatus")) {
        return null;
    }

    // size for horizontal shooting
    // flip values for vertical
    const bulletWidth = 30;
    const bulletHeight = 10;

    const middleShootingEntityXPosition = shootingEntity.position.x + shootingEntity.size.width / 2;
    const middleShootingEntityYPosition = shootingEntity.position.y + shootingEntity.size.height / 2;

    let position = Position(0, 0);
    let velocity = Velocity(0, 0);
    switch (direction) {
        case "north":
            position = Position(
                middleShootingEntityXPosition,
                shootingEntity.position.y - bulletWidth,
            );
            velocity = Velocity(0, -10);

            break;

        case "south":
            position = Position(
                middleShootingEntityXPosition,
                shootingEntity.position.y + shootingEntity.size.height
            );
            velocity = Velocity(0, 10);

            break;

        case "west":
            position = Position(
                shootingEntity.position.x - bulletWidth,
                middleShootingEntityYPosition
            );
            velocity = Velocity(-10, 0);

            break;

        case "east":
            position = Position(
                shootingEntity.position.x + shootingEntity.size.width,
                middleShootingEntityYPosition
            );
            velocity = Velocity(10, 0);

            break;
    }

    // noinspection JSSuspiciousNameCombination
    const size = (direction === "north" || direction === "south") ? Size(bulletHeight, bulletWidth) : Size(bulletWidth, bulletHeight);

    return createEntity("bullet",
        position,
        velocity,
        size,
        SimplyRendered("black"),
    );
}