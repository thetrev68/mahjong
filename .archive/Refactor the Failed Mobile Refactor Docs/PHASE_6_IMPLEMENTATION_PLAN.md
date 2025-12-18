# Phase 6: Complete Elimination of Legacy Hand/Player/Table Objects

## Executive Summary

**Goal**: Delete `gameObjects_hand.js` (1278 lines), `gameObjects_player.js` (25 lines), and minimize `gameObjects_table.js`.

**Status**: Phases 1-5 completed, but dependencies remain. Phase 5 eliminated table coupling in **managers**, but **PhaserAdapter** still accesses `table.players[].hand`.

**Complexity**: MEDIUM-HIGH

- 19 references to `this.table` in PhaserAdapter
- 4 Hand methods still in use: `setValidationMode()`, `showHand()`, `hiddenTileSet.getTileArray()`, `calculateTilePosition()`
- SelectionManager depends on `hand.hiddenTileSet.getTileArray()` (4 locations)
- BlankSwapManager depends on hand reference

**Context Window Risk**: MODERATE (~95K tokens used, ~105K remaining)

---

## Current Architecture (Broken)

```
GameScene creates Table
  ↓
Table creates 4 Player objects (gameObjects_player.js)
  ↓
Player creates Hand object (gameObjects_hand.js)
  ↓
PhaserAdapter accesses table.players[i].hand for:
  - setValidationMode() - 5 times
  - hiddenTileSet.getTileArray() - 2 times
  - calculateTilePosition() - 1 time
  - sortSuitHidden() - 1 time
  ↓
SelectionManager.constructor(hand) accesses:
  - hand.hiddenTileSet.getTileArray() - 4 times
  ↓
HandRenderer mutates:
  - hand.hiddenTileSet.tileArray (lines 56-73)
  - hand.exposedTileSetArray (indirect)
```

---

## Target Architecture (Clean)

```
GameController (owns PlayerData[] with HandData)
  ↓ emits HAND_UPDATED events
PhaserAdapter
  ↓ calls
HandRenderer.syncAndRender(playerIndex, handData)
  ↓ converts HandData → Phaser sprites
  ↓ stores in this.playerHands[playerIndex].hiddenTiles
  ↓ positions sprites using PLAYER_LAYOUT

SelectionManager gets tiles via:
  HandRenderer.getHiddenTiles(playerIndex)

Validation mode managed by:
  SelectionManager.setMode(mode) - NOT Hand object
```

---

## Files Created (Ready to Use)

1. ✅ **[desktop/config/playerLayout.js](desktop/config/playerLayout.js)** - PLAYER_LAYOUT constant extracted from gameObjects_table.js
2. ✅ **[desktop/renderers/HandRenderer.new.js](desktop/renderers/HandRenderer.new.js)** - Clean HandRenderer with accessor methods
3. ✅ **[core/card/CardHand.js](core/card/CardHand.js)** - Minimal Hand for card validator only

---

## Files Modified (CardHand Migration Complete)

