/**
 * PhaserAdapter - Bridges GameController (platform-agnostic) to Phaser (desktop-specific)
 *
 * This adapter listens to GameController events and translates them into Phaser sprite updates.
 * It also handles UI prompts by interfacing with the managers and dialogs.
 *
 * Architecture:
 * GameController (core/) emits events → PhaserAdapter listens → Updates Phaser objects via Managers
 *
 * Implementation uses:
 * - Tile.animate() method for all tile animations
 * - TileManager for sprite management
 * - ButtonManager for button state
 * - DialogManager for prompts
 */

import {TileData} from "../../core/models/TileData.js";
import {Tile} from "../gameObjects/gameObjects.js";
import {PLAYER, SUIT} from "../../constants.js";
import {printMessage, printInfo} from "../../utils.js";
import {TileManager} from "../managers/TileManager.js";
import {ButtonManager} from "../managers/ButtonManager.js";
import {DialogManager} from "../managers/DialogManager.js";
import {SelectionManager} from "../managers/SelectionManager.js";
import {HandRenderer} from "../renderers/HandRenderer.js";

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
        this.dialogManager = new DialogManager(scene);

        // Initialize Phase 3 managers and renderers
        this.handRenderer = new HandRenderer(scene, table);

        // Create ButtonManager first (needed by SelectionManager)
        this.buttonManager = new ButtonManager(scene, gameController);

        // Create SelectionManager for human player with ButtonManager reference
        const humanHand = table.players[PLAYER.BOTTOM].hand;
        this.selectionManager = new SelectionManager(humanHand, table, this.buttonManager);

        // Now set SelectionManager reference on ButtonManager
        this.buttonManager.selectionManager = this.selectionManager;

        this.setupEventListeners();
    }

    /**
     * Initialize tile map with all tiles from wall
     * Must be called after wall is created and shuffled
     */
    initializeTileMap() {
        if (this.table && this.table.wall && this.table.wall.tileArray) {
            for (const tile of this.table.wall.tileArray) {
                if (tile.index !== undefined && tile.index >= 0) {
                    this.tileMap.set(tile.index, tile);
                }
            }
        }
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

        // Wall setup event
        gc.on("WALL_CREATED", () => {
            this.initializeTileMap();
        });

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
            // Selection will be enabled by onCharlestonPhase handler
            break;
        case "COURTESY":
            humanHand.setValidationMode("courtesy");
            // Selection will be enabled by courtesy prompt handler
            break;
        case "LOOP_CHOOSE_DISCARD":
            humanHand.setValidationMode("play");
            printInfo("Select one tile to discard or declare Mahjong");
            // Selection will be enabled by discard prompt handler
            break;
        case "LOOP_EXPOSE_TILES":
            humanHand.setValidationMode("expose");
            printInfo("Form a pung/kong/quint with claimed tile");
            break;
        case "LOOP_QUERY_CLAIM_DISCARD":
            printInfo("Claim discard?");
            break;
        default:
            humanHand.setValidationMode(null);
            // Disable selection when not in a selection state
            if (this.selectionManager) {
                this.selectionManager.disableTileSelection();
            }
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
        const {player: playerIndex, tile: tileData} = data;
        const player = this.table.players[playerIndex];

        // Convert TileData to Phaser Tile using the pre-populated tile map
        const tileDataObj = TileData.fromJSON(tileData);

        // Look up the Phaser Tile object by index
        let phaserTile = this.tileMap.get(tileDataObj.index);

        if (!phaserTile) {
            // Fallback: try to find in wall (shouldn't normally happen if tileMap initialized correctly)
            phaserTile = this.findTileInWall(tileDataObj.index);
        }

        if (!phaserTile) {
            console.error(`Could not find Phaser Tile for index ${tileDataObj.index}. Tile map has ${this.tileMap.size} tiles.`);
            return;
        }

        // Position tile at wall location initially
        const wallX = 640; // Center of screen (wall position)
        const wallY = 360;
        phaserTile.sprite.setPosition(wallX, wallY);
        phaserTile.sprite.setAlpha(0);

        // Add to player's hand
        player.hand.insertHidden(phaserTile);

        // Animate tile draw (slide from wall to hand)
        const targetPos = player.hand.calculateTilePosition(
            player.playerInfo,
            player.hand.hiddenTileSet.getLength() - 1
        );

        // Animate to hand with tile.animate() method
        const tween = phaserTile.animate(targetPos.x, targetPos.y, player.playerInfo.angle, 200);

        // Fade in during animation
        this.scene.tweens.add({
            targets: phaserTile.sprite,
            alpha: 1,
            duration: 200
        });

        // Refresh hand after animation completes
        if (tween) {
            tween.on("complete", () => {
                player.showHand(playerIndex === PLAYER.BOTTOM);
            });
        }

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
        const {player: playerIndex, tile: tileData} = data;
        const player = this.table.players[playerIndex];

        // Convert TileData to Phaser Tile using the pre-populated tile map
        const tileDataObj = TileData.fromJSON(tileData);

        // Look up the Phaser Tile object by index
        const phaserTile = this.tileMap.get(tileDataObj.index);

        if (!phaserTile) {
            console.error(`Could not find Phaser Tile for index ${tileDataObj.index}`);
            return;
        }

        // Remove from hand
        player.hand.removeHidden(phaserTile);

        // Animate to discard pile center (350, 420 from 07c41b9)
        const discardTween = phaserTile.animate(350, 420, 0);

        // Play tile dropping sound when animation completes
        if (discardTween && this.scene.audioManager) {
            discardTween.on("complete", () => {
                this.scene.audioManager.playSFX("tile_dropping");
            });
        }

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
        printMessage(`${playerName} discarded ${tileDataObj.getText()}`);
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
    onHandUpdated(data) {
        const {player: playerIndex, hand: handData} = data;

        // For now, just log - full hand sync will happen from tile events
        console.log(`Hand updated for player ${playerIndex}: ${handData.tiles.length} hidden, ${handData.exposures.length} exposed`);

        // Clear invalid selections for human player
        if (playerIndex === PLAYER.BOTTOM && this.selectionManager) {
            // Only clear if current selection is no longer valid
            // (e.g., tiles were removed from hand after passing)
            const currentSelection = this.selectionManager.getSelection();
            if (currentSelection.length > 0) {
                // Check if any selected tiles are no longer in hand
                const humanHand = this.table.players[PLAYER.BOTTOM].hand;
                const tilesInHand = humanHand.hiddenTileSet.tileArray || [];
                const invalidSelection = currentSelection.some(tile => !tilesInHand.includes(tile));

                if (invalidSelection) {
                    this.selectionManager.clearSelection();
                }
            }
        }

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

        // Enable tile selection for human player (3 tiles required for Charleston)
        if (this.selectionManager) {
            this.selectionManager.enableTileSelection(3, 3, "charleston");
        }
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

        // Set validation mode to "play" (single tile selection)
        player.hand.setValidationMode("play");

        // Register button callback to get the selected tile when user clicks "Discard"
        this.buttonManager.registerCallback("button1", () => {
            const selection = player.hand.hiddenTileSet.getSelection();
            if (selection.length === 1) {
                const selectedTile = selection[0];
                // Clear selection and reset validation mode
                player.hand.hiddenTileSet.resetSelection();
                player.hand.setValidationMode(null);

                if (callback) {
                    // Convert Phaser Tile → TileData
                    const tileData = TileData.fromPhaserTile(selectedTile);
                    callback(tileData);
                }
            }
        });
    }

    /**
     * Handle claim discard prompt
     * Use action panel buttons instead of blocking modal dialog
     */
    handleClaimPrompt(options, callback) {
        const {discardedTile} = options;

        printInfo(`Claim ${discardedTile ? discardedTile.getText() : "this discard"}?`);

        // Register callbacks for each claim button
        // Buttons are shown by ButtonManager.showClaimButtons() which shows: Claim, Pung, Kong, Pass

        this.buttonManager.registerCallback("button1", () => {
            if (callback) callback({action: "claim"});
        });

        this.buttonManager.registerCallback("button2", () => {
            if (callback) callback({action: "pung"});
        });

        this.buttonManager.registerCallback("button3", () => {
            if (callback) callback({action: "kong"});
        });

        this.buttonManager.registerCallback("button4", () => {
            if (callback) callback({action: "pass"});
        });
    }

    /**
     * Handle Charleston pass tile selection
     */
    handleCharlestonPassPrompt(options, callback) {
        const {direction, requiredCount} = options;

        printInfo(`Select ${requiredCount} tiles to pass ${direction}`);

        // Enable tile selection
        this.selectionManager.enableTileSelection(requiredCount, requiredCount, "charleston");

        // Set up button callback to handle the pass
        this.buttonManager.registerCallback("button1", () => {
            const selection = this.selectionManager.getSelection();

            if (selection.length === requiredCount) {
                // Valid selection: convert and return tiles
                const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
                this.selectionManager.clearSelection();
                this.selectionManager.disableTileSelection();
                if (callback) callback(tileDatas);
            } else {
                // Invalid selection
                printInfo(`Please select exactly ${requiredCount} tiles`);
            }
        });

        // Enable button when selection is valid
        const checkSelection = () => {
            if (this.selectionManager.getSelectionCount() === requiredCount) {
                this.buttonManager.enableButton("button1");
            } else {
                this.buttonManager.disableButton("button1");
            }
        };

        // Check selection on tile clicks
        this.selectionManager.onSelectionChanged = checkSelection;
    }

    /**
     * Handle Charleston continue query
     */
    handleCharlestonContinuePrompt(callback) {
        printInfo("Continue to next Charleston phase?");

        // Set up Yes/No buttons
        this.buttonManager.setText("button1", "No");
        this.buttonManager.setText("button2", "Yes");
        this.buttonManager.show(["button1", "button2"]);
        this.buttonManager.enableButton("button1");
        this.buttonManager.enableButton("button2");

        this.buttonManager.registerCallback("button1", () => {
            this.buttonManager.hide(["button1", "button2"]);
            if (callback) callback(false);
        });

        this.buttonManager.registerCallback("button2", () => {
            this.buttonManager.hide(["button1", "button2"]);
            if (callback) callback(true);
        });
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
