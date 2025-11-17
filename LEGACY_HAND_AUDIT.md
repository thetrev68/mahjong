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
- ✅ `GameController.js:240-241` - Already emits HAND_UPDATED for all players after dealing

**Result:**
- No more direct hand manipulation during dealing
- HandData is authoritative source of truth for rendering in ALL game states
- Event-driven architecture now complete for dealing sequence

### Phase 3: Move Sorting to HandData
**Target:** `sortSuitHidden()`, `sortRankHidden()`

**Approach:**
1. Add sorting methods to HandData:
   - `HandData.sortBySuit()`
   - `HandData.sortByRank()`
2. GameController emits HAND_UPDATED after sort
3. HandRenderer syncs and renders

**Files to update:**
- `PhaserAdapter.js:1107-1110, 1160-1163` - Call GameController sort methods instead

### Phase 4: Replace dupHand() with HandData Clone
**Target:** HintAnimationManager

**Approach:**
1. Create `HandData.clone()` method
2. Pass cloned HandData to AI engine instead of legacy Hand object
3. Card validator already works with TileData arrays

**Files to update:**
- `HintAnimationManager.js:129, 175, 192` - Use `handData.clone()`

### Phase 5: Eliminate Table Reference Coupling
**Target:** `hand.table` setter in GameScene

**Approach:**
1. Managers should not need table references in Hand objects
2. Pass table as parameter to methods that need it
3. Remove `hand.table` assignment

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
- `PhaserAdapter.js`: -120 lines (Phase 2: direct hand manipulation removed)
- `TileManager.js`: -20 lines (Phase 6: deprecated methods removed)
- **Phase 2 Complete: ~120 lines removed**
- **Total Estimated: ~1675 lines to be removed by Phase 6**

---

## Risk Assessment

**Low Risk:**
- Phase 1 ✅ (completed, working)
- Phase 2 ✅ (completed, tested - all desktop tests passing)

**Medium Risk:**
- Phase 3: Sorting (need to test UI responsiveness)
- Phase 4: HintAnimationManager (need to verify AI still works)

**High Risk:**
- Phase 5-6: Complete elimination (requires thorough testing)

---

## Next Steps

1. ~~**Immediate:** Test current Phase 1 implementation (syncAndRender)~~ ✅ Complete
2. ~~**Next:** Implement Phase 2 (remove direct hand manipulation in PhaserAdapter)~~ ✅ Complete
3. ~~**Follow-up:** Address joker swap GameController integration~~ ✅ Complete
4. **Current:** Implement Phase 3 (move sorting to HandData)
5. **Future:** Gradually work through Phases 4-6 with testing between each

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

