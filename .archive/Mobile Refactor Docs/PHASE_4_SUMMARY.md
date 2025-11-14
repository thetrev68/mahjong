# Phase 4 Prompts - Summary & Distribution Guide

**Created:** 2025-11-12
**Status:** Ready for delegation

---

## Overview

Phase 4 implements the mobile UI rendering layer. All tasks follow the **approved design** in [mobile/mockup.html](mobile/mockup.html) and [mobile/mockup.css](mobile/mockup.css).

---

## Key Design Decisions (FROM MOCKUP)

### ✅ Hand Layout
- **7-column grid with 2 rows** (NOT horizontal scrolling)
- Tiles: 45px × 60px
- Row 1: 7 tiles, Row 2: 6-7 tiles (depending on hand size)
- Grid gap: 3px
- Exposed tiles (Pung/Kong/Quint) display above hand

### ✅ Discard Pile
- **9-column grid** (NOT 4 columns)
- Tiles: 32px height (small to fit many tiles)
- Vertical scroll when >108 tiles (9×12 rows)
- Latest discard: yellow border + pulse animation

### ✅ Opponent Bars
- Dark green background: `rgba(4, 36, 21, 0.88)`
- Current turn indicator: Yellow/gold border (`#ffd166`)
- Exposed tiles shown as small buttons (32px × 42px)
- 3 bars stacked at top

### ✅ Styling
- **Use mockup.css exactly** - DO NOT create custom CSS
- Text-in-box tile rendering (like tileDisplayUtils.js)
- Suit colors: Red (Crack), Green (Bam), Blue (Dot), Black (Wind/Joker)

---

## Task Distribution

### 📄 PHASE_4A_PROMPT.md - Hand Renderer
**Assignee:** Gemini Pro 2.5
**Tokens:** 10K
**Complexity:** Medium

**Deliverable:** `mobile/renderers/HandRenderer.js`

**Key Requirements:**
- 7-column grid layout (repeat(7, 1fr))
- Tiles 45px × 60px
- Exposed tiles section above hand
- Selection state (yellow background, orange border)
- Sort by suit/rank
- Subscribe to HAND_UPDATED events

**Critical:** NO horizontal scrolling, NO 150px tiles, NO MobileTile component import

---

### 📄 PHASE_4B_PROMPT.md - Opponent Bars
**Assignee:** Claude Haiku
**Tokens:** 4K
**Complexity:** Low

**Deliverable:** `mobile/components/OpponentBar.js`

**Key Requirements:**
- Dark green background with backdrop blur
- Yellow border when current turn
- Show name, position, tile count
- Exposed tiles as small buttons (32px × 42px)
- Update dynamically via PlayerData

**Critical:** Use mockup.css colors exactly (dark green theme)

---

### 📄 PHASE_4C_PROMPT.md - Discard Pile
**Assignee:** Gemini Flash 2.0
**Tokens:** 3K
**Complexity:** Low

**Deliverable:** `mobile/components/DiscardPile.js`

**Key Requirements:**
- 9-column grid layout (repeat(9, 1fr))
- Tiles 32px height (small)
- Latest discard: yellow border + pulse
- Vertical scroll for >108 tiles
- Click tile to show discard info

**Critical:** NOT 4 columns, NOT removing old discards after 16

---

### 📄 PHASE_4D_PROMPT.md - Mobile Animations
**Assignee:** Gemini Pro 2.5
**Tokens:** 7K
**Complexity:** Medium

**Deliverable:** `mobile/animations/AnimationController.js`

**Key Requirements:**
- Pure CSS animations (NO libraries)
- 60 FPS performance (use transform/opacity only)
- 7 animation types: draw, discard, claim, turn, sort, exposure, invalid
- Reduced motion support (@media prefers-reduced-motion)
- Web Animations API for complex sequences

**Critical:** Hardware acceleration, no layout thrashing

---

## Distribution Instructions

### For Each Assignee:

1. **Provide the specific PHASE_4X_PROMPT.md file**
2. **Point them to reference files:**
   - `mobile/mockup.html` - MUST READ FIRST
   - `mobile/mockup.css` - MUST READ FIRST
   - `MOBILE_INTERFACES.md` - GameController event specs
   - `tileDisplayUtils.js` - Tile text formatting

3. **Emphasize these constraints:**
   - ❌ NO Phaser imports
   - ❌ NO desktop/ folder imports
   - ❌ NO custom CSS (use mockup.css)
   - ✅ Follow mockup design exactly

4. **Success criteria:**
   - All test criteria pass (9+ per task)
   - No ESLint errors
   - Matches mockup visually
   - No horizontal scrolling anywhere

---

## Validation Checklist

Before accepting any Phase 4 deliverable:

- [ ] Read mockup.html and mockup.css FIRST
- [ ] Verify layout matches mockup exactly
- [ ] Check: NO horizontal scrolling
- [ ] Check: Correct grid columns (7 for hand, 9 for discards)
- [ ] Check: Correct tile sizes (45×60 hand, 32px discards)
- [ ] Check: Uses mockup.css classes (no custom CSS)
- [ ] Check: NO Phaser dependencies
- [ ] Check: NO MobileTile.js import in 4A
- [ ] Run ESLint: `npm run lint`
- [ ] Test on real mobile device (or Chrome DevTools mobile emulation)

---

## Common Pitfalls to Watch For

### ❌ WRONG: Hand Renderer with Horizontal Scrolling
```javascript
// DON'T DO THIS
.hand-container {
    display: flex;
    overflow-x: auto;  // WRONG!
}
```

### ✅ CORRECT: Hand Renderer with 7-Column Grid
```javascript
// DO THIS
.hand-container {
    display: grid;
    grid-template-columns: repeat(7, 1fr);  // CORRECT!
}
```

### ❌ WRONG: Discard Pile with 4 Columns
```javascript
// DON'T DO THIS
grid-template-columns: repeat(4, 1fr);  // WRONG!
```

### ✅ CORRECT: Discard Pile with 9 Columns
```javascript
// DO THIS
grid-template-columns: repeat(9, 1fr);  // CORRECT!
```

### ❌ WRONG: Large Tiles (150px)
```css
/* DON'T DO THIS */
.tile-btn {
    width: 150px;  /* TOO BIG! */
    height: 200px;
}
```

### ✅ CORRECT: Touch-Friendly Tiles (45px)
```css
/* DO THIS */
.tile-btn {
    width: 45px;  /* Fits 7 per row */
    height: 60px;
}
```

---

## Integration Points

After all Phase 4 tasks complete:

1. **Create mobile/index.html** - Assemble all components
2. **Wire up MobileGameController** - Connect renderers to GameController
3. **Test full game flow** - Deal → Charleston → Play → End
4. **Manual QA on devices:**
   - iPhone 12 (390×844)
   - iPhone SE (375×667)
   - Pixel 5 (393×851)
   - iPad Mini portrait (768×1024)

---

## Questions?

If assignees have questions:
1. **Read mockup files first** (answers 90% of questions)
2. Check `MOBILE_INTERFACES.md` for events
3. Review `tileDisplayUtils.js` for tile rendering
4. Ask Claude Sonnet 4.5 for clarification

---

**Next Phase:** After Phase 4 completes, move to Phase 5 (PWA setup) or Phase 6 (AI/Settings integration).
