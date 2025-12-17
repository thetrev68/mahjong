**Animation:** Joker Swap

**Game State:**
A joker exists in an exposed meld on the game board (belonging to any player). The current player possesses the actual tile that the joker is representing within that meld.

**Event:**
The player initiates a swap by selecting the matching tile from their hand and then selecting the joker in the exposed meld.

**Animation Flow:**

1. **Player's Tile to Meld:**
    * The player's tile animates from their hand to replace the joker in the exposed meld.
    * Upon arrival in the meld, `rack_tile.mp3` is played, and the tile is highlighted with a blue glow.
    * This blue glow persists through subsequent actions and only disappears after the current player makes a discard.

2. **Joker to Player's Hand:**
    * Simultaneously, the joker animates from the exposed meld to the player's hand (hidden rack).
    * Upon arrival in the hand, `rack_tile.mp3` is played.
    * The joker does *not* receive a blue glow during this process.
