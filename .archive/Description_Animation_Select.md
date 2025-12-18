### Animation Sequence: Tile Selection

**Summary:** This sequence describes the visual feedback when a player selects one or more tiles from their hand. This indicates the tile(s) are ready for an action, such as being discarded, passed during the Charleston, or used to form a meld.

**Triggering Event:** `playerDidSelectTile` (or a similar UI event on tile click)
**Initial State:** All tiles are in the player's hand at their default position (e.g., Y=600).

---

### Selection Logic

The number of tiles a player can select simultaneously is determined by the current game state.

- **Single Selection Mode (Default):** During normal play (e.g., choosing a tile to discard), only one tile can be selected at a time. If a player selects a new tile, the previously selected tile is automatically deselected and returns to its original position.
- **Multi-Selection Mode:** During specific phases, the player can select multiple tiles.
  - **Charleston:** The player can select up to 3 tiles.
  - **Claiming a Meld (Pung, Kong, Quint):** The player can select the required number of matching tiles from their hand (e.g., 2 for a Pung, 3 for a Kong).

### Animation Details

1.  **Selection:** When a tile is selected, it smoothly animates vertically upwards by a small amount to distinguish it from unselected tiles.
    - **Example:** The tile moves from its resting Y-coordinate (e.g., 600) to a raised Y-coordinate (e.g., 575).
    - This animation applies to each tile selected, whether in single or multi-selection mode.
2.  **Deselection:** If a player clicks a selected tile again, it is deselected and animates back to its original position in the hand.
3.  **State:** Selected tiles remain in this raised "selected" state until the player confirms the action (e.g., clicks the discard button, confirms the pass) or deselects them.
