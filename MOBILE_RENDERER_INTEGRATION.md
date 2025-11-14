# Mobile Renderer Integration Guide

## Overview

This document explains how the mobile renderer integrates with GameController, providing a pattern for building alternative renderers without modifying core game logic.

## Architecture Pattern

```
GameController (Pure Logic)
    ↓ (events)
    └─→ MobileRenderer (HTML/CSS)
        ├─→ HandRenderer
        ├─→ DiscardPile
        ├─→ OpponentBar
        ├─→ AnimationController
        └─→ TouchHandler
```

**Key Principle**: GameController emits events → Renderer listens and updates UI → Zero game logic changes needed.

## GameController Event System

### Event Emission Pattern

GameController uses EventEmitter pattern with:
```javascript
// Emit events
this.emit("EVENT_NAME", eventData);

// Subscribe to events
gameController.on("EVENT_NAME", (data) => {
    // Handle event
});
```

### Core Events by Phase

#### Deal Phase
- `STATE_CHANGED` - Game state machine transitions
- `TILES_DEALT` - Initial hand distribution
- `TILE_DRAWN` - Individual tile drawn from wall
- `HAND_UPDATED` - Player hand changed

#### Charleston Phase
- `CHARLESTON_PHASE` - Phase started (phase 1 or 2)
- `CHARLESTON_PASS` - Tiles passed in direction
- `UI_PROMPT` (promptType: "CHARLESTON_PASS") - Request tile selection
- `UI_PROMPT` (promptType: "CHARLESTON_CONTINUE") - Request phase 2 vote
- `HAND_UPDATED` - Hand updated after pass

#### Courtesy Phase
- `UI_PROMPT` (promptType: "COURTESY_VOTE") - Request tile count vote
- `COURTESY_VOTE` - Vote recorded
- `UI_PROMPT` (promptType: "SELECT_TILES") - Request tile selection for pass
- `COURTESY_PASS` - Tiles passed
- `HAND_UPDATED` - Hand updated after pass

#### Main Loop
- `TURN_CHANGED` - New player's turn
- `TILE_DRAWN` - Player draws from wall
- `UI_PROMPT` (promptType: "CHOOSE_DISCARD") - Request tile selection
- `TILE_DISCARDED` - Tile discarded
- `UI_PROMPT` (promptType: "CLAIM_DISCARD") - Request claim decision
- `DISCARD_CLAIMED` - Tile claimed
- `TILES_EXPOSED` - Tiles exposed (Pung/Kong/Quint)
- `HAND_UPDATED` - Hand updated

#### Game End
- `GAME_ENDED` - Game completed
- `MESSAGE` - Status messages

## UI Prompt System

### How UI_PROMPT Works

GameController calls `promptUI(promptType, options)` which emits:
```javascript
this.emit("UI_PROMPT", {
    promptType: "PROMPT_NAME",
    options: {...},
    callback: (result) => resolve(result)
});
```

The renderer MUST call the callback with the result:
```javascript
gameController.on("UI_PROMPT", (data) => {
    if (data.promptType === "CHOOSE_DISCARD") {
        // Get user input
        const selectedTile = getUserSelection();
        // Call callback to resume game
        data.callback(selectedTile);
    }
});
```

### All UI Prompt Types

#### CHOOSE_DISCARD
- **When**: Player's turn to discard
- **Options**: `{ hand: HandData }`
- **Return**: Single TileData object
- **Example**:
```javascript
// User selects tile by index
const tile = hand.tiles[selectedIndex];
callback(tile);
```

#### CLAIM_DISCARD
- **When**: Another player discarded, this player can claim
- **Options**: `{ tile: TileData, options: ["Mahjong", "Pung", "Kong", "Pass"] }`
- **Return**: String from options array
- **Example**:
```javascript
callback("Pung"); // or "Pass", "Kong", "Mahjong"
```

#### SELECT_TILES
- **When**: Need to select multiple tiles (Charleston, Courtesy, Exposure)
- **Options**: `{ minTiles: number, maxTiles: number }`
- **Return**: Array of TileData objects
- **Example**:
```javascript
const selected = [tile0, tile2, tile5];
callback(selected);
```

