import { TileData } from "../../core/models/TileData.js";

/**
 * HandSelectionManager
 *
 * Pure logic class for managing tile selection state and validation.
 * No external dependencies. No DOM manipulation.
 * Extracted from HandRenderer to enable testability and reusability.
 *
 * Responsibilities:
 * - Track selected tile indices
 * - Validate selection rules per mode (charleston, courtesy, play, blank-only)
 * - Notify listeners on selection changes
 * - Provide accessors for selection state
 */
export class HandSelectionManager {
    constructor() {
        // Set of selected tile keys (using selectionKey format: "idx-N" or "suit:number:index")
        this.selectedIndices = new Set();

        // Map of tile index → selection key
        this.selectionKeyByIndex = new Map();

        // Selection behavior configuration
        this.selectionBehavior = {
            mode: "multiple",          // "single" or "multiple"
            maxSelectable: Infinity,   // Max tiles that can be selected
            allowToggle: true,         // Can deselect by clicking again
            validationMode: undefined  // "charleston", "courtesy", "play", "blank-only"
        };

        // Callback when selection changes
        this.selectionListener = null;
    }

    /**
     * Set the selection behavior configuration
     * @param {Object} behavior Configuration object
     */
    setSelectionBehavior(behavior = {}) {
        this.selectionBehavior = {
            ...this.selectionBehavior,
            ...behavior
        };
    }

    /**
     * Set the callback for selection changes
     * @param {Function} callback Listener function
     */
    setSelectionListener(callback) {
        this.selectionListener = typeof callback === "function" ? callback : null;
    }

    /**
     * Handle tile click event
     * @param {number} index Tile index in hand
     */
    handleTileClick(index) {
        const selectionKey = this.selectionKeyByIndex.get(index);
        if (!selectionKey) {
            return;
        }

        const isSelected = this.selectedIndices.has(selectionKey);
        const { mode, maxSelectable, allowToggle, validationMode } = this.selectionBehavior;

        // Validate tile for selection based on validation mode
        if (!isSelected && !this.canSelectTile(index, validationMode)) {
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

    /**
     * Select or deselect a tile
     * @param {number} index Tile index in hand
     * @param {Object} options Selection options
     * @returns {boolean} True if selection changed
     */
    selectTile(index, options = {}) {
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
                changed = true;
            }
        } else {
            if (this.selectedIndices.delete(selectionKey)) {
                changed = true;
            }
        }

        if (changed && !silent) {
            this.notifySelectionChange();
        }

        return changed;
    }

    /**
     * Clear all selections
     * @param {boolean} silent If true, don't notify listener
     * @returns {boolean} True if any selections were cleared
     */
    clearSelection(silent = false) {
        if (this.selectedIndices.size === 0) {
            return false;
        }

        this.selectedIndices.clear();

        if (!silent) {
            this.notifySelectionChange();
        }

        return true;
    }

    /**
     * Get array of selected tile indices
     * NOTE: This returns indices based on the CURRENT hand ordering.
     * If the hand has been sorted/reordered since selection, the indices reflect the new positions.
     * @param {HandData} [handData] Optional hand data to find current indices (recommended after swaps/sorts)
     * @returns {number[]} Array of selected indices in current hand order
     */
    getSelectedTileIndices(handData = null) {
        // If handData provided, find current indices by matching selection keys
        if (handData && Array.isArray(handData.tiles)) {
            const indices = [];
            for (let i = 0; i < handData.tiles.length; i++) {
                const tile = handData.tiles[i];
                if (!tile) continue;

                // Generate selection key matching HandRenderer.getTileSelectionKey logic
                let key;
                if (typeof tile.index === "number" && tile.index >= 0) {
                    key = `idx-${tile.index}`;
                } else {
                    const suit = tile.suit ?? "unknown";
                    const number = tile.number ?? "unknown";
                    key = `${suit}:${number}:${i}`;
                }

                if (this.selectedIndices.has(key)) {
                    indices.push(i);
                }
            }
            return indices;
        }

        // Fallback: return old cached indices (may be stale after sort/swap)
        const indices = [];
        for (const [index, selectionKey] of this.selectionKeyByIndex.entries()) {
            if (this.selectedIndices.has(selectionKey)) {
                indices.push(index);
            }
        }
        return indices;
    }

