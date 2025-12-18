### Animation Sequence: Tile Discard

**Summary:** This sequence defines the animation and visual state changes when a player discards a tile, including how the tile is highlighted as the "focus tile" and how it behaves if it is subsequently claimed.

**Triggering Event:** `playerDidDiscardTile`
**Initial State:** A player has a tile in the "selected" state (raised from the hand), as described in `Description_Animation_Select.md`.

---

### Core Rule: The "Focus Tile"

The most recently discarded tile is always considered the "Focus Tile." Only one tile can be in this state at a time. The Focus Tile is always rendered with a **blue glow effect**. This state persists until the _next_ tile is discarded, at which point the glow is transferred to the new tile.

---

#### **Scenario 1: Standard Discard**

1.  **Animation:** The discarded tile animates from its raised "selected" position to its correct position in the central discard pile. Upon arrival, `tile_dropping.mp3` is played.
2.  **Visual State:**
    - **Effect:** The tile gains the blue glow, becoming the new "Focus Tile."
    - **Size:** It remains at its full, original size (scale: 1.0).
3.  **Previous Tile:** The previously discarded tile (which was the old "Focus Tile") simultaneously loses its blue glow and shrinks to the standard small size for the discard pile.
4.  **Player Hand:** The tiles remaining the in player rack should reassemble to close the gap left by the discarded tile.

_Note: If a claim dialog opens for the Focus Tile, its glowing, full-size state is maintained throughout._

---

#### **Scenario 2: Focus Tile is Claimed**

If a player claims the current Focus Tile from the discard pile:

**Case 2a: Claimed by Player 0 (Local Player)**

1.  **Animation:** The glowing tile animates from the discard pile to Player 0's exposed meld area. Upon arrival, `rack_tile.mp3` is played.
2.  **Visual State:**
    - The claimed tile **maintains its blue glow and full size** in the exposed meld.
    - Accompanying tiles from the player's hand that form the meld are placed next to it _without_ a glow.
    - Remaining tiles in the hand reassemble to close any gaps left by moving the tiles to the exposed area.
3.  **Losing Focus:** The claimed tile's blue glow is removed as soon as the _next_ tile is discarded by any player.

**Case 2b: Claimed by another Player (Remote Player)**

1.  **Animation:** The glowing tile animates from the discard pile to the remote player's exposed meld area. Upon arrival, `rack_tile.mp3` is played.
2.  **Visual State:**
    - The claimed tile **maintains its blue glow**.
    - The tile **shrinks** to the appropriate smaller size for a remote player's exposed meld.
3.  **Losing Focus:** The claimed tile's blue glow is removed as soon as the _next_ tile is discarded by any player.
