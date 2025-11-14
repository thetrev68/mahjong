# Refactor Checklist - Option C: True Separation

Use this checklist to track progress through all four phases.

## Phase 1: Extend GameController to Be Complete

### Task 1.1: Analyze GameLogic
- [x] Review gameLogic.js methods
- [x] Document all responsibilities
- [x] Identify pure logic vs rendering
- [x] Create REFACTOR_PHASE1_ANALYSIS.md

### Task 1.2: Remove WallDataWrapper & Fix Wall Synchronization
- [x] Remove WallDataWrapper class from GameController.js
- [x] Update GameController.createWall() to use sharedTable
- [x] Fix findTileInWall() for Phaser Tiles
- [x] Update GameController.dealTiles() to use Phaser tiles
- [x] Test: Deal executes without "Creating new tile" warnings
- [x] Test: Tiles appear in hands without errors
- [x] Commit: "refactor: Remove WallDataWrapper, use shared wall directly"

### Task 1.3: Create Rich Event System
- [x] Create core/events/GameEvents.js
- [x] Define event structure with animation parameters
- [x] Update GameController to emit rich events
- [x] Update all event emissions with animation data
- [x] Test: Events contain position, duration, easing data
- [x] Test: PhaserAdapter can read animation data
- [x] Commit: "refactor: Add rich event system with animation parameters"

### Task 1.4: Implement GameController.deal()
- [x] Create GameController.deal() method (delegated to dealTiles)
- [x] Move deal logic from GameLogic
- [x] Implement sequential tile dealing
- [x] Emit DEAL_COMPLETE event (TILES_DEALT)
- [x] Test: Deal phase completes successfully
- [x] Test: All tiles distributed correctly
- [x] Commit: "refactor: Implement phases with rich events"

### Task 1.5: Implement GameController Charleston Phase
- [x] Move Charleston logic from GameLogic
- [x] Create charlestonPhase() method
- [x] Create executeCharlestonPasses() method
- [x] Emit Charleston-specific events
- [x] Wire UI prompts
- [x] Test: Can pass tiles through all directions
- [x] Test: Can choose to continue or end
- [x] Commit: "refactor: Implement phases with rich events"

### Task 1.6: Implement GameController Courtesy Phase
- [x] Move courtesy logic from GameLogic
- [x] Create courtesyPhase() method
- [x] Create courtesy voting
- [x] Emit courtesy events
- [x] Wire UI prompts
- [x] Test: Can vote on tile count
- [x] Test: Courtesy passes work correctly
- [x] Commit: "refactor: Implement phases with rich events"

### Task 1.7: Implement GameController Main Loop
- [x] Move main loop from GameLogic
- [x] Implement pickFromWall()
- [x] Implement chooseDiscard()
- [x] Implement queryClaimDiscard()
- [x] Implement handleDiscardClaim()
- [x] Implement exposeTiles()
- [x] Implement turn cycling
- [x] Emit loop-specific events
- [x] Wire all UI prompts
- [x] Test: Play through multiple turns
- [x] Test: Can discard, claim, expose
- [x] Test: Game flows correctly
- [x] Commit: "refactor: Implement phases with rich events"

### Task 1.8: Remove GameLogic Dependencies
- [x] Search for all GameLogic references in GameController
- [x] Verify only comments reference GameLogic
- [x] Verify GameController is self-contained
- [x] Test: `npm run lint` passes
- [x] Commit: "refactor: Verify GameController has no GameLogic dependencies"

### Task 1.9: Update GameScene
- [x] Remove WallDataWrapper usage
- [x] Clean up GameScene initialization
- [x] Remove stale code from wrapper attempt
- [x] Test: `npm run lint` passes
- [x] Test: Game starts without errors
- [x] Commit: "refactor: Clean GameScene initialization"

### Phase 1 Final Checks
- [x] `npm run lint` passes (no GameController errors)
- [x] `npm run build` succeeds
- [x] Manual test: Deal phase completes (through rich events)
- [x] Manual test: Charleston phase works (implemented with rich events)
- [x] Manual test: Courtesy phase works (implemented with rich events)
- [x] Manual test: Main loop plays multiple turns (implemented with rich events)
- [x] No console errors (build clean)

**Phase 1 Status**: ⬜ Not Started / 🟡 In Progress / ✅ Complete ← HERE

---

## Phase 2: Complete PhaserAdapter Implementation

### Task 2.1: Create Animation Library
- [ ] Create desktop/animations/AnimationLibrary.js
- [ ] Implement tile movement animations
- [ ] Implement group animations
- [ ] Implement effect animations
- [ ] Test: Animations run without errors
- [ ] Commit: "refactor: Create animation library"

