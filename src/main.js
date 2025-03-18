import {CanvasMonad, ConfigMonad, InputMonad, LocalStorageMonad, RandomMonad, TimeMonad} from "./monads.js";
import {createPlayerEntity, createScoreTrackerEntity} from "./entities.js";
import {
    entityCleaningSystem,
    composeSystems, enemySpawnSystem,
    inputSystem, logSystem,
    physicsSystem, playerCollisionSystem,
    renderSystem,
    shotRequestProcessingSystem, enemyMovementSystem, bulletEnemyCollisionSystem, playerEnemyCollisionSystem
} from "./systems.js";
import {preloadImages} from "./assets-management.js";

// monads
const configMonad = new ConfigMonad(); // handle shared configuration
const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas")); // encapsulate canvas
const assetsMonad = await preloadImages(...Object.values(configMonad.getSection("assetPaths"))); // handle all game assets
let inputMonad = new InputMonad(); // handle input
let timeMonad = TimeMonad.now(); // handle time-related functionality (updated on each game loop iteration)
const randomMonad = new RandomMonad(); // handle random based functionality

const localStorageMonad = new LocalStorageMonad(); // encapsulate local storage (for score saving)

// input configuration based on events

// add newly pressed key to inputMonad
window.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
        event.preventDefault(); // prevent page from scrolling
    }

    inputMonad = inputMonad.map(activeKeys => new Set(activeKeys).add(event.key));
})

// delete key from inputMonad after it was "unpressed"
window.addEventListener("keyup", event => {
    inputMonad = inputMonad.map(activeKeys => {
        const updatedKeys = new Set(activeKeys);
        updatedKeys.delete(event.key);
        return updatedKeys;
    });
});

const playerEntity = createPlayerEntity(canvasMonad, assetsMonad, configMonad);
const playerEntityId = playerEntity.id; // hold the id of the player to check if the game has ended or not

// initial entities
const initialEntities = [
    playerEntity,
    createScoreTrackerEntity(
        0,
        localStorageMonad.getNumber("cosmophobiaBestScore", 0)
    ),
];

// list of all systems to compose (first systems is the array are LAST in the pipeline)
let systems = [
    // construct a new frame and display it
    (entities) => renderSystem(entities, canvasMonad, assetsMonad, configMonad),

    // update physics
    physicsSystem,

    // update enemy movement
    (entities) => enemyMovementSystem(entities, canvasMonad, randomMonad),

    // don't let the player get out of the canvas borders
    (entities) => playerCollisionSystem(entities, canvasMonad),

    // check for "destruction" collisions
    playerEnemyCollisionSystem,
    (entities) => bulletEnemyCollisionSystem(entities, configMonad),

    // entity spawn systems
    (entities) => enemySpawnSystem(entities, canvasMonad, assetsMonad, configMonad, randomMonad),
    (entities) => shotRequestProcessingSystem(entities, timeMonad, assetsMonad, configMonad),

    // take player input
    (entities) => inputSystem(entities, inputMonad, configMonad),

    // first, clean entities
    (entities) => entityCleaningSystem(entities, canvasMonad),
]

// if logging is enabled, insert loggingSystem in the first position
systems = configMonad.getSection("debug").enableLogging
    ? [...systems, (entities) => logSystem(entities, inputMonad, configMonad)]
    : systems;

// compose all systems
const applySystems = composeSystems(...systems);

// main game loop call
gameLoop(initialEntities, applySystems);

// main game loop function
// to maintain immutability entities are not modified in place (passed as argument to next iteration)
function gameLoop(entities, applySystems) {
    timeMonad = TimeMonad.now(); // update timeMonad with currentTime
    const updatedEntities = applySystems(entities); // apply all systems to entities

    if (!entities.some(entity => entity.id === playerEntityId)) { // if there is no player entity - game over
        onGameEnded(entities);
        return;
    }

    requestAnimationFrame(() => gameLoop(updatedEntities, applySystems)); // continue wih next iteration
}

// updated best score in local storage and construct HTML elements to display the end screen
function onGameEnded(finalEntities) {
    const canvas = canvasMonad.getOrElse(null);
    if (canvas === null) {
        return;
    }

    // get score information from the score tracker entity
    const scoreEntity = finalEntities.find(entity => entity.type === "scoreTracker");
    const currentScore = scoreEntity?.scoreTracker?.currentScore || 0;
    const bestScore = scoreEntity?.scoreTracker?.bestScore || 0;

    const isBestScoreUpdated = localStorageMonad.getNumber("cosmophobiaBestScore", 0) !== bestScore;
    if (isBestScoreUpdated) {
        localStorageMonad.setItem("cosmophobiaBestScore", bestScore.toString()); // save best score if updated
    }

    // construct the final game results div
    const gameResultsDiv = constructGameResultsDiv(currentScore, bestScore, isBestScoreUpdated);

    // get main container, attach our results to it
    const gameAreaDiv = document.getElementById("gameArea");
    gameAreaDiv.appendChild(gameResultsDiv);

    canvas.style.display = "none"; // hide the canvas
}

function constructGameResultsDiv(currentScore, bestScore, isBestScoreUpdated) {
    const gameResultsDiv = document.createElement("div"); // main results container
    gameResultsDiv.id = "gameResults";

    const gameEndMessageP = document.createElement("p"); // game over message
    gameEndMessageP.innerText = "Game Over!";
    gameEndMessageP.id = "gameEndMessage";

    const contentContainer = document.createElement("div"); // wrapper container for our elements
    contentContainer.id = "gameResultsContentContainer";

    // construct score-related elements within their own container
    const scoreContainer = constructScoreContainer(currentScore, bestScore, isBestScoreUpdated);

    // restart button (just refreshes the page)
    const gameRestartButton = document.createElement("button");
    gameRestartButton.id = "gameRestartButton";
    gameRestartButton.textContent = "Play Again";
    gameRestartButton.addEventListener("click", () => {
        location.reload();
    });

    // append everything to appropriate containers
    contentContainer.appendChild(gameEndMessageP);
    contentContainer.appendChild(scoreContainer);
    contentContainer.appendChild(gameRestartButton);
    gameResultsDiv.appendChild(contentContainer);

    return gameResultsDiv;
}

function constructScoreContainer(currentScore, bestScore, isBestScoreUpdated) {
    const scoreContainer = document.createElement("div");
    scoreContainer.id = "scoreContainer";

    const currentScoreP = document.createElement("p");
    currentScoreP.id = "currentScore";
    currentScoreP.innerText = `Your Score: ${currentScore}`;

    const bestScoreP = document.createElement("p");
    bestScoreP.id = "bestScore";
    bestScoreP.innerText = `Best Score: ${bestScore}`;

    scoreContainer.appendChild(currentScoreP);
    scoreContainer.appendChild(bestScoreP);

    if (isBestScoreUpdated) { // if best score was updated - inform player about it
        const bestScoreUpdatedMessageP = document.createElement("p");
        bestScoreUpdatedMessageP.id = "bestScoreUpdatedMessage";
        bestScoreUpdatedMessageP.innerText = "NEW BEST SCORE";

        scoreContainer.appendChild(bestScoreUpdatedMessageP);
    }

    return scoreContainer;
}
