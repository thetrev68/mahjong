# Phase 7A Implementation Prompt: Mobile Test Suite

**Assignee:** Gemini Flash 2.0
**Complexity:** Medium
**Estimated Tokens:** 5K
**Dependencies:** Phases 3-6 (mobile components completed)
**Status:** Ready to Start

---

## Objective

Create comprehensive Playwright test suite for mobile interface using device emulation. Tests should verify core mobile interactions (tap, double-tap, swipe), game flow, and settings persistence. Tests will run in CI/CD alongside existing desktop tests.

---

## Deliverables

### 1. Mobile Test File
**Location:** `tests/mobile.spec.js`

Create new test file that:
- Uses mobile viewport (390x844 - iPhone 12 dimensions)
- Tests touch interactions via Playwright's mobile emulation
- Verifies mobile-specific UI components (MobileTile, HandRenderer, OpponentBar)
- Tests settings save/load with SettingsManager
- Validates Charleston pass flow on mobile

### 2. Test Configuration
**Location:** `playwright.config.js` (update existing)

Add mobile project configuration:
```javascript
projects: [
  {
    name: 'desktop',
    use: { viewport: { width: 1280, height: 720 } },
  },
  {
    name: 'mobile',
    use: {
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    },
  },
]
```

### 3. Test Utilities
**Location:** `tests/mobile-helpers.js`

Helper functions for common mobile test operations:
- `waitForMobileGameLoad()` - Wait for mobile UI to initialize
- `tapTile(page, tileIndex)` - Tap a tile by index
- `doubleTapTile(page, tileIndex)` - Double-tap to discard
- `swipeUp(page, startX, startY)` - Perform swipe gesture
- `selectCharlestonTiles(page, indices)` - Select 3 tiles for Charleston
- `verifyOpponentBar(page, playerIndex, expectedData)` - Verify opponent display

---

## Test Requirements

### Test 1: Mobile Page Load
```javascript
test('mobile game loads with correct viewport', async ({ page }) => {
    await page.goto('/mobile/');

    // Verify mobile-specific elements exist
    await expect(page.locator('#mobile-hand-container')).toBeVisible();
    await expect(page.locator('.opponent-bar')).toHaveCount(3);
    await expect(page.locator('#mobile-discard-pile')).toBeVisible();
    await expect(page.locator('#mobile-action-bar')).toBeVisible();

    // Verify desktop elements don't exist
    await expect(page.locator('#gamediv')).not.toBeVisible();
});
```

### Test 2: Tile Selection via Tap
```javascript
test('tile selection via tap', async ({ page }) => {
    await page.goto('/mobile/');

    // Wait for game to start and tiles to be dealt
    await page.click('#start');
    await page.waitForSelector('.mobile-tile');

    // Tap first tile
    const firstTile = page.locator('.mobile-tile').first();
    await firstTile.tap();

    // Verify tile is selected (has 'selected' class)
    await expect(firstTile).toHaveClass(/selected/);

    // Tap second tile
    const secondTile = page.locator('.mobile-tile').nth(1);
    await secondTile.tap();

    // Verify first tile is deselected, second is selected
    await expect(firstTile).not.toHaveClass(/selected/);
    await expect(secondTile).toHaveClass(/selected/);
});
```

### Test 3: Tile Discard via Double-Tap
```javascript
test('tile discard via double-tap', async ({ page }) => {
    await page.goto('/mobile/');
    await page.click('#start');

    // Wait for player's turn and tiles to be dealt
    await page.waitForSelector('.mobile-tile');
    await page.waitForTimeout(2000); // Wait for Charleston/dealing to complete

    // Get initial hand size
    const initialTileCount = await page.locator('.mobile-tile').count();

    // Double-tap first tile to discard
    const firstTile = page.locator('.mobile-tile').first();
    await firstTile.dblclick(); // Playwright converts to touch events

    // Wait for discard animation
    await page.waitForTimeout(500);

    // Verify tile appears in discard pile
    await expect(page.locator('.discard-tile')).toHaveCount(1);

    // Verify hand size decreased
    const newTileCount = await page.locator('.mobile-tile').count();
    expect(newTileCount).toBe(initialTileCount - 1);
});
```

