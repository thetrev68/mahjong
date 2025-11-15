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
     * @param {Object} tileManager - Object with methods for visual feedback on tiles
     */
    constructor(hand, tileManager) {
        this.hand = hand;
        this.tileManager = tileManager;

        // Selection state
        this.selectedTiles = new Set();     // Fast lookup: is tile selected?
        this.minCount = 1;                  // Minimum tiles that must be selected
        this.maxCount = 3;                  // Maximum tiles allowed to be selected
        this.mode = null;                   // Current mode: "charleston", "courtesy", "play", "expose"
        this.isEnabled = false;             // Is selection currently active?

        // For expose mode validation
        this.discardTile = null;            // The discarded tile (for expose mode)
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
        // TODO: Implement
        // - Set this.minCount, this.maxCount, this.mode
        // - Set this.isEnabled = true
        // - Clear any previous selection via clearSelection()
        // - Attach click handlers to all tiles via _attachClickHandlers()
        // - Update button state via _updateButtonState()
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
        // TODO: Implement
        // - Set this.isEnabled = false
        // - Call clearSelection()
        // - Remove all click event listeners from tiles
        // - Set this.mode = null
        // - Reset this.minCount/maxCount to defaults (1, 3)
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
        // TODO: Implement
        // - Check if tile.selected is true or false
        // - If selected: call deselectTile() (checks minCount constraint)
        // - If not selected:
        //   - If maxCount === 1: call clearSelection() first
        //   - Call selectTile() (checks maxCount and mode validation)
        // - Return new selection state of tile
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
        // TODO: Implement
        // - If tile.selected is already true, return true (idempotent)
        // - Check capacity: if this.getSelectionCount() >= this.maxCount, return false
        // - Check mode validation: if !_validateTileForMode(tile), return false
        // - Set tile.selected = true
        // - Add tile to this.selectedTiles
        // - Call visualizeTile(tile, true)
        // - Call _updateButtonState()
        // - Return true
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
        // TODO: Implement
        // - If tile.selected is already false, return false (already deselected)
        // - Set tile.selected = false
        // - Remove tile from this.selectedTiles
        // - Call visualizeTile(tile, false)
        // - Call _updateButtonState()
        // - Return true
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
        // TODO: Implement
        // - Get all currently selected tiles via this.getSelection()
        // - For each tile in selection: call deselectTile(tile)
        // - Clear this.selectedTiles (make it empty)
        // - Call unhighlightTiles()
        // - Disable button via _updateButtonState()
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
        // TODO: Implement
        // - Create empty temp array
        // - Iterate through all tiles in this.hand.getTileArray()
        // - For each tile where tile.selected === true, add to temp array
        // - Return temp array
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
        // TODO: Implement
        // - Return this.selectedTiles.size (or count by iterating hand.getTileArray())
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
        // TODO: Implement
        // - Get all tiles via this.hand.getTileArray()
        // - For each tile, if tile.selected is true, record its index
        // - Return array of indices
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
        // TODO: Implement
        // - Get count via this.getSelectionCount()
        // - Return count >= this.minCount && count <= this.maxCount
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
        // TODO: Implement
        // - Return this.getSelectionCount() < this.maxCount
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
        // TODO: Implement
        // - Return this.getSelectionCount() > this.minCount
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
        // TODO: Implement
        // If isSelected:
        //   - Set tile.sprite.depth = 150
        //   - If tile.spriteBack exists: set tile.spriteBack.depth = 150
        //   - Call tile.animate(tile.origX, 575, angle) to raise tile
        //   - Mark tile._isVisuallySelected = true
        // Else (not selected):
        //   - Set tile.sprite.depth = 0
        //   - If tile.spriteBack exists: set tile.spriteBack.depth = 0
        //   - Call tile.animate(tile.origX, 600, angle) to lower tile
        //   - Mark tile._isVisuallySelected = false
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
        // TODO: Implement
        // - Get all selected tiles via this.getSelection()
        // - For each tile: call visualizeTile(tile, true)
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
        // TODO: Implement
        // - Get all tiles from this.hand.getTileArray()
        // - For each tile: call visualizeTile(tile, false)
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
        // TODO: Implement
        // - Return this.isEnabled
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
        // TODO: Implement
        // - Return this.mode
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
        // TODO: Implement based on this.mode:
        // "charleston": Reject if JOKER or BLANK
        // "courtesy": Reject if JOKER or BLANK
        // "play": Accept any tile
        // "expose": Accept only if:
        //   - tile.suit === SUIT.JOKER, OR
        //   - tile matches discardTile (suit and number both match)
        // null: Reject (not in selection mode)
        // Return true/false
    }

    /**
     * @private
     * Update UI button state based on current selection validity
     * @returns {undefined}
     */
    _updateButtonState() {
        // TODO: Implement
        // - Get button element: window.document.getElementById("button1")
        // - If isValidSelection(): set button.disabled = false
        // - Else: set button.disabled = true
    }

    /**
     * @private
     * Attach click handlers to all tiles in hand
     * @returns {undefined}
     */
    _attachClickHandlers() {
        // TODO: Implement
        // - Get all tiles from this.hand.getTileArray()
        // - For each tile, attach a "pointerup" listener that:
        //   - Checks if this.isEnabled is true
        //   - Checks if drag occurred (skip if tile.drag is true)
        //   - Calls this.toggleTile(tile)
        // - Use tile.sprite.on("pointerup", callback)
    }

    /**
     * @private
     * Remove all click handlers from tiles
     * @returns {undefined}
     */
    _removeClickHandlers() {
        // TODO: Implement
        // - Get all tiles from this.hand.getTileArray()
        // - For each tile: tile.sprite.removeAllListeners("pointerup")
        // - Or: tile.sprite.disableInteractive()
    }
}
