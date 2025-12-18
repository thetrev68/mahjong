# Phase 3B: Mobile Scene Architecture

**Assignee:** Claude Sonnet 4.5 (You)
**Complexity:** High
**Estimated Tokens:** 12K
**Status:** Ready to start
**Branch:** mobile-core
**Dependencies:** Phase 3A complete (mockup approved)

---

## Task Overview

Define the **architectural interfaces and event flows** for all mobile components. This is a specification/design phase - you will write interface definitions, documentation, and example usage patterns. Other LLMs will implement the actual components based on your specifications in Phases 3C, 3D, and 4A-4D.

**Key Principle:** You are the architect. Your job is to create clear, unambiguous specifications that other developers (LLMs) can implement without confusion.

---

## Context

### What You Have

1. **Completed mockup:** [mobile/mockup.html](mobile/mockup.html) and [mobile/mockup.css](mobile/mockup.css)
2. **Core system:** [core/GameController.js](core/GameController.js) - event-driven game state machine
3. **Data models:** TileData, HandData, PlayerData (from Phase 1A)
4. **Desktop reference:** See how PhaserAdapter works in [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

### What You're Creating

1. **MOBILE_INTERFACES.md** - Complete interface specifications for all mobile components
2. **Example event flows** - Show how components interact during gameplay
3. **Component hierarchy** - Define parent/child relationships
4. **State management** - Clarify how UI state syncs with GameController

---

## Deliverables

### 1. Create `mobile/MOBILE_INTERFACES.md`

This document must include:

#### A. Component Interface Definitions

For each component, specify:

- **Purpose:** What this component does
- **Constructor parameters:** What data it needs to initialize
- **Public methods:** What operations it exposes
- **Events it listens to:** Which GameController events it subscribes to
- **Events it emits:** What custom events it fires (if any)
- **DOM structure:** What HTML it creates/manages
- **State management:** What internal state it maintains
- **Lifecycle:** How it initializes, updates, and cleans up

#### B. Components to Define

**Core Rendering Components:**

1. **MobileGameController** - Main orchestrator
2. **HandRenderer** - Player's 2-row hand display
3. **ExposedTilesRenderer** - Player's exposed tiles (Pung/Kong/Quint)
4. **OpponentBar** - Single opponent's info bar with exposed tiles
5. **DiscardPileRenderer** - 9×12 grid of discarded tiles
6. **HintsPanel** - AI pattern recommendations
7. **WallCounter** - Floating counter display
8. **BottomMenu** - DRAW and SORT buttons

**Interaction Components:** 9. **TouchHandler** - Gesture detection (defined in Phase 3C) 10. **TileComponent** - Individual tile representation (defined in Phase 3D)

#### C. Event Flow Diagrams

Document these key gameplay scenarios:

**Scenario 1: Player Draws a Tile**

```
GameController fires 'TILE_DRAWN' event
  ↓
HandRenderer receives event
  ↓
HandRenderer calls TileComponent.create(tileData)
  ↓
HandRenderer adds tile to 2-row grid
  ↓
HandRenderer re-sorts if auto-sort enabled
  ↓
WallCounter updates count (-1)
```

**Scenario 2: Player Discards a Tile**

```
User taps tile → TouchHandler fires 'tap' event
  ↓
HandRenderer marks tile as selected
  ↓
User taps DRAW button (disabled) or taps tile again
  ↓
Confirmation popup appears (mobile/mockup.html #tileConfirmPopup)
  ↓
User confirms → HandRenderer calls gameController.discardTile(tileData)
  ↓
GameController fires 'TILE_DISCARDED' event
  ↓
HandRenderer removes tile from hand
  ↓
DiscardPileRenderer adds tile to grid
  ↓
HintsPanel updates (dangerous discard marked red)
```

**Scenario 3: Opponent Exposes Tiles**

```
GameController fires 'TILES_EXPOSED' event
  ↓
OpponentBar (for that opponent) receives event
  ↓
OpponentBar creates ExposedTilesRenderer for new exposure
  ↓
OpponentBar updates tile count display
  ↓
OpponentBar re-renders exposed tiles section
```

**Scenario 4: Hand Changes (Hint Update)**

```
Any hand change (draw/discard/expose)
  ↓
GameController fires 'HAND_UPDATED' event
  ↓
HintsPanel receives event
  ↓
HintsPanel calls AIEngine.rankHand(handData)
  ↓
HintsPanel updates pattern list (top 3)
  ↓
HintsPanel marks dangerous discards (red border)
```

#### D. State Synchronization Strategy

**Question to Answer:**
How does the mobile UI stay in sync with GameController state?

**Options to Consider:**

1. **Event-driven (recommended):** Components subscribe to GameController events and update themselves
2. **Polling:** Components periodically query GameController state (not recommended)
3. **Hybrid:** Critical updates via events, non-critical via polling

**Specify:**

- Which components hold their own state vs. query GameController?
- How do we handle race conditions (e.g., multiple tile discards)?
- What happens if a component misses an event?

#### E. Component Hierarchy

```
<body>
  <div class="opponents-section">
    <OpponentBar position="right" />   ← Managed by MobileGameController
    <OpponentBar position="top" />
    <OpponentBar position="left" />
  </div>

  <WallCounter />                      ← Managed by MobileGameController

  <div class="discard-section">
    <DiscardPileRenderer />             ← Managed by MobileGameController
  </div>

  <div class="hand-section">
    <ExposedTilesRenderer />            ← Managed by HandRenderer
    <HandRenderer />                    ← Managed by MobileGameController
  </div>

  <HintsPanel />                        ← Managed by MobileGameController

  <BottomMenu />                        ← Managed by MobileGameController
</body>
```

**Specify:**

- Who creates each component?
- Who owns the lifecycle (destroy on game end)?
- How do components communicate with each other?

---

## Interface Examples

### Example: HandRenderer Interface

```javascript
/**
 * HandRenderer
 *
 * Manages the player's hand display in a 2-row grid layout.
 * Handles tile selection, sorting, and drag-and-drop (future).
 */
class HandRenderer {
  /**
   * @param {HTMLElement} container - DOM element to render into
   * @param {GameController} gameController - Core game state machine
   * @param {TouchHandler} touchHandler - Gesture detection system
   */
  constructor(container, gameController, touchHandler) {}

  /**
   * Initialize the component and subscribe to events
   */
  init() {
    // Subscribe to GameController events
    this.gameController.on("HAND_UPDATED", this.handleHandUpdate.bind(this));
    this.gameController.on("TILE_DRAWN", this.handleTileDraw.bind(this));

    // Set up touch handlers
    this.touchHandler.on("tap", this.handleTileTap.bind(this));

    // Render initial state
    this.render();
  }

  /**
   * Render the hand based on current GameController state
   */
  render() {
    const handData = this.gameController.getPlayerHand(0); // Bottom player
    // Clear container
    // Create 2-row grid
    // Populate with TileComponent instances
  }

  /**
   * Handle hand update event from GameController
   * @param {Object} data - { player: 0, hand: HandData, reason: 'draw'|'discard'|'sort' }
   */
  handleHandUpdate(data) {
    if (data.player !== 0) return; // Only render bottom player
    this.render();
  }

  /**
   * Handle tile draw event
   * @param {Object} data - { player: 0, tile: TileData, position: 'end'|'sorted' }
   */
  handleTileDraw(data) {
    // Animate tile drawing
    // Add to hand with animation
  }

  /**
   * Handle tile tap gesture
   * @param {Object} data - { element: HTMLElement, tileData: TileData, coordinates: {x, y} }
   */
  handleTileTap(data) {
    // Toggle selection
    // Show confirmation popup if appropriate
  }

  /**
   * Sort hand by suit or rank
   * @param {'suit'|'rank'} sortMode
   */
  sort(sortMode) {
    this.gameController.sortHand(0, sortMode);
    // Animate tiles rearranging
  }

  /**
   * Clean up event listeners and DOM
   */
  destroy() {
    this.gameController.off("HAND_UPDATED", this.handleHandUpdate);
    this.gameController.off("TILE_DRAWN", this.handleTileDraw);
    this.touchHandler.off("tap", this.handleTileTap);
    this.container.innerHTML = "";
  }
}
```

### Example: Event Data Structures

```javascript
// GameController event data formats

// TILE_DRAWN event
{
    type: 'TILE_DRAWN',
    player: 0,              // 0=bottom, 1=right, 2=top, 3=left
    tile: TileData,         // The tile that was drawn
    fromWall: true,         // true if from wall, false if claimed from discard
    timestamp: Date.now()
}

// HAND_UPDATED event
{
    type: 'HAND_UPDATED',
    player: 0,
    hand: HandData,         // Complete hand state
    reason: 'draw',         // 'draw' | 'discard' | 'expose' | 'sort'
    changedTiles: [TileData], // Optional: which tiles changed
    timestamp: Date.now()
}

// TILE_DISCARDED event
{
    type: 'TILE_DISCARDED',
    player: 0,
    tile: TileData,
    dangerous: true,        // AI marked this as dangerous for player to discard
    claimable: ['mahjong'], // ['mahjong', 'pung', 'kong'] if claimable by others
    timestamp: Date.now()
}

// TILES_EXPOSED event
{
    type: 'TILES_EXPOSED',
    player: 0,
    exposureType: 'PUNG',   // 'PUNG' | 'KONG' | 'QUINT'
    tiles: [TileData, TileData, TileData],
    claimedFrom: 2,         // Which player's discard was claimed (null if from wall)
    timestamp: Date.now()
}
```

---

## Critical Decisions You Must Make

### 1. Component Creation Strategy

**Question:** Should MobileGameController create all components upfront, or lazily?

**Option A: Eager Creation**

```javascript
class MobileGameController {
  constructor() {
    this.handRenderer = new HandRenderer(/* ... */);
    this.discardPile = new DiscardPileRenderer(/* ... */);
    this.hintsPanel = new HintsPanel(/* ... */);
    // ... create all 8 components
  }
}
```

**Option B: Lazy Creation**

```javascript
class MobileGameController {
  constructor() {
    this.components = {};
  }

  getHandRenderer() {
    if (!this.components.handRenderer) {
      this.components.handRenderer = new HandRenderer(/* ... */);
    }
    return this.components.handRenderer;
  }
}
```

**Your Decision:**
Choose one and document why. Consider memory usage, initialization time, and complexity.

---

### 2. Error Handling Strategy

**Question:** What happens when GameController fires an event but a component isn't ready?

**Scenarios:**

- DiscardPileRenderer is still rendering when TILE_DISCARDED fires
- HandRenderer DOM not yet created when HAND_UPDATED fires
- Component is in middle of animation when new event arrives

**Your Solution:**
Define an error handling strategy. Options:

- Queue events until component ready
- Ignore events during component lifecycle transitions
- Component always queries latest state from GameController
- Use a "dirty flag" and re-render on next frame

---

### 3. Animation Coordination

**Question:** How do we prevent animation conflicts?

**Example Problem:**

1. User discards tile → HandRenderer animates tile removal (300ms)
2. During animation, GameController fires HAND_UPDATED
3. HandRenderer re-renders, breaking the animation

**Your Solution:**
Define how components coordinate animations. Options:

- Lock UI during animations (disable inputs)
- Queue state changes until animations complete
- Cancel in-progress animations on new state
- Use CSS transitions exclusively (let browser handle)

---

### 4. Touch Target Overlap

**Question:** What happens when touch targets overlap?

**Example Problem:**

- Player's exposed tiles are above the hand
- User taps an exposed tile
- Both ExposedTilesRenderer and HandRenderer receive tap event

**Your Solution:**
Define event propagation rules. Options:

- Use z-index to determine priority
- TouchHandler tracks which component element was clicked
- Components check event.target before handling
- Use event.stopPropagation() in handlers

---

## Specification Requirements

### Must Answer These Questions

1. **Component Communication:**
   - Do components ever call each other directly?
   - Or do they only communicate via GameController events?
   - What about parent-child relationships (e.g., HandRenderer → ExposedTilesRenderer)?

2. **State of Truth:**
   - Is GameController the single source of truth?
   - Can components maintain their own UI state (e.g., "tile is selected")?
   - How do we reconcile component state with GameController state?

3. **Event Naming:**
   - What event naming convention do we use?
   - ALL_CAPS? camelCase? kebab-case?
   - Namespace events? (e.g., 'game:tile:drawn' vs 'TILE_DRAWN')

4. **Sprite Loading:**
   - Who is responsible for loading assets/tiles.png?
   - MobileGameController on init?
   - Each component loads its own sprites?
   - Pre-load in main.js before any components created?

5. **Responsive Behavior:**
   - Do components listen to window resize events?
   - Who handles media query breakpoints (375px, 768px)?
   - Should tile sizes update dynamically or only on page load?

6. **Accessibility:**
   - Do components need ARIA labels?
   - Keyboard navigation support?
   - Screen reader announcements for game events?

---

## Testing Specifications

Include **test scenarios** in MOBILE_INTERFACES.md so future test writers know what to validate:

### Test: HandRenderer handles rapid state changes

```
Given: HandRenderer is initialized
When: GameController fires 3 HAND_UPDATED events within 100ms
Then: HandRenderer should render final state correctly
And: No visual glitches or duplicate tiles
```

### Test: DiscardPileRenderer handles 100+ tiles

```
Given: DiscardPileRenderer with 108 tiles (full grid)
When: GameController fires TILE_DISCARDED event
Then: DiscardPileRenderer should scroll to show latest tile
And: All tiles should remain visible in scrollable container
And: Performance should remain smooth (no lag)
```

### Test: Touch interactions don't interfere

```
Given: Player has exposed tiles and hidden hand
When: User taps an exposed tile
Then: Only ExposedTilesRenderer should handle the event
And: HandRenderer should not receive the tap event
```

---

## Example Usage

Include example code showing how to use the interfaces:

```javascript
// mobile/main.js - Example bootstrap code

import { MobileGameController } from "./MobileGameController.js";
import { GameController } from "../core/GameController.js";

async function initMobileGame() {
  // Initialize core game engine
  const gameController = new GameController();

  // Initialize mobile UI
  const mobileUI = new MobileGameController(document.body, gameController);
  await mobileUI.init();

  // Start a new game
  gameController.startGame();
}

initMobileGame();
```

---

## Reference Materials

### Desktop Adapter Pattern

See how [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js) handles similar problems:

- Event subscription pattern
- State synchronization
- Component lifecycle

### Mockup Reference

See [mobile/mockup.html](mobile/mockup.html) for:

- DOM structure
- CSS classes
- Data attributes
- Element IDs

### Core Events

See [core/GameController.js](core/GameController.js) for:

- Available events
- Event data structures
- State machine flow

---

## Constraints

1. **No Phaser:** Mobile uses vanilla JS + DOM, not Phaser
2. **Event-driven:** Must use GameController's event system
3. **Mobile-first:** Optimized for touch, not mouse
4. **Performance:** Minimize reflows, use CSS transforms
5. **Sprite-ready:** Interfaces must support both text (mockup) and sprite (production) rendering

---

## Success Criteria

Your MOBILE_INTERFACES.md is complete when:

- ✅ All 10 components have complete interface definitions
- ✅ All 4 gameplay scenarios have event flow diagrams
- ✅ All 4 critical decisions are documented with rationale
- ✅ All 6 specification questions are answered
- ✅ Test scenarios are included for each component
- ✅ Example usage code is provided
- ✅ No ambiguity remains (another developer can implement without asking questions)

---

## Deliverable Checklist

- [ ] Create `mobile/MOBILE_INTERFACES.md` with all sections
- [ ] Define MobileGameController interface
- [ ] Define HandRenderer interface
- [ ] Define ExposedTilesRenderer interface
- [ ] Define OpponentBar interface
- [ ] Define DiscardPileRenderer interface
- [ ] Define HintsPanel interface
- [ ] Define WallCounter interface
- [ ] Define BottomMenu interface
- [ ] Define TouchHandler interface (high-level, Phase 3C will detail)
- [ ] Define TileComponent interface (high-level, Phase 3D will detail)
- [ ] Document all 4 event flow scenarios
- [ ] Answer all 4 critical decision questions
- [ ] Answer all 6 specification questions
- [ ] Include test scenarios
- [ ] Include example usage code
- [ ] Review for completeness and clarity

---

**Ready to Start?** Create the comprehensive MOBILE_INTERFACES.md document that will guide Phases 3C, 3D, and 4A-4D.
