# Blank Tiles Implementation Plan

## Overview

Implement a house rule feature that adds 8 blank tiles to the wall. Players can swap blank tiles for any non-joker tile from the discard pile at any time during gameplay.

## Feature Requirements

- Add 8 blank tiles to the wall (total tiles: 152 → 160)
- Allow players to swap blank tiles for tiles in the discard pile
- Swap can happen at any time (even when it's not the player's turn)
- Cannot swap blanks for jokers
- Similar functionality to existing joker swap mechanism
- Configurable via settings page
- "Swap Blank" button appears when player has a blank in hand

## Key Implementation Areas

### 1. Constants & Tile Definition

**File:** `constants.js`

**Changes:**

- Add `BLANK: 7` to the `SUIT` enum (update existing virtual suits to shift by 1)
- Update affected virtual suits:
  - `VSUIT1: 8` (was 7)
  - `VSUIT2: 9` (was 8)
  - `VSUIT3: 10` (was 9)
  - `VSUIT1_DRAGON: 11` (was 10)
  - `VSUIT2_DRAGON: 12` (was 11)
  - `VSUIT3_DRAGON: 13` (was 12)
- Keep `INVALID: 99` unchanged

**Rationale:** Blanks are a real tile type, not a virtual suit, so they should be added before virtual suits.

---

### 2. Tile Creation & Initialization

**File:** `gameObjects.js`

**Symbol:** `gTileGroups` array (lines 9-77)

**Changes:**

- Add new blank tile group definition:

```javascript
{
    suit: SUIT.BLANK,
    textArray: ["Blank"],
    prefix: ["BLANK"],
    maxNum: 1,
    count: 8
}
```

- Insert this AFTER the JOKER entry (currently last entry in array)

**Symbol:** `Wall` class methods

**Affected Methods:**

- `Wall.create()` - Already iterates through gTileGroups, should automatically handle 160 tiles
- `Wall.receiveOrganizedTilesFromHomePage()` - Update validation from 152 → 160 tiles (line 433)

**Sprite/Asset Requirements:**

- Need blank tile sprite image(s) - back.png
- Add to sprite loading in `Wall.create()` method
- Blank tiles should have distinct visual appearance

---

### 3. Wall Tile Count Updates

**Files requiring hardcoded "152" → "160" updates:**

1. **gameLogic.js:**
   - Line 604: Comment update
   - Line 611: Validation check `if (tileCount !== 152)`
   - Line 612: Error message

2. **gameObjects.js:**
   - Line 395: Comment "Create all 152 tiles"
   - Line 433: Validation in `receiveOrganizedTilesFromHomePage()`
   - Line 434: Error message
   - Line 444: Debug print message

3. **gameObjects_table.js:**
   - Line 108: Comment
   - Line 109: Validation check
   - Line 110: Error message

4. **GameScene.js:**
   - Line 114: UI text for wall tiles display
   - Line 129: `maxTiles: 152` constant

5. **homePageTileManager.js:**
   - Line 17: Comment

**Implementation Notes:**

- Consider creating a constant `TOTAL_TILE_COUNT = 160` in `constants.js`
- Update all references to use this constant instead of hardcoded values
- Makes future changes easier

---

### 4. Settings Page Configuration

**File:** `index.html`

**Location:** Lines 139-142 (House Rules section)

**Changes:**
Replace placeholder text with:

```html
<section class="settings-section">
  <h2 class="settings-section-title">House Rules</h2>
  <div class="house-rules-container">
    <div class="house-rules-item">
      <input type="checkbox" id="useBlankTiles" class="house-rules-checkbox" />
      <label for="useBlankTiles" class="house-rules-label"
        >Use Blank Tiles (8 blanks added to wall)</label
      >
    </div>
    <p class="settings-description">
      When enabled, 8 blank tiles are added to the wall. Players may swap blanks
      for any non-joker tile from the discard pile at any time.
    </p>
  </div>
</section>
```

**File:** `settings.js`

**Symbol:** `SettingsManager` class

**Changes:**

1. Add to `init()` method:
   - Event listener for `useBlankTiles` checkbox change
   - Call save method on change

