# Animation Timing Reference Guide

**Purpose:** Centralized reference for all animation durations, easing curves, and timing constants
**Platform:** Mobile & Desktop (shared constants)
**Last Updated:** 2025-01-23

---

## Philosophy

### Timing Principles

1. **Natural Feel**: Animations should feel like physical objects with weight and momentum
2. **Responsiveness**: User actions get immediate visual feedback (< 100ms)
3. **Clarity**: Important transitions are slower; frequent actions are faster
4. **Consistency**: Similar actions have similar timing across the app

### Duration Guidelines

| Speed Category | Duration Range | Use Cases              | Examples                       |
| -------------- | -------------- | ---------------------- | ------------------------------ |
| **Instant**    | 0-50ms         | State changes          | Toggle switches                |
| **Very Fast**  | 50-100ms       | Micro-interactions     | Button press feedback          |
| **Fast**       | 100-250ms      | Hover states           | Tile hover lift                |
| **Medium**     | 250-400ms      | Frequent actions       | Discard animation              |
| **Slow**       | 400-700ms      | Important transitions  | Charleston pass                |
| **Very Slow**  | 700-1200ms     | Rare, important events | Sort animation, Deal animation |

---

## Animation Constants

### Core Timing Constants

```javascript
// mobile/animations/AnimationConstants.js
export const ANIMATION_DURATIONS = {
  // Instant actions
  INSTANT: 0,
  STATE_CHANGE: 50,

  // Micro-interactions
  BUTTON_PRESS: 80,
  HOVER_IN: 100,
  HOVER_OUT: 150,

  // Tile interactions
  TILE_SELECT: 150,
  TILE_DESELECT: 100,
  TILE_LIFT: 120,

  // Charleston animations
  CHARLESTON_PASS_OUT: 600,
  CHARLESTON_RECEIVE: 600,
  CHARLESTON_GLOW_APPLY: 200,
  CHARLESTON_SORT: 800,
  CHARLESTON_TOTAL: 2500, // Full sequence

  // Dealing animations
  DEAL_TILE_FAST: 300,
  DEAL_TILE_SLOW: 600,
  DEAL_STAGGER_FAST: 50,
  DEAL_STAGGER_SLOW: 100,
  DEAL_FLIP: 400,
  DEAL_WALL_APPEAR: 300,
  DEAL_WALL_DISAPPEAR: 300,

  // Discard animations
  DISCARD_PREP: 100,
  DISCARD_THROW_HUMAN: 300,
  DISCARD_THROW_AI: 200,
  DISCARD_SETTLE: 200,

  // Claim animations
  CLAIM_HIGHLIGHT: 300,
  CLAIM_TRAVEL: 400,
  CLAIM_SETTLE: 250,

  // Exposure animations
  EXPOSURE_SLIDE: 350,
  EXPOSURE_ROTATE: 300,
  EXPOSURE_GROUP: 400,

  // Draw animations
  DRAW_FROM_WALL: 250,
  DRAW_GLOW_APPLY: 200,

  // UI animations
  DIALOG_FADE_IN: 200,
  DIALOG_FADE_OUT: 150,
  PROMPT_SLIDE_UP: 250,
  PROMPT_SLIDE_DOWN: 200,
  MESSAGE_TOAST: 3000,

  // Accessibility (reduced motion)
  REDUCED_MOTION_MAX: 50,
};
```

### Easing Functions

```javascript
export const ANIMATION_EASING = {
  // Standard CSS easing
  LINEAR: "linear",
  EASE: "ease",
  EASE_IN: "ease-in",
  EASE_OUT: "ease-out",
  EASE_IN_OUT: "ease-in-out",

  // Cubic bezier curves (custom)
  SPRING: "cubic-bezier(0.5, 1.5, 0.5, 1)", // Bounce effect
  SMOOTH: "cubic-bezier(0.4, 0.0, 0.2, 1)", // Material Design standard
  SHARP: "cubic-bezier(0.4, 0.0, 0.6, 1)", // Quick start, smooth end
  GENTLE: "cubic-bezier(0.25, 0.1, 0.25, 1)", // Very smooth

  // Specific use cases
  TILE_DISCARD: "ease-out", // Natural throw
  CHARLESTON_PASS: "ease-in-out", // Smooth travel
  CHARLESTON_RECEIVE: "ease-out", // Gentle arrival
  SORT: "cubic-bezier(0.4, 0.0, 0.2, 1)", // Material Design
  BOUNCE: "cubic-bezier(0.5, 1.5, 0.5, 1)", // Settle effect
  FLIP: "ease-out", // Card flip
};
```

