# Phase 3A: Mobile UI Mockups & Design

**Context:** Desktop refactoring complete (Phase 1-2). Now starting mobile implementation. Need UI mockups to guide mobile development.

**Assignee:** Grok X1 Fast (creative/design task)
**Estimated Tokens:** 5K
**Complexity:** Medium
**Status:** Ready to start (independent of Phase 2B/2C)
**Branch:** mobile-core

---

## ⚠️ CRITICAL REQUIREMENTS

1. **NO HORIZONTAL SCROLLING on hand** - All 13-14 tiles MUST fit on one line
2. **Compact keyboard-style tiles** - 22-28px wide, 1-2 character labels (e.g., "3C", "J", "N")
3. **Tap-to-confirm pattern** - Tap tile → confirmation popup with full details
4. **Color scheme:**
   - Cracks = RED, Bams = GREEN, Dots = BLUE
   - Red Dragon = RED (matches Cracks)
   - Green Dragon = GREEN (matches Bams)
   - White Dragon = BLUE (matches Dots)
   - Winds, Flowers, Jokers = BLACK
   - Blanks = GRAY
5. **Include joker/blank swap mode** in state designs

---

## Task Overview

Design a portrait-mode mobile layout for American Mahjong that works on phones (not tablets). The layout should be fundamentally different from the desktop 4-player table view.

**Key Innovation:** Compact, keyboard-style tile buttons that fit all tiles on one line without scrolling.

---

## Design Requirements

### Screen Size Targets
- **Primary:** iPhone 12 (390x844px)
- **Secondary:** Android mid-range (360x800px)
- **Orientation:** Portrait only (no landscape support)

### Layout Zones (Top to Bottom)

```
┌─────────────────────────┐
│   Opponent Info Bars    │ ← Top 15% (3 compact bars)
├─────────────────────────┤
│                         │
│    Discard Pile Area    │ ← Middle 40% (center focus)
│    (Latest discard      │
│     highlighted)        │
│                         │
├─────────────────────────┤
│   Your Hand (13 tiles)  │ ← Bottom 35% (large tiles)
│   [T][T][T][T][T][T]... │
├─────────────────────────┤
│ [Discard] [Sort] [Menu] │ ← Bottom 10% (action buttons)
└─────────────────────────┘
```

---

## Component Specifications

### 1. Opponent Info Bars (Top Section)

**Requirements:**
- 3 opponent bars stacked vertically
- Each bar shows: Name, Position, Tile Count, Exposures
- Current turn indicator (glowing border or icon)
- Compact design (max 50px height each)
- **Exposures:** Show exposed tiles in compact form (e.g., "P:3C" for Pung of Crack 3, "K:J" for Kong of Jokers)

**Example HTML:**
```html
<div class="opponent-bar" data-position="right" data-current-turn="true">
    <div class="opponent-name">Opponent 1 (East)</div>
    <div class="opponent-stats">
        <span class="tile-count">13</span>
        <div class="exposures">
            <span class="exposure pung">P</span>
            <span class="exposure kong">K</span>
        </div>
    </div>
</div>
```

**Visual Design:**
- Use East/South/West indicators
- Show exposed sets as small colored badges (P=Pung, K=Kong, Q=Quint)
- Current turn: Glow effect or chevron icon

---

### 2. Discard Pile Area (Center Section)

**Requirements:**
- 4-column grid of discarded tiles
- Latest discard highlighted (yellow border + pulse animation)
- Scrollable if more than 16 discards
- Each tile ~60px wide (visible but not huge)

**Example HTML:**
```html
<div class="discard-pile">
    <div class="discard-tile" data-suit="CRACK" data-number="5">
        <span class="tile-text">5C</span>
    </div>
    <div class="discard-tile latest" data-suit="BAM" data-number="3">
        <span class="tile-text">3B</span>
    </div>
    <!-- More tiles... -->
</div>
```

