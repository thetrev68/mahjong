# Commit 07c41b9 Investigation Checklist

## Purpose

The last working commit (07c41b9) had fully functional:

- Tile selection during Charleston
- Tile visual feedback (raising to position 575)
- Discard selection
- All game phases working

We need to understand HOW it worked so we can:

1. Understand the architecture we should follow
2. Extract usable code patterns
3. Fix the current broken version

---

## Investigation Checklist

### 1. Tile Selection System

```
[ ] Look for class/object that tracked selected tiles
    - Name: ? (TileSet? Hand? SelectionManager?)
    - Location: ?
    - Methods it had:
      - select(tile): ?
      - deselect(tile): ?
      - getSelection(): ?
      - clearSelection(): ?
      - isSelected(tile): ?

[ ] Look for tile click handlers
    - File: ?
    - Method name: ?
    - What happens when user clicks a tile: ?
    - How does it differentiate between selecting vs discarding: ?

[ ] Look for visual feedback on selected tiles
    - Position change (575 vs 600): ?
    - How was this implemented: ?
    - Using Phaser tweens? Direct position change? CSS? Other?
    - Code location: ?

[ ] Look for validation
    - How was "must select exactly 3 tiles" enforced: ?
    - Was it checked before showing button? Or when button clicked?
    - Error handling: ?
```

### 2. Charleston Phase Flow

```
[ ] Look at GameLogic.charlestonPhase() method
    - Location: gameLogic.js
    - High-level flow:
      1. ?
      2. ?
      3. ?
      4. ?

[ ] Look at how tiles were presented for selection
    - Message to user: ?
    - UI changes: ?
    - Button text: ?

[ ] Look at how pass direction was handled
    - How did game know to pass "RIGHT", "LEFT", or "ACROSS": ?
    - Code location: ?

[ ] Look at how tiles were passed
    - Code that moved tiles from one player to another: ?
    - How were visual positions updated: ?
```

### 3. Button/UI Integration

```
[ ] Look at what buttons appeared during Charleston
    - Button 1: ?
    - Button 2: ?
    - Button 3: ?
    - Button 4: ?
    - Condition for each: ?

[ ] Look at button callback handlers
    - button1Function: ?
    - button2Function: ?
    - etc.

[ ] Look at how buttons were updated based on game state
    - Which state triggered button changes: ?
    - Code location: ?
```

### 4. Hand Display

```
[ ] Look at Hand.showHand() method
    - How were tiles positioned: ?
    - Separate logic for each player direction (bottom/right/top/left): ?
    - Did it show selected tiles differently: ?

[ ] Look at TileSet/Hand classes
    - How were tiles grouped: ?
    - How were exposed tiles handled differently: ?

[ ] Look for tile positioning logic
    - Constants used: SPRITE_WIDTH, SPRITE_HEIGHT, TILE_GAP, etc.
    - Calculations for positioning each player's hand: ?
```

### 5. Input Handling

```
[ ] Look at how user input was processed
    - Did Phaser handle clicks directly: ?
    - Did HTML handle clicks: ?
    - Mixed approach: ?

[ ] Look for drag and drop
    - Was it used: ?
    - For what: ?
    - Code location: ?

[ ] Look for key bindings
    - Any keyboard shortcuts: ?
    - For what: ?
```

### 6. Game Flow Control

```
[ ] Look at state machine
    - States enum: where defined?
    - State transitions: how controlled?
    - When did UI update (buttons, messages): ?

[ ] Look at async/await usage
    - How were user actions awaited: ?
    - Promise-based or callback-based: ?
    - Examples: ?
```

---

## Quick Reference Commands

To investigate these files in commit 07c41b9:

```bash
# View whole file from commit
git show 07c41b9:gameLogic.js | less

# View specific method
git show 07c41b9:gameLogic.js | grep -A 50 "charlestonPhase("

# View class definition
git show 07c41b9:gameObjects_hand.js | grep -A 100 "class TileSet"

# Compare file between commits
git diff 07c41b9..HEAD gameLogic.js

# View raw file at that commit
git show 07c41b9:gameLogic.js > gameLogic.old.js
# Then view with your editor
```

---

## Key Methods to Find

### In GameLogic.js (commit 07c41b9)

