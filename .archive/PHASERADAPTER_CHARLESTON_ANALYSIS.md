# PhaserAdapter Charleston Analysis

## The Problem

Charleston UI is empty because the wrong handler is being called.

## Two Different Events (Different Purposes)

### Event 1: STATE_CHANGED to CHARLESTON_PHASE
**Current handler:**
```javascript
onCharlestonPhase(data) {
    const {phase, passCount, direction} = data;
    printMessage(`Charleston Phase ${phase}, Pass ${passCount}: Pass ${direction}`);
    // ❌ Just prints, does nothing else
}
```

**What it should do:**
- Announce the Charleston phase (✅ does this)
- Maybe set up the UI for selection
- But NOT show the dialog

**Why it only prints**: This is announcing the phase, not requesting user action.

---

### Event 2: UI_PROMPT with promptType="CHARLESTON_PASS"
**Current handler:**
```javascript
handleCharlestonPassPrompt(options, callback) {
    const {direction, requiredCount} = options;
    const player = this.table.players[PLAYER.BOTTOM];

    printInfo(`Choose ${requiredCount} tiles to pass ${direction}`);

    this.dialogManager.showCharlestonPassDialog((result) => {
        const selection = player.hand.hiddenTileSet.getSelection();

        if (result === "pass" && selection.length === requiredCount) {
            // Valid selection: convert and return tiles
            const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
            player.hand.hiddenTileSet.resetSelection();
            if (callback) callback(tileDatas);
        } else {
            // Invalid selection or cancelled: reset and return empty array
            player.hand.hiddenTileSet.resetSelection();
            if (callback) callback([]);
        }
    });
}
```

**What it does:**
- ✅ Shows the dialog
- ✅ Calls DialogManager correctly
- ✅ Handles the callback

**But has a problem:**
- ❌ Calls `player.hand.hiddenTileSet.getSelection()` - assumes this method exists and tracks selection
- ❌ But if tiles aren't being selected (just clicked), this will return empty array
- ❌ So even if dialog appears, passing won't work

---

## The Real Issue Chain

### Issue #1: Charleston Dialog Not Appearing
**Why**: GameController might not be emitting the UI_PROMPT event for Charleston.

**Check needed**: Look at GameController to see what events it emits during Charleston phase.

### Issue #2: Tile Selection Not Working
**Why**: Clicking a tile either:
- A) Doesn't update any selection tracker
- B) Updates the old Hand.js selection system, not something DialogManager can read
- C) Discards immediately instead of selecting

**Current code assumes**: `player.hand.hiddenTileSet.getSelection()` exists and works

**But probably**: That method doesn't work correctly, or selection state isn't being tracked properly.

---

## What Should Happen (Correct Flow)

### Step 1: GameController Announces Charleston Phase
```javascript
// GameController emits:
emit("CHARLESTON_PHASE", {
    phase: 1,
    direction: "RIGHT",
    description: "Choose 3 tiles to pass right"
})
```

### Step 2: PhaserAdapter Enables Tile Selection
```javascript
// PhaserAdapter.onCharlestonPhase():
onCharlestonPhase(data) {
    printMessage(`Charleston Phase ${data.phase}, Pass ...`)

    // Enable tile selection mode
    this.selectionManager.enableTileSelection(3, "charleston")
    // OR
    this.handRenderer.enableTileSelection(3)

    // Visual feedback: show instructions or highlight hand
}
```

### Step 3: GameController Requests Selection via UI_PROMPT
```javascript
// GameController emits:
emit("UI_PROMPT", {
    promptType: "CHARLESTON_PASS",
    options: { direction: "RIGHT", requiredCount: 3 },
    callback: (selectedTiles) => { ... }
})
```

### Step 4: PhaserAdapter Shows Dialog
```javascript
// PhaserAdapter.onUIPrompt() routes to handler:
handleCharlestonPassPrompt(options, callback) {
    // Dialog appears
    this.dialogManager.showCharlestonPassDialog((result) => {
        if (result === "pass") {
            // Get selected tiles
            const selectedTiles = this.selectionManager.getSelection()
            callback(selectedTiles)
        } else {
            callback([])
        }
    })
}
```

### Step 5: User Clicks Pass Button in Dialog
```javascript
// DialogManager callback fires with "pass"
// handleCharlestonPassPrompt gets the selected tiles
// Calls callback with tiles
// GameController receives them and continues
```

---

## The Missing Link: SelectionManager

**Current code tries**:
```javascript
const selection = player.hand.hiddenTileSet.getSelection()
```

**Problem**: This might not exist or might not work correctly.

**What we need**:
```javascript
// A SelectionManager that tracks:
// - Which tiles are selected
// - Highlights them visually (raise position 575)
// - Validates min/max counts
// - Provides getSelection() method

const selection = this.selectionManager.getSelection()
```

---

## Tile Selection Mechanisms (Need to Choose One)

### Option A: Reuse Old Hand System
If `hand.hiddenTileSet.getSelection()` works:
- Modify it to track selected tiles properly
- Tile clicks add/remove from selection
- Visual state (raising tile) handled by hand
- **PhaserAdapter just reads the selection**

### Option B: New SelectionManager
Create separate manager:
- Tracks selection independently
- Tile clicks call selectionManager.toggle(tileIndex)
- Visual feedback handled by TileRenderer
- **PhaserAdapter and Hand sync to SelectionManager**

### Option C: Hybrid
- Hand manages old visual state (raising tiles)
- SelectionManager tracks which tiles are selected
- Hand and SelectionManager stay in sync
- **Best of both worlds but requires coordination**

---

## What Needs Investigation

### Questions to Answer

1. **Does player.hand.hiddenTileSet.getSelection() exist?**
   - Check gameObjects_hand.js TileSet class
   - What does it do?
   - Is it being called?

2. **How did the old GameLogic handle Charleston tile selection?**
   - Look at commit 07c41b9
   - What was the flow for selecting tiles?
   - How did tiles visually change when selected?

3. **Is GameController emitting UI_PROMPT events?**
   - Or is it not reaching PhaserAdapter at all?
   - Check GameController.charlestonPhase() flow

4. **What happens when you click a tile right now?**
   - What method gets called?
   - What does it do?
   - Where does execution go?

---

## Charleston Dialog Appearance Summary

| Condition | Currently | Should Be |
|-----------|-----------|-----------|
| Phase announced | ✅ (prints) | ✅ (works) |
| Dialog shows | ❌ (handler not called?) | ✅ (call dialogManager) |
| Tiles selectable | ❌ (clicks discard) | ✅ (raise position 575) |
| Pass button works | ❌ (no selection) | ✅ (send selected tiles) |

---

## Immediate Investigation Needed

Before we can implement SelectionManager, we need to know:

1. **Is GameController actually emitting UI_PROMPT for Charleston?**
   - If yes: Why isn't handleCharlestonPassPrompt being called?
   - If no: We need to add it to GameController

2. **How should tile selection work?**
   - Reuse old Hand system?
   - Create new SelectionManager?
   - Something else?

3. **What's the exact flow in the old GameLogic?**
   - Refer back to commit 07c41b9
   - See exactly how Charleston was handled

---

## For Trevor

**Key insight**: DialogManager is perfectly fine. The problem is:
1. Either GameController isn't emitting the right event
2. Or PhaserAdapter isn't wired to receive it
3. Or the tile selection system is completely broken

**Next step**: We need to trace the Charleston flow in GameController to see:
- What events are being emitted
- In what order
- With what data
- Are they reaching PhaserAdapter?

Once we know that, we'll know exactly what to fix.
