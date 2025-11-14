// GameScene.js
import * as Phaser from "phaser";
import {GameLogic} from "./gameLogic.js";
import {Table} from "./gameObjects_table.js";
import { HomePageTileManager } from "./homePageTileManager.js";
import AudioManager from "./audioManager.js";
import {GameController} from "./core/GameController.js";
import {PhaserAdapter} from "./desktop/adapters/PhaserAdapter.js";
// import { debugPrint } from "./utils.js";
import { WINDOW_WIDTH, getTotalTileCount } from "./constants.js";

import tilesPng from "./assets/tiles.png";
import tilesJson from "./assets/tiles.json";
import backPng from "./assets/back.png";

class GameScene extends Phaser.Scene {
    constructor() {
        super({key: "GameScene"});
        this.commandBarManualPosition = false;
        this.commandBarPosition = null;
        this.homePageTileManager = null;
    }

    preload() {
        // From game.js preload()
        this.load.atlas("tiles", tilesPng, tilesJson);
        this.load.image("back", backPng);

        // Load particle texture for fireworks
        // Create a simple 4x4 white particle texture programmatically to avoid WebGL errors
        const particleCanvas = document.createElement("canvas");
        particleCanvas.width = 4;
        particleCanvas.height = 4;
        const ctx = particleCanvas.getContext("2d");
        if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 4, 4);
        }
        this.textures.addCanvas("particle", particleCanvas);

        // Load audio assets
        this.load.audio("bgm", "./assets/audio/2406haidao_bgm_loop.mp3");
        this.load.audio("rack_tile", "./assets/audio/rack_tile.mp3");
        this.load.audio("tile_dropping", "./assets/audio/tile_dropping.mp3");
        this.load.audio("fireworks", "./assets/audio/fireworks.mp3");

        // The scale manager stuff will be handled in main.js config, so I'm omitting it here as per the plan.
        // The resizeCallback is also a separate step.
    }

    async create() {
        // From game.js create()

        this.input.dragDistanceThreshold = 20;

        this.scale.on("resize", this.resize, this);

        // Create audio manager
        this.audioManager = new AudioManager(this, window.settingsManager);

        // Create game objects
        this.gGameLogic = new GameLogic(this);
        this.gTable = new Table(this, this.gGameLogic);
        this.gGameLogic.table = this.gTable;
        await this.gGameLogic.init();
        this.gGameLogic.gameAI.table = this.gTable;

        // Phase 2A: Create GameController + PhaserAdapter
        this.gameController = new GameController();
        await this.gameController.init({
            aiEngine: this.gGameLogic.gameAI,
            cardValidator: this.gGameLogic.card,
            settings: {
                year: window.settingsManager.getCardYear(),
                difficulty: window.settingsManager.getDifficulty(),
                useBlankTiles: window.settingsManager.getUseBlankTiles(),
                skipCharleston: false
            }
        });

        // Create PhaserAdapter to bridge GameController events to Phaser
        this.adapter = new PhaserAdapter(
            this.gameController,
            this,  // scene
            this.gTable,
            this.gGameLogic
        );

        // Expose for testing
        window.gameController = this.gameController;

        // this.gGameLogic.updateUI(); // Disabled in Phase 2B - adapter handles UI now


        this.gGameLogic.wallCounter = this.createWallTileCounter();

        this.gGameLogic.errorText = this.add.text(400, 400, "", {
            font: "14px Arial",
            fill: "#ff8080",
            backgroundColor: "rgba(0,0,0,1)",
            align: "left"
        });
        this.gGameLogic.errorText.visible = false;

        this.gTable.create(true); // Don't create wall tiles yet
        this.homePageTileManager = new HomePageTileManager(this, this.gTable.wall);
        this.homePageTileManager.createScatteredTiles();

        // Set up the UI buttons
        this.enableCommandBarDrag();
        this.resize(this.sys.game.canvas.width, this.sys.game.canvas.height);

        // Start Game button event listener
        const startButton = document.getElementById("start");
        if (startButton) {
            startButton.addEventListener("click", async () => {
                // Hide the button after it's clicked
                startButton.style.display = "none";

                if (this.homePageTileManager) {
                    // First game - animate tiles and transition
                    this.homePageTileManager.onAnimationComplete = async () => {
                        await this.homePageTileManager.transitionToWallSystem();
                        this.homePageTileManager.cleanup();
                        this.homePageTileManager = null; // Release reference

                        // Phase 2B: GameController now handles complete game flow
                        await this.gameController.startGame();
                    };
                    this.homePageTileManager.animateToPileAndStartGame();
                } else {
                    // Subsequent games - start directly without animation
                    // Phase 2B: GameController now handles complete game flow
                    await this.gameController.startGame();
                }
            });
        }
    }

    createWallTileCounter() {
      const container = this.add.container(WINDOW_WIDTH / 2 - 150, 160);
      const bar = this.add.graphics();
      bar.fillStyle(0x2a2a2a, 1); // Darker background
      bar.fillRoundedRect(0, 0, 300, 20, 5); // Background - wider
      const fill = this.add.graphics();
      
      // Add text overlay with crisp rendering
      // Dynamic max tiles based on settings (152 or 160 with blanks)
      const maxTiles = getTotalTileCount();
      const text = this.add.text(150, 10, "Wall Tiles Remaining: " + maxTiles, {
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      });
      text.setOrigin(0.5, 0.5); // Center the text
      text.setResolution(2); // Higher resolution for crisp text when scaled

      container.add([bar, fill, text]);
      // The container is hidden by default and is made visible by the first call to updateWallTileCounter.
      container.setVisible(false);
      container.setDepth(100); // High depth to appear above hands
      return { bar: container, fill, text, maxTiles };
    }

    updateWallTileCounter(count) {
      if (!this.gGameLogic.wallCounter) return;
      const { bar, fill, text, maxTiles } = this.gGameLogic.wallCounter;
      fill.clear();
      if (count < 0 || count > maxTiles) {
        console.error("Invalid wall count:", count);
        count = Math.max(0, Math.min(count, maxTiles));
      }
      fill.fillStyle(0x4a90e2, 1); // Better blue color
      const width = (count / maxTiles) * 300; // Updated width
      fill.fillRoundedRect(0, 0, width, 20, 5);
      
      // Update text with current count
      text.setText(`Wall Tiles Remaining: ${count}`);
      
      bar.setVisible(true);
    }

    update() {
        // From game.js update() - it was empty
    }

    getDragBounds() {
        const parent = document.getElementById("parentdiv");
        if (parent) {
            return parent.getBoundingClientRect();
        }

        return this.sys.canvas.getBoundingClientRect();
    }

    getClampedCommandBarPosition(left, top, bar, boundsRect) {
        const padding = 16;
        const rect = bar.getBoundingClientRect();
        const halfWidth = (rect.width || bar.offsetWidth || 0) / 2;
        const barHeight = rect.height || bar.offsetHeight || 0;

        let minLeft = boundsRect.left + halfWidth + padding;
        let maxLeft = boundsRect.right - halfWidth - padding;
        if (minLeft > maxLeft) {
            const center = boundsRect.left + (boundsRect.width / 2);
            minLeft = center;
            maxLeft = center;
        }

        let minTop = boundsRect.top + padding;
        let maxTop = boundsRect.bottom - barHeight - padding;
        if (minTop > maxTop) {
            const mid = boundsRect.top + (boundsRect.height / 2);
            minTop = mid;
            maxTop = mid;
        }

        const clampedLeft = Math.min(Math.max(left, minLeft), maxLeft);
        const clampedTop = Math.min(Math.max(top, minTop), maxTop);

        return {left: clampedLeft,
            top: clampedTop};
    }

    getDefaultCommandBarPosition(bar, canvasBounds, boundsRect) {
        const barWidth = bar.offsetWidth || 0;
        const barHeight = bar.offsetHeight || 0;
        const fallbackLeft = canvasBounds.right - (barWidth / 2) - 36;
        const fallbackTop = canvasBounds.bottom - barHeight - 110;

        return this.getClampedCommandBarPosition(fallbackLeft, fallbackTop, bar, boundsRect);
    }

    enableCommandBarDrag() {
        const bar = document.getElementById("uicenterdiv");
        const canvas = this.sys.canvas;
        if (!bar || !canvas) {
            return;
        }

        const rootStyle = document.documentElement.style;
        let isDragging = false;
        let pointerOffsetX = 0;
        let pointerOffsetY = 0;

        const onPointerMove = (event) => {
            if (!isDragging) {
                return;
            }
            const boundsRect = this.getDragBounds();
            const rect = bar.getBoundingClientRect();
            const tentativeLeft = event.clientX - pointerOffsetX + ((rect.width || bar.offsetWidth || 0) / 2);
            const tentativeTop = event.clientY - pointerOffsetY;
            const {left, top} = this.getClampedCommandBarPosition(tentativeLeft, tentativeTop, bar, boundsRect);

            rootStyle.setProperty("--command-bar-left", `${left}px`);
            rootStyle.setProperty("--command-bar-top", `${top}px`);
            this.commandBarPosition = {left,
                top};
            this.commandBarManualPosition = true;
        };

        const onPointerUp = (event) => {
            if (!isDragging) {
                return;
            }
            isDragging = false;
            bar.classList.remove("command-bar--dragging");
            try {
                bar.releasePointerCapture(event.pointerId);
            } catch {
                // Ignore if release fails
            }
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
        };

        const onPointerDown = (event) => {
            if (event.button !== 0) {
                return;
            }
            if (event.target.closest("#buttondiv")) {
                return;
            }

            const rect = bar.getBoundingClientRect();
            pointerOffsetX = event.clientX - rect.left;
            pointerOffsetY = event.clientY - rect.top;
            isDragging = true;
            bar.classList.add("command-bar--dragging");

            try {
                bar.setPointerCapture(event.pointerId);
            } catch {
                // Ignore if capture fails (older browsers)
            }

            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
            window.addEventListener("pointercancel", onPointerUp);
            event.preventDefault();
        };

        bar.addEventListener("pointerdown", onPointerDown);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            bar.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
        });
    }

    // eslint-disable-next-line no-unused-vars
    resize(_gameSize, _baseSize, _displaySize, _resolution) {
        const uicenterdiv = document.getElementById("uicenterdiv");
        const canvas = this.sys.canvas;

        if (!uicenterdiv || !canvas) {
            return;
        }

        const canvasBounds = canvas.getBoundingClientRect();
        const boundsRect = this.getDragBounds();
        const rootStyle = document.documentElement.style;

        if (this.commandBarManualPosition && this.commandBarPosition) {
            const {left, top} = this.getClampedCommandBarPosition(
                this.commandBarPosition.left,
                this.commandBarPosition.top,
                uicenterdiv,
                boundsRect
            );
            this.commandBarPosition = {left,
                top};
            rootStyle.setProperty("--command-bar-left", `${left}px`);
            rootStyle.setProperty("--command-bar-top", `${top}px`);

            return;
        }

        const {left, top} = this.getDefaultCommandBarPosition(uicenterdiv, canvasBounds, boundsRect);

        this.commandBarPosition = {left,
            top};
        rootStyle.setProperty("--command-bar-left", `${left}px`);
        rootStyle.setProperty("--command-bar-top", `${top}px`);
    }

    /**
     * Creates a spectacular fireworks display for player 0 victory
     * @param {Object} gameResult - The game result object containing mahjong status and winner
     * @returns {Promise} - Promise that resolves when fireworks display is complete
     */
    createFireworksDisplay(gameResult) {
        return new Promise((resolve) => {
            // Only show fireworks for player 0 (human player) victories
            if (!gameResult.mahjong || gameResult.winner !== 0) {
                resolve();
                return;
            }

            const canvasWidth = this.sys.game.canvas.width;
            const canvasHeight = this.sys.game.canvas.height;
            const numFireworks = Phaser.Math.Between(5, 7);
            const emittersList = [];

            try {
                // Play firework sound effect (if available)
                // this.audioManager.playSFX("fireworks");

                // Create multiple fireworks with individual emitters (Phaser 3.60+ API)
                for (let i = 0; i < numFireworks; i++) {
                    // Random position on screen
                    const x = Phaser.Math.Between(100, canvasWidth - 100);
                    const y = Phaser.Math.Between(100, canvasHeight - 200);

                    // Create emitter directly using Phaser 3.60+ API
                    const emitter = this.add.particles(x, y, "particle", {
                        speed: { min: 200, max: 400 },
                        angle: { min: 0, max: 360 },
                        lifespan: { min: 1200, max: 1800 },
                        gravityY: 300,
                        scale: { start: 0.8, end: 0 },
                        alpha: { start: 1, end: 0 },
                        tint: [
                            0xfff066, // Yellow
                            0x66ccff, // Light blue
                            0xff66c4, // Pink
                            0x00ff66, // Green
                            0xff6600, // Orange
                            0xcc66ff  // Purple
                        ],
                        blendMode: "ADD"
                    });

                    emitter.setDepth(300); // High depth to appear above everything

                    emittersList.push(emitter);

                    // Stagger the firework explosions
                    this.time.delayedCall(i * 300, () => {
                        const quantity = Phaser.Math.Between(15, 25);
                        emitter.emitParticleAt(x, y, quantity);
                    });
                }

                // Resolve promise after all fireworks should be complete
                const totalDuration = (numFireworks - 1) * 300 + 2000; // Last firework + fade time
                this.time.delayedCall(totalDuration, () => {
                    // Clean up emitters
                    emittersList.forEach(emitter => emitter.destroy());
                    resolve();
                });

            } catch (error) {
                console.warn("[GameScene] Fireworks display failed:", error);
                // Clean up on error
                emittersList.forEach(emitter => {
                    try { emitter.destroy(); } catch {
                        /* ignore errors during cleanup */
                    }
                });
                resolve();
            }
        });
    }
}

export default GameScene;
