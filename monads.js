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
    constructor(activeKeys = null) {
        this.activeKeys = (activeKeys === null) ? new Set() : activeKeys;
    }

    map(func) {
        return (this.activeKeys !== null) ? new InputMonad(func(this.activeKeys)) : new InputMonad(null);
    }

    chain(func) {
        return (this.activeKeys !== null) ? func(this.activeKeys) : new InputMonad(null);
    }

    getOrElse(defaultValue) {
        return (this.activeKeys !== null) ? this.activeKeys : defaultValue;
    }
}

export class TimeMonad {
    constructor(timestamp = null) {
        this.timestamp = (timestamp === null) ? Date.now() : timestamp;
    }

    static now() {
        return new TimeMonad(Date.now());
    }

    map(func) {
        return (this.timestamp !== null) ? new TimeMonad(func(this.timestamp)) : new TimeMonad(null);
    }

    chain(func) {
        return (this.timestamp !== null) ? func(this.timestamp) : new TimeMonad(null);
    }

    getOrElse(defaultValue) {
        return (this.timestamp !== null) ? this.timestamp : defaultValue;
    }

    diff(otherTimeMonad) {
        return (this.timestamp !== null)
            ? this.timestamp - otherTimeMonad.getOrElse(this.timestamp)
            : new TimeMonad(null);
    }

    hasElapsed(otherTimeMonad, milliseconds) {
        return this.timestamp !== null &&
               otherTimeMonad.getOrElse(null) !== null &&
               (this.timestamp - otherTimeMonad.getOrElse(0)) >= milliseconds;
    }
}
