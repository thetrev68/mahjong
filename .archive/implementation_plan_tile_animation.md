# Implementation Plan: Animation for New Tiles (Item 6)

## Overview

Add red glow animation to the 3 discard suggestion tiles in the player's hand and implement automatic hint updates when player 0 receives new tiles (draw, pass, claim). Remove the manual hint button since hints will be automatic.

## Current State Analysis

### Existing Hint System (gameLogic.js lines 1108-1136)

- Manual trigger via "Hint" button
- Generates top 3 possible hands and 3 discard suggestions
- Uses `this.gameAI.rankTiles14(hand)` for discard recommendations
- Displays results in hint panel via `printHint(html)`

### Tile Rendering System

- `Tile` class (gameObjects.js) handles individual tile display and effects
- `Tile.animate()` method provides smooth movement transitions
- `Tile.showTile()` method controls visibility
- Each tile has `sprite`, `scale`, and positioning properties

### Game Events for Player 0 Tile Acquisition

1. **Draw from wall** (gameLogic.js line 271)
2. **Charleston pass** (gameLogic.js lines 165-167)
3. **Courtesy pass** (gameLogic.js lines 212-242)
4. **Claim discard** (gameLogic.js lines 548-619)

## Implementation Details

### 1. Add Dynamic Glow Effect System to Tile Class

**File**: `gameObjects.js`
**Function**: Add new methods to `Tile` class for dynamic glow effects that follow tiles during animations

```javascript
// Add to Tile class constructor
this.glowEffect = null;
this.glowColor = 0xff0000; // Default red
this.glowIntensity = 0.6;

// Replace static glow with dynamic positioning system
addGlowEffect(scene, color = 0xff0000, intensity = 0.6) {
    this.removeGlowEffect();

    this.glowColor = color;
    this.glowIntensity = intensity;

    // Create glow effect that will be positioned dynamically
    this.glowEffect = scene.add.graphics();
    this.updateGlowPosition();

    // Set depth below tile but above background
    this.glowEffect.setDepth(this.sprite.depth - 1);
}

// New method to update glow position and appearance dynamically
updateGlowPosition() {
    if (!this.glowEffect) return;

    this.glowEffect.clear();

    if (!this.sprite.visible) {
        this.glowEffect.setVisible(false);
        return;
    }

    this.glowEffect.setVisible(true);
    this.glowEffect.fillStyle(this.glowColor, this.glowIntensity);

    const bounds = this.sprite.getBounds();
    const glowSize = 8;

    // Account for tile scale in glow size
    const scaleFactor = this.sprite.scaleX;
    const scaledGlowSize = glowSize * scaleFactor;

    this.glowEffect.fillRoundedRect(
        bounds.x - scaledGlowSize/2,
        bounds.y - scaledGlowSize/2,
        bounds.width + scaledGlowSize,
        bounds.height + scaledGlowSize,
        10 * scaleFactor
    );

    // Update depth to match tile
    this.glowEffect.setDepth(this.sprite.depth - 1);
}

removeGlowEffect() {
    if (this.glowEffect) {
        this.glowEffect.destroy();
        this.glowEffect = null;
    }
}
```

**Usage examples**:

- Red glow: `tile.addGlowEffect(scene, 0xff0000, 0.7)` - for discard suggestions
- Green glow: `tile.addGlowEffect(scene, 0x00ff00, 0.6)` - for future features
- Blue glow: `tile.addGlowEffect(scene, 0x0000ff, 0.6)` - for future features

### 2. Update Tile Animation System for Dynamic Glows

**File**: `gameObjects.js`
**Function**: Modify existing methods to update glow positions during animations

#### 2a. Update animate() method to include glow updates

