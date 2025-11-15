# HandRenderer API Design

This document defines the complete API for the HandRenderer class, which will extract rendering logic from the Hand class.

---

## Class Overview

```javascript
/**
 * HandRenderer - Renders player hands for all 4 positions
 *
 * Separates rendering concerns from game logic by providing a clean API
 * for positioning and displaying tiles across different player perspectives.
 *
 * Responsibilities:
 * - Calculate tile positions based on player position and rack layout
 * - Render hidden tiles (in-hand tiles)
 * - Render exposed tiles (pung/kong/quint sets)
 * - Handle rotation and scaling per player
 * - Manage face-up vs face-down rendering
 *
 * Does NOT handle:
 * - Tile selection (handled by SelectionManager)
 * - Click events (handled by Hand/SelectionManager)
 * - Game logic (handled by GameLogic)
 * - Tile creation/destruction (handled by Hand/Wall)
 */
class HandRenderer {
    constructor(scene, table)

    // Main rendering methods
    showHand(playerIndex, forceFaceup = false)

    // Position calculation methods
    getHandRackPosition(playerInfo)
    calculateTileScale(playerInfo)
    calculateHiddenTilePositions(playerInfo, hand)
    calculateExposedTilePositions(playerInfo, hand)

    // Rendering helper methods
    renderHiddenTiles(playerInfo, hand, exposed)
    renderExposedTiles(playerInfo, hand)
    updateRackGraphics(playerInfo, hand)
}
```

---

## Constructor

### `constructor(scene, table)`

**Purpose:** Initialize the HandRenderer with references to the Phaser scene and game table.

**Parameters:**
- `scene` (Phaser.Scene): The Phaser scene containing the game
  - Used to access Phaser's game systems (tweens, audio, etc.)
  - Passed to tile animation methods
- `table` (Table): The game table object containing all players
  - Used to access player data and hands
  - Structure: `table.players[playerIndex]` → Player object

**Returns:** HandRenderer instance

**Implementation Notes:**
- Store both parameters as instance properties
- No initialization logic needed beyond storing references
- Does not create or modify any game objects

**Example:**
```javascript
const handRenderer = new HandRenderer(this, gameTable);
```

---

## Main Rendering Methods

### `showHand(playerIndex, forceFaceup = false)`

**Purpose:** Main entry point to render a player's complete hand (hidden + exposed tiles).

**Parameters:**
- `playerIndex` (number): Player position (0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT)
  - Corresponds to PLAYER enum values
  - Used to look up player in `this.table.players[playerIndex]`
- `forceFaceup` (boolean, optional): Override face-up/down logic
  - `false` (default): BOTTOM face-up, AI players face-down
  - `true`: All players show face-up (e.g., for debugging or game end)

**Returns:** `undefined` (performs side effects on tile sprites)

**Implementation Sequence:**
1. Validate playerIndex (0-3)
2. Get player object: `const player = this.table.players[playerIndex]`
3. Get playerInfo: `const playerInfo = player.playerInfo`
4. Update rack graphics: `this.updateRackGraphics(playerInfo, player.hand)`
5. Determine face-up state: `const exposed = forceFaceup || (playerInfo.id === PLAYER.BOTTOM)`
6. Render hidden tiles: `this.renderHiddenTiles(playerInfo, player.hand, exposed)`
7. Render exposed tiles: `this.renderExposedTiles(playerInfo, player.hand)`

**Side Effects:**
- Animates tiles to new positions
- Updates tile visibility (face-up/down)
- Updates tile scale
- Updates tile rotation
- May play sound effects (if tiles are newly inserted)

**Example:**
```javascript
// Render human player's hand (face-up)
handRenderer.showHand(PLAYER.BOTTOM);

// Render AI player's hand (face-down)
handRenderer.showHand(PLAYER.TOP);

// Force all tiles face-up for debugging
handRenderer.showHand(PLAYER.RIGHT, true);
```

---

## Position Calculation Methods

### `getHandRackPosition(playerInfo)`

**Purpose:** Calculate the rectangular bounds of the player's tile rack (background area).

**Parameters:**
- `playerInfo` (object): Player information object
  - `playerInfo.id` (number): Player position (PLAYER enum)
  - Contains other properties but this method only needs `id`

