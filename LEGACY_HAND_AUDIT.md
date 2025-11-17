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

### Phase 2: Eliminate Direct Hand Manipulation
**Target:** Remove all `insertHidden()`, `removeHidden()`, `insertExposed()` calls

**Approach:**
1. All tile changes should go through GameController → emit HAND_UPDATED → HandRenderer syncs
2. Remove direct manipulation methods from PhaserAdapter
3. TileManager should NOT manipulate hands (violates separation)

**Files to update:**
- `PhaserAdapter.js:375` (onTileDrawn) - Remove `insertHidden()`, rely on HAND_UPDATED event
- `PhaserAdapter.js:554-562` (onTilesExposed) - Remove hand manipulation, rely on HAND_UPDATED
- `PhaserAdapter.js:631` (onJokerSwapped) - Remove `insertHidden()`, rely on HAND_UPDATED
- `TileManager.js:139, 153-156` - Remove hand manipulation entirely

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
- `gameObjects_hand.js`: -1500 lines
- `gameObjects_player.js`: -35 lines
- `PhaserAdapter.js`: -50 lines (direct hand manipulation)
- `TileManager.js`: -20 lines
- **Total: ~1600 lines removed**

---

## Risk Assessment

**Low Risk:**
- Phase 1 ✅ (completed, working)
- Phase 2: Removing direct manipulation (GameController already manages state)

**Medium Risk:**
- Phase 3: Sorting (need to test UI responsiveness)
- Phase 4: HintAnimationManager (need to verify AI still works)

**High Risk:**
- Phase 5-6: Complete elimination (requires thorough testing)

---

## Next Steps

1. **Immediate:** Test current Phase 1 implementation (syncAndRender)
2. **Next:** Implement Phase 2 (remove direct hand manipulation in PhaserAdapter)
3. **Future:** Gradually work through Phases 3-6 with testing between each