### Test 4: Charleston Pass Flow
```javascript
test('charleston pass flow on mobile', async ({ page }) => {
    await page.goto('/mobile/');

    // Enable settings to ensure Charleston happens
    await page.click('#settings-button');
    await page.selectOption('#card-year-select', '2025');
    await page.uncheck('#training-mode'); // Ensure Charleston is not skipped
    await page.click('#save-settings');

    // Start game
    await page.click('#start');
    await page.waitForSelector('.mobile-tile');

    // Wait for Charleston phase
    await page.waitForSelector('#charleston-prompt', { timeout: 10000 });

    // Select 3 tiles for Charleston pass
    const tiles = page.locator('.mobile-tile');
    await tiles.nth(0).tap();
    await tiles.nth(1).tap();
    await tiles.nth(2).tap();

    // Verify 3 tiles are selected
    const selectedTiles = page.locator('.mobile-tile.selected');
    await expect(selectedTiles).toHaveCount(3);

    // Click pass button
    await page.click('#charleston-pass-button');

    // Wait for next Charleston phase or game loop
    await page.waitForFunction(() => {
        const prompt = document.getElementById('charleston-prompt');
        return !prompt || prompt.style.display === 'none';
    });
});
```

### Test 5: Settings Save/Load
```javascript
test('settings persist across page reloads', async ({ page }) => {
    await page.goto('/mobile/');

    // Open settings
    await page.click('#settings-button');

    // Change settings
    await page.selectOption('#card-year-select', '2020');
    await page.selectOption('#difficulty-select', 'hard');
    await page.fill('#bgm-volume', '50');
    await page.check('#use-blank-tiles');

    // Save settings
    await page.click('#save-settings');

    // Reload page
    await page.reload();

    // Open settings again
    await page.click('#settings-button');

    // Verify settings persisted
    await expect(page.locator('#card-year-select')).toHaveValue('2020');
    await expect(page.locator('#difficulty-select')).toHaveValue('hard');
    await expect(page.locator('#bgm-volume')).toHaveValue('50');
    await expect(page.locator('#use-blank-tiles')).toBeChecked();
});
```

### Test 6: Opponent Bar Updates
```javascript
test('opponent bars update during game', async ({ page }) => {
    await page.goto('/mobile/');
    await page.click('#start');

    // Wait for game to start
    await page.waitForSelector('.opponent-bar');

    // Verify 3 opponent bars exist (Right, Top, Left players)
    const opponentBars = page.locator('.opponent-bar');
    await expect(opponentBars).toHaveCount(3);

    // Check initial tile counts (should be 13 each after deal)
    for (let i = 0; i < 3; i++) {
        const bar = opponentBars.nth(i);
        await expect(bar.locator('.tile-count')).toContainText('13');
    }

    // Check that one bar has "current turn" indicator
    await expect(page.locator('.opponent-bar.current-turn')).toHaveCount(1);
});
```

### Test 7: Touch Handler Swipe Gesture
```javascript
test('swipe up gesture for exposing tiles', async ({ page }) => {
    await page.goto('/mobile/');
    await page.click('#start');

    // Wait for game loop and player to have matching tiles
    await page.waitForSelector('.mobile-tile');

    // Select 3 matching tiles (assuming we have a pung)
    // This test assumes training mode with a known hand
    await page.evaluate(() => {
        localStorage.setItem('mahjong_trainingMode', 'true');
        localStorage.setItem('mahjong_trainingHand', 'B1,B1,B1,C2,C3,C4,D5,D6,D7,W1,W2,W3,Jo');
    });
    await page.reload();
    await page.click('#start');
    await page.waitForSelector('.mobile-tile');

    // Select tiles for pung
    await page.locator('.mobile-tile').nth(0).tap();
    await page.locator('.mobile-tile').nth(1).tap();
    await page.locator('.mobile-tile').nth(2).tap();

    // Perform swipe-up gesture (expose tiles)
    const handContainer = page.locator('#mobile-hand-container');
    const box = await handContainer.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height - 20);
    await page.touchscreen.swipe(
        { x: box.x + box.width / 2, y: box.y + box.height - 20 },
        { x: box.x + box.width / 2, y: box.y + 20 }
    );

    // Verify exposure was created
    await page.waitForSelector('.exposure-icon');
    await expect(page.locator('.exposure-icon')).toHaveCount(1);
});
```

