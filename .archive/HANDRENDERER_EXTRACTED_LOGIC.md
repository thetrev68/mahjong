# HandRenderer Extracted Logic

This document analyzes the `showHand()` method from commit `07c41b9` (last working version) to understand how tile rendering works for all 4 player positions.

## Source Analysis

**File:** `gameObjects_hand.js` (commit 07c41b9)
**Method:** `Hand.showHand(playerInfo, forceFaceup)` (lines 580-690)
**Supporting Methods:**

- `getHandRackPosition(playerInfo)` (lines 860-906)
- `TileSet.showTileSetInRack(playerInfo, startX, startY, exposed, tileWidth, gap)` (lines 271-318)
- `TileSet.showTileSetInRackVertical(playerInfo, startX, startY, exposed, tileWidth, gap)` (lines 321-370)

---

## Key Constants Used

From [constants.js](constants.js):

```javascript
WINDOW_WIDTH = 1052;
WINDOW_HEIGHT = 648;
SPRITE_WIDTH = 52;
SPRITE_HEIGHT = 69;
SPRITE_SCALE = 0.75; // Used for AI players (RIGHT, TOP, LEFT)
TILE_GAP = 4;
```

**Derived Constants:**

- Bottom player tiles: `TILE_W = 52 * 1.0 = 52px`, `TILE_H = 69 * 1.0 = 69px`
- AI player tiles: `TILE_W = 52 * 0.75 = 39px`, `TILE_H = 69 * 0.75 = 51.75px`
- Gap between tiles: `4px`
- Rack padding: `8px`
- Margin from edge: `5px` (internal to rack)

---

## Player Positions and Angles

From `playerInfo` object (defined in Table/Player classes):

| Player Position | `playerInfo.id` | `playerInfo.angle` | Layout Orientation |
| --------------- | --------------- | ------------------ | ------------------ |
| BOTTOM (human)  | 0               | 0°                 | Horizontal row     |
| RIGHT (AI)      | 1               | 270° (-90°)        | Vertical column    |
| TOP (AI)        | 2               | 180°               | Horizontal row     |
| LEFT (AI)       | 3               | 90°                | Vertical column    |

---

## Rack Layout System

### Rack Dimensions (`getHandRackPosition`)

Each player has a "rack" - a rectangular area that holds both hidden and exposed tiles.

**PLAYER.BOTTOM:**

```javascript
width = 14 * (52 + 4) - 4 + (2 * 8) = 800px
height = 2 * 69 + 4 + (2 * 8) = 158px
x = (1052 / 2) - (800 / 2) = 126px (centered horizontally)
y = 648 - 158 - 10 = 480px (10px from bottom)
```

- Rack position: `{ x: 126, y: 480, width: 800, height: 158 }`
- Two horizontal rows: top row for exposed, bottom row for hidden

**PLAYER.TOP:**

```javascript
width = 14 * (39 + 4) - 4 + (2 * 8) = 618px
height = 2 * 51.75 + 4 + (2 * 8) = 123.5px
x = (1052 / 2) - (618 / 2) = 217px (centered horizontally)
y = 10px (10px from top)
```

- Rack position: `{ x: 217, y: 10, width: 618, height: 123.5 }`
- Two horizontal rows: top row for hidden, bottom row for exposed

**PLAYER.LEFT:**

```javascript
height = 14 * (39 + 4) - 4 + (2 * 8) = 618px
width = 2 * 51.75 + 4 + (2 * 8) = 123.5px
x = 10px (10px from left)
y = (648 / 2) - (618 / 2) = 15px (centered vertically)
```

- Rack position: `{ x: 10, y: 15, width: 123.5, height: 618 }`
- Two vertical columns: left column for hidden, right column for exposed

**PLAYER.RIGHT:**

```javascript
height = 14 * (39 + 4) - 4 + (2 * 8) = 618px
width = 2 * 51.75 + 4 + (2 * 8) = 123.5px
x = 1052 - 123.5 - 10 = 918.5px (10px from right)
y = (648 / 2) - (618 / 2) = 15px (centered vertically)
```

- Rack position: `{ x: 918.5, y: 15, width: 123.5, height: 618 }`
- Two vertical columns: right column for hidden, left column for exposed

---

## Tile Positioning Logic

