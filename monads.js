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
    constructor(events) {
        this.events = events;
    }

    map(func) {
        return new InputMonad(func(this.events));
    }

    chain(func) {
        return func(this.events);
    }

    getOrElse(defaultValue) {
        return this.events.length ? this.events : defaultValue;
    }
}