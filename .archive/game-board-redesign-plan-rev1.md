# Game Board Redesign Implementation Plan

## Overview

This plan provides detailed implementation specifications for the game board redesign outlined in `game-board-redesign-plan.md`. The redesign replaces the wall tile grid with a progress bar, repositions the discard pile centrally, adjusts exposed tile positioning relative to hands, and adds translucent hand racks.

## 1. Wall Progress Bar Implementation

### Integration Points

- **Primary File**: `GameScene.js`
- **Secondary Files**: `gameObjects_table.js`, `constants.js`

### Modified Classes/Functions

#### GameScene.js Modifications

**Current Code (lines 44-52)**:

```javascript
this.gGameLogic.wallText = this.add.text(190, 160, "", {
  fontSize: "16px",
  fontFamily: "Arial",
  fill: "#ffffff",
  align: "left",
  resolution: 2,
});
this.gGameLogic.wallText.setOrigin(0, 0);
this.gGameLogic.wallText.visible = false;
```

**New Code Stub**:

```javascript
// Replace wall text with progress bar component
this.wallProgressBar = this.createWallProgressBar();
this.wallProgressBar.setPosition(400, 200); // Centered above discard pile
this.wallProgressBar.setVisible(false);
```

#### New WallProgressBar Component

**File**: `GameScene.js` (add new method)

```javascript
createWallProgressBar() {
    // Create progress bar container
    const progressBar = this.add.container(0, 0);

    // Background bar (grey, semi-transparent)
    const background = this.add.rectangle(0, 0, 300, 20, 0x666666, 0.3);
    background.setStrokeStyle(2, 0xffffff, 0.5);

    // Progress fill (green to red gradient based on tiles remaining)
    const progressFill = this.add.rectangle(0, 0, 300, 20, 0x00ff00);
    progressFill.setOrigin(0.5, 0.5);

    // Text label showing tile count
    const label = this.add.text(0, -25, "Wall Tiles: 152", {
        fontSize: "14px",
        fontFamily: "Arial",
        fill: "#ffffff",
        align: "center"
    });
    label.setOrigin(0.5, 0);

    progressBar.add([background, progressFill, label]);
    progressBar.background = background;
    progressBar.progressFill = progressFill;
    progressBar.label = label;

    return progressBar;
}

updateWallProgressBar(remainingTiles) {
    const totalTiles = 152;
    const progressRatio = remainingTiles / totalTiles;

    // Progress bar starts full and shrinks as tiles are drawn (backwards from normal progress bars)
    this.wallProgressBar.progressFill.width = 300 * progressRatio;

    // Color gradient: green (full) to red (empty)
    const red = Math.round(255 * (1 - progressRatio));
    const green = Math.round(255 * progressRatio);
    this.wallProgressBar.progressFill.fillColor = (red << 16) | (green << 8) | 0;

    // Update label
    this.wallProgressBar.label.setText(`Wall Tiles: ${remainingTiles}`);
}
```

#### Table.js Modifications

**File**: `gameObjects_table.js`

**Current Code (lines 269-274)**:

```javascript
if (numDiscard === 4) {
  // If no-one wants the discard, add to discard pile
  this.discards.insertDiscard(discardTile);
  const { offsetX, offsetY } = this.wall.showWall();
  this.discards.showDiscards(offsetX, offsetY);
  // ...
}
```

**New Code Stub**:

```javascript
if (numDiscard === 4) {
  // If no-one wants the discard, add to discard pile
  this.discards.insertDiscard(discardTile);
  this.discards.showDiscards(400, 250); // Fixed central position
  this.scene.updateWallProgressBar(this.wall.getCount()); // Update progress bar
  // ...
}
```

### Dependencies

- Phaser 3 Graphics and Container APIs
- Access to `this.scene` from Table class (already available)

## 2. Discard Pile Repositioning

### Integration Points

- **Primary File**: `gameObjects.js` (Discards class)
- **Secondary Files**: `gameObjects_table.js`

### Modified Classes/Functions

#### Discards.showDiscards() Modifications

**File**: `gameObjects.js`

**Current Code (lines 523-544)**:

