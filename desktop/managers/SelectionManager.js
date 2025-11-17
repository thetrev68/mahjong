import { SUIT, PLAYER } from "../../constants.js";

/**
 * SelectionManager - Manages tile selection state and visual feedback
 *
 * Handles tile selection across different game phases (Charleston, courtesy, discard, exposure)
 * with min/max validation, mode-specific constraints, and visual feedback.
 *
 * Selection Flow:
 * 1. enableTileSelection(minCount, maxCount, mode) - Start accepting selections
 * 2. User clicks tiles - toggleTile() called by click handlers
 * 3. User clicks "Confirm" button - getSelection() returns selected tiles
 * 4. disableTileSelection() - Stop accepting selections
 */
export class SelectionManager {
    /**
     * Create a new SelectionManager
     * @param {Hand} hand - The Hand object containing tiles to manage selection for
     * @param {number} playerAngle - The angle for tile animations (from playerInfo.angle)
     * @param {ButtonManager} buttonManager - Optional ButtonManager for updating button states
     */
    constructor(hand, playerAngle, buttonManager = null) {
        this.hand = hand;
        this.playerAngle = playerAngle;  // Phase 5: Direct dependency instead of table coupling
        this.buttonManager = buttonManager;

        // Selection state
        this.selectedTiles = new Set();     // Fast lookup: is tile selected?
        this.minCount = 1;                  // Minimum tiles that must be selected
        this.maxCount = 3;                  // Maximum tiles allowed to be selected
        this.mode = null;                   // Current mode: "charleston", "courtesy", "play", "expose"
        this._isEnabled = false;            // Is selection currently active?
        this._activeButtonId = "button1";   // Button ID for current selection session

        // For expose mode validation
        this.discardTile = null;            // The discarded tile (for expose mode)

        // Track click handlers for cleanup
        this.clickHandlers = new Map();     // tile -> handler function

        // Optional callback for selection changes
        this.onSelectionChanged = null;
    }

    // ============================================================================
    // LIFECYCLE METHODS
    // ============================================================================

    /**
     * Enable tile selection for a game phase
     * @param {number} minCount - Minimum tiles that must be selected (1-3)
     * @param {number} maxCount - Maximum tiles allowed to be selected (1-3)
     * @param {string} mode - Selection mode: "charleston", "courtesy", "play", or "expose"
     * @returns {undefined}
     *
     * @description
     * Activates selection for the specified game phase.
     * - minCount: Must select at least this many (validation: count >= minCount)
     * - maxCount: Cannot select more than this many (capacity check: count < maxCount)
     * - mode determines what types of tiles can be selected and validation rules
     *
     * Mode behaviors:
     * - "charleston": exactly 3 tiles, no jokers/blanks
     * - "courtesy": 1-3 tiles, no jokers/blanks
     * - "play": exactly 1 tile, any tile
     * - "expose": 1+ tiles matching discard or jokers (for pung/kong/quint)
     *
     * @example
     * // Charleston phase: select exactly 3 tiles
     * selectionManager.enableTileSelection(3, 3, "charleston");
     *
     * // Discard phase: select exactly 1 tile
     * selectionManager.enableTileSelection(1, 1, "play");
     *
     * // Exposure phase: select tiles matching discard
     * selectionManager.enableTileSelection(1, 4, "expose");
     */
    enableTileSelection(minCount, maxCount, mode) {
        this.minCount = minCount;
        this.maxCount = maxCount;
        this.mode = mode;
        this._isEnabled = true;

        // Clear any previous selection
        this.clearSelection();

        // Attach click handlers to all tiles
        this._attachClickHandlers();

        // Update button state (should be disabled initially since no selection)
        this._updateButtonState();
    }

