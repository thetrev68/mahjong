# Phase 3.5: Eliminate GameLogicStub and Refactor Legacy Dependencies

## Overview

Phase 3 created `gameLogicStub.js` as a temporary bridge to support legacy Hand/TileSet code that still had UI interaction logic tied to gameLogic state. Phase 3.5 properly eliminates this stub by refactoring the actual dependencies.

## Current State (After Phase 3)

- `gameLogicStub.js` exists as a temporary bridge
- `hintAnimationManager.js` is in root (should be in `desktop/`)
- Hand/TileSet classes still depend on gameLogicStub for:
  - `state` - current game state
  - `discardTile` - the currently discarded tile
  - `displayErrorText()` - error message display
  - `table` access - for player/hand data
  - `gameAI`, `card` - for hint calculations

## Desired End State

- No gameLogicStub.js exists
- hintAnimationManager.js lives in `desktop/managers/`
- Hand/TileSet have zero gameLogic dependencies
- Error display handled by DialogManager (via PhaserAdapter)
- Game state (`state`, `discardTile`) passed via GameController events
- Hint calculations accessed directly from GameController

## Architecture

```
GameController (pure logic)
    ↓ (events with all needed data)
    ├─→ PhaserAdapter (rendering)
    │   ├─→ TileManager
    │   ├─→ ButtonManager
    │   ├─→ DialogManager (handles error display)
    │   └─→ HintAnimationManager (in desktop/managers/)
    │
    └─→ Hand/TileSet (data structures only, UI code moved)
```

## Tasks

### Task 3.5.1: Analyze Hand/TileSet Dependencies

**Goal**: Understand exactly what Hand/TileSet need from gameLogicStub

**Research**:
- Examine all references to `this.gameLogic` in gameObjects_hand.js
- Document each usage:
  - `this.gameLogic.state` - which states? when accessed?
  - `this.gameLogic.discardTile` - when needed? how used?
  - `this.gameLogic.displayErrorText()` - which errors?
  - `this.gameLogic.table` - alternative sources?
  - `this.gameLogic.gameAI` - only in HintAnimationManager
  - `this.gameLogic.card` - only in HintAnimationManager

**Output**: Dependency analysis document listing all usages

---

### Task 3.5.2: Move HintAnimationManager to Desktop

**Goal**: Move hint manager to proper location

**Actions**:
1. Move `hintAnimationManager.js` → `desktop/managers/HintAnimationManager.js`
2. Update import in `GameScene.js`
3. Verify HintAnimationManager doesn't depend on anything in gameLogicStub except:
   - `scene` for error text display
   - `table` for accessing player hands
   - `gameAI` for recommendations
   - `card` for hand ranking
4. These should come from GameScene directly, not stub
5. Test: npm run lint passes

**Output**: HintAnimationManager in desktop/managers/, properly scoped

---

### Task 3.5.3: Refactor Hand/TileSet Error Display

**Goal**: Remove `displayErrorText()` dependency

**Current Usage**:
- Hand/TileSet calls `this.gameLogic.displayErrorText(message)`
- Used when user violates selection rules (e.g., selecting joker during Charleston)

**Solution**:
Option A (Simpler): Store error text directly on scene
- Hand/TileSet gets scene from constructor
- Calls `this.scene.errorText.setText()` directly
- No gameLogic needed

Option B (Better): PhaserAdapter handles errors via events
- Hand/TileSet throws error events
- PhaserAdapter listens and displays via DialogManager
- More separation of concerns

**Recommendation**: Start with Option A for simplicity, document Option B for future

**Actions**:
1. In Hand constructor, instead of receiving `gameLogic`, receive `scene`
2. Store `this.scene = scene`
3. Replace all `this.gameLogic.displayErrorText(msg)` with:
   ```javascript
   if (this.scene && this.scene.errorText) {
       this.scene.errorText.setText(msg);
       this.scene.errorText.visible = true;
   }
   ```
4. Remove gameLogic parameter from Hand constructor signature
5. Update all calls to Hand constructor (in Player)
6. Test: Errors still display when user violates selection rules

**Output**: Hand/TileSet no longer call gameLogic for error display

---

### Task 3.5.4: Refactor Hand/TileSet State Checks

**Goal**: Remove `state` dependency from Hand/TileSet

**Current Usage** (from Phase 3.1 analysis):
```javascript
if (this.gameLogic.state === STATE.CHARLESTON1 || ...) {
    // Validate selection
}
```

**Problem**: Hand/TileSet shouldn't know about game states. This violates separation of concerns.

**Solution**: PhaserAdapter sets validation rules when entering states
- When GameController emits STATE_CHANGED → Charleston state
- PhaserAdapter calls Hand/TileSet methods to set validation mode
- Hand/TileSet validates based on mode, not by checking state

**Actions**:
1. Add validation mode to Hand/TileSet:
   ```javascript
   this.validationMode = null; // 'charleston', 'courtesy', 'play', null
   ```
2. Add method to set mode:
   ```javascript
   setValidationMode(mode) {
       this.validationMode = mode;
   }
   ```
3. Replace all state checks with mode checks:
   ```javascript
   // Before
   if (this.gameLogic.state === STATE.CHARLESTON1) { ... }

   // After
   if (this.validationMode === 'charleston') { ... }
   ```
4. In PhaserAdapter, onStateChanged():
   ```javascript
   switch(state) {
       case STATE.CHARLESTON1:
       case STATE.CHARLESTON2:
           hand.setValidationMode('charleston');
           break;
       case STATE.COURTESY:
           hand.setValidationMode('courtesy');
           break;
       case STATE.LOOP_CHOOSE_DISCARD:
           hand.setValidationMode('play');
           break;
       // etc
   }
   ```
