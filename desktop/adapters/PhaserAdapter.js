/**
 * PhaserAdapter - Bridges GameController (platform-agnostic) to Phaser (desktop-specific)
 *
 * This adapter listens to GameController events and translates them into Phaser sprite updates.
 * It also handles UI prompts by interfacing with the existing desktop button system.
 *
 * Architecture:
 * GameController (core/) emits events → PhaserAdapter listens → Updates Phaser objects (gameObjects_*.js)
 *
 * During Phase 2, this adapter keeps desktop working while mobile is built.
 * Eventually, GameController will fully replace GameLogic, and this becomes the permanent desktop bridge.
 */

import {TileData} from "../../core/models/TileData.js";
import {Tile} from "../../gameObjects.js";
import {PLAYER, SUIT} from "../../constants.js";
import {printMessage, printInfo} from "../../utils.js";

export class PhaserAdapter {
    /**
     * @param {GameController} gameController - Core game controller
     * @param {GameScene} scene - Phaser scene
     * @param {Table} table - Existing Phaser table object
     * @param {GameLogic} gameLogic - Existing game logic (for UI functions)
     */
    constructor(gameController, scene, table, gameLogic) {
        this.gameController = gameController;
        this.scene = scene;
        this.table = table;
        this.gameLogic = gameLogic;  // Keep for updateUI(), button functions

        /** @type {Map<number, Tile>} Map tile index → Phaser Tile object */
        this.tileMap = new Map();

        /** @type {Function|null} Pending UI prompt callback */
        this.pendingPromptCallback = null;

        /** @type {string|null} Current prompt type */
        this.currentPromptType = null;

        this.setupEventListeners();
    }

    /**
     * Subscribe to all GameController events
     */
    setupEventListeners() {
        const gc = this.gameController;

        // Game flow events
        gc.on("STATE_CHANGED", (data) => this.onStateChanged(data));
        gc.on("GAME_STARTED", (data) => this.onGameStarted(data));
        gc.on("GAME_ENDED", (data) => this.onGameEnded(data));

        // Tile events
        gc.on("TILES_DEALT", (data) => this.onTilesDealt(data));
        gc.on("TILE_DRAWN", (data) => this.onTileDrawn(data));
        gc.on("TILE_DISCARDED", (data) => this.onTileDiscarded(data));
        gc.on("DISCARD_CLAIMED", (data) => this.onDiscardClaimed(data));
        gc.on("TILES_EXPOSED", (data) => this.onTilesExposed(data));

        // Hand events
        gc.on("HAND_UPDATED", (data) => this.onHandUpdated(data));

        // Turn events
        gc.on("TURN_CHANGED", (data) => this.onTurnChanged(data));

        // Charleston events
        gc.on("CHARLESTON_PHASE", (data) => this.onCharlestonPhase(data));
        gc.on("CHARLESTON_PASS", (data) => this.onCharlestonPass(data));

        // Courtesy events
        gc.on("COURTESY_VOTE", (data) => this.onCourtesyVote(data));
        gc.on("COURTESY_PASS", (data) => this.onCourtesyPass(data));

        // UI events
        gc.on("MESSAGE", (data) => this.onMessage(data));
        gc.on("UI_PROMPT", (data) => this.onUIPrompt(data));
    }

    /**
     * Convert TileData → Phaser Tile sprite
     * Uses existing tiles from the Phaser wall instead of creating new ones
     * @param {TileData} tileData
     * @returns {Tile}
     */
    createPhaserTile(tileData) {
        // Check if we already have a Phaser tile for this index
        if (this.tileMap.has(tileData.index)) {
            return this.tileMap.get(tileData.index);
        }

        // Find existing tile in Phaser wall by index
        const existingTile = this.findTileInWall(tileData.index);
        if (existingTile) {
            this.tileMap.set(tileData.index, existingTile);
            return existingTile;
        }

        // Fallback: Create new Phaser tile (shouldn't happen if wall is properly initialized)
        console.warn(`Creating new tile for index ${tileData.index} - this shouldn't happen!`);
        const spriteName = this.getTileSpriteName(tileData);
        const tile = new Tile(this.scene, tileData.suit, tileData.number, spriteName);
        tile.index = tileData.index;
        tile.create();

        // Store in map
        this.tileMap.set(tileData.index, tile);

        return tile;
    }

