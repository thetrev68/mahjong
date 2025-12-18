# Phase 2B: Complete Desktop Integration & Wall Synchronization

**Context:** Phase 2A complete (PhaserAdapter created, GameController integrated). Now need to complete the migration so GameController fully handles game flow instead of GameLogic.

**Assignee:** Claude Sonnet 4.5
**Estimated Tokens:** 15K
**Complexity:** High
**Status:** Ready to start after Phase 2A testing
**Branch:** mobile-core

---

## Current State

### ✅ Phase 2A Complete

- GameController + PhaserAdapter integrated into GameScene.js
- Both GameController and GameLogic run in parallel
- PhaserAdapter listens to GameController events
- Desktop game still works via GameLogic
- Linting passes, dev server runs

### ❌ Phase 2B Tasks

1. **Complete GameController implementation** - Move game flow from GameLogic to GameController
2. **Wall/tile synchronization** - GameController tracks existing Phaser wall tiles
3. **Full UI prompt integration** - Complete PhaserAdapter callback system
4. **Gradually phase out GameLogic** - Make GameController the primary controller

---

## Task 1: Complete GameController Game Flow

### Current Placeholder Methods (need implementation)

**File:** `core/GameController.js`

#### 1.1 Complete `createWall()`

**Current code (line ~149):**

```javascript
createWall() {
    this.wall = [];
    const tileCount = this.settings.useBlankTiles ? 160 : 152;
    // TODO: This needs to match the tile generation logic from gameObjects.js
}
```

**Requirements:**

- Create TileData objects matching Phaser wall tiles
- Use existing gTileGroups from gameObjects.js
- Assign unique index to each tile (0-151 or 0-159)
- Match order of Phaser wall creation

**Implementation approach:**

```javascript
createWall() {
    this.wall = [];
    let index = 0;

    // Import gTileGroups from gameObjects.js or tileDefinitions.js
    for (const group of gTileGroups) {
        for (const prefix of group.prefix) {
            for (let num = 1; num <= group.maxNum; num++) {
                let number = num;
                if (group.maxNum === 1) {
                    if (group.suit === SUIT.FLOWER) {
                        number = 0;
                    } else {
                        number = group.prefix.indexOf(prefix);
                    }
                }

                // Create duplicate tiles
                for (let j = 0; j < group.count; j++) {
                    const tile = new TileData(group.suit, number, index);
                    this.wall.push(tile);
                    index++;
                }
            }
        }
    }

    // Shuffle wall
    this.shuffleWall();

    this.emit("MESSAGE", {
        text: `Wall created with ${this.wall.length} tiles`,
        type: "info"
    });
}

shuffleWall() {
    // Fisher-Yates shuffle
    for (let i = this.wall.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.wall[i], this.wall[j]] = [this.wall[j], this.wall[i]];
    }
}
```

---

#### 1.2 Complete `dealTiles()`

**Current code (line ~166):**

```javascript
async dealTiles() {
    this.setState(STATE.DEAL);
    // TODO: Implement actual dealing logic
    this.emit("TILES_DEALT", {...});
}
```

**Requirements:**

- Deal 13 tiles to each player (52 total)
- Update PlayerData.hand for each player
- Remove tiles from wall
- Emit TILE_DRAWN event for each tile
- Emit TILES_DEALT when complete

**Implementation approach:**

```javascript
async dealTiles() {
    this.setState(STATE.DEAL);

    // Deal 13 tiles to each player
    for (let round = 0; round < 13; round++) {
        for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
            const tile = this.wall.pop();
            if (!tile) {
                throw new Error("Wall empty during dealing!");
            }

            this.players[playerIndex].hand.addTile(tile);

            this.emit("TILE_DRAWN", {
                player: playerIndex,
                tile: tile.toJSON()
            });

            // Small delay for animation (optional)
            if (this.settings.animateDealing) {
                await this.sleep(50);
            }
        }
    }

    this.emit("TILES_DEALT", {
        players: this.players.map(p => ({
            position: p.position,
            tileCount: p.hand.getLength()
        }))
    });
}
```

