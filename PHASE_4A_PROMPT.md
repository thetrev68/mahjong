# Phase 4A: Hand Renderer Implementation

**Assignee:** ChatGPT-5-Codex
**Complexity:** Medium
**Estimated Tokens:** 10K
**Prerequisites:** Phase 3B (Mobile Interfaces), Phase 3D (MobileTile component)

---

## Task Overview

Build the `HandRenderer.js` component that displays the player's hand (13-14 tiles) on mobile using a **2-row, 7-column grid layout** at the bottom of the screen. This component subscribes to GameController events and renders tiles using the text-in-box approach.

---

## File to Create

**Location:** `mobile/renderers/HandRenderer.js`

---

## Design Specification

**IMPORTANT:** The hand layout is a **7-column grid with 2 rows**, NOT horizontal scrolling. See [mobile/mockup.html](mobile/mockup.html) and [mobile/mockup.css](mobile/mockup.css) for the exact design.

**Layout:**
- Row 1: 7 tiles
- Row 2: 6-7 tiles (depending on hand size)
- Tiles: 45px wide × 60px tall (larger on tablets)
- Grid gap: 3px
- Grid template: `grid-template-columns: repeat(7, 1fr)`

---

## Interface Specification

Your implementation MUST match this exact interface:

```javascript
/**
 * HandRenderer - Displays player's hand on mobile
 *
 * Responsibilities:
 * - Render 13-14 tiles in 2-row, 7-column grid
 * - Subscribe to HAND_UPDATED events from GameController
 * - Handle tile selection (visual highlight)
 * - Support hand sorting (by suit, by rank)
 * - Render exposures separately above hand
 */
export class HandRenderer {
    /**
     * @param {HTMLElement} container - DOM element to render into
     * @param {GameController} gameController - Core game controller instance
     */
    constructor(container, gameController) {
        this.container = container;
        this.gameController = gameController;
        this.tiles = []; // Array of tile button elements
        this.selectedIndices = new Set(); // Track selected tiles
        this.handContainer = null;
        this.exposedSection = null;

        this.setupDOM();
        this.setupEventListeners();
    }

    /**
     * Set up DOM structure
     */
    setupDOM() {
        this.container.innerHTML = '';
        this.container.className = 'hand-section';

        // Exposed section (for Pung/Kong/Quint)
        this.exposedSection = document.createElement('div');
        this.exposedSection.className = 'exposed-section';
        this.container.appendChild(this.exposedSection);

        // Hidden hand container (7-column grid)
        this.handContainer = document.createElement('div');
        this.handContainer.className = 'hand-container';
        this.container.appendChild(this.handContainer);
    }

    /**
     * Set up GameController event subscriptions
     */
    setupEventListeners() {
        // Listen for HAND_UPDATED events
        this.gameController.on('HAND_UPDATED', (data) => {
            if (data.player === 0) { // Only render bottom player (human)
                this.render(data.hand);
            }
        });

        // Listen for TILE_SELECTED events (for highlighting)
        this.gameController.on('TILE_SELECTED', (data) => {
            this.selectTile(data.index);
        });
    }

    /**
     * Render the hand from HandData
     * @param {HandData} handData - Hand data model from core/
     */
    render(handData) {
        // Render exposures first
        this.renderExposures(handData.exposures);

        // Clear existing hidden tiles
        this.clearTiles();

        // Create tile button for each tile in hand
        handData.tiles.forEach((tileData, index) => {
            const tileButton = this.createTileButton(tileData, index);
            this.tiles.push(tileButton);
            this.handContainer.appendChild(tileButton);
        });

        // Re-apply selection state
        this.selectedIndices.forEach(index => {
            if (this.tiles[index]) {
                this.tiles[index].classList.add('selected');
            }
        });
    }

    /**
     * Create a tile button element
     * @param {TileData} tileData - Tile data
     * @param {number} index - Tile index in hand
     * @returns {HTMLElement} Button element
     */
    createTileButton(tileData, index) {
        const button = document.createElement('button');
        button.className = 'tile-btn';
        button.dataset.suit = this.getSuitName(tileData.suit);
        button.dataset.number = tileData.number;
        button.dataset.index = index;

        // Use text-in-box approach (like mockup)
        button.textContent = this.getTileDisplayText(tileData);

        // Add click handler
        button.addEventListener('click', () => {
            this.handleTileClick(index, tileData);
        });

        return button;
    }

    /**
     * Get display text for tile (e.g., "5C", "J", "N")
     * @param {TileData} tileData - Tile data
     * @returns {string} Display text
     */
    getTileDisplayText(tileData) {
        // Reference tileDisplayUtils.js for text representation
        const suitNames = {
            0: 'C',  // CRACK
            1: 'B',  // BAM
            2: 'D',  // DOT
            3: '',   // WIND (will use letter)
            4: '',   // DRAGON (will use letter)
            5: 'J',  // JOKER
            6: 'F',  // FLOWER
            7: ''    // BLANK
        };

        // Handle special tiles
        if (tileData.suit === 5) return 'J'; // Joker
        if (tileData.suit === 6) return `F${tileData.number + 1}`; // Flower

        // Winds: N, E, S, W
        if (tileData.suit === 3) {
            const winds = ['N', 'E', 'S', 'W'];
            return winds[tileData.number] || '?';
        }

        // Dragons: R, G, W
        if (tileData.suit === 4) {
            const dragons = ['R', 'G', 'W'];
            return dragons[tileData.number] || '?';
        }

        // Numbered suits: 1C, 5B, 9D
        return `${tileData.number}${suitNames[tileData.suit]}`;
    }

    /**
     * Get suit name for CSS data attribute
     * @param {number} suit - Suit enum value
     * @returns {string} Suit name
     */
    getSuitName(suit) {
        const names = ['CRACK', 'BAM', 'DOT', 'WIND', 'DRAGON', 'JOKER', 'FLOWER', 'BLANK'];
        return names[suit] || 'UNKNOWN';
    }

    /**
     * Handle tile click interaction
     * @param {number} index - Tile index in hand
     * @param {TileData} tileData - Tile data
     */
    handleTileClick(index, tileData) {
        this.toggleSelection(index);
        // Emit event for GameController to handle
        this.gameController.emit('USER_TILE_CLICKED', { index, tile: tileData });
    }

    /**
     * Toggle tile selection state
     * @param {number} index - Tile index
     */
    toggleSelection(index) {
        const tileButton = this.tiles[index];
        if (!tileButton) return;

        if (this.selectedIndices.has(index)) {
            this.selectedIndices.delete(index);
            tileButton.classList.remove('selected');
        } else {
            this.selectedIndices.add(index);
            tileButton.classList.add('selected');
        }
    }

    /**
     * Select a specific tile (highlight it)
     * @param {number} index - Tile index
     */
    selectTile(index) {
        this.selectedIndices.add(index);
        this.tiles[index]?.classList.add('selected');
    }

    /**
     * Deselect a specific tile
     * @param {number} index - Tile index
     */
    deselectTile(index) {
        this.selectedIndices.delete(index);
        this.tiles[index]?.classList.remove('selected');
    }

    /**
     * Clear all selected tiles
     */
    clearSelection() {
        this.selectedIndices.forEach(index => {
            this.tiles[index]?.classList.remove('selected');
        });
        this.selectedIndices.clear();
    }

    /**
     * Render exposures (Pung/Kong/Quint)
     * @param {Array} exposures - Array of ExposureData
     */
    renderExposures(exposures) {
        this.exposedSection.innerHTML = '';

        if (!exposures || exposures.length === 0) {
            return; // No exposures to show
        }

        exposures.forEach(exposure => {
            const exposureSet = document.createElement('div');
            exposureSet.className = 'exposure-set';
            exposureSet.dataset.type = exposure.type;

            exposure.tiles.forEach(tileData => {
                const tileButton = document.createElement('button');
                tileButton.className = 'exposed-tile';
                tileButton.dataset.suit = this.getSuitName(tileData.suit);
                tileButton.dataset.number = tileData.number;
                tileButton.textContent = this.getTileDisplayText(tileData);
                exposureSet.appendChild(tileButton);
            });

            this.exposedSection.appendChild(exposureSet);
        });
    }

    /**
     * Sort tiles by suit or rank
     * @param {string} order - 'suit' or 'rank'
     */
    sortTiles(order) {
        // Note: Sorting should be done in HandData, then re-render
        // This method triggers a sort request to GameController
        this.gameController.emit('SORT_HAND', { order });
    }

    /**
     * Clean up tiles
     */
    clearTiles() {
        this.tiles.forEach(tile => {
            if (tile.parentNode) {
                tile.parentNode.removeChild(tile);
            }
        });
        this.tiles = [];
        this.handContainer.innerHTML = '';
    }

    /**
     * Destroy this renderer
     */
    destroy() {
        this.clearTiles();
        this.gameController.off('HAND_UPDATED');
        this.gameController.off('TILE_SELECTED');
    }
}
```

