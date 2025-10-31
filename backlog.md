# Feature Backlog & Analysis

This document provides a high-level analysis of potential new features for the American Mahjong game. Each feature is evaluated on:

*   **Difficulty:** Technical complexity of implementation.
*   **Effort:** Amount of work required.
*   **Time:** Estimated development time.
*   **Benefit:** Impact on the user experience.

---

### 1. Extract Hint from Game Log

*   **Description:** Move the hint information from the game log to a dedicated, always-visible panel.
*   **Difficulty:** Low
*   **Effort:** Low
*   **Time:** 2-4 hours
*   **Benefit:** High. Improves hint visibility and usability, making it a core part of the gameplay experience.

### 2. Enable AI Difficulty Scaling

*   **Description:** Implement difficulty scaling for bot players. The user would always play as an "Advanced AI."
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 8-12 hours
*   **Benefit:** High. Adds replayability and allows users to adjust the game's challenge to their skill level.

### 3. Create a Settings Page ✅ DONE

*   **Description:** Create a new settings page to house various game options.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 6-10 hours
*   **Benefit:** High. Centralizes game options, improving organization and making it easier to add new settings in the future.
*   **Status:** Framework implemented with modal overlay, placeholder sections for future features (AI difficulty, training mode relocation, year selection, audio controls, house rules), localStorage persistence, and responsive design.

### 4. Move Training Mode to Settings

*   **Description:** Relocate the "Training Mode" panel to the new settings page.
*   **Difficulty:** Low
*   **Effort:** Low
*   **Time:** 1-2 hours
*   **Benefit:** Medium. Improves UI consistency by grouping all settings in one place.

### 5. Year Selection Workflow

*   **Description:** Add a workflow to the settings page for selecting different card data files by year.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 8-12 hours
*   **Benefit:** High. A crucial feature for Mahjong, as cards change annually.

### 6. Game Audio

*   **Description:** Add background music and sound effects with controls in the settings page.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 10-15 hours (includes sound asset sourcing/creation)
*   **Benefit:** Medium. Enhances the game's atmosphere and provides auditory feedback.
*   **Source:** www.zapsplat.com - Multimedia button click 16 (tile click), Multimedia button click 21 (discard), Golf club set down or drop on grass 3 (error/invalid move), Applause approx 8 people (win celebration), Game music - soft warm synth arpeggios calming soothing game (? maybe. ambient music)

### 7. Colorize Hints Panel

*   **Description:** Add color-coding to the hints panel to notate tile patterns and highlight tiles that match the user's hand.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 6-10 hours
*   **Benefit:** High. Makes the hints panel much more intuitive and easy to read at a glance.

### 8. Name Players

*   **Description:** Allow users to name players instead of using the default "Player 0, 1, 2, 3."
*   **Difficulty:** Low
*   **Effort:** Low
*   **Time:** 3-5 hours
*   **Benefit:** Medium. Adds a nice touch of personalization to the game.

### 9. Maintain Alignment During Drag & Drop

*   **Description:** Ensure that hand tiles remain aligned during click-and-drag operations.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 5-8 hours
*   **Benefit:** Medium. A quality-of-life improvement that makes the UI feel more polished.

### 10. Animation for New Tiles

*   **Description:** Add a "glow" animation to newly drawn tiles and the AI's top discard recommendation.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 6-10 hours
*   **Benefit:** Medium. Provides a clear visual cue for important game events.

### 11. Fix Stripe Alignment [DONE]

*   **Description:** Correct the alignment of the "stripe thing" on the game canvas so that it aligns with all player hands.
*   **Difficulty:** Low
*   **Effort:** Low
*   **Time:** 2-4 hours
*   **Benefit:** Medium. A minor graphical fix that improves the game's overall visual polish.

### 12. 3D Tile Effect [DONE] - with compromise. Added rounded corners and spacing but kept 2D design.

*   **Description:** Add a 3D effect to the tiles with rounded corners and gradients to give them a more modern look.
*   **Difficulty:** High
*   **Effort:** High
*   **Time:** 15-25 hours
*   **Benefit:** Medium. A significant visual upgrade, but also a time-consuming one.

### 13. Pre-Game Screen with Random Tiles

*   **Description:** Change the pre-game screen to a blank canvas with a random pile of tiles.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 8-12 hours
*   **Benefit:** Medium. A nice aesthetic touch that makes the game feel more immersive from the start.

### 14. Wall Tiles Graphics

*   **Description:** Change the wall tiles from a central mass to actual walls and add a "curtsey" graphic as play continues.
*   **Difficulty:** High
*   **Effort:** High
*   **Time:** 20-30 hours
*   **Benefit:** High. A major visual and thematic improvement that would make the game feel much more like a real game of Mahjong.

### 15. House Rules Section

*   **Description:** Add a "House Rules" section to the settings page, starting with an option to "use blanks."
*   **Difficulty:** Low
*   **Effort:** Medium (depending on the number of rules)
*   **Time:** 5-10 hours
*   **Benefit:** High. Adds a great deal of flexibility and replayability to the game.

### 16. End Game Screen Animation

*   **Description:** Design a more elaborate end-game screen with animations and a summary for both wall games and Mahjongs.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 10-15 hours
*   **Benefit:** High. A polished end-game screen would make winning (or losing) feel more impactful.

---

### 17. Interactive Tutorial Mode
*   **Description:** A guided walkthrough for new players explaining the absolute basics of American Mahjong, such as setting up the wall, the Charleston, and identifying different tile suits.
*   **Difficulty:** High
*   **Effort:** High
*   **Time:** 20-30 hours
*   **Benefit:** High. Makes the game much more accessible to newcomers.

### 18. Player Statistics and History
*   **Description:** A screen where players can see their win/loss record, most common winning hands, average points per game, etc.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 10-15 hours
*   **Benefit:** Medium. Adds a sense of progression and accomplishment.

### 19. Undo Move Button
*   **Description:** The ability to take back a discard, perhaps limited to once per turn.
*   **Difficulty:** Medium
*   **Effort:** Medium
*   **Time:** 5-8 hours
*   **Benefit:** High. Reduces frustration from accidental clicks.

### 20. Custom Game Themes
*   **Description:** Allow players to change the appearance of the game, such as the tile designs, the color of the table felt, or the background.
*   **Difficulty:** High
*   **Effort:** High
*   **Time:** 20-30 hours (includes asset creation)
*   **Benefit:** Medium. Adds personalization and visual variety.
