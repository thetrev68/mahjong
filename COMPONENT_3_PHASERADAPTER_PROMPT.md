# Component 3: PhaserAdapter Handler Wiring Implementation

## Context

You're implementing **PhaserAdapter handler wiring** for an American Mahjong game. This is part of a larger refactor to separate game logic (GameController) from rendering (PhaserAdapter).

**What's Been Completed:**
- ✅ Component 1: SelectionManager (fully implemented in [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js))
- ✅ Component 2: HandRenderer (fully implemented in [desktop/renderers/HandRenderer.js](desktop/renderers/HandRenderer.js))
- ✅ DialogManager (fully functional, ready to use)
- ✅ Codebase reorganization (desktop-specific files in `desktop/` folder)

**Your Task:** Component 3 from [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)

---

## Your Mission: Wire Up PhaserAdapter Event Handlers

Build the connection layer between GameController events and the UI managers (SelectionManager, HandRenderer, DialogManager, ButtonManager).

**Location:** Enhance [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

**Time Estimate:** ~2 hours
1. Analyze current PhaserAdapter handlers (30 min)
2. Wire onCharlestonPhase → SelectionManager (30 min)
3. Wire onUIPrompt → DialogManager (30 min)
4. Wire other critical handlers (30 min)

---

## Step 1: Analyze Current PhaserAdapter State (30 min)

### 1a. Review existing PhaserAdapter

Read [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js) and document:

**Current State of Handlers:**

| Handler Method | Current Implementation | What's Missing |
|----------------|----------------------|----------------|
| `onGameStarted` | ? | ? |
| `onStateChanged` | ? | ? |
| `onCharlestonPhase` | ? | ? |
| `onUIPrompt` | ? | ? |
| `handleCharlestonPassPrompt` | ? | ? |
| `onTileDrawn` | ? | ? |
| `onTileDiscarded` | ? | ? |
| `onTurnChanged` | ? | ? |
| `onHandUpdated` | ? | ? |
| `onExposureCreated` | ? | ? |

**Manager Integrations:**

Check which managers are currently instantiated:
- `this.selectionManager` - Does it exist? Where is it created?
- `this.handRenderer` - Does it exist? Where is it created?
- `this.dialogManager` - Does it exist? Is it wired correctly?
- `this.buttonManager` - Does it exist? What state is it in?
- `this.tileManager` - Does it exist? Is it functional?

### 1b. Compare with 07c41b9 patterns

Look at commit 07c41b9's `gameLogic.js` for these patterns:

```bash
git show 07c41b9:gameLogic.js | grep -A 20 "chooseDiscard"
git show 07c41b9:gameLogic.js | grep -A 20 "charlestonPass"
```

Key patterns to extract:
- How were buttons set up for user input?
- How did promise-based async flow work?
- How were tiles selected during Charleston?
- How did UI update based on game state?

### 1c. Document findings

Create `PHASERADAPTER_CURRENT_STATE.md` with:

**Section 1: Handler Inventory**
- List all event handlers in PhaserAdapter
- Note which are implemented vs stubs
- Identify which managers they should call

**Section 2: Manager Dependencies**
- Which handlers need SelectionManager?
- Which handlers need HandRenderer?
- Which handlers need DialogManager?
- Which handlers need ButtonManager?

**Section 3: Event Flow Analysis**
- What events come from GameController?
- What order do they arrive in?
- Which events require user input (promise-based)?
- Which events are fire-and-forget?

**Section 4: Patterns from 07c41b9**
- How did old system handle Charleston tile selection?
- How did old system handle discard selection?
- How were dialogs shown and dismissed?
- How were buttons enabled/disabled?

---

## Step 2: Wire Charleston Handler Chain (30 min)

### 2a. Understand Charleston Event Flow

Charleston involves multiple events:

```
1. onCharlestonPhase(data) → "Charleston phase X starting"
   ↓
2. onUIPrompt(data) → "Please select 3 tiles to pass"
   ↓
3. User selects tiles via SelectionManager
   ↓
4. User clicks button
   ↓
5. DialogManager shows confirmation
   ↓
6. onCharlestonComplete(data) → "Charleston phase X complete"
```

### 2b. Implement onCharlestonPhase

**Event Data Structure:**
```javascript
{
    phase: 1 | 2,  // Charleston phase number
    direction: "right" | "left" | "across",
    player: 0  // Current player index
}
```

**Implementation:**
```javascript
onCharlestonPhase(data) {
    const { phase, direction, player } = data;

    // Only handle human player (PLAYER.BOTTOM = 0)
    if (player !== PLAYER.BOTTOM) {
        return;
    }

    // 1. Enable tile selection for Charleston
    //    - Exactly 3 tiles required
    //    - Mode: "charleston" (no jokers/blanks)
    this.selectionManager.enableTileSelection(3, 3, "charleston");

    // 2. Update button text
    this.buttonManager.setButtonText(`Pass ${direction}`);
    this.buttonManager.enableButton(false); // Disabled until 3 tiles selected

    // 3. Show instruction message
    this.printMessage(`Charleston ${phase}: Select 3 tiles to pass ${direction}`);

    // Note: The actual dialog will be shown by onUIPrompt event
}
```

### 2c. Wire onUIPrompt for Charleston

**Event Data Structure:**
```javascript
{
    type: "charleston" | "courtesy" | "discard" | "claim",
    message: "Please select 3 tiles to pass right",
    minSelect: 3,
    maxSelect: 3,
    // ... other fields
}
```

**Implementation:**
```javascript
onUIPrompt(data) {
    const { type, message, minSelect, maxSelect } = data;

    switch (type) {
        case "charleston":
            // Selection already enabled by onCharlestonPhase
            // Just show the dialog
            this.dialogManager.showCharlestonDialog(message);
            break;

        case "courtesy":
            this.handleCourtesyPrompt(data);
            break;

        case "discard":
            this.handleDiscardPrompt(data);
            break;

        case "claim":
            this.handleClaimPrompt(data);
            break;

        default:
            console.warn(`Unknown UI prompt type: ${type}`);
    }
}
```

### 2d. Handle button clicks

When user clicks the button after selecting tiles:

```javascript
// In button click handler (ButtonManager or PhaserAdapter)
onButton1Click() {
    // Get selected tiles
    const selectedTiles = this.selectionManager.getSelection();

    // Validate selection
    if (!this.selectionManager.isValidSelection()) {
        console.warn("Invalid selection");
        return;
    }

    // Disable selection
    this.selectionManager.disableTileSelection();

    // Hide dialog
    this.dialogManager.hideCharlestonDialog();

    // Send response to GameController
    this.gameController.submitCharlestonPass(selectedTiles);
}
```

### 2e. Test Charleston flow

Create a test checklist:
- [ ] Charleston phase event triggers selection mode
- [ ] Can select 3 tiles
- [ ] Cannot select jokers or blanks
- [ ] Button disabled until 3 tiles selected
- [ ] Button enabled when 3 tiles selected
- [ ] Click button → tiles passed, dialog hidden
- [ ] Charleston completes for all 3 directions
- [ ] Charleston phase 2 works same as phase 1

---

## Step 3: Wire Other Critical Handlers (30 min)

### 3a. onTileDrawn

**Purpose:** Animate tile from wall to player's hand

**Event Data:**
```javascript
{
    playerIndex: 0-3,
    tile: { suit, rank, index },
    fromWall: true
}
```

**Implementation:**
```javascript
onTileDrawn(data) {
    const { playerIndex, tile } = data;

    // Get the Phaser tile sprite
    const phaserTile = this.tileManager.getTile(tile.index);

    if (!phaserTile) {
        console.error(`Tile ${tile.index} not found in TileManager`);
        return;
    }

    // Position at wall (center of screen)
    const wallPos = { x: WINDOW_WIDTH / 2, y: WINDOW_HEIGHT / 2 };
    phaserTile.sprite.setPosition(wallPos.x, wallPos.y);
    phaserTile.sprite.setAlpha(0);

    // Get target position in player's hand
    const player = this.table.players[playerIndex];
    const hand = player.hand;

    // Add tile to hand's data structure first
    hand.insertHidden([tile]);

    // Get position for the newly inserted tile
    const handPos = this.handRenderer.calculateHiddenTilePositions(
        player.playerInfo,
        hand
    );

    // Animate tile to hand
    this.scene.tweens.add({
        targets: phaserTile.sprite,
        x: handPos.startX,  // Adjust for tile index
        y: handPos.startY,
        alpha: 1,
        duration: 200,
        ease: "Cubic.easeOut",
        onComplete: () => {
            // Re-render entire hand to reposition all tiles
            this.handRenderer.showHand(playerIndex);
        }
    });
}
```

**Note:** This is a simplified version. You may need to calculate the exact position for the specific tile index.

### 3b. onTileDiscarded

**Purpose:** Animate tile from player's hand to discard pile

**Event Data:**
```javascript
{
    playerIndex: 0-3,
    tile: { suit, rank, index }
}
```

**Implementation:**
```javascript
onTileDiscarded(data) {
    const { playerIndex, tile } = data;

    // Get the Phaser tile sprite
    const phaserTile = this.tileManager.getTile(tile.index);

    if (!phaserTile) {
        console.error(`Tile ${tile.index} not found`);
        return;
    }

    // Discard pile center position (adjust based on your layout)
    const discardPos = { x: 350, y: 420 };

    // Animate to discard pile
    this.scene.tweens.add({
        targets: phaserTile.sprite,
        x: discardPos.x,
        y: discardPos.y,
        duration: 350,
        ease: "Cubic.easeIn",
        onComplete: () => {
            // Play sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSFX("tile_dropping");
            }

            // Re-render hand to close gap
            this.handRenderer.showHand(playerIndex);
        }
    });
}
```

### 3c. onHandUpdated

**Purpose:** Re-render a player's hand when tiles change

**Event Data:**
```javascript
{
    playerIndex: 0-3,
    reason: "draw" | "discard" | "expose" | "charleston" | "sort"
}
```

**Implementation:**
```javascript
onHandUpdated(data) {
    const { playerIndex, reason } = data;

    debugPrint(`Hand updated for player ${playerIndex}: ${reason}`);

    // Re-render the hand
    this.handRenderer.showHand(playerIndex);

    // If it's the human player, update selection state
    if (playerIndex === PLAYER.BOTTOM) {
        // Clear any invalid selections
        this.selectionManager.clearSelection();
    }
}
```

### 3d. onStateChanged

**Purpose:** Update UI when game state changes

**Event Data:**
```javascript
{
    oldState: STATE.DEAL,
    newState: STATE.CHARLESTON1,
    stateName: "Charleston Phase 1"
}
```

**Implementation:**
```javascript
onStateChanged(data) {
    const { newState, stateName } = data;

    debugPrint(`State changed to: ${stateName} (${newState})`);

    // Update button visibility and text based on state
    this.buttonManager.updateForState(newState);

    // Update status message
    this.printMessage(stateName);

    // State-specific setup
    switch (newState) {
        case STATE.CHARLESTON1:
        case STATE.CHARLESTON2:
            // Charleston-specific UI setup if needed
            break;

        case STATE.LOOP_CHOOSE_DISCARD:
            // Enable discard selection
            this.selectionManager.enableTileSelection(1, 1, "play");
            break;

        case STATE.LOOP_QUERY_CLAIM_DISCARD:
            // Handle claim decision UI
            break;

        case STATE.END:
            // Game over UI
            this.handleGameEnd();
            break;
    }
}
```

### 3e. onExposureCreated

**Purpose:** Show exposed tiles (pung/kong/quint) in player's rack

**Event Data:**
```javascript
{
    playerIndex: 0-3,
    exposureType: "pung" | "kong" | "quint",
    tiles: [tile1, tile2, tile3]
}
```

**Implementation:**
```javascript
onExposureCreated(data) {
    const { playerIndex, exposureType, tiles } = data;

    debugPrint(`Player ${playerIndex} exposed ${exposureType}:`, tiles);

    // The tiles are already in the hand's exposedTileSetArray
    // Just re-render to show them
    this.handRenderer.showHand(playerIndex);

    // Play sound
    if (this.scene.audioManager) {
        this.scene.audioManager.playSFX("expose_tiles");
    }
}
```

---

## Step 4: Wire ButtonManager Integration (30 min)

### 4a. Review ButtonManager current state

Check [desktop/managers/ButtonManager.js](desktop/managers/ButtonManager.js):
- What methods exist?
- Is `updateForState()` implemented?
- Are button click handlers wired?

### 4b. Implement updateForState

**Purpose:** Show/hide buttons based on game state

```javascript
// In ButtonManager.js
updateForState(state) {
    switch (state) {
        case STATE.DEAL:
            this.hideAllButtons();
            break;

        case STATE.CHARLESTON1:
        case STATE.CHARLESTON2:
            this.showButton1();
            this.setButtonText("Pass");
            this.enableButton(false); // Disabled until tiles selected
            break;

        case STATE.CHARLESTON_QUERY:
            this.showButton1();
            this.setButtonText("Yes, continue");
            this.showButton2();
            this.setButton2Text("No, stop");
            this.enableButton(true);
            this.enableButton2(true);
            break;

        case STATE.LOOP_CHOOSE_DISCARD:
            this.showButton1();
            this.setButtonText("Discard");
            this.enableButton(false); // Disabled until tile selected
            break;

        case STATE.LOOP_QUERY_CLAIM_DISCARD:
            this.showButton1();
            this.setButtonText("Claim");
            this.showButton2();
            this.setButton2Text("Pass");
            // Enable based on whether player can claim
            break;

        case STATE.END:
            this.hideAllButtons();
            this.showButton1();
            this.setButtonText("New Game");
            this.enableButton(true);
            break;

        default:
            this.hideAllButtons();
    }
}
```

### 4c. Wire button clicks to GameController

**In PhaserAdapter:**
```javascript
setupButtonHandlers() {
    // Get button DOM elements
    this.button1 = document.getElementById("button1");
    this.button2 = document.getElementById("button2");

    // Attach click handlers
    this.button1.addEventListener("click", () => this.onButton1Click());
    this.button2.addEventListener("click", () => this.onButton2Click());
}

onButton1Click() {
    // Determine action based on current state
    const state = this.gameController.getCurrentState();

    switch (state) {
        case STATE.CHARLESTON1:
        case STATE.CHARLESTON2:
            this.handleCharlestonPass();
            break;

        case STATE.LOOP_CHOOSE_DISCARD:
            this.handleDiscard();
            break;

        case STATE.LOOP_QUERY_CLAIM_DISCARD:
            this.handleClaim();
            break;

        case STATE.END:
            this.handleNewGame();
            break;
    }
}

onButton2Click() {
    const state = this.gameController.getCurrentState();

    switch (state) {
        case STATE.CHARLESTON_QUERY:
            this.handleCharlestonDecline();
            break;

        case STATE.LOOP_QUERY_CLAIM_DISCARD:
            this.handlePassClaim();
            break;
    }
}
```

### 4d. Connect SelectionManager to button state

When selection changes, update button state:

```javascript
// In SelectionManager or PhaserAdapter
onSelectionChanged() {
    // Check if selection is valid
    const isValid = this.selectionManager.isValidSelection();

    // Enable/disable button based on validity
    this.buttonManager.enableButton(isValid);
}
```

This can be triggered in `SelectionManager._updateButtonState()` which already exists.

---

## Step 5: Create Integration Tests (30 min)

### 5a. Manual test scenarios

Create `PHASERADAPTER_TEST_PLAN.md` with test scenarios:

**Test 1: Charleston Phase**
1. Start game
2. Deal completes
3. Charleston phase 1 starts
4. Can select 3 tiles
5. Button disabled initially
6. Button enabled after 3 tiles selected
7. Click button → tiles passed
8. Charleston phase 1 complete
9. Repeat for phases 2-3

**Test 2: Main Game Loop**
1. Charleston complete
2. Player turn starts
3. Tile drawn from wall (animation plays)
4. Can select 1 tile to discard
5. Click discard → tile moves to center
6. AI players take turns (see tiles move)
7. Claim prompt appears when applicable

**Test 3: Exposure**
1. Player has matching tiles
2. Claim discard
3. Exposure dialog appears
4. Select tiles for pung/kong
5. Exposed tiles show in rack

### 5b. Browser console tests

Document commands for testing in browser console:

```javascript
// Get PhaserAdapter instance
const adapter = game.scene.scenes[0].phaserAdapter;

// Test SelectionManager
adapter.selectionManager.enableTileSelection(3, 3, "charleston");
console.log("Selection count:", adapter.selectionManager.getSelectionCount());

// Test HandRenderer
adapter.handRenderer.showHand(0); // BOTTOM player
adapter.handRenderer.showHand(1, true); // RIGHT player, force face-up

// Test DialogManager
adapter.dialogManager.showCharlestonDialog("Test message");
adapter.dialogManager.hideCharlestonDialog();

// Test button state
adapter.buttonManager.updateForState(STATE.CHARLESTON1);
```

---

## Key Implementation Details

### Manager Instantiation

PhaserAdapter should create manager instances in constructor:

```javascript
constructor(scene, gameController, table) {
    this.scene = scene;
    this.gameController = gameController;
    this.table = table;

    // Create managers
    this.dialogManager = new DialogManager(scene);
    this.buttonManager = new ButtonManager(scene);
    this.tileManager = new TileManager(scene);
    this.hintAnimationManager = new HintAnimationManager(scene);

    // Create renderers
    this.handRenderer = new HandRenderer(scene, table);

    // Create selection manager for human player
    const humanHand = table.players[PLAYER.BOTTOM].hand;
    this.selectionManager = new SelectionManager(humanHand, table);

    // Setup event handlers
    this.setupButtonHandlers();
}
```

### Event Handler Registration

GameController should call these handlers:

```javascript
// In GameController
emit(eventName, data) {
    // Route to PhaserAdapter
    if (this.adapter && this.adapter[eventName]) {
        this.adapter[eventName](data);
    }
}
```

### Promise-Based Flow

For user input events:

```javascript
// In GameController
async charlestonPhase() {
    // Emit event to show UI
    this.emit("onCharlestonPhase", { phase: 1, direction: "right" });

    // Wait for user input (button click)
    const selectedTiles = await this.waitForCharlestonPass();

    // Continue game logic
    this.passCharlestonTiles(selectedTiles);
}

// In PhaserAdapter
waitForCharlestonPass() {
    return new Promise((resolve) => {
        this.charlestonResolve = resolve;
    });
}

handleCharlestonPass() {
    const tiles = this.selectionManager.getSelection();

    if (this.charlestonResolve) {
        this.charlestonResolve(tiles);
        this.charlestonResolve = null;
    }
}
```

---

## Integration Points

### With SelectionManager

```javascript
// Enable selection
this.selectionManager.enableTileSelection(minCount, maxCount, mode);

// Get selection
const tiles = this.selectionManager.getSelection();
const count = this.selectionManager.getSelectionCount();

// Check validity
const isValid = this.selectionManager.isValidSelection();

// Disable selection
this.selectionManager.disableTileSelection();
```

### With HandRenderer

```javascript
// Render hand
this.handRenderer.showHand(playerIndex);
this.handRenderer.showHand(playerIndex, true); // Force face-up

// Get positions (for animations)
const pos = this.handRenderer.calculateHiddenTilePositions(playerInfo, hand);
const rackPos = this.handRenderer.getHandRackPosition(playerInfo);
```

### With DialogManager

```javascript
// Charleston dialogs
this.dialogManager.showCharlestonDialog(message);
this.dialogManager.hideCharlestonDialog();

// Courtesy dialogs
this.dialogManager.showCourtesyDialog(message);
this.dialogManager.hideCourtesyDialog();

// Claim dialogs
this.dialogManager.showClaimDialog(message, canMahjong);
this.dialogManager.hideClaimDialog();
```

### With ButtonManager

```javascript
// Update buttons for state
this.buttonManager.updateForState(newState);

// Manual button control
this.buttonManager.showButton1();
this.buttonManager.hideButton1();
this.buttonManager.setButtonText("Pass");
this.buttonManager.enableButton(true);
```

---

## What NOT to Do

- ❌ Don't implement game logic in PhaserAdapter (that's GameController's job)
- ❌ Don't create new tile sprites (TileManager handles that)
- ❌ Don't modify Hand data structures directly (call Hand methods)
- ❌ Don't implement animations in handlers (use scene.tweens or AnimationLibrary)
- ❌ Don't duplicate DialogManager functionality (it's complete, use it as-is)

