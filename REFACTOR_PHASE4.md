# Phase 4: Create Mobile Renderer (Proof of Concept)

## Overview

After Phases 1-3 are complete, Phase 4 creates a non-Phaser renderer that listens to the same GameController events, proving the separation works for multiple platforms.

This is **NOT** a full mobile implementation, but rather a proof of concept showing that GameController is truly platform-agnostic.

## Current State

- GameController is complete and pure logic
- PhaserAdapter is complete Phaser rendering
- GameLogic is deleted

## Goal

Create a minimal mobile renderer that:
- Listens to same GameController events as PhaserAdapter
- Renders to a simple HTML/CSS UI (not Phaser)
- Demonstrates that GameController works for multiple platforms
- Shows that alternative renderers can be built without modifying GameController

## Architecture

```
GameController (unchanged)
       ↓
   Events
       ↓
   ┌─────┬──────────────┐
   ↓     ↓              ↓
PhaserAdapter  MobileRenderer  (Future renderers)
(Desktop)      (Mobile)
```

## Tasks

### Task 4.1: Create MobileRenderer Base Structure

**Goal**: Skeleton renderer that listens to GameController events

**Create**: `mobile/renderers/MobileRenderer.js`

**Structure**:
```javascript
class MobileRenderer {
  constructor(gameController, container) {
    this.gameController = gameController;
    this.container = container;  // HTML element
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Subscribe to all GameController events
    // (same as PhaserAdapter)
  }

  // Event handlers
  onStateChanged(data) { }
  onGameStarted(data) { }
  onTileDrawn(data) { }
  onTileDiscarded(data) { }
  // ... etc
}
```

**Features**:
- Subscribes to all GameController events
- Has stubs for all event handlers
- Can be initialized in test harness

**Testing**:
- Create simple HTML page with MobileRenderer
- Verify event listeners are registered
- Verify no errors on initialization

**Output**: MobileRenderer skeleton

---

### Task 4.2: Implement Charleston Phase UI

**Goal**: First playable phase in mobile renderer

**Why Charleston**:
- Smaller scope than full game
- Good demonstration of interactivity
- Shows dialog/prompt system

**Implementation**:
1. Create HTML structure for Charleston phase
2. Implement event handlers:
   - onStateChanged → Update UI for Charleston state
   - onCharlestonPhase → Show Charleston interface
   - onUIPrompt → Show tile selection UI
   - onCharlestonPass → Update hand display after pass

3. Implement user interaction:
   - Tile selection (click to toggle)
   - "Pass" button to confirm selection
   - Display current selected tiles

4. Send callbacks to GameController:
   - When user selects tiles → notify GameController
   - When user clicks pass → confirm selection

**HTML Structure**:
```html
<div id="mobile-container">
  <div id="phase-info">Charleston Phase 1: Select 3 tiles to pass</div>
  <div id="player-hand">
    <div class="tile" data-index="0">C1</div>
    <div class="tile" data-index="1">C2</div>
    <!-- ... -->
  </div>
  <div id="selected-tiles">Selected: 0</div>
  <button id="pass-btn">Pass Tiles</button>
</div>
```

**CSS**:
- Simple layout, no animations needed
- Tiles as clickable elements
- Show selected state

**Testing**:
- Start game
- Reach Charleston phase
- Can select 3 tiles
- Can pass and move to next phase
- Hand updates correctly

**Output**: Working Charleston UI in MobileRenderer

---

### Task 4.3: Implement Main Loop Phase (Simplified)

**Goal**: Extend MobileRenderer to handle basic main loop

**Features**:
1. Display current player
2. Show player's hand
3. Show discard pile
4. Handle discard selection
5. Handle claim dialog

**Handlers**:
- onTileDrawn → Add to hand display
- onTileDiscarded → Show in discard pile
- onTurnChanged → Update current player highlight
- onUIPrompt → Show dialogs (discard selection, claim?)

**Implementation**:
```html
<div id="game-phase">
  <div id="current-player">Player 0's Turn</div>
  <div id="player-hand"><!-- tiles --></div>
  <div id="discard-pile">
    <div class="discard-tile">C5</div>
    <!-- ... -->
  </div>
  <div id="action-area">
    <!-- dialogs appear here -->
  </div>
</div>
```

**Testing**:
- Play through several turns
- Can discard tiles
- Can claim discards
- Hand updates
- Discard pile updates
- Turns cycle correctly

**Output**: Simplified main loop UI

---

### Task 4.4: Document Mobile Renderer Pattern

**Goal**: Show how to create a new renderer

**Create**: `MOBILE_RENDERER_PATTERN.md`

**Contents**:
1. How to subscribe to GameController events
2. How to convert events to UI updates
3. How to convert user input to GameController callbacks
4. Key event structure
5. Common patterns (dialogs, lists, updates)
6. Best practices

**Example**:
```javascript
// Subscribe to an event
gameController.on("TILE_DRAWN", (data) => {
  const {player, tile, animation} = data;

  // Update your UI
  updatePlayerHand(player, tile);

  // If animation data provided, use it
  if (animation) {
    playAnimation(animation);
  }
});

// User action → GameController callback
userSelectsTile(tile, () => {
  // User selected a tile
  // Notify GameController via callback in event
  // or call method on GameController
  gameController.selectTile(tile);
});
```

**Output**: Documentation for creating renderers

---

### Task 4.5: Create Test Harness

**Goal**: Easy way to test MobileRenderer without full game

**Create**: `mobile/test-harness.html`

**Features**:
- Initialize GameController
- Initialize MobileRenderer
- Buttons to trigger key events
- Debug logging of all events/callbacks
- Manual game progression

**Usage**:
```
Open test-harness.html in browser
→ See MobileRenderer initialized
→ Click "Start Game" button
→ Game progresses through phases
→ Can interact with UI
```

**Testing**:
- Open test-harness.html
- Verify MobileRenderer loads
- Click through phases
- Verify interactions work

**Output**: Working test harness

---

## Phase 4 Completion Criteria

- [ ] MobileRenderer base structure created
- [ ] Charleston phase UI working
- [ ] Main loop phase UI working (simplified)
- [ ] User interactions trigger GameController callbacks
- [ ] GameController events update mobile UI
- [ ] Mobile renderer pattern documented
- [ ] Test harness created and working
- [ ] Game can be played through multiple phases in mobile view
- [ ] No modification to GameController needed for mobile

## Success Indicator

When you can:
1. Open desktop Phaser version → play game with animations
2. Open mobile HTML version → play same game without Phaser
3. Both use the SAME GameController code

**Then you have proven Option C works.**

## Notes

- This is a proof of concept, not production code
- Focus on showing the architecture works
- Don't worry about mobile responsiveness/styling
- The point is to demonstrate GameController is truly platform-agnostic
- This unblocks future mobile development

## Future Mobile Development

Once this POC is proven:
1. Extend MobileRenderer to full game support
2. Add proper mobile styling/responsiveness
3. Add touch gestures (swipe to select, etc.)
4. Build as actual mobile app (React Native, Flutter, etc.)
5. All without modifying GameController

