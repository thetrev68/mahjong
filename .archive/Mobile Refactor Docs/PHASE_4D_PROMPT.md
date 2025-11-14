# Phase 4D: Mobile Animations Implementation

**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 7K
**Prerequisites:** Phase 4A-4C (Mobile components exist)

---

## Task Overview

Implement CSS-based animations for mobile game interactions. These animations enhance UX by providing visual feedback for tile movements and game state changes. **No JavaScript animation libraries** - pure CSS transitions and Web Animations API only.

**IMPORTANT:** Review [mobile/mockup.html](mobile/mockup.html) and [mobile/mockup.css](mobile/mockup.css) to understand the component structure your animations will work with (7-column grid for hand, 9-column grid for discards, etc.).

---

## File to Create

**Location:** `mobile/animations/AnimationController.js`

---

## Interface Specification

Your implementation MUST match this exact interface:

```javascript
/**
 * AnimationController - Manages CSS-based animations for mobile
 *
 * Responsibilities:
 * - Animate tile draw from wall to hand
 * - Animate tile discard from hand to center
 * - Animate tile claim from center to hand
 * - Animate turn indicator transitions
 * - Use CSS transitions or Web Animations API (no heavy libraries)
 */
export class AnimationController {
    /**
     * @param {Object} options - Configuration options
     * @param {number} options.duration - Default animation duration (ms)
     * @param {string} options.easing - Default easing function
     */
    constructor(options = {}) {
        this.duration = options.duration || 300;
        this.easing = options.easing || 'ease-out';
    }

    /**
     * Animate a tile being drawn from wall to hand
     * @param {HTMLElement} tileElement - The tile DOM element
     * @param {Object} startPos - {x, y} start position
     * @param {Object} endPos - {x, y} end position
     * @returns {Promise} Resolves when animation completes
     */
    animateTileDraw(tileElement, startPos, endPos) {
        return new Promise(resolve => {
            // Add animation class
            tileElement.classList.add('tile-drawing');

            // Set CSS custom properties for positions
            tileElement.style.setProperty('--start-x', `${startPos.x}px`);
            tileElement.style.setProperty('--start-y', `${startPos.y}px`);
            tileElement.style.setProperty('--end-x', `${endPos.x}px`);
            tileElement.style.setProperty('--end-y', `${endPos.y}px`);

            // Remove animation class after duration
            setTimeout(() => {
                tileElement.classList.remove('tile-drawing');
                resolve();
            }, this.duration);
        });
    }

    /**
     * Animate a tile being discarded from hand to discard pile
     * @param {HTMLElement} tileElement - The tile DOM element
     * @param {Object} targetPos - {x, y} target position in discard pile
     * @returns {Promise} Resolves when animation completes
     */
    animateTileDiscard(tileElement, targetPos) {
        return new Promise(resolve => {
            // Add animation class
            tileElement.classList.add('tile-discarding');

            // Set target position
            tileElement.style.setProperty('--target-x', `${targetPos.x}px`);
            tileElement.style.setProperty('--target-y', `${targetPos.y}px`);

            // Remove after animation + fade
            setTimeout(() => {
                tileElement.classList.remove('tile-discarding');
                resolve();
            }, this.duration + 100);
        });
    }

    /**
     * Animate a tile being claimed from discard pile to hand
     * @param {HTMLElement} tileElement - The tile DOM element
     * @param {number} sourcePlayer - Player who discarded (0-3)
     * @param {Object} targetPos - {x, y} target position in hand
     * @returns {Promise} Resolves when animation completes
     */
    animateTileClaim(tileElement, sourcePlayer, targetPos) {
        return new Promise(resolve => {
            // Add pulse effect first
            tileElement.classList.add('tile-claiming-pulse');

            setTimeout(() => {
                // Then move to hand
                tileElement.classList.remove('tile-claiming-pulse');
                tileElement.classList.add('tile-claiming-move');

                tileElement.style.setProperty('--target-x', `${targetPos.x}px`);
                tileElement.style.setProperty('--target-y', `${targetPos.y}px`);

                setTimeout(() => {
                    tileElement.classList.remove('tile-claiming-move');
                    resolve();
                }, this.duration);
            }, 500); // Pulse for 500ms, then move
        });
    }

    /**
     * Animate turn indicator appearing on player
     * @param {HTMLElement} playerElement - Player/opponent bar element
     * @returns {Promise} Resolves when animation completes
     */
    animateTurnStart(playerElement) {
        return new Promise(resolve => {
            playerElement.classList.add('turn-starting');

            setTimeout(() => {
                playerElement.classList.remove('turn-starting');
                resolve();
            }, 600);
        });
    }

    /**
     * Animate turn indicator disappearing from player
     * @param {HTMLElement} playerElement - Player/opponent bar element
     * @returns {Promise} Resolves when animation completes
     */
    animateTurnEnd(playerElement) {
        return new Promise(resolve => {
            playerElement.classList.add('turn-ending');

            setTimeout(() => {
                playerElement.classList.remove('turn-ending');
                resolve();
            }, 300);
        });
    }

    /**
     * Animate hand sorting (tiles rearranging)
     * @param {HTMLElement} handContainer - Hand container element
     * @returns {Promise} Resolves when animation completes
     */
    animateHandSort(handContainer) {
        return new Promise(resolve => {
            handContainer.classList.add('hand-sorting');

            setTimeout(() => {
                handContainer.classList.remove('hand-sorting');
                resolve();
            }, 400);
        });
    }

    /**
     * Animate exposure creation (tiles moving to exposure area)
     * @param {HTMLElement[]} tileElements - Array of tile elements
     * @param {Object} targetPos - {x, y} target position
     * @returns {Promise} Resolves when animation completes
     */
    animateExposure(tileElements, targetPos) {
        return new Promise(resolve => {
            tileElements.forEach((tile, index) => {
                tile.classList.add('tile-exposing');
                tile.style.animationDelay = `${index * 50}ms`; // Stagger animation
            });

            setTimeout(() => {
                tileElements.forEach(tile => {
                    tile.classList.remove('tile-exposing');
                    tile.style.animationDelay = '';
                });
                resolve();
            }, this.duration + (tileElements.length * 50));
        });
    }

    /**
     * Shake animation for invalid action
     * @param {HTMLElement} element - Element to shake
     * @returns {Promise} Resolves when animation completes
     */
    animateInvalidAction(element) {
        return new Promise(resolve => {
            element.classList.add('invalid-action');

            setTimeout(() => {
                element.classList.remove('invalid-action');
                resolve();
            }, 500);
        });
    }
}
```