1. ✅ **[core/card/card.js](core/card/card.js#L3)** - Uses CardHand instead of gameObjects Hand
2. ✅ **[core/card/2017/card_test.js](core/card/2017/card_test.js#L3)** - Uses CardHand
3. ✅ **[core/card/2018/card_test.js](core/card/2018/card_test.js#L3)** - Uses CardHand
4. ✅ **[core/card/2019/card_test.js](core/card/2019/card_test.js#L3)** - Uses CardHand
5. ✅ **[core/card/2020/card_test.js](core/card/2020/card_test.js#L3)** - Uses CardHand

---

## Implementation Steps

### Step 1: Replace HandRenderer (CRITICAL PATH)

**File**: [desktop/renderers/HandRenderer.js](desktop/renderers/HandRenderer.js)

**Action**: Replace entire file with HandRenderer.new.js content

**Changes**:

```javascript
// OLD constructor
constructor(scene, table, tileManager) {
    this.table = table;  // ❌ REMOVE
}

// NEW constructor
constructor(scene, tileManager) {
    this.scene = scene;
    this.tileManager = tileManager;
    this.playerHands = [/* 4 player hand states */];
}

// NEW accessor methods (already in HandRenderer.new.js)
getHiddenTiles(playerIndex) { return this.playerHands[playerIndex].hiddenTiles; }
getExposedSets(playerIndex) { return this.playerHands[playerIndex].exposedSets; }
```

**Impact**:

- PhaserAdapter.constructor line 54 changes from `new HandRenderer(scene, table, tileManager)` to `new HandRenderer(scene, tileManager)`
- All HandRenderer method calls work identically (syncAndRender, showHand)

---

### Step 2: Update PhaserAdapter Constructor

**File**: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js#L54)

**Current**:

```javascript
this.handRenderer = new HandRenderer(scene, table, this.tileManager);
```

**New**:

```javascript
this.handRenderer = new HandRenderer(scene, this.tileManager);
```

---

### Step 3: Eliminate setValidationMode() Calls

**File**: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

**Locations**: Lines 159-183 in `onStateChanged()`

**Current**:

```javascript
const humanHand = this.table.players[0].hand;
switch (newState) {
  case "CHARLESTON1":
    humanHand.setValidationMode("charleston");
    break;
  // ... etc
}
```

**Solution**: Move validation mode to SelectionManager

**New**:

```javascript
// Validation mode is set when enableTileSelection() is called
// No separate setValidationMode needed
// SelectionManager already receives mode parameter in enableTileSelection(min, max, mode)
```

**Action**: DELETE lines 158-184 entirely. Validation mode already set correctly by existing enableTileSelection() calls.

---

### Step 4: Fix showHand() Calls

**File**: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

**Location 1**: Line 249 (wall game - show all hands face-up)

```javascript
// OLD
this.table.players.forEach((player) => player.showHand(true));

// NEW
for (let i = 0; i < 4; i++) {
  this.handRenderer.showHand(i, true); // Force all face-up
}
```

**Location 2**: Line 403 (already correct - uses handRenderer)
**Location 3**: Line 1019 (already correct - uses handRenderer)

---

### Step 5: Fix hiddenTileSet.getTileArray() Access

**File**: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

**Location 1**: Line 379 `player.hand.hiddenTileSet.getLength()`

```javascript
// OLD
const targetPos = player.hand.calculateTilePosition(
  playerInfo.angle,
  player.hand.hiddenTileSet.getLength() - 1,
);

// NEW
const hiddenTiles = this.handRenderer.getHiddenTiles(playerIndex);
const targetPos = this.calculateTilePosition(
  playerInfo.angle,
  hiddenTiles.length - 1,
);
```

**Action**: Extract `calculateTilePosition()` to a utility or put in HandRenderer.

**Location 2**: Line 589 `humanHand.hiddenTileSet.tileArray`

```javascript
// OLD
const tilesInHand = humanHand.hiddenTileSet.tileArray || [];

// NEW
const tilesInHand = this.handRenderer.getHiddenTiles(PLAYER.BOTTOM);
```

---

### Step 6: Fix sortSuitHidden() Call

**File**: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js#L1018)

**Current**:

```javascript
humanPlayer.hand.sortSuitHidden();
this.handRenderer.showHand(PLAYER.BOTTOM, true);
```

**New**:

```javascript
// Sorting already happens in HandRenderer.syncAndRender() for Player 0
// Just re-render:
this.handRenderer.showHand(PLAYER.BOTTOM, true);
```

**OR** (if manual sort needed):

```javascript
const handData = this.gameController.players[PLAYER.BOTTOM].hand;
handData.sortBySuit();
this.handRenderer.syncAndRender(PLAYER.BOTTOM, handData);
```

---

### Step 7: Fix SelectionManager Constructor

**File**: [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js#L22)

**Current**:

```javascript
constructor(hand, playerAngle, buttonManager = null) {
    this.hand = hand;  // ❌ Legacy Hand object
```

**New**:

```javascript
constructor(handRenderer, playerAngle, buttonManager = null) {
    this.handRenderer = handRenderer;
    this.playerIndex = 0;  // SelectionManager only used for PLAYER.BOTTOM
```

**getTileArray() calls** (lines 311, 354, 507, 760):

```javascript
// OLD
const tiles = this.hand.hiddenTileSet.getTileArray();

// NEW
const tiles = this.handRenderer.getHiddenTiles(this.playerIndex);
```

**Update PhaserAdapter line 63**:

```javascript
// OLD
this.selectionManager = new SelectionManager(
  humanHand,
  PLAYER_LAYOUT[PLAYER.BOTTOM].angle,
  this.buttonManager,
);

// NEW
this.selectionManager = new SelectionManager(
  this.handRenderer,
  PLAYER_LAYOUT[PLAYER.BOTTOM].angle,
  this.buttonManager,
);
```

---

### Step 8: Fix table.reset() and table.switchPlayer()

**File**: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

**Location 1**: Line 216 `this.table.reset()`

```javascript
// This calls table.reset() which calls player.hand.reset()
// Solution: Call reset on each player's HandData instead
```

**Check what table.reset() does**:

```javascript
// In gameObjects_table.js:101-116
reset() {
    for (let i = 0; i < 4; i++) {
        this.players[i].hand.reset(this.wall);  // Returns tiles to wall
    }
    // ... reset discards ...
}
```

**New approach**:

```javascript
// In PhaserAdapter.onGameReset():
// GameController already resets PlayerData/HandData
// Just need to reset wall sprites:
this.table.reset(); // Keep for wall.tileArray management
// OR extract wall management to TileManager
```

**Location 2**: Line 612 `this.table.switchPlayer(currentPlayer)`

```javascript
// gameObjects_table.js:119-136 - just logs messages
// SOLUTION: Delete this method entirely, replace with debug logging
printMessage(`Player ${currentPlayer}'s turn`);
```

---

### Step 9: Extract calculateTilePosition()

**Current**: Hand.calculateTilePosition() in gameObjects_hand.js

**Options**:
A. Move to HandRenderer as a public method
B. Move to a shared utility file
C. Inline the logic where needed (only 1 usage)

**Recommendation**: Option A - add to HandRenderer

```javascript
// In HandRenderer.new.js
calculateTilePosition(playerAngle, tileIndex) {
    // Copy logic from gameObjects_hand.js:715-750
}
```

---

### Step 10: Update GameScene to Create HandRenderer

**File**: [desktop/scenes/GameScene.js](desktop/scenes/GameScene.js)

**Current**: PhaserAdapter is created with table (line 119-123)

**Change**: PhaserAdapter constructor no longer needs full table, just wall/discards

**Option A**: Keep table minimal (just wall/discards)
**Option B**: Pass wall/discards directly to PhaserAdapter

**Recommendation**: Option A for now (smaller change)

---

### Step 11: Delete Legacy Files

**After all above steps pass tests:**

1. Delete [desktop/gameObjects/gameObjects_hand.js](desktop/gameObjects/gameObjects_hand.js) (-1278 lines)
2. Delete [desktop/gameObjects/gameObjects_player.js](desktop/gameObjects/gameObjects_player.js) (-25 lines)
3. Minimize [desktop/gameObjects/gameObjects_table.js](desktop/gameObjects/gameObjects_table.js):
   - Remove Player import
   - Remove gPlayerInfo constant (now in playerLayout.js)
   - Keep Wall, Discards, and minimal table structure

---

## Testing Checklist

After each step, run:

```bash
npm test                    # All Playwright tests
npm run test:headed         # Visual verification
```

**Critical test scenarios**:

- [ ] Charleston phase (tile selection with min/max validation)
- [ ] Discard tile (single selection)
- [ ] Claim discard with exposure (tile selection for pung/kong)
- [ ] Joker swap (tile selection for exposed jokers)
- [ ] Sort by suit/rank buttons
- [ ] AI hint system (glow effects on tiles)
- [ ] Wall game (all hands shown face-up)
- [ ] New game reset

---

## Rollback Plan

If issues arise:

1. Git stash all changes
2. Restore from last commit before Phase 6
3. Review failures in test output
4. Create bug report with specific failure modes

---

## Estimated Effort

- **Step 1-2**: 5 minutes (file replacement + import update)
- **Step 3**: 2 minutes (delete validation mode code)
- **Step 4**: 3 minutes (fix showHand calls)
- **Step 5**: 10 minutes (fix hiddenTileSet access + extract calculateTilePosition)
- **Step 6**: 2 minutes (fix sort call)
- **Step 7**: 15 minutes (SelectionManager refactor - most complex)
- **Step 8**: 10 minutes (table.reset/switchPlayer)
- **Step 9**: Included in Step 5
- **Step 10**: 5 minutes (GameScene update)
- **Step 11**: 5 minutes (delete files)

**Total**: ~1 hour of implementation
**Testing**: ~30 minutes
**Total with buffer**: ~2 hours

---

## Decision Point

**Execute now** (106K tokens remaining):

- ✅ Clear plan documented
- ✅ All preparatory files created
- ✅ Scope well-understood
- ⚠️ Context window at 47% usage
- ⚠️ Moderate complexity

**Hand off to fresh session**:

- ✅ This document provides complete roadmap
- ✅ Fresh context window
- ✅ Can reference this plan explicitly
- ❌ Need to reload mental model

**Recommendation**: **Execute now**. We have enough context window, clear plan, and I understand all the dependencies. The refactor is incremental and testable at each step.

---

## Success Criteria

1. ✅ All desktop tests passing (10 tests)
2. ✅ `npm run knip` reports `gameObjects_hand.js` and `gameObjects_player.js` as unused
3. ✅ No runtime errors in browser console
4. ✅ Hand rendering works correctly for all 4 players
5. ✅ Tile selection works in all game phases
6. ✅ AI hints display correctly
7. ✅ Sort buttons work
8. ✅ Wall game shows all hands face-up

---

## Progress Update (Current Session)

### ✅ Completed Steps:

1. ✅ Step 1: Replaced HandRenderer.js with clean version (no table dependency)
2. ✅ Step 2: Updated PhaserAdapter constructor to use `new HandRenderer(scene, tileManager)`
3. ✅ Step 3: Eliminated all setValidationMode() calls (lines 158-184 removed)
4. ✅ Step 4: Fixed showHand() calls - wall game now uses `handRenderer.showHand(i, true)`
5. ✅ Step 5 (partial):
   - Added `calculateTilePosition()` to HandRenderer
   - Fixed onTileDrawn to use `handRenderer.getHiddenTiles()` and `handRenderer.calculateTilePosition()`
   - Fixed onHandUpdated to use `handRenderer.getHiddenTiles()` for selection validation

### 🔨 In Progress:

- Step 5: Still 9 references to `table.players` remaining in PhaserAdapter (lines 64, 65, 343, 442, 492, 514, 978, 987, 1006)

### ⏳ Remaining Work:

- Complete Step 5 (fix remaining table.players references)
- Step 6: Fix sortSuitHidden() call
- Step 7: Fix SelectionManager constructor (needs handRenderer instead of hand)
- Step 8: Fix table.reset/switchPlayer
- Step 9: Update GameScene
- Step 10: Delete legacy files
- Step 11: Run full test suite

### Context Window Status:

- Used: ~120K / 200K tokens (60%)
- Remaining: ~80K tokens (40%)
- **Recommendation**: Continue in this session. Plenty of headroom.
