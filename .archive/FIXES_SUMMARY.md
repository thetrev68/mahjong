# Summary of Fixes for Game Freeze Issues

## Problem We Were Solving
Game was freezing during Charleston phase with error:
```
AIEngine.js:214 Cannot read properties of undefined (reading 'rankHandArray14')
Creating new tile for index -1 - this shouldn't happen!
```

## Root Causes Identified

### 1. **AIEngine Initialization Order** ✅
**Commit:** `fdc25b8`
- AIEngine was being created BEFORE Card was initialized
- Card's async init() must complete before AIEngine can use it
- **Fix:** Reorder GameScene.js to create Card first, then pass to AIEngine

### 2. **Missing Tile Index in Events** ✅
**Commits:** `fdc25b8`, `a0ab9e7`, `14d192c`
- GameController was emitting tile events without the `index` property
- This caused TileData to default to index=-1
- Affected events: TILE_DRAWN, TILE_DISCARDED, TILES_EXPOSED, DISCARD_CLAIMED

### 3. **Tile Lookup After Removal** ✅
**Commit:** `a0ab9e7`
- PhaserAdapter tried to find tiles in wall AFTER GameController removed them
- Tiles no longer in wall.tileArray when event handler ran
- **Fix:** Pre-populate tileMap with ALL tiles before game starts
  - Added `initializeTileMap()` method
  - Added WALL_CREATED event trigger
  - PhaserAdapter now looks up tiles in tileMap, not wall

### 4. **Architectural Violation** ✅
**Commits:** `fdc25b8` → reverted → `a0ab9e7`
- First attempt: Passed Phaser Tile objects through GameController events
- **Problem:** Breaks mobile! Mobile has no Phaser objects
- **Fix:** Keep GameController platform-agnostic, only emit TileData
  - Mobile can use same GameController without changes
  - Only PhaserAdapter needs to work with Phaser Tiles

---

## Architecture After Fixes

```
GameController (core/)
├─ Emits platform-agnostic TileData events
├─ Works with abstract data models
└─ NO Phaser dependencies

    ↓ (events with TileData)

PhaserAdapter (desktop/adapters/)
├─ Has pre-initialized tileMap (index → Phaser Tile)
├─ Converts TileData → Phaser Tile via tileMap lookup
├─ Handles all Phaser-specific rendering
└─ Desktop only

Mobile Renderer (future)
├─ Would receive same GameController events
├─ Would implement own tile rendering
└─ No Phaser dependency needed
```

---

## Files Changed

1. **GameScene.js**
   - Reorder Card/AIEngine initialization

2. **core/GameController.js**
   - Add `index` to all tile event payloads
   - Emit WALL_CREATED event after wall setup

3. **desktop/adapters/PhaserAdapter.js**
   - Add `initializeTileMap()` method
   - Listen for WALL_CREATED event
   - Update `onTileDrawn()` to use tileMap lookup
   - Update `onTileDiscarded()` to use tileMap lookup
   - Add `getPlayerName()` helper for safety

---

## Testing Recommendations

### Desktop (Phaser)
```javascript
npm run dev
// Test:
1. Start game - tiles should animate to hands
2. Each player should have exactly 13 tiles
3. Charleston phase should proceed
4. Game should not freeze
```

### AIEngine Unit Tests
```bash
npm test -- tests/aiengine.test.js
// Should still pass - core logic unchanged
```

### Mobile (if available)
```
// Same game flow should work without Phaser dependency
// Mobile renderer would need own tile rendering implementation
```

---

## Known Issues Still to Address

See [DIAGNOSTIC_ISSUES.md](DIAGNOSTIC_ISSUES.md) for:
- Tiles rendering issues
- Hand count corruption
- Charleston UI problems
- Hint panel crashes

These are separate from the architecture issues we fixed.

---

## Commits Created

```
fdc25b8 - fix: Pass Phaser Tile objects directly... (REVERTED APPROACH)
a0ab9e7 - fix: Use pre-initialized tile map instead of passing Phaser objects
14d192c - fix: Add missing tile index to all tile event payloads
```

## Key Insight

**The original error (-1 index) was a SYMPTOM of a deeper architectural problem:**
- Events were missing critical data (index)
- Tile lookup was failing because tiles were removed from wall
- This cascaded into the hint panel crash

The fix maintains clean separation of concerns:
- Core game logic stays platform-agnostic
- Rendering adapters handle platform-specific concerns
- Mobile can reuse GameController without modification

