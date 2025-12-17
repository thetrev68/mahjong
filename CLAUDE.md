# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

American Mahjong game with **multi-platform support**: Desktop (Phaser.js) and Mobile (Progressive Web App). Features 4-player gameplay with intelligent AI opponents, authentic American Mahjong rules including Charleston phases, courtesy passes, and exposures.

**Architecture**: Event-driven with platform-agnostic core logic and platform-specific adapters/renderers.

## Development Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)
                     # Desktop: / | Mobile: /mobile/

# Production Build
npm run build        # Creates dist/index.html (desktop) + dist/mobile/index.html
npm run preview      # Preview production build

# Testing
npm test             # Run Playwright tests (headless)
npm run test:ui      # Run tests in UI mode (interactive)
npm run test:headed  # Run tests with browser visible
npm run test:report  # View last test report

# Code Quality
npm run lint         # Run ESLint
npm run knip         # Find unused files/exports/dependencies
```

## Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                   PLATFORM LAYER                         │
│  ┌─────────────────────┐    ┌─────────────────────┐    │
│  │  Desktop (Phaser)   │    │  Mobile (HTML/CSS)  │    │
│  │  - PhaserAdapter    │    │  - MobileRenderer   │    │
│  │  - Managers (6)     │    │  - Components (6)   │    │
│  │  - HandRenderer     │    │  - HandRenderer     │    │
│  └──────────┬──────────┘    └──────────┬──────────┘    │
└─────────────┼──────────────────────────┼───────────────┘
              │                          │
              └─────────┬────────────────┘
                        │ EventEmitter (pub/sub)
              ┌─────────▼───────────────────┐
              │  CORE LAYER (Platform-agnostic)│
              │  - GameController            │
              │  - AIEngine                  │
              │  - Card (Validator)          │
              │  - Data Models               │
              └──────────────────────────────┘
```

### Directory Structure

```
c:\Repos\mahjong\
├── core/                    # Platform-agnostic game logic
│   ├── card/                # Hand validation engine
│   │   ├── card.js          # Pattern matching & ranking
│   │   └── [2017-2025]/     # Year-specific rule definitions
│   ├── GameController.js    # State machine & orchestration (737 lines)
│   ├── AIEngine.js          # AI decision making (511 lines)
│   ├── events/
│   │   ├── EventEmitter.js  # Pub/sub event system
│   │   └── GameEvents.js    # Event factory functions
│   └── models/              # Plain data models (no Phaser)
│       ├── TileData.js
│       ├── HandData.js
│       └── PlayerData.js
│
├── desktop/                 # Phaser-specific implementation
│   ├── adapters/
│   │   └── PhaserAdapter.js # Event → Phaser translator
│   ├── managers/            # Specialized desktop managers
│   │   ├── ButtonManager.js
│   │   ├── DialogManager.js
│   │   ├── SelectionManager.js
│   │   ├── TileManager.js
│   │   ├── HintAnimationManager.js
│   │   └── HomePageTileManager.js
│   ├── renderers/
│   │   └── HandRenderer.js  # Tile positioning & layout
│   ├── gameObjects/         # Legacy Phaser objects (being phased out)
│   │   ├── gameObjects_table.js
│   │   ├── gameObjects_hand.js
│   │   └── gameObjects_player.js
│   └── scenes/
│       └── GameScene.js     # Phaser scene initialization
│
├── mobile/                  # Mobile-specific implementation
│   ├── MobileRenderer.js    # Event → HTML/CSS translator
│   ├── components/          # HTML/CSS UI components
│   │   ├── MobileTile.js
│   │   ├── DiscardPile.js
│   │   ├── OpponentBar.js
│   │   ├── InstallPrompt.js
│   │   └── SettingsSheet.js
│   ├── renderers/
│   │   └── HandRenderer.js  # Mobile hand rendering (CSS Grid)
│   ├── gestures/
│   │   └── TouchHandler.js
│   └── animations/
│       └── AnimationController.js
│
├── shared/                  # Cross-platform utilities
│   └── SettingsManager.js   # localStorage persistence
│
├── index.html               # Desktop entry point
├── mobile/index.html        # Mobile entry point
├── main.js                  # Desktop initialization
└── mobile/main.js           # Mobile initialization
```

## Core Architecture

### State Management (No Redux)

**The codebase uses a custom event-driven architecture, NOT Redux or any formal state management library.**

#### State Location

