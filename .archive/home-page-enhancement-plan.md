# Home Page Enhancement Implementation Plan

## Overview
This plan outlines the implementation of enhanced home page animations and game flow improvements for the American Mahjong application. The changes will create a more engaging user experience with sophisticated tile animations, realistic dealing sequences, and celebratory effects.

## Code Style and Conventions
All JavaScript code should adhere to the existing style, which follows standard modern JavaScript (ES6+) conventions.
- Use `const` and `let` appropriately. Avoid `var`.
- Follow existing naming conventions (e.g., `gGameLogic` for global game logic instance, camelCase for functions and variables).
- All new code should be commented where the logic is not immediately obvious, explaining the *why* behind the code.

## Current State Analysis
- **Home Page**: Shows 152 scattered tiles, all face-down, in a clustered random distribution
- **Start Animation**: Tiles gather to center, then disappear off-screen
- **Wall Counter**: UI container is created hidden (`GameScene.createWallTileCounter()`), only becomes visible after gameplay code calls `scene.updateWallTileCounter(...)`
- **Dealing**: Currently handled by `table.deal()` with immediate display of every player's hidden hand plus training-mode overrides
- **Victory**: Simple game end with no visual celebration

## Enhancement Objectives

### 1. Home Page Scattered Tiles Enhancement
**Current**: All 152 tiles scattered face-down
**Enhanced**: ~70% of tiles randomly face-up, creating visual interest
**Status**: Implemented

**Implementation**:
- In `homePageTileManager.js`, modify the `createScatteredTiles` function. Inside the loop that creates tiles, after `tile.showTile(true, false);`, add `if (Math.random() < 0.7) { tile.showTile(true, true); }`.

### 2. Hide Empty Wall Counter
**Current**: Counter container is already hidden until the game logic updates it
**Enhanced**: Keep the default-hidden behavior and ensure the first `updateWallTileCounter` call happens exactly when gameplay begins so the UI never flashes stale state
**Status**: Implemented

**Implementation**:
- Leave `GameScene.createWallTileCounter()`’s `setVisible(false)` intact and document the expectation in code comments to prevent regressions.
- In `gameLogic.updateUI`, `case STATE.START`, ensure `this.scene.updateWallTileCounter(this.table.wall.getCount());` runs **before** any player controls unhide so the counter reveals with a real count.
- Audit other `updateWallTileCounter` call sites to verify they are tied to tile-mutation events (deal completion, Charleston, wall picks). Add missing calls if new sequences consume tiles.

### 3. Z-Axis Management Fix
**Current**: `createScatteredTiles` seeds depth via `tile.sprite.setDepth(i)` but the `Tile` class already keeps `sprite`, `spriteBack`, and glow masks in sync during `animate`
**Enhanced**: Centralize temporary depth boosts so both front/back sprites and glow masks rise together whenever a tile animates
**Status**: Implemented

**Implementation**:
- Extend `Tile.animate` (in `gameObjects.js`) with a helper like `withRaisedDepth(callback)` to raise `sprite.depth`, `spriteBack.depth`, and glow depth, then restore them after the tween completes. Avoid touching depth directly inside `homePageTileManager`.
- When creating bespoke tweens (e.g., jump/flip), call that helper or set both `sprite` and `spriteBack` depth explicitly to the same high value and update the mask/glow depth as well. Document this requirement in the plan so future LLMs do not forget the backing sprite.
- Depth contract:
  - Base scattered depth stays `i` from creation.
  - Raised depth = `baseDepth + 100` (clamped >= 1) for the duration of the tween.
  - Multiple simultaneous animations stack by reusing the helper; it should track a `raiseCount` so overlapping tweens do not prematurely restore depth.
- Reference snippet:
```javascript
withRaisedDepth(tweenFactory) {
    const base = Math.max(1, this.sprite.depth);
    const raiseBy = 100;
    this._raisedDepthCount = (this._raisedDepthCount ?? 0) + 1;
    const targetDepth = base + raiseBy;
    this.sprite.depth = targetDepth;
    this.spriteBack.depth = targetDepth;
    if (this.glowEffect) this.glowEffect.setDepth(targetDepth - 1);

    const tween = tweenFactory(targetDepth);
    tween.once("complete", () => {
        this._raisedDepthCount -= 1;
        if (this._raisedDepthCount === 0) {
            this.sprite.depth = base;
            this.spriteBack.depth = base;
            if (this.glowEffect) this.glowEffect.setDepth(base - 1);
        }
    });
    return tween;
}
```