    /**
     * Get array of selected tile data
     * @param {HandData} handData Current hand data
     * @returns {TileData[]} Array of selected tiles
     */
    getSelectedTiles(handData) {
        if (!handData || !Array.isArray(handData.tiles)) {
            return [];
        }

        const tiles = [];

        // Build a map of selection keys for all current tiles in the hand
        // This is necessary because tile positions may have changed due to sorting
        const currentKeyToTile = new Map();
        for (const tile of handData.tiles) {
            if (!tile) continue;

            // Generate selection key matching HandRenderer.getTileSelectionKey logic
            let key;
            if (typeof tile.index === "number" && tile.index >= 0) {
                key = `idx-${tile.index}`;
            } else {
                // For tiles without index, we can't reliably match after sorting
                // This is a fallback scenario that shouldn't happen in normal gameplay
                continue;
            }
            currentKeyToTile.set(key, tile);
        }

        // Find selected tiles by matching selection keys
        for (const selectionKey of this.selectedIndices) {
            const tile = currentKeyToTile.get(selectionKey);
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

    /**
     * Get current selection state
     * @param {HandData} [handData] Optional hand data to include selected tiles
     * @returns {Object} Object with count, indices, and tiles
     */
    getSelectionState(handData) {
        const indices = this.getSelectedTileIndices(handData);
        const tiles = Array.isArray(handData?.tiles) ? this.getSelectedTiles(handData) : [];
        return {
            count: indices.length,
            indices,
            tiles
        };
    }

    /**
     * Check if a specific tile is selected
     * @param {number} index Tile index
     * @returns {boolean} True if selected
     */
    isSelected(index) {
        const key = this.selectionKeyByIndex.get(index);
        return this.selectedIndices.has(key);
    }

    /**
     * Validate selection against requirements
     * @param {number} count Required selection count
     * @param {Object} _rules Validation rules
     * @returns {Object} Validation result with valid flag and message
     */
    validateSelection(count, _rules = {}) {
        const valid = this.selectedIndices.size === count;
        const message = valid
            ? "Selection valid"
            : this.selectedIndices.size < count
                ? `Select ${count - this.selectedIndices.size} more tiles`
                : `Select only ${count} tiles`;

        return { valid, message, count: this.selectedIndices.size };
    }

    /**
     * Register a tile with its selection key
     * @internal
     * @param {number} index Tile index
     * @param {string} selectionKey Selection key for this tile
     */
    registerTile(index, selectionKey) {
        this.selectionKeyByIndex.set(index, selectionKey);
    }

    /**
     * Notify listener of selection change
     * @private
     */
    notifySelectionChange() {
        if (typeof this.selectionListener === "function") {
            this.selectionListener(this.getSelectionState());
        }
    }

    /**
     * Validate whether a tile can be selected in the current validation mode
     * @param {number} index Index of the tile to validate
     * @param {string} validationMode Validation mode: "charleston", "courtesy", "play", "blank-only", or undefined
     * @returns {boolean} True if tile passes all mode-specific rules
     */
    canSelectTile(index, validationMode) {
        // If no validation mode, allow any tile
        if (!validationMode) {
            return true;
        }

        // This method is called without tile data access, so we validate based on
        // what we can determine from the mode itself.
        // The actual tile validation happens in the caller (HandRenderer) which has tile data.
        // For this pure logic class, we just validate the mode is recognized.
        const validModes = ["charleston", "courtesy", "play", "blank-only"];
        return validModes.includes(validationMode);
    }

    /**
     * Convert tile to TileData instance if needed
     * @private
     * @param {*} tile Tile object or TileData
     * @returns {TileData|null} Normalized TileData or null
     */
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
     * Clear all state
     * @internal
     */
    destroy() {
        this.selectedIndices.clear();
        this.selectionKeyByIndex.clear();
        this.selectionListener = null;
    }
}