### Delay Constants

```javascript
export const ANIMATION_DELAYS = {
  // Stagger effects
  STAGGER_TINY: 30,
  STAGGER_SMALL: 50,
  STAGGER_MEDIUM: 100,
  STAGGER_LARGE: 150,

  // Sequential delays
  BEFORE_CHARLESTON_RECEIVE: 300, // Travel time
  BEFORE_SORT: 200, // Pause before sort
  BETWEEN_PASSES: 500, // Between Charleston passes

  // Debounce
  HOVER_DEBOUNCE: 100,
  CLICK_DEBOUNCE: 300,
};
```

---

## Animation Timing by Feature

### Charleston Animations

**Timeline:**

```
0ms     → Pass out starts (tiles slide away)
600ms   → Pass out completes
900ms   → Receive starts (tiles slide in)
1500ms  → Receive completes
1700ms  → Glow applied
1900ms  → Sort starts
2700ms  → Sort completes
----------------------------
Total: ~2500ms (2.5 seconds)
```

**Detailed Breakdown:**

| Phase          | Start  | Duration | Easing      | Total  |
| -------------- | ------ | -------- | ----------- | ------ |
| Pass Out       | 0ms    | 600ms    | ease-in-out | 600ms  |
| Travel Time    | 600ms  | 300ms    | -           | 900ms  |
| Receive        | 900ms  | 600ms    | ease-out    | 1500ms |
| Glow Apply     | 1500ms | 200ms    | ease-out    | 1700ms |
| Pre-Sort Pause | 1700ms | 200ms    | -           | 1900ms |
| Sort (FLIP)    | 1900ms | 800ms    | Material    | 2700ms |

**CSS Implementation:**

```css
.tile-charleston-leaving {
  animation: charleston-pass-out 600ms ease-in-out forwards;
}

.tile-charleston-arriving {
  animation: charleston-receive 600ms ease-out forwards;
}

.tile-sorting {
  transition: transform 800ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

### Dealing Animations

**Fast Mode (Default):**

```
0ms     → Wall appears
200ms   → First tile deals
250ms   → Second tile deals (+50ms stagger)
...
3000ms  → All tiles dealt, wall disappears
----------------------------
Total: ~3000ms (3 seconds)
```

**Slow Mode (Tutorial):**

```
0ms     → Wall appears
500ms   → First tile deals
600ms   → Second tile deals (+100ms stagger)
...
10000ms → All tiles dealt, wall disappears
----------------------------
Total: ~10000ms (10 seconds)
```

**Per-Tile Timing:**

| Action         | Fast Mode | Slow Mode | Easing   |
| -------------- | --------- | --------- | -------- |
| Wall Appear    | 200ms     | 500ms     | ease-out |
| Tile Deal      | 300ms     | 600ms     | ease-out |
| Stagger Delay  | 50ms      | 100ms     | -        |
| Flip Reveal    | 400ms     | 400ms     | ease-out |
| Wall Disappear | 300ms     | 300ms     | ease-in  |

---

### Discard Animations

**Human Player:**

```
0ms     → Tile lifts (prep)
100ms   → Tile throws (arc animation)
400ms   → Tile lands in discard pile
600ms   → Tile settles (bounce)
----------------------------
Total: ~600ms
```

**AI Player:**

```
0ms     → Tile throws (no prep)
200ms   → Tile lands in discard pile
----------------------------
Total: ~200ms (faster, no bounce)
```

**Timing Details:**

| Phase         | Human     | AI        | Easing   |
| ------------- | --------- | --------- | -------- |
| Prep Lift     | 100ms     | 0ms       | ease-out |
| Throw Arc     | 300ms     | 200ms     | ease-out |
| Settle Bounce | 200ms     | 0ms       | spring   |
| **Total**     | **600ms** | **200ms** | -        |

---

### Claim Animations

**Claim Flow:**

```
0ms     → Highlight discarded tile
300ms   → Tile travels to claiming player
700ms   → Tile settles in hand
950ms   → Hand re-renders with claim
----------------------------
Total: ~950ms
```

**Timing:**

| Phase           | Duration | Easing      |
| --------------- | -------- | ----------- |
| Highlight Flash | 300ms    | ease-in-out |
| Travel Path     | 400ms    | ease-in-out |
| Settle          | 250ms    | spring      |

---

### UI Animations

**Dialog Modals:**

| Action         | Duration | Easing   |
| -------------- | -------- | -------- |
| Fade In        | 200ms    | ease-out |
| Fade Out       | 150ms    | ease-in  |
| Overlay Appear | 200ms    | linear   |

**Prompts (Bottom Sheet):**

| Action     | Duration | Easing   |
| ---------- | -------- | -------- |
| Slide Up   | 250ms    | ease-out |
| Slide Down | 200ms    | ease-in  |

**Toast Messages:**

| Action   | Duration | Easing   |
| -------- | -------- | -------- |
| Slide In | 250ms    | ease-out |
| Display  | 3000ms   | -        |
| Fade Out | 200ms    | ease-in  |

---

## Easing Curve Visual Reference

### Common Bezier Curves

**Linear** (`linear`)

```
Progress: 0% ────────────────────────── 100%
Time:     |─────────────────────────────|
          Start                        End
