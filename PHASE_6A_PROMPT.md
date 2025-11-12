# Phase 6A: AIEngine Refactor for Platform-Agnostic AI

**Assignee:** Claude Sonnet 4.5 (You)
**Complexity:** High
**Estimated Tokens:** 20K
**Prerequisites:** Phase 1B complete (core/GameController and data models exist)

---

## Task Overview

Refactor the existing `gameAI.js` into a platform-agnostic `core/AIEngine.js` that works with plain data models instead of Phaser objects. This enables the AI to work on both desktop (Phaser) and mobile (DOM-based) platforms.

**Key Challenge:** The current AI works directly with Phaser `Hand` objects that have methods like `.getHiddenTileArray()`. The new AI must work with plain `HandData` objects that only contain data.

**Good News:** Analysis shows `gameAI.js` has **zero** `this.scene` references, making migration straightforward.

---

## Current Architecture Analysis

### Current Dependencies

**gameAI.js imports:**
```javascript
import {debugPrint, gdebug} from "./utils.js";
import {PLAYER_OPTION, SUIT, VNUMBER} from "./constants.js";
import {Tile} from "./gameObjects.js";  // ❌ Phaser dependency
```

**Key Methods (all need refactoring):**
- `chooseDiscard(hand)` - Takes Phaser Hand, returns Tile to discard
- `claimDiscard(tileThrown, playerThrowing, currPlayer, ignoreRank)` - Decides whether to claim a discard
- `charlestonPass(hand, playersCurrentTiles, passDir, passNum)` - Selects tiles to pass during Charleston
- `courtesyVote(currPlayer)` - Decides whether to vote for courtesy pass
- `exchangeTilesForJokers(currPlayer, hand)` - Optimizes joker placements

### Difficulty System

Already decoupled! The `getDifficultyConfig()` method returns configs for:
- `easy` - 30% randomness, limited pattern consideration
- `medium` - 10% randomness, balanced strategy
- `hard` - 0% randomness, optimal play

This system should be **preserved exactly** in the refactored code.

---

## Target Architecture

### New File Structure

```
core/
├── AIEngine.js              # NEW - Platform-agnostic AI
├── models/
│   ├── TileData.js          # Exists - Plain tile object
│   ├── HandData.js          # Exists - Plain hand object
│   └── PlayerData.js        # Exists - Plain player object
└── GameController.js        # Exists - Uses AIEngine
```

### Interface Transformation

**OLD (gameAI.js):**
```javascript
chooseDiscard(hand) {
    // hand is Phaser Hand object
    const tiles = hand.getHiddenTileArray();  // Returns Phaser Tile[]

    // Work with Phaser Tile objects
    for (const tile of tiles) {
        console.log(tile.suit, tile.number);  // Phaser properties
    }

    return tileToDiscard;  // Returns Phaser Tile
}
```

**NEW (core/AIEngine.js):**
```javascript
chooseDiscard(handData) {
    // handData is plain object {tiles: TileData[], exposures: []}
    const tiles = handData.tiles;  // Returns TileData[]

    // Work with plain TileData objects
    for (const tile of tiles) {
        console.log(tile.suit, tile.number);  // Plain properties
    }

    return tileToDiscard;  // Returns TileData
}
```

---

## Deliverables

### 1. Core AIEngine Class

**File:** `core/AIEngine.js`

Create a new file that mirrors gameAI.js but works with data models:

```javascript
import {debugPrint, gdebug} from "../utils.js";
import {PLAYER_OPTION, SUIT, VNUMBER} from "../constants.js";
import {TileData} from "./models/TileData.js";  // ✅ Plain data

// PRIVATE CONSTANTS (copy from gameAI.js)
const TILE_RECOMMENDATION = {
    KEEP: "KEEP",
    PASS: "PASS",
    DISCARD: "DISCARD"
};

export class AIEngine {
    /**
     * @param {Card} card - Hand validation engine (already platform-agnostic)
     * @param {TableData} tableData - Plain game state object
     * @param {string} difficulty - "easy", "medium", or "hard"
     */
    constructor(card, tableData, difficulty = "medium") {
        this.card = card;
        this.tableData = tableData;  // Plain object, not Phaser Table
        this.difficulty = difficulty;
        this.config = this.getDifficultyConfig(difficulty);
    }

    /**
     * Get difficulty configuration
     * @param {string} difficulty
     * @returns {Object} Configuration object
     *
     * IMPORTANT: Copy this method exactly from gameAI.js - do NOT modify
     */
    getDifficultyConfig(difficulty) {
        // ... copy entire method from gameAI.js lines 23-100
    }

    /**
     * Choose which tile to discard
     * @param {HandData} handData - Plain hand data {tiles: TileData[], exposures: []}
     * @returns {TileData} Tile to discard
     */
    chooseDiscard(handData) {
        // Implementation: Adapt from gameAI.js chooseDiscard()
        // Main changes:
        // - handData.tiles instead of hand.getHiddenTileArray()
        // - Work with TileData objects instead of Phaser Tiles
        // - Return TileData instead of Phaser Tile
    }

    /**
     * Decide whether to claim a discarded tile
     * @param {TileData} tileThrown
     * @param {number} playerThrowing - Player index (0-3)
     * @param {PlayerData} currPlayerData
     * @param {boolean} ignoreRank
     * @returns {string|null} PLAYER_OPTION constant or null
     */
    claimDiscard(tileThrown, playerThrowing, currPlayerData, ignoreRank = false) {
        // Implementation: Adapt from gameAI.js claimDiscard()
    }

    /**
     * Select tiles to pass during Charleston
     * @param {HandData} handData
     * @param {TileData[]} playersCurrentTiles
     * @param {string} passDir - "left", "right", "across"
     * @param {number} passNum - Pass number (1, 2, 3)
     * @returns {TileData[]} Array of 3 tiles to pass
     */
    charlestonPass(handData, playersCurrentTiles, passDir, passNum) {
        // Implementation: Adapt from gameAI.js charlestonPass()
    }

    /**
     * Decide whether to vote for courtesy pass
     * @param {PlayerData} currPlayerData
     * @returns {boolean} True to vote yes, false to vote no
     */
    courtesyVote(currPlayerData) {
        // Implementation: Adapt from gameAI.js courtesyVote()
    }

    /**
     * Optimize joker placements in hand
     * @param {PlayerData} currPlayerData
     * @param {HandData} handData
     * @returns {Object} {shouldExchange: boolean, newHand?: TileData[]}
     */
    exchangeTilesForJokers(currPlayerData, handData) {
        // Implementation: Adapt from gameAI.js exchangeTilesForJokers()
    }

    // ========== PRIVATE HELPER METHODS ==========
    // Copy and adapt all private methods from gameAI.js:
    // - getTileRecommendations()
    // - rankTiles13()
    // - rankTiles14()
    // - etc.
}
```

---

## Migration Strategy

### Step 1: Copy Structure

1. Copy `gameAI.js` to `core/AIEngine.js`
2. Rename class `GameAI` → `AIEngine`
3. Update imports:
   - Change `"./utils.js"` → `"../utils.js"`
   - Change `"./constants.js"` → `"../constants.js"`
   - **Remove** `import {Tile} from "./gameObjects.js"`
   - **Add** `import {TileData} from "./models/TileData.js"`

### Step 2: Update Constructor

**OLD:**
```javascript
constructor(card, table, difficulty = "medium")
```

**NEW:**
```javascript
constructor(card, tableData, difficulty = "medium")
```

Change all references from `this.table` → `this.tableData`.

### Step 3: Refactor Method Signatures

For each method, transform parameter types:

| Old Type (gameAI.js) | New Type (AIEngine.js) | Transformation |
|---------------------|----------------------|----------------|
| `Hand` (Phaser) | `HandData` (plain) | `hand.getHiddenTileArray()` → `handData.tiles` |
| `Tile` (Phaser) | `TileData` (plain) | Access properties directly |
| `Player` (Phaser) | `PlayerData` (plain) | `player.hand` → `playerData.handData` |
| `Table` (Phaser) | `TableData` (plain) | `this.table.players` → `this.tableData.players` |

