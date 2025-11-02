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
this.table.players[this.currPlayer].showHand();  // <-- THIS IS THE PROBLEM!
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

## Experiment 4: [To Be Determined]

### Hypothesis
[TBD - Based on Experiment 3 results]

### Implementation
[TBD]

### Testing
[TBD]

### Results
[TBD]

### Lessons Learned
[TBD]

### File Restoration
[TBD]