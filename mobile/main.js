import InstallPrompt from "./components/InstallPrompt.js";
import SettingsSheet from "./components/SettingsSheet.js";
import {HandRenderer} from "./renderers/HandRenderer.js";
import {TouchHandler} from "./gestures/TouchHandler.js";
import {GameController} from "../core/GameController.js";
import {AIEngine} from "../core/AIEngine.js";
import {Card} from "../card/card.js";
import "./styles/base.css";
import "./styles/SettingsSheet.css";
import "./styles/HandRenderer.css";
import "./styles/MobileGame.css";

// Initialize install prompt manager
// const installPrompt = new InstallPrompt();

// Game instances
let settingsSheet;
let gameController;
let aiEngine;
let handRenderer;
let touchHandler;

/**
 * Hook to call when a game ends
 * This function should be called by GameController when emitting GAME_ENDED event
 */
export function onGameEnd() {
    // Increment games played counter for install prompt
    InstallPrompt.incrementGamesPlayed();

    // The InstallPrompt will automatically check and show prompt if conditions are met
}

// Placeholder for mobile app initialization
document.addEventListener("DOMContentLoaded", () => {
    console.log("Mobile Mahjong app initializing...");

    // Hide loading message
    const loading = document.getElementById("loading");
    if (loading) {
        loading.style.display = "none";
    }

    // Initialize settings sheet
    // settingsSheet = new SettingsSheet();
    
    // Add settings button to bottom menu if it doesn't exist yet
    if (!document.getElementById("mobile-settings-btn")) {
        const bottomMenu = document.querySelector(".bottom-menu") || createBottomMenu();
        const settingsBtn = document.createElement("button");
        settingsBtn.id = "mobile-settings-btn";
        settingsBtn.className = "menu-btn";
        settingsBtn.innerHTML = "⚙️ SETTINGS";
        bottomMenu.appendChild(settingsBtn);
    }

    // Initialize mobile game components
    initializeGame();

    // Register Service Worker (disabled during development)
    // registerServiceWorker();
});

/**
 * Initialize the mobile game
 */
async function initializeGame() {
    console.log("Initializing mobile game...");

    // Create game container if it doesn't exist
    let gameContainer = document.getElementById("game-container");
    if (!gameContainer) {
        gameContainer = document.createElement("div");
        gameContainer.id = "game-container";
        gameContainer.className = "mobile-game-container";

        const mobileApp = document.getElementById("mobile-app");
        if (mobileApp) {
            mobileApp.appendChild(gameContainer);
        }
    }

    // Create hand container
    const handContainer = document.createElement("div");
    handContainer.id = "hand-container";
    handContainer.className = "hand-container";
    gameContainer.appendChild(handContainer);

    // Initialize Card validator
    const card = new Card(2025);
    await card.init();

    // Initialize AI Engine with card validator
    aiEngine = new AIEngine(card, null, "medium");

    // Initialize Game Controller
    gameController = new GameController();
    await gameController.init({
        aiEngine: aiEngine,
        cardValidator: card,
        settings: {
            year: 2025,
            difficulty: "medium",
            skipCharleston: true  // Skip Charleston for now until UI is implemented
        }
    });

    // Create a status display
    const statusDisplay = document.createElement("div");
    statusDisplay.id = "game-status";
    statusDisplay.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: #ffd166;
        font-family: 'Courier New', monospace;
        font-size: 16px;
        padding: 40px;
        text-align: center;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-y: auto;
    `;
    gameContainer.insertBefore(statusDisplay, handContainer);

    // Initialize Hand Renderer
    handRenderer = new HandRenderer(handContainer, gameController);

    // Initialize Touch Handler
    touchHandler = new TouchHandler(handContainer);

    // Subscribe to game events
    gameController.on("GAME_ENDED", () => {
        onGameEnd();
        statusDisplay.textContent = "Game Ended!";
    });

    // Debug: Log all game events
    gameController.on("STATE_CHANGED", (data) => {
        console.log("State changed:", data);
        statusDisplay.textContent = `State: ${data.newState}`;
    });

    gameController.on("MESSAGE", (data) => {
        console.log("Game message:", data.text);
        statusDisplay.textContent = data.text;
    });

    gameController.on("HAND_UPDATED", (data) => {
        const player = gameController.players[data.player];
        statusDisplay.textContent = `Player ${data.player} (${player.name}):\n${data.hand.tiles.length} hidden tiles\n${data.hand.exposures.length} exposures`;
    });

    gameController.on("UI_PROMPT", async (data) => {
        console.log("UI_PROMPT received:", data.promptType, data.options);

        // Temporary: Auto-respond to UI prompts until UI is implemented
        if (data.promptType === "CHOOSE_DISCARD") {
            // Have AI choose discard for human player temporarily
            const player = gameController.players[0];
            statusDisplay.textContent = "Choosing discard...";
            const tileToDiscard = await aiEngine.chooseDiscard(player.hand);
            console.log("Auto-discarding tile:", tileToDiscard);
            data.callback(tileToDiscard);
        } else if (data.promptType === "CLAIM_DISCARD") {
            // Auto-pass on claims for now
            statusDisplay.textContent = "Passing claim...";
            data.callback("Pass");
        }
    });

    // Add New Game button
    addNewGameButton(gameContainer);

    console.log("Mobile game initialized successfully");
}

/**
 * Add new game button
 */
function addNewGameButton(container) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "game-controls";

    const newGameBtn = document.createElement("button");
    newGameBtn.id = "new-game-btn";
    newGameBtn.className = "primary-btn";
    newGameBtn.textContent = "NEW GAME";
    newGameBtn.onclick = async () => {
        console.log("NEW GAME button clicked!");
        try {
            console.log("Starting game...", gameController);
            await gameController.startGame();
            console.log("Game started successfully");
        } catch (error) {
            console.error("Error starting game:", error);
        }
    };

    buttonContainer.appendChild(newGameBtn);
    container.appendChild(buttonContainer);
}

/**
 * Create bottom menu if it doesn't exist yet
 */
function createBottomMenu() {
    const bottomMenu = document.createElement("div");
    bottomMenu.className = "bottom-menu";
    document.body.appendChild(bottomMenu);
    return bottomMenu;
}

/**
 * Register Service Worker
 */
async function registerServiceWorker() {
    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
        console.log("Service workers not supported");
        return;
    }

    try {
        // Register the service worker (must be at root or higher than scope)
        const registration = await navigator.serviceWorker.register(
            "/mahjong/service-worker.js",
            { scope: "/mahjong/" }
        );

        console.log("Service worker registered:", registration);

        // Check for updates on page load
        registration.update();

        // Listen for updates
        registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            console.log("Service worker update found");

            newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log("New service worker installed, ready to activate");
                    showUpdateNotification(registration);
                }
            });
        });

    } catch (error) {
        console.error("Service worker registration failed:", error);
    }
}

/**
 * Show notification when update is available
 */
function showUpdateNotification(registration) {
    // Create update banner
    const banner = document.createElement("div");
    banner.id = "update-banner";
    banner.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ffd166;
            color: #1f1400;
            padding: 12px;
            text-align: center;
            font-family: 'Courier New', monospace;
            z-index: 10001;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        ">
            <strong>Update Available!</strong>
            <button onclick="location.reload()" style="
                margin-left: 16px;
                padding: 6px 16px;
                background: #044328;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
            ">Reload to Update</button>
        </div>
    `;
    document.body.appendChild(banner);

    // Tell the waiting service worker to skip waiting
    if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
}
