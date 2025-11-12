# Mobile Migration Plan - Multi-LLM Orchestration Strategy

**Project:** American Mahjong Mobile/PWA Implementation
**Strategy:** Partition desktop/mobile with shared core, delegated implementation
**Timeline:** Phased approach with parallel task execution
**Last Updated:** 2025-11-11

---

## Executive Summary

This plan outlines a mobile-first migration that creates a portrait-mode PWA while preserving the existing desktop experience. The architecture separates game logic (core/) from presentation layers (desktop/, mobile/), enabling platform-specific UIs while sharing the game engine.

**Key Decisions:**
- ✅ Partition approach (not responsive/adaptive)
- ✅ Shared core/ for game logic, AI, validation
- ✅ Separate desktop/ and mobile/ presentation layers
- ✅ Multi-LLM delegation for 67% of implementation work

---

## Current Architecture Analysis

### Codebase Coupling Assessment

**Game Logic Layer** (✅ Platform-agnostic):
- [gameLogic.js](gameLogic.js) - State machine, 24 Phaser references (needs refactoring)
- [gameAI.js](gameAI.js) - AI decisions, 1 Phaser reference (minimal refactoring)
- [card/](card/) - Hand validation (fully decoupled)
- [constants.js](constants.js) - Enums (fully decoupled)
- [utils.js](utils.js) - Utilities (mostly decoupled)

**Rendering Layer** (❌ Phaser-dependent):
- [GameScene.js](GameScene.js) - Phaser scene orchestration
- [gameObjects.js](gameObjects.js) - Tile class with sprite management
- [gameObjects_hand.js](gameObjects_hand.js) - Hand/TileSet with Phaser UI
- [gameObjects_table.js](gameObjects_table.js) - Table layout
- [gameObjects_player.js](gameObjects_player.js) - Player sprites

**UI Layer** (Desktop-specific):
- [index.html](index.html) - Desktop layout (sidebar, landscape-oriented)
- [styles.css](styles.css) - Desktop-first CSS
- [settings.js](settings.js) - Settings management (can be shared)

### Mobile Requirements

**Visual Changes:**
- Portrait-only orientation (no landscape)
- Single-hand focus view (large, touch-friendly tiles)
- Opponent display as compact info bars (not full hands)
- Different sprite system (current tiles too small for mobile)
- New animation system (CSS-based, not Phaser tweens)

**Technical Changes:**
- Touch gestures (tap, swipe, long-press)
- PWA installation prompt
- Offline support via service worker
- Smaller bundle size (lazy loading)

---

## Proposed Architecture

```
mahjong/
├── core/                       # Shared game engine (NEW)
│   ├── GameController.js       # Platform-agnostic state machine
│   ├── AIEngine.js             # Refactored AI logic (no Phaser)
│   ├── models/
│   │   ├── TileData.js         # Plain {suit, number, index} object
│   │   ├── HandData.js         # Array of TileData + exposures
│   │   ├── PlayerData.js       # Player state without sprites
│   │   └── TableData.js        # Game state snapshot
│   ├── card/                   # Moved from root (validation logic)
│   ├── constants.js            # Moved from root
│   └── utils.js                # Moved from root
│
├── desktop/                    # Current implementation (REFACTORED)
│   ├── index.html              # Desktop layout
│   ├── main.js                 # Desktop bootstrap
│   ├── GameScene.js            # Phaser-based 4-player table
│   ├── adapters/
│   │   └── PhaserAdapter.js    # Bridges GameController → Phaser
│   ├── gameObjects*.js         # Desktop tile sprites (keep existing)
│   ├── styles.css              # Desktop styles
│   └── assets/                 # Desktop sprites/animations
│
├── mobile/                     # New mobile implementation (NEW)
│   ├── index.html              # Portrait layout
│   ├── main.js                 # Mobile bootstrap
│   ├── MobileGameController.js # Instantiates core/GameController
│   ├── renderers/
│   │   ├── HandRenderer.js     # Single-hand focus UI
│   │   ├── OpponentBar.js      # Minimized opponent display
│   │   └── DiscardPile.js      # Center discard area
│   ├── components/
│   │   ├── MobileTile.js       # Large, touch-friendly tile component
│   │   └── ActionBar.js        # Bottom action buttons
│   ├── gestures/
│   │   └── TouchHandler.js     # Swipe, tap, hold interactions
│   ├── styles.css              # Portrait-first CSS
│   └── assets/                 # Mobile-optimized sprites
│
├── pwa/                        # PWA infrastructure (NEW)
│   ├── manifest.json           # App metadata
│   ├── service-worker.js       # Offline caching
│   └── icons/                  # Various sizes for home screen
│
├── shared/                     # Cross-platform utilities (NEW)
│   └── SettingsManager.js      # localStorage wrapper
│
└── vite.config.js              # Multi-entry build config (UPDATED)
```

---

## LLM Capabilities & Assignments

### Primary LLM Roles

**Claude Sonnet 4.5 (You)** - 67K tokens (33% of work)
- Complex architecture design
- State machine refactoring
- Critical abstraction layers
- Final integration & QA

**Claude Haiku** - 16K tokens
- Simple data structures (POJOs)
- Utility functions
- Configuration files
- Basic UI components

