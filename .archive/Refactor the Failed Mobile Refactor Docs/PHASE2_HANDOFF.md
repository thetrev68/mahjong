# Phase 2 Handoff: PhaserAdapter Implementation

## Current Status

✅ **Phase 1 is COMPLETE**

GameController is now a fully functional, self-contained game engine that:

- Manages all 4 game phases (deal, charleston, courtesy, main loop)
- Emits rich events with animation parameters
- Has zero Phaser/GameLogic dependencies
- Works with AIEngine for all AI decisions
- Is fully tested and builds successfully

**Branch**: `refactor/option-c`
**Last Commit**: c9fe1ca (docs: Update phase documents for AIEngine refactoring)
**Tests**: ✅ `npm run lint` PASS | ✅ `npm run build` PASS

---

## What You're Building: Phase 2

**Goal**: Implement PhaserAdapter to consume GameController events and render the complete game with animations, UI, and user interactions.

**Key Principle**: PhaserAdapter subscribes to GameController events and handles ALL rendering and UI. GameController never calls PhaserAdapter; only events flow from GameController → PhaserAdapter.

---

## Current Architecture

```
GameController (core/GameController.js)
    ↓ (Events only - no direct calls)
PhaserAdapter (desktop/adapters/PhaserAdapter.js)
    ↓ (Uses for rendering)
Phaser Scene & Managers
    ├─ TileManager (sprites, positioning)
    ├─ ButtonManager (state-based buttons)
    ├─ DialogManager (prompts, selections)
    └─ AnimationLibrary (tile movements)
```

---

## Phase 2 Tasks Overview

### Task 2.1: Create Animation Library

**File**: `desktop/animations/AnimationLibrary.js`

Implement reusable animations that PhaserAdapter can call:

- `animateTileDeal()` - Tile slides from wall to hand
- `animateTileDiscard()` - Tile slides from hand to center
- `animateTilePass()` - Tile passes between players (Charleston/courtesy)
- `animateTileReceive()` - Tile arrives to player (glow effect)
- `animateExposure()` - Tiles move to exposure area
- `animateClaimAnimation()` - Visual feedback for claiming

Each animation should:

- Take animation data from GameController event
- Use Phaser tweens
- Include optional audio callbacks
- Return a Promise for sequencing

---

### Task 2.2: Implement TileManager

**File**: `desktop/managers/TileManager.js`

Manage all tile sprites on the game board:

- Create/destroy tile sprites
- Position tiles for each player (hand, exposures)
- Handle tile layout for all 4 positions (bottom, right, top, left)
- Implement tile selection/deselection
- Implement drag-drop for hand reordering
- Sync sprite positions with game state

---

### Task 2.3: Implement ButtonManager

**File**: `desktop/managers/ButtonManager.js`

State-based button visibility and interaction:

- Create buttons based on current game state (STATE enum)
- Show/hide buttons per state (e.g., Charleston pass button only during CHARLESTON1)
- Handle button clicks → call GameController callbacks
- Manage disabled/enabled states

Buttons to manage:

- Start Game, Next, Pass (Charleston)
- Continue Charleston (yes/no)
- Courtesy Vote (0/1/2/3)
- Claim Discard (mahjong/pung/kong/pass)
- Sort buttons (suit, number, etc)

---

### Task 2.4: Implement Hand Selection & Interaction

**File**: Extend TileManager

Handle player interactions with their hand:

- Click tile to select (raise it up, highlight)
- Drag tile to reorder within hand
- Select tiles for Charleston pass (3 tiles, visual feedback)
- Select tiles for courtesy pass (1-3 tiles, visual feedback)
- Select tile to discard (click → move to discard pile)

---

### Task 2.5: Implement DialogManager

**File**: `desktop/managers/DialogManager.js`

Handle all UI prompts and selections:

- Yes/No dialogs (continue Charleston, etc.)
- Pass tile selection (Charleston/courtesy)
- Claim options (mahjong/pung/kong/pass)
- Courtesy vote (0/1/2/3 tiles)
- Exposure selection
- Game end messages

Each dialog should:

- Modal overlay
- Return Promise with user selection
- Call GameController callback with result

---

### Task 2.6: Implement PhaserAdapter Event Handlers

**File**: `desktop/adapters/PhaserAdapter.js`

Subscribe to GameController events and render:

**State Events**:

- `STATE_CHANGED` → Update ButtonManager visible buttons
- `GAME_STARTED` → Initialize board
- `GAME_ENDED` → Show result, enable restart

**Tile Events**:

- `TILES_DEALT` → Use AnimationLibrary.animateTileDeal()
- `TILE_DRAWN` → Use animateTileDeal() for main loop draws
- `TILE_DISCARDED` → Use AnimationLibrary.animateTileDiscard()
- `TILES_EXPOSED` → Use AnimationLibrary.animateExposure()
- `DISCARD_CLAIMED` → Visual feedback

**Phase Events**:

- `CHARLESTON_PHASE` → Update UI for pass selection
- `CHARLESTON_PASS` → Animate tiles passing
- `COURTESY_VOTE` → Handle vote display
- `COURTESY_PASS` → Animate courtesy exchange