---

#### 1.3 Uncomment and complete `charlestonPhase()`

**Current code (line ~188):**

```javascript
async charlestonPhase() {
    // Charleston Phase 1 (required)
    this.charlestonState.phase = 1;
    await this.executeCharlestonPasses(1);

    // ... rest is placeholder
}
```

**Requirements:**

- Charleston Phase 1 (required): 3 passes (right, across, left)
- Query for Phase 2 continuation
- Charleston Phase 2 (optional): 3 passes
- Courtesy pass voting and execution
- Emit events for PhaserAdapter

**Implementation approach:**
Keep existing structure but ensure it emits events properly. Reference existing GameLogic.charleston() for logic.

---

#### 1.4 Implement `gameLoop()`

**Current code:** Not implemented

**Requirements:**

- Main game loop (draw → discard → claim check)
- Handle player turns
- Check for Mahjong after each discard
- Handle wall game (no tiles left)
- Emit events for all actions

**Implementation approach:**

```javascript
async gameLoop() {
    this.setState(STATE.LOOP_PICK_FROM_WALL);

    while (this.wall.length > 0) {
        // Current player draws a tile
        const tile = this.wall.pop();
        this.players[this.currentPlayer].hand.addTile(tile);

        this.emit("TILE_DRAWN", {
            player: this.currentPlayer,
            tile: tile.toJSON()
        });

        // Wait for discard
        await this.promptForDiscard(this.currentPlayer);

        // Check if any player can claim the discard
        const claimResult = await this.checkDiscardClaims();

        if (claimResult.mahjong) {
            await this.endGame("mahjong", claimResult.player);
            return;
        }

        if (claimResult.claimed) {
            // Handle claim (pung, kong, etc.)
            await this.handleDiscardClaim(claimResult);
        } else {
            // Next player's turn
            this.advanceTurn();
        }
    }

    // Wall game - no winner
    await this.endGame("wall_game", -1);
}
```

---

## Task 2: Wall/Tile Synchronization

### Problem

GameController creates TileData objects, but Phaser wall has actual Tile sprites. Need to synchronize indices.

### Solution: Sync Phaser Wall Tiles with GameController

**Approach 1: Sync at Initialization**
When GameScene creates the Phaser wall, assign indices to match GameController:

**File:** `GameScene.js`

```javascript
// After wall.create()
await this.gTable.wall.create(false);  // Create Phaser tiles

// Sync indices with GameController
await this.syncWallIndices();

async syncWallIndices() {
    // GameController creates wall in same order as Phaser
    await this.gameController.createWall();

    // Match indices
    for (let i = 0; i < this.gTable.wall.tileArray.length; i++) {
        this.gTable.wall.tileArray[i].index = i;
    }

    // PhaserAdapter now has indexed tiles
    console.log("Wall synced: " + this.gTable.wall.tileArray.length + " tiles");
}
```

**Approach 2: Assign Indices During Creation**
Modify Wall.create() to assign indices during tile creation (already done - tiles have index).

**Recommended:** Approach 2 is simpler (tiles already have indices from Wall.create()).

---

## Task 3: Complete PhaserAdapter UI Prompts

### 3.1 Fix `setupDiscardPrompt()` - Add Tile Selection Callback

**Current code (line ~353):**

```javascript
setupDiscardPrompt(options) {
    // Phase 2A: Use existing GameLogic drag-and-drop
    printInfo("Select a tile to discard");
    // TODO Phase 2B: Implement proper tile selection callback
}
```

**Requirements:**

- Enable tile selection in hand
- When tile is clicked/dragged, call `this.pendingPromptCallback(tileData)`
- Disable other tiles during selection

**Implementation approach:**

