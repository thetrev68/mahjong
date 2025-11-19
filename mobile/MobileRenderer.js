import { HandRenderer } from "./renderers/HandRenderer.js";
import { DiscardPile } from "./components/DiscardPile.js";
import { OpponentBar } from "./components/OpponentBar.js";
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
        // this.animationController = new AnimationController(); // TODO: Lazy-initialize when tile animations are needed
        this.handRenderer.setSelectionBehavior({
            mode: "multiple",
            maxSelectable: Infinity,
            allowToggle: true
        });
        this.handRenderer.setSelectionListener((selection) => this.onHandSelectionChange(selection));

        this.opponentBars = this.createOpponentBars(options.opponentContainers || {});

        this.promptUI = this.createPromptUI(options.promptRoot || document.body);
        this.pendingPrompt = null;
        this.latestHandSnapshot = null;

        this.latestHandSnapshot = null;

        this.setupButtonListeners();
        this.registerEventListeners();
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
            { key: "right", playerIndex: PLAYER.RIGHT ?? 1 },
            { key: "top", playerIndex: PLAYER.TOP ?? 2 },
            { key: "left", playerIndex: PLAYER.LEFT ?? 3 }
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
        const drawBtn = document.getElementById("draw-btn");
        const sortBtn = document.getElementById("sort-btn");

        if (drawBtn) drawBtn.addEventListener("click", () => this.onDrawClicked());
        if (sortBtn) sortBtn.addEventListener("click", () => this.onSortClicked());
    }

    onDrawClicked() {
        // Manual draw trigger for user control
        if (this.canDrawTile()) {
            this.gameController.drawTile();
        }
    }

    onSortClicked() {
        if (!this.latestHandSnapshot || !this.latestHandSnapshot.tiles) return;

        // Sort hand tiles by suit/rank with improved logic
        const sorted = [...this.latestHandSnapshot.tiles].sort((a, b) => {
            // Primary: suit order (BAM, Characters, Dots, Winds, Dragons)
            const suitOrder = { "BAM": 1, "CHR": 2, "DOT": 3, "WIND": 4, "DRAGON": 5 };

            // Helper to get type/suit safely
            const getSuit = (tile) => {
                if (tile.type === "Number") return tile.suit;
                if (tile.type === "Wind") return "WIND";
                if (tile.type === "Dragon") return "DRAGON";
                return "UNKNOWN";
            };

            const aSuit = suitOrder[getSuit(a)] || 99;
            const bSuit = suitOrder[getSuit(b)] || 99;

            if (aSuit !== bSuit) return aSuit - bSuit;

            // Secondary: rank (1-9 for numbers, then winds, then dragons)
            if (a.type === "Number" && b.type === "Number") {
                return a.rank - b.rank;
            }
            // For winds: East, South, West, North
            if (a.type === "Wind" && b.type === "Wind") {
                const winds = ["East", "South", "West", "North"];
                return winds.indexOf(a.wind) - winds.indexOf(b.wind);
            }
            // For dragons: Red, Green, White
            if (a.type === "Dragon" && b.type === "Dragon") {
                const dragons = ["Red", "Green", "White"];
                return dragons.indexOf(a.color) - dragons.indexOf(b.color);
            }

            return 0;
        });

        // Create a new HandData with sorted tiles but same other properties
        const sortedHand = new HandData(sorted);
        // Preserve other properties if needed, but HandRenderer mainly cares about tiles
        this.handRenderer.render(sortedHand);
    }

    canDrawTile() {
        return this.gameController.currentPlayer === HUMAN_PLAYER &&
            this.gameController.gameState === "LOOP_PICK_FROM_WALL";
    }

    onGameStarted() {
        this.discardPile.clear();
        this.resetHandSelection();
        this.updateStatus("Game started – dealing tiles...");
        this.refreshOpponentBars();
    }

    onGameEnded(data) {
        const reason = data?.reason ?? "end";
        if (reason === "mahjong") {
            const winner = this.gameController.players?.[data.winner];
            this.updateStatus(winner ? `${winner.name} wins!` : "Mahjong!");
        } else if (reason === "wall_game") {
            this.updateStatus("Wall game – no winner");
        } else {
            this.updateStatus("Game ended");
        }
        this.hidePrompt();
        this.resetHandSelection();
    }

    onStateChanged(data) {
        if (!data) {
            return;
        }
        this.updateStatus(`State: ${data.newState}`);

        const drawBtn = document.getElementById("draw-btn");
        const sortBtn = document.getElementById("sort-btn");

        // Show DRAW button only during player's turn to pick
        if (drawBtn) {
            drawBtn.style.display =
                (data.newState === STATE.LOOP_PICK_FROM_WALL && this.gameController.currentPlayer === HUMAN_PLAYER)
                    ? "flex" : "none";
        }

        // SORT always visible during main game loop states
        if (sortBtn) {
            const isLoopState = data.newState >= STATE.LOOP_PICK_FROM_WALL && data.newState <= STATE.LOOP_EXPOSE_TILES_COMPLETE;
            sortBtn.style.display = isLoopState ? "flex" : "none";
        }
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
        }
    }

    onTileDiscarded(data) {
        if (!data?.tile) {
            return;
        }
        const tile = TileData.fromJSON(data.tile);
        this.discardPile.addDiscard(tile, data.player);
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

        // If there's a pending prompt, auto-cancel it with fallback to prevent deadlock
        if (this.pendingPrompt) {
            console.warn("MobileRenderer: New prompt received while previous prompt pending. Auto-canceling previous prompt.");
            if (this.pendingPrompt.type === "tile-selection") {
                this.cancelTileSelectionPrompt();
            } else if (this.pendingPrompt.callback) {
                // For choice prompts, invoke callback with null
                this.pendingPrompt.callback(null);
            }
        }

        this.hidePrompt();
        this.pendingPrompt = null;

        switch (data.promptType) {
            case "CHOOSE_DISCARD":
                this.startTileSelectionPrompt({
                    title: "Choose a tile to discard",
                    hint: "Tap one tile and press Discard",
                    min: 1,
                    max: 1,
                    confirmLabel: "Discard",
                    cancelLabel: "Auto Discard",
                    fallback: () => this.getFallbackTiles(1),
                    callback: (tiles) => data.callback(tiles[0])
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
            fallback: config.fallback
        };

        this.handRenderer.setSelectionBehavior({
            mode: config.max === 1 ? "single" : "multiple",
            maxSelectable: config.max,
            allowToggle: true
        });
        this.handRenderer.clearSelection(true);

        // Build action buttons - only include cancel if explicitly provided
        const actions = [
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
        const maxSelections = this.pendingPrompt.max;
        const result = typeof fallback === "function" ? fallback() : [];
        const callback = this.pendingPrompt.callback;
        this.resetHandSelection();
        this.hidePrompt();
        this.pendingPrompt = null;
        if (maxSelections === 1) {
            callback(result[0] ?? null);
        } else {
            callback(result);
        }
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