**Turn Events**:

- `TURN_CHANGED` → Update current player highlight
- `HAND_UPDATED` → Update hand display and positions

**UI Events**:

- `UI_PROMPT` → Show dialog via DialogManager, call callback with result
- `MESSAGE` → Display message to player

---

## Key Events to Handle

Review these in [core/events/GameEvents.js](core/events/GameEvents.js):

Each event includes:

- `type`: Event type string
- Game data (player, tile, etc.)
- `animation`: Animation parameters with:
  - `type`: Animation type (deal-slide, discard-slide, etc.)
  - `fromPosition`, `toPosition`: Screen coordinates
  - `duration`: Animation duration in ms
  - `easing`: Phaser easing function name

Example event:

```javascript
{
  type: "TILE_DRAWN",
  player: 0,
  tile: {suit: "CRACK", number: 5},
  animation: {
    type: "deal-slide",
    fromPosition: {x: 640, y: 360},
    toPosition: {x: 450, y: 575},
    duration: 200,
    easing: "Quad.easeOut"
  },
  timestamp: 1731579234567
}
```

---

## Implementation Order

1. **Start**: AnimationLibrary (foundation for all animations)
2. **Then**: TileManager (sprite management)
3. **Then**: ButtonManager (state-based UI)
4. **Then**: DialogManager (prompts and selections)
5. **Then**: PhaserAdapter event handlers (wire it all together)
6. **Finally**: Hand selection/interaction (add polish)

---

## Testing Approach

For each task:

1. Implement the manager/library
2. Wire into PhaserAdapter
3. Test one event type end-to-end
4. Verify animation plays, state updates, game continues

Full game test:

1. Start game → deal phase with animations
2. Charleston phase → select and pass tiles
3. Courtesy phase → vote and exchange
4. Main loop → draw, discard, claim tiles
5. Game end → declare winner

---

## Important Files

### GameController (Read-only, DO NOT MODIFY)

- [core/GameController.js](core/GameController.js) - Game engine (complete, tested)
- [core/events/GameEvents.js](core/events/GameEvents.js) - Event definitions

### Phaser Objects (Read-only, keep unchanged)

- [gameObjects.js](gameObjects.js) - Tile class
- [gameObjects_hand.js](gameObjects_hand.js) - Hand management
- [gameObjects_table.js](gameObjects_table.js) - Table and players
- [gameObjects_player.js](gameObjects_player.js) - Player state

### AIEngine (Read-only)

- [core/AIEngine.js](core/AIEngine.js) - AI decisions (used by GameController)

### Existing PhaserAdapter (Read-only, reference only)

- [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js) - Incomplete, needs full implementation

---

## Common Pitfalls to Avoid

❌ **DON'T**: Call GameController methods from PhaserAdapter
✅ **DO**: Subscribe to events and call GameController via callback

❌ **DON'T**: Create your own game state in PhaserAdapter
✅ **DO**: Mirror GameController state from events

❌ **DON'T**: Skip animation parameters from events
✅ **DO**: Use position, duration, easing from event data

❌ **DON'T**: Modify GameController code
✅ **DO**: Only add event handlers in PhaserAdapter

---

## Success Criteria

✅ Deal phase animates tiles to all players
✅ Charleston phase allows tile selection and passing
✅ Courtesy phase handles voting and exchanges
✅ Main loop (pick, discard, claim, expose) works
✅ All buttons appear/disappear based on game state
✅ Dialogs appear and return user input to GameController
✅ Game flows through all phases without errors
✅ `npm run lint` passes
✅ `npm run build` succeeds
✅ No GameController modifications needed

---

## Handoff Information

**Phase 1 Deliverables**:

- GameController: Complete game engine (930 lines)
- GameEvents: 20+ event builder functions
- AIEngine: Compatible AI system
- Documentation: 3 analysis documents

**What You Have to Work With**:

- Clean event stream from GameController
- Existing Phaser infrastructure
- gameObjects classes for rendering
- AudioManager for sound effects

**What to Create**:

- AnimationLibrary (animations)
- TileManager (sprites)
- ButtonManager (UI state)
- DialogManager (prompts)
- PhaserAdapter event handlers (integration)

---

## References

- [REFACTOR_PHASE2.md](REFACTOR_PHASE2.md) - Detailed Phase 2 requirements
- [REFACTOR_CHECKLIST.md](REFACTOR_CHECKLIST.md) - Full refactor tracking
- [PHASE1_COMPLETION_SUMMARY.md](PHASE1_COMPLETION_SUMMARY.md) - What Phase 1 accomplished
- [AIENGINE_REFACTOR_NOTE.md](AIENGINE_REFACTOR_NOTE.md) - AIEngine integration notes

---

## Ready to Start?

You have everything needed to implement Phase 2:

1. Complete, tested GameController ✅
2. Rich event system with animation data ✅
3. Clear architectural separation ✅
4. Detailed Phase 2 requirements ✅

**Next Step**: Read [REFACTOR_PHASE2.md](REFACTOR_PHASE2.md) for detailed task breakdown, then implement AnimationLibrary first.

**Good luck! Phase 2 is where the game comes alive.** 🎮