    /**
     * Disable tile selection and clean up
     * @returns {undefined}
     *
     * @description
     * Deactivates selection mode. Click handlers are removed,
     * visual feedback is cleared, and selection state is reset.
     * After calling this, clicks on tiles will be ignored.
     *
     * @example
     * // User confirmed selection - lock it in
     * selectionManager.disableTileSelection();
     */
    disableTileSelection() {
        this._isEnabled = false;

        // Clear selection and visual feedback
        this.clearSelection();

        // Remove all click event listeners
        this._removeClickHandlers();

        // Reset to defaults
        this.mode = null;
        this.minCount = 1;
        this.maxCount = 3;
        this.discardTile = null;
    }

    // ============================================================================
    // SELECTION CONTROL METHODS
    // ============================================================================

    /**
     * Toggle a tile between selected and deselected state
     * @param {Tile} tile - The tile object to toggle
     * @returns {boolean} True if now selected, false if now deselected
     *
     * @description
     * If tile is selected: deselect it (if allowed by minCount)
     * If not selected: select it (if allowed by maxCount and mode rules)
     *
     * Validation occurs BEFORE state change:
     * - Check mode-specific rules (Charleston rejects jokers, expose allows only matching tiles, etc.)
     * - Check capacity (don't exceed maxCount)
     * - Check if already at minimum (can't deselect below minCount)
     *
     * If validation fails, nothing changes and false is returned.
     * If validation passes, state changes and button UI is updated.
     *
     * Special case: If mode is "play" (maxSelect === 1), selecting a new tile
     * automatically deselects any previous selection first.
     *
     * @example
     * // User clicked a tile - toggle its selection
     * const nowSelected = selectionManager.toggleTile(clickedTile);
     *
     * // If validation fails, nowSelected will be false
     * if (!nowSelected) {
     *     console.log("Could not select - validation failed");
     * }
     */
    toggleTile(tile) {
        if (tile.selected) {
            // Deselect
            return !this.deselectTile(tile); // Return false if deselected
        } else {
            // Select - clear others first if maxCount === 1
            if (this.maxCount === 1) {
                this.clearSelection();
            }
            return this.selectTile(tile);
        }
    }

    /**
     * Select a tile (unconditionally move toward selected state)
     * @param {Tile} tile - The tile object to select
     * @returns {boolean} True if selection succeeded, false if rejected by validation
     *
     * @description
     * Attempts to select a tile. This is idempotent - if already selected, does nothing.
     *
     * Validation:
     * - Check capacity: count < maxCount
     * - Check mode-specific rules via _validateTileForMode()
     * - If any check fails, return false
     *
     * On success:
     * - Set tile.selected = true
     * - Call visualizeTile(tile, true) to show selection
     * - Increment selection count
     * - Update button state
     *
     * @example
     * // Programmatically select the first tile
     * const firstTile = hand.getTileArray()[0];
     * if (selectionManager.selectTile(firstTile)) {
     *     console.log("Selected successfully");
     * }
     */
    selectTile(tile) {
        // Idempotent - if already selected, succeed
        if (tile.selected) {
            return true;
        }

        // Check capacity
        if (this.getSelectionCount() >= this.maxCount) {
            return false;
        }

        // Check mode-specific validation
        if (!this._validateTileForMode(tile)) {
            return false;
        }

        // Perform selection
        tile.selected = true;
        this.selectedTiles.add(tile);
        this.visualizeTile(tile, true);
        this._updateButtonState();

        return true;
    }

    /**
     * Deselect a tile (unconditionally move toward deselected state)
     * @param {Tile} tile - The tile object to deselect
     * @returns {boolean} True if deselection succeeded, false if tile wasn't selected
     *
     * @description
     * Deselects a tile. This is idempotent - if already deselected, does nothing.
     *
     * No validation needed - can always deselect a tile.
     *
     * On success:
     * - Set tile.selected = false
     * - Call visualizeTile(tile, false) to remove selection feedback
     * - Decrement selection count
     * - Update button state
     *
     * @example
     * // Remove a tile from selection
     * selectionManager.deselectTile(currentSelection[0]);
     */
    deselectTile(tile) {
        // Idempotent - if already deselected, nothing to do
        if (!tile.selected) {
            return false;
        }

        // Perform deselection
        tile.selected = false;
        this.selectedTiles.delete(tile);
        this.visualizeTile(tile, false);
        this._updateButtonState();

        return true;
    }

