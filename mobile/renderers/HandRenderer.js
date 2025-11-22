import { SUIT, WIND, DRAGON } from "../../constants.js";
import { TileData } from "../../core/models/TileData.js";
import { HandData } from "../../core/models/HandData.js";
import { tileSprites } from "../utils/tileSprites.js";

const SUIT_NAMES = {
    [SUIT.CRACK]: "CRACK",
    [SUIT.BAM]: "BAM",
    [SUIT.DOT]: "DOT",
    [SUIT.WIND]: "WIND",
    [SUIT.DRAGON]: "DRAGON",
    [SUIT.FLOWER]: "FLOWER",
    [SUIT.JOKER]: "JOKER",
    [SUIT.BLANK]: "BLANK"
};

const WIND_TEXT = {
    [WIND.NORTH]: "N",
    [WIND.SOUTH]: "S",
    [WIND.WEST]: "W",
    [WIND.EAST]: "E"
};

const DRAGON_TEXT = {
    [DRAGON.RED]: "R",
    [DRAGON.GREEN]: "G",
    [DRAGON.WHITE]: "0"
};

export class HandRenderer {
    /**
     * @param {HTMLElement} container
     * @param {GameController} gameController
     */
    constructor(container, gameController) {
        if (!container) {
            throw new Error("HandRenderer requires a container element");
        }

        this.container = container;
        this.gameController = gameController;
        this.tiles = [];
        this.selectedIndices = new Set();
        this.selectionKeyByIndex = new Map();
        this.selectionBehavior = {
            mode: "multiple",
            maxSelectable: Infinity,
            allowToggle: true
        };
        this.hintRecommendationKeys = new Set();
        this.selectionListener = null;
        this.unsubscribeFns = [];
        this.interactive = true;
        this.handContainer = null;
        this.exposedSection = null;
        this.currentHandData = null;
        this.currentSortMode = null; // Track explicit sort mode ('suit', 'rank', or null for auto)
        this.newlyDrawnTileIndex = null; // Track newly drawn tile for blue glow effect

        this.setupDOM();
        this.setupEventListeners();
    }

    setupDOM() {
        this.container.innerHTML = "";
        this.container.classList.add("hand-section");

        this.exposedSection = document.createElement("div");
        this.exposedSection.className = "exposed-section";
        this.container.appendChild(this.exposedSection);

        this.handContainer = document.createElement("div");
        this.handContainer.className = "hand-container hand-grid";
        this.container.appendChild(this.handContainer);
    }

    setupEventListeners() {
        if (!this.gameController || typeof this.gameController.on !== "function") {
            return;
        }

        const handleHandUpdated = (data = {}) => {
            if (data.player === 0) {
                // Reset sort mode when hand updated from game (not user sort)
                // This allows auto-sort to resume after hand changes (draw, discard, etc.)
                this.currentSortMode = null;
                // Convert plain JSON object to HandData instance
                const handData = HandData.fromJSON(data.hand);
                this.render(handData);
            }
        };
        this.unsubscribeFns.push(this.gameController.on("HAND_UPDATED", handleHandUpdated));

        const handleTileSelected = (data = {}) => {
            if (typeof data.index === "number") {
                this.selectTile(data.index, {
                    toggle: data.toggle !== false,
                    clearOthers: !!data.exclusive,
                    state: data.state
                });
                return;
            }

            if (Array.isArray(data.indices)) {
                if (data.clearExisting) {
                    this.clearSelection();
                }
                data.indices.forEach(index => {
                    if (typeof index === "number") {
                        this.selectTile(index, { state: data.state ?? "on", toggle: false });
                    }
                });
            }
        };
        this.unsubscribeFns.push(this.gameController.on("TILE_SELECTED", handleTileSelected));

        // Track newly drawn tiles for blue glow effect
        const handleTileDrawn = (data = {}) => {
            if (data.player === 0 && data.tile) {
                // Store the drawn tile's index to highlight it after next render
                this.newlyDrawnTileIndex = data.tile.index;
            }
        };
        this.unsubscribeFns.push(this.gameController.on("TILE_DRAWN", handleTileDrawn));

        // Clear newly drawn glow when a tile is discarded
        const handleTileDiscarded = (data = {}) => {
            if (data.player === 0) {
                this.newlyDrawnTileIndex = null;
                // Remove glow from all tiles
                this.tiles.forEach(tileEl => {
                    if (tileEl) {
                        tileEl.classList.remove("tile--newly-drawn");
                    }
                });
            }
        };
        this.unsubscribeFns.push(this.gameController.on("TILE_DISCARDED", handleTileDiscarded));

        // Highlight discard recommendations from hints panel
        const handleHintRecommendations = (data = {}) => {
            const tiles = Array.isArray(data.tiles) ? data.tiles : [];
            const active = data.active !== false;

            if (!active || tiles.length === 0) {
                this.hintRecommendationKeys.clear();
                this.applyHintRecommendations();
                return;
            }

            const keys = tiles.map((tile, idx) => this.getTileSelectionKey(tile, idx)).filter(Boolean);
            this.hintRecommendationKeys = new Set(keys);
            this.applyHintRecommendations();
        };
        this.unsubscribeFns.push(this.gameController.on("HINT_DISCARD_RECOMMENDATIONS", handleHintRecommendations));
    }

