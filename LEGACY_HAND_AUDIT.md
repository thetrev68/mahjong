# Legacy Hand Class Audit

**Goal:** Eliminate `desktop/gameObjects/gameObjects_hand.js` and move all functionality to modern managers/renderers.

## Current Usage Analysis

### Files Using Hand Class
1. `desktop/gameObjects/gameObjects_table.js` - Creates Hand instances
2. `desktop/gameObjects/gameObjects_player.js` - Wraps Hand
3. `desktop/adapters/PhaserAdapter.js` - Heavy user
4. `desktop/managers/TileManager.js` - Some usage
5. `desktop/managers/SelectionManager.js` - Reads hand.hiddenTileSet
6. `desktop/managers/HintAnimationManager.js` - Duplicates hand for AI hints
7. `desktop/scenes/GameScene.js` - Sets table references

---

## Hand Methods Still in Use

### PhaserAdapter.js (13 references)
| Line | Method | Purpose | Migration Target |
|------|--------|---------|-----------------|
| 375 | `insertHidden()` | Add tile to hand | **HandRenderer.syncAndRender()** (from HandData) |
| 436-438 | `calculateTilePosition()` | Get position for animation | **HandRenderer** (already has positioning logic) |
| 554-555 | `removeHidden()` | Remove tile from hand | **HandRenderer.syncAndRender()** (from HandData) |
| 561-562 | `insertExposed()` | Add exposed set | **HandRenderer.syncAndRender()** (from HandData) |
| 602 | `exposedTileSetArray` | Get exposed tiles | **HandData.exposures** |
| 631 | `insertHidden()` | Add joker swap tile | **HandRenderer.syncAndRender()** (from HandData) |
| 1107-1110 | `sortSuitHidden()` | Sort tiles by suit | **HandData.sort()** + syncAndRender |
| 1160-1163 | `sortRankHidden()` / `sortSuitHidden()` | Sort tiles | **HandData.sort()** + syncAndRender |

### TileManager.js (5 references)
| Line | Method | Purpose | Migration Target |
|------|--------|---------|-----------------|
| 139 | `insertHidden()` | Add tile to hand | **Remove** (use GameController) |
| 153-156 | `removeHidden()` | Remove tile from hand | **Remove** (use GameController) |
| 698-700 | `tiles[handIndex]` | Get tile by index | **Direct access to tileArray** |

### SelectionManager.js (4 references)
| Line | Method | Purpose | Migration Target |
|------|--------|---------|-----------------|
| 311, 354, 507, 736 | `hiddenTileSet.getTileArray()` | Get tiles for selection | **Keep accessing tileArray** |

### HintAnimationManager.js (5 references)
| Line | Method | Purpose | Migration Target |
|------|--------|---------|-----------------|
| 129, 175, 192 | `dupHand()` | Clone hand for AI analysis | **Create from HandData** |
| 149 | `getHiddenTileArray()` | Get tiles array | **HandData.tiles** |
| 219 | `rankHand.hand.description` | Display hand name | **Use card validator** |

### GameScene.js (3 references)
| Line | Method | Purpose | Migration Target |
|------|--------|---------|-----------------|
| 120-122 | `hand.table` setter | Set table reference | **Remove** (table coupling) |

---

## Migration Strategy

### Phase 1: ✅ Make HandData Authoritative (COMPLETED)
- [x] Add `HandRenderer.syncAndRender(playerIndex, handData)`
- [x] Update `PhaserAdapter.onHandUpdated()` to use HandRenderer
- [x] HandData is now source of truth for tile state

### Phase 2: ✅ Eliminate Direct Hand Manipulation (COMPLETED)
**Target:** Remove all `insertHidden()`, `removeHidden()`, `insertExposed()` calls

**Approach:**
1. All tile changes should go through GameController → emit HAND_UPDATED → HandRenderer syncs
2. Remove direct manipulation methods from PhaserAdapter
3. TileManager should NOT manipulate hands (violates separation)

