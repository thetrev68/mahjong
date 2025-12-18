# DealingAnimationSequencer Implementation Plan

**Created:** 2025-01-23
**Status:** Ready to Implement
**Estimated Effort:** 3-4 hours
**Platform:** Mobile PWA (Phase 1)

---

## 🎯 Critical Understanding

**The Good News:**

1. Your architecture is **excellent** - the AnimationSequencer base class and CharlestonAnimationSequencer provide perfect patterns to follow
2. GameController already emits `TILES_DEALT` with the sequence data
3. The event-driven flow is clean: GameController → event → MobileRenderer → DealingAnimationSequencer
4. HandRenderer and AnimationController already have the methods you need

**The Reality Check:**
The spec makes some **incorrect assumptions** about the API. Here's what actually exists vs. what the spec assumes:

| Spec Assumes                                   | Reality                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `handRenderer.getTileElements(playerIndex)`    | **Doesn't exist** - HandRenderer only renders player 0 (human) on mobile |
| `handRenderer.getLastTileElement(playerIndex)` | **Doesn't exist**                                                        |
| `handRenderer.addTileToHand(...)`              | **Doesn't exist** - use `render()` instead                               |
| Multiple player hands visible                  | **Mobile only shows human player's hand**                                |

---

## 📋 Implementation Plan

### **Phase 1: Mobile-First Approach (2-3 hours)**

Focus on **human player only** - skip the wall animation complexity for MVP.

**Files to create:**

1. [mobile/animations/DealingAnimationSequencer.js](../mobile/animations/DealingAnimationSequencer.js)

**Files to modify:** 2. [mobile/MobileRenderer.js](../mobile/MobileRenderer.js) - Replace current `onTilesDealt()` 3. [mobile/styles/animations.css](../mobile/styles/animations.css) - Add tile reveal animations

---

### **Step 1: Create DealingAnimationSequencer (Mobile Version)**

**Key simplifications for mobile:**

- **No wall display** (complex, not essential for mobile UX)
- **No multi-player animations** (mobile only shows human hand)
- **Focus on reveal animation** (tiles appear face-down, then flip face-up)
- **East player 14th tile glow** (reuse existing glow system)

**Tunable timing constants at top of class:**

```javascript
// mobile/animations/DealingAnimationSequencer.js
import { AnimationSequencer } from "./AnimationSequencer.js";

export class DealingAnimationSequencer extends AnimationSequencer {
  constructor(gameController, handRenderer, animationController) {
    super(gameController, handRenderer, animationController);

    // ========== ANIMATION TIMING (Adjust here) ==========
    this.TILE_REVEAL_STAGGER = 40; // ms between each tile flip
    this.TILE_FLIP_DURATION = 300; // ms for flip animation
    this.INITIAL_DELAY = 100; // ms pause before reveal starts
    // ====================================================
  }

  /**
   * Main entry point - animate dealing for human player
   * @param {Object} dealSequence - From TILES_DEALT event
   */
  async animateDeal(dealSequence) {
    const humanPlayer = this.gameController.players[0];
    if (!humanPlayer || !this.handRenderer) {
      return;
    }

    await this.executeSequence([
      () => this.renderHand(humanPlayer.hand),
      () => this.revealTilesSequentially(),
      () => this.applyEastGlowIfNeeded(),
    ]);
  }

  /**
   * Render hand with all tiles face-down initially
   */
  async renderHand(handData) {
    // Render hand normally
    this.handRenderer.render(handData);

    // Add face-down class to all tiles
    const tiles = this.handRenderer.tiles;
    tiles.forEach((tile) => {
      tile.classList.add("tile--face-down");
    });

    await this.delay(this.INITIAL_DELAY);
  }

  /**
   * Flip tiles face-up with staggered timing
   */
  async revealTilesSequentially() {
    const tiles = this.handRenderer.tiles;

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];

      // Remove face-down, add flip animation
      tile.classList.remove("tile--face-down");
      tile.classList.add("tile--revealing");

      // Stagger each tile
      if (i < tiles.length - 1) {
        await this.delay(this.TILE_REVEAL_STAGGER);
      }
    }

    // Wait for last animation to complete
    await this.delay(this.TILE_FLIP_DURATION);

    // Cleanup animation classes
    tiles.forEach((tile) => {
      tile.classList.remove("tile--revealing");
    });
  }

  /**
   * Apply glow to 14th tile if human is East
   */
  applyEastGlowIfNeeded() {
    const humanPlayer = this.gameController.players[0];

    // Check if human is East and has 14 tiles
    if (humanPlayer.wind === "E" && humanPlayer.hand.tiles.length === 14) {
      const tiles = this.handRenderer.tiles;
      const lastTile = tiles[tiles.length - 1];

      if (lastTile) {
        this.animationController.applyReceivedTileGlow(lastTile);
      }
    }
  }

  async onSequenceComplete() {
    // Signal GameController that dealing is complete
    this.gameController.emit("DEALING_COMPLETE");
  }
}
```

---

### **Step 2: Update MobileRenderer Integration**

