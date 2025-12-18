import * as Phaser from "phaser";
import GameScene from "./desktop/scenes/GameScene.js";
import { WINDOW_WIDTH, WINDOW_HEIGHT } from "./constants.js";

// Use Canvas rendering for Playwright tests to avoid GPU stall warnings
// WebGL can cause "GPU stall due to ReadPixels" when Playwright takes screenshots
const isPlaywrightTest =
  window.location.search.includes("playwright=true") ||
  window.navigator.userAgent.includes("Playwright");

const config = {
  type: isPlaywrightTest ? Phaser.CANVAS : Phaser.AUTO,
  width: WINDOW_WIDTH,
  height: WINDOW_HEIGHT,
  transparent: true,
  hideBanner: true,
  parent: "gamediv",
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    mipmapFilter: "LINEAR_MIPMAP_LINEAR",
    powerPreference: "high-performance",
  },
};

const game = new Phaser.Game(config);

// Expose game instance to window for settings manager access
window.game = game;

// Register Service Worker for PWA support
registerServiceWorker();

/**
 * Register Service Worker
 */
async function registerServiceWorker() {
  // Check if service workers are supported
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers not supported");
    return;
  }

  // Skip service worker in development mode
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    console.log("Skipping service worker registration in development mode");
    return;
  }

  try {
    // Register the service worker (must be at root or higher than scope)
    const registration = await navigator.serviceWorker.register(
      "/mahjong/service-worker.js",
      { scope: "/mahjong/" },
    );

    console.log("Service worker registered:", registration);

    // Check for updates on page load
    registration.update();

    // Listen for updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      console.log("Service worker update found");

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
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
                border-radius: 6px;
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
