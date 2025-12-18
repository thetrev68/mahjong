# Game Recovery Plan

## The Fundamental Problem

The codebase went through an **incomplete architectural refactor**:

- **Old (commit 07c41b9)**: Used `GameLogic` - worked but tightly coupled
- **New (current)**: Tried to split into GameController (logic) + PhaserAdapter (rendering)
- **Result**: Broken - the refactor left many pieces incomplete

## Current State

### What's Broken

1. ❌ Tile dealing animation doesn't run (tiles appear in hands without animation)
2. ❌ Charleston UI shows no buttons/text (action panel is empty)
3. ❌ Tile selection doesn't work properly (clicking tile discards instead of selecting)
4. ❌ Hand count is wrong (Player 0 gets 14 instead of 13)
5. ❌ Hint panel crashes

### Root Cause

The new GameController + PhaserAdapter architecture is **incomplete**:

- GameController emits events but lacks proper tile/animation handling
- PhaserAdapter has stub implementations
- Original GameLogic methods weren't properly migrated
- Charleston/tile selection UI code was removed and not re-implemented

---

## Two Options

### Option A: Complete the Refactor (Long-term, risky)

**Timeline**: 1-2 days
**Work**:

- Fix PhaserAdapter to handle all game events properly
- Implement missing UI event handlers
- Fix tile selection and Charleston flow
- Ensure mobile still works

**Pros**: Clean architecture, mobile-ready
**Cons**: Time-consuming, error-prone, still experimental

---

### Option B: Revert to GameLogic (Immediate fix, pragmatic)

**Timeline**: 1-2 hours
**Work**:

- Revert GameScene.js to use GameLogic directly (commit 07c41b9)
- Keep the AIEngine/Card initialization fix
- Keep tile index improvements
- Ditch GameController/PhaserAdapter for now

**Pros**: Game works immediately, known to be functional
**Cons**: Loses the architectural improvements, mobile refactor on hold

---

## Recommendation: Hybrid Approach

**Do this first (15 minutes)**:

```bash
# Get the old working GameScene.js
git show 07c41b9:GameScene.js > GameScene.js.old

# Get the old working gameLogic.js
git show 07c41b9:gameLogic.js > gameLogic.js.old

# Analyze what broke between then and now
# Focus on: Charleston, tile selection, discard, hint panel
```

**Then decide**:

1. If you want game to work NOW: Revert to old GameLogic (Option B)
2. If you want to complete the refactor: Take the broken pieces and fix them systematically (Option A)

---

## Files That Need Attention

### Core Files Changed Since commit 07c41b9

```
GameScene.js          ← Completely rewritten (was simple, now complex)
gameLogic.js          ← Might still exist or might be replaced?
gameObjects_hand.js   ← Partially refactored
gameObjects_table.js  ← Check if Player/Hand initialization still works
gameObjects_player.js ← New file, might be incomplete
```

### New Files Added (Part of Refactor)

```
core/GameController.js         ← New, incomplete
desktop/adapters/PhaserAdapter.js ← New, incomplete
core/models/TileData.js        ← New, but might be good
core/models/HandData.js        ← New, might be incomplete
core/models/PlayerData.js      ← New, might be incomplete
```

---

## Next Step

Tell me which approach you want:

**A) Revert to GameLogic immediately** (game will work in ~1hr)

```bash
git show 07c41b9:GameLogic.js > gameLogic.js
git show 07c41b9:GameScene.js > GameScene.js
# Fix imports, test
```

**B) Fix the new architecture** (proper but slower)

```bash
# Take the GameController events and wire them properly
# Re-implement Charleston UI
# Re-implement tile selection
# Fix hint panel
# Estimate: 4-6 hours
```

**C) Hybrid** (fix specific pieces)

```bash
# Keep new structure but cherry-pick working code from old GameLogic
# For example: copy Charleston implementation, tile selection handlers
# Estimate: 2-3 hours
```

---

## What I Can Do

Once you decide:

**For Option A**: Revert + fix imports, test game flow
**For Option B**: Systematically fix PhaserAdapter event handlers, re-implement UI
**For Option C**: Analyze diffs, identify what broke, cherry-pick fixes

Which approach do you want to take?
