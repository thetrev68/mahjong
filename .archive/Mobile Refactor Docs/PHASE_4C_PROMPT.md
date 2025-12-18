# Phase 4C: Discard Pile View Implementation

**Assignee:** Gemini Flash 2.0
**Complexity:** Low
**Estimated Tokens:** 3K
**Prerequisites:** Phase 3D (MobileTile component), Phase 1A (Data models)

---

## Task Overview

Create the `DiscardPile.js` component that displays discarded tiles in the center area of the mobile screen. The pile uses a **9-column grid layout** and highlights the most recent discard. This matches the design in [mobile/mockup.html](mobile/mockup.html) and [mobile/mockup.css](mobile/mockup.css).

---

## File to Create

**Location:** `mobile/components/DiscardPile.js`

---

## Interface Specification

Your implementation MUST match this exact interface:

```javascript
/**
 * DiscardPile - Displays discarded tiles in center area
 *
 * Responsibilities:
 * - Render discards in 9-column grid
 * - Highlight most recent discard (yellow border + pulse)
 * - Scroll vertically when more than ~108 tiles
 * - Allow clicking discards to see who discarded them
 */
export class DiscardPile {
  /**
   * @param {HTMLElement} container - DOM element to render into
   * @param {GameController} gameController - Core game controller instance
   */
  constructor(container, gameController) {
    this.container = container;
    this.gameController = gameController;
    this.discards = []; // Array of {tile: TileData, player: number}
    this.element = null;

    this.render();
    this.setupEventListeners();
  }

  /**
   * Initial render of discard pile
   */
  render() {
    this.element = document.createElement("div");
    this.element.className = "discard-pile";
    this.container.appendChild(this.element);
  }

  /**
   * Set up GameController event subscriptions
   */
  setupEventListeners() {
    this.gameController.on("TILE_DISCARDED", (data) => {
      this.addDiscard(data.tile, data.player);
    });

    this.gameController.on("TILE_CLAIMED", (data) => {
      this.removeLatestDiscard();
    });

    this.gameController.on("GAME_RESET", () => {
      this.clear();
    });
  }

  /**
   * Add a discard to the pile
   * @param {TileData} tile - The discarded tile
   * @param {number} player - Player who discarded (0-3)
   */
  addDiscard(tile, player) {
    // Add to discards array
    this.discards.push({ tile, player });

    // Create tile element
    const tileElement = this.createDiscardTile(tile, player);
    this.element.appendChild(tileElement);

    // Mark as latest discard
    this.highlightLatest(tileElement);

    // Scroll to bottom if needed
    this.scrollToBottom();
  }

  /**
   * Create a tile element for the discard pile
   * @param {TileData} tile - Tile data
   * @param {number} player - Player who discarded
   * @returns {HTMLElement} Tile element
   */
  createDiscardTile(tile, player) {
    const tileElement = document.createElement("div");
    tileElement.className = "discard-tile";
    tileElement.dataset.player = player;
    tileElement.title = `Discarded by ${this.getPlayerName(player)}`;

    // Use text-in-box approach (like tileDisplayUtils.js)
    tileElement.innerHTML = `
            <div class="discard-tile-face">
                <span class="tile-text">${this.getTileText(tile)}</span>
            </div>
        `;

    // Click to show discard info
    tileElement.addEventListener("click", () => {
      this.showDiscardInfo(tile, player);
    });

    return tileElement;
  }

  /**
   * Get tile text for display
   * @param {TileData} tile - Tile data
   * @returns {string} Display text
   */
  getTileText(tile) {
    // Use TileData.getText() method
    return tile.getText();
  }

  /**
   * Get player name from position
   * @param {number} player - Player position (0-3)
   * @returns {string} Player name
   */
  getPlayerName(player) {
    const names = ["You", "Opponent 1", "Opponent 2", "Opponent 3"];
    return names[player] || "Unknown";
  }

  /**
   * Highlight the latest discard
   * @param {HTMLElement} tileElement - The latest tile element
   */
  highlightLatest(tileElement) {
    // Remove highlight from all tiles
    this.element.querySelectorAll(".discard-tile").forEach((tile) => {
      tile.classList.remove("latest");
    });

    // Add highlight to latest tile
    tileElement.classList.add("latest");
  }

  /**
   * Remove the latest discard (when claimed by another player)
   */
  removeLatestDiscard() {
    if (this.discards.length > 0) {
      this.discards.pop();
      const lastTile = this.element.querySelector(".discard-tile:last-child");
      if (lastTile) {
        lastTile.remove();
      }
    }
  }

  /**
   * Show info about a discarded tile
   * @param {TileData} tile - The tile
   * @param {number} player - Who discarded it
   */
  showDiscardInfo(tile, player) {
    // Simple alert for now (can be enhanced with modal later)
    alert(`${tile.getText()}\nDiscarded by: ${this.getPlayerName(player)}`);
  }

  /**
   * Scroll to bottom of discard pile
   */
  scrollToBottom() {
    this.element.scrollTop = this.element.scrollHeight;
  }

  /**
   * Clear all discards
   */
  clear() {
    this.discards = [];
    this.element.innerHTML = "";
  }

  /**
   * Destroy this component
   */
  destroy() {
    this.gameController.off("TILE_DISCARDED");
    this.gameController.off("TILE_CLAIMED");
    this.gameController.off("GAME_RESET");
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}
```

