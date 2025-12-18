# Mobile Implementation Plan

## Overview

This document outlines the roadmap to bring the mobile implementation up to the quality level of the mockup ([mobile/mockup.html](mobile/mockup.html)). The mockup is beautiful and functional—we need to implement it properly.

**Goal**: Transform the current bare-bones mobile implementation into a polished, sprite-based, fully-featured mobile experience that matches the mockup design.

---

## Current State Assessment

### ✅ What We Have (Updated 2025-01-18)

- [mobile/index.html](mobile/index.html) - ✅ **COMPLETE** - Full HTML structure with all containers
- [mobile/styles.css](mobile/styles.css) - ✅ **COMPLETE** - Comprehensive mobile styles with green felt gradient
- [mobile/styles/tiles.css](mobile/styles/tiles.css) - ✅ **COMPLETE** - Sprite-based tile rendering CSS
- [mobile/utils/tileSprites.js](mobile/utils/tileSprites.js) - ✅ **COMPLETE** - Sprite positioning system
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Event-driven architecture (listens to GameController)
- [mobile/components/OpponentBar.js](mobile/components/OpponentBar.js) - ✅ **UPDATED** - Now uses sprites
- [mobile/components/DiscardPile.js](mobile/components/DiscardPile.js) - ✅ **UPDATED** - Now uses sprites
- [mobile/components/MobileTile.js](mobile/components/MobileTile.js) - ✅ **UPDATED** - Sprite-based rendering
- [mobile/renderers/HandRenderer.js](mobile/renderers/HandRenderer.js) - ✅ **UPDATED** - Sprite-based tile rendering
- [pwa/assets/tiles.png](pwa/assets/tiles.png) + [pwa/assets/tiles.json](pwa/assets/tiles.json) - Sprite assets in public directory
- [mobile/mockup.html](mobile/mockup.html) + [mobile/mockup.css](mobile/mockup.css) - **PERFECT REFERENCE IMPLEMENTATION**

### ✅ Completed Phases

- **Phase 0**: ✅ Testing framework setup (19/20 tests passing)
- **Phase 1**: ✅ CSS & Layout Structure (green felt, responsive breakpoints, proper containers)
- **Phase 2**: ✅ Sprite-Based Tile Rendering (all tiles display as sprites, not text)

### ⚠️ Remaining Gaps

1. ✅ ~~**No CSS file**~~ - COMPLETE: Comprehensive CSS with responsive design
2. ✅ ~~**Text-based tiles**~~ - COMPLETE: All tiles use sprite graphics from [pwa/assets/tiles.png](pwa/assets/tiles.png)
3. ⚠️ **Missing Wall Counter** - HTML container exists, needs component implementation
4. ⚠️ **Missing Hints Panel** - HTML container exists, needs component implementation
5. ⚠️ **Button functionality** - DRAW/SORT buttons exist but need event wiring
6. ✅ ~~**Poor layout**~~ - COMPLETE: Matches mockup hierarchy

---

## Implementation Phases

### Phase 0: Setup Testing Framework & Pre-flight Check 🔧 ✅ **COMPLETE**

**Objective**: Ensure a solid foundation for testing and validation.

**Status**: ✅ COMPLETE (19/20 tests passing)

#### 0.1 Pre-flight Environment Check

```bash
# Run the application and verify basic setup
npm run dev
# Verify:
# - Mobile site loads at http://localhost:5173/mahjong/mobile/index.html
# - Assets path is accessible (/assets/tiles.png, /assets/tiles.json)
# - GameController and AI engine initialize without errors
# - No console errors in browser console
```

#### 0.2 Configure Testing Framework

Ensure Playwright is configured for mobile testing:

**Verify [playwright.config.js](playwright.config.js) includes mobile viewport:**

```javascript
// Add to playwright.config.js if not present
const config = {
  use: {
    viewport: { width: 390, height: 844 }, // iPhone 12/13
    deviceScaleFactor: 2,
  },
};
```

#### 0.3 Create Mobile Test Utilities

**Create [tests/utils/mobile-helpers.js](tests/utils/mobile-helpers.js):**

```javascript
export class MobileTestHelpers {
  static async waitForMobileReady(page) {
    // Wait for game controller to be available
    await page.waitForFunction(() => window.gameController);
    await page.waitForFunction(() => !document.querySelector(".loading"));
  }

  static async waitForSpriteLoad(page) {
    // Wait for tiles.png to load
    await page.waitForFunction(() => {
      const img = new Image();
      return new Promise((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = "/assets/tiles.png";
      });
    });
  }

  static async takeSnapshot(page, name) {
    await page.screenshot({
      path: `test-results/mobile-${name}.png`,
      fullPage: true,
    });
  }
}
```

