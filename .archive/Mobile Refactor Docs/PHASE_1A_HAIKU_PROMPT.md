# Phase 1A: Data Models Implementation

**Assignee:** Claude Haiku
**Estimated Tokens:** 2K
**Complexity:** Low
**Dependencies:** None (can start immediately)
**Blocks:** Phase 2A (PhaserAdapter needs these models)

---

## Task Overview

Review and refine the data model classes in `core/models/`. These classes represent game state as **plain JavaScript objects with NO Phaser dependencies**. They must work independently of any UI framework.

---

## Files to Review

### 1. `core/models/TileData.js`

**Current State:** Prototype implemented in Phase 1B
**Your Task:** Review and validate

**Requirements:**

- ✅ Plain JavaScript class (no Phaser imports)
- ✅ Properties: `suit`, `number`, `index`
- ✅ Methods:
  - `getText()` - Returns human-readable string like "Crack 5", "North wind", "Joker"
  - `equals(other)` - Compare suit/number (ignores index)
  - `isSameTile(other)` - Compare by index (same physical tile)
  - `clone()` - Deep copy
  - `isJoker()`, `isBlank()`, `isFlower()`, `isWind()`, `isDragon()` - Type checks
  - `isNumberedSuit()` - Check if Crack/Bam/Dot
  - `isInvalid()` - Check if placeholder tile
- ✅ Static helpers:
  - `fromPhaserTile(tile)` - Convert from old system (migration helper)
  - `fromJSON(json)` / `toJSON()` - Serialization

**Validation Tests:**

```javascript
import { TileData } from "./core/models/TileData.js";
import { SUIT } from "./constants.js";

// Test 1: Basic creation and getText()
const tile = new TileData(SUIT.CRACK, 5, 0);
console.assert(tile.getText() === "Crack 5", "getText() failed");

// Test 2: equals() ignores index
const tile1 = new TileData(SUIT.CRACK, 5, 0);
const tile2 = new TileData(SUIT.CRACK, 5, 1);
console.assert(tile1.equals(tile2) === true, "equals() should be true");
console.assert(
  tile1.isSameTile(tile2) === false,
  "isSameTile() should be false",
);

// Test 3: clone() creates independent copy
const original = new TileData(SUIT.BAM, 3, 10);
const cloned = original.clone();
cloned.suit = SUIT.DOT;
console.assert(
  original.suit === SUIT.BAM,
  "clone() should not affect original",
);

// Test 4: Type checks
const joker = new TileData(SUIT.JOKER, 0, 50);
console.assert(joker.isJoker() === true, "isJoker() failed");

const wind = new TileData(SUIT.WIND, 0, 100);
console.assert(wind.isWind() === true, "isWind() failed");

// Test 5: JSON serialization
const tile3 = new TileData(SUIT.DOT, 7, 42);
const json = tile3.toJSON();
const restored = TileData.fromJSON(json);
console.assert(
  restored.equals(tile3) && restored.isSameTile(tile3),
  "JSON roundtrip failed",
);
```

**If Tests Pass:** ✅ File is good, move to next file
**If Tests Fail:** 🔧 Fix issues and re-test

---

### 2. `core/models/HandData.js`

**Current State:** Prototype implemented in Phase 1B
**Your Task:** Review and validate

**Requirements:**

- ✅ Plain JavaScript class (no Phaser imports)
- ✅ Properties:
  - `tiles` - Array of TileData (hidden tiles)
  - `exposures` - Array of ExposureData (exposed sets)
- ✅ Methods:
  - `getLength()` - Total tiles (hidden + exposed)
  - `getHiddenCount()` - Just hidden tiles
  - `addTile(tile)` / `removeTile(tile)` - Manage hidden tiles
  - `addExposure(exposure)` - Add exposed set
  - `hasTile(tile)` - Check if tile exists
  - `countTile(suit, number)` - Count matching tiles
  - `sortBySuit()` / `sortByRank()` - Sort hidden tiles
  - `clone()` - Deep copy
