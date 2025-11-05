# Game Board Redesign Implementation Plan (Rev 2)

## Overview

This document provides a revised and more detailed implementation plan for the game board redesign. This plan addresses the shortcomings of the previous attempt by incorporating a deeper analysis of the existing codebase. The goal is to replace the wall tile grid tile counter, reposition the discard pile, add translucent hand racks, and adjust exposed tile positioning.

This plan is based on a thorough review of `game-board-redesign-plan-rev1.md` and the following files:
*   `GameScene.js`
*   `gameObjects.js`
*   `gameObjects_hand.js`
*   `gameObjects_table.js`
*   `gameLogic.js`
*   `constants.js`

## 1. Remove Existing Wall Display

**Problem:** The previous attempt failed to remove the wall display because it missed a call to `showWall()` in `gameLogic.js`.

**Solution:** Remove all calls to `showWall()` and `showWallBack()` from the codebase.

### 1.1. Modify `gameLogic.js`

*   **File:** `gameLogic.js`
*   **Function:** `loop()`
*   **Action:** Remove the call to `this.table.wall.showWall()` and `this.table.discards.showDiscards()`. The discard pile will be shown in `gameObjects_table.js`.

**Current Code (around line 468):**
```javascript
                // Joker discarded - add to discard pile
                this.table.discards.insertDiscard(discardTile);
                const {offsetX, offsetY} = this.table.wall.showWall();
                this.table.discards.showDiscards(offsetX, offsetY);
```

**New Code:**
```javascript
                // Joker discarded - add to discard pile
                this.table.discards.insertDiscard(discardTile);
                // The discard pile is now shown in processClaimArray
```

### 1.2. Modify `gameObjects_table.js`

*   **File:** `gameObjects_table.js`
*   **Function:** `processClaimArray()`
*   **Action:** Remove the call to `this.wall.showWall()` and set the discard pile to a centered position.

**Current Code (around line 272):**
```javascript
    this.discards.insertDiscard(discardTile);
    const {offsetX, offsetY} = this.wall.showWall();
    this.discards.showDiscards(offsetX, offsetY);
```

**New Code:**
```javascript
    this.discards.insertDiscard(discardTile);
    this.discards.showDiscards(WINDOW_WIDTH / 2, 150);
```

*   **File:** `gameObjects_table.js`
*   **Function:** `create()`
*   **Action:** Remove the call to `this.wall.showWallBack()`.

**Current Code (around line 182):**
```javascript
        this.wall.showWallBack();
```

**New Code:**
```javascript
        // this.wall.showWallBack(); // This is no longer needed
```

### 1.3. Modify `gameObjects.js`

*   **File:** `gameObjects.js`
*   **Class:** `Wall`
*   **Action:** Remove the `showWall()` and `showWallBack()` methods entirely. They are no longer needed.

## 2. Implement Wall Tile Counter

**Problem:** The progress bar did not appear in the previous attempt. This was likely due to other errors in the code. The logic for the progress bar itself was sound.

**Solution:** Re-implement the progress bar and replace all updates to the old `wallText` with updates to the new progress bar.

### 2.1. Modify `GameScene.js`

*   **File:** `GameScene.js`
*   **Action:** Add the `createWallProgressBar` and updateWallTileCounter methods as defined in `rev1`.

*   **Action:** In the `create()` method of `GameScene`, replace the `wallText` creation with the creation of the `wallProgressBar`.

**Current Code (around line 44):**
```javascript
this.gGameLogic.wallText = this.add.text(190, 160, "", {
    fontSize: "16px",
    fontFamily: "Arial",
    fill: "#ffffff",
    align: "left",
    resolution: 2
});
this.gGameLogic.wallText.setOrigin(0, 0);
this.gGameLogic.wallText.visible = false;
```

**New Code:**
```javascript
this.gGameLogic.wallTileCounter = this.createWallTileCounter();
this.gGameLogic.wallProgressBar.setPosition(WINDOW_WIDTH / 2, 100);
this.gGameLogic.wallProgressBar.setVisible(false);
```

### 2.2. Update Progress Bar in `gameLogic.js`

*   **File:** `gameLogic.js`
*   **Action:** Replace all instances of `this.wallText.setText(...)` with `this.scene.updateWallTileCounter(this.table.wall.getCount())`.

**Locations to update:**
*   `deal()`
*   `pickFromWall()`
*   `charleston1` case in `updateUI()`

## 3. Reposition Discard Pile

**Problem:** The discard pile positioning logic in `rev1` was complex and did not account for the existing coordinate system.

**Solution:** Simplify the `showDiscards` method and use a consistent scale for the discarded tiles. The pile will be centered horizontally at `WINDOW_WIDTH / 2`, and placed at `y=150`, which is below the new wall tile counter.

