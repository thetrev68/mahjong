# Phase 3A Results - Mobile Mockup Revision 2

**Date:** 2025-11-12
**Status:** ✅ Complete - Revised based on feedback
**Branch:** mobile-core

---

## Summary of Changes

Fixed 7 major issues identified in initial mockup review:

### 1. ✅ Starburst Gradient Background
- **Issue:** Plain green background (`#0c6d3a`)
- **Fixed:** Implemented desktop's radial gradient starburst
- **Implementation:**
  ```css
  --gradient-table: radial-gradient(circle at 35% 18%, var(--color-table-highlight) 0%,
    var(--color-table-base) 45%, var(--color-table-dark) 98%), ...
  ```

### 2. ⏸️ Sprite Integration (Deferred to Phase 3B)
- **Issue:** Text tiles instead of sprite images
- **Plan:** Will integrate `assets/tiles.png` in Phase 3B component implementation
- **Note:** Mockup continues to use text for rapid prototyping; 45px size matches 1/2 desktop sprite scale

### 3. ✅ Opponent Exposed Tiles Always Visible
- **Issue:** Opponent bars only showed P/K/Q badges
- **Fixed:** Now displays actual exposed tiles (32×42px) using same styling as player's exposed tiles
- **Example:** Opponent 2 shows `[3C][3C][3C]` Pung

### 4. ✅ Discard Pile Grid Recalculated
- **Issue:** 6-column grid insufficient for 100+ tiles
- **Fixed:** Changed to **9×12 grid** (108 total capacity)
- **Tile Size:** 32px height (down from 35px) to fit 9 columns in 390px width
- **Layout:** Vertical scrolling for overflow

### 5. ✅ Bottom Menu Added
- **Issue:** Missing navigation menu
- **Fixed:** Added 3-button bottom menu bar
  - **Game** 🎮 - New game, restart, etc.
  - **Hand** 🀄 - Hand actions, sort, etc.
  - **Settings** ⚙️ - Game settings
- **Styling:** Matches desktop dark green theme with proper borders and shadows