**Visual Design:**
- Use text-in-box tiles (like tileDisplayUtils.js colorized pattern viewer)
- Color-coded by suit: Cracks (blue), Bams (green), Dots (red)
- Latest tile: Yellow glow + subtle pulse animation

---

### 3. Your Hand (Bottom Section)

**CRITICAL REQUIREMENT:** All 13-14 tiles MUST fit on a single line without horizontal scrolling. Use compact keyboard-style buttons.

**Requirements:**
- Horizontal row of 13-14 tiles (NO SCROLLING)
- Each tile 22-28px wide (compact, like keyboard keys)
- Single-character representation (1-2 chars max)
- Tap a tile: Shows full-size confirmation popup with tile image/details
- Selected tile: Highlighted border or background color
- Support tile sorting (by suit, by number)

**Keyboard-Style Layout:**
```
Exposed: [P:3C] [K:J]           ← Your exposed sets (shown above hand)
Hand:    [J][J][1C][2C][3C][4C][1B][2B][1D][2D][N][S][R]
         ^compact buttons, ~25px wide each
```

**Note:** Player's exposed sets should be displayed ABOVE the hand in a separate row, also using compact representation (e.g., "P:3C" with tap-to-view-details).

**Example HTML:**
```html
<div class="hand-section">
    <!-- Exposed tiles row (if player has any) -->
    <div class="exposed-container">
        <button class="exposed-set" data-type="PUNG" data-tile="3C">
            P:3C
        </button>
        <button class="exposed-set" data-type="KONG" data-tile="J">
            K:J
        </button>
    </div>

    <!-- Hidden hand (compact tile buttons) -->
    <div class="hand-container">
        <button class="tile-btn" data-suit="CRACK" data-number="1" data-index="5">
            1C
        </button>
        <button class="tile-btn selected" data-suit="CRACK" data-number="2" data-index="8">
            2C
        </button>
        <button class="tile-btn" data-suit="JOKER" data-number="0" data-index="12">
            J
        </button>
        <!-- More tiles (13-14 total)... -->
    </div>
</div>

<!-- Confirmation popup (shown on tap) -->
<div class="tile-confirm-popup" style="display: none;">
    <div class="popup-content">
        <div class="tile-preview">3C</div>
        <p>Crack 3 - Confirm discard?</p>
        <button class="btn-confirm">✓ Discard</button>
        <button class="btn-cancel">✗ Cancel</button>
    </div>
</div>
```

