# Component 2: HandRenderer Implementation

## Context

You're implementing the **HandRenderer** component for an American Mahjong game. This is part of a larger refactor to separate game logic (GameController) from rendering (PhaserAdapter).

**What's Been Completed:**

- ✅ Component 1: SelectionManager (fully implemented in `desktop/managers/SelectionManager.js`)
- ✅ Codebase reorganization (desktop-specific files now in `desktop/` folder)

**Your Task:** Component 2 from `IMPLEMENTATION_ROADMAP.md`

---

## Your Mission: Create HandRenderer

Build a class that renders player hands (tiles) for all 4 players using the proven patterns from commit `07c41b9` (last working version).

**Location:** Create `desktop/renderers/HandRenderer.js`

**Time Estimate:** ~1.5 hours

1. Extract showHand() logic from 07c41b9 (30 min)
2. Design HandRenderer class (30 min)
3. Implement for all 4 player positions (30 min)

---

## Step 1: Extract Old showHand() Logic (30 min)

### 1a. Get the old code

```bash
git show 07c41b9:gameObjects_hand.js > /tmp/gameObjects_hand.old.js
```

### 1b. Study the showHand() method

Look for in `/tmp/gameObjects_hand.old.js`:

- The `showHand()` method (around line 600+)
- How it positions tiles for different players (BOTTOM, RIGHT, TOP, LEFT)
- Layout calculations (X/Y positions, spacing, rotation)
- Face-up vs face-down tile rendering
- How exposed tiles are handled

**Key things to extract:**

- Positioning logic for each player (BOTTOM at bottom, RIGHT on right side, etc.)
- Tile spacing and gaps
- Rotation angles per player
- How tiles are arranged in a row/column
- Exposed tile positioning (pung/kong/quint)

### 1c. Document findings

Create `HANDRENDERER_EXTRACTED_LOGIC.md` with:

- How tiles are positioned for PLAYER.BOTTOM (human player)
- How tiles are positioned for PLAYER.RIGHT, TOP, LEFT (AI players)
- Key constants used (SPRITE_WIDTH, SPRITE_HEIGHT, TILE_GAP, etc.)
- Rotation angles per player
- Layout formulas (how X/Y coordinates calculated)

---

## Step 2: Design HandRenderer API (30 min)

### 2a. Create the interface design

Create `HANDRENDERER_API_DESIGN.md` documenting:

```javascript
class HandRenderer {
    constructor(scene, table)

    // Main rendering method
    showHand(playerIndex, forceFaceup = false)

    // Position calculations
    getTilePosition(playerIndex, tileIndexInHand)
    getHandStartPosition(playerIndex)

    // Layout helpers
    calculateTileSpacing(playerIndex, tileCount)
    getRotationAngle(playerIndex)

    // Rendering helpers
    renderHiddenTiles(player, tiles, startX, startY, angle)
    renderExposedTiles(player, exposedSets, startX, startY, angle)
}
```

### 2b. Document each method

For each method, write:

- **Purpose**: What it does
- **Parameters**: Inputs and types
- **Returns**: What it returns
- **Implementation notes**: How it should work based on old code

### 2c. Design the rendering flow

Document the sequence:

1. `showHand(playerIndex)` called
2. Get player object from table
3. Calculate start position based on player position (bottom/right/top/left)
4. Calculate rotation angle
5. Render hidden tiles (in hand)
6. Render exposed tiles (pung/kong/quint)
7. Apply face-up/face-down based on player

---

## Step 3: Implement HandRenderer (30 min)

### 3a. Create the skeleton

Create `desktop/renderers/HandRenderer.js`:

```javascript
/**
 * HandRenderer - Renders player hands for all 4 positions
 *
 * Handles tile positioning, rotation, and layout for:
 * - PLAYER.BOTTOM (human): Horizontal row at bottom, face-up
 * - PLAYER.RIGHT (AI): Vertical column on right, face-down
 * - PLAYER.TOP (AI): Horizontal row at top, face-down
 * - PLAYER.LEFT (AI): Vertical column on left, face-down
 */
export class HandRenderer {
  constructor(scene, table) {
    this.scene = scene;
    this.table = table;
  }

  // TODO: Implement methods
}
```

### 3b. Implement core methods

Implement in this order:

1. **`getRotationAngle(playerIndex)`**
   - Return rotation for each player position
   - BOTTOM: 0°, RIGHT: 90°, TOP: 180°, LEFT: 270° (or similar)

2. **`getHandStartPosition(playerIndex)`**
   - Return {x, y} for where hand starts
   - Based on player position and screen layout

3. **`calculateTileSpacing(playerIndex, tileCount)`**
   - Calculate gap between tiles
   - Account for total tiles fitting in available space

4. **`getTilePosition(playerIndex, tileIndexInHand)`**
   - Calculate exact {x, y} for a specific tile in the hand
   - Use start position + (index × spacing)

5. **`showHand(playerIndex, forceFaceup)`**
   - Main rendering method
   - Get player's hand
   - Calculate positions
   - Move tiles to positions with animation
   - Set face-up/down based on player

### 3c. Import and use existing classes

```javascript
import {
  PLAYER,
  SPRITE_WIDTH,
  SPRITE_HEIGHT,
  TILE_GAP,
  SPRITE_SCALE,
} from "../../constants.js";
```

Use existing Tile methods:

- `tile.animate(x, y, angle, duration)` - Move tile with animation
- `tile.showTile(visible, exposed)` - Show/hide tile
- `tile.sprite.setRotation(angle)` - Rotate sprite

---

## Key Implementation Details

### Player Positions

