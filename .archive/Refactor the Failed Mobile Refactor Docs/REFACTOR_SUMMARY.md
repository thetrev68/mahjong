# Refactor Summary: Option C - True Separation

## What's Being Done

Converting the mahjong game from a hybrid architecture (broken GameLogic + incomplete GameController + incomplete PhaserAdapter) to a clean Option C separation:

- **GameController** = Pure business logic, no rendering
- **PhaserAdapter** = Complete Phaser rendering layer
- **Mobile Renderer** = Future non-Phaser alternative renderer

## Why This Matters

**Current Problems**:

- GameLogic and GameController duplicate functionality
- PhaserAdapter is incomplete (band-aid with gameLogic.updateUI() calls)
- Hard to understand which layer does what
- Breaking: tiles don't animate, buttons don't work, audio plays at wrong time
- Can't build mobile version without massive code duplication

**After Refactor**:

- Single source of truth for game logic
- All rendering centralized in one place
- Clear responsibility boundaries
- Easy to add new renderers
- Clean, maintainable codebase

## What Gets Refactored

### Removed/Moved

| Code                   | Current Location | Future                     |
| ---------------------- | ---------------- | -------------------------- |
| GameLogic.js           | gameLogic.js     | **DELETED**                |
| GameLogic.deal()       | gameLogic.js     | Move to GameController     |
| GameLogic.charleston() | gameLogic.js     | Move to GameController     |
| GameLogic.loop()       | gameLogic.js     | Move to GameController     |
| GameLogic.updateUI()   | gameLogic.js     | Move to PhaserAdapter      |
| Game state management  | GameLogic        | **Move to GameController** |

### Kept/Enhanced

| Code                              | Current Location | Future                                                        |
| --------------------------------- | ---------------- | ------------------------------------------------------------- |
| Tile, Hand, Table, Player classes | gameObjects\*.js | **Keep, use from GameController**                             |
| AI Engine                         | core/AIEngine.js | **Keep, use from GameController** (refactored from gameAI.js) |
| Card validation                   | card/            | **Keep, use from GameController**                             |

### Created/Enhanced

| Code                      | Location                          | Purpose                             |
| ------------------------- | --------------------------------- | ----------------------------------- |
| GameController (enhanced) | core/GameController.js            | **Complete game engine**            |
| PhaserAdapter (enhanced)  | desktop/adapters/PhaserAdapter.js | **Complete rendering layer**        |
| AnimationLibrary          | desktop/animations/               | **NEW: Reusable animations**        |
| TileManager               | desktop/managers/                 | **NEW: Tile sprite management**     |
| ButtonManager             | desktop/managers/                 | **NEW: Button state management**    |
| DialogManager             | desktop/managers/                 | **NEW: Dialog/prompt system**       |
| MobileRenderer            | mobile/renderers/                 | **NEW: Mobile non-Phaser renderer** |

## Four Phases

### Phase 1: Extend GameController (2-3 days)

**Goal**: GameController becomes self-contained game engine

- [ ] Fix wall synchronization (remove WallDataWrapper hack)
- [ ] Create rich event system with animation parameters
- [ ] Implement GameController.deal()
- [ ] Implement GameController Charleston phase
- [ ] Implement GameController courtesy phase
- [ ] Implement GameController main loop

**Success**: Game flows through all phases with events, no animations yet

### Phase 2: Complete PhaserAdapter (3-4 days)

**Goal**: PhaserAdapter handles 100% of rendering

- [ ] Create animation library
- [ ] Create tile/hand management
- [ ] Create button state management
- [ ] Create hand selection/interaction
- [ ] Create dialog system
- [ ] Implement all event handlers
- [ ] Remove gameLogic.updateUI() dependency

**Success**: Full game plays with all animations and UI working

### Phase 3: Remove GameLogic (1 day)

**Goal**: Delete obsolete code

- [ ] Identify any unique GameLogic code
- [ ] Delete gameLogic.js
- [ ] Remove all GameLogic references
- [ ] Update GameScene initialization

**Success**: Clean codebase, no GameLogic

### Phase 4: Mobile Renderer POC (2-3 days)

**Goal**: Prove separation works for multiple platforms

- [ ] Create MobileRenderer base
- [ ] Implement Charleston phase in HTML/CSS
- [ ] Implement simplified main loop
- [ ] Create test harness
- [ ] Document renderer pattern

**Success**: Can play game in both Phaser and HTML without modifying GameController

## Key Deliverables

### Code Changes

- GameController: ~500 lines of new logic from GameLogic
- PhaserAdapter: ~800 lines of rendering handlers
- AnimationLibrary: ~300 lines of animation functions
- TileManager, ButtonManager, DialogManager: ~600 lines combined
- MobileRenderer: ~400 lines (proof of concept)

### Documentation

- REFACTOR.md (this orchestration document)
- REFACTOR_PHASE1.md (detailed Phase 1 tasks)
- REFACTOR_PHASE2.md (detailed Phase 2 tasks)
- REFACTOR_PHASE3.md (detailed Phase 3 tasks)
- REFACTOR_PHASE4.md (detailed Phase 4 tasks)
- MOBILE_RENDERER_PATTERN.md (how to create renderers)

### Testing Artifacts

- test-harness.html (mobile renderer testing)
- Updated unit tests
- Manual testing scenarios

## How to Use These Documents

1. **Read REFACTOR.md** (this file) - understand the vision
2. **Start with REFACTOR_PHASE1.md** - follow tasks in order
3. **Each phase document has subtasks** - follow them sequentially
4. **After each phase, run tests** - verify nothing broke
5. **Document progress** - update completion criteria as you go

## Timeline

- Phase 1: 2-3 working days
- Phase 2: 3-4 working days
- Phase 3: 1 working day
- Phase 4: 2-3 working days
- **Total**: ~1-2 weeks of focused work

## Success Criteria

When complete, you should be able to:

- ✅ Play full game with all animations
- ✅ All buttons work in correct states
- ✅ All audio plays at correct times
- ✅ Sort buttons work
- ✅ Tile selection and discard works
- ✅ Charleston and courtesy phases complete
- ✅ Main loop plays to completion
- ✅ Open alternative mobile renderer and play without modifying GameController
- ✅ Code is clean and maintainable
- ✅ All tests pass

## Next Steps

1. Review these documents to understand the vision
2. Create a new branch: `refactor/option-c`
3. Start with [REFACTOR_PHASE1.md](REFACTOR_PHASE1.md) Task 1.1
4. Work through phases sequentially
5. After each phase, test thoroughly
6. Update documentation as you discover things

## Questions to Consider

As you work through the refactor:

1. **Event Structure**: Are the events rich enough for rendering?
2. **Error Handling**: How should errors be communicated?
3. **Performance**: Are there any performance concerns?
4. **Testing**: What tests are needed to verify separation?
5. **Documentation**: Are architectural decisions clear?

## Notes

- This is a significant refactor, but worth doing right
- Take your time understanding each phase before implementing
- Test thoroughly after each phase
- Document any deviations from the plan
- Consider code reviews at phase boundaries
- Don't skip steps - phases build on each other

---

**Start Date**: [Today]
**Status**: Ready to begin Phase 1

Good luck! This refactor will result in a much cleaner, more maintainable codebase.