    /**
     * @param {HandData} handData
     */
    render(handData) {
        if (!handData) {
            this.renderExposures([]);
            this.clearTiles();
            this.currentHandData = null;
            return;
        }

        // Only auto-sort by suit if no explicit sort mode is active
        // This prevents overriding user-requested rank sorting
        if (this.currentSortMode === null && handData.sortBySuit) {
            handData.sortBySuit();
        }

        this.currentHandData = handData;
        this.renderExposures(Array.isArray(handData.exposures) ? handData.exposures : []);
        this.clearTiles();

        const preservedSelections = new Set();
        this.selectionKeyByIndex.clear();

        const tiles = Array.isArray(handData.tiles) ? handData.tiles : [];
        tiles.forEach((tileData, index) => {
            const selectionKey = this.getTileSelectionKey(tileData, index);
            this.selectionKeyByIndex.set(index, selectionKey);

            const tileButton = this.createTileButton(tileData, index, selectionKey);
            if (this.selectedIndices.has(selectionKey)) {
                tileButton.classList.add("selected");
                preservedSelections.add(selectionKey);
            }

            // Apply blue glow to newly drawn tile
            if (this.newlyDrawnTileIndex !== null && tileData.index === this.newlyDrawnTileIndex) {
                tileButton.classList.add("tile--newly-drawn");
            }

            if (this.hintRecommendationKeys.has(selectionKey)) {
                tileButton.classList.add("tile--hint-discard");
            }

            this.tiles.push(tileButton);
            this.handContainer.appendChild(tileButton);
        });

        this.selectedIndices = preservedSelections;
        this.setInteractive(this.interactive);
    }

    renderExposures(exposures) {
        if (!this.exposedSection) {
            return;
        }

        this.exposedSection.innerHTML = "";

        if (!Array.isArray(exposures) || exposures.length === 0) {
            return;
        }

        exposures.forEach(exposure => {
            if (!exposure || !Array.isArray(exposure.tiles)) {
                return;
            }

            const exposureSet = document.createElement("div");
            exposureSet.className = "exposure-set";
            if (exposure.type) {
                exposureSet.dataset.type = exposure.type;
            }

            exposure.tiles.forEach(tile => {
                // Use tileSprites for exposed tiles too
                const exposedTile = document.createElement("div");
                exposedTile.className = "tile tile--small";
                exposedTile.setAttribute("role", "img");

                if (tile) {
                    const pos = tileSprites.getSpritePosition(tile);
                    // Use CSS class for image, only set position
                    exposedTile.style.backgroundPosition = `${pos.xPct}% ${pos.yPct}%`;
                }

                exposedTile.dataset.suit = this.getSuitName(tile?.suit);
                exposedTile.dataset.number = this.getDataNumber(tile);

                const textLabel = this.formatTileText(tile);
                if (textLabel) {
                    exposedTile.setAttribute("aria-label", textLabel);
                }

                // No text content; accessibility handled via aria-label above
                exposureSet.appendChild(exposedTile);
            });

            this.exposedSection.appendChild(exposureSet);
        });
    }

    clearTiles() {
        this.tiles.forEach(tileButton => {
            const handler = tileButton.__handRendererHandler;
            if (handler) {
                tileButton.removeEventListener("click", handler);
                delete tileButton.__handRendererHandler;
            }
        });

        this.tiles = [];
        this.selectionKeyByIndex.clear();

        if (this.handContainer) {
            this.handContainer.innerHTML = "";
        }
    }