### 4. Redesigned Start-Game Animation
**Current**: Tiles gather to center, then disappear
**Enhanced**: Sophisticated three-phase animation
**Status**: Implemented

**Phase 1: Jump and Flip**
- Each tile performs a small jump (5-15px upward)
- Simultaneously flips from current state to face-down
- Duration: 800ms with easing
- Scale bounce: 0.6 → 0.65 → 0.6

**Phase 2: Fly to Top-Left**
- Tiles animate to varied exit points near top-left corner
- Speed variation: 1200-2000ms duration
- Trajectory: Curved paths suggesting "table tipping"
- No new pile formation - tiles disappear individually

**Phase 3: Transition Complete**
- All tiles hidden
- Empty player racks become visible
- Wall counter shows 152/152

**Implementation**:
- Complete rewrite of `homePageTileManager.animateToPileAndStartGame()` so it becomes an async pipeline that:
  1. Calls `await this.animateJumpAndFlip()` (Phase 1)
  2. Calls `await this.animateFlyOffScreen()` (Phase 2)
  3. Resolves `onAnimationComplete` **only after** `transitionToWallSystem()` finishes handing tiles to the wall and `this.isAnimating` returns to false.
- New method: `animateJumpAndFlip()` in `homePageTileManager.js`. Iterate through `this.tileArray`, building Phaser tweens that raise/lower `y`, tween `scaleY` to 0 and back (flip illusion), and temporarily increase depth via the shared helper described in Objective 3. Use `Phaser.Math.Easing.Cubic.InOut` easing, duration `800ms`, delay `Phaser.Math.Between(0, 150)` so tiles don't jump in sync, and ensure promises resolve when every tween completes.
- New method: `animateFlyOffScreen()` in `homePageTileManager.js`. Animate each tile to a random off-screen point near the top-left with durations between `1200ms` and `2000ms`. Use `Phaser.Math.Easing.Cubic.In` for acceleration, set bezier control points for a gentle arc (`Phaser.Curves.QuadraticBezier`), and run tiles in batches of 20 to keep GPU load stable. Tiles call `showTile(false, false)` and resolve their promises once outside the viewport.
- Update animation sequencing and promise chaining so `HomePageTileManager` never calls `onAnimationComplete` before the wall owns the tiles. `GameScene.create()` relies on this guarantee before invoking `gGameLogic.start()`.

### 5. Human-Like Dealing Sequence
**Current**: `table.deal()` handles shuffling, applying training hands, inserting exposed sets, and immediately calling `players[i].showHand()` for all four seats
**Enhanced**: Maintain `Table` as the single source of truth for tile ownership while introducing a sequence controller that animates tiles one-at-a-time without duplicating business logic
**Status**: Implemented

**Dealing Pattern**:
1. **Initial Round**: 4 tiles to Player 0 (bottom) face-down
2. **Wait**: 300ms for tiles to settle
3. **Sequential Dealing**: 4 tiles to each player (1, 2, 3) in order
4. **Repeat**: Until each player has 12 tiles total
5. **Final Round**: 2 more tiles to Player 0, 1 more to each other player
6. **Wall Counter**: Decrement with each tile dealt

**Implementation**:
- Introduce `await sequentialDealTiles(initPlayerHandArray)` inside `GameLogic.deal()`. This function should:
  - Call into existing helpers on `Table` to apply training/exposed tiles **before** the animated phase begins (extract `applyTrainingHands(initPlayerHandArray)` + `applyExposedSets(initPlayerHandArray)` from `Table.deal()` so logic stays centralized).
  - Pull one tile at a time via `this.table.wall.remove()`, insert it with the existing `Hand.insertHidden`, and let `Hand.showHand()` update layout **only** for the player that just received a tile. This preserves validation logic and keeps `Hand` responsible for tile ordering.
  - Player order per round: `[PLAYER.BOTTOM, PLAYER.RIGHT, PLAYER.TOP, PLAYER.LEFT]`. Run 3 rounds of 4 tiles (12 total), then the final 2/1/1/1 round described above. Persist this order in a `const DEAL_SEQUENCE = [...]` array so it is testable.
  - Await a `200ms` delay between deals (use `await this.scene.time.delayedCall(200, resolve)`), with an additional `300ms` pause after Player 0’s initial 4-tile burst.
  - Emit `scene.updateWallTileCounter(...)` after each tile removal and log the remaining count for debugging when `DEBUG_DEALING` flag is true.