    /**
     * Find a tile in the Phaser wall by its index
     * @param {number} index - Unique tile index (0-151 or 0-159 with blanks)
     * @returns {Tile|null}
     */
    findTileInWall(index) {
        // Search through wall tiles
        for (const tile of this.table.wall.tileArray) {
            if (tile.index === index) {
                return tile;
            }
        }
        return null;
    }

    /**
     * Find existing Phaser tile by TileData
     * @param {TileData} tileData
     * @returns {Tile|null}
     */
    findPhaserTile(tileData) {
        return this.tileMap.get(tileData.index) || null;
    }

    /**
     * Get sprite name for tile (matches existing gameObjects.js logic)
     * @param {TileData} tileData
     * @returns {string}
     */
    getTileSpriteName(tileData) {
        const {suit, number} = tileData;

        // Match the sprite naming from gameObjects.js Wall.create()
        // Format: "1C.png", "2B.png", "N.png", "DC.png", "F1.png", "J.png", "BLANK.png"

        if (suit === SUIT.CRACK) {
            return `${number}C.png`;
        } else if (suit === SUIT.BAM) {
            return `${number}B.png`;
        } else if (suit === SUIT.DOT) {
            return `${number}D.png`;
        } else if (suit === SUIT.WIND) {
            // 0=North, 1=South, 2=West, 3=East
            const windNames = ["N", "S", "W", "E"];
            return `${windNames[number]}.png`;
        } else if (suit === SUIT.DRAGON) {
            // 0=Red, 1=Green, 2=White
            const dragonNames = ["DC", "DB", "DD"];
            return `${dragonNames[number]}.png`;
        } else if (suit === SUIT.FLOWER) {
            // Flowers are F1-F4, repeated
            const flowerNum = (number % 4) + 1;
            return `F${flowerNum}.png`;
        } else if (suit === SUIT.JOKER) {
            return "J.png";
        } else if (suit === SUIT.BLANK) {
            return "BLANK.png";
        }

        // Fallback
        return `tile_${suit}_${number}.png`;
    }

    /**
     * Convert TileData array → Phaser Tile array
     * @param {TileData[]} tileDatas
     * @returns {Tile[]}
     */
    convertToPhaserTiles(tileDatas) {
        return tileDatas.map(td => this.createPhaserTile(td));
    }

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    onStateChanged(data) {
        const {oldState, newState} = data;
        console.log(`State: ${oldState} → ${newState}`);

        // Phase 2B: Update state but don't call updateUI() - we manage buttons directly now
        this.gameLogic.state = newState;
        // this.gameLogic.updateUI(); // Disabled in Phase 2B

        // Manage button state based on new state
        this.updateButtonState(newState);
    }

    /**
     * Update button visibility/state based on game state
     * Phase 2B: Replaces GameLogic.updateUI() for button management
     */
    updateButtonState(state) {
        // Hide all buttons by default
        this.hideButtons();

        // Show specific buttons based on state
        // This is handled by UI_PROMPT events, so we just ensure cleanup here
    }

    onGameStarted(data) {
        printMessage("Game started!");

        // Reset Phaser table
        this.table.reset();

        // Hide start button (already done in GameScene.js)
        const startButton = document.getElementById("start");
        if (startButton) {
            startButton.style.display = "none";
        }
    }

    onGameEnded(data) {
        const {reason, winner, mahjong} = data;

        if (mahjong) {
            const winnerPlayer = this.table.players[winner];
            printMessage(`${winnerPlayer.playerInfo.name} wins with Mahjong!`);

            // Show fireworks (existing functionality)
            if (this.scene.audioManager) {
                this.scene.audioManager.playFireworks();
            }
        } else if (reason === "wall_game") {
            printMessage("Wall game - no winner");
        }

        // Show start button again
        const startButton = document.getElementById("start");
        if (startButton) {
            startButton.style.display = "block";
        }
    }

