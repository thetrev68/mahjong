# Phase 2: Complete PhaserAdapter Implementation

## Overview

After Phase 1 (GameController is complete), Phase 2 makes PhaserAdapter the complete rendering layer that handles 100% of Phaser visualization and UI.

## Current State

- PhaserAdapter exists but is stubbed/incomplete
- Only handles some events (basic stub implementations)
- No animation handling
- No comprehensive UI state management
- No dialog/prompt system
- Relies on GameLogic.updateUI() as a band-aid

## Desired End State

- PhaserAdapter is the ONLY layer that touches Phaser
- Handles every GameController event with full rendering
- Complete animation library
- Full UI/button/dialog management
- User input converted to GameController callbacks
- No references to GameLogic except for data access

## Architecture

```
GameController (emits events)
       ↓
  GameEvents
       ↓
PhaserAdapter (subscribes to all events)
       ├─> Creates Phaser Tiles/Sprites
       ├─> Manages Animations (Tweens)
       ├─> Updates UI State (buttons, text)
       ├─> Shows Dialogs (Charleston, claim, etc)
       └─> Handles User Input (callbacks to GameController)
```

## Tasks

### Task 2.1: Create Animation Library

**Goal**: Centralized, reusable animation functions

**Create**: `desktop/animations/AnimationLibrary.js`

**Animations to Implement**:

```javascript
// Tile animations
animateTileDeal(tile, fromPos, toPos, duration, callback);
animateTileSlide(tile, fromPos, toPos, duration, callback);
animateTileFlip(tile, duration, callback);
animateTilesIntoFormation(tiles, centerPos, duration, callback);

// Group animations
animateCharlestonPass(tiles, fromPlayer, toPlayer, duration, callback);
animateCourtesyPass(tiles, fromPlayer, toPlayer, duration, callback);
animateExposureTiles(tiles, exposureType, duration, callback);

// Effects
applyGlowEffect(sprite, color, duration);
removeGlowEffect(sprite);
flashTile(tile, color, duration);
```

**Each animation**:

- Takes animation parameters from event data
- Returns a Promise that resolves when complete
- Can be cancelled/interrupted
- Handles sprite position, rotation, alpha, effects

**Testing**:

- Import library in PhaserAdapter
- Call animations with test data
- Verify Phaser tweens are created
- Verify callbacks fire correctly

**Output**: Reusable animation library

---

### Task 2.2: Implement Tile/Hand Management

**Goal**: PhaserAdapter manages all tile sprites and hand displays

**Create**: `desktop/managers/TileManager.js`

**Responsibilities**:

- Create/destroy tile sprites
- Track tile positions
- Handle hand layout (bottom, left, top, right)
- Manage tile depth/z-ordering
- Update exposures display

**Methods**:

```javascript
createTileSprite(tileData) → Phaser Sprite
destroyTileSprite(tileData)
getTileSprite(tileData) → Sprite
updateHandDisplay(player, hand)
updateExposuresDisplay(player, exposures)
getTileScreenPosition(player, index) → {x, y}
```

**Integration with PhaserAdapter**:

- PhaserAdapter uses TileManager to create/update tile visuals
- OnTileDrawn → TileManager.createTileSprite()
- OnHandUpdated → TileManager.updateHandDisplay()
- OnTilesExposed → TileManager.updateExposuresDisplay()

**Testing**:

- Tiles appear in correct hand positions
- Exposures display correctly
- Tile selection highlights work
- Drag/drop works with TileManager tracking

**Output**: Tile/hand management system

---

### Task 2.3: Implement State-Based Button Management

**Goal**: Buttons show/hide based on game state with proper event handlers

**Create**: `desktop/managers/ButtonManager.js`

**Responsibilities**:

- Update button visibility based on state
- Set button text based on context
- Enable/disable buttons based on conditions
- Wire button clicks to GameController callbacks

**Button Definitions by State**:

```javascript
const BUTTON_CONFIG = {
  [STATE.START]: {
    show: ["start", "settings"],
    hide: ["button1", "button2", "button3", "button4", "sort1", "sort2"],
  },
  [STATE.DEAL]: {
    show: ["sort1", "sort2"],
    hide: ["button1", "button2", "button3", "button4"],
  },
  [STATE.CHARLESTON1]: {
    show: ["button1"],
    text: { button1: "Pass Tiles" },
    disabled: { button1: true },
  },
  [STATE.CHARLESTON_QUERY]: {
    show: ["button1", "button2"],
    text: { button1: "No", button2: "Yes" },
  },
  [STATE.LOOP_CHOOSE_DISCARD]: {
    show: ["button1", "button2", "button3", "sort1", "sort2"],
    text: {
      button1: "Discard",
      button2: "Exchange Joker",
      button3: "Mahjong!",
    },
    disabled: { button1: true, button2: true },
  },
  // ... etc for other states
};
```

**Integration**:

- OnStateChanged → ButtonManager.updateForState(newState)
- Button clicks → Call GameController callback

**Testing**:

- Start game → see correct buttons
- Transition between states → buttons update
- Button clicks trigger correct actions
- Disabled buttons don't trigger

**Output**: State-based button management

---

### Task 2.4: Implement Hand Selection & Interaction

**Goal**: Players can select, deselect, and drag tiles in their hand

**Extends**: TileManager

**Features**:

- Click tile → select/deselect (raise to position 575)
- Drag tile → reorder in hand
- Double-click → quick action (context-dependent)
- Show selection feedback (highlighting, animation)

**Methods**:

```javascript
selectTile(tile, callback)
deselectTile(tile, callback)
isSelectedTile(tile) → boolean
getSelectedTiles() → [tiles]
resetSelection()
enableTileDragForPlayer(playerIndex)
disableTileDragForPlayer(playerIndex)
```

