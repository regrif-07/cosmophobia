import {cyrb128, sfc32} from "./utility.js";

// encapsulate our global config
export class ConfigMonad {
    constructor(config = null) {
        this.config = config === null ? ConfigMonad.defaultConfig() : config;
    }

    // provide the default config (modify values here)
    static defaultConfig() {
        return {
            player: {
                speed: 4,
                startPositionXOffset: 50,
                shootingCooldownMs: 500,
                simpleRenderingColor: "green",
                shootDirection: "east",
            },
            controls: {
                moveLeft: "ArrowLeft",
                moveRight: "ArrowRight",
                moveUp: "ArrowUp",
                moveDown: "ArrowDown",
                shoot: " ",
                log: "\\",
            },
            bullet: {
                speed: 10,
                simpleRenderingColor: "black",
            },
            enemy: {
                horizontalSpeed: -3,
                verticalSpeedAbsolute: 3, // absolute speed, direction (sign) will change
            },
            enemySpawn: {
                minEnemiesPerWave: 3,
                maxEnemiesPerWave: 7,
            },
            assetPaths: {
                background: "assets/background.png",
                playerShip: "assets/player-ship.png",
                bullet: "assets/bullet.png",
                enemy: "assets/enemy-ship.png"
            },
            defaultSizes: { // default sizes that will be used in case of a sprite loading failure
                player: {
                    width: 68,
                    height: 62,
                },
                bullet: {
                    width: 35,
                    height: 18,
                },
                enemy: {
                    width: 55,
                    height: 58,
                },
            },
            scoreTracker: {
                pointsPerEnemy: 100,
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

    getSection(sectionName) {
        if (!sectionName || typeof sectionName !== 'string') {
            return null;
        }

        return this.config?.[sectionName] || ConfigMonad.defaultConfig()[sectionName];
    }
}

// encapsulate our canvas
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

// encapsulate our input state
// contains activeKeys filed that represent currently pressed keys (it's a set, so keys are unique)
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

// encapsulate timestamp (used to handle current time on each game loop iteration)
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

// encapsulate the mapping from asset path to asset object
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

// encapsulate random state; store results of computations inside state
export class RandomMonad {
    constructor(randomState = null) {
        this.randomState = randomState === null ? RandomMonad.defaultRandomState() : randomState;
    }

    // default random state, seed = current date
    static defaultRandomState() {
        const seed = cyrb128(Date.now().toString());
        return {
            rng: sfc32(seed[0], seed[1], seed[2], seed[3]),
            lastValue: null,
        };
    }

    // random state with provided seed
    static fromSeed(seedStr) {
        const seed = cyrb128(seedStr);
        const randomState = {
            rng: sfc32(seed[0], seed[1], seed[2], seed[3]),
            lastValue: null
        };

        return new RandomMonad(randomState);
    }

    map(func) {
        return (this.randomState !== null) ? new RandomMonad(func(this.randomState)) : new RandomMonad(null);
    }

    chain(func) {
        return (this.randomState !== null) ? func(this.randomState) : new RandomMonad(null);
    }

    getOrElse(defaultValue) {
        return (this.randomState !== null) ? this.randomState : defaultValue;
    }

    // get last generated value
    getValue() {
        return this.randomState?.lastValue;
    }

    // generate next random value from 0 (inclusive) to 1 (exclusive)
    next() {
        if (this.randomState === null) {
            return new RandomMonad(null);
        }

        const newState = { ...this.randomState };
        newState.lastValue = newState.rng();
        return new RandomMonad(newState);
    }

    // generate a random integer in the range from min (inclusive) to max (inclusive)
    nextInt(min, max) {
        return this.next().map(state => {
            return {
                ...state,
                lastValue: Math.floor(state.lastValue * (max - min + 1)) + min
            };
        });
    }

    // generate a random float in the range from min (inclusive) to max (exclusive)
    nextFloat(min, max) {
        return this.next().map(state => {
            return {
                ...state,
                lastValue: state.lastValue * (max - min) + min,
            };
        });
    }

    // generate a random boolean with the given probability of being true
    nextBool(probability = 0.5) {
        return this.next().map(state => {
            return {
                ...state,
                lastValue: state.lastValue < probability
            };
        });
    }

    // select random item from an array
    nextItem(array) {
        return this.next().map(state => {
            const index = Math.floor(state.lastValue * array.length);
            return {
                ...state,
                lastValue: array[index],
            };
        });
    }
}