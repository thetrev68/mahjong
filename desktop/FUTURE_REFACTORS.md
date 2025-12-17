# Future Refactoring Opportunities (Phase 3+)

This document catalogues potential improvements to the desktop adapter/manager architecture that are **not critical** for Phase 2 completion but would improve maintainability, consistency, or performance in future phases.

---

## 1. Unify Claim Prompt Pattern

**Current State:**
The `handleClaimPrompt()` method uses Pattern B (Button-Based) with manual `ButtonManager.registerCallback()` calls for each claim option (Mahjong, Pung, Kong, Pass).

```javascript
// Current (Pattern B)
handleClaimPrompt(options, callback) {
    this.buttonManager.registerCallback("button1", () => callback("Mahjong"));
    this.buttonManager.registerCallback("button2", () => callback("Pung"));
    this.buttonManager.registerCallback("button3", () => callback("Kong"));
    this.buttonManager.registerCallback("button4", () => callback("Pass"));
}
```

**Potential Future State:**
Could use `DialogManager.showClaimDialog()` (Pattern C) for consistency with courtesy vote.

```javascript
// Potential (Pattern C)
handleClaimPrompt(options, callback) {
    const {discardedTile, claimTypes = ["Mahjong", "Pung", "Kong"]} = options;
    this.dialogManager.showClaimDialog(claimTypes, (result) => {
        if (callback) callback(result);
    });
}
```

**Considerations:**

- **Risk:** HIGH - Claim flow was recently debugged by Codex and works correctly
- **Benefit:** MEDIUM - Consistency with other prompts, less code
- **UX Impact:** Changes from action panel buttons to modal overlay
- **Priority:** LOW - Only refactor if DialogManager pattern proves more reliable

**Decision:** Leave as-is for Phase 2. Revisit in Phase 3 only if:

1. Users prefer modal dialogs over action panel buttons
2. Button-based pattern causes issues
3. Mobile renderer needs unified dialog approach

---

## 2. Promise-Based Prompt Handlers

**Current State:**
Prompt handlers use callback-based APIs inherited from GameController:

```javascript
// Current: Callback-based
handleCharlestonPassPrompt(options, callback) {
    this.selectionManager.enableTileSelection(...);
    this.buttonManager.registerCallback("button1", () => {
        const selection = this.selectionManager.getSelection();
        callback(selection); // Callback passed from GameController
    });
}
```

**Potential Future State:**
Use async/await with promise-based manager APIs:

```javascript
// Future: Promise-based
async handleCharlestonPassPrompt(options, callback) {
    const selection = await this.selectionManager.requestSelection({
        min: 3, max: 3, mode: "charleston"
    });

    const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
    if (callback) callback(tileDatas);
}
```

**Considerations:**

- **Risk:** MEDIUM - Requires GameController changes to support async handlers
- **Benefit:** HIGH - Cleaner code, easier error handling, better async flow
- **Implementation:** Requires `SelectionManager.requestSelection()` method (added in Phase 2)
- **Priority:** MEDIUM - Good target for Phase 3

**Blockers:**

1. GameController's `promptUI()` method must support async callbacks
2. Need to ensure promise rejections are handled (user cancels, timeout, etc.)
3. State machine must wait for promise resolution before advancing

**Next Steps:**

1. Add `requestSelection()` to SelectionManager (Phase 2) ✅
2. Test with ONE handler (e.g., discard) in controlled environment
3. If successful, gradually migrate other handlers
4. Update GameController to properly handle async prompt callbacks

---

## 3. Extract TileData Conversion Helper

**Current State:**
Multiple handlers duplicate the `TileData.fromPhaserTile()` conversion:

```javascript
// Duplicated in handleCharlestonPassPrompt
const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));

// Duplicated in handleDiscardPrompt
const tileData = TileData.fromPhaserTile(tile);

// Duplicated in handleCourtesyPassPrompt
const tileDatas = selection.map(tile => TileData.fromPhaserTile(tile));
```

**Potential Future State:**
Extract to helper method:

```javascript
/**
 * Convert Phaser Tile objects to TileData for GameController
 * @param {Tile|Tile[]} tiles - Single tile or array of tiles
 * @returns {TileData|TileData[]}
 */
convertToTileData(tiles) {
    if (Array.isArray(tiles)) {
        return tiles.map(tile => TileData.fromPhaserTile(tile));
    }
    return TileData.fromPhaserTile(tiles);
}

// Usage
const tileDatas = this.convertToTileData(selection);
```

**Considerations:**

- **Risk:** LOW - Simple extraction, easy to test
- **Benefit:** LOW-MEDIUM - DRY principle, easier to maintain
- **Priority:** LOW - Minor cleanup, not urgent

**When to Implement:**

- During Phase 3 code cleanup
- If TileData format changes (easier to update in one place)
- When adding new prompt handlers (establishes pattern)

---

## 4. Consolidate Hand Rendering Calls

**Current State:**
Some event handlers call `player.showHand()` directly, others use `this.handRenderer.showHand()`:

```javascript
// Mixed usage:
player.showHand(playerIndex === PLAYER.BOTTOM);  // Direct call
this.handRenderer.showHand(playerIndex, false);  // Via renderer
```

**Potential Future State:**
ALL hand rendering goes through HandRenderer:

```javascript
// Consistent:
this.handRenderer.showHand(playerIndex, playerIndex === PLAYER.BOTTOM);
```

**Considerations:**

- **Risk:** LOW - HandRenderer delegates to Hand.showHand() internally
- **Benefit:** MEDIUM - Clear separation of concerns, easier to add mobile renderer
- **Priority:** MEDIUM - Good for Phase 2/3

**Implementation:**

1. Find all `player.showHand()` calls in PhaserAdapter
2. Replace with `this.handRenderer.showHand(playerIndex, faceUp)`
3. Test rendering after each change
4. Revert if any visual differences occur

**Locations to Check:**

- `onTilesDealt()` - line 402, 475
- `onHandUpdated()` - likely uses player.showHand()
- Any direct hand rendering in event handlers

---

## 5. Centralize printInfo/printMessage Calls

**Current State:**
Info messages scattered across prompt handlers:

```javascript
printInfo("Select a tile to discard");
printInfo(`Select ${requiredCount} tiles to pass ${direction}`);
printInfo(`Claim ${discardedTile?.getText()}?`);
```

**Potential Future State:**
GameController emits messages as part of event data:

```javascript
// GameController emits
emit("UI_PROMPT", {
    promptType: "CHARLESTON_PASS",
    message: "Select 3 tiles to pass RIGHT",
    options: {...},
    callback: (...)
});

// PhaserAdapter displays
onUIPrompt(data) {
    if (data.message) printInfo(data.message);
    // Route to handler...
}
```

**Considerations:**

- **Risk:** MEDIUM - Requires GameController changes
- **Benefit:** HIGH - Messages defined in one place, easier i18n support
- **Priority:** LOW-MEDIUM - Nice-to-have for Phase 3+

**Benefits:**

1. **Internationalization:** Messages in GameController can be localized
2. **Consistency:** All prompts have proper messages
3. **Mobile:** Mobile renderer gets same messages without duplication

---

## 6. Add Error Handling to Promise-Based Flows

**Current State:**
No error handling for selection cancellation or timeouts:

```javascript
// What if user never clicks confirm?
// What if they close the browser?
// What if game state changes mid-selection?
```

**Potential Future State:**
Promise rejections and timeouts:

```javascript
async handleCharlestonPassPrompt(options, callback) {
    try {
        const selection = await Promise.race([
            this.selectionManager.requestSelection({...}),
            this.timeout(30000) // 30 second timeout
        ]);
        callback(selection);
    } catch (err) {
        console.error("Charleston selection failed:", err);
        // Fallback: auto-select random tiles? Return to previous state?
        callback(null); // Signal failure to GameController
    }
}
```

**Considerations:**

- **Risk:** MEDIUM - Requires careful state management
- **Benefit:** HIGH - More robust, handles edge cases
- **Priority:** MEDIUM - Important for production

**Edge Cases to Handle:**

1. User closes browser mid-selection
2. User waits indefinitely without selecting
3. Game state changes (opponent declares Mahjong)
4. Network issues (for future multiplayer)

