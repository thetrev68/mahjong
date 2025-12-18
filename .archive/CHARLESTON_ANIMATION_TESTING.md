# Charleston Animation Testing Guide

**Date:** 2025-01-23
**Phase:** 1B.6 - Integration Testing
**Status:** Manual Testing Required

---

## Overview

This guide provides step-by-step instructions for manually testing the Charleston animation sequence implementation. Use this checklist to verify all animation features work correctly across all three Charleston directions.

---

## Prerequisites

1. **Start Dev Server:**

   ```bash
   npm run dev
   ```

2. **Open Mobile Version:**
   - Navigate to: `http://localhost:5173/mahjong/mobile/`
   - Or click "Mobile Version" link on desktop

3. **Open DevTools:**
   - Press `F12` (Chrome/Edge) or `Cmd+Option+I` (Safari)
   - Switch to **Console** tab to monitor for errors
   - Switch to **Elements** tab to inspect CSS classes

---

## Test Scenarios

### ✅ Test 1: Charleston Pass RIGHT (First Pass)

**Steps:**

1. Click **"Start"** button
2. Wait for tiles to be dealt (~2-3 seconds)
3. Charleston prompt appears: _"Select 3 tiles to pass right"_
4. Click any 3 tiles in your hand
5. Verify tiles show `.selected` class (highlighted)
6. Click **"Pass Right"** button

**Expected Behavior:**

- [ ] **Pass Out Animation** (600ms):
  - Selected tiles get `.tile-charleston-leaving` class
  - CSS variable `--exit-x` is positive (~300px)
  - CSS variable `--exit-y` is negative (~-100px)
  - Tiles rotate ~15deg and scale to 0.5
  - Tiles move right and up, fading out
  - Tiles disappear from hand

- [ ] **Travel Delay** (300ms):
  - Brief pause (simulates tiles moving to opponent)

- [ ] **Receive Animation** (600ms):
  - 3 new tiles appear with `.tile-charleston-arriving` class
  - CSS variable `--entry-x` is negative (~-300px)
  - CSS variable `--entry-y` is positive (~100px)
  - Tiles start small/rotated, animate to normal
  - Tiles slide in from left and down

- [ ] **Glow Application** (instant):
  - Received tiles get `.tile--newly-drawn` class
  - Blue pulsing glow appears on received tiles

- [ ] **Sort Animation** (800ms):
  - Hand re-sorts by suit using FLIP technique
  - Tiles smoothly transition to new positions
  - Blue glow **persists** during sort

- [ ] **Glow Persistence**:
  - Blue glow remains visible after sort completes
  - Glow continues pulsing until next action

**Console Check:**

- [ ] No errors in Console
- [ ] No warnings about missing CSS properties

---

### ✅ Test 2: Charleston Pass ACROSS (Second Pass)

**Steps:**

1. After first pass completes, prompt appears: _"Select 3 tiles to pass across"_
2. Select 3 different tiles
3. Click **"Pass Across"** button

**Expected Behavior:**

- [ ] **Pass Out Animation**:
  - CSS variable `--exit-x` is ~0px
  - CSS variable `--exit-y` is negative (~-300px)
  - Tiles move **straight up**, fading out

- [ ] **Receive Animation**:
  - CSS variable `--entry-x` is ~0px
  - CSS variable `--entry-y` is positive (~300px)
  - Tiles slide in from **straight down**

- [ ] **Glow + Sort**:
  - Same as Test 1
  - Blue glow applied to 3 new received tiles
  - Hand sorts with glow persisting

---

### ✅ Test 3: Charleston Pass LEFT (Third Pass)

**Steps:**

1. After second pass completes, prompt appears: _"Select 3 tiles to pass left"_
2. Select 3 tiles
3. Click **"Pass Left"** button

**Expected Behavior:**

- [ ] **Pass Out Animation**:
  - CSS variable `--exit-x` is negative (~-300px)
  - CSS variable `--exit-y` is negative (~-100px)
  - Tiles move **left and up**, fading out

- [ ] **Receive Animation**:
  - CSS variable `--entry-x` is positive (~300px)
  - CSS variable `--entry-y` is positive (~100px)
  - Tiles slide in from **right and down**

- [ ] **Glow + Sort**:
  - Same as previous tests
  - Blue glow on 3 received tiles
  - Smooth FLIP sort animation

---

### ✅ Test 4: Glow Persistence Through Game

**Steps:**

1. Complete Charleston Phase 1 (all 3 passes)
2. Vote **"No"** when prompted to continue to Phase 2
3. Game proceeds to main play loop
4. **Do NOT discard** a glowing tile yet

**Expected Behavior:**

- [ ] Blue glow **persists** after Charleston completes
- [ ] Glow remains on tiles during main game loop
- [ ] Glow continues pulsing animation

**Steps (continued):** 5. Discard one of the glowing tiles

**Expected Behavior:**

- [ ] Glow is **removed** when tile is discarded
- [ ] Other glowing tiles keep their glow
- [ ] No console errors

---

### ✅ Test 5: Animation Performance

**Observe during all tests:**

- [ ] All animations run **smoothly** at 60fps
- [ ] No jank or stuttering during transitions
- [ ] FLIP sort doesn't cause layout thrashing
- [ ] Blue glow CSS animation is smooth

**DevTools Performance Check:**