    /**
     * Clear all selections at once
     * @returns {undefined}
     *
     * @description
     * Deselect all tiles and reset visual feedback.
     * Used when clearing selection before a new phase or between operations.
     *
     * Iterates through all selected tiles and calls deselectTile() on each.
     * Updates button to disabled state (no selection = invalid).
     *
     * @example
     * // Start fresh before a new game phase
     * selectionManager.clearSelection();
     */
    clearSelection() {
        // Get copy of selected tiles before clearing
        const selectedTiles = Array.from(this.selectedTiles);

        // Deselect each tile
        for (const tile of selectedTiles) {
            this.deselectTile(tile);
        }

        // Ensure selectedTiles is empty (should already be from deselectTile calls)
        this.selectedTiles.clear();

        // Ensure all visual feedback is cleared
        this.unhighlightTiles();

        // Update button (should disable since count is 0)
        this._updateButtonState();
    }

    // ============================================================================
    // QUERY METHODS
    // ============================================================================

    /**
     * Get array of all currently selected tiles
     * @returns {Array<Tile>} Array of Tile objects where tile.selected === true
     *
     * @description
     * Returns a copy of the selected tiles array. Order matches order in hand.
     * Called when user clicks "Confirm" button to get their selection.
     *
     * @example
     * // Get user's selection and process it
     * const selectedTiles = selectionManager.getSelection();
     * if (selectedTiles.length === 3) {
     *     gameLogic.charlestonPass(selectedTiles);
     * }
     */
    getSelection() {
        // Return array of selected tiles from the hand's hidden tileset
        const temp = [];
        const tiles = this.hand.hiddenTileSet.getTileArray();

        for (const tile of tiles) {
            if (tile.selected) {
                temp.push(tile);
            }
        }

        return temp;
    }

    /**
     * Get count of currently selected tiles
     * @returns {number} Number of selected tiles (0 to maxCount)
     *
     * @description
     * Fast count of selected tiles. Used for validation and UI updates.
     *
     * @example
     * // Check if user has made any selection
     * if (selectionManager.getSelectionCount() === 0) {
     *     console.log("No selection yet");
     * }
     */
    getSelectionCount() {
        return this.selectedTiles.size;
    }