**Files updated:**
- ✅ `PhaserAdapter.js:387, 309` (dealing sequences) - **RESOLVED in Phase 2.5**
- ✅ `PhaserAdapter.js:443` (onTileDrawn) - Removed `insertTileIntoHand()`, rely on HAND_UPDATED
- ✅ `PhaserAdapter.js:599-607` (onTilesExposed) - Removed `removeHidden()` and `insertExposed()`, rely on HAND_UPDATED
- ✅ `PhaserAdapter.js:514` (onTileDiscarded) - Removed `removeTileFromHand()`, rely on HAND_UPDATED
- ✅ `PhaserAdapter.js:554` (onBlankExchanged) - Removed `removeTileFromHand()`, rely on HAND_UPDATED
- ✅ `TileManager.js:138, 157` - Deprecated `insertTileIntoHand()` and `removeTileFromHand()` with console warnings

**✅ Joker Swap Implemented:**
- ✅ `GameController.onExchangeJoker()` - Implemented joker swap logic with HAND_UPDATED events
- ✅ `PhaserAdapter.onJokerSwapped()` - Simplified to logging only, removed all direct manipulation (~70 lines removed)
- ✅ Tests passing - joker swap now follows event-driven pattern

**Test Results:**
- ✅ All 10 desktop tests passed
- ✅ GameController event emission working correctly
- ✅ No console errors in desktop gameplay
- ✅ Game state transitions functioning properly
- ✅ Phase 2.5 completed dealing animation blocker

### Phase 2.5: ✅ Eliminate Legacy Dealing Animation (COMPLETED)
**Target:** Replace legacy dealing animation system with HandData-driven rendering

**Problem:**
- `onTilesDealt()` calls `handRenderer.showHand()` which requires legacy Hand objects to have tiles
- Previously called `insertTileIntoHand()` during dealing, breaking event-driven architecture
- `onHandUpdated()` was skipping DEAL state, so HAND_UPDATED events didn't render during dealing

**Solution:**
1. ✅ Removed the DEAL state skip in `onHandUpdated()` (line 643-646)
2. ✅ GameController already emits HAND_UPDATED after TILES_DEALT (GameController.js:240-241)
3. ✅ syncAndRender() now handles ALL states including DEAL

**Files updated:**
- ✅ `PhaserAdapter.js:643-646` - Removed isDealState skip, always call syncAndRender()
- ✅ `GameController.js:238-250` - Emit HAND_UPDATED AFTER dealing animation completes (not before)

**Result:**
- No more direct hand manipulation during dealing
- HandData is authoritative source of truth for rendering in ALL game states
- Event-driven architecture now complete for dealing sequence

### Phase 3: ✅ Move Sorting to HandData (COMPLETED)
**Target:** `sortSuitHidden()`, `sortRankHidden()`

**Approach:**
1. ✅ HandData already has `sortBySuit()` and `sortByRank()` methods
2. ✅ HandRenderer auto-sorts Player 0's hand before rendering in `syncAndRender()`
3. ✅ GameController's `onSortHandRequest()` now sorts HandData and emits HAND_UPDATED
4. ✅ Removed legacy `SORT_HAND_REQUESTED` event system
5. ✅ Deleted `onSortHandRequested()` method from PhaserAdapter