```javascript
animate(x, y, angle) {
    const speed = 750;
    const distance = Math.hypot(x - this.sprite.x, y - this.sprite.y);
    const time = (distance * 1000 / speed);

    if (this.tween) {
        this.tween.stop();
    }

    // Save current depth to restore after animation
    const savedDepth = this.sprite.depth;
    this.sprite.depth = Math.max(1, savedDepth);
    this.spriteBack.depth = Math.max(1, savedDepth);

    const tweenConfig = {
        targets: this.sprite,
        x,
        y,
        duration: time,
        ease: "Linear",
        onUpdate: () => {
            this.spriteBack.x = this.sprite.x;
            this.spriteBack.y = this.sprite.y;
            this.spriteBack.angle = this.sprite.angle;
            if (this.mask && this.mask.geometryMask) {
                this.mask.geometryMask.x = this.sprite.x;
                this.mask.geometryMask.y = this.sprite.y;
                this.mask.geometryMask.angle = this.sprite.angle;
            }
            // UPDATE GLOW POSITION DURING ANIMATION
            this.updateGlowPosition();
        },
        onComplete: () => {
            this.sprite.x = x;
            this.sprite.y = y;
            this.sprite.angle = angle;
            this.spriteBack.x = x;
            this.spriteBack.y = y;
            this.spriteBack.angle = angle;
            if (this.mask && this.mask.geometryMask) {
                this.mask.geometryMask.x = x;
                this.mask.geometryMask.y = y;
                this.mask.geometryMask.angle = angle;
            }
            this.sprite.depth = savedDepth;
            this.spriteBack.depth = savedDepth;
            this.tween = null;
            // FINAL GLOW POSITION UPDATE
            this.updateGlowPosition();
        }
    };

    // eslint-disable-next-line new-cap
    if (Phaser.Math.Angle.Wrap(this.sprite.angle) !== Phaser.Math.Angle.Wrap(angle)) {
        tweenConfig.angle = angle;
    }

    this.tween = this.scene.tweens.add(tweenConfig);
}
```

#### 2b. Update scale setter to include glow updates

```javascript
set scale(scale) {
    this.sprite.setScale(scale);
    this.spriteBack.setScale(scale);

    // Update mask for scaled tiles
    if (this.mask && this.mask.geometryMask) {
        this.mask.geometryMask.setScale(scale);
    }

    // UPDATE GLOW FOR SCALE CHANGES
    this.updateGlowPosition();
}
```

#### 2c. Update showTile() method to include glow updates

```javascript
showTile(visible, faceUp) {
    this.sprite.visible = false;
    this.spriteBack.visible = false;

    if (visible) {
        if (faceUp) {
            this.sprite.visible = true;
        } else {
            this.spriteBack.visible = true;
        }
    }

    // UPDATE GLOW VISIBILITY
    this.updateGlowPosition();
}
```

### 3. Create Hint Animation Manager

**File**: `gameLogic.js`
**Function**: Add new class/methods

```javascript
// Add to GameLogic class constructor
this.hintAnimationManager = new HintAnimationManager(this);

// Add new class
class HintAnimationManager {
  constructor(gameLogic) {
    this.gameLogic = gameLogic;
    this.glowedTiles = [];
    this.currentHintData = null;
  }

  // Apply glow effects to discard suggestion tiles
  applyGlowToDiscardSuggestions(tileRankArray) {
    this.clearAllGlows();

    const top3Tiles = tileRankArray.slice(0, 3);
    const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand;

    // Track which tiles we've already highlighted to handle duplicates
    const highlightedTiles = new Set();

    top3Tiles.forEach((rankInfo) => {
      const targetTile = this.findNextUnhighlightedTileInHand(
        hand,
        rankInfo.tile,
        highlightedTiles,
      );
      if (targetTile) {
        targetTile.addGlowEffect(this.gameLogic.scene, 0xff0000, 0.6);
        this.glowedTiles.push(targetTile);
        // Mark this specific tile instance as highlighted
        highlightedTiles.add(targetTile);
      }
    });

    // Store current hint data for state management
    this.currentHintData = { tileRankArray: [...tileRankArray] };
    this.isPanelExpanded = true;
  }

  // Find the next unhighlighted tile in hand that matches the target tile
  // Handles duplicates by finding available instances that haven't been highlighted yet
  findNextUnhighlightedTileInHand(hand, targetTile, highlightedTiles) {
    const hiddenTiles = hand.getHiddenTileArray();

    for (const tile of hiddenTiles) {
      // Check if this tile matches the target
      if (tile.suit === targetTile.suit && tile.number === targetTile.number) {
        // Check if this specific tile instance hasn't been highlighted yet
        if (!highlightedTiles.has(tile)) {
          return tile;
        }
      }
    }
    return null;
  }

  // Clear all glow effects
  clearAllGlows() {
    this.glowedTiles.forEach((tile) => tile.removeGlowEffect());
    this.glowedTiles = [];
  }

  // Update hint with new hand state
  updateHintsForNewTiles() {
    const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand.dupHand();

    // Add invalid tile if hand has 13 tiles
    if (hand.getLength() === 13) {
      const invalidTile = new Tile(SUIT.INVALID, VNUMBER.INVALID);
      hand.insertHidden(invalidTile);
    }

    const rankCardHands = this.gameLogic.card.rankHandArray14(hand);
    this.gameLogic.card.sortHandRankArray(rankCardHands);

    const tileRankArray = this.gameLogic.gameAI.rankTiles14(hand);

    // Update visual glow effects
    this.applyGlowToDiscardSuggestions(tileRankArray);

    // Update hint text content
    this.updateHintDisplay(rankCardHands, tileRankArray);
  }

  // Update hint panel text
  updateHintDisplay(rankCardHands, tileRankArray) {
    let html = "<h3>Top Possible Hands:</h3>";
    for (let i = 0; i < Math.min(3, rankCardHands.length); i++) {
      const rankHand = rankCardHands[i];
      html += `<p><strong>${rankHand.group.groupDescription}</strong> - ${rankHand.hand.description} (Rank: ${rankHand.rank.toFixed(2)})</p>`;
    }

    html += "<h3>Discard Suggestions (Best to Discard First):</h3>";
    for (let i = 0; i < Math.min(3, tileRankArray.length); i++) {
      const rankInfo = tileRankArray[i];
      html += `<p>${rankInfo.tile.getText()} (Less Impact: ${rankInfo.rank.toFixed(2)})</p>`;
    }

    printHint(html);
  }
}
```