- ✅ Static helpers:
  - `fromPhaserHand(hand)` - Convert from old system
  - `fromJSON(json)` / `toJSON()` - Serialization

**Nested Class: ExposureData**

- Properties: `type` ("PUNG"/"KONG"/"QUINT"), `tiles` (array)
- Methods: `clone()`, `toJSON()`, `fromJSON()`

**Validation Tests:**

```javascript
import { HandData, ExposureData } from "./core/models/HandData.js";
import { TileData } from "./core/models/TileData.js";
import { SUIT } from "./constants.js";

// Test 1: Add/remove tiles
const hand = new HandData();
const tile1 = new TileData(SUIT.CRACK, 1, 0);
const tile2 = new TileData(SUIT.CRACK, 2, 1);
hand.addTile(tile1);
hand.addTile(tile2);
console.assert(hand.getLength() === 2, "getLength() failed");
console.assert(hand.hasTile(tile1) === true, "hasTile() failed");

hand.removeTile(tile1);
console.assert(hand.getLength() === 1, "removeTile() failed");

// Test 2: Count tiles
hand.addTile(new TileData(SUIT.BAM, 5, 10));
hand.addTile(new TileData(SUIT.BAM, 5, 11));
console.assert(hand.countTile(SUIT.BAM, 5) === 2, "countTile() failed");

// Test 3: Exposures
const exposure = new ExposureData();
exposure.type = "PUNG";
exposure.tiles = [
  new TileData(SUIT.DOT, 3, 20),
  new TileData(SUIT.DOT, 3, 21),
  new TileData(SUIT.DOT, 3, 22),
];
hand.addExposure(exposure);
console.assert(hand.getLength() === 4, "Exposure not counted in length"); // 1 hidden + 3 exposed

// Test 4: Sorting
const hand2 = new HandData();
hand2.addTile(new TileData(SUIT.DOT, 5, 0));
hand2.addTile(new TileData(SUIT.CRACK, 2, 1));
hand2.addTile(new TileData(SUIT.BAM, 9, 2));
hand2.sortBySuit();
console.assert(hand2.tiles[0].suit === SUIT.CRACK, "sortBySuit() failed");

// Test 5: Clone
const clonedHand = hand.clone();
clonedHand.addTile(new TileData(SUIT.JOKER, 0, 100));
console.assert(
  hand.getLength() === 4 && clonedHand.getLength() === 5,
  "clone() not independent",
);

// Test 6: JSON serialization
const json = hand.toJSON();
const restored = HandData.fromJSON(json);
console.assert(
  restored.getLength() === hand.getLength(),
  "JSON roundtrip failed",
);
```

**If Tests Pass:** ✅ File is good, move to next file
**If Tests Fail:** 🔧 Fix issues and re-test

---

### 3. `core/models/PlayerData.js`

**Current State:** Prototype implemented in Phase 1B
**Your Task:** Review and validate

**Requirements:**

- ✅ Plain JavaScript class (no Phaser imports)
- ✅ Properties:
  - `position` - Player index (0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT)
  - `name` - Player name
  - `hand` - HandData instance
  - `isHuman` - Boolean (true for position 0)
  - `isCurrentTurn` - Boolean
  - `wind` - String ("N"/"E"/"S"/"W")
- ✅ Methods:
  - `getDefaultName()` - Returns "You", "Opponent 1", etc.
  - `clone()` - Deep copy
- ✅ Static helpers:
  - `fromPhaserPlayer(player)` - Convert from old system
  - `fromJSON(json)` / `toJSON()` - Serialization

**Validation Tests:**