- **GameController** ([core/GameController.js](core/GameController.js)) - Single source of truth
  - Owns game state machine (STATE enum from [constants.js](constants.js))
  - Maintains player data, wall tiles, discard pile
  - Manages turn order and game phase transitions

#### State Flow Pattern

```
GameController (owns state)
    ↓ emits events
EventEmitter (pub/sub system)
    ↓ broadcasts to
Adapters/Renderers (listen & react)
    ↓ update
UI/Visual Layer
    ↓ user actions
Callbacks to GameController
    ↓ updates state
[cycle continues]
```

#### Key Events (from [core/events/GameEvents.js](core/events/GameEvents.js))

- **STATE_CHANGED** - Game phase transitions
- **TILES_DEALT** - Initial distribution
- **TILE_DRAWN** - Tile picked from wall
- **TILE_DISCARDED** - Tile thrown to discard pile
- **HAND_UPDATED** - Player hand changed
- **TURN_CHANGED** - Current player switched
- **CHARLESTON_PHASE** - Charleston pass initiated
- **DISCARD_CLAIMED** - Pung/Kong/Mahjong claim
- **TILES_EXPOSED** - Public exposure created
- **UI_PROMPT** - Requires user input (includes callback)
- **MESSAGE** - Info/error messages

### Game State Machine

Defined in [constants.js](constants.js) `STATE` enum, managed by [core/GameController.js](core/GameController.js):

```
INIT → START → DEAL → CHARLESTON1 → CHARLESTON_QUERY → CHARLESTON2
  → COURTESY_QUERY → COURTESY → COURTESY_COMPLETE
  → LOOP_PICK_FROM_WALL → LOOP_CHOOSE_DISCARD
  → LOOP_QUERY_CLAIM_DISCARD → LOOP_EXPOSE_TILES
  → END
```

Each state has corresponding async methods in GameController:

- `async startGame()`
- `async dealTiles()`
- `async charlestonPhase1()` / `charlestonPhase2()`
- `async courtesyPhase()`
- `async mainGameLoop()` (contains LOOP states)

## Platform Support

### Desktop Platform

- **Entry Point**: [index.html](index.html) → [main.js](main.js) → [desktop/scenes/GameScene.js](desktop/scenes/GameScene.js)
- **Renderer**: WebGL/Canvas via Phaser 3
- **UI**: HTML buttons ([index.html](index.html)) + Phaser sprites
- **Input**: Mouse (drag-and-drop, click)
- **Adapter**: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js) listens to GameController events
- **Build Target**: `npm run dev` → Vite serves [index.html](index.html)

### Mobile Platform (PWA)

- **Entry Point**: [mobile/index.html](mobile/index.html) → [mobile/main.js](mobile/main.js)
- **Renderer**: Pure HTML/CSS (no Phaser)
- **UI**: CSS Grid layout with touch-friendly components
- **Input**: Touch gestures (tap, swipe)
- **Adapter**: [mobile/MobileRenderer.js](mobile/MobileRenderer.js) listens to GameController events
- **Build Target**: `npm run build` creates [dist/mobile/index.html](dist/mobile/index.html)
- **PWA Features**: Service worker, app manifest, install prompt

### Shared Components

Both platforms use:

- [core/GameController.js](core/GameController.js) - Game orchestration
- [core/AIEngine.js](core/AIEngine.js) - AI decisions
- [card/card.js](card/card.js) - Hand validation
- [shared/SettingsManager.js](shared/SettingsManager.js) - Settings persistence

## Key Components

### GameController (CRITICAL - Replaces old GameLogic)

**Location**: [core/GameController.js](core/GameController.js) (737 lines)

**IMPORTANT**: The old `GameLogic` class has been **completely replaced** by `GameController`.

**Responsibilities**:

1. **State Machine Management** - Enforces state transitions
2. **Game Flow Orchestration** - Async methods for each game phase
3. **Event Emission** - Fires events at every significant action
4. **Turn Management** - Tracks current player, enforces turn order
5. **AI Integration** - Calls AIEngine for computer player decisions
6. **UI Prompts** - Emits `UI_PROMPT` events with callbacks for user input

**Key Methods**:

```javascript
async startGame()
async dealTiles()
async charlestonPhase1()
async charlestonPhase2()
async courtesyPhase()
async mainGameLoop()           // Contains main play loop
promptUI(promptType, options, callback)  // Request user input
```

### AIEngine