### 4. Remove Manual Hint Button and Functionality

**File**: `gameLogic.js`
**Changes**:

1. Remove hint button from UI states where it was shown
2. Remove hint event listener setup
3. Remove hint function from button handlers

#### 4a. Remove from updateUI() method

```javascript
// Remove hint button display from STATE.START case
case STATE.START:
    printMessage("Game started\n");
    startButton.disabled = true;
    sort1.style.display = "";
    sort2.style.display = "";
    // hint.style.display = "";  // REMOVE THIS LINE
    this.disableSortButtons();
    button1.style.display = "none";
    button2.style.display = "none";
    button3.style.display = "none";
    button4.style.display = "none";
    window.document.getElementById("buttondiv").style.visibility = "visible";
    window.document.getElementById("info").style.visibility = "visible";
    this.disableTrainingForm();
    this.wallText.visible = true;
    window.document.getElementById("hintdiv").style.display = "";
    break;

// Remove hint button hiding from STATE.END case
case STATE.END:
    // ... existing code ...
    this.disableSortButtons();
    sort1.style.display = "none";
    sort2.style.display = "none";
    // hint.style.display = "none";  // REMOVE THIS LINE
    this.enableTrainingForm();
    startButton.disabled = false;
    break;
```

#### 4b. Remove from enableSortButtons() method

```javascript
// Remove hint-related code
enableSortButtons() {
    const sort1 = window.document.getElementById("sort1");
    const sort2 = window.document.getElementById("sort2");
    // const hint = window.document.getElementById("hint");  // REMOVE THIS LINE

    sort1.disabled = false;
    sort2.disabled = false;
    // hint.disabled = false;  // REMOVE THIS LINE

    // Remove hint function cleanup
    // if (this.hintFunction) {  // REMOVE THIS BLOCK
    //     hint.removeEventListener("click", this.hintFunction);
    //     this.hintFunction = null;
    // }

    // ... rest of sort button setup ...

    // Remove hint button event listener and function
    // if (this.hintFunction) {  // REMOVE THIS BLOCK
    //     hint.removeEventListener("click", this.hintFunction);
    //     this.hintFunction = null;
    // }

    // this.hintFunction = function hintFunction() {  // REMOVE THIS FUNCTION
    //     const hand = this.table.players[PLAYER.BOTTOM].hand.dupHand();
    //     if (hand.getLength() === 13) {
    //         const invalidTile = new Tile(SUIT.INVALID, VNUMBER.INVALID);
    //         hand.insertHidden(invalidTile);
    //     }
    //     const rankCardHands = this.card.rankHandArray14(hand);
    //     this.card.sortHandRankArray(rankCardHands);
    //
    //     let html = "<h3>Top Possible Hands:</h3>";
    //     for (let i = 0; i < Math.min(3, rankCardHands.length); i++) {
    //         const rankHand = rankCardHands[i];
    //         html += `<p><strong>${rankHand.group.groupDescription}</strong> - ${rankHand.hand.description} (Rank: ${rankHand.rank.toFixed(2)})</p>`;
    //     }
    //
    //     const tileRankArray = this.gameAI.rankTiles14(hand);
    //     html += "<h3>Discard Suggestions (Best to Discard First):</h3>";
    //     for (let i = 0; i < Math.min(3, tileRankArray.length); i++) {
    //         const rankInfo = tileRankArray[i];
    //         html += `<p>${rankInfo.tile.getText()} (Less Impact: ${rankInfo.rank.toFixed(2)})</p>`;
    //     }
    //
    //     printHint(html);
    // }.bind(this);

    sort1.addEventListener("click", this.sort1Function);
    sort2.addEventListener("click", this.sort2Function);
    // hint.addEventListener("click", this.hintFunction);  // REMOVE THIS LINE
}
```

