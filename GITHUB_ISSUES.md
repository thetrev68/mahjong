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

## Issue #4: ✅ [REFACTOR] Remove unused drag event handlers from TileManager

**Labels**: `refactor`, `low-priority`, `desktop-only`

**Status**: ✅ **COMPLETED - December 18, 2025**

**File**: [desktop/managers/TileManager.js](desktop/managers/TileManager.js)

**Description**:

The TileManager had placeholder methods for enabling/disabling tile drag, but the actual event handlers were never implemented and the methods were never called anywhere in the codebase.

**Investigation Results**:

- ✅ Verified methods were not called anywhere in the codebase
- ✅ Confirmed SelectionManager already handles all tile interaction via click handlers
- ✅ Determined these were legacy placeholders from old Phaser drag system

**Resolution**:

**Removed the following unused code:**

1. ✅ Removed `enableTileDragForPlayer()` method
2. ✅ Removed `disableTileDragForPlayer()` method
3. ✅ Removed `this.dragEnabledPlayers` property
4. ✅ Removed associated TODO comments

**Testing**:

- ✅ All desktop tests pass (11/11)
- ✅ No references remain in codebase
- ✅ Desktop gameplay works correctly

**Result**: Cleaned up unused legacy code. SelectionManager continues to handle all tile interaction needs via click-based selection.

---

## Issue #5: ✅ [FEATURE] Mobile blank tile swap animation

**Labels**: `enhancement`, `high-priority`, `mobile`, `feature-parity`

**Status**: ✅ **COMPLETED - December 18, 2025**

**File**: [mobile/MobileRenderer.js:629](mobile/MobileRenderer.js#L629)

**Description**: Animation for blank tile swaps on mobile platform.

**Resolution**: Implemented `animateTileSwap()` in AnimationController and updated MobileRenderer to use it. Mobile now has feature parity with desktop.

---

## Issue #6: ✅ [ENHANCEMENT] Implement asset error handling for mobile

**Labels**: `enhancement`, `low-priority`, `mobile`, `accessibility`

**Status**: ✅ **COMPLETED - December 18, 2025**

**File**: [mobile/MobileRenderer.js:1833-1857](mobile/MobileRenderer.js#L1833-L1857)

**Description**:

Implemented asset error handling and text mode fallback for mobile platform. When tiles.png fails to load, the game automatically switches to text-based rendering using colorized tile characters.

**Resolution**:

1. **Error Detection System**:
   - ✅ Created [assetErrorDetector.js](mobile/utils/assetErrorDetector.js) utility
   - ✅ Detects tiles.png loading failures using Image() API
   - ✅ Automatically triggers text mode fallback on error
   - ✅ Wired up in MobileRenderer constructor

2. **Text Mode Rendering**:
   - ✅ Created [textModeRenderer.js](mobile/utils/textModeRenderer.js) utility
   - ✅ Uses same colorized tile-char format as pattern visualizer
   - ✅ Displays numbered tiles (1-9), Dragons (D), Winds (N/E/S/W), Jokers (J), Flowers (F)
   - ✅ Color-coded: Red (Crack), Green (Bam), Blue (Dot), Black (Winds/Flowers), Gray (Jokers)
   - ✅ Extended HandRenderer with `setTextMode()` method
   - ✅ Added CSS styling in [tiles.css](mobile/styles/tiles.css#L207-L277)

3. **Settings Integration**:
   - ✅ Added "Text Mode" toggle in settings sheet (Display section)
   - ✅ Allows users to enable text mode manually for accessibility
   - ✅ Settings persist via SettingsManager
   - ✅ MobileRenderer listens for textMode setting changes

4. **Accessibility Features**:
   - ✅ All text mode tiles have aria-label attributes
   - ✅ Screen reader compatible (e.g., "3 Bam", "North Wind", "Red Dragon")
   - ✅ Maintains full tile interactivity (selection, animations, glow effects)
   - ✅ Works for hand tiles, exposed tiles, and discard pile

**Testing**:

- ✅ Text mode automatically activates if tiles.png fails to load
- ✅ Manual toggle available in settings for user preference
- ✅ Game remains fully playable in text mode
- ✅ All tile types render correctly with appropriate colors

**Result**: Mobile platform now has robust asset error handling with seamless text mode fallback, improving both reliability and accessibility.

---

## Issue #7: ✅ [TEST] Move touch handler tests to unit tests

**Labels**: `testing`, `low-priority`, `mobile`

**Status**: ✅ **COMPLETED - December 18, 2025**

**File**: [tests/unit/mobile/TouchHandler.test.js](tests/unit/mobile/TouchHandler.test.js)

**Description**:

Touch handler tests were in E2E suite but needed to be unit tests for faster execution and better CI/CD integration.

**Resolution**:

1. **Created Unit Test File**:
   - ✅ Created [tests/unit/mobile/TouchHandler.test.js](tests/unit/mobile/TouchHandler.test.js)
   - ✅ Uses jsdom for DOM testing environment
   - ✅ Mocked `document.elementFromPoint` for jsdom compatibility
   - ✅ All 13 tests passing

2. **Test Coverage**:
   - ✅ Initialization and configuration tests
   - ✅ Tap gesture detection
   - ✅ Double-tap gesture detection
   - ✅ Long-press gesture detection
   - ✅ Movement threshold validation
   - ✅ Event listener registration/unregistration
   - ✅ Multi-touch handling
   - ✅ Touch cancel handling
   - ✅ Cleanup/destroy method

3. **Configuration Updates**:
   - ✅ Updated [playwright.config.js](playwright.config.js) to include unit tests
   - ✅ Added "unit" project to run tests without webServer
   - ✅ Added `npm run test:unit` script in [package.json](package.json)

4. **Cleanup**:
   - ✅ Removed old E2E test file [tests/e2e/mobile/touch-handler.spec.js](tests/e2e/mobile/touch-handler.spec.js)
   - ✅ Tests now run faster (4.2s vs E2E overhead)

**Testing**:

- ✅ All 13 TouchHandler unit tests pass
- ✅ Tests run via `npm run test:unit`
- ✅ No E2E server dependency required

**Result**: Touch handler tests successfully migrated to unit test suite with full coverage and faster execution.

---

## Summary

**Total Issues**: 7 (1 remaining + 6 completed)

**By Priority**:

- 🔴 High: 0 issues (all completed: #2, #3, #5)
- 🟡 Medium: 1 issue (#1 Joker choice)
- 🟢 Low: 0 issues (all completed: #7)
- ✅ Completed: 6 issues (#2 PhaserTileSprites rename, #3 TableManager cleanup, #4 Drag handlers removed, #5 Mobile animation, #6 Asset handling, #7 Test migration)

**By Type**:

- Enhancement/Feature: 1 (#1)
- ✅ Completed: 6 issues (#2 Refactor, #3 Refactor, #4 Refactor, #5 Feature, #6 Enhancement, #7 Testing)

**Medium Effort** (2-4 hours):

- #1 - Joker exchange UI

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
