# Mobile UX Improvements - Implementation Plan

**Created**: 2025-11-19
**Status**: In Progress
**Branch**: mobile-ux-improvements

This document outlines the implementation plan for mobile UX improvements based on user testing feedback.

**Recent updates (mobile-ux-improvements branch):**

- Desktop font stack applied across mobile styles.
- Opponent winds fixed (East/North/West/South), bars ordered top-left-right, tile counts no longer show undefined.
- Layout reordered: opponents → discard → hand → hints → bottom menu; hand centered.
- Start button text updated; becomes Discard during human turn; auto-discard removed.
- Hints compacted to 2 lines with concealed badge; discard pile now fits 9 tiles with smooth auto-scroll.

---

## Table of Contents

1. [Pre-Game Improvements](#pre-game-improvements)
2. [Gameplay Improvements](#gameplay-improvements)
3. [Missing Features](#missing-features)
4. [Implementation Priorities](#implementation-priorities)
5. [Technical Details](#technical-details)

---

## Pre-Game Improvements

### 0. Typography & Fonts

**Issue**: Fonts don't match desktop version
**Impact**: Visual inconsistency
**Complexity**: Low
**Priority**: P2 (Medium)

**Requirements**:

- Apply desktop font stack to mobile CSS
- Desktop font variables:
  ```css
  --font-stack: "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "Consolas", "SFMono-Regular", "Menlo", monospace;
  ```

**Files to modify**:

- [mobile/styles/base.css](mobile/styles/base.css)

**Testing**:

- Verify fonts match desktop version across all screens
- Check readability on various mobile devices

---

### 1. Opponent Bars - Multiple Issues

#### 1A. Wind Assignment Logic

**Issue**: Player 0 should always be East; opponents should be North, West, South
**Impact**: Confusing game state representation
**Complexity**: Medium
**Priority**: P0 (Critical)

**Current behavior**: Wind assignment doesn't follow correct American Mahjong rules
**Expected behavior**: Player 0 (human) = East, opponents = North/West/South in correct order

**Requirements**:

- Update wind assignment in [core/GameController.js](core/GameController.js)
- Ensure Player 0 is always East wind
- Map opponents correctly: RIGHT=North, TOP=West, LEFT=South

**Files to modify**:

- [core/GameController.js](core/GameController.js) - Wind assignment logic
- [mobile/components/OpponentBar.js](mobile/components/OpponentBar.js) - Display logic

**Testing**:

- Verify Player 0 shows "East" wind indicator
- Check opponent winds are correctly displayed as North/West/South
- Validate wind rotation across multiple games

---

#### 1B. Remove "Undefined Tiles" Message

**Issue**: Opponent bars show "Undefined Tiles" message
**Impact**: Poor UX, confusing message
**Complexity**: Low
**Priority**: P1 (High)

**Current code location**: [mobile/components/OpponentBar.js:60](mobile/components/OpponentBar.js#L60)

**Requirements**:

- Remove or fix the undefined tiles message
- Ensure tile count displays correctly or shows nothing if unavailable

**Files to modify**:

- [mobile/components/OpponentBar.js](mobile/components/OpponentBar.js)

**Testing**:

- Verify no "undefined" messages appear
- Check tile count displays correctly throughout game

---

#### 1C. Remove/Hide Box Styling

**Issue**: Box within opponent bar creates visual separation; should be one continuous bar
**Impact**: Visual polish
**Complexity**: Low
**Priority**: P2 (Medium)

**Requirements**:

- Remove border/background from inner elements
- Make opponent bar appear as single cohesive element
- Maintain padding/spacing for readability

**Files to modify**:

- [mobile/styles/OpponentBar.css](mobile/styles/OpponentBar.css)

**Testing**:

- Visual inspection across devices
- Verify readability is maintained

---

#### 1D. Sort Opponents Correctly

**Issue**: Opponents should be ordered top-to-bottom as North, West, South
**Impact**: Confusing spatial layout
**Complexity**: Low
**Priority**: P1 (High)

**Current order**: right, top, left (from [MobileRenderer.js:101-105](mobile/MobileRenderer.js#L101-L105))
**Expected order**: top, left, right → representing North, West, South

**Requirements**:

- Reorder opponent bar containers in HTML or rendering logic
- Map positions: Top=North, Left=West, Right=South
- Update any hardcoded position references

**Files to modify**:

- [mobile/index.html](mobile/index.html) - Container order
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Mapping logic

**Testing**:

- Verify spatial layout matches expected opponent positions
- Check across multiple game states

---

### 2. Game Board Pre-Game State

#### 2A. Button Text: "NEW" → "Start"

**Issue**: Button says "NEW" instead of "Start"; message should say "Check Settings and click Start when ready"
**Impact**: Clarity of instructions
**Complexity**: Low
**Priority**: P1 (High)

**Requirements**:

- Change button text from "NEW" to "Start" before game begins
- Update status message to match
- Button should change to different function once game starts

**Files to modify**:

- [mobile/index.html](mobile/index.html) - Button text
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Status messages

**Testing**:

- Verify button says "Start" on page load
- Check message displays correctly

---

#### 2B. Scattered Tile Deck Animation

**Issue**: No animated tile deck like desktop version
**Impact**: Visual appeal, game feel
**Complexity**: High
**Priority**: P2 (Medium)

**Desktop reference**: [desktop/managers/HomePageTileManager.js](desktop/managers/HomePageTileManager.js)

**Requirements**:

- Create HTML/CSS version of scattered tile deck
- Tiles should be smaller than desktop (mobile-appropriate)
- Animation: tiles jump/flip to back, then fly off top-left of screen on game start
- Match desktop animation feel but optimize for mobile performance

**New files to create**:

- `mobile/components/HomePageTiles.js` - Component for scattered tiles
- `mobile/animations/HomePageAnimation.js` - Animation controller

**Files to modify**:

- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Integrate home page tiles
- [mobile/index.html](mobile/index.html) - Add container for home tiles
- [mobile/styles/animations.css](mobile/styles/animations.css) - CSS animations

**Technical considerations**:

- Use CSS transforms for performance (GPU acceleration)
- Stagger animations for visual effect
- Clean up DOM elements after animation completes
- Consider using requestAnimationFrame for smooth 60fps

**Testing**:

- Performance testing on lower-end devices
- Visual consistency with desktop version
- Verify tiles clean up properly after animation

---

#### 2C. Hide Hints Panel Pre-Game

**Issue**: Hints panel visible before game starts (should be invisible, not just collapsed)
**Impact**: UI clutter
**Complexity**: Low
**Priority**: P2 (Medium)

**Requirements**:

- Hide entire hints panel container before game starts
- Show hints panel only during active gameplay
- Use `display: none` not `visibility: hidden`

**Files to modify**:

- [mobile/components/HintsPanel.js](mobile/components/HintsPanel.js)
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Show/hide logic based on game state

**Testing**:

- Verify hints completely invisible pre-game
- Check hints appear when gameplay begins

---

#### 2D. Player 0 Empty Tile Rack

**Issue**: Need visual tile rack for Player 0 hand before game starts
**Impact**: Visual consistency, game feel
**Complexity**: Medium
**Priority**: P2 (Medium)

**Requirements**:

- Create empty tile rack panel for Player 0
- Panel similar to opponent bars but larger
- Layout: 7x2 grid for 'normal size' tiles + 3rd row for small exposed tiles
- Position: Between hints panel and discard pile
- Rack should be centered horizontally

**New component needed**:

- `mobile/components/PlayerRack.js` - Empty rack with grid layout

**Files to modify**:

- [mobile/index.html](mobile/index.html) - Add player rack container
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Integrate rack component
- [mobile/styles/MobileGame.css](mobile/styles/MobileGame.css) - Rack styling

**CSS Grid requirements**:

```css
.player-rack {
  display: grid;
  grid-template-rows: repeat(
    3,
    auto
  ); /* 2 rows normal tiles + 1 row exposures */
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
```

**Testing**:

- Visual layout on various screen sizes
- Verify rack is centered
- Check rack integrates with hand tiles when game starts

---

### 3. Bottom Menu Pre-Game State

#### 3A. Hide Sort Button Pre-Game

**Issue**: Sort button visible before game starts (not needed until hand is dealt)
**Impact**: UI clutter
**Complexity**: Low
**Priority**: P2 (Medium)

**Current logic**: [MobileRenderer.js:252-256](mobile/MobileRenderer.js#L252-L256)

**Requirements**:

- Hide sort button on page load
- Show sort button only during main game loop states
- Current logic already exists, verify it's working correctly

**Files to modify**:

- Verify existing logic in [mobile/MobileRenderer.js](mobile/MobileRenderer.js)
- May need initial state fix in [mobile/index.html](mobile/index.html)

**Testing**:

- Verify sort hidden on page load
- Check sort appears during gameplay

---

#### 3B. Button Text: "NEW" → "Start"

**Issue**: Same as 2A - consistency across all buttons
**Impact**: Clarity
**Complexity**: Low
**Priority**: P1 (High)

**Requirements**:

- Ensure all references to "NEW" button change to "Start"
- Button functionality should transition to "Discard" during gameplay (see 1G below)

**Files to modify**:

- [mobile/index.html](mobile/index.html) - Button HTML

---

#### 3C. Settings Icon, Not Button

**Issue**: Settings should be a clickable icon, not a full button; icon should be larger
**Impact**: UI polish, space efficiency
**Complexity**: Low
**Priority**: P2 (Medium)

**Current implementation**: Full button with gear emoji

**Requirements**:

- Increase icon size (suggest 32px or larger)
- Remove button styling (no background, border)
- Keep clickable area reasonable (min 44x44px for touch target)
- Consider using SVG icon instead of emoji for better control

**Files to modify**:

- [mobile/index.html](mobile/index.html) - Button markup
- [mobile/styles/MobileGame.css](mobile/styles/MobileGame.css) - Icon styling

**Suggested HTML**:

```html
<button class="menu-icon" aria-label="Settings">⚙️</button>
```

**Testing**:

- Visual comparison with desktop settings button
- Touch target accessibility (min 44x44px)

---

#### 3D. Button Styling Updates

**Issue**: Buttons squared off; should have rounded corners or oval shape; colors should match desktop
**Impact**: Visual consistency with desktop
**Complexity**: Low
**Priority**: P2 (Medium)

**Desktop reference**: Yellow buttons with dark green text, rounded corners

**Requirements**:

- Border radius: suggest `border-radius: 8px` or `border-radius: 50%` (oval)
- Background: Yellow (`#F4D03F` or similar)
- Text: Dark green (`#0c6d3a` or similar)
- Match desktop side panel button styling

**Files to modify**:

- [mobile/styles/MobileGame.css](mobile/styles/MobileGame.css) - Button styles

**CSS to add**:

```css
.menu-btn {
  background-color: #f4d03f;
  color: #0c6d3a;
  border-radius: 8px; /* or 24px for more rounded */
  border: 2px solid #0c6d3a;
}
```

**Testing**:

- Visual comparison with desktop buttons
- Check contrast ratios for accessibility

---

## Gameplay Improvements

### 1. Layout & Organization

#### 1A. Screen Layout Order

**Issue**: Need consistent top-to-bottom layout order
**Impact**: Visual organization
**Complexity**: Medium
**Priority**: P1 (High)

**Expected order** (top to bottom):

1. Opponents (North, West, South)
2. Discard Pile
3. Player 0 Hand (in rack)
4. Hints Panel
5. Menu Buttons

**Current issues**:

- Hand area contains both hand and menu buttons
- Layout order not optimal

**Requirements**:

- Restructure HTML/CSS to enforce proper layout order
- Use CSS Flexbox or Grid for main layout
- Ensure responsive behavior

**Files to modify**:

- [mobile/index.html](mobile/index.html) - DOM structure
- [mobile/styles/MobileGame.css](mobile/styles/MobileGame.css) - Layout styles

**Suggested CSS**:

```css
#mobile-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.opponents-container {
  order: 1;
}
.discard-container {
  order: 2;
}
.player-rack {
  order: 3;
}
.hints-panel {
  order: 4;
}
.bottom-menu {
  order: 5;
}
```

**Testing**:

- Visual inspection on various screen sizes
- Verify no layout shifts during gameplay

---

#### 1B. Center Player Rack & Hand

**Issue**: Player rack and hand array appear too far to the right
**Impact**: Visual balance
**Complexity**: Low
**Priority**: P1 (High)

**Requirements**:

- Center player rack horizontally
- Center tile array within rack
- Use `margin: 0 auto` or Flexbox centering

**Files to modify**:

- [mobile/styles/HandRenderer.css](mobile/styles/HandRenderer.css)
- [mobile/styles/MobileGame.css](mobile/styles/MobileGame.css)

**CSS to add**:

```css
.player-rack,
.hand-container {
  margin: 0 auto;
  max-width: fit-content;
}
```

**Testing**:

- Visual centering on various screen widths
- Verify no overflow issues

---

#### 1C. Compact Hints Panel (Max 2 Rows)

**Issue**: Hints panel takes too much vertical space
**Impact**: Screen real estate
**Complexity**: Medium
**Priority**: P1 (High)

**Current implementation**: [mobile/components/HintsPanel.js:128-144](mobile/components/HintsPanel.js#L128-L144)

**Requirements**:

- Reduce pattern description length
- New format: `[Card Year] - [groupDescription] - [Description]`
- Remove parenthetical notes from description
- Add "C" badge if `concealed === true`
- Limit to max 2 lines per pattern
- Use CSS `text-overflow: ellipsis` for truncation

**Files to modify**:

- [mobile/components/HintsPanel.js](mobile/components/HintsPanel.js) - Pattern formatting
- [mobile/styles/MobileGame.css](mobile/styles/MobileGame.css) - Hint styling

**CSS to add**:

```css
.hint-pattern {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.concealed-badge {
  display: inline-block;
  width: 20px;
  height: 20px;
  background: #ccc;
  border-radius: 50%;
  text-align: center;
  line-height: 20px;
  font-weight: bold;
}
```

**Testing**:

- Verify max 2 rows per pattern
- Check badge displays correctly
- Ensure readability not compromised

---

#### 1D. Discard Pile Sizing (9 Tiles Wide)

**Issue**: Discard pile tiles too large; should fit 9 tiles wide and be completely visible
**Impact**: Usability, scroll behavior
**Complexity**: Medium
**Priority**: P1 (High)

**Requirements**:

- Calculate tile size to fit exactly 9 tiles in viewport width
- Account for gaps between tiles
- Ensure tiles remain fully visible (no cropping)

**Formula**:

```javascript
const tileWidth = (viewportWidth - 8 * gapSize - 2 * containerPadding) / 9;
```

**Files to modify**:

- [mobile/components/DiscardPile.js](mobile/components/DiscardPile.js)
- [mobile/styles/MobileGame.css](mobile/styles/MobileGame.css)

**Testing**:

- Verify exactly 9 tiles fit horizontally
- Check various screen widths (320px - 768px)
- Ensure no horizontal scrollbar unless > 9 tiles

---

#### 1E. Discard Pile Auto-Scroll

**Issue**: Discard pile should auto-scroll when it fills up
**Impact**: Usability
**Complexity**: Low
**Priority**: P1 (High)

**Requirements**:

- Automatically scroll to latest tile when new discard added
- Smooth scroll animation
- Ensure latest tile is visible after scroll

**Files to modify**:

- [mobile/components/DiscardPile.js](mobile/components/DiscardPile.js)

**JavaScript to add**:

```javascript
addDiscard(tile) {
  // ... existing code ...

  // Auto-scroll to latest tile
  this.container.scrollTo({
    left: this.container.scrollWidth,
    behavior: 'smooth'
  });
}
```

**Testing**:

- Verify smooth scroll to latest tile
- Check scroll behavior when pile < 9 tiles
- Test rapid discard sequences

---

#### 1F. Remove Duplicate Status Message

**Issue**: "Choose a tile to discard" appears twice (on board and bottom of screen)
**Impact**: UI clutter
**Complexity**: Low
**Priority**: P2 (Medium)

**Requirements**:

- Keep status message on game board
- Remove duplicate from bottom of screen
- Verify message updates correctly

**Files to modify**:

- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Status message logic

**Testing**:

- Verify only one message appears
- Check message updates during game flow

---

#### 1G. Repurpose "Start" Button to "Discard"

**Issue**: "NEW" (Start) button not needed during gameplay; should become "Discard" button
**Impact**: Usability
**Complexity**: Low
**Priority**: P1 (High)

**Requirements**:

- Button text: "Start" pre-game, "Discard" during gameplay
- Button function: Start game → Discard selected tile
- Hide when not applicable (e.g., during opponent turn)

**Files to modify**:

- [mobile/index.html](mobile/index.html) - Button HTML
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Button logic

**Implementation**:

```javascript
// In MobileRenderer
onStateChanged(state) {
  const discardBtn = document.getElementById("discard-btn");
  if (state === STATE.INIT || state === STATE.START) {
    discardBtn.textContent = "Start";
    discardBtn.onclick = () => this.gameController.startGame();
  } else if (state === STATE.LOOP_CHOOSE_DISCARD && isHumanTurn) {
    discardBtn.textContent = "Discard";
    discardBtn.onclick = () => this.discardSelectedTile();
  }
}
```

**Testing**:

- Verify button text changes correctly
- Check button functionality in each state

---

#### 1H. Remove Auto-Discard Feature

**Issue**: Auto-discard button and feature not desired in game
**Impact**: Game rules adherence
**Complexity**: Low
**Priority**: P1 (High)

**Current references**:

- [mobile/MobileRenderer.js:378](mobile/MobileRenderer.js#L378) - "Auto Discard" cancel label

**Requirements**:

- Remove "Auto Discard" button from UI prompts
- Remove auto-discard logic from GameController (if any)
- Remove fallback discard behavior
- Ensure player must explicitly select and discard

**Files to modify**:

- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Remove auto-discard references
- [core/GameController.js](core/GameController.js) - Check for auto-discard logic
- Search codebase for "auto" + "discard" references

**Search command**:

```bash
# Find all auto-discard references
grep -r "auto.*discard" --include="*.js" --ignore-case
```

**Testing**:

- Verify no auto-discard button appears
- Check player cannot proceed without explicit discard selection

---

### 2. Hand Interaction

#### 2A. Visual Discard Recommendations

**Issue**: Tiles recommended for discard should have red pulsing glow
**Impact**: User guidance
**Complexity**: Medium
**Priority**: P2 (Medium)

**Requirements**:

- Get discard recommendations from AIEngine
- Apply pulsing red glow to recommended tiles
- Use CSS animation for pulsing effect
- Remove glow when tile selected or discarded

**Files to modify**:

- [mobile/renderers/HandRenderer.js](mobile/renderers/HandRenderer.js) - Apply glow
- [mobile/styles/animations.css](mobile/styles/animations.css) - Pulsing animation
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Get recommendations

**CSS to add**:

```css
.tile--discard-recommended {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 0, 0, 1);
  }
}
```

**Implementation**:

```javascript
// In MobileRenderer or HandRenderer
updateDiscardHints() {
  const recommendations = this.aiEngine.getTileRecommendations(this.latestHandSnapshot);
  // Apply .tile--discard-recommended class to bottom-ranked tiles
}
```

**Testing**:

- Verify red glow appears on correct tiles
- Check animation performance
- Ensure glow removes when tile selected

---

#### 2B. Tile Selection Behavior

**Issue**: Tap should select tile (raise up like desktop); tapping again deselects; swiping up discards
**Impact**: Intuitive touch controls
**Complexity**: Medium
**Priority**: P0 (Critical)

**Current behavior**: Tap toggles selection, no swipe gesture

**Requirements**:

- Tap tile: Select (raise position by 1/3 tile height, remove yellow glow)
- Tap selected tile: Deselect (lower to normal position)
- Swipe up on tile: Immediate discard (bypass "Discard" button)
- Visual feedback: Raised position instead of/in addition to glow

**Files to modify**:

- [mobile/renderers/HandRenderer.js](mobile/renderers/HandRenderer.js) - Selection behavior
- [mobile/gestures/TouchHandler.js](mobile/gestures/TouchHandler.js) - Swipe detection
- [mobile/styles/HandRenderer.css](mobile/styles/HandRenderer.css) - Raised state

**CSS for raised state**:

```css
.tile--selected {
  transform: translateY(-33%); /* Raise by 1/3 tile height */
  transition: transform 0.2s ease;
}
```

**Swipe detection**:

```javascript
// In TouchHandler
detectSwipe(startY, endY, element) {
  const swipeThreshold = 50; // pixels
  if (startY - endY > swipeThreshold) {
    // Swipe up detected
    this.onSwipeUp(element);
  }
}
```

**Testing**:

- Tap/select interaction feels responsive
- Swipe up reliably triggers discard
- No accidental discards from scroll gestures

---

#### 2C. Discard Animation

**Issue**: Discarded tile should animate from hand to discard pile
**Impact**: Visual feedback, game feel
**Complexity**: Medium
**Priority**: P2 (Medium)

**Requirements**:

- Clone tile element at discard moment
- Animate clone from hand position to discard pile position
- Use CSS transforms or Web Animations API
- Remove clone after animation completes
- Real tile appears in discard pile

**Files to modify**:

- [mobile/animations/AnimationController.js](mobile/animations/AnimationController.js)
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Trigger animation

**Implementation approach**:

```javascript
animateTileToDiscardPile(tileElement, targetPosition) {
  const clone = tileElement.cloneNode(true);
  document.body.appendChild(clone);

  const startRect = tileElement.getBoundingClientRect();
  const endRect = targetPosition.getBoundingClientRect();

  clone.animate([
    { transform: `translate(0, 0)` },
    { transform: `translate(${endRect.x - startRect.x}px, ${endRect.y - startRect.y}px)` }
  ], {
    duration: 500,
    easing: 'ease-in-out'
  }).onfinish = () => clone.remove();
}
```

**Testing**:

- Animation smooth and performant
- Clone removes after animation
- No visual glitches

---

#### 2D. Newly Drawn Tile Blue Glow

**Issue**: Newly drawn tile should get blue pulsing glow until next major event
**Impact**: Visual feedback
**Complexity**: Low
**Priority**: P2 (Medium)

**Requirements**:

- Apply blue pulsing glow to last tile in hand after draw
- Glow persists until next discard or major state change
- Similar animation to red glow but blue color

**Files to modify**:

- [mobile/renderers/HandRenderer.js](mobile/renderers/HandRenderer.js)
- [mobile/styles/animations.css](mobile/styles/animations.css)

**CSS to add**:

```css
.tile--newly-drawn {
  animation: pulse-blue 2s infinite;
}

@keyframes pulse-blue {
  0%,
  100% {
    box-shadow: 0 0 5px rgba(0, 100, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 100, 255, 1);
  }
}
```

**Implementation**:

```javascript
// In HandRenderer or MobileRenderer
onTileDrawn(data) {
  // ... existing code ...
  const lastTile = this.handRenderer.getLastTileElement();
  lastTile.classList.add('tile--newly-drawn');
}

onTileDiscarded() {
  // Remove blue glow from all tiles
  this.handRenderer.container.querySelectorAll('.tile--newly-drawn')
    .forEach(tile => tile.classList.remove('tile--newly-drawn'));
}
```

**Testing**:

- Blue glow appears on newly drawn tile
- Glow removes on next discard
- No performance issues with animation

---

### 3. Discard Pile Enhancements

#### 3A. Auto-Sort on New Discard

**Issue**: Discard pile should auto-sort when new tile arrives
**Impact**: Organization
**Complexity**: Medium
**Priority**: P2 (Medium)

**Requirements**:

- Sort tiles by suit/rank when new tile added
- Maintain chronological order within same tile type
- Smooth sorting animation (optional)

**Sort order**:

1. Bamboo (1-9)
2. Characters (1-9)
3. Dots (1-9)
4. Winds (East, South, West, North)
5. Dragons (Red, Green, White)
6. Flowers
7. Jokers

**Files to modify**:

- [mobile/components/DiscardPile.js](mobile/components/DiscardPile.js)

**Implementation**:

```javascript
addDiscard(tile, player) {
  this.discards.push({ tile, player, timestamp: Date.now() });
  this.sortDiscards();
  this.render();
}

sortDiscards() {
  this.discards.sort((a, b) => {
    // Sort by suit/rank, then by timestamp for chronological order
    const suitOrder = { BAM: 1, CHR: 2, DOT: 3, WIND: 4, DRAGON: 5, FLOWER: 6, JOKER: 7 };
    // ... sorting logic ...
  });
}
```

**Testing**:

- Verify tiles sort correctly by suit/rank
- Check chronological order within same tile type
- Performance with many tiles

---

#### 3B. Latest Tile Visual Treatment

**Issue**: Latest tile should have blue pulsing glow, be larger, and be in-frame after auto-scroll
**Impact**: Visual feedback
**Complexity**: Medium
**Priority**: P2 (Medium)

**Requirements**:

- Latest tile gets `.tile--latest` class
- Blue pulsing glow animation
- Tile scaled larger (e.g., 1.2x)
- Auto-scroll ensures tile is visible
- Glow and size revert when next tile arrives

**Files to modify**:

- [mobile/components/DiscardPile.js](mobile/components/DiscardPile.js)
- [mobile/styles/animations.css](mobile/styles/animations.css)

**CSS to add**:

```css
.discard-tile--latest {
  transform: scale(1.2);
  animation: pulse-blue 2s infinite;
  transition: transform 0.3s ease;
}
```

**Implementation**:

```javascript
addDiscard(tile) {
  // Remove .tile--latest from previous tile
  this.container.querySelector('.discard-tile--latest')?.classList.remove('discard-tile--latest');

  // Add new tile with .tile--latest class
  const tileEl = this.createTileElement(tile);
  tileEl.classList.add('discard-tile--latest');
  this.container.appendChild(tileEl);

  // Auto-scroll to ensure latest tile visible
  this.scrollToLatest();
}
```

**Testing**:

- Latest tile is larger and glows blue
- Previous tile returns to normal size
- Scroll ensures latest tile visible

---

## Missing Features

### 4. Blank Tile Swap Functionality

**Issue**: No blank tile swap functionality implemented
**Impact**: Game feature missing
**Complexity**: High
**Priority**: P1 (High)

**Requirements**:

- Implement blank tile swap logic in GameController
- Create UI prompt for selecting tiles to swap
- Add animation for swap action
- Validate swap rules (blank tiles can be swapped for any exposed tile)

**Files to create/modify**:

- [core/GameController.js](core/GameController.js) - Swap logic
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Swap UI prompt
- [mobile/animations/AnimationController.js](mobile/animations/AnimationController.js) - Swap animation

**Implementation steps**:

1. Add blank tile detection in hand
2. Create UI prompt for selecting exposed tile to swap
3. Implement swap logic in GameController
4. Animate swap (blank flies to exposure, exposed tile flies to hand)
5. Update game state

**Testing**:

- Blank tiles can swap with any exposed tile
- Animation is smooth
- Game state updates correctly

---

### 5. Joker Swap Functionality

**Issue**: No joker exchange functionality (swap joker in exposure for matching tile from hand)
**Impact**: Game feature missing
**Complexity**: High
**Priority**: P1 (High)

**Requirements**:

- Detect when player has tile matching joker in their own exposure
- Prompt player to swap joker with matching tile
- Implement swap logic and animation
- Validate swap rules per American Mahjong rules

**Files to create/modify**:

- [core/GameController.js](core/GameController.js) - Joker swap logic
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Swap UI prompt
- [mobile/animations/AnimationController.js](mobile/animations/AnimationController.js)

**Implementation steps**:

1. Check for joker swap opportunities after each tile drawn
2. Prompt player with swap option
3. Execute swap (tile from hand → exposure, joker → hand)
4. Animate swap
5. Update game state

**Testing**:

- Joker swaps only with valid matching tiles
- Swap prompt appears at correct times
- Animation and state updates work correctly

---

### 6. Wall Tile Randomness

**Issue**: Wall tiles may not be sufficiently random
**Impact**: Game integrity
**Complexity**: Medium
**Priority**: P0 (Critical)

**Requirements**:

- Verify wall shuffling algorithm in GameController
- Ensure tiles are properly randomized at game start
- Test randomness distribution over multiple games
- Consider using crypto.getRandomValues() for better randomness

**Files to check**:

- [core/GameController.js](core/GameController.js) - Wall creation/shuffling

**Testing approach**:

```javascript
// Statistical test for randomness
function testWallRandomness(iterations = 1000) {
  const tilePositions = {};
  for (let i = 0; i < iterations; i++) {
    const wall = createAndShuffleWall();
    wall.forEach((tile, index) => {
      const key = `${tile.suit}-${tile.rank}`;
      tilePositions[key] = tilePositions[key] || [];
      tilePositions[key].push(index);
    });
  }
  // Analyze distribution - should be roughly uniform
  return analyzeDistribution(tilePositions);
}
```

**Testing**:

- Run statistical tests on wall randomness
- Play multiple games and verify tile distribution feels random
- No patterns in tile draws

---

### 7. Validate Tile Drawing Behavior

**Issue**: Incoming tile doesn't seem to change between rounds
**Impact**: Game integrity, potential bug
**Complexity**: Medium
**Priority**: P0 (Critical)

**Requirements**:

- Debug tile drawing logic in GameController
- Verify wall is properly managed (tiles removed after draw)
- Check tile index tracking and assignment
- Ensure drawn tile is actually from wall, not cached

**Files to check**:

- [core/GameController.js](core/GameController.js) - drawTile() and pickTileFromWall()
- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - onTileDrawn() event handling

**Debug approach**:

```javascript
// In GameController.drawTile()
console.log("Drawing tile from wall:", {
  wallLength: this.wallTiles.length,
  tileIndex: this.wallTiles[0].index,
  tileSuit: this.wallTiles[0].suit,
  tileRank: this.wallTiles[0].rank,
});
```

**Testing**:

- Log every tile drawn over multiple rounds
- Verify tiles are unique and from wall
- Check wall length decreases after each draw

---

## Implementation Priorities

### Priority Levels

- **P0 (Critical)**: Game-breaking or critical UX issues
- **P1 (High)**: Important UX improvements, missing features
- **P2 (Medium)**: Polish and visual improvements
- **P3 (Low)**: Nice-to-have enhancements

### Phase 1: Critical Fixes (P0)

**Estimated effort**: 2-3 days

1. **Wind Assignment Logic** (1A) - Fix game state representation
2. **Tile Selection Behavior** (2B) - Core touch interaction
3. **Wall Tile Randomness** (6) - Game integrity
4. **Validate Tile Drawing** (7) - Bug fix

**Success criteria**:

- Winds assigned correctly
- Touch selection works reliably
- Wall tiles are provably random
- Tile drawing verified working

---

### Phase 2: High Priority UX (P1)

**Estimated effort**: 3-4 days

1. **Opponent Bar Fixes** (1B, 1D) - Remove undefined messages, sort correctly
2. **Button Text Updates** (2A, 3B) - "Start" button consistency
3. **Layout Organization** (1A, 1B) - Proper screen layout, centering
4. **Hints Panel Compacting** (1C) - Max 2 rows
5. **Discard Pile Sizing & Scroll** (1D, 1E) - 9 tiles wide, auto-scroll
6. **Repurpose Start Button** (1G) - Becomes "Discard" button
7. **Remove Auto-Discard** (1H) - Feature removal
8. **Blank Tile Swap** (4) - Implement feature
9. **Joker Swap** (5) - Implement feature

**Success criteria**:

- Opponent bars display correctly
- Layout is organized and centered
- Hints panel is compact
- Discard pile is usable
- Blank and joker swaps work

---

### Phase 3: Visual Polish (P2)

**Estimated effort**: 2-3 days

1. **Typography** (0) - Match desktop fonts
2. **Opponent Bar Styling** (1C) - Remove box styling
3. **Button Styling** (3D) - Rounded corners, desktop colors
4. **Settings Icon** (3C) - Icon instead of button
5. **Hide Pre-Game Elements** (2C, 3A) - Hide hints and sort
6. **Scattered Tile Animation** (2B) - Home page animation
7. **Player Rack** (2D) - Empty rack pre-game
8. **Discard Recommendations** (2A) - Red pulsing glow
9. **Discard Animation** (2C) - Hand to pile animation
10. **Newly Drawn Tile Glow** (2D) - Blue glow
11. **Discard Pile Enhancements** (3A, 3B) - Auto-sort, latest tile treatment
12. **Remove Duplicate Messages** (1F) - Status message cleanup

**Success criteria**:

- Visual consistency with desktop
- Animations are smooth
- UI feels polished

---

### Phase 4: Future Enhancements (P3)

**Not currently scoped**

- Haptic feedback on tile selection
- Sound effects for tile actions
- Accessibility improvements (screen reader support)
- Undo last discard (training mode only)
- Game replay feature
- Advanced AI difficulty settings

---

## Technical Details

### Key Files Reference

**Core Game Logic**:

- [core/GameController.js](core/GameController.js) - Game state machine, wind assignment, tile drawing
- [core/AIEngine.js](core/AIEngine.js) - AI decisions, tile recommendations

**Mobile Rendering**:

- [mobile/MobileRenderer.js](mobile/MobileRenderer.js) - Event routing, UI prompts
- [mobile/renderers/HandRenderer.js](mobile/renderers/HandRenderer.js) - Hand tile rendering, selection
- [mobile/components/OpponentBar.js](mobile/components/OpponentBar.js) - Opponent display
- [mobile/components/DiscardPile.js](mobile/components/DiscardPile.js) - Discard pile rendering
- [mobile/components/HintsPanel.js](mobile/components/HintsPanel.js) - Hints display

**Animations**:

- [mobile/animations/AnimationController.js](mobile/animations/AnimationController.js) - Animation orchestration
- [mobile/styles/animations.css](mobile/styles/animations.css) - CSS animations

**Touch Handling**:

- [mobile/gestures/TouchHandler.js](mobile/gestures/TouchHandler.js) - Touch and swipe detection

**Styling**:

- [mobile/styles/base.css](mobile/styles/base.css) - Base styles, typography
- [mobile/styles/MobileGame.css](mobile/styles/MobileGame.css) - Layout, buttons, general styling
- [mobile/styles/HandRenderer.css](mobile/styles/HandRenderer.css) - Hand-specific styling
- [mobile/styles/OpponentBar.css](mobile/styles/OpponentBar.css) - Opponent bar styling

---

### Testing Strategy

**Unit Tests** (via Playwright):

- Test GameController wind assignment
- Test tile shuffling randomness
- Test discard pile sorting
- Test joker/blank swap logic

**Integration Tests**:

- Full game flow from start to mahjong
- Charleston phase tile selection
- Discard claim interactions
- Exposure creation

**Visual Regression Tests**:

- Screenshot comparisons for UI changes
- Layout consistency across devices

**Manual Testing Checklist**:

- [ ] Play full game on mobile device
- [ ] Test all touch gestures (tap, swipe, long-press)
- [ ] Verify animations are smooth (60fps)
- [ ] Check layout on various screen sizes (320px - 768px)
- [ ] Test in landscape orientation
- [ ] Verify accessibility (color contrast, touch targets)

---

### Performance Considerations

1. **Animation Performance**:
   - Use CSS transforms (GPU-accelerated)
   - Avoid layout thrashing (batch DOM reads/writes)
   - Use `requestAnimationFrame` for JS animations
   - Limit concurrent animations

2. **DOM Optimization**:
   - Minimize DOM manipulations
   - Use document fragments for batch inserts
   - Clean up removed elements promptly
   - Use event delegation for tile click handlers

3. **Memory Management**:
   - Remove event listeners on cleanup
   - Clear animation references
   - Destroy unused components

4. **Mobile-Specific**:
   - Minimize paint area (use `will-change` sparingly)
   - Optimize touch event handlers (passive listeners)
   - Test on lower-end devices (throttle CPU in DevTools)

---

### Accessibility Checklist

- [ ] All buttons have minimum 44x44px touch targets
- [ ] Color contrast ratios meet WCAG AA standards (4.5:1 for text)
- [ ] Meaningful alt text for tile images
- [ ] ARIA labels for icon buttons
- [ ] Keyboard navigation support (future)
- [ ] Screen reader announcements for game state changes (future)
- [ ] Focus indicators visible and clear

---

## Conclusion

This implementation plan provides a structured approach to addressing all user testing feedback. By organizing tasks into priority phases, we can deliver the most critical fixes first while maintaining a clear roadmap for polish and enhancements.

**Next steps**:

1. Review and approve this plan
2. Begin Phase 1 (Critical Fixes)
3. Test and iterate on each phase
4. Gather additional user feedback after Phase 2

**Questions for review**:

- Are priority levels correctly assigned?
- Any missing requirements?
- Suggested adjustments to scope or timeline?
