# 🤖 Mahjong AI Algorithm Analysis

## Overview

This document provides a comprehensive analysis of the AI algorithms used in your American Mahjong game. The AI system uses sophisticated algorithms for hand evaluation, tile ranking, and strategic decision-making that powers both the bot players and the hint system.

## 🔍 Core Architecture

The AI system consists of several interconnected components:

```
GameAI Class (gameAI.js)
├── Tile Ranking System
├── Hand Analysis Engine
├── Strategic Decision Making
├── Charleston Logic
├── Courtesy Vote System
└── Exposure Management
```

## 🧮 Key Variables and Data Structures

### Primary Objects

- **`hand`** - Player's current hand (14 tiles)
- **`rankCardHands`** - Array of ranked possible hands from the card system
- **`tileRankArray`** - Array of tiles ranked by discard priority
- **`rankInfo`** - Contains hand description, group, rank score, and component info

### Important Constants

```javascript
SUIT = {
  CRACK: 0, // Characters
  BAM: 1, // Bamboos
  DOT: 2, // Dots
  WIND: 3, // Winds
  DRAGON: 4, // Dragons
  FLOWER: 5, // Flowers
  JOKER: 6, // Jokers
};

VNUMBER = {
  CONSECUTIVE1: 10, // Start of consecutive number sequences
  CONSECUTIVE2: 11,
  CONSECUTIVE3: 12,
  CONSECUTIVE4: 13,
  CONSECUTIVE5: 14,
  CONSECUTIVE6: 15,
  CONSECUTIVE7: 16,
};
```

## 🎯 Core Algorithms

### 1. Hand Ranking Algorithm (`card.rankHandArray14()`)

**Purpose:** Foundation of all AI decisions - evaluates how well current tiles match winning hand patterns.

**Location:** `card/card.js` lines 418-549

**Core Formula:**

```javascript
rank += ((100 * comp.count) / 14) * (count / comp.count);
```

**Variables Explained:**

- `comp.count` - Required tiles for this component (3, 4, 7, etc.)
- `count` - Actual matching tiles found in hand
- `comp.count / 14` - Weight based on component size
- `count / comp.count` - Completion ratio (0.0 to 1.0)

**Algorithm Sequence:**

1. **Virtual Suit Permutation** - Tests all possible suit assignments for VSUIT1, VSUIT2, VSUIT3
2. **Component Matching** - Matches hand tiles against each hand pattern component
3. **Joker Optimization** - Uses jokers to fill incomplete components (lines 684-715)
4. **Ranking Calculation** - Weights components by size and completion percentage
5. **Best Score Selection** - Keeps highest rank across all permutations

**Key Code Section:**

```javascript
// Lines 532-540 in card.js
let rank = 0;
for (const componentInfo of componentInfoArray) {
  const comp = componentInfo.component;
  const count = componentInfo.tileArray.length;

  // Update rank based on number of matching tiles (count) with the component length (comp.count)
  // Each component is worth 100 * comp.count / 14.
  rank += ((100 * comp.count) / 14) * (count / comp.count);
}
```

### 2. Tile Ranking Algorithm (`gameAI.rankTiles14()`)

**Purpose:** Determines which tile to discard by measuring the impact of removing each tile.

**Location:** `gameAI.js` lines 44-96

**Core Formula:**

```javascript
for (let j = 0; j < rankCardHands.length; j++) {
  let scale = 1.0;
  if (rankCardHands[j].rank > 50) {
    // Weight high ranking hands more heavily
    scale = rankCardHands[j].rank;
  }
  rank += (copyHandRankArray[j].rank - rankCardHands[j].rank) * scale;
}
```

**Variables Explained:**

- `copyHandRankArray[j].rank` - Hand rank WITHOUT this tile
- `rankCardHands[j].rank` - Hand rank WITH this tile
- `scale` - Weighting factor for high-value hands (>50 rank)
- `rank` - Final discard priority (higher = better to discard)

**Algorithm Sequence:**

1. **Remove Each Tile** - Systematically removes each hidden tile
2. **Re-rank Hand** - Calculates new hand strength without that tile
3. **Delta Calculation** - Measures impact of removing each tile
4. **Weighted Scoring** - Emphasizes impact on high-ranking hands
5. **Sort by Priority** - Orders tiles from least valuable to most valuable to keep

**Key Code Section:**

```javascript
// Lines 68-75 in gameAI.js
// For each tile
for (let i = 0; i < test.length; i++) {
  const tile = test[i];

  // Make copy of hand
  const copyHand = hand.dupHand();

  // Replace tile with a bogus non-matchable tile
  copyHand.hiddenTileSet.tileArray[i] = new Tile(SUIT.INVALID, VNUMBER.INVALID);

  // Get card rank array of copyHand
  const copyHandRankArray = this.card.rankHandArray14(copyHand);
  let rank = 0;

  // Compute rank for this tile
  // - compare delta in testRankArray and rankCardHands
  // - don't discard tiles that would cause large negative deltas
  for (let j = 0; j < rankCardHands.length; j++) {
    let scale = 1.0;
    if (rankCardHands[j].rank > 50) {
      // Weight high ranking hands more heavily
      scale = rankCardHands[j].rank;
    }
    rank += (copyHandRankArray[j].rank - rankCardHands[j].rank) * scale;
  }
}
```