---

## HTML Structure

Your renderer should create this DOM structure inside the container (matching mockup.html):

```html
<div class="hand-section">
    <!-- Exposed tiles section -->
    <div class="exposed-section">
        <div class="exposure-set" data-type="KONG">
            <button class="exposed-tile" data-suit="JOKER" data-number="0">J</button>
            <button class="exposed-tile" data-suit="JOKER" data-number="0">J</button>
            <button class="exposed-tile" data-suit="JOKER" data-number="0">J</button>
            <button class="exposed-tile" data-suit="JOKER" data-number="0">J</button>
        </div>
    </div>

    <!-- Hidden hand (2 rows × 7 columns) -->
    <div class="hand-container">
        <button class="tile-btn" data-suit="CRACK" data-number="1">1C</button>
        <button class="tile-btn selected" data-suit="CRACK" data-number="2">2C</button>
        <!-- ... up to 14 tiles -->
    </div>
</div>
```

---

## CSS Requirements

**IMPORTANT:** Use the exact CSS from [mobile/mockup.css](mobile/mockup.css). Key styles:

```css
/* Hand section */
.hand-section {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 8px;
    background: rgba(0, 0, 0, 0.05);
}

/* Hidden hand container - 7-column grid */
.hand-container {
    display: grid;
    grid-template-columns: repeat(7, 1fr); /* 7 tiles per row */
    gap: 3px;
    justify-items: center;
    max-width: 100%;
}

/* Tile buttons - sized for touch */
.tile-btn {
    width: 45px;
    height: 60px;
    font-size: 16px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    padding: 4px;
    border: 2px solid #333;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.2s;
}

.tile-btn.selected {
    background: #ffeb3b;
    border: 2px solid #f57c00;
}

/* Exposed tiles section */
.exposed-section {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
}

.exposure-set {
    display: flex;
    gap: 2px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.exposed-tile {
    width: 32px;
    height: 42px;
    font-size: 12px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    padding: 2px;
    border: 1px solid #666;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Suit colors - IMPORTANT: Copy all color rules from mockup.css */
.tile-btn[data-suit="CRACK"],
.exposed-tile[data-suit="CRACK"] {
    color: #ff0000;
}

.tile-btn[data-suit="BAM"],
.exposed-tile[data-suit="BAM"] {
    color: #00aa00;
}

.tile-btn[data-suit="DOT"],
.exposed-tile[data-suit="DOT"] {
    color: #0066ff;
}

/* ... (copy all other color rules from mockup.css) */
```

