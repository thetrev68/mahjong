# Game Board Redesign Plan

## 1. Goals

The primary goals of this redesign are to:

- **Modernize the UI/UX:** Create a cleaner, more visually appealing, and modern interface.
- **Improve Usability:** Make the game more intuitive and easier to play, especially for new players.
- **Enhance Information Clarity:** Ensure that all necessary game information is presented clearly and is easily accessible.
- **Responsive Design:** Improve the game's layout on different screen sizes (though desktop remains the primary target).

## 2. Proposed Layout Changes

### 2.1. Main Game Board

- **Player Hand:** The player's hand will remain at the bottom of the screen, but with improved tile graphics and spacing.
- **Discard Area:** A centralized discard area in the middle of the table. Discards will be arranged in a grid for easy viewing of discard history.
- **Opponent Areas:** Opponent hands will be displayed on the top, left, and right sides of the board. Their exposed tiles will be clearly separated from their hidden tiles.
- **Wall:** The wall will be visually represented around the discard area, with a clear indicator of the current draw position.
- **Information Panel:** A dedicated, non-intrusive panel at the top or side of the screen to display:
  - Current Player (East, South, West, North)
  - Round and Dealer information
  - Remaining tiles in the wall
  - Score

### 2.2. Player Hand

- **Tile Grouping:** Tiles in the player's hand will be automatically grouped by suit and sorted by rank.
- **Joker Highlighting:** Jokers will have a distinct visual treatment to make them stand out.
- **Suggested Sets:** The UI could subtly hint at potential melds (pungs, kongs, chows) to help players.

## 3. Visual and Thematic Overhaul

- **Color Palette:** A new, more cohesive color palette will be introduced. We should aim for something that is easy on the eyes for long play sessions.
- **Background:** Replace the current solid color background with a textured image of a mahjong table.
- **Tile Assets:**
  - Source or create new, high-resolution tile sprites. The current ones are functional but could be more aesthetically pleasing.
  - Exposed melds should have a slightly different visual treatment to distinguish them from hidden tiles.
- **Animations:**
  - Smooth animations for tile draws, discards, and melds.
  - A subtle "glow" or highlight to indicate the current player's turn.
  - Winning animation/celebration.

## 4. Interactivity Enhancements

- **Tile Selection:**
  - Click-to-select a tile for discard. A second click or a click on a "Discard" button will confirm the action.
  - This prevents accidental discards.
- **Meld Declaration:** When a player can make a meld (pung, kong, etc.), a clear visual prompt will appear with buttons to "Claim" or "Pass".
- **Drag and Drop:** As an alternative to clicking, allow players to drag and drop tiles to the discard area.
- **Joker Exchange:** A more intuitive UI for exchanging jokers. When a player has a tile that can replace an exposed joker, the UI should make this clear and provide a simple way to perform the swap.

## 5. Implementation Plan

This is a high-level breakdown of the tasks involved:

1.  **Asset Sourcing/Creation:**
    - Find or create new sprites for the tiles.
    - Find or create a new background image.
    - Design icons for buttons (Claim, Pass, etc.).

2.  **Layout Rework (`GameScene.js`, `gameObjects_table.js`):**
    - Update `gameObjects_table.js` to position players, discard piles, and the wall according to the new layout.
    - Modify `GameScene.js` to handle the new layout and information panel.

3.  **Player Hand Refactor (`gameObjects_hand.js`):**
    - Implement the new visual style for the player's hand.
    - Add logic for sorting and grouping tiles.

4.  **UI Components (`GameScene.js`):**
    - Create the new information panel.
    - Implement the new meld declaration prompts.
    - Create the new "Exchange Joker" UI.

5.  **Styling (`styles.css`):**
    - Update the CSS to match the new color palette and visual theme.

6.  **Animations (`GameScene.js`):**
    - Use Phaser's animation system to add tweens for tile movements.