---

## 7. Create Shared SelectionConfig Type

**Current State:**
Selection options passed as inline objects:

```javascript
this.selectionManager.enableTileSelection(3, 3, "charleston");
// vs
this.selectionManager.requestSelection({min: 3, max: 3, mode: "charleston"});
```

**Potential Future State:**
Define TypeScript/JSDoc types:

```javascript
/**
 * @typedef {Object} SelectionConfig
 * @property {number} min - Minimum tiles to select
 * @property {number} max - Maximum tiles to select
 * @property {SelectionMode} mode - Validation mode
 * @property {string} [buttonId] - Button to enable (default: "button1")
 *
 * @typedef {"charleston"|"courtesy"|"play"|"expose"} SelectionMode
 */

/**
 * @param {SelectionConfig} config
 * @returns {Promise<Tile[]>}
 */
async requestSelection(config) { ... }
```

**Considerations:**

- **Risk:** NONE - Just documentation
- **Benefit:** MEDIUM - Better IDE autocomplete, clearer API
- **Priority:** LOW - Quality-of-life improvement

---

## 8. Optimize Hand Rendering Performance

**Current State:**
Hand re-renders completely on every update:

```javascript
onHandUpdated(data) {
    const {player} = data;
    this.handRenderer.showHand(player); // Full re-render
}
```

**Potential Future State:**
Differential updates (only animate changed tiles):

```javascript
onHandUpdated(data) {
    const {player, addedTiles, removedTiles} = data;

    if (addedTiles) {
        addedTiles.forEach(tile => this.handRenderer.addTile(player, tile));
    }
    if (removedTiles) {
        removedTiles.forEach(tile => this.handRenderer.removeTile(player, tile));
    }
}
```

**Considerations:**

- **Risk:** MEDIUM - Requires GameController to emit differential data
- **Benefit:** MEDIUM - Smoother animations, better performance
- **Priority:** LOW - Optimization, not critical

**When to Implement:**

- When animation performance becomes noticeable issue
- After mobile renderer is added (more critical for mobile)
- Phase 4+ (polish)

---

## Summary: Prioritization Matrix

| Refactor | Risk | Benefit | Priority | Phase |
|----------|------|---------|----------|-------|
| 1. Unify Claim Prompt | HIGH | MEDIUM | LOW | Phase 3+ |
| 2. Promise-Based Handlers | MEDIUM | HIGH | MEDIUM | Phase 3 |
| 3. TileData Helper | LOW | LOW-MED | LOW | Phase 3 |
| 4. HandRenderer Consolidation | LOW | MEDIUM | MEDIUM | Phase 2/3 |
| 5. Centralize Messages | MEDIUM | HIGH | LOW-MED | Phase 3+ |
| 6. Error Handling | MEDIUM | HIGH | MEDIUM | Phase 3 |
| 7. SelectionConfig Type | NONE | MEDIUM | LOW | Phase 3 |
| 8. Optimize Rendering | MEDIUM | MEDIUM | LOW | Phase 4+ |

---

## Decision Process for Future Refactors

Before implementing any refactor from this document:

1. **Ask:** Does this fix a bug or improve UX?
   - If NO → defer to Phase 4+
   - If YES → continue

2. **Ask:** Is the current code causing problems?
   - If NO → defer
   - If YES → continue

3. **Ask:** Can we test this thoroughly?
   - If NO → defer until test coverage improves
   - If YES → continue

4. **Ask:** Will this help mobile renderer?
   - If YES → prioritize for Phase 3
   - If NO → deprioritize

5. **Implement:** Start small, test frequently, revert if issues arise

---

## Notes for Future Developers

**Philosophy:** The current architecture works. Don't fix what isn't broken.

These refactors are **opportunities**, not **requirements**. Each one should be evaluated on its own merits when the time comes. The game is playable end-to-end, which means the current patterns are sufficient.

Focus on:

1. Making mobile renderer work alongside desktop
2. Fixing actual bugs
3. Improving UX based on user feedback

Only then consider these architectural improvements.

---

Last Updated: 2025-11-15 (Phase 2 completion)