    onTilesDealt(data) {
        // Update wall counter
        const totalDealt = data.players.reduce((sum, p) => sum + p.tileCount, 0);
        const remainingInWall = this.table.wall.getLength() - totalDealt;

        if (this.scene.updateWallTileCounter) {
            this.scene.updateWallTileCounter(remainingInWall);
        }

        printMessage("Tiles dealt to all players");
    }

    onTileDrawn(data) {
        const {player: playerIndex, tile: tileData} = data;
        const player = this.table.players[playerIndex];

        // Create Phaser tile
        const tileDataObj = TileData.fromJSON(tileData);
        const phaserTile = this.createPhaserTile(tileDataObj);

        // Add to player's hand
        player.hand.insertHidden(phaserTile);

        // Animate tile draw
        // TODO: Add animation (slide from wall to hand)

        // Update wall counter
        if (this.scene.updateWallTileCounter) {
            this.scene.updateWallTileCounter(this.table.wall.getLength());
        }

        if (playerIndex === PLAYER.BOTTOM) {
            printInfo(`You drew: ${tileDataObj.getText()}`);
        }
    }

    onTileDiscarded(data) {
        const {player: playerIndex, tile: tileData} = data;
        const player = this.table.players[playerIndex];

        const tileDataObj = TileData.fromJSON(tileData);
        const phaserTile = this.findPhaserTile(tileDataObj);

        if (phaserTile) {
            // Remove from hand
            player.hand.removeTile(phaserTile);

            // Add to discard pile
            this.table.discards.add(phaserTile, player.playerInfo);

            // Animate discard
            // TODO: Add animation (move to discard pile)

            printMessage(`${player.playerInfo.name} discarded ${tileDataObj.getText()}`);
        }
    }

    onDiscardClaimed(data) {
        const {player: claimingPlayer, tile: tileData, claimType} = data;

        const tileDataObj = TileData.fromJSON(tileData);
        printMessage(`${this.table.players[claimingPlayer].playerInfo.name} claimed ${tileDataObj.getText()} for ${claimType}`);
    }

    onTilesExposed(data) {
        const {player: playerIndex, exposureType, tiles: tileDatas} = data;
        const player = this.table.players[playerIndex];

        // Convert to Phaser tiles
        const phaserTiles = tileDatas.map(td => this.findPhaserTile(TileData.fromJSON(td)));

        // Create exposed tile set
        // TODO: Implement exposure display (Phase 2B)

        printMessage(`${player.playerInfo.name} exposed ${exposureType}: ${phaserTiles.length} tiles`);
    }

    onHandUpdated(data) {
        const {player: playerIndex, hand: handData} = data;
        const player = this.table.players[playerIndex];

        // For now, just log - full hand sync will happen in Phase 2B
        console.log(`Hand updated for player ${playerIndex}: ${handData.tiles.length} hidden, ${handData.exposures.length} exposed`);

        // Update hint if human player
        if (playerIndex === PLAYER.BOTTOM && this.gameLogic.hintAnimationManager) {
            this.gameLogic.hintAnimationManager.updateHintsForNewTiles();
        }
    }

    onTurnChanged(data) {
        const {currentPlayer, previousPlayer} = data;

        this.table.switchPlayer(currentPlayer);

        const currentPlayerObj = this.table.players[currentPlayer];
        printMessage(`${currentPlayerObj.playerInfo.name}'s turn`);
    }

    onCharlestonPhase(data) {
        const {phase, passCount, direction} = data;
        printMessage(`Charleston Phase ${phase}, Pass ${passCount}: Pass ${direction}`);
    }

    onCharlestonPass(data) {
        const {player: playerIndex, tiles: tileDatas, direction} = data;
        const player = this.table.players[playerIndex];

        printMessage(`${player.playerInfo.name} passed 3 tiles ${direction}`);
    }

