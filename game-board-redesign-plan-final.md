# Game Board Redesign Implementation Plan (Final)

## Instructions for Implementation
You are an expert JavaScript and Phaser.js developer tasked with implementing this redesign plan for the Mahjong game. Your goal is to update the codebase step-by-step as detailed below, ensuring no regressions and maintaining existing functionality. Use the provided code snippets exactly where specified, adapting only for variable names or constants from the existing code (e.g., reference [`constants.js`](constants.js) for values like `WINDOW_WIDTH`).

**Key Rules:**
- Work on one step at a time.
- After each change, commit your work with a message like "Completed Step X: [Brief Description]".
- Do not proceed to the next step without user confirmation.
- If you encounter errors or ambiguities, note them and ask for clarification before continuing.
- Test locally after each checkpoint: Run `npm run dev`, verify the specified behaviors, and report results (e.g., "Animation works, no wall visible").
- Base all changes on the provided file contents and line references.
- Preserve code style (e.g., use `debugPrint` for logging).

Proceed as follows:
1. Read the entire plan.
2. Implement Step 1.
3. Reach Checkpoint 1 and pause for user feedback.
4. Continue only after user says "Proceed" or provides fixes.

Now, begin implementation.

## Objectives
- Remove visual wall grid, replace with counter.
- Reposition discard pile to center.
- Add translucent hand racks attached to hands.
- Adjust exposed tiles to top row in racks.
- Ensure smooth animations and compatibility.

## Step-by-Step Implementation

### Step 1: Remove Wall Display and Update Home Page Animation
Focus: Eliminate wall visuals; redirect home page animation to player positions.

- **File:** [`homePageTileManager.js`](homePageTileManager.js:141)
  - Replace the entire `animatePileToWall()` method with the following to animate tiles directly to approximated player hand positions (cycle for all 152 tiles, hide extras off-screen):
    ```
    animatePileToWall() {
      this.animationState = "dealing";
      const promises = [];
      const positions = this.calculatePlayerHandPositions(); // Add this new method below
      for (let i = 0; i < this.tileArray.length; i++) {
        const tile = this.tileArray[i];
        const target = positions[i % positions.length]; // Cycle through positions
        const promise = this.animateSingleTile(tile, target.x, target.y, target.angle, 2250, i * 5);
        promises.push(promise);
        if (i >= 52) tile.showTile(false, false); // Hide remaining tiles
      }
      Promise.all(promises).then(() => {
        debugPrint("Tiles distributed to player positions.");
        this.isAnimating = false;
        this.animationState = "complete";
        if (this.onAnimationComplete) this.onAnimationComplete();
      });
    }

    // Add this new method at the end of the file
    calculatePlayerHandPositions() {
      const positions = [];
      const HAND_SCALE = 0.6;
      const TILE_W = SPRITE_WIDTH * HAND_SCALE;
      const TILE_H = SPRITE_HEIGHT * HAND_SCALE;
      // Bottom
      for (let i = 0; i < 13; i++) positions.push({x: (WINDOW_WIDTH / 2) - (6.5 * TILE_W) + (i * TILE_W), y: WINDOW_HEIGHT - TILE_H - 10, angle: 0});
      // Top
      for (let i = 0; i < 13; i++) positions.push({x: (WINDOW_WIDTH / 2) - (6.5 * TILE_W) + (i * TILE_W), y: TILE_H + 10, angle: 180});
      // Left
      for (let i = 0; i < 13; i++) positions.push({x: TILE_H + 10, y: (WINDOW_HEIGHT / 2) - (6.5 * TILE_W) + (i * TILE_W), angle: -90});
      // Right
      for (let i = 0; i < 13; i++) positions.push({x: WINDOW_WIDTH - TILE_H - 10, y: (WINDOW_HEIGHT / 2) - (6.5 * TILE_W) + (i * TILE_W), angle: 90});
      // Extras off-screen
      for (let i = 52; i < 152; i++) positions.push({x: -100, y: -100, angle: 0});
      return positions;
    }
    ```
- **File:** [`gameObjects.js`](gameObjects.js:359)
  - Delete the `showWall()` and `showWallBack()` methods from the Wall class. Simplify Wall to manage only the tile array (no visual code).
- **File:** [`gameLogic.js`](gameLogic.js:158) (approx)
  - Search for and remove any `this.table.wall.showWall()` calls; replace discard offsets with fixed center values if needed.
- **File:** [`gameObjects_table.js`](gameObjects_table.js:180)
  - Comment out or remove `this.wall.showWallBack()`.

**Checkpoint 1:** Test the home page: Click "Start Game". Verify tiles animate to player areas without forming a wall. Check console for errors. Confirm with user: "Step 1 complete. Animation works? No wall visible? Proceed?"

### Step 2: Implement Wall Tile Counter
Focus: Add graphical progress bar that updates dynamically.

