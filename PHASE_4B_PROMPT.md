# Phase 4B: Opponent Bars Implementation

**Assignee:** Claude Haiku
**Complexity:** Low
**Estimated Tokens:** 4K
**Prerequisites:** Phase 3B (Mobile Interfaces), Phase 1A (Data models)

---

## Task Overview

Create the `OpponentBar.js` component that displays opponent information compactly at the top of the mobile screen. This matches the design in [mobile/mockup.html](mobile/mockup.html) and [mobile/mockup.css](mobile/mockup.css).

Each bar shows:
- Player name and position (e.g., "Opponent 1 (East)")
- Tile count (e.g., "13 tiles")
- Exposed sets as small tile buttons (32px × 42px)
- Current turn indicator (yellow/gold glowing border)

---

## File to Create

**Location:** `mobile/components/OpponentBar.js`

---

## Interface Specification

Your implementation MUST match this exact interface:

```javascript
/**
 * OpponentBar - Displays opponent info compactly
 *
 * Responsibilities:
 * - Show player name, position, tile count
 * - Display exposed sets (Pung/Kong/Quint) as icons
 * - Highlight bar when it's player's turn
 * - Update dynamically when player state changes
 */
export class OpponentBar {
    /**
     * @param {HTMLElement} container - DOM element to render into
     * @param {PlayerData} playerData - Initial player data
     */
    constructor(container, playerData) {
        this.container = container;
        this.playerData = playerData;
        this.element = null;

        this.render();
    }

    /**
     * Initial render of the opponent bar
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'opponent-bar';
        this.element.dataset.player = this.playerData.position;

        // Create inner HTML structure
        this.element.innerHTML = `
            <div class="opponent-info">
                <span class="opponent-name"></span>
                <span class="tile-count"></span>
            </div>
            <div class="exposures"></div>
        `;

        this.container.appendChild(this.element);
        this.update(this.playerData);
    }

    /**
     * Update the bar with new player data
     * @param {PlayerData} playerData - Updated player data
     */
    update(playerData) {
        this.playerData = playerData;

        // Update name and position
        const nameElement = this.element.querySelector('.opponent-name');
        nameElement.textContent = `${playerData.name} (${this.getPositionName(playerData.position)})`;

        // Update tile count
        const countElement = this.element.querySelector('.tile-count');
        const count = playerData.tileCount;
        countElement.textContent = `${count} tile${count !== 1 ? 's' : ''}`;

        // Update exposures
        this.updateExposures(playerData.exposures);

        // Update turn indicator
        this.setCurrentTurn(playerData.isCurrentTurn);
    }

    /**
     * Get human-readable position name
     * @param {number} position - Player position (1=Right, 2=Top, 3=Left)
     * @returns {string} Position name
     */
    getPositionName(position) {
        const positions = ['Bottom', 'East', 'North', 'West'];
        return positions[position] || 'Unknown';
    }

    /**
     * Update exposed sets display
     * @param {Array} exposures - Array of {type, tiles} objects
     */
    updateExposures(exposures) {
        const exposuresContainer = this.element.querySelector('.exposures');
        exposuresContainer.innerHTML = '';

        if (!exposures || exposures.length === 0) {
            return; // No exposures to display
        }

        exposures.forEach(exposure => {
            const icon = document.createElement('span');
            icon.className = `exposure-icon ${exposure.type.toLowerCase()}`;
            icon.textContent = this.getExposureLabel(exposure.type);
            icon.title = this.getExposureTooltip(exposure);
            exposuresContainer.appendChild(icon);
        });
    }

    /**
     * Get short label for exposure type
     * @param {string} type - Exposure type (PUNG, KONG, QUINT)
     * @returns {string} Short label
     */
    getExposureLabel(type) {
        const labels = {
            'PUNG': 'P',
            'KONG': 'K',
            'QUINT': 'Q'
        };
        return labels[type] || '?';
    }

    /**
     * Get tooltip text for exposure
     * @param {Object} exposure - Exposure object with type and tiles
     * @returns {string} Tooltip text
     */
    getExposureTooltip(exposure) {
        const tileNames = exposure.tiles.map(t => t.getText()).join(', ');
        return `${exposure.type}: ${tileNames}`;
    }

    /**
     * Set current turn indicator
     * @param {boolean} isCurrent - Is this player's turn?
     */
    setCurrentTurn(isCurrent) {
        if (isCurrent) {
            this.element.classList.add('current-turn');
        } else {
            this.element.classList.remove('current-turn');
        }
    }

    /**
     * Destroy this component
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
```

