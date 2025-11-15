# Option C: True Separation Architecture Refactor

## Overview

This refactor moves the mahjong game from a messy hybrid architecture (GameLogic + incomplete GameController + incomplete PhaserAdapter) to a clean Option C separation:

- **GameController** = Pure game logic (no Phaser, no rendering)
- **PhaserAdapter** = Complete Phaser rendering layer
- **Mobile** = Can be built independently with a different renderer

This document orchestrates the refactor as a series of discrete, testable phases.

## Why This Matters

Current state is broken because:
1. GameLogic and GameController duplicate functionality
2. PhaserAdapter is incomplete/stubbed
3. Wall synchronization fails
4. Hard to debug/extend (unclear which layer does what)

After refactor:
1. Single source of truth for game logic (GameController)
2. All rendering centralized (PhaserAdapter)
3. Easy to add new renderers (mobile, web, etc.)
4. Clear responsibility boundaries

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        GameScene                             │
│  (Phaser scene initialization & wiring)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
   ┌──────────────┐                      ┌──────────────────┐
   │ GameController│                      │  PhaserAdapter   │
   │              │◄────Events────────────│                  │
   │ Pure Logic   │                       │ Complete Render  │
   │ No Phaser    │     Callbacks ───────►│ All Animations   │
   │ No Graphics  │                       │ All UI Mgmt      │
   └──────────────┘                       └──────────────────┘
        ↓                                         ↓
   GameState                              Phaser Objects
   (Players, Hands,                       (Tiles, Sprites,
    Tiles, Discards,                       Buttons, Text)
    Game Rules)

Future: Mobile renderer would replace PhaserAdapter
```

## Phases

### [Phase 1](REFACTOR_PHASE1.md): Extend GameController to Be Complete
**Goal**: GameController becomes a self-contained game engine

- Move player/hand data management into GameController
- Create comprehensive event system with animation data
- Make GameController work with Phaser tiles from shared wall
- Implement all game state flows (Charleston, courtesy, claims, loop)

### [Phase 2](REFACTOR_PHASE2.md): Complete PhaserAdapter Implementation
**Goal**: PhaserAdapter handles 100% of rendering and UI

- Implement animation/render handlers for every GameController event
- Create hand/tile UI management system
- Create prompt/dialog system
- Create complete animation library

### [Phase 3](REFACTOR_PHASE3.md): Remove GameLogic Completely
**Goal**: Delete obsolete code, clean up dependencies

- Identify unique GameLogic functionality
- Move hints, utilities to appropriate places
- Delete gameLogic.js and related files
- Update GameScene to remove GameLogic

### [Phase 4](REFACTOR_PHASE4.md): Create Mobile Renderer (Proof of Concept)
**Goal**: Prove separation works with alternative renderer

- Create non-Phaser renderer listening to GameController events
- Implement for at least one game phase (Charleston or main loop)
- Demonstrates GameController works for multiple platforms

## Testing Strategy

After each phase:
1. Run `npm run lint` - no errors
2. Run `npm run build` - compiles successfully
3. Run `npm run test` - all tests pass
4. Manual testing:
   - Start game
   - Deal phase animates correctly
   - Buttons work in appropriate states
   - Animations run smoothly

## Key Design Principles

### GameController (Model Layer)
- Manages game state machine
- Holds player data, hands, tile pools
- Enforces game rules
- Emits events for everything that changes
- Events include animation parameters
- Never imports Phaser
- Never directly manipulates UI

### PhaserAdapter (View/Controller Layer)
- Listens to ALL GameController events
- Creates/destroys Phaser objects
- Handles ALL animations and timing
- Manages button state and UI
- Converts user input to GameController callbacks
- Can be completely replaced
- Never manipulates game state directly
- Stateless about game rules

### Events Should Include
```javascript
{
  // What changed
  eventType: "TILE_DISCARDED",

  // Who and what
  player: 0,
  tile: {suit: SUIT.CRACK, number: 5},

  // Animation parameters
  animation: {
    type: "slide-to-center",
    fromPosition: {x: 100, y: 600},
    toPosition: {x: 350, y: 420},
    duration: 300,
    easing: "Power2.easeInOut"
  },

  // Optional callback
  onComplete: () => {}
}
```

## Timeline Estimate

- Phase 1 (GameController): 2-3 days
- Phase 2 (PhaserAdapter): 3-4 days
- Phase 3 (Remove GameLogic): 1 day
- Phase 4 (Mobile Renderer): 2-3 days
- **Total**: 1-2 weeks

## Success Criteria

- [ ] GameController has zero Phaser imports
- [ ] PhaserAdapter handles 100% of rendering
- [ ] All game phases work (deal, charleston, courtesy, main loop)
- [ ] All animations work smoothly
- [ ] Tests pass
- [ ] Code is well-documented
- [ ] Mobile renderer can be created without modifying GameController
- [ ] GameLogic.js is deleted

## Current Status

**Branch**: debug-desktop (or create `refactor/option-c`)
**Starting Point**: Broken wrapper solution that needs fixing

Next: Start with Phase 1