---

## CSS Animations

Create `mobile/styles/animations.css`:

```css
/* ===== Tile Draw Animation ===== */
@keyframes tile-draw {
    from {
        transform: translateY(-200px) scale(0.5);
        opacity: 0;
    }
    to {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
}

.tile-drawing {
    animation: tile-draw 300ms ease-out;
}

/* ===== Tile Discard Animation ===== */
@keyframes tile-discard {
    0% {
        transform: translateY(0) scale(1);
        opacity: 1;
    }
    50% {
        transform: translateY(-30px) scale(1.1);
        opacity: 0.8;
    }
    100% {
        transform: translateY(100px) scale(0.8);
        opacity: 0;
    }
}

.tile-discarding {
    animation: tile-discard 400ms ease-in;
}

/* ===== Tile Claim Animations ===== */
@keyframes claim-pulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
    }
    50% {
        transform: scale(1.2);
        box-shadow: 0 0 20px rgba(255, 215, 0, 1);
    }
}

.tile-claiming-pulse {
    animation: claim-pulse 500ms ease-in-out;
}

@keyframes claim-move {
    from {
        transform: translateY(0);
        opacity: 1;
    }
    to {
        transform: translateY(-200px);
        opacity: 0.3;
    }
}

.tile-claiming-move {
    animation: claim-move 300ms ease-out;
}

/* ===== Turn Indicator Animations ===== */
@keyframes turn-start {
    0% {
        border-left-width: 0;
        box-shadow: none;
    }
    50% {
        border-left-width: 8px;
        box-shadow: 0 0 24px rgba(255, 215, 0, 1);
    }
    100% {
        border-left-width: 4px;
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
    }
}

.turn-starting {
    animation: turn-start 600ms ease-out;
}

@keyframes turn-end {
    from {
        border-left-width: 4px;
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
    }
    to {
        border-left-width: 0;
        box-shadow: none;
    }
}

.turn-ending {
    animation: turn-end 300ms ease-in;
}

/* ===== Hand Sort Animation ===== */
@keyframes hand-sort {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}

.hand-sorting .mobile-tile {
    animation: hand-sort 400ms ease-in-out;
}

/* ===== Exposure Animation ===== */
@keyframes tile-expose {
    0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
    }
    50% {
        transform: translateY(-40px) rotate(5deg);
        opacity: 0.8;
    }
    100% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
    }
}

.tile-exposing {
    animation: tile-expose 300ms ease-out;
}

/* ===== Invalid Action Animation ===== */
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.invalid-action {
    animation: shake 500ms ease-in-out;
    border-color: #f44336 !important;
}

/* ===== Performance Optimization ===== */
/* Use will-change to hint browser about animations */
.tile-drawing,
.tile-discarding,
.tile-claiming-pulse,
.tile-claiming-move,
.tile-exposing {
    will-change: transform, opacity;
}

.turn-starting,
.turn-ending {
    will-change: border-left-width, box-shadow;
}

/* Force hardware acceleration */
.tile-drawing,
.tile-discarding,
.tile-claiming-pulse,
.tile-claiming-move {
    transform: translateZ(0);
}
```

