import {CanvasMonad, ConfigMonad, InputMonad, RandomMonad, TimeMonad} from "./monads.js";
import {createPlayerEntity, createScoreTrackerEntity} from "./entities.js";
import {
    entityCleaningSystem,
    composeSystems, enemySpawnSystem,
    inputSystem, logSystem,
    physicsSystem, playerCollisionSystem,
    renderSystem,
    shotRequestProcessingSystem, enemyCollisionSystem, bulletEnemyCollisionSystem, playerEnemyCollisionSystem
} from "./systems.js";
import {preloadImages} from "./assets-management.js";

// monads
const configMonad = new ConfigMonad(); // handle shared configuration
const canvasMonad = new CanvasMonad(document.getElementById("gameCanvas")); // encapsulate canvas
const assetsMonad = await preloadImages(...Object.values(configMonad.getSection("assetPaths"))); // handle all game assets
let inputMonad = new InputMonad(); // handle input
let timeMonad = TimeMonad.now(); // handle time-related functionality (updated on each game loop iteration)
const randomMonad = new RandomMonad(); // handle random based functionality

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
        localStorage.getItem('cosmophobiaBestScore')
            ? parseInt(localStorage.getItem('cosmophobiaBestScore'), 10)
            : 0
    ),
];

// list of all systems to compose
let systems = [
    (entities) => entityCleaningSystem(entities, canvasMonad),
    (entities) => shotRequestProcessingSystem(entities, timeMonad, assetsMonad, configMonad),
    (entities) => enemySpawnSystem(entities, canvasMonad, assetsMonad, configMonad, randomMonad),
    playerEnemyCollisionSystem,
    (entities) => bulletEnemyCollisionSystem(entities, configMonad),
    (entities) => enemyCollisionSystem(entities, canvasMonad, randomMonad),
    (entities) => playerCollisionSystem(entities, canvasMonad),
    physicsSystem,
    (entities) => inputSystem(entities, inputMonad, configMonad),
    (entities) => renderSystem(entities, canvasMonad, assetsMonad, configMonad),
]

// if logging is enabled, insert loggingSystem in the first position
systems = configMonad.getSection("debug").enableLogging
    ? [(entities) => logSystem(entities, inputMonad, configMonad), ...systems]
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

function onGameEnded(finalEntities) {
    const canvas = canvasMonad.getOrElse(null);
    if (canvas === null) {
        return;
    }

    const scoreEntity = finalEntities.find(entity => entity.type === "scoreTracker");
    const currentScore = scoreEntity?.scoreTracker?.currentScore || 0;
    const bestScore = scoreEntity?.scoreTracker?.bestScore || 0;

    const bestScoreUpdated = parseInt(localStorage.getItem('cosmophobiaBestScore'), 10) !== bestScore;
    if (bestScoreUpdated) {
        localStorage.setItem('cosmophobiaBestScore', bestScore.toString());
    }

    const gameResultsDiv = document.createElement("div");
    gameResultsDiv.id = "gameResults";

    const gameEndMessageP = document.createElement("p");
    gameEndMessageP.innerText = "Game Over!";
    gameEndMessageP.id = "gameEndMessage";

    const contentContainer = document.createElement("div");
    contentContainer.id = "gameResultsContentContainer";

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

    if (bestScoreUpdated) {
        const bestScoreUpdatedMessageP = document.createElement("p");
        bestScoreUpdatedMessageP.id = "bestScoreUpdatedMessage";
        bestScoreUpdatedMessageP.innerText = "NEW BEST SCORE";

        scoreContainer.appendChild(bestScoreUpdatedMessageP);
    }

    const gameRestartButton = document.createElement("button");
    gameRestartButton.id = "gameRestartButton";
    gameRestartButton.textContent = "Play Again";
    gameRestartButton.addEventListener("click", () => {
        location.reload();
    });

    contentContainer.appendChild(gameEndMessageP);
    contentContainer.appendChild(scoreContainer);
    contentContainer.appendChild(gameRestartButton);
    gameResultsDiv.appendChild(contentContainer);

    const gameAreaDiv = document.getElementById("gameArea");
    gameAreaDiv.appendChild(gameResultsDiv);

    canvas.style.display = "none";
}