### PLAYER.BOTTOM (Human)

**Hidden Tiles (bottom row):**

```javascript
hiddenX = rackPos.x + rackPos.width / 2 - totalHiddenWidth / 2 + TILE_W / 2;
hiddenY = rackPos.y + rackPos.height - TILE_H / 2 - 5;

// Example with 13 tiles:
// totalHiddenWidth = 13 * (52 + 4) - 4 = 724px
// hiddenX = 126 + (800 / 2) - (724 / 2) + 52 / 2 = 164px (first tile center)
// hiddenY = 480 + 158 - 69 / 2 - 5 = 598.5px
```

**Exposed Tiles (top row):**

```javascript
exposedX = rackPos.x + rackPos.width / 2 - totalExposedWidth / 2 + TILE_W / 2;
exposedY = rackPos.y + TILE_H / 2 + 5;

// Example with 3-tile pung:
// totalExposedWidth = 3 * (52 + 4) - 4 = 164px
// exposedX = 126 + (800 / 2) - (164 / 2) + 52 / 2 = 460px
// exposedY = 480 + 69 / 2 + 5 = 519.5px
```

**Rendering Method:** `showTileSetInRack()` (horizontal)

- Tiles laid out left-to-right
- Each tile: `x += TILE_W + GAP` after placement
- Face-up unless `forceFaceup` parameter overrides
- Scale: 1.0 (full size)
- Rotation: 0°

### PLAYER.TOP (AI)

**Hidden Tiles (top row):**

```javascript
hiddenX = rackPos.x + rackPos.width / 2 - totalHiddenWidth / 2 + TILE_W / 2;
hiddenY = rackPos.y + TILE_H / 2 + 5;

// Example with 13 tiles:
// totalHiddenWidth = 13 * (39 + 4) - 4 = 555px
// hiddenX = 217 + (618 / 2) - (555 / 2) + 39 / 2 = 264.5px
// hiddenY = 10 + 51.75 / 2 + 5 = 40.875px
```

**Exposed Tiles (bottom row):**

```javascript
exposedX = rackPos.x + rackPos.width / 2 - totalExposedWidth / 2 + TILE_W / 2;
exposedY = rackPos.y + rackPos.height - TILE_H / 2 - 5;

// Example with 3-tile pung:
// totalExposedWidth = 3 * (39 + 4) - 4 = 125px
// exposedX = 217 + (618 / 2) - (125 / 2) + 39 / 2 = 463px
// exposedY = 10 + 123.5 - 51.75 / 2 - 5 = 102.625px
```

**Rendering Method:** `showTileSetInRack()` (horizontal)