**Returns:** `{ x, y, width, height }` (object)
- `x` (number): Left edge of rack in pixels
- `y` (number): Top edge of rack in pixels
- `width` (number): Width of rack in pixels
- `height` (number): Height of rack in pixels

**Implementation Notes:**
- Rack sized to fit 14 tiles (13 hand + 1 potential pickup)
- Uses padding of 8px around tiles
- Uses margin of 10px from screen edges
- Horizontal players (BOTTOM/TOP): Two rows (exposed + hidden)
- Vertical players (LEFT/RIGHT): Two columns (exposed + hidden)

**Formulas:**

**BOTTOM:**
```javascript
const tileScale = 1.0;
const TILE_W = SPRITE_WIDTH * tileScale; // 52
const TILE_H = SPRITE_HEIGHT * tileScale; // 69
const GAP = TILE_GAP; // 4
const PADDING = 8;
const maxTiles = 14;

width = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING); // 800
height = 2 * TILE_H + GAP + (2 * PADDING); // 158
x = (WINDOW_WIDTH / 2) - (width / 2); // 126
y = WINDOW_HEIGHT - height - 10; // 480
```

**TOP:**
```javascript
const tileScale = SPRITE_SCALE; // 0.75
const TILE_W = SPRITE_WIDTH * tileScale; // 39
const TILE_H = SPRITE_HEIGHT * tileScale; // 51.75
// ... (same formula, different values)
width = 618, height = 123.5
x = 217, y = 10
```

**LEFT:**
```javascript
height = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING); // 618
width = 2 * TILE_H + GAP + (2 * PADDING); // 123.5
x = 10;
y = (WINDOW_HEIGHT / 2) - (height / 2); // 15
```

**RIGHT:**
```javascript
height = 618, width = 123.5
x = WINDOW_WIDTH - width - 10; // 918.5
y = 15
```

**Example:**
```javascript
const rackPos = handRenderer.getHandRackPosition(player.playerInfo);
// rackPos = { x: 126, y: 480, width: 800, height: 158 } (for BOTTOM)
```

---

### `calculateTileScale(playerInfo)`

**Purpose:** Get the scale factor for tiles based on player position.

**Parameters:**
- `playerInfo` (object): Player information object
  - `playerInfo.id` (number): Player position

**Returns:** `number` - Scale factor (1.0 or 0.75)
- BOTTOM: `1.0` (full size)
- RIGHT/TOP/LEFT: `SPRITE_SCALE` (0.75, smaller)

**Implementation:**
```javascript
return (playerInfo.id === PLAYER.BOTTOM) ? 1.0 : SPRITE_SCALE;
```

**Example:**
```javascript
const scale = handRenderer.calculateTileScale(player.playerInfo);
// scale = 1.0 (BOTTOM) or 0.75 (AI players)
```

---

### `calculateHiddenTilePositions(playerInfo, hand)`

**Purpose:** Calculate X/Y coordinates for all hidden tiles in the hand.

**Parameters:**
- `playerInfo` (object): Player information
  - `playerInfo.id` (number): Player position
- `hand` (Hand): Hand object containing tiles
  - `hand.hiddenTileSet.getLength()`: Number of hidden tiles

**Returns:** `{ startX, startY, tileWidth, tileHeight, gap }` (object)
- `startX` (number): X coordinate of first tile center
- `startY` (number): Y coordinate of first tile center
- `tileWidth` (number): Width of each tile sprite (after scaling)
- `tileHeight` (number): Height of each tile sprite (after scaling)
- `gap` (number): Gap between tiles (TILE_GAP = 4)

**Implementation Notes:**
- Gets rack position from `getHandRackPosition(playerInfo)`
- Calculates total width of hidden tiles: `hiddenCount * (tileWidth + gap) - gap`
- Centers tiles within rack bounds
- Adds 5px margin from inner rack edge

**Formulas by Player:**

**BOTTOM (horizontal, bottom row):**
```javascript
const rackPos = this.getHandRackPosition(playerInfo);
const tileScale = this.calculateTileScale(playerInfo);
const tileWidth = SPRITE_WIDTH * tileScale;
const tileHeight = SPRITE_HEIGHT * tileScale;
const hiddenCount = hand.hiddenTileSet.getLength();
const totalHiddenWidth = hiddenCount * (tileWidth + TILE_GAP) - TILE_GAP;

startX = rackPos.x + (rackPos.width / 2) - (totalHiddenWidth / 2) + (tileWidth / 2);
startY = rackPos.y + rackPos.height - (tileHeight / 2) - 5;
```