- Once sequential dealing completes, call a lightweight `Table.finalizeInitialHands()` (new helper) to sort/show all hands so training mode and auto-exposed sets still work.
- Skeleton:
```javascript
async sequentialDealTiles(initHands) {
    this.table.applyTrainingHands(initHands);
    this.table.applyExposedSets(initHands);
    const sequence = buildDealSequence();
    for (const step of sequence) {
        const tile = this.table.wall.remove();
        this.table.players[step.player].hand.insertHidden(tile);
        this.table.players[step.player].showHand(step.player === PLAYER.BOTTOM);
        this.scene.updateWallTileCounter(this.table.wall.getCount());
        await delay(step.delayMs);
    }
    this.table.finalizeInitialHands();
}
```

### 6. Player 0 Tile Reveal and Analysis
**Current**: `Table.deal()` ends by calling `showHand()` for every player, so Player 0 tiles already flip face-up and hints run immediately (gameLogic.js:300-307)
**Enhanced**: Delay Player 0’s reveal until the sequential dealing animation completes, then trigger hints/menu visibility in a predictable order
**Status**: Implemented

**Implementation**:
- Move the existing `hintAnimationManager.updateHintsForNewTiles()` invocation to the tail of `sequentialDealTiles`, after Player 0’s final flip animation resolves.
- Ensure `showHand(true)` for Player 0 happens exactly once after the dealing phase; other players can remain face-down (`showHand(false)`) since their hands are hidden by default. Document this expectation so future contributors don’t reintroduce simultaneous reveals.

### 7. Victory Fireworks Display
**Current**: No visual celebration for player 0 victory
**Enhanced**: Fireworks animation over game board
**Status**: Implemented

**Implementation**:
- In `GameScene.js`, create a new function `createFireworksDisplay`. This function will use Phaser's particle emitter (`this.add.particles(...)`). Create 5-7 emitters at random locations on the screen. Configure the emitters to create a burst of circular particles of different colors. The particles should have a lifespan of about 1-2 seconds and should fade out. Use a gravity setting to make the particles fall downwards after the explosion.
- Trigger on: `gameResult.mahjong === true && gameResult.winner === 0`
- Duration: 3-4 seconds
- Audio: Optional firework sound effect
- Reference configuration:
  - Texture: `circle` or custom sprite; tint array `[0xfff066, 0x66ccff, 0xff66c4]`
  - Speed: `Phaser.Math.Between(200, 400)`; radial spread 360°
  - Scale: start `0.8` → end `0`
  - Lifespan: `1200-1800ms`; gravityY `300`
  - Cleanup: destroy emitters and stop audio inside `onComplete` promise to prevent leaks
- Audio integration: preload `fireworks.mp3`, play via `this.sound.play("fireworks", { volume: 0.4 })`, stop when particles finish.

### 8. Preserve Existing Animations
**Critical Requirement**: All in-game animations remain unchanged
- Drag and drop mechanics
- Discard animations  
- Exposure sequences
- Charleston pass animations
- All existing game logic and timing
**Status**: Implemented

## Technical Implementation Details

### File Modifications

#### `homePageTileManager.js`
- `createScatteredTiles()`: Add 70% face-up randomization
- `animateToPileAndStartGame()`: Complete redesign for new animation sequence
- `animateJumpAndFlip()`: New method for jump+flip animation
- `animateFlyOffScreen()`: New method for varied speed exit animation

#### `GameScene.js`
- `createWallTileCounter()`: Hide by default, show on game start
- `createFireworksDisplay()`: New method for victory celebration

#### `gameLogic.js`
- `deal()`: Integrate with new sequential dealing by calling `sequentialDealTiles` while still delegating training/exposed tile prep to `Table`.
- `updateUI()`: Show wall counter on game start, handle tile reveal ordering.
- HINT panel integration: Run analysis after sequential dealing completes.

#### `gameObjects.js`
- `Tile`: Review and enhance Z-axis depth management.

#### `styles.css`
- Fireworks animation keyframes (if needed)
- Any additional visual enhancements

### Animation Architecture

#### Promise Chain Management
```javascript
// New animation flow
await phase1JumpAndFlip()
await phase2FlyOffScreen() 
await showEmptyRacks()
await sequentialDealTiles()
await revealPlayer0Tiles()
await runHintAnalysis()
```

##### Interaction Lock & Error Handling
- `GameScene` should expose `setInteractionLock(isLocked)` that disables pointer/touch listeners and command buttons while the promise chain runs.
- Wrap the chain in `try { ... } catch (err) { ... } finally { ... }`:
  - On rejection, log via `console.error("[HomePage] Animation failed", err)`, unlock UI, call `transitionToWallSystem()` to keep gameplay unblocked, and surface a toast/error banner if available.
  - Always call `this.onAnimationComplete?.()` in the `finally` block so downstream startup logic executes exactly once.
