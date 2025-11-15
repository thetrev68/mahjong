# Phase 1 - AIEngine Compatibility Analysis

## Issue Summary

GameLogic was refactored to use the new `AIEngine` class instead of `gameAI`. This is a significant improvement, but GameController's method calls to the AI engine need to be updated to match the new AIEngine signatures.

## Method Signature Mismatches

### 1. charlestonPass()
**Current GameController call:**
```javascript
tilesToPass = await this.aiEngine.charlestonPass(player.hand, direction);
```

**AIEngine signature:**
```javascript
charlestonPass(handData) {
    // Only takes handData, not direction
    // Direction is already handled by GameController's pass exchange logic
}
```

**Status:** ⚠️ PARAMETER MISMATCH - Remove `direction` parameter

---

### 2. courtesyVote()
**Current GameController call:**
```javascript
vote = await this.aiEngine.courtesyVote(player.hand);
```

**AIEngine signature:**
```javascript
courtesyVote(handData) {
    // Correctly takes handData
    // Returns 0, 1, 2, or 3
}
```

**Status:** ✅ CORRECT - No changes needed

---

### 3. courtesyPass()
**Current GameController call:**
```javascript
selectedTiles = await this.aiEngine.courtesyPass(player.hand, maxTiles);
```

**AIEngine signature:**
```javascript
courtesyPass(handData, maxCount) {
    // Correctly takes handData and maxCount
    // Returns array of tiles to pass
}
```

**Status:** ✅ CORRECT - No changes needed

---

### 4. chooseDiscard()
**Current GameController call:**
```javascript
tileToDiscard = await this.aiEngine.chooseDiscard(player.hand);
```

**AIEngine signature:**
```javascript
chooseDiscard(handData) {
    // Correctly takes handData
    // Returns single tile to discard
}
```

**Status:** ✅ CORRECT - No changes needed

---

### 5. claimDiscard()
**Current GameController call:**
```javascript
const aiDecision = await this.aiEngine.claimDiscard(lastDiscard, playerIndex, player.hand);
```

**AIEngine signature:**
```javascript
claimDiscard(tileThrown, playerThrowing, handData, ignoreRank = false) {
    // Takes: tile, player index, handData, optional ignoreRank
    // Returns: {playerOption, tileArray}
}
```

**Status:** ✅ CORRECT - Parameter order matches

---

### 6. charlestonContinueVote() [NEW]
**Current GameController call:**
```javascript
const aiVotes = this.players
    .filter(p => !p.isHuman)
    .map(() => this.aiEngine.charlestonContinueVote());
```

**AIEngine signature:**
```javascript
// NOT FOUND IN AIEngine
```

**Status:** ❌ MISSING - No corresponding method in AIEngine

---

## Required Fixes

### Fix 1: charlestonPass() - Remove direction parameter

**File:** core/GameController.js (line 302)

**Current:**
```javascript
tilesToPass = await this.aiEngine.charlestonPass(player.hand, direction);
```

**Fixed:**
```javascript
tilesToPass = await this.aiEngine.charlestonPass(player.hand);
```

**Reason:** Direction is handled by GameController's exchange logic, not needed by AI

---

### Fix 2: charlestonContinueVote() - Implement or remove

**File:** core/GameController.js (line 358)

**Current Problem:**
```javascript
const aiVotes = this.players
    .filter(p => !p.isHuman)
    .map(() => this.aiEngine.charlestonContinueVote());
```

**Options:**

**Option A: Implement in AIEngine**
```javascript
// Add to AIEngine class:
charlestonContinueVote() {
    // Vote to continue to Phase 2 based on hand strength
    const copyHand = this.handData.clone();
    const invalidTile = new TileData(SUIT.INVALID, VNUMBER.INVALID);
    copyHand.addTile(invalidTile);

    const rankCardHands = this.card.rankHandArray14(copyHand);
    this.card.sortHandRankArray(rankCardHands);
    const rankInfo = rankCardHands[0];

    // Vote yes if hand is weak (needs more tiles)
    return rankInfo.rank > this.config.charlestonContinueThreshold;
}
```

**Option B: Use hard-coded logic in GameController**
```javascript
const aiVotes = [true, true, true];  // AI always votes yes
// Or: randomly 50/50
```

**Recommendation:** Option A - Add method to AIEngine for consistency

---

## Implementation Plan

### Step 1: Fix charlestonPass() call
- Remove `direction` parameter from GameController.charlestonPass() call
- This is a simple 1-line fix

### Step 2: Implement charlestonContinueVote() in AIEngine
- Add method to AIEngine class
- Implement logic similar to courtesyVote()
- Use hand rank to determine vote

### Step 3: Test
- Verify all AI method calls work correctly
- Test Charleston Phase 1→2 transition
- Test courtesy voting and passing
- Test main loop pick/discard/claim flow

---

## Code Changes Required

### core/GameController.js (Line ~302)
```diff
- tilesToPass = await this.aiEngine.charlestonPass(player.hand, direction);
+ tilesToPass = await this.aiEngine.charlestonPass(player.hand);
```

### core/AIEngine.js (New method, add after courtesyVote)
```javascript
charlestonContinueVote() {
    // Implement vote logic for continuing to Phase 2
}
```

---

## Why This Matters

The AIEngine refactoring is an improvement because:
1. ✅ Consolidates all AI logic in one place
2. ✅ Uses modern GameController dependency injection pattern
3. ✅ Removes GameAI from GameLogic (cleaner separation)
4. ✅ More maintainable and testable

But GameController needs to be updated to match the new signatures.

---

## Testing Checklist

After making these fixes, verify:

- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Charleston Phase 1 completes
- [ ] AI votes to continue/end Phase 2 correctly
- [ ] Courtesy voting works
- [ ] Main loop AI decisions work (discard, claim, expose)
- [ ] No method not found errors
- [ ] Game flows through all phases

---

## Files to Modify

1. **core/GameController.js**
   - Line 302: Remove direction parameter from charlestonPass() call

2. **core/AIEngine.js**
   - Add charlestonContinueVote() method

3. **No other changes needed** - All other calls are correct

---

## Notes

- GameLogic already uses AIEngine correctly
- No changes needed to GameScene (it passes this.gGameLogic.gameAI which now comes from AIEngine)
- This maintains backward compatibility with GameLogic during Phase 1
- Phase 3 will remove GameLogic entirely and GameController will be the sole consumer of AIEngine