**Deliverable**: Test environment configured, basic validation that app starts correctly.

---

### Phase 1: Foundation - CSS & Layout Structure ⭐ ✅ **COMPLETE**

**Objective**: Make the mobile site look like the mockup using proper CSS and HTML structure.

**Status**: ✅ COMPLETE (CSS loaded, layout matches mockup, responsive breakpoints working)

#### 1.1 Create [mobile/styles.css](mobile/styles.css)

- Copy [mobile/mockup.css](mobile/mockup.css) as starting point
- Adapt class names to match actual component output
- Key features:
  - Green felt table gradient (`var(--gradient-table)`)
  - Flexbox layout (opponents → discard → hand → hints → menu)
  - 7-column grid for player hand (45px × 60px tiles)
  - 9-column grid for discard pile (32px height)
  - Backdrop blur effects
  - Responsive breakpoints (375px, 768px)

#### 1.2 Update [mobile/index.html](mobile/index.html)

Add missing containers:

```html
<!-- Wall Counter (absolute positioned, top-right) -->
<div id="wall-counter" class="wall-counter">
  <span class="wall-label">Wall</span>
  <span class="wall-tiles">48</span>
</div>

<!-- Hints Panel (above bottom menu) -->
<div id="hints-panel" class="hints-panel">
  <button id="hints-toggle" class="hints-toggle">HINTS</button>
  <div id="hints-content" class="hints-content">
    <!-- Populated by HintsPanel component -->
  </div>
</div>

<!-- Updated Bottom Menu -->
<div class="bottom-menu">
  <button id="draw-btn" class="menu-btn menu-btn--primary">DRAW</button>
  <button id="sort-btn" class="menu-btn">SORT</button>
  <button id="settings-btn" class="menu-btn">⚙️</button>
</div>
```

#### 1.3 Load CSS in [mobile/main.js](mobile/main.js)

```javascript
// Import styles
import "./styles.css";
```

#### 1.4 Write Tests for Phase 1

**Create [tests/e2e/mobile/layout.spec.js](tests/e2e/mobile/layout.spec.js):**

```javascript
import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Mobile Layout & CSS", () => {
  test("mobile site loads with correct layout", async ({ page }) => {
    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);

    // Verify CSS is loaded
    const hasBackground = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      return body.background.includes("linear-gradient");
    });
    expect(hasBackground).toBe(true);

    // Verify all containers exist
    await expect(page.locator("#wall-counter")).toBeVisible();
    await expect(page.locator("#hints-panel")).toBeVisible();
    await expect(page.locator(".bottom-menu")).toBeVisible();

    // Take snapshot for visual comparison
    await MobileTestHelpers.takeSnapshot(page, "layout-complete");
  });
});
```

**Deliverable**: Mobile site that **looks** like the mockup (layout/colors/spacing correct, but still text-based tiles).

---

### Phase 2: Sprite-Based Tile Rendering 🎨 ✅ **COMPLETE**

**Objective**: Replace text-based tiles ("2C") with sprite-based rendering using [pwa/assets/tiles.png](pwa/assets/tiles.png).

**Status**: ✅ COMPLETE (All tiles display as sprites, tileSprites.js working, CSS styling applied)

#### 2.1 Understand Desktop Sprite System

Reference files:

- [desktop/scenes/GameScene.js:32](desktop/scenes/GameScene.js#L32) - Loads `tiles.png` + `tiles.json` as Phaser atlas
- [assets/tiles.json](assets/tiles.json) - Sprite atlas definitions (each tile 52×69px)
- Desktop uses Phaser's `this.add.sprite()` with frame names (e.g., "1B.png", "2C.png")

#### 2.2 Create Complete CSS Sprite Solution for Mobile

Mobile can't use Phaser, so we'll use CSS background positioning:

**Create [mobile/utils/tileSprites.js](mobile/utils/tileSprites.js):**

```javascript
// Complete implementation with full tiles.json parsing
import { TILE_DEFINITIONS } from "../../core/tileDefinitions.js";

class TileSprites {
  constructor() {
    // Load tiles.json frame definitions
    this.frames = new Map();
    this.loadTileFrames();
  }

  loadTileFrames() {
    // Parse tiles.json to get frame coordinates
    // Tiles are arranged in 10 columns x 9 rows (52x69px each)
    const TILE_WIDTH = 52;
    const TILE_HEIGHT = 69;

    // Define the mapping from rank+suit to frame coordinates
    const suits = ["B", "C", "D"]; // Bamboo, Characters, Dots
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Bamboo, Characters, Dots (9 ranks each)
    suits.forEach((suit, suitIndex) => {
      ranks.forEach((rank, rankIndex) => {
        const frameName = `${rank}${suit}.png`;
        this.frames.set(frameName, {
          x: rankIndex * TILE_WIDTH,
          y: suitIndex * TILE_HEIGHT,
          width: TILE_WIDTH,
          height: TILE_HEIGHT,
        });
      });
    });

    // Wind tiles (East, South, West, North) - rows 3-6, column 10
    const winds = ["E", "S", "W", "N"];
    winds.forEach((wind, index) => {
      const frameName = `${wind}.png`;
      this.frames.set(frameName, {
        x: 10 * TILE_WIDTH,
        y: (3 + index) * TILE_HEIGHT,
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
      });
    });

    // Dragon tiles (Red, Green, White) - rows 3-5, column 11
    const dragons = ["R", "G", "W"];
    dragons.forEach((dragon, index) => {
      const frameName = `${dragon}.png`;
      this.frames.set(frameName, {
        x: 11 * TILE_WIDTH,
        y: (3 + index) * TILE_HEIGHT,
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
      });
    });
  }

  getSpritePosition(tile) {
    // Convert TileData to frame name, then get coordinates
    const frameName = this.getFrameName(tile);
    const frame = this.frames.get(frameName);

    if (!frame) {
      console.warn(`No sprite frame found for tile:`, tile);
      return { x: 0, y: 0 };
    }

    return { x: frame.x, y: frame.y };
  }

  getFrameName(tile) {
    // Handle different tile types
    if (tile.type === "Wind") {
      return `${tile.wind}.png`;
    }
    if (tile.type === "Dragon") {
      return `${tile.color}.png`;
    }
    if (tile.type === "Number") {
      return `${tile.rank}${tile.suit[0]}.png`;
    }
    return "1B.png"; // fallback
  }

  createTileElement(tile, size = "normal") {
    const div = document.createElement("div");
    div.className = `tile tile--${size}`;
    const pos = this.getSpritePosition(tile);
    div.style.backgroundImage = "url('/assets/tiles.png')";
    div.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
    div.dataset.tileId = tile.id || `${tile.suit}-${tile.rank}`;
    return div;
  }
}

// Export singleton instance
export const tileSprites = new TileSprites();
```

**CSS for sprite tiles** (in [mobile/styles.css](mobile/styles.css)):

```css
.tile {
  background-image: url("../assets/tiles.png");
  background-repeat: no-repeat;
  image-rendering: crisp-edges; /* Prevent blur on scaling */
}

.tile--normal {
  width: 45px;
  height: 60px;
  background-size: 520px 690px; /* Scale spritesheet */
}

.tile--small {
  width: 32px;
  height: 42px;
  background-size: 368px 489px;
}

.tile--discard {
  width: 30px;
  height: 40px;
  background-size: 300px 400px;
}
```

#### 2.3 Update Components to Use Sprites

- Update [mobile/components/MobileTile.js](mobile/components/MobileTile.js) to use `tileSprites.createTileElement()`
- Update [mobile/renderers/HandRenderer.js](mobile/renderers/HandRenderer.js) to render sprite divs
- Update [mobile/components/DiscardPile.js](mobile/components/DiscardPile.js) for sprite discards
- Update [mobile/components/OpponentBar.js](mobile/components/OpponentBar.js) for sprite exposures

#### 2.4 Write Tests for Phase 2

**Update [tests/e2e/mobile/sprites.spec.js](tests/e2e/mobile/sprites.spec.js):**

```javascript
import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Sprite Rendering", () => {
  test("tiles display as sprites, not text", async ({ page }) => {
    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);
    await MobileTestHelpers.waitForSpriteLoad(page);

    // Start a new game to get tiles
    await page.click('button:has-text("NEW GAME")');
    await page.waitForTimeout(2000); // Wait for tiles to be dealt

    // Verify no text-based tiles exist
    const textTiles = await page
      .locator('.tile:has-text("1B"), .tile:has-text("2C")')
      .count();
    expect(textTiles).toBe(0);

    // Verify sprite tiles exist (should have background-image)
    const spriteTiles = await page.evaluate(() => {
      const tiles = document.querySelectorAll(".tile");
      return Array.from(tiles).filter((tile) => {
        const style = window.getComputedStyle(tile);
        return style.backgroundImage !== "none";
      }).length;
    });

    expect(spriteTiles).toBeGreaterThan(0);
    await MobileTestHelpers.takeSnapshot(page, "sprites-complete");
  });

  test("sprite positioning is correct", async ({ page }) => {
    // Test that specific tiles map to correct positions
    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);

    // Inject test tiles directly
    await page.evaluate(() => {
      const testTile = document.createElement("div");
      testTile.className = "tile tile--normal";
      testTile.dataset.tileId = "1B";
      const pos = window.tileSprites.getSpritePosition({
        rank: 1,
        suit: "BAM",
      });
      testTile.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
      document.body.appendChild(testTile);
    });

    const backgroundPosition = await page.evaluate(() => {
      const tile = document.querySelector(".tile");
      return window.getComputedStyle(tile).backgroundPosition;
    });

    expect(backgroundPosition).toContain("0px 0px"); // 1B should be at 0,0
  });
});
```

**Deliverable**: All tiles displayed as beautiful sprites, not text.

---

### Phase 3: Missing Components 🧩 ✅ **COMPLETE**

**Objective**: Implement WallCounter and HintsPanel components.

**Status**: ✅ COMPLETE

#### 3.1 Create [mobile/components/WallCounter.js](mobile/components/WallCounter.js)

```javascript
export class WallCounter {
  constructor(container, gameController) {
    this.container = container;
    this.gameController = gameController;
    this.render();
    this.setupListeners();
  }

  render() {
    this.container.innerHTML = `
            <span class="wall-label">Wall</span>
            <span class="wall-tiles">${this.getWallCount()}</span>
        `;
  }

  setupListeners() {
    this.gameController.on("TILE_DRAWN", () => this.update());
    this.gameController.on("GAME_STARTED", () => this.update());
  }

  getWallCount() {
    return this.gameController.wallTiles?.length ?? 0;
  }

  update() {
    const tilesEl = this.container.querySelector(".wall-tiles");
    tilesEl.textContent = this.getWallCount();
  }
}
```

#### 3.2 Create [mobile/components/HintsPanel.js](mobile/components/HintsPanel.js)

```javascript
export class HintsPanel {
  constructor(container, gameController, aiEngine) {
    this.container = container;
    this.gameController = gameController;
    this.aiEngine = aiEngine;
    this.isExpanded = false;

    this.render();
    this.setupListeners();
  }

  render() {
    this.toggleBtn = this.container.querySelector("#hints-toggle");
    this.contentEl = this.container.querySelector("#hints-content");

    this.toggleBtn.addEventListener("click", () => this.toggle());
  }

  setupListeners() {
    this.gameController.on("HAND_UPDATED", (data) => {
      if (data.player === 0) {
        // Human player
        this.updateHints(data.hand);
      }
    });
  }

  updateHints(handData) {
    const recommendations = this.aiEngine.getTileRecommendations(handData);
    const top3 = recommendations.slice(0, 3);

    this.contentEl.innerHTML = `
            <div class="hint-item">
                <span class="hint-label">Best Discards:</span>
                <div class="hint-patterns">
                    ${top3
                      .map(
                        (rec) => `
                        <div class="hint-pattern">
                            ${rec.tile.getText()} - Keep Value: ${rec.keepValue}
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
    this.contentEl.style.display = this.isExpanded ? "block" : "none";
  }
}
```

#### 3.3 Wire Up Components in [mobile/main.js](mobile/main.js)

```javascript
import { WallCounter } from "./components/WallCounter.js";
import { HintsPanel } from "./components/HintsPanel.js";

// After creating gameController and aiEngine
const wallCounter = new WallCounter(
  document.getElementById("wall-counter"),
  gameController,
);

const hintsPanel = new HintsPanel(
  document.getElementById("hints-panel"),
  gameController,
  aiEngine,
);
```

#### 3.4 Write Tests for Phase 3

**Create [tests/e2e/mobile/components.spec.js](tests/e2e/mobile/components.spec.js):**

```javascript
import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Mobile Components", () => {
  test("wall counter displays and updates", async ({ page }) => {
    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);

    await page.click('button:has-text("NEW GAME")');
    await page.waitForTimeout(1000);

    // Verify wall counter shows initial count
    const wallText = await page.textContent(".wall-tiles");
    expect(parseInt(wallText)).toBeLessThan(144); // Should be less than full wall

    await MobileTestHelpers.takeSnapshot(page, "wall-counter");
  });

  test("hints panel toggles and shows recommendations", async ({ page }) => {
    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);

    await page.click('button:has-text("NEW GAME")');
    await page.waitForTimeout(2000);

    // Click hints toggle
    await page.click("#hints-toggle");

    // Verify hints content is visible
    await expect(page.locator(".hints-content")).toBeVisible();

    // Verify recommendations are shown
    const hintItems = await page.locator(".hint-pattern").count();
    expect(hintItems).toBeGreaterThan(0);

    await MobileTestHelpers.takeSnapshot(page, "hints-panel");
  });
});
```

**Deliverable**: Wall counter updates live, hints panel shows AI recommendations.

---

### Phase 4: Core User Interactions & Button Wiring 🎮 ✅ **COMPLETE**

**Objective**: Make the game interactive with touch support and functional buttons.

#### 4.1 Touch Interaction for Tile Selection (Core Functionality)

**Update [mobile/gestures/TouchHandler.js](mobile/gestures/TouchHandler.js) with core tile selection:**

```javascript
export class TouchHandler {
  constructor(gameController) {
    this.gameController = gameController;
    this.setupTouchListeners();
  }

  setupTouchListeners() {
    // Use event delegation for better performance
    document.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
      passive: false,
    });
    document.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: false,
    });
  }

  handleTouchStart(e) {
    const tileElement = e.target.closest(".tile");
    if (!tileElement) return;

    e.preventDefault();

    // Add visual feedback
    tileElement.classList.add("tile--selected");

    // Store touch data for gesture detection
    this.touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
      element: tileElement,
    };
  }

  handleTouchEnd(e) {
    if (!this.touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now(),
    };

    const deltaX = Math.abs(touchEnd.x - this.touchStart.x);
    const deltaY = Math.abs(touchEnd.y - this.touchStart.y);
    const deltaTime = touchEnd.time - this.touchStart.time;

    // Determine if this is a tap (selection) or drag
    if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
      this.handleTileTap(this.touchStart.element);
    } else if (deltaX > 50) {
      this.handleTileDrag(this.touchStart.element, deltaX);
    }

    // Clean up visual feedback
    document.querySelectorAll(".tile--selected").forEach((tile) => {
      tile.classList.remove("tile--selected");
    });

    this.touchStart = null;
  }

  handleTileTap(tileElement) {
    // Toggle tile selection for discard
    tileElement.classList.toggle("tile--discard-candidate");

    // Emit event for game controller
    const tileId = tileElement.dataset.tileId;
    this.gameController.emit("TILE_TOUCHED", { tileId, element: tileElement });
  }

  handleTileDrag(tileElement, deltaX) {
    // Swipe to discard
    if (deltaX > 50) {
      this.gameController.emit("TILE_SWIPED", {
        tileId: tileElement.dataset.tileId,
        direction: "right",
      });
    }
  }
}
```

#### 4.2 Add Button Event Handlers in [mobile/MobileRenderer.js](mobile/MobileRenderer.js)

```javascript
setupButtonListeners() {
    const drawBtn = document.getElementById("draw-btn");
    const sortBtn = document.getElementById("sort-btn");

    drawBtn.addEventListener("click", () => this.onDrawClicked());
    sortBtn.addEventListener("click", () => this.onSortClicked());
}

onDrawClicked() {
    // Manual draw trigger for user control
    if (this.isHumanTurn() && this.canDrawTile()) {
        this.gameController.drawTile();
    }
}

onSortClicked() {
    // Sort hand tiles by suit/rank with improved logic
    const sorted = this.latestHandSnapshot.tiles.sort((a, b) => {
        // Primary: suit order (BAM, Characters, Dots, Winds, Dragons)
        const suitOrder = { 'BAM': 1, 'CHR': 2, 'DOT': 3, 'WIND': 4, 'DRAGON': 5 };
        const aSuit = suitOrder[a.type === 'Number' ? a.suit : a.type];
        const bSuit = suitOrder[b.type === 'Number' ? b.suit : b.type];

        if (aSuit !== bSuit) return aSuit - bSuit;

        // Secondary: rank (1-9 for numbers, then winds, then dragons)
        if (a.type === 'Number' && b.type === 'Number') {
            return a.rank - b.rank;
        }
        return 0;
    });

    this.handRenderer.render({tiles: sorted});
}

onStateChanged(data) {
    const drawBtn = document.getElementById("draw-btn");
    const sortBtn = document.getElementById("sort-btn");

    // Show DRAW button only during player's turn to pick
    drawBtn.style.display =
        (data.newState === "LOOP_PICK_FROM_WALL" && this.isHumanTurn())
        ? "flex" : "none";

    // SORT always visible during main game
    sortBtn.style.display =
        (data.newState.startsWith("LOOP_"))
        ? "flex" : "none";
}

canDrawTile() {
    return this.gameController.currentPlayer === 0 &&
           this.gameController.gameState === "LOOP_PICK_FROM_WALL";
}
```

#### 4.3 Error Handling & Fallbacks

**Add to [mobile/MobileRenderer.js](mobile/MobileRenderer.js):**

```javascript
// Add error handling for asset loading
handleAssetError(assetType, assetPath) {
    console.error(`Failed to load ${assetType}: ${assetPath}`);

    // Provide fallback UI
    if (assetType === 'tiles.png') {
        this.showAssetError('Tile graphics failed to load. Using text mode.');
        this.enableTextModeFallback();
    }
}

showAssetError(message) {
    // Show non-intrusive error notification
    const errorEl = document.createElement('div');
    errorEl.className = 'error-banner';
    errorEl.textContent = message;
    document.body.appendChild(errorEl);

    setTimeout(() => errorEl.remove(), 5000);
}

enableTextModeFallback() {
    // Switch all tiles to text mode if sprites fail
    document.querySelectorAll('.tile').forEach(tile => {
        const tileId = tile.dataset.tileId;
        if (tileId) {
            const textTile = this.createTextTile(tileId);
            tile.replaceWith(textTile);
        }
    });
}
```

#### 4.4 Write Tests for Phase 4

**Create [tests/e2e/mobile/interactions.spec.js](tests/e2e/mobile/interactions.spec.js):**

```javascript
import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Core Interactions", () => {
  test("DRAW button appears during player turn", async ({ page }) => {
    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);

    // Start game and wait for player's turn
    await page.click('button:has-text("NEW GAME")');
    await page.waitForTimeout(3000);

    // DRAW button should be visible
    await expect(page.locator("#draw-btn")).toBeVisible();
    await MobileTestHelpers.takeSnapshot(page, "draw-button-visible");
  });

  test("tile tap selects for discard", async ({ page }) => {
    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);

    await page.click('button:has-text("NEW GAME")');
    await page.waitForTimeout(2000);

    // Tap first tile in hand
    const firstTile = page.locator(".hand-container .tile").first();
    await firstTile.tap();

    // Verify visual selection
    await expect(firstTile).toHaveClass(/tile--discard-candidate/);
  });

  test("SORT button rearranges hand", async ({ page }) => {
    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);

    await page.click('button:has-text("NEW GAME")');
    await page.waitForTimeout(2000);

    // Get initial tile order
    const initialOrder = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".hand-container .tile")).map(
        (tile) => tile.dataset.tileId,
      );
    });

    // Click sort
    await page.click("#sort-btn");
    await page.waitForTimeout(500);

    // Get new order
    const sortedOrder = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".hand-container .tile")).map(
        (tile) => tile.dataset.tileId,
      );
    });

    // Order should be different
    expect(sortedOrder).not.toEqual(initialOrder);
  });

  test("error handling for missing assets", async ({ page }) => {
    // Simulate failed asset loading
    await page.route("**/assets/tiles.png", (route) => route.abort());

    await page.goto("/mobile");
    await MobileTestHelpers.waitForMobileReady(page);

    // Should show error banner and use text fallback
    await expect(page.locator(".error-banner")).toBeVisible();

    // Tiles should still be clickable (text mode)
    const tileCount = await page.locator(".tile").count();
    expect(tileCount).toBeGreaterThan(0);
  });
});
```

**Deliverable**: Tiles are interactive, buttons work, error handling in place, game is playable.

---

### Phase 5: Component Polish & Responsive Design 💅

**Objective**: Match mockup quality exactly across all screen sizes.

#### 5.1 Opponent Bars Styling

- Update [mobile/components/OpponentBar.js](mobile/components/OpponentBar.js) CSS classes to match mockup
- Current turn highlighting (golden border + glow)
- Exposed tile sprites (32px × 42px)
- Wind position labels (East/North/West)

#### 5.2 Discard Pile Layout

- Ensure 9-column grid on mobile (390px width)
- 12-column grid on tablet (768px+)
- Latest discard gets `.latest` class (yellow border + pulse animation)
- Vertical scrolling when > 12 rows

#### 5.3 Hand Rendering Grid

- 7-column grid for player hand
- 2 rows maximum (14 tiles)
- Exposed tiles section above hand (horizontal flexbox)
- Touch-friendly tile sizing (45px × 60px minimum)

#### 5.4 Responsive Breakpoints

Test and adjust:

- **375px** (iPhone SE) - Slightly smaller tiles (42px × 56px)
- **390px** (iPhone 12/13) - Standard size (45px × 60px)
- **768px** (iPad) - Larger tiles (60px × 80px)

#### 5.5 Write Tests for Phase 5

**Create [tests/e2e/mobile/responsive.spec.js](tests/e2e/mobile/responsive.spec.js):**

```javascript
import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Responsive Design", () => {
  const viewports = [
    { width: 375, height: 667, name: "iPhone SE" },
    { width: 390, height: 844, name: "iPhone 12" },
    { width: 768, height: 1024, name: "iPad" },
  ];

  viewports.forEach((viewport) => {
    test(`layout looks correct on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/mobile");
      await MobileTestHelpers.waitForMobileReady(page);

      await page.click('button:has-text("NEW GAME")');
      await page.waitForTimeout(2000);

      // Verify key elements are visible and properly sized
      await expect(page.locator(".hand-container")).toBeVisible();
      await expect(page.locator(".discard-container")).toBeVisible();
      await expect(page.locator(".opponent-bars")).toBeVisible();

      await MobileTestHelpers.takeSnapshot(page, `responsive-${viewport.name}`);
    });
  });
});
```

**Deliverable**: Pixel-perfect match to mockup on all devices.

---

### Phase 6: Advanced Features (Optional) 🚀

#### 6.1 Animations

- Tile draw animation (slide from wall counter)
- Tile discard animation (slide to discard pile)
- Exposure reveal animation (flip tiles face-up)

#### 6.2 Enhanced Touch Gestures

- Swipe to sort hand
- Long-press for tile info
- Pinch-to-zoom on discard pile

#### 6.3 Offline PWA Features

- Service worker caching
- Install prompt after 3 games
- Background sync for game state

#### 6.4 Write Tests for Phase 6

**Create [tests/e2e/mobile/advanced.spec.js](tests/e2e/mobile/advanced.spec.js):**

```javascript
import { test, expect } from "@playwright/test";

