# Component 4: Tile Animation Integration

**Goal**: Replace inline Phaser tweens in PhaserAdapter with the proven `tile.animate()` method from commit 07c41b9.

**Status**: Current code uses basic inline tweens. Need to use the working `Tile.animate()` pattern that handles sprites, masks, and glow effects correctly.

**Time Estimate**: 1-2 hours

---

## Critical Discovery: The Working Animation Pattern

### From Commit 07c41b9 (Last Working Version)

Every `Tile` object has a built-in `animate(x, y, angle, fixedDuration)` method that:

- ✅ Handles sprite + spriteBack synchronization
- ✅ Handles mask positioning during movement
- ✅ Updates glow effects during animation
- ✅ Returns tween for event chaining
- ✅ Auto-calculates duration based on distance (1500 pixels/second)
- ✅ Manages depth (raises during animation, restores after)
- ✅ Stops previous tween before starting new one

**Example usage from 07c41b9**:
```javascript
// Simple animation to position
tile.animate(350, 420, 0);

// With callback on completion
const tween = tile.animate(x, y, angle);
tween.on("complete", () => {
    // Do something after animation
});

// With fixed duration (for synchronized dealing)
tile.animate(x, y, angle, 200);
```

---

## Step 1: Verify tile.animate() Exists

First, check if the current `Tile` class in [desktop/gameObjects/gameObjects.js](desktop/gameObjects/gameObjects.js) has the `animate()` method.

**If it doesn't exist**, copy it from commit 07c41b9:

```bash
git show 07c41b9:gameObjects.js | grep -A 50 "animate(x, y, angle"
```

The method should look like this (add to `Tile` class):

```javascript
/**
 * Animate tile to target position with automatic duration calculation
 * @param {number} x - Target X position
 * @param {number} y - Target Y position
 * @param {number} angle - Target angle (rotation)
 * @param {number|null} fixedDuration - Optional fixed duration in ms
 * @returns {Phaser.Tweens.Tween} The tween object for chaining
 */
animate(x, y, angle, fixedDuration = null) {
    if (!this.sprite || !this.sprite.scene) {
        console.error("Tile.animate: this.sprite is undefined, null, or destroyed for tile:", this.getText());
        return;
    }

    const speed = 1500; // pixels per second
    const distance = Math.hypot(x - this.sprite.x, y - this.sprite.y);
    const time = fixedDuration !== null ? fixedDuration : (distance * 1000 / speed);

    if (this.tween) {
        this.tween.stop();
    }

    return this.withRaisedDepth(() => {
        const tweenConfig = {
            targets: this.sprite,
            x,
            y,
            duration: time,
            ease: "Linear",
            onUpdate: () => {
                // Keep spriteBack synchronized
                this.spriteBack.x = this.sprite.x;
                this.spriteBack.y = this.sprite.y;
                this.spriteBack.angle = this.sprite.angle;

                // Update mask if present
                if (this.mask && this.mask.geometryMask) {
                    this.mask.geometryMask.x = this.sprite.x;
                    this.mask.geometryMask.y = this.sprite.y;
                    this.mask.geometryMask.angle = this.sprite.angle;
                }

                // Update glow position if active
                if (this.glowSprite) {
                    this.glowSprite.x = this.sprite.x;
                    this.glowSprite.y = this.sprite.y;
                }
            }
        };

        this.tween = this.sprite.scene.tweens.add(tweenConfig);
        return this.tween;
    });
}

/**
 * Helper to raise depth during animation and restore after
 */
withRaisedDepth(callback) {
    const originalDepth = this.sprite.depth;
    this.sprite.setDepth(300); // Raised during animation

    const tween = callback();

    if (tween) {
        tween.on("complete", () => {
            this.sprite.setDepth(originalDepth);
        });
    }

    return tween;
}
```

---

## Step 2: Update PhaserAdapter Event Handlers

### Handler 1: onTileDrawn (Lines 321-380)

**Current (WRONG)**:
```javascript
// Animate tile draw (slide from wall to hand)
const targetPos = player.hand.calculateTilePosition(player.playerInfo, player.hand.hiddenTileSet.getLength() - 1);
this.scene.tweens.add({
    targets: phaserTile.sprite,
    x: targetPos.x,
    y: targetPos.y,
    alpha: 1,
    duration: 200,
    ease: "Power2",
    onComplete: () => {
        player.showHand(playerIndex === PLAYER.BOTTOM);
    }
});
```

