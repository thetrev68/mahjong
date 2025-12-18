# SelectionManager API Design

## Overview

The `SelectionManager` is responsible for managing tile selection state across different game phases. It encapsulates the selection logic, validation rules, and visual feedback that was previously scattered through the `TileSet` class and click handlers in `gameObjects_hand.js`.

**Key Design Goal**: Make selection mode-aware (Charleston vs discard vs exposure) and provide a clean interface for `PhaserAdapter` to use.

---

## Class Structure

```javascript
export class SelectionManager {
    constructor(hand, tileManager)

    // Lifecycle
    enableTileSelection(minCount, maxCount, mode)
    disableTileSelection()

    // Selection Control
    toggleTile(tile)
    selectTile(tile)
    deselectTile(tile)
    clearSelection()

    // Query Methods
    getSelection()
    getSelectionCount()
    getSelectedTileIndices()

    // Validation
    isValidSelection()
    canSelectMore()
    canDeselectMore()

    // Visual Feedback
    visualizeTile(tile, isSelected)
    highlightSelectedTiles()
    unhighlightTiles()

    // State Query
    isEnabled()
    getCurrentMode()
}
```

---

## Lifecycle Methods

### `enableTileSelection(minCount, maxCount, mode)`

**Purpose**: Activate tile selection for a game phase with specified constraints

**Parameters**:

- `minCount` (number): Minimum tiles that must be selected to confirm (1-3)
- `maxCount` (number): Maximum tiles allowed to be selected (1-3)
- `mode` (string): Selection mode - one of: `"charleston"`, `"courtesy"`, `"play"`, `"expose"`

**Returns**: `undefined`

**Side Effects**:

- Sets `this.isEnabled = true`
- Sets `this.minCount = minCount`
- Sets `this.maxCount = maxCount`
- Sets `this.mode = mode`
- Clears any previous selection: `this.clearSelection()`
- Attaches click handlers to all tiles in `this.hand`
- Updates UI button state based on initial conditions

**Usage Example**:

```javascript
// Charleston phase: must select exactly 3 tiles, no jokers/blanks
selectionManager.enableTileSelection(3, 3, "charleston");

// Discard phase: select exactly 1 tile
selectionManager.enableTileSelection(1, 1, "play");

// Exposure phase: select 1-4 tiles matching discard or jokers
selectionManager.enableTileSelection(1, 4, "expose");

// Courtesy: select 1-3 tiles, no jokers/blanks
selectionManager.enableTileSelection(1, 3, "courtesy");
```

**Validation Rules by Mode**:
| Mode | minCount | maxCount | Restrictions | Notes |
|------|----------|----------|--------------|-------|
| `"charleston"` | 3 | 3 | No jokers, no blanks | Must pass exactly 3 tiles |
| `"courtesy"` | 1 | 3 | No jokers, no blanks | Can exchange 1-3 tiles |
| `"play"` | 1 | 1 | None | Single tile discard |
| `"expose"` | 1+ | variable | Must match discard OR be joker | For pung/kong/quint formation |

---

### `disableTileSelection()`

**Purpose**: Deactivate tile selection, remove click handlers, reset state

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Sets `this.isEnabled = false`
- Calls `this.clearSelection()` to deselect all tiles
- Removes all click event listeners from tiles
- Removes all visual feedback (unhighlights tiles)
- Resets `this.mode = null`
- Sets `this.minCount` and `this.maxCount` to neutral values (e.g., 1, 3)

**Usage Example**:

```javascript
// After user confirms their selection
selectionManager.disableTileSelection();

// Selection is now locked in, clicks will be ignored
```

---

## Selection Control Methods

### `toggleTile(tile)`

**Purpose**: Toggle a tile between selected and deselected state

**Parameters**:

- `tile` (Tile): The tile object to toggle

**Returns**: `boolean` - `true` if tile is now selected, `false` if now deselected

**Side Effects**:

- If tile is currently deselected:
  - Validates that we haven't exceeded `maxCount` and that tile passes mode-specific checks
  - Sets `tile.selected = true`
  - Increments `this.selectedTiles` count
  - Calls `visualizeTile(tile, true)` to show selection
  - If mode is `"play"` and `maxCount === 1`: clears other selections first
- If tile is currently selected:
  - Sets `tile.selected = false`
  - Decrements `this.selectedTiles` count
  - Calls `visualizeTile(tile, false)` to remove selection
- Updates button UI state based on new selection count

**Usage Example**:

```javascript
// User clicks a tile - toggle it
selectionManager.toggleTile(clickedTile);

// If validation fails, nothing happens and error is displayed
```

**Validation Performed**:

- Capacity check: `this.getSelectionCount() < maxCount`
- Mode-specific validation:
  - **Charleston/Courtesy**: Reject jokers and blanks
  - **Play**: Always allow (any tile valid)
  - **Expose**: Only allow tiles matching discard OR jokers

---

### `selectTile(tile)`

**Purpose**: Unconditionally select a tile (bypass toggle logic)

**Parameters**:

- `tile` (Tile): The tile object to select

**Returns**: `boolean` - `true` if selection succeeded, `false` if rejected

**Side Effects**:

- If tile is not already selected:
  - Validates selection constraints
  - Sets `tile.selected = true`
  - Increments selection count
  - Calls `visualizeTile(tile, true)`
  - Updates UI button state
- If tile is already selected:
  - No change (idempotent)

**Usage Example**:

```javascript
// Programmatically select the first tile
const firstTile = hand.getTileArray()[0];
selectionManager.selectTile(firstTile);
```

**Note**: This is different from `toggleTile()` in that it always moves toward selected state, even if already selected.

---

### `deselectTile(tile)`

**Purpose**: Unconditionally deselect a tile

**Parameters**:

- `tile` (Tile): The tile object to deselect

**Returns**: `boolean` - `true` if deselection succeeded, `false` if tile wasn't selected

**Side Effects**:

- If tile is currently selected:
  - Sets `tile.selected = false`
  - Decrements selection count
  - Calls `visualizeTile(tile, false)`
  - Updates UI button state
- If tile is not selected:
  - No change (idempotent)

**Usage Example**:

```javascript
// Remove a tile from selection
selectionManager.deselectTile(currentSelection[0]);
```

---

### `clearSelection()`

**Purpose**: Deselect all tiles at once, reset visual state

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Iterates through all selected tiles
- For each: sets `tile.selected = false`, calls `visualizeTile(tile, false)`
- Resets `this.selectedTiles` count to 0
- Calls `unhighlightTiles()` to reset all visual feedback
- Disables UI confirmation button

**Usage Example**:

```javascript
// Clear selection when entering a new phase
selectionManager.clearSelection();
```

---

## Query Methods

### `getSelection()`

**Purpose**: Get array of all currently selected tiles

**Parameters**: None

**Returns**: `Array<Tile>` - Array of tile objects where `tile.selected === true`

**Side Effects**: None (read-only)

**Usage Example**:

```javascript
// Get the selected tiles when user confirms
const selectedTiles = selectionManager.getSelection();
const discardTile = selectedTiles[0];
gameLogic.handleDiscard(discardTile);
```

**Note**: Returns a copy of the array, not a reference to internal state.

---

### `getSelectionCount()`

**Purpose**: Get count of currently selected tiles

**Parameters**: None

**Returns**: `number` - Count of selected tiles (0 to maxCount)

**Side Effects**: None (read-only)

**Usage Example**:

```javascript
if (selectionManager.getSelectionCount() === 0) {
  console.log("No tiles selected");
}
```

---

### `getSelectedTileIndices()`

**Purpose**: Get array of tile indices for selected tiles (for logging/debugging)

**Parameters**: None

**Returns**: `Array<number>` - Array of tile indices from the hand's tileset

**Side Effects**: None (read-only)

**Usage Example**:

```javascript
// For debugging: show which tiles (by position) are selected
const indices = selectionManager.getSelectedTileIndices();
console.log("Selected tile positions:", indices); // [0, 3, 5]
```

**Note**: Index refers to position in `hand.getTileArray()`, not tile.index (which is the global tile ID).

---

## Validation Methods

### `isValidSelection()`

**Purpose**: Check if current selection meets min/max requirements for the current mode

**Parameters**: None

**Returns**: `boolean` - `true` if `minCount <= selectionCount <= maxCount`, `false` otherwise

**Side Effects**: None (read-only)

**Usage Example**:

```javascript
// Enable/disable confirmation button
if (selectionManager.isValidSelection()) {
  confirmButton.enable();
} else {
  confirmButton.disable();
}
```

**Logic**:

```javascript
const count = this.getSelectionCount();
return count >= this.minCount && count <= this.maxCount;
```

---

### `canSelectMore()`

**Purpose**: Check if user can select additional tiles without exceeding maxCount

**Parameters**: None