```

Use: Progress bars, loading indicators

**Ease-Out** (`ease-out`)

```
Progress: 0% ─────────────────▄▄▄▄▄▄▄▄▄ 100%
Time:     |─────────────────────────────|
          Start                        End
```

Use: Entering animations, receive tiles, settle effects

**Ease-In** (`ease-in`)

```
Progress: 0% ▄▄▄▄▄▄▄▄▄───────────────── 100%
Time:     |─────────────────────────────|
          Start                        End
```

Use: Exiting animations, discard throw

**Ease-In-Out** (`ease-in-out`)

```
Progress: 0% ▄▄▄▄────────────▄▄▄▄ 100%
Time:     |─────────────────────────────|
          Start                        End
```

Use: Charleston pass, symmetric transitions

**Material Design** (`cubic-bezier(0.4, 0.0, 0.2, 1)`)

```
Progress: 0% ▄▄▄▄▄──────────▄▄▄▄▄▄▄▄ 100%
Time:     |─────────────────────────────|
          Start                        End
```

Use: Sort animations, UI transitions

**Spring/Bounce** (`cubic-bezier(0.5, 1.5, 0.5, 1)`)

```
Progress: 0% ▄▄────────────▄▄▆██▆▄ 100%
Time:     |─────────────────────────────|
          Start     Overshoot!       End
```

Use: Settle effects, bounce animations

---

## Animation Coordination Patterns

### Sequential Animations

Use `await` for animations that must complete before the next starts:

```javascript
async animateCharlestonPass(data) {
    await this.animateTilesLeaving(tiles, direction); // Wait for completion
    await this.delay(300); // Travel time
    await this.animateTilesArriving(tiles, direction); // Then receive
    await this.applyGlowToTiles(tileIndices); // Then glow
    await this.animateSortWithGlow(handData, glowIndices); // Then sort
}
```

### Staggered Animations

Use loops with delays for cascading effects:

```javascript
async dealRound(tiles) {
    for (let i = 0; i < tiles.length; i++) {
        await this.dealTile(tiles[i]);
        if (i < tiles.length - 1) {
            await this.delay(ANIMATION_DELAYS.STAGGER_SMALL); // 50ms stagger
        }
    }
}
```

### Parallel Animations

Use `Promise.all()` for simultaneous animations:

```javascript
async revealWinningHand(tiles) {
    const animations = tiles.map((tile, i) =>
        this.flipTile(tile).then(() => this.delay(i * 50))
    );
    await Promise.all(animations); // All flip simultaneously, but with stagger
}
```

---

## Reduced Motion Support

### Accessibility Compliance

For users who prefer reduced motion (WCAG 2.1 Level AAA):

```javascript
// Detect reduced motion preference
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Apply reduced durations
const duration = prefersReducedMotion
  ? ANIMATION_DURATIONS.REDUCED_MOTION_MAX
  : ANIMATION_DURATIONS.CHARLESTON_PASS_OUT;
```

**Reduced Motion Rules:**

- Maximum duration: 50ms
- No bounce/spring effects
- No rotation animations
- Linear easing only
- Skip purely decorative animations

**CSS Implementation:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 50ms !important;
    transition-duration: 50ms !important;
    animation-iteration-count: 1 !important;
  }

  .tile-charleston-leaving,
  .tile-charleston-arriving,
  .tile-discarding {
    animation: none;
    transition: opacity 50ms linear;
  }
}
```