**DO NOT** create your own CSS - use the mockup.css styles exactly.

---

## Test Criteria

Before submitting, verify:

1. ✅ **7-column grid**: Hand displays in 2 rows with 7 columns
2. ✅ **No horizontal scroll**: All tiles fit on screen (no scrolling needed)
3. ✅ **Tile size**: 45px × 60px (matches mockup)
4. ✅ **14th tile**: When hand has 14 tiles, row 2 has 7 tiles (7+7)
5. ✅ **Tap selection**: Tapping tile highlights it yellow with orange border
6. ✅ **Multiple selection**: Can select multiple tiles
7. ✅ **Exposures render**: Pung/Kong/Quint display above hand in smaller tiles
8. ✅ **Suit colors**: Red (Crack), Green (Bam), Blue (Dot), Black (Wind/Joker)
9. ✅ **Text format**: Matches mockup (1C, 5B, N, J, etc.)

---

## Edge Cases to Handle

1. **13 tiles**: Row 1 has 7, row 2 has 6
2. **14 tiles**: Row 1 has 7, row 2 has 7
3. **Multiple exposures**: Up to 4 exposure sets (e.g., 4 Pungs = 12 tiles + 2 hidden)
4. **Empty hand**: Shouldn't happen, but handle gracefully
5. **Very small screens**: CSS media query handles 375px (see mockup.css)

---

## Integration Example

Here's how MobileGameController will use your renderer:

```javascript
// mobile/MobileGameController.js
import { HandRenderer } from './renderers/HandRenderer.js';
import { GameController } from '../core/GameController.js';

const gameController = new GameController();
const handContainer = document.getElementById('hand-container');
const handRenderer = new HandRenderer(handContainer, gameController);

// Game controller will automatically emit HAND_UPDATED events
// HandRenderer subscribes and renders automatically
```

---

## Reference Files

**CRITICAL - READ THESE FIRST:**
- **mobile/mockup.html** - Exact HTML structure to create
- **mobile/mockup.css** - Exact CSS to use (lines 173-296)
- **MOBILE_INTERFACES.md** - GameController event specs
- **tileDisplayUtils.js** - Tile text formatting reference

---

## Allowed Imports

✅ **Allowed:**
- `core/models/HandData.js` (for type reference)
- `core/models/TileData.js` (for type reference)
- `core/constants.js` (for SUIT enums)

❌ **Forbidden:**
- `mobile/components/MobileTile.js` (NOT USED - we use simple buttons)
- `gameObjects.js` (Phaser-specific)
- `phaser` (no Phaser on mobile)
- Any files from `desktop/`

---

## Success Checklist

Before submitting your implementation, ensure:

- [ ] Read [mobile/mockup.html](mobile/mockup.html) and [mobile/mockup.css](mobile/mockup.css)
- [ ] File created at `mobile/renderers/HandRenderer.js`
- [ ] Uses exact CSS from mockup (no custom CSS)
- [ ] Interface matches specification exactly
- [ ] All 9 test criteria pass
- [ ] Handles all 5 edge cases
- [ ] No Phaser dependencies
- [ ] No imports from `desktop/`
- [ ] 7-column grid layout (NOT horizontal scrolling)
- [ ] Tile size 45px × 60px (NOT 150px)

---

## Questions?

If anything is unclear:
1. **READ mobile/mockup.html and mobile/mockup.css FIRST**
2. Check `MOBILE_INTERFACES.md` for GameController event specs
3. Look at `tileDisplayUtils.js` for tile text examples

Good luck! 🚀