```javascript
setupDiscardPrompt(options) {
    const player = this.table.players[PLAYER.BOTTOM];

    printInfo("Select a tile to discard");

    // Enable tile selection
    player.hand.enableTileSelection((selectedTile) => {
        // User selected a tile to discard
        if (this.pendingPromptCallback) {
            // Convert Phaser Tile → TileData
            const tileData = TileData.fromPhaserTile(selectedTile);
            this.pendingPromptCallback(tileData);
            this.pendingPromptCallback = null;
            this.currentPromptType = null;
        }
    });
}
```

**Add to Hand class (gameObjects_hand.js):**

```javascript
enableTileSelection(callback) {
    const tileArray = this.hidden.tileArray;

    for (const tile of tileArray) {
        tile.sprite.setInteractive();
        tile.sprite.once("pointerup", () => {
            callback(tile);
            this.disableTileSelection();
        });
    }
}

disableTileSelection() {
    const tileArray = this.hidden.tileArray;
    for (const tile of tileArray) {
        tile.sprite.removeAllListeners("pointerup");
    }
}
```

---

### 3.2 Complete `setupClaimPrompt()` - Enable Buttons

**Current code (line ~365):**

```javascript
setupClaimPrompt(options) {
    const {tile: tileData, options: claimOptions} = options;
    // ... sets up buttons
}
```

**Requirements:**

- Show only available claim options (from `claimOptions` array)
- Disable buttons that aren't valid
- Pass back claim choice to GameController

**Implementation approach:**

```javascript
setupClaimPrompt(options) {
    const {tile: tileData, options: claimOptions} = options;

    const tileDataObj = TileData.fromJSON(tileData);
    printInfo(`Claim ${tileDataObj.getText()}?`);

    // Show buttons based on available options
    const buttons = ["button1", "button2", "button3", "button4"];
    const buttonLabels = ["Mahjong", "Pung", "Kong", "Pass"];

    buttons.forEach((btnId, index) => {
        const btn = document.getElementById(btnId);
        const label = buttonLabels[index];

        if (claimOptions.includes(label) || label === "Pass") {
            btn.textContent = label;
            btn.disabled = false;
            btn.style.display = "block";
            btn.onclick = () => this.respondToClaim(label);
        } else {
            btn.style.display = "none";
        }
    });
}
```

---

## Task 4: Phase Out GameLogic

### 4.1 Update Start Button to Use GameController Only

**Current code (GameScene.js:124-138):**

```javascript
// Phase 2A: Call GameController.startGame() to test event system
await this.gameController.startGame();

// GameLogic still handles the actual game flow
this.gGameLogic.start();
```

**Phase 2B: Remove GameLogic.start()**

```javascript
// Phase 2B: GameController now handles game flow
await this.gameController.startGame();

// Remove: this.gGameLogic.start();
```

---

### 4.2 Disable GameLogic.updateUI()

**File:** `desktop/adapters/PhaserAdapter.js`

**Current code (line ~143):**

```javascript
onStateChanged(data) {
    const {oldState, newState} = data;
    console.log(`State: ${oldState} → ${newState}`);

    // Update desktop UI
    this.gameLogic.state = newState;
    this.gameLogic.updateUI();
}
```

**Phase 2B: Remove updateUI() call**

```javascript
onStateChanged(data) {
    const {oldState, newState} = data;
    console.log(`State: ${oldState} → ${newState}`);

    // Update desktop UI (managed by PhaserAdapter now)
    this.gameLogic.state = newState;
    // Remove: this.gameLogic.updateUI();

    // Instead, manage button state here
    this.updateButtonState(newState);
}

updateButtonState(state) {
    // Show/hide buttons based on state
    // This replaces GameLogic.updateUI() for button management
}
```

---

### 4.3 Keep GameLogic for AI and Card Validation (Phase 2B)

**Don't remove:**

- `this.gGameLogic.gameAI` - Still needed by GameController
- `this.gGameLogic.card` - Still needed for hand validation

