# Tile Selection Logic - Extracted from Commit 07c41b9

## Overview

The tile selection system in the old codebase (commit 07c41b9) tracked which tiles were selected through a combination of state on individual `Tile` objects and counters on the `TileSet` container. This document details how selection worked so we can replicate it in the new `SelectionManager` class.

---

## Core Data Structures

### TileSet Class

The `TileSet` class is the container for tiles within a `Hand`. Key properties related to selection:

- **`selectCount`** (number): Running count of how many tiles in this set are currently selected
  - Incremented when a tile is selected: `tileSet.selectCount++`
  - Decremented when a tile is deselected: `tileSet.selectCount--`
  - Reset in `resetSelection()` method
  - Used for validation logic (min/max enforcement)

- **`tileArray`** (array): Array of all `Tile` objects in this set
  - Each tile has a `selected` property (boolean)
  - Selection state is tracked ON the tile object itself

- **`inputEnabled`** (boolean): Whether this tileset accepts user interaction
  - Prevents clicks on AI player hands
  - Only `PLAYER.BOTTOM` (human) has `inputEnabled = true`

### Tile Object Properties (Selection-related)

Each `Tile` has these relevant properties:

- **`selected`** (boolean): Current selection state of this tile
  - Set to `true` when selected
  - Set to `false` when deselected
  - The single source of truth for whether a tile is selected

- **`origX`, `origY`** (numbers): Original/normal position where tile rests
  - `origY = 600` is the normal resting position
  - Used to animate tile back to normal position when deselected

- **`sprite.depth`** (number): Z-order for visual layering
  - Normal depth: `0` (tiles blend with others)
  - Selected depth: `150` (selected tiles appear on top)
  - This is critical for visual feedback - selected tiles render above others

- **`spriteBack`** (optional sprite): Back face sprite (for face-down tiles)
  - Also gets depth adjusted when tile is selected/deselected

---

## Selection API Methods

### `resetSelection()`

**Purpose**: Clear all selections in this tileset, reset visual state to normal

**Behavior**:

```javascript
resetSelection() {
    if (this.selectCount === 0) {
        return; // Early exit if nothing selected
    }

    // Disable the "Confirm" button while resetting
    window.document.getElementById("button1").disabled = true;

    // For each tile in the array:
    for (const tile of this.tileArray) {
        if (tile.selected) {
            tile.selected = false;

            // Reset depth to normal (below other tiles)
            tile.sprite.setDepth(0);
            if (tile.spriteBack) tile.spriteBack.setDepth(0);

            // Animate back to original position (always Y=600, original X)
            tile.animate(tile.origX, tile.origY, playerObject.playerInfo.angle);

            // Decrement counter
            this.selectCount--;
        }
    }
}
```

**Key Details**:

- Iterates through ALL tiles, checking `tile.selected`
- Only modifies tiles where `tile.selected === true`
- Decrements counter for each deselected tile
- Disables button1 UI element (used for confirming selections)

### `getSelection()`

**Purpose**: Return array of all currently selected tiles (copies, not references)

**Behavior**:

```javascript
getSelection() {
    const temp = [];
    for (const tile of this.tileArray) {
        if (tile.selected) {
            temp.push(tile);
        }
    }
    return temp; // Array of Tile objects where tile.selected === true
}
```

**Returns**: Array of `Tile` objects that have `selected === true`

**Usage**:

- Called when user clicks "Confirm" button to get their selection
- Example: `const discardTile = hand.getSelection()[0];`

### `getSelectionCount()`

**Purpose**: Return count of currently selected tiles (by iterating and counting)

**Behavior**:

```javascript
getSelectionCount() {
    let count = 0;
    for (const tile of this.tileArray) {
        if (tile.selected) {
            count++;
        }
    }
    return count;
}
```

