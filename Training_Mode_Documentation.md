# 🏋️ Training Mode Documentation

## Overview

Training Mode is a specialized feature in your American Mahjong game designed for practice, learning, and testing specific hand patterns. It allows players to start games with predetermined hand configurations instead of random tile deals, making it perfect for studying mahjong strategy, testing AI behavior, or practicing specific winning hands.

## 🎯 Purpose and Use Cases

### Primary Functions
- **Practice Specific Hands**: Study and practice winning hand patterns
- **AI Testing**: Test AI decision-making with known hand configurations
- **Strategy Learning**: Understand optimal discard and exposure decisions
- **Debugging**: Test game mechanics with controlled scenarios
- **Teaching**: Demonstrate mahjong concepts with predictable outcomes

### When to Use Training Mode
- Learning new hand patterns
- Testing AI algorithms with specific scenarios
- Practicing courtesy and Charleston decisions
- Debugging game logic with reproducible hands
- Teaching mahjong to others with controlled examples

## ⚙️ How Training Mode Works

### UI Controls

The training mode interface consists of two main sections:

#### 1. Training Mode Toggle
```html
<input id="trainCheckbox" type="checkbox">
<label for="trainCheckbox">Training Mode</label>
```

- **Purpose**: Enables/disables training mode
- **Default**: Disabled (normal random game)
- **Effect**: When enabled, reveals additional training options

#### 2. Training Configuration (Only visible when training mode is enabled)

**Hand Selection Dropdown**
```html
<select id="handSelect">
  <!-- Populated dynamically from card.validHandGroups -->
</select>
```
- **Content**: All valid hand patterns from the current card year (2020)
- **Organization**: Grouped by hand categories (e.g., "Singles and Pairs", "Consecutive Numbers", etc.)
- **Purpose**: Selects the specific hand pattern to generate

**Tile Count Selector**
```html
<select id="numTileSelect">
  <option>1</option>...<option>14</option>
</select>
```
- **Range**: 1-14 tiles
- **Default**: 9 tiles
- **Purpose**: Specifies how many tiles to generate for the selected hand pattern

**Skip Charleston Checkbox**
```html
<input id="skipCharlestonCheckbox" type="checkbox">
```
- **Default**: Checked (true)
- **Purpose**: Bypasses Charleston and courtesy phases for faster testing

### Code Implementation

#### Training Info Collection (`gameLogic.js` lines 1154-1173)

```javascript
getTrainingInfo() {
    const traincheckbox = window.document.getElementById("trainCheckbox");
    const handSelect = window.document.getElementById("handSelect");
    const numTileSelect = window.document.getElementById("numTileSelect");
    const skipCharlestonCheckbox = window.document.getElementById("skipCharlestonCheckbox");

    let trainInfo = {
        trainCheckbox: false,
        handDescription: "",
        numTiles: 0,
        skipCharlestonCheckbox: false
    };

    trainInfo.trainCheckbox = traincheckbox.checked;
    trainInfo.handDescription = handSelect.value;
    trainInfo.numTiles = parseInt(numTileSelect.value);
    trainInfo.skipCharlestonCheckbox = skipCharlestonCheckbox.checked;

    return trainInfo;
}
```

#### Hand Generation (`gameLogic.js` lines 82-86)

```javascript
if (trainInfo.trainCheckbox) {
    // Player 0 (human) gets the training hand
    initPlayerHandArray[0] = this.card.generateHand(trainInfo.handDescription, trainInfo.numTiles);
}
```

#### Charleston Skip Logic (`gameLogic.js` lines 144-149)

```javascript
// debugging - skip charleston
if (trainInfo.trainCheckbox && trainInfo.skipCharlestonCheckbox) {
    this.loop();  // Skip directly to main game loop
} else {
    this.charleston();  // Normal Charleston phase
}
```

## 🎮 Game Flow in Training Mode

### Normal Game Flow vs Training Mode

#### Standard Game
1. Random tile deal (13 tiles each)
2. Charleston phase (tile passing)
3. Courtesy phase (additional tile exchange)
4. Main game loop (pick, discard, claim)

#### Training Mode Game
1. **Player 0**: Gets specified training hand (1-14 tiles)
2. **Players 1-3**: Get random hands (13 tiles each)
3. **Optional**: Skip Charleston and courtesy phases
4. Main game loop begins

### Key Differences

| Aspect | Normal Game | Training Mode |
|--------|-------------|---------------|
| Player 0 Hand | Random 13 tiles | Specified pattern, custom tile count |
| Players 1-3 Hands | Random 13 tiles | Random 13 tiles |
| Charleston | Always played | Optional (can skip) |
| Courtesy | Always played | Optional (can skip) |
| Starting Tiles | All players start with 13 | Player 0 may start with fewer/more |