    /**
     * Get array of indices for selected tiles (for logging/debugging)
     * @returns {Array<number>} Array of indices into hand's tileset
     *
     * @description
     * Returns indices of selected tiles in the hand, useful for debugging.
     * Index refers to position in hand.getTileArray(), not tile.index.
     *
     * @example
     * // Log which tile positions are selected
     * const indices = selectionManager.getSelectedTileIndices();
     * console.log("Selected positions:", indices); // [0, 3, 5]
     */
    getSelectedTileIndices() {
        const indices = [];
        const tiles = this.hand.hiddenTileSet.getTileArray();

        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i].selected) {
                indices.push(i);
            }
        }

        return indices;
    }

    // ============================================================================
    // VALIDATION METHODS
    // ============================================================================

    /**
     * Check if current selection is valid (meets min/max for current mode)
     * @returns {boolean} True if minCount <= selectionCount <= maxCount
     *
     * @description
     * Used to determine if user can click "Confirm" button.
     * Button is enabled only when this returns true.
     *
     * @example
     * // Update button state
     * confirmButton.disabled = !selectionManager.isValidSelection();
     */
    isValidSelection() {
        const count = this.getSelectionCount();
        return count >= this.minCount && count <= this.maxCount;
    }

    /**
     * Check if more tiles can be selected without exceeding maxCount
     * @returns {boolean} True if selectionCount < maxCount
     *
     * @description
     * Used to determine if clicks on unselected tiles should be accepted.
     *
     * @example
     * if (selectionManager.canSelectMore()) {
     *     // Tile click was accepted and selection increased
     * }
     */
    canSelectMore() {
        return this.getSelectionCount() < this.maxCount;
    }

    /**
     * Check if tiles can be deselected without dropping below minCount
     * @returns {boolean} True if selectionCount > minCount
     *
     * @description
     * Used to determine if clicks on selected tiles should be accepted for deselection.
     *
     * @example
     * if (!selectionManager.canDeselectMore()) {
     *     // User is at minimum - cannot deselect further
     * }
     */
    canDeselectMore() {
        return this.getSelectionCount() > this.minCount;
    }

    // ============================================================================
    // VISUAL FEEDBACK METHODS
    // ============================================================================

    /**
     * Apply or remove visual feedback to show tile selection state
     * @param {Tile} tile - The tile to update visually
     * @param {boolean} isSelected - True = show selected, false = show deselected
     * @returns {undefined}
     *
     * @description
     * Updates tile's visual appearance to reflect selection state.
     *
     * If isSelected:
     * - Raise tile: animate to Y = 575 (25 pixels above normal)
     * - Raise depth: set sprite.depth = 150 (render on top)
     * - Selected tiles appear "popped up" above deselected tiles
     *
     * If not isSelected:
     * - Lower tile: animate to Y = 600 (normal position)
     * - Lower depth: set sprite.depth = 0 (normal rendering)
     * - Tile blends back into rack
     *
     * The Y-position change (575 vs 600) is the primary visual signal.
     * The depth change ensures selected tiles aren't obscured.
     *
     * @example
     * // Called internally by selectTile/deselectTile
     * visualizeTile(tile, true);   // Show selection
     * visualizeTile(tile, false);  // Hide selection
     */
    visualizeTile(tile, isSelected) {
        // Phase 5: Use playerAngle directly instead of accessing via table
        const angle = this.playerAngle;

        if (isSelected) {
            // Raise tile and increase depth
            tile.sprite.setDepth(150);
            if (tile.spriteBack) {
                tile.spriteBack.setDepth(150);
            }
            // Animate to elevated position (Y=575)
            tile.animate(tile.origX, 575, angle);
            tile._isVisuallySelected = true;
        } else {
            // Lower tile and reset depth
            tile.sprite.setDepth(0);
            if (tile.spriteBack) {
                tile.spriteBack.setDepth(0);
            }
            // Animate to normal position (Y=600)
            tile.animate(tile.origX, 600, angle);
            tile._isVisuallySelected = false;
        }
    }

    /**
     * Apply visual highlighting to all currently selected tiles
     * @returns {undefined}
     *
     * @description
     * Called after enabling selection to ensure all selected tiles
     * have their visual feedback applied.
     * Equivalent to calling visualizeTile(tile, true) for each selected tile.
     *
     * @example
     * // Show visual feedback for all selected tiles
     * selectionManager.highlightSelectedTiles();
     */
    highlightSelectedTiles() {
        const selectedTiles = this.getSelection();
        for (const tile of selectedTiles) {
            this.visualizeTile(tile, true);
        }
    }

    /**
     * Remove all visual feedback from all tiles
     * @returns {undefined}
     *
     * @description
     * Resets Y-positions and depths for all tiles, removing selection feedback.
     * Called when clearing selection or disabling selection mode.
     *
     * @example
     * // Clear all visual indicators
     * selectionManager.unhighlightTiles();
     */
    unhighlightTiles() {
        const tiles = this.hand.hiddenTileSet.getTileArray();
        for (const tile of tiles) {
            if (tile.selected || tile._isVisuallySelected) {
                this.visualizeTile(tile, false);
            }
        }
    }

    // ============================================================================
    // STATE QUERY METHODS
    // ============================================================================

    /**
     * Check if tile selection is currently active
     * @returns {boolean} True if enableTileSelection() called and disableTileSelection() hasn't
     *
     * @description
     * Used to determine if clicks on tiles should be processed.
     *
     * @example
     * if (selectionManager.isEnabled()) {
     *     // Tile clicks will be handled
     * }
     */
    isEnabled() {
        return this._isEnabled;
    }

    /**
     * Refresh click handlers on tiles
     * @returns {undefined}
     *
     * @description
     * Re-attaches click handlers to tiles if selection is currently enabled.
     * This should be called after the hand is re-rendered (e.g., after syncAndRender)
     * to ensure the new tile sprites have proper event handlers.
     *
     * This method is safe to call at any time - it only performs work if
     * selection is currently active.
     *
     * @example
     * // After hand re-render with new sprites
     * handRenderer.syncAndRender(playerIndex, handData);
     * selectionManager.refreshHandlers();
     */
    refreshHandlers() {
        if (this._isEnabled) {
            this._removeClickHandlers();
            this._attachClickHandlers();
        }
    }

    /**
     * Get the current selection mode
     * @returns {string|null} One of: null, "charleston", "courtesy", "play", "expose"
     *
     * @description
     * Returns the current game phase that determines selection rules.
     * null means selection is disabled.
     *
     * @example
     * if (selectionManager.getCurrentMode() === "expose") {
     *     // Apply special exposure rules
     * }
     */
    getCurrentMode() {
        return this.mode;
    }

    /**
     * OPTIONAL: Promise-based tile selection helper (Phase 2+)
     *
     * Alternative to manual enableTileSelection() + button wiring.
     * Use this for NEW prompt handlers or when refactoring existing ones.
     *
     * This method combines:
     * 1. enableTileSelection() - Start selection mode
     * 2. Button callback registration - Wire confirm button
     * 3. Validation feedback - Auto enable/disable button
     * 4. Cleanup - Clear selection and disable when done
     *
     * @param {Object} config - Selection configuration
     * @param {number} config.min - Minimum tiles to select
     * @param {number} config.max - Maximum tiles to select
     * @param {string} config.mode - Selection mode ("charleston", "courtesy", "play", "expose")
     * @param {string} [config.buttonId="button1"] - Button to enable when selection is valid
     * @returns {Promise<Tile[]>} Resolves with selected tiles when user clicks confirm button
     *
     * @example
     * // New pattern (optional - cleaner for async handlers)
     * const tiles = await selectionManager.requestSelection({
     *     min: 3,
     *     max: 3,
     *     mode: "charleston"
     * });
     * console.log("User selected:", tiles);
     *
     * @example
     * // Old pattern (still supported - used by existing handlers)
     * selectionManager.enableTileSelection(3, 3, "charleston");
     * buttonManager.registerCallback("button1", () => {
     *     const tiles = selectionManager.getSelection();
     *     if (tiles.length === 3) {
     *         // Process selection
     *     }
     * });
     *
     * @note This is an OPTIONAL helper. The old pattern still works and is used
     *       by existing prompt handlers. Only use this for new code or when
     *       refactoring with approval.
     */
    requestSelection({min, max, mode, buttonId = "button1"}) {
        return new Promise((resolve) => {
            // Store active button ID for _updateButtonState()
            this._activeButtonId = buttonId;

            // Enable selection mode
            this.enableTileSelection(min, max, mode);

            // Create confirm handler
            const confirmHandler = () => {
                const selection = this.getSelection();

                // Validate selection
                if (this.isValidSelection()) {
                    // Clean up
                    this.clearSelection();
                    this.disableTileSelection();

                    // Clear callback reference
                    this.onSelectionChanged = null;

                    // Resolve with selected tiles
                    resolve(selection);
                } else {
                    // Invalid selection - show warning but don't resolve
                    console.warn(
                        "SelectionManager: Invalid selection. " +
                        `Expected ${min}-${max} tiles, got ${selection.length}.`
                    );
                }
            };

            // Register with ButtonManager if available
            if (this.buttonManager) {
                this.buttonManager.registerCallback(buttonId, confirmHandler);
            } else {
                console.warn(
                    "SelectionManager: No ButtonManager available. " +
                    `Button "${buttonId}" will not be wired.`
                );
            }

            // Auto-update button state on selection changes
            this.onSelectionChanged = () => {
                if (this.isValidSelection()) {
                    this.buttonManager?.enableButton(buttonId);
                } else {
                    this.buttonManager?.disableButton(buttonId);
                }
            };

            // Initial button state update
            if (this.buttonManager) {
                if (this.isValidSelection()) {
                    this.buttonManager.enableButton(buttonId);
                } else {
                    this.buttonManager.disableButton(buttonId);
                }
            }
        });
    }

    // ============================================================================
    // PRIVATE HELPER METHODS (implementation details)
    // ============================================================================

    /**
     * @private
     * Validate whether a tile can be selected in the current mode
     * @param {Tile} tile - The tile to validate
     * @returns {boolean} True if tile passes all mode-specific rules
     */
    _validateTileForMode(tile) {
        if (!this.mode) {
            return false; // Not in selection mode
        }

        switch (this.mode) {
        case "charleston":
        case "courtesy":
            // Cannot select jokers or blanks
            if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
                return false;
            }
            return true;

        case "play":
            // Any tile can be discarded
            return true;

        case "expose":
            // Must match discard or be a joker
            if (tile.suit === SUIT.JOKER) {
                return true;
            }
            if (this.discardTile &&
                    tile.suit === this.discardTile.suit &&
                    tile.number === this.discardTile.number) {
                return true;
            }
            return false;

        default:
            return false;
        }
    }

    /**
     * @private
     * Update UI button state based on current selection validity
     * @returns {undefined}
     */
    _updateButtonState() {
        const buttonId = this._activeButtonId || "button1";

        // Use ButtonManager if available
        if (this.buttonManager) {
            if (this.isValidSelection()) {
                this.buttonManager.enableButton(buttonId);
            } else {
                this.buttonManager.disableButton(buttonId);
            }
        } else {
            // Fallback to direct DOM manipulation
            const button = window.document.getElementById(buttonId);
            if (button) {
                button.disabled = !this.isValidSelection();
            }
        }

        // Call optional callback if registered
        if (this.onSelectionChanged) {
            this.onSelectionChanged();
        }
    }

    /**
     * @private
     * Attach click handlers to all tiles in hand
     * @returns {undefined}
     */
    _attachClickHandlers() {
        const tiles = this.hand.hiddenTileSet.getTileArray();

        for (const tile of tiles) {
            // Ensure Phaser knows this tile should fire pointer events.
            // Tiles passed in from AI players arrive with interaction disabled,
            // so re-enable it every time we enter a selection phase.
            if (tile?.sprite) {
                tile.sprite.setInteractive({useHandCursor: true});
                if (tile.sprite.input) {
                    tile.sprite.input.enabled = true;
                }
            }

            // Create and store handler for this tile
            const handler = () => {
                // Ignore if not enabled
                if (!this._isEnabled) {
                    return;
                }

                // Ignore if this was a drag operation
                if (tile.drag) {
                    return;
                }

                // Toggle tile selection
                this.toggleTile(tile);
            };

            // Store handler so we can remove it later
            this.clickHandlers.set(tile, handler);

            // Attach to sprite
            if (tile.sprite) {
                tile.sprite.on("pointerup", handler);
            }
        }
    }

    /**
     * @private
     * Remove all click handlers from tiles
     * @returns {undefined}
     */
    _removeClickHandlers() {
        // Remove each stored handler
        for (const [tile, handler] of this.clickHandlers.entries()) {
            if (tile.sprite) {
                tile.sprite.off("pointerup", handler);
            }
        }

        // Clear the map
        this.clickHandlers.clear();
    }
}