**Returns**: `boolean` - `true` if `selectionCount < maxCount`

**Side Effects**: None (read-only)

**Usage Example**:

```javascript
// Only show selection UI feedback if more tiles can be selected
if (selectionManager.canSelectMore()) {
  showSelectionCursor();
}
```

---

### `canDeselectMore()`

**Purpose**: Check if user can deselect tiles without dropping below minCount

**Parameters**: None

**Returns**: `boolean` - `true` if `selectionCount > minCount`

**Side Effects**: None (read-only)

**Usage Example**:

```javascript
// Allow deselection only if we have buffer above minimum
if (selectionManager.canDeselectMore()) {
  // Allow clicking selected tile to deselect
} else {
  // Block deselection - user must keep minimum
}
```

---

## Visual Feedback Methods

### `visualizeTile(tile, isSelected)`

**Purpose**: Apply or remove visual feedback to a tile to show selection state

**Parameters**:

- `tile` (Tile): The tile to update visually
- `isSelected` (boolean): `true` = show selected feedback, `false` = show deselected

**Returns**: `undefined`

**Side Effects**:

- If `isSelected === true`:
  - Sets `tile.sprite.depth = 150` (render on top)
  - If `tile.spriteBack` exists: sets `tile.spriteBack.depth = 150`
  - Animates tile to Y = 575 (elevated position): `tile.animate(tile.origX, 575, angle)`
  - Sets internal flag `tile._isVisuallySelected = true`
- If `isSelected === false`:
  - Sets `tile.sprite.depth = 0` (normal depth)
  - If `tile.spriteBack` exists: sets `tile.spriteBack.depth = 0`
  - Animates tile to Y = 600 (normal position): `tile.animate(tile.origX, 600, angle)`
  - Sets internal flag `tile._isVisuallySelected = false`

**Usage Example**:

```javascript
// Called internally by toggleTile/selectTile/deselectTile
visualizeTile(tile, true); // Raise tile, increase depth
visualizeTile(tile, false); // Lower tile, reset depth
```

**Visual Behavior**:

- Selected tiles appear "raised" (Y=575) and on top (depth=150)
- Deselected tiles appear "lowered" (Y=600) and at normal level (depth=0)
- Animation is smooth, not jarring - uses the tile's `animate()` method

---

### `highlightSelectedTiles()`

**Purpose**: Apply visual highlighting to all currently selected tiles

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Iterates through `this.getSelection()`
- For each selected tile: calls `visualizeTile(tile, true)`
- May apply additional visual effects (color tint, glow, etc.) if implemented

**Usage Example**:

```javascript
// Called after enabling selection to show any pre-selected tiles
selectionManager.highlightSelectedTiles();
```

---

### `unhighlightTiles()`

**Purpose**: Remove all visual feedback from all tiles

**Parameters**: None

**Returns**: `undefined`

**Side Effects**:

- Iterates through all tiles in hand
- For each tile: calls `visualizeTile(tile, false)` to reset Y-position and depth
- Clears any additional visual effects (color tint, glow, etc.)

**Usage Example**:

```javascript
// Called in clearSelection() to reset all visual state
selectionManager.unhighlightTiles();
```

---

## State Query Methods

### `isEnabled()`

**Purpose**: Check if tile selection is currently active

**Parameters**: None

**Returns**: `boolean` - `true` if `enableTileSelection()` has been called and `disableTileSelection()` hasn't

**Side Effects**: None (read-only)

**Usage Example**:

```javascript
if (selectionManager.isEnabled()) {
  // Selection is active, clicks on tiles will be processed
}
```

---

### `getCurrentMode()`

**Purpose**: Get the current selection mode

**Parameters**: None

**Returns**: `string` - One of: `null` (disabled), `"charleston"`, `"courtesy"`, `"play"`, `"expose"`

**Side Effects**: None (read-only)

**Usage Example**:

```javascript
if (selectionManager.getCurrentMode() === "expose") {
  // Show special validation for exposure selections
}
```

---

## Implementation Notes

### Data Structure

```javascript
constructor(hand, tileManager) {
    this.hand = hand;                      // Hand object managing tiles
    this.tileManager = tileManager;        // For visual feedback on tiles

    this.selectedTiles = new Set();        // Fast lookup for "is tile selected?"
    this.minCount = 1;                     // Minimum required selections
    this.maxCount = 3;                     // Maximum allowed selections
    this.mode = null;                      // Current mode or null if disabled
    this.isEnabled = false;                // Whether selection is active
}
```