- [ ] `charlestonPhase()` - main flow
- [ ] `updateUI()` - button/message updates
- [ ] How tile selection was enabled/disabled
- [ ] How clicks were handled during Charleston

### In gameObjects_hand.js (commit 07c41b9)

- [ ] `TileSet` class - tile grouping
- [ ] `Hand` class - player hand management
- [ ] `showHand()` method - tile positioning
- [ ] Tile click handler setup
- [ ] Selection tracking logic

### In gameObjects.js (commit 07c41b9)

- [ ] `Tile` class - individual tile
- [ ] Tile position properties
- [ ] Tile visual state (selected vs not)
- [ ] Click event handler

---

## Expected Findings

### Based on Code Review, We Expect to Find:

**1. SelectionManager-like behavior in Hand/TileSet**

- Methods to track which tiles are selected
- Methods to get the selection
- Validation of selection count

**2. Two types of click handling**

- During Charleston: Click = select/deselect
- During discard: Click = pick tile to discard
- Differentiated by game state

**3. Visual feedback on tiles**

- Y-position changes (575 = selected, 600 = normal)
- Possibly color/opacity changes
- Possibly glow effect

**4. Button-driven flow**

- Buttons present options (Cancel, Pass, etc.)
- Clicking button triggers validation and action
- Game waited for button click, not individual tile clicks

**5. Modal dialogs or overlays**

- Maybe: "Select 3 tiles to pass" message
- Maybe: instructions visible during selection
- Maybe: tile selection highlighted visually

---

## Cross-Reference Points

After investigating 07c41b9, verify understanding by:

1. **Compare to DialogManager**
   - Does DialogManager match the UI pattern from 07c41b9?
   - If different, which is better?

2. **Compare to current PhaserAdapter**
   - What was removed?
   - What changed?
   - What should be restored?

3. **Identify what can be reused**
   - showHand() logic - can we copy it?
   - Tile selection logic - can we adapt it?
   - Button handlers - can we reuse pattern?

4. **Identify what needs new implementation**
   - SelectionManager - needs creation
   - HandRenderer - needs creation
   - Other managers - need completion

---

## Success Criteria for Investigation

You'll know you've investigated enough when you can answer:

1. **How were tiles selected?** (exact mechanism)
2. **When were tiles highlighted?** (timing and how)
3. **What was the user's flow?** (click tile → what happens → click button → what happens)
4. **What was the code structure?** (which classes, which methods)
5. **What can we reuse vs. rebuild?** (specific code locations and changes needed)

---

## Expected Output

After investigation, we should have:

1. **Copy of key methods** from 07c41b9 to reference
2. **Detailed flow diagram** of how Charleston worked
3. **Code patterns** to replicate in new system
4. **List of components** that existed in 07c41b9
5. **Comparison** showing what changed in refactor

---

## Notes

- This is detective work, not criticism
- The refactor was a good idea; we just need to complete it
- 07c41b9 shows us the "destination" - what needs to work
- Current code shows us the "structure" - the new way to organize
- Our job: Merge the two successfully

---

## Sample Investigation Example

If we were to investigate `charlestonPhase`:

```javascript
// In commit 07c41b9, charlestonPhase probably looked something like:

async charlestonPhase() {
    // For each phase (1, 2, 3)
    for each phase:
        // For each pass (LEFT, RIGHT, ACROSS)
        for each pass:
            // Ask current player which 3 tiles to pass
            selectedTiles = await promptForTileSelection(3)

            // Move tiles to next player
            movePassedTiles(selectedTiles, direction)

            // Rotate player order
            nextPlayer()
}

// And promptForTileSelection probably:
// 1. Enabled tile selection mode
// 2. Showed "Select 3 tiles" message
// 3. Waited for user to click "Pass" button
// 4. Returned selected tiles or cancelled
```

**Our job**: Understand this flow and recreate it using:

- GameController for logic
- PhaserAdapter for UI routing
- DialogManager for dialogs
- SelectionManager for tile selection
- Managers for rendering

---

## Next Step After Investigation

Once investigation is complete:

1. Create a document: "Charleston Flow Detailed"
2. Show step-by-step what happened in 07c41b9
3. Map it to new architecture (GameController → PhaserAdapter → Managers)
4. Identify missing pieces
5. Create implementation plan with code examples

Then we'll know exactly what to build.