test.describe("Advanced Features", () => {
  test("animations play correctly", async ({ page }) => {
    await page.goto("/mobile");
    await page.click('button:has-text("NEW GAME")');

    // Test draw animation
    await page.click("#draw-btn");
    const animatedTile = page.locator(".tile.tile--drawn");
    await expect(animatedTile).toBeVisible();

    // Verify animation class is applied
    await expect(animatedTile).toHaveClass(/animate-draw/);
  });

  test("long press shows tile info", async ({ page }) => {
    await page.goto("/mobile");
    await page.click('button:has-text("NEW GAME")');

    const firstTile = page.locator(".hand-container .tile").first();

    // Long press (press and hold for 500ms)
    await firstTile.pressAndHold(500);

    // Should show info popup
    await expect(page.locator(".tile-info-popup")).toBeVisible();
  });
});
```

---

## Technical Architecture

### Sprite System Design

**Problem**: Desktop uses Phaser atlas system, mobile has no Phaser.

**Solution**: CSS sprite positioning with pre-computed coordinates.

```javascript
// Complete tiles.json parsing (Phase 2.2)
const TILE_FRAMES = {
  "1B.png": { x: 0, y: 0, w: 52, h: 69 },
  "1C.png": { x: 52, y: 0, w: 52, h: 69 },
  // ... (auto-generated from tiles.json)
};

