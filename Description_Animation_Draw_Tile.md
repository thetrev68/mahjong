### Animation Sequence: Receiving a Tile

**Summary:** This sequence defines the animation and visual state changes when a player receives one or more tiles, either from the wall during gameplay or from an opponent during the Charleston.

**Triggering Events:**

* `playerDidDrawTileFromWall`
* `playerDidReceiveCharlestonTiles`

---

### Core Rule: Highlight on Receipt

Newly received tiles are always highlighted with a **blue glow effect** to draw the player's attention to them. This glow persists until the next significant game action occurs (e.g., the player discards a tile, passes tiles during the Charleston).

---

#### **Scenario 1: Drawing a Tile from the Wall**

This occurs during a player's turn in standard gameplay.

1. **Animation:** A single tile animates from the wall's source position (top left of the screen, consistent with the deal animation) to the player's hand.
2. **Sound:** As the tile arrives and is placed in the rack, `rack_tile.mp3` is played.
3. **Visual State:**
    * The newly received tile is immediately rendered with the blue glow.
    * The player's hand is re-sorted to integrate the new tile into its correct position based on suit and rank.

---

#### **Scenario 2: Receiving Tiles during the Charleston**

This occurs when tiles are passed from another player.

1. **Animation:**
    * One to three tiles animate from the source (the opponent who passed them) to the player's hand.
    * The tiles arrive with a slight stagger, not all at the same instant, to create a more natural effect.
2. **Sound:** `rack_tile.mp3` is played for *each* tile as it arrives in the rack.
3. **Visual State:**
    * All received tiles are rendered with the blue glow.
    * The player's hand is re-sorted to integrate the new tiles.
    * The glow on all received tiles persists until the player selects tiles for the next pass and confirms the action.
