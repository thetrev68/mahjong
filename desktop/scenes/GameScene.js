// GameScene.js
import * as Phaser from "phaser";
import {Table} from "../gameObjects/gameObjects_table.js";
import { HomePageTileManager } from "../managers/HomePageTileManager.js";
import AudioManager from "../../audioManager.js";
import {GameController} from "../../core/GameController.js";
import {PhaserAdapter} from "../adapters/PhaserAdapter.js";
import { HintAnimationManager } from "../managers/HintAnimationManager.js";
// import { debugPrint } from "../../utils.js";
import { WINDOW_WIDTH, WINDOW_HEIGHT, getTotalTileCount } from "../../constants.js";
import {AIEngine} from "../../core/AIEngine.js";
import {Card} from "../../core/card/card.js";

import tilesPng from "../../assets/tiles.png";
import tilesJson from "../../assets/tiles.json";
import backPng from "../../assets/back.png";

class GameScene extends Phaser.Scene {
    constructor() {
        super({key: "GameScene"});
        this.commandBarManualPosition = false;
        this.commandBarPosition = null;
        this.homePageTileManager = null;
        this.actionPanelEl = null;
        this.waitingForCommandBarReveal = false;
        this.isActionPanelDisabled = false;
        this.wallGameBanner = null;
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
        this.load.audio("wall_fail", "./assets/audio/normalflyin.mp3");

        // The scale manager stuff will be handled in main.js config, so I'm omitting it here as per the plan.
        // The resizeCallback is also a separate step.
    }