---

## Performance Budgets

### Frame Budget

**Target:** 60fps = 16.67ms per frame

**Animation Budget per Frame:**

- JavaScript execution: < 5ms
- Style calculation: < 3ms
- Layout: < 2ms
- Paint: < 5ms
- Composite: < 1.67ms

**Total:** < 16.67ms

### Animation Constraints

**Simultaneous Animations:**

- Maximum 4 tiles animating at once (one per player)
- Avoid animating > 20 elements simultaneously
- Batch DOM updates with `requestAnimationFrame`

**GPU-Accelerated Properties:**

- ✅ `transform` (translate, scale, rotate)
- ✅ `opacity`
- ❌ `width`, `height` (causes layout)
- ❌ `margin`, `padding` (causes layout)
- ❌ `top`, `left` (use translate instead)

---

## Testing Animation Timing

### Manual Testing

**Visual Inspection:**

1. Verify animation feels "natural"
2. Check for jank/stuttering
3. Ensure timing matches constants

**Tools:**

- Chrome DevTools Performance tab
- Firefox Animation Inspector
- React DevTools Profiler

### Automated Testing

**Playwright Tests:**

```javascript
test("Charleston animation completes in expected time", async ({ page }) => {
  const start = Date.now();

  await page.click('button:has-text("Pass")');
  await page.waitForFunction(() => {
    return document.querySelectorAll(".tile--newly-drawn").length === 3;
  });

  const duration = Date.now() - start;
  expect(duration).toBeGreaterThan(2400); // 2.5s - buffer
  expect(duration).toBeLessThan(2700); // 2.5s + buffer
});
```

### Performance Monitoring

**FPS Tracking:**

```javascript
let lastFrameTime = performance.now();
let fps = 60;

function measureFPS() {
  const now = performance.now();
  fps = 1000 / (now - lastFrameTime);
  lastFrameTime = now;

  if (fps < 55) {
    console.warn(`Low FPS detected: ${fps.toFixed(1)}`);
  }

  requestAnimationFrame(measureFPS);
}
```

---

## Common Timing Mistakes

### ❌ Anti-Patterns

**1. Using `setTimeout` instead of CSS animations:**

```javascript
// BAD: JavaScript animation loop
function animate() {
  element.style.left = `${x}px`;
  x += 1;
  if (x < 100) setTimeout(animate, 16);
}
```

```css
/* GOOD: CSS animation */
@keyframes slide {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100px);
  }
}
```

**2. Animating layout properties:**

```css
/* BAD: Causes layout thrashing */
.tile {
  transition: width 300ms;
}

/* GOOD: GPU-accelerated */
.tile {
  transition: transform 300ms;
}
```

**3. Not cleaning up animations:**

```javascript
// BAD: Leaves animation classes
element.classList.add("animating");

// GOOD: Removes after completion
element.classList.add("animating");
await this.delay(duration);
element.classList.remove("animating");
```

**4. Hardcoded timing values:**

```javascript
// BAD: Magic numbers
await this.delay(600);

// GOOD: Named constants
await this.delay(ANIMATION_DURATIONS.CHARLESTON_PASS_OUT);
```

---

## Quick Reference Table

| Animation          | Duration | Easing      | Context    |
| ------------------ | -------- | ----------- | ---------- |
| Tile hover         | 100ms    | ease-out    | Frequent   |
| Tile select        | 150ms    | ease-out    | Frequent   |
| Discard (human)    | 300ms    | ease-out    | Frequent   |
| Discard (AI)       | 200ms    | ease-out    | Frequent   |
| Charleston pass    | 600ms    | ease-in-out | Rare       |
| Charleston receive | 600ms    | ease-out    | Rare       |
| Charleston sort    | 800ms    | Material    | Rare       |
| Deal tile (fast)   | 300ms    | ease-out    | Rare       |
| Deal tile (slow)   | 600ms    | ease-out    | Rare       |
| Claim travel       | 400ms    | ease-in-out | Occasional |
| Exposure           | 350ms    | ease-out    | Occasional |
| Dialog fade        | 200ms    | ease-out    | Frequent   |
| Toast message      | 3000ms   | -           | Occasional |

---

## Changelog

| Date       | Version | Changes                  | Author |
| ---------- | ------- | ------------------------ | ------ |
| 2025-01-23 | 1.0     | Initial timing reference | Sonnet |
