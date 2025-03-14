import {hasComponents, ImageRendered, Position, ShooterStatus, SimplyRendered, Size, Velocity} from "./components.js";
import {getAssetImageSize} from "./utility.js";

// simple global sequential id counter
// not good, but I will leave it like that
let entityIdCounter = 0;

// get next id and create new entity from provided type and components
export function createEntity(type, ...components) {
    let id = entityIdCounter++;
    return Object.assign(
        { id, type },
        ...components
    );
}

// create the player entity with appropriate state
export function createPlayerEntity(canvasMonad, assetsMonad, configMonad) {
    const canvas = canvasMonad.getOrElse(null);
    const playerPositionY = canvas ? canvas.height / 2 : 0; // center player ship vertically on the canvas

    const playerImagePath = configMonad.getAssetPaths().playerShip;
    const size = getAssetImageSize(assetsMonad, playerImagePath); // base player size on the size of its image

    const playerConfig = configMonad.getPlayerConfig();
    return createEntity("player",
        // player position is vertically centered, with some horizontal offset
        Position(playerConfig.startPositionXOffset, playerPositionY),
        Velocity(0, 0),
        Size(size.width, size.height),
        ImageRendered(playerImagePath),
        SimplyRendered(playerConfig.simpleRenderingColor),
        ShooterStatus(playerConfig.shootingCooldownMs),
    );
}

// create a bullet entity
// provide shootingEntity, which is, as you might have guessed, an entity that shot that bullet
// provide direction ("north", "south", "west" or "east")
// bullet is appropriately configured relative to the shooting entity
export function createBulletEntity(shootingEntity, direction, assetsMonad, configMonad) {
    // entity should have position and size in order to place our bullets appropriately
    // it should also have shooting metadata (shooterStatus)
    if (!hasComponents(shootingEntity, "position", "size", "shooterStatus")) {
        return null;
    }

    // bullet size is based on bullet image size
    const bulletImagePath = configMonad.getAssetPaths().bullet;
    // bullet size is kinda messed up, because we can have vertical and horizontal shooters
    // bullet image is horizontal - so this size is horizontal too
    // in order to use it with vertical bullet we should flip width with height
    const bulletSize = getAssetImageSize(assetsMonad, bulletImagePath);

    // calculate horizontal and vertical middle positions relative to shooting entity
    // (entities are shooting from the middle of shooting side)
    const middleShootingEntityXPosition = shootingEntity.position.x +
        shootingEntity.size.width / 2 -
        bulletSize.width / 2;
    const middleShootingEntityYPosition = shootingEntity.position.y +
        shootingEntity.size.height / 2 -
        bulletSize.height / 2;

    const bulletConfig = configMonad.getBulletConfig();

    let position = Position(0, 0);
    let velocity = Velocity(0, 0);
    // based on a direction, calculate position and velocity of our new bullet
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

    // size is messed up for vertical shooters, so we need to flip values appropriately
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