### 3. Joker Exchange Logic (`gameAI.exchangeTilesForJokers()`)

**Purpose:** Determines when to exchange tiles for jokers in exposed sets.

**Location:** `gameAI.js` lines 112-173

**Algorithm:**

```javascript
// Lines 162-170 in gameAI.js
if (bestTile && bestRank > 0) {
  debugPrint("exchangeTilesForJokers. bestRank = " + bestRank + "\n");

  // Hand improved with joker.  Make the exchange in the real hand.
  this.table.exchangeJoker(currPlayer, hand, bestTile);

  return true;
}

return false;
```

**Variables:**

- `bestRank` - Best hand improvement score
- `bestTile` - Tile that produces maximum improvement
- **Threshold:** Only exchanges if `bestRank > 0` (net positive)

**Sequence:**

1. **Find Exchangeable Jokers** - Scans exposed sets for jokers
2. **Test Each Exchange** - Temporarily replaces tile with joker and re-ranks
3. **Calculate Improvement** - Measures hand strength gain
4. **Execute Best Exchange** - Performs exchange with highest improvement

### 4. Exposure Decision Making (`gameAI.claimDiscard()`)

**Purpose:** Decides whether to claim a discarded tile for exposure (pung/kong/quint).

**Location:** `gameAI.js` lines 262-315

**Algorithm:**

```javascript
// Lines 285-306 in gameAI.js
if (
  !copyHand.isAllHidden() ||
  (!rankInfo.hand.concealed && rankInfo.rank > 55)
) {
  // Find component with the discarded tile
  let compInfo = null;
  outerloop: for (const tempcompInfo of rankInfo.componentInfoArray) {
    for (const tile of tempcompInfo.tileArray) {
      if (tile === discardTile) {
        compInfo = tempcompInfo;
        break outerloop;
      }
    }
  }

  if (
    compInfo &&
    this.validateComponentForExposure(player, compInfo, discardTile)
  ) {
    // If it's part of a completed component => let's claim it for exposure
    return {
      playerOption: PLAYER_OPTION.EXPOSE_TILES,
      tileArray: compInfo.tileArray,
    };
  }
}
```

**Variables:**

- `copyHand.isAllHidden()` - Whether hand has exposures
- `rankInfo.hand.concealed` - Whether hand pattern requires concealment
- `rankInfo.rank > 55` - Minimum hand strength threshold

### 5. Charleston Strategy (`gameAI.charlestonPass()`)

**Purpose:** Selects tiles to pass during Charleston phase.

**Location:** `gameAI.js` lines 318-337

**Algorithm:**

```javascript
// Lines 323-336 in gameAI.js
const tileRankArray = this.rankTiles13(this.table.players[player].hand);

// Pass tiles
for (let i = 0; i < 3; i++) {
  const rankInfo = tileRankArray[i];
  const tile = rankInfo.tile;

  pass.push(tile);

  // Remove tile from player's hand
  this.table.players[player].hand.removeHidden(tile);
}
```

**Strategy:** Uses the same tile ranking algorithm to select 3 least valuable tiles.

### 6. Courtesy Vote Logic (`gameAI.courtesyVote()`)

**Purpose:** Determines how many tiles to request in courtesy voting.

**Location:** `gameAI.js` lines 339-365

**Algorithm:**

```javascript
// Lines 354-364 in gameAI.js
if (rank < 50) {
  return 3; // Weak hand - want 3 tiles
}
if (rank < 60) {
  return 2; // Moderate hand - want 2 tiles
}
if (rank < 70) {
  return 1; // Good hand - want 1 tile
}

return 0; // Strong hand - want 0 tiles
```

## 🎮 Hint System Implementation

The hint button uses **exactly the same algorithms** as the AI bots:

### Top 3 Hand Recommendations (`gameLogic.js` lines 1097-1109)

```javascript
const rankCardHands = this.card.rankHandArray14(hand);
this.card.sortHandRankArray(rankCardHands);

for (let i = 0; i < 3; i++) {
  const rankInfo = rankCardHands[i];
  printMessage(i + 1 + ". " + rankInfo.hand.description + "\n");
}
```

### Top 3 Discard Recommendations (`gameLogic.js` lines 1110-1116)

```javascript
const tileRankArray = this.gameAI.rankTiles14(hand);
for (let i = 0; i < 3; i++) {
  const rankInfo = tileRankArray[i];
  printMessage(i + 1 + ". " + rankInfo.tile.getText() + "\n");
}
```

## 📊 Sequence of Events for AI Decision Making

### When Player Draws from Wall (`gameAI.chooseDiscard()`)

