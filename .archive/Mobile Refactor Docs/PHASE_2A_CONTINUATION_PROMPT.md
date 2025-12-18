# Phase 2A Continuation: Complete Desktop Integration

**Context:** Phase 1B complete (GameController + data models). PhaserAdapter prototype created (80% done). Need to complete desktop integration and test that existing game still works.

**Assignee:** Claude Sonnet 4.5
**Estimated Tokens:** 10K
**Complexity:** High
**Status:** PhaserAdapter core bridge created, needs integration + testing

---

## Current State

### ✅ Phase 1B Complete

- `core/GameController.js` - Event-driven state machine (380 lines)
- `core/models/` - TileData, HandData, PlayerData (reviewed by Haiku)
- `core/events/EventEmitter.js` - Pub/sub system
- `MOBILE_INTERFACES.md` - Complete specifications

### ✅ Phase 2A Started

- `desktop/adapters/PhaserAdapter.js` - Core adapter created (400+ lines)
  - Listens to 20+ GameController events
  - Converts TileData ↔ Phaser Tiles
  - Handles desktop UI prompts (buttons)
  - Maps to existing printMessage/printInfo

### ❌ Phase 2A Remaining Tasks

1. **Test PhaserAdapter** - Verify event handling works
2. **Integrate with desktop** - Wire up GameController in existing codebase
3. **Fix any integration issues** - Adapt as needed
4. **Verify desktop still works** - Full game playthrough

---

## Task 1: Review & Fix PhaserAdapter

### Issues to Address

**1. Tile Selection Integration**
The adapter calls `player.hand.enableSelection()` but the current Hand class doesn't have this method. Need to either:

- Add `enableSelection(callback)` to Hand class, OR
- Use existing button-based selection from GameLogic

**Current code (line ~267):**

```javascript
setupDiscardPrompt(options) {
    const player = this.table.players[PLAYER.BOTTOM];

    // This method doesn't exist yet!
    player.hand.enableSelection((selectedTile) => {
        if (this.pendingPromptCallback) {
            const tileData = TileData.fromPhaserTile(selectedTile);
            this.pendingPromptCallback(tileData);
        }
    });
}
```

**Solution Options:**

- **Option A:** Keep existing GameLogic tile selection, adapt PhaserAdapter to use it
- **Option B:** Add selection method to Hand class (requires more changes)

**Recommended:** Option A (least invasive)

---

**2. Sprite Name Generation**
`getTileSpriteName()` returns placeholder. Need to match actual sprite atlas naming.

**Current code (line ~115):**

```javascript
getTileSpriteName(tileData) {
    // TODO: This should match the sprite naming in gameObjects.js Wall.create()
    return `tile_${tileData.suit}_${tileData.number}`;
}
```

**Check:** Look at `assets/tiles.json` to see actual sprite names.

**Example from gameObjects.js Wall.create():**

```javascript
// Cracks, Bams, Dots: "C1", "C2", ... "B1", "B2", ... "D1", "D2", ...
// Winds: "N", "S", "W", "E"
// Dragons: "DC" (red), "DB" (green), "DD" (white)
// Flowers: "F1", "F2", "F3", "F4"
// Jokers: "J"
```

**Fix:** Implement proper sprite name mapping based on suit/number.

---

**3. Import Path for TileData**
TileData.js now imports from `../tileDefinitions.js` (Haiku moved gTileGroups).

**Check if this file exists:**

```bash
ls core/tileDefinitions.js
```

**If missing:** Need to create it or adjust import.

---

## Task 2: Integrate GameController into Desktop

### Current Desktop Flow

```
main.js → GameScene.create() → new GameLogic() → GameLogic.start()
```

### Target Desktop Flow

```
main.js → GameScene.create() → new GameController() → new PhaserAdapter() → GameController.startGame()
```

### Integration Steps

**Step 1: Create desktop/ folder structure**