- Tiles laid out left-to-right
- Face-down (back showing) unless `forceFaceup = true`
- Scale: 0.75 (smaller)
- Rotation: 180° (upside down from top player's perspective, but faces away from human)

### PLAYER.LEFT (AI)

**Hidden Tiles (left column):**

```javascript
hiddenY = rackPos.y + rackPos.height / 2 - totalHiddenWidth / 2 + TILE_W / 2;
hiddenX = rackPos.x + TILE_H / 2 + 5;

// Example with 13 tiles:
// totalHiddenWidth = 13 * (39 + 4) - 4 = 555px
// hiddenY = 15 + (618 / 2) - (555 / 2) + 39 / 2 = 66px
// hiddenX = 10 + 51.75 / 2 + 5 = 40.875px
```

**Exposed Tiles (right column):**

```javascript
exposedY = rackPos.y + rackPos.height / 2 - totalExposedWidth / 2 + TILE_W / 2;
exposedX = rackPos.x + rackPos.width - TILE_H / 2 - 5;

// Example with 3-tile pung:
// totalExposedWidth = 3 * (39 + 4) - 4 = 125px
// exposedY = 15 + (618 / 2) - (125 / 2) + 39 / 2 = 281px
// exposedX = 10 + 123.5 - 51.75 / 2 - 5 = 102.625px
```

**Rendering Method:** `showTileSetInRackVertical()` (vertical)

- Tiles laid out top-to-bottom
- Each tile: `y += TILE_W + GAP` after placement
- Face-down unless `forceFaceup = true`
- Scale: 0.75
- Rotation: 90° (rotated counter-clockwise)

### PLAYER.RIGHT (AI)

**Hidden Tiles (right column):**

```javascript
hiddenY = rackPos.y + rackPos.height / 2 - totalHiddenWidth / 2 + TILE_W / 2;
hiddenX = rackPos.x + rackPos.width - TILE_H / 2 - 5;

// Example with 13 tiles:
// totalHiddenWidth = 13 * (39 + 4) - 4 = 555px
// hiddenY = 15 + (618 / 2) - (555 / 2) + 39 / 2 = 66px
// hiddenX = 918.5 + 123.5 - 51.75 / 2 - 5 = 1011.125px
```

**Exposed Tiles (left column):**

```javascript
exposedY = rackPos.y + rackPos.height / 2 - totalExposedWidth / 2 + TILE_W / 2;
exposedX = rackPos.x + TILE_H / 2 + 5;

// Example with 3-tile pung:
// totalExposedWidth = 3 * (39 + 4) - 4 = 125px
// exposedY = 15 + (618 / 2) - (125 / 2) + 39 / 2 = 281px
// exposedX = 918.5 + 51.75 / 2 + 5 = 949.375px
```

**Rendering Method:** `showTileSetInRackVertical()` (vertical)

- Tiles laid out top-to-bottom
- Each tile: `y += TILE_W + GAP` after placement
- Face-down unless `forceFaceup = true`
- Scale: 0.75
- Rotation: 270° (-90°, rotated clockwise)

---

## Face-Up vs Face-Down Logic

```javascript
let exposed = false;
if (forceFaceup) {
  exposed = true;
}

// For hidden tiles:
this.hiddenTileSet.showTileSetInRack(
  playerInfo,
  hiddenX,
  hiddenY,
  exposed,
  TILE_W,
  GAP,
);

// For exposed tiles (always face-up):
tileset.showTileSetInRack(playerInfo, exposedX, exposedY, true, TILE_W, GAP);
```

**In `showTileSetInRack`:**

```javascript
if (playerInfo.id === PLAYER.BOTTOM) {
  tile.showTile(true, exposed); // visible=true, exposed=depends on parameter
} else {
  tile.showTile(true, exposed); // Same - all visible when in rack
}
```

- **BOTTOM player:** Hidden tiles show face-up (`exposed = false` still shows faces)
- **AI players:** Hidden tiles show face-down (backs) unless `forceFaceup = true`
- **All players:** Exposed tiles always show face-up (`exposed = true`)

---

## Animation and Sound

From `showTileSetInRack`:

```javascript
tile.animate(x, y, playerInfo.angle, fixedDuration);

// For newly inserted tiles (during deal):
if (tile.isNewlyInserted) {
  const baseAnimationTime = 400; // ms
  const staggerPerTile = 70; // ms offset
  fixedDuration =
    baseAnimationTime - (tileArray.length - 1 - i) * staggerPerTile;

  // Play sound on completion
  tween.once("complete", () => {
    this.scene.audioManager.playSFX("rack_tile");
  });
}
```

- Tiles animate to position using `tile.animate(x, y, angle, duration)`
- Staggered timing creates "click-click-click" sound effect
- Only newly inserted tiles play sounds (not re-positioning)

---

## Exposed Tile Set Layout

Multiple exposed sets (pungs, kongs, quints) are positioned sequentially:

```javascript
exposedX = startX; // or startY for vertical

for (const tileset of this.exposedTileSetArray) {
  tileset.showTileSetInRack(playerInfo, exposedX, exposedY, true, TILE_W, GAP);
  exposedX += tileset.getLength() * (TILE_W + GAP);
}
```

- Each set is positioned at `exposedX/Y`
- After rendering, `exposedX` advances by `(tileCount * (TILE_W + GAP))`
- Creates horizontal sequence of sets (or vertical for left/right players)
- All exposed tiles show face-up

---

## Tile Positioning Formula Summary

### Horizontal Players (BOTTOM, TOP)

**Start X:**

```javascript
startX = rackPos.x + rackPos.width / 2 - totalTileWidth / 2 + TILE_W / 2;
```

**Each tile X position:**

```javascript
tileX = startX + index * (TILE_W + GAP);
```

### Vertical Players (LEFT, RIGHT)

**Start Y:**

```javascript
startY = rackPos.y + rackPos.height / 2 - totalTileWidth / 2 + TILE_W / 2;
```

**Each tile Y position:**

```javascript
tileY = startY + index * (TILE_W + GAP);
```

**Note:** `totalTileWidth` uses `TILE_W` (width of tile sprite) even for vertical layout, because tiles are rotated and their "width" in the layout direction is still based on sprite width.

---

## Integration with Existing Classes

### Dependencies

**From Hand class:**

- `this.hiddenTileSet` - TileSet containing hidden tiles
- `this.exposedTileSetArray` - Array of TileSets for exposed groups
- `this.updateRack(playerInfo)` - Updates rack graphics background
- `this.getHandWidth(playerInfo)` - Calculates total width of hand
- `this.getHandRackPosition(playerInfo)` - Returns rack bounds

**From TileSet class:**

- `tileset.getLength()` - Number of tiles in set
- `tileset.getTileWidth(playerInfo)` - Width of tile for player
- `tileset.showTileSetInRack(playerInfo, x, y, exposed, tileWidth, gap)` - Render horizontal
- `tileset.showTileSetInRackVertical(playerInfo, x, y, exposed, tileWidth, gap)` - Render vertical

**From Tile class:**

- `tile.animate(x, y, angle, duration)` - Animate tile to position
- `tile.showTile(visible, exposed)` - Show/hide and face up/down
- `tile.scale` - Tile scale (1.0 or 0.75)
- `tile.origX / tile.origY` - Original position for drag-drop
- `tile.isNewlyInserted` - Flag for animation/sound

**From Player class (via playerInfo):**

- `playerInfo.id` - Player position (0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT)
- `playerInfo.angle` - Rotation angle for tiles
- `playerInfo.x / playerInfo.y` - Player's base position

---

## Visual Layout Diagram

```
                        TOP PLAYER (PLAYER.TOP)
                    ┌──────────────────────────┐
                    │  [hidden tiles row]      │ ← hiddenY (top)
                    │  [exposed tiles row]     │ ← exposedY (bottom)
                    └──────────────────────────┘
                           x: centered

LEFT PLAYER         ┌─────┬─────┐         ┌─────┬─────┐         RIGHT PLAYER
(PLAYER.LEFT)       │ H H │ E E │         │ E E │ H H │         (PLAYER.RIGHT)
                    │ I I │ X X │         │ X X │ I I │
                    │ D D │ P P │         │ P P │ D D │
                    │ D D │ O O │         │ O O │ D D │
                    │ E E │ S S │         │ S S │ E E │
                    │ N N │ E E │         │ E E │ N N │
                    └─────┴─────┘         └─────┴─────┘
                      left  right           left right

                        BOTTOM PLAYER (PLAYER.BOTTOM)
                    ┌──────────────────────────┐
                    │  [exposed tiles row]     │ ← exposedY (top)
                    │  [hidden tiles row]      │ ← hiddenY (bottom)
                    └──────────────────────────┘
                           x: centered
                           y: 598.5px
```

---

## Questions Answered

1. **What are the exact X/Y coordinates for each player's hand start position?**
   - See "Tile Positioning Logic" section above for exact formulas and examples

2. **How do you calculate tile spacing when hand has 13 vs 14 tiles?**
   - Spacing (gap) is fixed at `TILE_GAP = 4px`
   - Total width changes: `totalWidth = tileCount * (TILE_W + GAP) - GAP`
   - Tiles are centered within rack: `startX = rackCenter - (totalWidth / 2) + (TILE_W / 2)`

3. **What rotation angles are used for each player?**
   - BOTTOM: 0°
   - RIGHT: 270° (or -90°)
   - TOP: 180°
   - LEFT: 90°

4. **How far apart are exposed tile sets from the hidden hand?**
   - BOTTOM/TOP: Different rows, separated by `TILE_H + GAP` vertically
   - LEFT/RIGHT: Different columns, separated by `TILE_H + GAP` horizontally
   - Within rack bounds, with 5px margin from inner edge

5. **Do tiles need to be scaled differently for different players?**
   - BOTTOM: `scale = 1.0` (full size, 52x69px)
   - RIGHT/TOP/LEFT: `scale = 0.75` (smaller, 39x51.75px)