- **File:** [`GameScene.js`](GameScene.js:44)
  - Add the following methods after `create()`:
    ```
    createWallTileCounter() {
      const bar = this.add.graphics({x: WINDOW_WIDTH / 2 - 100, y: 30});
      bar.fillStyle(0x333333, 1);
      bar.fillRoundedRect(0, 0, 200, 20, 5); // Background
      const fill = this.add.graphics();
      bar.add(fill);
      bar.setVisible(false);
      return { bar, fill, maxTiles: 152 };
    }

    updateWallTileCounter(count) {
      if (!this.gGameLogic.wallCounter) return;
      const { fill, maxTiles } = this.gGameLogic.wallCounter;
      fill.clear();
      if (count < 0 || count > maxTiles) {
        console.error('Invalid wall count:', count);
        count = Math.max(0, Math.min(count, maxTiles));
      }
      fill.fillStyle(0x00ff00, 1);
      const width = (count / maxTiles) * 200;
      fill.fillRoundedRect(0, 0, width, 20, 5);
      this.gGameLogic.wallCounter.bar.setVisible(true);
    }
    ```
  - In `create()`, add: `this.gGameLogic.wallCounter = this.createWallTileCounter();`.
- **File:** [`gameLogic.js`](gameLogic.js)
  - After every wall modification (e.g., in `deal()`, `pickFromWall()`): `this.scene.updateWallTileCounter(this.table.wall.getCount());`.

**Checkpoint 2:** Start a game and perform actions that change wall count (e.g., deal tiles). Verify the progress bar appears and updates correctly (shrinks as tiles are picked). Check for errors on invalid counts. Confirm with user: "Step 2 complete. Counter works? Updates correctly? Proceed?"

### Step 3: Reposition Discard Pile
- **File:** [`gameObjects.js`](gameObjects.js:514)
  - Replace `showDiscards()` with:
    ```
    showDiscards() {
      if (this.tileArray.length === 0) return;
      const centerX = WINDOW_WIDTH / 2;
      const centerY = WINDOW_HEIGHT / 2 - 100;
      const DISCARD_SCALE = 0.5;
      const tilesPerRow = 10;
      const tileSpacing = SPRITE_WIDTH * DISCARD_SCALE + TILE_GAP;
      const totalWidth = Math.min(this.tileArray.length, tilesPerRow) * tileSpacing - TILE_GAP;
      let currentX = centerX - totalWidth / 2;
      let currentY = centerY;
      let rowCount = 0;
      for (const tile of this.tileArray) {
        tile.animate(currentX, currentY, 0);
        tile.scale = DISCARD_SCALE;
        tile.showTile(true, true);
        currentX += tileSpacing;
        if (++rowCount >= tilesPerRow) {
          rowCount = 0;
          currentX = centerX - totalWidth / 2;
          currentY += SPRITE_HEIGHT * DISCARD_SCALE + TILE_GAP;
        }
      }
    }
    ```
- Update calls in other files (e.g., [`gameObjects_table.js`](gameObjects_table.js)) to `this.discards.showDiscards()` without params.

**Checkpoint 3:** Play until discards occur. Verify pile is centered, scales correctly, and wraps rows. No overlaps or off-screen issues? Confirm with user: "Step 3 complete. Discards centered? Proceed?"

### Step 4: Implement Hand Racks and Exposed Tiles
- **File:** [`gameObjects_hand.js`](gameObjects_hand.js:294)
  - Add to constructor: `this.rackGraphics = null;`.
  - Add method:
    ```
    updateRack(playerInfo) {
      if (!this.rackGraphics) this.rackGraphics = this.scene.add.graphics();
      this.rackGraphics.clear();
      const rackPos = this.getHandRackPosition(playerInfo); // Assume existing or add if needed
      this.rackGraphics.fillStyle(0x000000, 0.3);
      this.rackGraphics.fillRoundedRect(rackPos.x, rackPos.y, rackPos.width, rackPos.height, 10);
      this.rackGraphics.setDepth(-1);
    }
    ```
  - In `showHand()`, add `this.updateRack(playerInfo);` at the start. Adjust tile positioning for two rows within rack (top: exposed, bottom: hidden, with gaps).

- Propagate `scene` passing as needed in [`gameObjects_table.js`](gameObjects_table.js) and [`gameObjects_player.js`](gameObjects_player.js).

**Checkpoint 4:** Start game, expose tiles. Verify racks appear translucent, attached to hands, with exposed on top row. Test dragging/animations. Confirm with user: "Step 4 complete. Racks work? Proceed?"

### Step 5: Final Integration and Cleanup
- Grep codebase for "wall" and remove any remnants.
- Update all references to use new methods.

**Final Checkpoint:** Full game test. Verify all objectives met, no errors. Confirm with user: "Implementation complete. Everything works? Any issues?"