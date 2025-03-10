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

export function SimplyRendered(width, height, color) {
    return {
        simplyRendered: {
            width: width,
            height: height,
            color: color,
        },
    };
}