# Phase 1: Extend GameController to Be Complete

## Overview

Make GameController a self-contained game engine that:
- Manages ALL game state (no duplication with GameLogic)
- Works with actual Phaser Tile objects from the shared wall
- Emits comprehensive events with animation data
- Implements all game flows (Charleston, courtesy, main loop)

## Current State

- GameController exists but is incomplete
- GameLogic still handles most game logic
- Two parallel tile systems (TileData vs Phaser Tiles)
- GameController emits basic events (STATE_CHANGED, TILE_DRAWN)
- Wall synchronization broken (WallDataWrapper hack)

## Desired End State

- GameController is the single source of truth
- Works with real Phaser Tile objects
- Emits rich events with animation parameters
- No GameLogic references
- All game phases implemented

## Tasks

### Task 1.1: Analyze GameLogic to Extract Core Logic

**Goal**: Understand what GameLogic does so we can move it to GameController

**Input**: Review current `gameLogic.js`

**Deliverables**:
- Document listing all GameLogic methods and their responsibilities
- Identify which methods are pure logic vs rendering
- Identify GameLogic methods that emit events or update UI
- List all properties GameLogic maintains

**Key Methods to Review**:
- `deal()` - sequence of dealing tiles
- `charleston()` - Charleston phase management
- `courtesy()` - Courtesy pass phase
- `loop()` - Main game loop
- `chooseDiscard()` - Discard selection
- `claimDiscard()` - Claim handling
- `exposeTiles()` - Exposure management
- `updateUI()` - Button/state management

**Output Document**: `REFACTOR_PHASE1_ANALYSIS.md`

---

### Task 1.2: Remove WallDataWrapper & Fix Wall Synchronization

**Goal**: Make GameController work directly with Phaser tiles (no wrapper hack)

**Current Problem**:
- WallDataWrapper tries to bridge TileData and Phaser Tiles
- `findTileInWall()` fails because Phaser Tiles don't have index
- Tiles are being created instead of found

**Solution**:
1. Remove WallDataWrapper from GameController
2. Make GameController accept sharedTable and use its wall directly
3. Fix findTileInWall() to match Phaser Tile structure
4. GameController.dealTiles() should work with actual Phaser Tile objects

**Changes**:
- `core/GameController.js`: Remove WallDataWrapper
- `core/GameController.js`: Update createWall() to use sharedTable directly
- `core/GameController.js`: Update dealTiles() to pop Phaser tiles, not TileData
- `GameScene.js`: Remove wrapper references
- `desktop/adapters/PhaserAdapter.js`: Update to expect Phaser tiles in events

**Testing**:
- Start game → Deal phase executes without "Creating new tile" warnings
- Console shows no errors
- Tiles appear in players' hands (no animation yet, just placement)

**Output**: Working wall synchronization

---

### Task 1.3: Create Rich Event System

**Goal**: GameController emits events that include animation parameters

**Current State**:
- Events are bare-bones: `{player, tile}`
- No animation data
- No timing information
- No rendering hints

**Desired State**:
- Events include animation parameters
- PhaserAdapter can render directly from event data
- Events are self-documenting

**New Event Structure** (examples):

```javascript
// Example: TILE_DRAWN event
{
  type: "TILE_DRAWN",
  player: 0,
  tile: {suit: SUIT.CRACK, number: 5, index: 42},
  animation: {
    type: "deal-slide",
    fromPosition: {x: 640, y: 360},  // Wall center
    toPosition: {x: 450, y: 575},    // Hand position for player 0
    duration: 400,
    easing: "Quad.easeOut"
  }
}

// Example: TILE_DISCARDED event
{
  type: "TILE_DISCARDED",
  player: 0,
  tile: {suit: SUIT.CRACK, number: 5, index: 42},
  animation: {
    type: "discard-slide",
    fromPosition: {x: 450, y: 575},   // Current hand position
    toPosition: {x: 350, y: 420},     // Center discard pile
    duration: 300,
    easing: "Power2.easeInOut",
    glow: {color: 0x1e3a8a, alpha: 0.9}
  }
}

// Example: CHARLESTON_PASS event
{
  type: "CHARLESTON_PASS",
  fromPlayer: 0,
  toPlayer: 1,
  direction: "right",
  tiles: [tile1, tile2, tile3],
  animation: {
    type: "pass-tiles",
    duration: 500,
    easing: "Sine.easeInOut"
  }
}
```

**Changes**:
1. Create new file: `core/events/GameEvents.js` with event structure definitions
2. Update `core/GameController.js`:
   - Import event definitions
   - Enhance all emitted events with animation parameters
   - Calculate animation positions based on player positions
   - Include timing and easing data

**Testing**:
- Emit events from GameController
- Console.log events and verify structure
- PhaserAdapter can read event data without modification

**Output**: Rich event system with animation data

---

### Task 1.4: Implement GameController.deal()

**Goal**: GameController manages the deal sequence (not GameLogic)

**Current**:
- GameLogic.deal() calls sequentialDealTiles()
- GameController.dealTiles() emits individual TILE_DRAWN events
- Deal sequence is implemented in GameLogic, not GameController

**Desired**:
- GameController.deal() orchestrates the dealing
- Emits appropriate events
- Works with Phaser tiles
- Handles timing and sequencing

**Implementation**:
1. In GameController, create `deal()` method that:
   - Sets state to STATE.DEAL
   - Emits STATE_CHANGED event
   - Calls dealTiles() to actually deal
   - Emits DEAL_COMPLETE event when done
   - Calls next phase (charleston or loop)