**TOP (horizontal, top row):**
```javascript
startX = rackPos.x + (rackPos.width / 2) - (totalHiddenWidth / 2) + (tileWidth / 2);
startY = rackPos.y + (tileHeight / 2) + 5;
```

**LEFT (vertical, left column):**
```javascript
startX = rackPos.x + (tileHeight / 2) + 5;
startY = rackPos.y + (rackPos.height / 2) - (totalHiddenWidth / 2) + (tileWidth / 2);
```

**RIGHT (vertical, right column):**
```javascript
startX = rackPos.x + rackPos.width - (tileHeight / 2) - 5;
startY = rackPos.y + (rackPos.height / 2) - (totalHiddenWidth / 2) + (tileWidth / 2);
```

**Example:**
```javascript
const hiddenPos = handRenderer.calculateHiddenTilePositions(playerInfo, hand);
// hiddenPos = { startX: 164, startY: 598.5, tileWidth: 52, tileHeight: 69, gap: 4 }
```

---

### `calculateExposedTilePositions(playerInfo, hand)`

**Purpose:** Calculate starting X/Y coordinates for exposed tile sets.

**Parameters:**
- `playerInfo` (object): Player information
- `hand` (Hand): Hand object
  - `hand.exposedTileSetArray`: Array of exposed TileSets

**Returns:** `{ startX, startY, tileWidth, tileHeight, gap }` (object)
- Same structure as `calculateHiddenTilePositions`
- But positions are in the exposed area (opposite row/column from hidden)

**Implementation Notes:**
- Similar to hidden calculation but uses exposed area of rack
- Exposed tiles total width: `sum(tileset.getLength()) * (tileWidth + gap) - gap`

**Formulas by Player:**

**BOTTOM (horizontal, top row):**
```javascript
const totalExposedWidth = hand.exposedTileSetArray.reduce(
    (sum, set) => sum + set.getLength(), 0
) * (tileWidth + TILE_GAP) - TILE_GAP;

startX = rackPos.x + (rackPos.width / 2) - (totalExposedWidth / 2) + (tileWidth / 2);
startY = rackPos.y + (tileHeight / 2) + 5;
```

**TOP (horizontal, bottom row):**
```javascript
startX = rackPos.x + (rackPos.width / 2) - (totalExposedWidth / 2) + (tileWidth / 2);
startY = rackPos.y + rackPos.height - (tileHeight / 2) - 5;
```

**LEFT (vertical, right column):**
```javascript
startX = rackPos.x + rackPos.width - (tileHeight / 2) - 5;
startY = rackPos.y + (rackPos.height / 2) - (totalExposedWidth / 2) + (tileWidth / 2);
```

**RIGHT (vertical, left column):**
```javascript
startX = rackPos.x + (tileHeight / 2) + 5;
startY = rackPos.y + (rackPos.height / 2) - (totalExposedWidth / 2) + (tileWidth / 2);
```

**Example:**
```javascript
const exposedPos = handRenderer.calculateExposedTilePositions(playerInfo, hand);
// exposedPos = { startX: 460, startY: 519.5, tileWidth: 52, tileHeight: 69, gap: 4 }
```

---

## Rendering Helper Methods

### `renderHiddenTiles(playerInfo, hand, exposed)`

**Purpose:** Render all hidden (in-hand) tiles for a player.

**Parameters:**
- `playerInfo` (object): Player information
  - `playerInfo.id` (number): Player position
  - `playerInfo.angle` (number): Rotation angle
- `hand` (Hand): Hand object
  - `hand.hiddenTileSet`: TileSet of hidden tiles
- `exposed` (boolean): Whether to show tiles face-up
  - `true`: Show tile faces (human player or forceFaceup)
  - `false`: Show tile backs (AI players)

**Returns:** `undefined`

**Implementation Sequence:**
1. Get position info: `const pos = this.calculateHiddenTilePositions(playerInfo, hand)`
2. Determine layout direction (horizontal vs vertical)
3. Delegate to TileSet rendering method:
   - Horizontal (BOTTOM/TOP): `hand.hiddenTileSet.showTileSetInRack(playerInfo, pos.startX, pos.startY, exposed, pos.tileWidth, pos.gap)`
   - Vertical (LEFT/RIGHT): `hand.hiddenTileSet.showTileSetInRackVertical(playerInfo, pos.startX, pos.startY, exposed, pos.tileWidth, pos.gap)`