2. Add new methods:

   ```javascript
   saveHouseRuleSettings() {
       const useBlankTiles = document.getElementById("useBlankTiles");
       if (useBlankTiles) {
           this.saveSetting("useBlankTiles", useBlankTiles.checked);
       }
   }

   applyHouseRuleSettings(settings) {
       const useBlankTiles = document.getElementById("useBlankTiles");
       if (useBlankTiles && Object.prototype.hasOwnProperty.call(settings, "useBlankTiles")) {
           useBlankTiles.checked = settings.useBlankTiles;
       }
   }

   getUseBlankTiles() {
       return this.getSetting("useBlankTiles", false);
   }
   ```

3. Update `loadSettings()` to call `applyHouseRuleSettings(settings)`

**CSS Updates:**

- Add styles for `.house-rules-container`, `.house-rules-item`, `.house-rules-checkbox`, `.house-rules-label` (match existing training mode styles)

---

### 5. Swap Blank Button UI

**File:** `index.html`

**Location:** Lines 20-25 (button div)

**Changes:**

- Button 4 will be repurposed as "Swap Blank" button
- Show/hide based on game state and blank tile availability

**File:** `gameLogic.js`

**New Logic Required:**

1. Check if blank tiles feature is enabled (`settingsManager.getUseBlankTiles()`)
2. Check if current player (PLAYER.BOTTOM) has blank tile(s) in hand
3. Check if discard pile has non-joker tiles available
4. Show button 4 with text "Swap Blank" when all conditions met

**Button State Management:**
Similar to existing joker swap button logic at lines 1289-1340 in `gameObjects_hand.js`

---

### 6. Blank Swap Functionality

**File:** `gameLogic.js`

**New Method:** `swapBlankForDiscard()`

**Functionality:**

```javascript
swapBlankForDiscard() {
    // 1. Get selected blank tile from player's hand
    // 2. Show discard pile tiles (excluding jokers) as clickable
    // 3. Player selects tile from discard pile
    // 4. Remove blank from hand, add to discard pile
    // 5. Remove selected tile from discard pile, add to hand
    // 6. Update display for both hand and discard pile
    // 7. Allow continuous swaps while player has blanks
}
```

**Reference Implementation:**

- Model after `exchangeUserSelectedTileForExposedJoker()` in `gameObjects_table.js` (lines 382-413)
- Similar tile selection and swapping logic
- Key difference: source is discard pile instead of exposed tiles

**File:** `gameObjects_hand.js`

**Changes to Blank Tile Handling:**

1. Add input handler for blank tiles (similar to joker handler at lines 1290-1355)
2. Enable selection of blank tiles when swap is active
3. Visual feedback for selected blank tile

**File:** `gameObjects.js`

**Symbol:** `Discards` class

**New Method:** `getSelectableDiscards()`

```javascript
getSelectableDiscards() {
    // Return array of tiles in discard pile that aren't jokers
    return this.tileArray.filter(tile => tile.suit !== SUIT.JOKER);
}
```

**New Method:** `enableDiscardSelection()`

```javascript
enableDiscardSelection(onSelectCallback) {
    // Make non-joker discard tiles clickable
    // Call callback when tile is selected
}
```

**New Method:** `removeDiscardTile(tile)`

```javascript
removeDiscardTile(tile) {
    // Remove specific tile from discard pile
    // Update display
}
```

---

### 7. Game State & Turn Management

**File:** `gameLogic.js`

**Challenge:** Blank swaps can happen at any time, not just during player's turn

**Solution Options:**

**Option A: State Flag (Recommended)**

