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

export function createPlayerEntity(canvasMonad, assetsMonad, configMonad) {
    const canvas = canvasMonad.getOrElse(null);
    const playerPositionY = canvas ? canvas.height / 2 : 0; // center player ship vertically

    const playerImagePath = configMonad.getAssetPaths().playerShip;
    const size = getAssetImageSize(assetsMonad, playerImagePath);

    const playerConfig = configMonad.getPlayerConfig();
    return createEntity("player",
        Position(playerConfig.startPositionXOffset, playerPositionY),
        Velocity(0, 0),
        Size(size.width, size.height),
        ImageRendered(playerImagePath),
        SimplyRendered(playerConfig.simpleRenderingColor),
        ShooterStatus(playerConfig.shootingCooldownMs),
    );
}

export function createBulletEntity(shootingEntity, direction, assetsMonad, configMonad) {
    if (!hasComponents(shootingEntity, "position", "size", "shooterStatus")) {
        return null;
    }

    const bulletImagePath = configMonad.getAssetPaths().bullet;
    // size for horizontal shooting
    // flip values for vertical
    const bulletSize = getAssetImageSize(assetsMonad, bulletImagePath);

    const middleShootingEntityXPosition = shootingEntity.position.x +
        shootingEntity.size.width / 2 -
        bulletSize.width / 2;
    const middleShootingEntityYPosition = shootingEntity.position.y +
        shootingEntity.size.height / 2 -
        bulletSize.height / 2;

    const bulletConfig = configMonad.getBulletConfig();

    let position = Position(0, 0);
    let velocity = Velocity(0, 0);
    switch (direction) {
        case "north":
            position = Position(
                middleShootingEntityXPosition,
                shootingEntity.position.y - bulletSize.width,
            );
            velocity = Velocity(0, -bulletConfig.speed);

            break;

        case "south":
            position = Position(
                middleShootingEntityXPosition,
                shootingEntity.position.y + shootingEntity.size.height
            );
            velocity = Velocity(0, bulletConfig.speed);

            break;

        case "west":
            position = Position(
                shootingEntity.position.x - bulletSize.width,
                middleShootingEntityYPosition
            );
            velocity = Velocity(-bulletConfig.speed, 0);

            break;

        case "east":
            position = Position(
                shootingEntity.position.x + shootingEntity.size.width,
                middleShootingEntityYPosition,
            );
            velocity = Velocity(bulletConfig.speed, 0);

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
        ImageRendered(bulletImagePath),
        SimplyRendered(bulletConfig.simpleRenderingColor),
    );
}