```
         TOP (PLAYER.TOP)
    ┌─────────────────────┐
    │                     │
LEFT│                     │RIGHT
    │    [BOTTOM HAND]    │
    └─────────────────────┘
       BOTTOM (PLAYER.BOTTOM)
```

### Tile Layout by Player

**BOTTOM (human player):**

- Horizontal row
- Face-up
- Y position: ~600px (near bottom)
- X position: Centered, spread horizontally
- Rotation: 0°

**RIGHT (AI player):**

- Vertical column
- Face-down
- X position: ~950px (near right edge)
- Y position: Centered, spread vertically
- Rotation: 90° (or -90°)

**TOP (AI player):**

- Horizontal row
- Face-down
- Y position: ~50px (near top)
- X position: Centered, spread horizontally
- Rotation: 180° (or 0° if faces away)

**LEFT (AI player):**

- Vertical column
- Face-down
- X position: ~50px (near left edge)
- Y position: Centered, spread vertically
- Rotation: 270° (or 90°)

### Exposed Tiles

Exposed tiles (pung/kong/quint) should be:

- Positioned separately from hidden tiles
- Face-up for all players
- Grouped by set (3-5 tiles together)
- Positioned to the side of hidden tiles

---

## Integration Points

### With Table/Player/Hand

```javascript
// Get player
const player = this.table.players[playerIndex];

// Get tiles
const hiddenTiles = player.hand.hiddenTileSet.getTileArray();
const exposedSets = player.hand.exposedTileSetArray;

// Position tiles
for (let i = 0; i < hiddenTiles.length; i++) {
  const tile = hiddenTiles[i];
  const pos = this.getTilePosition(playerIndex, i);
  tile.animate(pos.x, pos.y, angle);
}
```

### With SelectionManager

HandRenderer should NOT handle selection - that's SelectionManager's job.

- HandRenderer: Positions tiles
- SelectionManager: Handles click interactions and visual selection feedback

---

## Testing Strategy

After implementation:

1. **Manual visual test:**
   - Start game
   - Deal tiles
   - Verify all 4 hands render correctly
   - Check rotation and positioning

2. **Test each player individually:**
   - Use browser console: `game.scene.scenes[0].handRenderer.showHand(0)` (BOTTOM)
   - Repeat for players 1, 2, 3

3. **Test with different tile counts:**
   - 13 tiles (normal)
   - 14 tiles (after draw)
   - With exposed tiles

---

## What NOT to Do

- ❌ Don't implement selection logic (that's SelectionManager)
- ❌ Don't handle click events (that's Hand/SelectionManager)
- ❌ Don't modify game logic (just rendering)
- ❌ Don't worry about animations yet (simple repositioning is fine for now)

---

## Success Criteria

- [ ] HandRenderer class exists in `desktop/renderers/HandRenderer.js`
- [ ] All 4 players render hands correctly (visual positions match layout)
- [ ] Tiles rotate correctly per player position
- [ ] Hidden vs exposed tiles positioned differently
- [ ] Face-up/down works correctly (human face-up, AI face-down)
- [ ] Code is clean, commented, and follows existing patterns
- [ ] Build passes (`npm run build`)
- [ ] No console errors when rendering hands

---

## Deliverables

1. **`HANDRENDERER_EXTRACTED_LOGIC.md`** - Analysis of old showHand() method
2. **`HANDRENDERER_API_DESIGN.md`** - Complete API specification
3. **`desktop/renderers/HandRenderer.js`** - Implemented class
4. **Git commit** - With descriptive message

---

## Helpful References

- **Old working code:** `git show 07c41b9:gameObjects_hand.js`
- **Current Hand class:** `desktop/gameObjects/gameObjects_hand.js`
- **Constants:** `constants.js` (PLAYER, SPRITE_WIDTH, etc.)
- **Table structure:** `desktop/gameObjects/gameObjects_table.js`
- **Implementation roadmap:** `IMPLEMENTATION_ROADMAP.md`

---

## Questions to Answer in Your Docs

1. What are the exact X/Y coordinates for each player's hand start position?
2. How do you calculate tile spacing when hand has 13 vs 14 tiles?
3. What rotation angles are used for each player?
4. How far apart are exposed tile sets from the hidden hand?
5. Do tiles need to be scaled differently for different players?

---

## Git Commit Message Template

```
feat: Implement HandRenderer for all 4 player positions

Add HandRenderer class to render player hands using proven patterns from
commit 07c41b9.

Implementation:
- HandRenderer renders tiles for all 4 player positions (BOTTOM/RIGHT/TOP/LEFT)
- Correct positioning: BOTTOM horizontal, RIGHT/LEFT vertical, TOP horizontal
- Correct rotation: Each player rotated appropriately
- Hidden vs exposed tiles positioned separately
- Face-up (human) vs face-down (AI) rendering

Methods:
- showHand(playerIndex, forceFaceup) - Main rendering method
- getTilePosition(playerIndex, tileIndex) - Calculate tile coordinates
- getHandStartPosition(playerIndex) - Starting position per player
- calculateTileSpacing(playerIndex, count) - Tile gaps
- getRotationAngle(playerIndex) - Rotation per player

Integration:
- Works with existing Table/Player/Hand structure
- Does NOT handle selection (that's SelectionManager's job)
- Uses existing tile.animate() for positioning

This completes Component 2 from IMPLEMENTATION_ROADMAP.md.

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Final Notes

- You'll be copy-pasting logic from the old `showHand()` method - that's expected!
- The old code worked - we're just reorganizing it into a cleaner structure
- Focus on getting it working first, optimization later
- When in doubt, match the old behavior exactly

Good luck! This is a critical component for making the game render correctly.