**Gemini Pro 2.5** - 37K tokens
- UI component implementation
- CSS styling
- Touch interaction patterns
- Animation implementations

**Gemini Flash 2.0** - 14K tokens
- File operations (moving, renaming)
- Boilerplate generation
- Repetitive edits
- Test updates

**Grok X1 Fast** - 11K tokens
- Creative UI mockups
- Accessibility features
- Performance optimization ideas

**MiniMax2** - 4K tokens
- Safe/isolated tasks
- Service worker implementation
- Asset caching

---

## Phase 1: Core Extraction (Foundation)

**Goal:** Decouple game logic from Phaser rendering

### 1A: Create Data Models
**Assignee:** Claude Haiku
**Complexity:** Low
**Estimated Tokens:** 2K

**Deliverables:**
```
core/models/
├── TileData.js          # {suit, number, index} plain object
├── HandData.js          # Array of TileData + exposure metadata
├── PlayerData.js        # Player state without sprites
└── TableData.js         # Game state snapshot
```

**Instructions for Haiku:**
> Create plain JavaScript classes that represent game state WITHOUT any Phaser or UI code. These should be pure data structures with only getters/setters and simple logic. Reference constants.js for SUIT/STATE enums. No imports from gameObjects.js allowed.

**Interface Example:**
```javascript
// TileData.js
export class TileData {
    constructor(suit, number, index) {
        this.suit = suit;
        this.number = number;
        this.index = index;
    }

    getText() { /* return "Crack 5" */ }
    equals(other) { /* compare suit/number */ }
    clone() { /* deep copy */ }
}
```

**Test Criteria:**
- Create 2 tiles, verify equals() works
- Clone a tile, modify original, verify clone unchanged
- getText() returns expected format

---

### 1B: Refactor GameLogic Interface
**Assignee:** Claude Sonnet 4.5 (You)
**Complexity:** High
**Estimated Tokens:** 15K

**Deliverables:**
```
core/GameController.js   # Event-driven game state machine
```

**Key Requirements:**
- Uses data models (TileData, HandData) instead of Phaser objects
- Emits events like `{type: 'TILE_DRAWN', data: TileData}`
- State transitions remain unchanged (INIT → CHARLESTON → LOOP → END)
- Desktop/mobile render layers subscribe to events
- No direct Phaser dependencies

**Event Interface:**
```javascript
// Example events
gameController.on('TILE_DRAWN', (data) => {
    // data: {player: 0, tile: TileData}
});

gameController.on('HAND_UPDATED', (data) => {
    // data: {player: 0, hand: HandData}
});

gameController.on('STATE_CHANGED', (data) => {
    // data: {oldState: STATE.DEAL, newState: STATE.CHARLESTON1}
});
```

