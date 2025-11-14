import * as Phaser from "phaser";
import GameScene from "./GameScene.js";
import {WINDOW_WIDTH, WINDOW_HEIGHT} from "./constants.js";

// Use Canvas rendering for Playwright tests to avoid GPU stall warnings
// WebGL can cause "GPU stall due to ReadPixels" when Playwright takes screenshots
const isPlaywrightTest = window.location.search.includes("playwright=true") ||
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
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        antialias: true,
        mipmapFilter: "LINEAR_MIPMAP_LINEAR",
        powerPreference: "high-performance"
    }
};

const game = new Phaser.Game(config);

// Expose game instance to window for settings manager access
window.game = game;
