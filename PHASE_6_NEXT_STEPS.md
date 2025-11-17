# Phase 6 - Remaining Steps

## Summary
We've made excellent progress! HandRenderer is now clean, and most references are fixed. The remaining work is primarily **SelectionManager refactoring** and cleanup.

## Already Complete ✅
1. ✅ Created clean HandRenderer (no table dependency)
2. ✅ Created CardHand for card validator
3. ✅ Replaced old HandRenderer with new version
4. ✅ Fixed PhaserAdapter constructor
5. ✅ Eliminated setValidationMode() calls
6. ✅ Fixed wall game showHand() loop
7. ✅ Added calculateTilePosition() to HandRenderer
8. ✅ Fixed 2 table.players references (onTileDrawn, onHandUpdated)
9. ✅ Added PLAYER_LAYOUT import

## Remaining Work (6-8 hours estimated)

### CRITICAL: SelectionManager Refactor

**Problem**: SelectionManager constructor receives legacy `hand` object and calls `hand.hiddenTileSet.getTileArray()` in 4 places.

**Solution**:
1. Change constructor to receive `handRenderer` instead of `hand`
2. Change `this.hand` to `this.handRenderer`
3. Update 4 calls from `this.hand.hiddenTileSet.getTileArray()` to `this.handRenderer.getHiddenTiles(0)`

**Files to update**:
- [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js#L22) - Constructor signature
- [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js#L311) - getTileArray() call 1
- [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js#L354) - getTileArray() call 2
- [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js#L507) - getTileArray() call 3
- [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js#L760) - getTileArray() call 4
- [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js#L64-66) - Constructor call

**Code changes**:

```javascript
// SelectionManager.js constructor
// OLD
constructor(hand, playerAngle, buttonManager = null) {
    this.hand = hand;

// NEW
constructor(handRenderer, playerAngle, buttonManager = null) {
    this.handRenderer = handRenderer;
    this.playerIndex = 0;  // SelectionManager only used for PLAYER.BOTTOM

// SelectionManager.js - all 4 getTileArray() calls
// OLD
const tiles = this.hand.hiddenTileSet.getTileArray();

// NEW
const tiles = this.handRenderer.getHiddenTiles(this.playerIndex);

// PhaserAdapter.js line 64-66
// OLD
const humanHand = table.players[PLAYER.BOTTOM].hand;
const playerAngle = table.players[PLAYER.BOTTOM].playerInfo.angle;
this.selectionManager = new SelectionManager(humanHand, playerAngle, this.buttonManager);

// NEW
const playerAngle = PLAYER_LAYOUT[PLAYER.BOTTOM].angle;
this.selectionManager = new SelectionManager(this.handRenderer, playerAngle, this.buttonManager);
```

### Fix Remaining table.players References

**Line 343** (onTileDrawn):
```javascript
// OLD
const player = this.table.players[playerIndex];
// ... uses player.playerInfo

// NEW
const playerInfo = PLAYER_LAYOUT[playerIndex];
// ... use playerInfo directly
```

**Line 442** (onDiscard):
```javascript
// OLD
const humanHand = this.table.players[PLAYER.BOTTOM].hand;

// NEW
// Check what this is used for - might be BlankSwapManager
// Likely can be removed or use handRenderer.getHiddenTiles()
```

**Line 492** (onTilesExposed):
```javascript
// OLD
const claimingPlayerData = this.table.players[claimingPlayer];

// NEW
// Check usage - likely just needs playerInfo
const playerInfo = PLAYER_LAYOUT[claimingPlayer];
```

**Line 514** (onTilesExposed):
```javascript
// OLD
const player = this.table.players[playerIndex];

// NEW
const playerInfo = PLAYER_LAYOUT[playerIndex];
```

**Line 978, 987** (onSortRequest):
```javascript
// Line 978 - validation check
// OLD
if (playerIndex < 0 || playerIndex >= this.table.players.length) {

// NEW
if (playerIndex < 0 || playerIndex >= 4) {

// Line 987 - get player
// OLD
const player = this.table.players[playerIndex];

// NEW - check what's needed from player
```

**Line 1006** (onSortRequest):
```javascript
// OLD
const humanPlayer = this.table.players[PLAYER.BOTTOM];
humanPlayer.hand.sortSuitHidden();

// NEW
// Sorting already handled by HandRenderer.syncAndRender() auto-sort
// Just re-render or trigger HAND_UPDATED event
```

### Fix table.reset() and table.switchPlayer()

**table.reset()** (line 216):
- Check what gameObjects_table.reset() does
- Extract tile management to TileManager if needed
- Or keep minimal table structure

**table.switchPlayer()** (line 612):
- This just logs messages
- Replace with direct `printMessage()` call
- DELETE table.switchPlayer() method

### Update BlankSwapManager (if needed)

BlankSwapManager might access hand - check constructor and methods.

### Final Cleanup

1. Delete [desktop/gameObjects/gameObjects_hand.js](desktop/gameObjects/gameObjects_hand.js)
2. Delete [desktop/gameObjects/gameObjects_player.js](desktop/gameObjects/gameObjects_player.js)
3. Update [desktop/gameObjects/gameObjects_table.js](desktop/gameObjects/gameObjects_table.js):
   - Remove Player import
   - Remove gPlayerInfo constant (now in playerLayout.js)
   - Keep minimal Wall/Discards structure

### Test Everything

```bash
npm test                    # All Playwright tests must pass
npm run test:headed         # Visual verification
npm run knip                # Should report hand/player as unused
```

### Test Scenarios (Critical Path)

1. Charleston phase - tile selection with exact count validation
2. Discard tile - single tile selection
3. Claim with exposure - multi-tile selection for pung/kong
4. Joker swap - selecting tiles from hand
5. Sort buttons - Sort by Suit and Sort by Rank
6. AI hints - glow effects on tiles
7. Wall game - all hands face-up
8. New game reset - clean slate

## Estimated Time Remaining

- SelectionManager refactor: 2-3 hours
- Fix remaining table.players: 1-2 hours
- table.reset/switchPlayer: 1 hour
- Testing & bug fixes: 2-3 hours
- **Total: 6-9 hours**

## Context Window Safety

Current: ~121K / 200K (60.5% used)
Remaining: ~79K (39.5%)

**Status**: SAFE to continue. Plenty of headroom for completion.

## Decision Point

**Option A**: Continue in this session
- ✅ Clear roadmap
- ✅ Momentum established
- ✅ Sufficient context window
- ⚠️ 6-9 hours remaining work

**Option B**: Hand off to fresh session with this document
- ✅ Clean starting point
- ✅ Full context window
- ❌ Need to rebuild mental model
- ❌ Break momentum

**Recommendation**: Continue if time permits. We're past the hardest parts (architecture decisions). Remaining work is mechanical refactoring.