1. **Mahjong Check** - `card.validateHand14(hand)`
2. **Joker Exchange Loop** - `exchangeTilesForJokers()` (repeated until no improvement)
3. **Mahjong Re-check** - After each exchange
4. **Tile Ranking** - `rankTiles14(hand)`
5. **Execute Discard** - Remove highest-ranked tile

**Code Location:** `gameAI.js` lines 184-232

### When Someone Discards (`gameAI.claimDiscard()`)

1. **Add Discard to Hand** - Creates 14-tile test hand
2. **Mahjong Check** - `card.validateHand14(copyHand)`
3. **Hand Ranking** - `card.rankHandArray14(copyHand)`
4. **Exposure Decision** - Based on hand concealment and strength (>55)
5. **Component Validation** - Ensures valid pung/kong/quint

**Code Location:** `gameAI.js` lines 262-315

## 🧮 Key Formulas Summary

### 1. Component Score

```javascript
component_score = 100 × (component_size / 14) × (tiles_matched / component_size)
```

### 2. Tile Impact

```javascript
tile_impact = (hand_rank_without_tile - hand_rank_with_tile) × weighting_factor
```

### 3. High-Value Weighting (Updated)

```javascript
if (hand_rank > 50) {
  weighting = min(hand_rank, 100); // Capped to prevent over-weighting
} else {
  weighting = 1.0;
}

// Additional penalty for large negative impacts
if (delta < -10) {
  weighting *= 2.0; // Double penalty for significant hand degradation
}
```

### 4. Courtesy Voting (Updated)

```javascript
// More aggressive courtesy voting to encourage tile exchange
tiles_to_request = max(0, 3 - Math.floor((hand_rank - 5) / 10)); // Shifted thresholds down by 5 points
```

### 5. Exposure Threshold (Updated)

```javascript
can_expose = (!has_exposures) OR (hand_rank > 45 AND hand_can_be_exposed)  // Lowered threshold for more aggressive exposures
```

## 🎯 Strategic Principles (Updated)

### Offensive Strategy

- **Component Completion** - Prioritize completing high-scoring hand patterns
- **Joker Optimization** - Use jokers to maximize hand potential with consistent weighting
- **Pattern Flexibility** - Maintain multiple winning possibilities
- **Aggressive Early Development** - Lower thresholds for exposures and courtesy exchanges

### Defensive Strategy

- **High-Impact Weighting** - Avoid discarding tiles that significantly improve opponent hands (capped at 100x, 2x penalty for large deltas)
- **Dangerous Tile Avoidance** - Consider opponent hand patterns when discarding
- **Information Hiding** - Minimize strategic information leakage

### Adaptive Behavior

- **Game Phase Adjustment** - Early game focuses on hand development with more aggressive exposures, late game on defense
- **Opponent Modeling** - Consider likely opponent hand patterns
- **Wall Analysis** - Adjust strategy based on remaining tile probabilities
- **Courtesy Optimization** - More aggressive tile exchange to prevent stagnation

## 🔬 Algorithm Complexity Analysis

### Time Complexity

- **Hand Ranking:** O(n × m × p) where n=tiles, m=hand patterns, p=permutations
- **Tile Ranking:** O(n² × m) where n=tiles, m=hand patterns
- **Joker Exchange:** O(j × m) where j=jokers, m=hand patterns

### Space Complexity

- **Hand Analysis:** O(m) for storing ranked hand arrays
- **Tile Ranking:** O(n) for tile rank results

## 🚀 Performance Optimizations

1. **Caching** - Reuse rank calculations where possible
2. **Early Termination** - Stop processing when sufficient confidence reached
3. **Selective Evaluation** - Only analyze relevant hand patterns
4. **Incremental Updates** - Update rankings incrementally rather than full recalculation

## 📈 AI Difficulty Scaling

The system supports different AI difficulty levels:

### Beginner AI

- Simplified decision making with basic tile ranking
- Limited pattern recognition
- Consistent, predictable behavior

### Intermediate AI

- Enhanced analysis with advanced hand evaluation
- Improved pattern recognition
- Balanced aggressive/defensive play

### Advanced AI

- Full analysis suite with complete decision-making algorithms
- Comprehensive pattern recognition
- Expert-level strategic play

## 🎮 Integration Points

The AI integrates seamlessly with:

- **Game Logic** - Coordinates with game flow and state management
- **Hand Validation** - Uses card system for accurate hand analysis
- **Table Management** - Coordinates with table state and player actions
- **UI System** - Provides hints and suggestions to human players

---

**Key Insight:** The genius of this AI system is that all decisions flow from the same core ranking algorithms, ensuring consistent strategy whether it's bot players making moves or generating hints for human players. The algorithms prioritize long-term hand development while being defensively aware of tile values that help opponents.

**Recent Updates (2025):** To address wall game issues, the AI has been tuned to be more aggressive in early-game development:

- Lowered exposure threshold from 55 to 45 for more proactive hand building
- Enhanced defensive weighting with caps and penalties to prevent over-conservatism
- More aggressive courtesy voting to encourage tile exchange
- Consistent weighting applied across all decision-making functions
