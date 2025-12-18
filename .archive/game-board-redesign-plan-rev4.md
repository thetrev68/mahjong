# Game Board Redesign Implementation Plan (Rev 4)

## Overview

This revision (Rev4) builds on Rev3 by adding significantly more detail, including precise code snippets, line references, and error-handling notes. This ensures even a basic LLM can implement it step-by-step without ambiguity. Based on feedback, I've expanded sections with exact modifications, variable checks, and fallback logic to address potential implementation pitfalls. The plan remains focused on the Mahjong codebase, improving board structure, tile management, scene handling, and hand objects.

## Objectives

- Remove all wall visuals completely.
- Add a dynamic wall counter (progress bar).
- Center and optimize discard pile.
- Implement dynamic, attached hand racks.
- Position exposed tiles properly.
- Ensure smooth transitions and error-free execution.

## Changes

Same as Rev3, with added granularity.

## Step-by-Step Implementation Steps

### Step 1: Remove Wall Display

#### 1.1 Modify Home Page Animation

- **File:** [`homePageTileManager.js`](homePageTileManager.js:141)
  - Replace `animatePileToWall()` entirely to distribute tiles to player positions. Cycle through positions for 4 players (13 tiles each), place remaining tiles off-screen or in a hidden pile.
  - New code:

    ```
    animatePileToWall() {
      this.animationState = "dealing";
      const promises = [];
      const positions = this.calculatePlayerHandPositions(); // New method below
      for (let i = 0; i < this.tileArray.length; i++) {
        const tile = this.tileArray[i];
        const target = positions[i % positions.length]; // Cycle if more tiles
        const promise = this.animateSingleTile(tile, target.x, target.y, target.angle, 2250, i * 5);
        promises.push(promise);
        if (i >= 52) tile.showTile(false, false); // Hide extras
      }
      Promise.all(promises).then(() => {
        debugPrint("Tiles dealt to hands.");
        this.isAnimating = false;
        this.animationState = "complete";
        if (this.onAnimationComplete) this.onAnimationComplete();
      });
    }

    calculatePlayerHandPositions() {
      const positions = [];
      const HAND_SCALE = 0.6;
      const TILE_W = SPRITE_WIDTH * HAND_SCALE;
      const TILE_H = SPRITE_HEIGHT * HAND_SCALE;
      // Bottom (Player 0)
      for (let i = 0; i < 13; i++) positions.push({x: (WINDOW_WIDTH / 2) - (6.5 * TILE_W) + (i * TILE_W), y: WINDOW_HEIGHT - TILE_H - 10, angle: 0});
      // Top (Player 2)
      for (let i = 0; i < 13; i++) positions.push({x: (WINDOW_WIDTH / 2) - (6.5 * TILE_W) + (i * TILE_W), y: TILE_H + 10, angle: 180});
      // Left (Player 3)
      for (let i = 0; i < 13; i++) positions.push({x: TILE_H + 10, y: (WINDOW_HEIGHT / 2) - (6.5 * TILE_W) + (i * TILE_W), angle: -90});
      // Right (Player 1)
      for (let i = 0; i < 13; i++) positions.push({x: WINDOW_WIDTH - TILE_H - 10, y: (WINDOW_HEIGHT / 2) - (6.5 * TILE_W) + (i * TILE_W), angle: 90});
      // Extras: hidden pile
      for (let i = 52; i < 152; i++) positions.push({x: -100, y: -100, angle: 0}); // Off-screen
      return positions;
    }
    ```

- **File:** [`gameObjects.js`](gameObjects.js:359)
  - Delete Wall class methods `showWall()` and `showWallBack()`. Simplify Wall to:
    ```
    class Wall {
      constructor(scene) { this.scene = scene; this.tileArray = []; }
      // Keep create, insert, remove, shuffle, etc., but no visuals
    }
    ```

#### 1.2 Remove Wall Calls

- **File:** [`gameLogic.js`](gameLogic.js:158) (approx)
  - Replace wall calls with nothing; ensure discards update independently.
- **File:** [`gameObjects_table.js`](gameObjects_table.js:180)
  - Remove `this.wall.showWallBack()`.

### Step 2: Implement Wall Tile Counter

- **File:** [`GameScene.js`](GameScene.js:44)
  - Add methods:

    ```
    createWallTileCounter() {
      const bar = this.add.graphics({x: WINDOW_WIDTH / 2 - 100, y: 30});
      bar.fillStyle(0x333333, 1);
      bar.fillRoundedRect(0, 0, 200, 20, 5); // Max bar
      const fill = this.add.graphics();
      bar.add(fill);
      bar.setVisible(false);
      return { bar, fill, max: 152 };
    }

    updateWallTileCounter(count) {
      if (!this.gGameLogic.wallCounter) return;
      const { fill, max } = this.gGameLogic.wallCounter;
      fill.clear();
      fill.fillStyle(0x00ff00, 1);
      const width = (count / max) * 200;
      fill.fillRoundedRect(0, 0, width, 20, 5);
      this.gGameLogic.wallCounter.bar.setVisible(true);
    }
    ```

  - In `create()`: `this.gGameLogic.wallCounter = this.createWallTileCounter();`.

- **File:** [`gameLogic.js`](gameLogic.js)
  - After any wall change (e.g., `deal()` line ~100): `this.scene.updateWallTileCounter(this.table.wall.getCount());`.
  - Add check: `if (count < 0) console.error('Negative wall count');`.

### Step 3: Reposition Discard Pile

- **File:** [`gameObjects.js`](gameObjects.js:514)
  - Update as in Rev3, but add: if (this.tileArray.length === 0) return;.

### Step 4: Implement Hand Racks

- **File:** [`gameObjects_hand.js`](gameObjects_hand.js:294)
  - Add to constructor: `this.rackGraphics = null;`.
  - Add `updateRack(playerInfo)`:
    ```
    updateRack(playerInfo) {
      if (!this.rackGraphics) this.rackGraphics = this.scene.add.graphics();
      this.rackGraphics.clear();
      const rackPos = this.getHandRackPosition(playerInfo);
      this.rackGraphics.fillStyle(0x000000, 0.3);
      this.rackGraphics.fillRoundedRect(rackPos.x, rackPos.y, rackPos.width, rackPos.height, 10);
      this.rackGraphics.setDepth(-1);
    }
    ```
  - In `showHand()`: call `this.updateRack(playerInfo)` before positioning tiles.

### Step 5: Exposed Tiles

- As in Rev3, with added checks for empty sets.

### Step 6: Integration and Cleanup

- Grep for "wall" and remove remnants.
- Test: Run `npm run dev`, check console for errors.

## Potential Pitfalls

- **Off-Screen Tiles:** If positions calculate negative, clamp to 0.
- **Null Checks:** Add `if (!tile.sprite) return;` in animations.
- **Infinite Loops:** Limit promise waits with timeouts.

## Testing Recommendations

- Same as Rev3, plus: Log every position calculation; test with 0 tiles.
