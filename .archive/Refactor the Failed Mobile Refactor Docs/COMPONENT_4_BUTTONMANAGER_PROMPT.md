# Component 4: ButtonManager Integration

**Goal**: Wire up the ButtonManager to properly update button states and handle user interactions throughout all game phases.

**Status**: ButtonManager class exists with comprehensive state-based button logic. Now needs integration with PhaserAdapter and GameController to complete the UI feedback loop.

**Time Estimate**: 1-2 hours

---

## Critical Discovery: What Exists vs. What's Needed

### Already Implemented ✅

The [ButtonManager.js](desktop/managers/ButtonManager.js) class has:

- ✅ State-based button visibility (`updateForState()` with all STATE cases)
- ✅ Button text updates for each game phase
- ✅ Enable/disable button logic
- ✅ Callback registration system
- ✅ Click event handlers for all buttons
- ✅ Comprehensive methods for each game state

### What Needs Integration ⚠️

1. **PhaserAdapter must call ButtonManager** during state changes
2. **SelectionManager must enable/disable buttons** based on selection validity
3. **GameController callbacks must be properly wired** to button actions
4. **Button states must update dynamically** based on game conditions

---

## Understanding the Button Architecture

### Button Types in the Game

The game has **8 buttons** defined in [index.html](index.html):

```html
<!-- Game action buttons -->
<button id="button1">Button 1</button>
<button id="button2">Button 2</button>
<button id="button3">Button 3</button>
<button id="button4">Button 4</button>

<!-- Start/Settings -->
<button id="start">Start Game</button>
<button id="settings">⚙</button>

<!-- Sort buttons -->
<button id="sort1">Sort by Suit</button>
<button id="sort2">Sort by Rank</button>
```

### Button Behavior by Game State

| State                        | Visible Buttons                         | Button Text                               | Enabled Conditions            |
| ---------------------------- | --------------------------------------- | ----------------------------------------- | ----------------------------- |
| **INIT/START**               | start, settings                         | "Start Game", "⚙"                         | Always enabled                |
| **DEAL**                     | sort1, sort2                            | "Sort by Suit", "Sort by Rank"            | Always enabled                |
| **CHARLESTON1/2**            | button1                                 | "Pass Tiles"                              | Enabled when 3 tiles selected |
| **CHARLESTON_QUERY**         | button1, button2                        | "No", "Yes"                               | Always enabled                |
| **COURTESY_QUERY**           | button1-4                               | "0 Tiles", "1 Tile", "2 Tiles", "3 Tiles" | Always enabled                |
| **COURTESY**                 | button1                                 | "Exchange Tiles"                          | Enabled when tiles selected   |
| **LOOP_PICK_FROM_WALL**      | (none)                                  | -                                         | Auto-proceeds                 |
| **LOOP_CHOOSE_DISCARD**      | button1, button2, button3, sort1, sort2 | "Discard", "Exchange Joker", "Mahjong!"   | Conditional                   |
| **LOOP_QUERY_CLAIM_DISCARD** | button1-4                               | "Claim", "Pung", "Kong", "Pass"           | Context-dependent             |
| **LOOP_EXPOSE_TILES**        | button1, button2                        | "Select Exposure", "Skip"                 | Always enabled                |
| **END**                      | start, button1                          | "Start New Game", "View Results"          | Always enabled                |

---

## Step 1: Wire ButtonManager to PhaserAdapter (30 min)

### 1a. Check Current Integration

Look at [PhaserAdapter.js](desktop/adapters/PhaserAdapter.js) constructor to verify ButtonManager is instantiated:

```javascript
constructor(gameController, scene, table) {
    // ...
    this.buttonManager = new ButtonManager(scene, gameController);
}
```

**If not present**: Add ButtonManager instantiation.

---

### 1b. Add State Change Handler

In PhaserAdapter, ensure `onStateChanged` event calls ButtonManager:

**Location**: [PhaserAdapter.js](desktop/adapters/PhaserAdapter.js) `onStateChanged()` method

**Current (likely stub)**:

```javascript
onStateChanged(data) {
    const {newState} = data;
    printMessage(`State changed to: ${newState}`);
}
```

**Should be**:

```javascript
onStateChanged(data) {
    const {newState} = data;
    printMessage(`State changed to: ${newState}`);

    // Update button visibility and callbacks for new state
    this.buttonManager.updateForState(newState);
}
```

---

### 1c. Verify Event Listener Setup

ButtonManager constructor sets up click listeners:

```javascript
setupButtonListeners() {
    Object.entries(this.buttons).forEach(([id, btn]) => {
        if (btn) {
            btn.addEventListener("click", () => this.onButtonClicked(id));
        }
    });
}
```

**Verify**: Check browser console that buttons are clickable and `onButtonClicked` fires.

**Test**:

```javascript
// In browser console during game:
document.getElementById("button1").click();
// Should log button click or trigger callback
```

---

## Step 2: Integrate SelectionManager with ButtonManager (30 min)

### 2a. Enable "Pass Tiles" Button During Charleston

During Charleston, the "Pass Tiles" button should only be enabled when exactly 3 tiles are selected.

**Location**: [SelectionManager.js](desktop/managers/SelectionManager.js)

**In `toggleTile()` method**, after updating selection:

```javascript
toggleTile(tile) {
    // ... existing toggle logic ...

    // Update button state based on selection validity
    this.updateButtonState();
}
```

**Add new method to SelectionManager**:

```javascript
/**
 * Update button state based on current selection validity
 */
updateButtonState() {
    if (!this.buttonManager) {
        return; // ButtonManager not set
    }

    const isValid = this.isValidSelection();

    // Enable/disable the pass button based on selection count
    if (this.mode === "charleston") {
        if (isValid) {
            this.buttonManager.enableButton("button1");
        } else {
            this.buttonManager.disableButton("button1");
        }
    } else if (this.mode === "courtesy") {
        // Courtesy allows 0-3 tiles, always valid
        this.buttonManager.enableButton("button1");
    }
}
```

**In SelectionManager constructor**, accept ButtonManager:

```javascript
constructor(scene, table, buttonManager = null) {
    this.scene = scene;
    this.table = table;
    this.buttonManager = buttonManager; // Store reference
    // ... rest of constructor
}
```

**In PhaserAdapter constructor**, pass ButtonManager to SelectionManager:

```javascript
this.selectionManager = new SelectionManager(scene, table, this.buttonManager);
```

---

### 2b. Enable "Discard" Button During Main Loop

During discard phase, "Discard" button enabled when tile selected.

**Location**: Hand tile click handlers in [gameObjects_hand.js](desktop/gameObjects/gameObjects_hand.js)

**Pattern from 07c41b9**:

```javascript
// When human player clicks a tile to discard
onTileClickedForDiscard(tile) {
    // Deselect previous
    if (this.selectedDiscardTile) {
        this.selectedDiscardTile.sprite.y = this.origY;
    }

    // Select new tile
    this.selectedDiscardTile = tile;
    tile.sprite.y = this.origY - 25; // Raise tile

    // Enable discard button
    if (this.buttonManager) {
        this.buttonManager.enableButton("button1");
    }
}
```

**Implementation**: This may already be handled by SelectionManager or Hand class. Verify during testing.

---

### 2c. Update "Mahjong!" Button Based on Hand Validation

The "Mahjong!" button (button3) should be enabled only when player has a winning hand.

**Location**: [PhaserAdapter.js](desktop/adapters/PhaserAdapter.js) `onTileDrawn()` or hand update methods

**After tile drawn or hand updated**:

```javascript
// Check if human player can mahjong
const humanPlayer = this.table.players[PLAYER.BOTTOM];
const canMahjong = this.gameController.canMahjong(humanPlayer);

if (canMahjong) {
  this.buttonManager.enableButton("button3");
} else {
  this.buttonManager.disableButton("button3");
}
```

---

## Step 3: Wire Button Callbacks to GameController (30 min)

### 3a. Verify GameController Callback Methods Exist

ButtonManager expects these methods on GameController:

```javascript
// From ButtonManager callback registrations:
gameController.startGame()
gameController.onSortHandRequest(type)
gameController.onCharlestonPass()
gameController.onCharlestonContinueQuery(continue)
gameController.onCourtesyVote(tileCount)
gameController.onCourtesyPass()
gameController.onChooseDiscard()
gameController.onExchangeJoker()
gameController.onMahjong()
gameController.onClaimDiscard(type)
gameController.onExposeTiles()
gameController.onSkipExposure()
```

**Check**: Do these methods exist in [GameController.js](core/controllers/GameController.js)?

**If not**: Some may need to be added or renamed. Most critical:

- `startGame()` - should already exist
- `onCharlestonPass()` - may need to trigger dialog/selection flow
- `onChooseDiscard()` - may need to get selected tile and emit TILE_DISCARDED

---

### 3b. Pattern for Button Callbacks

Button callbacks should typically:

1. Get current state from game (selected tiles, player hand, etc.)
2. Call appropriate GameController method
3. GameController emits events back to PhaserAdapter
4. PhaserAdapter updates UI

