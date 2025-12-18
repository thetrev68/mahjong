# Phase 3D: Mobile Tile Component

**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 6K
**Status:** Ready after Phase 3B complete
**Branch:** mobile-core
**Dependencies:** Phase 3B (MOBILE_INTERFACES.md)

---

## Task Overview

Create **MobileTile.js** that renders a single mahjong tile using **sprites from assets/tiles.png**. This component must support multiple sizes (45px for hand, 32px for exposed, 32px for discard) and work with DOM/CSS (not canvas).

**Key Principle:** This is a presentational component. It knows how to display a tile, but has no game logic.

---

## Context

### What You Have

1. **Interface specification:** [mobile/MOBILE_INTERFACES.md](mobile/MOBILE_INTERFACES.md) - Read the TileComponent section
2. **Sprite assets:** [assets/tiles.png](assets/tiles.png) and [assets/tiles.json](assets/tiles.json)
3. **Mockup reference:** [mobile/mockup.html](mobile/mockup.html) - See tile text format (1C, 2B, J, etc.)
4. **Desktop reference:** See how Phaser loads sprites in [GameScene.js](GameScene.js)

### What You're Building

A JavaScript class that creates a DOM element displaying a mahjong tile using sprite images.

---

## Sprite Sheet Information

### tiles.png Structure

The sprite sheet contains all mahjong tiles in a single horizontal strip:

- **Dimensions:** 2028px × 69px
- **Individual tile size:** 52px × 69px
- **Tiles included:** All suits (Crack, Bam, Dot, Wind, Dragon, Joker, Flower, Blank)

### tiles.json Structure

```json
{
  "frames": {
    "crack1.png": {
      "frame": { "x": 0, "y": 0, "w": 52, "h": 69 },
      "sourceSize": { "w": 52, "h": 69 }
    },
    "crack2.png": {
      "frame": { "x": 52, "y": 0, "w": 52, "h": 69 },
      "sourceSize": { "w": 52, "h": 69 }
    }
    // ... all tiles
  },
  "meta": {
    "image": "tiles.png",
    "size": { "w": 2028, "h": 69 },
    "scale": "1"
  }
}
```

### Sprite Naming Convention

- **Cracks:** `crack1.png`, `crack2.png`, ..., `crack9.png`
- **Bams:** `bam1.png`, `bam2.png`, ..., `bam9.png`
- **Dots:** `dot1.png`, `dot2.png`, ..., `dot9.png`
- **Winds:** `north.png`, `south.png`, `west.png`, `east.png`
- **Dragons:** `red.png`, `green.png`, `white.png`
- **Jokers:** `joker.png`
- **Flowers:** `flower1.png`, `flower2.png`, `flower3.png`, `flower4.png`
- **Blanks:** `blank.png`

---

## Interface Specification

```javascript
/**
 * MobileTile
 *
 * Renders a single mahjong tile using sprite images.
 * Supports multiple sizes and states (normal, selected, disabled, highlighted).
 */
class MobileTile {
  /**
   * @param {TileData} tileData - Tile information (suit, number, index)
   * @param {Object} options - Rendering options
   * @param {number} options.width - Tile width in pixels (default: 45)
   * @param {number} options.height - Tile height in pixels (default: 60)
   * @param {string} options.state - 'normal' | 'selected' | 'disabled' | 'highlighted' (default: 'normal')
   * @param {boolean} options.useSprites - Use sprite images vs text fallback (default: true)
   */
  constructor(tileData, options = {}) {}

  /**
   * Create and return the DOM element for this tile
   * @returns {HTMLElement}
   */
  createElement() {}

  /**
   * Update the tile's visual state
   * @param {string} state - 'normal' | 'selected' | 'disabled' | 'highlighted'
   */
  setState(state) {}

  /**
   * Get the tile's data
   * @returns {TileData}
   */
  getData() {}

  /**
   * Destroy the tile and clean up
   */
  destroy() {}

  /**
   * Get the sprite frame name for this tile
   * @returns {string} - e.g., 'crack5.png', 'joker.png'
   */
  getSpriteFrameName() {}
}
```

---

## Implementation Requirements

### 1. Sprite Loading Strategy

**Option A: CSS Background (Recommended)**

