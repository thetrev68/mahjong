import { HandRenderer } from "./renderers/HandRenderer.js";
import { HandSelectionManager } from "./renderers/HandSelectionManager.js";
import { HandEventCoordinator } from "./renderers/HandEventCoordinator.js";
import { DiscardPile } from "./components/DiscardPile.js";
import { OpponentBar } from "./components/OpponentBar.js";
import { PlayerRack } from "./components/PlayerRack.js";
import { AnimationController } from "./animations/AnimationController.js";
import { CharlestonAnimationSequencer } from "./animations/CharlestonAnimationSequencer.js";
import { DealingAnimationSequencer } from "./animations/DealingAnimationSequencer.js";
import { DiscardAnimationSequencer } from "./animations/DiscardAnimationSequencer.js";
import { HomePageTiles } from "./components/HomePageTiles.js";
import { DiscardSelectionModal } from "./components/DiscardSelectionModal.js";
import { GameEndModal } from "./components/GameEndModal.js";
import { PLAYER, STATE, SUIT } from "../constants.js";
import { TileData } from "../core/models/TileData.js";
import { HandData } from "../core/models/HandData.js";
import { getElementCenterPosition } from "./utils/positionUtils.js";

const HUMAN_PLAYER = PLAYER.BOTTOM ?? 0;

/**
 * MobileRenderer
 *
 * Listens to GameController events and routes them to HTML/CSS components.
 * Mirrors the "adapter" role that PhaserAdapter plays on desktop.
 */
export class MobileRenderer {
    /**
     * @param {Object} options
     * @param {GameController} options.gameController
     * @param {HTMLElement} options.handContainer
     * @param {HTMLElement} options.discardContainer
     * @param {HTMLElement} options.statusElement
     * @param {Object} options.opponentContainers
     * @param {HTMLElement} options.opponentContainers.left
     * @param {HTMLElement} options.opponentContainers.top
     * @param {HTMLElement} options.opponentContainers.right
     * @param {HTMLElement} [options.promptRoot]
     * @param {HTMLElement} [options.playerRackContainer]
     */
    constructor(options = {}) {
        if (!options.gameController) {
            throw new Error("MobileRenderer requires a GameController instance");
        }

        this.gameController = options.gameController;
        this.statusElement = options.statusElement || null;
        this.subscriptions = [];

        // Initialize HandRenderer with new architecture (dependency injection)
        this.handRenderer = new HandRenderer(options.handContainer);
        this.selectionManager = new HandSelectionManager();
        this.eventCoordinator = new HandEventCoordinator(
            options.gameController,
            this.handRenderer,
            this.selectionManager,
            this // Pass MobileRenderer so it can check animation flags
        );

        // Inject dependencies into HandRenderer
        this.handRenderer.setSelectionManager(this.selectionManager);
        this.handRenderer.setEventCoordinator(this.eventCoordinator);

        this.discardPile = new DiscardPile(options.discardContainer);
        this.playerRack = new PlayerRack(document.getElementById("player-rack-container"));
        const homePageTilesContainer = document.getElementById("home-page-tiles");
        if (!homePageTilesContainer) {
            console.warn("MobileRenderer: home-page-tiles container not found");
            this.homePageTiles = null;
        } else {
            this.homePageTiles = new HomePageTiles(homePageTilesContainer);
            this.homePageTiles.render();
        }
        this.animationController = new AnimationController();

        // Initialize Charleston animation sequencer
        this.charlestonSequencer = new CharlestonAnimationSequencer(
            this.gameController,
            this.handRenderer,
            this.animationController,
            () => this.eventCoordinator?.applyHintRecommendations()
        );

        // Initialize Dealing animation sequencer
        this.dealingSequencer = new DealingAnimationSequencer(
            this.gameController,
            this.handRenderer,
            this.animationController
        );

        // Initialize Discard animation sequencer
        this.discardSequencer = new DiscardAnimationSequencer(
            this.gameController,
            this.handRenderer,
            this.animationController,
            this.discardPile,
            this // Pass MobileRenderer for animation flags
        );

        // Track if we just completed dealing animation to avoid re-render
        this.justCompletedDealingAnimation = false;
        // Track if dealing animation is currently running
        this.isDealingAnimationRunning = false;

        // Configure selection behavior via HandSelectionManager
        this.selectionManager.setSelectionBehavior({
            mode: "single",
            maxSelectable: 1,
            allowToggle: true
        });
        this.selectionManager.setSelectionListener(() => {
            const selectionState = this.selectionManager.getSelectionState(this.latestHandSnapshot);
            this.handRenderer.applySelectionIndices(selectionState.indices);
            this.onHandSelectionChange(selectionState);
        });

        this.opponentBars = this.createOpponentBars(options.opponentContainers || {});

        this.actionButton = document.getElementById("new-game-btn");
        this.drawButton = document.getElementById("draw-btn");
        this.sortButton = document.getElementById("sort-btn");
        this.jokerButton = document.getElementById("exchange-joker-btn");
        this.mahjongButton = document.getElementById("mahjong-btn");

        this.promptUI = this.createPromptUI(options.promptRoot || document.body);
        this.pendingPrompt = null;
        this.latestHandSnapshot = null;
        this.previousHandSnapshot = null;

        this.setupButtonListeners();
        this.registerEventListeners();

        if (this.sortButton) {
            this.sortButton.style.display = "none";
        }
        if (this.drawButton) {
            this.drawButton.style.display = "none";
        }



        this.updateActionButton({ label: "Start", onClick: () => this.startGame() });
    }

    destroy() {
        this.subscriptions.forEach(unsub => {
            if (typeof unsub === "function") {
                unsub();
            }
        });
        this.subscriptions = [];
        this.handRenderer?.destroy();
        this.selectionManager = null;
        this.eventCoordinator?.destroy();
        this.eventCoordinator = null;
        this.discardPile?.destroy();
        this.homePageTiles?.destroy();
        this.promptUI?.container?.remove();
        this.pendingPrompt = null;
    }