### Step 4: Adapt Key Method Bodies

#### Example: `chooseDiscard()`

**OLD (gameAI.js):**
```javascript
chooseDiscard(hand) {
    const hiddenTiles = hand.getHiddenTileArray();  // Phaser method

    if (hiddenTiles.length === 13) {
        return this.rankTiles13(hand);
    } else if (hiddenTiles.length === 14) {
        return this.rankTiles14(hand);
    }
}
```

**NEW (AIEngine.js):**
```javascript
chooseDiscard(handData) {
    const hiddenTiles = handData.tiles;  // Plain array

    if (hiddenTiles.length === 13) {
        return this.rankTiles13(handData);
    } else if (hiddenTiles.length === 14) {
        return this.rankTiles14(handData);
    }
}
```

#### Example: `getTileRecommendations()`

This method uses `this.card.rankHand()`, which already works with plain data. Main change:

**OLD:**
```javascript
const hiddenTiles = hand.getHiddenTileArray();
const exposures = hand.exposedTileSets.map(ts => ({
    type: ts.type,
    tiles: ts.tiles  // Phaser Tiles
}));
```

**NEW:**
```javascript
const hiddenTiles = handData.tiles;
const exposures = handData.exposures.map(exp => ({
    type: exp.type,
    tiles: exp.tiles  // TileData
}));
```

### Step 5: Handle Tile Comparisons

**OLD (gameAI.js):**
```javascript
// Phaser Tiles have unique indexes
if (tile1.index === tile2.index) { ... }
```

**NEW (AIEngine.js):**
```javascript
// TileData has equals() method
if (tile1.equals(tile2)) { ... }  // Compares suit + number

// Or compare by index if needed
if (tile1.index === tile2.index) { ... }
```

---

## Critical Logic to Preserve

### 1. Difficulty Configuration (Lines 23-100)

**Do NOT modify this logic.** Copy exactly as-is. This system is well-tuned and should remain unchanged.

### 2. Tile Ranking Algorithm

The core ranking logic in `getTileRecommendations()` must be preserved:
- Pattern matching via `this.card.rankHand()`
- Component analysis (Pairs, Pungs, Kongs, Runs, Quints)
- Joker valuation
- Keep/Pass/Discard recommendations

### 3. Charleston Strategy

The Charleston tile selection uses sophisticated heuristics:
- Pass least valuable tiles
- Never pass jokers
- Consider hand strength before passing useful tiles

### 4. Exposure Decisions

Exposure timing based on hand rank and difficulty config must remain intact.

---

## Testing Strategy

### Unit Tests

Create `core/AIEngine.test.js`:

```javascript
import {AIEngine} from './AIEngine.js';
import {TileData} from './models/TileData.js';
import {HandData} from './models/HandData.js';
import {Card} from '../card/card.js';

describe('AIEngine', () => {
    let aiEngine;
    let card;

    beforeEach(() => {
        card = new Card();
        card.init(2025);

        const tableData = {
            players: [
                { handData: null, exposures: [] },
                { handData: null, exposures: [] },
                { handData: null, exposures: [] },
                { handData: null, exposures: [] }
            ]
        };

        aiEngine = new AIEngine(card, tableData, 'medium');
    });

    test('chooseDiscard returns TileData', () => {
        const handData = new HandData([
            new TileData(SUIT.CRACK, 1, 0),
            new TileData(SUIT.CRACK, 2, 1),
            // ... 12 more tiles
        ]);

        const discard = aiEngine.chooseDiscard(handData);

        expect(discard).toBeInstanceOf(TileData);
        expect(handData.tiles).toContain(discard);
    });

    test('difficulty config affects decisions', () => {
        const easyAI = new AIEngine(card, {}, 'easy');
        const hardAI = new AIEngine(card, {}, 'hard');

        expect(easyAI.config.discardRandomness).toBe(0.3);
        expect(hardAI.config.discardRandomness).toBe(0);
    });
});
```

### Integration Tests

Test with GameController:

```javascript
// In core/GameController.js
import {AIEngine} from './AIEngine.js';

class GameController {
    constructor() {
        this.aiEngine = new AIEngine(this.card, this.tableData, 'medium');
    }

    handleAITurn(playerIndex) {
        const playerData = this.tableData.players[playerIndex];
        const discard = this.aiEngine.chooseDiscard(playerData.handData);

        // Emit event with TileData
        this.emit('AI_DISCARDED', {
            player: playerIndex,
            tile: discard
        });
    }
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Trying to call Phaser methods

```javascript
// WRONG
const tiles = handData.getHiddenTileArray();  // Method doesn't exist!

// RIGHT
const tiles = handData.tiles;  // Plain array property
```

### ❌ Pitfall 2: Returning Phaser objects

```javascript
// WRONG
return new Tile(scene, x, y, suit, number);  // Phaser object

// RIGHT
return new TileData(suit, number, index);  // Plain data
```

### ❌ Pitfall 3: Modifying difficulty configs

```javascript
// WRONG
getDifficultyConfig(difficulty) {
    return {
        ...configs[difficulty],
        myNewSetting: true  // Don't add new settings!
    };
}

// RIGHT
getDifficultyConfig(difficulty) {
    return configs[difficulty];  // Return as-is
}
```

---

## Integration with Desktop (PhaserAdapter)

The desktop `PhaserAdapter` will need to bridge AIEngine ↔ Phaser objects:

```javascript
// desktop/adapters/PhaserAdapter.js
class PhaserAdapter {
    handleAITurn(playerIndex) {
        // Convert Phaser Hand → HandData
        const phaserHand = this.phaserTable.players[playerIndex].hand;
        const handData = this.convertHandToHandData(phaserHand);

        // Call AIEngine
        const discardTileData = this.aiEngine.chooseDiscard(handData);

        // Convert TileData → Phaser Tile
        const phaserTile = this.findPhaserTile(discardTileData);

        // Trigger Phaser discard animation
        this.animateDiscard(phaserTile);
    }

    convertHandToHandData(phaserHand) {
        const tiles = phaserHand.getHiddenTileArray().map(phaserTile =>
            TileData.fromPhaserTile(phaserTile)
        );

        return new HandData(tiles, phaserHand.exposedTileSets);
    }
}
```

**Note:** This adapter work is out of scope for Phase 6A. Just ensure AIEngine works with plain data.

---

## Acceptance Criteria

When complete, the AIEngine must:

1. ✅ Have zero dependencies on `gameObjects.js` (no Phaser)
2. ✅ Work with `TileData`, `HandData`, `PlayerData` (plain objects)
3. ✅ Preserve all difficulty configurations exactly
4. ✅ Preserve all AI decision algorithms (no logic changes)
5. ✅ Return `TileData` objects, not Phaser `Tile` objects
6. ✅ Pass all unit tests
7. ✅ ESLint passes with no errors

---

## File Locations

```
core/
└── AIEngine.js              # NEW - 800-1000 lines (similar to gameAI.js)

gameAI.js                    # UNCHANGED - Desktop still uses this via PhaserAdapter
```

**Important:** Do NOT delete `gameAI.js`. Desktop still needs it until Phase 2B integration is complete.

---

## Resources

- [gameAI.js](gameAI.js) - Source file to adapt
- [core/models/TileData.js](core/models/TileData.js) - Plain tile structure
- [core/models/HandData.js](core/models/HandData.js) - Plain hand structure
- [MOBILE_INTERFACES.md](MOBILE_INTERFACES.md) - Data model specifications

---

## Expected Timeline

- **Analysis:** 1-2 hours (understand gameAI.js dependencies)
- **Implementation:** 6-8 hours (copy + adapt all methods)
- **Testing:** 2-3 hours (unit tests + integration tests)
- **Total:** 10-15 hours of focused work

---

## Next Steps

After Phase 6A completion:
- Phase 6B will create `shared/SettingsManager.js` for cross-platform settings
- Phase 6C will adapt the settings UI for mobile
- Phase 7A will add comprehensive mobile tests