- Each tween phase must return a promise that rejects if Phaser fires `TWEEN_COMPLETE` with `tween.isDestroyed()` (interrupted) or `TWEEN_REMOVE_EVENT`; handle this by racing the tween promise with an `abortController` tied to scene shutdown.

#### Timing Coordination
- **Jump/Flip Phase**: 800ms (parallel for all tiles)
- **Fly-off Phase**: 1200-2000ms (varied per tile, completion awaited before wall transfer)
- **Rack Display**: Immediate
- **Dealing Phase**: 200ms per tile × 52 total tiles = ~10.4 seconds
- **Tile Reveal**: 500ms delay after dealing
- **HINT Analysis**: Immediate after reveal
- **Easing contract**:
  - Jump/Flip: `Phaser.Math.Easing.Cubic.InOut`
  - Fly-off: `Phaser.Math.Easing.Cubic.In`
  - Dealing tweens: `Phaser.Math.Easing.Quadratic.InOut`
- **Overlap vs sequencing**:
  - Jump/Flip runs for every tile concurrently with per-tile start delay `0-150ms`.
  - Fly-off operates in staggered batches of 20 tiles (`batchDelay = 150ms`) to control GPU load.
  - Sequential dealing is fully serialized; the next tile tween starts only after the prior tween resolves.


#### Performance Considerations
- Efficient tile animation: Batch operations where possible
- Memory management: Proper cleanup of animation objects
- Frame rate: Maintain 60fps during complex animations
- Mobile optimization: Reduce particle count on lower-end devices

### Testing Strategy

#### Unit Testing
- Individual animation components
- Timing accuracy verification
- Promise resolution validation
- Interrupt handling: simulate `scene.events.emit(Phaser.Scenes.Events.SHUTDOWN)` mid-animation to ensure promises reject gracefully.

#### Integration Testing
- Complete start game flow
- Dealing sequence accuracy
- Wall counter synchronization
- HINT analysis trigger
- Sequential dealing under artificial lag (insert `await delay(100)` hooks) to confirm UI lock persists and counters stay accurate.

#### Validation Checkpoints
- After Jump/Flip: verify all tiles face-down at angle 0 and raised-depth counter returns to 0.
- After Fly-off: confirm `tileArray` empty on scene layer and wall receives 152 hidden tiles.
- Before sequential dealing: assert `this.table.wall.getCount() === 152` and interaction lock still enabled.
- After each dealing cycle: check wall counter decrement and Player 0 hand count matches expected pattern (4/8/12/14).
- Before enabling UI: confirm `setInteractionLock(false)` called only after hints finish.
- After victory fireworks: ensure particle emitters/audio instances destroyed (no lingering display list nodes).

#### Visual Testing
- Animation smoothness across browsers
- Z-axis layering verification
- Fireworks display performance
- Responsive design considerations

## Risk Assessment

### Low Risk
- Home page tile randomization
- Wall counter visibility changes
- HINT panel integration

### Medium Risk  
- Complex animation sequence coordination
- Dealing sequence timing accuracy
- Performance impact of simultaneous animations

### High Risk
- Z-axis management conflicts
- Breaking existing game animations
- Cross-browser animation consistency

## Quality Assurance

### Animation Standards
- Smooth 60fps performance
- Consistent easing functions
- Proper cleanup of animation objects
- Error handling for animation failures

### User Experience
- Clear visual feedback during transitions
- Intuitive timing that feels natural
- Accessibility considerations (reduced motion preferences)
- Mobile device optimization

### Reliability Checks
- Run back-to-back game starts (≥20 iterations) to monitor heap usage and ensure no emitter/tween leaks.
- Verify `interactionLock` always reverts after failures.
- Confirm audio sources stop when scenes change or players navigate away.

## Success Criteria

1. **Home Page**: 70% of scattered tiles show faces, creating visual appeal
2. **Wall Counter**: Hidden until game starts, then shows accurate count
3. **Start Animation**: Three-phase sequence completes smoothly
4. **Dealing**: Sequential, human-like dealing with proper timing
5. **Player 0 Reveal**: Tiles flip up, action menu appears, HINT runs
6. **Victory**: Fireworks display for player 0 wins
7. **Existing Functions**: All in-game animations preserved
8. **Performance**: Maintains 60fps during complex sequences
9. **Cross-Browser**: Consistent behavior across major browsers
10. **Mobile**: Responsive performance on mobile devices

## Implementation Timeline

