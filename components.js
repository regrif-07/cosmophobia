export function hasComponents(entity, ...componentNames) {
    return componentNames.every(name => entity[name] !== undefined);
}

export function Position(x, y) {
    return {
        position: {
            x: x,
            y: y,
        },
    };
}

export function Velocity(x, y) {
    return {
        velocity: {
            x: x,
            y: y,
        },
    };
}

export function Size(width, height) {
    return {
        size: {
            width: width,
            height: height,
        },
    };
}

export function SimplyRendered(color) {
    return {
        simplyRendered: {
            color: color,
        },
    };
}

export function ShooterStatus() {
    return {
        shooterStatus: {
            shotRequested: false,
            cooldownMs: 500,
            lastShotTime: null,
        }
    };
}