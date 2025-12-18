# Game Board Redesign Implementation Plan (Rev 3 by Grok 4)

## Objectives

The primary goals of this redesign are to modernize the game board by removing the visual wall tile grid, replacing it with a wall tile counter, repositioning the discard pile to the center, adding translucent hand racks that logically attach to player hands, and adjusting exposed tile positioning for better visibility and realism. This revision addresses issues in Rev2, such as incomplete wall removal, inaccurate animation targets, progress bar implementation gaps, discard pile scaling, and hand rack integration. It ensures compatibility with the existing codebase (e.g., [`homePageTileManager.js`](homePageTileManager.js), [`gameObjects.js`](gameObjects.js), [`GameScene.js`](GameScene.js), [`gameObjects_hand.js`](gameObjects_hand.js), [`gameObjects_table.js`](gameObjects_table.js), [`gameLogic.js`](gameLogic.js), and [`constants.js`](constants.js)), improves tile management, enhances scene handling, and simplifies implementation while maintaining smooth animations and functionality.

Key improvements:

- Eliminate all wall visuals without breaking home page animations.
- Implement a functional progress bar for wall tile counting.
- Center and properly scale the discard pile.
- Make hand racks dynamic and attached to Hand objects for better modularity.
- Position exposed tiles above hidden hands within racks.
- Fix animation and positioning bugs from Rev2.

## Changes

### 1. Wall Removal

- Completely eliminate wall visuals and related methods.
- Modify home page animation to deal tiles directly to player hand positions, skipping wall formation.
- Remove all calls to `showWall()` and `showWallBack()`.

### 2. Wall Tile Counter

- Replace text-based counter with a graphical progress bar.
- Update dynamically during gameplay (dealing, picking).

### 3. Discard Pile Repositioning

- Center the pile horizontally and vertically in the board area.
- Use consistent scaling and row wrapping for better visibility.

### 4. Translucent Hand Racks

- Hand objects manage their own racks for "sticking" behavior.
- Racks are tall enough for two rows: hidden hand (bottom) and exposed sets (top).
- Semi-transparent black with white border for aesthetics.

### 5. Exposed Tiles Repositioning

- Display on the top row of the hand rack, grouped and centered.
- Ensure separation from hidden hand.

### 6. General Improvements

- Update tile animations to use correct positions and scales.
- Add error handling for edge cases like empty hands or invalid positions.
- Optimize for performance by reducing unnecessary animations.

## Step-by-Step Implementation Steps

### Step 1: Remove Wall Display

- **File:** [`homePageTileManager.js`](homePageTileManager.js:141)
  - Modify `animatePileToWall()` to animate all 152 tiles directly to approximated player hand positions (cycle through 4 sets of 13 positions, hide extras off-screen or at a pile).
  - Remove `calculateStackPosition()` calls; replace with a new `calculateDistributedPositions()` method that distributes tiles to player areas without showing a wall.
- **File:** [`gameLogic.js`](gameLogic.js)
  - Remove `this.table.wall.showWall()` and related discard offsets in `loop()`.
- **File:** [`gameObjects_table.js`](gameObjects_table.js)
  - In `processClaimArray()`, remove `this.wall.showWall()`; set discard to center (e.g., `WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 - 100`).
  - In `create()`, comment out `this.wall.showWallBack()`.
- **File:** [`gameObjects.js`](gameObjects.js:359)
  - Delete `showWall()` and `showWallBack()` from Wall class.
  - Simplify Wall to only manage tile array (no visuals).

### Step 2: Implement Wall Tile Counter

- **File:** [`GameScene.js`](GameScene.js:44)
  - Add `createWallTileCounter()` to create a progress bar graphic (e.g., using Phaser.Graphics: outer rectangle for max, inner for current count).
  - Example:
    ```
    createWallTileCounter() {
      const bar = this.add.graphics();
      bar.fillStyle(0x000000, 0.5);
      bar.fillRect(0, 0, 200, 20); // Background
      const inner = this.add.graphics();
      bar.add(inner); // Nest for easy updates
      return { bar, inner };
    }
    ```
  - Add `updateWallTileCounter(count)` to scale inner bar (e.g., `inner.scaleX = count / 152`).
  - Replace `wallText` creation with `this.wallCounter = this.createWallTileCounter(); this.wallCounter.bar.setPosition(WINDOW_WIDTH / 2 - 100, 50);`.
- **File:** [`gameLogic.js`](gameLogic.js)
  - Replace all `wallText.setText()` with `this.scene.updateWallTileCounter(this.table.wall.getCount())` in `deal()`, `pickFromWall()`, etc.

### Step 3: Reposition Discard Pile

- **File:** [`gameObjects.js`](gameObjects.js:514)
  - Update `showDiscards(offsetX, offsetY)` to use center positioning:
    ```
    showDiscards() {
      const centerX = WINDOW_WIDTH / 2;
      const centerY = WINDOW_HEIGHT / 2 - 100;
      const DISCARD_SCALE = 0.5; // Smaller for center pile
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
- Call `this.discards.showDiscards()` without params in relevant places.

### Step 4: Implement Hand Racks

- **File:** [`gameObjects_table.js`](gameObjects_table.js)
  - Remove rack logic from Table; pass `scene` to Player: `new Player(this.scene, i)`.
- **File:** [`gameObjects_player.js`](gameObjects_player.js)
  - Update constructor to accept and pass `scene` to Hand.
- **File:** [`gameObjects_hand.js`](gameObjects_hand.js:294)
  - In constructor, add `this.rack = null;`.
  - Add `createRack(playerInfo)` to draw translucent rack (e.g., Graphics with fillRoundedRect, alpha 0.3).
  - In `showHand()`, call `this.createRack(playerInfo)` and position two rows: bottom for hidden, top for exposed.

### Step 5: Exposed Tiles Repositioning

- **File:** [`gameObjects_hand.js`](gameObjects_hand.js:433)
  - Update `showHand()` to calculate two rows within rack bounds, grouping exposed sets with extra gaps.

### Step 6: Integration

- Update all references to wall/discards in [`gameLogic.js`](gameLogic.js) and [`GameScene.js`](GameScene.js).
- Test animations in home page and gameplay.

## Potential Pitfalls

- **Animation Timing:** Direct dealing may cause overlaps; stagger animations.
- **Scaling Issues:** Ensure DISCARD_SCALE doesn't clip tiles; test on different resolutions.
- **Input Conflicts:** Rack attachment might interfere with tile dragging; ensure depths are correct.
- **Performance:** Graphics for racks/counter could impact FPS; optimize by reusing objects.
- **Edge Cases:** Empty wall, zero tiles, or max discards; add checks to prevent crashes.
- **Rev2 Errors:** Avoid partial removals; grep for "wall" to ensure complete elimination.

## Testing Recommendations

- **Unit Tests:** Test wall counter updates, discard positioning, rack rendering individually.
- **Integration Tests:** Run full game cycle; verify no wall visuals, correct animations.
- **Visual Checks:** Screenshots before/after changes; test on multiple browsers/devices.
- **Checklist:**
  - [ ] Wall invisible, counter shows correct count.
  - [ ] Discards centered, wrap properly.
  - [ ] Racks appear/translucent, stick to hands during animations.
  - [ ] Exposed tiles on top row, hidden on bottom.
  - [ ] No console errors; smooth performance.