    registerEventListeners() {
        const gc = this.gameController;
        this.subscriptions.push(gc.on("GAME_STARTED", (data) => this.onGameStarted(data)));
        this.subscriptions.push(gc.on("GAME_ENDED", (data) => this.onGameEnded(data)));
        this.subscriptions.push(gc.on("STATE_CHANGED", (data) => this.onStateChanged(data)));
        this.subscriptions.push(gc.on("TILES_DEALT", (data) => this.onTilesDealt(data)));
        // HAND_UPDATED is now handled exclusively by HandEventCoordinator
        this.subscriptions.push(gc.on("TURN_CHANGED", (data) => this.onTurnChanged(data)));
        this.subscriptions.push(gc.on("TILE_DISCARDED", (data) => this.onTileDiscarded(data)));
        this.subscriptions.push(gc.on("DISCARD_CLAIMED", (data) => this.onTileClaimed(data)));
        this.subscriptions.push(gc.on("TILES_EXPOSED", (data) => this.onTilesExposed(data)));
        this.subscriptions.push(gc.on("JOKER_SWAPPED", (data) => this.onJokerSwapped(data)));
        this.subscriptions.push(gc.on("BLANK_EXCHANGED", (data) => this.onBlankExchanged(data)));
        this.subscriptions.push(gc.on("MESSAGE", (data) => this.onMessage(data)));
        this.subscriptions.push(gc.on("CHARLESTON_PHASE", (data) => {
            this.updateStatus(`Charleston ${data.phase}: Pass ${data.round}`);
        }));
        this.subscriptions.push(gc.on("CHARLESTON_PASS", (data) => this.onCharlestonPass(data)));
        this.subscriptions.push(gc.on("TILES_RECEIVED", (data) => this.onTilesReceived(data)));
        this.subscriptions.push(gc.on("COURTESY_VOTE", (data) => {
            this.updateStatus(`Player ${data.player} voted ${data.vote} for courtesy pass`);
        }));
        this.subscriptions.push(gc.on("COURTESY_PASS", () => {
            this.refreshOpponentBars();
        }));
        this.subscriptions.push(gc.on("UI_PROMPT", (data) => this.handleUIPrompt(data)));
    }

    createOpponentBars(containers) {
        const bars = [];
        const mapping = [
            { key: "top", playerIndex: PLAYER.RIGHT ?? 1 },   // North
            { key: "left", playerIndex: PLAYER.TOP ?? 2 },    // West
            { key: "right", playerIndex: PLAYER.LEFT ?? 3 }   // South
        ];

        mapping.forEach(({ key, playerIndex }) => {
            const container = containers[key];
            if (!container) {
                return;
            }
            const player = this.gameController.players[playerIndex];
            const bar = new OpponentBar(container, player);
            bars.push({ playerIndex, bar });
        });

        return bars;
    }

    createPromptUI(parent) {
        const container = document.createElement("div");
        container.className = "mobile-prompt hidden";

        const message = document.createElement("div");
        message.className = "mobile-prompt__message";
        container.appendChild(message);

        const hint = document.createElement("div");
        hint.className = "mobile-prompt__hint";
        container.appendChild(hint);

        const actions = document.createElement("div");
        actions.className = "mobile-prompt__actions";
        container.appendChild(actions);

        parent.appendChild(container);

        return {
            container,
            message,
            hint,
            actions,
            primaryButton: null
        };
    }

    setupButtonListeners() {
        const drawBtn = this.drawButton;
        const sortBtn = this.sortButton;
        const swapBlankBtn = document.getElementById("swap-blank-btn");
        const jokerBtn = this.jokerButton;

        if (drawBtn) drawBtn.addEventListener("click", () => this.onDrawClicked());
        if (sortBtn) sortBtn.addEventListener("click", () => this.onSortClicked());
        if (swapBlankBtn) swapBlankBtn.addEventListener("click", () => this.handleBlankSwap());
        if (jokerBtn) jokerBtn.addEventListener("click", () => this.handleJokerSwap());
        if (this.mahjongButton) this.mahjongButton.addEventListener("click", () => this.declareMahjong());
        // Note: actionButton is controlled exclusively by updateActionButton method
        // to avoid double-binding with onclick assignments
    }

    onDrawClicked() {
        // Manual draw trigger for user control
        if (this.canDrawTile()) {
            this.gameController.drawTile();
        }
    }

    onSortClicked() {
        if (!this.latestHandSnapshot || !Array.isArray(this.latestHandSnapshot.tiles)) {
            return;
        }

        // Collect tiles that currently have glow (tile--newly-drawn class)
        const glowedTileIndices = new Set();
        this.handRenderer.tiles.forEach((tileEl, index) => {
            if (tileEl && tileEl.classList.contains("tile--newly-drawn")) {
                // Store the tile's unique index to reapply glow after sort
                const tileData = this.latestHandSnapshot.tiles[index];
                if (tileData && typeof tileData.index === "number") {
                    glowedTileIndices.add(tileData.index);
                }
            }
        });

        // Clone the current hand and use HandData's own sort helper for consistency
        const sortedHand = typeof this.latestHandSnapshot.clone === "function"
            ? this.latestHandSnapshot.clone()
            : HandData.fromJSON(this.latestHandSnapshot);

        if (typeof sortedHand.sortBySuit === "function") {
            sortedHand.sortBySuit();
        } else {
            sortedHand.tiles.sort((a, b) => {
                if (a.suit !== b.suit) {
                    return a.suit - b.suit;
                }
                return a.number - b.number;
            });
        }

        this.latestHandSnapshot = sortedHand;

        // Find indices of glowed tiles in the sorted hand
        const newGlowIndices = [];
        sortedHand.tiles.forEach((tile, index) => {
            if (tile && glowedTileIndices.has(tile.index)) {
                newGlowIndices.push(index);
            }
        });

        // Render with glow preserved on the same tiles
        if (newGlowIndices.length > 0) {
            this.handRenderer.renderWithGlow(sortedHand, newGlowIndices);
        } else {
            this.handRenderer.render(sortedHand);
        }

        this.animationController.animateHandSort(this.handRenderer.container);
    }

    canDrawTile() {
        const state = this.gameController?.state ?? this.gameController?.gameState;
        return this.gameController.currentPlayer === HUMAN_PLAYER &&
            (state === STATE.LOOP_PICK_FROM_WALL || state === "LOOP_PICK_FROM_WALL");
    }

    /**
     * Check if joker swap is available for the human player
     * @returns {boolean} True if joker swap is possible
     */
    canSwapJoker() {
        const humanPlayer = this.gameController.players?.[HUMAN_PLAYER];
        if (!humanPlayer) return false;

        // Find all exposed jokers across all players
        let hasExposedJokers = false;
        for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
            const player = this.gameController.players[playerIndex];
            for (const exposure of player.hand.exposures) {
                if (exposure.tiles.some(tile => tile.suit === SUIT.JOKER)) {
                    hasExposedJokers = true;
                    break;
                }
            }
            if (hasExposedJokers) break;
        }

