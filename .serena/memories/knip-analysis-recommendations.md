# Knip Unused Files Analysis - Recommendations

## Summary
Analyzed 6 unused files reported by knip. Each file has clear status and recommendations.

---

## File-by-File Analysis

### 1. `.archive/gameAI.js` - DELETE
**Status:** Dead code (archive directory)
**Current Location:** `.archive/gameAI.js` (29.9 KB)
**Finding:** The `.archive` directory exists and contains outdated/archived code. This file has been superseded by `core/AIEngine.js` which is the current, maintained version.
**Evidence:** 
- `core/AIEngine.js` is imported in `mobile/main.js` line 9
- `AIEngine.js` contains the comment: "Refactored from gameAI.js to enable cross-platform use (desktop + mobile)"
- The old `.archive/gameAI.js` (738 lines) has been completely refactored into `AIEngine.js` with the same difficulty configuration logic

**Recommendation:** DELETE
- This is archive clutter and represents dead code
- The functionality has been modernized and moved to `core/AIEngine.js`
- No tests, imports, or references exist to this old file

---

### 2. `pwa/service-worker.js` - KEEP WITH IGNORE TAG
**Status:** Functional PWA support file, intentionally not loaded in development
**Current Location:** `pwa/service-worker.js` (10.1 KB)
**Finding:** This is a complete, working Service Worker implementation for PWA offline support. It's not imported/required in code because service workers are registered differently - via HTML manifest registration, not ES6 imports.
**Evidence:**
- `mobile/main.js` line 71-72 has commented code: `// Register Service Worker (disabled during development)` and `// registerServiceWorker();`
- Service workers are browser APIs that register themselves via `navigator.serviceWorker.register()`
- The file implements proper caching strategies for offline support
- It's referenced in PWA manifest configuration

**Recommendation:** KEEP WITH IGNORE TAG
- Add to knip's ignore list in `knip.json`
- This is legitimate production code, not dead code
- It's not statically imported because service workers use registration API
- Should be included in `pwa/**` patterns in ignore or create a specific tag

**How to fix:** Add to `knip.json`:
```json
"ignore": [
  "dist/**",
  "node_modules/**",
  "**/*.py",
  "pwa/service-worker.js"
]
```

---

### 3. `tests/mobile-helpers.js` - DELETE
**Status:** Dead code (utility helpers with no consumers)
**Current Location:** `tests/mobile-helpers.js` (2.6 KB)
**Finding:** This file exports 7 test helper functions (waitForMobileGameLoad, tapTile, doubleTapTile, swipeUp, selectCharlestonTiles, verifyOpponentBar, startGameWithTrainingHand) but NONE of these helpers are imported anywhere in the test suite.
**Evidence:**
- Grep search for `mobile-helpers` in entire `tests/` directory returns NO matches
- All test files use Playwright directly without importing these helpers
- Tests use standard Playwright APIs (page.locator, page.tap, etc.) instead of helper functions
- This appears to be a utility file created in anticipation of mobile testing but never actually used

**Recommendation:** DELETE
- No tests import or use these helper functions
- The helpers provide limited value over direct Playwright API usage
- Can be recreated if needed in the future
- Removing it won't break any tests

---

### 4. `.archive/scripts/generate-icons.js` - DELETE
**Status:** Dead code (archived script)
**Current Location:** `.archive/scripts/generate-icons.js` (1.9 KB)
**Finding:** This is an archived build script that generates PWA icons from favicon.svg using sharp. It's in the archive directory, indicating it's no longer part of the active build process.
**Evidence:**
- Located in `.archive/scripts/` (explicit archive directory)
- Not referenced in `package.json` scripts
- No imports or references elsewhere in codebase
- Sharp is installed as a devDependency, but this script isn't used by the build system

**Recommendation:** DELETE
- This is archived clutter
- Build process no longer uses this script
- Icons appear to be pre-generated in `pwa/icons/`
- Can be recreated if needed in the future

---