    onCourtesyVote(data) {
        const {player: playerIndex, vote} = data;
        const player = this.table.players[playerIndex];

        printMessage(`${player.playerInfo.name} voted ${vote ? "YES" : "NO"} for courtesy pass`);
    }

    onCourtesyPass(data) {
        const {fromPlayer, toPlayer, tile: tileData} = data;

        const tileDataObj = TileData.fromJSON(tileData);
        printMessage(`Courtesy pass: ${this.table.players[fromPlayer].playerInfo.name} → ${this.table.players[toPlayer].playerInfo.name} (${tileDataObj.getText()})`);
    }

    onMessage(data) {
        const {text, type} = data;

        if (type === "info") {
            printInfo(text);
        } else if (type === "error") {
            printMessage(`ERROR: ${text}`);
        } else if (type === "hint") {
            // Hint messages (for hint panel)
            // TODO: Implement hint display
        } else {
            printMessage(text);
        }
    }

    /**
     * Handle UI prompts from GameController
     * Maps to existing desktop button system
     */
    onUIPrompt(data) {
        const {promptType, options, callback} = data;

        this.pendingPromptCallback = callback;
        this.currentPromptType = promptType;

        if (promptType === "CHOOSE_DISCARD") {
            this.setupDiscardPrompt(options);
        } else if (promptType === "CLAIM_DISCARD") {
            this.setupClaimPrompt(options);
        } else if (promptType === "CHARLESTON_PASS") {
            this.setupCharlestonPassPrompt(options);
        } else if (promptType === "CHARLESTON_CONTINUE") {
            this.setupCharlestonContinuePrompt(options);
        } else if (promptType === "COURTESY_VOTE") {
            this.setupCourtesyVotePrompt(options);
        }
    }

    /**
     * Setup discard tile selection (human player)
     * Phase 2B: Enable tile selection with callback
     */
    setupDiscardPrompt(options) {
        const player = this.table.players[PLAYER.BOTTOM];

        printInfo("Select a tile to discard");

        // Enable tile selection with callback
        player.hand.enableTileSelection((selectedTile) => {
            // User selected a tile to discard
            if (this.pendingPromptCallback) {
                // Convert Phaser Tile → TileData
                const tileData = TileData.fromPhaserTile(selectedTile);

                // Call the callback with the selected tile
                this.pendingPromptCallback(tileData);

                // Clear pending state
                this.pendingPromptCallback = null;
                this.currentPromptType = null;
            }
        });
    }

    /**
     * Setup claim discard prompt (Mahjong/Pung/Kong/Pass)
     * Phase 2B: Show only available claim options
     */
    setupClaimPrompt(options) {
        const {tile: tileData, options: claimOptions} = options;

        const tileDataObj = TileData.fromJSON(tileData);

        printInfo(`Claim ${tileDataObj.getText()}?`);

        // Setup buttons based on available options
        const buttons = ["button1", "button2", "button3", "button4"];
        const buttonLabels = ["Mahjong", "Pung", "Kong", "Pass"];

        buttons.forEach((btnId, index) => {
            const btn = document.getElementById(btnId);
            const label = buttonLabels[index];

            if (claimOptions.includes(label) || label === "Pass") {
                // Show and enable button
                btn.textContent = label;
                btn.disabled = false;
                btn.style.display = "block";
                btn.onclick = () => this.respondToClaim(label);
            } else {
                // Hide unavailable buttons
                btn.style.display = "none";
                btn.disabled = true;
                btn.onclick = null;
            }
        });
    }

    /**
     * Respond to claim prompt
     */
    respondToClaim(decision) {
        if (this.pendingPromptCallback) {
            this.pendingPromptCallback(decision);
            this.pendingPromptCallback = null;
            this.currentPromptType = null;
        }

        // Hide buttons
        this.hideButtons();
    }