---

## Success Criteria

- [ ] PhaserAdapter has all manager instances created
- [ ] onCharlestonPhase enables tile selection correctly
- [ ] onUIPrompt shows appropriate dialogs
- [ ] Button clicks route to correct handlers
- [ ] onTileDrawn animates tile from wall to hand
- [ ] onTileDiscarded animates tile to discard pile
- [ ] onHandUpdated re-renders hand
- [ ] onStateChanged updates button visibility/text
- [ ] onExposureCreated shows exposed tiles
- [ ] No console errors during event flow
- [ ] Build passes (npm run build)
- [ ] Lint passes for modified files

---

## Deliverables

1. **PHASERADAPTER_CURRENT_STATE.md** - Analysis of current PhaserAdapter state
2. **PHASERADAPTER_TEST_PLAN.md** - Test scenarios and browser console commands
3. **Enhanced [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)** - Wired event handlers
4. **Updated [desktop/managers/ButtonManager.js](desktop/managers/ButtonManager.js)** - If needed
5. **Git commit** - With descriptive message

---

## Helpful References

- **Current PhaserAdapter:** [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)
- **SelectionManager:** [desktop/managers/SelectionManager.js](desktop/managers/SelectionManager.js)
- **HandRenderer:** [desktop/renderers/HandRenderer.js](desktop/renderers/HandRenderer.js)
- **DialogManager:** [desktop/managers/DialogManager.js](desktop/managers/DialogManager.js)
- **ButtonManager:** [desktop/managers/ButtonManager.js](desktop/managers/ButtonManager.js)
- **Old working code:** `git show 07c41b9:gameLogic.js`
- **Constants:** [constants.js](constants.js) (STATE, PLAYER enums)
- **Implementation roadmap:** [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)