---

## Data Input Format

Your component will receive `PlayerData` objects with this structure:

```javascript
// Example PlayerData for opponent
{
    name: "Opponent 1",
    position: 1,          // 1=Right/East, 2=Top/North, 3=Left/West
    tileCount: 13,        // Number of tiles in hand
    exposures: [
        {
            type: 'PUNG',
            tiles: [TileData, TileData, TileData]  // 3 identical tiles
        },
        {
            type: 'KONG',
            tiles: [TileData, TileData, TileData, TileData]  // 4 identical tiles
        }
    ],
    isCurrentTurn: true   // Is it this player's turn?
}
```

**TileData structure** (from `core/models/TileData.js`):
```javascript
{
    suit: 0,        // SUIT enum from constants.js
    number: 5,      // 1-9 for number tiles, 0 for honors
    index: 42,      // Unique tile identifier
    getText() { return "Crack 5"; }  // Human-readable name
}
```

---

## HTML Structure

Your component should create this DOM structure:

```html
<div class="opponent-bar" data-player="1">
    <div class="opponent-info">
        <span class="opponent-name">Opponent 1 (East)</span>
        <span class="tile-count">13 tiles</span>
    </div>
    <div class="exposures">
        <span class="exposure-icon pung" title="PUNG: Crack 5, Crack 5, Crack 5">P</span>
        <span class="exposure-icon kong" title="KONG: Bam 2, Bam 2, Bam 2, Bam 2">K</span>
    </div>
</div>
```

---

## CSS Requirements

**IMPORTANT:** Use the exact CSS from [mobile/mockup.css](mobile/mockup.css) (lines 23-96). Key styles:

```css
.opponent-bar {
    background: rgba(4, 36, 21, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 6px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    backdrop-filter: blur(4px);
}

/* Current turn indicator - yellow/gold glowing border */
.opponent-bar[data-current-turn="true"] {
    border: 2px solid #ffd166;
    box-shadow: 0 0 12px rgba(255, 209, 102, 0.4);
    background: rgba(4, 36, 21, 0.95);
}

/* Opponent info section */
.opponent-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.opponent-name {
    font-weight: bold;
    font-size: 16px;
    color: #333;
}

.tile-count {
    font-size: 14px;
    color: #666;
}

/* Exposures section */
.exposures {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.exposure-icon {
    display: inline-block;
    width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    border-radius: 4px;
    background: #e0e0e0;
    color: #333;
}

/* Type-specific colors */
.exposure-icon.pung {
    background: #90caf9; /* Light blue */
    color: #0d47a1;
}

.exposure-icon.kong {
    background: #ffab91; /* Light orange */
    color: #bf360c;
}

.exposure-icon.quint {
    background: #ce93d8; /* Light purple */
    color: #4a148c;
}

/* Responsive adjustments */
@media (max-width: 360px) {
    .opponent-bar {
        padding: 8px 12px;
    }

    .opponent-name {
        font-size: 14px;
    }

    .tile-count {
        font-size: 12px;
    }

    .exposure-icon {
        width: 24px;
        height: 24px;
        line-height: 24px;
        font-size: 12px;
    }
}
```

---

## Layout Integration

The mobile screen layout should have 3 opponent bars stacked at the top:

```html
<!-- mobile/index.html -->
<div id="opponents-container">
    <div id="opponent-1"></div>  <!-- Right/East -->
    <div id="opponent-2"></div>  <!-- Top/North -->
    <div id="opponent-3"></div>  <!-- Left/West -->
</div>
```