```javascript
// mobile/MobileRenderer.js

// Add import at top
import { DealingAnimationSequencer } from "./animations/DealingAnimationSequencer.js";

// In constructor, add:
this.dealingSequencer = new DealingAnimationSequencer(
    this.gameController,
    this.handRenderer,
    this.animationController
);

// Replace onTilesDealt method:
async onTilesDealt(data = {}) {
    // Animate dealing for human player
    await this.dealingSequencer.animateDeal(data.sequence);

    // Update opponent bars (no animation for AI players)
    this.opponentBars.forEach(({ playerIndex, bar }) => {
        if (playerIndex !== HUMAN_PLAYER) {
            const opponentPlayer = this.gameController.players[playerIndex];
            if (opponentPlayer && bar) {
                bar.update({
                    tileCount: opponentPlayer.hand?.tiles?.length || 0,
                    wind: opponentPlayer.wind,
                    exposures: opponentPlayer.hand?.exposures || []
                });
            }
        }
    });

    // Note: DEALING_COMPLETE is now emitted by sequencer
}
```

---

### **Step 3: Add CSS Animations**

```css
/* mobile/styles/animations.css */

/* Face-down tile state */
.tile--face-down {
  filter: brightness(0.3);
  opacity: 0.8;
}

/* Reveal animation */
.tile--revealing {
  animation: tile-reveal 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes tile-reveal {
  0% {
    filter: brightness(0.3);
    opacity: 0.8;
    transform: scale(0.95);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    filter: brightness(1);
    opacity: 1;
    transform: scale(1);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .tile--revealing {
    animation-duration: 50ms;
  }
}
```

---

### **Phase 2: Testing (1 hour)**

Create Playwright test:

```javascript
// tests/mobile/dealing-animation.spec.js
import { test, expect } from "@playwright/test";

test("should animate dealing tiles on game start", async ({ page }) => {
  await page.goto("/mobile/");

  // Start new game
  await page.click("#start-game-btn");

  // Wait for tiles to be dealt
  await page.waitForSelector(".tile--face-down", { timeout: 2000 });

  // Verify tiles reveal sequentially
  await page.waitForSelector(".tile:not(.tile--face-down)", { timeout: 3000 });

  // Count final tiles
  const tileCount = await page.locator(".hand-area .tile").count();
  expect(tileCount).toBeGreaterThanOrEqual(13); // 13 or 14 if East
});

test("should apply glow to East player 14th tile", async ({ page }) => {
  await page.goto("/mobile/");

  // Start game (would need to mock East wind for deterministic test)
  await page.click("#start-game-btn");

  // Wait for dealing to complete
  await page.waitForSelector(".tile:not(.tile--face-down)", { timeout: 3000 });

  // If player has 14 tiles, last one should have glow
  const tileCount = await page.locator(".hand-area .tile").count();
  if (tileCount === 14) {
    const lastTile = page.locator(".hand-area .tile").last();
    await expect(lastTile).toHaveClass(/tile--newly-drawn/);
  }
});
```

---

## 🚫 What NOT to Do (Learn from Gemini's Mistakes)

1. **Don't create a "wall" visual element** - Too complex for mobile, not in current architecture
2. **Don't try to animate AI player hands** - Mobile only renders human hand
3. **Don't implement HandRenderer API extensions from spec** - Use existing `render()` method
4. **Don't use bezier curve animations** - Keep it simple with CSS keyframes
5. **Don't try to match exact timings from spec** - Mobile needs faster animations

---

## 📊 Success Criteria

- [ ] Human player sees tiles appear and flip face-up
- [ ] East player's 14th tile has blue glow
- [ ] `DEALING_COMPLETE` event fires after animation
- [ ] No console errors or visual glitches
- [ ] Playwright tests pass
- [ ] Works on real mobile devices (test with Chrome DevTools mobile mode)
- [ ] Timing constants are clearly marked and easy to adjust

---

## 🔮 Future Enhancements (Post-MVP)

Once mobile version is solid:

1. Desktop version with full wall animation (PhaserAdapter)
2. Sound effects (tile flip, shuffle)
3. Particle effects for polish
4. Optional: Speed control setting if users request it

---

## ⏱️ Estimated Timeline

- **Phase 1 (Core Animation)**: 2-3 hours
- **Phase 2 (Testing & Polish)**: 1 hour
- **Total**: ~3-4 hours for production-ready mobile implementation

---

## 💡 Key Insights

This plan **differs significantly from the spec** because:

1. **Mobile constraints** - The spec was written for desktop (Phaser) with multiple visible hands
2. **Existing architecture** - Your HandRenderer/AnimationController patterns are different than spec assumes
3. **Pragmatism** - Wall animation is complex and not essential for great UX
4. **Proven patterns** - Following CharlestonAnimationSequencer's successful approach

**This approach will work** because it matches your existing animation patterns and mobile constraints. Start with this MVP, get it working perfectly, then enhance if needed.

---

## 🎛️ Tuning Guide

All animation timing constants are at the top of DealingAnimationSequencer constructor:

- `TILE_REVEAL_STAGGER` - Time between each tile flip (lower = faster cascade)
- `TILE_FLIP_DURATION` - Length of flip animation (CSS must match)
- `INITIAL_DELAY` - Pause before reveal starts (breathing room)

To adjust CSS animation duration, update both:

1. `.tile--revealing` animation duration
2. `this.TILE_FLIP_DURATION` in JavaScript (must match)

---

## References

- [AnimationSequencer.js](../mobile/animations/AnimationSequencer.js) - Base class
- [CharlestonAnimationSequencer.js](../mobile/animations/CharlestonAnimationSequencer.js) - Similar pattern
- [GameController.js](../core/GameController.js) - TILES_DEALT event
- [MobileRenderer.js](../mobile/MobileRenderer.js) - Integration point