```bash
mkdir -p desktop/adapters
# PhaserAdapter.js already created in desktop/adapters/

# Don't move files yet - test with current structure first
```

**Step 2: Modify GameScene.js to use GameController**

**Current code (GameScene.js:60-66):**

```javascript
// Create game objects
this.gGameLogic = new GameLogic(this);
this.gTable = new Table(this, this.gGameLogic);
this.gGameLogic.table = this.gTable;
await this.gGameLogic.init();
this.gGameLogic.gameAI.table = this.gTable;
```

**New code:**

```javascript
import { GameController } from "./core/GameController.js";
import { PhaserAdapter } from "./desktop/adapters/PhaserAdapter.js";

// Create game objects (keep existing Table/GameLogic for now)
this.gGameLogic = new GameLogic(this);
this.gTable = new Table(this, this.gGameLogic);
this.gGameLogic.table = this.gTable;
await this.gGameLogic.init();

// NEW: Create GameController + Adapter
this.gameController = new GameController();
await this.gameController.init({
  aiEngine: this.gGameLogic.gameAI,
  cardValidator: this.gGameLogic.card,
  settings: {
    year: window.settingsManager.getCardYear(),
    difficulty: window.settingsManager.getDifficulty(),
    useBlankTiles: window.settingsManager.getUseBlankTiles(),
    skipCharleston: false,
  },
});

// Create adapter
this.adapter = new PhaserAdapter(
  this.gameController,
  this, // scene
  this.gTable,
  this.gGameLogic,
);
```

**Step 3: Update Start Button Handler**

**Current code (GameScene.js:101):**

```javascript
this.gGameLogic.start();
```

**New code:**

```javascript
// Use GameController instead of GameLogic
await this.gameController.startGame();
```

---

## Task 3: Test Desktop Integration

### Minimal Test Plan

**Test 1: Game Starts**

- Click "Start Game" button
- Verify tiles are dealt
- Check console for GameController events
- Confirm no errors

**Test 2: Tile Draw**

- Wait for first tile draw
- Check if tile appears in hand
- Verify wall counter updates

**Test 3: Discard**

- Select a tile
- Click discard (or existing button)
- Verify tile moves to discard pile

**Test 4: Charleston (if enabled)**

- Select 3 tiles to pass
- Verify tiles exchange between players

**Test 5: Full Game**

- Play through entire game
- Verify no crashes
- Check that game ends properly

### Debugging Tips

**Enable GameController debug logging:**

```javascript
// In GameController.js, add console.log to emit()
emit(eventType, data) {
    console.log(`[GameController] ${eventType}:`, data);
    // ... existing emit code
}
```

**Check PhaserAdapter is receiving events:**

```javascript
// In PhaserAdapter setupEventListeners(), add logging
gc.on("TILE_DRAWN", (data) => {
  console.log("[PhaserAdapter] TILE_DRAWN:", data);
  this.onTileDrawn(data);
});
```

---

## Task 4: Fix Integration Issues

### Common Issues & Solutions

**Issue 1: GameController doesn't create tiles**
**Cause:** `createWall()` in GameController is placeholder
**Fix:** Use existing `this.gTable.wall` (Phaser wall), don't recreate

**Solution:**

```javascript
// In GameScene.create(), keep existing wall:
this.gTable.create(skipTileCreation);

// In GameController.startGame(), skip createWall():
// this.createWall();  // SKIP - use Phaser wall
```

---

**Issue 2: Tiles not appearing**
**Cause:** PhaserAdapter's `createPhaserTile()` doesn't match existing tile creation
**Fix:** Use `this.gTable.wall.getTile()` instead of creating new tiles

**Solution:**

```javascript
// In PhaserAdapter:
createPhaserTile(tileData) {
    // Find tile in existing wall by index
    const existingTile = this.findTileInWall(tileData.index);
    if (existingTile) {
        return existingTile;
    }

    // Fallback: create new tile (shouldn't happen)
    console.warn("Creating new tile - this shouldn't happen!");
    // ... existing creation code
}

findTileInWall(index) {
    // Search through wall tiles
    for (const tile of this.table.wall.tileArray) {
        if (tile.index === index) {
            return tile;
        }
    }
    return null;
}
```

