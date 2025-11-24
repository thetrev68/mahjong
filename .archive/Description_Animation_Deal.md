### Animation Sequence: Dealing Tiles

**Summary:** This sequence animates the dealing of tiles from the wall to four players at the start of a new round. The animation involves tiles flying from off-screen to each player's rack, accompanied by sound effects.

**Triggering Event:** `dealNewHand`
**Initial State:** A new round has begun, the tile wall is formed, and players are in position.

---

#### **Animation & SFX Flow**

The dealing process occurs in three distinct phases, executed sequentially.

**Phase 1: Main Deal (Chunks of 4)**
*This phase repeats three times.*
1.  **Player 0 (East):**
    *   **Visual:** Four tiles fly from the top-left of the screen to Player 0's rack. The tiles are **face down**. They arrive with a slight stagger, not all at once.
    *   **SFX:** `rack_tile.mp3` plays for *each* tile as it lands in the rack, creating four distinct sounds.
2.  **Player 1 (South):** The sequence above is repeated for Player 1.
3.  **Player 2 (West):** The sequence is repeated for Player 2.
4.  **Player 3 (North):** The sequence is repeated for Player 3.
*After three full rotations, each player has 12 tiles.*

**Phase 2: Single Tile Draw**
*This phase occurs once.*
1.  One tile is dealt to Player 0, then Player 1, then Player 2, and finally Player 3.
2.  Each deal follows the same animation and SFX logic as in Phase 1 (a single tile flies in and makes a sound upon landing).
*At the end of this phase, each player has 13 tiles.*

**Phase 3: Final Dealer Tile**
1.  One final tile is dealt to **Player 0**.
*Player 0 now has 14 tiles.*

---

#### **Finalization Step**

1.  **Reveal Tiles:** All 14 of Player 0's tiles are flipped **face up**.
2.  **Sort Hand:** A sorting algorithm is run on Player 0's hand to arrange the tiles by suit and rank. This change should be visually reflected in the rack.

---

#### **Final State**

*   **Tile Distribution:**
    *   **Player 0:** 14 tiles, face up, and sorted.
    *   **Players 1, 2, 3:** 13 tiles each, face down.
*   **Game State:** The game is now waiting for Player 0 to make the first discard.

---

## Mobile Version Considerations

**Status:** Not yet implemented. Mobile currently shows tiles instantly (no animation).

**Key Architectural Challenges Identified:**

1. **HandRenderer Lifecycle Conflict**
   - Desktop uses Phaser sprites that persist and can be positioned independently
   - Mobile uses HTML/CSS with `HandRenderer.render()` that calls `clearTiles()` before re-rendering
   - This clear-then-render pattern conflicts with incremental tile-by-tile animation

2. **Opponent Display Constraints**
   - Mobile opponent bars don't have space to show 14 tiles
   - Solution: Show 4 tiles temporarily, fade out before next 4 arrive
   - Requires temporary tile elements that don't interfere with main hand rendering

3. **Event Flow Issues**
   - `TILES_DEALT` event triggers animation
   - Must emit `DEALING_COMPLETE` when done
   - GameController then emits `HAND_UPDATED` which can trigger re-renders
   - Need flag to prevent `HAND_UPDATED` from clearing animated tiles mid-sequence

**Recommended Approach for Future Implementation:**

1. **Option A: Separate Animation Layer**
   - Create overlay container for dealing animation only
   - Animate tiles in overlay, independent of HandRenderer
   - When complete, hide overlay and show final hand instantly
   - Pro: No conflict with HandRenderer lifecycle
   - Con: Requires creating duplicate tile visuals temporarily

2. **Option B: Refactor HandRenderer**
   - Add "append-only" mode that doesn't clear tiles
   - Track which tiles are "real" vs "animating"
   - Switch to normal mode after dealing completes
   - Pro: Single source of truth for tiles
   - Con: Significant refactor of core rendering logic

3. **Option C: Simplified Animation**
   - Skip incremental tile-by-tile animation
   - Animate entire hand appearing at once with a "dealing" effect
   - Much simpler to implement, still provides visual feedback
   - Pro: Minimal code changes, low risk
   - Con: Less authentic to real mahjong dealing

**Reference Implementation:**
- Desktop version: [desktop/adapters/PhaserAdapter.js:262-386](desktop/adapters/PhaserAdapter.js#L262-L386)
- Key difference: Phaser sprites don't auto-clear like HTML elements do