```javascript
showDiscards(offsetX, offsetY) {
    // Calculate positions for all discarded tiles
    let currentOffsetX = offsetX;
    let currentOffsetY = offsetY;
    for (const tile of this.tileArray) {
        const DISCARD_SCALE = 0.6;
        // Tile.x = currentOffsetX;
        // Tile.y = currentOffsetY;
        // Tile.angle = 0;
        tile.sprite.setDepth(0);
        tile.spriteBack.setDepth(0);
        tile.animate(currentOffsetX, currentOffsetY, 0);
        tile.scale = DISCARD_SCALE;
        tile.showTile(true, true);

        currentOffsetX += (SPRITE_WIDTH * DISCARD_SCALE) + TILE_GAP;

        if (currentOffsetX > 800) {
            currentOffsetX = 200;
            currentOffsetY += (SPRITE_HEIGHT * DISCARD_SCALE) + TILE_GAP;
        }
    }
}
```

**New Code Stub**:

```javascript
showDiscards(centerX, centerY) {
    const DISCARD_SCALE = 0.6;
    const tilesPerRow = 12; // Adjust based on visual design
    const tileSpacing = (SPRITE_WIDTH * DISCARD_SCALE) + TILE_GAP;
    const rowSpacing = (SPRITE_HEIGHT * DISCARD_SCALE) + TILE_GAP;

    // Calculate starting position to center the grid
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

        // Move to next row when row is full
        if (tilesInCurrentRow >= tilesPerRow) {
            currentOffsetX = startX;
            currentOffsetY += rowSpacing;
            tilesInCurrentRow = 0;
        }
    }
}
```

#### Table.processClaimArray() Modifications

**File**: `gameObjects_table.js`

**Current Code (lines 269-278)**:

```javascript
if (numDiscard === 4) {
  // If no-one wants the discard, add to discard pile
  this.discards.insertDiscard(discardTile);
  const { offsetX, offsetY } = this.wall.showWall();
  this.discards.showDiscards(offsetX, offsetY);

  return {
    playerOption: PLAYER_OPTION.DISCARD_TILE,
    winningPlayer: 0,
  };
}
```

**New Code Stub**:

```javascript
if (numDiscard === 4) {
  // If no-one wants the discard, add to discard pile
  this.discards.insertDiscard(discardTile);
  this.discards.showDiscards(400, 250); // Fixed central position below progress bar

  return {
    playerOption: PLAYER_OPTION.DISCARD_TILE,
    winningPlayer: 0,
  };
}
```

### Dependencies

- Constants from `constants.js` (SPRITE_WIDTH, SPRITE_HEIGHT, TILE_GAP)

## 3. Exposed Tiles Repositioning

### Integration Points

- **Primary File**: `gameObjects_hand.js` (Hand.showHand method)
- **Secondary Files**: `gameObjects_table.js`, `constants.js`

### Modified Classes/Functions

#### Hand.showHand() Modifications

**File**: `gameObjects_hand.js`

**Current Code (lines 433-489)**:

```javascript
showHand(playerInfo, forceFaceup) {
    debugPrint("Hand.showHand called. playerInfo:", playerInfo, "forceFaceup:", forceFaceup);
    // Calculate starting position for all tiles in hand
    let x = playerInfo.x;
    let y = playerInfo.y;

    const handWidth = this.getHandWidth(playerInfo);
    const tileWidth = this.hiddenTileSet.getTileWidth(playerInfo);

    debugPrint(`Hand.showHand: Initial x=${x}, y=${y}, handWidth=${handWidth}, tileWidth=${tileWidth}`);

    switch (playerInfo.id) {
    case PLAYER.BOTTOM:
        x = (WINDOW_WIDTH / 2) - (handWidth / 2) + (tileWidth / 2);
        break;
    case PLAYER.TOP:
        x = (WINDOW_WIDTH / 2) + (handWidth / 2) - (tileWidth / 2);
        break;
    case PLAYER.LEFT:
        y = (WINDOW_HEIGHT / 2) - (handWidth / 2) + (tileWidth / 2);
        break;
    case PLAYER.RIGHT:
    default:
        y = (WINDOW_HEIGHT / 2) + (handWidth / 2) - (tileWidth / 2);
        break;
    }

    // Display all tilesets
    let exposed = false;
    if (forceFaceup) {
        exposed = true;
    }
    ({x, y} = this.hiddenTileSet.showTileSet(playerInfo, x, y, exposed));

    for (const tileset of this.exposedTileSetArray) {
        const sepDist = this.getSeperatorDistance(playerInfo);

        // Separate hidden and exposed tiles
        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            x += sepDist;
            break;
        case PLAYER.TOP:
            x -= sepDist;
            break;
        case PLAYER.LEFT:
            y += sepDist;
            break;
        case PLAYER.RIGHT:
        default:
            y -= sepDist;
            break;
        }

        ({x, y} = tileset.showTileSet(playerInfo, x, y, true));
    }
}
```

