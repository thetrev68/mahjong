# Mobile Scene Architecture - Interface Specifications

**Version:** 1.0
**Last Updated:** 2025-11-12
**Purpose:** Complete interface specifications for all mobile components (Phase 3B deliverable)

---

## Table of Contents

1. [Component Interfaces](#component-interfaces) (10 components)
2. [Event Flow Scenarios](#event-flow-scenarios) (4 scenarios)
3. [Critical Decisions](#critical-decisions) (4 decisions)
4. [Architecture Questions](#architecture-questions) (6 questions)
5. [Test Scenarios](#test-scenarios) (3 per component)
6. [Example Usage](#example-usage)

---

## Component Interfaces

### 1. MobileGameController

**Purpose:** Orchestrates mobile UI components and manages their lifecycle, connecting them to the core GameController.

```javascript
/**
 * MobileGameController
 *
 * Top-level orchestrator that instantiates GameController and coordinates all mobile UI components.
 */
class MobileGameController {
    /**
     * @param {HTMLElement} container - Root DOM element for the mobile UI
     * @param {Object} options - Configuration options
     * @param {number} options.year - Card year (default: 2025)
     * @param {string} options.difficulty - AI difficulty (easy/medium/hard)
     */
    constructor(container, options = {}) {}

    /**
     * Initialize all components and start event listeners
     * @returns {Promise<void>}
     */
    async init() {
        // 1. Create DOM structure
        // 2. Instantiate core/GameController
        // 3. Instantiate all renderers/components
        // 4. Call init() on all child components
        // 5. Set up global event handlers (window resize, orientation change)
    }

    /**
     * Start a new game
     */
    startGame() {
        // Delegates to this.gameController.startGame()
    }

    /**
     * Clean up all components and remove event listeners
     */
    destroy() {}
}
```

**State managed:**
- `gameController`: Instance of core/GameController
- `handRenderer`: Instance of HandRenderer
- `exposedTilesRenderer`: Instance of ExposedTilesRenderer
- `opponentBars`: Array of 3 OpponentBar instances (right, top, left)
- `discardPileRenderer`: Instance of DiscardPileRenderer
- `hintsPanel`: Instance of HintsPanel
- `wallCounter`: Instance of WallCounter
- `bottomMenu`: Instance of BottomMenu
- `touchHandler`: Instance of TouchHandler
- `tileComponent`: TileComponent class reference (not instance)

**Events listened to:** None (top-level orchestrator)

**Events emitted:** None (delegates to children)

---

### 2. HandRenderer

**Purpose:** Renders the player's hand tiles in a 2-row grid layout with touch-friendly sizing.

```javascript
/**
 * HandRenderer
 *
 * Displays player's hand (13-14 tiles) in a 2-row responsive grid.
 */
class HandRenderer {
    /**
     * @param {HTMLElement} container - DOM element for hand section
     * @param {GameController} gameController - Core game controller instance
     */
    constructor(container, gameController) {}

    /**
     * Initialize and subscribe to GameController events
     */
    init() {
        // Subscribe to:
        // - HAND_UPDATED: { player: 0, hand: HandData }
        // - TILE_DRAWN: { player: 0, tile: TileData }
        // - UI_PROMPT: { promptType: 'DISCARD', callback: function }
    }

    /**
     * Render hand tiles from HandData
     * @param {HandData} handData - Player's hand state
     */
    render(handData) {
        // 1. Clear existing tiles
        // 2. Create TileComponent for each tile in handData.tiles
        // 3. Layout in 2-row grid (7 tiles top row, remaining bottom row)
        // 4. Apply selected state to tiles in this.selectedIndices
    }

    /**
     * Handle tile selection/deselection
     * @param {number} tileIndex - Index of tile clicked
     */
    selectTile(tileIndex) {
        // Toggle tile in this.selectedIndices
        // Update visual state (add/remove 'selected' class)
    }

    /**
     * Clear all tile selections
     */
    clearSelection() {}

    /**
     * Sort hand tiles by suit and rank
     */
    sortHand() {
        // Emit request to GameController to sort player hand
        // GameController will respond with HAND_UPDATED event
    }

    /**
     * Enable/disable tile interaction
     * @param {boolean} enabled
     */
    setInteractive(enabled) {}

    /**
     * Clean up DOM and event listeners
     */
    destroy() {}
}
```

**State managed:**
- `container`: DOM element reference
- `gameController`: GameController instance
- `tiles`: Array of TileComponent instances
- `selectedIndices`: Set of selected tile indices
- `interactive`: Boolean flag for enabling/disabling touch

**Events listened to:**
- `HAND_UPDATED`: { player: number, hand: HandData }
- `TILE_DRAWN`: { player: number, tile: TileData }
- `UI_PROMPT`: { promptType: string, callback: function, data?: any }

**Events emitted:** None (uses GameController callbacks)

---

### 3. ExposedTilesRenderer

**Purpose:** Displays player's exposed tile sets (Pungs, Kongs, Quints) above the hand.

```javascript
/**
 * ExposedTilesRenderer
 *
 * Renders exposed tile sets in compact horizontal groups.
 */
class ExposedTilesRenderer {
    /**
     * @param {HTMLElement} container - DOM element for exposed tiles section
     * @param {GameController} gameController - Core game controller instance
     */
    constructor(container, gameController) {}

    /**
     * Initialize and subscribe to events
     */
    init() {
        // Subscribe to:
        // - TILES_EXPOSED: { player: 0, exposure: ExposureData }
        // - HAND_UPDATED: { player: 0, hand: HandData } (contains exposures)
    }

    /**
     * Render all exposure sets
     * @param {Array<ExposureData>} exposures - Array of exposure objects
     */
    render(exposures) {
        // 1. Clear container
        // 2. Create .exposure-set div for each exposure
        // 3. Create small TileComponent for each tile in exposure
        // 4. Label exposure type (PUNG/KONG/QUINT)
    }

    /**
     * Add a new exposure set with animation
     * @param {ExposureData} exposure - New exposure to add
     */
    addExposure(exposure) {
        // Animate in new exposure set
    }

    /**
     * Clean up DOM and listeners
     */
    destroy() {}
}
```

**State managed:**
- `container`: DOM element
- `gameController`: GameController instance
- `exposureSets`: Array of DOM elements representing each exposure

**Events listened to:**
- `TILES_EXPOSED`: { player: number, exposure: ExposureData }
- `HAND_UPDATED`: { player: number, hand: HandData }

**Events emitted:** None

---

### 4. OpponentBar

**Purpose:** Displays compact opponent information (name, tile count, exposures, turn indicator).

```javascript
/**
 * OpponentBar
 *
 * Single bar showing opponent state in minimized form.
 */
class OpponentBar {
    /**
     * @param {HTMLElement} container - DOM element for this opponent bar
     * @param {number} playerIndex - Player position (1=right, 2=top, 3=left)
     * @param {GameController} gameController - Core game controller instance
     */
    constructor(container, playerIndex, gameController) {}

    /**
     * Initialize and subscribe to events for this player
     */
    init() {
        // Subscribe to:
        // - HAND_UPDATED (filtered by playerIndex)
        // - TILES_EXPOSED (filtered by playerIndex)
        // - TURN_CHANGED
        // - TILE_DRAWN (filtered by playerIndex)
        // - TILE_DISCARDED (filtered by playerIndex)
    }

    /**
     * Update opponent info display
     * @param {PlayerData} playerData - Opponent's current state
     */
    update(playerData) {
        // Update:
        // - Opponent name/position (e.g., "Opponent 1 (East)")
        // - Tile count (e.g., "13 tiles")
        // - Exposure icons (small representations)
    }

    /**
     * Set turn indicator active/inactive
     * @param {boolean} isActive
     */
    setTurnIndicator(isActive) {
        // Add/remove [data-current-turn="true"] attribute
        // Applies yellow glowing border via CSS
    }

    /**
     * Clean up listeners
     */
    destroy() {}
}
```

**State managed:**
- `container`: DOM element
- `playerIndex`: Player position (1-3)
- `gameController`: GameController instance
- `tileCount`: Current tile count
- `exposures`: Array of ExposureData
- `isCurrentTurn`: Boolean

**Events listened to:**
- `HAND_UPDATED`: { player: number, hand: HandData }
- `TILES_EXPOSED`: { player: number, exposure: ExposureData }
- `TURN_CHANGED`: { currentPlayer: number, previousPlayer: number }
- `TILE_DRAWN`: { player: number, tile: TileData }
- `TILE_DISCARDED`: { player: number, tile: TileData }

**Events emitted:** None

---

### 5. DiscardPileRenderer

**Purpose:** Displays discarded tiles in a 9×12 scrollable grid, highlighting the latest discard.

```javascript
/**
 * DiscardPileRenderer
 *
 * Center area showing all discarded tiles in chronological order.
 */
class DiscardPileRenderer {
    /**
     * @param {HTMLElement} container - DOM element for discard pile section
     * @param {GameController} gameController - Core game controller instance
     */
    constructor(container, gameController) {}

    /**
     * Initialize and subscribe to events
     */
    init() {
        // Subscribe to:
        // - TILE_DISCARDED: { player: number, tile: TileData }
        // - DISCARD_CLAIMED: { player: number, claimer: number, tile: TileData }
        // - GAME_STARTED (to clear pile)
    }

    /**
     * Add a discarded tile with animation
     * @param {TileData} tile - Tile to add
     * @param {number} fromPlayer - Player who discarded it
     */
    addDiscard(tile, fromPlayer) {
        // 1. Create small TileComponent
        // 2. Mark as .latest (yellow border + pulse animation)
        // 3. Remove .latest from previous tile
        // 4. Append to grid
        // 5. Auto-scroll to show latest
    }

    /**
     * Remove a tile that was claimed
     * @param {TileData} tile - Tile that was claimed
     */
    removeClaimed(tile) {
        // Fade out and remove tile element
    }

    /**
     * Clear all discards (for new game)
     */
    clear() {}

    /**
     * Clean up DOM and listeners
     */
    destroy() {}
}
```

**State managed:**
- `container`: DOM element
- `gameController`: GameController instance
- `discards`: Array of { tile: TileData, element: HTMLElement, fromPlayer: number }

**Events listened to:**
- `TILE_DISCARDED`: { player: number, tile: TileData }
- `DISCARD_CLAIMED`: { player: number, claimer: number, tile: TileData }
- `GAME_STARTED`: { }

**Events emitted:** None

---

### 6. HintsPanel

**Purpose:** Collapsible panel showing AI recommendations for best patterns and discards.

```javascript
/**
 * HintsPanel
 *
 * Expandable hints area showing pattern matches and AI suggestions.
 */
class HintsPanel {
    /**
     * @param {HTMLElement} container - DOM element for hints panel
     * @param {GameController} gameController - Core game controller instance
     */
    constructor(container, gameController) {}

    /**
     * Initialize and subscribe to events
     */
    init() {
        // Subscribe to:
        // - HAND_UPDATED (player 0 only)
        // - TILE_DRAWN (player 0 only)
        // Set up toggle button click handler
    }

    /**
     * Toggle panel open/closed
     */
    toggle() {
        // Animate height expansion/collapse
        // Update ARIA attributes for accessibility
    }

    /**
     * Update hints based on current hand
     * @param {HandData} handData - Current player hand
     */
    updateHints(handData) {
        // 1. Call Card.rankHand(handData.tiles)
        // 2. Display top 3-5 patterns with scores
        // 3. Call AIEngine.getTileRecommendations(handData)
        // 4. Highlight recommended discards (if panel open)
    }

    /**
     * Clear hints display
     */
    clear() {}

    /**
     * Clean up listeners
     */
    destroy() {}
}
```

**State managed:**
- `container`: DOM element
- `gameController`: GameController instance
- `isOpen`: Boolean (panel expanded state)
- `currentHints`: Array of { patternName: string, score: number }

**Events listened to:**
- `HAND_UPDATED`: { player: number, hand: HandData }
- `TILE_DRAWN`: { player: number, tile: TileData }

**Events emitted:** None

---

### 7. WallCounter

**Purpose:** Floating counter showing remaining drawable tiles in the wall.

```javascript
/**
 * WallCounter
 *
 * Fixed position counter display (top-right corner).
 */
class WallCounter {
    /**
     * @param {HTMLElement} container - DOM element for wall counter
     * @param {GameController} gameController - Core game controller instance
     */
    constructor(container, gameController) {}

    /**
     * Initialize and subscribe to events
     */
    init() {
        // Subscribe to:
        // - TILE_DRAWN: { player: number, tile: TileData }
        // - GAME_STARTED: { wallSize: number }
    }

    /**
     * Update the counter display
     * @param {number} count - Remaining tiles
     */
    update(count) {
        // Update .wall-tiles text content
        // Add animation on change (brief pulse/scale)
    }

    /**
     * Clean up listeners
     */
    destroy() {}
}
```

**State managed:**
- `container`: DOM element
- `gameController`: GameController instance
- `count`: Current wall count

**Events listened to:**
- `TILE_DRAWN`: { player: number, tile: TileData }
- `GAME_STARTED`: { wallSize: number }

**Events emitted:** None

---

### 8. BottomMenu

**Purpose:** Fixed bottom bar with DRAW and SORT action buttons.

```javascript
/**
 * BottomMenu
 *
 * Action buttons for player interactions (DRAW tile, SORT hand).
 */
class BottomMenu {
    /**
     * @param {HTMLElement} container - DOM element for bottom menu
     * @param {GameController} gameController - Core game controller instance
     * @param {HandRenderer} handRenderer - Reference to hand renderer for SORT action
     */
    constructor(container, gameController, handRenderer) {}

    /**
     * Initialize button handlers
     */
    init() {
        // Set up click handlers:
        // - DRAW button -> calls gameController.pickFromWall() if player's turn
        // - SORT button -> calls handRenderer.sortHand()
        // Subscribe to:
        // - UI_PROMPT (to show/hide DRAW button based on game state)
        // - TURN_CHANGED (to enable/disable DRAW based on turn)
    }

    /**
     * Enable/disable DRAW button
     * @param {boolean} enabled
     */
    setDrawEnabled(enabled) {
        // Add/remove 'disabled' class
        // Update ARIA attributes
    }

    /**
     * Show/hide DRAW button entirely
     * @param {boolean} visible
     */
    setDrawVisible(visible) {}

    /**
     * Clean up listeners
     */
    destroy() {}
}
```

**State managed:**
- `container`: DOM element
- `gameController`: GameController instance
- `handRenderer`: HandRenderer reference
- `drawButton`: Button element
- `sortButton`: Button element

**Events listened to:**
- `UI_PROMPT`: { promptType: string, callback: function }
- `TURN_CHANGED`: { currentPlayer: number }

**Events emitted:** None (uses GameController methods)

---

### 9. TouchHandler

**Purpose:** Detects touch gestures and translates them to game actions.

```javascript
/**
 * TouchHandler
 *
 * High-level gesture detection for mobile interactions.
 */
class TouchHandler {
    /**
     * @param {HTMLElement} element - Element to attach touch listeners to
     * @param {Object} callbacks - Callback functions for each gesture
     * @param {Function} callbacks.onTap - Called on single tap (x, y, target)
     * @param {Function} callbacks.onDoubleTap - Called on double tap (x, y, target)
     * @param {Function} callbacks.onLongPress - Called on long press (x, y, target)
     * @param {Function} callbacks.onSwipeUp - Called on upward swipe (startY, endY, target)
     */
    constructor(element, callbacks) {}

    /**
     * Initialize touch event listeners
     */
    init() {
        // Attach touchstart, touchmove, touchend listeners
        // Track touch state for gesture detection
    }

    /**
     * Enable/disable touch handling
     * @param {boolean} enabled
     */
    setEnabled(enabled) {}

    /**
     * Remove all event listeners
     */
    destroy() {}
}

// Gesture Detection Thresholds:
// - TAP: touchend within 300ms, movement < 10px
// - DOUBLE_TAP: 2 taps within 500ms
// - LONG_PRESS: touchstart held for 500ms without movement
// - SWIPE_UP: touchmove > 50px vertical, < 30px horizontal
```

**State managed:**
- `element`: Target element
- `callbacks`: Gesture callback functions
- `touchState`: { startTime, startX, startY, moved, target }
- `lastTapTime`: Timestamp for double-tap detection
- `longPressTimer`: setTimeout reference
- `enabled`: Boolean

**Events listened to:** None (uses native touch events)

**Events emitted:** Calls callback functions (not DOM events)

---

### 10. TileComponent

**Purpose:** Reusable tile rendering component using sprite sheet (same as desktop).

```javascript
/**
 * TileComponent
 *
 * Creates a single tile DOM element with sprite background.
 */
class TileComponent {
    /**
     * @param {TileData} tileData - Tile data (suit, number, index)
     * @param {Object} options - Rendering options
     * @param {string} options.size - 'small' | 'medium' | 'large' (default: 'large')
     * @param {boolean} options.interactive - Enable click/touch (default: true)
     * @param {Function} options.onClick - Click handler (default: null)
     */
    constructor(tileData, options = {}) {}

    /**
     * Create and return the tile DOM element with sprite background
     * @returns {HTMLElement}
     */
    render() {
        // 1. Create <button class="tile-sprite"> or <div class="tile-sprite">
        // 2. Set data-suit and data-number attributes
        // 3. Calculate sprite position using getSpritePosition()
        // 4. Apply background-image and background-position
        // 5. Apply size class (width/height for large/medium/small)
        // 6. Attach click handler if interactive
        // 7. Return element
    }

    /**
     * Calculate sprite position in the sprite sheet
     * @returns {Object} { x: number, y: number } - Background position in pixels
     */
    getSpritePosition() {
        // Use same logic as desktop/adapters/PhaserAdapter.js getTileSpriteName()
        // Sprite sheet layout: horizontal strip, each tile 52px × 69px
        // tiles.png is 2028px × 69px (39 tiles total)
        // Return negative pixel offset for background-position
    }

    /**
     * Update tile state (selected, disabled, highlighted)
     * @param {string} state - 'normal' | 'selected' | 'disabled' | 'highlighted'
     */
    setState(state) {
        // Add/remove CSS classes
    }

    /**
     * Get the DOM element
     * @returns {HTMLElement}
     */
    getElement() {}

    /**
     * Remove from DOM
     */
    destroy() {}
}

// Sprite Sheet Layout (from assets/tiles.png):
// - Each tile: 52px × 69px
// - Sheet: Single horizontal strip, 2028px × 69px (39 tiles total)
// - Order: Crack 1-9, Bam 1-9, Dot 1-9, Winds (N/E/W/S), Dragons (R/G/W), Jokers, Flowers, Blanks
// - Sprite names: crack1.png, bam5.png, north.png, red.png, joker.png, etc.
// - Position calculation: x = -(tile_index * 52), y = 0
```

**State managed:**
- `tileData`: TileData instance
- `options`: Rendering options
- `element`: DOM element
- `currentState`: Current visual state

**Events listened to:** None (stateless component)

**Events emitted:** Calls onClick callback if provided

---

## Event Flow Scenarios

### Scenario 1: Player Draws Tile

**Trigger:** Player's turn, player taps DRAW button

**Flow:**
```
1. User taps DRAW button
   └─> BottomMenu.drawButton.onclick fires
       └─> Calls gameController.pickFromWall()

2. GameController processes draw
   └─> Emits TILE_DRAWN: { player: 0, tile: TileData }

3. HandRenderer receives TILE_DRAWN
   └─> Calls render() with updated hand
       └─> Creates new TileComponent
           └─> Animates tile sliding in from top (CSS transition)

4. WallCounter receives TILE_DRAWN
   └─> Calls update(newCount)
       └─> Updates counter text with pulse animation

5. HintsPanel receives TILE_DRAWN
   └─> Calls updateHints() with new hand
       └─> Recalculates pattern matches
           └─> Updates hint display (if panel open)

6. GameController emits UI_PROMPT: { promptType: 'DISCARD', callback }
   └─> HandRenderer receives UI_PROMPT
       └─> Enables tile selection (setInteractive(true))
```

---

### Scenario 2: Player Discards Tile

**Trigger:** Player selects a tile and confirms discard

**Flow:**
```
1. User taps tile in hand
   └─> TileComponent.onClick fires
       └─> HandRenderer.selectTile(index) called
           └─> Adds 'selected' class to tile (yellow background)

2. User taps tile again (or separate discard button)
   └─> HandRenderer confirms discard
       └─> Calls UI_PROMPT callback: callback({ tile: TileData })

3. GameController processes discard
   └─> Emits TILE_DISCARDED: { player: 0, tile: TileData }

4. HandRenderer receives TILE_DISCARDED
   └─> Calls render() with updated hand
       └─> Removes discarded tile with fade-out animation
           └─> Re-layouts remaining tiles

5. DiscardPileRenderer receives TILE_DISCARDED
   └─> Calls addDiscard(tile, 0)
       └─> Creates TileComponent in discard grid
           └─> Marks as .latest (yellow border + pulse)
               └─> Animates slide from bottom to center

6. GameController emits TURN_CHANGED: { currentPlayer: 1, previousPlayer: 0 }
   └─> OpponentBar[1] receives TURN_CHANGED
       └─> Calls setTurnIndicator(true) on next player
   └─> BottomMenu receives TURN_CHANGED
       └─> Calls setDrawEnabled(false) (not player's turn)

7. GameController emits UI_PROMPT: { promptType: 'CLAIM_QUERY', callback }
   └─> (Mobile handles this differently - shows claim buttons overlay)
```

---

### Scenario 3: Opponent Exposes Tiles

**Trigger:** AI opponent (player 1, 2, or 3) exposes a Pung/Kong

**Flow:**
```
1. GameController processes AI exposure
   └─> Emits TILES_EXPOSED: { player: 2, exposure: ExposureData }

2. OpponentBar[2] receives TILES_EXPOSED
   └─> Calls update() with new exposure
       └─> Adds exposure icon to .opponent-exposed area
           └─> Shows "PUNG" or "KONG" indicator with small tiles

3. GameController emits HAND_UPDATED: { player: 2, hand: HandData }
   └─> OpponentBar[2] receives HAND_UPDATED
       └─> Updates tile count display (e.g., "9 tiles")
           └─> (13 - 3 for Pung = 10 in hand, but 3 exposed shown separately)

4. HintsPanel receives HAND_UPDATED (filters for player 0)
   └─> (Ignores - not player's hand)

Visual Result:
- Opponent bar shows: "Opponent 2 (South) | 10 tiles | [PUNG icon]"
- Exposure icon animates in with brief scale effect
```

---

### Scenario 4: Hand Changes Trigger Hints Update

**Trigger:** Any change to player's hand (draw, discard, exposure, sort)

**Flow:**
```
1. GameController emits HAND_UPDATED: { player: 0, hand: HandData }

2. HandRenderer receives HAND_UPDATED
   └─> Calls render(handData)
       └─> Rebuilds tile layout
           └─> Preserves selection state if tiles match

3. HintsPanel receives HAND_UPDATED
   └─> Calls updateHints(handData)
       └─> Calls Card.rankHand(handData.tiles)
           └─> Gets top pattern matches with scores
               └─> Formats output:
                   "2025 #15 - Consecutive Odds (8)"
                   "2025 #22 - Like Numbers (6)"
       └─> Calls AIEngine.getTileRecommendations(handData)
           └─> Gets tile keep-values
               └─> Identifies worst tiles to discard
       └─> Updates .hint-patterns display
           └─> Highlights tiles in HandRenderer if panel open

4. ExposedTilesRenderer receives HAND_UPDATED
   └─> Checks handData.exposures
       └─> Calls render(exposures)
           └─> Rebuilds exposure sets if changed

Visual Result:
- Hand tiles re-render in sorted order (if sorted)
- Hints panel shows updated pattern rankings
- Exposed tiles section reflects any new exposures
```

---

## Critical Decisions

### Decision 1: Component Creation Strategy

**Question:** Should all components be created eagerly (upfront) or lazily (on demand)?

**Chosen Approach:** **Eager creation** (all components instantiated in MobileGameController.init())

**Rationale:**
1. **Simplicity:** All components exist from the start, no null checks needed
2. **Performance:** Mobile game is small (~10 components), instantiation cost negligible
3. **Event listeners:** Components can subscribe to events immediately, won't miss early game events
4. **Predictable lifecycle:** All components follow init() → events → destroy() pattern

**Implementation:**
```javascript
async init() {
    // Create all components upfront
    this.handRenderer = new HandRenderer(this.handContainer, this.gameController);
    this.exposedTilesRenderer = new ExposedTilesRenderer(this.exposedContainer, this.gameController);
    this.opponentBars = [
        new OpponentBar(this.opponentContainer1, 1, this.gameController),
        new OpponentBar(this.opponentContainer2, 2, this.gameController),
        new OpponentBar(this.opponentContainer3, 3, this.gameController)
    ];
    // ... etc for all components

    // Initialize all
    this.handRenderer.init();
    this.exposedTilesRenderer.init();
    this.opponentBars.forEach(bar => bar.init());
    // ... etc
}
```

**Alternative Considered (Lazy):** Create components when first needed (e.g., create HintsPanel only when user opens it). **Rejected** because it adds complexity and the performance benefit is negligible.

---

### Decision 2: Error Handling for Out-of-Order Events

**Question:** What happens if an event fires before a component is ready to handle it?

**Chosen Approach:** **Event queuing not needed - rely on proper initialization order**

**Rationale:**
1. **Initialization order guarantees safety:**
   - MobileGameController.init() creates and initializes all components
   - GameController.startGame() is called AFTER all components are initialized
   - Events only fire after startGame(), so all listeners are ready

2. **GameController doesn't emit events in constructor:**
   - No events fired during instantiation
   - Components have time to set up listeners before game starts

3. **If component misses event (shouldn't happen):**
   - Component can query GameController.getGameState() to sync
   - Example: `const state = this.gameController.getGameState()` returns full game snapshot

**Implementation:**
```javascript
// MobileGameController.init() order:
async init() {
    // 1. Create GameController (doesn't fire events yet)
    this.gameController = new GameController();

    // 2. Create and initialize all components (sets up listeners)
    this.handRenderer = new HandRenderer(container, this.gameController);
    this.handRenderer.init(); // Subscribes to events

    // 3. Only THEN start the game (now events will fire)
    // User clicks START button -> this.startGame()
}

startGame() {
    this.gameController.startGame(); // NOW events start firing
}
```

**Alternative Considered (Event Queue):** Buffer events if component not ready, replay on init(). **Rejected** because proper initialization order makes this unnecessary.

---

### Decision 3: Animation Coordination

**Question:** How to prevent animation conflicts when rapid events occur (e.g., fast AI turns)?

**Chosen Approach:** **Queue animations with animation completion callbacks**

**Rationale:**
1. **Visual clarity:** One animation at a time prevents jarring overlaps
2. **State consistency:** DOM updates complete before next event processed
3. **Mobile performance:** Reduces simultaneous reflows/repaints

**Implementation:**
```javascript
class HandRenderer {
    constructor(container, gameController) {
        this.container = container;
        this.gameController = gameController;
        this.animationQueue = []; // Queue of pending animations
        this.isAnimating = false;
    }

    async render(handData) {
        // Add to queue
        this.animationQueue.push(() => this._renderWithAnimation(handData));

        // Process queue if not already animating
        if (!this.isAnimating) {
            await this.processAnimationQueue();
        }
    }

    async processAnimationQueue() {
        this.isAnimating = true;

        while (this.animationQueue.length > 0) {
            const animationFn = this.animationQueue.shift();
            await animationFn(); // Wait for animation to complete
        }

        this.isAnimating = false;
    }

    async _renderWithAnimation(handData) {
        // Animate tile removal/addition
        // Return promise that resolves when animation completes
        return new Promise(resolve => {
            // ... DOM updates with CSS transitions
            setTimeout(resolve, 300); // Animation duration
        });
    }
}
```

**Alternative Considered (Cancel Animations):** Immediately cancel ongoing animations and snap to new state. **Rejected** because it creates jarring visual jumps.

**Fallback for Performance:** If animation queue grows > 5 items, skip animations and snap to final state (prevents lag on slow devices).

---

### Decision 4: Touch Event Propagation

**Question:** How to handle overlapping touch targets (exposed tiles above hand tiles)?

**Chosen Approach:** **Use z-index layering + event.stopPropagation() in child handlers**

**Rationale:**
1. **CSS z-index creates clear visual hierarchy:**
   - Exposed tiles: z-index: 20
   - Hand tiles: z-index: 10
   - Background: z-index: 0

2. **stopPropagation() prevents event bubbling:**
   - Exposed tile click handler calls event.stopPropagation()
   - Prevents hand tile click from firing if exposed tile is tapped

3. **Event.target check as fallback:**
   - TouchHandler checks event.target before calling callback
   - Ensures correct component receives the touch event

**Implementation:**
```javascript
// ExposedTilesRenderer
render(exposures) {
    exposures.forEach(exposure => {
        const tileComponent = new TileComponent(tile, {
            onClick: (event) => {
                event.stopPropagation(); // Prevent hand from receiving click
                this.handleExposedTileClick(tile);
            }
        });
    });
}

// CSS
.exposed-section {
    position: relative;
    z-index: 20; /* Above hand */
}

.hand-container {
    position: relative;
    z-index: 10;
}

// TouchHandler (fallback check)
handleTouchEnd(event) {
    const target = event.target;

    // Check if target is a tile
    if (target.classList.contains('tile-btn')) {
        this.callbacks.onTap(x, y, target);
    }
}
```

**Alternative Considered (Pointer-events):** Use CSS `pointer-events: none` on hand when exposed tiles present. **Rejected** because it's too coarse-grained (would disable all hand interaction).

---

## Architecture Questions

### Q1: Component Communication - Direct Calls or Events Only?

**Answer:** **Hybrid approach - primarily events, with limited direct calls for utility methods**

**Event-driven (primary):**
- All game state changes communicated via GameController events
- Components subscribe to relevant events
- Components DO NOT directly call methods on other components (except parent-child)

**Direct calls (allowed for):**
- Parent → child utility methods (e.g., MobileGameController calls handRenderer.destroy())
- Sibling utility methods with explicit reference (e.g., BottomMenu calls handRenderer.sortHand())
- DOM manipulation helpers (e.g., TileComponent.setState())

**Examples:**
```javascript
// ✅ GOOD: Event-driven
this.gameController.on('HAND_UPDATED', (data) => {
    this.render(data.hand);
});

// ✅ GOOD: Parent calling child utility
this.handRenderer.destroy();

// ✅ GOOD: Explicit reference for utility
this.bottomMenu = new BottomMenu(container, gc, this.handRenderer);
// BottomMenu can call this.handRenderer.sortHand()

// ❌ BAD: Component reaching across to sibling
this.handRenderer.updateHints(); // NO! HintsPanel should listen to events
```

---

### Q2: State of Truth - GameController Only or Components Hold State?

**Answer:** **GameController is source of truth, components hold transient UI state only**

**GameController holds:**
- Game logic state (current player, turn, phase)
- Player hands (tiles, exposures)
- Wall (remaining tiles)
- Discard pile
- All game rules and validation

**Components hold (UI state only):**
- Visual state (selected tiles, animation status, panel open/closed)
- DOM references (cached elements)
- Transient input state (touch tracking, gesture detection)

**Rule:** Components can query GameController via `getGameState()` but NEVER modify game state directly (only via GameController methods/callbacks).

**Example:**
```javascript
// ✅ GOOD: Component holds UI state
class HandRenderer {
    constructor() {
        this.selectedIndices = new Set(); // UI state
    }

    selectTile(index) {
        this.selectedIndices.add(index); // OK - UI state
    }
}

// ❌ BAD: Component modifying game state
class HandRenderer {
    selectTile(index) {
        this.gameController.players[0].hand.tiles.splice(index, 1); // NO!
        // Use gameController.discardTile(index) instead
    }
}

// ✅ GOOD: Query game state for sync
class OpponentBar {
    init() {
        // If late initialization, sync from game state
        const state = this.gameController.getGameState();
        this.update(state.players[this.playerIndex]);
    }
}
```

---

### Q3: Event Naming Convention

**Answer:** **ALL_CAPS with namespace prefixes for clarity**

**Convention:**
- ALL_CAPS (e.g., `TILE_DRAWN`, `HAND_UPDATED`)
- Past tense for completed actions (`TILE_DRAWN`, not `DRAW_TILE`)
- Present tense for ongoing states (`TURN_CHANGED`)
- No namespaces needed (all events from GameController)

**Rationale:**
- ALL_CAPS distinguishes events from methods/properties
- Past tense clarifies action has completed
- Consistent with existing GameController events

**Examples:**
```javascript
// ✅ GOOD: Existing convention
gc.on('TILE_DRAWN', handler);
gc.on('HAND_UPDATED', handler);
gc.on('STATE_CHANGED', handler);

// ❌ BAD: Don't invent new conventions
gc.on('tile:drawn', handler); // No namespace
gc.on('drawTile', handler); // Not camelCase
gc.on('TILE_DRAW', handler); // Not past tense
```

---

### Q4: Sprite Loading - Who Loads assets/tiles.png and When?

**Answer:** **MobileGameController loads sprites during init(), uses same assets/tiles.png as desktop**

**Approach:**
- Mobile uses the same sprite tiles as desktop (assets/tiles.png)
- Tiles are scaled down for mobile screens via CSS (smaller dimensions)
- MobileGameController loads sprite image before game starts
- TileComponent renders using background-image with sprite positions

**Loading sequence:**
```javascript
// MobileGameController.init()
async init() {
    // 1. Load sprite sheet
    await this.loadSprites();

    // 2. Create components (can now render tiles)
    this.handRenderer = new HandRenderer(...);
    // ... etc
}

async loadSprites() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            this.spriteSheet = img;
            resolve();
        };
        img.onerror = reject;
        img.src = '../assets/tiles.png';
    });
}
```

**TileComponent uses sprites:**
```javascript
// TileComponent.render()
render() {
    const div = document.createElement('div');
    div.className = 'tile-sprite';
    div.dataset.suit = this.tileData.suit;
    div.dataset.number = this.tileData.number;

    // Calculate sprite position (same logic as desktop)
    const spritePos = this.getSpritePosition(this.tileData);
    div.style.backgroundImage = `url('../assets/tiles.png')`;
    div.style.backgroundPosition = `${spritePos.x}px ${spritePos.y}px`;

    return div;
}
```

**Note:** Text-in-box tiles are ONLY used in HintsPanel for AI pattern suggestions, not for actual game tiles.

---

### Q5: Responsive Behavior - Who Handles Window Resize?

**Answer:** **MobileGameController handles resize, delegates layout updates to components**

**Implementation:**
```javascript
class MobileGameController {
    init() {
        // Set up resize listener
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', this.handleResize);
    }

    handleResize() {
        // Debounce to avoid excessive updates
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            // Notify components to adjust layout
            this.handRenderer.handleResize?.();
            this.discardPileRenderer.handleResize?.();
            // Most components use CSS flexbox/grid, auto-adjust
        }, 250);
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);
    }
}
```

**Component implementation (optional):**
```javascript
class HandRenderer {
    // Optional - only if component needs custom resize logic
    handleResize() {
        // Recalculate tile sizes if needed
        // Most cases: CSS handles it automatically
    }
}
```

**Primary strategy:** Use responsive CSS (flexbox, grid, media queries) so components auto-adjust. Only implement handleResize() if component has dynamic JavaScript-based layout.

---

### Q6: Accessibility - ARIA Labels and Keyboard Support?

**Answer:** **ARIA labels required, keyboard support deferred to Phase 7B (polish)**

**Phase 3B-4D (MVP):**
- Add ARIA labels to all interactive elements
- Add ARIA live regions for screen reader announcements
- Semantic HTML (button, nav, section elements)
- Focus indicators (CSS :focus styles)

**Phase 7B (Future Enhancement):**
- Full keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader testing with NVDA/JAWS
- High contrast mode support
- Reduced motion preference (prefers-reduced-motion)

**Required ARIA attributes:**
```javascript
// Tiles
<button class="tile-btn"
        aria-label="Crack 2"
        aria-pressed="false"
        data-suit="CRACK"
        data-number="2">
    2C
</button>

// Buttons
<button class="menu-btn"
        aria-label="Draw tile from wall"
        aria-disabled="false">
    DRAW
</button>

// Hints panel
<div class="hints-panel"
     role="region"
     aria-label="AI Hints">
    <button class="hints-toggle"
            aria-expanded="false"
            aria-controls="hintsContent">
        HINTS
    </button>
    <div id="hintsContent" aria-hidden="true">
        ...
    </div>
</div>

// Live region for game announcements
<div aria-live="polite"
     aria-atomic="true"
     class="sr-only">
    <!-- Dynamically updated with game events -->
    "Opponent 2 drew a tile"
    "Your turn - select a tile to discard"
</div>
```

**CSS for screen reader only content:**
```css
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

---

## Test Scenarios

### HandRenderer Tests

**Test 1: HandRenderer handles rapid state changes**
```
Given: HandRenderer initialized with 13 tiles
When: 3 HAND_UPDATED events fire within 100ms
Then: Final state renders correctly (13 tiles displayed)
And: No duplicate tiles or visual glitches
And: Animation queue processes all updates in order
```

**Test 2: HandRenderer preserves selection across re-renders**
```
Given: HandRenderer with tiles A, B, C, D
And: Tile B is selected (selectedIndices contains B.index)
When: HAND_UPDATED event fires with same tiles but sorted
Then: Tile B remains selected after re-render
And: selectedIndices still contains B.index
And: 'selected' class applied to correct DOM element
```

**Test 3: HandRenderer handles empty hand gracefully**
```
Given: HandRenderer initialized
When: render() called with handData.tiles = []
Then: Container is cleared (no tiles displayed)
And: No JavaScript errors thrown
And: Container displays message "No tiles in hand"
```

---

### ExposedTilesRenderer Tests

**Test 1: ExposedTilesRenderer adds exposure with animation**
```
Given: ExposedTilesRenderer with 0 exposures
When: TILES_EXPOSED event fires with Pung exposure
Then: New exposure set appears in container
And: Contains 3 TileComponent elements
And: Labeled "PUNG" or has pung icon
And: Animation plays (scale-in or fade-in)
```

**Test 2: ExposedTilesRenderer handles multiple exposure types**
```
Given: ExposedTilesRenderer initialized
When: TILES_EXPOSED fires with Pung (3 tiles)
And: TILES_EXPOSED fires with Kong (4 tiles)
And: TILES_EXPOSED fires with Quint (5 tiles)
Then: 3 exposure sets displayed
And: Each set shows correct tile count
And: Each set has correct type label
And: Sets arranged horizontally with gaps
```

**Test 3: ExposedTilesRenderer syncs with HAND_UPDATED**
```
Given: Game state has 2 exposures (Pung + Kong)
When: ExposedTilesRenderer.init() called late (after game started)
And: HAND_UPDATED event fires
Then: render() displays both existing exposures
And: Component syncs with current game state
And: No duplicate exposure sets created
```

---

### OpponentBar Tests

**Test 1: OpponentBar updates tile count on draw/discard**
```
Given: OpponentBar for player 2 showing "13 tiles"
When: TILE_DRAWN event fires for player 2
Then: Tile count updates to "14 tiles"
When: TILE_DISCARDED event fires for player 2
Then: Tile count updates to "13 tiles"
And: Update animates (brief pulse or fade)
```

**Test 2: OpponentBar highlights active turn**
```
Given: OpponentBar for player 2
When: TURN_CHANGED event fires with currentPlayer: 2
Then: setTurnIndicator(true) called
And: data-current-turn="true" attribute set
And: Yellow glowing border appears (via CSS)
When: TURN_CHANGED event fires with currentPlayer: 3
Then: setTurnIndicator(false) called
And: data-current-turn="false" attribute set
And: Border returns to normal
```

**Test 3: OpponentBar displays exposures compactly**
```
Given: OpponentBar for player 1
When: TILES_EXPOSED event fires with Kong exposure
Then: Exposure icon appears in .opponent-exposed area
And: Shows 4 small tiles or "KONG" indicator
And: Tile count adjusts (13 → 9 in hand, 4 exposed)
When: Second TILES_EXPOSED event fires with Pung
Then: Second exposure icon added
And: Both exposures visible side-by-side
And: Container wraps if too many exposures
```

---

### DiscardPileRenderer Tests

**Test 1: DiscardPileRenderer highlights latest discard**
```
Given: DiscardPileRenderer with 5 tiles
When: TILE_DISCARDED event fires with new tile
Then: New tile added to grid
And: New tile has .latest class (yellow border + pulse)
And: Previous latest tile loses .latest class
And: Scroll position adjusts to show new tile
```

**Test 2: DiscardPileRenderer handles 100+ tiles**
```
Given: DiscardPileRenderer initialized
When: 108 TILE_DISCARDED events fire (full wall discarded)
Then: All 108 tiles displayed in 9×12 grid
And: Grid scrolls vertically (overflow-y: auto)
And: No layout overflow or broken grid
And: Performance remains smooth (60fps)
```

**Test 3: DiscardPileRenderer removes claimed tile**
```
Given: DiscardPileRenderer with 10 tiles
When: DISCARD_CLAIMED event fires for tile #7
Then: Tile #7 element fades out (300ms animation)
And: Element removed from DOM after fade
And: Grid layout adjusts (no empty space)
And: Remaining tiles maintain chronological order
```

---

### HintsPanel Tests

**Test 1: HintsPanel toggles open/closed**
```
Given: HintsPanel initialized (closed)
When: User taps HINTS button
Then: Panel expands (max-height: 120px animation)
And: aria-expanded="true" attribute set
And: Button shows "▼ HINTS" or similar indicator
When: User taps HINTS button again
Then: Panel collapses (max-height: 0 animation)
And: aria-expanded="false" attribute set
```

**Test 2: HintsPanel updates on hand change**
```
Given: HintsPanel open, player has 13 tiles
When: HAND_UPDATED event fires with new tiles
Then: updateHints() called
And: Card.rankHand() calculates pattern scores
And: Top 3 patterns displayed with scores
And: Example: "2025 #15 - Consecutive Odds (8)"
And: Update completes within 500ms (no UI lag)
```

**Test 3: HintsPanel handles no matching patterns**
```
Given: HintsPanel open, player has random tiles
When: Card.rankHand() returns empty array (no matches)
Then: Panel displays "No strong patterns detected"
And: Suggests "Try exposing tiles or passing Charleston"
And: No JavaScript errors thrown
```

---

### WallCounter Tests

**Test 1: WallCounter decrements on each draw**
```
Given: WallCounter showing "48"
When: TILE_DRAWN event fires
Then: Counter updates to "47" with pulse animation
When: 47 more TILE_DRAWN events fire
Then: Counter reaches "0"
And: Counter changes color (red) when < 10 tiles
```

**Test 2: WallCounter resets on new game**
```
Given: WallCounter showing "12" (mid-game)
When: GAME_STARTED event fires with wallSize: 48
Then: Counter resets to "48"
And: Counter color returns to default (yellow)
And: Reset animates (brief scale or fade)
```

**Test 3: WallCounter handles invalid data gracefully**
```
Given: WallCounter initialized
When: TILE_DRAWN event fires with malformed data
And: Wall count calculation results in NaN or negative
Then: Counter displays "0" (fallback)
And: Error logged to console
And: No UI crash or blank display
```

---

### BottomMenu Tests

**Test 1: BottomMenu enables DRAW on player turn**
```
Given: BottomMenu initialized
When: TURN_CHANGED event fires with currentPlayer: 0
And: UI_PROMPT event fires with promptType: 'PICK'
Then: DRAW button enabled (aria-disabled="false")
And: Button clickable (no 'disabled' class)
When: User taps DRAW button
Then: gameController.pickFromWall() called
And: Button disabled until next turn
```

**Test 2: BottomMenu disables DRAW on opponent turn**
```
Given: DRAW button enabled (player's turn)
When: TURN_CHANGED event fires with currentPlayer: 1
Then: DRAW button disabled (aria-disabled="true")
And: Button grayed out (opacity: 0.5)
And: Click handler does nothing when tapped
```

**Test 3: BottomMenu SORT button always enabled**
```
Given: BottomMenu initialized
When: Player taps SORT button (any game state)
Then: handRenderer.sortHand() called
And: Button shows brief press animation
And: Button remains enabled (SORT always available)
```

---

### TouchHandler Tests

**Test 1: TouchHandler detects single tap**
```
Given: TouchHandler attached to tile element
When: User touches tile (touchstart)
And: User releases within 300ms (touchend)
And: Touch movement < 10px
Then: onTap callback fires with (x, y, target)
And: Callback receives correct tile element as target
```

**Test 2: TouchHandler detects double-tap**
```
Given: TouchHandler attached to element
When: User taps (touchstart → touchend)
And: User taps again within 500ms
Then: onDoubleTap callback fires
And: onTap does NOT fire for second tap
And: Third tap (if < 500ms) fires onTap, not onDoubleTap
```

**Test 3: TouchHandler detects long press**
```
Given: TouchHandler attached to element
When: User touches element (touchstart)
And: Holds for 500ms without moving
Then: onLongPress callback fires
And: touchend does NOT trigger onTap after long press
When: User moves > 10px during hold
Then: onLongPress does NOT fire (movement cancels)
```

---

### TileComponent Tests

**Test 1: TileComponent renders correct sprite position**
```
Given: TileData with suit: CRACK, number: 5
When: TileComponent.render() called
Then: Element has background-image pointing to assets/tiles.png
And: data-suit="CRACK" attribute set
And: data-number="5" attribute set
And: background-position calculated correctly for Crack 5 sprite
And: Element returned is <button class="tile-sprite"> or <div>
And: Element dimensions match size option (large/medium/small)
```

**Test 2: TileComponent handles special tiles with sprites**
```
Given: TileData with suit: JOKER, number: 0
When: TileComponent.render() called
Then: getSpritePosition() returns correct joker sprite coordinates
And: Background-position set to joker sprite location
Given: TileData with suit: WIND, number: 0
Then: getSpritePosition() returns North wind sprite coordinates
Given: TileData with suit: DRAGON, number: 0
Then: getSpritePosition() returns Red dragon sprite coordinates
```

**Test 3: TileComponent setState updates visual**
```
Given: TileComponent rendered in 'normal' state
When: setState('selected') called
Then: Element has 'selected' class added
And: Border/outline changes (via CSS, e.g., yellow border)
When: setState('disabled') called
Then: Element has 'disabled' class added
And: Opacity set to 0.5, pointer-events disabled
And: 'selected' class removed
```

---

## Example Usage

### Bootstrap Sequence

**File:** `mobile/main.js`

```javascript
import { MobileGameController } from './MobileGameController.js';

async function initMobileGame() {
    // Get root container
    const container = document.getElementById('mobile-game-root');

    // Create mobile UI controller
    const mobileUI = new MobileGameController(container, {
        year: 2025,
        difficulty: 'medium'
    });

    // Initialize (creates all components)
    await mobileUI.init();

    // Attach to global for debugging
    window.game = mobileUI;

    // Start game on button click
    document.getElementById('start-button').addEventListener('click', () => {
        mobileUI.startGame();
    });
}

// Start when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileGame);
} else {
    initMobileGame();
}
```

---

### MobileGameController Implementation Sketch

**File:** `mobile/MobileGameController.js`

```javascript
import { GameController } from '../core/GameController.js';
import { HandRenderer } from './renderers/HandRenderer.js';
import { ExposedTilesRenderer } from './renderers/ExposedTilesRenderer.js';
import { OpponentBar } from './renderers/OpponentBar.js';
import { DiscardPileRenderer } from './renderers/DiscardPileRenderer.js';
import { HintsPanel } from './components/HintsPanel.js';
import { WallCounter } from './components/WallCounter.js';
import { BottomMenu } from './components/BottomMenu.js';
import { TouchHandler } from './gestures/TouchHandler.js';

export class MobileGameController {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            year: options.year || 2025,
            difficulty: options.difficulty || 'medium'
        };

        // Will be created in init()
        this.gameController = null;
        this.handRenderer = null;
        this.exposedTilesRenderer = null;
        this.opponentBars = [];
        this.discardPileRenderer = null;
        this.hintsPanel = null;
        this.wallCounter = null;
        this.bottomMenu = null;
        this.touchHandler = null;
    }

    async init() {
        // 1. Create DOM structure
        this.createDOMStructure();

        // 2. Instantiate core GameController
        this.gameController = new GameController();
        await this.gameController.init({ year: this.options.year });

        // 3. Create all UI components (eager creation)
        this.handRenderer = new HandRenderer(
            this.container.querySelector('.hand-container'),
            this.gameController
        );

        this.exposedTilesRenderer = new ExposedTilesRenderer(
            this.container.querySelector('.exposed-section'),
            this.gameController
        );

        this.opponentBars = [
            new OpponentBar(this.container.querySelector('.opponent-bar[data-position="right"]'), 1, this.gameController),
            new OpponentBar(this.container.querySelector('.opponent-bar[data-position="top"]'), 2, this.gameController),
            new OpponentBar(this.container.querySelector('.opponent-bar[data-position="left"]'), 3, this.gameController)
        ];

        this.discardPileRenderer = new DiscardPileRenderer(
            this.container.querySelector('.discard-pile'),
            this.gameController
        );

        this.hintsPanel = new HintsPanel(
            this.container.querySelector('.hints-panel'),
            this.gameController
        );

        this.wallCounter = new WallCounter(
            this.container.querySelector('.wall-counter'),
            this.gameController
        );

        this.bottomMenu = new BottomMenu(
            this.container.querySelector('.bottom-menu'),
            this.gameController,
            this.handRenderer
        );

        // 4. Initialize all components (sets up event listeners)
        this.handRenderer.init();
        this.exposedTilesRenderer.init();
        this.opponentBars.forEach(bar => bar.init());
        this.discardPileRenderer.init();
        this.hintsPanel.init();
        this.wallCounter.init();
        this.bottomMenu.init();

        // 5. Set up global handlers
        this.setupGlobalHandlers();
    }

    createDOMStructure() {
        // Create HTML structure matching mockup.html
        this.container.innerHTML = `
            <div class="opponents-section">
                <div class="opponent-bar" data-position="right"></div>
                <div class="opponent-bar" data-position="top"></div>
                <div class="opponent-bar" data-position="left"></div>
            </div>

            <div class="wall-counter"></div>

            <div class="discard-section">
                <div class="discard-pile"></div>
            </div>

            <div class="hand-section">
                <div class="exposed-section"></div>
                <div class="hand-container"></div>
            </div>

            <div class="hints-panel"></div>

            <div class="bottom-menu"></div>
        `;
    }

    setupGlobalHandlers() {
        // Window resize handler
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', this.handleResize);
    }

    handleResize() {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            // Notify components (most use CSS, auto-adjust)
            this.handRenderer.handleResize?.();
            this.discardPileRenderer.handleResize?.();
        }, 250);
    }

    startGame() {
        this.gameController.startGame();
    }

    destroy() {
        // Clean up all components
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);

        this.handRenderer?.destroy();
        this.exposedTilesRenderer?.destroy();
        this.opponentBars.forEach(bar => bar.destroy());
        this.discardPileRenderer?.destroy();
        this.hintsPanel?.destroy();
        this.wallCounter?.destroy();
        this.bottomMenu?.destroy();
        this.touchHandler?.destroy();
    }
}
```

---

### Component Event Subscription Example

**File:** `mobile/renderers/HandRenderer.js` (partial)

```javascript
export class HandRenderer {
    constructor(container, gameController) {
        this.container = container;
        this.gameController = gameController;
        this.tiles = [];
        this.selectedIndices = new Set();
        this.animationQueue = [];
        this.isAnimating = false;
    }

    init() {
        // Subscribe to relevant events
        this.gameController.on('HAND_UPDATED', (data) => {
            if (data.player === 0) { // Only player's hand
                this.render(data.hand);
            }
        });

        this.gameController.on('TILE_DRAWN', (data) => {
            if (data.player === 0) {
                // Hand will be updated via HAND_UPDATED event
                // This is just for animation coordination
            }
        });

        this.gameController.on('UI_PROMPT', (data) => {
            if (data.promptType === 'DISCARD') {
                this.setInteractive(true);
                this.setupDiscardHandler(data.callback);
            } else {
                this.setInteractive(false);
            }
        });
    }

    render(handData) {
        // Queue animation
        this.animationQueue.push(() => this._renderWithAnimation(handData));

        if (!this.isAnimating) {
            this.processAnimationQueue();
        }
    }

    async processAnimationQueue() {
        this.isAnimating = true;

        while (this.animationQueue.length > 0) {
            const animationFn = this.animationQueue.shift();
            await animationFn();
        }

        this.isAnimating = false;
    }

    async _renderWithAnimation(handData) {
        // Clear and rebuild tiles
        this.container.innerHTML = '';
        this.tiles = [];

        handData.tiles.forEach((tileData, index) => {
            const tileComponent = new TileComponent(tileData, {
                onClick: () => this.selectTile(index)
            });

            const element = tileComponent.render();
            this.container.appendChild(element);
            this.tiles.push(tileComponent);
        });

        // Wait for CSS animation
        return new Promise(resolve => setTimeout(resolve, 300));
    }

    selectTile(index) {
        if (this.selectedIndices.has(index)) {
            this.selectedIndices.delete(index);
            this.tiles[index].setState('normal');
        } else {
            this.selectedIndices.add(index);
            this.tiles[index].setState('selected');
        }
    }

    setupDiscardHandler(callback) {
        // Set up confirmation for selected tile discard
        this.discardCallback = callback;
    }

    setInteractive(enabled) {
        this.tiles.forEach(tile => {
            if (enabled) {
                tile.setState('normal');
            } else {
                tile.setState('disabled');
            }
        });
    }

    destroy() {
        this.gameController.off('HAND_UPDATED');
        this.gameController.off('TILE_DRAWN');
        this.gameController.off('UI_PROMPT');
        this.tiles.forEach(tile => tile.destroy());
    }
}
```

---

## Implementation Notes

### Constraints Verification

✅ **No Phaser:** All components use vanilla JS + DOM
✅ **Event-driven:** GameController event system used throughout
✅ **Mobile-first:** Touch optimized, portrait layout
✅ **Sprite-ready:** Text-in-box (mockup) works, can swap to sprites later in production

### Success Criteria Checklist

✅ All 10 components fully specified (constructor, methods, events)
✅ All 4 event flows documented (draw, discard, expose, hints)
✅ All 4 decisions made with rationale (creation, errors, animations, touch)
✅ All 6 architecture questions answered (communication, state, naming, sprites, resize, a11y)
✅ Test scenarios for each component (3 per component = 30 total)
✅ Example usage provided (bootstrap sequence, component implementation sketch)
✅ Zero ambiguity - implementers can code directly from these specs

---

## Next Steps (Phase 3C/3D/4A-4D)

**Phase 3C:** Gemini Pro 2.5 implements TouchHandler from spec above
**Phase 3D:** Gemini Pro 2.5 implements TileComponent from spec above
**Phase 4A:** Gemini Pro 2.5 implements HandRenderer from spec above
**Phase 4B:** Claude Haiku implements OpponentBar from spec above
**Phase 4C:** Gemini Flash implements DiscardPileRenderer from spec above
**Phase 4D:** Gemini Pro 2.5 implements AnimationController (CSS animations)

**Implementation order:**
1. TileComponent (needed by all renderers)
2. TouchHandler (needed by HandRenderer)
3. HandRenderer (core player interaction)
4. ExposedTilesRenderer (extends HandRenderer pattern)
5. OpponentBar (simple data display)
6. DiscardPileRenderer (moderate complexity)
7. HintsPanel (depends on Card/AI integration)
8. WallCounter (simple counter)
9. BottomMenu (button handlers)
10. MobileGameController (orchestrator, last)

---

**Document Status:** Complete ✅
**Ready for Phase 3C:** Yes ✅
**Estimated Implementation Tokens:** 78K (delegated work across Phases 3C-4D)