    createTileButton(tileData, index, selectionKey) {
        const tileButton = document.createElement("button");
        tileButton.type = "button";
        // Use .tile class for sprite styling
        tileButton.className = "tile tile--default";

        // Apply sprite background position
        if (tileData) {
            const pos = tileSprites.getSpritePosition(tileData);
            tileButton.style.backgroundPosition = `${pos.xPct}% ${pos.yPct}%`;
        }

        tileButton.dataset.suit = this.getSuitName(tileData?.suit);
        tileButton.dataset.number = this.getDataNumber(tileData);
        tileButton.dataset.index = String(index);
        tileButton.dataset.selectionKey = selectionKey;

        const textLabel = this.formatTileText(tileData);
        if (textLabel) {
            tileButton.setAttribute("aria-label", textLabel);
        }

        // No text content; accessibility handled via aria-label above
        tileButton.disabled = !this.interactive;

        const clickHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!this.interactive) {
                return;
            }
            this.handleTileClick(index);
        };

        tileButton.__handRendererHandler = clickHandler;
        tileButton.addEventListener("click", clickHandler);

        return tileButton;
    }

    setSelectionBehavior(behavior = {}) {
        this.selectionBehavior = {
            ...this.selectionBehavior,
            ...behavior
        };
    }

    setSelectionListener(listener) {
        this.selectionListener = typeof listener === "function" ? listener : null;
    }

    handleTileClick(index) {
        const selectionKey = this.selectionKeyByIndex.get(index);
        if (!selectionKey) {
            return;
        }

        const isSelected = this.selectedIndices.has(selectionKey);
        const { mode, maxSelectable, allowToggle, validationMode } = this.selectionBehavior;

        // Validate tile for selection based on validation mode
        if (!isSelected && !this._validateTileForMode(index, validationMode)) {
            // Tile cannot be selected in this mode - ignore click
            return;
        }

        if (mode === "single") {
            if (isSelected && allowToggle !== false) {
                this.selectTile(index, { state: "off", toggle: false });
            } else {
                this.clearSelection(true);
                this.selectTile(index, { state: "on", toggle: false });
            }
            return;
        }

        if (!isSelected) {
            if (this.selectedIndices.size >= maxSelectable) {
                return;
            }
            this.selectTile(index, { state: "on", toggle: false });
        } else if (allowToggle !== false) {
            this.selectTile(index, { state: "off", toggle: false });
        }
    }

    selectTile(index, options = {}) {
        const button = this.tiles[index];
        if (!button) {
            return false;
        }

        const selectionKey = this.selectionKeyByIndex.get(index);
        if (!selectionKey) {
            return false;
        }

        const { state, toggle = true, clearOthers = false, silent = false } = options;

        if (clearOthers) {
            this.clearSelection(true);
        }

        let shouldSelect;
        if (state === "on") {
            shouldSelect = true;
        } else if (state === "off") {
            shouldSelect = false;
        } else if (!toggle) {
            shouldSelect = true;
        } else {
            shouldSelect = !this.selectedIndices.has(selectionKey);
        }

        let changed = false;
        if (shouldSelect) {
            if (!this.selectedIndices.has(selectionKey)) {
                this.selectedIndices.add(selectionKey);
                button.classList.add("selected");
                changed = true;
            }
        } else {
            if (this.selectedIndices.delete(selectionKey)) {
                button.classList.remove("selected");
                changed = true;
            }
        }

        if (changed && !silent) {
            this.notifySelectionChange();
        }

        return changed;
    }

    applyHintRecommendations() {
        this.tiles.forEach((button, index) => {
            const key = this.selectionKeyByIndex.get(index);
            if (!key) {
                button.classList.remove("tile--hint-discard");
                return;
            }
            if (this.hintRecommendationKeys.has(key)) {
                button.classList.add("tile--hint-discard");
            } else {
                button.classList.remove("tile--hint-discard");
            }
        });
    }

    clearSelection(silent = false) {
        if (this.selectedIndices.size === 0) {
            return false;
        }

        this.selectedIndices.clear();
        this.tiles.forEach(tileButton => tileButton.classList.remove("selected"));

        if (!silent) {
            this.notifySelectionChange();
        }

        return true;
    }

    getSelectedTileIndices() {
        const indices = [];
        for (const [index, selectionKey] of this.selectionKeyByIndex.entries()) {
            if (this.selectedIndices.has(selectionKey)) {
                indices.push(index);
            }
        }
        return indices;
    }

    getSelectedTiles() {
        if (!this.currentHandData || !Array.isArray(this.currentHandData.tiles)) {
            return [];
        }

        const tiles = [];
        for (const [index, selectionKey] of this.selectionKeyByIndex.entries()) {
            if (!this.selectedIndices.has(selectionKey)) {
                continue;
            }
            const tile = this.currentHandData.tiles[index];
            if (!tile) {
                continue;
            }
            const normalized = this.toTileData(tile);
            if (normalized) {
                tiles.push(normalized);
            }
        }
        return tiles;
    }

    getSelectionState() {
        const indices = this.getSelectedTileIndices();
        return {
            count: indices.length,
            indices,
            tiles: this.getSelectedTiles()
        };
    }

    getLastTileElement() {
        if (this.tiles && this.tiles.length > 0) {
            return this.tiles[this.tiles.length - 1];
        }
        return null;
    }

    notifySelectionChange() {
        if (typeof this.selectionListener === "function") {
            this.selectionListener(this.getSelectionState());
        }
    }

    sortHand(mode = "suit") {
        if (!this.currentHandData) {
            return;
        }

        if (typeof this.gameController?.sortHand === "function") {
            this.gameController.sortHand(0, mode);
            return;
        }

        // Set the current sort mode to prevent auto-sorting from overriding
        this.currentSortMode = mode;

        const handCopy = this.cloneHandData(this.currentHandData);
        if (!handCopy) {
            return;
        }

        if (mode === "rank") {
            if (typeof handCopy.sortByRank === "function") {
                handCopy.sortByRank();
            } else if (Array.isArray(handCopy.tiles)) {
                handCopy.tiles.sort((a, b) => {
                    if (a.number !== b.number) {
                        return a.number - b.number;
                    }
                    return a.suit - b.suit;
                });
            }
        } else {
            if (typeof handCopy.sortBySuit === "function") {
                handCopy.sortBySuit();
            } else if (Array.isArray(handCopy.tiles)) {
                handCopy.tiles.sort((a, b) => {
                    if (a.suit !== b.suit) {
                        return a.suit - b.suit;
                    }
                    return a.number - b.number;
                });
            }
        }

        this.render(handCopy);
    }

    setInteractive(enabled) {
        this.interactive = !!enabled;
        this.tiles.forEach(tileButton => {
            tileButton.disabled = !this.interactive;
        });
    }

    destroy() {
        this.unsubscribeFns.forEach(unsub => {
            if (typeof unsub === "function") {
                unsub();
            }
        });
        this.unsubscribeFns = [];

        this.clearTiles();
        this.clearSelection(true); // Silent cleanup - no notification during teardown

        if (this.exposedSection) {
            this.exposedSection.innerHTML = "";
        }

        this.container = null;
        this.gameController = null;
        this.handContainer = null;
        this.exposedSection = null;
        this.currentHandData = null;
        this.selectionListener = null;
    }

    getSuitName(suit) {
        return SUIT_NAMES[suit] || "UNKNOWN";
    }

    getDataNumber(tile) {
        if (!tile || typeof tile.number === "undefined") {
            return "";
        }
        return String(tile.number);
    }

    formatTileText(tile) {
        if (!tile) {
            return "";
        }

        const { suit, number } = tile;

        if (suit === SUIT.CRACK) {
            return `${number}C`;
        }
        if (suit === SUIT.BAM) {
            return `${number}B`;
        }
        if (suit === SUIT.DOT) {
            return `${number}D`;
        }
        if (suit === SUIT.WIND) {
            return WIND_TEXT[number] || "";
        }
        if (suit === SUIT.DRAGON) {
            return DRAGON_TEXT[number] || "D";
        }
        if (suit === SUIT.FLOWER) {
            return `F${(typeof number === "number" ? number + 1 : 1)}`;
        }
        if (suit === SUIT.JOKER) {
            return "J";
        }
        if (suit === SUIT.BLANK) {
            return "BL";
        }

        return `${number ?? ""}`;
    }

    getTileSelectionKey(tile, fallbackIndex) {
        if (!tile) {
            return `missing-${fallbackIndex}`;
        }
        if (typeof tile.index === "number" && tile.index >= 0) {
            return `idx-${tile.index}`;
        }
        return `${tile.suit}:${tile.number}:${fallbackIndex}`;
    }

    cloneHandData(handData) {
        if (!handData) {
            return null;
        }
        if (typeof handData.clone === "function") {
            return handData.clone();
        }

        return {
            tiles: Array.isArray(handData.tiles)
                ? handData.tiles.map(tile => ({ ...tile }))
                : [],
            exposures: Array.isArray(handData.exposures)
                ? handData.exposures.map(exposure => ({
                    type: exposure?.type,
                    tiles: Array.isArray(exposure?.tiles)
                        ? exposure.tiles.map(tile => ({ ...tile }))
                        : []
                }))
                : []
        };
    }

    toTileData(tile) {
        if (!tile) {
            return null;
        }
        if (tile instanceof TileData) {
            return tile.clone();
        }
        return TileData.fromJSON(tile);
    }

    /**
     * Validate whether a tile can be selected in the current validation mode
     * @private
     * @param {number} index - Index of the tile to validate
     * @param {string} validationMode - Validation mode: "charleston", "courtesy", "play", or undefined
     * @returns {boolean} True if tile passes all mode-specific rules
     */
    _validateTileForMode(index, validationMode) {
        if (!validationMode) {
            return true; // No validation mode - allow any tile
        }

        // Get tile data from current hand
        if (!this.currentHandData || !Array.isArray(this.currentHandData.tiles)) {
            return false;
        }

        const tile = this.currentHandData.tiles[index];
        if (!tile) {
            return false;
        }

        switch (validationMode) {
        case "charleston":
        case "courtesy":
            // Cannot select jokers or blanks during Charleston or courtesy pass
            if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
                return false;
            }
            return true;

        case "play":
            // Any tile can be discarded during normal play
            return true;

        default:
            // Unknown mode - allow any tile
            return true;
        }
    }
}
