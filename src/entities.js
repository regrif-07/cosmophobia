import {hasComponents, ImageRendered, Position, ShooterStatus, SimplyRendered, Size, Velocity} from "./components.js";
import {getAssetImageSize} from "./utility.js";

let entityIdCounter = 0;
export function createEntity(type, ...components) {
    let id = entityIdCounter++;
    return Object.assign(
        { id, type },
        ...components
    );
}

export function createPlayerEntity(canvasMonad, assetsMonad) {
    const canvas = canvasMonad.getOrElse(null);
    const playerPositionY = canvas ? canvas.height / 2 : 0;

    const size = getAssetImageSize(assetsMonad, "assets/player-ship.png")

    return createEntity("player",
        Position(50, playerPositionY),
        Velocity(0, 0),
        Size(size.width, size.height),
        ImageRendered("assets/player-ship.png"),
        SimplyRendered("red"),
        ShooterStatus(500),
    );
}

export function createBulletEntity(shootingEntity, direction, assetsMonad) {
    if (!hasComponents(shootingEntity, "position", "size", "shooterStatus")) {
        return null;
    }

    // size for horizontal shooting
    // flip values for vertical
    const bulletSize = getAssetImageSize(assetsMonad, "assets/bullet.png");

    const middleShootingEntityXPosition = shootingEntity.position.x +
        shootingEntity.size.width / 2 -
        bulletSize.width / 2;
    const middleShootingEntityYPosition = shootingEntity.position.y +
        shootingEntity.size.height / 2 -
        bulletSize.height / 2;

    let position = Position(0, 0);
    let velocity = Velocity(0, 0);
    switch (direction) {
        case "north":
            position = Position(
                middleShootingEntityXPosition,
                shootingEntity.position.y - bulletSize.width,
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
                shootingEntity.position.x - bulletSize.width,
                middleShootingEntityYPosition
            );
            velocity = Velocity(-10, 0);

            break;

        case "east":
            position = Position(
                shootingEntity.position.x + shootingEntity.size.width,
                middleShootingEntityYPosition,
            );
            velocity = Velocity(10, 0);

            break;
    }

    // noinspection JSSuspiciousNameCombination
    const size = (direction === "north" || direction === "south")
        ? Size(bulletSize.height, bulletSize.width)
        : Size(bulletSize.width, bulletSize.height);

    return createEntity("bullet",
        position,
        velocity,
        size,
        ImageRendered("assets/bullet.png"),
        SimplyRendered("black"),
    );
}