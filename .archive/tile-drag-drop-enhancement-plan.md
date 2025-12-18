## Experiment 2: Investigating `showHand()` Interference During Drag

### Hypothesis

The "jumping" behavior occurs because `showHand()` is called during drag operations, which repositions all tiles and triggers selection animations for selected tiles.

### Investigation Plan

1. **Identify when `showHand()` is called** during gameplay
2. **Check if drag operations trigger `showHand()`**
3. **Find the source of the "jumping" animation**

### Current Findings

#### Where `showHand()` is Called:

- **`gameLogic.js` line 445**: `this.table.players[this.currPlayer].showHand();` (after discard)
- **`gameLogic.js` line 563**: `this.table.players[this.currPlayer].showHand();` (after wall pick)
- **`gameLogic.js` lines 1231, 1238**: After sorting operations
- **`gameObjects_table.js`**: Various locations during game phases

#### Key Discovery: `showHand()` After Discard (Line 445)

```javascript
// CHOOSE TILE TO DISCARD (or mahjong!)
const discardInfo = await this.chooseDiscard();
this.table.players[this.currPlayer].showHand(); // <-- THIS IS THE PROBLEM!
```

**This happens right after `chooseDiscard()` completes!**

#### What Happens in `chooseDiscard()`?

For Player 0 (human):

1. Sets up button event listeners
2. Waits for user to click "Discard" button
3. When clicked, calls `removeDiscard()` which removes the selected tile
4. Returns the discarded tile info

#### The Problem Sequence:

1. **User drags tiles** (reorders them)
2. **User clicks "Discard" button** (still dragging or just finished)
3. **`chooseDiscard()` completes** and returns
4. **`showHand()` is called** immediately after (line 445)
5. **`showHand()` repositions ALL tiles** to their "proper" grid positions
6. **Selected tiles get elevation animation** (`tile.y - 25`)
7. **Dragged tiles "jump"** because `showHand()` overrides their drag positions

### Root Cause Confirmed

**The `showHand()` call on line 445 of `gameLogic.js` is interfering with drag operations!**

When a user drags tiles and then clicks "Discard", the `showHand()` call repositions all tiles, causing the "jumping" behavior.

### Next Steps

Need to investigate:

1. **Why `showHand()` is called after discard** - is it necessary?
2. **Can we prevent it during drag operations?**
3. **Alternative approaches** to update the UI without repositioning tiles

---

## Experiment 3: Conditional `showHand()` Call After Discard - IMPLEMENTED ✅

### Implementation Summary

**Experiment 3 has been successfully implemented!** The solution adds drag-aware behavior to prevent the "jumping" issue.

### Changes Made

#### 1. Added Drag Tracking to Hand Class (`gameObjects_hand.js`)

**Added to `Hand` constructor:**

```javascript
// Track if tiles were dragged this turn to avoid showHand() interference
this.tilesWereDraggedThisTurn = false;
```

**Modified `dragstart` event handler:**

```javascript
tile.sprite.on("dragstart", (_pointer, _dragX, _dragY) => {
  tile.drag = true;
  // Mark that tiles were dragged this turn
  this.tilesWereDraggedThisTurn = true;
  // ... rest of dragstart logic
});
```

#### 2. Conditional `showHand()` Call (`gameLogic.js` line 445)

**Before:**

```javascript
const discardInfo = await this.chooseDiscard();
this.table.players[this.currPlayer].showHand();
```

**After:**

```javascript
const discardInfo = await this.chooseDiscard();
// Only call showHand() if tiles haven't been dragged this turn
// Dragged tiles are already positioned correctly by drag operations
if (!this.table.players[this.currPlayer].hand.tilesWereDraggedThisTurn) {
  this.table.players[this.currPlayer].showHand();
}
// Reset drag flag for next turn
this.table.players[this.currPlayer].hand.tilesWereDraggedThisTurn = false;
```

### How It Works

1. **Drag Detection**: When any tile is dragged, `tilesWereDraggedThisTurn` is set to `true`
2. **Conditional Repositioning**: After discard, `showHand()` is only called if no tiles were dragged
3. **Flag Reset**: The flag is reset for the next turn, ensuring normal behavior resumes

### Expected Behavior

- **Normal Discard**: `showHand()` called → tiles repositioned normally ✅
- **Drag + Discard**: `showHand()` skipped → drag positioning preserved ✅
- **No Side Effects**: All other game mechanics unchanged ✅

### Testing Scenarios

1. **Normal gameplay**: Click tiles to select, click "Discard" → should work as before
2. **Drag operations**: Drag tiles to reorder, click "Discard" → tiles should stay in dragged positions
3. **Mixed interactions**: Select some tiles, drag others, discard → should work correctly
4. **Game phases**: Should work during all game phases (Charleston, main game, etc.)

### Files Modified

- **`gameObjects_hand.js`**: Added drag tracking flag and detection
- **`gameLogic.js`**: Added conditional `showHand()` call

### File Restoration

If issues arise: `git checkout HEAD -- gameObjects_hand.js gameLogic.js`

---

