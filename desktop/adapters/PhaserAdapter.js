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
import {PLAYER, STATE, SUIT, getTotalTileCount} from "../../constants.js";
import {printMessage, printInfo} from "../../utils.js";
import {TileManager} from "../managers/TileManager.js";
import {ButtonManager} from "../managers/ButtonManager.js";
import {DialogManager} from "../managers/DialogManager.js";
import {SelectionManager} from "../managers/SelectionManager.js";
import {BlankSwapManager} from "../managers/BlankSwapManager.js";
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

        /** @type {number} Track tiles removed from wall (for counter) */
        this.tilesRemovedFromWall = 0;

        // Initialize Phase 2 managers
        // Phase 5: Pass direct dependencies instead of entire table
        this.tileManager = new TileManager(scene, table.wall, table.discards);
        this.dialogManager = new DialogManager(scene);

        // Initialize Phase 3 managers and renderers
        // HandRenderer needs TileManager to look up sprites by index
        this.handRenderer = new HandRenderer(scene, table, this.tileManager);
        this.pendingHumanGlowTile = null;
        this.activeHumanGlowTile = null;

        // Create ButtonManager first (needed by SelectionManager)
        this.buttonManager = new ButtonManager(scene, gameController);

        // Create SelectionManager for human player with ButtonManager reference
        // Phase 5: Pass playerAngle directly instead of entire table
        const humanHand = table.players[PLAYER.BOTTOM].hand;
        const playerAngle = table.players[PLAYER.BOTTOM].playerInfo.angle;
        this.selectionManager = new SelectionManager(humanHand, playerAngle, this.buttonManager);

        // Now set SelectionManager reference on ButtonManager
        this.buttonManager.selectionManager = this.selectionManager;

        // Phase 5: Pass direct dependencies instead of table
        this.blankSwapManager = new BlankSwapManager({
            hand: humanHand,
            discardPile: table.discards,
            selectionManager: this.selectionManager,
            buttonManager: this.buttonManager,
            gameController
        });

        this.setupEventListeners();
    }

    /**
     * Handle wall creation (register all physical tiles with TileManager)
     */
    onWallCreated() {
        // Phase 5: Renamed method - now only initializes wall tiles
        this.tileManager.initializeFromWall();
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
        gc.on("WALL_CREATED", (data) => this.onWallCreated(data));

        // Tile events
        gc.on("TILES_DEALT", (data) => this.onTilesDealt(data));
        gc.on("TILE_DRAWN", (data) => this.onTileDrawn(data));
        gc.on("TILE_DISCARDED", (data) => this.onTileDiscarded(data));
        gc.on("BLANK_EXCHANGED", (data) => this.onBlankExchanged(data));
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
     * Update wall counter UI based on tiles removed
     */
    updateWallTileCounter() {
        if (!this.scene.updateWallTileCounter) {
            return;
        }
        const totalTileCount = getTotalTileCount();
        const remainingInWall = totalTileCount - this.tilesRemovedFromWall;
        this.scene.updateWallTileCounter(Math.max(remainingInWall, 0));
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
        this.clearHumanDrawGlow();
        const settings = this.gameController?.settings || {};
        const year = settings.year || "2025";
        const optionParts = [
            `Difficulty: ${settings.difficulty || "medium"}`,
            `Charleston: ${settings.skipCharleston ? "skipped" : "full"}`,
            `Blanks: ${settings.useBlankTiles ? "on" : "off"}`
        ];
        printMessage(`Starting card ${year} • ${optionParts.join(" • ")}`);
        if (this.scene.audioManager) {
            this.scene.audioManager.playBGM("bgm");
        }
        if (this.scene && typeof this.scene.hideWallGameNotice === "function") {
            this.scene.hideWallGameNotice();
        }
        if (this.scene && typeof this.scene.setActionPanelDisabled === "function") {
            this.scene.setActionPanelDisabled(false);
        }

        // Reset Phaser table
        this.table.reset();
        // Phase 5: Renamed method - now only initializes wall tiles
        this.tileManager.initializeFromWall();

        // Hide start button
        const startButton = document.getElementById("start");
        if (startButton) {
            startButton.style.display = "none";
        }

        // Reset tile counter
        this.tilesRemovedFromWall = 0;

        this.buttonManager?.pinSortButtons?.();
    }

    /**
     * Handle game end
     */
    onGameEnded(data) {
        const {reason, winner, mahjong} = data;

        if (mahjong) {
            const winnerName = this.getPlayerName(winner);
            printMessage(`${winnerName} wins with Mahjong!`);

            // Show fireworks (existing functionality)
            if (this.scene.audioManager) {
                this.scene.audioManager.playFireworks();
            }
        } else if (reason === "wall_game") {
            printMessage("Wall game - no winner");
            printInfo("Wall game reached. No moves available.");
            this.table.players.forEach(player => player.showHand(true));
            if (this.scene.audioManager) {
                this.scene.audioManager.playSFX("wall_fail");
            }
            if (this.scene && typeof this.scene.handleWallGameEnd === "function") {
                this.scene.handleWallGameEnd();
            }
        }

        // Show start button again
        const startButton = document.getElementById("start");
        if (startButton) {
            startButton.style.display = "block";
        }
    }

    /**
     * Handle initial tiles dealt - sequential animation matching 07c41b9
     * This method handles the ENTIRE dealing sequence including wall manipulation
     */
    onTilesDealt(data = {}) {
        const sequence = Array.isArray(data.sequence) ? data.sequence : [];

        if (!sequence.length) {
            // Fall back to legacy behavior if controller did not supply data
            // TODO: Remove once GameController always emits tile sequences (post legacy cleanup).
            this.executeLegacyDealSequence();
            return;
        }

        let currentStepIndex = 0;

        const dealNextGroup = () => {
            if (currentStepIndex >= sequence.length) {
                this.autoSortHumanHand();
                this.applyHumanDrawGlow();
                if (this.scene && typeof this.scene.handleDealAnimationComplete === "function") {
                    this.scene.handleDealAnimationComplete();
                }
                this.gameController.emit("DEALING_COMPLETE");
                return;
            }

            const step = sequence[currentStepIndex];
            const playerIndex = typeof step.player === "number" ? step.player : PLAYER.BOTTOM;
            const tilePayloads = Array.isArray(step.tiles) ? step.tiles : [];
            const dealtTiles = [];

            tilePayloads.forEach(tileJSON => {
                const tileData = TileData.fromJSON(tileJSON);
                const phaserTile = this.tileManager.getOrCreateTile(tileData);

                if (!phaserTile) {
                    console.error(`Could not find Phaser Tile for index ${tileData.index} during dealing`);
                    return;
                }

                this.tileManager.removeTileFromWall(tileData.index);

                phaserTile.sprite.setPosition(50, 50);
                phaserTile.sprite.setAlpha(1);
                if (phaserTile.spriteBack) {
                    phaserTile.spriteBack.setAlpha(1);
                }
                phaserTile.showTile(true, playerIndex === PLAYER.BOTTOM);

                // HandData already has the tiles (added by GameController.buildInitialDealSequence)
                // We'll sync from HandData after this step completes
                if (playerIndex === PLAYER.BOTTOM) {
                    this.setPendingHumanGlowTile(phaserTile);
                }
                dealtTiles.push(phaserTile);
            });

            // Sync and render from HandData for this player (progressive dealing)
            const playerHandData = this.gameController.players[playerIndex].hand.toJSON();
            this.handRenderer.syncAndRender(playerIndex, playerHandData);

            this.tilesRemovedFromWall += tilePayloads.length;
            this.updateWallTileCounter();

            const lastTile = dealtTiles[dealtTiles.length - 1];

            if (lastTile && lastTile.tween) {
                lastTile.tween.once("complete", () => {
                    currentStepIndex++;
                    this.scene.time.delayedCall(150, dealNextGroup);
                });
            } else {
                currentStepIndex++;
                this.scene.time.delayedCall(150, dealNextGroup);
            }
        };

        dealNextGroup();
    }

    /**
     * Handle tile drawn from wall
     */
    onTileDrawn(data) {
        const {player: playerIndex, tile: tileData} = data;
        const player = this.table.players[playerIndex];

        // Convert TileData to Phaser Tile using the pre-populated tile map
        const tileDataObj = TileData.fromJSON(tileData);

        const phaserTile = this.tileManager.getOrCreateTile(tileDataObj);
        if (!phaserTile) {
            console.error(`Could not find Phaser Tile for index ${tileDataObj.index}.`);
            return;
        }

        // Position tile at wall location initially (top-left)
        const wallX = 50;
        const wallY = 50;
        phaserTile.sprite.setPosition(wallX, wallY);
        phaserTile.sprite.setAlpha(0);

        this.tileManager.removeTileFromWall(tileDataObj.index);

        // GameController emits HAND_UPDATED after drawing, which triggers syncAndRender()
        // No need to call insertTileIntoHand - HandData is source of truth
        if (playerIndex === PLAYER.BOTTOM) {
            this.setPendingHumanGlowTile(phaserTile);
        }

        // Animate tile draw (slide from wall to hand)
        const targetPos = player.hand.calculateTilePosition(
            player.playerInfo,
            player.hand.hiddenTileSet.getLength() - 1
        );

        // Animate to hand with tile.animate() method
        const tween = phaserTile.animate(targetPos.x, targetPos.y, player.playerInfo.angle, 200);
        if (tween && this.scene.audioManager) {
            tween.once("complete", () => {
                this.scene.audioManager.playSFX("rack_tile");
            });
        }

        // Fade in during animation
        this.scene.tweens.add({
            targets: phaserTile.sprite,
            alpha: 1,
            duration: 200
        });
        phaserTile.isNewlyInserted = false;

        const finalizeDraw = () => {
            if (playerIndex === PLAYER.BOTTOM) {
                this.autoSortHumanHand();
                this.applyHumanDrawGlow();
            } else {
                this.handRenderer.showHand(playerIndex, false);
            }
        };

        // Refresh hand after animation completes
        if (tween) {
            tween.on("complete", finalizeDraw);
        } else {
            finalizeDraw();
        }

        // Track that one tile was removed from the wall
        this.tilesRemovedFromWall++;
        this.updateWallTileCounter();

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

        const tileDataObj = TileData.fromJSON(tileData);
        const phaserTile = this.tileManager.getOrCreateTile(tileDataObj);

        if (!phaserTile) {
            console.error(`Could not find Phaser Tile for index ${tileDataObj.index}`);
            return;
        }
        if (playerIndex === PLAYER.BOTTOM) {
            this.clearHumanDrawGlow(phaserTile);
        }

        // GameController emits HAND_UPDATED after discarding, which triggers syncAndRender()
        // No need to call removeTileFromHand - HandData is source of truth

        // Add to discard pile (handles animation + audio)
        this.tileManager.addTileToDiscardPile(phaserTile);

        // Phase 3.5: Set discard tile for exposure validation (human player)
        if (playerIndex === PLAYER.BOTTOM) {
            const humanHand = this.table.players[PLAYER.BOTTOM].hand;
            humanHand.setDiscardTile(phaserTile);
        }

        // Show discards (updates layout)
        const playerName = this.getPlayerName(playerIndex);
        printMessage(`${playerName} discarded ${tileDataObj.getText()}`);

        this.blankSwapManager?.handleDiscardPileChanged();
    }

    /**
     * Handle blank exchange (human swaps blank with discard pile)
     */
    onBlankExchanged(data) {
        const {player, blankTile, retrievedTile} = data;
        if (player !== PLAYER.BOTTOM) {
            return;
        }

        const blankTileData = TileData.fromJSON(blankTile);
        const retrievedTileData = TileData.fromJSON(retrievedTile);
        const blankPhaserTile = this.tileManager.getTileSprite(blankTileData);
        const retrievedPhaserTile = this.tileManager.getTileSprite(retrievedTileData);

        if (retrievedPhaserTile) {
            this.table.discards.removeDiscardTile(retrievedPhaserTile);
            retrievedPhaserTile.sprite.visible = false;
            retrievedPhaserTile.spriteBack.visible = false;
        }

        if (blankPhaserTile) {
            // GameController emits HAND_UPDATED after blank exchange, which triggers syncAndRender()
            // No need to call removeTileFromHand - HandData is source of truth
            this.table.discards.insertDiscard(blankPhaserTile);
        } else {
            console.warn("Blank exchange: Could not find blank tile sprite", blankTileData);
        }

        this.table.discards.layoutTiles();
        this.blankSwapManager?.handleBlankExchangeEvent();
    }

    /**
     * Handle discard claimed
     */
    onDiscardClaimed(data) {
        const {claimingPlayer, tile: tileData, claimType} = data;

        const tileDataObj = TileData.fromJSON(tileData);
        const claimingPlayerData = this.table.players[claimingPlayer];
        if (!claimingPlayerData) {
            console.error("Invalid claiming player index:", claimingPlayer, data);
            return;
        }
        const claimedTile = this.tileManager.getOrCreateTile(tileDataObj);
        if (claimedTile && this.table?.discards) {
            this.table.discards.removeDiscardTile(claimedTile);
            this.table.discards.layoutTiles();
        }
        const playerName = this.getPlayerName(claimingPlayer);
        printMessage(`${playerName} claimed ${tileDataObj.getText()} for ${claimType}`);
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

        // Convert to Phaser tiles for glow clearing
        const phaserTiles = this.tileManager.convertTileDataArray(
            tileDatas.map(td => TileData.fromJSON(td))
        );

        // Clear visual effects for exposed tiles
        if (playerIndex === PLAYER.BOTTOM) {
            phaserTiles.forEach(tile => this.clearHumanDrawGlow(tile));
        }

        // GameController already emitted HAND_UPDATED event, which will trigger syncAndRender()
        // No need to manually call removeHidden() or insertExposed() - HandData is source of truth

        const playerName = this.getPlayerName(playerIndex);
        printMessage(`${playerName} exposed ${exposureType}: ${phaserTiles.length} tiles`);
    }

    /**
     * Handle joker swapped event
     * GameController now emits HAND_UPDATED events after joker swaps,
     * so this handler is minimal - just for logging
     */
    onJokerSwapped(data) {
        const {player, replacementTile} = data;

        // GameController has already updated HandData and emitted HAND_UPDATED events
        // HandRenderer.syncAndRender() will handle the visual update
        // Just log the message for user feedback

        const ownerName = this.getPlayerName(player);
        const replacementData = replacementTile instanceof TileData
            ? replacementTile
            : (replacementTile ? TileData.fromJSON(replacementTile) : null);

        if (replacementData) {
            printInfo(`${ownerName} swapped a joker for ${replacementData.getText()}`);
        }
    }

    /**
     * Handle hand updated
     */
    onHandUpdated(data) {
        const {player: playerIndex, hand: handData} = data;

        console.log(`Hand updated for player ${playerIndex}: ${handData.tiles.length} hidden, ${handData.exposures.length} exposed`);

        // Phase 2.5: Always sync, including during DEAL state
        // HandData is the authoritative source of truth for ALL game states
        // HandRenderer.syncAndRender() will handle the rendering
        this.handRenderer.syncAndRender(playerIndex, handData);

        // After sync, if selection is enabled for human player, re-attach click handlers
        // This is necessary because syncAndRender rebuilds the tile array with new sprites
        if (playerIndex === PLAYER.BOTTOM && this.selectionManager) {
            this.selectionManager.refreshHandlers();
        }

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

        this.blankSwapManager?.handleHandUpdated(playerIndex);
    }

    /**
     * Handle turn changed
     */
    onTurnChanged(data) {
        const {currentPlayer} = data;

        this.table.switchPlayer(currentPlayer);

        const currentPlayerName = this.getPlayerName(currentPlayer);
        printMessage(`${currentPlayerName}'s turn`);
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
        const {fromPlayer: playerIndex, direction} = data;
        const playerName = this.getPlayerName(playerIndex);
        printMessage(`${playerName} passed 3 tiles ${direction}`);
    }

    /**
     * Handle courtesy vote
     */
    onCourtesyVote(data) {
        const {player: playerIndex, vote} = data;
        const playerName = this.getPlayerName(playerIndex);
        printMessage(`${playerName} voted ${vote ? "YES" : "NO"} for courtesy pass`);
    }

    /**
     * Handle courtesy pass
     */
    onCourtesyPass(data) {
        const {fromPlayer, toPlayer, tiles} = data;

        const tileTexts = tiles.map(tile => TileData.fromJSON(tile).getText()).join(", ");
        const fromName = this.getPlayerName(fromPlayer);
        const toName = this.getPlayerName(toPlayer);
        printMessage(`Courtesy pass: ${fromName} → ${toName} (${tileTexts})`);
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
     * Handle discard tile selection prompt - Pattern A (Selection-Based)
     *
     * Prompts the human player to select one tile from their hand to discard.
     * Uses SelectionManager for tile selection state and ButtonManager for confirmation.
     *
     * @param {Function} callback - GameController callback to invoke with selected TileData
     *
     * @architecture Pattern A (Selection-Based Prompt)
     * Flow:
     * 1. Set validation mode to "play" (allows any single tile)
     * 2. Register button callback to get selection when user clicks "Discard"
     * 3. Validate selection (must be exactly 1 tile)
     * 4. Convert Phaser Tile → TileData
     * 5. Clear selection and invoke GameController callback
     *
     * @see desktop/ADAPTER_PATTERNS.md for pattern documentation
     */
    handleDiscardPrompt(callback) {
        if (!this.selectionManager) {
            if (callback) callback(null);
            return;
        }

        printInfo("Select a tile to discard");
        this.blankSwapManager?.handleDiscardPromptStart();

        this.selectionManager.requestSelection({
            min: 1,
            max: 1,
            mode: "play"
        }).then(selection => {
            if (!selection || selection.length === 0) {
                callback?.(null);
                return;
            }
            const tileData = TileData.fromPhaserTile(selection[0]);
            callback?.(tileData);
        }).catch((error) => {
            console.warn("Discard selection cancelled:", error);
            callback?.(null);
        }).finally(() => {
            this.blankSwapManager?.handleDiscardPromptEnd();
        });
    }

    /**
     * Handle claim discard prompt - Pattern B (Button-Based)
     *
     * Prompts the human player to choose how to claim a discarded tile or pass.
     * Uses ButtonManager for direct button-to-action mapping.
     *
     * @param {Object} options - Prompt options
     * @param {TileData} options.discardedTile - The tile that was discarded
     * @param {Function} callback - GameController callback with claim type string
     *
     * @architecture Pattern B (Button-Based Prompt)
     * Flow:
     * 1. ButtonManager shows claim buttons (via updateForState in onStateChanged)
     * 2. Register callback for each button: "Mahjong", "Pung", "Kong", "Pass"
     * 3. User clicks button → immediately invoke GameController callback
     * 4. No selection state needed - just button → callback
     *
     * @note This pattern was debugged by Codex and works correctly.
     *       Do not refactor to DialogManager without extensive testing.
     *
     * @see desktop/ADAPTER_PATTERNS.md for pattern documentation
     */
    handleClaimPrompt(options, callback) {
        const {discardedTile} = options;

        printInfo(`Claim ${discardedTile ? discardedTile.getText() : "this discard"}?`);

        // Register callbacks for each claim button
        this.buttonManager.registerCallback("button1", () => {
            if (callback) callback("Mahjong");
        });

        this.buttonManager.registerCallback("button2", () => {
            if (callback) callback("Pung");
        });

        this.buttonManager.registerCallback("button3", () => {
            if (callback) callback("Kong");
        });

        this.buttonManager.registerCallback("button4", () => {
            if (callback) callback("Pass");
        });
    }

    /**
     * Handle Charleston pass tile selection - Pattern A (Selection-Based)
     *
     * Prompts the human player to select exactly N tiles (usually 3) to pass in the
     * specified direction during Charleston phase.
     * Uses SelectionManager for tile selection and ButtonManager for confirmation.
     *
     * @param {Object} options - Prompt options
     * @param {string} options.direction - Pass direction ("LEFT", "RIGHT", "ACROSS")
     * @param {number} options.requiredCount - Number of tiles to select (usually 3)
     * @param {Function} callback - GameController callback with TileData[] array
     *
     * @architecture Pattern A (Selection-Based Prompt)
     * Flow:
     * 1. Enable tile selection in "charleston" mode (rejects jokers/blanks)
     * 2. Register button callback to validate and get selection
     * 3. Auto-enable/disable button based on selection count
     * 4. When user clicks "Pass Tiles", validate count and convert to TileData[]
     * 5. Clear selection and invoke GameController callback
     *
     * @see desktop/ADAPTER_PATTERNS.md for pattern documentation
     */
    handleCharlestonPassPrompt(options, callback) {
        const {direction, requiredCount} = options;

        printInfo(`Select ${requiredCount} tiles to pass ${direction}`);

        this.selectionManager.requestSelection({
            min: requiredCount,
            max: requiredCount,
            mode: "charleston"
        }).then(selection => {
            const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
            if (callback) {
                callback(tileDatas);
            }
        }).catch((error) => {
            console.warn("Charleston selection cancelled:", error);
            callback?.([]);
        });
    }

    /**
     * Handle Charleston continue query - Pattern B (Button-Based)
     *
     * Prompts the human player to decide whether to continue to the next Charleston
     * phase (Charleston 2 or optional Charleston 3) or skip to courtesy.
     * Uses ButtonManager for Yes/No buttons.
     *
     * @param {Function} callback - GameController callback with boolean (true=continue, false=skip)
     *
     * @architecture Pattern B (Button-Based Prompt)
     * Flow:
     * 1. Set button text to "No" and "Yes"
     * 2. Show and enable both buttons
     * 3. Register callback for each: button1="No", button2="Yes"
     * 4. User clicks → hide buttons and invoke callback with boolean
     *
     * @see desktop/ADAPTER_PATTERNS.md for pattern documentation
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
     * Handle courtesy vote prompt - Pattern C (Dialog-Based) ✅ GOOD EXAMPLE
     *
     * Prompts the human player to vote on how many tiles (0-3) to exchange during
     * the optional courtesy pass phase.
     * Uses DialogManager for modal overlay.
     *
     * @param {Function} callback - GameController callback with number (0-3)
     *
     * @architecture Pattern C (Dialog-Based Prompt)
     * Flow:
     * 1. DialogManager creates modal overlay with 4 buttons (0, 1, 2, 3 tiles)
     * 2. User clicks button → DialogManager resolves callback
     * 3. DialogManager removes overlay and re-enables game input
     *
     * @note This is the IDEAL pattern for prompt handlers - clean delegation to manager.
     *       Other handlers should aspire to this simplicity.
     *
     * @see desktop/ADAPTER_PATTERNS.md for pattern documentation
     */
    handleCourtesyVotePrompt(callback) {
        this.dialogManager.showCourtesyVoteDialog((result) => {
            if (callback) callback(result);
        });
    }

    /**
     * Handle courtesy pass prompt - Pattern C (Dialog-Based)
     *
     * Prompts the human player to select tiles for the courtesy pass exchange.
     * Uses DialogManager for modal overlay.
     *
     * @param {Object} options - Prompt options
     * @param {number} options.maxTiles - Maximum tiles to exchange (based on vote result)
     * @param {Function} callback - GameController callback with user choice
     *
     * @architecture Pattern C (Dialog-Based Prompt)
     * Flow:
     * 1. DialogManager creates modal with "Cancel" and "Exchange N Tiles" buttons
     * 2. User clicks button → DialogManager resolves callback
     * 3. DialogManager removes overlay
     *
     * @see desktop/ADAPTER_PATTERNS.md for pattern documentation
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
        const {minTiles = 1, maxTiles = 3, mode} = options || {};

        if (!this.selectionManager) {
            callback?.([]);
            return;
        }

        printInfo(`Select ${minTiles}–${maxTiles} tiles`);

        this.selectionManager.requestSelection({
            min: minTiles,
            max: maxTiles,
            mode: mode || (maxTiles === 1 ? "play" : "courtesy")
        }).then(selection => {
            const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
            callback?.(tileDatas);
        }).catch(() => {
            callback?.([]);
        });
    }

    /**
     * Safely get player name, handling undefined playerInfo
     */
    getPlayerName(playerIndex) {
        if (playerIndex < 0 || playerIndex >= this.table.players.length) {
            return `Player ${playerIndex}`;
        }
        if (this.gameController && Array.isArray(this.gameController.players)) {
            const gcPlayer = this.gameController.players[playerIndex];
            if (gcPlayer && gcPlayer.name) {
                return gcPlayer.name;
            }
        }
        const player = this.table.players[playerIndex];
        if (player && player.playerInfo && player.playerInfo.name) {
            return player.playerInfo.name;
        }
        return `Player ${playerIndex}`;
    }

    /**
     * Cleanup adapter (remove event listeners, etc.)
     */
    destroy() {
        this.gameController.clear();  // Remove all event listeners
        if (this.dialogManager) {
            this.dialogManager.closeDialog();
        }
        // TODO: delete messy manual cleanup once adapter delegates lifespan to managers.
    }

    autoSortHumanHand() {
        const humanPlayer = this.table.players[PLAYER.BOTTOM];
        if (!humanPlayer || !humanPlayer.hand || typeof humanPlayer.hand.sortSuitHidden !== "function") {
            return;
        }
        humanPlayer.hand.sortSuitHidden();
        this.handRenderer.showHand(PLAYER.BOTTOM, true);
    }

    setPendingHumanGlowTile(tile) {
        if (tile) {
            this.pendingHumanGlowTile = tile;
        }
    }

    applyHumanDrawGlow() {
        if (!this.pendingHumanGlowTile) {
            return;
        }
        if (this.activeHumanGlowTile && this.activeHumanGlowTile !== this.pendingHumanGlowTile) {
            this.activeHumanGlowTile.removeGlowEffect();
        }
        if (typeof this.pendingHumanGlowTile.addGlowEffect === "function") {
            this.pendingHumanGlowTile.addGlowEffect(this.scene, 0x1e3a8a, 0.5, 10);
        }
        this.activeHumanGlowTile = this.pendingHumanGlowTile;
        this.pendingHumanGlowTile = null;
    }

    clearHumanDrawGlow(tile = null) {
        const target = tile ?? this.activeHumanGlowTile;
        if (target && typeof target.removeGlowEffect === "function") {
            target.removeGlowEffect();
        }
        if (!tile || target === tile) {
            if (target === this.pendingHumanGlowTile) {
                this.pendingHumanGlowTile = null;
            }
            if (target === this.activeHumanGlowTile) {
                this.activeHumanGlowTile = null;
            }
        }
    }

}