```javascript
createElement() {
    const div = document.createElement('button');
    div.className = 'mobile-tile';
    div.dataset.suit = this.tileData.suit;
    div.dataset.number = this.tileData.number;
    div.dataset.index = this.tileData.index;

    if (this.options.useSprites) {
        const frameName = this.getSpriteFrameName();
        const frame = MobileTile.spriteData.frames[frameName];

        div.style.width = `${this.options.width}px`;
        div.style.height = `${this.options.height}px`;
        div.style.backgroundImage = `url(${MobileTile.spritePath})`;
        div.style.backgroundPosition = `-${frame.frame.x}px 0px`;
        div.style.backgroundSize = `${MobileTile.spriteData.meta.size.w * this.getScale()}px auto`;
    } else {
        // Text fallback
        div.textContent = this.getTileText();
    }

    this.element = div;
    this.setState(this.options.state);
    return div;
}

getScale() {
    // Original sprite tile width: 52px
    // Desired width: this.options.width
    return this.options.width / 52;
}
```

**Option B: IMG Element**

```javascript
createElement() {
    const button = document.createElement('button');
    button.className = 'mobile-tile';

    if (this.options.useSprites) {
        const img = document.createElement('img');
        const frameName = this.getSpriteFrameName();
        const frame = MobileTile.spriteData.frames[frameName];

        // Create a canvas to extract the sprite frame
        const canvas = document.createElement('canvas');
        canvas.width = frame.frame.w;
        canvas.height = frame.frame.h;
        const ctx = canvas.getContext('2d');

        const spriteSheet = new Image();
        spriteSheet.onload = () => {
            ctx.drawImage(
                spriteSheet,
                frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h,
                0, 0, frame.frame.w, frame.frame.h
            );
            img.src = canvas.toDataURL();
        };
        spriteSheet.src = MobileTile.spritePath;

        img.style.width = `${this.options.width}px`;
        img.style.height = `${this.options.height}px`;
        button.appendChild(img);
    }

    return button;
}
```

**Your Decision:** Choose Option A (CSS Background) for better performance. Option B requires creating a canvas for each tile, which is inefficient.

---

### 2. Static Sprite Data Loading

```javascript
class MobileTile {
  // Static properties shared across all tiles
  static spritePath = null;
  static spriteData = null;
  static isLoaded = false;

  /**
   * Load sprite sheet data (call once on app init)
   * @param {string} spritePath - Path to tiles.png
   * @param {Object} spriteData - Parsed tiles.json
   */
  static async loadSprites(spritePath, spriteData) {
    MobileTile.spritePath = spritePath;
    MobileTile.spriteData = spriteData;

    // Preload the sprite sheet image
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        MobileTile.isLoaded = true;
        resolve();
      };
      img.onerror = () => {
        console.error("Failed to load sprite sheet");
        reject(new Error("Sprite sheet load failed"));
      };
      img.src = spritePath;
    });
  }
}
```

**Usage:**

```javascript
// In mobile/main.js
import tilesJson from "../assets/tiles.json";
import tilesPng from "../assets/tiles.png";
import { MobileTile } from "./components/MobileTile.js";

async function init() {
  await MobileTile.loadSprites(tilesPng, tilesJson);
  // Now create MobileTile instances
}
```

---

### 3. Sprite Frame Name Mapping

```javascript
getSpriteFrameName() {
    const { suit, number } = this.tileData;

    switch (suit) {
        case SUIT.CRACK:
            return `crack${number}.png`;
        case SUIT.BAM:
            return `bam${number}.png`;
        case SUIT.DOT:
            return `dot${number}.png`;
        case SUIT.WIND:
            // number: 0=North, 1=South, 2=West, 3=East
            const winds = ['north', 'south', 'west', 'east'];
            return `${winds[number]}.png`;
        case SUIT.DRAGON:
            // number: 0=Red, 1=Green, 2=White
            const dragons = ['red', 'green', 'white'];
            return `${dragons[number]}.png`;
        case SUIT.JOKER:
            return 'joker.png';
        case SUIT.FLOWER:
            return `flower${number + 1}.png`;  // Flowers are 1-indexed
        case SUIT.BLANK:
            return 'blank.png';
        default:
            console.error('Unknown suit:', suit);
            return 'blank.png';
    }
}
```

**Note:** Import SUIT enum from constants.js:

```javascript
import { SUIT } from "../../constants.js";
```

---

### 4. Text Fallback