**Files updated:**
- ✅ [HandData.js:122-141](core/models/HandData.js#L122-L141) - sortBySuit() and sortByRank() methods (already existed)
- ✅ [HandRenderer.js:59-63](desktop/renderers/HandRenderer.js#L59-L63) - Auto-sort Player 0 in syncAndRender()
- ✅ [HandRenderer.js:119-123](mobile/renderers/HandRenderer.js#L119-L123) - Auto-sort in mobile render()
- ✅ [GameController.js:1096-1112](core/GameController.js#L1096-L1112) - Updated onSortHandRequest() to use HandData sorting
- ✅ [PhaserAdapter.js:124](desktop/adapters/PhaserAdapter.js#L124) - Removed SORT_HAND_REQUESTED event listener
- ✅ [PhaserAdapter.js:1054-1071](desktop/adapters/PhaserAdapter.js) - Deleted onSortHandRequested() method (~18 lines removed)

**Result:**
- Player 0's hand auto-sorts by suit after ANY hand change (deal, draw, claim, swap)
- Manual sort buttons (Sort by Suit/Rank) work via HandData methods + HAND_UPDATED event
- No more legacy `SORT_HAND_REQUESTED` event or direct manipulation of Phaser hand objects
- Sorting is now presentation logic in HandRenderer, not game logic

### Phase 4: ✅ Replace dupHand() with HandData Clone (COMPLETED)
**Target:** HintAnimationManager

**What Changed:**
- HintAnimationManager now receives `gameController` instead of `table`
- Access HandData directly from `gameController.players[PLAYER.BOTTOM].hand`
- All 3 `dupHand()` calls replaced with `HandData.clone()`
- All `insertHidden()` calls replaced with `addTile()` (modern method)
- No legacy compatibility methods added - pure HandData usage

**Files updated:**
- ✅ [GameScene.js:110-117](desktop/scenes/GameScene.js#L110-L117) - Pass gameController to HintAnimationManager
- ✅ [HintAnimationManager.js:17-28](desktop/managers/HintAnimationManager.js#L17-L28) - Updated constructor
- ✅ [HintAnimationManager.js:131-148](desktop/managers/HintAnimationManager.js#L131-L148) - getRecommendations() uses HandData.clone()
- ✅ [HintAnimationManager.js:169-193](desktop/managers/HintAnimationManager.js#L169-L193) - updateHintsForNewTiles() uses HandData.clone()
- ✅ [HintAnimationManager.js:196-209](desktop/managers/HintAnimationManager.js#L196-L209) - updateHintDisplayOnly() uses HandData.clone()

**Test Results:**
- ✅ All 10 desktop tests passed
- ✅ No `dupHand()` references in active code (only in .archive/)
- ✅ AI hint system works with HandData instead of legacy Hand objects

### Phase 5: ✅ Eliminate Table Reference Coupling (COMPLETED)
**Target:** Remove `hand.table` setter in GameScene and decouple managers from legacy table structure

**What Changed:**
- Managers now receive **direct dependencies** instead of accessing via `this.table`
- HintAnimationManager receives TileManager for sprite access (not legacy table)
- SelectionManager receives playerAngle directly (not table.players)
- BlankSwapManager receives hand and discardPile directly
- TileManager receives wall and discards directly (not entire table)
- Removed `hand.table` setter from GameScene entirely

**Architecture Improvement:**
- **Managers access Phaser sprites via TileManager**, not legacy Hand objects
- **HandData from GameController** is authoritative source of truth
- **No table coupling** - managers cannot access legacy table structure
- Direct dependencies make requirements explicit (better testability + clarity)

**Files Updated:**
- ✅ [HintAnimationManager.js:17](desktop/managers/HintAnimationManager.js#L17) - Constructor receives tileManager
- ✅ [HintAnimationManager.js:38-86](desktop/managers/HintAnimationManager.js#L38-L86) - Uses HandData + TileManager for glow effects
- ✅ [HintAnimationManager.js:153-192](desktop/managers/HintAnimationManager.js#L153-L192) - getAllPlayerTiles/getHiddenPlayerTiles use TileManager
- ✅ [SelectionManager.js:22-25](desktop/managers/SelectionManager.js#L22-L25) - Constructor receives playerAngle
- ✅ [SelectionManager.js:449-472](desktop/managers/SelectionManager.js#L449-L472) - visualizeTile() uses playerAngle directly
- ✅ [BlankSwapManager.js:12-18](desktop/managers/BlankSwapManager.js#L12-L18) - Constructor receives hand and discardPile
- ✅ [BlankSwapManager.js:63-153](desktop/managers/BlankSwapManager.js#L63-L153) - All methods use direct dependencies
- ✅ [TileManager.js:23-27](desktop/managers/TileManager.js#L23-L27) - Constructor receives wall and discards
- ✅ [TileManager.js:65-77](desktop/managers/TileManager.js#L65-L77) - initializeFromWall() (renamed, simplified)
- ✅ [TileManager.js:127-137](desktop/managers/TileManager.js#L127-L137) - Deprecated methods error instead of warn
- ✅ [PhaserAdapter.js:49](desktop/adapters/PhaserAdapter.js#L49) - TileManager construction with wall/discards
- ✅ [PhaserAdapter.js:63-64](desktop/adapters/PhaserAdapter.js#L63-L64) - SelectionManager with playerAngle
- ✅ [PhaserAdapter.js:70-76](desktop/adapters/PhaserAdapter.js#L70-L76) - BlankSwapManager with direct dependencies
- ✅ [GameScene.js:114-116](desktop/scenes/GameScene.js#L114-L116) - Removed hand.table setter entirely
- ✅ [GameScene.js:132-138](desktop/scenes/GameScene.js#L132-L138) - HintAnimationManager receives tileManager

**Test Results:**
- ✅ All 20 desktop tests passed (10 tests x 2 browsers)
- ✅ No console errors in gameplay
- ✅ Tile selection, glow effects, and UI interactions working correctly
- ✅ Zero `this.table` references in manager constructors

**Architecture Achievement:**
Phase 5 completes the **pure event-driven architecture**:
- GameController emits events with HandData (state)
- Managers receive explicit dependencies (no hidden coupling)
- TileManager provides sprite access (Phaser layer)
- No managers access legacy table structure

### Phase 6: Final Cleanup
**Target:** Delete legacy files

**Files to remove:**
- `desktop/gameObjects/gameObjects_hand.js` (1500+ lines!)
- `desktop/gameObjects/gameObjects_player.js` (wrapper around Hand)
- Update `gameObjects_table.js` to only create player info structs, not Hand objects

---

## Estimated Line Reduction
- `gameObjects_hand.js`: -1500 lines (Phase 6)
- `gameObjects_player.js`: -35 lines (Phase 6)
- `PhaserAdapter.js`: -138 lines (Phase 2: -120 lines, Phase 3: -18 lines)
- `TileManager.js`: -20 lines (Phase 6: deprecated methods removed)
- `HintAnimationManager.js`: +0 lines (Phase 4: refactored existing code, no lines removed yet)
- **Phase 2 Complete: ~120 lines removed**
- **Phase 3 Complete: ~18 lines removed**
- **Phase 4 Complete: 0 lines removed (refactor only, enables Phase 6)**
- **Total Estimated: ~1693 lines to be removed by Phase 6**

---

## Risk Assessment

**Low Risk:**
- Phase 1 ✅ (completed, working)
- Phase 2 ✅ (completed, tested - all desktop tests passing)
- Phase 3 ✅ (completed, tested - auto-sort working)
- Phase 4 ✅ (completed, tested - AI hints working with HandData)
- Phase 5 ✅ (completed, tested - all desktop tests passing, zero table coupling)

**High Risk:**
- Phase 6: Complete elimination of legacy files (requires thorough testing)

---

## Next Steps

1. ~~**Immediate:** Test current Phase 1 implementation (syncAndRender)~~ ✅ Complete
2. ~~**Next:** Implement Phase 2 (remove direct hand manipulation in PhaserAdapter)~~ ✅ Complete
3. ~~**Follow-up:** Address joker swap GameController integration~~ ✅ Complete
4. ~~**Current:** Implement Phase 3 (move sorting to HandData)~~ ✅ Complete
5. ~~**Next:** Implement Phase 4 (replace dupHand() with HandData.clone() in HintAnimationManager)~~ ✅ Complete
6. ~~**Next:** Implement Phase 5 (eliminate table reference coupling)~~ ✅ Complete
7. **Future:** Implement Phase 6 (delete legacy Hand/Player/Table gameObjects)

## Implementation Notes

### Phase 2 Completion (2025-11-17)

**What Changed:**
- All direct hand manipulation (`insertHidden()`, `removeHidden()`, `insertExposed()`) removed from event handlers
- GameController's `HAND_UPDATED` events now drive all hand rendering via `HandRenderer.syncAndRender()`
- TileManager methods deprecated with console warnings to catch any future misuse
- Architecture now follows true event-driven pattern: GameController (state) → Events → Adapters (rendering)

**Code Locations:**
- [PhaserAdapter.js:387](desktop/adapters/PhaserAdapter.js#L387) - Dealing sequence
- [PhaserAdapter.js:309](desktop/adapters/PhaserAdapter.js#L309) - Tiles dealt handler
- [PhaserAdapter.js:443](desktop/adapters/PhaserAdapter.js#L443) - Tile drawn handler
- [PhaserAdapter.js:599-607](desktop/adapters/PhaserAdapter.js#L599-L607) - Tiles exposed handler
- [PhaserAdapter.js:514](desktop/adapters/PhaserAdapter.js#L514) - Tile discarded handler
- [PhaserAdapter.js:554](desktop/adapters/PhaserAdapter.js#L554) - Blank exchanged handler
- [TileManager.js:138-168](desktop/managers/TileManager.js#L138-L168) - Deprecated methods

### Joker Swap Integration (2025-11-17)

**Implementation Complete:**
- Added `GameController.onExchangeJoker()` method at [GameController.js:1100-1190](core/GameController.js#L1100-L1190)
  - Finds exposed jokers across all players
  - Matches human's tiles with joker requirements
  - Updates HandData for both players (human and exposure owner)
  - Emits JOKER_SWAPPED and HAND_UPDATED events
- Simplified `PhaserAdapter.onJokerSwapped()` at [PhaserAdapter.js:618-633](desktop/adapters/PhaserAdapter.js#L618-L633)
  - Removed ~70 lines of direct hand manipulation
  - Now only handles logging, rendering driven by HAND_UPDATED
- Button wiring complete: "Exchange Joker" button → `GameController.onExchangeJoker()`

### Phase 3 Completion (2025-11-17)

**What Changed:**
- Auto-sorting now happens automatically for Player 0 whenever hand changes
- Sorting logic moved from GameController/PhaserAdapter to HandRenderer (presentation layer)
- HandRenderer calls `handData.sortBySuit()` before rendering Player 0's hand
- Manual sort buttons now work via `GameController.onSortHandRequest()` → sorts HandData → emits HAND_UPDATED
- Removed legacy `SORT_HAND_REQUESTED` event system entirely

**Architecture Improvement:**
- Sorting is now presentation logic (HandRenderer), not game logic (GameController)
- Keeps GameController lean - no sorting methods added
- Both desktop and mobile platforms auto-sort consistently
- No more direct manipulation of Phaser hand objects for sorting

**Code Locations:**
- [HandRenderer.js:59-63](desktop/renderers/HandRenderer.js#L59-L63) - Desktop auto-sort
- [HandRenderer.js:119-123](mobile/renderers/HandRenderer.js#L119-L123) - Mobile auto-sort
- [GameController.js:1096-1112](core/GameController.js#L1096-L1112) - Manual sort handler
- [PhaserAdapter.js:124](desktop/adapters/PhaserAdapter.js#L124) - Removed event listener (~18 lines)

### Phase 4 Completion (2025-11-17)

**What Changed:**
- HintAnimationManager now receives `gameController` instead of legacy `table`
- Accesses authoritative HandData from `gameController.players[PLAYER.BOTTOM].hand`
- All 3 `dupHand()` calls replaced with `HandData.clone()`
- Uses modern `addTile()` method instead of legacy `insertHidden()`
- AI hint system now fully decoupled from legacy Phaser Hand objects

**Architecture Improvement:**
- HintAnimationManager uses GameController as source of truth (not legacy table.players)
- No legacy compatibility methods added - pure HandData usage throughout
- AI analysis works on HandData clones, maintaining clean separation
- Card validator receives HandData directly (already supported TileData arrays)

**Code Locations:**
- [GameScene.js:110-117](desktop/scenes/GameScene.js#L110-L117) - Pass gameController to HintAnimationManager
- [HintAnimationManager.js:17-28](desktop/managers/HintAnimationManager.js#L17-L28) - Updated constructor to accept gameController
- [HintAnimationManager.js:131-148](desktop/managers/HintAnimationManager.js#L131-L148) - getRecommendations() refactored
- [HintAnimationManager.js:169-193](desktop/managers/HintAnimationManager.js#L169-L193) - updateHintsForNewTiles() refactored
- [HintAnimationManager.js:196-209](desktop/managers/HintAnimationManager.js#L196-L209) - updateHintDisplayOnly() refactored

**Impact:**
- Zero `dupHand()` references in active codebase (only in .archive/ docs)
- AI Engine successfully analyzes HandData without legacy Hand objects
- All desktop tests passing (10/10)

### Phase 5 Completion (2025-11-17)

**What Changed:**
- Eliminated ALL `this.table` references from manager constructors
- Managers now receive explicit dependencies instead of accessing via table
- HintAnimationManager uses TileManager to get Phaser sprites from HandData
- SelectionManager receives playerAngle directly (not table.players)
- BlankSwapManager receives hand and discardPile directly
- TileManager receives wall and discards directly
- Removed `hand.table` setter from GameScene (lines 114-126 deleted)

**Architecture Improvement:**
- **Pure event-driven architecture** - managers don't access game state directly
- **Explicit dependencies** - constructor signatures show exactly what each manager needs
- **Sprite access pattern**: HandData (state) → TileManager.getTileSprite() → Phaser sprite
- **No hidden coupling** - cannot accidentally access table internals
- **Better testability** - dependencies can be mocked easily

**Key Pattern Established:**
```javascript
// OLD (Phase 4 and earlier):
const hand = this.table.players[PLAYER.BOTTOM].hand;
const tiles = hand.getHiddenTileArray();  // Get Phaser sprites via legacy Hand

// NEW (Phase 5):
const handData = this.gameController.players[PLAYER.BOTTOM].hand;  // Get HandData
for (const tileData of handData.tiles) {
    const phaserTile = this.tileManager.getTileSprite(tileData.index);  // Get Phaser sprite
}
```

**Code Locations:**
- [HintAnimationManager.js:17](desktop/managers/HintAnimationManager.js#L17) - Receives tileManager in constructor
- [HintAnimationManager.js:68-86](desktop/managers/HintAnimationManager.js#L68-L86) - findNextUnhighlightedTileInHand() uses HandData + TileManager
- [HintAnimationManager.js:153-192](desktop/managers/HintAnimationManager.js#L153-L192) - getAllPlayerTiles/getHiddenPlayerTiles use TileManager
- [SelectionManager.js:22-25](desktop/managers/SelectionManager.js#L22-L25) - Receives playerAngle
- [SelectionManager.js:449-472](desktop/managers/SelectionManager.js#L449-L472) - visualizeTile() uses playerAngle directly
- [BlankSwapManager.js:12-18](desktop/managers/BlankSwapManager.js#L12-L18) - Receives hand and discardPile
- [TileManager.js:23-27](desktop/managers/TileManager.js#L23-L27) - Receives wall and discards
- [TileManager.js:65-77](desktop/managers/TileManager.js#L65-77) - initializeFromWall() (renamed from initializeFromTable)
- [GameScene.js:114-116](desktop/scenes/GameScene.js#L114-L116) - Removed hand.table setter entirely
- [PhaserAdapter.js:49,63-64,70-76](desktop/adapters/PhaserAdapter.js#L49) - All manager constructions updated

**Impact:**
- Zero `this.table` references in any manager
- All 20 desktop tests passing (10 tests × 2 browsers)
- No console errors during gameplay
- Tile selection, glow effects, and AI hints work correctly
- Architecture now ready for Phase 6 (legacy file deletion)