### 3.1. Modify `gameObjects.js`

*   **File:** `gameObjects.js`
*   **Class:** `Discards`
*   **Method:** `showDiscards()`
*   **Action:** Replace the existing `showDiscards` method with the one from `rev1`, but use `SPRITE_SCALE` instead of a hardcoded value.

**New Code:**
```javascript
showDiscards(centerX, centerY) {
    const DISCARD_SCALE = SPRITE_SCALE; // Use the global sprite scale
    const tilesPerRow = 12;
    const tileSpacing = (SPRITE_WIDTH * DISCARD_SCALE) + TILE_GAP;
    const rowSpacing = (SPRITE_HEIGHT * DISCARD_SCALE) + TILE_GAP;

    const totalWidth = tilesPerRow * tileSpacing - TILE_GAP;
    const startX = centerX - totalWidth / 2 + (SPRITE_WIDTH * DISCARD_SCALE) / 2;

    let currentOffsetX = startX;
    let currentOffsetY = centerY;
    let tilesInCurrentRow = 0;

    for (const tile of this.tileArray) {
        tile.sprite.setDepth(0);
        tile.spriteBack.setDepth(0);
        tile.animate(currentOffsetX, currentOffsetY, 0);
        tile.scale = DISCARD_SCALE;
        tile.showTile(true, true);

        currentOffsetX += tileSpacing;
        tilesInCurrentRow++;

        if (tilesInCurrentRow >= tilesPerRow) {
            currentOffsetX = startX;
            currentOffsetY += rowSpacing;
            tilesInCurrentRow = 0;
        }
    }
}
```

## 4. Implement Hand Racks That "Stick" to Hands

**Problem:** The previous plan treated the hand racks as static background elements, drawn once by the main `Table` object. This doesn't match the desired behavior, where the rack should be logically attached to the hand it contains, like a glow on a tile.

**Solution:** To make the rack "stick" to the hand, the `Hand` object itself will become responsible for creating and drawing its own rack. This ensures that whenever the hand is drawn or moved, its rack is drawn along with it in the correct position.

### 4.1. Refactor `gameObjects_table.js` to Remove Rack Logic

*   **File:** `gameObjects_table.js`
*   **Class:** `Table`
*   **Action:** Remove all hand rack creation logic. The `Table` will no longer manage the racks.
    *   In the `constructor`, remove `this.handRacks = [];`.
    *   In the `create` method, remove the call to `this.createHandRack(i);`.
    *   Delete the entire `createHandRack(playerId)` method.
*   **Action:** The `Table` must pass the `scene` context down to the `Player` objects it creates, so it can eventually reach the `Hand`.
    *   Modify the `Player` instantiation to `new Player(this.scene, i)`.

### 4.2. Refactor `gameObjects_player.js` to Pass Scene Context

*   **File:** `gameObjects_player.js`
*   **Class:** `Player`
*   **Action:** The `Player` must accept the `scene` context and pass it to the `Hand` it creates.
    *   Modify the `constructor` to accept `scene`.
    *   Modify the `Hand` instantiation to `this.hand = new Hand(scene, this);`.

### 4.3. Modify `gameObjects_hand.js` to Manage Its Own Rack

*   **File:** `gameObjects_hand.js`
*   **Class:** `Hand`
*   **Action:** The `Hand` will now create and manage its own rack graphics.
    *   Modify the `constructor` to accept `scene` and initialize `this.scene = scene;` and `this.rackGraphics = null;`.

*   **Action:** Modify `getHandRackPosition` to make the rack tall enough for two rows of tiles (the hidden hand and the exposed sets).

**New `getHandRackPosition` implementation:**
```javascript
getHandRackPosition(playerInfo) {
    // Assumes the hand has access to a method for getting tile dimensions.
    const tileWidth = this.hiddenTileSet.getTileWidth(playerInfo);
    const tileHeight = this.hiddenTileSet.getTileHeight(playerInfo);

    // Rack width is fixed at a 14-tile width.
    const rackWidth = 14 * tileWidth;

    // Rack height must accommodate two rows of tiles plus spacing.
    const rackHeight = (2 * tileHeight) + (TILE_GAP * 3); // Gaps for top, middle, and bottom.

    // Return position and dimensions, swapping width/height for vertical players.
    switch (playerInfo.id) {
    case PLAYER.BOTTOM:
        return { x: (WINDOW_WIDTH / 2) - (rackWidth / 2), y: WINDOW_HEIGHT - rackHeight - 10, width: rackWidth, height: rackHeight };
    case PLAYER.TOP:
        return { x: (WINDOW_WIDTH / 2) - (rackWidth / 2), y: 10, width: rackWidth, height: rackHeight };
    case PLAYER.LEFT:
        return { x: 10, y: (WINDOW_HEIGHT / 2) - (rackWidth / 2), width: rackHeight, height: rackWidth };
    case PLAYER.RIGHT:
    default:
        return { x: WINDOW_WIDTH - rackHeight - 10, y: (WINDOW_HEIGHT / 2) - (rackWidth / 2), width: rackHeight, height: rackWidth };
    }
}
```

