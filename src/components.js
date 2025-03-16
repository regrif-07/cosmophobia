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

// provide size information
export function Size(width, height) {
    return {
        size: {
            width: width,
            height: height,
        },
    };
}

// provides information for simplified rendering
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