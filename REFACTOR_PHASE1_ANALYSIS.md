# Phase 1 Analysis: GameLogic Methods and Responsibilities

## Overview

GameLogic is a large class (~1911 lines) that currently orchestrates all game phases and manages game state. This analysis documents all methods, identifies which are pure logic vs UI-dependent, and maps them to GameController equivalents.

## GameLogic Class Structure

### Constructor & Initialization
- **constructor()** - Initializes GameLogic with Phaser scene reference
- **init()** - Sets up Card validator, GameAI, HintAnimationManager, and training form
- **start()** - Resets game state and creates wall with 152/160 tiles

### Core Game Flow Methods (Pure Logic)
These handle game state transitions and should move to GameController:

#### Deal Phase
- **deal()** [313-344] - Orchestrates dealing sequence
  - Sets state to STATE.DEAL
  - Calls sequentialDealTiles() with optional training hand
  - Skips Charleston if training mode enabled
  - Calls charleston() or loop()
  - **UI Dependencies:** getTrainingInfo(), hintAnimationManager updates

- **sequentialDealTiles()** [1801-1886] - Actual dealing implementation
  - Deals 13 tiles to each player in 4 rounds of 13
  - Emits TILE_DRAWN events (basic)
  - Animates tiles with delay
  - Updates hints after dealing complete
  - **Dependencies:** Uses actual Phaser table, emits events, calls updateUI()

#### Charleston Phase (Complex)
- **charleston()** [346-497] - Charleston phase orchestrator
  - Manages 3 Charleston passes per phase (right, across, left)
  - Queries continue to phase 2
  - Performs optional phase 2 (passes in opposite direction)
  - Manages courtesy phase
  - **State Transitions:** CHARLESTON1 → CHARLESTON_QUERY → CHARLESTON2 → COURTESY_QUERY
  - **Dependencies:** charlestonPass(), yesNoQuery(), courtesyQuery(), courtesyPass(), hintAnimationManager

- **charlestonPass()** [962-1029] - Single pass execution
  - Prompts each player for 3 tiles to pass
  - Handles human and AI selection
  - Validates tile selection
  - Performs pass exchange (right, across, or left)
  - **Dependencies:** gameAI.charlestonPass(), updateUI()

- **yesNoQuery()** [921-960] - Yes/No prompt
  - Creates dialog with callback
  - Returns Promise<boolean>
  - Used for Charleston continue and courtesy decisions
  - **Implementation:** DOM-based dialog

#### Courtesy Phase
- **courtesyQuery()** [1109-1154] - Courtesy voting
  - Prompts human for tile count (0-3)
  - Gets AI votes in parallel
  - Returns vote array
  - **Dependencies:** yesNoQuery() wrapper, gameAI.courtesyVote()

- **courtesyPass()** [1156-1173] - Courtesy pass execution
  - Waits for human tile selection (hidden in yesNoQuery)
  - Gets AI selections
  - Performs exchange (opposite players 0↔2, 1↔3)
  - Applies blue glow to received tiles
  - Sorts hand automatically
  - **Dependencies:** yesNoQuery(), gameAI.courtesyPass(), updateUI()

#### Main Game Loop
- **loop()** [504-663] - Main game loop orchestrator
  - Cycles through 4 players
  - Handles pick → discard → claim → expose flow
  - Manages turn switching and win conditions
  - Wall game detection
  - **State Flow:** LOOP_PICK_FROM_WALL → LOOP_CHOOSE_DISCARD → LOOP_QUERY_CLAIM_DISCARD → LOOP_EXPOSE_TILES
  - **Dependencies:** All phase methods, updateUI(), gameAI

- **pickFromWall()** [681-720] - Draw tile for current player
  - Pops tile from wall
  - Adds to hand
  - Emits TILE_DRAWN event
  - Applies blue glow, auto-sorts, updates hints
  - **Dependencies:** updateUI(), hintAnimationManager