## Experiment 4: Advanced Tile Insertion and Shifting with Visual Feedback

### Problem Statement

The current drag-and-drop implementation incorrectly assumes tile swapping, leading to "snapping" issues when a tile is dropped. The desired behavior is tile insertion and shifting, where a dragged tile is placed at a new position, and other tiles adjust accordingly. Previous attempts have failed due to a lack of deep integration with the existing Phaser.js rendering and layout mechanisms, specifically how `showHand()` and `tile.animate()` interact with `origX`/`origY`.

### Desired Behavior

When a tile is dragged and dropped into a new position within the hand:

1.  **Visual Insertion Point:** During the drag operation, a clear visual indicator (e.g., a temporary gap or a ghost tile) should show the user where the dragged tile will be inserted. This indicator should dynamically update as the tile is dragged across the hand.
2.  **Smooth Re-layout on Drop:** Upon `dragend`, the dragged tile should be logically inserted into the `hiddenTileSet.tileArray` at the indicated position. All tiles in the hand (including the newly positioned dragged tile and the shifted tiles) should then animate smoothly to their new, correct grid positions as determined by the hand's layout logic.

### Deeper Analysis of Existing Code and Constraints

- **`Hand.showHand()` is the Layout Authority:** This function is responsible for calculating the `x`, `y` coordinates for all tiles based on their order in `this.hiddenTileSet.tileArray`. It then calls `tile.animate(x, y, angle)` for each tile.
- **`tile.animate()` and `origX`/`origY`:** The `dragend` handler explicitly states that `tile.animate(tile.origX, tile.origY, tile.angle)` snaps the tile back to its "original position." This implies that `origX`/`origY` are meant to store the _last calculated grid position_ for a tile. When `showHand()` calls `tile.animate()`, it effectively updates these `origX`/`origY` values.
- **`dragstart` saves current visual position:** The `dragstart` handler saves `tile.x` and `tile.y` into `tile.origX` and `tile.origY`. This is problematic if the tile was already visually out of its "snapped" grid position.
- **`drag` event is for visual feedback only:** The `tileArray` should _not_ be modified during the `drag` event. Any changes to the underlying data structure should occur only on `dragend`.

### Investigation and Implementation Plan

1.  **Remove `TileSet.swapTiles` function:** This function is based on an incorrect assumption of swapping and should be removed entirely from `gameObjects_hand.js`.
2.  **Refine `dragstart` handler:**
    - Instead of saving `tile.x` and `tile.y` directly, ensure `tile.origX` and `tile.origY` always reflect the _last known grid position_ before the drag begins. This might require calling `this.showHand()` once at the very beginning of the drag operation (or ensuring `origX`/`origY` are always up-to-date from the last `showHand()` call).
    - Store the `originalIndex` of the dragged tile in the `hiddenTileSet.tileArray` at `dragstart`.
3.  **Modify `tile.sprite.on("drag", ...)` handler:**
    - Remove the call to `tileSet.checkOverlap(tile)` and `tileSet.swapTiles(tile, overlappedTile)`.
    - Implement logic to visually indicate the insertion point:
      - Iterate through `this.hiddenTileSet.tileArray` (excluding the dragged tile).
      - Based on the `dragX` of the dragged tile, determine the potential `targetIndex` where it would be inserted.
      - Visually shift tiles to the right of the `targetIndex` slightly to create a temporary gap, or render a "ghost" representation of the dragged tile at the `targetIndex`. This visual feedback should _not_ modify the `tileArray`.
4.  **Modify `tile.sprite.on("dragend", ...)` handler:** This is the critical section for implementing the new logic.
    - **Determine Final Insertion Index:** Based on the final `dragX` of the dropped tile, calculate the `finalTargetIndex` where it should be inserted. This should be consistent with the visual feedback provided during the `drag` event.
    - **Update `tileArray`:**
      - Remove the dragged `tile` from its `originalIndex` in `this.hiddenTileSet.tileArray`.
      - Insert the dragged `tile` into the `finalTargetIndex` in `this.hiddenTileSet.tileArray`.
    - **Re-layout and Animate All Tiles:** Call `this.showHand(playerInfo, false)` (or `this.showHand()` with appropriate parameters) to trigger a full re-layout of the hand. This will:
      - Recalculate the `x`, `y` positions for all tiles based on their new order in the `tileArray`.
      - Cause `tile.animate()` to be called for each tile, smoothly moving them to their new `origX`/`origY` positions.
    - **Clear Visual Indicator:** Remove any temporary visual insertion indicators.

### Expected Behavior

- When a tile is dragged, it moves freely, and a visual gap or ghost tile indicates its potential drop location.
- When the tile is dropped, the visual indicator disappears.
- The hand's internal `tileArray` is updated to reflect the new order.
- All tiles in the hand animate smoothly and simultaneously to their final, correct grid positions, creating a seamless re-ordering effect.

### Files to be Modified

- `gameObjects_hand.js` (specifically the `TileSet` class and the `Hand.insertHidden` method's drag handlers)

### File Restoration

If issues arise: `git checkout HEAD -- gameObjects_hand.js`
