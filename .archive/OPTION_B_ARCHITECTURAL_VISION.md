# Option B: Architectural Vision (Approved by Trevor)

## Core Principle

**Separation of Concerns**: GameController emits platform-agnostic events. Renderers (Phaser & Mobile) consume those events and render appropriately.

```
GameController (core logic)
    ├─ Emits platform-agnostic events (same for desktop & mobile)
    ├─ Owns game state machine
    ├─ Owns game rules and decisions
    └─ Owns detailed event logic (including Charleston steps)

PhaserAdapter (desktop translator ONLY)
    ├─ Listens to GameController events
    ├─ Passes messages to appropriate desktop managers
    └─ Returns user actions back to GameController via callbacks

Desktop Managers (specialized renderers)
    ├─ TileRenderer - handles tile display, animation, positioning
    ├─ HandRenderer - uses showHand() logic to render hands
    ├─ DialogManager - wires up dialogs (already exists)
    ├─ AnimationManager - coordinates animations (if needed)
    └─ SelectionManager - handles tile selection across all phases

MobileRenderer (mobile translator, parallel structure)
    ├─ Listens to SAME GameController events
    ├─ Passes messages to appropriate mobile managers
    └─ Returns user actions back to GameController via callbacks

Mobile Managers (specialized renderers)
    ├─ MobileTile - HTML/CSS tile component
    ├─ HandRenderer (refactored) - render hand for mobile
    ├─ DialogManager (refactored) - mobile dialogs
    └─ SelectionManager (refactored) - touch-friendly selection
```

## Key Design Decisions

### 1. PhaserAdapter is a MESSENGER ONLY

**NOT responsible for**:

- Creating dialogs
- Managing animations
- Handling tile positioning
- Implementing game logic

**Responsible for**:

- Converting GameController events to manager calls
- Converting user actions back to GameController callbacks
- Routing messages to correct managers

**Example**:

```javascript
// BAD (what I was doing)
onCharlestonPhase(data) {
    // Create dialog, show buttons, etc
    this.dialogManager.showCharlestonPassDialog(...)
}

// GOOD (messenger pattern)
onCharlestonPhase(data) {
    // Just forward the event with all game data
    this.handRenderer.prepareForCharleston(data)
    this.dialogManager.showCharlestonPrompt(data)
}
```

### 2. Hand Display Logic Lives in Renderers

**Not in GameController, not in abstract models.**

**Desktop**: HandRenderer (uses showHand() logic)
**Mobile**: Mobile HandRenderer (refactored version, uses same game data)

Both receive the same hand data from GameController and render it appropriately for their platform.

### 3. GameController Owns All Charleston Logic

**Including**:

- Detailed event flow (CHARLESTON_PHASE_START, CHARLESTON_PASS_REQUESTED, etc.)
- Pass direction logic
- State transitions

**Same events for both platforms** - PhaserAdapter and MobileRenderer just render them differently.

**Charleston event example**:

```javascript
// GameController emits detailed events
emit("CHARLESTON_PHASE", {
    phase: 1,
    passNumber: 1,
    direction: "RIGHT",
    currentPlayer: 0,
    description: "Choose 3 tiles to pass right"
})

// PhaserAdapter just routes it
onCharlestonPhase(data) {
    this.selectionManager.enableTileSelection(3, "pass")
    this.dialogManager.showCharlestonPrompt(data)
}

// MobileRenderer does the same but for mobile
onCharlestonPhase(data) {
    this.mobileSelectionManager.enableTileSelection(3, "pass")
    this.mobileDialogManager.showCharlestonPrompt(data)
}
```

### 4. Tile Selection is Unified

**SelectionManager** handles tile selection across:

- Charleston phase (select 3 to pass)
- Courtesy phase (select 0-3 for exchange)
- Regular play phase (select 1 to discard)
- Exposure phase (select specific tiles)

**Difference is quantity, not mechanism.**

Receives selection parameters from GameController events:

```javascript
{
    selectionType: "CHARLESTON_PASS",
    minTiles: 3,
    maxTiles: 3,
    validationMode: "charleston"
}
```

### 5. Hand Validation is a Separate Manager

**HandValidationManager** handles:

- Which tiles can be selected (validation mode)
- Visual feedback (highlighting, error messages)
- Tile count limits

Receives validation parameters from GameController events.

### 6. Animation Parameters are NOT in Events

**Problem**: GameController shouldn't know about animation timing.

**Solution**:

- GameController emits semantic events: "TILE_DRAWN", "TILE_DISCARDED"
- PhaserAdapter knows "TILE_DRAWN means animate from wall to hand"
- AnimationManager encodes animation logic (duration, easing, etc.)
- Mobile doesn't animate - it just renders

**Each platform decides how to animate based on event type**, not based on parameters in event.

---

## Architectural Layers (Desktop Example)

```
GameController
    ↓ (TILE_DRAWN event with TileData)
PhaserAdapter (just routes)
    ├─ → HandRenderer.addTileToHand(tileData)
    ├─ → TileRenderer.createTileSprite(tileData)
    └─ → AnimationManager.animateTileFromWallToHand(tileIndex)

User clicks tile during Charleston
    ↑ (clicks)
SelectionManager (tracks selection)
    ↑ (reports selection)
PhaserAdapter (converts action)
    ↑
GameController.confirmCharlestonPass(selectedTiles)
```