2. Update `dealTiles()` to:
   - Pop tiles from shared wall
   - Add to player hands
   - Emit TILE_DRAWN events with animation data for groups
   - Handle staggered timing for each player/round

3. Delete or disable GameLogic.deal() call

**Testing**:
- Start game → reach STATE.DEAL
- Tiles are dealt to all players
- Events are emitted in correct order
- Animation data is correct

**Output**: GameController.deal() working end-to-end

---

### Task 1.5: Implement GameController Charleston Phase

**Goal**: GameController manages Charleston logic (not GameLogic)

**Current**:
- GameLogic.charleston() implements Charleston phase
- GameLogic.charlestonPass() handles tile passing

**Desired**:
- GameController manages Charleston state machine
- Emits events for UI to respond
- Handles all three phases and decisions

**Implementation**:
1. Move Charleston logic from GameLogic to GameController:
   - charlestonPhase() - main orchestrator
   - charlestonPass() - handle pass logic
   - charlestonContinueQuery() - ask if continue to phase 2

2. Create Charleston-specific events:
   - CHARLESTON_PHASE: {phase: 1|2, direction: "right"|"across"|"left"}
   - CHARLESTON_PASS: {fromPlayer, toPlayer, direction, tiles}
   - CHARLESTON_CONTINUE_QUERY: {phase}

3. Wire UI prompts:
   - Emit UI_PROMPT for pass selection
   - Emit UI_PROMPT for continue decision
   - Handle callbacks

**Testing**:
- Start game → reach Charleston phase
- Can select and pass tiles
- Can choose to continue or end Charleston
- Tiles are passed correctly

**Output**: GameController manages Charleston

---

### Task 1.6: Implement GameController Courtesy Phase

**Goal**: GameController manages courtesy pass logic

**Similar to Task 1.5 but for courtesy phase**

**Implementation**:
1. Move courtesy logic from GameLogic:
   - courtesyQuery() - ask how many tiles
   - courtesy() - handle pass
   - courtesyVote() - record votes

2. Create courtesy events:
   - COURTESY_QUERY: {phase}
   - COURTESY_VOTE: {player, vote}
   - COURTESY_PASS: {fromPlayer, toPlayer, tiles}

3. Wire UI prompts for selections

**Testing**:
- Reach courtesy phase
- Can vote on number of tiles
- Courtesy passes work correctly

**Output**: GameController manages courtesy pass

---

### Task 1.7: Implement GameController Main Loop

**Goal**: GameController manages main game loop

**Current**:
- GameLogic.loop() implements main loop
- Handles pick, discard, claim, expose phases

**Implementation**:
1. Move main loop logic from GameLogic:
   - pickFromWall() - draw tile from wall
   - chooseDiscard() - get discard selection
   - claimDiscard() - handle claims
   - exposeTiles() - handle exposures
   - Turn cycling

2. Create loop-specific events:
   - TILE_DRAWN: {player, tile, animation}
   - TILE_DISCARDED: {player, tile, animation}
   - DISCARD_CLAIMED: {claimedBy, tile, exposureType}
   - TILES_EXPOSED: {player, exposureType, tiles}
   - MAHJONG: {winner, hand}
   - TURN_CHANGED: {currentPlayer}

3. Wire UI prompts:
   - UI_PROMPT for discard selection
   - UI_PROMPT for claim decision
   - UI_PROMPT for exposure selection

**Testing**:
- Play through multiple turns
- Can discard tiles
- Can claim discards
- Can form exposures
- Game flow is correct

**Output**: GameController manages main loop

---

### Task 1.8: Remove GameLogic Dependencies from GameController

**Goal**: GameController doesn't reference GameLogic

**Current**:
- GameController may have leftover GameLogic references
- May be calling GameLogic methods

**Changes**:
1. Search for all GameLogic references in GameController
2. Remove or refactor them
3. Ensure all functionality is self-contained

**Testing**:
- `npm run lint` - no undefined references
- GameController works standalone

**Output**: GameController is self-contained

---

### Task 1.9: Update GameScene to Remove Wrapper

**Goal**: GameScene properly initializes GameController without wrapper hacks

**Current**:
- GameScene passes sharedTable to GameController
- GameController tries to use WallDataWrapper
- Wall synchronization is broken

**Changes**:
1. Remove WallDataWrapper usage
2. Ensure sharedTable is passed correctly
3. Ensure wall is created before GameController uses it
4. Remove any stale code from wrapper attempt

**Testing**:
- `npm run lint`
- Start game without errors
- Deal phase completes

**Output**: Clean GameScene initialization

---

## Phase 1 Completion Criteria

- [ ] WallDataWrapper removed, real Phaser tiles work
- [ ] Rich event system with animation parameters
- [ ] GameController.deal() implemented and working
- [ ] GameController Charleston phase working
- [ ] GameController courtesy phase working
- [ ] GameController main loop working
- [ ] No GameLogic dependencies in GameController
- [ ] GameScene initialization clean
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Manual testing shows game flows through all phases
- [ ] No console errors during gameplay

## Next Phase

Once Phase 1 is complete, move to [Phase 2](REFACTOR_PHASE2.md) to implement PhaserAdapter rendering handlers.

## Notes

- This is the foundational phase - everything else depends on it
- Focus on correctness over optimization
- Add debug logging to GameController to understand flow
- Don't worry about animations yet (Task 1.3 includes data, not rendering)
- All game logic flows should be tested before moving to Phase 2
