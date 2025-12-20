# Discard Regression E2E Plan (Playwright)

This document describes end-to-end tests that cover the discard regressions
we just fixed (visibility timing, spacing/layout, glow behavior, and AI pacing).
It assumes the existing Playwright setup and helpers already used in the repo.

## Existing Coverage (Already in repo)

- `tests/e2e/mobile/discard-visibility.spec.js`
  - Verifies discard pile container visibility and minimum height.
  - Does NOT validate discard timing, layout spacing, or glow behavior.
- `tests/e2e/mobile/sprites.spec.js`
  - Verifies a discard tile renders and has sprite background.
- `tests/e2e/mobile/responsive.spec.js`
  - Checks discard pile grid columns and latest discard animation class.

These are useful, but they do not cover the desktop issues that regressed.

## New Tests to Add (Desktop-focused)

### 1) Discard visible before claim prompt

Goal: if a claim prompt appears, the most recent discard must already be in the pile.

Suggested file:
`tests/e2e/desktop/discard-claim-visibility.spec.js`

Flow:

1. Launch desktop app and wait for `window.gameController`.
2. Start a game with `skipCharleston: true` for speed.
3. Force an AI discard that can be claimed by the human player.
   - The easiest path is to inject a known hand/state using `window.gameController`
     so the next discard is claimable (same suit/number already in human hand).
4. Subscribe to the UI prompt (claim dialog).
5. When the claim prompt appears, assert that `table.discards.tileArray.length > 0`
   and that the last discard sprite is visible (`sprite.visible === true`).

Key asserts:

- Claim prompt visible.
- Discard pile length increased before prompt.
- Latest discard sprite is visible.

### 2) AI discard cadence (spacing)

Goal: AI discards should be spaced out (not rapid-fire).

Suggested file:
`tests/e2e/desktop/ai-discard-timing.spec.js`

Flow:

1. Launch desktop app, start game with `skipCharleston: true`.
2. Attach a listener to `window.gameController` for `TILE_DISCARDED`.
3. Capture timestamps for AI players only.
4. After at least 3 AI discards, compute delta between consecutive timestamps.
5. Assert each delta >= `ANIMATION_TIMINGS.LEGACY.DISCARD_COMPLETE_DELAY - 50`.

Key asserts:

- At least 3 AI discards observed.
- Each delta meets minimum threshold.

### 3) Discard pile layout spacing (no stacking)

Goal: discard sprites should spread into rows (unique positions), not stack.

Suggested file:
`tests/e2e/desktop/discard-layout.spec.js`

Flow:

1. Launch desktop app, start game with `skipCharleston: true`.
2. Wait until at least N discards exist (N=8 is enough to check rows).
3. Read discard sprite positions from `table.discards.tileArray`.
4. Count unique (x,y) pairs with a small tolerance (e.g., round to 1 decimal).
5. Assert unique positions == discard count.

Key asserts:

- No overlapping discard sprite positions.

### 4) Discard glow behavior (latest only)

Goal: only the newest discard has the blue glow effect.

Suggested file:
`tests/e2e/desktop/discard-glow.spec.js`

Flow:

1. Launch desktop app, start game with `skipCharleston: true`.
2. Wait for at least 3 discards.
3. Inspect discard sprites for `glowEffect` presence.
4. Assert exactly 1 discard tile has glow and it matches last discard.

Key asserts:

- One glow only.
- Glow is on most recent discard tile.

## Notes / Implementation Tips

- Desktop tests can use `window.gameController`, `window.gameController.on(...)`,
  and `window.gameScene` (if exposed) to access `table.discards.tileArray`.
- If `window.gameScene` is not exposed, add a test-only hook (guarded by
  `window.__TEST__`) to retrieve the discard pile.
- Avoid relying on UI text; assert on game state and sprite properties.

## Optional Mobile Parity Test

Add a mobile test that asserts the latest discard tile DOM exists before the
claim prompt is rendered. This mirrors the desktop visibility test.
