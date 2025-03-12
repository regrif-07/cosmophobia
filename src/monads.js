export class ConfigMonad {
    constructor(config = null) {
        this.config = config === null ? ConfigMonad.defaultConfig() : config;
    }

    static defaultConfig() {
        return {
            player: {
                speed: 4,
                startPositionXOffset: 50,
                shootingCooldownMs: 500,
                simpleRenderingColor: "green",
            },
            controls: {
                moveLeft: "ArrowLeft",
                moveRight: "ArrowRight",
                moveUp: "ArrowUp",
                moveDown: "ArrowDown",
                shoot: " ",
            },
            bullet: {
                speed: 10,
                simpleRenderingColor: "black",
            },
            assetPaths: {
                background: "assets/background.png",
                playerShip: "assets/player-ship.png",
                bullet: "assets/bullet.png",
            },
            debug: {
                enableLogging: false,
            },
        };
    }

    map(func) {
        return (this.config !== null) ? new ConfigMonad(func(this.config)) : new ConfigMonad(null);
    }

    chain(func) {
        return (this.config !== null) ? func(this.config) : new ConfigMonad(null);
    }

    getOrElse(defaultValue) {
        return (this.config !== null) ? this.config : defaultValue;
    }

    getPlayerConfig() {
        return this.config?.player || ConfigMonad.defaultConfig().player;
    }

    getControlsConfig() {
        return this.config?.controls || ConfigMonad.defaultConfig().controls;
    }

    getBulletConfig() {
        return this.config?.bullet || ConfigMonad.defaultConfig().bullet
    }

    getAssetPaths() {
        return this.config?.assetPaths || ConfigMonad.defaultConfig().assetPaths;
    }

    getDebug() {
        return this.config?.debug || ConfigMonad.defaultConfig().debug;
    }
}

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
}

export class AssetsMonad {
    constructor(assets = null) {
        this.assets = (assets === null) ? {} : assets;
    }

    map(func) {
        return (this.assets !== null) ? new AssetsMonad(func(this.assets)) : new AssetsMonad(null);
    }

    chain(func) {
        return (this.assets !== null) ? func(this.assets) : new AssetsMonad(null);
    }

    getOrElse(defaultValue) {
        return (this.assets !== null) ? this.assets : defaultValue;
    }
}