### Integration Points with Hand/TileSet

1. **Getting Tiles**: `this.hand.getTileArray()` or `this.hand.hiddenTileSet.getTileArray()`
2. **Tile Properties**: Each tile has:
   - `tile.selected` (boolean) - selection state
   - `tile.sprite` - Phaser sprite for visual updates
   - `tile.spriteBack` (optional) - back face sprite
   - `tile.origX`, `tile.origY` - original position
3. **Hand Methods**: `getSelection()`, `getSelectionCount()` on Hand probably delegate to SelectionManager

### Mode-Specific Validation

Different modes enforce different rules. Implementation should check mode and call appropriate validation:

```javascript
_validateTileForMode(tile) {
    if (this.mode === "charleston" || this.mode === "courtesy") {
        // Reject jokers and blanks
        if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
            return false;
        }
    } else if (this.mode === "expose") {
        // Accept if: matches discard OR is joker
        if (tile.suit !== SUIT.JOKER &&
            (tile.suit !== this.discardTile.suit ||
             tile.number !== this.discardTile.number)) {
            return false;
        }
    } else if (this.mode === "play") {
        // No restrictions
    }
    return true;
}
```

### Visual Feedback Strategy

Y-position change is the primary visual signal:

- Selected: Y=575 (25 pixels higher)
- Deselected: Y=600 (normal level)

Depth change ensures selected tiles aren't obscured:

- Selected: depth=150 (on top)
- Deselected: depth=0 (normal level)

Animation makes it smooth and clear. Tile must have an `animate(x, y, angle, duration?)` method.

### Button UI Integration

The SelectionManager should update UI button state:

```javascript
_updateButtonState() {
    const isValid = this.isValidSelection();
    const buttonElement = window.document.getElementById("button1");
    if (buttonElement) {
        buttonElement.disabled = !isValid;
    }
}
```

Called after any selection change.

### Validation Timing

- **Before mutation**: Check constraints before changing `tile.selected`
- **During toggle**: Check mode-specific rules as part of `toggleTile()` logic
- **After mutation**: Update button state to reflect new validity

If validation fails, the selection doesn't change and no visual feedback is applied.

### Assumptions About Tile Objects

1. Each tile has a `selected` property (boolean, mutable)
2. Tiles have `sprite` (Phaser sprite) and optional `spriteBack`
3. Sprites support `setDepth()` method
4. Tiles have `origX`, `origY` properties tracking original position
5. Tiles have `animate(x, y, angle, duration?)` method for smooth movement
6. Tiles have `suit`, `number` properties for validation
7. Tiles are stored in `hand.hiddenTileSet.tileArray` (for human player's hand)

---

## Method Dependencies

```
enableTileSelection()
  └─> clearSelection()
  └─> Attach click handlers to tiles (which call toggleTile/validateForMode)

toggleTile(tile)
  ├─> _validateTileForMode(tile)
  ├─> selectTile(tile) OR deselectTile(tile)
  └─> _updateButtonState()

selectTile(tile)
  ├─> _validateTileForMode(tile)
  ├─> visualizeTile(tile, true)
  └─> _updateButtonState()

deselectTile(tile)
  ├─> visualizeTile(tile, false)
  └─> _updateButtonState()

clearSelection()
  ├─> deselectTile(tile) for each selected
  └─> unhighlightTiles()

isValidSelection()
  ├─> getSelectionCount()
  └─> Compare to minCount, maxCount

visualizeTile(tile, isSelected)
  └─> tile.animate() or tile.sprite.setDepth()

disableTileSelection()
  ├─> clearSelection()
  └─> Remove all event listeners
```

---

## Error Handling

When validation fails during selection:

1. Don't change `tile.selected`
2. Don't call `visualizeTile()`
3. Don't update selection count
4. Optionally display error message to user
5. Return `false` to indicate failure

Example from old code:

```javascript
if (this.gameLogic.state === STATE.LOOP_EXPOSE_TILES) {
  if (invalid) {
    this.gameLogic.displayErrorText(
      "Select same tile or joker to form pung/kong/quint",
    );
    return false; // Selection rejected
  }
}
```

---

## Future Extensions

The API is designed to support:

- Adding more game modes (add to mode parameter)
- Different selection styles (e.g., drag-to-select, marquee selection)
- Multi-selection patterns (e.g., "select all jokers")
- Visual themes (e.g., different colors per mode)
- Analytics (e.g., track which tiles users select)

All of these can be added without changing the core interface.
