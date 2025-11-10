# AI Difficulty Implementation Guide
## For Junior Developers / AI Assistants

This guide will walk you through implementing AI difficulty scaling (Easy, Medium, Hard) for the American Mahjong game. Follow each step carefully and in order.

---

## Background Context

**Current State:** The AI opponents always play at expert level, making optimal mathematical decisions every time. They never make mistakes, and they can be too challenging for beginner players or too easy for experts who want a real challenge.

**Goal:** Create three difficulty levels that make the AI opponents play at different skill levels by adjusting how they make decisions throughout the game.

**What Makes AI "Good"?**
- Considering many winning patterns at once (flexibility)
- Exposing tiles at the right time (not too early, not too late)
- Optimizing joker and blank tile usage
- Making mathematically optimal discards
- Strategic tile passing during Charleston

**How We'll Make It Easier/Harder:**
- Easy AI: Considers fewer patterns (tunnel vision), makes random mistakes, plays conservatively
- Medium AI: Balanced approach with occasional suboptimal choices
- Hard AI: Current behavior (optimal play, no mistakes)

---

## Step 1: Add the Difficulty Selector to the UI

**File to edit:** `index.html`

**What you're doing:** Adding a dropdown menu in the Settings overlay that lets users choose AI difficulty.

**Instructions:**

1. Open `index.html`
2. Find the section with `id="settingsOverlay"` (around line 47-48)
3. Look inside for the existing settings sections. You'll see sections for "Year Selection" and "Training Mode"
4. **After the Year Selection section** (after the closing `</section>` tag around line 62), add this NEW section:

```html
<section class="settings-section">
    <h2 class="settings-section-title">AI Difficulty</h2>
    <div class="setting-item">
        <label for="difficultySelect" class="setting-label">Opponent Skill Level</label>
        <select id="difficultySelect" class="setting-select">
            <option value="easy">Easy - Beginner Friendly</option>
            <option value="medium" selected>Medium - Balanced Challenge</option>
            <option value="hard">Hard - Expert Opponent</option>
        </select>
    </div>
</section>
```

**Why this works:**
- The `id="difficultySelect"` allows JavaScript to find this element later
- The `value` attribute (easy/medium/hard) is what gets saved to settings
- The `selected` attribute on medium makes it the default choice
- The text after each option is what the user sees

**Verification:** Save the file, open the game in a browser, click Settings button. You should see a new "AI Difficulty" section with a dropdown menu.

---

## Step 2: Make Settings Remember the Difficulty Choice

**File to edit:** `settings.js`

**What you're doing:** Adding code so the game saves the user's difficulty choice and loads it back when they return.

### Step 2A: Add Method to Save Difficulty

**Instructions:**

1. Open `settings.js`
2. Find the `SettingsManager` class definition (should be around line 5)
3. Scroll down to find the `saveYearSettings()` method (around line 17-22)
4. **Right after the closing `}` of `saveYearSettings()`**, add this NEW method:

```javascript
saveDifficultySettings() {
    const difficultySelect = document.getElementById("difficultySelect");
    if (difficultySelect) {
        this.saveSetting("aiDifficulty", difficultySelect.value);
    }
}
```

**What this does:**
- Gets the dropdown element by its ID
- Checks if it exists (the `if` statement)
- Saves the selected value ("easy", "medium", or "hard") to localStorage with key "aiDifficulty"

### Step 2B: Add Method to Load/Apply Difficulty

**Instructions:**

1. Still in `settings.js`, find the `applyYearSettings()` method (around line 24-29)
2. **Right after the closing `}` of `applyYearSettings()`**, add this NEW method:

```javascript
applyDifficultySettings(settings) {
    const difficultySelect = document.getElementById("difficultySelect");
    if (difficultySelect && settings.aiDifficulty) {
        difficultySelect.value = settings.aiDifficulty;
    }
}
```

**What this does:**
- Gets the dropdown element
- Checks if we have a saved difficulty value in settings
- Sets the dropdown to show the saved difficulty

### Step 2C: Add Method to Get Current Difficulty

**Instructions:**

1. Still in `settings.js`, find the `getSelectedYear()` method (around line 31-33)
2. **Right after the closing `}` of `getSelectedYear()`**, add this NEW method:

```javascript
getDifficulty() {
    return this.getSetting("aiDifficulty", "medium");
}
```

**What this does:**
- Returns the saved difficulty setting
- If no difficulty is saved yet, returns "medium" as the default

### Step 2D: Wire Up the Save Button

**Instructions:**

1. Still in `settings.js`, find the `saveSettings()` method (around line 35-42)
2. Look for the line that says `this.saveYearSettings();` (should be around line 38)
3. **Right after that line**, add this line:

```javascript
this.saveDifficultySettings();
```

**What this does:**
- When user clicks "Save Settings" button, it now saves difficulty too

### Step 2E: Wire Up the Loading

**Instructions:**

1. Still in `settings.js`, find the `applySettings()` method (around line 44-48)
2. Look for the line that says `this.applyYearSettings(settings);` (should be around line 46)
3. **Right after that line**, add this line:

```javascript
this.applyDifficultySettings(settings);
```

**What this does:**
- When game loads, it now applies the saved difficulty setting to the dropdown

**Verification:**
1. Refresh the game
2. Open Settings
3. Change difficulty to "Easy"
4. Click "Save Settings"
5. Refresh the browser
6. Open Settings - it should still show "Easy"

---

## Step 3: Create the Difficulty Configuration System

**File to edit:** `gameAI.js`

**What you're doing:** Adding a configuration system that stores all the different parameters for each difficulty level. This is the brain of the difficulty system.

### Step 3A: Modify the Constructor

**Instructions:**

1. Open `gameAI.js`
2. Find the `constructor` method at the very top of the `GameAI` class (around line 10-15)
3. **Replace the entire constructor** with this:

```javascript
constructor(card, table, difficulty = "medium") {
    this.card = card;
    this.table = table;
    this.difficulty = difficulty;
    this.config = this.getDifficultyConfig(difficulty);
}
```

**What changed:**
- Added `difficulty = "medium"` parameter (defaults to medium if not provided)
- Added `this.difficulty = difficulty;` to store the difficulty level
- Added `this.config = this.getDifficultyConfig(difficulty);` to load the configuration

### Step 3B: Add the Configuration Method

**Instructions:**

1. Still in `gameAI.js`, **right after the closing `}` of the constructor**, add this large NEW method:

```javascript
getDifficultyConfig(difficulty) {
    const configs = {
        easy: {
            // Pattern consideration
            maxPatterns: 2,              // Only look at top 2 winning patterns (tunnel vision)
            minDiscardable: 5,           // Need 5 tiles to throw away (very conservative)

            // Exposure strategy
            exposureThreshold: 70,       // Only expose tiles when hand is 70+ rank (very close to winning)

            // Courtesy pass voting
            courtesyThresholds: [55, 65, 75],  // More willing to pass tiles (helps opponents)

            // Blank tile usage
            blankExchangeRank: 999,      // Never exchange blanks (999 means impossible threshold)
            blankExchangeGain: 999,      // Never exchange blanks

            // Joker optimization
            jokerTopHands: 1,            // Only consider 1 pattern when evaluating joker swaps
            jokerRankThreshold: 60,      // Only optimize jokers when hand rank > 60
            jokerScaling: 0.8,           // Less aggressive joker optimization (80% effectiveness)

            // Mistake rate
            discardRandomness: 0.3,      // 30% chance to discard a suboptimal tile

            // Decision timing (makes AI seem "slower" and more human-like)
            decisionDelayMin: 800,       // Minimum 800ms delay
            decisionDelayMax: 1400       // Maximum 1400ms delay
        },

        medium: {
            // Pattern consideration
            maxPatterns: 5,              // Look at top 5 winning patterns (good flexibility)
            minDiscardable: 4,           // Need 4 tiles to throw away (balanced)

            // Exposure strategy
            exposureThreshold: 55,       // Expose tiles when hand is 55+ rank (moderate timing)

            // Courtesy pass voting
            courtesyThresholds: [50, 60, 68],  // Balanced courtesy decisions

            // Blank tile usage
            blankExchangeRank: 85,       // Exchange blanks when hand rank > 85 (conservative)
            blankExchangeGain: 25,       // Only if improvement is > 25 points (significant gain)

            // Joker optimization
            jokerTopHands: 2,            // Consider top 2 patterns for joker swaps
            jokerRankThreshold: 55,      // Optimize jokers when hand rank > 55
            jokerScaling: 0.9,           // Moderate joker optimization (90% effectiveness)

            // Mistake rate
            discardRandomness: 0.1,      // 10% chance to discard a suboptimal tile

            // Decision timing
            decisionDelayMin: 400,       // Minimum 400ms delay
            decisionDelayMax: 800        // Maximum 800ms delay
        },

        hard: {
            // Pattern consideration
            maxPatterns: 999,            // Look at all patterns dynamically (maximum flexibility)
            minDiscardable: 3,           // Need only 3 tiles to throw away (aggressive)

            // Exposure strategy
            exposureThreshold: 45,       // Expose tiles when hand is 45+ rank (aggressive timing)

            // Courtesy pass voting
            courtesyThresholds: [45, 55, 65],  // Optimal courtesy decisions

            // Blank tile usage
            blankExchangeRank: 80,       // Exchange blanks when hand rank > 80 (aggressive)
            blankExchangeGain: 20,       // Exchange if improvement > 20 points (moderate gain)

            // Joker optimization
            jokerTopHands: 3,            // Consider top 3 patterns for joker swaps
            jokerRankThreshold: 50,      // Optimize jokers when hand rank > 50
            jokerScaling: 1.0,           // Full joker optimization (100% effectiveness)

            // Mistake rate
            discardRandomness: 0,        // 0% chance of mistakes (perfect play)

            // Decision timing
            decisionDelayMin: 200,       // Minimum 200ms delay
            decisionDelayMax: 400        // Maximum 400ms delay
        }
    };

    // Return the config for the requested difficulty, or medium if invalid
    return configs[difficulty] || configs.medium;
}
```

