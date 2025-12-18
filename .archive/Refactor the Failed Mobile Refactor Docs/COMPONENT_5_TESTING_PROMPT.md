# Component 5: End-to-End Testing & Debugging

**Goal**: Verify that the refactored desktop game works end-to-end, from deal through Charleston to main game loop and game completion.

**Status**: Components 1-4 implemented. Now ready for comprehensive integration testing to identify and fix any remaining issues.

**Time Estimate**: 2-3 hours

---

## Critical Discovery: What We've Built

### Components Completed

**Component 1: SelectionManager** ✅

- Tile selection tracking during Charleston and courtesy phases
- Visual feedback for selected tiles (Y-position changes)
- Validation of selection counts (min/max enforcement)
- [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js)

**Component 2: HandRenderer** ✅

- Renders hands for all 4 player positions
- Handles horizontal (BOTTOM/TOP) and vertical (LEFT/RIGHT) layouts
- Position calculations for hidden and exposed tiles
- [desktop/renderers/HandRenderer.js](desktop/renderers/HandRenderer.js)

**Component 3: PhaserAdapter Integration** ✅

- Event handlers wired to GameController
- Dialog prompts via DialogManager
- Button state management via ButtonManager
- [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

**Component 4: Tile Animations** ✅

- All tile movements use `tile.animate()` method
- Proper sprite/spriteBack/mask/glow synchronization
- Animations in onTileDrawn, onTileDiscarded, and showHand
- [desktop/gameObjects/gameObjects.js](desktop/gameObjects/gameObjects.js)

---

## Testing Strategy

### Phase 1: Basic Functionality (30 min)

Test that the game can complete basic operations without crashing.

### Phase 2: Charleston Flow (45 min)

Test the full Charleston phase with tile selection and passing.

### Phase 3: Main Game Loop (45 min)

Test pick, discard, claim, and exposure mechanics.

### Phase 4: Edge Cases & Polish (30 min)

Test error conditions, wall game, and winning scenarios.

---

## Phase 1: Basic Functionality Testing

### Test 1.1: Game Start & Deal (10 min)

**Objective**: Verify game can start and deal tiles without errors.

**Steps**:

1. Open browser to `http://localhost:5173` (or run `npm run dev`)
2. Click "Start Game" button
3. Observe the deal animation

**Expected Behavior**:

- ✅ Tiles animate from wall center (640, 360) to player hands
- ✅ Human player (BOTTOM) receives 14 tiles face-up
- ✅ AI players (RIGHT, TOP, LEFT) receive 13 tiles face-down
- ✅ All tiles positioned correctly in racks
- ✅ No console errors
- ✅ Wall tile counter shows correct count (99 remaining after deal)

**Common Issues**:

- Tiles don't animate → Check `tile.animate()` is called in `onTileDrawn`
- Tiles overlap → Check `calculateTilePosition()` in HandRenderer
- Tiles not visible → Check `showTile()` called with correct face-up/down
- Console errors about undefined tiles → Check `tileMap` initialization

**Debugging**:

```javascript
// Enable debug mode in utils.js
export const gdebug = 1; // See detailed tile movement logs

// Check in browser console:
console.log("TileMap size:", phaserAdapter.tileMap.size); // Should be 152 or 160
console.log("Wall count:", table.wall.getCount()); // Should decrease during deal
```

---

### Test 1.2: Hand Display (10 min)

**Objective**: Verify all 4 players' hands display correctly.

**Steps**:

1. After deal completes, observe all 4 player racks
2. Check tile positions, rotations, scales

**Expected Behavior**:

**BOTTOM Player (Human)**:

- ✅ 14 tiles in horizontal row at bottom
- ✅ Full size (scale = 1.0)
- ✅ Face-up (can see tile faces)
- ✅ Angle = 0° (no rotation)
- ✅ Centered horizontally

**RIGHT Player (AI)**:

- ✅ 13 tiles in vertical column on right side
- ✅ Scaled to 0.75
- ✅ Face-down (backs showing)
- ✅ Angle = 90° (rotated right)
- ✅ Centered vertically

**TOP Player (AI)**:

- ✅ 13 tiles in horizontal row at top
- ✅ Scaled to 0.75
- ✅ Face-down (backs showing)
- ✅ Angle = 180° (upside down)
- ✅ Centered horizontally

**LEFT Player (AI)**:

- ✅ 13 tiles in vertical column on left side
- ✅ Scaled to 0.75
- ✅ Face-down (backs showing)
- ✅ Angle = 270° (rotated left)
- ✅ Centered vertically

**Common Issues**:

- Wrong rotation → Check `playerInfo.angle` passed to `tile.animate()`
- Wrong scale → Check `calculateTileScale()` in HandRenderer
- Tiles off-center → Check rack position calculations
- AI tiles face-up → Check `exposed` parameter in `renderHiddenTiles()`

---

### Test 1.3: UI State (10 min)

**Objective**: Verify UI elements update correctly.

**Steps**:

1. Check message log shows game events
2. Check buttons appear/disappear as expected
3. Check wall counter updates

**Expected Behavior**:

- ✅ Message log shows: "Game started", "Dealing tiles...", "Deal complete"
- ✅ Start button hidden after game starts
- ✅ Wall counter shows remaining tiles (initially 152/160, then 139 after deal)
- ✅ No stuck dialogs or overlays

**Common Issues**:

- Messages not appearing → Check `printMessage()` calls in PhaserAdapter
- Buttons not updating → Check `ButtonManager.updateForState()`
- Wall counter wrong → Check `updateWallTileCounter()` in onTileDrawn

---

## Phase 2: Charleston Flow Testing

### Test 2.1: Charleston Phase 1 - Right Pass (15 min)

**Objective**: Verify first Charleston pass works (pass tiles to RIGHT).

**Steps**:

1. After deal, Charleston Phase 1 should start automatically
2. Dialog appears: "Charleston Phase 1 - Pass RIGHT"
3. Click 3 tiles in your hand to select them
4. Click "Pass Right" button
5. Observe tiles being passed

**Expected Behavior**:

- ✅ Dialog shows "Select 3 tiles to pass RIGHT"
- ✅ Clicking a tile raises it (Y-position changes from 600 → 575 for BOTTOM)
- ✅ Selected tiles have visual indicator (raised position)
- ✅ Can deselect by clicking again (tile lowers back to 600)
- ✅ "Pass Right" button enabled only when exactly 3 tiles selected
- ✅ After clicking "Pass Right", tiles animate to next player
- ✅ AI players automatically select and pass tiles
- ✅ All 4 players receive 3 new tiles

**Common Issues**:

- Can't select tiles → Check `SelectionManager.enableTileSelection()` called
- Tiles don't raise → Check `visualizeTile()` sets Y position correctly
- Pass button always disabled → Check `isValidSelection()` logic
- Tiles don't animate → Check `onCharlestonPass` event handler
- AI doesn't pass → Check GameController's Charleston logic

**Debugging**:

```javascript
// In browser console during Charleston:
console.log("Selection enabled:", selectionManager.enabled);
console.log("Selected tiles:", selectionManager.getSelection());
console.log("Selection count:", selectionManager.getSelectionCount());
```

---

### Test 2.2: Charleston Phases 2 & 3 (15 min)

**Objective**: Verify all 3 Charleston phases complete.

**Expected Flow**:

1. **Phase 1**: Pass RIGHT, Pass ACROSS, Pass LEFT
2. **Phase 2**: Pass LEFT, Pass ACROSS, Pass RIGHT
3. **Phase 3 (Query)**: Dialog asks "Do another Charleston?"
   - If Yes → Same as Phase 2
   - If No → Skip to Courtesy

**Steps**:

1. Complete Phase 1 (3 passes)
2. Complete Phase 2 (3 passes)
3. Choose "Yes" or "No" at Phase 3 query
4. Verify game continues to next phase

**Expected Behavior**:

- ✅ Each phase has 3 passes (RIGHT, ACROSS, LEFT or reverse)
- ✅ Dialog updates to show current pass direction
- ✅ After each pass, all players receive 3 new tiles
- ✅ Phase 3 query appears after Phase 2
- ✅ Game proceeds to Courtesy phase after Charleston

**Common Issues**:

- Charleston doesn't progress → Check state transitions in GameController
- Wrong pass direction → Check `charlestonPhase` logic
- Query dialog doesn't appear → Check `onCharlestonQuery` handler
- Tiles get lost → Check tile passing logic preserves tile count

---

### Test 2.3: Courtesy Pass (15 min)

**Objective**: Verify courtesy pass voting and tile exchange.

**Expected Flow**:

1. Dialog asks "Do you want a courtesy pass?"
2. All 4 players vote (AI votes automatically)
3. If unanimous "Yes" → Select up to 3 tiles to pass ACROSS
4. If any "No" → Skip to main game loop

**Steps**:

1. Vote "Yes" or "No" at courtesy prompt
2. If "Yes", select 0-3 tiles and click "Pass Across"
3. Observe courtesy exchange

**Expected Behavior**:

- ✅ Courtesy vote dialog appears
- ✅ Can vote Yes or No
- ✅ If not unanimous, skip to main game
- ✅ If unanimous Yes, can select 0-3 tiles (not exactly 3)
- ✅ "Pass Across" button enabled even with 0 tiles selected
- ✅ Tiles exchanged correctly
- ✅ Game proceeds to main loop after courtesy

**Common Issues**:

- Can't vote → Check `onCourtesyQuery` handler
- Forced to select 3 tiles → Check SelectionManager min/max for courtesy
- Tiles don't exchange → Check `onCourtesyPass` handler
- Game stuck after courtesy → Check state transition to LOOP_PICK_FROM_WALL

---

## Phase 3: Main Game Loop Testing

### Test 3.1: Pick and Discard (15 min)

**Objective**: Verify basic pick-discard loop works.

**Steps**:

1. After Charleston/Courtesy, game enters main loop
2. Current player picks from wall (automatic)
3. Current player discards a tile
4. Turn passes to next player

**Expected Behavior**:

- ✅ Player picks tile from wall automatically
- ✅ Tile animates from wall to hand
- ✅ Human player can click a tile to discard
- ✅ AI players discard automatically (using GameAI logic)
- ✅ Discarded tile animates to center (350, 420)
- ✅ Audio plays when tile discarded ("tile_dropping" sound)
- ✅ Turn indicator updates to show current player
- ✅ Wall counter decrements after each pick

**Common Issues**:

- Human can't discard → Check click handlers on tiles
- AI doesn't discard → Check GameAI.chooseDiscard() called
- Tile doesn't animate to discard pile → Check `onTileDiscarded` handler
- Turn doesn't advance → Check `onTurnChanged` handler
- No sound → Check AudioManager integration

**Debugging**:

```javascript
// Check current game state
console.log("Current state:", gameController.state);
console.log("Current player:", gameController.currentPlayer);
console.log("Wall remaining:", table.wall.getCount());
```

---

### Test 3.2: Claim Discard (15 min)

**Objective**: Verify players can claim discarded tiles.

**Setup**: Arrange a hand with a pung opportunity (2 matching tiles + discard makes 3).

**Steps**:

1. Wait for another player to discard a tile you can claim
2. Dialog appears: "Claim discard for Pung/Kong/Mahjong?"
3. Click "Claim" or "Pass"
4. If claimed, expose the tiles

**Expected Behavior**:

- ✅ Dialog appears when claimable discard
- ✅ Shows claim type (Pung, Kong, Quint, Mahjong)
- ✅ Can click "Claim" or "Pass"
- ✅ If claimed, tiles move from hand to exposed area
- ✅ Discarded tile joins the exposure
- ✅ Turn transfers to claiming player
- ✅ Claiming player must discard next

**Common Issues**:

- Dialog doesn't appear → Check `onUIPrompt` for QUERY_CLAIM_DISCARD
- Can't claim valid discard → Check Card validation logic
- Tiles don't expose → Check `onTilesExposed` handler
- Turn doesn't transfer → Check claim logic in GameController

**Debugging**:

```javascript
// Check claimability
const hand = table.players[PLAYER.BOTTOM].hand;
console.log("Hand tiles:", hand.getTiles());
console.log("Can claim:", gameController.canClaimDiscard(PLAYER.BOTTOM));
```

---

### Test 3.3: Expose Tiles (15 min)

**Objective**: Verify tile exposures (Pung/Kong/Quint) work correctly.

**Types of Exposures**:

- **Pung**: 3 matching tiles (e.g., 3× "5 Crack")
- **Kong**: 4 matching tiles (e.g., 4× "Red Dragon")
- **Quint**: 5 matching tiles (e.g., 5× Joker)

**Steps**:

1. Claim a discard to form an exposure
2. Observe tiles move to exposed area
3. Verify exposed tiles display correctly

**Expected Behavior**:

- ✅ Exposed tiles positioned in exposed area of rack
- ✅ BOTTOM: Exposed tiles on top row, hidden tiles on bottom row
- ✅ RIGHT: Exposed tiles on left column, hidden tiles on right column
- ✅ TOP: Exposed tiles on bottom row, hidden tiles on top row
- ✅ LEFT: Exposed tiles on right column, hidden tiles on left column
- ✅ Exposed tiles always face-up for all players
- ✅ Multiple exposures arranged sequentially

**Common Issues**:

- Exposed tiles overlap hidden tiles → Check rack position calculations
- Exposed tiles face-down → Check `exposed` parameter is `true`
- Wrong position → Check `calculateExposedTilePositions()` in HandRenderer
- Multiple exposures overlap → Check sequential positioning logic

---

## Phase 4: Edge Cases & Polish

### Test 4.1: Wall Game (10 min)

**Objective**: Verify game ends correctly when wall empties with no winner.

**Setup**: Play game without anyone winning until wall exhausted.

**Expected Behavior**:

- ✅ Game ends when wall reaches 0 tiles (or dead wall minimum)
- ✅ Message: "Wall game - no winner"
- ✅ Start button reappears
- ✅ Can start a new game

---

### Test 4.2: Mahjong Win (10 min)

**Objective**: Verify winning hand detection and game end.

**Setup**: Use Training Mode to set up a winning hand, or play until someone wins.

**Expected Behavior**:

- ✅ Game detects mahjong correctly
- ✅ Message: "[Player] wins with [hand pattern]!"
- ✅ Game ends
- ✅ Start button reappears

---

### Test 4.3: Training Mode (10 min)

**Objective**: Verify training mode features work.

**Steps**:

1. Open Settings (gear icon)
2. Enable "Training Mode" checkbox
3. Close settings
4. Click "Start Game"
5. Training form appears with tile selection

**Expected Behavior**:

- ✅ Can select specific tiles to start with
- ✅ Can choose tile count (1-14)
- ✅ Option to skip Charleston
- ✅ Game starts with selected tiles
- ✅ If "Skip Charleston" checked, goes straight to main loop

**Common Issues**:

- Training form doesn't appear → Check `enableTrainingForm()` in gameLogic.js
- Selected tiles don't appear in hand → Check training setup logic
- Charleston runs when skipped → Check state initialization

---

## Success Criteria

### Visual Quality

- ✅ Tiles slide smoothly (not jump) to positions
- ✅ SpriteBack stays synchronized during animation
- ✅ Mask follows sprite during movement
- ✅ Glow effects move with tiles (if applicable)
- ✅ No flickering or visual glitches
- ✅ All 4 player hands rendered correctly

### Gameplay Functionality

- ✅ Can complete full game from start to end
- ✅ Charleston phases work (tile selection, passing)
- ✅ Courtesy pass works (voting, exchange)
- ✅ Main loop works (pick, discard, claim)
- ✅ Tile exposures work (Pung/Kong/Quint)
- ✅ Win detection works (Mahjong)
- ✅ Wall game detection works
- ✅ Training mode works

### Code Quality

- ✅ No console errors during normal gameplay
- ✅ No animation conflicts or race conditions
- ✅ Audio plays at appropriate times
- ✅ UI updates reflect game state correctly
- ✅ All managers working together harmoniously

---

## Common Issues & Solutions

### Issue: Game Freezes During Charleston

**Symptoms**: Dialog appears but game doesn't progress when clicking "Pass"

**Likely Causes**:

1. Promise not resolved in button handler
2. State not transitioning correctly
3. Event not firing from GameController

**Debug Steps**:

```javascript
// Add to button click handler in DialogManager:
console.log("Pass button clicked, resolving with:", selectedTiles);
this.currentResolve(selectedTiles);

// Check state transitions:
console.log("State before:", gameController.state);
// ... after pass action ...
console.log("State after:", gameController.state);
```

**Solution**: Ensure button callbacks properly resolve promises and trigger state transitions.

---

### Issue: Tiles Don't Animate

**Symptoms**: Tiles jump to positions instead of sliding

**Likely Causes**:

1. Using `tile.x = newX` instead of `tile.animate()`
2. Animation tween not created
3. Duration set to 0

**Debug Steps**:

```javascript
// In tile.animate():
console.log("Animating tile to:", x, y, "duration:", time);

// Check if tween created:
console.log("Tween created:", this.tween);
```

**Solution**: Ensure all tile movements use `tile.animate(x, y, angle, duration)`.

---

### Issue: Selection Doesn't Work

**Symptoms**: Can't select tiles during Charleston

**Likely Causes**:

1. SelectionManager not enabled
2. Tiles not interactive
3. Click handlers not attached

**Debug Steps**:

```javascript
// Check selection state:
console.log("Selection enabled:", selectionManager.enabled);
console.log("Min/max:", selectionManager.minCount, selectionManager.maxCount);

// Check tile interactivity:
console.log("Tile interactive:", tile.sprite.input);
```

**Solution**: Ensure `enableTileSelection()` called at phase start, tiles made interactive.

---

### Issue: AI Players Don't Act

**Symptoms**: Game stuck waiting for AI player to discard/pass

**Likely Causes**:

1. GameAI methods not called
2. AI decision returns undefined
3. Event not firing after AI action

**Debug Steps**:

```javascript
// In GameController:
console.log("Calling AI for player:", currentPlayer);
const decision = await gameAI.chooseDiscard(player, hand);
console.log("AI decision:", decision);
```

**Solution**: Ensure GameController calls GameAI methods for AI players, handles responses.

---

## Testing Checklist

### Pre-Test Setup

- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Dev server running: `npm run dev`
- [ ] Browser console open (F12) to watch for errors

### Phase 1: Basic Functionality

- [ ] Test 1.1: Game Start & Deal
- [ ] Test 1.2: Hand Display (all 4 players)
- [ ] Test 1.3: UI State

### Phase 2: Charleston Flow

- [ ] Test 2.1: Charleston Phase 1 - Right Pass
- [ ] Test 2.2: Charleston Phases 2 & 3
- [ ] Test 2.3: Courtesy Pass

### Phase 3: Main Game Loop

- [ ] Test 3.1: Pick and Discard
- [ ] Test 3.2: Claim Discard
- [ ] Test 3.3: Expose Tiles

### Phase 4: Edge Cases

- [ ] Test 4.1: Wall Game
- [ ] Test 4.2: Mahjong Win
- [ ] Test 4.3: Training Mode

### Documentation

- [ ] Update IMPLEMENTATION_ROADMAP.md with test results
- [ ] Document any bugs found in GitHub issues
- [ ] Note any architecture improvements needed

---

## Next Steps After Testing

### If All Tests Pass ✅

Congratulations! The desktop refactoring is complete. Move on to:

1. Mobile implementation (if planned)
2. Performance optimization
3. Additional features (replay, statistics, etc.)

### If Tests Fail ❌

For each failing test:

1. Document the exact failure (steps to reproduce)
2. Check browser console for errors
3. Add debug logging to narrow down the issue
4. Fix the bug
5. Re-test to verify fix
6. Commit the fix with clear message

**Priority Order** (fix in this order):

1. Game-breaking bugs (can't complete a game)
2. Charleston/Courtesy bugs (core gameplay)
3. Visual glitches (animations, positioning)
4. Polish issues (audio, UI feedback)

---

## Expected Outcome

After completing Component 5 testing:

1. ✅ Desktop game fully playable from start to finish
2. ✅ All major game phases work correctly
3. ✅ No game-breaking bugs remain
4. ✅ Visual quality matches or exceeds commit 07c41b9
5. ✅ Ready for production deployment or mobile port

**Celebrate!** You've successfully refactored a complex game while maintaining full functionality.

---

## Quick Reference: Testing Commands

```bash
# Start dev server
npm run dev

# Run build
npm run build

# Run linter
npm run lint

# Run tests (if implemented)
npm test

# Enable debug logging
# Edit utils.js, set: export const gdebug = 1;
```

## Quick Reference: Key Files

- **GameController**: `core/controllers/GameController.js`
- **PhaserAdapter**: `desktop/adapters/PhaserAdapter.js`
- **SelectionManager**: `desktop/managers/SelectionManager.js`
- **HandRenderer**: `desktop/renderers/HandRenderer.js`
- **Tile**: `desktop/gameObjects/gameObjects.js`
- **Hand**: `desktop/gameObjects/gameObjects_hand.js`
- **GameAI**: `gameAI.js`
- **Card Validation**: `card/card.js`
