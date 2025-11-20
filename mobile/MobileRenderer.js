import { HandRenderer } from "./renderers/HandRenderer.js";
import { DiscardPile } from "./components/DiscardPile.js";
import { OpponentBar } from "./components/OpponentBar.js";
import { AnimationController } from "./animations/AnimationController.js";
import { PLAYER, STATE } from "../constants.js";
import { TileData } from "../core/models/TileData.js";
import { HandData } from "../core/models/HandData.js";

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
     */
    constructor(options = {}) {
        if (!options.gameController) {
            throw new Error("MobileRenderer requires a GameController instance");
        }

        this.gameController = options.gameController;
        this.statusElement = options.statusElement || null;
        this.subscriptions = [];

        // Pass null as gameController to prevent HandRenderer from subscribing to events
        // MobileRenderer handles all event subscriptions and calls handRenderer.render() directly
        this.handRenderer = new HandRenderer(options.handContainer, null);
        this.discardPile = new DiscardPile(options.discardContainer);
        this.animationController = new AnimationController();
        this.handRenderer.setSelectionBehavior({
            mode: "multiple",
            maxSelectable: Infinity,
            allowToggle: true
        });
        this.handRenderer.setSelectionListener((selection) => this.onHandSelectionChange(selection));

        this.opponentBars = this.createOpponentBars(options.opponentContainers || {});

        this.actionButton = document.getElementById("new-game-btn");
        this.drawButton = document.getElementById("draw-btn");
        this.sortButton = document.getElementById("sort-btn");

        this.promptUI = this.createPromptUI(options.promptRoot || document.body);
        this.pendingPrompt = null;
        this.latestHandSnapshot = null;

        this.latestHandSnapshot = null;

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
        this.discardPile?.destroy();
        this.promptUI?.container?.remove();
        this.pendingPrompt = null;
    }

    registerEventListeners() {
        const gc = this.gameController;
        this.subscriptions.push(gc.on("GAME_STARTED", (data) => this.onGameStarted(data)));
        this.subscriptions.push(gc.on("GAME_ENDED", (data) => this.onGameEnded(data)));
        this.subscriptions.push(gc.on("STATE_CHANGED", (data) => this.onStateChanged(data)));
        this.subscriptions.push(gc.on("TILES_DEALT", () => {
            // Mobile doesn't animate dealing, so immediately signal completion
            gc.emit("DEALING_COMPLETE");
        }));
        this.subscriptions.push(gc.on("HAND_UPDATED", (data) => this.onHandUpdated(data)));
        this.subscriptions.push(gc.on("TURN_CHANGED", (data) => this.onTurnChanged(data)));
        this.subscriptions.push(gc.on("TILE_DISCARDED", (data) => this.onTileDiscarded(data)));
        this.subscriptions.push(gc.on("DISCARD_CLAIMED", () => this.discardPile.removeLatestDiscard()));
        this.subscriptions.push(gc.on("TILES_EXPOSED", () => this.refreshOpponentBars()));
        this.subscriptions.push(gc.on("MESSAGE", (data) => this.onMessage(data)));
        this.subscriptions.push(gc.on("CHARLESTON_PHASE", (data) => {
            this.updateStatus(`Charleston ${data.phase}: Pass ${data.round}`);
        }));
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

        if (drawBtn) drawBtn.addEventListener("click", () => this.onDrawClicked());
        if (sortBtn) sortBtn.addEventListener("click", () => this.onSortClicked());
        if (this.actionButton) {
            this.actionButton.addEventListener("click", () => this.startGame());
        }
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
        this.handRenderer.render(sortedHand);
        this.animationController.animateHandSort(this.handRenderer.container);
    }

    canDrawTile() {
        const state = this.gameController?.state ?? this.gameController?.gameState;
        return this.gameController.currentPlayer === HUMAN_PLAYER &&
            (state === STATE.LOOP_PICK_FROM_WALL || state === "LOOP_PICK_FROM_WALL");
    }

    onGameStarted() {
        this.discardPile.clear();
        this.resetHandSelection();
        this.updateStatus("Game started - dealing tiles...");
        this.refreshOpponentBars();
        this.updateActionButton({ label: "Start", onClick: () => this.startGame(), disabled: true, visible: true });
    }

    onGameEnded(data) {
        const reason = data?.reason ?? "end";
        if (reason === "mahjong") {
            const winner = this.gameController.players?.[data.winner];
            this.updateStatus(winner ? `${winner.name} wins!` : "Mahjong!");
        } else if (reason === "wall_game") {
            this.updateStatus("Wall game - no winner");
        } else {
            this.updateStatus("Game ended");
        }
        this.hidePrompt();
        this.resetHandSelection();
        this.updateActionButton({ label: "Start", onClick: () => this.startGame(), disabled: false, visible: true });
    }

    onStateChanged(data) {
        if (!data) {
            return;
        }
        this.updateStatus(`State: ${data.newState}`);

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

        this.updateActionButtonStateForGame(data.newState);
    }

    onHandUpdated(data) {
        if (!data) {
            return;
        }

        const player = this.gameController.players[data.player];
        if (!player) {
            return;
        }

        if (data.player === HUMAN_PLAYER) {
            // Convert plain JSON object to HandData instance
            const handData = HandData.fromJSON(data.hand);
            this.latestHandSnapshot = handData;
            this.handRenderer.render(handData);

            // If we just drew a tile (hand size increased to 14), animate it
            // This is a heuristic since we don't get explicit "DRAWN" event with tile data here
            // Ideally GameController would pass the drawn tile or we'd diff the hand
            if (handData.tiles.length % 3 === 2) { // 14 tiles (or 2, 5, 8, 11) means we have a draw
                const lastTile = this.handRenderer.getLastTileElement();
                if (lastTile) {
                    this.animationController.animateTileDraw(lastTile);
                }
            }
        } else {
            const bar = this.opponentBars.find(ob => ob.playerIndex === data.player);
            if (bar) {
                bar.bar.update(player);
            }
        }
    }

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

    onTileDiscarded(data) {
        if (!data?.tile) {
            return;
        }
        const tile = TileData.fromJSON(data.tile);
        this.discardPile.addDiscard(tile, data.player);

        // Animate discard from hand if it's the human player
        if (data.player === HUMAN_PLAYER) {
            // We can't easily animate the specific tile element because it's already removed from DOM by HandRenderer
            // But we can animate the "flight" to the discard pile using a clone or the discard pile element itself
            const latestDiscard = this.discardPile.getLatestDiscardElement();
            if (latestDiscard) {
                this.animationController.animateTileDiscard(latestDiscard);
            }
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
                this.startTileSelectionPrompt({
                    title: "Choose a tile to discard",
                    hint: "Tap one tile and press Discard",
                    min: 1,
                    max: 1,
                    confirmLabel: "Discard",
                    cancelLabel: null,
                    fallback: null,
                    useActionButton: true,
                    callback: (tiles) => {
                        if (!tiles || tiles.length === 0) {
                            data.callback(null);
                            return;
                        }
                        data.callback(tiles[0]);
                    }
                });
                this.updateActionButton({
                    label: "Discard",
                    onClick: () => this.confirmPendingSelection(),
                    disabled: true,
                    visible: true
                });
                break;
            case "CHARLESTON_PASS":
                this.startTileSelectionPrompt({
                    title: `Charleston Pass (${data.options?.direction ?? "?"})`,
                    hint: `Select ${data.options?.requiredCount ?? 3} tiles to pass`,
                    min: data.options?.requiredCount ?? 3,
                    max: data.options?.requiredCount ?? 3,
                    confirmLabel: "Pass Tiles",
                    cancelLabel: null,
                    fallback: null,
                    callback: (tiles) => data.callback(tiles)
                });
                break;
            case "SELECT_TILES":
                this.startTileSelectionPrompt({
                    title: data.options?.question ?? "Select tiles",
                    hint: `Select ${data.options?.minTiles ?? 1}–${data.options?.maxTiles ?? 3} tiles`,
                    min: data.options?.minTiles ?? 1,
                    max: data.options?.maxTiles ?? 3,
                    confirmLabel: "Confirm",
                    cancelLabel: "Cancel",
                    fallback: () => this.getFallbackTiles(Math.max(1, data.options?.minTiles ?? 1)),
                    callback: (tiles) => data.callback(tiles)
                });
                break;
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
            confirmUsesActionButton: !!config.useActionButton
        };

        this.handRenderer.setSelectionBehavior({
            mode: config.max === 1 ? "single" : "multiple",
            maxSelectable: config.max,
            allowToggle: true
        });
        this.handRenderer.clearSelection(true);

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
        }

        this.showPrompt(config.title, config.hint, actions);

        this.updateTileSelectionHint();
    }

    onHandSelectionChange(selection) {
        if (!this.pendingPrompt || this.pendingPrompt.type !== "tile-selection") {
            return;
        }
        this.updateTileSelectionHint(selection);
    }

    updateTileSelectionHint(selection = this.handRenderer.getSelectionState()) {
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
        }
    }

    resolveTileSelectionPrompt() {
        if (!this.pendingPrompt || this.pendingPrompt.type !== "tile-selection") {
            return;
        }
        const selection = this.handRenderer.getSelectionState();
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
        this.handRenderer.clearSelection(true);
        this.handRenderer.setSelectionBehavior({
            mode: "multiple",
            maxSelectable: Infinity,
            allowToggle: true
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

    updateActionButton({ label, onClick, disabled = false, visible = true } = {}) {
        if (!this.actionButton) return;
        if (label) {
            this.actionButton.textContent = label;
        }
        this.actionButton.onclick = onClick || null;
        this.actionButton.disabled = !!disabled;
        this.actionButton.style.display = visible ? "flex" : "none";
    }

    updateActionButtonStateForGame(newState) {
        if (!this.actionButton) return;

        const isHumanTurn = this.gameController.currentPlayer === HUMAN_PLAYER;
        const isDiscardState = newState === STATE.LOOP_CHOOSE_DISCARD && isHumanTurn;

        if (isDiscardState && this.pendingPrompt?.type === "tile-selection") {
            this.pendingPrompt.confirmUsesActionButton = true;
            const selection = this.handRenderer.getSelectionState();
            const ready = selection.count >= (this.pendingPrompt.min || 1) && selection.count <= (this.pendingPrompt.max || 1);
            this.updateActionButton({
                label: "Discard",
                onClick: () => this.confirmPendingSelection(),
                disabled: !ready,
                visible: true
            });
            return;
        }

        const preGameState = newState === STATE.INIT || newState === STATE.START || newState === STATE.DEAL;
        this.updateActionButton({
            label: "Start",
            onClick: () => this.startGame(),
            disabled: false,
            visible: preGameState
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

    // Add error handling for asset loading
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
        // Switch all tiles to text mode if sprites fail
        // This would require HandRenderer to support a text mode or we manually replace elements
        // For now, we'll just log it as this is a robust fallback feature
        console.warn("Text mode fallback requested but not fully implemented in HandRenderer yet");
    }
}