        if (!hasExposedJokers) return false;

        // Check if human has non-joker tiles that could match
        const hasMatchingTiles = humanPlayer.hand.tiles.some(tile =>
            tile.suit !== SUIT.JOKER
        );

        return hasMatchingTiles;
    }

    /**
     * Check if mahjong is available for the human player
     * @returns {boolean} True if player has a valid winning hand
     */
    canDeclareMahjong() {
        const humanPlayer = this.gameController.players?.[HUMAN_PLAYER];
        if (!humanPlayer) return false;

        // Must have exactly 14 tiles
        if (humanPlayer.hand.getLength() !== 14) return false;

        // Check if hand is valid using card validator
        if (!this.gameController.cardValidator) return false;

        const tiles = humanPlayer.hand.tiles;
        const allHidden = humanPlayer.hand.exposures.length === 0;
        const validationResult = this.gameController.cardValidator.validateHand(tiles, allHidden);

        return validationResult && validationResult.valid;
    }

    /**
     * Declare mahjong (player wins)
     */
    declareMahjong() {
        if (!this.canDeclareMahjong()) {
            this.showAlert("Invalid Hand", "You don't have a valid mahjong hand.");
            return;
        }

        // Set game result and end game
        this.gameController.gameResult.mahjong = true;
        this.gameController.gameResult.winner = HUMAN_PLAYER;
        this.gameController.endGame("mahjong");
    }

    /**
     * Update joker swap button visibility based on game state
     */
    updateJokerSwapButton() {
        const jokerBtn = this.jokerButton;
        if (!jokerBtn) return;

        const canSwap = this.canSwapJoker();
        const invalidStates = [STATE.INIT, STATE.DEAL, STATE.CHARLESTON1, STATE.CHARLESTON2,
                              STATE.CHARLESTON_QUERY, STATE.COURTESY_QUERY, STATE.COURTESY];
        const isValidState = !invalidStates.includes(this.gameController.state);

        jokerBtn.style.display = (canSwap && isValidState) ? "flex" : "none";
    }

    /**
     * Update blank swap button visibility based on game state
     */
    updateBlankSwapButton() {
        const swapBtn = document.getElementById("swap-blank-btn");
        if (!swapBtn) return;

        const player = this.gameController.players?.[HUMAN_PLAYER];
        const hasBlankTiles = player?.hand?.tiles?.some(tile => tile.isBlank()) ?? false;
        const hasDiscards = this.gameController.discards.length > 0;
        const isValidState = this.gameController.state === STATE.LOOP_CHOOSE_DISCARD;
        const blankRuleEnabled = this.gameController.settings?.useBlankTiles ?? false;

        swapBtn.style.display = (hasBlankTiles && hasDiscards && isValidState && blankRuleEnabled) ? "flex" : "none";
    }

    /**
     * Update mahjong button visibility based on game state
     */
    updateMahjongButton() {
        const mahjongBtn = this.mahjongButton;
        if (!mahjongBtn) return;

        const canDeclare = this.canDeclareMahjong();
        const invalidStates = [STATE.INIT, STATE.DEAL, STATE.CHARLESTON1, STATE.CHARLESTON2,
                              STATE.CHARLESTON_QUERY, STATE.COURTESY_QUERY, STATE.COURTESY];
        const isValidState = !invalidStates.includes(this.gameController.state);
        const isHumanTurn = this.gameController.currentPlayer === HUMAN_PLAYER;

        mahjongBtn.style.display = (canDeclare && isValidState && isHumanTurn) ? "flex" : "none";
    }

    /**
     * Handle joker swap button click
     * Calls GameController's onExchangeJoker method which auto-selects first available exchange
     */
    handleJokerSwap() {
        try {
            const success = this.gameController.onExchangeJoker();

            if (!success) {
                // Error messages already emitted by GameController via MESSAGE event
                // No additional UI feedback needed here
            }
        } catch (error) {
            this.updateStatus(`Joker swap failed: ${error.message}`);
            console.error("Joker swap error:", error);
        }
    }

    /**
     * Restore saved prompt state after blank swap interruption
     * @private
     * @param {Object} savedPrompt - The saved pending prompt object
     * @param {boolean} clearSelection - Whether to clear hand selection
     */
    _restorePromptState(savedPrompt, clearSelection = false) {
        this.pendingPrompt = savedPrompt;
        if (savedPrompt) {
            this.selectionManager.setSelectionBehavior({
                mode: savedPrompt.max === 1 ? "single" : "multiple",
                maxSelectable: savedPrompt.max,
                allowToggle: true,
                validationMode: "play"
            });
            if (clearSelection) {
                this.selectionManager.clearSelection(true);
            }
        }
    }

    /**
     * Handle blank tile swap - exchange blank in hand with discard pile tile
     */
    async handleBlankSwap() {
        const player = this.gameController.players[HUMAN_PLAYER];

        // Validate blank tiles exist in hand
        const blankTiles = player.hand.tiles.filter(tile => tile.isBlank());
        if (blankTiles.length === 0) {
            this.showAlert("No Blank Tiles", "You don't have any blank tiles to swap.");
            return;
        }

        // Validate discard pile has tiles
        if (this.gameController.discards.length === 0) {
            this.showAlert("No Discards", "The discard pile is empty.");
            return;
        }

        // Save the current pending prompt so we can restore it after swap
        const savedPrompt = this.pendingPrompt;

        try {
            // Step 1: Prompt user to select blank tile from hand
            const blankTile = await new Promise((resolve) => {
                this.startTileSelectionPrompt({
                    title: "Select a blank tile to swap",
                    hint: "Choose which blank to exchange",
                    min: 1,
                    max: 1,
                    validationMode: "blank-only",
                    confirmLabel: "Select Blank",
                    cancelLabel: "Cancel",
                    callback: (tiles) => {
                        resolve(tiles && tiles.length > 0 ? tiles[0] : null);
                    }
                });
            });

            if (!blankTile) {
                // Restore original prompt if user cancelled
                this._restorePromptState(savedPrompt);
                this.updateStatus("Blank swap cancelled");
                return;
            }

            // Step 2: Prompt user to select discard tile
            const discardTile = await this.showDiscardSelection();

            if (!discardTile) {
                // Restore original prompt if user cancelled
                this._restorePromptState(savedPrompt);
                this.updateStatus("Blank swap cancelled");
                return;
            }

            // Step 3: Perform swap via GameController
            const success = this.gameController.exchangeBlankWithDiscard(
                blankTile,
                discardTile
            );

            if (success) {
                this.showAlert("Swap Successful", `Blank exchanged for ${discardTile.getText()}`);
                // TODO: Add animation - blank tile flying to discard pile, discard tile flying to hand

                // Restore the original discard prompt
                this._restorePromptState(savedPrompt, true);
            }
        } catch (error) {
            // Restore original prompt on error
            this._restorePromptState(savedPrompt);
            this.showAlert("Swap Failed", error.message);
            console.error("Blank swap error:", error);
        }
    }

    /**
     * Show modal to select a tile from discard pile
     * @returns {Promise<TileData|null>} Selected tile or null if cancelled
     */
    showDiscardSelection() {
        return new Promise((resolve) => {
            // Get available discards (excluding jokers per game rules)
            const availableDiscards = this.gameController.discards.filter(
                tile => !tile.isJoker()
            );

            if (availableDiscards.length === 0) {
                this.showAlert("No Valid Discards", "No tiles available to swap (jokers cannot be swapped).");
                resolve(null);
                return;
            }

            // Show modal
            new DiscardSelectionModal(
                availableDiscards,
                (selectedTile) => resolve(selectedTile),
                () => resolve(null)
            );
        });
    }

    /**
     * Show a simple alert modal
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     */
    showAlert(title, message) {
        // Reuse existing choice prompt for alerts
        this.showChoicePrompt({
            title: title,
            hint: message,
            options: [
                { label: "OK", value: true, primary: true }
            ],
            onSelect: () => {} // No-op
        });
    }

    onGameStarted() {
        // Hide hand container until dealing animation is ready
        if (this.handRenderer?.container) {
            this.handRenderer.container.style.visibility = "hidden";
        }

        // Trigger home page animation and store promise
        if (this.homePageTiles) {
            this.homePageAnimationPromise = this.homePageTiles.animateStart().catch(err => {
                console.error("HomePageTiles animation error:", err);
            });
        }
        this.discardPile.clear();
        this.resetHandSelection();
        this.updateStatus("Game started - dealing tiles...");
        this.refreshOpponentBars();
        this.updateActionButton({ label: "Start", onClick: () => this.startGame(), disabled: true, visible: true });
    }

    onGameEnded(data) {
        const reason = data?.reason ?? "end";
        let title = "";
        let message = "";

        if (reason === "mahjong") {
            const winner = this.gameController.players?.[data.winner];
            title = "Mahjong!";
            message = winner ? `${winner.name} wins!` : "Mahjong!";
            this.updateStatus(message);
        } else if (reason === "wall_game") {
            title = "Wall Game";
            message = "No tiles remaining. No winner.";
            this.updateStatus("Wall game - no winner");
        } else {
            title = "Game Ended";
            message = "The game has ended.";
            this.updateStatus("Game ended");
        }

        // Show modal dialog
        if (title) {
            new GameEndModal(title, message, () => {
                // Modal closed - cleanup
            });
        }

        this.hidePrompt();
        this.resetHandSelection();
        this.updateActionButton({ label: "Start", onClick: () => this.startGame(), disabled: false, visible: true });
    }

    onStateChanged(data) {
        if (!data) {
            return;
        }
        // Debug state changes removed - status bar now only shows user-relevant messages

        const drawBtn = this.drawButton;
        const sortBtn = this.sortButton;

        if (drawBtn) {
            const canDraw = this.canDrawTile();
            drawBtn.style.display = canDraw ? "flex" : "none";
            drawBtn.disabled = !canDraw;
        }

        if (sortBtn) {
            const isLoopState = data.newState >= STATE.LOOP_PICK_FROM_WALL && data.newState <= STATE.LOOP_EXPOSE_TILES_COMPLETE;
            sortBtn.style.display = isLoopState ? "flex" : "none";
        }

        this.updateJokerSwapButton();
        this.updateBlankSwapButton();
        this.updateMahjongButton();
        this.updateActionButtonStateForGame(data.newState);
    }

    // onHandUpdated is now handled exclusively by HandEventCoordinator
    // This eliminates the duplicate listener code smell

    /**
     * Handle tiles dealt event with animation
     * @param {Object} data - Deal sequence data
     */
    async onTilesDealt(data = {}) {
        // Set flags to prevent any re-renders during dealing
        this.isDealingAnimationRunning = true;
        this.justCompletedDealingAnimation = true;

        // Wait for home page animation to complete before starting dealing
        if (this.homePageAnimationPromise) {
            await this.homePageAnimationPromise;
            this.homePageAnimationPromise = null;
        }

        // Make hand visible now that we're ready to animate
        if (this.handRenderer?.container) {
            this.handRenderer.container.style.visibility = "visible";
        }

        try {
            // Animate dealing for human player
            await this.dealingSequencer.animateDeal(data.sequence);
        } finally {
            // Clear flags - animation is done (or failed)
            this.isDealingAnimationRunning = false;

            // Initialize latestHandSnapshot with current hand after dealing
            // This is critical for Charleston tile selection to work properly
            const humanPlayer = this.gameController.players[0];
            if (humanPlayer && humanPlayer.hand) {
                this.latestHandSnapshot = humanPlayer.hand.clone();
            }

            // Update opponent bars (no animation for AI players)
            this.opponentBars.forEach(({ playerIndex, bar }) => {
                if (playerIndex !== HUMAN_PLAYER) {
                    const opponentPlayer = this.gameController.players[playerIndex];
                    if (opponentPlayer && bar) {
                        bar.update(opponentPlayer);
                    }
                }
            });

            // Note: DEALING_COMPLETE is now emitted by dealingSequencer.onSequenceComplete()
        }
    }

    // _findNewlyReceivedTiles has been moved to HandEventCoordinator

    onTurnChanged(data) {
        const currentPlayer = data?.currentPlayer ?? this.gameController.currentPlayer;
        this.gameController.players.forEach((player, index) => {
            player.isCurrentTurn = index === currentPlayer;
        });
        this.refreshOpponentBars();
        if (currentPlayer === HUMAN_PLAYER) {
            this.updateStatus("Your turn");
            // Animate turn start for human player (visual cue on hand or screen edge)
            // For now, we can animate the hand container slightly
            this.animationController.animateTurnStart(this.handRenderer.container);
        } else {
            // Animate opponent turn start
            const bar = this.opponentBars.find(ob => ob.playerIndex === currentPlayer);
            if (bar && bar.bar.container) {
                this.animationController.animateTurnStart(bar.bar.container);
            }
        }
        this.updateActionButtonStateForGame(this.gameController.state);
    }

    async onTileDiscarded(data) {
        // Defensive guard: return early if data or tile is falsy
        if (!data?.tile) {
            return;
        }

        try {
            // Route to sequencer for animation
            await this.discardSequencer.animateDiscard(data);
        } catch (error) {
            // Log the error with full details
            console.error("Discard animation failed:", error);
            
            // Apply non-animated fallback update to keep UI consistent
            try {
                // Add the tile to discard pile directly
                this.discardPile.addTile(data.tile);
            } catch (fallbackError) {
                console.error("Failed to apply fallback discard update:", fallbackError);
            }
        }

        // Ensure updateBlankSwapButton runs regardless of animation success
        this.updateBlankSwapButton();
    }

    /**
     * Handle Charleston pass animation
     * @param {Object} data - Charleston pass event data
     */
    onCharlestonPass(data) {
        // Only animate for human player
        if (data.fromPlayer !== HUMAN_PLAYER) {
            return;
        }

        // Defensive guard: ensure required data is available
        if (!data || !this.charlestonSequencer) {
            console.warn("MobileRenderer: Missing required data for Charleston pass animation");
            return;
        }

        try {
            // Get indices of tiles being passed from selection
            // Pass current hand data to ensure indices are accurate
            const passingIndices = Array.from(this.selectionManager.getSelectedTileIndices(this.latestHandSnapshot));

            // Trigger animation sequence
            this.charlestonSequencer.animateCharlestonPass(data, passingIndices);
        } catch (error) {
            console.error("Charleston pass animation failed:", error);
            // Reset selection on error to prevent UI being stuck
            this.selectionManager.clearSelection();
        }
    }

    /**
     * Handle tiles received animation
     * @param {Object} data - Tiles received event data
     */
    onTilesReceived(data) {
        // Only animate for human player
        if (data.player !== HUMAN_PLAYER) {
            return;
        }

        // Only animate for Charleston context
        if (data.animation?.type !== "charleston-receive") {
            return;
        }

        // TEMPORARY FIX: Disable Charleston animation sequencer
        // HandEventCoordinator already handles the glow correctly via HAND_UPDATED event
        // The animation sequencer was interfering by clearing tiles after glow was applied
        console.log("[MobileRenderer] onTilesReceived: Skipping Charleston animation (HandEventCoordinator handles glow)");
        return;
    }

    /**
     * Find indices of received tiles in current hand
     * @param {Array} receivedTiles - Tiles that were received
     * @returns {Array<number>} Indices of received tiles in hand
     * @private
     */
    _findReceivedTileIndices(receivedTiles) {
        if (!this.handRenderer.currentHandData) {
            return [];
        }

        const handTiles = this.handRenderer.currentHandData.tiles;
        const indices = [];

        // Build set of received tile IDs for O(1) lookup
        const receivedTileIds = new Set(
            receivedTiles
                .map(t => t.index)
                .filter(idx => typeof idx === "number" && !isNaN(idx))
        );

        // Find positions in hand that match the received tile IDs
        for (let i = 0; i < handTiles.length; i++) {
            const handTile = handTiles[i];
            if (handTile?.index !== undefined && receivedTileIds.has(handTile.index)) {
                indices.push(i);
            }
        }

        return indices;
    }

    /**
     * Handle tile claiming animation
     * @param {Object} data - Claim event data with {claimingPlayer, tile, claimType}
     */
    async onTileClaimed(data) {
        // Only animate for human player claims
        if (data?.claimingPlayer !== HUMAN_PLAYER) {
            // For non-human players, just remove from discard pile
            this.discardPile.removeLatestDiscard();
            return;
        }

        // Validate required components
        if (!this.handRenderer || !this.animationController || !data?.tile) {
            console.warn("MobileRenderer: Missing required components for claim animation");
            this.discardPile.removeLatestDiscard();
            return;
        }

        // Track whether discard has been removed to prevent double-removal
        let removedDiscard = false;
        let floatingTile = null;

        try {
            // Get the last discard element before removing it
            const lastDiscardElement = this.discardPile.getLatestDiscardElement();
            if (!lastDiscardElement) {
                console.warn("MobileRenderer: No discard element found for claim animation");
                this.discardPile.removeLatestDiscard();
                removedDiscard = true;
                return;
            }

            // Get the position of the discard tile before it's removed
            const startPos = getElementCenterPosition(lastDiscardElement);

            // Create a floating tile element for animation
            floatingTile = await this._createFloatingTile(data.tile, startPos);
            if (!floatingTile) {
                this.discardPile.removeLatestDiscard();
                removedDiscard = true;
                return;
            }

            // Remove the tile from discard pile now that we have the floating element
            this.discardPile.removeLatestDiscard();
            removedDiscard = true;

            // Get target position (hand container center)
            const handContainer = this.handRenderer.container;
            const targetPos = handContainer ? getElementCenterPosition(handContainer) : null;

            if (!targetPos) {
                // Cleanup and exit if no target
                floatingTile.remove();
                floatingTile = null;
                return;
            }

            // Animate the floating tile to the hand
            await this.animationController.animateTileClaim(
                floatingTile,
                data.claimingPlayer,
                targetPos,
                handContainer
            );

            // Remove the floating tile after animation completes
            floatingTile.remove();
            floatingTile = null;

        } catch (error) {
            console.error("MobileRenderer: Error during claim animation:", error);

            // Clean up floating tile if it exists
            if (floatingTile && floatingTile.parentNode) {
                floatingTile.remove();
            }

            // Only remove discard if it wasn't already removed
            if (!removedDiscard) {
                this.discardPile.removeLatestDiscard();
            }
        }
    }

    /**
     * Handle tiles exposed event
     * When exposures change, joker availability might change
     */
    onTilesExposed(data) {
        // Refresh opponent bars to show updated exposures
        this.refreshOpponentBars();

        // Update joker swap button visibility as exposures may have changed
        this.updateJokerSwapButton();
        // Update blank swap button visibility as hand may have changed
        this.updateBlankSwapButton();
        // Update mahjong button visibility as hand may have changed
        this.updateMahjongButton();

        // Apply blue glow to exposed tiles for human player
        if (data?.player === HUMAN_PLAYER && data?.tiles && this.playerRack && this.animationController) {
            // Find the newly created exposure in the player rack
            // The tiles will be in the exposure display, not the hand
            const exposedTileIndices = data.tiles.map(t => t.index).filter(idx => typeof idx === "number");

            // Apply glow to exposed tiles in the player rack
            setTimeout(() => {
                const exposureTiles = this.playerRack.container.querySelectorAll(".exposure-tile");
                exposureTiles.forEach(tileElement => {
                    const tileIndex = parseInt(tileElement.dataset.tileIndex);
                    if (exposedTileIndices.includes(tileIndex)) {
                        this.animationController.applyReceivedTileGlow(tileElement);
                    }
                });
            }, 100);
        }
    }

    /**
     * Handle joker swapped event
     * GameController has already updated HandData and emitted HAND_UPDATED events
     * This handler is just for logging and user feedback
     * @param {Object} data - Joker swap event data {player, exposureIndex, jokerIndex, replacementTile, recipient}
     */
    onJokerSwapped(data) {
        const {player, replacementTile} = data;

        // GameController has already updated HandData and emitted HAND_UPDATED events
        // HandRenderer will handle the visual update automatically
        // Just provide user feedback

        const ownerName = this.getPlayerName(player);
        const replacementData = replacementTile instanceof TileData
            ? replacementTile
            : (replacementTile ? TileData.fromJSON(replacementTile) : null);

        if (replacementData) {
            this.updateStatus(`${ownerName} swapped a joker for ${replacementData.getText()}`);
        }
    }

    /**
     * Handle blank exchanged event
     * GameController has already updated HandData, discards array, and emitted HAND_UPDATED events
     * This handler provides visual feedback for the swap
     * @param {Object} data - Blank exchange event data {player, blankTile, retrievedTile, discardIndex}
     */
    onBlankExchanged(data) {
        const {player, blankTile, retrievedTile} = data;

        // GameController has already updated HandData and emitted HAND_UPDATED events
        // HandRenderer will handle the hand visual update automatically

        // Force re-render of discard pile to show the blank tile that was added
        // GameController has already updated the discards array
        if (this.discardPile.discards && this.discardPile.discards.length > 0) {
            const lastDiscardObj = this.discardPile.discards[this.discardPile.discards.length - 1];
            this.discardPile.rerender(lastDiscardObj);
        }

        // Provide user feedback
        const playerName = this.getPlayerName(player);
        const blankData = TileData.fromJSON(blankTile);
        const discardData = TileData.fromJSON(retrievedTile);

        this.updateStatus(`${playerName} exchanged ${blankData.getText()} for ${discardData.getText()}`);

        // TODO: Add animation - blank tile flying to discard pile, discard tile flying to hand
        // Animation could be triggered here using AnimationController
    }

    /**
     * Get player name for display
     * @param {number} playerIndex - Player index (0-3)
     * @returns {string} Player name
     */
    getPlayerName(playerIndex) {
        const player = this.gameController.players?.[playerIndex];
        return player?.name || `Player ${playerIndex + 1}`;
    }

    /**
     * Create a floating tile element for claim animation
     * @param {Object} tileData - Tile data with suit, number, index
     * @param {{x: number, y: number}} position - Initial position
     * @returns {Promise<HTMLElement|null>} Floating tile element
     * @private
     */
    async _createFloatingTile(tileData, position) {
        try {
            // Dynamically import MobileTile to avoid circular dependencies
            const { MobileTile } = await import("./components/MobileTile.js");

            // Create a normal-sized tile for the animation
            const mobileTile = MobileTile.createHandTile(tileData, "normal");
            const tileElement = mobileTile.createElement();

            // Style the floating tile
            tileElement.style.position = "fixed";
            tileElement.style.left = `${position.x}px`;
            tileElement.style.top = `${position.y}px`;
            tileElement.style.transform = "translate(-50%, -50%)"; // Center on position
            tileElement.style.zIndex = "9999"; // Above everything
            tileElement.style.pointerEvents = "none"; // Don't interfere with clicks
            tileElement.classList.add("floating-claim-tile");

            // Append to body so it can move freely across the viewport
            document.body.appendChild(tileElement);

            return tileElement;
        } catch (error) {
            console.error("MobileRenderer: Error creating floating tile:", error);
            return null;
        }
    }

    onMessage(data) {
        if (data?.text) {
            this.updateStatus(data.text);
        }
    }

    refreshOpponentBars() {
        this.opponentBars.forEach(({ playerIndex, bar }) => {
            const player = this.gameController.players[playerIndex];
            if (player) {
                bar.update(player);
            }
        });
    }

    updateStatus(text) {
        if (this.statusElement) {
            this.statusElement.textContent = text;
        }
    }

    handleUIPrompt(data) {
        if (!data) {
            return;
        }

        // If there's a pending prompt, auto-cancel it WITHOUT invoking callback
        // (new prompt will handle the callback)
        if (this.pendingPrompt) {
            console.warn("MobileRenderer: New prompt received while previous prompt pending. Clearing previous prompt state.");
            this.resetHandSelection();
            this.hidePrompt();
            this.pendingPrompt = null;
        }

        switch (data.promptType) {
            case "CHOOSE_DISCARD":
                this.startDiscardSelection(data.callback);
                break;
            case "CHARLESTON_PASS":
                this.startTileSelectionPrompt({
                    title: `Charleston Pass (${data.options?.direction ?? "?"})`,
                    hint: `Select ${data.options?.requiredCount ?? 3} tiles to pass`,
                    min: data.options?.requiredCount ?? 3,
                    max: data.options?.requiredCount ?? 3,
                    validationMode: "charleston",
                    confirmLabel: "Pass Tiles",
                    cancelLabel: null,
                    fallback: null,
                    callback: (tiles) => data.callback(tiles),
                    useActionButton: true
                });
                break;
            case "SELECT_TILES": {
                const minTiles = data.options?.minTiles ?? 1;
                const maxTiles = data.options?.maxTiles ?? 3;
                // Show exact count if min equals max, otherwise show range
                const defaultHint = minTiles === maxTiles
                    ? `Select exactly ${minTiles} tile${minTiles !== 1 ? "s" : ""}`
                    : `Select ${minTiles}–${maxTiles} tiles`;

                this.startTileSelectionPrompt({
                    title: data.options?.question ?? "Select tiles",
                    hint: defaultHint,
                    min: minTiles,
                    max: maxTiles,
                    validationMode: "courtesy",
                    confirmLabel: "Confirm",
                    cancelLabel: "Cancel",
                    fallback: () => this.getFallbackTiles(Math.max(1, minTiles)),
                    callback: (tiles) => data.callback(tiles)
                });
                break;
            }
            case "CLAIM_DISCARD": {
                const promptTile = data.options?.tile;
                const tileObj = promptTile instanceof TileData
                    ? promptTile
                    : (promptTile ? TileData.fromJSON(promptTile) : null);
                this.showChoicePrompt({
                    title: tileObj ? `Claim ${tileObj.getText()}?` : "Claim discard?",
                    hint: "Choose how to react",
                    options: (data.options?.options || []).map(option => ({
                        label: option,
                        value: option
                    })),
                    onSelect: (choice) => data.callback(choice)
                });
                break;
            }
            case "EXPOSE_TILES":
                this.showChoicePrompt({
                    title: "Expose selected tiles?",
                    hint: "Exposed tiles become visible to everyone",
                    options: [
                        { label: "Expose", value: true, primary: true },
                        { label: "Keep Hidden", value: false }
                    ],
                    onSelect: (choice) => data.callback(choice)
                });
                break;
            case "YES_NO":
                this.showChoicePrompt({
                    title: data.options?.message ?? "Continue?",
                    hint: "",
                    options: [
                        { label: "Yes", value: true, primary: true },
                        { label: "No", value: false }
                    ],
                    onSelect: (choice) => data.callback(choice)
                });
                break;
            case "CHARLESTON_CONTINUE":
                this.showChoicePrompt({
                    title: data.options?.question ?? "Continue to Charleston phase 2?",
                    hint: "",
                    options: [
                        { label: "Yes", value: "Yes", primary: true },
                        { label: "No", value: "No" }
                    ],
                    onSelect: (choice) => data.callback(choice)
                });
                break;
            case "COURTESY_VOTE":
                this.showChoicePrompt({
                    title: data.options?.question ?? "Courtesy pass vote",
                    hint: "How many tiles to exchange?",
                    options: (data.options?.options || ["0", "1", "2", "3"]).map(option => ({
                        label: option,
                        value: option
                    })),
                    onSelect: (choice) => data.callback(choice)
                });
                break;
            default: {
                // Unknown prompt type – resolve with null to prevent deadlock
                console.warn(`Unhandled UI prompt: ${data.promptType}`);
                data.callback(null);
            }
        }
    }

    startTileSelectionPrompt(config) {
        this.updateStatus(config.title);
        this.pendingPrompt = {
            type: "tile-selection",
            min: config.min,
            max: config.max,
            callback: config.callback,
            fallback: config.fallback,
            confirmUsesActionButton: !!config.useActionButton,
            baseLabel: config.confirmLabel ?? "Confirm"
        };

        this.selectionManager.setSelectionBehavior({
            mode: config.max === 1 ? "single" : "multiple",
            maxSelectable: config.max,
            allowToggle: true,
            validationMode: config.validationMode
        });
        this.selectionManager.clearSelection(true);
        this.handRenderer.applySelectionIndices([]);

        // Build action buttons - only include cancel if explicitly provided
        const actions = config.useActionButton ? [] : [
            {
                label: config.confirmLabel ?? "Confirm",
                primary: true,
                disabled: true,
                onClick: () => this.resolveTileSelectionPrompt()
            }
        ];

        // Only add cancel button if cancelLabel is explicitly provided
        if (config.cancelLabel) {
            actions.push({
                label: config.cancelLabel,
                onClick: () => this.cancelTileSelectionPrompt()
            });
        }

        if (config.useActionButton) {
            this.updateActionButton({
                label: config.confirmLabel ?? "Confirm",
                onClick: () => this.confirmPendingSelection(),
                disabled: true,
                visible: true
            });
            // Hide the prompt overlay when using action button
            this.hidePrompt();
        } else {
            this.showPrompt(config.title, config.hint, actions);
        }

        this.updateTileSelectionHint();
    }

    /**
     * Discard prompt without overlay UI.
     * Keeps button-driven confirmation but hides the floating prompt box.
     */
    startDiscardSelection(callback) {
        this.pendingPrompt = {
            type: "tile-selection",
            min: 1,
            max: 1,
            callback: (tiles) => {
                const tile = Array.isArray(tiles) && tiles.length > 0 ? tiles[0] : null;
                callback(tile);
            },
            fallback: null,
            confirmUsesActionButton: true,
            baseLabel: "Discard"
        };

        this.selectionManager.setSelectionBehavior({
            mode: "single",
            maxSelectable: 1,
            allowToggle: true,
            validationMode: "play"
        });
        this.selectionManager.clearSelection(true);
        this.handRenderer.applySelectionIndices([]);
        this.hidePrompt();

        this.updateActionButton({
            label: "Discard",
            onClick: () => this.confirmPendingSelection(),
            disabled: true,
            visible: true
        });

        // Ensure CTA state matches current selection (likely 0/1 on entry)
        this.updateTileSelectionHint();
    }

    onHandSelectionChange(selection = this.selectionManager.getSelectionState(this.latestHandSnapshot)) {
        if (!this.pendingPrompt || this.pendingPrompt.type !== "tile-selection") {
            return;
        }
        this.updateTileSelectionHint(selection);
    }

    updateTileSelectionHint(selection = this.selectionManager.getSelectionState(this.latestHandSnapshot)) {
        if (!this.pendingPrompt || this.pendingPrompt.type !== "tile-selection") {
            return;
        }

        const { min, max } = this.pendingPrompt;
        const count = selection.count;
        const ready = count >= min && count <= max;
        this.setPromptHint(`Selected ${count}/${max}${min === max ? "" : ` (need at least ${min})`}`);
        this.setPrimaryEnabled(ready);
        if (this.actionButton && this.pendingPrompt.confirmUsesActionButton) {
            this.actionButton.disabled = !ready;
            // Update action button label to show selection count
            const baseLabel = this.pendingPrompt.baseLabel || "Confirm";
            this.actionButton.textContent = `${baseLabel} (${count}/${max})`;
        }
    }

    resolveTileSelectionPrompt() {
        if (!this.pendingPrompt || this.pendingPrompt.type !== "tile-selection") {
            return;
        }
        const selection = this.selectionManager.getSelectionState(this.latestHandSnapshot);
        const { min, max } = this.pendingPrompt;
        if (selection.count < min || selection.count > max) {
            return;
        }
        const callback = this.pendingPrompt.callback;
        this.resetHandSelection();
        this.hidePrompt();
        this.pendingPrompt = null;
        callback(selection.tiles);
    }

    cancelTileSelectionPrompt() {
        if (!this.pendingPrompt || this.pendingPrompt.type !== "tile-selection") {
            return;
        }
        const fallback = this.pendingPrompt.fallback;
        const result = typeof fallback === "function" ? fallback() : [];
        const callback = this.pendingPrompt.callback;
        this.resetHandSelection();
        this.hidePrompt();
        this.pendingPrompt = null;
        // Always pass array to callback - let the callback wrapper handle extraction
        callback(result);
    }

    resetHandSelection() {
        this.selectionManager.clearSelection(true);
        this.handRenderer.applySelectionIndices([]);
        this.selectionManager.setSelectionBehavior({
            mode: "single",
            maxSelectable: 1,
            allowToggle: true,
            validationMode: undefined
        });
    }

    showChoicePrompt({ title, hint, options, onSelect }) {
        this.updateStatus(title);
        const buttons = (options || []).map(option => ({
            label: option.label,
            primary: option.primary,
            onClick: () => {
                this.hidePrompt();
                onSelect(option.value);
            }
        }));
        this.showPrompt(title, hint, buttons);
    }

    showPrompt(title, hint, buttons) {
        this.promptUI.message.textContent = title;
        this.setPromptHint(hint);
        this.promptUI.actions.innerHTML = "";
        this.promptUI.primaryButton = null;

        buttons.forEach(btn => {
            const button = document.createElement("button");
            button.textContent = btn.label;
            if (btn.primary) {
                button.classList.add("primary");
                this.promptUI.primaryButton = button;
            }
            if (btn.disabled) {
                button.disabled = true;
            }
            button.addEventListener("click", btn.onClick);
            this.promptUI.actions.appendChild(button);
        });

        this.promptUI.container.classList.remove("hidden");
    }

    hidePrompt() {
        this.promptUI.container.classList.add("hidden");
        this.promptUI.primaryButton = null;
    }

    setPromptHint(text) {
        if (this.promptUI.hint) {
            this.promptUI.hint.textContent = text ?? "";
        }
    }

    setPrimaryEnabled(enabled) {
        if (this.promptUI.primaryButton) {
            this.promptUI.primaryButton.disabled = !enabled;
        }
    }

    getFallbackTiles(count = 1) {
        if (!this.latestHandSnapshot || !Array.isArray(this.latestHandSnapshot.tiles)) {
            return [];
        }
        return this.latestHandSnapshot.tiles.slice(0, count).map(tile => {
            if (tile instanceof TileData) {
                return tile.clone();
            }
            return TileData.fromJSON(tile);
        }).filter(Boolean);
    }

    updateActionButton({ label, onClick, disabled = false, visible = true, glowPlayerTurn = false } = {}) {
        if (!this.actionButton) return;
        if (label) {
            this.actionButton.textContent = label;
        }
        this.actionButton.onclick = onClick || null;
        this.actionButton.disabled = !!disabled;
        this.actionButton.style.display = visible ? "flex" : "none";

        // Add or remove player-turn glow class
        if (glowPlayerTurn) {
            this.actionButton.classList.add("player-turn");
        } else {
            this.actionButton.classList.remove("player-turn");
        }
    }

    updateActionButtonStateForGame(newState) {
        if (!this.actionButton) return;

        const isHumanTurn = this.gameController.currentPlayer === HUMAN_PLAYER;
        const isDiscardState = newState === STATE.LOOP_CHOOSE_DISCARD && isHumanTurn;

        if (isDiscardState && this.pendingPrompt?.type === "tile-selection") {
            this.pendingPrompt.confirmUsesActionButton = true;
            const selection = this.selectionManager.getSelectionState(this.latestHandSnapshot);
            const ready = selection.count >= (this.pendingPrompt.min || 1) && selection.count <= (this.pendingPrompt.max || 1);
            this.updateActionButton({
                label: "Discard",
                onClick: () => this.confirmPendingSelection(),
                disabled: !ready,
                visible: true,
                glowPlayerTurn: true
            });
            return;
        }

        const preGameState = newState === STATE.INIT || newState === STATE.START || newState === STATE.DEAL;
        this.updateActionButton({
            label: "Start",
            onClick: () => this.startGame(),
            disabled: false,
            visible: preGameState,
            glowPlayerTurn: false
        });
    }

    confirmPendingSelection() {
        if (this.pendingPrompt?.type !== "tile-selection") return;
        this.resolveTileSelectionPrompt();
    }

    startGame() {
        if (typeof this.gameController.startGame === "function") {
            this.gameController.startGame();
        }
    }

    // TODO: Asset error handling scaffolding (not yet wired up)
    // Future work: Add image onerror handlers to detect tile sprite loading failures
    // Future work: Implement text mode fallback in HandRenderer
    // Future work: Call handleAssetError from asset loading pipeline
    handleAssetError(assetType, assetPath) {
        console.error(`Failed to load ${assetType}: ${assetPath}`);

        // Provide fallback UI
        if (assetType === "tiles.png") {
            this.showAssetError("Tile graphics failed to load. Using text mode.");
            this.enableTextModeFallback();
        }
    }

    showAssetError(message) {
        // Show non-intrusive error notification
        const errorEl = document.createElement("div");
        errorEl.className = "error-banner";
        errorEl.textContent = message;
        document.body.appendChild(errorEl);

        setTimeout(() => errorEl.remove(), 5000);
    }

    enableTextModeFallback() {
        // TODO: Implement text mode in HandRenderer
        // This would require HandRenderer to support text-based tile rendering
        console.warn("Text mode fallback requested but not fully implemented in HandRenderer yet");
    }
}