**What this does:**
- Creates three complete configuration objects (one for each difficulty)
- Each config has all the parameters that control AI decision-making
- Comments explain what each parameter does
- Returns the appropriate config based on difficulty level

**Verification:** The game should still work exactly as before (no errors in console). The configs are created but not used yet.

---

## Step 4: Apply Difficulty to Pattern Consideration

**File to edit:** `gameAI.js`

**What you're doing:** Making the AI consider fewer/more winning patterns based on difficulty.

**Instructions:**

1. Still in `gameAI.js`, find the `getTileRecommendations` method (around line 93)
2. Scroll down inside this method until you find a `while` loop with the comment about reducing patterns (around line 148)
3. Look for these lines:

```javascript
let patternCount = sortedRankCardHands.length;

while (patternCount > 1) {
```

4. **Replace those lines** with:

```javascript
let patternCount = sortedRankCardHands.length;

// Apply difficulty-based pattern limit
if (this.config.maxPatterns < 999) {
    patternCount = Math.min(patternCount, this.config.maxPatterns);
}

while (patternCount > 1) {
```

5. Inside the while loop, find the line that checks `discardableCount >= 3` (around line 156)
6. **Replace that line** with:

```javascript
if (discardableCount >= this.config.minDiscardable) {
```

**What this does:**
- Easy AI: Looks at max 2 patterns, needs 5 discardable tiles (tunnel vision)
- Medium AI: Looks at max 5 patterns, needs 4 discardable tiles (balanced)
- Hard AI: Looks at all patterns dynamically, needs 3 discardable tiles (optimal)

**Verification:** Game should still work. Easy AI will make less flexible decisions.

---

## Step 5: Apply Difficulty to Discard Selection (Add Randomness)

**File to edit:** `gameAI.js`

**What you're doing:** Making Easy/Medium AI sometimes pick a suboptimal tile to discard (making mistakes).

**Instructions:**

1. Still in `gameAI.js`, find the `chooseDiscard` method (around line 372)
2. Scroll down until you find the section where it picks which tile to discard (around line 438-451)
3. Look for the `for` loop that starts with `for (let i = recommendations.length - 1; i >= 0; i--)`
4. **Replace the entire for loop and the code above it** (from `let discardTile = null;` to the end of the for loop) with:

```javascript
let discardTile = null;

// Get all discardable recommendations (excluding blanks)
const discardableRecommendations = recommendations.filter(
    (r) => r.recommendation === "DISCARD" && r.tile.suit !== SUIT.BLANK
);

// Apply difficulty-based randomness
if (this.config.discardRandomness > 0 && Math.random() < this.config.discardRandomness) {
    // Easy/Medium: Sometimes make a suboptimal choice
    // Pick one of the worst 3 tiles randomly instead of the absolute worst
    const randomIndex = Math.floor(
        Math.random() * Math.min(3, discardableRecommendations.length)
    );
    discardTile = discardableRecommendations[randomIndex].tile;

    if (gdebug) {
        console.log(`[AI ${currPlayer.position}] Made suboptimal discard choice (difficulty: ${this.difficulty})`);
    }
} else {
    // Hard: Always pick the optimal (worst-ranked) tile
    for (let i = recommendations.length - 1; i >= 0; i--) {
        const tile = recommendations[i].tile;
        if (tile.suit !== SUIT.BLANK) {
            discardTile = tile;
            break;
        }
    }
}
```

**What this does:**
- Easy AI: 30% of the time, picks a random tile from the 3 worst options (visible mistakes)
- Medium AI: 10% of the time, makes a suboptimal choice
- Hard AI: Always picks the mathematically worst tile (optimal)

**Verification:** Play on Easy mode - you should sometimes see the AI discard tiles that seem odd or suboptimal.

---

## Step 6: Apply Difficulty to Exposure Decisions

**File to edit:** `gameAI.js`

**What you're doing:** Making the AI expose tiles (pung/kong/quint) at different times based on difficulty.

**Instructions:**

1. Still in `gameAI.js`, find the `claimDiscard` method (around line 484)
2. Scroll down until you find the section checking exposure conditions (around line 507-511)
3. Look for this line:

```javascript
if (!copyHand.isAllHidden() || (!rankInfo.hand.concealed && rankInfo.rank > 45)) {
```

4. **Replace that line** with:

```javascript
if (!copyHand.isAllHidden() || (!rankInfo.hand.concealed && rankInfo.rank > this.config.exposureThreshold)) {
```

**What this does:**
- Easy AI: Only exposes when hand rank > 70 (very conservative, stays hidden longer)
- Medium AI: Exposes when hand rank > 55 (balanced timing)
- Hard AI: Exposes when hand rank > 45 (aggressive, current behavior)

**Verification:** Watch Easy AI opponents - they should keep tiles hidden longer before exposing.

---

## Step 7: Apply Difficulty to Courtesy Pass Voting

**File to edit:** `gameAI.js`

**What you're doing:** Adjusting when the AI votes to pass tiles during the courtesy phase.

**Instructions:**

1. Still in `gameAI.js`, find the `courtesyVote` method (around line 577)
2. Find the section with multiple `if` statements checking hand rank (around line 592-602)
3. Look for these lines:

```javascript
if (rank < 45) {
    return 3;
}
if (rank < 55) {
    return 2;
}
if (rank < 65) {
    return 1;
}
return 0;
```

4. **Replace all of those lines** with:

```javascript
const thresholds = this.config.courtesyThresholds;

if (rank < thresholds[0]) {
    return 3;  // Vote to pass 3 tiles
}
if (rank < thresholds[1]) {
    return 2;  // Vote to pass 2 tiles
}
if (rank < thresholds[2]) {
    return 1;  // Vote to pass 1 tile
}
return 0;  // Vote to pass 0 tiles (decline courtesy)
```

**What this does:**
- Easy AI: Uses thresholds [55, 65, 75] (votes to pass tiles even with better hands - helps human player)
- Medium AI: Uses thresholds [50, 60, 68] (balanced voting)
- Hard AI: Uses thresholds [45, 55, 65] (optimal voting strategy)

**Verification:** During courtesy phase, Easy AI should vote to pass tiles more often.

---

## Step 8: Apply Difficulty to Blank Tile Exchange

**File to edit:** `gameAI.js`

**What you're doing:** Controlling when AI uses blank tiles strategically.

**Instructions:**

1. Still in `gameAI.js`, find the `exchangeBlanksForDiscards` method (around line 250)
2. Near the beginning of the method, find the line checking `if (currentBestRank < 80)` (around line 269)
3. **Replace that line** with:

```javascript
if (currentBestRank < this.config.blankExchangeRank) {
    return false;
}
```

4. A few lines down, find the line `let bestRankGain = 20;` (around line 275)
5. **Replace that line** with:

```javascript
let bestRankGain = this.config.blankExchangeGain;
```

**What this does:**
- Easy AI: Never exchanges blanks (thresholds set to 999 = impossible)
- Medium AI: Only when rank > 85 and gain > 25 (very conservative)
- Hard AI: When rank > 80 and gain > 20 (aggressive optimization)

**Verification:** Easy AI should hoard blank tiles and never exchange them.

---

## Step 9: Apply Difficulty to Joker Optimization

**File to edit:** `gameAI.js`

**What you're doing:** Controlling how aggressively AI optimizes joker usage.

### Step 9A: Limit Pattern Consideration

**Instructions:**

1. Still in `gameAI.js`, find the `exchangeTilesForJokers` method (around line 176)
2. Find the line that says `const topHandsCount = 3;` (around line 203)
3. **Replace that line** with:

```javascript
const topHandsCount = this.config.jokerTopHands;
```

### Step 9B: Adjust Scaling Threshold

**Instructions:**

1. Still in the `exchangeTilesForJokers` method, find the line `if (topHand.rank > 50) {` (around line 224)
2. **Replace that line** with:

```javascript
if (topHand.rank > this.config.jokerRankThreshold) {
```

### Step 9C: Adjust Scaling Factor

**Instructions:**

1. Still in the same `if` block, find the line `scale = Math.min(topHand.rank, 100);` (around line 225)
2. **Replace that line** with:

```javascript
scale = Math.min(topHand.rank * this.config.jokerScaling, 100);
```

**What this does:**
- Easy AI: Considers 1 pattern, threshold 60, scaling 0.8 (poor joker optimization)
- Medium AI: Considers 2 patterns, threshold 55, scaling 0.9 (moderate optimization)
- Hard AI: Considers 3 patterns, threshold 50, scaling 1.0 (maximum optimization)

**Verification:** Easy AI should be less aggressive about swapping jokers from exposed tiles.

---

## Step 10: Add Decision Delays (Human-like Timing)

**File to edit:** `gameAI.js`

**What you're doing:** Adding delays before AI makes decisions to make it feel more human-like.

### Step 10A: Add Helper Function

**Instructions:**

1. Still in `gameAI.js`, scroll to the very top of the file (before the class definition)
2. After the imports (the lines that say `import`), add this helper function:

```javascript
// Helper function for AI decision delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Step 10B: Add Delay to chooseDiscard

**Instructions:**

1. Find the `chooseDiscard` method (around line 372)
2. At the very beginning of the method (right after `chooseDiscard(currPlayer) {`), add this code:

```javascript
async chooseDiscard(currPlayer) {
    // Add human-like delay based on difficulty
    const delay = this.config.decisionDelayMin +
                  Math.random() * (this.config.decisionDelayMax - this.config.decisionDelayMin);
    await sleep(delay);

    // ... rest of the method stays the same
```

**IMPORTANT:** Notice you're changing `chooseDiscard(currPlayer) {` to `async chooseDiscard(currPlayer) {` (adding the `async` keyword)

### Step 10C: Add Delay to claimDiscard

**Instructions:**

1. Find the `claimDiscard` method (around line 484)
2. At the very beginning, make the same change - add `async` and the delay:

```javascript
async claimDiscard(discardTile, currPlayer) {
    // Add human-like delay based on difficulty
    const delay = this.config.decisionDelayMin +
                  Math.random() * (this.config.decisionDelayMax - this.config.decisionDelayMin);
    await sleep(delay);

    // ... rest of the method stays the same
```

### Step 10D: Add Delay to charlestonPass

**Instructions:**

1. Find the `charlestonPass` method (around line 541)
2. Add `async` and delay at the beginning:

```javascript
async charlestonPass(currPlayer) {
    // Add human-like delay based on difficulty
    const delay = this.config.decisionDelayMin +
                  Math.random() * (this.config.decisionDelayMax - this.config.decisionDelayMin);
    await sleep(delay);

    // ... rest of the method stays the same
```

### Step 10E: Add Delay to courtesyVote

**Instructions:**

1. Find the `courtesyVote` method (around line 577)
2. Add `async` and delay at the beginning:

```javascript
async courtesyVote(currPlayer) {
    // Add human-like delay based on difficulty
    const delay = this.config.decisionDelayMin +
                  Math.random() * (this.config.decisionDelayMax - this.config.decisionDelayMin);
    await sleep(delay);

    // ... rest of the method stays the same
```

**What this does:**
- Easy AI: Waits 800-1400ms before deciding (appears to be "thinking hard")
- Medium AI: Waits 400-800ms (moderate pace)
- Hard AI: Waits 200-400ms (quick, confident decisions)

**IMPORTANT NOTE:** You're changing these methods to `async`, which means any code that CALLS these methods might need to use `await`. Check if there are any errors in the console and look at how these methods are called in `gameLogic.js`.

---

## Step 11: Pass Difficulty from GameLogic to GameAI

**File to edit:** `gameLogic.js`

**What you're doing:** Making sure the GameAI is created with the difficulty setting from the UI.

**Instructions:**

1. Open `gameLogic.js`
2. Find the `init` method (around line 45)
3. Look for the line where `this.gameAI` is created (should say something like `this.gameAI = new GameAI(this.card, this.table);`)
4. **Replace that line** with:

```javascript
// Get difficulty setting from SettingsManager
const difficulty = window.settingsManager ? window.settingsManager.getDifficulty() : "medium";
this.gameAI = new GameAI(this.card, this.table, difficulty);
```

**What this does:**
- Reads the difficulty setting from the SettingsManager
- Passes it to the GameAI constructor
- Falls back to "medium" if SettingsManager isn't available for some reason

**Verification:** The difficulty selected in Settings should now affect how the AI plays.

---

## Step 12: Handle Async Method Calls in GameLogic

**File to edit:** `gameLogic.js`

**What you're doing:** Since we made some GameAI methods `async` in Step 10, we need to make sure GameLogic properly waits for them.

**Instructions:**

1. Still in `gameLogic.js`, search for every place that calls these methods:
   - `this.gameAI.chooseDiscard`
   - `this.gameAI.claimDiscard`
   - `this.gameAI.charlestonPass`
   - `this.gameAI.courtesyVote`

2. For EACH occurrence, make sure:
   - The method that contains the call is marked as `async`
   - The call uses `await` before it

**Example - Finding chooseDiscard calls:**

Search for `this.gameAI.chooseDiscard` in the file. You'll likely find it in a method like `stateLoopChooseDiscard()`.

**Before:**
```javascript
stateLoopChooseDiscard() {
    const discardTile = this.gameAI.chooseDiscard(this.table.currPlayer);
    // ... more code
}
```

**After:**
```javascript
async stateLoopChooseDiscard() {
    const discardTile = await this.gameAI.chooseDiscard(this.table.currPlayer);
    // ... more code
}
```

**Repeat this process** for all GameAI method calls that you made async.

**Important:** When you make a method `async`, any method that CALLS it also needs to be `async` and use `await`. You may need to follow the chain upward through several methods.

**Verification:**
1. Load the game
2. Check browser console for any errors
3. Play a game - AI should make decisions with visible delays
4. Easy AI should take longer to decide than Hard AI

---

## Step 13: Final Testing Checklist

Test each difficulty level thoroughly:

### **Easy Mode Testing:**
- [ ] AI takes 800-1400ms to make decisions (use browser dev tools to time)
- [ ] AI sometimes makes obviously bad discards (about 30% of the time)
- [ ] AI keeps tiles concealed (hidden) for a long time before exposing
- [ ] AI never exchanges blank tiles
- [ ] AI tends to vote YES on courtesy pass more often
- [ ] AI seems less strategic overall

### **Medium Mode Testing:**
- [ ] AI takes 400-800ms to make decisions
- [ ] AI occasionally makes suboptimal discards (about 10% of the time)
- [ ] AI exposes tiles at moderate times (not too early, not too late)
- [ ] AI rarely exchanges blank tiles (only when it really helps)
- [ ] AI makes balanced courtesy pass votes
- [ ] AI plays competently but not perfectly

### **Hard Mode Testing:**
- [ ] AI takes 200-400ms to make decisions (quick)
- [ ] AI never makes mistakes (always optimal discards)
- [ ] AI exposes tiles aggressively when strategic
- [ ] AI exchanges blanks when beneficial
- [ ] AI makes optimal courtesy pass votes
- [ ] AI plays at expert level (same as before implementation)

### **Settings Persistence Testing:**
- [ ] Change difficulty to Easy, save, refresh browser - still shows Easy
- [ ] Change difficulty to Hard, save, start new game - AI plays at Hard
- [ ] Default for new users should be Medium

### **UI Testing:**
- [ ] Difficulty dropdown appears in Settings overlay
- [ ] All three options are visible and selectable
- [ ] Save Settings button works with difficulty
- [ ] No visual glitches or layout issues

---

## Troubleshooting Common Issues

### **Issue: "await is only valid in async function" error**

**Solution:** You're using `await` in a method that isn't marked as `async`. Add `async` before the method name.

**Example:**
```javascript
// Wrong
someMethod() {
    await this.gameAI.chooseDiscard(player);
}

// Right
async someMethod() {
    await this.gameAI.chooseDiscard(player);
}
```

---

### **Issue: AI decisions happen instantly (no delay)**

**Solution:** Check that:
1. The `sleep` function is defined at the top of `gameAI.js`
2. The AI methods are marked as `async`
3. The delay code is at the beginning of each method
4. GameLogic is using `await` when calling these methods

---

### **Issue: Settings don't save/load**

**Solution:** Check that:
1. The difficultySelect element has the correct `id="difficultySelect"`
2. The save/apply methods are being called in `settings.js`
3. localStorage isn't blocked in your browser (check browser settings)
4. No JavaScript errors in console

---

### **Issue: All difficulty levels play the same**

**Solution:** Check that:
1. The difficulty is being passed from GameLogic to GameAI constructor
2. The `getDifficultyConfig()` method is returning different configs
3. The AI methods are actually using `this.config.*` values
4. No typos in config property names

---

### **Issue: Easy AI still plays too well**

**Solution:** You can adjust the config values to make Easy even easier:
- Increase `discardRandomness` to 0.5 (50% mistakes)
- Increase `exposureThreshold` to 80 (even more conservative)
- Set `maxPatterns` to 1 (extreme tunnel vision)

---

## Advanced: Tuning the Difficulty

After implementation, you may want to adjust the difficulty parameters based on playtesting feedback.

**To make Easy easier:**
- Increase `discardRandomness` (more mistakes)
- Increase `exposureThreshold` (more defensive)
- Decrease `maxPatterns` (more tunnel vision)
- Increase `minDiscardable` (more conservative)

**To make Hard harder:**
- Decrease `exposureThreshold` (more aggressive)
- Decrease decision delays (faster decisions feel more intimidating)
- Adjust `blankExchangeGain` downward (more willing to use blanks)

**All config values are in the `getDifficultyConfig()` method** in `gameAI.js` - just edit the numbers there.

---

## Summary of Files Modified

1. **index.html** - Added difficulty selector UI
2. **settings.js** - Added save/load/get methods for difficulty
3. **gameAI.js** - Added difficulty configs and applied to all decision points
4. **gameLogic.js** - Pass difficulty to GameAI, handle async calls

**Total estimated time:** 5-7 hours for a junior developer

---

## Questions to Ask if Stuck

1. **"Which file should I be editing right now?"** - Check the "File to edit" at the top of each step
2. **"Where exactly do I add this code?"** - Look for the landmarks (method names, line numbers) in the instructions
3. **"What does this code do?"** - Read the "What this does" explanations
4. **"How do I know if it's working?"** - Use the "Verification" sections
5. **"Should I test after every step?"** - Yes! Test frequently to catch errors early

---

## Final Words

This implementation gives the game three distinct difficulty levels while maintaining code quality and the existing architecture. The Easy AI will help beginners learn the game, Medium will challenge intermediate players, and Hard preserves the current expert-level play.

The system is also highly tunable - if playtesting reveals that Easy is still too hard or Hard is too easy, you can adjust the config values in `getDifficultyConfig()` without changing any other code.

Good luck with the implementation! Take it one step at a time, test frequently, and don't hesitate to ask questions if anything is unclear.