#### 4c. Remove from disableSortButtons() method

```javascript
disableSortButtons() {
    const sort1 = window.document.getElementById("sort1");
    const sort2 = window.document.getElementById("sort2");
    // const hint = window.document.getElementById("hint");  // REMOVE THIS LINE

    sort1.disabled = true;
    sort2.disabled = true;
    // hint.disabled = true;  // REMOVE THIS LINE

    // Remove hint function cleanup
    // if (this.hintFunction) {  // REMOVE THIS BLOCK
    //     sort1.removeEventListener("click", this.hintFunction);
    //     this.hintFunction = null;
    // }
}
```

### 5. Add Automatic Hint Updates

**File**: `gameLogic.js`
**Function**: Add calls to hint updates at key events

#### 5a. After Draw from Wall (line ~271)

```javascript
// Add after this.table.players[this.currPlayer].showHand();
if (this.currPlayer === PLAYER.BOTTOM) {
  this.hintAnimationManager.updateHintsForNewTiles();
}
```

#### 5b. After Charleston Pass (line ~208)

```javascript
// Add after this.players[i].showHand();
if (i === PLAYER.BOTTOM) {
  this.hintAnimationManager.updateHintsForNewTiles();
}
```

#### 5c. After Courtesy Pass (line ~241)

```javascript
// Add after this.players[i].showHand();
if (i === PLAYER.BOTTOM) {
  this.hintAnimationManager.updateHintsForNewTiles();
}
```

#### 5d. After Claim Discard (line ~623)

```javascript
// Add after this.players[winningPlayer].showHand();
if (winningPlayer === PLAYER.BOTTOM) {
  this.hintAnimationManager.updateHintsForNewTiles();
}
```

### 6. Handle Glow Effect Cleanup

**File**: `gameLogic.js`
**Function**: Add cleanup in appropriate places

#### 6a. In `reset()` method

```javascript
// Add to table.reset() call
this.hintAnimationManager.clearAllGlows();
```

#### 6b. In `disableSortButtons()` method

```javascript
// Add before removing event listeners
this.hintAnimationManager.clearAllGlows();
```

### 7. Initial Hint Display

**File**: `gameLogic.js`
**Function**: Start automatic hints after Charleston completes

```javascript
// Add in charleston() method after line ~247
this.state = STATE.COURTESY_COMPLETE;
this.updateUI();

// Start automatic hints for player 0
if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0) {
  this.hintAnimationManager.updateHintsForNewTiles();
}

// Start main game loop
this.loop();
```

### 8. Add Hint Panel Visibility Trigger for Glow Effects

**File**: `gameLogic.js`
**Function**: Modify hint panel toggle logic to control glow effects

The hint panel has an expand/collapse feature that should control glow visibility. When collapsed, glow effects should be removed. When expanded, glow effects should return.

#### 8a. Modify Hint Panel Toggle Event Listener

**Current location**: Around line 854-867 in `updateUI()` method