    /**
     * Setup Charleston pass tile selection (3 tiles)
     * Phase 2B: Let user select 3 tiles to pass
     */
    setupCharlestonPassPrompt(options) {
        const {direction, requiredCount} = options;
        const player = this.table.players[PLAYER.BOTTOM];

        printInfo(`Choose ${requiredCount} tiles to pass ${direction}`);

        // Enable multi-tile selection (up to 3)
        const selectedTiles = [];

        // Use existing selection system from Hand
        // The Hand class already supports multi-select during Charleston state

        // Setup "Pass" button
        const button1 = document.getElementById("button1");
        button1.textContent = "Pass";
        button1.disabled = true;  // Enable when 3 tiles selected
        button1.style.display = "block";

        // Monitor tile selection
        const checkSelection = () => {
            const selection = player.hand.hiddenTileSet.getSelection();
            if (selection.length === requiredCount) {
                button1.disabled = false;
            } else {
                button1.disabled = true;
            }
        };

        // Button click handler
        button1.onclick = () => {
            const selection = player.hand.hiddenTileSet.getSelection();

            if (selection.length === requiredCount && this.pendingPromptCallback) {
                // Convert Phaser Tiles → TileData array
                const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));

                // Reset selection
                player.hand.hiddenTileSet.resetSelection();

                // Call callback
                this.pendingPromptCallback(tileDatas);

                // Clear pending state
                this.pendingPromptCallback = null;
                this.currentPromptType = null;

                // Hide button
                this.hideButtons();
            }
        };

        // Use existing tile selection mechanism (pointerup handlers already exist)
        // Just need to monitor selection count
        const monitorInterval = window.setInterval(() => {
            if (this.currentPromptType !== "CHARLESTON_PASS") {
                window.clearInterval(monitorInterval);
                return;
            }
            checkSelection();
        }, 100);

        // Hide other buttons
        document.getElementById("button2").style.display = "none";
        document.getElementById("button3").style.display = "none";
        document.getElementById("button4").style.display = "none";
    }

    /**
     * Setup Charleston continue query (Yes/No)
     */
    setupCharlestonContinuePrompt(options) {
        const {question} = options;

        printInfo(question);

        const button1 = document.getElementById("button1");
        const button2 = document.getElementById("button2");

        button1.textContent = "Yes";
        button1.disabled = false;
        button1.style.display = "block";
        button1.onclick = () => this.respondYesNo("Yes");

        button2.textContent = "No";
        button2.disabled = false;
        button2.style.display = "block";
        button2.onclick = () => this.respondYesNo("No");

        // Hide other buttons
        document.getElementById("button3").style.display = "none";
        document.getElementById("button4").style.display = "none";
    }

    /**
     * Setup courtesy vote prompt (Yes/No)
     */
    setupCourtesyVotePrompt(options) {
        const {question} = options;

        printInfo(question);

        const button1 = document.getElementById("button1");
        const button2 = document.getElementById("button2");

        button1.textContent = "Yes";
        button1.disabled = false;
        button1.onclick = () => this.respondYesNo("Yes");

        button2.textContent = "No";
        button2.disabled = false;
        button2.onclick = () => this.respondYesNo("No");

        // Hide other buttons
        document.getElementById("button3").style.display = "none";
        document.getElementById("button4").style.display = "none";
    }

    /**
     * Respond to Yes/No prompt
     */
    respondYesNo(answer) {
        if (this.pendingPromptCallback) {
            this.pendingPromptCallback(answer);
            this.pendingPromptCallback = null;
            this.currentPromptType = null;
        }

        this.hideButtons();
    }

    /**
     * Hide all buttons
     */
    hideButtons() {
        const buttons = ["button1", "button2", "button3", "button4"];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = "none";
                btn.disabled = true;
                btn.onclick = null;
            }
        });
    }

    /**
     * Cleanup adapter (remove event listeners, etc.)
     */
    destroy() {
        this.gameController.clear();  // Remove all event listeners
        this.tileMap.clear();
        this.pendingPromptCallback = null;
    }
}