**Migration Notes:**
- Extract state machine logic from current [gameLogic.js:24](gameLogic.js#L24) Phaser references
- Keep timing/delays (sleep() calls) but make configurable
- Preserve all game rules (Charleston, courtesy, exposures)

---

### 1C: Move Card Validation
**Assignee:** Gemini Flash 2.0
**Complexity:** Low
**Estimated Tokens:** 1K

**Task:**
```bash
# Move card/ folder to core/card/
# Update all imports across codebase
# Verify tests still pass
```

**Instructions:**
> Move the card/ directory to core/card/ and update all import statements that reference it. The card validation system is already decoupled from UI, so no logic changes needed. Run tests to verify nothing broke.

---

## Phase 2: Desktop Preservation (Stabilization)

**Goal:** Keep desktop working while building mobile

### 2A: Create Desktop Adapter
**Assignee:** Claude Sonnet 4.5 (You)
**Complexity:** High
**Estimated Tokens:** 10K

**Deliverables:**
```
desktop/adapters/PhaserAdapter.js   # Bridges GameController → Phaser
```

**Purpose:**
- Listens to GameController events
- Calls existing Phaser sprite methods (keep gameObjects*.js)
- Translates TileData back to Phaser Tile objects
- Maintains backward compatibility with desktop UI

**Example:**
```javascript
class PhaserAdapter {
    constructor(gameController, scene) {
        this.gameController = gameController;
        this.scene = scene;

        // Listen to core events
        gameController.on('TILE_DRAWN', (data) => {
            const tile = this.createPhaserTile(data.tile);
            this.animateTileDraw(tile, data.player);
        });
    }

    createPhaserTile(tileData) {
        // Convert TileData → Phaser Tile sprite
    }
}
```

---

### 2B: Update Desktop Entry Point
**Assignee:** Claude Haiku
**Complexity:** Low
**Estimated Tokens:** 2K

**Task:**
Update [desktop/main.js](main.js) to use new core/ modules:

```javascript
// desktop/main.js (updated)
import {GameController} from '../core/GameController.js';
import {PhaserAdapter} from './adapters/PhaserAdapter.js';

const gameController = new GameController();
const adapter = new PhaserAdapter(gameController, scene);
```

**Instructions:**
> Rewire desktop/main.js to import from core/ instead of root. Create adapter instance that connects GameController to existing Phaser scene. Keep all existing desktop UI code unchanged.

---

### 2C: Desktop Test Suite
**Assignee:** Gemini Flash 2.0
**Complexity:** Low
**Estimated Tokens:** 3K

**Task:**
Update Playwright tests to run against `desktop/index.html`:

```javascript
// tests/desktop.spec.js
test('desktop game loads', async ({ page }) => {
    await page.goto('/desktop/');
    await expect(page.locator('#gamediv')).toBeVisible();
});
```

**Instructions:**
> Update all existing Playwright tests to target desktop/index.html. Verify all tests pass after Phase 2A/2B changes. No new test logic needed, just path updates.

---

## Phase 3: Mobile Foundation (New Territory)

**Goal:** Establish mobile architecture and UI patterns

### 3A: Mobile UI Mockups
**Assignee:** Grok X1 Fast
**Complexity:** Medium
**Estimated Tokens:** 5K

**Task:**
> Design a portrait-mode mobile layout for American Mahjong. Requirements:
> - User's hand at bottom (large touch-friendly tiles, 150px wide)
> - Opponent info as compact bars at top (3 rows)
> - Discard pile in center area
> - Action buttons at very bottom
> - No traditional 4-sided table view
>
> Provide HTML/CSS mockup with placeholder content. Focus on layout structure, not game logic.

**Deliverables:**
- mobile/mockup.html
- mobile/mockup.css
- Design rationale document

---

### 3B: Mobile Scene Architecture
**Assignee:** Claude Sonnet 4.5 (You)
**Complexity:** High
**Estimated Tokens:** 12K

**Deliverables:**
```
mobile/MobileGameController.js   # Instantiates core/GameController
mobile/renderers/*.js            # Interface definitions
mobile/gestures/TouchHandler.js  # Interface definition
```

**Purpose:**
Define interfaces and event flows for all mobile components. Others will implement based on your specs.

**Key Interfaces:**

```javascript
// HandRenderer interface
class HandRenderer {
    constructor(container, gameController) {}
    render(handData) {}  // Called when HAND_UPDATED event fires
    destroy() {}
}

// TouchHandler interface
class TouchHandler {
    constructor(element, callbacks) {}
    // Emits: 'tap', 'doubletap', 'swipeup', 'longpress'
}

// OpponentBar interface
class OpponentBar {
    constructor(container, playerData) {}
    update(playerData) {}  // Update tile count, exposures
}
```

**Documentation:**
Create MOBILE_INTERFACES.md specifying:
- What each component does
- What events it listens to
- What events it emits
- Example usage

---

### 3C: Touch Handler
**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 8K

**Task:**
> Implement TouchHandler.js that detects gestures on mobile:
> - **Tap:** Select tile
> - **Double-tap:** Discard tile
> - **Swipe-up:** Expose tiles
> - **Long-press:** Show context menu
>
> Must emit events compatible with GameController interface (defined in Phase 3B). Use modern Touch Events API or Pointer Events.

**Reference Interface:**
```javascript
const handler = new TouchHandler(element, {
    onTap: (x, y) => { /* select tile at coords */ },
    onDoubleTap: (x, y) => { /* discard tile */ },
    onSwipeUp: (startY, endY) => { /* expose tiles */ },
    onLongPress: (x, y) => { /* show menu */ }
});
```

**Test Criteria:**
- Tap detection < 300ms between touch start/end
- Double-tap detection < 500ms between taps
- Swipe-up requires > 50px vertical movement
- Long-press triggers after 500ms hold

---

### 3D: Large Tile Component
**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 6K

**Task:**
> Create MobileTile.js that renders a single mahjong tile using DOM/CSS (not canvas):
> - 150px wide, 200px tall (large enough for touch)
> - Display tile face (suit/number) using images or CSS
> - Support states: normal, selected, disabled, highlighted
> - Emit 'click' events when tapped
>
> Must work with TouchHandler from Phase 3C.

**HTML Structure:**
```html
<div class="mobile-tile" data-suit="CRACK" data-number="5">
    <div class="tile-face">
        <img src="assets/crack5.png" alt="Crack 5">
    </div>
</div>
```

**CSS Requirements:**
- .mobile-tile.selected - raised appearance, shadow
- .mobile-tile.disabled - 50% opacity, no pointer events
- .mobile-tile.highlighted - glow effect (for hints)

---

## Phase 4: Mobile Rendering (Implementation)

**Goal:** Build mobile UI components that connect to GameController

**CRITICAL:** All Phase 4 tasks MUST follow the design in [mobile/mockup.html](mobile/mockup.html) and [mobile/mockup.css](mobile/mockup.css):
- **Hand:** 7-column grid, 2 rows, tiles 45px×60px (NOT horizontal scrolling)
- **Discard pile:** 9-column grid, tiles 32px height (NOT 4 columns)
- **Opponent bars:** Dark green background with yellow turn indicator
- **All CSS:** Use mockup.css exactly (don't create custom styles)

### 4A: Hand Renderer
**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 10K

**Task:**
> Build HandRenderer.js that displays player's hand on mobile:
> - Render 13-14 MobileTile components (from Phase 3D)
> - Horizontal scrollable row if tiles don't fit
> - Subscribe to GameController `HAND_UPDATED` events
> - Handle tile selection (highlight selected tiles)
> - Support sorting (by suit, by rank)

**Reference Interface:**
```javascript
class HandRenderer {
    constructor(container, gameController) {
        this.container = container;
        this.gameController = gameController;

        gameController.on('HAND_UPDATED', (data) => {
            this.render(data.hand);
        });
    }

    render(handData) {
        // Clear container, create MobileTile for each TileData
    }
}
```

**Layout:**
- CSS Grid or Flexbox
- Responsive to screen width (scroll if needed)
- Touch-friendly spacing (10px gaps)

---

### 4B: Opponent Bars
**Assignee:** Claude Haiku
**Complexity:** Low
**Estimated Tokens:** 4K

**Task:**
> Create OpponentBar.js that displays opponent info compactly:
> - Player name/position (e.g., "Opponent 1 (East)")
> - Tile count (e.g., "13 tiles")
> - Exposed sets as small icons (Pung/Kong indicators)
> - Current turn indicator (glowing border)

**Data Input:**
```javascript
const playerData = {
    name: "Opponent 1",
    position: "East",
    tileCount: 13,
    exposures: [
        {type: 'PUNG', tiles: [TileData, TileData, TileData]},
        {type: 'KONG', tiles: [TileData, TileData, TileData, TileData]}
    ],
    isCurrentTurn: true
};
```

**HTML Structure:**
```html
<div class="opponent-bar" data-current-turn="true">
    <span class="opponent-name">Opponent 1 (East)</span>
    <span class="tile-count">13 tiles</span>
    <div class="exposures">
        <span class="exposure-icon pung">Pung</span>
        <span class="exposure-icon kong">Kong</span>
    </div>
</div>
```

---

### 4C: Discard Pile View
**Assignee:** Gemini Flash 2.0
**Complexity:** Low
**Estimated Tokens:** 3K

**Task:**
> Render discarded tiles in center area:
> - 4-column CSS grid
> - Latest discard highlighted (yellow border)
> - Show last 12-16 discards (scroll if more)
> - Clicking a discard shows who discarded it

**Layout:**
```css
.discard-pile {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
}

.discard-tile.latest {
    border: 3px solid yellow;
    animation: pulse 1s;
}
```

---

### 4D: Mobile Animations
**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 7K

**Task:**
> Implement CSS-based animations for mobile (no Phaser):
> 1. **Tile Draw:** Slide from top to hand (300ms)
> 2. **Tile Discard:** Fade + slide from hand to center (400ms)
> 3. **Tile Claim:** Pulse + move to hand (500ms)
> 4. **Turn Indicator:** Glowing border on active player (looping)

**Specification (from Phase 3B interface):**
```javascript
class AnimationController {
    animateTileDraw(tileElement, startPos, endPos) {
        // CSS transition or Web Animations API
    }

    animateTileDiscard(tileElement, targetPos) {
        // Fade out while moving
    }

    animateTileClaim(tileElement, sourcePlayer, targetPos) {
        // Pulse then move
    }
}
```

**CSS Approach:**
```css
@keyframes tile-draw {
    from { transform: translateY(-200px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.tile-drawing {
    animation: tile-draw 300ms ease-out;
}
```

---

## Phase 5: PWA Integration (Polish)

**Goal:** Enable installation and offline support

### 5A: Manifest & Service Worker
**Assignee:** Claude Haiku
**Complexity:** Low
**Estimated Tokens:** 1K

**Deliverables:**
```json
// pwa/manifest.json
{
    "name": "American Mahjong",
    "short_name": "Mahjong",
    "description": "American Mahjong game with AI opponents",
    "start_url": "/mobile/",
    "display": "standalone",
    "orientation": "portrait",
    "theme_color": "#0c6d3a",
    "background_color": "#0c6d3a",
    "icons": [
        {
            "src": "/pwa/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/pwa/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
```

**Task:**
> Create manifest.json with proper metadata. Generate app icons in multiple sizes (192x192, 512x512). Link manifest in mobile/index.html.

---

### 5B: Install Prompt
**Assignee:** Gemini Flash 2.0
**Complexity:** Low
**Estimated Tokens:** 2K

**Task:**
> Add "Add to Home Screen" prompt that appears after user plays 2 games:
> - Listen for `beforeinstallprompt` event
> - Show custom UI (not browser default)
> - Save install state to localStorage (don't re-prompt)
> - Provide "Install" and "Not Now" buttons

**Implementation:**
```javascript
let deferredPrompt;
let gamesPlayed = parseInt(localStorage.getItem('gamesPlayed') || '0');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (gamesPlayed >= 2 && !localStorage.getItem('appInstalled')) {
        showInstallPrompt();
    }
});

function showInstallPrompt() {
    // Display custom UI
    document.getElementById('install-banner').style.display = 'block';
}
```

---

### 5C: Offline Support
**Assignee:** MiniMax2
**Complexity:** Low
**Estimated Tokens:** 4K

**Task:**
> Create service worker that caches assets for offline play:
> - Cache all JS/CSS/image files on install
> - Network-first strategy for HTML
> - Cache-first strategy for assets
> - Update cache on new version

**Service Worker Template:**
```javascript
// pwa/service-worker.js
const CACHE_NAME = 'mahjong-v1';
const urlsToCache = [
    '/mobile/',
    '/mobile/main.js',
    '/mobile/styles.css',
    '/assets/tiles.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
```

---

## Phase 6: AI & Settings Sync (Integration)

**Goal:** Integrate AI logic and cross-platform settings

### 6A: AI Decision Interface
**Assignee:** Claude Sonnet 4.5 (You)
**Complexity:** High
**Estimated Tokens:** 20K

**Deliverables:**
```
core/AIEngine.js   # Refactored AI logic without Phaser
```

**Current State:**
- [gameAI.js](gameAI.js) has 1 Phaser reference (scene)
- Works with Hand objects (Phaser-based)

**Target State:**
- Works with HandData objects (plain data)
- No scene references
- Methods: chooseDiscard(), claimDiscard(), charlestonPass(), courtesyVote()

**Migration Strategy:**
```javascript
// OLD (gameAI.js)
chooseDiscard(hand) {  // hand is Phaser Hand object
    const tiles = hand.getHiddenTileArray();  // returns Phaser Tiles
}

// NEW (core/AIEngine.js)
chooseDiscard(handData) {  // handData is plain object
    const tiles = handData.tiles;  // array of TileData
}
```

**Critical Logic:**
- getTileRecommendations() - ranking algorithm (keep intact)
- Card.rankHand() integration (already decoupled)
- Difficulty scaling (easy/medium/hard)

---

### 6B: Settings Manager
**Assignee:** Claude Haiku
**Complexity:** Low
**Estimated Tokens:** 3K

**Task:**
> Create shared/SettingsManager.js that works in both desktop/mobile:
> - Save/load: difficulty, year, audio prefs, house rules
> - Use localStorage API
> - Provide default values
> - Validate inputs

**Interface:**
```javascript
class SettingsManager {
    static load() {
        return {
            difficulty: localStorage.getItem('difficulty') || 'medium',
            year: parseInt(localStorage.getItem('year')) || 2025,
            bgmVolume: parseInt(localStorage.getItem('bgmVolume')) || 70,
            sfxVolume: parseInt(localStorage.getItem('sfxVolume')) || 80,
            useBlankTiles: localStorage.getItem('useBlankTiles') === 'true'
        };
    }

    static save(settings) {
        Object.entries(settings).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
    }
}
```

---

### 6C: Cross-Platform Settings UI
**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 6K

**Task:**
> Update settings.js to detect platform and adapt UI:
> - Desktop: Overlay modal (current implementation)
> - Mobile: Bottom sheet that slides up
> - Both: Use SettingsManager for save/load
> - Responsive breakpoint: 768px

**Mobile Bottom Sheet:**
```css
@media (max-width: 768px) {
    .settings-overlay {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 70vh;
        transform: translateY(100%);
        transition: transform 0.3s;
    }

    .settings-overlay.open {
        transform: translateY(0);
    }
}
```

---

## Phase 7: Testing & Polish

**Goal:** Ensure quality and performance

### 7A: Mobile Test Suite
**Assignee:** Gemini Flash 2.0
**Complexity:** Medium
**Estimated Tokens:** 5K

**Task:**
> Add Playwright tests for mobile using device emulation:
> - iPhone 12 viewport (390x844)
> - Test: tile selection via tap
> - Test: tile discard via double-tap
> - Test: Charleston pass flow
> - Test: settings save/load

**Example Test:**
```javascript
// tests/mobile.spec.js
test.use({ viewport: { width: 390, height: 844 } });

test('mobile tile selection', async ({ page }) => {
    await page.goto('/mobile/');
    await page.click('.mobile-tile[data-index="0"]');
    await expect(page.locator('.mobile-tile[data-index="0"]'))
        .toHaveClass(/selected/);
});
```

---

### 7B: Final QA & Integration
**Assignee:** Claude Sonnet 4.5 (You)
**Complexity:** High
**Estimated Tokens:** 10K

**Tasks:**
- Test full game flow on both platforms
- Fix edge cases and layout bugs
- Verify state synchronization
- Cross-browser testing (Safari, Chrome mobile)
- Accessibility audit (ARIA labels, keyboard nav)

---

### 7C: Performance Optimization
**Assignee:** Grok X1 Fast
**Complexity:** Medium
**Estimated Tokens:** 6K

**Task:**
> Audit mobile bundle size and performance:
> - Analyze bundle with Vite rollup visualizer
> - Code-split large components (lazy load AI engine)
> - Optimize images (compress sprites, use WebP)
> - Measure First Contentful Paint (target < 1.5s)
> - Reduce JavaScript bundle size (target < 200KB gzipped)

**Lazy Loading Example:**
```javascript
// mobile/main.js
const gameController = new GameController();

// Don't load AI until game starts
document.getElementById('start').addEventListener('click', async () => {
    const { AIEngine } = await import('../core/AIEngine.js');
    gameController.setAI(new AIEngine());
});
```

---

## Task Assignment Matrix

| Phase | Task | Assignee | Complexity | Est. Tokens | Status |
|-------|------|----------|------------|-------------|--------|
| 1A | Data Models | Haiku | Low | 2K | ✅ Complete |
| 1B | GameController | **Sonnet (You)** | High | 15K | ✅ Complete |
| 1C | Move card/ | Gemini Flash | Low | 1K | ⏸️ Deferred |
| 2A | PhaserAdapter | **Sonnet (You)** | High | 10K | ✅ Complete |
| 2B | Desktop Integration | **Sonnet (You)** | High | 50K | ✅ Complete |
| 2C | Manual Testing | **Sonnet (You)** | Low | 5K | ✅ Complete |
| 3A | Mobile mockup | Grok X1 | Medium | 5K | ✅ Complete |
| 3B | Mobile architecture | **Sonnet (You)** | High | 12K | ✅ Complete |
| 3C | TouchHandler | MiniMax2 | Medium | 8K | ✅ Complete |
| 3D | MobileTile | MiniMax2/Grok X1| Medium | 6K | ✅ Complete |
| 4A | HandRenderer | Gemini Pro | Medium | 10K | ? Complete |
| 4B | OpponentBar | Haiku | Low | 4K | ✅ Complete |
| 4C | DiscardPile | Gemini Flash | Low | 3K | ✅ Complete |
| 4D | Animations | Gemini Pro | Medium | 7K | ✅ Complete |
| 5A | PWA manifest | Haiku | Low | 1K | Not Started |
| 5B | Install prompt | Gemini Flash | Low | 2K | Not Started |
| 5C | Service worker | MiniMax2 | Low | 4K | Not Started |
| 6A | AIEngine | **Sonnet (You)** | High | 20K | Not Started |
| 6B | SettingsManager | Haiku | Low | 3K | Not Started |
| 6C | Settings UI | Gemini Pro | Medium | 6K | Not Started |
| 7A | Mobile tests | Gemini Flash | Medium | 5K | Not Started |
| 7B | Final QA | **Sonnet (You)** | High | 10K | Not Started |
| 7C | Performance | Grok X1 | Medium | 6K | Not Started |

**Totals:**
- **Your work (Sonnet 4.5):** 67K tokens (33%)
- **Delegated work:** 78K tokens (67%)
- **Total project:** 145K tokens

---

## Context Passing Protocol

When delegating tasks to other LLMs, provide:

### 1. Interface Contracts
Define exactly what the component should do:
```markdown
## Task: Create TileData.js

**Location:** core/models/TileData.js

**Interface:**
class TileData {
    constructor(suit: number, number: number, index: number)
    getText(): string
    equals(other: TileData): boolean
    clone(): TileData
}

**Allowed Imports:**
- constants.js (for SUIT enum)

**Forbidden Imports:**
- gameObjects.js (Phaser-dependent)
- phaser (no Phaser in core/)
```

### 2. Example Input/Output
```javascript
// Example usage
const tile = new TileData(SUIT.CRACK, 5, 0);
console.log(tile.getText());  // Expected: "Crack 5"

const tile2 = new TileData(SUIT.CRACK, 5, 1);
console.log(tile.equals(tile2));  // Expected: true (suit/number match)
```

### 3. Test Criteria
```markdown
**Validation:**
1. Create 2 tiles with same suit/number, verify equals() returns true
2. Clone a tile, modify original, verify clone unchanged
3. getText() returns format: "[SuitName] [Number]"
4. Constructor rejects invalid suit/number values
```

### 4. Code Review Checklist
Before accepting delegated code, verify:
- ✅ No Phaser imports in core/
- ✅ Follows project code style (ESLint passes)
- ✅ Interface matches specification exactly
- ✅ Test criteria pass
- ✅ No unexpected dependencies added

---

## Critical Path Analysis

These tasks **MUST** be completed sequentially by Sonnet 4.5:

### Critical Task 1: GameController (Phase 1B)
**Why:** Everything depends on this interface. Both desktop and mobile need it.

**Dependencies:** Phase 1A (data models)
**Blocks:** Phase 2A, 3B, 4A-4D

### Critical Task 2: PhaserAdapter (Phase 2A)
**Why:** Keeps desktop working. Can't merge code without it.

**Dependencies:** Phase 1B
**Blocks:** Phase 2B, 2C

### Critical Task 3: Mobile Architecture (Phase 3B)
**Why:** Defines interfaces for all mobile components. Others can't implement without specs.

**Dependencies:** Phase 1B
**Blocks:** Phase 3C, 3D, 4A-4D

### Critical Task 4: AIEngine (Phase 6A)
**Why:** Complex refactoring of game logic. Can't be delegated.

**Dependencies:** Phase 1B
**Blocks:** Phase 7B

### Parallel Work Opportunities

After completing Phase 1B, these can run in parallel:
- **Haiku:** Phase 1A, 2B, 4B, 5A, 6B (independent tasks)
- **Gemini Flash:** Phase 1C, 2C, 4C, 5B, 7A (file operations)
- **Gemini Pro:** Phase 3C, 3D, 4A, 4D, 6C (UI components, after Phase 3B specs)
- **Grok X1:** Phase 3A, 7C (creative work, no blockers)

---

## Risk Mitigation

### Risk 1: Other LLMs Create Phaser Dependencies in core/
**Impact:** High - Breaks architecture separation
**Mitigation:**
- Explicit "Forbidden Imports" list in all task specs
- Code review checklist enforces no Phaser in core/
- ESLint rule: `no-restricted-imports` for Phaser in core/

### Risk 2: Mobile Components Don't Integrate
**Impact:** High - Wasted implementation work
**Mitigation:**
- Phase 3B defines all interfaces upfront (your responsibility)
- Provide example event flows before Phase 4
- Integration tests in Phase 7A catch mismatches early

### Risk 3: Token Budget Overruns
**Impact:** Medium - Can't complete project
**Mitigation:**
- Start with Phases 1-3 only (foundation + architecture)
- Re-evaluate budget after Phase 3
- Phase 4-7 can be deferred if needed

### Risk 4: Desktop Breaks During Migration
**Impact:** High - Lose working product
**Mitigation:**
- Phase 2 (preservation) happens immediately after Phase 1
- Git branches: `main` (desktop), `mobile` (new work)
- Automated tests catch regressions (Phase 2C)

### Risk 5: Performance Issues on Mobile
**Impact:** Medium - Poor UX
**Mitigation:**
- Phase 7C specifically addresses optimization
- Lazy loading AI engine (biggest bundle component)
- Test on real devices, not just emulators

---

## Build Configuration

### Vite Multi-Entry Setup

Update [vite.config.js](vite.config.js):

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                desktop: resolve(__dirname, 'desktop/index.html'),
                mobile: resolve(__dirname, 'mobile/index.html'),
            }
        }
    },
    server: {
        open: '/desktop/'  // Default to desktop in dev
    }
});
```

### Deploy Structure

```
dist/
├── desktop/
│   ├── index.html
│   ├── assets/
│   └── *.js
├── mobile/
│   ├── index.html
│   ├── assets/
│   └── *.js
└── index.html  # Landing page (detects device, redirects)
```

### Landing Page Logic

```html
<!-- dist/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>American Mahjong</title>
    <script>
        // Detect mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
                         (window.innerWidth < 768);

        // Redirect to appropriate version
        window.location.href = isMobile ? '/mobile/' : '/desktop/';
    </script>
