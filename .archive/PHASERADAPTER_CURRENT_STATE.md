# PhaserAdapter Current State Analysis

**Date:** 2025-11-14
**Component:** Component 3 - PhaserAdapter Handler Wiring

---

## Section 1: Handler Inventory

### Current Handler Implementations

| Handler Method      | Status      | Current Implementation                                        | What's Missing                       |
| ------------------- | ----------- | ------------------------------------------------------------- | ------------------------------------ |
| `onGameStarted`     | ✅ Complete | Resets table, hides start button, resets tile counter         | Nothing                              |
| `onGameEnded`       | ✅ Complete | Shows winner/wall game, plays fireworks, shows start button   | Nothing                              |
| `onStateChanged`    | ⚠️ Partial  | Calls `buttonManager.updateForState()`, sets validation modes | Needs SelectionManager integration   |
| `onTilesDealt`      | ✅ Complete | Updates wall counter after deal                               | Nothing                              |
| `onTileDrawn`       | ✅ Complete | Animates tile from wall to hand, updates counter              | Nothing                              |
| `onTileDiscarded`   | ✅ Complete | Removes from hand, adds to discard pile, shows layout         | Nothing                              |
| `onDiscardClaimed`  | ✅ Complete | Prints message about claim                                    | Nothing                              |
| `onTilesExposed`    | ✅ Complete | Creates exposed tileset, refreshes hand                       | Nothing                              |
| `onJokerSwapped`    | ✅ Complete | Handles joker swap with full validation                       | Nothing                              |
| `onHandUpdated`     | ⚠️ Partial  | Logs update, refreshes hints                                  | Missing SelectionManager integration |
| `onTurnChanged`     | ✅ Complete | Switches current player, prints message                       | Nothing                              |
| `onCharlestonPhase` | ⚠️ Stub     | Only prints message                                           | Needs SelectionManager activation    |
| `onCharlestonPass`  | ✅ Complete | Prints pass message                                           | Nothing                              |
| `onCourtesyVote`    | ✅ Complete | Prints vote message                                           | Nothing                              |
| `onCourtesyPass`    | ✅ Complete | Prints courtesy pass details                                  | Nothing                              |
| `onMessage`         | ✅ Complete | Routes to printInfo/printMessage/hint panel                   | Nothing                              |
| `onUIPrompt`        | ✅ Complete | Routes to appropriate prompt handlers                         | Nothing                              |

### Prompt Handler Implementations

| Prompt Handler                   | Status      | Implementation                                        | What's Missing |
| -------------------------------- | ----------- | ----------------------------------------------------- | -------------- |
| `handleDiscardPrompt`            | ✅ Complete | Enables tile selection via hand.enableTileSelection() | Nothing        |
| `handleClaimPrompt`              | ✅ Complete | Shows claim dialog with options                       | Nothing        |
| `handleCharlestonPassPrompt`     | ✅ Complete | Shows Charleston dialog, gets selection from hand     | Nothing        |
| `handleCharlestonContinuePrompt` | ✅ Complete | Shows yes/no dialog                                   | Nothing        |
| `handleCourtesyVotePrompt`       | ✅ Complete | Shows courtesy vote dialog                            | Nothing        |
| `handleCourtesyPassPrompt`       | ✅ Complete | Shows courtesy pass dialog                            | Nothing        |
| `handleSelectTilesPrompt`        | ✅ Complete | Generic tile selection prompt                         | Nothing        |

---

## Section 2: Manager Dependencies

### Manager Integration Status

| Manager                | Instantiated | Location            | Integration Status       |
| ---------------------- | ------------ | ------------------- | ------------------------ |
| `TileManager`          | ✅ Yes       | Constructor line 49 | ✅ Fully integrated      |
| `ButtonManager`        | ✅ Yes       | Constructor line 50 | ✅ Fully integrated      |
| `DialogManager`        | ✅ Yes       | Constructor line 51 | ✅ Fully integrated      |
| `SelectionManager`     | ❌ No        | Not created         | ⚠️ **NEEDS TO BE ADDED** |
| `HandRenderer`         | ❌ No        | Not created         | ⚠️ **NEEDS TO BE ADDED** |
| `HintAnimationManager` | ✅ Yes       | Scene-level         | ✅ Already available     |