**Side Effects:**
- Calls `tile.animate(x, y, angle, duration)` on each tile
- Calls `tile.showTile(visible, exposed)` to set face-up/down
- Sets `tile.scale` to appropriate value
- Sets `tile.origX/origY` for drag-drop reference
- May play sound effects for newly inserted tiles

**Example:**
```javascript
// Render human player's hidden tiles (face-up)
handRenderer.renderHiddenTiles(playerInfo, hand, true);

// Render AI player's hidden tiles (face-down)
handRenderer.renderHiddenTiles(playerInfo, hand, false);
```

---

### `renderExposedTiles(playerInfo, hand)`

**Purpose:** Render all exposed tile sets (pung/kong/quint) for a player.

**Parameters:**
- `playerInfo` (object): Player information
  - `playerInfo.id`, `playerInfo.angle`
- `hand` (Hand): Hand object
  - `hand.exposedTileSetArray`: Array of TileSets

**Returns:** `undefined`

**Implementation Sequence:**
1. Get starting position: `const pos = this.calculateExposedTilePositions(playerInfo, hand)`
2. Initialize current position: `let currentX = pos.startX, currentY = pos.startY`
3. Loop through each exposed tileset:
   - Render tileset at current position (always face-up: `exposed = true`)
   - Advance position by tileset width:
     - Horizontal: `currentX += tileset.getLength() * (pos.tileWidth + pos.gap)`
     - Vertical: `currentY += tileset.getLength() * (pos.tileWidth + pos.gap)`

**Side Effects:**
- Same as `renderHiddenTiles` but always with `exposed = true`
- Exposed tiles are always face-up for all players

**Example:**
```javascript
// Render exposed sets (always face-up)
handRenderer.renderExposedTiles(playerInfo, hand);
```

---

### `updateRackGraphics(playerInfo, hand)`

**Purpose:** Update the visual background/border graphics for the tile rack.

**Parameters:**
- `playerInfo` (object): Player information
- `hand` (Hand): Hand object
  - `hand.updateRack(playerInfo)`: Existing method that handles this

**Returns:** `undefined`

**Implementation:**
```javascript
hand.updateRack(playerInfo);
```

**Implementation Notes:**
- This is a passthrough to the existing `Hand.updateRack()` method
- Kept in HandRenderer for completeness (all rendering goes through HandRenderer)
- The actual rack graphics logic remains in Hand class
- Future refactor could move this to HandRenderer

**Example:**
```javascript
handRenderer.updateRackGraphics(playerInfo, hand);
```

---

## Integration Points

### With Table/Player/Hand

```javascript
// Get player
const player = this.table.players[playerIndex];

// Get player info
const playerInfo = player.playerInfo;
// playerInfo structure:
// {
//     id: 0-3 (PLAYER enum),
//     angle: 0/90/180/270 (rotation),
//     x: number (base X position),
//     y: number (base Y position)
// }

// Get hand
const hand = player.hand;
// hand structure:
// {
//     hiddenTileSet: TileSet (13-14 tiles),
//     exposedTileSetArray: Array<TileSet> (0+ sets of 3-5 tiles),
//     updateRack(playerInfo): updates rack graphics
// }
```

### With TileSet

```javascript
// Horizontal rendering
hand.hiddenTileSet.showTileSetInRack(
    playerInfo,  // Player info object
    startX,      // X coordinate of first tile center
    startY,      // Y coordinate of first tile center
    exposed,     // true = face-up, false = face-down
    tileWidth,   // Width of tile sprite (52 or 39)
    gap          // Gap between tiles (4)
);

// Vertical rendering
hand.hiddenTileSet.showTileSetInRackVertical(
    playerInfo, startX, startY, exposed, tileWidth, gap
);
```

### With Tile

TileSet methods call these Tile methods:

```javascript
// Animate tile to position
tile.animate(x, y, angle, duration);
// - x, y: Target position
// - angle: Rotation angle (0/90/180/270)
// - duration: Animation time in ms (or null for default)

// Show/hide tile and set face-up/down
tile.showTile(visible, exposed);
// - visible: true to show sprite
// - exposed: true = face-up, false = face-down

// Set tile scale
tile.scale = 1.0; // or SPRITE_SCALE (0.75)

// Store original position for drag-drop
tile.origX = x;
tile.origY = y;
```