```javascript
import { PlayerData } from "./core/models/PlayerData.js";
import { HandData } from "./core/models/HandData.js";
import { PLAYER } from "./constants.js";

// Test 1: Default names
const player0 = new PlayerData(PLAYER.BOTTOM);
const player1 = new PlayerData(PLAYER.RIGHT);
console.assert(player0.name === "You", "Default name for human failed");
console.assert(player1.name === "Opponent 1", "Default name for AI failed");
console.assert(player0.isHuman === true, "isHuman should be true for BOTTOM");
console.assert(player1.isHuman === false, "isHuman should be false for others");

// Test 2: Hand integration
console.assert(
  player0.hand instanceof HandData,
  "hand should be HandData instance",
);
console.assert(
  player0.hand.getLength() === 0,
  "New player should have empty hand",
);

// Test 3: Wind assignment
player0.wind = "E";
console.assert(player0.wind === "E", "Wind assignment failed");

// Test 4: Clone
const cloned = player0.clone();
cloned.name = "Modified";
console.assert(player0.name === "You", "Clone should not affect original");

// Test 5: JSON serialization
const json = player0.toJSON();
const restored = PlayerData.fromJSON(json);
console.assert(restored.position === player0.position, "JSON roundtrip failed");
console.assert(restored.name === player0.name, "JSON name not preserved");
```

**If Tests Pass:** ✅ File is good
**If Tests Fail:** 🔧 Fix issues and re-test

---

## Additional Guidelines

### Import Rules

**ALLOWED:**

```javascript
import { SUIT, PLAYER, WIND, DRAGON, VNUMBER } from "../../constants.js";
import { gTileGroups } from "../../gameObjects.js"; // Only for tile text generation
import { TileData } from "./TileData.js";
import { HandData } from "./HandData.js";
```

**FORBIDDEN:**

```javascript
import * as Phaser from "phaser"; // ❌ NO PHASER IN core/
import { Tile, Wall } from "../../gameObjects.js"; // ❌ These are Phaser classes
import { GameScene } from "../../GameScene.js"; // ❌ UI layer
```

### Code Style (from CLAUDE.md)

- Use double quotes for strings
- Semicolons required
- `const`/`let` only (no `var`)
- Strict equality `===`
- JSDoc comments for public methods

### Migration Helpers

The `fromPhaserTile()`, `fromPhaserHand()`, `fromPhaserPlayer()` methods are temporary bridges. They convert old Phaser objects → new data models. These will be used in Phase 2A (PhaserAdapter) but are NOT needed for mobile.

---

## Success Criteria

✅ **All validation tests pass**
✅ **No Phaser imports in core/models/**
✅ **ESLint passes** (`npm run lint`)
✅ **Code style matches project conventions**
✅ **JSON serialization works** (save/load ready)

---

## Deliverables

1. **Reviewed/refined code** in:
   - `core/models/TileData.js`
   - `core/models/HandData.js`
   - `core/models/PlayerData.js`

2. **Test file** (optional but recommended):
   - `core/models/test-data-models.js` - Contains all validation tests

3. **Summary report:**
   - What changes were made (if any)
   - Confirmation that all tests pass
   - Any issues found and how they were resolved

---

## How to Run Tests

```bash
# Navigate to project root
cd c:\Repos\mahjong

# Create test file
# (Copy validation tests from above into core/models/test-data-models.js)

# Run tests
node core/models/test-data-models.js

# Expected output: All console.assert() pass silently
# If assertions fail, errors will be thrown
```

---

## Questions?

If anything is unclear:

1. Check [MOBILE_INTERFACES.md](MOBILE_INTERFACES.md) for complete data model specifications
2. Reference existing [gameObjects.js](gameObjects.js) Tile class for comparison
3. See [constants.js](constants.js) for SUIT/PLAYER enums

---

## Next Steps After Phase 1A

Once Haiku confirms Phase 1A is complete and all tests pass, **you (Sonnet 4.5)** will proceed with:

**Phase 2A:** Implement PhaserAdapter

- Bridge GameController → existing Phaser desktop code
- Keep desktop fully functional
- Use the refined data models from Phase 1A

---

**Phase 1A Status:** Ready to start
**Estimated Time:** 30-60 minutes
**Blocking:** Nothing - can start immediately