**Location**: [core/AIEngine.js](core/AIEngine.js) (511 lines)

Platform-agnostic AI decision engine with difficulty scaling:

**Capabilities**:

- `chooseDiscard(playerData, handData)` - Select tile to discard
- `claimDiscard(playerData, tile, claimTypes)` - Decide on claim
- `charlestonPass(playerData, direction)` - Choose tiles to pass
- `courtesyVote(playerData)` - Vote on courtesy count
- `exchangeTilesForJokers(playerData)` - Optimize joker swaps
- `getTileRecommendations(handData)` - Rank tiles by "keep value"

**Difficulty Levels** (easy/medium/hard):

- Pattern consideration depth
- Exposure timing thresholds
- Mistake randomness factor
- Joker optimization aggressiveness

### Card (Hand Validator)

**Location**: [card/card.js](card/card.js)

Pattern validation and hand ranking engine:

**Core Methods**:

- `validateHand(tiles)` - Checks if hand matches winning patterns
- `rankHand(tiles)` - Scores hand based on proximity to winning
- `matchComponents(tiles, pattern)` - Breaks hand into valid component groups

**Year-Specific Patterns**:

- [core/card/2017/](core/card/2017/) through [core/card/2025/](core/card/2025/)
- Each year has category-specific files: handsSinglesPairs.js, handsConsecutive.js, handsLikeNumbers.js, hands2468.js, hands13579.js, handsWindsDragons.js, handsQuints.js
- Patterns define valid 14-tile combinations using components (Pair, Pung, Kong, Quint, Run)

**Adding New Years**:

1. Create new directory under `core/card/YYYY/`
2. Import pattern categories in `core/card/cardYYYY.js`
3. Update `core/card/card.js` init() to load the new year

## Desktop Architecture

### PhaserAdapter

**Location**: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

Translates GameController events into Phaser-specific rendering calls.

**Pattern**: Listens to events, delegates to managers:

```javascript
setupEventListeners() {
  this.gameController.on("TILE_DRAWN", (data) => this.onTileDrawn(data));
  this.gameController.on("HAND_UPDATED", (data) => this.onHandUpdated(data));
  this.gameController.on("UI_PROMPT", (event) => this.handleUIPrompt(event));
}
```

### Desktop Managers

**ButtonManager** ([desktop/managers/ButtonManager.js](desktop/managers/ButtonManager.js))

- Updates button visibility per game state
- Manages button text (e.g., "Pass Right", "Mahjong!")
- Routes clicks to GameController callbacks

**DialogManager** ([desktop/managers/DialogManager.js](desktop/managers/DialogManager.js))

- Modal overlays for prompts (courtesy vote, etc.)
- Promise-based async dialog flow

**SelectionManager** ([desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js))

- Tracks selected tiles (Set data structure)
- Validates selection rules per mode (Charleston: exactly 3, no jokers)
- Visual feedback (tile Y-position: 575 = selected, 600 = normal)

**HandRenderer** ([desktop/renderers/HandRenderer.js](desktop/renderers/HandRenderer.js))

- Positions tiles for all 4 players
- BOTTOM (human): horizontal row, face-up, full size
- RIGHT/TOP/LEFT (AI): scaled 0.75, face-down (unless debug)
- Handles exposed tile sets (Pung/Kong/Quint)

**TileManager** ([desktop/managers/TileManager.js](desktop/managers/TileManager.js))

- Registry of all 152 tile sprites (index → Tile object)
- Sprite pool management

**HintAnimationManager** ([desktop/managers/HintAnimationManager.js](desktop/managers/HintAnimationManager.js))

- AI hint system (suggests best discard)
- Tile glow animations

### Desktop UI Structure ([index.html](index.html))

```html
<div id="gamediv">                 <!-- Phaser canvas container -->
<div id="uicenterdiv">             <!-- Action bar (draggable) -->
  <textarea id="info">              <!-- Current action status -->
  <div id="buttondiv">              <!-- Dynamic buttons (1-4) -->
<aside id="uidiv">                  <!-- Right sidebar -->
  <textarea id="messages">          <!-- Game log -->
  <div id="hint-content">           <!-- AI hints -->
  <div id="controldiv">             <!-- Static buttons -->
    <button id="start">
    <button id="settings">
    <button id="sort1">
    <button id="sort2">
<div id="settings-overlay">         <!-- Modal settings panel -->
```