    async create() {
        // From game.js create()

        this.input.dragDistanceThreshold = 20;

        this.scale.on("resize", this.resize, this);

        // Create audio manager
        this.audioManager = new AudioManager(this, window.settingsManager || {});

        // Create game objects
        this.gTable = new Table(this);

        // Determine card year
        let year = 2025;  // Default year
        if (window.settingsManager && window.settingsManager.getCardYear) {
            const yearValue = window.settingsManager.getCardYear();
            if (yearValue) {
                year = parseInt(yearValue);
            }
        }

        // Create card with year and initialize it
        const card = new Card(year);
        await card.init();

        // Populate training mode dropdowns after card is initialized
        this.populateTrainingForm(card);

        // Create AI engine with card validator
        const aiEngine = new AIEngine(card);

        // Phase 2A: Create GameController + PhaserAdapter
        this.gameController = new GameController();
        await this.gameController.init({
            wallGenerator: () => this.captureWallTiles(),
            aiEngine: aiEngine,
            cardValidator: card,
            settings: {
                year: year,
                difficulty: (window.settingsManager && window.settingsManager.getDifficulty?.()) || "medium",
                useBlankTiles: (window.settingsManager && window.settingsManager.getUseBlankTiles?.()) || false,
                skipCharleston: (window.settingsManager && window.settingsManager.getSetting?.("skipCharleston", false)) || false
            }
        });
        this.gameController.on("GAME_STARTED", () => {
            this.prepareActionPanelForNewGame();
        });

        // Initialize HintAnimationManager with direct dependencies (Phase 3.5: Direct dependencies, no gameLogicStub)
        this.hintAnimationManager = new HintAnimationManager(
            this,
            this.gTable,
            this.gameController.aiEngine,
            this.gameController.cardValidator
        );

        // Set table references for Hand/TileSet (Phase 3.5 refactoring)
        for (let i = 0; i < this.gTable.players.length; i++) {
            this.gTable.players[i].hand.table = this.gTable;
            this.gTable.players[i].hand.hiddenTileSet.table = this.gTable;
            for (const tileSet of this.gTable.players[i].hand.exposedTileSetArray) {
                tileSet.table = this.gTable;
            }
        }

        // Create PhaserAdapter to bridge GameController events to Phaser
        this.adapter = new PhaserAdapter(
            this.gameController,
            this,  // scene
            this.gTable
        );

        // Expose for testing
        window.gameController = this.gameController;

        // Create wall counter and error text
        this.wallCounter = this.createWallTileCounter();

        this.errorText = this.add.text(400, 400, "", {
            font: "14px Arial",
            fill: "#ff8080",
            backgroundColor: "rgba(0,0,0,1)",
            align: "left"
        });
        this.errorText.visible = false;
        this.wallGameBanner = this.add.text(WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2, "Wall Game", {
            font: "48px 'Trebuchet MS', sans-serif",
            fill: "#facc15",
            backgroundColor: "rgba(0,0,0,0.65)",
            padding: {x: 24, y: 16},
            align: "center"
        });
        this.wallGameBanner.setOrigin(0.5);
        this.wallGameBanner.setDepth(500);
        this.wallGameBanner.setVisible(false);

        this.gTable.create(true); // Don't create wall tiles yet
        this.homePageTileManager = new HomePageTileManager(this, this.gTable.wall);
        this.homePageTileManager.createScatteredTiles();

        // Set up the UI buttons
        this.enableCommandBarDrag();
        this.resize(this.sys.game.canvas.width, this.sys.game.canvas.height);
        this.initializeActionPanel();

        // Start Game button event listener
        const startButton = document.getElementById("start");
        if (startButton) {
            startButton.addEventListener("click", async () => {
                // Hide the button after it's clicked
                startButton.style.display = "none";

                this.prepareActionPanelForNewGame();

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

    initializeActionPanel() {
        this.actionPanelEl = document.getElementById("uicenterdiv");
        if (!this.actionPanelEl) {
            return;
        }
        this.actionPanelEl.classList.add("command-bar--hidden");
        this.actionPanelEl.setAttribute("aria-hidden", "true");
        this.actionPanelEl.classList.remove("command-bar--disabled");
        this.waitingForCommandBarReveal = false;
    }

    prepareActionPanelForNewGame() {
        if (!this.actionPanelEl) {
            this.initializeActionPanel();
        }
        this.waitingForCommandBarReveal = true;
        this.hideActionPanel();
        this.setActionPanelDisabled(false);
        this.hideWallGameNotice();
    }

    hideActionPanel() {
        if (!this.actionPanelEl) {
            return;
        }
        this.actionPanelEl.classList.add("command-bar--hidden");
        this.actionPanelEl.setAttribute("aria-hidden", "true");
    }

    showActionPanel() {
        if (!this.actionPanelEl) {
            return;
        }
        this.actionPanelEl.classList.remove("command-bar--hidden");
        this.actionPanelEl.removeAttribute("aria-hidden");
    }

    setActionPanelDisabled(disabled) {
        if (!this.actionPanelEl) {
            return;
        }
        this.isActionPanelDisabled = disabled;
        if (disabled) {
            this.actionPanelEl.classList.add("command-bar--disabled");
            this.actionPanelEl.setAttribute("aria-disabled", "true");
        } else {
            this.actionPanelEl.classList.remove("command-bar--disabled");
            this.actionPanelEl.removeAttribute("aria-disabled");
        }
    }

    handleDealAnimationComplete() {
        if (!this.waitingForCommandBarReveal) {
            return;
        }
        this.waitingForCommandBarReveal = false;
        this.showActionPanel();
    }

    showWallGameNotice(message = "Wall Game - No Winner") {
        if (!this.wallGameBanner) {
            return;
        }
        this.wallGameBanner.setText(message);
        this.wallGameBanner.setAlpha(0);
        this.wallGameBanner.setVisible(true);
        this.tweens.add({
            targets: this.wallGameBanner,
            alpha: 1,
            duration: 350,
            ease: "Quad.easeOut"
        });
    }

    hideWallGameNotice() {
        if (!this.wallGameBanner || !this.wallGameBanner.visible) {
            return;
        }
        this.wallGameBanner.setVisible(false);
    }

    handleWallGameEnd() {
        this.showWallGameNotice();
        this.setActionPanelDisabled(true);
        this.waitingForCommandBarReveal = false;
    }

    captureWallTiles() {
        if (!this.gTable || !this.gTable.wall || !Array.isArray(this.gTable.wall.tileArray)) {
            return [];
        }

        return this.gTable.wall.tileArray.map((tile, index) => ({
            suit: tile.suit,
            number: tile.number,
            index: typeof tile.index === "number" ? tile.index : index
        }));
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
      if (!this.wallCounter) return;
      const { bar, fill, text, maxTiles } = this.wallCounter;
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
        const canvas = this.sys.canvas;
        const scaleX = canvas ? (canvasBounds.width / canvas.width) : 1;
        const scaleY = canvas ? (canvasBounds.height / canvas.height) : 1;
        const horizontalMargin = Math.max(36 * scaleX, 24);
        const verticalMargin = Math.max((140 * scaleY), 120);
        const fallbackLeft = canvasBounds.right - (barWidth / 2) - horizontalMargin;
        const fallbackTop = canvasBounds.bottom - barHeight - verticalMargin;

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
        const uicenterdiv = this.actionPanelEl || document.getElementById("uicenterdiv");
        const canvas = this.sys.canvas;

        if (!uicenterdiv || !canvas) {
            return;
        }
        this.actionPanelEl = uicenterdiv;

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

    /**
     * Populate training mode form dropdowns
     * @param {Card} card - Card instance with valid hands
     */
    populateTrainingForm(card) {
        // Populate hand select dropdown
        const handSelect = document.getElementById("handSelect");
        if (handSelect && card.validHandGroups) {
            // Clear existing options
            handSelect.innerHTML = "";

            // Add hand options from card
            for (const group of card.validHandGroups) {
                const optionGroup = document.createElement("optgroup");
                optionGroup.label = group.groupDescription;
                handSelect.add(optionGroup);

                for (const validHand of group.hands) {
                    const option = document.createElement("option");
                    option.text = validHand.description;
                    handSelect.add(option);
                }
            }
        }

        // Populate number of tiles dropdown (1-14)
        const numTileSelect = document.getElementById("numTileSelect");
        if (numTileSelect) {
            // Clear existing options
            numTileSelect.innerHTML = "";

            // Add options 1-14
            for (let i = 1; i <= 14; i++) {
                const option = document.createElement("option");
                option.text = i;
                option.value = i;
                numTileSelect.add(option);
            }

            // Set default to 9 tiles
            numTileSelect.selectedIndex = 8;  // 0-indexed, so 8 = 9th option
        }
    }
}

export default GameScene;