### Which Handlers Need Which Managers?

#### SelectionManager Dependencies

- `onCharlestonPhase` - Enable 3-tile selection
- `onStateChanged` - Enable/disable selection based on state
- `onHandUpdated` - Clear invalid selections
- Charleston/courtesy handlers already use `hand.hiddenTileSet.getSelection()` ✅

#### HandRenderer Dependencies

- `onTileDrawn` - Could use for position calculations (current code works)
- `onTileDiscarded` - Could use for position calculations (current code works)
- `onHandUpdated` - Could call `handRenderer.showHand()` instead of `player.showHand()`
- All hand updates - Unified rendering approach

#### DialogManager Dependencies (Already Wired)

- ✅ `handleClaimPrompt` - Uses DialogManager
- ✅ `handleCharlestonPassPrompt` - Uses DialogManager
- ✅ `handleCharlestonContinuePrompt` - Uses DialogManager
- ✅ `handleCourtesyVotePrompt` - Uses DialogManager
- ✅ `handleCourtesyPassPrompt` - Uses DialogManager
- ✅ `onMessage` - Uses DialogManager for errors

#### ButtonManager Dependencies (Already Wired)

- ✅ `onStateChanged` - Calls `buttonManager.updateForState()`
- ✅ All button callbacks registered in ButtonManager

---

## Section 3: Event Flow Analysis

### Event Sequence by Game Phase

#### 1. Game Start

```
GAME_STARTED
  → onGameStarted()
  → Reset table, hide start button
```

#### 2. Deal Phase

```
STATE_CHANGED (→ DEAL)
  → onStateChanged()
  → buttonManager.updateForState(DEAL)
  → Show sort buttons

TILE_DRAWN (x52, 4 times for each player)
  → onTileDrawn()
  → Animate tile from wall to hand

TILES_DEALT
  → onTilesDealt()
  → Update wall counter
```

#### 3. Charleston Phase

```
STATE_CHANGED (→ CHARLESTON1)
  → onStateChanged()
  → buttonManager.updateForState(CHARLESTON1)
  → Set validation mode to "charleston"

CHARLESTON_PHASE {phase: 1, passCount: 1, direction: "right"}
  → onCharlestonPhase()
  → Print message (current)
  → **MISSING: Enable SelectionManager for 3 tiles**

UI_PROMPT {promptType: "CHARLESTON_PASS", options: {direction, requiredCount}}
  → onUIPrompt()
  → handleCharlestonPassPrompt()
  → Show dialog
  → Wait for user selection

CHARLESTON_PASS {player, direction}
  → onCharlestonPass()
  → Print message

HAND_UPDATED {player, hand}
  → onHandUpdated()
  → Log update, refresh hints
```

#### 4. Main Game Loop

```
STATE_CHANGED (→ LOOP_PICK_FROM_WALL)
  → onStateChanged()
  → Hide buttons

TILE_DRAWN {player, tile}
  → onTileDrawn()
  → Animate tile to hand

STATE_CHANGED (→ LOOP_CHOOSE_DISCARD)
  → onStateChanged()
  → Show discard buttons
  → Set validation mode to "play"

UI_PROMPT {promptType: "CHOOSE_DISCARD"}
  → onUIPrompt()
  → handleDiscardPrompt()
  → Enable tile selection (via hand.enableTileSelection())

TILE_DISCARDED {player, tile}
  → onTileDiscarded()
  → Animate to discard pile

STATE_CHANGED (→ LOOP_QUERY_CLAIM_DISCARD)
  → onStateChanged()
  → Show claim buttons

UI_PROMPT {promptType: "CLAIM_DISCARD", options}
  → onUIPrompt()
  → handleClaimPrompt()
  → Show claim dialog
```

### Promise-Based Events (Require User Input)

