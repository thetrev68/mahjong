# Mobile Design Rationale

## Overview

This document explains the design decisions for the mobile American Mahjong UI mockup, focusing on portrait-mode gameplay optimized for touch interactions on phones.

## Why This Layout Works for Mobile

### Portrait-First Design Philosophy

**Problem:** Traditional mahjong tables are designed for landscape desktop viewing with 4 full player areas. This doesn't translate to mobile phones, which are primarily used in portrait orientation.

**Solution:** Complete redesign for portrait mobile, focusing on the player's hand as the primary interaction area, with opponents displayed as compact info bars.

### Key Design Principles

1. **Single-Hand Focus:** The player's hand takes center stage (45% of screen height) with large, touch-friendly tiles positioned close to bottom
2. **Opponent Minimization:** Opponents shown as compact bars (15% total) rather than full hand displays
3. **Discard Area Emphasis:** Center section (30%) dedicated to discard pile for easy claim decisions
4. **Action Buttons:** Bottom bar (10%) with primary/secondary button hierarchy

## Design Decisions

### 1. Two-Row Hand Layout with Sprite-Ready Tiles

**Decision:** Use 45px wide × 60px tall buttons in a 2-row grid (7 tiles per row)

**Rationale:**

- **No Horizontal Scrolling:** Maximum 14 tiles (2 rows × 7) fits without scrolling
- **Touch-Friendly:** 45px width exceeds minimum touch target guidelines (44px)
- **Sprite Compatibility:** 45px width matches scaled-down existing desktop sprites
- **Visual Clarity:** 16px font size is very readable on phone screens
- **Strategic Overview:** All tiles visible at once for better gameplay decisions

**Alternatives Considered:**

- Single row keyboard-style (22-28px) - Too small for comfortable gameplay
- Scrollable single row with larger tiles - Violates "no horizontal scrolling" requirement
- Three+ row layout - Too complex, harder to scan quickly

### 2. Color Scheme Consistency

**Decision:** Match desktop colors with mobile-appropriate adjustments

**Rationale:**

- **Brand Consistency:** Maintains visual identity across platforms
- **Suit Differentiation:** Color-coded suits (Cracks=red, Bams=green, Dots=blue) aid quick recognition
- **Accessibility:** High contrast ratios for readability
- **Cultural Authenticity:** Traditional mahjong color associations

**Color Mapping:**

- Cracks/Bams/Dots: Primary suit colors
- Dragons: Match their corresponding suit (Red/Green/White dragons)
- Winds/Flowers/Jokers: Black for consistency
- Blanks: Gray to indicate special status

### 3. Layout Zones

**Decision:** Percentage-based vertical layout (15% opponents + 20% discard + 55% hand + 10% actions)

**Rationale:**

- **Predictable Structure:** Users learn layout quickly
- **Responsive Design:** Works across different phone sizes (iPhone 12 to Android mid-range)
- **Touch Optimization:** Hand area (55%) gets most space for 2-row layout + exposed tiles
- **Discard Scrolling:** 20% height with overflow allows 100+ tiles in 6-column grid
- **Visual Hierarchy:** Clear separation with emphasis on player's hand and exposed tiles

**Layout Breakdown:**

- Opponents: 15vh (3 compact bars)
- Discard pile: 20vh (scrollable, 6 columns, 35px tiles)
- Player hand: 55vh (exposed tiles + 2-row grid of 45px tiles)
- Action buttons: 10vh (3 large buttons)

### 4. Touch Interaction Patterns

**Decision:** Tap-to-confirm pattern with visual feedback

**Rationale:**

- **Error Prevention:** Confirmation popup prevents accidental discards
- **Mobile UX Best Practice:** Common pattern in mobile games
- **Accessibility:** Clear visual states (selected, disabled)
- **Feedback:** Immediate visual response to taps

**Gesture Support:**

- Tap tile → Select + highlight
- Double-tap → Quick discard (future enhancement)
- Tap discard pile → Info tooltip

### 5. Opponent Information Display

**Decision:** Compact bars with name, tile count, and exposure type indicators

**Rationale:**

- **Space Constraints:** Portrait layout has limited vertical space for opponents
- **Essential Information:** Shows what's needed for strategic decisions
- **Exposure Icons Only:** Opponent bars show P/K/Q badges (not full tiles) to save space
- **Turn Indication:** Glowing yellow border shows active player
- **Full Exposure Details:** Opponents' exposed tiles visible in desktop view; mobile shows counts only

### 6. Exposed Tiles Display

**Decision:** Full tile representations (32px × 42px) grouped by exposure type above hand

**Rationale:**

- **Complete Information:** Players need to see their own exposed tiles in detail
- **Touch Interaction:** Tiles are tappable for joker/blank swap interactions
- **Grouped by Set:** Pung/Kong/Quint tiles grouped together with visual container
- **Size Balance:** Smaller than hand tiles (32px vs 45px) but still readable
- **Strategic Value:** Critical for planning joker swaps and understanding remaining tiles

### 7. Discard Pile Scalability

**Decision:** Fixed 35px tile size, 6-column grid, vertical scrolling

**Rationale:**

- **100+ Tiles Support:** Game can have 100+ discards; must accommodate all
- **Fixed Size:** Consistent tile size throughout game (no dynamic resizing)
- **Scrollable Container:** 20vh height with overflow-y allows unlimited tiles
- **6-Column Grid:** Optimal balance between tile size and column count
- **Latest Highlight:** Yellow pulsing border on most recent discard

