# Complete Game Flow from Commit 07c41b9

## Overview

This documents the exact flow of a complete game in the last known working version, from start to end game.

---

## Architecture: Promise-Based with Button Handlers

The old system used a consistent pattern:

```javascript
return new Promise((resolve) => {
  // Remove old button listeners
  button.removeEventListener("click", this.oldFunction);

  // Create new handler that calls resolve when done
  this.buttonFunction = function () {
    // Do game logic
    resolve(result);
  }.bind(this);

  // Attach new handler
  button.addEventListener("click", this.buttonFunction);
});
```

**Key**: Game flow is event-driven via button clicks, not polling or callbacks.

---

## Complete Game Flow

### Phase 1: INITIALIZATION (STATE.INIT)

```javascript
GameLogic.init():
1. Load Card for the year
2. Initialize Card.init() (async)
3. Create GameAI with card + table + difficulty
4. Create HintAnimationManager
5. Populate handSelect dropdown
```

### Phase 2: START (STATE.START)

```javascript
GameLogic.start():
1. Set state = STATE.START
2. updateUI() - show buttons for this state
3. Switch table to PLAYER.BOTTOM (human)
4. Reset table (clear exposures, scores, etc.)
5. Clear hint glow effects
6. Play background music
7. Call deal()
```

### Phase 3: DEAL (STATE.DEAL)

```javascript
GameLogic.deal():
1. Set state = STATE.DEAL
2. updateUI() - update buttons
3. Check training mode:
   - If training: generate specific hand for player 0
   - If normal: deal will be automatic
4. Call sequentialDealTiles():
   - Animation: deal tiles one by one to all 4 players
   - 13 tiles per player: 4 rounds of 13 = 52 tiles dealt total
   - Player 0 deals first (gets tiles first), rotation: 0,1,2,3,0,1,2,3...
5. After dealing completes:
   - Update hints for player 0 (if hand > 0 tiles)
6. If training + skipCharleston: call loop() [SKIP TO MAIN GAME]
7. Otherwise: call charleston()
```

### Phase 4A: CHARLESTON1 (STATE.CHARLESTON1)

**Charleston has UP TO 3 passes** (can quit after 1st 3):

- Pass 1: RIGHT (player 1)
- Pass 2: ACROSS (player 2)
- Pass 3: LEFT (player 3)

**Then optional:**

- Pass 4: LEFT (reverse)
- Pass 5: ACROSS (reverse)
- Pass 6: RIGHT (reverse)

```javascript
async charleston():
1. Set state = STATE.CHARLESTON1
2. updateUI()

3. Call charlestonPass(PLAYER.RIGHT):  // Pass 1
   └─ Human selects 3 tiles to pass
   └─ AI players pass their 3 tiles (parallel)
   └─ Tiles exchanged between players
   └─ Update hints for player 0

4. Call charlestonPass(PLAYER.TOP):   // Pass 2
   └─ Same flow

5. Call charlestonPass(PLAYER.LEFT):  // Pass 3
   └─ Same flow

6. Set state = STATE.CHARLESTON_QUERY
7. updateUI()
8. Call yesNoQuery():
   └─ Human decides: continue to pass 2? (YES/NO)

9. Set state = STATE.CHARLESTON_QUERY_COMPLETE
10. updateUI()

11. If YES:
    └─ Set state = STATE.CHARLESTON2
    └─ updateUI()
    └─ Call charlestonPass(PLAYER.LEFT):  // Pass 4
    └─ Call charlestonPass(PLAYER.TOP):   // Pass 5
    └─ Call charlestonPass(PLAYER.RIGHT): // Pass 6
    └─ Update hints

12. Continue to courtesy phase...
```

### Phase 4B: CHARLESTON PASS DETAILS

```javascript
async charlestonPass(playerId):
1. Print: "Choose 3 tiles to pass [direction]"
2. Setup button1 ("Pass" button):
   - Listener calls this function when clicked:
     a) Get human's selected tiles: hand.getSelectionHidden()
     b) Reset selection counter: hand.resetSelection()
     c) Remove selected tiles from human's hand
     d) Call AIEngine.charlestonPass(1,2,3) in parallel for other players
     e) Call table.charlestonPass(direction, [human, ai1, ai2, ai3])
        └─ This exchanges tiles between players
        └─ Returns tiles human received
     f) If human received tiles:
        └─ Add blue glow effect
        └─ Wait 2 seconds
        └─ Remove glow
        └─ Sort hand by suit
        └─ Update hints
     g) Call resolve()
3. Wait for button click (promise pending)
```