```javascript
// Replace existing hint toggle event listener with enhanced version
{
  const hintToggle = window.document.getElementById("hint-toggle");
  const hintContent = window.document.getElementById("hint-content");
  const hintDiv = window.document.getElementById("hintdiv");

  hintToggle.addEventListener("click", () => {
    const isExpanded = hintToggle.getAttribute("aria-expanded") === "true";
    hintToggle.setAttribute("aria-expanded", !isExpanded);
    hintContent.classList.toggle("hidden");

    // Control glow effects based on panel state
    if (!isExpanded) {
      // Panel is being expanded - restore glow effects
      this.hintAnimationManager.restoreGlowEffects();
    } else {
      // Panel is being collapsed - remove glow effects
      this.hintAnimationManager.clearAllGlows();
    }
  });

  // Hide hint panel on home page - only show during gameplay
  hintDiv.style.display = "none";
}
```

#### 8b. Add Glow State Management to HintAnimationManager

**File**: `gameLogic.js`
**Function**: Add methods to HintAnimationManager class

```javascript
// Add to HintAnimationManager class
class HintAnimationManager {
  constructor(gameLogic) {
    this.gameLogic = gameLogic;
    this.glowedTiles = [];
    this.currentHintData = null;
    this.isPanelExpanded = false;
    this.savedGlowData = null; // Store glow state when panel is collapsed
  }

  // Save current glow state and clear effects
  clearAllGlows() {
    if (this.glowedTiles.length > 0) {
      // Save current glow state before clearing
      this.savedGlowData = {
        tileRankArray: this.currentHintData
          ? this.currentHintData.tileRankArray
          : null,
        timestamp: Date.now(),
      };
    }

    this.glowedTiles.forEach((tile) => tile.removeGlowEffect());
    this.glowedTiles = [];
    this.isPanelExpanded = false;
  }

  // Restore glow effects from saved state
  restoreGlowEffects() {
    if (this.savedGlowData && this.savedGlowData.tileRankArray) {
      // Re-apply glow effects to the same tiles
      this.applyGlowToDiscardSuggestions(this.savedGlowData.tileRankArray);
      this.isPanelExpanded = true;

      // Clear saved state after restoration
      this.savedGlowData = null;
    } else if (this.currentHintData && this.currentHintData.tileRankArray) {
      // Fallback: re-calculate if saved state is not available
      this.applyGlowToDiscardSuggestions(this.currentHintData.tileRankArray);
      this.isPanelExpanded = true;
    }
  }

  // Enhanced version of applyGlowToDiscardSuggestions that stores state
  applyGlowToDiscardSuggestions(tileRankArray) {
    this.clearAllGlows();

    const top3Tiles = tileRankArray.slice(0, 3);
    const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand;

    top3Tiles.forEach((rankInfo) => {
      const targetTile = this.findTileInHand(hand, rankInfo.tile);
      if (targetTile) {
        targetTile.addGlowEffect(this.gameLogic.scene, 0xff0000, 0.6);
        this.glowedTiles.push(targetTile);
      }
    });

    // Store current hint data for state management
    this.currentHintData = { tileRankArray: [...tileRankArray] };
    this.isPanelExpanded = true;
  }

  // Check if hint panel is currently expanded
  isHintPanelExpanded() {
    const hintContent = window.document.getElementById("hint-content");
    return hintContent && !hintContent.classList.contains("hidden");
  }
}
```

#### 8c. Update All Hint Update Calls to Respect Panel State

**File**: `gameLogic.js`
**Function**: Modify all hint update locations

```javascript
// Add at the beginning of updateHintsForNewTiles() method
updateHintsForNewTiles() {
    // Only update glow effects if panel is expanded
    if (!this.isHintPanelExpanded()) {
        // Panel is collapsed, just update the text content without glow effects
        this.updateHintDisplayOnly();
        return;
    }

    // Panel is expanded, proceed with full update including glow effects
    const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand.dupHand();

    // Add invalid tile if hand has 13 tiles
    if (hand.getLength() === 13) {
        const invalidTile = new Tile(SUIT.INVALID, VNUMBER.INVALID);
        hand.insertHidden(invalidTile);
    }

    const rankCardHands = this.gameLogic.card.rankHandArray14(hand);
    this.gameLogic.card.sortHandRankArray(rankCardHands);

    const tileRankArray = this.gameLogic.gameAI.rankTiles14(hand);

    // Update visual glow effects (only if panel is expanded)
    this.applyGlowToDiscardSuggestions(tileRankArray);

    // Always update hint text content
    this.updateHintDisplay(rankCardHands, tileRankArray);
}

// New method for updating hint text without glow effects
updateHintDisplayOnly() {
    const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand.dupHand();

    // Add invalid tile if hand has 13 tiles
    if (hand.getLength() === 13) {
        const invalidTile = new Tile(SUIT.INVALID, VNUMBER.INVALID);
        hand.insertHidden(invalidTile);
    }

    const rankCardHands = this.gameLogic.card.rankHandArray14(hand);
    this.gameLogic.card.sortHandRankArray(rankCardHands);

    const tileRankArray = this.gameLogic.gameAI.rankTiles14(hand);

    // Update hint text content only (no glow effects)
    this.updateHintDisplay(rankCardHands, tileRankArray);
}
```

