# GitHub Issues for TODO Comments

Created: December 18, 2025

Copy each issue below into GitHub's issue tracker with the specified labels.

---

---

## Issue #2: ✅ [REFACTOR] Remove legacy gameObjects.js file

**Labels**: `refactor`, `technical-debt`, `high-priority`

**Status**: ✅ **COMPLETED - December 18, 2025**

**File**: [desktop/gameObjects/PhaserTileSprites.js:1](desktop/gameObjects/PhaserTileSprites.js#L1) (renamed from gameObjects.js)

**Description**:

This file was marked for removal with a misleading TODO comment. After analysis, determined these are legitimate Phaser sprite wrappers for desktop, not legacy code to remove.

**Resolution**:

1. **Analysis**: Determined that `Tile`, `Wall`, and `Discards` classes are legitimate Phaser-specific sprite wrappers for the desktop platform, NOT legacy code to be removed. These manage visual sprites and cannot be replaced with platform-agnostic `TileData` models.

2. **Actions Taken**:
   - ✅ Renamed `desktop/gameObjects/gameObjects.js` → `PhaserTileSprites.js` (clearer name)
   - ✅ Updated imports in [TileManager.js](desktop/managers/TileManager.js), [HomePageTileManager.js](desktop/managers/HomePageTileManager.js), [gameObjects_table.js](desktop/gameObjects/gameObjects_table.js)
   - ✅ Migrated `gTileGroups` usage to [core/tileDefinitions.js](core/tileDefinitions.js) in HomePageTileManager
   - ✅ Updated card test files (2017-2020) to use `TileData` instead of Phaser `Tile`
   - ✅ Replaced misleading TODO comment with clear documentation header explaining these are intentional desktop implementation classes

3. **Result**: File renamed and clarified, all imports updated, no functionality broken. The classes remain as desktop Phaser sprite wrappers, which is their correct architectural role.

---

## Issue #3: ✅ [REFACTOR] Clean up Table class (Phase 6 Cleanup)

**Labels**: `refactor`, `technical-debt`, `medium-priority`

**Status**: ✅ **COMPLETED - December 18, 2025**

**File**: [desktop/managers/TableManager.js](desktop/managers/TableManager.js) (renamed and moved from desktop/gameObjects/gameObjects_table.js)

**Description**:

The Table class needed cleanup to remove player-related methods and focus only on wall, discards, and visual indicators.

**Resolution**:

1. **Cleanup Completed**:
   - ✅ Removed unused `gameLogic` property
   - ✅ Removed unused `player02CourtesyVote` and `player13CourtesyVote` properties
   - ✅ Confirmed no methods reference `this.players` (class was already clean)
   - ✅ Only essential properties remain: `scene`, `wall`, `discards`, `boxes`
   - ✅ Only essential methods remain: `create()`, `reset()`, `switchPlayer()`

2. **Renamed and Moved**:
   - ✅ Renamed class from `Table` to `TableManager` for consistency with other managers
   - ✅ Moved from `desktop/gameObjects/gameObjects_table.js` to `desktop/managers/TableManager.js`
   - ✅ Updated all imports in [GameScene.js](desktop/scenes/GameScene.js) and [PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)
   - ✅ Deleted old file

3. **Documentation Updated**:
   - ✅ Updated class documentation to reflect current responsibilities
   - ✅ Added FUTURE CONSIDERATION note about potentially moving Wall/Discards to TileManager
   - ✅ Updated error message in `reset()` method to reference TableManager

**Testing**:

- ✅ All 45 desktop and core tests pass
- ✅ No new failures introduced

**Result**: TableManager now has a clean, focused API matching the manager pattern used throughout the desktop platform.

---

## Issue #4: [FEATURE] Implement drag event handlers for TileManager

**Labels**: `enhancement`, `low-priority`, `desktop-only`

**File**: [desktop/managers/TileManager.js:599, 609](desktop/managers/TileManager.js#L599)

**Description**:

The TileManager has placeholder methods for enabling/disabling tile drag, but the actual event handlers are not implemented.

**Current Code**:

```javascript
enableTileDragForPlayer(playerIndex) {
  this.dragEnabledPlayers.add(playerIndex);
  // TODO: Set up drag event handlers for this player's tiles
}

disableTileDragForPlayer(playerIndex) {
  this.dragEnabledPlayers.delete(playerIndex);
  // TODO: Remove drag event handlers
}
```

**Context**:

- Drag functionality currently handled via SelectionManager
- These methods may be legacy from old Phaser object drag system
- Need to determine if this is still needed

**Resolution Options**:

**Option A: Implement Drag Handlers** (if needed)

- Set up Phaser drag events for tile sprites
- Track drag state per player
- Clean up handlers on disable

**Option B: Remove Methods** (if obsolete)

- Verify SelectionManager handles all selection needs
- Remove these placeholder methods
- Update any callers

**Investigation Needed**:

- [ ] Check if these methods are called anywhere
- [ ] Verify SelectionManager provides all needed functionality
- [ ] Determine if Phaser object drag is desired feature

**Acceptance Criteria**:

- [ ] If implementing: Drag works for enabled players only
- [ ] If removing: No references remain, functionality unchanged
- [ ] Desktop gameplay works correctly

**Effort Estimate**: 1-2 hours

---

## Issue #5: ✅ [FEATURE] Mobile blank tile swap animation

**Labels**: `enhancement`, `high-priority`, `mobile`, `feature-parity`

**Status**: ✅ **COMPLETED - December 18, 2025**

**File**: [mobile/MobileRenderer.js:629](mobile/MobileRenderer.js#L629)

**Description**: Animation for blank tile swaps on mobile platform.

**Resolution**: Implemented `animateTileSwap()` in AnimationController and updated MobileRenderer to use it. Mobile now has feature parity with desktop.

---

## Issue #6: [ENHANCEMENT] Implement asset error handling for mobile

**Labels**: `enhancement`, `low-priority`, `mobile`, `accessibility`

**File**: [mobile/MobileRenderer.js:1797-1822](mobile/MobileRenderer.js#L1797-L1822)

**Description**:

Scaffolding exists for asset error handling and text mode fallback, but it's not wired up to the asset loading pipeline.

**Current State**:

```javascript
// TODO: Asset error handling scaffolding (not yet wired up)
// Future work: Add image onerror handlers to detect tile sprite loading failures
// Future work: Implement text mode fallback in HandRenderer
// Future work: Call handleAssetError from asset loading pipeline
```

**Implementation Tasks**:

1. **Wire Up Error Detection**:
   - [ ] Add `onerror` handlers to tile sprite images
   - [ ] Detect when tiles.png fails to load
   - [ ] Call `handleAssetError()` from loading pipeline

2. **Implement Text Mode Fallback**:
   - [ ] Extend HandRenderer to support text-based rendering
   - [ ] Display tile text (e.g., "B3", "W", "GD") instead of sprites
   - [ ] Ensure text mode is accessible and readable
   - [ ] Add CSS styling for text mode tiles

3. **Test Error Scenarios**:
   - [ ] Simulate missing tiles.png
   - [ ] Verify text mode activates automatically
   - [ ] Ensure game is playable in text mode
   - [ ] Test screen reader compatibility

**Acceptance Criteria**:

- [ ] Asset loading failures are detected automatically
- [ ] User sees error notification when assets fail
- [ ] Text mode fallback activates on asset failure
- [ ] Game remains playable in text mode
- [ ] Screen readers can read tile values

**Accessibility Impact**: High - enables gameplay even when graphics fail to load

**Effort Estimate**: 3-4 hours

---

## Issue #7: [TEST] Move touch handler tests to unit tests

**Labels**: `testing`, `low-priority`, `mobile`

**File**: [tests/e2e/mobile/touch-handler.spec.js:3](tests/e2e/mobile/touch-handler.spec.js#L3)

**Description**:

Touch handler tests are currently in E2E suite but should be unit tests or have a dedicated test page.

**Current Comment**:

```javascript
// TODO: Move these to unit tests or create dedicated test page
```

**Tasks**:

**Option A: Convert to Unit Tests**

- [ ] Move to `tests/unit/mobile/`
- [ ] Use jsdom or similar for DOM testing
- [ ] Mock touch events
- [ ] Integrate into unit test suite

**Option B: Create Test Page**

- [ ] Create `mobile/test-touch-handler.html`
- [ ] Interactive test page for manual testing
- [ ] Document how to use test page
- [ ] Keep E2E tests for integration scenarios

**Recommendation**: Option A (unit tests) for automated testing

**Acceptance Criteria**:

- [ ] Touch handler has proper unit test coverage
- [ ] Tests are faster (not E2E overhead)
- [ ] Tests run in CI/CD pipeline
- [ ] Test file in appropriate directory

**Effort Estimate**: 1-2 hours

---

## Summary

**Total Issues**: 7 (5 remaining + 2 completed)

**By Priority**:

- 🔴 High: 0 issues (both completed: #2, #3)
- 🟡 Medium: 2 issues (#1 Joker choice, #6 Asset handling)
- 🟢 Low: 2 issues (#4 Drag handlers, #7 Test migration)
- ✅ Completed: 3 issues (#2 PhaserTileSprites rename, #3 TableManager cleanup, #5 Mobile animation)

**By Type**:

- Enhancement/Feature: 2 (#1, #6) + 1 low priority (#4)
- Testing: 1 (#7)
- ✅ Completed: 3 issues (#2 Refactor, #3 Refactor, #5 Feature)

**Quick Wins** (1-2 hours):

- #4 - Investigate drag handlers (likely can just remove)
- #7 - Move touch tests to unit tests

**Medium Effort** (2-4 hours):

- #1 - Joker exchange UI
- #6 - Asset error handling

---

## Instructions for Creating Issues

1. Copy each issue section above into GitHub
2. Use the title format: `[LABEL] Short description`
3. Apply the labels specified in each issue
4. Assign to appropriate milestone if using milestones
5. Consider adding to project board if using projects

## After Creating Issues

Update TODO comments with issue numbers:

```javascript
// TODO #1: Future enhancement - let user choose among multiple exchanges
// TODO #2: This file is to be phased out and removed
```

This creates traceability between code and issue tracker.