| Event               | Callback Mechanism                              | Resolution                                |
| ------------------- | ----------------------------------------------- | ----------------------------------------- |
| Charleston Pass     | `handleCharlestonPassPrompt(options, callback)` | User clicks button → callback(tiles)      |
| Charleston Continue | `handleCharlestonContinuePrompt(callback)`      | User clicks Yes/No → callback(bool)       |
| Courtesy Vote       | `handleCourtesyVotePrompt(callback)`            | User clicks button → callback(count)      |
| Courtesy Pass       | `handleCourtesyPassPrompt(options, callback)`   | User clicks button → callback(tiles)      |
| Choose Discard      | `handleDiscardPrompt(callback)`                 | User selects tile → callback(tile)        |
| Claim Discard       | `handleClaimPrompt(options, callback)`          | User clicks claim/pass → callback(result) |

### Fire-and-Forget Events (No User Input)

| Event          | Action                      |
| -------------- | --------------------------- |
| GAME_STARTED   | Reset UI                    |
| STATE_CHANGED  | Update button visibility    |
| TILE_DRAWN     | Animate tile                |
| TILE_DISCARDED | Move to discard pile        |
| TILES_EXPOSED  | Show exposed tiles          |
| JOKER_SWAPPED  | Update exposure             |
| HAND_UPDATED   | Refresh hints               |
| TURN_CHANGED   | Switch player indicator     |
| MESSAGE        | Print to console/hint panel |

---

## Section 4: Patterns from 07c41b9

### Charleston Tile Selection Pattern

From `07c41b9:gameLogic.js` `charlestonPass()`:

```javascript
// 1. Enable selection mode
this.hand.hiddenTileSet.selectCount = 0;
this.hand.showHand(true);

// 2. Update button state
button1.textContent = `Pass ${direction}`;
button1.disabled = false;

// 3. Wait for button click
await new Promise((resolve) => {
  button1.onclick = () => {
    const selected = this.hand.getSelectionHidden();
    if (selected.length === 3) {
      resolve(selected);
    }
  };
});

// 4. Get selection and disable
const tiles = this.hand.getSelectionHidden();
this.hand.hiddenTileSet.resetSelection();
```

**Key Insights:**

- Selection is tracked in `TileSet.selectCount` and `tile.selected` properties
- `getSelectionHidden()` returns tiles where `tile.selected === true`
- `resetSelection()` clears all selections
- Button is disabled until 3 tiles selected

### Discard Selection Pattern

From `07c41b9:gameLogic.js` `chooseDiscard()`:

```javascript
// 1. Enable tile click handler
this.hand.enableTileSelection((tile) => {
  // Callback when tile selected
  callback(tile);
});

// 2. Button click commits the selection
button1.onclick = () => {
  const selected = this.hand.getSelectionHidden()[0];
  if (selected) {
    disableButtons();
    callback(selected);
  }
};
```

**Key Insights:**

- Hand has `enableTileSelection(callback)` method
- Tile click calls the callback
- Single-tile selection for discard

### Visual Feedback Pattern

From `07c41b9:gameObjects_hand.js`:

```javascript
// Selected tiles raised to Y=575
// Normal tiles at Y=600
tile.animate(tile.origX, tile.selected ? 575 : 600, angle);

// Selected tiles have higher depth
tile.sprite.setDepth(tile.selected ? 150 : 0);
```

**Key Insights:**

- Y-position 575 = selected (raised 25 pixels)
- Y-position 600 = normal (standard hand position)
- Depth 150 = selected (render on top)
- Depth 0 = normal

### Dialog Patterns

From `07c41b9:gameLogic.js`:

```javascript
// Yes/No dialog
await new Promise((resolve) => {
  button1.textContent = "No";
  button2.textContent = "Yes";
  button1.onclick = () => resolve(false);
  button2.onclick = () => resolve(true);
});

// Multi-button dialog (courtesy vote)
await new Promise((resolve) => {
  button1.textContent = "0 Tiles";
  button2.textContent = "1 Tile";
  button3.textContent = "2 Tiles";
  button4.textContent = "3 Tiles";
  button1.onclick = () => resolve(0);
  button2.onclick = () => resolve(1);
  button3.onclick = () => resolve(2);
  button4.onclick = () => resolve(3);
});
```

**Key Insights:**

- ButtonManager already implements this pattern
- Callbacks registered per button per state
- Promise-based async flow