- **chooseDiscard()** [725-798] - Discard selection
  - Prompts human or AI
  - Removes from hand
  - Validates non-joker discard handling
  - **Implementation:** Returns {playerOption, tileArray}

- **claimDiscard()** [827-919] - Claim decision for one player
  - Checks if player wants to claim discard
  - Validates exposure combinations
  - Returns claim info or DISCARD_TILE option
  - **Dependencies:** Card.matchComponents(), Card.rankHand()

- **exposeTiles()** [1031-1085] - Exposure handling
  - Identifies exposure type (Pung/Kong/Quint)
  - Removes tiles from hand, adds to exposures
  - Creates TileSet objects for rendering
  - **Dependencies:** updateUI()

- **playerExposeTiles()** [1087-1107] - Exposure prompting
  - Prompts player to select exposure
  - Calls exposeTiles() with result
  - **Unused in current flow - embedded in claimDiscard()**

### Supporting Logic Methods

- **canPlayerClaimExposure()** [800-814] - Validates exposure claims
- **canPlayerMahjongWithDiscard()** [816-822] - Validates mahjong claims
- **end()** [665-679] - Game end handling
  - Shows winner/score
  - Enables replay button
  - **Note:** Very UI-heavy, move to PhaserAdapter

### UI/Rendering Methods (Should NOT move to GameController)
These are specific to Phaser UI and should stay in PhaserAdapter:

- **updateUI()** [1175-1476] - Massive method (~300 lines)
  - State-based button visibility/enablement
  - Hand display updating
  - Score display
  - UI text updates
  - Dialog management
  - **Critical:** This is the main coupling between GameLogic and Phaser UI

- **enableSortButtons()** [1660-1693] - Sort button management
- **disableSortButtons()** [1695-1711] - Sort button management
- **disableAllButtons()** [1888-1898] - All button disable
- **enableAllButtons()** [1900-1910] - All button enable
- **yesNoQuery()** [921-960] - Dialog creation
- **displayErrorText()** [1754-1770] - Error display
- **displayAllError()** [1786-1797] - All player error display
- **highlightInvalidMahjongTiles()** [1774-1784] - Validation highlighting

### Training Mode Methods (Can move with refactoring)
- **enableTrainingForm()** - Shows training UI
- **disableTrainingForm()** - Hides training UI
- **getTrainingInfo()** - Gets training settings
- **updateTrainingForm()** - Updates training UI
- **initiateBlankSwap()** [1511-1571] - Blank tile swap UI
- **updateSwapBlankButton()** [1478-1509] - Button management
- **swapBlankForDiscard()** [1573-1658] - Blank swap logic

### Hint Animation Manager
- Used by GameLogic for highlighting recommended tiles
- Needs to move or be refactored for GameController
- Currently tightly coupled to Phaser sprites

## Current State (Phase 2B)

The codebase is in a hybrid state:
- GameLogic still exists and orchestrates game flow
- GameController was created but is incomplete
- WallDataWrapper hack attempts to bridge Phaser tiles and GameController
- PhaserAdapter exists but is still a band-aid

## Tasks for Phase 1

### 1.2 Remove WallDataWrapper
**Problem:** WallDataWrapper tries to convert Phaser Wall to TileData-based wall
**Solution:**
- GameController should work with real Phaser Tile objects
- dealTiles() should pop Phaser tiles, NOT convert to TileData
- PlayerData.hand should accept Phaser Tile objects

### 1.3 Create Rich Event System
**Current:** Basic events like TILE_DRAWN {player, tile}
**Desired:** Events include animation parameters
- TILE_DRAWN: add animation {type, fromPos, toPos, duration, easing}
- TILE_DISCARDED: add animation with discard pile target
- CHARLESTON_PASS: add animation with pass direction
- COURTESY_PASS: add animation with exchange direction