### Task 2.2: Implement Tile/Hand Management
- [ ] Create desktop/managers/TileManager.js
- [ ] Implement tile sprite creation/destruction
- [ ] Implement hand layout for all positions
- [ ] Implement exposure display
- [ ] Test: Tiles appear in correct positions
- [ ] Test: Exposures display correctly
- [ ] Commit: "refactor: Create TileManager"

### Task 2.3: Implement State-Based Button Management
- [ ] Create desktop/managers/ButtonManager.js
- [ ] Create button configuration by state
- [ ] Implement updateForState() method
- [ ] Wire button clicks to callbacks
- [ ] Test: Buttons show/hide correctly
- [ ] Test: Button clicks work
- [ ] Commit: "refactor: Create ButtonManager"

### Task 2.4: Implement Hand Selection & Interaction
- [ ] Extend TileManager for selection
- [ ] Implement selectTile() method
- [ ] Implement tile raising on selection
- [ ] Implement drag-drop reordering
- [ ] Test: Can select/deselect tiles
- [ ] Test: Tiles raise when selected
- [ ] Test: Drag reordering works
- [ ] Commit: "refactor: Implement tile selection"

### Task 2.5: Implement Dialog/Prompt System
- [ ] Create desktop/managers/DialogManager.js
- [ ] Implement yes/no dialogs
- [ ] Implement pass selection dialogs
- [ ] Implement exposure selection
- [ ] Implement claim dialogs
- [ ] Implement courtesy vote dialogs
- [ ] Test: Dialogs appear correctly
- [ ] Test: Callbacks fire on selection
- [ ] Commit: "refactor: Create DialogManager"

### Task 2.6: Implement Event Handlers
- [ ] Implement onStateChanged()
- [ ] Implement onGameStarted()
- [ ] Implement onGameEnded()
- [ ] Implement onTilesDealt()
- [ ] Implement onTileDrawn()
- [ ] Implement onTileDiscarded()
- [ ] Implement onTurnChanged()
- [ ] Implement onDiscardClaimed()
- [ ] Implement onTilesExposed()
- [ ] Implement onCharlestonPhase()
- [ ] Implement onCharlestonPass()
- [ ] Implement onCourtesyVote()
- [ ] Implement onCourtesyPass()
- [ ] Implement onMessage()
- [ ] Implement onUIPrompt()
- [ ] Test: All handlers work
- [ ] Test: Full game plays
- [ ] Commit: "refactor: Implement PhaserAdapter event handlers"

### Task 2.7: Implement Hand Sorting
- [ ] Wire sort buttons to callbacks
- [ ] Implement sort animations
- [ ] Test: Sort buttons work
- [ ] Commit: "refactor: Implement hand sorting"

### Task 2.8: Implement Audio Integration
- [ ] Implement audio triggers in animations
- [ ] Test: Audio plays at correct times
- [ ] Commit: "refactor: Integrate audio"

### Task 2.9: Remove GameLogic Dependency
- [ ] Remove gameLogic.updateUI() calls
- [ ] Remove gameLogic.state assignments
- [ ] Update PhaserAdapter constructor
- [ ] Test: `npm run lint` passes
- [ ] Test: Game still works
- [ ] Commit: "refactor: Remove GameLogic dependency from PhaserAdapter"

### Phase 2 Final Checks
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Deal phase animates correctly
- [ ] Charleston phase works with UI
- [ ] Courtesy phase works with UI
- [ ] Main loop plays with all animations
- [ ] All audio plays at correct times
- [ ] Buttons work in all states
- [ ] Manual test: Full game plays end-to-end

**Phase 2 Status**: ⬜ Not Started / 🟡 In Progress / ✅ Complete

---

## Phase 3: Remove GameLogic Completely

### Task 3.1: Identify Unique GameLogic Code
- [ ] Review GameLogic for unique code
- [ ] Identify HintAnimationManager usage
- [ ] Identify utility functions
- [ ] Document code to preserve
- [ ] Create list of code to migrate

### Task 3.2: Move Unique Functionality
- [ ] Move HintAnimationManager (if used)
- [ ] Move utility functions to utils.js
- [ ] Migrate custom logic
- [ ] Test: Moved code still works
- [ ] Commit: "refactor: Migrate GameLogic code"

### Task 3.3: Delete GameLogic Files
- [ ] Delete gameLogic.js
- [ ] Delete GameLogic-specific files
- [ ] Run `npm run lint` to find broken references
- [ ] Fix all references
- [ ] Test: `npm run lint` passes
- [ ] Test: `npm run build` succeeds
- [ ] Commit: "refactor: Delete GameLogic"

### Task 3.4: Update GameScene Initialization
- [ ] Remove gGameLogic references
- [ ] Simplify table creation
- [ ] Test: Game starts without errors
- [ ] Commit: "refactor: Update GameScene initialization"