---

## CSS Requirements

**IMPORTANT:** Use the exact CSS from [mobile/mockup.css](mobile/mockup.css). Key styles:

```css
/* Discard pile section */
.discard-section {
  flex: 1; /* Take remaining space */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 8px;
  overflow-y: auto; /* Allow scrolling for 100+ tiles */
  position: relative;
}

.discard-pile {
  display: grid;
  grid-template-columns: repeat(9, 1fr); /* 9 columns × 12 rows = 108 tiles */
  gap: 2px;
  max-width: 100%;
  width: 100%;
  align-content: start;
}

/* Individual discard tile */
.discard-tile {
  aspect-ratio: 3/4; /* Tile proportions */
  background: white;
  border: 1px solid #333;
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  font-weight: bold;
  height: 32px; /* Fixed size - 9 cols × 32px = ~300px width fits on 390px screen */
  width: auto;
}

.discard-tile.latest {
  border: 3px solid #ffeb3b;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 235, 59, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 235, 59, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 235, 59, 0);
  }
}

/* Player-specific colors (optional enhancement) */
.discard-tile[data-player="0"] {
  border-color: #4caf50; /* Green - human player */
}

.discard-tile[data-player="1"] {
  border-color: #2196f3; /* Blue - opponent 1 */
}

.discard-tile[data-player="2"] {
  border-color: #ff9800; /* Orange - opponent 2 */
}

.discard-tile[data-player="3"] {
  border-color: #9c27b0; /* Purple - opponent 3 */
}

/* Override for latest discard (always gold) */
.discard-tile.latest {
  border-color: #ffd700 !important;
}

/* Scrollbar styling */
.discard-pile::-webkit-scrollbar {
  width: 6px;
}

.discard-pile::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

/* Responsive adjustments */
@media (max-width: 360px) {
  .discard-pile {
    gap: 6px;
    padding: 12px;
    margin: 12px;
  }

  .tile-text {
    font-size: 10px;
  }
}
```

---

## Layout Integration

The discard pile should be positioned in the center of the screen, between opponent bars and player hand:

```html
<!-- mobile/index.html -->
<div id="opponents-container">
  <!-- Opponent bars here -->
</div>

<div id="discard-container">
  <!-- DiscardPile component renders here -->
</div>

<div id="hand-container">
  <!-- HandRenderer here -->
</div>
```

Usage:

```javascript
// mobile/MobileGameController.js
import { DiscardPile } from "./components/DiscardPile.js";
import { GameController } from "../core/GameController.js";

const gameController = new GameController();
const discardContainer = document.getElementById("discard-container");
const discardPile = new DiscardPile(discardContainer, gameController);

// GameController will emit TILE_DISCARDED events automatically
// DiscardPile subscribes and updates automatically
```

---

## Event Flow Example

1. **Player discards tile** → GameController emits `TILE_DISCARDED`
2. **DiscardPile.addDiscard()** creates new tile element in grid
3. **Highlight latest** → Yellow border + pulse animation
4. **Previous discard** → Loses highlight, becomes normal
5. **Opponent claims discard** → GameController emits `TILE_CLAIMED`
6. **DiscardPile.removeLatestDiscard()** removes last tile from grid

---

## Test Criteria

Before submitting, verify:

1. ✅ **First discard**: Tile appears in grid with yellow border + pulse
2. ✅ **Second discard**: New tile highlighted, first tile loses highlight
3. ✅ **Grid layout**: Tiles arrange in 9 columns (row wraps after 9)
4. ✅ **Scroll behavior**: After ~108 discards (9×12), vertical scroll appears
5. ✅ **All discards kept**: All discards remain visible (scroll to see older ones)
6. ✅ **Click info**: Clicking tile shows alert with name and player
7. ✅ **Claim removes**: When tile claimed, latest discard disappears
8. ✅ **Tile size**: Small tiles (32px height) fit 9 per row on 390px screen
9. ✅ **Empty state**: Empty discard pile displays cleanly (no errors)

---

## Edge Cases to Handle

1. **Rapid discards**: Ensure highlight animation doesn't break with quick discards
2. **Claim immediately**: Latest discard removed before animation completes
3. **Game reset**: All discards cleared on new game
4. **No tile data**: Handle null/undefined tile gracefully
5. **Very long tile names**: Text wraps within tile (word-break: break-word)

---

## Text-in-Box Tile Rendering

Use the same approach as `tileDisplayUtils.js` for rendering tile faces. Each tile should display its text representation (e.g., "Crack 5", "White Dragon", "Joker").

**Example:**

```javascript
getTileText(tile) {
    // TileData has a getText() method
    return tile.getText(); // Returns "Crack 5" etc.
}
```

**Do NOT:**

- ❌ Use image sprites (too complex for discard pile)
- ❌ Import Phaser code
- ❌ Create custom SVG rendering

**DO:**

- ✅ Use TileData.getText() method
- ✅ Display text in styled div
- ✅ Keep it simple

---

## Allowed Imports

✅ **Allowed:**

- `core/models/TileData.js` (for type reference)
- `core/constants.js` (if needed)

❌ **Forbidden:**

- `gameObjects.js` (Phaser-specific)
- `phaser` (no Phaser on mobile)
- Any files from `desktop/`
- `MobileTile.js` (not needed - simpler rendering here)

---

## Success Checklist

Before submitting your implementation, ensure:

- [ ] File created at `mobile/components/DiscardPile.js`
- [ ] CSS file created at `mobile/styles/DiscardPile.css`
- [ ] Interface matches specification exactly
- [ ] All 9 test criteria pass
- [ ] Handles all 5 edge cases
- [ ] No Phaser dependencies
- [ ] Code follows ES6 module syntax
- [ ] Comments explain logic
- [ ] Pulse animation works smoothly

---

## Reference Files

- **TileData model**: `core/models/TileData.js` (from Phase 1A)
- **GameController events**: `MOBILE_INTERFACES.md` (from Phase 3B)
- **Tile text rendering**: `tileDisplayUtils.js` (reference for text-in-box approach)

---

## Questions?

If anything is unclear:

1. Check `MOBILE_INTERFACES.md` for event specifications
2. Review `tileDisplayUtils.js` for tile text rendering examples
3. Look at CSS grid documentation if needed

Good luck! 🎲