---

**Issue 3: UI buttons not working**
**Cause:** GameLogic.updateUI() conflicts with PhaserAdapter button setup
**Fix:** Coordinate button state between old and new systems

**Solution:**

```javascript
// In PhaserAdapter, disable GameLogic.updateUI() temporarily:
onStateChanged(data) {
    this.gameLogic.state = data.newState;
    // this.gameLogic.updateUI();  // DISABLE until Phase 2B
}
```

---

## Task 5: Document Integration

### Create Integration Report

**File:** `PHASE_2A_RESULTS.md`

**Contents:**

```markdown
# Phase 2A Integration Results

## Changes Made

- [ ] PhaserAdapter fixes: (list what was changed)
- [ ] GameScene.js integration: (list modifications)
- [ ] Testing results: (pass/fail for each test)

## Known Issues

- Issue 1: ...
- Issue 2: ...

## Next Steps for Phase 2B

- Complete wall/tile synchronization
- Full UI prompt integration
- Remove GameLogic dependency (make GameController fully replace it)
```

---

## Success Criteria

✅ **Desktop game starts without errors**
✅ **Tiles are dealt to all players**
✅ **Human player can draw and discard tiles**
✅ **Wall counter updates correctly**
✅ **Game can complete (Mahjong or wall game)**
✅ **No console errors from GameController or PhaserAdapter**
✅ **Existing desktop functionality preserved**

---

## Files to Modify

1. **`desktop/adapters/PhaserAdapter.js`** - Fix issues listed in Task 1
2. **`GameScene.js`** - Integrate GameController (Task 2)
3. **`core/GameController.js`** - Skip createWall(), use existing Phaser wall
4. **Create `PHASE_2A_RESULTS.md`** - Document results

---

## Reference Files

**Key files to review:**

- `gameLogic.js` - Understand existing game flow
- `gameObjects_table.js` - See how Table/Wall work
- `gameObjects_hand.js` - Understand tile selection
- `MOBILE_INTERFACES.md` - GameController event reference

**Existing architecture:**

```
GameLogic.start()
  → GameLogic.deal()
    → Table.deal()
      → Wall.getTile() x 52
        → Player.hand.insertHidden(tile)
  → GameLogic.charleston()
  → GameLogic.loop()
```

**New architecture (Phase 2A):**

```
GameController.startGame()
  → emits GAME_STARTED
  → emits TILES_DEALT
    → PhaserAdapter.onTilesDealt()
      → Updates Phaser sprites
  → emits CHARLESTON_PHASE
  → emits TILE_DRAWN / TILE_DISCARDED
    → PhaserAdapter updates UI
```

---

## Context from Previous Session

- Token usage so far: ~100K
- Phase 1B created robust GameController with 25+ event types
- PhaserAdapter prototype maps all events to Phaser
- Haiku completed Phase 1A (data model validation)
- Ready for integration testing

---

## Questions to Address

1. **Should we keep both GameLogic and GameController running in parallel?**
   - Recommended: YES for Phase 2A (safer, easier to debug)
   - Phase 2B will gradually phase out GameLogic

2. **How to handle wall/tile management?**
   - Recommended: Keep Phaser Wall, GameController tracks tile state only
   - PhaserAdapter syncs between them

3. **What if tests fail?**
   - Document issues in PHASE_2A_RESULTS.md
   - Create Phase 2B tasks to fix remaining problems
   - Desktop must work at end of Phase 2A (even if not perfect)

---

**Phase 2A Status:** 80% complete - needs integration + testing
**Estimated completion:** 2-4 hours work
**Critical for:** Keeping desktop working while building mobile

Good luck! 🚀
