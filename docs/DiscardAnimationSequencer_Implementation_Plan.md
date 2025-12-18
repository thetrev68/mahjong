# DiscardAnimationSequencer Implementation Plan

**Status:** 📋 Ready for Implementation
**Platform:** Mobile Only (PWA)
**Risk Level:** MEDIUM (Replaces existing animation)
**Estimated Effort:** 1-2 days
**Created:** 2025-01-24

---

## Executive Summary

This plan implements the `DiscardAnimationSequencer` specification for the **mobile platform only**. It will **replace** the current simple discard animation in [mobile/animations/AnimationController.js:211-251](mobile/animations/AnimationController.js#L211-L251) with a more sophisticated arc-based animation using the sequencer pattern.

**Desktop platform** (Phaser) is out of scope and will continue using its existing discard handling.

### Implementation Approach

✅ **Clean Replacement**: Remove simple `animateTileDiscard()`, replace with sequencer
✅ **Consistent Pattern**: Follows existing `CharlestonAnimationSequencer` architecture
✅ **No Feature Flags**: Direct implementation, thoroughly tested before deployment
✅ **Dead Code Removal**: Old animation code removed, not deprecated

---

## Current State Analysis

### Existing Discard Flow

**GameController** ([core/GameController.js:845-863](core/GameController.js#L845-L863))

```javascript
// 1. Remove tile from hand
player.hand.removeTile(tileIndex);

// 2. Add to discard pile
this.discards.push(tileToDiscard);

// 3. Emit TILE_DISCARDED event
this.emit("TILE_DISCARDED", {
  type: "TILE_DISCARDED",
  player: this.currentPlayer,
  tile: tileData,
  animation: {
    type: "discard-slide",
    duration: 300,
    easing: "Power2.easeInOut",
  },
});

// 4. Emit HAND_UPDATED event
this.emit("HAND_UPDATED", handEvent);

// 5. Sleep 500ms
await this.sleep(500);
```

**MobileRenderer** ([mobile/MobileRenderer.js:687-713](mobile/MobileRenderer.js#L687-L713))

```javascript
onTileDiscarded(data) {
    // 1. Add tile to discard pile component
    this.discardPile.addDiscard(tile, data.player);

    // 2. Simple animation for human player
    if (data.player === HUMAN_PLAYER) {
        const latestDiscard = this.discardPile.getLatestDiscardElement();
        this.animationController.animateTileDiscard(latestDiscard, targetPos);
    }

    // 3. Update UI
    this.updateBlankSwapButton();
}
```

### Existing Animation Infrastructure (To Be Replaced)

**AnimationController.animateTileDiscard()** ([mobile/animations/AnimationController.js:211-251](mobile/animations/AnimationController.js#L211-L251))

- ✅ Handles basic slide animation
- ✅ Uses CSS variables for positioning
- ✅ Promise-based completion tracking
- ❌ No arc trajectory (linear movement)
- ❌ No rotation or bounce effects
- ❌ Animates the tile AFTER it's added to discard pile (not from hand)

**STATUS**: This method will be **REMOVED** and replaced with sequencer.

**Existing CSS** ([mobile/styles/animations.css:32-71](mobile/styles/animations.css#L32-L71))

- ✅ `@keyframes tile-discard` with fade out
- ✅ GPU-accelerated transforms
- ✅ Reduced motion support
- ❌ No arc/parabolic curve
- ❌ No rotation keyframes

**STATUS**: These animations will be **REPLACED** with new arc-based keyframes.

---

## Implementation Strategy

### Phase 1: Create DiscardAnimationSequencer

**Goal**: Build the sequencer following the existing `CharlestonAnimationSequencer` pattern.

#### Step 1.1: Create the File

**Location**: `mobile/animations/DiscardAnimationSequencer.js`

**Base Structure**:

```javascript
import { AnimationSequencer } from './AnimationSequencer.js';

export class DiscardAnimationSequencer extends AnimationSequencer {
    constructor(gameController, handRenderer, animationController, discardPile) {
        super(gameController, handRenderer, animationController);
        this.discardPile = discardPile;
        this.soundEnabled = true;
    }

    // Main entry point
    async animateDiscard(data) { ... }

    // Private helpers
    async prepareDiscard(player, tileIndex) { ... }
    async animateTileToDiscard(player, tile, animation) { ... }
    calculateDiscardTrajectory(startPos, endPos, player, animation) { ... }
    async animateTileThrow(tileClone, trajectory) { ... }
    async settleTileInPile(tile) { ... }
    createDiscardTileClone(originalElement, tile) { ... }
}
```

**Dependencies**:

- ✅ Extends existing `AnimationSequencer` base class
- ✅ Uses existing `HandRenderer` for tile element access
- ✅ Uses existing `AnimationController` for primitives
- ✅ Uses existing `DiscardPile` component

**Pattern Match**: Mirrors `CharlestonAnimationSequencer` structure exactly.

---

#### Step 1.2: Replace CSS Animations

**Location**: `mobile/styles/animations.css`

**Remove** (lines 32-71):

```css
/* OLD: Tile Discard Animation (Movement-Based) */
@keyframes tile-discard { ... }
.tile-discarding { ... }
```

**Replace With**:

```css
/* ===== Enhanced Discard Animations (DiscardAnimationSequencer) ===== */

/* Preparation lift */
.tile-discarding-prep {
  animation: tile-discard-prep 100ms ease-out forwards;
}

@keyframes tile-discard-prep {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-8px);
  }
}

/* Arc throw animation with rotation */
.tile-discard-throw {
  animation: tile-discard-throw var(--duration, 300ms) var(--easing, ease-out)
    forwards;
}

@keyframes tile-discard-throw {
  0% {
    transform: translate(var(--start-x), var(--start-y)) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: translate(var(--control-x), var(--control-y))
      rotate(calc(var(--rotation, 360deg) * 0.5));
    opacity: 1;
  }
  100% {
    transform: translate(var(--end-x), var(--end-y))
      rotate(var(--rotation, 360deg));
    opacity: 0.9;
  }
}

/* Settle bounce in discard pile */
.tile-settle-bounce {
  animation: tile-settle 200ms cubic-bezier(0.5, 1.5, 0.5, 1);
}

@keyframes tile-settle {
  0% {
    transform: scale(1.1) translateY(-5px);
  }
  50% {
    transform: scale(0.95) translateY(2px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

/* Claim interrupt animation */
.tile-claim-interrupt {
  animation: tile-claim-travel var(--duration, 400ms) ease-in-out forwards;
}

@keyframes tile-claim-travel {
  0% {
    transform: translate(var(--start-x), var(--start-y)) rotate(0deg) scale(1);
  }
  50% {
    transform: translate(var(--control-x), var(--control-y))
      rotate(calc(var(--rotation, 180deg) * 0.5)) scale(1.1);
  }
  100% {
    transform: translate(var(--end-x), var(--end-y))
      rotate(var(--rotation, 180deg)) scale(1);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tile-discard-throw,
  .tile-claim-interrupt {
    animation-duration: 50ms;
  }

  .tile-settle-bounce {
    animation: none;
  }
}
```

**Note**: `.tile-discarding` class is removed and replaced with `.tile-discard-throw` for arc animation.

---

### Phase 2: Replace MobileRenderer Integration

**Goal**: Replace existing animation with sequencer.

#### Step 2.1: Add Sequencer to MobileRenderer Constructor

**File**: [mobile/MobileRenderer.js](mobile/MobileRenderer.js)

**Change Location**: Constructor (after line ~100)

**Add**:

```javascript
import { DiscardAnimationSequencer } from './animations/DiscardAnimationSequencer.js';

constructor(options) {
    // ...existing initialization...

    // Initialize discard sequencer
    this.discardSequencer = new DiscardAnimationSequencer(
        this.gameController,
        this.handRenderer,
        this.animationController,
        this.discardPile
    );
}
```

---

#### Step 2.2: Replace onTileDiscarded() Implementation

**File**: [mobile/MobileRenderer.js:687-713](mobile/MobileRenderer.js#L687-L713)

**Remove Old Code**:

```javascript
onTileDiscarded(data) {
    if (!data?.tile) {
        return;
    }
    const tile = TileData.fromJSON(data.tile);
    this.discardPile.addDiscard(tile, data.player);

    // Animate discard from hand if it's the human player
    if (data.player === HUMAN_PLAYER) {
        const discardContainer = this.discardPile?.element;
        const latestDiscard = this.discardPile.getLatestDiscardElement();
        if (latestDiscard && discardContainer) {
            const targetPos = getElementCenterPosition(discardContainer);
            this.animationController.animateTileDiscard(latestDiscard, targetPos);
        } else if (latestDiscard) {
            this.animationController.animateTileDiscard(latestDiscard);
        }
    }

    this.updateBlankSwapButton();
}
```

**Replace With**:

```javascript
onTileDiscarded(data) {
    if (!data?.tile) {
        return;
    }

    // Route to sequencer for animation
    this.discardSequencer.animateDiscard(data);

    // Update blank swap button since discard pile changed
    this.updateBlankSwapButton();
}
```

**Changes**:

- ❌ Remove `TileData.fromJSON()` call (sequencer handles this)
- ❌ Remove `discardPile.addDiscard()` call (sequencer handles this)
- ❌ Remove old animation code with `animationController.animateTileDiscard()`
- ✅ Simple delegation to sequencer

---

#### Step 2.3: Remove Dead Code from AnimationController

**File**: [mobile/animations/AnimationController.js:211-251](mobile/animations/AnimationController.js#L211-L251)

**Remove Entire Method**:

```javascript
animateTileDiscard(tileElement, targetPos = null) {
    // ...41 lines of code...
}
```

**Reason**: This method is no longer called after MobileRenderer replacement.

**Check for Other Usage**: Search codebase for `animateTileDiscard` to ensure no other callers exist.

---

### Phase 3: GameController Enhancements

**Goal**: Add metadata needed by sequencer to TILE_DISCARDED event.

#### Step 3.1: Add tileIndex and Rotation to Discard Event

**File**: [core/GameController.js:845-863](core/GameController.js#L845-L863)

**Current Code**:

```javascript
const discardEvent = GameEvents.createTileDiscardedEvent(
  this.currentPlayer,
  tileData,
  {
    type: "discard-slide",
    duration: 300,
    easing: "Power2.easeInOut",
  },
);
```

**Enhanced Code**:

```javascript
const discardEvent = GameEvents.createTileDiscardedEvent(
  this.currentPlayer,
  tileData,
  {
    type: "discard-arc", // NEW: Signal enhanced animation
    duration: this.currentPlayer === 0 ? 300 : 200, // Human vs AI
    easing: "ease-out",
    rotation: this.currentPlayer === 0 ? 360 : 180, // NEW: Full spin for human
    tileIndex: tileIndex, // NEW: Original index in hand for DOM lookup
  },
);
```

**Impact**:

- ✅ Mobile: Used by sequencer for DOM lookup
- ✅ Desktop: Ignored (Phaser has its own system)

---

#### Step 3.2: Update GameEvents Factory

**File**: [core/events/GameEvents.js](core/events/GameEvents.js)

**Find**: `createTileDiscardedEvent()` method

**Add** to JSDoc:

```javascript
/**
 * @param {number} player - Player index
 * @param {Object} tile - TileData object
 * @param {Object} animation - Animation metadata
 * @param {number} [animation.tileIndex] - Optional index in hand before discard
 * @param {number} [animation.rotation] - Optional rotation degrees (360 for human, 180 for AI)
 */
```

**Note**: Documentation update only, no code changes required.

---

### Phase 4: DiscardPile Component Enhancements

**Goal**: Add methods for sequencer to query tile positions.

#### Step 4.1: Add getNextTilePosition() Method

**File**: [mobile/components/DiscardPile.js](mobile/components/DiscardPile.js)

**Add** (after `addDiscard()` method):

```javascript
/**
 * Get the position where the next tile should land
 * @returns {{x: number, y: number}}
 */
getNextTilePosition() {
    // Get discard pile container position
    const rect = this.element.getBoundingClientRect();

    // Calculate next grid position (tiles are laid out horizontally)
    const tileWidth = 48; // From tiles.css
    const tileGap = 4;
    const tilesPerRow = 10;

    const currentCount = this.discards.length;
    const row = Math.floor(currentCount / tilesPerRow);
    const col = currentCount % tilesPerRow;

    return {
        x: rect.left + (col * (tileWidth + tileGap)) + (tileWidth / 2),
        y: rect.top + (row * (tileWidth + tileGap)) + (tileWidth / 2)
    };
}

/**
 * Get the position of the last discarded tile
 * @returns {{x: number, y: number}|null}
 */
getLastTilePosition() {
    const latestElement = this.getLatestDiscardElement();
    if (!latestElement) {
        return null;
    }

    const rect = latestElement.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}
```

**Impact**:

- ✅ New methods only, no changes to existing methods
- ✅ Returns null safely if no tiles exist

---

### Phase 5: HandRenderer Integration

**Goal**: Allow sequencer to access tile elements by index.

#### Step 5.1: Add getTileElementByIndex() Method

**File**: [mobile/renderers/HandRenderer.js](mobile/renderers/HandRenderer.js)

**Check**: Does this method already exist? (Likely yes, based on CharlestonAnimationSequencer)

**If Missing, Add**:

```javascript
/**
 * Get tile DOM element by its index in the hand
 * @param {number} index - Tile index
 * @returns {HTMLElement|null}
 */
getTileElementByIndex(index) {
    if (index < 0 || index >= this.tiles.length) {
        return null;
    }
    return this.tiles[index];
}
```

**Note**:

- ✅ Likely already exists (used by CharlestonAnimationSequencer)
- ✅ Includes defensive bounds checking

---

### Phase 6: Testing & Validation

#### Step 6.1: Unit Tests

**File**: `tests/animations/DiscardAnimationSequencer.test.js` (new)

**Test Cases**:

```javascript
describe("DiscardAnimationSequencer", () => {
  test("calculates correct trajectory for human player", () => {
    // Verify 360° rotation, higher arc
  });

  test("calculates faster trajectory for AI", () => {
    // Verify 180° rotation, lower arc
  });

  test("creates tile clone with correct styles", () => {
    // Verify position: fixed, z-index: 9999
  });

  test("falls back gracefully if tile element not found", () => {
    // Verify skipAnimation() called
  });
});
```

---

#### Step 6.2: Integration Testing (Manual)

**Test Plan**:

1. ✅ **Human Player**: Verify arc animation with 360° rotation
2. ✅ **AI Players**: Verify faster, lower arc with 180° rotation
3. ✅ **Tile from Hand**: Verify animation starts from hand position, not discard pile
4. ✅ **Bounce Effect**: Verify settle animation when tile lands
5. ✅ **Reduced Motion**: Verify instant discard (no arc)
6. ✅ **Edge Cases**: Test with missing elements, invalid indices

---

## Deployment Plan

### Pre-Deployment

1. ✅ Complete all 6 implementation phases
2. ✅ Run unit tests (100% pass rate)
3. ✅ Manual testing on local dev environment
4. ✅ Test on multiple browsers (Chrome, Safari, Firefox)
5. ✅ Test on mobile devices (iOS, Android)
6. ✅ Verify reduced motion accessibility

### Deployment

1. **Merge to main**: PR with all changes
2. **Deploy to production**: Standard deployment process
3. **Monitor**: Watch for errors in console logs
4. **Verify**: Quick smoke test on production

### Rollback Strategy

If critical issues arise post-deployment:

1. **Revert commit**: Git revert the merge commit
2. **Redeploy**: Push reverted code
3. **Investigate**: Debug locally with production conditions
4. **Fix & Redeploy**: Once fixed, submit new PR

---

## Touchpoint Summary

### Files Modified

| File                                             | Lines   | Risk   | Change Description                        |
| ------------------------------------------------ | ------- | ------ | ----------------------------------------- |
| `mobile/animations/DiscardAnimationSequencer.js` | +330    | LOW    | New file following Charleston pattern     |
| `mobile/styles/animations.css`                   | +80/-40 | LOW    | Replace old keyframes with arc animations |
| `mobile/MobileRenderer.js`                       | +5/-20  | MEDIUM | Replace animation code with sequencer     |
| `mobile/animations/AnimationController.js`       | -41     | MEDIUM | Remove `animateTileDiscard()` method      |
| `mobile/components/DiscardPile.js`               | +30     | LOW    | Add position helper methods               |
| `mobile/renderers/HandRenderer.js`               | +10     | LOW    | Add `getTileElementByIndex()` if missing  |
| `core/GameController.js`                         | ~5      | LOW    | Add tileIndex + rotation to event         |
| `core/events/GameEvents.js`                      | ~3      | LOW    | Documentation update                      |

**Total LOC**: ~370 new lines, ~25 modified lines, ~41 deleted lines

---

## Dependencies & Prerequisites

### Required

- ✅ Existing `AnimationSequencer` base class
- ✅ Existing `CharlestonAnimationSequencer` (reference implementation)
- ✅ Existing `AnimationController` primitives
- ✅ Existing `DiscardPile` component
- ✅ Existing `HandRenderer` with tile access methods

### Optional

- ❌ Sound system integration (placeholder for future)
- ❌ Claim interrupt handling (can be added later)

---

## Success Metrics

### Performance

- ✅ 60fps throughout animation (use DevTools Performance tab)
- ✅ < 5ms scripting time per animation frame
- ✅ No memory leaks (tile clones removed after animation)

### User Experience

- ✅ Animation feels smooth and satisfying
- ✅ No jank or stuttering
- ✅ Reduced motion respects user preference

### Technical

- ✅ Zero regressions in existing discard flow
- ✅ Feature flag works as expected
- ✅ Fallback animation continues working

---

## Risk Mitigation

### Risk 1: Clone Element Not Removed

**Mitigation**: Use try/finally blocks in `animateTileToDiscard()`

### Risk 2: Tile Element Not Found

**Mitigation**: Fallback to `skipAnimation()` method

### Risk 3: CSS Conflicts with Existing Animations

**Mitigation**: Use unique class names (`.tile-discard-throw` vs `.tile-discarding`)

### Risk 4: Desktop Platform Affected

**Mitigation**: Desktop uses PhaserAdapter, not MobileRenderer - completely isolated

---

## Next Steps

1. **Review Plan**: Confirm approach and scope
2. **Create Feature Branch**: `feature/mobile-discard-sequencer`
3. **Phase 1**: Implement sequencer class + CSS
4. **Phase 2**: Replace MobileRenderer integration
5. **Phase 3**: Enhance GameController events
6. **Phase 4-5**: Add DiscardPile + HandRenderer helpers
7. **Phase 6**: Write tests and manual testing
8. **Submit PR**: Request code review
9. **Deploy**: Merge and deploy to production

---

## Questions for Review

1. **Sound Integration**: Implement sound placeholders now, or wait for audio system?
2. **Claim Interrupt**: Implement claim re-routing now, or add later?
3. **Desktop Platform**: Leave desktop as-is, or add Phaser sequencer in future?
4. **Animation Timing**: Keep GameController's 500ms sleep, or adjust to match sequencer?

---

## Appendix: Code Snippets

### A. Debug Logging Hook

```javascript
// In DiscardAnimationSequencer
async animateDiscard(data) {
    if (window.__DEBUG_ANIMATIONS__) {
        console.log('[DiscardSequencer] Starting animation:', {
            player: data.player,
            tile: data.tile,
            trajectory: this.calculateDiscardTrajectory(...)
        });
    }

    await this.executeSequence([...]);
}
```

### B. Metrics Tracking

```javascript
// In DiscardAnimationSequencer
async onSequenceComplete() {
    const duration = Date.now() - this.sequenceStartTime;

    if (window.analytics) {
        window.analytics.track('discard_animation_complete', {
            duration,
            player: this.currentPlayer,
            success: true
        });
    }
}
```

---

**END OF IMPLEMENTATION PLAN**