**Visual Design:**
- Compact buttons with minimal padding (2-3px)
- Font size: 14-16px (readable but compact)
- Selected state: Yellow background or thick border
- Disabled state: 50% opacity (can't interact during AI turns)
- Tap opens confirmation popup with full tile details

---

### 4. Action Buttons (Bottom Bar)

**Requirements:**
- 3-4 buttons max (don't overcrowd)
- Large touch targets (min 44px height)
- Primary action (Discard) should be prominent

**Button Layout:**
```
[🗑️ Discard] [↕️ Sort] [☰ Menu]
```

**Example HTML:**
```html
<div class="action-bar">
    <button class="btn-primary" id="discardBtn">
        🗑️ Discard
    </button>
    <button class="btn-secondary" id="sortBtn">
        ↕️ Sort
    </button>
    <button class="btn-secondary" id="menuBtn">
        ☰ Menu
    </button>
</div>
```

**Visual Design:**
- btn-primary: Green background, white text
- btn-secondary: Gray background, dark text
- Disabled state: Gray + no pointer events

---

## Color Scheme

**Based on existing desktop colors:**
- Background: `#0c6d3a` (dark green, like mahjong table)
- Tiles: White background `#ffffff`, colored suits
- Selected: `#ffeb3b` (yellow highlight)
- Buttons: Primary `#4caf50` (green), Secondary `#757575` (gray)
- Text: Dark `#333333` on light backgrounds

**Suit Colors (for text-in-box tiles):**
- Cracks: `#ff0000` (red)
- Bams: `#00aa00` (green)
- Dots: `#0066ff` (blue)
- Winds: `#000000` (black)
- Dragons:
  - Red Dragon (R): `#ff0000` (red - matches Cracks)
  - Green Dragon (G): `#00aa00` (green - matches Bams)
  - White Dragon (W): `#0066ff` (blue - matches Dots)
- Flowers: `#000000` (black)
- Jokers: `#000000` (black)
- Blanks: `#888888` (gray)

---

## Tile Text Format

Use 1-2 character representation (like tileDisplayUtils.js):

```
Cracks:  1C, 2C, 3C, ..., 9C  (red text)
Bams:    1B, 2B, 3B, ..., 9B  (green text)
Dots:    1D, 2D, 3D, ..., 9D  (blue text)
Winds:   N, S, W, E           (black text)
Dragons: R, G, W              (red/green/blue text - matches corresponding suit)
Flowers: F1, F2, F3, F4       (black text)
Jokers:  J                    (black text)
Blanks:  BL                   (gray text)
```

**Example CSS for compact tile buttons:**
```css
.tile-btn {
    width: 24px;
    height: 32px;
    font-size: 14px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    padding: 2px;
    margin: 1px;
    border: 1px solid #333;
    background: white;
    border-radius: 3px;
}

.tile-btn.selected {
    background: #ffeb3b;
    border: 2px solid #f57c00;
}

/* Color by suit */
.tile-btn[data-suit="CRACK"] {
    color: #ff0000;
}

.tile-btn[data-suit="BAM"] {
    color: #00aa00;
}

.tile-btn[data-suit="DOT"] {
    color: #0066ff;
}

.tile-btn[data-suit="WIND"],
.tile-btn[data-suit="FLOWER"],
.tile-btn[data-suit="JOKER"] {
    color: #000000;
}

/* Dragon colors match their suit equivalents */
.tile-btn[data-suit="DRAGON"][data-number="0"] { /* Red Dragon */
    color: #ff0000;
}

.tile-btn[data-suit="DRAGON"][data-number="1"] { /* Green Dragon */
    color: #00aa00;
}

.tile-btn[data-suit="DRAGON"][data-number="2"] { /* White Dragon */
    color: #0066ff;
}

.tile-btn[data-suit="BLANK"] {
    color: #888888;
}
```

---

## Interaction Patterns

### Gestures to Support
1. **Tap tile** - Select tile (highlight it)
2. **Double-tap tile** - Quick discard (if tile is selected)
3. **Tap "Discard" button** - Discard selected tile
4. **Tap "Sort" button** - Toggle sort mode (by suit, by number)
5. **Tap discard pile tile** - Show info ("Opponent 2 discarded this")

### States to Design
- **Idle** - Waiting for AI turns (tiles disabled/grayed)
- **Your turn - draw phase** - Can't interact yet (just drew tile)
- **Your turn - discard phase** - Can select tiles to discard
- **Claim prompt** - Show buttons (Mahjong, Pung, Kong, Pass)
- **Charleston phase** - Multi-select mode (select 3 tiles to pass)
- **Joker swap mode** - Select exposed joker + replacement tile from hand
  - User taps exposed joker → highlights it
  - User taps matching tile from hand → swap animation
  - Must have matching tile to replace joker
- **Blank swap mode** - Similar to joker swap (for blank tiles if enabled)
  - Tap exposed blank → select replacement → swap
- **Exposure selection** - After claiming discard, select tiles to expose
  - For Pung: Select 2 matching tiles from hand
  - For Kong: Select 3 matching tiles from hand

---

## Deliverables

Create the following files:

### 1. `mobile/mockup.html`
Complete HTML mockup with sample data (13 tiles in hand, 12 tiles in discard pile, 3 opponent bars).

### 2. `mobile/mockup.css`
Full CSS styling for all components. Should look polished and ready for screenshots.

### 3. `MOBILE_DESIGN_RATIONALE.md`
Document explaining:
- Why this layout works for mobile
- Design decisions (colors, spacing, typography)
- Accessibility considerations
- Alternative designs considered

---

## Example Structure

**File:** `mobile/mockup.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Mahjong - UI Mockup</title>
    <link rel="stylesheet" href="mockup.css">
</head>
<body>
    <!-- Opponent Bars -->
    <div class="opponents-section">
        <div class="opponent-bar" data-position="right" data-current-turn="false">
            <div class="opponent-name">Opponent 1 (East)</div>
            <div class="opponent-stats">
                <span class="tile-count">13</span>
            </div>
        </div>
        <div class="opponent-bar" data-position="top" data-current-turn="true">
            <div class="opponent-name">Opponent 2 (South)</div>
            <div class="opponent-stats">
                <span class="tile-count">12</span>
                <div class="exposures">
                    <span class="exposure pung">P</span>
                </div>
            </div>
        </div>
        <div class="opponent-bar" data-position="left" data-current-turn="false">
            <div class="opponent-name">Opponent 3 (West)</div>
            <div class="opponent-stats">
                <span class="tile-count">13</span>
            </div>
        </div>
    </div>

    <!-- Discard Pile -->
    <div class="discard-section">
        <div class="discard-pile">
            <!-- Example tiles -->
            <div class="discard-tile" data-suit="CRACK" data-number="5">
                <span class="tile-text">5C</span>
            </div>
            <div class="discard-tile latest" data-suit="BAM" data-number="3">
                <span class="tile-text">3B</span>
            </div>
            <!-- More tiles... -->
        </div>
    </div>

    <!-- Your Hand (Compact Keyboard-Style) -->
    <div class="hand-section">
        <div class="hand-container">
            <button class="tile-btn" data-suit="JOKER" data-number="0">J</button>
            <button class="tile-btn" data-suit="JOKER" data-number="0">J</button>
            <button class="tile-btn" data-suit="CRACK" data-number="1">1C</button>
            <button class="tile-btn selected" data-suit="CRACK" data-number="2">2C</button>
            <button class="tile-btn" data-suit="CRACK" data-number="3">3C</button>
            <button class="tile-btn" data-suit="CRACK" data-number="4">4C</button>
            <button class="tile-btn" data-suit="BAM" data-number="1">1B</button>
            <button class="tile-btn" data-suit="BAM" data-number="2">2B</button>
            <button class="tile-btn" data-suit="DOT" data-number="1">1D</button>
            <button class="tile-btn" data-suit="DOT" data-number="2">2D</button>
            <button class="tile-btn" data-suit="WIND" data-number="0">N</button>
            <button class="tile-btn" data-suit="WIND" data-number="1">S</button>
            <button class="tile-btn" data-suit="DRAGON" data-number="0">R</button>
            <!-- 13 tiles total, all fit on one line -->
        </div>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
        <button class="btn-primary" id="discardBtn">🗑️ Discard</button>
        <button class="btn-secondary" id="sortBtn">↕️ Sort</button>
        <button class="btn-secondary" id="menuBtn">☰ Menu</button>
    </div>
</body>
</html>
```

---

## Success Criteria

✅ **Mockup loads on mobile viewport** (390x844px)
✅ **All components visible** without scrolling main page
✅ **Tiles are touch-friendly** (min 44px tap targets)
✅ **Visual hierarchy clear** (your hand = most prominent)
✅ **Color scheme consistent** with desktop
✅ **Text readable** on phone screen
✅ **Design rationale documented**

---

## Testing

View mockup on:
1. Chrome DevTools (Device Mode: iPhone 12)
2. Firefox Responsive Design Mode (390x844px)
3. Real iPhone (if available)

Take screenshots for documentation.

---

## Context

- **Dependencies:** None (independent of Phases 1-2)
- **Blockers:** None
- **Est. Time:** 3-4 hours
- **Next Phase:** 3B (Claude Sonnet defines mobile component interfaces based on mockups)

---

**Phase 3A Status:** Ready for delegation
**Assignee:** Grok X1 Fast
