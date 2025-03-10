export class CanvasMonad {
    constructor(canvas) {
        this.canvas = canvas;
    }

    isJust() {
        return this.canvas !== null && this.canvas !== undefined;
    }

    map(func) {
        return (this.canvas !== null) ? new CanvasMonad(func(this.canvas)) : new CanvasMonad(null);
    }

    chain(func) {
        return (this.canvas !== null) ? func(this.canvas) : new CanvasMonad(null);
    }

    getOrElse(defaultValue) {
        return (this.canvas !== null) ? this.canvas : defaultValue;
    }

    getContext(type) {
        return (this.canvas !== null) ? this.canvas.getContext(type) : null;
    }
}

export class InputMonad {
    constructor(activeKeys = new Set()) {
        this.activeKeys = activeKeys;
    }

    map(func) {
        return new InputMonad(func(this.activeKeys));
    }

    chain(func) {
        return func(this.activeKeys);
    }

    getOrElse(defaultValue) {
        return this.activeKeys.size ? this.activeKeys : defaultValue;
    }
}
