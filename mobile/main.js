/* global URLSearchParams */
import InstallPrompt from "./components/InstallPrompt.js";
import SettingsSheet from "./components/SettingsSheet.js";
import SettingsManager from "../shared/SettingsManager.js";
import { WallCounter } from "./components/WallCounter.js";
import { HintsPanel } from "./components/HintsPanel.js";
import { MobileRenderer } from "./MobileRenderer.js";
import { GameController } from "../core/GameController.js";
import { AIEngine } from "../core/AIEngine.js";
import { Card } from "../core/card/card.js";
import { TouchHandler } from "./gestures/TouchHandler.js";
import "./styles/base.css";
import "./styles/tiles.css";
import "./styles.css";
import "./styles/SettingsSheet.css";

// Game instances
let gameController;
let aiEngine;
let mobileRenderer;
let settingsSheet;
let _wallCounter; // Initialized for side effects (event listener registration)
let _hintsPanel; // Initialized for side effects (event listener registration)

/**
 * Hook to call when a game ends
 * This function should be called by GameController when emitting GAME_ENDED event
 */
export function onGameEnd() {
    // Increment games played counter for install prompt
    InstallPrompt.incrementGamesPlayed();

    // The InstallPrompt will automatically check and show prompt if conditions are met
}

/**
 * Create bottom menu element if it doesn't exist
 */
function createBottomMenu() {
    const bottomMenu = document.createElement("div");
    bottomMenu.className = "bottom-menu";
    document.body.appendChild(bottomMenu);
    return bottomMenu;
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

    // Get DOM containers
    const handContainer = document.getElementById("hand-container");
    const discardContainer = document.getElementById("discard-container");
    const statusElement = document.getElementById("game-status");
    const opponentLeftContainer = document.getElementById("opponent-left");
    const opponentTopContainer = document.getElementById("opponent-top");
    const opponentRightContainer = document.getElementById("opponent-right");

    // Load settings from SettingsManager
    const settings = SettingsManager.load();
    console.log("Loaded settings:", settings);

    // Initialize Card validator with year from settings
    const card = new Card(settings.cardYear);
    await card.init();

    // Initialize AI Engine with card validator and difficulty from settings
    aiEngine = new AIEngine(card, null, settings.difficulty);

    // Parse URL parameters for configuration (can override settings)
    const urlParams = new URLSearchParams(window.location.search);
    const skipCharlestonParam = urlParams.get("skipCharleston");
    const skipCharleston = skipCharlestonParam !== null ? skipCharlestonParam === "true" : settings.skipCharleston;

    // Initialize Game Controller
    gameController = new GameController();
    await gameController.init({
        aiEngine: aiEngine,
        cardValidator: card,
        settings: {
            year: settings.cardYear,
            difficulty: settings.difficulty,
            skipCharleston: skipCharleston,
            trainingMode: settings.trainingMode,
            trainingTileCount: settings.trainingTileCount,
            useBlankTiles: settings.useBlankTiles
        }
    });

    mobileRenderer = new MobileRenderer({
        gameController,
        handContainer,
        discardContainer,
        statusElement,
        opponentContainers: {
            left: opponentLeftContainer,
            top: opponentTopContainer,
            right: opponentRightContainer
        },
        promptRoot: document.body
    });

    // Initialize TouchHandler
    const touchHandler = new TouchHandler(document.body, {
        enableSwipe: true,
        swipeMinDistance: 30
    });
    touchHandler.init();

    // Wire TouchHandler to GameController/Renderer
    touchHandler.on("tap", (data) => {
        // If tapped on a tile button in the hand
        if (data.element && data.element.classList.contains("tile")) {
            const tileIndex = parseInt(data.element.dataset.index, 10);

            // Trigger HandRenderer's tile selection logic
            if (!isNaN(tileIndex) && mobileRenderer.handRenderer) {
                mobileRenderer.handRenderer.handleTileClick(tileIndex);
            }
        }
    });

    touchHandler.on("swipeup", (data) => {
        // Swipe up on a tile to quickly discard it
        if (data.element && data.element.classList.contains("tile")) {
            const tileIndex = parseInt(data.element.dataset.index, 10);

            // Select the tile and trigger discard prompt if possible
            if (!isNaN(tileIndex) && mobileRenderer.handRenderer) {
                // Select the tile first
                mobileRenderer.handRenderer.handleTileClick(tileIndex);

                // If in discard phase, could potentially auto-trigger discard
                // For now, just select it - user can use DISCARD button
            }
        }
    });

    // Initialize WallCounter component
    const wallCounterContainer = document.getElementById("wall-counter");
    if (wallCounterContainer) {
        _wallCounter = new WallCounter(wallCounterContainer, gameController);
        console.log("WallCounter initialized");
    }

    // Initialize HintsPanel component
    const hintsPanelContainer = document.getElementById("hints-panel");
    if (hintsPanelContainer) {
        _hintsPanel = new HintsPanel(hintsPanelContainer, gameController, aiEngine);
        console.log("HintsPanel initialized");
    }

    // Track games played for install prompt
    gameController.on("GAME_ENDED", () => onGameEnd());

    // Wire up New Game button
    const newGameBtn = document.getElementById("new-game-btn");
    if (newGameBtn) {
        newGameBtn.onclick = async () => {
            console.log("NEW GAME button clicked!");
            try {
                console.log("Starting game...", gameController);
                mobileRenderer?.updateStatus("Starting game...");
                await gameController.startGame();
                console.log("Game started successfully");
            } catch (error) {
                console.error("Error starting game:", error);
                mobileRenderer?.updateStatus(`Error: ${error.message}`);
            }
        };
    }

    // Wire up Settings button
    const settingsBtn = document.getElementById("mobile-settings-btn");
    if (settingsBtn && !settingsSheet) {
        settingsSheet = new SettingsSheet();
        settingsBtn.onclick = () => {
            settingsSheet.open();
        };
    }

    // Listen for settings changes
    window.addEventListener("settingsChanged", (event) => {
        console.log("Settings changed, will take effect on next game:", event.detail);

        // Show message to user
        mobileRenderer?.updateStatus("Settings saved! Start a new game for changes to take effect.");

        // Update AI difficulty if changed (can be done immediately)
        if (event.detail.difficulty && aiEngine) {
            aiEngine.difficulty = event.detail.difficulty;
            console.log("AI difficulty updated to:", event.detail.difficulty);
        }
    });

    // Hide loading message
    mobileRenderer?.updateStatus("Ready to play! Click NEW GAME to start.");

    // Expose to window for testing
    if (window.location.search.includes("playwright=true")) {
        window.gameController = gameController;
        window.aiEngine = aiEngine;
        window.mobileRenderer = mobileRenderer;
    }

    console.log("Mobile game initialized successfully");
}


/**
 * Register Service Worker
 */
/*
// async function registerServiceWorker() {
    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
        console.log("Service workers not supported");
        return;
    }

    try {
        // Register the service worker (must be at root or higher than scope)
        const registration = await navigator.serviceWorker.register(
            "/mahjong/pwa/service-worker.js",
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
*/

/**
 * Show notification when update is available
 */
/*
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
*/