### With SelectionManager

**Separation of Concerns:**
- HandRenderer: Positions tiles, does NOT handle selection
- SelectionManager: Handles tile selection, uses tile positions from HandRenderer

**No direct interaction needed** - both operate on the same Tile objects:
- HandRenderer sets `tile.x`, `tile.y`, `tile.angle`
- SelectionManager sets `tile.selected`, adjusts `tile.y` for visual feedback

---

## Rendering Flow Diagram

```
showHand(playerIndex, forceFaceup)
    ↓
1. Get player: table.players[playerIndex]
    ↓
2. Get playerInfo: player.playerInfo
    ↓
3. updateRackGraphics(playerInfo, hand)
    ↓
4. Determine exposed flag: forceFaceup || (id === PLAYER.BOTTOM)
    ↓
5. renderHiddenTiles(playerInfo, hand, exposed)
    ↓
    ├→ calculateHiddenTilePositions(playerInfo, hand)
    │   ↓
    │   ├→ getHandRackPosition(playerInfo)
    │   └→ calculateTileScale(playerInfo)
    ↓
    └→ Call TileSet.showTileSetInRack() or showTileSetInRackVertical()
        ↓
        └→ For each tile:
            ├→ tile.animate(x, y, angle, duration)
            ├→ tile.showTile(visible, exposed)
            └→ tile.scale = tileScale
    ↓
6. renderExposedTiles(playerInfo, hand)
    ↓
    ├→ calculateExposedTilePositions(playerInfo, hand)
    ↓
    └→ For each tileset:
        └→ Call TileSet.showTileSetInRack() (always exposed=true)
```

---

## Example Usage Scenarios

### Scenario 1: Deal tiles to all players

```javascript
const handRenderer = new HandRenderer(scene, table);

// After dealing tiles to all players
for (let i = 0; i < 4; i++) {
    handRenderer.showHand(i);
}

// Result:
// - BOTTOM player: face-up tiles in bottom rack
// - RIGHT/TOP/LEFT: face-down tiles in their racks
```

### Scenario 2: Force all hands face-up for debugging

```javascript
for (let i = 0; i < 4; i++) {
    handRenderer.showHand(i, true);
}

// Result: All players show face-up tiles
```

### Scenario 3: Update hand after player draws a tile

```javascript
// Player 0 draws a tile
gameLogic.drawTile(PLAYER.BOTTOM);

// Re-render hand to show new tile
handRenderer.showHand(PLAYER.BOTTOM);
```

### Scenario 4: Update hand after exposure

```javascript
// Player exposes a pung
gameLogic.exposePung(PLAYER.BOTTOM, [tile1, tile2, tile3]);

// Re-render to show exposed set
handRenderer.showHand(PLAYER.BOTTOM);
```

---

## File Structure

**Location:** `desktop/renderers/HandRenderer.js`

**Imports:**
```javascript
import { PLAYER, SPRITE_WIDTH, SPRITE_HEIGHT, SPRITE_SCALE, TILE_GAP, WINDOW_WIDTH, WINDOW_HEIGHT } from "../../constants.js";
import { debugPrint } from "../../utils.js";
```

**Exports:**
```javascript
export class HandRenderer {
    // ... class implementation
}
```

---

## Testing Checklist

After implementation:

- [ ] BOTTOM player renders correctly (horizontal, face-up, full size)
- [ ] RIGHT player renders correctly (vertical, face-down, scaled)
- [ ] TOP player renders correctly (horizontal, face-down, scaled)
- [ ] LEFT player renders correctly (vertical, face-down, scaled)
- [ ] Hidden tiles positioned correctly for all players
- [ ] Exposed tiles positioned correctly for all players
- [ ] Multiple exposed sets layout correctly
- [ ] forceFaceup=true shows all tiles face-up
- [ ] Tiles animate to correct positions
- [ ] Tile rotation correct for each player
- [ ] Rack graphics update correctly
- [ ] No console errors
- [ ] Build passes (npm run build)

---

## Future Enhancements (NOT in current scope)

- Animation customization (speed, easing)
- Tile highlighting/glowing effects
- Hand reorganization animations
- Performance optimization for multiple re-renders
- Extract rack graphics rendering from Hand class