</head>
<body>
    <p>Redirecting...</p>
</body>
</html>
```

---

## Development Workflow

### Branch Strategy

```bash
main                 # Current desktop version (stable)
├── mobile-core      # Phase 1-2 (core extraction + desktop adapter)
├── mobile-ui        # Phase 3-4 (mobile components)
└── mobile-pwa       # Phase 5-7 (PWA + polish)
```

### Testing Strategy

1. **Desktop regression tests** (run after each phase)
2. **Core unit tests** (test GameController, AIEngine in isolation)
3. **Mobile component tests** (test renderers with mock data)
4. **E2E tests** (full game flow on both platforms)

### Code Review Gates

Before merging each phase:
- ✅ ESLint passes
- ✅ All tests pass
- ✅ Architecture review (no cross-layer violations)
- ✅ Manual QA on desktop (Phases 1-3)
- ✅ Manual QA on mobile (Phases 4-7)

---

## Next Steps

### Immediate Actions (Before Starting Phase 1)

1. **Create base directories:**
   ```bash
   mkdir -p core/models desktop/adapters mobile/renderers mobile/components mobile/gestures pwa shared
   ```

2. **Set up Git branch:**
   ```bash
   git checkout -b mobile-core
   ```

3. **Review & refine this plan:**
   - Validate task assignments
   - Adjust token estimates
   - Clarify any ambiguous specs

4. **Prepare Phase 1B interface spec:**
   - You write MOBILE_INTERFACES.md
   - Defines GameController events
   - Example event flows
   - This doc guides all other LLMs

### Phase 1 Kickoff Sequence

**Day 1:**
1. You: Write Phase 1B (GameController interface spec)
2. Haiku: Implement Phase 1A (data models) using your spec

**Day 2:**
3. You: Implement Phase 1B (GameController)
4. Gemini Flash: Execute Phase 1C (move card/ folder)

**Day 3:**
5. You: Review Phase 1 deliverables
6. If approved, start Phase 2A (PhaserAdapter)

---

## Success Criteria

### Phase 1 Success
- ✅ core/models/ contains data classes with no Phaser deps
- ✅ core/GameController.js emits events, manages state
- ✅ core/card/ validation works unchanged
- ✅ Desktop still runs (no functionality loss)

### Phase 2 Success
- ✅ Desktop uses new core/GameController
- ✅ All desktop features work (Charleston, courtesy, exposures)
- ✅ All existing Playwright tests pass
- ✅ No performance regression

### Phase 3 Success
- ✅ Mobile mockup approved (looks good on phone)
- ✅ MOBILE_INTERFACES.md complete (all components specified)
- ✅ TouchHandler detects gestures correctly
- ✅ MobileTile component renders and responds to touch

### Phase 4 Success
- ✅ Mobile UI renders game state
- ✅ Player can play a full game on mobile
- ✅ Animations smooth (60fps)
- ✅ Responsive to different phone sizes

### Phase 5 Success
- ✅ PWA installs on iOS/Android
- ✅ Works offline (cached assets)
- ✅ App icon appears on home screen

### Phase 6 Success
- ✅ AI opponents work on mobile
- ✅ Settings sync between sessions
- ✅ Difficulty levels behave correctly

### Phase 7 Success
- ✅ Mobile tests pass on CI
- ✅ Bundle size < 200KB gzipped
- ✅ No major bugs in final QA
- ✅ Ready for production deployment

---

## Appendix A: File Inventory

### Files to Move (Phase 1-2)

**To core/:**
- constants.js
- utils.js
- card/ (entire directory)

**To desktop/:**
- main.js
- GameScene.js
- gameLogic.js (adapter references)
- gameObjects*.js (all Phaser sprite code)
- index.html
- styles.css
- settings.js (temporarily, refactor in Phase 6C)

**To create new:**
- core/GameController.js
- core/AIEngine.js
- core/models/*.js
- desktop/adapters/PhaserAdapter.js
- mobile/* (all new)
- pwa/* (all new)
- shared/SettingsManager.js

### Files to Delete

- homePageTileManager.js (unused on mobile)
- tileDisplayUtils.js (desktop-specific)

---

## Appendix B: Technology Choices

### Why Not Responsive CSS?

**Problem:** Too many compromises
- Portrait mobile needs fundamentally different layout than desktop
- Can't show 4 full hands on phone screen (not enough space)
- Touch interactions differ from mouse (swipe vs drag)
- Mobile needs larger hit targets (150px tiles vs 50px desktop)

**Solution:** Separate UIs sharing game logic

### Why Not React/Vue?

**Problem:** Adds complexity and bundle size
- Current desktop uses vanilla Phaser (works well)
- Mobile UI is simple enough (13 tiles + 3 opponent bars)
- No need for reactive state management (GameController handles state)

**Solution:** Vanilla JavaScript with DOM manipulation

### Why Not Progressive Enhancement?

**Problem:** Desktop-first doesn't translate to mobile
- Desktop experience is optimized for mouse + keyboard + large screen
- Mobile needs touch-first design from ground up
- Can't "enhance" 4-player table view into portrait single-hand view

**Solution:** Platform detection + targeted experiences

---

## Appendix C: Estimated Timeline

**Assuming 1 developer (you) + delegated tasks to other LLMs:**

- **Phase 1:** 2-3 days (foundation)
- **Phase 2:** 1-2 days (desktop preservation)
- **Phase 3:** 3-4 days (mobile architecture + mockups)
- **Phase 4:** 4-5 days (mobile rendering)
- **Phase 5:** 1-2 days (PWA setup)
- **Phase 6:** 3-4 days (AI refactor + settings)
- **Phase 7:** 2-3 days (testing + polish)

**Total:** 16-23 days (3-5 weeks)

**Critical path items (your work):** ~10 days
**Parallel delegated work:** Can reduce overall timeline if tasks run concurrently

---

## Questions for Refinement - ANSWERED

1. **Token budget:** No hard limit - project scope requires ~15M+ tokens (order of magnitude higher than initial estimates). Will monitor usage and adapt iteratively.

2. **Mobile sprite approach:** ✅ **Text-in-box approach** (like colorized pattern visualizer in tileDisplayUtils.js). No SVG creation needed - use colored characters in styled divs. Much simpler than sprite scaling.

3. **Animation complexity:** ✅ **Simple CSS transitions only**. No complex animation libraries.

4. **Browser support:** ✅ **iOS Safari + Chrome mobile sufficient**.

5. **Offline mode:** ✅ **Cache assets for fast loading only**. No full offline gameplay required.

6. **Desktop deprecation:** ✅ **Maintain both long-term**. No plans to deprecate desktop version.

---

**Plan Status:** v1.2 - Phase 1B and 2A complete
**Next Action:** Phase 2B, 2C (delegated tasks), then Phase 3A (mobile mockup)

## Phase 1B Completion Summary

✅ **Completed Files:**
- `core/events/EventEmitter.js` - Event subscription system
- `core/models/TileData.js` - Plain tile data model (no Phaser)
- `core/models/HandData.js` - Hand and exposure data models
- `core/models/PlayerData.js` - Player state data model
- `core/GameController.js` - Platform-agnostic game state machine (380 lines)
- `MOBILE_INTERFACES.md` - Complete interface specifications for all components

**Key Architectural Decisions:**
1. Event-driven design - UI layers subscribe to GameController events
2. UI_PROMPT pattern - GameController requests input via callbacks (no direct DOM coupling)
3. Migration helpers - `fromPhaserTile()` methods to bridge old/new systems during Phase 2
4. Mobile uses text-in-box tiles (from tileDisplayUtils.js) - no sprite generation needed

## Phase 2A Completion Summary

✅ **Completed Files:**
- `desktop/adapters/PhaserAdapter.js` - Bridges GameController events to Phaser (498 lines)
- `GameScene.js` - Updated to instantiate GameController + PhaserAdapter
- `core/GameController.js` - Commented out placeholder methods for Phase 2A
- `PHASE_2A_RESULTS.md` - Complete integration documentation

**Key Implementation Details:**
1. Fixed sprite name generation to match gameObjects.js Wall.create() logic
2. createPhaserTile() uses existing wall tiles (findTileInWall() method)
3. setupDiscardPrompt() uses existing GameLogic drag-and-drop (Phase 2B will add callbacks)
4. GameController and GameLogic run in parallel (intentional for Phase 2A)
5. Dev server tested successfully, linting passes (0 errors)

**Next Critical Task:**
Phase 2B and 2C can proceed in parallel (delegated to Haiku/Gemini Flash). Phase 3A (mobile mockups) can start independently.