- Add `isSwappingBlank` flag to track swap operation in progress
- Allow blank swap initiation during:
  - `STATE.LOOP_CHOOSE_DISCARD` (player's turn)
  - `STATE.LOOP_QUERY_CLAIM_DISCARD` (waiting for other players)
  - `STATE.LOOP_PICK_FROM_WALL` (between turns)
- Pause normal game flow while swap is in progress
- Resume after swap completes

**Option B: New State**

- Add `STATE.SWAP_BLANK` to state machine
- Transition to this state when swap initiated
- Return to previous state after completion
- More complex, requires state tracking

**Recommended:** Option A for simplicity

**Implementation:**

```javascript
// Add to gameLogic.js
this.isSwappingBlank = false;

async initiateBlankSwap() {
    this.isSwappingBlank = true;
    // Disable normal buttons
    // Enable discard pile selection
    // Wait for user to select discard tile
    // Perform swap
    // Re-enable normal game flow
    this.isSwappingBlank = false;
}
```

---

### 8. AI Behavior with Blanks

**File:** `gameAI.js`

**Symbol:** `getTileRecommendations()` method (lines 28-77)

**Changes:**

- Add blank tile evaluation logic
- Blanks should be treated similarly to jokers (high keep value)
- Recommendation: KEEP blanks unless absolutely necessary
- Update secondary sort to prioritize blanks (line 60-73):
  ```javascript
  // Jokers and blanks always first
  const aIsSpecial =
    a.tile.suit === SUIT.JOKER || a.tile.suit === SUIT.BLANK ? 1 : 0;
  const bIsSpecial =
    b.tile.suit === SUIT.JOKER || b.tile.suit === SUIT.BLANK ? 1 : 0;
  return bIsSpecial - aIsSpecial;
  ```

**Symbol:** `chooseDiscard()` method (lines 163-214)

**Changes:**

- AI should avoid discarding blanks
- Only discard blank if it's the only option

**Symbol:** `exchangeTilesForJokers()` method (lines 81-148)

**New Method:** `exchangeBlanksForDiscards()`

- AI logic for deciding when to use blank swaps
- Should evaluate:
  - Which discard pile tiles improve hand strength
  - Cost/benefit of using blank vs keeping it
  - Hand proximity to winning
- Conservative strategy: only swap blanks when significantly beneficial

**Implementation Priority:**

- Phase 1: Basic AI behavior (treat blanks like jokers, don't discard)
- Phase 2: Smart blank swap logic for AI players

---

### 9. Charleston Phase Handling

**Files:** `gameLogic.js`, `gameAI.js`

**Requirement:** Blanks cannot be passed during Charleston (similar to jokers)

**File:** `gameObjects_hand.js`

**Symbol:** Tile selection handler in `insertHidden()` (lines 981-987)

**Update existing joker check:**

```javascript
if (
  this.gameLogic.state === STATE.CHARLESTON1 ||
  this.gameLogic.state === STATE.CHARLESTON2 ||
  this.gameLogic.state === STATE.COURTESY
) {
  if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
    bSelectOk = false;
    this.gameLogic.displayErrorText(
      " Joker and Blank tiles cannot be passed during Charleston ",
    );
  }
}
```

**File:** `gameAI.js`

**Symbol:** `charlestonPass()` method

**Update to exclude blanks:**

- Filter out blanks when selecting tiles to pass
- Similar to existing joker filtering logic

---

### 10. Hand Validation & Sorting

**File:** `gameObjects_hand.js`

**Symbol:** `moveJokerToFront()` method (lines 132-147)

**New Method:** `moveBlankToFront()`

```javascript
moveBlankToFront() {
    const blanks = [];

    for (const tile of this.tileArray) {
        if (tile.suit === SUIT.BLANK) {
            blanks.unshift(tile);
        }
    }

    for (const tile of blanks) {
        // Remove tile
        this.tileArray.splice(this.tileArray.indexOf(tile), 1);
        // Insert in front of array (after jokers)
        // Insert at position equal to number of jokers
        const jokerCount = this.tileArray.filter(t => t.suit === SUIT.JOKER).length;
        this.tileArray.splice(jokerCount, 0, tile);
    }
}
```

**Update Sorting Logic:**

- Call `moveBlankToFront()` after `moveJokerToFront()` in both:
  - `sortRankHidden()` method
  - `sortSuitHidden()` method

**Tile Ordering:** Jokers → Blanks → Regular Tiles

---

### 11. Card Validation System

**File:** `card/card.js`

**Important:** Blanks should NOT be valid components in winning hands

**Symbol:** `validateHand()` method

**Changes:**

- Filter out blank tiles before validation
- Blanks are utility tiles, not part of mahjong patterns
- A winning hand cannot include blanks

**Validation Logic:**

```javascript
// Before validating, remove blanks
const validationTiles = hand.filter((tile) => tile.suit !== SUIT.BLANK);

// Must have exactly 14 non-blank tiles to win
if (validationTiles.length !== 14) {
  return false; // Cannot win with blanks in hand
}
```

**Implications:**

- Players must swap all blanks before declaring Mahjong
- Or discard all blanks during normal play
- This matches real-world American Mahjong rules

---

### 12. Visual & Audio Feedback

**Sprite Assets Needed:**

- `blank_tile.png` (face-up sprite)
- Blank tile should be visually distinct
- Recommended design: Empty tile with "BLANK" text or special border

**Audio:**

- Consider unique sound effect for blank swap (optional)
- Can reuse existing tile placement sounds

**Visual Feedback:**

- Highlight discard pile tiles when swap is active
- Similar to exposed joker highlighting during joker swap
- Show visual indicator on blank tiles in hand (glow effect)

**File:** `gameObjects.js`

**Symbol:** `Tile` class

**Update:** Add sprite path for blank tiles in `showTile()` method

---

### 13. Testing Scenarios

**Unit Test Cases:**

1. **Tile Count Validation:**
   - Wall starts with 160 tiles when blanks enabled
   - Wall starts with 152 tiles when blanks disabled
   - Tile count validation passes with 160 tiles

2. **Blank Swap Functionality:**
   - Player can swap blank for regular tile in discard pile
   - Player cannot swap blank for joker in discard pile
   - Blank moves to discard pile after swap
   - Selected tile moves to player's hand after swap

3. **Charleston Phase:**
   - Blanks cannot be selected during Charleston
   - Error message displays when trying to select blank
   - AI does not pass blanks during Charleston

4. **Hand Validation:**
   - Hand with blanks cannot declare Mahjong
   - Hand with 14 non-blank tiles can declare Mahjong
   - Blanks are excluded from pattern matching

5. **AI Behavior:**
   - AI keeps blanks (doesn't discard)
   - AI swaps blanks strategically
   - AI handles blanks similar to jokers in recommendations

6. **Settings Persistence:**
   - Blank tiles setting saves to localStorage
   - Setting persists across page reloads
   - Game respects setting when creating wall

**Integration Tests:**

1. Full game with blanks enabled
2. Full game with blanks disabled
3. Blank swap during different game states
4. Multiple consecutive blank swaps
5. Blank tile sorting and display

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Priority:** HIGH
**Estimated Effort:** 3-4 hours

1. Add BLANK suit to constants.js
2. Add blank tile group to gTileGroups
3. Update all hardcoded tile counts (152 → 160)
4. Add blank tile sprites/assets
5. Test tile creation and wall initialization

**Deliverable:** Game runs with 160 tiles, blank tiles visible in wall

---

### Phase 2: Settings Integration

**Priority:** HIGH
**Estimated Effort:** 2-3 hours

1. Update settings.html with house rules checkbox
2. Add settings methods to SettingsManager
3. Add conditional wall creation based on setting
4. Test setting persistence and game behavior

**Deliverable:** Setting toggles blank tile feature on/off

---

### Phase 3: Swap UI & Basic Functionality

**Priority:** HIGH
**Estimated Effort:** 4-5 hours

1. Add "Swap Blank" button logic
2. Implement blank tile selection in hand
3. Add discard pile tile selection
4. Implement swap transaction (remove/add tiles)
5. Update displays after swap

**Deliverable:** Human player can swap blanks for discard tiles

---

### Phase 4: Game Rules Integration

**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours

1. Update Charleston phase to block blank passing
2. Update hand validation to exclude blanks
3. Update hand sorting to position blanks correctly
4. Add state management for swap operations
5. Test all game states with blanks

**Deliverable:** Blanks follow American Mahjong rules correctly

---

### Phase 5: AI Behavior

**Priority:** MEDIUM
**Estimated Effort:** 3-4 hours

1. Update AI tile recommendations for blanks
2. Prevent AI from discarding blanks
3. Implement basic AI blank swap logic
4. Test AI gameplay with blanks

**Deliverable:** AI handles blanks intelligently

---

### Phase 6: Polish & Testing

**Priority:** LOW
**Estimated Effort:** 2-3 hours

1. Add visual feedback and effects
2. Add audio cues (if desired)
3. Comprehensive testing
4. Bug fixes
5. Documentation updates

**Deliverable:** Production-ready feature

---

## Total Estimated Effort: 17-23 hours

---

## Technical Risks & Considerations

### Risk 1: State Management Complexity

- **Issue:** Allowing swaps "at any time" complicates game state flow
- **Mitigation:** Use state flag approach, carefully manage async operations
- **Fallback:** Restrict swaps to player's turn only (simpler but less flexible)

### Risk 2: AI Blank Swap Strategy

- **Issue:** Optimal blank usage is complex to compute
- **Mitigation:** Start with conservative strategy (rare swaps)
- **Enhancement:** Iteratively improve based on playtesting

### Risk 3: Asset Creation

- **Issue:** Need blank tile sprite artwork
- **Mitigation:** Simple text-based design as placeholder
- **Enhancement:** Professional artwork in future iteration
- **Option1:** back.png is already an asset and can be used for the blank tile.

### Risk 4: Backward Compatibility

- **Issue:** Existing saved games won't work with new tile count
- **Mitigation:** Setting defaults to OFF, only affects new games
- **Enhancement:** Version checking for saved game compatibility

---

## File Modification Summary

| File                   | Changes                                                  | Complexity |
| ---------------------- | -------------------------------------------------------- | ---------- |
| constants.js           | Add BLANK suit, update virtual suits                     | LOW        |
| gameObjects.js         | Add blank tile group, update counts, add Discard methods | MEDIUM     |
| gameLogic.js           | Add swap logic, button management, state handling        | HIGH       |
| gameObjects_hand.js    | Update selection, sorting, Charleston blocking           | MEDIUM     |
| gameObjects_table.js   | Update validation counts                                 | LOW        |
| gameAI.js              | Update recommendations, add swap strategy                | MEDIUM     |
| card/card.js           | Exclude blanks from validation                           | LOW        |
| settings.js            | Add house rules setting methods                          | LOW        |
| index.html             | Add house rules checkbox                                 | LOW        |
| styles.css             | Add house rules styling                                  | LOW        |
| GameScene.js           | Update tile count display                                | LOW        |
| homePageTileManager.js | Update tile count comment                                | LOW        |

---

## Code Style Guidelines

Follow existing patterns in codebase:

- ES6 modules with import/export
- Semicolons required
- Double quotes for strings
- Use const/let, never var
- Strict equality (===)
- Match existing naming conventions
- Add comments for complex logic
- Use debugPrint() for debug logging

---

## Success Criteria

✅ Settings page has working "Use Blank Tiles" checkbox
✅ Wall contains 160 tiles when feature enabled, 152 when disabled
✅ Blank tiles display correctly with unique sprite
✅ "Swap Blank" button appears when player has blanks
✅ Player can swap blank for any non-joker discard tile
✅ Blanks cannot be passed during Charleston
✅ Blanks cannot be part of winning hand
✅ AI handles blanks without crashing
✅ Hand sorting positions blanks after jokers
✅ All tile count validations pass
✅ Feature works across full game lifecycle
✅ Setting persists across sessions

---

## Future Enhancements (Out of Scope)

- Advanced AI blank swap optimization
- Statistics tracking for blank usage
- Tutorial/help text for blank tile rules
- Multiplayer synchronization for blank swaps
- Animated blank swap transitions
- Blank tile sound effects

---

## Notes for Implementation

1. **Start Small:** Implement Phase 1 first, ensure game still works with 160 tiles
2. **Test Incrementally:** Test after each phase, don't wait until the end
3. **Feature Flag:** Use the setting as a feature flag during development
4. **Reference Similar Code:** Study joker swap implementation as template
5. **Ask Questions:** Clarify ambiguities before implementing
6. **Document As You Go:** Add code comments explaining blank tile logic

---

## Questions for Product Owner

1. Should AI players use blank swaps? (Recommended: Yes, but conservatively)
2. Should blank swaps be allowed during Charleston waiting states? (Recommended: Yes)
3. Should there be a limit on swaps per turn? (Recommended: No limit)
4. Should blank tile design be text-based or graphical? (Recommended: Graphical)
5. Should there be audio feedback for blank swaps? (Recommended: Nice-to-have)

---

## Ready for Implementation

This plan is ready for a developer (Claude Haiku or human) to implement. Each phase has clear deliverables and can be implemented independently. Start with Phase 1 and proceed sequentially for lowest risk.