**Replace with (CORRECT)**:
```javascript
// Animate tile draw (slide from wall to hand)
const targetPos = player.hand.calculateTilePosition(
    player.playerInfo,
    player.hand.hiddenTileSet.getLength() - 1
);

// Set initial position and visibility
phaserTile.sprite.setAlpha(0);

// Animate to hand with tile.animate() method
const tween = phaserTile.animate(targetPos.x, targetPos.y, player.playerInfo.angle, 200);

// Fade in during animation
this.scene.tweens.add({
    targets: phaserTile.sprite,
    alpha: 1,
    duration: 200
});

// Refresh hand after animation completes
if (tween) {
    tween.on("complete", () => {
        player.showHand(playerIndex === PLAYER.BOTTOM);
    });
}
```

---

### Handler 2: onTileDiscarded (Lines 385-417)

**Current (WRONG)**:
```javascript
// No animation, just moves to discard pile immediately
```

**Replace with (CORRECT)**:
```javascript
onTileDiscarded(data) {
    const {player: playerIndex, tile: tileData} = data;
    const player = this.table.players[playerIndex];

    const tileDataObj = TileData.fromJSON(tileData);
    const phaserTile = this.tileMap.get(tileDataObj.index);

    if (!phaserTile) {
        console.error(`Could not find Phaser Tile for index ${tileDataObj.index}`);
        return;
    }

    // Remove from hand
    player.hand.removeHidden(phaserTile);

    // Animate to discard pile center (350, 420 from 07c41b9)
    const discardTween = phaserTile.animate(350, 420, 0);

    // Play tile dropping sound when animation completes
    if (discardTween && this.scene.audioManager) {
        discardTween.on("complete", () => {
            this.scene.audioManager.playSFX("tile_dropping");
        });
    }

    // Add to discard pile
    this.table.discards.insertDiscard(phaserTile);
    this.table.discards.showDiscards();

    const playerName = this.getPlayerName(playerIndex);
    printMessage(`${playerName} discarded ${tileDataObj.getText()}`);
}
```

---

### Handler 3: Update Hand Display After Animations

From 07c41b9, the pattern for updating hands after tile movements:

**In gameObjects_hand.js showHand() method** (lines 234, 294, 344):
```javascript
// Each tile gets animated to its position
tile.animate(x, y, playerInfo.angle);
```

**Current PhaserAdapter** should let `player.showHand()` handle this:
```javascript
// After any hand-changing operation:
player.showHand(playerIndex === PLAYER.BOTTOM);
```

The `showHand()` method should already call `tile.animate()` for each tile. If it doesn't, check the current implementation and update it to match 07c41b9.

---

## Step 3: Remove AnimationLibrary References

**DO NOT USE** [desktop/animations/AnimationLibrary.js](desktop/animations/AnimationLibrary.js)

This library doesn't handle:
- Tile spriteBack synchronization
- Mask updates during animation
- Glow effect positioning
- Proper depth management

**Action**: Remove any imports of AnimationLibrary from PhaserAdapter:
```javascript
// DELETE THIS LINE if it exists:
import * as AnimationLib from "../animations/AnimationLibrary.js";
```

---

## Step 4: Verify Hand Rendering Uses tile.animate()

Check [desktop/gameObjects/gameObjects_hand.js](desktop/gameObjects/gameObjects_hand.js) `showHand()` method:

**Expected pattern from 07c41b9** (line 234):
```javascript
showHand(faceUp) {
    this.hiddenTileSet.tileArray.forEach((tile, index) => {
        const {x, y} = this.calculateTilePosition(this.playerInfo, index);
        tile.animate(x, y, this.playerInfo.angle);
        tile.showTile(faceUp, true);
    });

    // Similar for exposed tiles...
}
```

**If current code doesn't use tile.animate()**, update it to match this pattern.

---

## Implementation Checklist

### Phase 1: Restore tile.animate() Method (30 min)
- [ ] Check if `Tile.animate()` exists in current gameObjects.js
- [ ] If missing, copy from commit 07c41b9
- [ ] Copy `withRaisedDepth()` helper method
- [ ] Test: Call `tile.animate(x, y, 0)` from console to verify it works

### Phase 2: Update PhaserAdapter Handlers (30 min)
- [ ] Replace `onTileDrawn` inline tween with `tile.animate()`
- [ ] Replace `onTileDiscarded` with animated version
- [ ] Add tween complete callbacks for audio/visual feedback
- [ ] Remove any AnimationLibrary imports

### Phase 3: Verify Hand Rendering (30 min)
- [ ] Check `showHand()` uses `tile.animate()` for positioning
- [ ] Check `calculateTilePosition()` returns correct {x, y}
- [ ] Test hand reordering after tile movements
- [ ] Verify exposed tiles animate into position

### Phase 4: Testing (30 min)
- [ ] Test deal animation (tiles slide from wall to hand)
- [ ] Test discard animation (tile moves to center)
- [ ] Test hand reordering after selection
- [ ] Verify spriteBack stays synchronized with sprite
- [ ] Check for any visual glitches or position jumps

