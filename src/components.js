// return true if entity has all provided components (provided by component names); false otherwise
export function hasComponents(entity, ...componentNames) {
    return componentNames.every(name => entity[name] !== undefined);
}

// represent position on canvas
export function Position(x, y) {
    return {
        position: {
            x: x,
            y: y,
        },
    };
}

// represent horizontal and vertical velocity
export function Velocity(x, y) {
    return {
        velocity: {
            x: x,
            y: y,
        },
    };
}

// provide size information (will be used by rendering system, collision system and many other systems)
export function Size(width, height) {
    return {
        size: {
            width: width,
            height: height,
        },
    };
}

// obsolete
// provides information for simplified rendering
// was used on first steps of development
// after migration to image assets system was supposed to be used as fallback rendering option
// yet, because I am lazy and entity size is based on its image size, this fallback option will never show itself
export function SimplyRendered(color) {
    return {
        simplyRendered: {
            color: color,
        },
    };
}

// provides information for image (sprite) rendering
export function ImageRendered(imageUrl) {
    return {
        imageRendered: {
            imageUrl: imageUrl,
        }
    };
}

// provides shooter metadata information
export function ShooterStatus(cooldownMs) {
    return {
        shooterStatus: {
            shotRequested: false,
            cooldownMs: cooldownMs,
            lastShotTime: null,
        }
    };
}