*   **Action:** Modify `Hand.showHand()` to implement the two-row layout. The hidden hand will be on the bottom row, and exposed sets will be grouped on the top row.

**New `showHand` implementation:**
```javascript
showHand(playerInfo, forceFaceup) {
    debugPrint("Hand.showHand called. playerInfo:", playerInfo, "forceFaceup:", forceFaceup);

    // 1. Draw the rack background (as designed in the previous step).
    const rackPosition = this.getHandRackPosition(playerInfo);
    if (!this.rackGraphics) { this.rackGraphics = this.scene.add.graphics(); }
    this.rackGraphics.clear();
    this.rackGraphics.setDepth(-1);
    this.rackGraphics.fillStyle(0x000000, 0.35);
    this.rackGraphics.lineStyle(1, 0xffffff, 0.25);
    this.rackGraphics.fillRoundedRect(rackPosition.x, rackPosition.y, rackPosition.width, rackPosition.height, 8);
    this.rackGraphics.strokeRoundedRect(rackPosition.x, rackPosition.y, rackPosition.width, rackPosition.height, 8);

    // 2. Set up positioning variables.
    // This simplified example is for PLAYER.BOTTOM. A full implementation needs a
    // switch statement to handle the orientation of all four players.
    const tileHeight = this.hiddenTileSet.getTileHeight(playerInfo);
    const bottomRowY = rackPosition.y + rackPosition.height - (tileHeight / 2) - TILE_GAP;
    const topRowY = rackPosition.y + (tileHeight / 2) + TILE_GAP;

    // 3. Draw the hidden hand on the bottom row (centered).
    const hiddenWidth = this.hiddenTileSet.getDisplayWidth(); // Assumes getDisplayWidth exists
    const hiddenStartX = rackPosition.x + (rackPosition.width / 2) - (hiddenWidth / 2);
    this.hiddenTileSet.showTileSet(playerInfo, hiddenStartX, bottomRowY, forceFaceup);

    // 4. Draw the exposed sets on the top row (grouped and centered).
    let totalExposedWidth = 0;
    for (const tileset of this.exposedTileSetArray) {
        totalExposedWidth += tileset.getDisplayWidth();
    }
    totalExposedWidth += Math.max(0, this.exposedTileSetArray.length - 1) * (TILE_GAP * 2);

    let currentX = rackPosition.x + (rackPosition.width / 2) - (totalExposedWidth / 2);
    for (const tileset of this.exposedTileSetArray) {
        ({x: currentX} = tileset.showTileSet(playerInfo, currentX, topRowY, true));
        currentX += TILE_GAP * 2; // Add a larger gap between exposed sets.
    }
}
```

## 5. Exposed Tiles Repositioning

**Problem:** Exposed tiles need to be positioned correctly relative to the new hand racks, and the previous plan was not detailed enough.

**Solution:** As detailed in the new `showHand` implementation in Section 4.3, exposed tile sets (pungs, kongs, quints) will be displayed on a second row *above* the player's main hidden hand.

This is achieved by:
1.  **Increasing Rack Height:** The `getHandRackPosition` method now calculates a height that can accommodate two rows of tiles plus spacing.
2.  **Two-Row Layout:** The `showHand` method now contains logic to calculate two distinct rows within the rack area.
    *   **Bottom Row:** The player's hidden hand is drawn here, centered horizontally.
    *   **Top Row:** The array of exposed tile sets is drawn here. The entire group of exposed sets is centered horizontally on the rack, with a small gap between each set.

This approach ensures the exposed tiles are clearly separated and displayed as they would be in a real game, placed on top of the player's rack.

## 6. Integration and Testing Plan

Follow the same integration and testing plan as `rev1`, but with the corrected logic from this document.

### Testing Checklist
*   [ ] Wall tile counter appears and updates correctly.
*   [ ] The old wall tile display is gone.
*   [ ] Discard pile is centered and scales correctly.
*   [ ] Hand racks appear for all four players in the correct positions and are tall enough for two rows of tiles.
*   [ ] Player hands are rendered correctly on the bottom row of the racks.
*   [ ] Exposed tiles are positioned correctly on the top row of the racks, above the hand.
*   [ ] There are no JavaScript errors in the console.
