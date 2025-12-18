# Option C: True Separation Architecture Refactor Plan

## Vision

Create a clean MVP/MVC separation where:

- **GameController** = Pure business logic (no Phaser, no rendering knowledge)
- **PhaserAdapter** = Complete Phaser rendering layer (responsive to all GameController events)
- **Mobile** = Can use a different renderer without touching GameController

## Current Problems

1. GameLogic still exists and is being used directly for rendering
2. GameController duplicates logic (walls, players, dealing) instead of using GameLogic
3. PhaserAdapter is incomplete - only handles some events
4. Two parallel tile systems (TileData vs Phaser Tile objects)
5. State changes in GameController don't trigger rendering updates

## Architecture Goals

### GameController (Pure Model/Logic Layer)

- Manages game state machine
- Manages player data (hands, exposures, scores)
- Handles game rules (Charleston, courtesy, claims, exposures)
- Emits comprehensive events for ALL state changes
- NO Phaser dependencies
- NO rendering logic
- NO tile creation/management (delegates to wall/hand)
- Works with abstract data models only

### PhaserAdapter (Complete View/Presenter Layer)

- Subscribes to ALL GameController events
- Creates/destroys Phaser visual objects
- Handles ALL animations (deal, discard, tile draw, exposures, etc.)
- Manages UI state (buttons, dialogs, panels)
- Passes user input back to GameController via callbacks
- Can be completely replaced for mobile/web without touching GameController

### GameLogic (DEPRECATED - Phase Out)

- Will be removed entirely
- Its functionality either goes into GameController or PhaserAdapter
- Currently holds Phaser tile objects, animations, UI state

## Detailed Implementation Plan

### Phase 1: Extend GameController to Be Complete

**Goal: GameController becomes the single source of truth**

1.1 Move player/hand management into GameController

- GameController.players should manage actual hand data
- Should emit HAND_UPDATED events whenever hands change
- Should track exposures, selections, etc.

1.2 Create comprehensive event system

- For EVERY state change → emit STATE_CHANGED
- For EVERY UI interaction needed → emit UI_PROMPT
- For EVERY animation → emit corresponding event with timing info
- Example: TILE_DISCARDED should include {player, tile, sourcePosition, targetPosition, animation: "slide-to-center", duration: 500}

1.3 Make GameController deal with Phaser Tiles directly

- Accept sharedTable in init()
- Use actual Phaser Tile objects from wall
- When dealing, GameController just pops tiles and assigns them, PhaserAdapter handles animation

1.4 Implement all game flows in GameController

- Charleston phase logic
- Courtesy pass logic
- Claim discard logic
- Exposure logic
- Main game loop

### Phase 2: Complete PhaserAdapter Implementation

**Goal: PhaserAdapter is responsible for ALL rendering**

2.1 Implement animation/render handlers for EVERY event

- STATE_CHANGED: update button visibility
- TILE_DRAWN: animate tile from wall to hand
- TILE_DISCARDED: animate tile to discard pile
- TILES_EXPOSED: animate tiles to exposure area
- CHARLESTON_PHASE: show Charleston UI
- etc.

2.2 Create hand/tile UI management

- Tile selection (raise to position 575)
- Tile drag-drop reordering
- Hand display updates
- Sort button functionality

2.3 Create prompt/dialog management

- Handle UI_PROMPT events
- Show/hide buttons, input fields
- Convert user interactions to GameController callback responses

2.4 Create complete animation library

- Deal sequence (staggered tiles from wall)
- Tile draw (wall → hand)
- Tile discard (hand → center pile with glow)
- Exposure animations (tiles to top)
- Pung/Kong/Quint formations
- Charleston pass animations
- Courtesy pass animations

### Phase 3: Remove GameLogic Completely

**Goal: Clean codebase with no duplication**

3.1 Identify what's only in GameLogic

- HintAnimationManager
- Some utility methods
- UI management logic

3.2 Move/refactor into appropriate places

- Hints → Keep in PhaserAdapter or new HintManager
- Utilities → Utility functions
- UI state → PhaserAdapter

3.3 Delete gameLogic.js and related files

### Phase 4: Create Mobile Renderer

**Goal: Prove separation works with alternative renderer**

4.1 Create MobileRenderer that implements GameController listener interface
4.2 Handles touch input, mobile layouts
4.3 No Phaser dependency
4.4 Same GameController works for both

## Implementation Order (Most to Least Critical)

### Must Do First

1. **Fix wall synchronization** - GameController must work with actual Phaser tiles
2. **Extend GameController events** - Must emit events that include animation data
3. **Implement core PhaserAdapter handlers** - Deal, discard, tile drawn animations
4. **Wire UI interactions** - Buttons, selections, prompts

### Can Do After Core Works

1. Complete animation library
2. Charleston/Courtesy UI
3. Exposure animations
4. Remove GameLogic dependencies

### Nice to Have

1. Mobile renderer proof of concept
2. Performance optimizations
3. Better event typing/structure

## Key Design Decisions

**Events should include:**

- What changed (tile, player, state)
- Why it changed (user action, AI decision, rules)
- Animation parameters (from/to positions, duration, easing)
- Optional data (tile data, player info, etc.)

**PhaserAdapter should:**

- Never modify GameController state directly
- Only communicate via callbacks passed in events
- Be stateless about game rules (only knows Phaser)
- React to ALL events, not polling state

**GameController should:**

- Work with abstract player/hand/tile models
- Emit events that are renderer-agnostic
- Accept callbacks for user input
- Never import Phaser

## Success Criteria

- [ ] GameController has zero Phaser imports
- [ ] PhaserAdapter handles 100% of Phaser rendering
- [ ] GameLogic file is deleted
- [ ] All animations work smoothly
- [ ] Mobile renderer can be created without modifying GameController
- [ ] Code is properly tested