**Integration with GameController**:

- When tile is selected → call UI callback
- Drag reorder → don't call GameController yet
- Discard button click → pass selected tile to GameController.chooseDiscard()

**Testing**:

- Can select/deselect tiles
- Tiles raise when selected
- Can drag reorder
- Selection clears when needed

**Output**: Full tile interaction system

---

### Task 2.5: Implement Dialog/Prompt System

**Goal**: Display all game dialogs (claim, expose, pass selection, etc)

**Create**: `desktop/managers/DialogManager.js`

**Dialogs to Implement**:

```javascript
showYesNoDialog(question, onYes, onNo)
showCharleston PassDialog(player, callback)  // Select 3 tiles to pass
showExposureDialog(options, callback)        // Choose pung/kong/quint
showClaimDialog(options, callback)           // Claim/don't claim
showCourtesyVoteDialog(options, callback)    // Choose 0-3 tiles
```

**Features**:

- Modal overlay with question/options
- Disable game interaction while dialog open
- Callback on user selection
- Handle cancel/exit

**Integration**:

- OnUIPrompt event → DialogManager shows appropriate dialog
- Dialog callback → GameController receives response

**Testing**:

- Dialog appears with correct content
- Selection triggers callback
- Cannot interact with game while dialog open
- Dialog closes correctly

**Output**: Dialog/prompt system

---

### Task 2.6: Implement Event Handlers for Game Flow

**Goal**: Handle ALL GameController events with proper rendering

**Update**: `desktop/adapters/PhaserAdapter.js`

**Event Handlers to Implement**:

```javascript
// State & Initialization
onStateChanged(data); // Update UI, buttons, state
onGameStarted(data); // Show game board, setup
onGameEnded(data); // Show results, cleanup

// Dealing
onTilesDealt(data); // Update wall counter
onTileDrawn(data); // Animate tile from wall to hand

// Main Loop
onTileDiscarded(data); // Animate to discard pile + play sound
onTurnChanged(data); // Highlight current player
onDiscardClaimed(data); // Show claim animation
onTilesExposed(data); // Animate tiles to exposure area

// Charleston
onCharlestonPhase(data); // Show Charleston UI
onCharlestonPass(data); // Animate pass animation + update hands

// Courtesy
onCourtesyVote(data); // Record vote visually
onCourtesyPass(data); // Animate courtesy pass

// Messages & Prompts
onMessage(data); // Log to message panel
onUIPrompt(data); // Show dialog/prompt

// Hints
onHintUpdate(data); // Update hint panel
```

**Each Handler**:

- Uses AnimationLibrary for animations
- Uses TileManager for tile updates
- Uses ButtonManager for UI updates
- Uses DialogManager for prompts
- Calls appropriate callbacks

**Testing**:

- Play through full game
- Each event triggers correct rendering
- Animations complete before next action
- UI stays in sync with game state

**Output**: Complete event handling

---

### Task 2.7: Implement Hand Sorting

**Goal**: Sort buttons work through PhaserAdapter

**Features**:

- "Sort by Suit" button updates hand display
- "Sort by Rank" button updates hand display
- Animations show tiles reordering
- Works during LOOP_CHOOSE_DISCARD state

**Implementation**:

- ButtonManager wires sort buttons to callbacks
- Callbacks call GameController methods or TileManager methods
- TileManager.sortTiles() reorganizes display

**Testing**:

- Click sort buttons
- Hand reorganizes with animation
- Sorting works correctly

**Output**: Functional sort buttons

---

### Task 2.8: Implement Audio Integration

**Goal**: Play audio at correct times via PhaserAdapter

**Features**:

- Play tile_dropping when tile hits discard pile
- Play rack_tile when tile is placed in hand
- Play other effects as needed
- Respect audio settings

**Implementation**:

- PhaserAdapter has access to this.scene.audioManager
- Animation callbacks trigger audio
- DialogManager plays sounds for open/close

**Testing**:

- Audio plays at correct times
- No errors in audio system
- Volume settings respected

**Output**: Audio working in game flow

---

### Task 2.9: Remove GameLogic Dependency from PhaserAdapter

**Goal**: PhaserAdapter doesn't call gameLogic.updateUI()

**Current State**:

```javascript
onStateChanged(data) {
    this.gameLogic.state = newState;
    this.gameLogic.updateUI();  // ← REMOVE THIS
}
```

**Changes**:

1. Remove all gameLogic.updateUI() calls
2. Replace with ButtonManager.updateForState()
3. Remove all gameLogic.state assignments
4. Ensure all UI updates go through PhaserAdapter managers

**Testing**:

- Game still works without gameLogic.updateUI()
- All UI updates happen correctly

**Output**: PhaserAdapter is independent

---

## Phase 2 Completion Criteria

- [ ] AnimationLibrary created and working
- [ ] TileManager handles all tile rendering
- [ ] ButtonManager handles all button state
- [ ] Hand selection and interaction working
- [ ] DialogManager displays all prompts
- [ ] All GameController events have handlers
- [ ] Sorting buttons work
- [ ] Audio integration complete
- [ ] No gameLogic.updateUI() calls in PhaserAdapter
- [ ] Deal phase animates correctly
- [ ] Charleston phase works with proper UI
- [ ] Courtesy phase works with proper UI
- [ ] Main loop works with all animations
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Manual gameplay testing passes all scenarios

## Next Phase

Once Phase 2 is complete, move to [Phase 3](REFACTOR_PHASE3.md) to remove GameLogic entirely.

## Notes

- This phase is about replacing GameLogic functionality with PhaserAdapter
- Focus on making all animations smooth and UI responsive
- Add visual feedback for all user actions
- Test each event handler independently before integration testing
