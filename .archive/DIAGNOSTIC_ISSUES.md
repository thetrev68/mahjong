# Game Issues Diagnostic Report

## Issues to Document

### Desktop (Phaser) Version
**Status**: ❌ BROKEN

What we're seeing:
- [ ] Tiles not rendering
- [ ] Tile animations not playing
- [ ] Hand count wrong (describe the count)
- [ ] Charleston UI showing wrong dialog
- [ ] Game freezing at (which state?)
- [ ] Console errors (copy/paste key errors here)

What should happen:
- Tiles should animate from wall position to player hands during dealing
- Each player should have exactly 13 tiles after dealing 
    (Trevor: Player 0 gets 14 tiles)
- Charleston phase should show tile selection UI
- Game should smoothly transition between phases

---

### Mobile (HTML/CSS) Version
**Status**: ? UNKNOWN

Need to test:
- [ ] Does mobile version still work?
- [ ] Are tiles rendering?
- [ ] Do AI decisions still work (chooseDiscard, charlestonPass, etc)?
- [ ] Does game complete without freezing?

---

### Core AIEngine (Shared by Both)
**Status**: ? UNKNOWN

Changed in our fixes:
1. AIEngine now requires Card to be passed in constructor
2. Card must be initialized before AIEngine is used
3. Passing Phaser Tile objects through events (DESKTOP ONLY - should not affect mobile)

Need to verify:
- [ ] AIEngine constructor signature correct?
- [ ] AIEngine methods still work with expected input types?
- [ ] Mobile code passing Card correctly?

---

## Architecture Issue

**CRITICAL ISSUE**: Our changes passed Phaser Tile objects through events.
- Desktop (Phaser): ✅ Correct - Phaser Tile objects exist
- Mobile (HTML/CSS): ❌ BROKEN - Mobile doesn't have Phaser Tile objects!

**Question**: Does mobile have its own tile representation? Where does it create tiles?
    (Trevor: see mobile/renderers/HandRenderer.js and mobile/components/MobileTile.js)
---

## Changes Made Today

1. **GameScene.js:66-80** - Reordered Card/AIEngine initialization
2. **core/GameController.js** - Changed TILE_DRAWN and TILE_DISCARDED to pass Phaser Tile objects
3. **desktop/adapters/PhaserAdapter.js** - Updated to accept Phaser Tile objects directly

**Issue**: Changes #2 and #3 are PHASER-SPECIFIC but we modified core GameController which is shared!

---

## Quick Test Checklist

### Desktop Test (Phaser)
```javascript
npm run dev
// Then in browser:
1. Click "Start Game"
2. Watch tiles - do they animate? 
    (Trevor: Sort of. They animate off the home page, then magically appear in player hands. The deal animation does not run.)
3. Do all 4 players have 13 tiles?
    (Trevor: Player 0 has 14, others ahve 13. All are correct.)
4. Does Charleston start?
    (Trevor: No. And in fact we have lost our original code that properly handles tile selection. The action panel is empty - no buttons or text.)
5. Can you select tiles to pass?
    (Trevor: Sort of. I can click a tile and it discards immediately. But it is not supposed to. I should click a tile and have it raise up to a selected position (575 vs 600) then wait for me to press discard (or pass) on the action panel.)

    [Trevor: It appears a substantial amount of our original code has been re-written poorly. commit 07c41b91f015a12473d641564e2b454d324fb742 was the last known good fully functional desktop version.]
```

### Mobile Test (if applicable)
```javascript
// Check if mobile version even launches
// If it does, test similar flow
```

### AIEngine Isolation Test
```bash
npm test -- tests/aiengine.test.js
// Should pass if AIEngine core logic unchanged
```

---

## Suspected Problems

1. **Mobile doesn't have Phaser Tile objects** - Our changes assume tile is a Phaser object
2. **GameController shouldn't emit Phaser objects** - It should emit platform-agnostic data
3. **Tile rendering still broken** - Even with correct objects, might not be displaying
4. **Hand synchronization** - Tile counts wrong suggests duplicate/missing tiles