**New Code Stub**:

```javascript
showHand(playerInfo, forceFaceup) {
    debugPrint("Hand.showHand called. playerInfo:", playerInfo, "forceFaceup:", forceFaceup);

    // Calculate hand rack position first
    const rackPosition = this.getHandRackPosition(playerInfo);

    // Position hand relative to rack
    let handX = rackPosition.x;
    let handY = rackPosition.y;

    // Adjust hand position based on exposed tiles location
    const exposedOffset = this.getExposedTilesOffset(playerInfo);
    handX += exposedOffset.x;
    handY += exposedOffset.y;

    const handWidth = this.getHandWidth(playerInfo);
    const tileWidth = this.hiddenTileSet.getTileWidth(playerInfo);

    debugPrint(`Hand.showHand: Rack position x=${rackPosition.x}, y=${rackPosition.y}, handWidth=${handWidth}, tileWidth=${tileWidth}`);

    // Center hand within rack bounds
    switch (playerInfo.id) {
    case PLAYER.BOTTOM:
        handX = rackPosition.x + (rackPosition.width / 2) - (handWidth / 2) + (tileWidth / 2);
        break;
    case PLAYER.TOP:
        handX = rackPosition.x + (rackPosition.width / 2) + (handWidth / 2) - (tileWidth / 2);
        break;
    case PLAYER.LEFT:
        handY = rackPosition.y + (rackPosition.height / 2) - (handWidth / 2) + (tileWidth / 2);
        break;
    case PLAYER.RIGHT:
    default:
        handY = rackPosition.y + (rackPosition.height / 2) + (handWidth / 2) - (tileWidth / 2);
        break;
    }

    // Display all tilesets
    let exposed = false;
    if (forceFaceup) {
        exposed = true;
    }
    ({x: handX, y: handY} = this.hiddenTileSet.showTileSet(playerInfo, handX, handY, exposed));

    // Position exposed tiles relative to hand
    const exposedPosition = this.getExposedTilesPosition(playerInfo, rackPosition);
    let exposedX = exposedPosition.x;
    let exposedY = exposedPosition.y;

    for (const tileset of this.exposedTileSetArray) {
        ({x: exposedX, y: exposedY} = tileset.showTileSet(playerInfo, exposedX, exposedY, true));

        // Add spacing between exposed tile sets
        const sepDist = this.getSeperatorDistance(playerInfo);
        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            exposedX += sepDist;
            break;
        case PLAYER.TOP:
            exposedX -= sepDist;
            break;
        case PLAYER.LEFT:
            exposedY += sepDist;
            break;
        case PLAYER.RIGHT:
        default:
            exposedY -= sepDist;
            break;
        }
    }
}
```

#### New Helper Methods for Hand Class

**File**: `gameObjects_hand.js` (add to Hand class)