5. Remove all `this.gameLogic.state` references from Hand/TileSet
6. Test: Selection validation still works in all phases

**Output**: Hand/TileSet validation mode-based, not state-based

---

### Task 3.5.5: Refactor Hand/TileSet discardTile Access

**Goal**: Remove `discardTile` dependency

**Current Usage**:
```javascript
if (tile.suit !== this.gameLogic.discardTile.suit ||
    tile.number !== this.gameLogic.discardTile.number) {
    // Error: must match discard tile for exposure
}
```

**Solution**: Pass discardTile to methods that need it
- PhaserAdapter calls `hand.setDiscardTile(tile)` when discard happens
- Or passes as parameter to validation methods

**Actions**:
1. Add field: `this.discardTile = null`
2. Add method:
   ```javascript
   setDiscardTile(tile) {
       this.discardTile = tile;
   }
   ```
3. Replace all `this.gameLogic.discardTile` with `this.discardTile`
4. In PhaserAdapter, onTileDiscarded():
   ```javascript
   const player = this.table.players[playerIndex];
   player.hand.setDiscardTile(discardTile);
   ```
5. Test: Exposure validation still works

**Output**: discardTile set via method, not from gameLogic

---

### Task 3.5.6: Clean Up Table Reference

**Goal**: Ensure table access is direct, not via gameLogic

**Current State**: Table already doesn't depend on gameLogic

**Verification**:
- Hand/TileSet that need table access already have it via `this.gameLogic.table`
- After removing gameLogic, Hand/TileSet get table directly
- But Hand/TileSet don't construct table - they're constructed after table exists
- So table should be passed to Hand constructor or accessed via scene

**Actions**:
1. Verify Hand/TileSet access to table is via `this.gameLogic.table`
2. Change to: table passed via constructor or accessed via scene.gTable
3. Update Hand constructor to accept table parameter
4. Test: Hand can access player data for hints, etc.

**Output**: Table access doesn't go through gameLogic

---

### Task 3.5.7: Update HintAnimationManager Dependencies

**Goal**: HintAnimationManager should NOT reference gameLogicStub (or legacy gameAI)

**Current State**:
- HintAnimationManager receives gameLogicStub in constructor
- References `this.gameLogic.gameAI.getTileRecommendations()` (line 129)
- gameLogicStub wraps `gameController.aiEngine` as `gameAI`

**Important**: gameAI is legacy naming. The modern name is `aiEngine` from GameController.

**Actions**:
1. Update HintAnimationManager constructor to accept AIEngine directly:
   ```javascript
   constructor(scene, table, aiEngine, card) {
       this.scene = scene;
       this.table = table;
       this.aiEngine = aiEngine;  // Direct reference, not wrapped
       this.card = card;
   }
   ```
2. Replace all `this.gameLogic.gameAI` with `this.aiEngine`:
   ```javascript
   // Before (line 129)
   const result = this.gameLogic.gameAI.getTileRecommendations(hand);

   // After
   const result = this.aiEngine.getTileRecommendations(hand);
   ```
3. Replace all `this.gameLogic.X` references with direct field access
4. In GameScene, pass dependencies directly:
   ```javascript
   const hintManager = new HintAnimationManager(
       this,
       this.gTable,
       this.gameController.aiEngine,  // Modern name, not gameAI
       this.gameController.cardValidator
   );
   ```
5. Verify HintAnimationManager constructor reference comment is updated
6. Test: Hints still work

**Output**: HintAnimationManager has explicit dependencies, uses modern aiEngine naming

---

### Task 3.5.8: Delete gameLogicStub.js

**Goal**: Remove the temporary bridge entirely

**Actions**:
1. Verify no references to gameLogicStub remain
2. Delete gameLogicStub.js
3. Remove import from GameScene.js
4. Remove initialization code from GameScene.js
5. Run `npm run lint` - should pass
6. Run `npm run build` - should succeed
7. Test: Game plays without errors

**Output**: gameLogicStub.js completely removed

---

### Task 3.5.9: Update References Throughout

**Goal**: Update all files that referenced gameLogicStub

**Files to Update**:
- `GameScene.js` - Remove stub creation and initialization
- `PhaserAdapter.js` - Already updated to not use it
- Any test files that referenced it

**Actions**:
1. Search for all references to gameLogicStub
2. Remove imports
3. Remove references
4. Run `npm run lint`
5. Commit: "refactor: Remove gameLogicStub completely"

**Output**: No references to gameLogicStub remain in codebase

---

## Phase 3.5 Completion Criteria

- [ ] HintAnimationManager moved to `desktop/managers/`
- [ ] Hand/TileSet error display no longer uses gameLogic
- [ ] Hand/TileSet state checks replaced with validation mode
- [ ] Hand/TileSet discardTile set via method, not gameLogic
- [ ] HintAnimationManager receives dependencies directly
- [ ] gameLogicStub.js deleted
- [ ] No gameLogicStub references remain
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Game plays without errors
- [ ] All validation still works (charleston, courtesy, main loop)

## Success Indicator

The codebase has **zero** legacy dependencies:
- GameController is pure logic
- PhaserAdapter is pure rendering
- Hand/TileSet are data structures with minimal validation
- No temporary bridges exist
- No stub classes exist

## Notes

- This phase properly completes the GameLogic removal
- Eliminates technical debt from Phase 3
- Creates true separation of concerns
- Unblocks Phase 4 (Mobile Renderer wiring)
- After this phase, Hand/TileSet are ready for Phase 4 mobile integration