1. Open **Performance** tab in DevTools
2. Click **Record** button
3. Perform one Charleston pass
4. Click **Stop** button
5. Analyze recording:
   - [ ] Frame rate stays near 60fps
   - [ ] No long tasks (>50ms)
   - [ ] Minimal layout recalculations

---

### ✅ Test 6: Error Handling

**Test Invalid Selection:**

1. During Charleston prompt, select only 2 tiles
2. Click "Pass" button

**Expected Behavior:**

- [ ] Error message or visual feedback
- [ ] Animation does not start
- [ ] No console errors

**Test Joker Validation:**

1. Select 3 tiles including a Joker
2. Click "Pass" button

**Expected Behavior:**

- [ ] Error preventing joker selection OR
- [ ] Visual feedback that jokers can't be passed
- [ ] No crashes

---

### ✅ Test 7: Accessibility - Reduced Motion

**Steps:**

1. Open DevTools → **Console**
2. Run:
   ```javascript
   // Simulate prefers-reduced-motion
   window.matchMedia = () => ({
     matches: true,
     media: "(prefers-reduced-motion: reduce)",
   });
   ```
3. Reload page and start game
4. Perform Charleston pass

**Expected Behavior:**

- [ ] Animations complete **instantly** (< 10ms)
- [ ] No visible animation transitions
- [ ] Glow still applied
- [ ] No console errors

---

### ✅ Test 8: Edge Cases

**Test: Fast Clicking**

1. During Charleston prompt, rapidly click "Pass" button multiple times

**Expected Behavior:**

- [ ] Only one animation sequence runs
- [ ] Subsequent clicks ignored while animating
- [ ] No duplicate animations
- [ ] No crashes

**Test: Window Resize During Animation**

1. Start Charleston pass
2. Quickly resize browser window during animation

**Expected Behavior:**

- [ ] Animation completes without errors
- [ ] Layout adapts correctly
- [ ] No visual artifacts

---

## Debugging Tools

### Inspect CSS Variables

In DevTools Console:

```javascript
// Get a leaving tile
const tile = document.querySelector(".tile-charleston-leaving");
console.log("Exit X:", getComputedStyle(tile).getPropertyValue("--exit-x"));
console.log("Exit Y:", getComputedStyle(tile).getPropertyValue("--exit-y"));

// Check if sequencer is animating
const renderer = window.__mobileRenderer;
const sequencer = renderer?.charlestonSequencer;
console.log("Is Animating:", sequencer?.isRunning());
```

### Force Glow on Tiles

```javascript
// Manually add glow to first 3 tiles
const tiles = document.querySelectorAll(".hand-container .tile");
for (let i = 0; i < 3; i++) {
  tiles[i].classList.add("tile--newly-drawn");
}
```

### Monitor Events

```javascript
// Log all Charleston events
const gc = window.__gameController;
gc.on("CHARLESTON_PASS", (data) => console.log("CHARLESTON_PASS:", data));
gc.on("TILES_RECEIVED", (data) => console.log("TILES_RECEIVED:", data));
```

---

## Known Issues / Expected Behavior

### ✅ Normal Behavior

- **Selection cleared after pass**: Expected - selection resets after tiles passed
- **Glow count changes**: Expected - only **newly received** tiles glow (3 tiles per pass)
- **Sort happens automatically**: Expected - hand auto-sorts after receiving tiles

### ❌ Report These Issues

- Animation freezes mid-sequence
- Tiles disappear permanently
- Glow applies to wrong tiles
- Console errors during animation
- Performance drops below 30fps
- Layout shifts during animation

---

## Test Results Template

**Tester:** **\*\*\*\***\_**\*\*\*\***
**Date:** **\*\*\*\***\_**\*\*\*\***
**Browser:** **\*\*\*\***\_**\*\*\*\***
**OS:** **\*\*\*\***\_**\*\*\*\***

| Test                | Pass | Fail | Notes |
| ------------------- | ---- | ---- | ----- |
| 1. Pass RIGHT       | ☐    | ☐    |       |
| 2. Pass ACROSS      | ☐    | ☐    |       |
| 3. Pass LEFT        | ☐    | ☐    |       |
| 4. Glow Persistence | ☐    | ☐    |       |
| 5. Performance      | ☐    | ☐    |       |
| 6. Error Handling   | ☐    | ☐    |       |
| 7. Reduced Motion   | ☐    | ☐    |       |
| 8. Edge Cases       | ☐    | ☐    |       |

**Overall Status:** ☐ Pass ☐ Fail

**Issues Found:**

- [ ] Issue 1: ******\*\*\*\*******\_******\*\*\*\*******
- [ ] Issue 2: ******\*\*\*\*******\_******\*\*\*\*******
- [ ] Issue 3: ******\*\*\*\*******\_******\*\*\*\*******

---

## Next Steps

After completing manual testing:

1. ✅ Verify all checkboxes above
2. 📝 Document any issues found
3. 🐛 Create GitHub issues for bugs
4. ✨ Move to Task 1B.7 (Animation Timing Refinement)
5. 🎨 Move to Task 1B.8 (Glow Persistence Validation)

---

## Automated Testing

For automated Playwright tests, see:

- `tests/e2e/charleston-animations.spec.js`

Run with:

```bash
npm test -- charleston-animations
```

**Note:** Playwright tests require additional setup for base URL configuration. Manual testing is recommended for initial validation.