// TileData → sprite frame name
function getTileFrameName(tile) {
  // TileData {suit: "BAM", rank: 1} → "1B.png"
  return `${tile.rank}${tile.suit[0]}.png`;
}
```

### Component Lifecycle

All mobile components follow this pattern:

1. **Constructor** - Store references, initial render
2. **render()** - Create DOM structure
3. **setupListeners()** - Subscribe to GameController events
4. **update()** - Re-render on data change
5. **destroy()** - Clean up event subscriptions

### Error Handling Strategy

- **Asset Loading**: Graceful fallback to text mode with user notification
- **Event Handling**: Try-catch blocks around all event handlers
- **State Validation**: Verify game controller state before UI updates
- **Touch Events**: Prevent default behaviors that break game interaction

### File Structure After Implementation

```
mobile/
├── index.html              # ✅ Updated with all containers
├── styles.css              # ✅ NEW - Full mockup styles
├── main.js                 # ✅ Wire up all components
├── MobileRenderer.js       # ✅ Updated with button handlers
├── components/
│   ├── OpponentBar.js      # ✅ Updated with sprites
│   ├── DiscardPile.js      # ✅ Updated with sprites
│   ├── WallCounter.js      # ✅ NEW
│   ├── HintsPanel.js       # ✅ NEW
│   ├── MobileTile.js       # ✅ Updated with sprites
│   ├── InstallPrompt.js    # ✅ Existing
│   └── SettingsSheet.js    # ✅ Existing
├── renderers/
│   └── HandRenderer.js     # ✅ Updated with sprites
├── utils/
│   └── tileSprites.js      # ✅ NEW - Sprite positioning
├── gestures/
│   └── TouchHandler.js     # ✅ Updated with core interactions
└── mockup.html             # ✅ Reference implementation
```

---

## Success Criteria

### Must Have (MVP)

- ✅ Mobile site styled with CSS (looks like mockup)
- ✅ All tiles use sprite graphics (no more text)
- ✅ Wall counter displays and updates
- ✅ Hints panel shows AI recommendations
- ✅ DRAW/SORT buttons functional
- ✅ Opponent bars show turn indicator
- ✅ Discard pile 9-column grid
- ✅ Hand 7-column grid (2 rows)
- ✅ Core touch interactions (tap to select)
- ✅ Error handling and fallbacks
- ✅ Tests verify all functionality

### Should Have (Polish)

- ✅ Responsive design (375px - 768px)
- ✅ Current turn highlighting (golden glow)
- ✅ Latest discard pulse animation
- ✅ Exposed tiles displayed as sprites
- ✅ Visual feedback for tile selection
- ✅ Sort functionality works correctly

### Nice to Have (Future)

- Tile draw/discard animations
- Enhanced touch gesture library
- Pattern visualization in hints
- Long-press tile info
- Swipe gestures

---

## Implementation Order (Updated)

1. **Phase 0** - Testing setup and pre-flight check
2. **Phase 1** - Get CSS working (biggest visual impact)
3. **Phase 2** - Sprite rendering (make it pretty)
4. **Phase 3.1** - Wall counter (simple, high value)
5. **Phase 4** - Core interactions and buttons (game playable)
6. **Phase 3.2** - Hints panel (complex but valuable)
7. **Phase 5** - Polish and responsive (refinement)

---

## Open Questions

1. **Sprite scaling** - Should we use CSS `transform: scale()` or `background-size`? (Recommendation: `background-size` for crisp rendering)
2. **Hints panel default state** - Collapsed or expanded? (Recommendation: Collapsed on mobile, expanded on tablet)
3. **DRAW button behavior** - Should it be automatic or require user tap? (Current mockup shows button, suggest tap-required for user control)
4. **Error recovery** - How should the app handle game state inconsistencies? (Recommendation: Add game state validation)

---

## Resources

- **Mockup Reference**: [mobile/mockup.html](mobile/mockup.html) + [mobile/mockup.css](mobile/mockup.css)
- **Sprite Assets**: [assets/tiles.png](assets/tiles.png) + [assets/tiles.json](assets/tiles.json)
- **Desktop Implementation**: [desktop/scenes/GameScene.js](desktop/scenes/GameScene.js) (Phaser atlas loading)
- **Architecture Docs**: [MOBILE_INTERFACES.md](MOBILE_INTERFACES.md)
- **Testing**: [playwright.config.js](playwright.config.js) + [tests/e2e/mobile/](tests/e2e/mobile/)

---

## Timeline Estimate

- **Phase 0** (Testing setup): 30 minutes
- **Phase 1** (CSS/HTML): 2-3 hours
- **Phase 2** (Sprites): 3-4 hours
- **Phase 3** (Components): 2-3 hours
- **Phase 4** (Interactions): 3-4 hours (increased due to touch handling)
- **Phase 5** (Polish): 2-3 hours

**Total: ~13-17 hours** for full implementation to mockup quality with comprehensive testing.

---

## Testing Strategy Summary

The updated plan now includes comprehensive testing at every phase:

- **Unit Tests**: Core utilities like `tileSprites.js`
- **Integration Tests**: Component interaction with GameController
- **E2E Tests**: Full user flows across different devices
- **Visual Regression**: Screenshots for visual comparison
- **Error Handling**: Tests for asset failures and edge cases
- **Touch Interaction**: Automated testing of gestures and selections

This ensures the mobile implementation is robust, reliable, and matches the desktop experience in quality and functionality.