## Accessibility Considerations

### Touch Targets

- 45px width for hand tiles (exceeds 44px minimum)
- 44px+ height for action buttons
- 3px gaps between tiles for accurate tapping

### Visual Hierarchy

- High contrast text on colored backgrounds
- Clear focus states for selected tiles
- Readable font sizes (16px for hand, 12px for exposed, 11px for discard)

### Color Usage

- Not solely reliant on color for information
- Text labels provide redundant information
- Suit colors follow conventional associations

## Alternative Designs Considered

### 1. Traditional Table Layout (Rejected)

- **Problem:** 4-player view too cramped on portrait mobile
- **Issue:** Opponent hands illegible at small sizes
- **Result:** Poor usability and strategic gameplay

### 2. Single-Row Keyboard-Style (Rejected - Initial Mockup)

- **Problem:** 24px tiles too small for comfortable gameplay
- **Issue:** High error rate, eye strain, accessibility concerns
- **Result:** Functional but poor user experience during extended play

### 3. Scrollable Hand (Rejected)

- **Problem:** Horizontal scrolling breaks strategic overview
- **Issue:** Users lose track of tile positions, slower decision-making
- **Result:** Frustrating user experience, deal-breaker requirement

### 4. Three-Row Layout (Rejected)

- **Alternative:** 5-5-4 tile distribution across 3 rows
- **Decision:** Too complex, harder to scan quickly
- **Rationale:** 2 rows provide better visual grouping

### 5. Dynamic Discard Tile Sizing (Rejected)

- **Alternative:** Grow discard tiles as pile shrinks late-game
- **Decision:** Fixed 35px size throughout game
- **Rationale:** Consistency more important than optimization

## Technical Implementation Notes

### CSS Architecture

- **Flexbox + Grid:** Flexbox for layout zones, CSS Grid for tile arrangement
- **CSS Custom Properties:** Color scheme uses variables for easy theming
- **Mobile-First with Tablet Support:** Base styles for phone (390px), media queries for larger screens
- **Responsive Tile Sizing:** 42-45px on phones, up to 60px on tablets

### Sprite Integration Strategy

- **45px Base Size:** Matches 1/2 scale of 90px desktop sprites
- **Text Fallback:** Mockup uses text; production will use `<img>` or CSS background-image
- **Asset Loading:** Sprites loaded from existing `images/` directory
- **Scaling:** CSS `width: 45px; height: 60px` with `object-fit: contain`

### Performance Considerations

- **Minimal DOM:** ~30 elements max in view (13 hand + 4 exposed + 3 opponents + 18 visible discards)
- **Virtualization Not Needed:** Discard pile scrolls but all tiles remain in DOM (acceptable for 100-150 tiles)
- **CSS Transitions:** Simple 0.2s transitions for selected state
- **Hardware Acceleration:** `transform` and `opacity` for animations

### Browser Compatibility

- **Target:** iOS Safari, Chrome Mobile (modern versions)
- **Fallbacks:** Graceful degradation for older browsers
- **Testing:** Chrome DevTools mobile emulation

## Success Metrics

### Usability Goals (Revised Mockup)

- ✅ All hand tiles visible without horizontal scrolling (2-row layout)
- ✅ Touch targets meet accessibility standards (45px width)
- ✅ Visual hierarchy guides attention appropriately (55% for hand)
- ✅ Color scheme aids quick tile recognition (consistent with desktop)
- ✅ Exposed tiles fully visible with tap interaction support
- ✅ Discard pile accommodates 100+ tiles with vertical scrolling

### Performance Goals

- ✅ Fast rendering on mobile devices (minimal DOM)
- ✅ Smooth animations (60fps with CSS transitions)
- ✅ Sprite compatibility (45px = 1/2 desktop sprite size)

### User Experience Goals

- ✅ Comfortable for extended gameplay (larger tiles than v1)
- ✅ Clear feedback for all actions (selection, disabled states)
- ✅ Consistent with mobile gaming conventions (tap, swipe)
- ✅ Better accessibility than keyboard-style approach

## Future Enhancements

### Animation Improvements

- Tile draw/discard animations
- Turn transition effects
- Exposure reveal animations

### Advanced Interactions

- Swipe gestures for sorting
- Long-press context menus
- Haptic feedback integration

### Personalization

- Theme selection (dark/light modes)
- Custom tile colors
- Adjustable font sizes

---

## Revision History

### Version 2 (Current) - Two-Row Layout

- **Date:** 2025-11-12
- **Changes:**
  - Increased tile size from 24px to 45px width
  - Changed from single-row to 2-row grid (7 tiles per row)
  - Added exposed tiles section with full tile representations
  - Reduced discard pile height to 20vh, added scrolling for 100+ tiles
  - Increased hand section to 55vh to accommodate exposed tiles
  - Added responsive sizing for tablets (60px tiles)
- **Rationale:** Initial keyboard-style mockup too small for comfortable gameplay

### Version 1 - Keyboard-Style Layout

- **Date:** Phase 3A initial completion
- **Tile Size:** 24px × 32px
- **Layout:** Single row, 13 tiles
- **Status:** Rejected due to poor touch ergonomics

---

**Design Status:** Revised mockup ready for Phase 3B (interface definitions)
**Testing:** Ready for verification on iPhone 12 viewport (390x844px)
**Next Phase:** Component interfaces based on this revised design
**Sprite Compatibility:** 45px tiles match 1/2 scale of existing 90px desktop sprites