#### 8d. Handle Game State Transitions

**File**: `gameLogic.js`
**Function**: Add cleanup in appropriate game state changes

```javascript
// Add in updateUI() method for STATE.INIT case
case STATE.INIT:
    // ... existing code ...

    // Clear glow effects and saved state when returning to init
    this.hintAnimationManager.clearAllGlows();
    this.hintAnimationManager.savedGlowData = null;

    // Add hint panel toggle event listener (existing code enhanced above)
    {
        const hintToggle = window.document.getElementById("hint-toggle");
        const hintContent = window.document.getElementById("hint-content");
        const hintDiv = window.document.getElementById("hintdiv");

        hintToggle.addEventListener("click", () => {
            const isExpanded = hintToggle.getAttribute("aria-expanded") === "true";
            hintToggle.setAttribute("aria-expanded", !isExpanded);
            hintContent.classList.toggle("hidden");

            // Control glow effects based on panel state
            if (!isExpanded) {
                // Panel is being expanded - restore glow effects
                this.hintAnimationManager.restoreGlowEffects();
            } else {
                // Panel is being collapsed - remove glow effects
                this.hintAnimationManager.clearAllGlows();
            }
        });

        // Hide hint panel on home page - only show during gameplay
        hintDiv.style.display = "none";
    }
    break;
```

### 9. Refactor "Call Tile" Glow Effect

**File**: `gameLogic.js`
**Function**: `loop()`
**Goal**: Replace the static, instant yellow glow for a claimable tile with the new dynamic glow system so the glow animates with the tile.

This change is dependent on the successful implementation of the dynamic glow system in the `Tile` class (Sections 1 and 2 of this plan).

#### 9a. Update Glow Creation Logic (in `loop()` method)

This change replaces the immediate creation of a static yellow rectangle with a call to the new dynamic glow system.

- **Location**: Inside the `loop()` method, around line 325.
- **Code to Replace:**

  ```javascript
  // Add highlight background first using a rectangle sprite
  // Match the golden color of the Yes/No buttons (#ffd166 / 0xffd166)
  const highlightRect = this.scene.add.rectangle(
    350,
    420,
    70,
    90,
    0xffd166,
    0.7,
  );
  highlightRect.setStrokeStyle(3, 0xffd166, 0.9);
  // Below the tile
  highlightRect.setDepth(49);
  discardTile.highlightGraphics = highlightRect;

  // Animate and show tile
  discardTile.scale = 1.0;
  discardTile.showTile(true, true);

  // Store desired depth before animation
  discardTile.sprite.depth = 50;
  discardTile.spriteBack.depth = 50;

  // Now animate - this will preserve the depth we just set
  discardTile.animate(350, 420, 0);
  ```

- **With New Code:**

  ```javascript
  // Animate and show tile
  discardTile.scale = 1.0;
  discardTile.showTile(true, true);

  // Add a dynamic yellow glow that will follow the animation
  discardTile.addGlowEffect(this.scene, 0xffd166); // 0xffd166 is yellow

  // Store desired depth before animation
  discardTile.sprite.depth = 50;
  discardTile.spriteBack.depth = 50;

  // Now animate. The glow will follow automatically because the
  // animate() method is being updated to handle it.
  discardTile.animate(350, 420, 0);
  ```

#### 9b. Update Glow Cleanup Logic (in `loop()` method)

This updates the cleanup code to use the new `removeGlowEffect` method.

- **Location**: Inside the `loop()` method, around line 352.
- **Code to Replace:**
  ```javascript
  // Clear highlight effect after claim is processed
  if (discardTile.highlightGraphics) {
    discardTile.highlightGraphics.destroy();
    discardTile.highlightGraphics = null;
  }
  ```