---

## Usage Examples

### Example 1: Animate Tile Draw

```javascript
import { AnimationController } from './animations/AnimationController.js';

const animator = new AnimationController();

// When tile is drawn from wall
gameController.on('TILE_DRAWN', async (data) => {
    const tileElement = document.querySelector(`[data-index="${data.index}"]`);
    const wallPos = { x: 200, y: -100 }; // Top of screen
    const handPos = { x: 200, y: 600 }; // Bottom (hand area)

    await animator.animateTileDraw(tileElement, wallPos, handPos);
    // Animation complete - tile is now in hand
});
```

### Example 2: Animate Tile Discard

```javascript
// When player discards a tile
async function discardTile(tileElement) {
    const discardPilePos = { x: 200, y: 300 }; // Center area

    await animator.animateTileDiscard(tileElement, discardPilePos);
    // Animation complete - remove tile from hand, add to discard pile
}
```

### Example 3: Animate Tile Claim

```javascript
// When opponent discards and player claims
gameController.on('TILE_CLAIMED', async (data) => {
    const tileElement = document.querySelector('.discard-tile.latest');
    const handPos = { x: 200, y: 600 };

    await animator.animateTileClaim(tileElement, data.sourcePlayer, handPos);
    // Animation complete - tile moved to hand
});
```

### Example 4: Animate Turn Change

```javascript
// When turn changes
gameController.on('TURN_CHANGED', async (data) => {
    const prevPlayerBar = document.querySelector(`[data-player="${data.prevPlayer}"]`);
    const newPlayerBar = document.querySelector(`[data-player="${data.currentPlayer}"]`);

    await animator.animateTurnEnd(prevPlayerBar);
    await animator.animateTurnStart(newPlayerBar);
    // Turn indicator updated
});
```

---

## Animation Specifications

### 1. Tile Draw
- **Duration:** 300ms
- **Effect:** Slide from top with scale + fade in
- **Start:** Off-screen top, scale 0.5, opacity 0
- **End:** Final position, scale 1, opacity 1
- **Easing:** ease-out

### 2. Tile Discard
- **Duration:** 400ms
- **Effect:** Arc up then fade down to center
- **Keyframes:** 0% normal, 50% raised +30px, 100% lowered +100px with fade
- **Easing:** ease-in

### 3. Tile Claim
- **Duration:** 500ms pulse + 300ms move
- **Effect:** Pulse/glow, then move to hand
- **Step 1:** Pulse with yellow glow (500ms)
- **Step 2:** Move to hand with fade (300ms)
- **Easing:** ease-in-out (pulse), ease-out (move)

### 4. Turn Indicator
- **Start Duration:** 600ms
- **End Duration:** 300ms
- **Effect:** Glowing border expands/contracts
- **Start:** Border grows from 0 to 4px with glow
- **End:** Border shrinks from 4px to 0, glow fades
- **Easing:** ease-out (start), ease-in (end)

### 5. Hand Sort
- **Duration:** 400ms
- **Effect:** All tiles bounce slightly while rearranging
- **Keyframes:** 0% normal, 50% raised -10px, 100% normal
- **Easing:** ease-in-out

### 6. Exposure
- **Duration:** 300ms per tile
- **Effect:** Tiles lift and rotate slightly, staggered
- **Stagger:** 50ms delay between each tile
- **Easing:** ease-out

### 7. Invalid Action
- **Duration:** 500ms
- **Effect:** Shake left-right, red border flash
- **Keyframes:** Shake ±5px horizontally
- **Easing:** ease-in-out

---

## Performance Requirements