```javascript
getHandRackPosition(playerInfo) {
    // Return position and dimensions for hand rack based on player
    const rackWidth = this.getRackWidth(playerInfo);
    const rackHeight = this.getRackHeight(playerInfo);

    switch (playerInfo.id) {
    case PLAYER.BOTTOM:
        return {
            x: (WINDOW_WIDTH / 2) - (rackWidth / 2),
            y: 550, // Above hand area
            width: rackWidth,
            height: rackHeight
        };
    case PLAYER.TOP:
        return {
            x: (WINDOW_WIDTH / 2) - (rackWidth / 2),
            y: 50, // Below hand area
            width: rackWidth,
            height: rackHeight
        };
    case PLAYER.LEFT:
        return {
            x: 50, // Right of hand area
            y: (WINDOW_HEIGHT / 2) - (rackHeight / 2),
            width: rackWidth,
            height: rackHeight
        };
    case PLAYER.RIGHT:
    default:
        return {
            x: WINDOW_WIDTH - 50 - rackWidth, // Left of hand area
            y: (WINDOW_HEIGHT / 2) - (rackHeight / 2),
            width: rackWidth,
            height: rackHeight
        };
    }
}

getExposedTilesPosition(playerInfo, rackPosition) {
    // Position exposed tiles relative to hand rack
    switch (playerInfo.id) {
    case PLAYER.BOTTOM:
        return {
            x: rackPosition.x + rackPosition.width / 2,
            y: rackPosition.y - 60 // Above rack
        };
    case PLAYER.TOP:
        return {
            x: rackPosition.x + rackPosition.width / 2,
            y: rackPosition.y + rackPosition.height + 10 // Below rack
        };
    case PLAYER.LEFT:
        return {
            x: rackPosition.x + rackPosition.width + 10, // Right of rack
            y: rackPosition.y + rackPosition.height / 2
        };
    case PLAYER.RIGHT:
    default:
        return {
            x: rackPosition.x - 10, // Left of rack
            y: rackPosition.y + rackPosition.height / 2
        };
    }
}

getExposedTilesOffset(playerInfo) {
    // Offset to apply to hand position when exposed tiles are present
    // This ensures hand doesn't overlap with exposed tiles
    if (this.exposedTileSetArray.length === 0) {
        return { x: 0, y: 0 };
    }

    switch (playerInfo.id) {
    case PLAYER.BOTTOM:
        return { x: 0, y: 20 }; // Shift hand down slightly
    case PLAYER.TOP:
        return { x: 0, y: -20 }; // Shift hand up slightly
    case PLAYER.LEFT:
        return { x: 20, y: 0 }; // Shift hand right slightly
    case PLAYER.RIGHT:
    default:
        return { x: -20, y: 0 }; // Shift hand left slightly
    }
}

getRackWidth(playerInfo) {
    // Calculate rack width to accommodate 14 tiles + padding
    const tileWidth = this.hiddenTileSet.getTileWidth(playerInfo);
    const padding = 20; // Extra padding on sides
    return (14 * tileWidth) + (13 * TILE_GAP) + (2 * padding);
}

getRackHeight(playerInfo) {
    // Calculate rack height for 2 rows of tiles + padding
    const tileHeight = SPRITE_HEIGHT * (playerInfo.id === PLAYER.BOTTOM ? 1.0 : SPRITE_SCALE);
    const padding = 15; // Extra padding on top/bottom
    return (2 * tileHeight) + TILE_GAP + (2 * padding);
}
```

### Dependencies

- Constants from `constants.js` (WINDOW_WIDTH, WINDOW_HEIGHT, SPRITE_HEIGHT, SPRITE_SCALE, TILE_GAP, PLAYER)

## 4. Hand Rack Visual Elements

### Integration Points

- **Primary File**: `gameObjects_table.js` (Table class)
- **Secondary Files**: `gameObjects_hand.js`, `constants.js`

### Modified Classes/Functions

#### Table.create() Modifications

**File**: `gameObjects_table.js`

**Current Code (lines 85-96)**:

```javascript
create(skipTileCreation = false) {

    for (let i = 0; i < 4; i++) {
        const graphics = this.scene.add.graphics(0, 0);
        // Remove light green fill to match background
        // Graphics.fillStyle(0x8FBF00);
        // Graphics.fillRect(gPlayerInfo[i].rectX, gPlayerInfo[i].rectY, gPlayerInfo[i].rectWidth, gPlayerInfo[i].rectHeight);
        this.boxes[i] = graphics;
    }

    this.wall.create(skipTileCreation);
}
```

**New Code Stub**:

```javascript
create(skipTileCreation = false) {

    for (let i = 0; i < 4; i++) {
        const graphics = this.scene.add.graphics(0, 0);
        // Remove light green fill to match background
        // Graphics.fillStyle(0x8FBF00);
        // Graphics.fillRect(gPlayerInfo[i].rectX, gPlayerInfo[i].rectY, gPlayerInfo[i].rectWidth, gPlayerInfo[i].rectHeight);
        this.boxes[i] = graphics;

        // Create hand rack for this player
        this.createHandRack(i);
    }

    this.wall.create(skipTileCreation);
}
```