Usage:
```javascript
// mobile/MobileGameController.js
import { OpponentBar } from './components/OpponentBar.js';

const opponent1Bar = new OpponentBar(
    document.getElementById('opponent-1'),
    playerData1
);

// Later, when player state changes:
opponent1Bar.update(updatedPlayerData);
```

---

## Test Criteria

Before submitting, verify:

1. ✅ **Initial render**: Bar displays name, position, tile count
2. ✅ **Tile count updates**: Correctly shows "13 tiles" or "14 tiles"
3. ✅ **Singular/plural**: Shows "1 tile" (not "1 tiles")
4. ✅ **Exposure icons**: Pung/Kong/Quint display with correct colors
5. ✅ **Exposure tooltips**: Hovering/tapping icon shows tile names
6. ✅ **Turn indicator**: Glowing yellow border when `isCurrentTurn: true`
7. ✅ **Turn indicator removal**: Border disappears when `isCurrentTurn: false`
8. ✅ **Multiple exposures**: Can display 2-3 exposure icons in one bar
9. ✅ **No exposures**: Bar displays cleanly with empty exposures array

---

## Edge Cases to Handle

1. **No exposures**: `exposures: []` should display nothing in exposures section
2. **Null exposures**: `exposures: null` should be treated same as empty array
3. **Unknown exposure type**: Should display "?" icon with gray background
4. **Very long names**: Should truncate if needed (CSS `text-overflow: ellipsis`)
5. **Invalid position**: `getPositionName()` should return "Unknown" for invalid values

---

## Example Usage Flow

```javascript
// Step 1: Create opponent bar at game start
const playerData = {
    name: "Opponent 1",
    position: 1,
    tileCount: 13,
    exposures: [],
    isCurrentTurn: false
};
const opponentBar = new OpponentBar(container, playerData);

// Step 2: Opponent makes a Pung exposure
opponentBar.update({
    ...playerData,
    tileCount: 13,
    exposures: [
        { type: 'PUNG', tiles: [tile1, tile2, tile3] }
    ]
});

// Step 3: Opponent's turn begins
opponentBar.update({
    ...playerData,
    isCurrentTurn: true
});

// Step 4: Opponent draws a tile
opponentBar.update({
    ...playerData,
    tileCount: 14,
    isCurrentTurn: true
});

// Step 5: Opponent's turn ends
opponentBar.update({
    ...playerData,
    tileCount: 13,
    isCurrentTurn: false
});
```

---

## Allowed Imports

✅ **Allowed:**
- `core/models/PlayerData.js` (for type reference)
- `core/models/TileData.js` (for type reference)
- `core/constants.js` (if needed for SUIT enums)

❌ **Forbidden:**
- `gameObjects.js` (Phaser-specific)
- `phaser` (no Phaser on mobile)
- Any files from `desktop/`

---

## Success Checklist

Before submitting your implementation, ensure:

- [ ] File created at `mobile/components/OpponentBar.js`
- [ ] CSS file created at `mobile/styles/OpponentBar.css`
- [ ] Interface matches specification exactly
- [ ] All 9 test criteria pass
- [ ] Handles all 5 edge cases
- [ ] No Phaser dependencies
- [ ] Code follows ES6 module syntax
- [ ] Comments explain non-obvious logic
- [ ] Pulse animation works smoothly (no jank)

---

## Reference Files

- **PlayerData model**: `core/models/PlayerData.js` (from Phase 1A)
- **TileData model**: `core/models/TileData.js` (from Phase 1A)
- **MOBILE_INTERFACES.md**: Event specifications (from Phase 3B)

---

## Questions?

If anything is unclear:
1. Check `core/models/PlayerData.js` for data structure
2. Review `MOBILE_INTERFACES.md` for component guidelines
3. Look at CSS animation examples in existing codebase

Good luck! 🎯
