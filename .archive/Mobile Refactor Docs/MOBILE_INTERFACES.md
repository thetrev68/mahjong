# Mobile Migration - Interface Specifications

**Purpose:** This document defines ALL interfaces between core game logic and UI layers. Use this as the contract when implementing desktop/mobile components.

**Last Updated:** 2025-11-11

---

## Table of Contents

1. [GameController API](#gamecontroller-api)
2. [Event System](#event-system)
3. [Data Models](#data-models)
4. [Desktop Adapter Interface](#desktop-adapter-interface)
5. [Mobile Renderer Interfaces](#mobile-renderer-interfaces)
6. [AI Engine Interface](#ai-engine-interface)
7. [Card Validator Interface](#card-validator-interface)

---

## GameController API

### Core Methods

```javascript
// Initialize the controller
await gameController.init({
  aiEngine: AIEngine, // AI decision engine
  cardValidator: Card, // Hand validation system
  settings: {
    year: 2025,
    difficulty: "medium",
    useBlankTiles: false,
    skipCharleston: false,
  },
});

// Start a new game
await gameController.startGame();

// Get current game state snapshot
const state = gameController.getGameState();
// Returns: {state, currentPlayer, players, wallCount, discardCount, gameResult}
```

### Event Subscription

```javascript
// Subscribe to events
const unsubscribe = gameController.on("TILE_DRAWN", (data) => {
  console.log(`Player ${data.player} drew tile:`, data.tile);
});

// Unsubscribe when done
unsubscribe();

// Subscribe once (auto-unsubscribe after first trigger)
gameController.once("GAME_ENDED", (data) => {
  console.log("Game ended:", data.reason);
});
```

---

## Event System

All events follow this pattern:

```javascript
{
    type: 'EVENT_NAME',
    data: { /* event-specific payload */ }
}
```

### Complete Event Reference

#### Game Flow Events

**STATE_CHANGED**

```javascript
{
    oldState: 2,  // STATE enum value
    newState: 3
}
```

**GAME_STARTED**

```javascript
{
    players: [
        {position: 0, name: "You", hand: {...}, isHuman: true, ...},
        {position: 1, name: "Opponent 1", ...},
        {position: 2, name: "Opponent 2", ...},
        {position: 3, name: "Opponent 3", ...}
    ]
}
```

**GAME_ENDED**

```javascript
{
    reason: "mahjong" | "wall_game" | "quit",
    winner: 0,  // Player index (0-3), -1 if no winner
    mahjong: true
}
```

#### Tile Events

**TILES_DEALT**

```javascript
{
  players: [
    { position: 0, tileCount: 14 },
    { position: 1, tileCount: 13 },
    { position: 2, tileCount: 13 },
    { position: 3, tileCount: 13 },
  ];
}
```

**TILE_DRAWN**

```javascript
{
    player: 0,  // Player index
    tile: {suit: 0, number: 5, index: 42}  // TileData JSON
}
```

**TILE_DISCARDED**

```javascript
{
    player: 0,
    tile: {suit: 0, number: 5, index: 42}
}
```

**DISCARD_CLAIMED**

```javascript
{
    player: 1,  // Claiming player
    tile: {suit: 0, number: 5, index: 42},
    claimType: "Pung" | "Kong" | "Mahjong"
}
```

**TILES_EXPOSED**

```javascript
{
    player: 1,
    exposureType: "PUNG" | "KONG" | "QUINT",
    tiles: [
        {suit: 0, number: 5, index: 42},
        {suit: 0, number: 5, index: 78},
        {suit: 0, number: 5, index: 103}
    ]
}
```

#### Hand Events

**HAND_UPDATED**

```javascript
{
    player: 0,
    hand: {
        tiles: [
            {suit: 0, number: 1, index: 5},
            {suit: 0, number: 2, index: 12},
            // ... 13-14 tiles
        ],
        exposures: [
            {
                type: "PUNG",
                tiles: [...]
            }
        ]
    }
}
```

#### Turn Events

**TURN_CHANGED**

```javascript
{
    currentPlayer: 1,  // New current player (0-3)
    previousPlayer: 0
}
```

#### Charleston Events

**CHARLESTON_PHASE**

```javascript
{
    phase: 1 | 2,
    passCount: 1 | 2 | 3,  // Which pass within phase
    direction: "right" | "across" | "left"
}
```

**CHARLESTON_PASS**

```javascript
{
    player: 0,
    tiles: [
        {suit: 0, number: 1, index: 5},
        {suit: 1, number: 3, index: 22},
        {suit: 2, number: 7, index: 89}
    ],
    direction: "right" | "across" | "left"
}
```

#### Courtesy Events

**COURTESY_VOTE**

```javascript
{
    player: 0,
    vote: true | false
}
```

**COURTESY_PASS**

```javascript
{
    fromPlayer: 0,
    toPlayer: 2,  // Opposite player
    tile: {suit: 0, number: 5, index: 42}
}
```

#### UI Events

**MESSAGE**

```javascript
{
    text: "Game started",
    type: "info" | "error" | "hint"
}
```

**UI_PROMPT** _(Special - requires callback)_

```javascript
{
    promptType: "CHOOSE_DISCARD" | "CLAIM_DISCARD" | "CHARLESTON_CONTINUE" | "COURTESY_VOTE",
    options: {
        // Prompt-specific data
        hand: {...},  // For CHOOSE_DISCARD
        tile: {...},  // For CLAIM_DISCARD
        question: "Continue Charleston?",  // For queries
        options: ["Yes", "No"]
    },
    callback: (result) => {
        // UI MUST call this callback with user's choice
        // For CHOOSE_DISCARD: callback(TileData)
        // For CLAIM_DISCARD: callback("Mahjong" | "Pung" | "Kong" | "Pass")
        // For queries: callback("Yes" | "No")
    }
}
```

**Example UI_PROMPT handler:**

```javascript
gameController.on("UI_PROMPT", (data) => {
  const { promptType, options, callback } = data;

  if (promptType === "CHOOSE_DISCARD") {
    // Show tile selection UI
    showDiscardUI(options.hand, (selectedTile) => {
      callback(selectedTile); // MUST call callback
    });
  }
});
```

---

## Data Models

### TileData

```javascript
class TileData {
    suit: number;       // SUIT enum (0=CRACK, 1=BAM, 2=DOT, etc.)
    number: number;     // Tile rank (1-9, or WIND/DRAGON values)
    index: number;      // Unique identifier for this physical tile (0-159)

    // Methods
    getText(): string;              // "Crack 5", "North wind", "Joker"
    equals(other: TileData): boolean;  // Same suit/number?
    isSameTile(other: TileData): boolean;  // Same physical tile (index)?
    clone(): TileData;
    isJoker(): boolean;
    isBlank(): boolean;
    isFlower(): boolean;
    isWind(): boolean;
    isDragon(): boolean;
    isNumberedSuit(): boolean;
    isInvalid(): boolean;

    // Serialization
    toJSON(): {suit, number, index};
    static fromJSON(json): TileData;
}
```

### HandData

```javascript
class HandData {
    tiles: TileData[];           // Hidden tiles in hand
    exposures: ExposureData[];   // Exposed tile sets

    // Methods
    getLength(): number;         // Total tiles (hidden + exposed)
    getHiddenCount(): number;    // Just hidden tiles
    addTile(tile: TileData): void;
    removeTile(tile: TileData): boolean;
    addExposure(exposure: ExposureData): void;
    hasTile(tile: TileData): boolean;
    countTile(suit, number): number;
    sortBySuit(): void;
    sortByRank(): void;
    clone(): HandData;

    // Serialization
    toJSON(): {tiles, exposures};
    static fromJSON(json): HandData;
}
```

### ExposureData

```javascript
class ExposureData {
    type: string;      // "PUNG", "KONG", "QUINT"
    tiles: TileData[]; // 3, 4, or 5 tiles

    // Methods
    clone(): ExposureData;
    toJSON(): {type, tiles};
    static fromJSON(json): ExposureData;
}
```

### PlayerData

```javascript
class PlayerData {
    position: number;        // 0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT
    name: string;            // Player name
    hand: HandData;          // Player's tiles
    isHuman: boolean;        // Is this the human player?
    isCurrentTurn: boolean;  // Is it this player's turn?
    wind: string;            // "N", "E", "S", "W"

    // Methods
    getDefaultName(): string;
    clone(): PlayerData;
    toJSON(): {position, name, hand, isHuman, isCurrentTurn, wind};
    static fromJSON(json): PlayerData;
}
```

---

## Desktop Adapter Interface

The desktop adapter bridges GameController events to existing Phaser code.

### Required Implementation

```javascript
class PhaserAdapter {
  constructor(gameController, scene, table) {
    this.gameController = gameController;
    this.scene = scene; // Phaser scene
    this.table = table; // Existing Table object

    // Subscribe to all relevant events
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Map GameController events → Phaser sprite updates

    this.gameController.on("TILE_DRAWN", (data) => {
      const phaserTile = this.createPhaserTile(data.tile);
      const player = this.table.players[data.player];
      player.hand.insertHidden(phaserTile);
      // Trigger Phaser animations
    });

    this.gameController.on("TILE_DISCARDED", (data) => {
      const player = this.table.players[data.player];
      const phaserTile = this.findPhaserTile(data.tile);
      // Move tile to discard pile (Phaser animation)
    });

    // ... map all other events
  }

  // Convert TileData → Phaser Tile sprite
  createPhaserTile(tileData) {
    const tile = new Tile(this.scene, tileData.suit, tileData.number);
    tile.index = tileData.index;
    tile.create();
    return tile;
  }

  // Find existing Phaser tile by TileData
  findPhaserTile(tileData) {
    // Search through player hands to find matching tile by index
  }

  // Handle UI prompts (desktop uses existing button system)
  handleUIPrompt(data) {
    const { promptType, options, callback } = data;

    if (promptType === "CHOOSE_DISCARD") {
      // Enable tile selection in desktop UI
      // When user clicks, call callback(selectedTile)
    }
  }
}
```

### Desktop Integration Point

```javascript
// desktop/main.js
import {GameController} from '../core/GameController.js';
import {PhaserAdapter} from './adapters/PhaserAdapter.js';

// In GameScene.create()
const gameController = new GameController();
await gameController.init({
    aiEngine: this.gameAI,
    cardValidator: this.card,
    settings: {...}
});

const adapter = new PhaserAdapter(gameController, this, this.table);

// Start game
await gameController.startGame();
```

---

## Mobile Renderer Interfaces

Mobile uses a completely different UI approach (DOM-based, portrait).

### HandRenderer

Displays the human player's hand at bottom of screen.

```javascript
class HandRenderer {
  /**
   * @param {HTMLElement} container - DOM container for hand
   * @param {GameController} gameController - Game controller reference
   */
  constructor(container, gameController) {
    this.container = container;
    this.gameController = gameController;

    // Subscribe to events
    gameController.on("HAND_UPDATED", (data) => {
      if (data.player === 0) {
        // Only render human player
        this.render(data.hand);
      }
    });

    gameController.on("TILE_DRAWN", (data) => {
      if (data.player === 0) {
        this.animateTileDraw(data.tile);
      }
    });
  }

  /**
   * Render hand from HandData
   * @param {HandData} handData - Hand to render
   */
  render(handData) {
    this.container.innerHTML = ""; // Clear

    handData.tiles.forEach((tileData) => {
      const tileElement = this.createTileElement(tileData);
      this.container.appendChild(tileElement);
    });

    // Also render exposures
    handData.exposures.forEach((exposure) => {
      const exposureElement = this.createExposureElement(exposure);
      this.container.appendChild(exposureElement);
    });
  }

  /**
   * Create a tile DOM element
   * @param {TileData} tileData
   * @returns {HTMLElement}
   */
  createTileElement(tileData) {
    const tile = document.createElement("div");
    tile.className = "mobile-tile";
    tile.dataset.suit = tileData.suit;
    tile.dataset.number = tileData.number;
    tile.dataset.index = tileData.index;

    // Use text-in-box approach (from tileDisplayUtils.js)
    const displayInfo = getTileDisplayChar(tileData);
    tile.textContent = displayInfo.char;
    tile.style.color = displayInfo.color;

    // Add touch event handlers
    tile.addEventListener("click", () => {
      this.onTileClick(tileData);
    });

    return tile;
  }

  /**
   * Handle tile click (selection)
   * @param {TileData} tileData
   */
  onTileClick(tileData) {
    // Toggle selection visual
    // When discard prompt active, call callback with selected tile
  }

  /**
   * Animate a tile being drawn
   * @param {TileData} tileData
   */
  animateTileDraw(tileData) {
    // CSS animation: slide from top
  }

  /**
   * Destroy renderer (cleanup)
   */
  destroy() {
    // Remove event listeners, clear container
  }
}
```

### OpponentBar

Displays opponent info compactly at top of screen.

```javascript
class OpponentBar {
  /**
   * @param {HTMLElement} container - DOM container
   * @param {number} playerPosition - Player index (1, 2, or 3)
   * @param {GameController} gameController
   */
  constructor(container, playerPosition, gameController) {
    this.container = container;
    this.playerPosition = playerPosition;
    this.gameController = gameController;

    // Subscribe to events
    gameController.on("HAND_UPDATED", (data) => {
      if (data.player === playerPosition) {
        this.update(data.hand);
      }
    });

    gameController.on("TURN_CHANGED", (data) => {
      this.updateTurnIndicator(data.currentPlayer === playerPosition);
    });
  }

  /**
   * Update opponent display
   * @param {HandData} handData
   */
  update(handData) {
    // Update tile count
    const tileCount = handData.getHiddenCount();
    this.container.querySelector(".tile-count").textContent =
      `${tileCount} tiles`;

    // Update exposure icons
    const exposuresContainer = this.container.querySelector(".exposures");
    exposuresContainer.innerHTML = "";
    handData.exposures.forEach((exposure) => {
      const icon = document.createElement("span");
      icon.className = `exposure-icon ${exposure.type.toLowerCase()}`;
      icon.textContent = exposure.type.substring(0, 1); // "P", "K", "Q"
      exposuresContainer.appendChild(icon);
    });
  }

  /**
   * Highlight when it's this opponent's turn
   * @param {boolean} isActive
   */
  updateTurnIndicator(isActive) {
    if (isActive) {
      this.container.classList.add("active-turn");
    } else {
      this.container.classList.remove("active-turn");
    }
  }
}
```

### DiscardPileRenderer

Displays discarded tiles in center area.

```javascript
class DiscardPileRenderer {
  constructor(container, gameController) {
    this.container = container;
    this.discards = [];

    gameController.on("TILE_DISCARDED", (data) => {
      this.addDiscard(data.tile);
    });

    gameController.on("DISCARD_CLAIMED", (data) => {
      this.removeLastDiscard();
    });
  }

  addDiscard(tileData) {
    this.discards.push(tileData);

    const tileElement = document.createElement("div");
    tileElement.className = "discard-tile latest";
    tileElement.textContent = getTileDisplayChar(tileData).char;

    // Remove 'latest' from previous tile
    const previous = this.container.querySelector(".latest");
    if (previous) {
      previous.classList.remove("latest");
    }

    this.container.appendChild(tileElement);

    // Scroll to show latest
    this.container.scrollTop = this.container.scrollHeight;
  }

  removeLastDiscard() {
    this.discards.pop();
    const lastTile = this.container.lastChild;
    if (lastTile) {
      lastTile.remove();
    }
  }
}
```

### TouchHandler

Detects touch gestures on mobile.

```javascript
class TouchHandler {
  constructor(element, callbacks) {
    this.element = element;
    this.callbacks = callbacks; // {onTap, onDoubleTap, onSwipeUp, onLongPress}

    this.touchStartTime = 0;
    this.touchStartY = 0;
    this.lastTapTime = 0;

    // Bind events
    element.addEventListener("touchstart", this.onTouchStart.bind(this));
    element.addEventListener("touchend", this.onTouchEnd.bind(this));
    element.addEventListener("touchmove", this.onTouchMove.bind(this));
  }

  onTouchStart(e) {
    this.touchStartTime = Date.now();
    this.touchStartY = e.touches[0].clientY;

    // Detect long press
    this.longPressTimer = setTimeout(() => {
      if (this.callbacks.onLongPress) {
        this.callbacks.onLongPress(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, 500);
  }

  onTouchEnd(e) {
    clearTimeout(this.longPressTimer);

    const duration = Date.now() - this.touchStartTime;

    if (duration < 300) {
      // Tap or double-tap
      const timeSinceLastTap = Date.now() - this.lastTapTime;

      if (timeSinceLastTap < 500 && this.callbacks.onDoubleTap) {
        // Double-tap
        this.callbacks.onDoubleTap(
          e.changedTouches[0].clientX,
          e.changedTouches[0].clientY,
        );
        this.lastTapTime = 0; // Reset
      } else if (this.callbacks.onTap) {
        // Single tap
        this.callbacks.onTap(
          e.changedTouches[0].clientX,
          e.changedTouches[0].clientY,
        );
        this.lastTapTime = Date.now();
      }
    }
  }

  onTouchMove(e) {
    const deltaY = this.touchStartY - e.touches[0].clientY;

    if (deltaY > 50 && this.callbacks.onSwipeUp) {
      // Swipe up detected
      this.callbacks.onSwipeUp(this.touchStartY, e.touches[0].clientY);
      clearTimeout(this.longPressTimer);
    }
  }

  destroy() {
    // Remove event listeners
  }
}
```

### Mobile Main Controller

Orchestrates all mobile components.

```javascript
// mobile/MobileGameController.js
import { GameController } from "../core/GameController.js";
import { HandRenderer } from "./renderers/HandRenderer.js";
import { OpponentBar } from "./renderers/OpponentBar.js";
import { DiscardPileRenderer } from "./renderers/DiscardPileRenderer.js";
import { TouchHandler } from "./gestures/TouchHandler.js";

export class MobileGameController {
  constructor() {
    this.gameController = new GameController();

    // Create renderers
    this.handRenderer = new HandRenderer(
      document.getElementById("hand-container"),
      this.gameController,
    );

    this.opponentBars = [
      new OpponentBar(
        document.getElementById("opponent-1"),
        1,
        this.gameController,
      ),
      new OpponentBar(
        document.getElementById("opponent-2"),
        2,
        this.gameController,
      ),
      new OpponentBar(
        document.getElementById("opponent-3"),
        3,
        this.gameController,
      ),
    ];

    this.discardPile = new DiscardPileRenderer(
      document.getElementById("discard-pile"),
      this.gameController,
    );

    // Setup touch handling
    this.touchHandler = new TouchHandler(
      document.getElementById("hand-container"),
      {
        onTap: (x, y) => this.onTileTap(x, y),
        onDoubleTap: (x, y) => this.onTileDoubleTap(x, y),
        onSwipeUp: () => this.onSwipeUp(),
      },
    );

    // Handle UI prompts
    this.gameController.on("UI_PROMPT", (data) => {
      this.handleUIPrompt(data);
    });
  }

  async init(options) {
    await this.gameController.init(options);
  }

  async startGame() {
    await this.gameController.startGame();
  }

  handleUIPrompt(data) {
    // Mobile-specific UI prompt handling
    // Show bottom sheets, modals, etc.
  }
}
```

---

## AI Engine Interface

The AI engine makes decisions for computer players.

### Required Methods

```javascript
class AIEngine {
  constructor(cardValidator, difficulty) {
    this.cardValidator = cardValidator; // Card validation system
    this.difficulty = difficulty; // "easy", "medium", "hard"
  }

  /**
   * Choose which tile to discard
   * @param {HandData} hand - AI player's hand
   * @returns {Promise<TileData>} Tile to discard
   */
  async chooseDiscard(hand) {
    // Analyze hand, return best tile to discard
  }

  /**
   * Decide whether to claim a discarded tile
   * @param {HandData} hand - AI player's hand
   * @param {TileData} discardedTile - Available tile
   * @returns {Promise<string>} "Mahjong" | "Pung" | "Kong" | "Pass"
   */
  async claimDiscard(hand, discardedTile) {
    // Check if tile helps, decide claim type
  }

  /**
   * Select 3 tiles to pass during Charleston
   * @param {HandData} hand - AI player's hand
   * @param {string} direction - "right" | "across" | "left"
   * @returns {Promise<TileData[]>} 3 tiles to pass
   */
  async charlestonPass(hand, direction) {
    // Select least valuable tiles
  }

  /**
   * Vote whether to continue Charleston to phase 2
   * @returns {Promise<boolean>}
   */
  async charlestonContinueVote() {
    // Random or strategic decision
  }

  /**
   * Vote whether to participate in courtesy pass
   * @param {HandData} hand - AI player's hand
   * @returns {Promise<boolean>}
   */
  async courtesyVote(hand) {
    // Strategic decision based on hand quality
  }

  /**
   * Get tile recommendations for hint system
   * @param {HandData} hand - Player's hand
   * @returns {Object} {recommendations: [{tile, recommendation: "KEEP"|"PASS"|"DISCARD"}], consideredPatternCount}
   */
  getTileRecommendations(hand) {
    // Rank tiles by value
  }
}
```

---

## Card Validator Interface

The card validator checks if hands match winning patterns.

### Required Methods

```javascript
class Card {
  constructor(year) {
    this.year = year; // 2017, 2018, 2019, 2020, 2025
    this.validHandGroups = []; // Loaded patterns
  }

  async init() {
    // Load year-specific patterns from card/YYYY/
  }

  /**
   * Check if hand is a winning hand
   * @param {HandData} hand - 14-tile hand
   * @returns {boolean}
   */
  validateHand(hand) {
    // Check against all valid patterns
  }

  /**
   * Rank hand based on proximity to winning
   * @param {HandData} hand - 14-tile hand
   * @returns {Array} Ranked array of possible hands
   */
  rankHandArray14(hand) {
    // Return all patterns this hand could become, ranked by closeness
  }

  /**
   * Sort hand rankings by score
   * @param {Array} rankCardHands - Output from rankHandArray14()
   */
  sortHandRankArray(rankCardHands) {
    // Sort in-place by rank score
  }
}
```

---

## Implementation Checklist

### Phase 1A (Haiku): Data Models ✅

- [x] TileData.js
- [x] HandData.js (with ExposureData)
- [x] PlayerData.js

### Phase 1B (You): GameController ✅

- [x] EventEmitter.js
- [x] GameController.js
- [x] MOBILE_INTERFACES.md (this document)

### Phase 2A (You): Desktop Adapter

- [x] PhaserAdapter.js
- [x] Update desktop/main.js to use GameController
- [x] Bridge all events to existing Phaser code

### Phase 3C (Gemini Pro): Touch Handler

- [ ] TouchHandler.js
- [ ] Gesture detection (tap, double-tap, swipe, long-press)

### Phase 3D (Gemini Pro): Mobile Tile Component

- [ ] MobileTile.js
- [ ] CSS styling (normal, selected, disabled, highlighted states)

### Phase 4A (Gemini Pro): Hand Renderer

- [ ] HandRenderer.js
- [ ] Tile creation and layout
- [ ] Touch event integration

### Phase 4B (Haiku): Opponent Bars

- [ ] OpponentBar.js
- [ ] Compact display (name, tile count, exposures)

### Phase 4C (Gemini Flash): Discard Pile

- [ ] DiscardPileRenderer.js
- [ ] Grid layout, scroll handling

---

## Testing Strategy

### Unit Tests

Test data models in isolation:

```javascript
// Test TileData
const tile1 = new TileData(SUIT.CRACK, 5, 0);
const tile2 = new TileData(SUIT.CRACK, 5, 1);
assert(tile1.equals(tile2) === true);
assert(tile1.isSameTile(tile2) === false);
```

### Integration Tests

Test GameController with mock AI/validator:

```javascript
const mockAI = {
    chooseDiscard: async (hand) => hand.tiles[0],
    claimDiscard: async () => "Pass"
};

const controller = new GameController();
await controller.init({aiEngine: mockAI, ...});
```

### E2E Tests

Test full game flow on both platforms:

```javascript
// Playwright test
test("mobile game flow", async ({ page }) => {
  await page.goto("/mobile/");
  await page.click("#start-game");
  // ... interact with game
});
```

---

## Code Style Guidelines

### ESLint Rules

- Double quotes for strings
- Semicolons required
- No `var`, use `const`/`let`
- Strict equality (`===`)

### Naming Conventions

- Classes: PascalCase (`GameController`)
- Methods: camelCase (`chooseDiscard`)
- Constants: UPPER_SNAKE_CASE (`STATE.DEAL`)
- Private methods: prefix with underscore (`_internalMethod`)

### Documentation

- Use JSDoc comments for public methods
- Include `@param` and `@returns` tags
- Explain non-obvious logic with inline comments

---

## Questions?

If any interface is unclear:

1. Check existing gameLogic.js implementation for reference
2. Refer to CLAUDE.md for project conventions
3. Ask for clarification before implementing

**Next Steps:**

- Phase 2A: Implement PhaserAdapter to keep desktop working
- Phase 3: Begin mobile UI implementation

---

**Document Version:** 1.0
**Status:** Complete - Ready for Phase 2+