**Key Detail**: This method recounts from scratch each time (doesn't use `selectCount` directly)

- This is actually redundant with the `selectCount` property
- But provides a validation mechanism

---

## Tile Selection/Deselection Logic

### Click Handler Pattern (in `insertHidden()`)

The click handler for tiles is attached in the `insertHidden()` method, which is called for the human player's hidden hand:

```javascript
tile.sprite.on("pointerup", () => {
  if (tile.drag) {
    return; // Ignore click if tile was dragged
  }

  // Get min/max based on game state
  let minSelect = 1;
  let maxSelect = 3;
  // ... (logic to determine min/max per game state)

  debugPrint(
    `Tile clicked. State: ${this.gameLogic.state}, selectCount: ${tileSet.selectCount}, min: ${minSelect}, max: ${maxSelect}`,
  );

  if (maxSelect) {
    if (tile.selected) {
      // CASE 1: DESELECT (tile is already selected)
      tile.selected = false;
      tile.sprite.setDepth(0);
      if (tile.spriteBack) tile.spriteBack.setDepth(0);
      tile.animate(tile.origX, 600, playerObject.playerInfo.angle);
      tileSet.selectCount--;
    } else {
      // CASE 2: SELECT (tile is not selected)

      // Special handling for maxSelect === 1: deselect other tiles first
      if (maxSelect === 1) {
        tileSet.resetSelection();
      }

      // Check if we can add more selections
      if (tileSet.selectCount < maxSelect) {
        // Perform game-state-specific validation
        let bSelectOk = true;
        if (this.gameLogic.state === STATE.LOOP_EXPOSE_TILES) {
          // Must match discard tile or be a joker
          if (
            tile.suit !== SUIT.JOKER &&
            (tile.suit !== this.gameLogic.discardTile.suit ||
              tile.number !== this.gameLogic.discardTile.number)
          ) {
            bSelectOk = false;
            this.gameLogic.displayErrorText("Select same tile or joker...");
          }
        }
        if (
          this.gameLogic.state === STATE.CHARLESTON1 ||
          this.gameLogic.state === STATE.CHARLESTON2 ||
          this.gameLogic.state === STATE.COURTESY
        ) {
          // Cannot select jokers or blanks
          if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
            bSelectOk = false;
            this.gameLogic.displayErrorText("Cannot select jokers/blanks...");
          }
        }

        if (bSelectOk) {
          tile.selected = true;
          tile.sprite.setDepth(150);
          if (tile.spriteBack) tile.spriteBack.setDepth(150);
          tile.animate(tile.origX, 575, playerObject.playerInfo.angle);
          tileSet.selectCount++;
        }
      }
    }

    // Enable/disable button based on valid range
    if (tileSet.selectCount >= minSelect && tileSet.selectCount <= maxSelect) {
      window.document.getElementById("button1").disabled = false;
    } else {
      window.document.getElementById("button1").disabled = true;
    }
  }
});
```

---

## Visual Feedback System

### Y-Position Change

Selection state is communicated to the user through vertical positioning:

- **Y = 600**: "Normal" position - tile is deselected, sitting in the rack
- **Y = 575**: "Elevated" position - tile is selected, raised 25 pixels above the rack
  - This visual distinction makes selections immediately clear
  - Selected tiles "pop up" when clicked
  - `tile.animate(tile.origX, 575, angle)` moves to selected position
  - `tile.animate(tile.origX, 600, angle)` moves to deselected position

### Depth (Z-Order) Change

Selection also affects rendering order:

- **depth = 0**: Normal depth - tile blends with others
- **depth = 150**: Raised depth - tile renders on top of all other tiles
  - Prevents other tiles from obscuring selected tiles
  - Both `tile.sprite` and `tile.spriteBack` get depth adjusted

### Animation

The `animate()` method smoothly transitions the tile:

```javascript
tile.animate(x, y, angle, duration);
```

- Takes current position and animates to new (x, y)
- Preserves smooth UX - not a jarring snap

---

## Validation Rules by Game State

### Charleston Phase (CHARLESTON1, CHARLESTON2)

- **minSelect**: 3
- **maxSelect**: 3
- **Restrictions**:
  - Cannot select JOKER tiles
  - Cannot select BLANK tiles
  - Must select exactly 3 tiles to enable "Confirm" button
  - User cannot proceed without exactly 3 selected

### Courtesy Pass Phase (COURTESY, COURTESY_QUERY)

- **minSelect**: 1
- **maxSelect**: 3
- **Restrictions**:
  - Cannot select JOKER tiles
  - Cannot select BLANK tiles
  - Can select 1-3 tiles

### Main Game Loop - Discard Phase (LOOP_CHOOSE_DISCARD)

- **minSelect**: 1
- **maxSelect**: 1
- **Special Behavior**:
  - When `maxSelect === 1`, selecting a tile automatically deselects any previous selection
  - `if (maxSelect === 1) tileSet.resetSelection();` is called before selecting
  - Only one tile can be selected at a time

### Exposure Phase (LOOP_EXPOSE_TILES)

- **minSelect**: Variable (depends on claim type)
- **maxSelect**: Variable
- **Restrictions**:
  - Can ONLY select:
    1. Tiles matching the discarded tile (same suit + rank), OR
    2. JOKER tiles
  - All selected tiles must form valid pung/kong/quint with the discard
  - Validation: `if (tile.suit !== SUIT.JOKER && (tile.suit !== discardTile.suit || tile.number !== discardTile.number))`

---

## Validation Timing

### When Validation Occurs

Validation happens **during** the click handler, before selection state is modified:

1. Check if `tile.selected` (know current state)
2. If deselecting: just deselect (no validation needed)
3. If selecting:
   - Check if we have capacity: `if (tileSet.selectCount < maxSelect)`
   - Perform game-state-specific validation
   - Only set `tile.selected = true` if all checks pass
4. After any change: update button enable/disable state based on `selectCount` vs min/max

### Button Enable/Disable Logic

```javascript
if (tileSet.selectCount >= minSelect && tileSet.selectCount <= maxSelect) {
  window.document.getElementById("button1").disabled = false; // Enable
} else {
  window.document.getElementById("button1").disabled = true; // Disable
}
```

- Button is **disabled** if selection count is outside valid range
- Button is **enabled** only when count is within [minSelect, maxSelect]
- This prevents user from confirming invalid selections

---

## Drag and Drop Integration

### Drag Detection

The system distinguishes between clicks and drags:

```javascript
if (tile.drag) {
  return; // Ignore the click if this was a drag operation
}
```

- `tile.drag` is set to `true` on `dragstart`
- Set back to `false` on `dragend`
- Click handlers ignore the pointerup if drag occurred

### Dragged Tile Deselection

When a tile is dragged and dropped:

```javascript
if (tile.selected) {
  tile.selected = false;
  tile.sprite.setDepth(0);
  if (tile.spriteBack) {
    tile.spriteBack.setDepth(0);
  }
  tileSet.selectCount--;
}
// Position is updated during drag/drop repositioning
```

- If a selected tile is dragged, it's automatically deselected
- Depth is reset to normal
- SelectCount is decremented
- Y-position moves back to 600 (grid level)

---

## Important Edge Cases

### 1. maxSelect === 1 Special Case

When only one tile can be selected (discard phase):

```javascript
if (maxSelect === 1) {
  tileSet.resetSelection(); // Clear all before selecting new one
}
```

### 2. Exposure Tile Matching

Cannot select arbitrary tiles during exposure - must match the discard:

```javascript
if (this.gameLogic.state === STATE.LOOP_EXPOSE_TILES) {
  if (
    tile.suit !== SUIT.JOKER &&
    (tile.suit !== this.gameLogic.discardTile.suit ||
      tile.number !== this.gameLogic.discardTile.number)
  ) {
    bSelectOk = false;
  }
}
```

### 3. Charleston/Courtesy Restrictions

Cannot pass or trade jokers and blanks:

```javascript
if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
  bSelectOk = false;
}
```

### 4. Mixed TileSets

The `Hand` object has TWO tilesets:

- **`tileSet`**: Exposed (visible) tiles
- **`hiddenTileSet`**: Hidden (face-down) tiles

Each maintains its own `selectCount`, `tileArray`, and selection state. They're managed independently but the `Hand` provides aggregate methods like `getSelection()` that combine both.

---

## Methods That Use Selection

### `removeDiscard()` (Hidden TileSet only)

Called when user confirms a discard:

```javascript
removeDiscard() {
    if (this.hiddenTileSet.inputEnabled) {
        const selectedTiles = this.hiddenTileSet.getSelection();
        tile = selectedTiles[0]; // Get first (and only) selected
        this.hiddenTileSet.resetSelection(); // Clear selection
    }
    this.removeHidden(tile); // Remove from hand
    return tile;
}
```

---

## Summary Table

| Property              | Type    | Purpose                 | When Changed                                  |
| --------------------- | ------- | ----------------------- | --------------------------------------------- |
| `tile.selected`       | boolean | Is this tile selected?  | On click, drag, or reset                      |
| `tile.sprite.y`       | number  | Visual Y position       | Animate to 575 (selected) or 600 (deselected) |
| `tile.sprite.depth`   | number  | Z-order for rendering   | Set to 150 (selected) or 0 (deselected)       |
| `tileSet.selectCount` | number  | Count of selected tiles | Increment on select, decrement on deselect    |
| Button enable state   | boolean | Can user confirm?       | Based on `selectCount >= min && <= max`       |

---

## Design Principles

1. **Selection state lives on tiles**: Each tile knows if it's selected (`tile.selected`)
2. **Count is maintained**: TileSet keeps a running `selectCount` for quick validation
3. **Visual feedback is immediate**: Position and depth change animates the selection visually
4. **Validation before mutation**: Check constraints before changing selection state
5. **Button acts as gatekeeper**: Prevents confirming invalid selections
6. **Symmetry**: Select and deselect operations are mirror images (same animations, same state changes, opposite direction)

This design was proven and working in commit 07c41b9, so the new `SelectionManager` should maintain these principles while abstracting the implementation.
