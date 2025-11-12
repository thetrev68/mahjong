# Phase 3A: Mobile UI Mockups & Design

**Context:** Desktop refactoring complete (Phase 1-2). Now starting mobile implementation. Need UI mockups to guide mobile development.

**Assignee:** Grok X1 Fast (creative/design task)
**Estimated Tokens:** 5K
**Complexity:** Medium
**Status:** Ready to start (independent of Phase 2B/2C)
**Branch:** mobile-core

---

## Task Overview

Design a portrait-mode mobile layout for American Mahjong that works on phones (not tablets). The layout should be fundamentally different from the desktop 4-player table view.

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

**Requirements:**
- Horizontal row of 13-14 tiles
- Each tile 80-100px wide (touch-friendly)
- Scroll horizontally if tiles don't fit
- Selected tile: Raised appearance (translateY -10px)
- Support tile sorting (by suit, by number)

**Example HTML:**
```html
<div class="hand-container">
    <div class="mobile-tile" data-suit="CRACK" data-number="1" data-index="5">
        <div class="tile-face">
            <span class="tile-text">1C</span>
        </div>
    </div>
    <div class="mobile-tile selected" data-suit="CRACK" data-number="2" data-index="8">
        <div class="tile-face">
            <span class="tile-text">2C</span>
        </div>
    </div>
    <!-- More tiles... -->
</div>
```

**Visual Design:**
- Text-in-box tiles (same as discard pile, but larger)
- Selected state: Raised shadow, different border color
- Disabled state: 50% opacity (can't discard during AI turns)

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
- Cracks: `#2196f3` (blue)
- Bams: `#4caf50` (green)
- Dots: `#f44336` (red)
- Winds: `#9c27b0` (purple)
- Dragons: `#ff5722` (orange-red)
- Jokers: `#ffeb3b` (yellow)

---

## Tile Text Format

Use single-character representation (like tileDisplayUtils.js):

```
Cracks: 1C, 2C, 3C, ..., 9C
Bams:   1B, 2B, 3B, ..., 9B
Dots:   1D, 2D, 3D, ..., 9D
Winds:  N, S, W, E
Dragons: R (red), G (green), W (white)
Flowers: F1, F2, F3, F4
Jokers: J
```

**Example CSS for text tiles:**
```css
.tile-text {
    font-size: 24px;
    font-weight: bold;
    font-family: monospace;
}

.tile-face[data-suit="CRACK"] .tile-text {
    color: #2196f3;
}

.tile-face[data-suit="BAM"] .tile-text {
    color: #4caf50;
}

/* ... more suits ... */
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
- **Idle** - Waiting for AI turns
- **Your turn - draw phase** - Can't interact yet
- **Your turn - discard phase** - Can select tiles
- **Claim prompt** - Show buttons (Mahjong, Pung, Kong, Pass)
- **Charleston phase** - Multi-select mode (select 3 tiles)

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

    <!-- Your Hand -->
    <div class="hand-section">
        <div class="hand-container">
            <div class="mobile-tile" data-suit="CRACK" data-number="1">
                <div class="tile-face">
                    <span class="tile-text">1C</span>
                </div>
            </div>
            <div class="mobile-tile selected" data-suit="CRACK" data-number="2">
                <div class="tile-face">
                    <span class="tile-text">2C</span>
                </div>
            </div>
            <!-- More tiles... -->
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
