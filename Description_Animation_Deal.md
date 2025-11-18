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
