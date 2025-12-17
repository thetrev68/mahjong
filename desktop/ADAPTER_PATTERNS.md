# PhaserAdapter Prompt Handling Patterns

This document describes the architectural patterns used in `PhaserAdapter.js` for handling user prompts during gameplay. Understanding these patterns is critical before making changes to the adapter or manager classes.

## Overview

The PhaserAdapter acts as a **messenger** between the platform-agnostic `GameController` (core/) and the Phaser-specific desktop rendering stack. When the game needs user input, GameController emits a `UI_PROMPT` event which PhaserAdapter routes to specialized handler methods.

## Pattern A: Selection-Based Prompts

**When to use:** User must SELECT tiles from their hand before confirming an action.

**Examples:** Charleston pass, Discard selection, Courtesy pass

### Flow

1. **GameController** emits `UI_PROMPT` with `promptType` + `options` + `callback`
2. **PhaserAdapter.onUIPrompt()** routes to appropriate handler (e.g., `handleCharlestonPassPrompt()`)
3. **Handler** calls `SelectionManager.enableTileSelection(min, max, mode)`
4. **User** clicks tiles → `SelectionManager` provides visual feedback (tiles raise up)
5. **SelectionManager** auto-enables/disables button based on selection validity
6. **Handler** registers `ButtonManager` callback for confirm button
7. **User** clicks confirm → callback validates selection count
8. **Handler** converts `Tile[]` → `TileData[]` and invokes GameController callback
9. **SelectionManager** clears selection and disables tile selection

### Code Example (Charleston Pass)

```javascript
handleCharlestonPassPrompt(options, callback) {
    const {direction, requiredCount} = options;

    printInfo(`Select ${requiredCount} tiles to pass ${direction}`);

    // Step 1: Enable tile selection mode
    this.selectionManager.enableTileSelection(requiredCount, requiredCount, "charleston");

    // Step 2: Wire confirm button
    this.buttonManager.registerCallback("button1", () => {
        const selection = this.selectionManager.getSelection();

        if (selection.length === requiredCount) {
            // Valid selection - convert and return
            const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
            this.selectionManager.clearSelection();
            this.selectionManager.disableTileSelection();
            if (callback) callback(tileDatas);
        } else {
            // Invalid - show error
            printInfo(`Please select exactly ${requiredCount} tiles`);
        }
    });

    // Step 3: Auto-update button state on selection changes
    this.selectionManager.onSelectionChanged = () => {
        if (this.selectionManager.getSelectionCount() === requiredCount) {
            this.buttonManager.enableButton("button1");
        } else {
            this.buttonManager.disableButton("button1");
        }
    };
}
```

### Key Components

- **SelectionManager:** Tracks which tiles are selected, validates mode-specific rules
- **ButtonManager:** Shows/hides/enables confirm button based on selection state
- **TileData conversion:** `TileData.fromPhaserTile()` converts Phaser sprites back to data

### Validation Modes

SelectionManager supports different validation rules per mode:

- `"charleston"`: Cannot select jokers or blanks, exactly 3 tiles
- `"courtesy"`: Cannot select jokers or blanks, 1-3 tiles
- `"play"`: Any tile, exactly 1 tile
- `"expose"`: Must match discarded tile or be joker

---

## Pattern B: Button-Based Prompts

**When to use:** User chooses from predefined options (no tile selection needed).

**Examples:** Claim discard (Mahjong/Pung/Kong/Pass)

### Flow

1. **GameController** emits `UI_PROMPT` with available options
2. **PhaserAdapter.onUIPrompt()** routes to handler (e.g., `handleClaimPrompt()`)
3. **ButtonManager** shows appropriate buttons (via `updateForState()` in `onStateChanged`)
4. **Handler** registers callback for each button option
5. **User** clicks button → immediately invokes GameController callback with choice
6. No selection state, no validation needed - just button → callback

### Code Example (Claim Discard)

```javascript
handleClaimPrompt(options, callback) {
    const {discardedTile} = options;

    printInfo(`Claim ${discardedTile ? discardedTile.getText() : "this discard"}?`);

    // Wire each button to its corresponding action
    this.buttonManager.registerCallback("button1", () => {
        if (callback) callback("Mahjong");
    });

    this.buttonManager.registerCallback("button2", () => {
        if (callback) callback("Pung");
    });

    this.buttonManager.registerCallback("button3", () => {
        if (callback) callback("Kong");
    });

    this.buttonManager.registerCallback("button4", () => {
        if (callback) callback("Pass");
    });
}
```

### Why This Pattern?