#### New Hand Rack Creation Method

**File**: `gameObjects_table.js` (add to Table class)

```javascript
createHandRack(playerId) {
    const playerInfo = gPlayerInfo[playerId];

    // Create translucent grey rectangle for hand rack
    const rackGraphics = this.scene.add.graphics();
    rackGraphics.fillStyle(0x808080, 0.2); // Semi-transparent grey
    rackGraphics.lineStyle(2, 0xaaaaaa, 0.5); // Light grey border

    // Calculate rack dimensions
    const tileWidth = (playerId === PLAYER.BOTTOM) ? SPRITE_WIDTH : SPRITE_WIDTH * SPRITE_SCALE;
    const tileHeight = (playerId === PLAYER.BOTTOM) ? SPRITE_HEIGHT : SPRITE_HEIGHT * SPRITE_SCALE;
    const rackWidth = (14 * tileWidth) + (13 * TILE_GAP) + 40; // 14 tiles + padding
    const rackHeight = (2 * tileHeight) + TILE_GAP + 30; // 2 rows + padding

    // Position rack based on player
    let rackX, rackY;
    switch (playerId) {
    case PLAYER.BOTTOM:
        rackX = (WINDOW_WIDTH / 2) - (rackWidth / 2);
        rackY = 550;
        break;
    case PLAYER.TOP:
        rackX = (WINDOW_WIDTH / 2) - (rackWidth / 2);
        rackY = 50;
        break;
    case PLAYER.LEFT:
        rackX = 50;
        rackY = (WINDOW_HEIGHT / 2) - (rackHeight / 2);
        break;
    case PLAYER.RIGHT:
    default:
        rackX = WINDOW_WIDTH - 50 - rackWidth;
        rackY = (WINDOW_HEIGHT / 2) - (rackHeight / 2);
        break;
    }

    // Draw rounded rectangle for rack
    rackGraphics.fillRoundedRect(rackX, rackY, rackWidth, rackHeight, 8);
    rackGraphics.strokeRoundedRect(rackX, rackY, rackWidth, rackHeight, 8);

    // Store rack reference for later updates if needed
    if (!this.handRacks) {
        this.handRacks = [];
    }
    this.handRacks[playerId] = rackGraphics;
}
```

### Dependencies

- Phaser 3 Graphics API
- Constants from `constants.js`
- gPlayerInfo array from `gameObjects_table.js`

## 5. Integration and Testing Plan

### Integration Sequence

1. **Phase 1**: Implement wall progress bar
   - Add progress bar component to GameScene
   - Update wall tile counting logic
   - Test progress bar updates during gameplay

2. **Phase 2**: Reposition discard pile
   - Modify Discards.showDiscards() method
   - Update all calls to use new positioning
   - Test discard pile layout

3. **Phase 3**: Add hand racks
   - Implement rack creation in Table.create()
   - Test visual appearance and positioning

4. **Phase 4**: Reposition exposed tiles
   - Update Hand.showHand() positioning logic
   - Implement new helper methods
   - Test all player positions

### Testing Checklist

- [ ] Wall progress bar updates correctly as tiles are drawn
- [ ] Discard pile centers properly below progress bar
- [ ] Hand racks appear translucent and positioned correctly for all players
- [ ] Exposed tiles position relative to hands for all players
- [ ] No overlap between UI elements
- [ ] All animations work with new positions
- [ ] Drag and drop functionality unaffected
- [ ] Responsive layout on different screen sizes

### Potential Issues and Mitigations

1. **Animation Conflicts**: New positioning might conflict with existing animations
   - **Mitigation**: Test all animation sequences thoroughly

2. **Performance Impact**: Additional graphics objects for racks
   - **Mitigation**: Use efficient Phaser graphics, monitor frame rate

3. **Responsive Design**: Layout may not work on different screen sizes
   - **Mitigation**: Test on multiple resolutions, add responsive calculations

4. **Code Duplication**: Similar positioning logic across methods
   - **Mitigation**: Extract common positioning logic into helper methods

This implementation plan provides complete code stubs and integration points to ensure the redesign can be implemented with minimal disruption to existing functionality.