## Mobile Architecture

### MobileRenderer

**Location**: [mobile/MobileRenderer.js](mobile/MobileRenderer.js)

Parallel to PhaserAdapter - translates GameController events into HTML/CSS updates.

**Pattern**: Listens to events, delegates to components:

```javascript
setupEventListeners() {
  this.gameController.on("TILE_DRAWN", (data) => this.onTileDrawn(data));
  this.gameController.on("HAND_UPDATED", (data) => this.onHandUpdated(data));
  this.gameController.on("UI_PROMPT", (event) => this.handleUIPrompt(event));
}
```

### Mobile Components

**HandRenderer** ([mobile/renderers/HandRenderer.js](mobile/renderers/HandRenderer.js))

- Creates `<div>` elements for tiles (no Phaser)
- CSS-based layout (flexbox)
- Touch-friendly sizing

**MobileTile** ([mobile/components/MobileTile.js](mobile/components/MobileTile.js))

- Single tile component with CSS sprite positioning

**DiscardPile** ([mobile/components/DiscardPile.js](mobile/components/DiscardPile.js))

- Displays discarded tiles in horizontal scrolling grid

**OpponentBar** ([mobile/components/OpponentBar.js](mobile/components/OpponentBar.js))

- Shows opponent hand count, exposed tiles, wind indicator

**InstallPrompt** ([mobile/components/InstallPrompt.js](mobile/components/InstallPrompt.js))

- PWA install flow (appears after 3 games)

**SettingsSheet** ([mobile/components/SettingsSheet.js](mobile/components/SettingsSheet.js))

- Bottom sheet for settings

### Mobile UI Structure ([mobile/index.html](mobile/index.html))

```html
<div id="mobile-app">
  <div id="opponents-container">    <!-- Top: opponent bars -->
  <div id="game-center">            <!-- Center: discard pile -->
  <div id="hand-area">              <!-- Bottom: player hand -->
  <div class="bottom-menu">         <!-- Action buttons -->
```

## Data Models (Platform-Agnostic)

### TileData ([core/models/TileData.js](core/models/TileData.js))

```javascript
class TileData {
  constructor(suit, rank, index) { ... }
  static fromPhaserTile(phaserTile) { ... }  // Converts legacy objects
}
```

### HandData ([core/models/HandData.js](core/models/HandData.js))

```javascript
class HandData {
  constructor(tiles, exposures) { ... }
  addTile(tile) { ... }
  removeTile(index) { ... }
}
```

### PlayerData ([core/models/PlayerData.js](core/models/PlayerData.js))

```javascript
class PlayerData {
  constructor(playerIndex, wind, hand) { ... }
}
```

## Architectural Patterns

### 1. Adapter Pattern (Core Design)

GameController is platform-agnostic. Adapters translate events to platform-specific calls:

```javascript
// GameController emits:
emit("TILE_DRAWN", {player, tile, animation: {from, to}})

// PhaserAdapter translates:
onTileDrawn(data) {
  const sprite = this.tileManager.getTile(data.tile.index);
  this.scene.tweens.add({ targets: sprite, ... });
}

// MobileRenderer translates:
onTileDrawn(data) {
  const tileDiv = this.handRenderer.createTile(data.tile);
  this.animationController.slideIn(tileDiv, data.animation);
}
```

### 2. Event-Driven Architecture

```javascript
// GameController extends EventEmitter
class GameController extends EventEmitter {
  async dealTiles() {
    // ... game logic ...
    this.emit("TILES_DEALT", {sequence: dealSequence});
  }
}

// Adapters subscribe
class PhaserAdapter {
  setupEventListeners() {
    this.gameController.on("TILES_DEALT", (data) => {
      this.onTilesDealt(data);
    });
  }
}
```

### 3. Callback-Based UI Prompts

GameController requests user input via callbacks (not promises):

```javascript
// GameController requests input
promptUI(promptType, options, callback) {
  const event = GameEvents.createUIPromptEvent(promptType, options, callback);
  this.emit("UI_PROMPT", event);
  // Waits for callback invocation
}

// PhaserAdapter handles prompt
handleCharlestonPassPrompt(options, callback) {
  this.selectionManager.enableTileSelection(3, 3, "charleston");
  this.buttonManager.registerCallback("button1", () => {
    const tiles = this.selectionManager.getSelection();
    callback(tiles);  // Resumes GameController
  });
}
```

### 4. Promise-Based Game Flow

