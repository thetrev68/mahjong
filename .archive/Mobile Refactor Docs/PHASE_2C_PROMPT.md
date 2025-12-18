# Phase 2C: Update Desktop Test Suite

**Context:** Phase 2A/2B complete (GameController fully integrated). Need to update Playwright tests to verify desktop still works after refactoring.

**Assignee:** Gemini Flash 2.0 (delegated task)
**Estimated Tokens:** 3K
**Complexity:** Low
**Status:** Ready after Phase 2B complete
**Branch:** mobile-core

---

## Task Overview

Update existing Playwright tests to ensure desktop game works correctly after GameController integration. No new test logic needed - just verify existing tests pass and update any broken references.

---

## Current Test Structure

**Existing test file:** `tests/e2e.spec.js`

Current tests cover:

- Game loads and shows tiles
- Start button works
- Charleston phase
- Tile interactions
- Settings overlay

---

## Task 1: Run Existing Tests

```bash
npm test
```

**Expected:** Some tests may fail due to GameController changes (e.g., timing differences, event order changes).

**Document failures:** Note which tests fail and why.

---

## Task 2: Update Test Selectors (if needed)

If any selectors changed during refactoring, update them:

**Example:**

```javascript
// OLD
await page.click('#gamediv .tile[data-index="0"]');

// NEW (if selector changed)
await page.click('.game-scene .mobile-tile[data-index="0"]');
```

---

## Task 3: Update Timing/Waits (if needed)

GameController may have different timing than GameLogic. Update waits if needed:

**Example:**

```javascript
// OLD
await page.waitForTimeout(1000);

// NEW (wait for specific event)
await page.waitForSelector(".tile-drawn", { timeout: 2000 });
```

---

## Task 4: Add Console Error Check

Add a test to verify no console errors during gameplay:

```javascript
test("desktop game has no console errors", async ({ page }) => {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  await page.goto("/mahjong/");
  await page.click("#start");
  await page.waitForTimeout(5000); // Let game run

  expect(errors).toEqual([]);
});
```

---

## Task 5: Add GameController Event Check

Verify GameController events are being emitted:

```javascript
test("GameController emits events", async ({ page }) => {
  const events = [];

  // Capture console.log from GameController
  page.on("console", (msg) => {
    if (msg.text().includes("[GameController]")) {
      events.push(msg.text());
    }
  });

  await page.goto("/mahjong/");
  await page.click("#start");
  await page.waitForTimeout(3000);

  // Verify key events were emitted
  const hasGameStarted = events.some((e) => e.includes("GAME_STARTED"));
  const hasTilesDealt = events.some((e) => e.includes("TILES_DEALT"));

  expect(hasGameStarted).toBe(true);
  expect(hasTilesDealt).toBe(true);
});
```

---

## Task 6: Verify Full Game Flow

Ensure game can be completed without errors:

```javascript
test("complete full game (wall game)", async ({ page }) => {
  await page.goto("/mahjong/");

  // Start game
  await page.click("#start");

  // Wait for game to end (set short wall for faster test)
  // This may require modifying game settings temporarily

  // Verify game ends properly
  await page.waitForSelector("#start", { visible: true, timeout: 120000 });

  // Verify no errors
  const errors = await page.evaluate(() => {
    return window.testErrors || [];
  });
  expect(errors).toEqual([]);
});
```

---

## Success Criteria

✅ **All existing tests pass** (or updated to pass)
✅ **No console errors during test runs**
✅ **GameController events detected**
✅ **Full game flow test passes**
✅ **Test coverage maintained** (no tests removed)

---

## Files to Modify

1. **`tests/e2e.spec.js`** - Update test selectors, timing, add new tests
2. **Create `PHASE_2C_RESULTS.md`** - Document test results

---

## Test Report Format

**File:** `PHASE_2C_RESULTS.md`

```markdown
# Phase 2C Test Results

**Date:** YYYY-MM-DD
**Branch:** mobile-core
**Tests Run:** X tests
**Pass Rate:** X/X (100%)

## Test Results

| Test Name             | Status  | Notes          |
| --------------------- | ------- | -------------- |
| desktop game loads    | ✅ Pass |                |
| start button works    | ✅ Pass |                |
| charleston phase      | ✅ Pass | Updated timing |
| no console errors     | ✅ Pass |                |
| GameController events | ✅ Pass |                |
| full game flow        | ✅ Pass |                |

## Changes Made

- Updated test timing for `test-name` (increased timeout from 1s to 2s)
- Added console error check
- Added GameController event verification

## Known Issues

- None

## Recommendations

- Add integration tests for PhaserAdapter in future
- Consider adding performance benchmarks
```

---

## Context

- **Dependencies:** Phase 2B complete
- **Blockers:** None
- **Est. Time:** 1-2 hours
- **Critical for:** Ensuring desktop quality before mobile work

---

**Phase 2C Status:** Ready for delegation
**Assignee:** Gemini Flash 2.0