#### EXPOSE_TILES
- **When**: Opportunity to expose tiles
- **Options**: None
- **Return**: Boolean (true = expose, false = don't expose)
- **Example**:
```javascript
callback(true); // or false
```

#### CHARLESTON_PASS
- **When**: Charleston phase, need to select tiles to pass
- **Options**: `{ direction: "Right"/"Left"/"Up"/"Down", requiredCount: 3 }`
- **Return**: Array of exactly 3 TileData objects
- **Example**:
```javascript
const toPass = [tile1, tile4, tile8];
callback(toPass);
```

#### CHARLESTON_CONTINUE
- **When**: After phase 1, vote to continue to phase 2
- **Options**: None
- **Return**: String "Yes" or "No"
- **Example**:
```javascript
callback("Yes");
```

#### COURTESY_VOTE
- **When**: Courtesy phase, vote on tile count
- **Options**: None
- **Return**: String "0", "1", "2", or "3"
- **Example**:
```javascript
callback("2");
```

#### YES_NO
- **When**: Generic yes/no question
- **Options**: `{ message: string }`
- **Return**: Boolean (true = yes, false = no)
- **Example**:
```javascript
callback(true);
```

## Mobile Implementation Details

### File Structure
```
mobile/
├── main.js                 # Game initialization and event handlers
├── index.html             # HTML structure
├── renderers/
│   └── HandRenderer.js    # Renders player hand
├── components/
│   ├── OpponentBar.js     # Shows opponent status
│   ├── DiscardPile.js     # Shows discard pile
│   ├── MobileTile.js      # Individual tile component
│   └── ...
├── animations/
│   └── AnimationController.js  # Manages CSS animations
├── gestures/
│   └── TouchHandler.js    # Touch input detection
└── styles/
    └── *.css              # Component styles
```

### Event Subscription Pattern

Each component subscribes to relevant events:

#### HandRenderer
```javascript
// Render tiles when hand updated
gameController.on("HAND_UPDATED", (data) => {
    if (data.player === 0) {
        this.render(data.hand);
    }
});

// Show exposures
gameController.on("TILES_EXPOSED", (data) => {
    if (data.player === 0) {
        this.updateExposures(data.tiles);
    }
});
```

#### OpponentBar
```javascript
// Update opponent display
gameController.on("HAND_UPDATED", (data) => {
    if (data.player === opponentIndex) {
        this.update(playerData);
    }
});

// Highlight current player
gameController.on("TURN_CHANGED", (data) => {
    this.setActive(data.currentPlayer === opponentIndex);
});
```

#### DiscardPile
```javascript
// Add discard
gameController.on("TILE_DISCARDED", (data) => {
    this.addDiscard(data.tile, data.player);
});

// Remove when claimed
gameController.on("DISCARD_CLAIMED", () => {
    this.removeLatest();
});
```

### UI Prompt Handling Pattern

```javascript
gameController.on("UI_PROMPT", (data) => {
    switch (data.promptType) {
        case "CHOOSE_DISCARD":
            const tile = userSelectsFromHand();
            data.callback(tile);
            break;

        case "CLAIM_DISCARD":
            const decision = userChoosesFromOptions();
            data.callback(decision);
            break;

        case "SELECT_TILES":
            const tiles = userSelectsMultiple();
            data.callback(tiles);
            break;

        // ... other prompt types
    }
});
```

## Building a New Renderer

### Step 1: Initialize GameController
```javascript
const gameController = new GameController();
await gameController.init({
    aiEngine: new AIEngine(cardValidator),
    cardValidator: new Card(2025),
    settings: {
        year: 2025,
        difficulty: "medium",
        skipCharleston: false
    }
});
```

### Step 2: Create Visual Components
For each renderer type (desktop, mobile, terminal, etc.):
```javascript
// Each component subscribes to events
const myComponent = new MyCustomComponent(container);
gameController.on("HAND_UPDATED", (data) => {
    myComponent.updateHand(data);
});
```

### Step 3: Implement UI Prompt Handler
```javascript
gameController.on("UI_PROMPT", (data) => {
    // Get user input from your UI system
    const userInput = myUISystem.getUserInput(data.promptType);
    // Provide result to game
    data.callback(userInput);
});
```

### Step 4: Start Game
```javascript
await gameController.startGame();
```

### Step 5: Handle Game Events
Subscribe to any remaining events for game state visualization:
```javascript
gameController.on("STATE_CHANGED", (data) => {
    myUI.updateState(data.newState);
});

gameController.on("GAME_ENDED", () => {
    myUI.showGameOver();
});
```

## Key Design Patterns

### 1. Event-Driven Architecture
- GameController doesn't know about rendering
- Renderers don't modify game logic
- Events are the only communication channel

### 2. Callback-Based User Input
- GameController requests input via UI_PROMPT
- Renderer captures user input
- Renderer calls callback with result
- Game logic resumes with user input

### 3. Component Isolation
- Each component manages its own DOM/UI
- Components subscribe independently to events
- No cross-component dependencies
- Easy to add/remove components

### 4. Data Objects
Key data structures passed in events:
- `TileData`: `{ suit, number }` - immutable tile reference
- `HandData`: `{ tiles: [], exposures: [] }` - player's hand
- `PlayerData`: `{ position, hand, name, tileCount, ... }` - player state

## Testing the Mobile Renderer

### Playing Through Full Game
1. Start browser at `mobile/index.html`
2. Click "NEW GAME"
3. Answer prompts for deal, Charleston, courtesy
4. Play main loop by selecting tiles and claim decisions
5. Game ends with Mahjong or wall game

### Comparing Desktop and Mobile
1. Play on desktop (Phaser) with seed X
2. Play on mobile (HTML) with same seed X
3. Both should:
   - Deal identical tiles
   - Present same Charleston options
   - Present same claim decisions
   - End game same way

## Troubleshooting

### Game Freezes on Prompt
- Check that UI_PROMPT handler calls `data.callback()`
- Verify callback receives correct data type
- Check browser console for errors

### Wrong Tiles Displayed
- Verify HandRenderer is subscribed to HAND_UPDATED
- Check that player index matches (player 0 is human)
- Ensure tile data is converted from JSON correctly

### Opponent Bars Not Updating
- Verify OpponentBar subscribes to TURN_CHANGED
- Check that playerIndex matches opponent bar
- Ensure player data is passed correctly

### Animation Not Playing
- Verify AnimationController is initialized
- Check that CSS animations are in styles/
- Ensure component calls animation methods

## Future Enhancements

### Possible Additions
- Swipe gestures for tile selection
- Mobile-optimized UI dialogs
- Touch feedback (haptics)
- Offline play via service workers
- Multiplayer support (WebSocket)
- AI vs AI demo mode

### Alternative Renderers
With this architecture, you can build:
- **Terminal**: Text-based ASCII display
- **Native Mobile**: React Native, Flutter
- **VR**: Three.js + Babylon.js
- **AI Analysis**: Heatmaps and decision trees
- **Replay System**: Animation timeline

All without touching GameController!

## Summary

The mobile renderer proves that GameController is truly platform-agnostic. By:
1. Using event-based communication
2. Deferring UI to renderers via UI_PROMPT
3. Keeping game logic completely separate

We achieve perfect separation of concerns and can build unlimited renderer variations.
