# GitHub Issues for TODO Comments

Created: December 18, 2025

Copy each issue below into GitHub's issue tracker with the specified labels.

---

## Issue #1: [ENHANCEMENT] Allow user to choose joker exchange options

**Labels**: `enhancement`, `medium-priority`, `gameplay`

**File**: [core/GameController.js:1568](core/GameController.js#L1568)

**Description**:

Currently, when a player has multiple valid joker exchanges available, the system automatically selects the first one. This should be enhanced to let the user choose among all available exchange options.

**Current Behavior**:

```javascript
// For now, auto-select the first available exchange
// TODO: Future enhancement - let user choose among multiple exchanges
// Could use promptUI to present matchingExchanges array for selection
const exchange = matchingExchanges[0];
```

**Desired Behavior**:

- When `matchingExchanges.length > 1`, show a UI prompt
- Present all available exchange options to the user
- Let user select which tile they want to exchange for the joker
- Use existing `promptUI()` mechanism for consistency

**Implementation Notes**:

- Use `this.promptUI()` to present choices
- Pass `matchingExchanges` array with formatted display text
- Handle callback to get user selection

**Acceptance Criteria**:

- [ ] When multiple exchanges are available, user sees selection prompt
- [ ] Prompt shows all valid exchange options clearly
- [ ] User can select their preferred exchange
- [ ] Single exchange still auto-selects (no prompt needed)
- [ ] Works on both desktop and mobile platforms

**Effort Estimate**: 2-3 hours

---

## Issue #2: [REFACTOR] Remove legacy gameObjects.js file

**Labels**: `refactor`, `technical-debt`, `high-priority`

**File**: [desktop/gameObjects/gameObjects.js:13](desktop/gameObjects/gameObjects.js#L13)

**Description**:

This legacy file is marked for removal but still exists in the codebase. We need a migration plan to remove it safely.

**Current State**:

```javascript
//TODO: This file is to be phased out and removed.
```

**Migration Tasks**:

1. **Audit Dependencies**:
   - [ ] Search codebase for all imports from `gameObjects.js`
   - [ ] Identify which components are still used
   - [ ] Document migration path for each component

2. **Create Migration Plan**:
   - [ ] Map old components to new equivalents (core/models/)
   - [ ] Identify any functionality that needs preservation
   - [ ] Create deprecation timeline

3. **Execute Migration**:
   - [ ] Replace all usages with modern equivalents
   - [ ] Update imports to use TileData, HandData, PlayerData
   - [ ] Remove the file
   - [ ] Update tests if needed

**Related Files**:

- `desktop/gameObjects/gameObjects_table.js` (also has TODO)
- `desktop/gameObjects/gameObjects_hand.js`
- `desktop/gameObjects/gameObjects_player.js`

**Acceptance Criteria**:

- [ ] No code imports from gameObjects.js
- [ ] All functionality migrated to new models
- [ ] File removed from codebase
- [ ] Tests pass on desktop platform

**Effort Estimate**: 4-6 hours

---

## Issue #3: [REFACTOR] Clean up Table class (Phase 6 Cleanup)

**Labels**: `refactor`, `technical-debt`, `medium-priority`

**File**: [desktop/gameObjects/gameObjects_table.js:19-22](desktop/gameObjects/gameObjects_table.js#L19-L22)

**Description**:

The Table class needs cleanup to remove player-related methods and focus only on wall, discards, and visual indicators.

**TODO Comment**:

```javascript
* TODO Phase 6 Cleanup:
* - Delete all methods that reference this.players
* - Keep only: wall, discards, boxes, reset(), switchPlayer()
* - Consider moving Wall/Discards to TileManager
```

**Tasks**:

1. **Remove Player References**:
   - [ ] Audit all methods that reference `this.players`
   - [ ] Delete or refactor player-dependent methods
   - [ ] Move player logic to appropriate managers

2. **Streamline Table Responsibilities**:
   - [ ] Keep: wall management
   - [ ] Keep: discard pile management
   - [ ] Keep: visual turn indicator boxes
   - [ ] Keep: reset() and switchPlayer() methods
   - [ ] Remove everything else

3. **Consider Further Refactoring**:
   - [ ] Evaluate if Wall should move to TileManager
   - [ ] Evaluate if Discards should move to TileManager
   - [ ] Document final Table class responsibilities

**Acceptance Criteria**:

- [ ] No methods reference `this.players`
- [ ] Only wall, discards, boxes, reset(), switchPlayer() remain
- [ ] Desktop gameplay still works correctly
- [ ] All tests pass

**Effort Estimate**: 3-4 hours

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

**Total Issues**: 7 (6 remaining + 1 completed)

**By Priority**:

- 🔴 High: 1 issue (#2 - Remove gameObjects.js)
- 🟡 Medium: 3 issues (#1 Joker choice, #3 Table cleanup, #6 Asset handling)
- 🟢 Low: 2 issues (#4 Drag handlers, #7 Test migration)
- ✅ Completed: 1 issue (#5 Mobile animation)

**By Type**:

- Enhancement/Feature: 3 (#1, #4, #6)
- Refactor/Technical Debt: 2 (#2, #3)
- Testing: 1 (#7)
- Completed: 1 (#5)

**Quick Wins** (1-2 hours):

- #4 - Investigate drag handlers (likely can just remove)
- #7 - Move touch tests to unit tests

**Medium Effort** (2-4 hours):

- #1 - Joker exchange UI
- #3 - Table class cleanup
- #6 - Asset error handling

**Larger Effort** (4+ hours):

- #2 - Remove legacy gameObjects.js (requires careful migration)

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