### 6. ✅ Wall Counter Added
- **Issue:** No way to track remaining tiles in wall
- **Fixed:** Added floating counter in top-right corner
- **Display:** "Wall: 48" with accent color (#ffd166)
- **Positioning:** Absolute positioned overlay, z-index: 100

### 7. ✅ Opponent Bar Styling Updated
- **Issue:** White background, no desktop theme consistency
- **Fixed:** Applied desktop color scheme:
  - Background: `rgba(4, 36, 21, 0.88)` (dark green with transparency)
  - Border: `rgba(255, 255, 255, 0.15)` (subtle white outline)
  - Active turn: Gold border (#ffd166) with glow
  - Text colors: Light text on dark background
  - Backdrop blur for depth

---

## Updated Layout Proportions

```
┌────────────────────────────┐
│ Wall Counter (top-right)   │ ← Fixed position overlay
├────────────────────────────┤
│ Opponent 1 (East)  13 tiles│ ← Auto height
│ Opponent 2 (South) 9 tiles │ ← With exposed tiles
│     [3C][3C][3C]           │
│ Opponent 3 (West)  13 tiles│
├────────────────────────────┤
│                            │
│   Discard Pile (9×12)      │ ← flex: 1 (fills space)
│   [32px tiles, scrolling]  │
│                            │
├────────────────────────────┤
│ Player Exposed:  [J][J]... │ ← Auto height
│ Hand Row 1: [1C][2C][3C].. │ ← 7 tiles × 45px
│ Hand Row 2: [1D][2D][N]... │ ← 6 tiles × 45px
├────────────────────────────┤
│ [🎮 Game][🀄 Hand][⚙️ Set] │ ← 60px menu bar
└────────────────────────────┘
```

**Key Change:** Discard section now uses `flex: 1` to take remaining space, allowing dynamic sizing based on screen height and content above/below.

---

## Tile Sizes Summary

| Component | Size | Notes |
|-----------|------|-------|
| **Hand tiles** | 45×60px | Main interaction, sprite-compatible |
| **Player exposed** | 32×42px | Smaller than hand, still tappable |
| **Opponent exposed** | 32×42px | Same as player exposed |
| **Discard tiles** | 32px height | 9 columns fit in 390px width |

**Consistency:** All exposed tiles (player + opponents) are identical 32×42px size as requested.

---

## Responsive Breakpoints

### Small phones (<375px)
- Hand tiles: 42×56px
- Exposed/opponent tiles: 30×40px
- Discard tiles: 30px height

### Standard phones (375-767px)
- Hand tiles: 45×60px (base)
- Exposed/opponent tiles: 32×42px
- Discard tiles: 32px height

### Tablets (≥768px)
- Hand tiles: 60×80px
- Exposed/opponent tiles: 40×54px
- Discard tiles: 38px height
- Discard grid: 12 columns (more space)

---

## Color Scheme (Desktop Match)

### Background
- Gradient starburst: `--gradient-table`
- Base green: `#0c6d3a`
- Dark green: `#044328`
- Highlight green: `#178c4e`

### UI Elements
- Panel dark: `rgba(4, 24, 14, 0.92)`
- Panel elevated: `rgba(4, 36, 21, 0.88)`
- Border subtle: `rgba(255, 255, 255, 0.15)`
- Border strong: `rgba(255, 255, 255, 0.2)`

### Accent Colors
- Primary accent: `#ffd166` (gold)
- Selected tile: `#ffeb3b` (yellow)
- Active turn border: `#ffd166` with glow

### Text Colors
- Primary: `#f5fbf7` (light)
- Secondary: `rgba(237, 244, 239, 0.65)`
- Muted: `rgba(237, 244, 239, 0.7)`

---

## Next Steps for Phase 3B

1. **Sprite Integration**
   - Load `assets/tiles.png` and `assets/tiles.json`
   - Create sprite rendering utility
   - Replace text tiles with `<img>` or CSS backgrounds
   - Handle sprite frames for 45px, 32px sizes

2. **Component Interfaces**
   - Define HandRenderer with 2-row grid
   - Define ExposedTilesRenderer (player + opponents)
   - Define DiscardPileRenderer with 9×12 grid
   - Define OpponentBar with exposed tile support
   - Define TouchHandler for tile interactions

3. **Wall Counter Logic**
   - Connect to GameController wall state
   - Update counter on tile draws
   - Animate counter changes

4. **Bottom Menu Actions**
   - Wire up Game menu (new game, restart, exit)
   - Wire up Hand menu (sort, joker swap, etc.)
   - Wire up Settings menu (opens settings overlay)

---

## Testing Checklist

- [x] Gradient background visible
- [x] Opponent bars styled correctly (dark theme)
- [x] Opponent exposed tiles shown
- [x] All exposed tiles same size (32×42px)
- [x] Discard pile is 9 columns
- [x] Discard pile scrolls vertically
- [x] Hand tiles are 45×60px
- [x] Wall counter visible in top-right
- [x] Bottom menu has 3 buttons
- [x] Bottom menu styled like desktop
- [x] Responsive breakpoints work
- [ ] Sprite tiles render correctly (Phase 3B)

---

## Files Modified

1. **[mobile/mockup.html](mobile/mockup.html)**
   - Updated opponent bars with exposed tiles
   - Added wall counter
   - Replaced action bar with bottom menu

2. **[mobile/mockup.css](mobile/mockup.css)**
   - Added CSS variables for desktop theme
   - Updated opponent bar styling (dark theme)
   - Changed discard pile to 9 columns
   - Added wall counter styles
   - Replaced action bar with bottom menu styles
   - Fixed media queries for consistency

3. **[MOBILE_DESIGN_RATIONALE.md](MOBILE_DESIGN_RATIONALE.md)**
   - Updated with revision 2 notes
   - Documented all design changes
   - Added sprite integration strategy

---

## Mockup Server

Running at: **http://localhost:5174/**

Test with Chrome DevTools Device Mode (iPhone 12: 390×844px)

---

**Phase 3A Status:** ✅ Complete - Ready for Phase 3B interface definitions
**Mockup Quality:** Production-quality design, deferred sprite integration only