### Test 8: Mobile Animations
```javascript
test('tile animations play smoothly', async ({ page }) => {
    await page.goto('/mobile/');
    await page.click('#start');

    // Wait for tile draw animation
    await page.waitForSelector('.mobile-tile.tile-drawing', { timeout: 5000 });

    // Verify animation completes
    await page.waitForFunction(() => {
        const drawingTiles = document.querySelectorAll('.mobile-tile.tile-drawing');
        return drawingTiles.length === 0;
    }, { timeout: 3000 });

    // Discard a tile and verify discard animation
    const firstTile = page.locator('.mobile-tile').first();
    await firstTile.dblclick();

    // Check for discard animation class
    await expect(page.locator('.mobile-tile.tile-discarding')).toHaveCount(1);

    // Wait for animation to complete
    await page.waitForTimeout(500);
    await expect(page.locator('.mobile-tile.tile-discarding')).toHaveCount(0);
});
```

---

## Test Helper Implementation

Create `tests/mobile-helpers.js`:

```javascript
/**
 * Wait for mobile game UI to fully load
 */
export async function waitForMobileGameLoad(page) {
    await page.waitForSelector('#mobile-hand-container', { state: 'visible' });
    await page.waitForSelector('.opponent-bar', { state: 'visible' });
    await page.waitForSelector('#mobile-action-bar', { state: 'visible' });
}

/**
 * Tap a tile by index (0-based)
 */
export async function tapTile(page, tileIndex) {
    const tile = page.locator('.mobile-tile').nth(tileIndex);
    await tile.tap();
}

/**
 * Double-tap a tile to discard it
 */
export async function doubleTapTile(page, tileIndex) {
    const tile = page.locator('.mobile-tile').nth(tileIndex);
    await tile.dblclick();
}

/**
 * Perform swipe-up gesture on hand container
 */
export async function swipeUp(page, startX, startY) {
    await page.touchscreen.swipe(
        { x: startX, y: startY },
        { x: startX, y: startY - 100 }
    );
}

/**
 * Select multiple tiles for Charleston pass
 */
export async function selectCharlestonTiles(page, indices) {
    for (const index of indices) {
        await tapTile(page, index);
    }
}

/**
 * Verify opponent bar displays correct data
 */
export async function verifyOpponentBar(page, playerIndex, expectedData) {
    const bar = page.locator('.opponent-bar').nth(playerIndex);

    if (expectedData.name) {
        await expect(bar.locator('.opponent-name')).toContainText(expectedData.name);
    }

    if (expectedData.tileCount !== undefined) {
        await expect(bar.locator('.tile-count')).toContainText(String(expectedData.tileCount));
    }

    if (expectedData.isCurrentTurn !== undefined) {
        if (expectedData.isCurrentTurn) {
            await expect(bar).toHaveClass(/current-turn/);
        } else {
            await expect(bar).not.toHaveClass(/current-turn/);
        }
    }
}

/**
 * Start game with training mode hand
 */
export async function startGameWithTrainingHand(page, handString) {
    await page.evaluate((hand) => {
        localStorage.setItem('mahjong_trainingMode', 'true');
        localStorage.setItem('mahjong_trainingHand', hand);
        localStorage.setItem('mahjong_skipCharleston', 'true');
    }, handString);

    await page.reload();
    await page.click('#start');
    await waitForMobileGameLoad(page);
}
```

---

## Playwright Configuration Update