```javascript
getTileText() {
    const { suit, number } = this.tileData;

    switch (suit) {
        case SUIT.CRACK:
            return `${number}C`;
        case SUIT.BAM:
            return `${number}B`;
        case SUIT.DOT:
            return `${number}D`;
        case SUIT.WIND:
            return ['N', 'S', 'W', 'E'][number];
        case SUIT.DRAGON:
            return ['R', 'G', 'W'][number];
        case SUIT.JOKER:
            return 'J';
        case SUIT.FLOWER:
            return `F${number + 1}`;
        case SUIT.BLANK:
            return 'BL';
        default:
            return '?';
    }
}
```

---

### 5. State Management

```javascript
setState(state) {
    if (!this.element) return;

    // Remove all state classes
    this.element.classList.remove('mobile-tile--selected', 'mobile-tile--disabled', 'mobile-tile--highlighted');

    // Add new state class
    switch (state) {
        case 'selected':
            this.element.classList.add('mobile-tile--selected');
            break;
        case 'disabled':
            this.element.classList.add('mobile-tile--disabled');
            break;
        case 'highlighted':
            this.element.classList.add('mobile-tile--highlighted');
            break;
        case 'normal':
        default:
            // No additional class
            break;
    }

    this.currentState = state;
}
```

---

### 6. CSS Styles

```css
/* mobile/components/MobileTile.css */

.mobile-tile {
  display: inline-block;
  border: 2px solid #333;
  border-radius: 4px;
  background-color: white;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  font-size: 16px;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

/* States */
.mobile-tile--selected {
  background-color: #ffeb3b;
  border-color: #f57c00;
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.mobile-tile--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.mobile-tile--highlighted {
  border-color: #4caf50;
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.6);
  animation: glow 1s infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
  }
  to {
    box-shadow: 0 0 16px rgba(76, 175, 80, 0.8);
  }
}

/* Text fallback colors */
.mobile-tile[data-suit="0"] {
  color: #ff0000;
} /* CRACK - red */
.mobile-tile[data-suit="1"] {
  color: #00aa00;
} /* BAM - green */
.mobile-tile[data-suit="2"] {
  color: #0066ff;
} /* DOT - blue */
.mobile-tile[data-suit="3"] {
  color: #000000;
} /* WIND - black */
.mobile-tile[data-suit="4"] {
  color: #000000;
} /* DRAGON - black */
.mobile-tile[data-suit="5"] {
  color: #000000;
} /* JOKER - black */
.mobile-tile[data-suit="6"] {
  color: #000000;
} /* FLOWER - black */
.mobile-tile[data-suit="7"] {
  color: #888888;
} /* BLANK - gray */
```

---

## Size Variants

Create helper factory methods for common sizes:

```javascript
class MobileTile {
  /**
   * Create a hand tile (45px × 60px)
   */
  static createHandTile(tileData, state = "normal") {
    return new MobileTile(tileData, {
      width: 45,
      height: 60,
      state,
      useSprites: MobileTile.isLoaded,
    });
  }

  /**
   * Create an exposed tile (32px × 42px)
   */
  static createExposedTile(tileData, state = "normal") {
    return new MobileTile(tileData, {
      width: 32,
      height: 42,
      state,
      useSprites: MobileTile.isLoaded,
    });
  }

  /**
   * Create a discard pile tile (32px × 42px)
   */
  static createDiscardTile(tileData, state = "normal") {
    return new MobileTile(tileData, {
      width: 32,
      height: 42,
      state,
      useSprites: MobileTile.isLoaded,
    });
  }
}
```

---

## Testing Specification

### Test 1: Sprite Loading

```javascript
test("should load sprite data correctly", async () => {
  await MobileTile.loadSprites("../assets/tiles.png", tilesJson);
  expect(MobileTile.isLoaded).toBe(true);
  expect(MobileTile.spriteData).toBeDefined();
  expect(MobileTile.spriteData.frames["crack1.png"]).toBeDefined();
});
```

### Test 2: Tile Creation

```javascript
test("should create tile element with correct attributes", () => {
  const tileData = new TileData(SUIT.CRACK, 5, 42);
  const tile = MobileTile.createHandTile(tileData);
  const element = tile.createElement();

  expect(element.dataset.suit).toBe(String(SUIT.CRACK));
  expect(element.dataset.number).toBe("5");
  expect(element.dataset.index).toBe("42");
  expect(element.style.width).toBe("45px");
  expect(element.style.height).toBe("60px");
});
```

