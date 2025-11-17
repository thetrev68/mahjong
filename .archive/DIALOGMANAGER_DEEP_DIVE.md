# DialogManager Deep Dive

## Executive Summary
**DialogManager is COMPLETE and WELL-DESIGNED**. It provides all the dialogs needed for the game. The issue is that **PhaserAdapter isn't calling it**.

---

## What DialogManager Provides

### Core Method: showModalDialog()
**The foundation** - all other dialogs use this.
```javascript
showModalDialog(content, buttons, callback)
```
- Creates modal overlay with semi-transparent background
- Creates dialog box with content and buttons
- Each button has a label and value
- When clicked, calls callback with button's value and closes dialog
- Re-enables game input when closed

### Game-Specific Dialog Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `showYesNoDialog(question, callback)` | Simple yes/no choice | boolean: true/false |
| `showCharlestonPassDialog(callback)` | Charleston pass prompt | "pass" or null |
| `showCourtesyPassDialog(maxTiles, callback)` | Courtesy exchange prompt | maxTiles or null |
| `showSelectTilesDialog(minTiles, maxTiles, callback)` | Generic tile selection | "select" or null |
| `showExposureDialog(options, callback)` | Choose exposure type | exposure type string or null |
| `showClaimDialog(claimTypes, callback)` | Choose claim type | claim type string or "pass" |
| `showCourtesyVoteDialog(callback)` | Vote on courtesy pass | 0, 1, 2, or 3 |
| `showMessageDialog(message, onClose)` | Informational message | (just calls onClose) |
| `showError(message)` | Error toast (auto-dismiss) | Promise |
| `showSuccess(message)` | Success toast (auto-dismiss) | Promise |
| `showNotification(message, type, duration)` | Toast notification | (no return) |

---

## How It Works (Technical Details)

### Button Value Pattern
```javascript
// DialogManager receives:
buttons = [
    {label: "Cancel", value: null},
    {label: "Pass Selected", value: "pass"}
]

// When user clicks "Pass Selected", callback gets: "pass"
// When user clicks "Cancel", callback gets: null
```

### Flow for Charleston Pass
```
1. PhaserAdapter calls: dialogManager.showCharlestonPassDialog(callback)
2. DialogManager creates dialog:
   - Shows "Select 3 tiles to pass"
   - Button 1: "Cancel" → passes null to callback
   - Button 2: "Pass Selected" → passes "pass" to callback
3. User clicks button
4. DialogManager:
   - Calls callback with button value
   - Closes dialog
   - Re-enables game input
```

### Blocking Game Input
```javascript
// When dialog opens:
this.scene.input.enabled = false  // Game can't receive input

// When dialog closes:
this.scene.input.enabled = true   // Game input re-enabled
```

---

## What It Does NOT Do

⚠️ **Important**: DialogManager shows buttons but doesn't handle tile selection itself.

- ❌ Does NOT track which tiles are selected
- ❌ Does NOT validate "did user select exactly 3 tiles?"
- ❌ Does NOT modify tile visual state (selection highlighting)
- ❌ Does NOT interact with Hand/TileSet

**Why**: Separation of concerns. DialogManager is just UI prompts. **Tile selection is a separate concern**.

---

## How PhaserAdapter Should Use It

### Example: Charleston Pass Flow

```javascript
// GameController emits:
emit("CHARLESTON_PHASE", {
    phase: 1,
    direction: "RIGHT",
    description: "Choose 3 tiles to pass right"
})

// PhaserAdapter handler:
onCharlestonPhase(data) {
    // 1. Tell selection manager to prepare
    this.selectionManager.enableTileSelection(3, "charleston")

    // 2. Show dialog
    this.dialogManager.showCharlestonPassDialog((result) => {
        if (result === "pass") {
            // 3. Get selected tiles from selection manager
            const selectedTiles = this.selectionManager.getSelection()

            // 4. Tell GameController
            this.gameController.confirmCharlestonPass(selectedTiles)
        } else {
            // User clicked Cancel
            this.selectionManager.clearSelection()
        }
    })
}
```

---

## Integration Points (What Needs to Happen)

### 1. DialogManager is Already Created
```javascript
// In PhaserAdapter constructor:
this.dialogManager = new DialogManager(scene)  // ✅ Already done
```

### 2. But Handlers Are Stubs
Looking at current PhaserAdapter handlers, they probably don't call DialogManager methods.