**Key: How does human select 3 tiles?**

- User clicks tiles to select them
- Tiles visually raise (Y position: 575 instead of 600)
- Hand maintains `selectCount` property
- When user has selected exactly 3, they click "Pass"
- handler calls `getSelectionHidden()` to get them

### Phase 5A: COURTESY_QUERY (STATE.COURTESY_QUERY)

```javascript
1. Set state = STATE.COURTESY_QUERY
2. updateUI()
3. Call courtesyQuery():
   └─ Human decides how many tiles to exchange (0-3)
   └─ Button handler returns: 0, 1, 2, or 3
4. Set state = STATE.COURTESY_QUERY_COMPLETE
5. updateUI()

6. Set state = STATE.COURTESY
7. updateUI()
8. Get AI votes in parallel:
   └─ AIEngine.courtesyVote(1), courtesyVote(2), courtesyVote(3)
   └─ Returns vote count for each AI
9. Call table.courtesyVote(courtesyVoteArray):
   └─ Processes votes to determine if exchange happens
   └─ Sets table.player02CourtesyVote (players 0 & 2)
   └─ Sets table.player13CourtesyVote (players 1 & 3)

10. If any votes > 0:
    └─ Call courtesyPass()
11. Set state = STATE.COURTESY_COMPLETE
12. updateUI()
13. Update hints for player 0
```

### Phase 5B: COURTESY PASS DETAILS

```javascript
async courtesyPass():
1. Setup button handler:
   a) Get human's selected tiles from hand
   b) Remove them from hand
   c) For each AI player, call AIEngine.courtesyPass():
      └─ Returns which tiles they're passing
   d) Call table.courtesyPass():
      └─ Exchanges tiles between voting pairs
      └─ Returns tiles human received
   e) If human received tiles:
      └─ Add blue glow
      └─ Wait 2 seconds
      └─ Remove glow
      └─ Sort hand
      └─ Update hints
2. Wait for button click
```

### Phase 6: MAIN LOOP (STATE.LOOP\_\*)

**This is the core game flow that repeats until mahjong or wall game:**

```javascript
async loop():
1. Initialize: currPlayer = 0, skipPick = true (dealer doesn't pick on first turn)

2. REPEAT until break:

   a. Call table.switchPlayer(currPlayer)

   b. PICK FROM WALL (unless skipPick = true)
      ├─ Set state = STATE.LOOP_PICK_FROM_WALL
      ├─ updateUI()
      ├─ If not skipping:
      │  └─ Call pickFromWall():
      │     ├─ Remove tile from wall
      │     ├─ Add to player's hand
      │     ├─ If player 0: add blue glow, wait 2s, sort, update hints
      │     └─ Return tile (or null if wall empty = wall game)
      └─ Set skipPick = false

   c. CHOOSE DISCARD
      ├─ Set state = STATE.LOOP_CHOOSE_DISCARD
      ├─ updateUI()
      ├─ Call chooseDiscard():
      │  ├─ If player 0:
      │  │  ├─ Setup button1 ("Discard" button):
      │  │  │  └─ Call hand.removeDiscard() - gets selected tile, returns it
      │  │  ├─ Setup button2 ("Exchange Joker" button):
      │  │  │  └─ User swaps selected hidden tile for exposed joker
      │  │  ├─ Setup button3 ("Mahjong" button):
      │  │  │  └─ If clicked: resolve with MAHJONG option
      │  │  └─ Wait for button click
      │  └─ If AI: call AIEngine.chooseDiscard() - returns choice
      │
      └─ Returns: {playerOption: DISCARD_TILE|MAHJONG, tileArray: [tile]}

   d. CHECK FOR MAHJONG ON DISCARD
      ├─ If playerOption === MAHJONG:
      │  ├─ Set gameResult.mahjong = true
      │  ├─ Set gameResult.winner = currPlayer
      │  └─ break (exit loop)
      └─ Otherwise continue...

   e. ANIMATE DISCARD
      ├─ If not JOKER:
      │  ├─ Set tile.scale = 1.0
      │  ├─ Show tile (face up)
      │  ├─ Add dark blue glow
      │  ├─ Animate tile to discard pile center (350, 420, 0)
      │  ├─ When animation complete: play sound
      │  └─ (JOKER discards don't animate, just play sound)

   f. QUERY CLAIMS
      ├─ Create claimArray[]
      ├─ For each player (0,1,2,3):
      │  └─ Call claimDiscard(playerIndex, discardTile):
      │     ├─ If player i: return their claim decision (DISCARD|EXPOSE|MAHJONG)
      │     └─ If AI: call AIEngine to decide
      │
      ├─ Call table.processClaimArray():
      │  ├─ Check for claims from other players (not just discarding player)
      │  ├─ Prioritizes: MAHJONG > EXPOSE > DISCARD
      │  ├─ Return winning claim
      │  └─ Returns: {playerOption: MAHJONG|EXPOSE_TILES|DISCARD, winningPlayer}
      │
      └─ Remove glow from discarded tile

   g. PROCESS CLAIM RESULT
      ├─ If playerOption === MAHJONG:
      │  ├─ Set gameResult.mahjong = true
      │  ├─ Set gameResult.winner = winningPlayer
      │  └─ break
      │
      ├─ If playerOption === EXPOSE_TILES:
      │  ├─ currPlayer = winningPlayer
      │  ├─ skipPick = true (winning player doesn't pick next turn)
      │  ├─ That player continues their turn (will choose discard)
      │  └─ Update hints for player 0 if they won the claim
      │
      └─ Otherwise (DISCARD):
         ├─ Move to next player
         └─ skipPick = false

   h. VALIDATE TILE COUNT
      └─ Assert total tiles = 152 (or 160 with blanks)

3. Call end()
```

