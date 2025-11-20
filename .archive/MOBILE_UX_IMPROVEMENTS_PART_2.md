# Mobile UX Improvements - Part 2 - Implementation Plan

**Created**: 2025-11-19
**Status**: Not Started
**Branch**: mobile-ux-improvements-part2

This document outlines the second phase of implementation for mobile UX improvements, based on remaining notes and feedback. This plan should be executed after the items in `MOBILE_UX_IMPROVEMENTS.md` are completed.

---

## Table of Contents

1. [Pre-Game Improvements](#pre-game-improvements)
2. [Gameplay Improvements](#gameplay-improvements)
3. [Missing Features & Bugs](#missing-features--bugs)
4. [Implementation Priorities](#implementation-priorities)

---

## Pre-Game Improvements

### 1. Opponent Bar

#### 1B. Remove "Undefined Tiles" Message
**Issue**: Opponent bars show tile count. This is a legacy issue that needs to be removed.
**Impact**: Poor UX, useless message.
**Complexity**: Low
**Priority**: P1 (High)
**Requirements**:
- The message "13 Tiles" must not be visible.
- No replacement message is necessary or desired.
**Files to modify**:
- `mobile/components/OpponentBar.js`
**Testing**:
- Verify no messages appear at any stage of the game.

#### 1C. Make Opponent Bar a Solid Bar
**Issue**: A box is visible within the opponent bar, making it look like two separate components.
**Impact**: Visual polish.
**Complexity**: Low
**Priority**: P2 (Medium)
**Requirements**:
- Remove or hide the inner box styling to make each opponent bar a single, solid, continuous element. See mobile/mockup.html and mobile/mockup.css for an example.
**Files to modify**:
- `mobile/styles/OpponentBar.css`
**Testing**:
- Visual inspection to confirm the bar is one continuous element.

---

### 2. Game Board

#### 2A. Update "Start" Message
**Issue**: The pre-game message is just "Ready to play! Click Start to begin.".
**Impact**: Lack of clarity for the user.
**Complexity**: Low
**Priority**: P1 (High)
**Requirements**:
- The message displayed on the game board before the game starts should be "Check Settings and click Start when ready."
**Files to modify**:
- `mobile/MobileRenderer.js`
**Testing**:
- Verify the new message is displayed when the page loads.

#### 2B. Add Scattered Tile Deck on Home Page
**Issue**: The mobile home page is static and lacks the engaging feel of the desktop version.
**Impact**: Visual appeal, game feel.
**Complexity**: High
**Priority**: P2 (Medium)
**Requirements**:
- Display a scattered deck of smaller tiles (32px wide)
- When the game starts, these tiles should animate similarly to the desktop version (jump/flip to back, fly off the top-left of the game board).
**New files to create**:
- `mobile/components/HomePageTiles.js`
- `mobile/animations/HomePageAnimation.js`
**Files to modify**:
- `mobile/MobileRenderer.js`
- `mobile/index.html`
- `mobile/styles/animations.css`
**Testing**:
- Animation is smooth on mobile devices.
- Tiles are removed from the DOM after the animation.

#### 2C. Hide Hints Panel Pre-Game
**Issue**: The hints panel is visible but collapsed before the game starts.
**Impact**: UI clutter.
**Complexity**: Low
**Priority**: P2 (Medium)
**Requirements**:
- The hints panel should be completely invisible (`display: none`) before the game begins.
- It should only become visible during active gameplay.
**Files to modify**:
- `mobile/components/HintsPanel.js`
- `mobile/MobileRenderer.js`
**Testing**:
- Verify the hints panel is not in the DOM or is hidden before the game starts.
- Verify it appears when the game starts.

#### 2D. Add Empty Player Tile Rack
**Issue**: There is no designated visual space for the player's hand before the game starts.
**Impact**: Visual consistency, game feel.
**Complexity**: Medium
**Priority**: P2 (Medium)
**Requirements**:
- Add an empty tile rack for the player (Player 0).
- It should be a panel similar in style to the opponent bars, but larger.
- It needs space for two rows of 7 normal-sized tiles (42px wide) and a third row for smaller exposed tiles (32px wide).
- The rack should be positioned between the hints panel and the discard pile area.
**New component needed**:
- `mobile/components/PlayerRack.js`
**Files to modify**:
- `mobile/index.html`
- `mobile/MobileRenderer.js`
- `mobile/styles/MobileGame.css`
**Testing**:
- The rack is correctly sized and positioned.
- It correctly contains the player's tiles when the game starts.

---

### 3. Bottom Menu

#### 3C. Make Settings a Clickable Icon
**Issue**: The settings control is a full button, which takes up unnecessary space.
**Impact**: UI polish, space efficiency.
**Complexity**: Low
**Priority**: P2 (Medium)
**Requirements**:
- The settings button should be converted to a larger, clickable icon.
- Remove the button background and border.
- Ensure the clickable area is large enough for mobile accessibility (e.g., 44x44px).
**Files to modify**:
- `mobile/index.html`
- `mobile/styles/MobileGame.css`
**Testing**:
- The settings icon is larger and easy to tap.
- It opens the settings menu correctly.

#### 3D. Update Button Styling
**Issue**: The menu buttons are squared-off and don't match the desktop theme.
**Impact**: Visual consistency.
**Complexity**: Low
**Priority**: P2 (Medium)
**Requirements**:
- Buttons should have rounded corners or be oval-shaped.
- Button color should be yellow with dark green text, matching the desktop side panel.
**Files to modify**:
- `mobile/styles/MobileGame.css`
**Testing**:
- Visual inspection to confirm buttons match the new style.

---

## Gameplay Improvements

### 1. Layout

#### 1B. Center Player Rack and Hand
**Issue**: The player's hand appears off-center, too far to the right.
**Impact**: Visual balance.
**Complexity**: Low
**Priority**: P1 (High)
**Requirements**:
- The player's tile rack and the hand of tiles within it should be horizontally centered on the screen.
**Files to modify**:
- `mobile/styles/HandRenderer.css`
- `mobile/styles/MobileGame.css`
**Testing**:
- The player's hand is centered on various screen sizes.

#### 1D. Adjust Discard Pile Tile Size
**Issue**: Discarded tiles are too large and overlap, making them hard to see.
**Impact**: Usability, visual clarity.
**Complexity**: Medium
**Priority**: P1 (High)
**Requirements**:
- Reduce the size of tiles in the discard pile to as small as they can go and still be legible (12px wide?).
- The pile should comfortably fit 9+ tiles wide with adequate padding.
- All tiles in the pile should be fully visible without overlapping.
**Files to modify**:
- `mobile/components/DiscardPile.js`
- `mobile/styles/MobileGame.css`
**Testing**:
- 9 tiles fit horizontally in the discard pile area.
- Tiles have padding and do not overlap.

---

### 2. Hand

#### 2A. Add Discard Recommendation Glow
**Issue**: There is no visual indicator for which tiles the AI recommends for discarding.
**Impact**: User guidance.
**Complexity**: Medium
**Priority**: P2 (Medium)
**Requirements**:
- Tiles recommended for discard should have a red, pulsing glow effect. See sample below - just change color from yellow to red.
```css
.discard-tile.latest {
    border: 3px solid #ffeb3b;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 235, 59, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(255, 235, 59, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 235, 59, 0); }
}
```
**Files to modify**:
- `mobile/renderers/HandRenderer.js`
- `mobile/styles/animations.css`
**Testing**:
- The correct tiles have a pulsing red glow.
- The glow is removed when the recommendation changes or the tile is discarded.

#### 2B. Enhance Tile Interaction
**Issue**: Tile interaction is basic. Tapping selects, but there are no advanced gestures.
**Impact**: Intuitive touch controls.
**Complexity**: Medium
**Priority**: P0 (Critical)
**Requirements**:
- Tapping a tile should "select" it by raising it up by at least 1/3 of a tile height. A yellow glow is not needed.
- Tapping a selected tile again should deselect it, returning it to its original position.
- Swiping up on a tile should discard it immediately, without needing to press the "Discard" button.
**Files to modify**:
- `mobile/renderers/HandRenderer.js`
- `mobile/gestures/TouchHandler.js`
- `mobile/styles/HandRenderer.css`
**Testing**:
- Tap raises and lowers tiles correctly.
- Swipe-up gesture is responsive and correctly discards the tile.

#### 2C. Animate Discard
**Issue**: When a tile is discarded, the animation is not smooth.
**Impact**: Game feel, visual feedback.
**Complexity**: Medium
**Priority**: P2 (Medium)
**Requirements**:
- A discarded tile should animate smoothly from its position in the hand to its new position in the discard pile, receiving the pulsing blue glow along the way.
**Files to modify**:
- `mobile/animations/AnimationController.js`
- `mobile/MobileRenderer.js`
**Testing**:
- The animation is smooth and visually correct.

#### 2D. Add New Tile Glow
**Issue**: There is no visual indicator for a newly drawn tile.
**Impact**: Visual feedback.
**Complexity**: Low
**Priority**: P2 (Medium)
**Requirements**:
- A newly drawn tile should get a blue, pulsing glow.
- The pulsing glow should remain until the next major event (e.g., a discard).
**Files to modify**:
- `mobile/renderers/HandRenderer.js`
- `mobile/styles/animations.css`
**Testing**:
- The newly drawn tile has a pulsing blue glow.
- The glow is removed after the player discards.

---

### 3. Discard Pile

#### 3A. Enhance Latest Discard
**Issue**: The newly discarded tile is not highlighted in the discard pile.
**Impact**: Visual feedback, usability.
**Complexity**: Medium
**Priority**: P2 (Medium)
**Requirements**:
- The discard pile should be automatically sorted each time a tile is added.
- The most recently discarded tile should have a pulsing blue glow.
- The latest tile should be slightly larger than the others.
- If the discard pile scrolls, it should auto-scroll to keep the latest tile in view.
- When the next tile is discarded, the previous one reverts to its normal size and loses its glow.
**Files to modify**:
- `mobile/components/DiscardPile.js`
- `mobile/styles/animations.css`
**Testing**:
- Discard pile auto-sorts correctly.
- The latest tile is larger, glows, and is always visible.
- The effect is correctly transferred to the next discarded tile.

---

## Missing Features & Bugs

### 4. Blank Swap Functionality
**Issue**: The functionality to swap a blank tile (if you have one) is missing.
**Impact**: Core game feature missing.
**Complexity**: High
**Priority**: P1 (High)
**Requirements**:
- Implement the game logic and UI to allow a player to swap a blank tile for an exposed tile.
**Files to create/modify**:
- `core/GameController.js`
- `mobile/MobileRenderer.js`
- `mobile/animations/AnimationController.js`
**Testing**:
- Player can successfully swap a blank tile for any valid exposed tile.

### 5. Joker Swap Functionality
**Issue**: The functionality to swap a joker from an exposure is missing.
**Impact**: Core game feature missing.
**Complexity**: High
**Priority**: P1 (High)
**Requirements**:
- Implement the game logic and UI to allow a player to swap a tile from their hand for a joker in an opponent's exposure.
**Files to create/modify**:
- `core/GameController.js`
- `mobile/MobileRenderer.js`
- `mobile/animations/AnimationController.js`
**Testing**:
- Player can successfully swap a matching tile for an exposed joker.

### 6. Verify Wall Tile Randomness
**Issue**: There is a concern that the wall tiles are not being shuffled with sufficient randomness.
**Impact**: Game integrity.
**Complexity**: Medium
**Priority**: P0 (Critical)
**Requirements**:
- Analyze the wall shuffling algorithm.
- Ensure the shuffle is cryptographically random or as close as possible.
- Implement statistical tests to verify randomness.
**Files to check**:
- `core/GameController.js`
**Testing**:
- Run statistical analysis over many simulated games to ensure a uniform distribution of tiles.

---

## Implementation Priorities

### Priority Levels

- **P0 (Critical)**: Game-breaking bugs or essential UX features.
- **P1 (High)**: Important features and high-impact UX improvements.
- **P2 (Medium)**: Visual polish and "game feel" enhancements.

### Phase 1: Critical Fixes (P0)
1.  **Enhance Tile Interaction** (Gameplay 2B)
2.  **Verify Wall Tile Randomness** (Missing Features 6)

### Phase 2: High Priority Features & UX (P1)
1.  **Remove "Undefined Tiles" Message** (Pre-Game 1B)
2.  **Update "Start" Message** (Pre-Game 2A)
3.  **Center Player Rack and Hand** (Gameplay 1B)
4.  **Adjust Discard Pile Tile Size** (Gameplay 1D)
5.  **Blank Swap Functionality** (Missing Features 4)
6.  **Joker Swap Functionality** (Missing Features 5)

### Phase 3: Visual Polish (P2)
1.  **Make Opponent Bar a Solid Bar** (Pre-Game 1C)
2.  **Add Scattered Tile Deck on Home Page** (Pre-Game 2B)
3.  **Hide Hints Panel Pre-Game** (Pre-Game 2C)
4.  **Add Empty Player Tile Rack** (Pre-Game 2D)
5.  **Make Settings a Clickable Icon** (Pre-Game 3C)
6.  **Update Button Styling** (Pre-Game 3D)
7.  **Add Discard Recommendation Glow** (Gameplay 2A)
8.  **Animate Discard** (Gameplay 2C)
9.  **Add New Tile Glow** (Gameplay 2D)
10. **Enhance Latest Discard** (Gameplay 3A)