### Task 3.5: Remove Adapter Band-Aid References
- [ ] Remove gameLogic param from PhaserAdapter
- [ ] Remove remaining gameLogic references
- [ ] Test: `npm run lint` passes
- [ ] Commit: "refactor: Remove adapter band-aid references"

### Task 3.6: Final Cleanup
- [ ] Remove commented-out code
- [ ] Update comments
- [ ] Update CLAUDE.md
- [ ] Update documentation
- [ ] Commit: "refactor: Clean up documentation"

### Phase 3 Final Checks
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Game plays without errors
- [ ] All functionality works
- [ ] No GameLogic references remain

**Phase 3 Status**: ⬜ Not Started / 🟡 In Progress / ✅ Complete

---

## Phase 4: Create Mobile Renderer (POC)

### Task 4.1: Create MobileRenderer Base
- [ ] Create mobile/renderers/MobileRenderer.js
- [ ] Set up event listener structure
- [ ] Create stub event handlers
- [ ] Test: MobileRenderer initializes without errors

### Task 4.2: Implement Charleston Phase UI
- [ ] Create HTML structure for Charleston
- [ ] Implement tile selection
- [ ] Implement pass button
- [ ] Implement event handlers
- [ ] Implement callbacks to GameController
- [ ] Test: Charleston phase playable
- [ ] Commit: "feat: Add mobile Charleston phase"

### Task 4.3: Implement Main Loop (Simplified)
- [ ] Extend HTML for main loop
- [ ] Implement tile draw display
- [ ] Implement discard pile
- [ ] Implement turn display
- [ ] Implement claim dialogs
- [ ] Test: Can play multiple turns
- [ ] Commit: "feat: Add mobile main loop"

### Task 4.4: Document Renderer Pattern
- [ ] Create MOBILE_RENDERER_PATTERN.md
- [ ] Document event subscription
- [ ] Document callback patterns
- [ ] Document best practices
- [ ] Create code examples

### Task 4.5: Create Test Harness
- [ ] Create mobile/test-harness.html
- [ ] Set up GameController initialization
- [ ] Set up MobileRenderer
- [ ] Add event logging
- [ ] Add manual progression buttons
- [ ] Test: Test harness works
- [ ] Commit: "feat: Add mobile test harness"

### Phase 4 Final Checks
- [ ] Mobile renderer can play Charleston phase
- [ ] Mobile renderer can play main loop
- [ ] Same GameController used for both desktop and mobile
- [ ] No modifications to GameController needed for mobile
- [ ] Test harness works
- [ ] Documentation complete

**Phase 4 Status**: ⬜ Not Started / 🟡 In Progress / ✅ Complete

---

## Final Verification

### Code Quality
- [ ] `npm run lint` passes with no warnings
- [ ] `npm run build` succeeds
- [ ] No TODO/FIXME comments left
- [ ] Code is well-commented
- [ ] Architectural decisions documented

### Functionality
- [ ] Deal phase works with animations
- [ ] Charleston phase works with UI
- [ ] Courtesy phase works with UI
- [ ] Main loop plays to completion
- [ ] All buttons work correctly
- [ ] All animations run smoothly
- [ ] All audio plays at correct times
- [ ] Sort buttons work
- [ ] Tile selection works
- [ ] Discard selection works
- [ ] Claim system works
- [ ] Exposure system works

### Testing
- [ ] All unit tests pass
- [ ] Manual play-through successful
- [ ] No console errors
- [ ] Performance acceptable

### Documentation
- [ ] REFACTOR.md complete
- [ ] REFACTOR_PHASE1.md complete
- [ ] REFACTOR_PHASE2.md complete
- [ ] REFACTOR_PHASE3.md complete
- [ ] REFACTOR_PHASE4.md complete
- [ ] CLAUDE.md updated
- [ ] Architecture documented

### Separation of Concerns
- [ ] GameController has zero Phaser imports ✅
- [ ] GameController has zero UI logic ✅
- [ ] PhaserAdapter has zero game rule logic ✅
- [ ] Mobile renderer uses same GameController ✅
- [ ] Clear responsibility boundaries ✅

---

## Overall Status

| Phase | Status | Start Date | End Date |
|-------|--------|-----------|----------|
| 1: GameController | ⬜ | - | - |
| 2: PhaserAdapter | ⬜ | - | - |
| 3: Remove GameLogic | ⬜ | - | - |
| 4: Mobile POC | ⬜ | - | - |
| **TOTAL** | ⬜ | - | - |

---

## Notes & Observations

*(Add notes as you progress through refactor)*

---

**Started**: [Date]
**Completed**: [Date]
**Total Time**: [Duration]

Good luck! This refactor will result in a much cleaner codebase.