**Example: Charleston Pass Button**

```javascript
// In ButtonManager.showCharlestonPassButtons():
this.buttonCallbacks.set("button1", () => {
  // Get selected tiles from SelectionManager
  const selectedTiles = this.selectionManager.getSelection();

  // Call GameController with selected tiles
  this.gameController.charlestonPass(selectedTiles);

  // ButtonManager will auto-update when state changes
});
```

**Note**: ButtonManager currently registers simple callbacks. May need to pass SelectionManager reference.

---

### 3c. Update ButtonManager Constructor

ButtonManager needs access to SelectionManager for some callbacks:

```javascript
constructor(scene, gameController, selectionManager = null) {
    this.scene = scene;
    this.gameController = gameController;
    this.selectionManager = selectionManager; // Add this
    // ... rest of constructor
}
```

**Update callback registrations** to use SelectionManager:

```javascript
showCharlestonPassButtons() {
    this.show(["button1"]);
    // ...

    this.buttonCallbacks.set("button1", () => {
        if (this.selectionManager) {
            const selectedTiles = this.selectionManager.getSelection();
            this.gameController.charlestonPass(selectedTiles);
        }
    });
}
```

**In PhaserAdapter**, update ButtonManager instantiation:

```javascript
// Create SelectionManager first
this.selectionManager = new SelectionManager(scene, table);

// Then create ButtonManager with SelectionManager reference
this.buttonManager = new ButtonManager(
  scene,
  gameController,
  this.selectionManager,
);

// Then pass ButtonManager to SelectionManager
this.selectionManager.setButtonManager(this.buttonManager);
```

---

## Step 4: Test Button Integration (30 min)

### Test 4.1: State Transitions Update Buttons (10 min)

**Test Procedure**:

1. Start game
2. Observe button changes at each state transition
3. Verify correct buttons visible for each state

**Expected Behavior**:

- ✅ START state: "Start Game" and "Settings" visible
- ✅ DEAL state: "Sort by Suit" and "Sort by Rank" visible
- ✅ CHARLESTON1: "Pass Tiles" visible but disabled
- ✅ After selecting 3 tiles: "Pass Tiles" enabled
- ✅ CHARLESTON_QUERY: "No" and "Yes" buttons visible
- ✅ And so on for all states...

**Debug**:

```javascript
// In browser console:
console.log("Current state:", gameController.state);
console.log(
  "Visible buttons:",
  Array.from(document.querySelectorAll("button"))
    .filter((b) => b.style.display !== "none")
    .map((b) => b.id),
);
```

---

### Test 4.2: Selection Enables/Disables Buttons (10 min)

**Test Procedure**:

1. During Charleston, click tiles to select them
2. Observe "Pass Tiles" button enable state

**Expected Behavior**:

- ✅ 0 tiles selected: "Pass Tiles" disabled
- ✅ 1 tile selected: "Pass Tiles" disabled
- ✅ 2 tiles selected: "Pass Tiles" disabled
- ✅ 3 tiles selected: "Pass Tiles" **enabled**
- ✅ Deselecting a tile: "Pass Tiles" disabled again

**Debug**:

```javascript
// Check button state:
console.log("Button1 disabled:", document.getElementById("button1").disabled);
console.log("Selected count:", selectionManager.getSelectionCount());
```

---

### Test 4.3: Button Clicks Trigger Actions (10 min)

**Test Procedure**:

1. Click "Pass Tiles" button after selecting 3 tiles
2. Verify tiles are passed and game progresses
3. Click "No" at Charleston query
4. Verify Charleston phase ends

**Expected Behavior**:

- ✅ "Pass Tiles" click → tiles animate away, new tiles received
- ✅ "No" click → skip to next phase
- ✅ "Yes" click → continue Charleston
- ✅ "Discard" click → tile moves to discard pile

**Debug**:

```javascript
// Add logging to button callbacks:
this.buttonCallbacks.set("button1", () => {
  console.log("Button1 clicked, callback fired");
  // ... rest of callback
});
```

---

## Implementation Checklist

### Phase 1: Basic Integration (30 min)

- [ ] Verify ButtonManager instantiated in PhaserAdapter constructor
- [ ] Add `buttonManager.updateForState(newState)` to `onStateChanged()`
- [ ] Test that buttons change visibility when state changes
- [ ] Verify button click events fire (check browser console)

### Phase 2: Selection Integration (30 min)

- [ ] Pass ButtonManager to SelectionManager constructor
- [ ] Add `updateButtonState()` method to SelectionManager
- [ ] Call `updateButtonState()` after tile selection changes
- [ ] Test "Pass Tiles" button enables when 3 tiles selected

