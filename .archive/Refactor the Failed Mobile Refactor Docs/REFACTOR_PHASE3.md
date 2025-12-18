# Phase 3: Remove GameLogic Completely

## Overview

After Phases 1 & 2 are complete, Phase 3 deletes the obsolete GameLogic code and cleans up the codebase.

## Current State

- GameLogic.js still exists but shouldn't be used
- May be some lingering dependencies
- GameLogic-specific files may exist

## Desired End State

- GameLogic.js deleted
- GameLogic-related files deleted/moved
- No references to GameLogic from GameController or PhaserAdapter
- Clean codebase with clear separation

## Tasks

### Task 3.1: Identify Unique GameLogic Functionality

**Goal**: Find anything in GameLogic that hasn't been moved to GameController/PhaserAdapter

**Research**:

- HintAnimationManager - where should this live?
- Utility functions - move to utils
- UI management code - already in PhaserAdapter?
- Error handling - preserve where needed

**Output**: List of GameLogic code to preserve/migrate

---

### Task 3.2: Move Unique Functionality

**Goal**: Preserve any code that shouldn't be lost

**Actions**:

1. If HintAnimationManager used → Keep it, just remove GameLogic dependency
2. If utility functions used → Move to utils.js
3. If custom logic used → Migrate to appropriate place

**Testing**:

- Moved code still works
- All references updated

**Output**: All unique code moved

---

### Task 3.3: Delete GameLogic Files

**Goal**: Remove obsolete files

**Files to Delete**:

- `gameLogic.js` - main file
- Any GameLogic-specific files that were created just for it

**Files to Keep** (but update):

- `gameObjects.js` - Tile class (used by GameController)
- `gameObjects_hand.js` - Hand class (used by GameController)
- `gameObjects_table.js` - Table class (used by GameController)
- `gameObjects_player.js` - Player class (used by GameController)
- `core/AIEngine.js` - AI engine (used by GameController) - REFACTORED from gameAI.js
- `card/` - Hand validation (used by GameController)

**Actions**:

1. Delete gameLogic.js
2. Remove imports of GameLogic from GameScene
3. Run `npm run lint` to find broken references
4. Fix any remaining references

**Testing**:

- `npm run lint` passes
- `npm run build` succeeds
- Game still starts and plays

**Output**: GameLogic completely removed

---

### Task 3.4: Update GameScene Initialization

**Goal**: Remove GameLogic from GameScene

**Current** (after Phase 1 & 2):

```javascript
this.gGameLogic = new GameLogic(this);
this.gTable = new Table(this, this.gGameLogic);
this.gGameLogic.table = this.gTable;
await this.gGameLogic.init();
// AIEngine is created inside GameLogic.init()
// GameController gets access via options in Phase 1
```

**Desired** (after Phase 3):

```javascript
// Table creation (if still needed for gameObjects)
this.gTable = new Table(this); // No GameLogic
await this.gTable.init(); // If needed

// GameController is now the sole game engine
// AIEngine is created by GameController via dependency injection
// All game logic flows through GameController → AIEngine
```

**Changes**:

1. Remove gGameLogic references
2. Simplify table creation
3. Ensure GameController still has access to what it needs

**Testing**:

- `npm run lint` passes
- Game starts without errors
- All functionality works

**Output**: Clean GameScene

---

### Task 3.5: Remove Adapter Band-Aid References

**Goal**: Clean up references to gameLogic in PhaserAdapter

**Current** (Task 2.9 should have addressed this):

- Remove any remaining `this.gameLogic.updateUI()` calls
- Remove any remaining `this.gameLogic.state` assignments
- Remove gameLogic parameter from PhaserAdapter constructor

**Changes**:

1. Update PhaserAdapter constructor - remove gameLogic param
2. Update GameScene - don't pass gameLogic to adapter
3. Find any remaining gameLogic references in adapter

**Testing**:

- `npm run lint` passes
- Game plays without errors

**Output**: PhaserAdapter is independent

---

### Task 3.6: Final Cleanup

**Goal**: Clean up any remaining clutter

**Actions**:

1. Remove any commented-out GameLogic code
2. Update comments to reflect new architecture
3. Update CLAUDE.md to reflect new structure
4. Remove any GameLogic-specific documentation

**Output**: Clean codebase

---

## Phase 3 Completion Criteria

- [ ] All unique GameLogic code identified and migrated
- [ ] gameLogic.js deleted
- [ ] All GameLogic references removed from GameScene
- [ ] All GameLogic references removed from PhaserAdapter
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Game plays without errors
- [ ] Documentation updated
- [ ] No commented-out GameLogic code

## Next Phase

Once Phase 3 is complete, move to [Phase 4](REFACTOR_PHASE4.md) for mobile renderer proof of concept.

## Notes

- This phase is straightforward deletion/cleanup
- The hard work was done in Phases 1-2
- Just need to be thorough about removing all references