- **Simpler:** No selection state to manage
- **Immediate:** Button click directly triggers game logic
- **Debugged:** This pattern was recently debugged by Codex and works correctly
- **Don't break it:** Claim prompts are critical path - don't refactor without extensive testing

### Key Components

- **ButtonManager:** Handles all button visibility, text, and callbacks
- **No SelectionManager needed:** User isn't selecting tiles

---

## Pattern C: Dialog-Based Prompts (Modal Overlays)

**When to use:** For prompts that should appear as modal overlays separate from the game board.

**Examples:** Courtesy vote, Yes/No questions

### Flow

1. **GameController** emits `UI_PROMPT`
2. **PhaserAdapter.onUIPrompt()** routes to handler
3. **Handler** calls `DialogManager.showXxxDialog()`
4. **DialogManager** creates DOM overlay with buttons
5. **User** clicks dialog button → DialogManager resolves callback
6. **DialogManager** removes overlay and re-enables game input

### Code Example (Courtesy Vote)

```javascript
handleCourtesyVotePrompt(callback) {
    this.dialogManager.showCourtesyVoteDialog((result) => {
        if (callback) callback(result);
    });
}
```

### When to Use Dialog vs Buttons?

- **Dialog pattern:** Best for interrupting gameplay (yes/no decisions, votes)
- **Button pattern:** Best for in-flow gameplay (claim, discard)
- **Selection pattern:** Required when user must select tiles

### Key Components

- **DialogManager:** Creates modal overlays, blocks game input during dialog
- **Promise-based:** DialogManager methods return promises or use callbacks

---

## Pattern Comparison

| Pattern | Tile Selection? | Button Panel? | Modal Overlay? | Example |
|---------|----------------|---------------|----------------|---------|
| **Pattern A** | ✅ Yes | ✅ Yes | ❌ No | Charleston pass |
| **Pattern B** | ❌ No | ✅ Yes | ❌ No | Claim discard |
| **Pattern C** | ❌ No | ❌ No | ✅ Yes | Courtesy vote |

---

## Design Principles

### 1. PhaserAdapter is a Messenger

The adapter should **route** events to managers, not implement business logic.

**Good:** `this.selectionManager.enableTileSelection(...)`
**Bad:** Inline tile selection loops and validation

### 2. Managers Own Their Concerns

- **SelectionManager:** Tile selection state, validation rules
- **ButtonManager:** Button visibility, enable/disable, text
- **DialogManager:** Modal overlays, user prompts
- **HandRenderer:** Tile positioning, face-up/down rendering

### 3. Don't Break Working Code

If a pattern works (like claim prompts), document it but don't refactor it without:

- A clear UX improvement
- Extensive testing
- Approval from the team

### 4. Prefer Promises for New Code

New prompt handlers should use promise-based APIs when available:

```javascript
// New: Promise-based
const tiles = await selectionManager.requestSelection({min: 3, max: 3, mode: "charleston"});

// Old: Callback-based (still supported)
selectionManager.enableTileSelection(3, 3, "charleston");
buttonManager.registerCallback("button1", () => { ... });
```

---

## Common Pitfalls

### ❌ Forgetting to Clear Selection

```javascript
// BAD - selection state persists
const selection = this.selectionManager.getSelection();
callback(selection);

// GOOD - always clean up
const selection = this.selectionManager.getSelection();
this.selectionManager.clearSelection();
this.selectionManager.disableTileSelection();
callback(selection);
```

### ❌ Mixing Patterns Unnecessarily

```javascript
// BAD - using dialog for tile selection
this.dialogManager.showSelectTilesDialog(...);
const selection = player.hand.getSelection(); // Wrong context!

// GOOD - use SelectionManager for tile selection
this.selectionManager.enableTileSelection(...);
```

### ❌ Direct Hand Manipulation

```javascript
// BAD - adapter shouldn't touch hand state directly
player.hand.setValidationMode("charleston");
player.hand.hiddenTileSet.getSelection();

// GOOD - use SelectionManager
this.selectionManager.enableTileSelection(3, 3, "charleston");
const selection = this.selectionManager.getSelection();
```

---

## Testing Checklist

When modifying prompt handlers, verify:

- [ ] Buttons appear at correct game states
- [ ] Tiles can be selected/deselected with visual feedback
- [ ] Confirm button enables only when selection is valid
- [ ] Clicking confirm passes correct data to GameController
- [ ] Selection state clears after confirmation
- [ ] Game proceeds to next state without errors
- [ ] No console errors or warnings

---

## Future Improvements

See `FUTURE_REFACTORS.md` for documented opportunities to improve these patterns in Phase 3.