### Test 3: State Changes

```javascript
test("should apply state classes correctly", () => {
  const tileData = new TileData(SUIT.BAM, 3, 10);
  const tile = MobileTile.createHandTile(tileData);
  const element = tile.createElement();

  tile.setState("selected");
  expect(element.classList.contains("mobile-tile--selected")).toBe(true);

  tile.setState("disabled");
  expect(element.classList.contains("mobile-tile--selected")).toBe(false);
  expect(element.classList.contains("mobile-tile--disabled")).toBe(true);
});
```

### Test 4: Sprite Frame Names

```javascript
test("should generate correct sprite frame names", () => {
  expect(
    new MobileTile(new TileData(SUIT.CRACK, 5, 0), {}).getSpriteFrameName(),
  ).toBe("crack5.png");
  expect(
    new MobileTile(new TileData(SUIT.WIND, 0, 0), {}).getSpriteFrameName(),
  ).toBe("north.png");
  expect(
    new MobileTile(new TileData(SUIT.DRAGON, 1, 0), {}).getSpriteFrameName(),
  ).toBe("green.png");
  expect(
    new MobileTile(new TileData(SUIT.JOKER, 0, 0), {}).getSpriteFrameName(),
  ).toBe("joker.png");
});
```

### Test 5: Text Fallback

```javascript
test("should use text fallback when sprites not loaded", () => {
  MobileTile.isLoaded = false;
  const tileData = new TileData(SUIT.CRACK, 7, 0);
  const tile = new MobileTile(tileData, { useSprites: false });
  const element = tile.createElement();

  expect(element.textContent).toBe("7C");
});
```

---

## Performance Considerations

### 1. Sprite Sheet Caching

The browser automatically caches the sprite sheet image after first load. All tiles share the same `background-image` URL.

### 2. Avoid Creating Excess DOM

Don't create tiles for tiles that aren't visible. Let parent components (HandRenderer, DiscardPileRenderer) manage tile lifecycle.

### 3. Reuse Tile Elements

If tiles need to be repositioned (e.g., sorting hand), move DOM elements instead of destroying/recreating:

```javascript
// In HandRenderer
sortHand() {
    // Get existing tile elements
    const tileElements = Array.from(this.container.querySelectorAll('.mobile-tile'));

    // Sort by some criteria
    tileElements.sort((a, b) => {
        return Number(a.dataset.suit) - Number(b.dataset.suit);
    });

    // Re-append in sorted order (removes from old position)
    tileElements.forEach(el => this.container.appendChild(el));
}
```

---

## Deliverables

- [ ] Create `mobile/components/MobileTile.js`
- [ ] Implement sprite loading (static loadSprites method)
- [ ] Implement createElement with CSS background positioning
- [ ] Implement state management (selected, disabled, highlighted)
- [ ] Implement text fallback for when sprites unavailable
- [ ] Add factory methods (createHandTile, createExposedTile, createDiscardTile)
- [ ] Create `mobile/components/MobileTile.css`
- [ ] Add JSDoc comments for all public methods
- [ ] Create test file `mobile/components/MobileTile.test.js`
- [ ] Test with all tile types (Crack, Bam, Dot, Wind, Dragon, Joker, Flower, Blank)

---

## Example Usage

```javascript
// In HandRenderer.js
import { MobileTile } from "./components/MobileTile.js";

class HandRenderer {
  renderHand(handData) {
    this.container.innerHTML = "";

    handData.tiles.forEach((tileData) => {
      const tile = MobileTile.createHandTile(tileData, "normal");
      const element = tile.createElement();
      this.container.appendChild(element);
    });
  }

  selectTile(tileIndex) {
    const tile = this.tiles[tileIndex];
    tile.setState("selected");
  }
}
```

```javascript
// In DiscardPileRenderer.js
addDiscardedTile(tileData, isDangerous) {
    const tile = MobileTile.createDiscardTile(
        tileData,
        isDangerous ? 'highlighted' : 'normal'
    );
    const element = tile.createElement();
    if (isDangerous) {
        element.style.borderColor = '#f44336'; // Red border for dangerous
    }
    this.discardPileContainer.appendChild(element);
}
```

---

**Ready to Implement?** Build the MobileTile component that will bring the mobile game to life with beautiful sprites!