---

## Section 5: What Needs to Be Done

### High Priority: Add Missing Manager Instances

#### 1. Create SelectionManager Instance

**Location:** PhaserAdapter constructor

```javascript
// In constructor, after other managers:
const humanHand = this.table.players[PLAYER.BOTTOM].hand;
this.selectionManager = new SelectionManager(humanHand, this.table);
```

**Import:** Add to top of file:

```javascript
import { SelectionManager } from "../managers/SelectionManager.js";
```

#### 2. Create HandRenderer Instance

**Location:** PhaserAdapter constructor

```javascript
// In constructor, after other managers:
this.handRenderer = new HandRenderer(this.scene, this.table);
```

**Import:** Add to top of file:

```javascript
import { HandRenderer } from "../renderers/HandRenderer.js";
```

### Medium Priority: Enhance Event Handlers

#### 1. Enhance `onCharlestonPhase`

**Current:** Just prints message
**Needed:** Enable SelectionManager

```javascript
onCharlestonPhase(data) {
    const {phase, passCount, direction} = data;
    printMessage(`Charleston Phase ${phase}, Pass ${passCount}: Pass ${direction}`);

    // Enable tile selection for human player
    if (this.selectionManager) {
        this.selectionManager.enableTileSelection(3, 3, "charleston");
    }
}
```

#### 2. Enhance `onHandUpdated`

**Current:** Logs and refreshes hints
**Needed:** Clear invalid selections, optionally re-render with HandRenderer

```javascript
onHandUpdated(data) {
    const {player: playerIndex, hand: handData} = data;

    // Log update
    console.log(`Hand updated for player ${playerIndex}: ${handData.tiles.length} hidden, ${handData.exposures.length} exposed`);

    // Clear invalid selections for human player
    if (playerIndex === PLAYER.BOTTOM && this.selectionManager) {
        // Don't clear if selection is still valid for current mode
        if (!this.selectionManager.isValidSelection()) {
            this.selectionManager.clearSelection();
        }
    }

    // Update hints
    if (playerIndex === PLAYER.BOTTOM && this.scene.hintAnimationManager) {
        this.scene.hintAnimationManager.updateHintsForNewTiles();
    }

    // Optional: Use HandRenderer for unified rendering
    // this.handRenderer.showHand(playerIndex);
}
```

#### 3. Enhance `onStateChanged`

**Current:** Updates button manager and validation modes
**Needed:** Enable/disable SelectionManager based on state

```javascript
onStateChanged(data) {
    const {oldState, newState} = data;
    console.log(`State: ${oldState} → ${newState}`);

    // Update button visibility
    this.buttonManager.updateForState(newState);

    // Set validation mode and selection state
    const humanHand = this.table.players[0].hand;
    switch (newState) {
        case STATE.CHARLESTON1:
        case STATE.CHARLESTON2:
            humanHand.setValidationMode("charleston");
            // Selection enabled by onCharlestonPhase handler
            break;
        case STATE.COURTESY:
            humanHand.setValidationMode("courtesy");
            // Selection enabled by prompt handler
            break;
        case STATE.LOOP_CHOOSE_DISCARD:
            humanHand.setValidationMode("play");
            // Selection enabled by prompt handler
            break;
        case STATE.LOOP_EXPOSE_TILES:
            humanHand.setValidationMode("expose");
            break;
        default:
            humanHand.setValidationMode(null);
            // Disable selection when not in selection state
            if (this.selectionManager) {
                this.selectionManager.disableTileSelection();
            }
    }
}
```

### Low Priority: Optional HandRenderer Integration

The current code already works well for rendering hands. HandRenderer provides a cleaner API but is not strictly necessary for Component 3.

**Optional enhancements:**

- Replace `player.showHand()` calls with `handRenderer.showHand(playerIndex)`
- Use `handRenderer.calculateHiddenTilePositions()` for animation targets
- Unified rendering approach across all event handlers

---

## Section 6: Implementation Dependencies

### Required Files

