/**
 * PhaserAdapter - Bridges GameController (platform-agnostic) to Phaser (desktop-specific)
 *
 * This adapter listens to GameController events and translates them into Phaser sprite updates.
 * It also handles UI prompts by interfacing with the managers and dialogs.
 *
 * Architecture:
 * GameController (core/) emits events → PhaserAdapter listens → Updates Phaser objects via Managers
 *
 * Phase 2: Complete implementation using:
 * - AnimationLibrary for all animations
 * - TileManager for sprite management
 * - ButtonManager for button state
 * - DialogManager for prompts
 */

import {TileData} from "../../core/models/TileData.js";
import {Tile} from "../../gameObjects.js";
import {PLAYER, SUIT} from "../../constants.js";
import {printMessage, printInfo} from "../../utils.js";
import {TileManager} from "../managers/TileManager.js";
import {ButtonManager} from "../managers/ButtonManager.js";
import {DialogManager} from "../managers/DialogManager.js";

export class PhaserAdapter {
    /**
     * @param {GameController} gameController - Core game controller
     * @param {GameScene} scene - Phaser scene
     * @param {Table} table - Existing Phaser table object
     * @param {GameLogic} gameLogic - Existing game logic (for data access only)
     */
    /**
     * @param {GameController} gameController - Core game controller
     * @param {GameScene} scene - Phaser scene
     * @param {Table} table - Existing Phaser table object
     */
    constructor(gameController, scene, table) {
        this.gameController = gameController;
        this.scene = scene;
        this.table = table;

        /** @type {Map<number, Tile>} Map tile index → Phaser Tile object */
        this.tileMap = new Map();

        /** @type {number} Track tiles removed from wall (for counter) */
        this.tilesRemovedFromWall = 0;

        // Initialize Phase 2 managers
        this.tileManager = new TileManager(scene, table);
        this.buttonManager = new ButtonManager(scene, gameController);
        this.dialogManager = new DialogManager(scene);

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
        gc.on("JOKER_SWAPPED", (data) => this.onJokerSwapped(data));

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

    /**
     * Handle state changes - update button visibility
     */
    onStateChanged(data) {
        const {oldState, newState} = data;
        console.log(`State: ${oldState} → ${newState}`);

        // Update button visibility and state based on new game state
        this.buttonManager.updateForState(newState);

        // Phase 3.5: Set validation mode on player hands based on state
        const humanHand = this.table.players[0].hand; // PLAYER.BOTTOM
        switch (newState) {
        case "CHARLESTON1":
        case "CHARLESTON2":
            humanHand.setValidationMode("charleston");
            break;
        case "COURTESY":
            humanHand.setValidationMode("courtesy");
            break;
        case "LOOP_CHOOSE_DISCARD":
            humanHand.setValidationMode("play");
            break;
        case "LOOP_EXPOSE_TILES":
            humanHand.setValidationMode("expose");
            break;
        default:
            humanHand.setValidationMode(null);
        }
    }

    /**
     * Handle game start
     */
    onGameStarted() {
        printMessage("Game started!");

        // Reset Phaser table
        this.table.reset();

        // Hide start button
        const startButton = document.getElementById("start");
        if (startButton) {
            startButton.style.display = "none";
        }

        // Reset tile counter
        this.tilesRemovedFromWall = 0;
    }

    /**
     * Handle game end
     */
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

    /**
     * Handle initial tiles dealt
     */
    onTilesDealt() {
        // Tiles are already dealt at this point - this is just a notification
        // The actual animation was triggered by the sequence of TILE_DRAWN events
        // Update wall counter to reflect remaining tiles
        if (this.scene.updateWallTileCounter) {
            const totalTileCount = this.gameController.settings.useBlankTiles ? 160 : 152;
            const remainingInWall = totalTileCount - this.tilesRemovedFromWall;
            this.scene.updateWallTileCounter(remainingInWall);
        }
    }

    /**
     * Handle tile drawn from wall
     */
    onTileDrawn(data) {
        const {player: playerIndex, tile} = data;
        const player = this.table.players[playerIndex];

        // Get the Phaser Tile object (passed directly from GameController)
        let phaserTile;
        if (tile && tile.sprite) {
            // Tile is a Phaser Tile object passed directly
            phaserTile = tile;
            // Store in map if not already there
            if (tile.index !== undefined && !this.tileMap.has(tile.index)) {
                this.tileMap.set(tile.index, tile);
            }
        } else {
            // Fallback: reconstruct from TileData (shouldn't normally happen)
            const tileDataObj = TileData.fromJSON(tile);
            phaserTile = this.createPhaserTile(tileDataObj);
        }

        // Position tile at wall location initially
        const wallX = 640; // Center of screen (wall position)
        const wallY = 360;
        phaserTile.sprite.setPosition(wallX, wallY);
        phaserTile.sprite.setAlpha(0);

        // Add to player's hand
        player.hand.insertHidden(phaserTile);

        // Animate tile draw (slide from wall to hand)
        const targetPos = player.hand.calculateTilePosition(player.playerInfo, player.hand.hiddenTileSet.getLength() - 1);
        this.scene.tweens.add({
            targets: phaserTile.sprite,
            x: targetPos.x,
            y: targetPos.y,
            alpha: 1,
            duration: 200,
            ease: "Power2",
            onComplete: () => {
                // Refresh hand display after animation
                player.showHand(playerIndex === PLAYER.BOTTOM);
            }
        });

        // Track that one tile was removed from the wall
        this.tilesRemovedFromWall++;

        // Update wall counter (subtract removed tiles from initial count)
        if (this.scene.updateWallTileCounter) {
            const initialTileCount = this.gameController.settings.useBlankTiles ? 160 : 152;
            const remainingTiles = initialTileCount - this.tilesRemovedFromWall;
            this.scene.updateWallTileCounter(remainingTiles);
        }

        if (playerIndex === PLAYER.BOTTOM) {
            const tileDataObj = TileData.fromPhaserTile(phaserTile);
            printInfo(`You drew: ${tileDataObj.getText()}`);
        }
    }

    /**
     * Handle tile discarded
     */
    onTileDiscarded(data) {
        const {player: playerIndex, tile} = data;
        const player = this.table.players[playerIndex];

        // Get the Phaser Tile object (passed directly from GameController)
        let phaserTile;
        if (tile && tile.sprite) {
            // Tile is a Phaser Tile object passed directly
            phaserTile = tile;
            // Store in map if not already there
            if (tile.index !== undefined && !this.tileMap.has(tile.index)) {
                this.tileMap.set(tile.index, tile);
            }
        } else {
            // Fallback: reconstruct from TileData
            const tileDataObj = TileData.fromJSON(tile);
            phaserTile = this.findPhaserTile(tileDataObj);
        }

        if (phaserTile) {
            // Remove from hand
            player.hand.removeHidden(phaserTile);

            // Add to discard pile
            this.table.discards.insertDiscard(phaserTile);

            // Phase 3.5: Set discard tile for exposure validation (human player)
            if (playerIndex === PLAYER.BOTTOM) {
                const humanHand = this.table.players[PLAYER.BOTTOM].hand;
                humanHand.setDiscardTile(phaserTile);
            }

            // Show discards (updates layout)
            this.table.discards.showDiscards();

            const playerName = this.getPlayerName(playerIndex);
            const tileDataObj = TileData.fromPhaserTile(phaserTile);
            printMessage(`${playerName} discarded ${tileDataObj.getText()}`);
        }
    }

    /**
     * Handle discard claimed
     */
    onDiscardClaimed(data) {
        const {player: claimingPlayer, tile: tileData, claimType} = data;

        const tileDataObj = TileData.fromJSON(tileData);
        printMessage(`${this.table.players[claimingPlayer].playerInfo.name} claimed ${tileDataObj.getText()} for ${claimType}`);
    }

    /**
     * Handle tiles exposed
     */
    /**
     * Handle tiles exposed
     */
    onTilesExposed(data) {
        const {player: playerIndex, exposureType, tiles: tileDatas} = data;
        const player = this.table.players[playerIndex];

        // Convert to Phaser tiles
        const phaserTiles = tileDatas.map(td => this.findPhaserTile(TileData.fromJSON(td)));

        // Create exposed tile set and add to player's hand
        const exposedTileSet = new window.TileSet(this.scene, this.table, false);
        phaserTiles.forEach(tile => {
            // Remove from hidden tiles if present
            player.hand.hiddenTileSet.remove(tile);
            // Add to exposed set
            exposedTileSet.insert(tile);
        });

        // Add exposed set to player's hand
        player.hand.exposedTileSetArray.push(exposedTileSet);

        // Refresh hand display
        player.showHand(playerIndex === 0);

        printMessage(`${player.playerInfo.name} exposed ${exposureType}: ${phaserTiles.length} tiles`);
    }

    /**
     * Handle joker swapped
     */
    onJokerSwapped(data) {
        this.handleJokerSwap(data);
    }

    /**
     * Process joker swap logic
     */
    handleJokerSwap(data = {}) {
        const {
            player,
            exposureIndex = 0,
            jokerIndex = null,
            replacementTile,
            recipient = PLAYER.BOTTOM
        } = data;

        if (typeof player !== "number") {
            printMessage("JOKER_SWAPPED event missing player index");
            return;
        }

        const exposureOwner = this.table.players[player];
        if (!exposureOwner || !exposureOwner.hand) {
            printMessage(`JOKER_SWAPPED ignore: player ${player} missing hand`);
            return;
        }

        const exposureSets = exposureOwner.hand.exposedTileSetArray || [];
        const targetExposure = exposureSets[exposureIndex];
        if (!targetExposure) {
            printMessage(`JOKER_SWAPPED ignore: exposure ${exposureIndex} missing for player ${player}`);
            return;
        }

        const jokerTile = this.findJokerTile(targetExposure, jokerIndex);
        if (!jokerTile) {
            printMessage(`JOKER_SWAPPED ignore: joker index ${jokerIndex ?? "auto"} missing for player ${player}`);
            return;
        }

        targetExposure.remove(jokerTile);

        const replacementData = replacementTile instanceof TileData
            ? replacementTile
            : (replacementTile ? TileData.fromJSON(replacementTile) : null);

        if (replacementData) {
            const replacementPhaserTile = this.createPhaserTile(replacementData);
            if (replacementPhaserTile) {
                replacementPhaserTile.showTile(true, true);
                targetExposure.insert(replacementPhaserTile);
            }
        }

        const recipientPlayer = this.table.players[recipient] || this.table.players[PLAYER.BOTTOM];
        if (recipientPlayer && recipientPlayer.hand) {
            recipientPlayer.hand.insertHidden(jokerTile);
        } else {
            this.table.wall.insert(jokerTile);
        }

        this.table.players.forEach((tablePlayer, index) => {
            tablePlayer.showHand(index === PLAYER.BOTTOM);
        });

        if (replacementData) {
            printInfo(`${exposureOwner.playerInfo.name} swapped a joker for ${replacementData.getText()}`);
        } else {
            printInfo(`${exposureOwner.playerInfo.name} joker swap complete`);
        }
    }

    /**
     * Find joker tile in exposure set
     */
    findJokerTile(tileSet, jokerIndex) {
        if (!tileSet || !Array.isArray(tileSet.tileArray)) {
            return null;
        }

        if (typeof jokerIndex === "number") {
            const exactMatch = tileSet.tileArray.find(tile => tile.index === jokerIndex);
            if (exactMatch) {
                return exactMatch;
            }
        }

        return tileSet.tileArray.find(tile => tile.suit === SUIT.JOKER) || null;
    }

    /**
     * Handle hand updated
     */
    /**
     * Handle hand updated
     */
    onHandUpdated(data) {
        const {player: playerIndex, hand: handData} = data;

        // For now, just log - full hand sync will happen from tile events
        console.log(`Hand updated for player ${playerIndex}: ${handData.tiles.length} hidden, ${handData.exposures.length} exposed`);

        // Update hint if human player
        if (playerIndex === PLAYER.BOTTOM && this.scene.hintAnimationManager) {
            this.scene.hintAnimationManager.updateHintsForNewTiles();
        }
    }

    /**
     * Handle turn changed
     */
    onTurnChanged(data) {
        const {currentPlayer} = data;

        this.table.switchPlayer(currentPlayer);

        const currentPlayerObj = this.table.players[currentPlayer];
        printMessage(`${currentPlayerObj.playerInfo.name}'s turn`);
    }

    /**
     * Handle Charleston phase started
     */
    onCharlestonPhase(data) {
        const {phase, passCount, direction} = data;
        printMessage(`Charleston Phase ${phase}, Pass ${passCount}: Pass ${direction}`);
    }

    /**
     * Handle Charleston pass executed
     */
    onCharlestonPass(data) {
        const {player: playerIndex, direction} = data;
        const playerName = this.getPlayerName(playerIndex);
        printMessage(`${playerName} passed 3 tiles ${direction}`);
    }

    /**
     * Handle courtesy vote
     */
    onCourtesyVote(data) {
        const {player: playerIndex, vote} = data;
        const player = this.table.players[playerIndex];

        printMessage(`${player.playerInfo.name} voted ${vote ? "YES" : "NO"} for courtesy pass`);
    }

    /**
     * Handle courtesy pass
     */
    onCourtesyPass(data) {
        const {fromPlayer, toPlayer, tiles} = data;

        const tileTexts = tiles.map(tile => TileData.fromJSON(tile).getText()).join(", ");
        printMessage(`Courtesy pass: ${this.table.players[fromPlayer].playerInfo.name} → ${this.table.players[toPlayer].playerInfo.name} (${tileTexts})`);
    }

    /**
     * Handle message from game
     */
    onMessage(data) {
        const {text, type} = data;

        if (type === "info") {
            printInfo(text);
        } else if (type === "error") {
            printMessage(`ERROR: ${text}`);
            this.dialogManager.showError(text);
        } else if (type === "hint") {
            // Hint messages (for hint panel)
            const hintContent = document.getElementById("hint-content");
            if (hintContent) {
                const hintText = document.createElement("div");
                hintText.className = "hint-message";
                hintText.textContent = text;
                hintContent.appendChild(hintText);

                // Auto-scroll to bottom
                hintContent.scrollTop = hintContent.scrollHeight;
            }
        } else {
            printMessage(text);
        }
    }

    /**
     * Handle UI prompts from GameController
     * This is called when the game needs user input
     */
    onUIPrompt(data) {
        const {promptType, options, callback} = data;

        switch (promptType) {
            case "CHOOSE_DISCARD":
                this.handleDiscardPrompt(callback);
                break;

            case "CLAIM_DISCARD":
                this.handleClaimPrompt(options, callback);
                break;

            case "CHARLESTON_PASS":
                this.handleCharlestonPassPrompt(options, callback);
                break;

            case "CHARLESTON_CONTINUE":
                this.handleCharlestonContinuePrompt(callback);
                break;

            case "COURTESY_VOTE":
                this.handleCourtesyVotePrompt(callback);
                break;

            case "COURTESY_PASS":
                this.handleCourtesyPassPrompt(options, callback);
                break;

            case "SELECT_TILES":
                this.handleSelectTilesPrompt(options, callback);
                break;

            default:
                console.warn(`Unknown prompt type: ${promptType}`);
                if (callback) callback(null);
        }
    }

    /**
     * Handle discard tile selection prompt
     */
    handleDiscardPrompt(callback) {
        const player = this.table.players[PLAYER.BOTTOM];

        printInfo("Select a tile to discard");

        // Enable tile selection with callback
        player.hand.enableTileSelection((selectedTile) => {
            if (callback) {
                // Convert Phaser Tile → TileData
                const tileData = TileData.fromPhaserTile(selectedTile);
                callback(tileData);
            }
        });
    }

    /**
     * Handle claim discard prompt
     */
    handleClaimPrompt(options, callback) {
        const {options: claimOptions} = options;

        this.dialogManager.showClaimDialog(claimOptions, (result) => {
            if (callback) callback(result);
        });
    }

    /**
     * Handle Charleston pass tile selection
     */
    handleCharlestonPassPrompt(options, callback) {
        const {direction, requiredCount} = options;
        const player = this.table.players[PLAYER.BOTTOM];

        printInfo(`Choose ${requiredCount} tiles to pass ${direction}`);

        this.dialogManager.showCharlestonPassDialog((result) => {
            const selection = player.hand.hiddenTileSet.getSelection();

            if (result === "pass" && selection.length === requiredCount) {
                // Valid selection: convert and return tiles
                const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
                player.hand.hiddenTileSet.resetSelection();
                if (callback) callback(tileDatas);
            } else {
                // Invalid selection or cancelled: reset and return empty array
                player.hand.hiddenTileSet.resetSelection();
                if (callback) callback([]);
            }
        });
    }

    /**
     * Handle Charleston continue query
     */
    handleCharlestonContinuePrompt(callback) {
        this.dialogManager.showYesNoDialog(
            "Continue to next Charleston phase?",
            (result) => {
                if (callback) callback(result);
            }
        );
    }

    /**
     * Handle courtesy vote prompt
     */
    handleCourtesyVotePrompt(callback) {
        this.dialogManager.showCourtesyVoteDialog((result) => {
            if (callback) callback(result);
        });
    }

    /**
     * Handle courtesy pass prompt
     */
    handleCourtesyPassPrompt(options, callback) {
        const {maxTiles} = options;

        this.dialogManager.showCourtesyPassDialog(maxTiles, (result) => {
            if (callback) callback(result);
        });
    }

    /**
     * Handle tile selection prompt
     * Used for courtesy pass phase and other contexts requiring flexible tile selection
     *
     * @param {Object} options - Selection options
     * @param {number} options.minTiles - Minimum number of tiles to select
     * @param {number} options.maxTiles - Maximum number of tiles to select
     * @param {Function} callback - Called with array of selected TileData objects
     */
    handleSelectTilesPrompt(options, callback) {
        const {minTiles = 1, maxTiles = 3} = options || {};
        const player = this.table.players[PLAYER.BOTTOM];

        printInfo(`Select ${minTiles}–${maxTiles} tiles`);

        this.dialogManager.showSelectTilesDialog(minTiles, maxTiles, (result) => {
            if (result === "select" && callback) {
                // Get selected tiles from hand
                const selection = player.hand.hiddenTileSet.getSelection();
                if (selection.length >= minTiles && selection.length <= maxTiles) {
                    const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
                    player.hand.hiddenTileSet.resetSelection();
                    callback(tileDatas);
                } else {
                    // Invalid selection, cancel
                    player.hand.hiddenTileSet.resetSelection();
                    if (callback) callback([]);
                }
            } else {
                // Cancelled, return empty array
                player.hand.hiddenTileSet.resetSelection();
                if (callback) callback([]);
            }
        });
    }

    /**
     * Safely get player name, handling undefined playerInfo
     */
    getPlayerName(playerIndex) {
        if (playerIndex < 0 || playerIndex >= this.table.players.length) {
            return `Player ${playerIndex}`;
        }
        const player = this.table.players[playerIndex];
        if (!player || !player.playerInfo) {
            return `Player ${playerIndex}`;
        }
        return player.playerInfo.name || `Player ${playerIndex}`;
    }

    /**
     * Cleanup adapter (remove event listeners, etc.)
     */
    destroy() {
        this.gameController.clear();  // Remove all event listeners
        this.tileMap.clear();
        if (this.dialogManager) {
            this.dialogManager.closeDialog();
        }
    }
}