### 5. `core/models/test-data-models.js` - DELETE
**Status:** Dead code (standalone test script, not part of test suite)
**Current Location:** `core/models/test-data-models.js` (8.5 KB)
**Finding:** This is a Node.js script that runs console-based validation tests. It's NOT a Playwright test (doesn't use `test()` or `describe()`) and is NOT part of the automated test suite. It's a standalone validation script.
**Evidence:**
- Uses Node.js console assertions: `console.assert()`, `console.log()`
- Has its own test harness with `passCount`/`failCount` and `process.exit()`
- Not imported/referenced anywhere in the codebase
- Not part of the Playwright test configuration (`playwright.config.js` only runs tests in `./tests` directory)
- This appears to be a legacy validation script from Phase 1A development
- No npm script in `package.json` runs this file

**Recommendation:** DELETE
- Not part of the active test suite
- Appears to be legacy Phase 1A validation code
- The data models it tests (TileData, HandData, PlayerData) should have proper Playwright tests if needed
- Can be archived or recreated if needed in the future

---

### 6. `mobile/gestures/TouchHandler.test.js` - DELETE OR MOVE
**Status:** Orphaned test file (not executed by test runner)
**Current Location:** `mobile/gestures/TouchHandler.test.js` (5.9 KB)
**Finding:** This is a legitimate test file written for Jest/Jasmine framework (uses `describe()`, `it()`, `expect()`), NOT Playwright. It's incompatible with the project's Playwright testing setup.
**Evidence:**
- Uses Jest/Jasmine syntax: `describe()`, `it()`, `beforeEach()`, `afterEach()`, `expect()`
- Tests are NOT run by Playwright test runner
- `playwright.config.js` only loads tests from `./tests` directory
- This file is in `mobile/gestures/` which is outside the `./tests` directory
- Project uses Playwright as its test framework (see `package.json` and `playwright.config.js`), not Jest

**Recommendation:** DELETE
- This test file uses the wrong test framework (Jest vs Playwright)
- It won't run as part of the test suite
- Either:
  1. Delete it (simplest option)
  2. Convert it to Playwright syntax and move it to `./tests/touch-handler.spec.js` (if tests for TouchHandler are needed)
  3. Keep it if you want Jest-based unit tests in the future (but add to ignore list)

**Note:** There IS a `tests/touch-handler.spec.js` file which may be the Playwright version of the same tests.

---

## Recommendations Summary

| File | Action | Reason |
|------|--------|--------|
| `.archive/gameAI.js` | DELETE | Archive clutter; superseded by `core/AIEngine.js` |
| `pwa/service-worker.js` | KEEP + IGNORE | Legitimate PWA code; not imported due to browser API registration |
| `tests/mobile-helpers.js` | DELETE | Unused test helpers; no consumers |
| `.archive/scripts/generate-icons.js` | DELETE | Archive clutter; build process doesn't use it |
| `core/models/test-data-models.js` | DELETE | Legacy Phase 1A validation script; not in test suite |
| `mobile/gestures/TouchHandler.test.js` | DELETE | Wrong test framework; won't run in Playwright |

## Implementation Steps

1. **Delete these 5 files:**
   ```bash
   rm .archive/gameAI.js
   rm tests/mobile-helpers.js
   rm .archive/scripts/generate-icons.js
   rm core/models/test-data-models.js
   rm mobile/gestures/TouchHandler.test.js
   ```

2. **Update `knip.json`** to ignore service-worker:
   ```json
   "ignore": [
     "dist/**",
     "node_modules/**",
     "**/*.py",
     "pwa/service-worker.js"
   ]
   ```

3. **Run knip again** to verify only 1 unused dependency remains (sharp):
   ```bash
   npm run knip
   ```

4. **Handle the `sharp` dependency:**
   - If PWA icon generation is never needed: remove from `package.json`
   - If potentially needed: keep it and add comment explaining PWA icon generation

---

## Notes
- The `.archive` directory structure is good practice for keeping old code, but should be added to `.gitignore` or explicitly excluded from knip
- Service workers require special handling in knip because they're not imported via ES6 modules
- The project uses Playwright for all testing; Jest-based tests should either be converted or removed
