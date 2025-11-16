import InstallPrompt from "./components/InstallPrompt.js";
import SettingsSheet from "./components/SettingsSheet.js";
import {MobileRenderer} from "./MobileRenderer.js";
import {GameController} from "../core/GameController.js";
import {AIEngine} from "../core/AIEngine.js";
import {Card} from "../core/card/card.js";
import "./styles/base.css";
import "./styles/SettingsSheet.css";
import "./styles/HandRenderer.css";
import "./styles/MobileGame.css";

// Game instances
let gameController;
let aiEngine;
let mobileRenderer;
let settingsSheet;

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
            skipCharleston: false  // Enable Charleston phase for full gameplay
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

    // Hide loading message
    mobileRenderer.updateStatus("Ready to play! Click NEW GAME to start.");

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