---

## Animation Timing Reference (from 07c41b9)

| Animation Type | Duration Calculation | Notes |
|---------------|---------------------|-------|
| Tile slide (general) | Distance × 1000 / 1500 | Auto-calculated by animate() |
| Tile draw (dealing) | 200ms fixed | Pass fixedDuration param |
| Tile discard | Auto | Distance-based to (350, 420) |
| Hand reposition | Auto | Each tile animates independently |
| Selection raise/lower | Auto | Small distance = quick animation |

**Speed constant**: 1500 pixels/second (from 07c41b9 Tile.animate())

---

## Success Criteria

### Visual Quality
- ✅ Tiles slide smoothly (not jump) to positions
- ✅ SpriteBack stays synchronized during animation
- ✅ Mask follows sprite during movement
- ✅ Glow effects move with tiles
- ✅ No flickering or visual glitches

### Code Quality
- ✅ No inline Phaser tweens in PhaserAdapter
- ✅ All tile movements use `tile.animate()`
- ✅ AnimationLibrary not imported anywhere
- ✅ Consistent pattern across all handlers
- ✅ Build passes without errors

### Functionality
- ✅ Tiles animate from wall to hand during deal
- ✅ Tiles animate to discard pile when discarded
- ✅ Hand repositions smoothly after tile removal
- ✅ Tween callbacks work for audio/visual feedback
- ✅ No animation conflicts or race conditions

---

## Common Pitfalls

### ❌ Don't: Use AnimationLibrary
```javascript
// WRONG - doesn't handle spriteBack/mask
await AnimationLib.animateTileSlide(sprite, from, to, 200);
```

### ✅ Do: Use tile.animate()
```javascript
// CORRECT - handles everything
tile.animate(targetX, targetY, angle, 200);
```

### ❌ Don't: Animate sprite directly
```javascript
// WRONG - spriteBack won't follow
this.scene.tweens.add({targets: tile.sprite, x: 100, y: 200});
```

### ✅ Do: Use tile method
```javascript
// CORRECT - tile handles all sprites
tile.animate(100, 200, 0);
```

### ❌ Don't: Forget angle parameter
```javascript
// WRONG - tile won't rotate properly
tile.animate(x, y);
```

### ✅ Do: Pass player angle
```javascript
// CORRECT - tile rotates to match player orientation
tile.animate(x, y, player.playerInfo.angle);
```

---

## Architecture Notes

### Why tile.animate() Works

1. **Encapsulation**: Tile knows about its sprite, spriteBack, mask, glow
2. **Consistency**: Same animation logic everywhere
3. **Simplicity**: One method call handles everything
4. **Proven**: This code worked in 07c41b9
5. **Maintainable**: Change animation behavior in one place

### Animation Flow

```
PhaserAdapter receives event
    ↓
Gets Phaser Tile from tileMap
    ↓
Calls tile.animate(x, y, angle)
    ↓
Tile handles:
  - sprite position
  - spriteBack synchronization
  - mask updates
  - glow positioning
  - depth management
    ↓
Tween completes → callback fires
    ↓
Handler continues (e.g., play sound, refresh hand)
```

---

## Expected Outcome

After implementing Component 4:

1. ✅ All tile movements use proven `tile.animate()` method
2. ✅ Consistent animation timing (distance-based)
3. ✅ No visual glitches with spriteBack or masks
4. ✅ Simple, maintainable code in PhaserAdapter
5. ✅ Same animation quality as commit 07c41b9

**Next Component**: Phase 5 - End-to-end testing and debugging

---

## Quick Reference

### tile.animate() Signature
```javascript
tile.animate(x, y, angle, fixedDuration = null)
```

**Parameters**:
- `x` - Target X position (number)
- `y` - Target Y position (number)
- `angle` - Target rotation angle (number, usually from playerInfo.angle)
- `fixedDuration` - Optional duration in ms (null = auto-calculate from distance)

**Returns**: `Phaser.Tweens.Tween` object (can attach callbacks with `.on("complete", callback)`)

### Common Positions (from 07c41b9)
```javascript
WALL_CENTER = {x: 640, y: 360}
DISCARD_CENTER = {x: 350, y: 420}
HUMAN_HAND_Y = 600
HUMAN_HAND_Y_SELECTED = 575  // Raised for selection
```

### Player Angles (from 07c41b9)
```javascript
PLAYER.BOTTOM: angle = 0    (no rotation)
PLAYER.RIGHT:  angle = 90   (rotated right)
PLAYER.TOP:    angle = 180  (upside down)
PLAYER.LEFT:   angle = 270  (rotated left)
```