1. ✅ [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js) - Complete
2. ✅ [desktop/renderers/HandRenderer.js](desktop/renderers/HandRenderer.js) - Complete
3. ✅ [desktop/managers/ButtonManager.js](desktop/managers/ButtonManager.js) - Complete
4. ✅ [desktop/managers/DialogManager.js](desktop/managers/DialogManager.js) - Complete
5. ⚠️ [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js) - Needs enhancement

### Code Changes Required

| File             | Change                           | Lines Affected  |
| ---------------- | -------------------------------- | --------------- |
| PhaserAdapter.js | Add import for SelectionManager  | Line ~23        |
| PhaserAdapter.js | Add import for HandRenderer      | Line ~24        |
| PhaserAdapter.js | Create SelectionManager instance | Constructor ~52 |
| PhaserAdapter.js | Create HandRenderer instance     | Constructor ~53 |
| PhaserAdapter.js | Enhance onCharlestonPhase        | Lines 577-580   |
| PhaserAdapter.js | Enhance onHandUpdated            | Lines 550-560   |
| PhaserAdapter.js | Enhance onStateChanged           | Lines 224-250   |

---

## Section 7: Risk Assessment

### Low Risk Changes

- ✅ Adding manager instances (SelectionManager, HandRenderer)
- ✅ Calling `selectionManager.enableTileSelection()` in `onCharlestonPhase`
- ✅ Calling `selectionManager.clearSelection()` in `onHandUpdated`

**Rationale:** These are additive changes that don't modify existing working code.

### Medium Risk Changes

- ⚠️ Modifying `onStateChanged` to disable selection
- ⚠️ Clearing selections in `onHandUpdated`

**Rationale:** Could interfere with existing selection flow. Need careful testing.

### No Risk (Already Working)

- ✅ All prompt handlers (already complete)
- ✅ Tile animations (already complete)
- ✅ Button management (already complete)
- ✅ Dialog management (already complete)

---

## Section 8: Testing Strategy

### Unit Tests (Console)

```javascript
// Get adapter
const adapter = game.scene.scenes[0].phaserAdapter;

// Test SelectionManager creation
console.log("SelectionManager:", adapter.selectionManager);

// Test HandRenderer creation
console.log("HandRenderer:", adapter.handRenderer);

// Test enable selection
adapter.selectionManager.enableTileSelection(3, 3, "charleston");
console.log("Selection enabled");

// Test get selection count
console.log("Count:", adapter.selectionManager.getSelectionCount());

// Test disable selection
adapter.selectionManager.disableTileSelection();
console.log("Selection disabled");
```

### Integration Tests (Manual)

1. **Charleston Phase**
   - Start game
   - Verify deal completes
   - Verify Charleston phase starts
   - Verify can select 3 tiles
   - Verify button disabled until 3 selected
   - Verify button enabled when 3 selected
   - Click pass → tiles should be passed

2. **Main Game Loop**
   - Complete Charleston
   - Verify turn starts
   - Verify tile drawn from wall
   - Verify can select 1 tile to discard
   - Click discard → tile should move to center

3. **State Transitions**
   - Verify buttons update correctly
   - Verify selection mode changes
   - Verify no console errors

---

## Section 9: Success Criteria

- [x] SelectionManager instance created in PhaserAdapter
- [x] HandRenderer instance created in PhaserAdapter
- [ ] `onCharlestonPhase` enables tile selection
- [ ] `onHandUpdated` clears invalid selections
- [ ] `onStateChanged` manages selection state
- [ ] No console errors during Charleston
- [ ] No console errors during main game loop
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)

---

## Section 10: Summary

**Current Status:** PhaserAdapter is 90% complete. Most handlers work correctly.

**What's Missing:**

1. SelectionManager instance (5 minutes to add)
2. HandRenderer instance (5 minutes to add)
3. Enhanced `onCharlestonPhase` (5 minutes)
4. Enhanced `onHandUpdated` (10 minutes)
5. Enhanced `onStateChanged` (10 minutes)

**Estimated Time to Complete:** 35 minutes

**Risk Level:** Low - Changes are additive and don't modify working code.

**Next Steps:**

1. Add manager imports
2. Create manager instances in constructor
3. Enhance event handlers
4. Test Charleston flow
5. Test main game flow
6. Commit changes