### Phase 7: END GAME (STATE.END)

```javascript
async end():
1. Set state = STATE.END
2. If mahjong && winner === player 0:
   └─ Call scene.createFireworksDisplay()
3. updateUI()
4. Game ready for restart (Start button becomes active)
```

---

## Tile Selection System (CRITICAL)

### How Tiles Are Selected (in Hand class)

```javascript
TileSet {
    selectCount = 0  // Track how many selected
    tileArray = []   // All tiles in this set

    onTileClick(tile):
        min = getMinSelect()  // e.g., 1 or 3
        max = getMaxSelect()  // e.g., 3

        if tile.isSelected:
            tile.deselect()   // Visual: lower to 600
            selectCount--
        else if selectCount < max:
            tile.select()      // Visual: raise to 575
            selectCount++
        else:
            // Can't select more than max
            ignore

    getSelection():
        return tiles where tile.isSelected === true

    resetSelection():
        deselect all tiles
        selectCount = 0
}
```

### Visual Feedback for Selected Tiles

```javascript
Tile.select():
    // Y position determines visual state
    // 600 = normal, not selected
    // 575 = selected (raised up)
    this.y = 575

Tile.deselect():
    this.y = 600
```

### Validation Rules

**Charleston/Courtesy**: Must select EXACTLY 3 (or 1-3 for courtesy)

```javascript
// In charlestonPass():
if (selectCount !== 3) {
  // Can't click Pass button
  // OR button click is ignored
}

// In courtesyPass():
if (selectCount < 1 || selectCount > 3) {
  // Invalid
}
```

**Discard**: Must select EXACTLY 1

```javascript
// In chooseDiscard():
if (selectCount !== 1) {
  // Can't click Discard button
}
```

---

## Button Management (State-Based)

### updateUI() - Changes buttons based on STATE

```javascript
updateUI():
    switch (this.state):
        case STATE.INIT:
            // Hide all action buttons
            button1.style.display = "none"
            // etc.

        case STATE.DEAL:
            // Still hide action buttons

        case STATE.CHARLESTON1/CHARLESTON2:
            button1.text = "Pass"
            button1.style.display = "block"
            button2.style.display = "none"
            button3.style.display = "none"

        case STATE.CHARLESTON_QUERY:
            button1.text = "No"
            button2.text = "Yes"
            button1.style.display = "block"
            button2.style.display = "block"

        case STATE.COURTESY_QUERY:
            button1.text = "0 Tiles"
            button2.text = "1 Tile"
            button3.text = "2 Tiles"
            button4.text = "3 Tiles"

        case STATE.LOOP_CHOOSE_DISCARD:
            button1.text = "Discard"
            button2.text = "Exchange Joker" (if applicable)
            button3.text = "Mahjong" (if hand is valid)
            button1.style.display = "block"

        case STATE.END:
            // Show Start button only
```

---

## Key Data Structures

### Hand Selection State