Update `playwright.config.js` to add mobile project:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173/mahjong',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Test Execution Commands

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test:mobile": "playwright test --project=mobile",
    "test:mobile:ui": "playwright test --project=mobile --ui",
    "test:mobile:headed": "playwright test --project=mobile --headed",
    "test:mobile:debug": "playwright test --project=mobile --debug",
    "test:all": "playwright test"
  }
}
```

---

## Success Criteria

✅ All 8 tests pass on mobile project:
1. Mobile page loads with correct viewport
2. Tile selection via tap works
3. Tile discard via double-tap works
4. Charleston pass flow completes
5. Settings persist across reloads
6. Opponent bars display and update correctly
7. Swipe-up gesture exposes tiles
8. Animations play smoothly

✅ Tests run in CI/CD without flakiness

✅ Mobile helpers are reusable for future test expansion

✅ Test coverage includes:
- Touch interactions (tap, double-tap, swipe)
- Game state updates (hand, discard pile, opponents)
- Settings persistence (localStorage)
- Mobile-specific UI components

---

## Technical Notes

### Device Emulation
Playwright's mobile emulation sets:
- Touch events enabled
- User agent string (mobile browser)
- Viewport dimensions
- Device pixel ratio

### Gesture Testing
Use Playwright's `touchscreen` API:
- `tap()` - Single tap
- `dblclick()` - Double tap (converted to touch events)
- `swipe()` - Swipe gesture

### Timing Considerations
- Use `waitForSelector()` instead of fixed timeouts
- Allow animations to complete (check for absence of animation classes)
- Wait for GameController state transitions (check via DOM updates)

### Training Mode Usage
Use training mode to create predictable game states:
- Known hands for testing exposures
- Skip Charleston for faster tests
- Control tile draws for reproducibility

---

## Code Style Requirements

- Follow existing Playwright test patterns in `tests/mobile-tile.test.js`
- Use `async/await` for all async operations
- Use `expect()` from `@playwright/test`
- Add descriptive test names
- Group related tests with `test.describe()`
- Use helper functions to reduce duplication

---

## Dependencies

**Must be completed before this task:**
- Phase 3C: TouchHandler implementation
- Phase 3D: MobileTile component
- Phase 4A: HandRenderer
- Phase 4B: OpponentBar
- Phase 4C: DiscardPile
- Phase 4D: Mobile animations
- Phase 6B: SettingsManager

**Files this task will reference:**
- `mobile/index.html`
- `mobile/main.js`
- `mobile/components/MobileTile.js`
- `mobile/renderers/HandRenderer.js`
- `mobile/renderers/OpponentBar.js`
- `mobile/gestures/TouchHandler.js`
- `shared/SettingsManager.js`

---

## Validation Steps

After implementation:

1. **Run tests locally:**
   ```bash
   npm run test:mobile
   ```

2. **Verify all 8 tests pass**

3. **Check test report:**
   ```bash
   npm run test:report
   ```

4. **Run in UI mode for debugging:**
   ```bash
   npm run test:mobile:ui
   ```

5. **Test on CI/CD:**
   - Push to GitHub
   - Verify GitHub Actions runs tests
   - Check for flaky tests (re-run 3 times)

6. **Code review checklist:**
   - ✅ All tests have descriptive names
   - ✅ Helper functions are documented
   - ✅ No hardcoded timeouts (use `waitForSelector`)
   - ✅ Tests are independent (can run in any order)
   - ✅ Mobile project config matches iPhone 12 specs

---

## Known Limitations

1. **Swipe gesture testing:** May need adjustment based on TouchHandler implementation
2. **Animation timing:** Tests assume 300-500ms animations (adjust if needed)
3. **Charleston timing:** May need longer waits for AI decision delays
4. **Training mode hands:** Requires valid hand strings (see TileData.js for format)

---

## Future Enhancements (Phase 8+)

- Test different viewport sizes (Android devices)
- Test landscape mode (if supported)
- Test PWA install prompt
- Test offline mode
- Test cross-tab settings sync
- Performance testing (measure FPS during animations)
- Accessibility testing (screen reader support)

---

**Implementation Time Estimate:** 3-4 hours

**Testing Time Estimate:** 1 hour for validation and debugging

**Total:** ~5 hours (5K tokens)