### 1.4-1.7 Move Game Logic to GameController
**Core logic to move:**
1. Deal phase (deal(), sequentialDealTiles())
2. Charleston phase (charleston(), charlestonPass())
3. Courtesy phase (courtesyQuery(), courtesyPass())
4. Main loop (loop(), pickFromWall(), chooseDiscard(), claimDiscard(), exposeTiles())

**Not to move:**
- updateUI() → stays in PhaserAdapter
- Button management → stays in PhaserAdapter
- Dialog/prompt creation → stays in PhaserAdapter (but GameController defines interface)

### 1.8 Remove GameLogic Dependencies
**Currently GameController depends on:**
- GameLogic exists but shouldn't be referenced
- gameAI is passed in (keep)
- Card validator is passed in (keep)

### 1.9 Clean GameScene
- Remove WallDataWrapper references
- Ensure sharedTable is passed correctly
- Ensure wall is created before GameController uses it

## Key Implementation Notes

### Wall Management
- GameLogic creates wall with Phaser Wall class
- GameLogic.table.wall is a Phaser Wall object with remove() method
- GameController should use sharedTable.wall.remove() directly, not WallDataWrapper

### PlayerData vs Phaser Player
- GameController has PlayerData objects (game state)
- Phaser scene has gameObjects_player.js Player objects (rendering)
- These are separate - GameController doesn't interact with Phaser players

### Event Emission Pattern
- GameController emits events via EventEmitter
- PhaserAdapter subscribes to GameController events
- PhaserAdapter handles all Phaser-specific rendering/UI

### AI Integration
- gameAI object is passed to GameController.init()
- GameController calls aiEngine.charlestonPass(), aiEngine.chooseDiscard(), etc.
- AI returns tile selections and decisions

### Card Validation
- Card validator is passed to GameController.init()
- Used for hand validation (winning patterns)
- Called from checkMahjong() and claim validation

## Summary Table

| Method | Current Location | Should Move To | Notes |
|--------|------------------|-----------------|--------|
| deal() | GameLogic | GameController | Minor - calls sequentialDealTiles |
| sequentialDealTiles() | GameLogic | GameController | Core deal logic |
| charleston() | GameLogic | GameController | Complex - multiple passes |
| charlestonPass() | GameLogic | GameController | Single pass logic |
| courtesyQuery() | GameLogic | GameController | Voting logic |
| courtesyPass() | GameLogic | GameController | Pass execution |
| loop() | GameLogic | GameController | Main loop orchestrator |
| pickFromWall() | GameLogic | GameController | Draw logic |
| chooseDiscard() | GameLogic | GameController | Discard selection |
| claimDiscard() | GameLogic | GameController | Claim validation |
| exposeTiles() | GameLogic | GameController | Exposure creation |
| updateUI() | GameLogic | PhaserAdapter | UI rendering |
| yesNoQuery() | GameLogic | PhaserAdapter | Dialog creation |
| enableSortButtons() | GameLogic | PhaserAdapter | Button management |
| start() | GameLogic | Stay in GameLogic | For now - creates initial wall |

## GameController Issues to Fix

1. **WallDataWrapper (lines 53-73)** - Remove entirely
2. **dealTiles() (lines 274-310)** - Currently incomplete, needs animation events with positions
3. **charlestonPhase() (lines 315-335)** - Incomplete, needs event emissions
4. **courtesyPhase() (lines 433-552)** - Needs work for courtesy pass implementation
5. **gameLoop() (lines 557-599)** - Needs proper main loop with all phases
6. **Missing methods:**
   - Deal phase: need to implement proper sequence similar to GameLogic.deal()
   - Charleston: need full implementation
   - Courtesy: need full implementation
   - Main loop: needs refinement

## Next Steps

1. Start with Task 1.2: Remove WallDataWrapper
2. Fix dealTiles() to use real Phaser tiles
3. Test that dealing works without errors
4. Move to Task 1.3 for event system
5. Systematically implement each phase
