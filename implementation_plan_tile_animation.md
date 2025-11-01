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

### 1. Add Glow Effect System to Tile Class

**File**: `gameObjects.js`
**Function**: Add new method to `Tile` class

```javascript
// Add to Tile class constructor
this.glowEffect = null;

// Add new method with color parameter for flexibility
addGlowEffect(scene, color = 0xff0000, intensity = 0.7) {
    // Remove existing glow
    this.removeGlowEffect();
    
    // Create glow effect using Phaser graphics
    const glowGraphics = scene.add.graphics();
    glowGraphics.fillStyle(color, intensity);
    
    // Create glow around tile bounds
    const bounds = this.sprite.getBounds();
    const glowSize = 8;
    glowGraphics.fillRoundedRect(
        bounds.x - glowSize/2, 
        bounds.y - glowSize/2, 
        bounds.width + glowSize, 
        bounds.height + glowSize, 
        10
    );
    
    this.glowEffect = glowGraphics;
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

### 2. Create Hint Animation Manager

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
        
        top3Tiles.forEach((rankInfo) => {
            const targetTile = this.findTileInHand(hand, rankInfo.tile);
            if (targetTile) {
                targetTile.addGlowEffect(this.gameLogic.scene, 0xff0000, 0.6);
                this.glowedTiles.push(targetTile);
            }
        });
    }
    
    // Find matching tile object in hand by suit/number
    findTileInHand(hand, targetTile) {
        for (const tile of hand.getHiddenTileArray()) {
            if (tile.suit === targetTile.suit && tile.number === targetTile.number) {
                return tile;
            }
        }
        return null;
    }
    
    // Clear all glow effects
    clearAllGlows() {
        this.glowedTiles.forEach(tile => tile.removeGlowEffect());
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

### 3. Remove Manual Hint Button and Functionality

**File**: `gameLogic.js`
**Changes**:
1. Remove hint button from UI states where it was shown
2. Remove hint event listener setup
3. Remove hint function from button handlers

#### 3a. Remove from updateUI() method
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

#### 3b. Remove from enableSortButtons() method
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

#### 3c. Remove from disableSortButtons() method
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

### 4. Add Automatic Hint Updates

**File**: `gameLogic.js`
**Function**: Add calls to hint updates at key events

#### 4a. After Draw from Wall (line ~271)
```javascript
// Add after this.table.players[this.currPlayer].showHand();
if (this.currPlayer === PLAYER.BOTTOM) {
    this.hintAnimationManager.updateHintsForNewTiles();
}
```

#### 4b. After Charleston Pass (line ~208)
```javascript
// Add after this.players[i].showHand();
if (i === PLAYER.BOTTOM) {
    this.hintAnimationManager.updateHintsForNewTiles();
}
```

#### 4c. After Courtesy Pass (line ~241)
```javascript
// Add after this.players[i].showHand();
if (i === PLAYER.BOTTOM) {
    this.hintAnimationManager.updateHintsForNewTiles();
}
```

#### 4d. After Claim Discard (line ~623)
```javascript
// Add after this.players[winningPlayer].showHand();
if (winningPlayer === PLAYER.BOTTOM) {
    this.hintAnimationManager.updateHintsForNewTiles();
}
```

### 5. Handle Glow Effect Cleanup

**File**: `gameLogic.js`
**Function**: Add cleanup in appropriate places

#### 5a. In `reset()` method
```javascript
// Add to table.reset() call
this.hintAnimationManager.clearAllGlows();
```

#### 5b. In `disableSortButtons()` method
```javascript
// Add before removing event listeners
this.hintAnimationManager.clearAllGlows();
```

### 6. Initial Hint Display

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
### 7. Add Hint Panel Visibility Trigger for Glow Effects

**File**: `gameLogic.js`
**Function**: Modify hint panel toggle logic to control glow effects

The hint panel has an expand/collapse feature that should control glow visibility. When collapsed, glow effects should be removed. When expanded, glow effects should return.

#### 7a. Modify Hint Panel Toggle Event Listener

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

#### 7b. Add Glow State Management to HintAnimationManager

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
                tileRankArray: this.currentHintData ? this.currentHintData.tileRankArray : null,
                timestamp: Date.now()
            };
        }
        
        this.glowedTiles.forEach(tile => tile.removeGlowEffect());
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

#### 7c. Update All Hint Update Calls to Respect Panel State

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

#### 7d. Handle Game State Transitions

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

## Testing Strategy

### Manual Testing Checklist
1. **Automatic Hints**:
   - [ ] Hints appear automatically after Charleston completion
   - [ ] Hints update after drawing from wall
   - [ ] Hints update after Charleston pass
   - [ ] Hints update after courtesy pass
   - [ ] Hints update after claiming discard

2. **Glow Effect Visibility**:
   - [ ] Red glow appears on 3 discard suggestion tiles
   - [ ] Glow doesn't interfere with tile selection/dragging
   - [ ] Glow disappears when hints are cleared
   - [ ] Glow updates properly when hand changes

3. **Panel Visibility Control** (NEW):
   - [ ] Glow effects are removed when hint panel is collapsed
   - [ ] Glow effects are restored when hint panel is expanded
   - [ ] Glow effects return to the same tiles after expand/collapse
   - [ ] Hint text updates even when panel is collapsed
   - [ ] Panel state is preserved across game state transitions

4. **UI Cleanup**:
   - [ ] Hint button is completely removed from UI
   - [ ] No references to hint button in event listeners
   - [ ] Sort buttons still work independently

5. **Edge Cases**:
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

1. **`gameObjects.js`**:
   - Add `addGlowEffect()` and `removeGlowEffect()` methods to `Tile` class.

2. **`gameLogic.js`**:
   - Add `HintAnimationManager` class.
   - Remove all references and event listeners for the manual hint button (`hint.style.display`, `hint.disabled`, `hint.addEventListener`).
   - Add calls to `hintAnimationManager.updateHintsForNewTiles()` at all tile acquisition events (draw, pass, claim).
   - Add cleanup calls to `hintAnimationManager.clearAllGlows()`.

3. **`index.html`**:
   - Remove the manual hint button element: `<button id="hint" class="button">Hint</button>`.

## Estimated Development Time

- **Tile glow effect system**: 3-4 hours
- **Hint animation manager**: 2-3 hours
- **Remove manual hint button**: 1-2 hours
- **Automatic update integration**: 2-3 hours
- **Testing and bug fixes**: 2-3 hours
- **Total**: 10-15 hours

## Benefits of This Approach

1. **User Experience**: Hints are always current and don't require manual triggering
2. **Visual Enhancement**: Clear visual indicators for discard suggestions
3. **Code Cleanup**: Removes redundant hint button code
4. **Flexibility**: Color parameter allows for future glow effects (green for exposures, blue for mahjong, etc.)
5. **Performance**: Efficient glow effect management with proper cleanup

This implementation plan provides a comprehensive solution that enhances the gameplay experience while maintaining clean, maintainable code.