Your animations must meet these criteria:

1. ✅ **60 FPS**: Smooth animation at 60 frames per second (no jank)
2. ✅ **Hardware acceleration**: Use `transform` and `opacity` only (no layout thrashing)
3. ✅ **No JavaScript animation libraries**: Pure CSS or Web Animations API
4. ✅ **Minimal reflows**: Avoid animating `width`, `height`, `left`, `top`, `margin`
5. ✅ **will-change hints**: Add `will-change` to animated properties

---

## Test Criteria

Before submitting, verify:

1. ✅ **Tile draw smooth**: No stuttering when tile appears
2. ✅ **Tile discard arc**: Tile rises then falls (not straight line)
3. ✅ **Claim pulse visible**: Yellow glow clearly visible
4. ✅ **Turn indicator smooth**: Border grows/shrinks without flicker
5. ✅ **Sort bounce subtle**: Tiles bounce slightly, not excessively
6. ✅ **Exposure stagger**: Tiles animate one after another (not all at once)
7. ✅ **Shake noticeable**: Invalid action shake is clear but not nauseating
8. ✅ **60 FPS maintained**: Use Chrome DevTools Performance tab to verify
9. ✅ **Mobile performance**: Test on real device (not just desktop browser)

---

## Edge Cases to Handle

1. **Animation interrupted**: If new animation starts before old one finishes, clean up properly
2. **Rapid actions**: Multiple discards in quick succession don't stack animations
3. **Element removed**: Handle gracefully if element removed mid-animation
4. **Low-power mode**: Consider reduced motion preference (`prefers-reduced-motion`)
5. **Very slow devices**: Animations should degrade gracefully, not block UI

---

## Accessibility: Reduced Motion Support

Add support for users who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
    .tile-drawing,
    .tile-discarding,
    .tile-claiming-pulse,
    .tile-claiming-move,
    .tile-exposing,
    .turn-starting,
    .turn-ending,
    .hand-sorting .mobile-tile,
    .invalid-action {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## Integration with Components

Your AnimationController will be used by:

- **HandRenderer** (Phase 4A): Tile draw, discard, sort animations
- **DiscardPile** (Phase 4C): Discard animations, claim animations
- **OpponentBar** (Phase 4B): Turn indicator animations
- **MobileGameController** (Phase 3B): Exposure animations

Example integration:
```javascript
// mobile/MobileGameController.js
import { AnimationController } from './animations/AnimationController.js';

export class MobileGameController {
    constructor() {
        this.animator = new AnimationController({
            duration: 300,
            easing: 'ease-out'
        });

        this.setupAnimations();
    }

    setupAnimations() {
        this.gameController.on('TILE_DRAWN', async (data) => {
            const tile = this.findTileElement(data.index);
            await this.animator.animateTileDraw(tile, wallPos, handPos);
        });

        // ... more animation subscriptions
    }
}
```

---

## Allowed Imports

✅ **Allowed:**
- No imports needed (pure CSS + vanilla JS)

❌ **Forbidden:**
- `gsap` or any animation library
- `anime.js` or similar
- `phaser` (no Phaser on mobile)
- jQuery or lodash

---

## Success Checklist

Before submitting your implementation, ensure:

- [ ] File created at `mobile/animations/AnimationController.js`
- [ ] CSS file created at `mobile/styles/animations.css`
- [ ] Interface matches specification exactly
- [ ] All 9 test criteria pass
- [ ] Handles all 5 edge cases
- [ ] 60 FPS performance verified
- [ ] No animation libraries used
- [ ] Reduced motion support included
- [ ] Code follows ES6 module syntax
- [ ] Comments explain animation timings

---

## Performance Testing Checklist

Use Chrome DevTools to verify:

1. **Open Performance tab**
2. **Start recording**
3. **Trigger animations** (draw, discard, claim)
4. **Stop recording**
5. **Check FPS**: Should be solid 60 FPS (green line)
6. **Check Frames**: No red/yellow frames (dropped frames)
7. **Check Scripting**: Animation code should be minimal JS time
8. **Check Rendering**: Most work should be in "Composite Layers" (GPU)

---

## Reference Files

- **Web Animations API**: [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- **CSS animations performance**: Use `transform` and `opacity` only
- **will-change**: [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)

---

## Questions?

If anything is unclear:
1. Check MDN docs for Web Animations API
2. Review CSS transform/transition documentation
3. Test animations on real mobile device (not just desktop)

Good luck! ✨