---

## Event Language (Platform-Agnostic)

### Game Flow Events

```javascript
GAME_STARTED
STATE_CHANGED { oldState, newState }
WALL_CREATED { tileCount }
```

### Deal Phase Events

```javascript
TILE_DRAWN { player, tile: TileData, index }
TILES_DEALT { players: [{position, tileCount}] }
```

### Charleston Phase Events

```javascript
CHARLESTON_PHASE_STARTED { phase: 1-3 }
CHARLESTON_PASS_REQUESTED {
    player,
    direction, // "LEFT", "RIGHT", "ACROSS"
    description: "Choose 3 tiles to pass right"
}
CHARLESTON_PASS_COMPLETED { player, direction, tiles }
```

### Play Phase Events

```javascript
TURN_CHANGED { currentPlayer }
TILE_DRAWN { player, tile: TileData }
DISCARD_REQUESTED { player, description: "Choose tile to discard" }
TILE_DISCARDED { player, tile: TileData }
DISCARD_CLAIMED { player, claimType: "PUNG|KONG|QUINT|MAHJONG" }
TILES_EXPOSED { player, exposureType, tiles }
```

### Game End Events

```javascript
GAME_ENDED { reason: "MAHJONG|WALL_GAME", winner, handDescription }
```

---

## Inventory: What Managers Already Exist?

**Need to audit `desktop/managers/`:**

- [ ] DialogManager - does it work? What dialogs does it have?
- [ ] TileManager - does it exist? What does it do?
- [ ] ButtonManager - exists? What buttons does it manage?
- [ ] Others?

**Missing/Need to create**:

- [ ] HandRenderer - render hand using showHand() logic
- [ ] TileRenderer (or part of HandRenderer) - create tile sprites
- [ ] SelectionManager - track tile selection state
- [ ] HandValidationManager - validate which tiles can be selected
- [ ] AnimationManager - coordinate animations (maybe doesn't need to be separate)

**Mobile equivalents** (need to refactor from existing or create new):

- [ ] Mobile HandRenderer
- [ ] Mobile SelectionManager
- [ ] Mobile DialogManager

---

## Implementation Order (Revised Based on Architecture)

### Phase 1: Audit Existing Code

- [ ] List what managers exist in desktop/managers/
- [ ] Check if DialogManager works
- [ ] Check if TileManager exists and what it does
- [ ] Check mobile/renderers/ and mobile/components/

### Phase 2: Create Missing Desktop Managers

- [ ] HandRenderer (implement with old showHand() logic)
- [ ] SelectionManager (unified tile selection)
- [ ] HandValidationManager
- [ ] Wire them up to PhaserAdapter

### Phase 3: Fix GameController Events

- [ ] Audit GameController for all events it emits
- [ ] Ensure Charleston events are detailed enough
- [ ] Ensure all events have required data

### Phase 4: Wire PhaserAdapter as Pure Messenger

- [ ] For each event, implement handler that just routes to managers
- [ ] No business logic, no animation code

### Phase 5: Desktop MVP Testing

- [ ] Deal with animations
- [ ] Charleston with tile selection
- [ ] Discard with animation
- [ ] Game completes

### Phase 6: Mobile Renderer

- [ ] Refactor mobile components to work with GameController
- [ ] Create MobileRenderer (mirror of PhaserAdapter)
- [ ] Create/refactor mobile managers
- [ ] Test game flow on mobile

---

## Questions for Clarity

1. **HandRenderer** - should this be:
   - A separate manager that PhaserAdapter calls?
   - Or should it be integrated with TileRenderer?
   - How coupled should it be to the old gameObjects_hand.js showHand() logic?

2. **SelectionManager and HandValidationManager** - should these be:
   - Desktop-specific managers?
   - Or platform-agnostic models that both renderers use?

3. **AnimationManager** - do we need it?
   - Or should animation logic just be inline in PhaserAdapter event handlers?
   - Or in TileRenderer/HandRenderer?

4. **Mobile refactoring** - for mobile/renderers/HandRenderer.js:
   - Does it need major refactoring, or minor tweaks?
   - Can it work with the same GameController events?

5. **When we wire up Charleston** - should GameController emit:
   - One event per pass? (CHARLESTON_PASS_1_LEFT, CHARLESTON_PASS_2_LEFT, etc.)
   - Or generic CHARLESTON_PASS_REQUESTED that includes pass number?

---

## Success Criteria (Revised)

### Desktop MVP Complete When:

- [ ] All game phases work without crashing
- [ ] Tile animations are smooth
- [ ] Charleston works (select, pass, receive)
- [ ] Courtesy works (vote, pass)
- [ ] Main loop works (draw, discard, claim, expose)
- [ ] Game completes with winner announcement

### Architecture Complete When:

- [ ] PhaserAdapter is pure messenger (no business logic)
- [ ] All rendering logic is in managers
- [ ] GameController emits same events for all platforms
- [ ] Mobile renderer can work alongside Phaser adapter

---

## Next Steps

1. **Audit existing code** - check what managers exist, what works, what's broken
2. **Answer clarification questions** - help me understand the exact shape of some components
3. **Create detailed task list** - specific code locations, specific changes needed
4. **Start implementing** - methodical, testable, committed

This plan maintains clean separation of concerns and allows mobile to work in parallel once desktop is stable.