## 📚 Available Training Hands

Training mode provides access to all official mahjong hand patterns from the 2020 card. Hands are organized into groups:

### Hand Categories (Examples)

#### Singles and Pairs
- "One Dragon" - Single dragon tile
- "Two Dragons" - Pair of dragons
- "One Wind" - Single wind tile

#### Consecutive Numbers
- "111 222 3333 4444 (2 suits, 4 consecutive numbers)"
- "123 456 789 (3 suits)"
- "13579 (1 suit)"

#### Like Numbers
- "111 222 333 444 555 (5 like numbers, 1 suit)"
- "369 (3 like numbers, 1 suit)"

#### Winds and Dragons
- "North Wind" - Single north wind
- "Three Dragons" - Three different dragons

#### Special Patterns
- "Lucky 13" - 13 different tiles
- "Quints" - Five of a kind
- "Addition Hands" - Bonus scoring combinations

### Complete List

The dropdown is populated dynamically from `card.validHandGroups` in `gameLogic.js` lines 826-836:

```javascript
// Populate hand select
for (const group of this.card.validHandGroups) {
    const optionGroup = window.document.createElement("optgroup");
    optionGroup.label = group.groupDescription;
    handSelect.add(optionGroup);

    for (const validHand of group.hands) {
        const option = window.document.createElement("option");
        option.text = validHand.description;
        handSelect.add(option);
    }
}
```

## 🔧 Configuration Options

### Tile Count Selection

The tile count selector (1-14) allows you to:
- **1-8 tiles**: Practice early hand development
- **9-12 tiles**: Study mid-game decisions
- **13 tiles**: Practice pre-mahjong decisions
- **14 tiles**: Test mahjong validation (though AI will typically discard immediately)

### Charleston Skip Feature

When enabled:
- **Benefits**: Faster game setup, focus on main gameplay
- **Use Cases**: Testing discard decisions, AI behavior, hand patterns
- **Limitations**: Misses Charleston strategy practice

When disabled:
- **Benefits**: Full game experience, practice all phases
- **Use Cases**: Complete training scenarios, strategy practice

## 🎯 Practical Usage Examples

### Example 1: Learning a New Hand Pattern
1. Enable Training Mode
2. Select "111 222 3333 4444 (2 suits, 4 consecutive numbers)"
3. Set tile count to 13
4. Enable "Skip Charleston"
5. Start game and practice completing the hand

### Example 2: Testing AI Discard Logic
1. Enable Training Mode
2. Select a complex hand pattern
3. Set tile count to 14
4. Enable "Skip Charleston"
5. Start game and observe AI decisions

### Example 3: Teaching Mahjong
1. Enable Training Mode
2. Select simple patterns (e.g., "Three Dragons")
3. Set appropriate tile count
4. Play through complete games to demonstrate concepts

## 🐛 Debugging and Testing Features

### Hand Validation
- Training hands are guaranteed valid (generated by `card.generateHand()`)
- Invalid selections are prevented by dropdown population
- AI can still make suboptimal decisions with training hands

### Tile Count Flexibility
- Allows testing edge cases (very few or many tiles)
- Helps understand AI behavior with incomplete hands
- Useful for testing hand ranking algorithms

### Charleston Bypass
- Speeds up testing cycles
- Allows focus on specific game phases
- Useful for automated testing scenarios

## 🔄 Integration with Game Systems

### AI Behavior
- AI players (1-3) receive normal random hands
- AI decision-making algorithms work identically
- Training mode doesn't affect AI intelligence

### Hint System
- Hint button works normally with training hands
- Provides top 3 hand recommendations and discard suggestions
- Useful for learning optimal play with specific hands

### Game Validation
- All game rules apply normally
- Training hands must still follow mahjong rules
- Invalid mahjongs are still detected

## 📊 Benefits for Development

### For Game Developers
- **Reproducible Testing**: Test specific scenarios consistently
- **AI Validation**: Verify AI decisions with known inputs
- **Bug Reproduction**: Recreate specific hand configurations
- **Performance Testing**: Benchmark with controlled tile distributions

### For Players
- **Skill Building**: Practice specific hand patterns
- **Strategy Learning**: Understand optimal decisions
- **Pattern Recognition**: Learn to identify winning combinations
- **Confidence Building**: Master difficult hand types

## 🚀 Future Enhancements

Potential improvements to training mode:
- Save/load custom hand configurations
- Multiple training scenarios per session
- Hand progression tutorials
- AI difficulty adjustment for training
- Statistical analysis of training games

---

**Training Mode** - Your gateway to mastering American Mahjong through focused practice and strategic learning