**Phase 6A will refactor these into core/AIEngine.js**

---

## Task 5: Testing & Validation

### Manual Test Plan

**Test 1: Game Start**

- [ ] Click "Start Game" button
- [ ] Verify tiles are dealt via GameController
- [ ] Check console for event logs
- [ ] Confirm no errors

**Test 2: Tile Draw & Discard**

- [ ] Human player draws tile (GameController emits TILE_DRAWN)
- [ ] Select tile to discard (callback works)
- [ ] Verify tile moves to discard pile
- [ ] Check wall counter updates

**Test 3: Charleston**

- [ ] Select 3 tiles to pass
- [ ] Verify tiles pass correctly (3 rounds)
- [ ] Check Phase 2 query works
- [ ] Confirm courtesy pass voting

**Test 4: Discard Claims**

- [ ] AI discards a tile
- [ ] Human has Pung/Kong available
- [ ] Verify claim buttons appear
- [ ] Test claiming tile

**Test 5: Mahjong**

- [ ] Complete a winning hand
- [ ] Verify Mahjong detection
- [ ] Check fireworks animation
- [ ] Confirm game ends properly

**Test 6: Wall Game**

- [ ] Reduce wall size artificially (for faster testing)
- [ ] Let game run until wall empty
- [ ] Verify "wall game - no winner" message

---

## Success Criteria

✅ **GameController fully handles game flow**

- createWall() populates wall with TileData
- dealTiles() deals 13 tiles to each player
- charlestonPhase() handles all Charleston logic
- gameLoop() manages draw/discard/claim cycle

✅ **Wall/tile synchronization works**

- Phaser wall tiles have correct indices
- PhaserAdapter finds tiles by index
- No "creating new tile" warnings in console

✅ **PhaserAdapter UI prompts work**

- setupDiscardPrompt() enables tile selection with callback
- setupClaimPrompt() shows correct buttons
- All prompts return data to GameController

✅ **GameLogic phased out**

- GameController.startGame() is only entry point
- GameLogic.start() removed
- GameLogic.updateUI() disabled
- Desktop game works identically to Phase 2A

✅ **Testing**

- All manual tests pass
- No console errors
- Linting passes
- Game playable start to finish

---

## Files to Modify

1. **`core/GameController.js`** - Implement createWall(), dealTiles(), charlestonPhase(), gameLoop()
2. **`desktop/adapters/PhaserAdapter.js`** - Complete setupDiscardPrompt(), setupClaimPrompt(), disable updateUI()
3. **`gameObjects_hand.js`** - Add enableTileSelection() and disableTileSelection() methods
4. **`GameScene.js`** - Remove GameLogic.start() call, sync wall indices
5. **Create `PHASE_2B_RESULTS.md`** - Document changes and testing results

---

## Known Risks

**Risk 1: Wall synchronization fails**

- Mitigation: Test createWall() logic separately, verify indices match
- Fallback: PhaserAdapter.createPhaserTile() already has fallback creation

**Risk 2: UI prompts break existing flow**

- Mitigation: Keep GameLogic methods temporarily, test incrementally
- Fallback: Can revert setupDiscardPrompt() to Phase 2A version

**Risk 3: Charleston logic differs from GameLogic**

- Mitigation: Copy charleston logic from GameLogic.charleston() exactly
- Fallback: Keep both systems running until verified identical

---

## Context for Next Session

- **Current Branch:** mobile-core
- **Phase 2A Complete:** GameController + PhaserAdapter integrated
- **Token Budget:** ~85K remaining (after 2A used ~70K)
- **Dependencies:** Phase 1B (GameController, models, events)
- **Blockers:** None - ready to start Phase 2B

---

**Phase 2B Status:** Ready to start
**Estimated Time:** 4-6 hours implementation + testing
**Critical for:** Completing desktop migration before building mobile

Good luck! 🚀