- **With New Code:**
  ```javascript
  // Clear highlight effect after claim is processed
  discardTile.removeGlowEffect();
  ```

## Testing Strategy

### Manual Testing Checklist

1.  **Automatic Hints**:
    - [ ] Hints appear automatically after Charleston completion
    - [ ] Hints update after drawing from wall
    - [ ] Hints update after Charleston pass
    - [ ] Hints update after courtesy pass
    - [ ] Hints update after claiming discard

2.  **Glow Effect Visibility**:
    - [ ] Red glow appears on 3 discard suggestion tiles
    - [ ] **Yellow glow appears on claimable tile**
    - [ ] Glow doesn't interfere with tile selection/dragging
    - [ ] Glow disappears when hints are cleared or claim is resolved
    - [ ] Glow updates properly when hand changes
    - [ ] Glow follows tiles during all animations (positioning fix)

3.  **Duplicate Tile Handling** (NEW):
    - [ ] Multiple identical tiles in hand are highlighted correctly (e.g., 4 West tiles, highlight first 3)
    - [ ] When hint suggests same tile multiple times, different tile instances are highlighted
    - [ ] Glow effects don't overlap on duplicate tiles
    - [ ] Highlighting works correctly when sorting changes tile positions

4.  **Panel Visibility Control** (NEW):
    - [ ] Glow effects are removed when hint panel is collapsed
    - [ ] Glow effects are restored when hint panel is expanded
    - [ ] Glow effects return to the same tiles after expand/collapse
    - [ ] Hint text updates even when panel is collapsed
    - [ ] Panel state is preserved across game state transitions

5.  **UI Cleanup**:
    - [ ] Hint button is completely removed from UI
    - [ ] No references to hint button in event listeners
    - [ ] Sort buttons still work independently

6.  **Edge Cases**:
    - [ ] No glow effect when hand has invalid configuration
    - [ ] Glow updates properly after tile sorting
    - [ ] Effects don't persist across game restarts
    - [ ] Hints work correctly with 13 vs 14 tile hands
    - [ ] Panel expand/collapse works correctly during active gameplay
    - [ ] Saved glow state is cleared when starting new game

### Integration Testing

- Test with existing tile sorting functions
- Verify compatibility with drag-and-drop operations
- Ensure glow effects work with tile animations
- Test performance with rapid tile updates

## Files to Modify

1.  **`gameObjects.js`**:
    - Add `addGlowEffect()`, `updateGlowPosition()`, and `removeGlowEffect()` methods to the `Tile` class.
    - Update `animate()`, `set scale`, and `showTile()` to call `updateGlowPosition()`.

2.  **`gameLogic.js`**:
    - Add `HintAnimationManager` class for hint-related glows.
    - Remove all references and event listeners for the manual hint button.
    - Add calls to `hintAnimationManager.updateHintsForNewTiles()` at all tile acquisition events.
    - Refactor the "call tile" animation in the `loop()` method to use `addGlowEffect(this.scene, 0xffd166)` instead of a static rectangle.
    - Update the "call tile" cleanup logic to use `removeGlowEffect()`.

3.  **`index.html`**:
    - Remove the manual hint button element: `<button id="hint" class="button">Hint</button>`.

## Estimated Development Time

- **Tile glow effect system**: 3-4 hours
- **Hint animation manager**: 2-3 hours
- **Remove manual hint button**: 1-2 hours
- **Automatic update integration**: 2-3 hours
- **Testing and bug fixes**: 2-3 hours
- **Total**: 10-15 hours

## Benefits of This Approach

1.  **User Experience**: Hints are always current and don't require manual triggering
2.  **Visual Enhancement**: Clear visual indicators for discard suggestions that follow tiles during all animations
3.  **Dynamic Positioning**: Glow effects automatically track tile movement, scaling, and visibility changes
4.  **Code Cleanup**: Removes redundant hint button code
5.  **Flexibility**: Color parameter allows for future glow effects (green for exposures, blue for mahjong, etc.)
6.  **Performance**: Efficient glow effect management with proper cleanup and no continuous polling
7.  **Tile Stack Effect**: Glows move as one unit with tiles, creating seamless visual integration

This implementation plan provides a comprehensive solution that enhances the gameplay experience while maintaining clean, maintainable code.