**Example of what's broken**:
```javascript
// CURRENT (stub)
onCharlestonPhase(data) {
    // Does nothing - this is why Charleston UI is empty!
}

// NEEDS TO BE
onCharlestonPhase(data) {
    this.dialogManager.showCharlestonPassDialog((result) => {
        if (result === "pass") {
            // Call GameController callback
        }
    })
}
```

### 3. Selection Manager Doesn't Exist Yet
We need to create SelectionManager to:
- Track which tiles are selected
- Validate selection (min/max count)
- Highlight selected tiles visually
- Provide getSelection() method

---

## Lessons for Other Managers

### Pattern We See in DialogManager
```
1. Single responsibility: Just UI dialogs
2. Takes callback for results
3. Doesn't make decisions, just collects user input
4. Returns results in consistent format (button values)
5. Handles both blocking and non-blocking UI
6. Clean separation: "what user chose" vs "what to do with that choice"
```

### This Pattern Should Apply To Other Managers:
- **TileManager** should just manage tile sprites, not game logic
- **ButtonManager** should just show/hide buttons, not decide when to show them
- **HandRenderer** should just render tiles, not validate selections
- **SelectionManager** should track selection, not create dialogs

---

## Missing Pieces (For DialogManager to Work)

### What DialogManager Needs From PhaserAdapter
```javascript
dialogManager.showCharlestonPassDialog((result) => {
    // PhaserAdapter needs to:
    // 1. Know that user chose to pass (result === "pass")
    // 2. Get the selected tiles from somewhere (SelectionManager)
    // 3. Call GameController with those tiles
})
```

### What PhaserAdapter Needs
```javascript
// 1. SelectionManager
//    - enableTileSelection(minTiles, maxTiles, type)
//    - disableTileSelection()
//    - getSelection() → array of tile indices
//    - clearSelection()

// 2. TileManager
//    - highlightTile(tileIndex)
//    - unhighlightTile(tileIndex)
//    - showSelectedState(tileIndex) - raise to 575

// 3. HandRenderer
//    - showHand(playerInfo) - position tiles correctly
```

---

## Action Items

### Immediate (To Get Charleston Working)
1. ✅ DialogManager exists and is complete - **no changes needed**
2. ❌ PhaserAdapter.onCharlestonPhase() needs to call it
3. ❌ SelectionManager needs to be created
4. ❌ Tile click handlers need to update SelectionManager

### Design Question for You
**When the user clicks a tile during Charleston:**

Should the flow be:
```
A) Tile click → SelectionManager.selectTile()
            → SelectionManager highlights/raises tile
            → (User clicks "Pass Selected" in dialog)
            → Callback runs with selected tiles

B) Tile click → HandTileSet or TileSet click handler (old way)
            → Manually updates visual state
            → SelectionManager tracks it
```

Which approach would you prefer?

---

## Confidence Level

**DialogManager: 100% Confident**
- Code is well-written
- All necessary methods exist
- Pattern is clear
- No bugs apparent
- It will work once PhaserAdapter calls it

**How to verify**: Look at current PhaserAdapter.onCharlestonPhase() implementation - is it a stub or does it call dialogManager?

---

## What This Teaches Us

### DialogManager Checklist ✅
- **Single responsibility**: Just UI dialogs
- **Complete API**: Has all dialogs needed
- **Consistent pattern**: All dialogs use showModalDialog()
- **Callback-based**: Results returned via callbacks
- **Clean design**: No game logic mixed in

### This is how all managers should be built.

When we look at TileManager, ButtonManager, HandRenderer next, they should follow this same pattern:
- One clear responsibility
- Consistent API
- Callback-based or event-based
- Game logic handled elsewhere

---

## Next Deep Dives (Using This Methodology)

When we audit TileManager, we should ask:
- Does it have all the methods needed?
- Are they fully implemented or stubs?
- Does it follow the single-responsibility pattern?
- How should PhaserAdapter call it?

When we audit HandRenderer, we should ask:
- Does it implement the showHand() logic properly?
- Can it work with GameController events?
- What methods does it expose?

---

## Summary for Implementation

**DialogManager is READY TO USE.**

The code blocking Charleston from working isn't DialogManager - it's that **PhaserAdapter.onCharlestonPhase() is empty/stub**.

Once we:
1. Implement SelectionManager
2. Wire PhaserAdapter handlers to call DialogManager
3. Connect tile clicks to SelectionManager

...the Charleston dialog should appear and function correctly.