GameController methods use async/await for sequential flow:

```javascript
async mainGameLoop() {
  while (!this.gameResult.mahjong && this.wallTiles.length > 8) {
    await this.pickTileFromWall();
    await this.chooseDiscard();
    await this.queryClaimDiscard();
    if (claimOccurred) await this.exposeTiles();
    this.advanceTurn();
  }
}
```

## Important Implementation Details

### Debugging

Toggle debug output via `gdebug` flag in [utils.js:14](utils.js#L14):

```javascript
export const gdebug = 0; // Set to 1 to enable debug messages
```

### Training Mode

Enable via Settings → Training Mode checkbox. Allows:

- Selecting specific starting hands
- Choosing tile count (1-14)
- Skipping Charleston phase

Controlled by GameController methods (search for "training" in [core/GameController.js](core/GameController.js)).

### Constants

All game enums and magic numbers in [constants.js](constants.js):

- `STATE`: Game state machine states
- `SUIT`, `WIND`, `DRAGON`: Tile types
- `PLAYER`: Player positions (BOTTOM=0, RIGHT=1, TOP=2, LEFT=3)
- `SPRITE_WIDTH`, `SPRITE_HEIGHT`, `TILE_GAP`: Layout dimensions
- `CLAIM_TYPE`: Exposure, Pung, Kong, Quint, Mahjong

### Tile Representation

Tiles have two representations:

1. **Sprite representation** (Desktop): Phaser sprite objects with visual properties
2. **Logical representation** (Core): `TileData {suit, rank, index}` objects
   - `index` is unique identifier (0-151) for each physical tile

### Legacy Phaser Objects

**IMPORTANT**: The codebase is in transition:

- Old files: [desktop/gameObjects/gameObjects_table.js](desktop/gameObjects/gameObjects_table.js), [desktop/gameObjects/gameObjects_hand.js](desktop/gameObjects/gameObjects_hand.js), [desktop/gameObjects/gameObjects_player.js](desktop/gameObjects/gameObjects_player.js)
- These are **being phased out** in favor of Data models
- New code should use [core/models/](core/models/) classes
- Legacy objects maintained for backwards compatibility during transition

### PWA Features (Mobile)

- Install prompt after 3 games played ([mobile/components/InstallPrompt.js](mobile/components/InstallPrompt.js))
- Offline capability via service worker
- App manifest for iOS/Android home screen
- Theme color and icons

## Build Configuration

**Vite Config** ([vite.config.js](vite.config.js)):

```javascript
rollupOptions: {
  input: {
    desktop: "index.html",
    mobile: "mobile/index.html"
  }
}
```

**GitHub Pages Deployment**:

- Base path: `/mahjong/`
- Deployed from `dist/` directory

## Testing

**Playwright Tests** ([tests/](tests/)):

- Desktop tests: Test desktop Phaser version
- Mobile tests: Test mobile HTML/CSS version
- Run `npm test` (headless) or `npm run test:ui` (interactive)

## Additional Documentation

The codebase includes extensive architectural documentation:

- [ADAPTER_PATTERNS.md](ADAPTER_PATTERNS.md) - UI prompt handling patterns
- [FUTURE_REFACTORS.md](FUTURE_REFACTORS.md) - Planned improvements
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) - Phase-by-phase refactor plan
- [MOBILE_INTERFACES.md](MOBILE_INTERFACES.md) - Mobile component specs
- [OPTION_B_ARCHITECTURAL_VISION.md](OPTION_B_ARCHITECTURAL_VISION.md) - Core architectural decisions

## Code Style

- ES6 modules with `import`/`export`
- Semicolons required (enforced by ESLint)
- Double quotes for strings
- Use `const`/`let`, no `var`
- Strict equality `===` required

Run `npm run lint` before committing to catch issues.

## Critical Knowledge for AI Assistants

1. **GameController is the heart of the application** - All game logic starts here
2. **No Redux** - Custom event-driven architecture via EventEmitter
3. **Multi-platform** - Desktop (Phaser) and Mobile (HTML/CSS) share core logic
4. **Event-driven** - Adapters listen to GameController events and update UI
5. **Callback-based prompts** - UI prompts use callbacks, not promises
6. **Legacy objects exist** - gameObjects_*.js files being phased out
7. **State machine is strict** - All state transitions managed by GameController
8. **AI is platform-agnostic** - AIEngine works on plain data models