```javascript
Hand {
    hiddenTileSet: TileSet {
        selectCount: number  // How many selected
        tileArray: [Tile]    // All tiles
    }

    exposedTileSetArray: [TileSet]  // Exposed pugs/kongs/etc

    getSelectionHidden():
        return hiddenTileSet.getSelection()

    resetSelection():
        hiddenTileSet.selectCount = 0
        hiddenTileSet.tileArray.forEach(t => t.deselect())
}
```

### Game Result

```javascript
gameResult {
    mahjong: boolean
    winner: playerIndex (0-3)
}
```

---

## State Machine Summary

```
INIT
  ↓
START → DEAL → CHARLESTON1 → CHARLESTON_QUERY ─→ CHARLESTON_QUERY_COMPLETE
                    ↑                                    ↓ (yes) ↓ (no)
                    ↑                              CHARLESTON2
                    └──────────────────────────────────┘
                                        ↓
                           COURTESY_QUERY → COURTESY_QUERY_COMPLETE
                                        ↓
                           COURTESY → COURTESY_COMPLETE
                                        ↓
        LOOP_PICK_FROM_WALL ← ─ ─ ─ ─ ─ ┘
               ↓
        LOOP_CHOOSE_DISCARD
               ↓ (no mahjong)
        LOOP_QUERY_CLAIM_DISCARD
               ↓ (no mahjong, no claims)
        [loop back to LOOP_PICK_FROM_WALL or LOOP_EXPOSE_TILES]
               ↓ (mahjong or wall game)
        END
```

---

## Critical Implementation Details

### 1. Promise-Based Flow

Game doesn't use traditional callbacks. Each awaitable action returns a Promise.

```javascript
const result = await chooseDiscard(); // Waits for button click
const vote = await yesNoQuery(); // Waits for button click
const tiles = await charlestonPass(); // Waits for button click
```

### 2. Button Hijacking

Each state removes old listeners and adds new ones.

```javascript
button.removeEventListener("click", this.oldFunction);
this.buttonFunction = newHandler;
button.addEventListener("click", this.buttonFunction);
```

### 3. Tile Position for Selection

Y-coordinate indicates selection state:

- 600 = deselected (normal)
- 575 = selected (raised)

### 4. Validation Happens in updateUI

If selection count is invalid, button may be disabled or non-functional.

### 5. Hint Updates

After every action that changes player 0's hand:

- Drawing tile
- Discarding (receiving tiles back from opponents)
- Charleston pass (sending/receiving tiles)
- Courtesy pass (receiving tiles)
- Claiming discard

Always call: `hintAnimationManager.updateHintsForNewTiles()`

---

## Key Methods Summary

| Method                  | Called During            | Returns                            | Notes                           |
| ----------------------- | ------------------------ | ---------------------------------- | ------------------------------- |
| `sequentialDealTiles()` | DEAL                     | Promise                            | Animates tile dealing           |
| `charlestonPass()`      | CHARLESTON               | Promise<void>                      | Waits for button, does exchange |
| `yesNoQuery()`          | CHARLESTON_QUERY         | Promise<boolean>                   | Continue charleston?            |
| `courtesyQuery()`       | COURTESY_QUERY           | Promise<0-3>                       | How many to exchange            |
| `courtesyPass()`        | COURTESY                 | Promise<void>                      | Waits for selection, exchanges  |
| `pickFromWall()`        | LOOP_PICK_FROM_WALL      | Tile                               | Returns drawn tile or null      |
| `chooseDiscard()`       | LOOP_CHOOSE_DISCARD      | Promise<{playerOption, tileArray}> | Waits for button                |
| `claimDiscard()`        | LOOP_QUERY_CLAIM_DISCARD | Promise<claim_option>              | Decision per player             |
| `end()`                 | END                      | Promise<void>                      | Finale, fireworks               |

---

## What This Means for Current Implementation

We need to recreate:

1. **Promise-based async flow** ✅ (GameController should emit events)
2. **Button-driven state machine** ⚠️ (PhaserAdapter needs to wire buttons)
3. **Tile selection system** ❌ (SelectionManager needed)
4. **State-based UI updates** ⚠️ (ButtonManager exists but maybe not fully wired)
5. **Visual feedback on tiles** ❌ (Tile Y-position changes for selection)
6. **Hint updates** ⚠️ (HintAnimationManager exists but might not work)

---

## Next Step

With this detailed flow understood, we can now:

1. Map old GameLogic methods to new GameController
2. Design SelectionManager based on TileSet behavior
3. Wire PhaserAdapter handlers to DialogManager + managers
4. Ensure buttons are properly updated by state

The architecture is clear - the implementation work is well-defined.