---

## Questions to Answer in Your Docs

1. Which handlers are currently implemented vs stubs?
2. How does event flow work from GameController to PhaserAdapter?
3. What promise-based patterns exist in the old code?
4. How should button clicks be routed to GameController?
5. What animation timing/easing should be used for tile movements?
6. How are managers currently instantiated in PhaserAdapter?
7. Which handlers require user input (promise-based) vs fire-and-forget?

---

## Git Commit Message Template

```
feat: Wire PhaserAdapter event handlers to managers

Connect GameController events to UI managers for complete event flow.

Handler Implementations:
- onCharlestonPhase: Enable SelectionManager, update button text
- onUIPrompt: Route to DialogManager based on prompt type
- onTileDrawn: Animate tile from wall to hand with HandRenderer
- onTileDiscarded: Animate tile to discard pile
- onHandUpdated: Re-render hand using HandRenderer
- onStateChanged: Update ButtonManager state
- onExposureCreated: Display exposed tiles in rack

Manager Integration:
- Created SelectionManager instance for human player
- Created HandRenderer instance with scene and table
- Wired DialogManager to prompt events
- Enhanced ButtonManager.updateForState() for all game states

Button Handling:
- Setup click handlers for button1 and button2
- Route clicks based on current game state
- Enable/disable based on SelectionManager validity
- Update button text per state

Promise-Based Flow:
- Charleston pass waits for user tile selection
- Discard selection waits for button click
- Claim decision waits for user choice

Animation:
- Tile draw: 200ms ease-out from wall to hand
- Tile discard: 350ms ease-in to discard pile with sound
- Hand re-render after tile movements

This completes Component 3 from IMPLEMENTATION_ROADMAP.md.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Final Notes

- Focus on getting the event flow working first, optimize animations later
- Test each handler individually using browser console
- When in doubt, refer to 07c41b9 for exact patterns
- Don't worry about mobile yet - desktop first
- Log liberally to debug event flow

This is the critical integration layer that connects everything. Take your time and test thoroughly!