### Phase 1: Foundation (Steps 1-3)
- Home page tile randomization
- Wall counter visibility management  
- Z-axis depth management review

### Phase 2: Animation System (Step 4)
- Complete start-game animation redesign
- Jump and flip sequence
- Fly-off screen with varied speeds

### Phase 3: Game Flow (Steps 5-6)
- Sequential dealing implementation
- Player 0 tile reveal and analysis
- Wall counter integration

### Phase 4: Enhancement (Step 7)
- Victory fireworks display
- Performance optimization
- Cross-browser testing

### Phase 5: Validation
- Complete testing suite
- Animation preservation verification
- Performance benchmarking

## Phase Contracts

| Phase | Entry Conditions | Responsibilities / Outputs | Required Interfaces |
| --- | --- | --- | --- |
| Phase 1 – Foundation | `GameScene` constructed, scattered tiles rendered, wall counter hidden | Apply face-up randomization, ensure wall counter stays hidden until first `updateWallTileCounter`, document depth expectations | `homePageTileManager.createScatteredTiles`, `GameScene.createWallTileCounter`, `Tile.showTile` |
| Phase 2 – Animation System | Home page tiles idle, `HomePageTileManager.onAnimationComplete` unset | Provide `animateJumpAndFlip` + `animateFlyOffScreen`, guarantee `onAnimationComplete` fires **after** `transitionToWallSystem` and the wall owns all tiles | `HomePageTileManager`, `wall.receiveOrganizedTilesFromHomePage`, Phaser tween manager |
| Phase 3 – Game Flow | Wall owns 152 tiles, `GameLogic.deal()` invoked | Sequentially distribute tiles while honoring training hands, emit wall counter updates per draw, reveal Player 0 last, trigger hints after reveal | `Table` hand insertion helpers, `scene.updateWallTileCounter`, `hintAnimationManager` |
| Phase 4 – Enhancement | Core gameplay unaffected | Fireworks effect tied to `gameResult`, optional audio, ensure cleanup so future games can replay | `GameScene`, Phaser particle emitters, `gameLogic.end()` |
| Phase 5 - Validation | All features implemented | Execute automated + visual checks, confirm plan invariants (depth sync, promise ordering, 60fps target) | Test harness (if any), manual QA checklist |

Documenting these contracts ensures separate contributors (human or LLM) share consistent assumptions about when each phase runs, which files they may touch, and which invariants (tile ownership, depth synchronization, promise timing) must remain intact.

### Method Contracts

| Method | Inputs / Preconditions | Outputs / Side Effects | Error Handling |
| --- | --- | --- | --- |
| `Tile.withRaisedDepth(tweenFactory)` | Tile sprites created; `tweenFactory` returns a Phaser tween bound to the tile | Raises `sprite`, `spriteBack`, glow depth by +100 until tween resolves; returns tween for chaining | Rejects/cleans up if tween emits `TWEEN_REMOVE_EVENT`; reference counter prevents premature depth reset |
| `HomePageTileManager.animateJumpAndFlip()` | `tileArray` contains scattered tiles; interaction lock enabled | Returns promise that resolves after all jump tweens complete; tiles end face-down at angle 0 | On tween failure, stops remaining tweens, hides affected tile, rejects so caller can fallback |
| `HomePageTileManager.animateFlyOffScreen()` | Jump phase complete; tiles face-down | Returns promise when final tile exits viewport; hides tiles and prepares wall transfer | On failure, immediately toggles `showTile(false,false)` for unfinished tiles and rejects |
| `GameLogic.sequentialDealTiles(initHands)` | Wall owns 152 tiles; training hands already applied | Deals tiles following defined sequence, updates counter per draw, awaits 200ms between tiles | If `wall.remove()` returns `null`, throws descriptive error and aborts game start |
| `GameScene.createFireworksDisplay(result)` | `result` indicates Player 0 win; particle texture/audio preloaded | Spawns emitters, plays audio, auto-destroys after 3-4s | Wrap emitter creation in `try/catch`; on failure log warning and continue without effects |
| `GameScene.setInteractionLock(isLocked)` | DOM elements exist | Adds/removes CSS class to disable pointer events and toggles Phaser input | Should be idempotent; log warning if DOM nodes missing |

## Conclusion

This enhancement plan provides a comprehensive roadmap for transforming the home page experience while preserving all existing game functionality. The implementation focuses on creating engaging animations that feel natural and professional, enhancing user engagement without disrupting the core gameplay experience.

The modular approach allows for incremental implementation and testing, minimizing risk while maximizing the impact of each enhancement phase.
