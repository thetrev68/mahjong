# Dealing Animation - Critical Flow Documentation

**Date**: 2025-11-26
**Issue**: Tile selection broken after dealing - only first 4 tiles clickable
**Root Cause**: Timeout in GameController firing before DEALING_COMPLETE event

## The Problem

After Opus fixed the dealing animation yesterday (c701ebc), a new issue emerged where only the first 4 tiles dealt were clickable during Charleston. The remaining 10 tiles had no click handlers attached.

## Root Cause Analysis

The dealing animation takes **6-12 seconds** to complete (depending on tile count and animation timing). The GameController had a **3-second timeout** as a fallback for headless/mobile environments. This timeout was firing **before** the dealing animation finished, causing the following sequence:

1. GameController starts dealing → Sets up DEALING_COMPLETE listener + 3s timeout
2. PhaserAdapter begins recursive tile animation (takes 6-12 seconds)
3. **3 seconds pass** → Timeout fires → `completeDealing()` called
4. HAND_UPDATED events emitted while `dealAnimationHands !== null`
5. `onHandUpdated` **SKIPS** `syncAndRender()` because animation is still in progress
6. Dealing animation finally completes → Sets `dealAnimationHands = null` → Emits DEALING_COMPLETE (but listener already removed!)
7. Charleston starts with `handRenderer.playerHands[0].hiddenTiles` containing only 4 tiles (last batch dealt)
8. SelectionManager attaches handlers to only 4 tiles

## The Fix

**Increased timeout from 3 seconds to 30 seconds** in `core/GameController.js`:

```javascript
// Before:
timeoutId = setTimeout(() => completeDealing(), 3000);

// After:
timeoutId = setTimeout(() => completeDealing(), 30000);
```

This allows the dealing animation to complete naturally and emit DEALING_COMPLETE before the timeout fires.

## Critical Flow (DO NOT BREAK THIS)

### Step 1: GameController.dealTiles()

```
- Builds deal sequence
- Emits TILES_DEALT event with sequence
- Sets up DEALING_COMPLETE listener
- Sets 30-second timeout as fallback
- Returns promise that resolves when dealing completes
```

### Step 2: PhaserAdapter.onTilesDealt()

```
- Creates dealAnimationHands array (staged hands for progressive rendering)
- Starts recursive dealNextGroup() function
- Each batch:
  * Animates tiles with 100ms delay between each tile
  * Waits for all tile tweens to complete
  * Calls syncAndRender() with STAGED hand (partial tiles)
  * Delays 150ms before next batch
- Total time: ~6-12 seconds
```

### Step 3: Animation Complete

```
dealNextGroup() detects all batches complete:
1. Sets dealAnimationHands = null (CRITICAL TIMING!)
2. Emits DEALING_COMPLETE event
3. Returns (stops recursion)
```

### Step 4: GameController receives DEALING_COMPLETE

```
- completeDealing() callback fires
- Clears timeout
- Emits HAND_UPDATED for all 4 players with FINAL hand state
- Resolves dealTiles() promise
```

### Step 5: PhaserAdapter.onHandUpdated()

```
- Checks if dealAnimationHands === null (it is!)
- Calls handRenderer.syncAndRender() with FINAL hand
- handRenderer.playerHands[0].hiddenTiles now has ALL 14 tiles
- Calls selectionManager.refreshHandlers() (if selection enabled)
```

### Step 6: Charleston Phase Begins

```
- handleCharlestonPassPrompt() called
- selectionManager.enableTileSelection(3, 3, "charleston")
- _attachClickHandlers() reads handRenderer.playerHands[0].hiddenTiles
- ALL 14 tiles have handlers attached ✅
```

## Timing Requirements

| Phase            | Timing     | Critical Notes                    |
| ---------------- | ---------- | --------------------------------- |
| Tile animation   | 300ms each | Phaser tween duration             |
| Between tiles    | 100ms      | `tileIndexInBatch * 100` delay    |
| Between batches  | 150ms      | `delayedCall(150, dealNextGroup)` |
| Total animation  | ~6-12s     | Varies by tile count              |
| Timeout fallback | 30000ms    | Must be > animation time          |

## The dealAnimationHands Flag

**Purpose**: Prevents HAND_UPDATED events from calling syncAndRender() during animation

**States**:

- `!== null` during animation → syncAndRender SKIPPED
- `=== null` after animation → syncAndRender ALLOWED

**Critical**: Must be set to `null` **BEFORE** emitting DEALING_COMPLETE!

## Why This Keeps Breaking

1. **Hidden dependency**: dealAnimationHands flag affects onHandUpdated behavior
2. **Async timing**: Multiple async operations (tweens, delays, events, promises)
3. **Staged vs Final hands**: dealAnimationHands contains partial hands during animation
4. **Event ordering**: DEALING_COMPLETE must fire before HAND_UPDATED can sync
5. **Timeout race**: If timeout fires too early, entire flow breaks

## Debugging Checklist

If tiles aren't clickable after dealing:

1. Check timeout value in GameController.dealTiles() (should be 30000ms)
2. Verify DEALING_COMPLETE emitted BEFORE timeout fires
3. Check onHandUpdated logs - should show "Calling syncAndRender" not "Skipping"
4. Verify handRenderer.playerHands[0].hiddenTiles.length === 14
5. Check SelectionManager logs - should attach handlers to 14 tiles

## Console Logs to Watch For

**Success**:

```
[PhaserAdapter] Emitting DEALING_COMPLETE event
[GameController] completeDealing called, resolved = false
[onHandUpdated] Calling syncAndRender for player 0 (dealAnimationHands is null)
[onHandUpdated] After sync, player 0 has 14 tiles in renderer
[SelectionManager] Attaching handlers to 14 tiles
```

**Failure** (timeout fired too early):

```
[GameController] Timeout fired after 3016ms
[onHandUpdated] Skipping syncAndRender during deal animation
[SelectionManager] Attaching handlers to 4 tiles
[PhaserAdapter] Emitting DEALING_COMPLETE event  <-- Too late!
```

## Related Files

- `core/GameController.js` - Timeout and DEALING_COMPLETE listener
- `desktop/adapters/PhaserAdapter.js` - Dealing animation and dealAnimationHands flag
- `desktop/renderers/HandRenderer.js` - syncAndRender() and playerHands array
- `desktop/managers/SelectionManager.js` - \_attachClickHandlers()

## Previous Issues

- **2025-11-25**: Opus fixed dealing animation, created dealAnimationHands flag (c701ebc)
- **2025-11-26**: Timeout too short, only 4 tiles clickable (this fix)

## Future Improvements

1. **Remove timeout for desktop**: Only use for mobile/headless
2. **Add animation complete callback**: More reliable than event timing
3. **Decouple dealAnimationHands from HAND_UPDATED**: Separate concerns
4. **Face-down dealing**: Restore feature where tiles flip face-up when complete
