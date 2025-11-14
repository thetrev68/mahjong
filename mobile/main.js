import InstallPrompt from "./components/InstallPrompt.js";
import SettingsSheet from "./components/SettingsSheet.js";
import {HandRenderer} from "./renderers/HandRenderer.js";
import {OpponentBar} from "./components/OpponentBar.js";
import {DiscardPile} from "./components/DiscardPile.js";
import {AnimationController} from "./animations/AnimationController.js";
import {TouchHandler} from "./gestures/TouchHandler.js";
import {GameController} from "../core/GameController.js";
import {AIEngine} from "../core/AIEngine.js";
import {Card} from "../card/card.js";
import {TileData} from "../core/models/TileData.js";
import "./styles/base.css";
import "./styles/SettingsSheet.css";
import "./styles/HandRenderer.css";
import "./styles/MobileGame.css";

// Game instances
let gameController;
let aiEngine;
const opponentBars = [];
let statusDisplay;
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

    // Initialize Animation Controller (for future use)
    // eslint-disable-next-line no-unused-vars
    const animationController = new AnimationController();

    // Initialize Hand Renderer (wired via GameController events)
    // eslint-disable-next-line no-unused-vars
    const handRenderer = new HandRenderer(handContainer, gameController);

    // Initialize Discard Pile (wired via GameController events)
    // eslint-disable-next-line no-unused-vars
    const discardPile = new DiscardPile(discardContainer, gameController);

    // Initialize Opponent Bars (Right, Top, Left positions - index 1, 2, 3)
    const opponentPositions = [
        { container: opponentRightContainer, playerIndex: 1, position: "RIGHT" },
        { container: opponentTopContainer, playerIndex: 2, position: "TOP" },
        { container: opponentLeftContainer, playerIndex: 3, position: "LEFT" }
    ];

    for (const {container, playerIndex} of opponentPositions) {
        const player = gameController.players[playerIndex];
        const bar = new OpponentBar(container, player);
        opponentBars.push({bar, playerIndex});
    }

    // Initialize Touch Handler for hand interactions
    const touchHandler = new TouchHandler(handContainer, {
        enableSwipe: true,
        enableLongPress: true
    });
    touchHandler.init();

    // Store status display for global access
    statusDisplay = statusElement;

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

        // Update opponent bars when their hands change
        const opponentBar = opponentBars.find(ob => ob.playerIndex === data.player);
        if (opponentBar) {
            opponentBar.bar.update(player);
        }
    });

    gameController.on("TURN_CHANGED", (data) => {
        // Update all opponent bars to show current turn
        const currentPlayerIndex = data.currentPlayer || gameController.currentPlayer;
        opponentBars.forEach(({bar, playerIndex}) => {
            const player = gameController.players[playerIndex];
            // Update the player data before rendering
            player.isCurrentTurn = playerIndex === currentPlayerIndex;
            bar.update(player);
        });
    });

    gameController.on("TILES_EXPOSED", (data) => {
        // Update the opponent bar for this player when they expose tiles
        const opponentBar = opponentBars.find(ob => ob.playerIndex === data.player);
        if (opponentBar) {
            const player = gameController.players[data.player];
            opponentBar.bar.update(player);
        }
    });

    gameController.on("UI_PROMPT", (data) => {
        console.log("UI_PROMPT received:", data.promptType, data.options);

        // Handle UI prompts for human player
        if (data.promptType === "CHOOSE_DISCARD") {
            // Human player chooses discard from their hand
            const player = gameController.players[0];
            const hand = player.hand.tiles;
            const handText = hand.map((tile, index) => `${index}: ${tile.getText()}`).join("\n");
            const choice = window.prompt(`Choose a tile to discard:\n${handText}\nEnter tile index (0-${hand.length - 1}):`);
            const index = parseInt(choice, 10);
            if (!isNaN(index) && index >= 0 && index < hand.length) {
                statusDisplay.textContent = `Discarding ${hand[index].getText()}...`;
                data.callback(hand[index]);
            } else {
                // Invalid choice, choose first tile as fallback
                statusDisplay.textContent = "Invalid choice, discarding first tile...";
                data.callback(hand[0]);
            }
        } else if (data.promptType === "CLAIM_DISCARD") {
            // Human player decides whether to claim discarded tile
            const {tile: tileData, options: claimOptions} = data.options;
            const tileText = TileData.fromJSON(tileData).getText();
            const optionsText = claimOptions.join(", ");
            const choice = window.prompt(`Claim ${tileText}? Options: ${optionsText}`);
            if (claimOptions.includes(choice)) {
                statusDisplay.textContent = `Claiming: ${choice}`;
                data.callback(choice);
            } else {
                // Default to Pass
                statusDisplay.textContent = "Passing claim...";
                data.callback("Pass");
            }
        } else if (data.promptType === "SELECT_TILES") {
            // Human player selects tiles (for Charleston, exposures, etc.)
            const {minTiles = 1, maxTiles = 3} = data.options || {};
            const player = gameController.players[0];
            const hand = player.hand.tiles;
            const handText = hand.map((tile, index) => `${index}: ${tile.getText()}`).join("\n");
            const msg = `Select ${minTiles}-${maxTiles} tiles (comma-separated indices):\n${handText}\nExample: 0,2,5`;
            const choice = window.prompt(msg);

            if (choice) {
                const indices = choice.split(",").map(x => parseInt(x.trim(), 10)).filter(i => !isNaN(i));
                const selectedTiles = indices
                    .filter(i => i >= 0 && i < hand.length)
                    .map(i => hand[i]);

                if (selectedTiles.length >= minTiles && selectedTiles.length <= maxTiles) {
                    statusDisplay.textContent = `Selected ${selectedTiles.length} tiles...`;
                    data.callback(selectedTiles);
                } else {
                    statusDisplay.textContent = `Invalid selection (need ${minTiles}-${maxTiles} tiles)`;
                    // Fallback: first maxTiles tiles
                    data.callback(hand.slice(0, maxTiles));
                }
            } else {
                // Cancelled, return empty
                statusDisplay.textContent = "Selection cancelled";
                data.callback(hand.slice(0, minTiles));
            }
        } else if (data.promptType === "EXPOSE_TILES") {
            // Human player chooses whether to expose tiles
            const choice = window.prompt("Expose tiles? (yes/no)");
            if (choice && choice.toLowerCase() === "yes") {
                statusDisplay.textContent = "Exposing tiles...";
                data.callback(true);
            } else {
                statusDisplay.textContent = "Not exposing tiles...";
                data.callback(false);
            }
        } else if (data.promptType === "YES_NO") {
            // Generic yes/no prompt
            const msg = data.options?.message || "Continue?";
            const choice = window.prompt(`${msg} (yes/no)`);
            if (choice && (choice.toLowerCase() === "yes" || choice.toLowerCase() === "y")) {
                data.callback(true);
            } else {
                data.callback(false);
            }
        } else {
            // For other prompts, auto-pass or handle as needed
            console.log("Unhandled prompt type:", data.promptType);
            // For now, call callback with null or appropriate default
            if (data.callback) {
                data.callback(null);
            }
        }
    });

    // Wire up New Game button
    const newGameBtn = document.getElementById("new-game-btn");
    if (newGameBtn) {
        newGameBtn.onclick = async () => {
            console.log("NEW GAME button clicked!");
            try {
                console.log("Starting game...", gameController);
                await gameController.startGame();
                console.log("Game started successfully");
            } catch (error) {
                console.error("Error starting game:", error);
                statusDisplay.textContent = `Error: ${error.message}`;
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
    statusDisplay.textContent = "Ready to play! Click NEW GAME to start.";

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