### Phase 3: Callback Wiring (30 min)

- [ ] Pass SelectionManager to ButtonManager constructor
- [ ] Update Charleston button callback to get selected tiles
- [ ] Update Discard button callback to get selected tile
- [ ] Update Mahjong button to check hand validity
- [ ] Verify all callbacks route to correct GameController methods

### Phase 4: Testing (30 min)

- [ ] Test state transitions update buttons correctly
- [ ] Test selection count enables/disables buttons
- [ ] Test button clicks trigger game actions
- [ ] Test all game phases have correct button behavior
- [ ] No console errors during gameplay

---

## Expected Outcome

After completing Component 4:

1. ✅ Buttons automatically show/hide based on game state
2. ✅ Button text updates to reflect current action
3. ✅ Buttons enable/disable based on game conditions (selection count, hand validity)
4. ✅ Button clicks properly trigger game actions via GameController
5. ✅ Clean separation: ButtonManager handles UI, GameController handles logic

**Next Component**: Component 5 - End-to-end testing and debugging

---

## Common Pitfalls

### ❌ Don't: Directly manipulate buttons from GameController

```javascript
// WRONG - GameController shouldn't know about DOM
document.getElementById("button1").disabled = false;
```

### ✅ Do: Use ButtonManager API

```javascript
// CORRECT - ButtonManager handles DOM manipulation
buttonManager.enableButton("button1");
```

---

### ❌ Don't: Forget to update button state after selection changes

```javascript
// WRONG - Button stays disabled
toggleTile(tile) {
    // ... update selection ...
    // Missing: updateButtonState()
}
```

### ✅ Do: Always update button state after selection

```javascript
// CORRECT - Button enables when valid
toggleTile(tile) {
    // ... update selection ...
    this.updateButtonState(); // Add this
}
```

---

### ❌ Don't: Register callbacks without checking dependencies

```javascript
// WRONG - selectionManager might be null
this.buttonCallbacks.set("button1", () => {
  const tiles = this.selectionManager.getSelection(); // Crash!
});
```

### ✅ Do: Check dependencies before using

```javascript
// CORRECT - Defensive check
this.buttonCallbacks.set("button1", () => {
  if (this.selectionManager) {
    const tiles = this.selectionManager.getSelection();
    this.gameController.charlestonPass(tiles);
  }
});
```

---

## Architecture Notes

### Why ButtonManager Works

1. **State-Driven**: Buttons update automatically on state transitions
2. **Centralized**: All button logic in one place, not scattered
3. **Declarative**: Each state declares what buttons should look like
4. **Testable**: Can test button states without running full game
5. **Maintainable**: Adding new button is one method in ButtonManager

### Button Event Flow

```
User clicks button
    ↓
DOM click event fires
    ↓
ButtonManager.onButtonClicked(buttonId)
    ↓
Look up callback in buttonCallbacks Map
    ↓
Execute callback
    ↓
Callback gets data from SelectionManager/Hand
    ↓
Callback calls GameController method
    ↓
GameController updates game state
    ↓
GameController emits STATE_CHANGED event
    ↓
PhaserAdapter.onStateChanged()
    ↓
ButtonManager.updateForState(newState)
    ↓
Buttons updated for new state (loop complete)
```

---

## Quick Reference

### ButtonManager API

```javascript
// Update for new state
buttonManager.updateForState(STATE.CHARLESTON1);

// Show/hide buttons
buttonManager.show(["button1", "button2"]);
buttonManager.hide(["button3", "button4"]);

// Set button text
buttonManager.setText("button1", "Pass Tiles");

// Enable/disable buttons
buttonManager.enableButton("button1");
buttonManager.disableButton("button1");

// Register custom callback
buttonManager.registerCallback("button1", () => {
  console.log("Custom action");
});
```

### SelectionManager Integration

```javascript
// In SelectionManager:
updateButtonState() {
    const isValid = this.isValidSelection();
    if (isValid) {
        this.buttonManager.enableButton("button1");
    } else {
        this.buttonManager.disableButton("button1");
    }
}
```

### Common Button IDs

- `button1` - Primary action (Pass, Discard, Claim, etc.)
- `button2` - Secondary action (Yes/No, Pung, Exchange)
- `button3` - Tertiary action (Kong, Mahjong)
- `button4` - Quaternary action (Pass, 3 Tiles)
- `start` - Start/Restart game
- `settings` - Open settings overlay
- `sort1` - Sort by Suit
- `sort2` - Sort by Rank
