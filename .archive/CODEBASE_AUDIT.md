# Codebase Audit: Desktop Managers & Mobile Components

## Desktop Managers (desktop/managers/)

### 1. DialogManager.js ✅
**Purpose**: Handle all UI dialogs and prompts
**Status**: EXISTS - appears to be partially implemented
**Methods Found**:
- `showYesNoDialog(question, callback)` - YES/NO prompts
- Likely has: `showModalDialog()`, `closeDialog()`
**Responsibilities**:
- Show modal dialogs
- Handle yes/no prompts
- Tile selection dialogs (Charleston, courtesy, etc.)
- Return results via callbacks
- Block game interaction

**Status Assessment**: Looks like it was created but might not be fully wired up in PhaserAdapter

---

### 2. TileManager.js ✅
**Purpose**: Manage all tile sprites on game board
**Status**: EXISTS - skeleton implemented
**Properties Found**:
- `tileSprites` - Map of tile.index → Phaser sprite
- `selectedTiles` - Set of selected tile indices
- `onTileSelected`, `onTileDeselected` - callbacks
- `dragEnabledPlayers` - track drag state
**Responsibilities**:
- Create/destroy tile sprites
- Track and update tile positions
- Handle tile layout for all 4 players
- Manage tile selection/deselection
- Sync sprite visual state with game state
- Support hand reordering

**Status Assessment**: Skeleton exists, but core functionality probably not implemented

---

### 3. ButtonManager.js ✅
**Purpose**: Manage button visibility and interactions
**Status**: EXISTS - appears complete
**Methods Found**:
- `setupButtonListeners()` - wire up click handlers
**Responsibilities**:
- Update button visibility based on game state
- Set button text based on context
- Enable/disable buttons
- Wire button clicks to GameController callbacks

**Status Assessment**: Appears well-structured, probably works

---

### 4. HintAnimationManager.js ✅
**Purpose**: Handle hint panel display and tile glow effects
**Status**: EXISTS - from old GameLogic
**Likely Responsibilities**:
- Show top 3 possible hands
- Apply glow effects to suggested discard tiles
- Update hints with new hand state

**Status Assessment**: Probably works but might have stale references (Tile vs TileData)

---

## Mobile Components (mobile/)

### Structure Overview
```
mobile/
├── animations/
│   └── AnimationController.js      (Animation logic for mobile)
├── components/
│   ├── DiscardPile.js             (Mobile discard pile UI)
│   ├── InstallPrompt.js           (PWA install prompt)
│   ├── MobileTile.js              (HTML/CSS tile component)
│   ├── OpponentBar.js             (Opponent info display)
│   └── SettingsSheet.js           (Settings UI)
├── gestures/
│   └── TouchHandler.js            (Touch input handling)
├── renderers/
│   └── HandRenderer.js            (Render player hand)
└── main.js                        (Mobile entry point)
```

### Mobile Component Status

| File | Exists | Purpose | Notes |
|------|--------|---------|-------|
| MobileTile.js | ✅ | HTML/CSS tile component | Needs refactor for GameController? |
| HandRenderer.js | ✅ | Render mobile hand | Needs refactor for GameController |
| TouchHandler.js | ✅ | Handle touch input | May need adjustment |
| AnimationController.js | ✅ | Mobile animations | May not have GameController integration |
| DialogManager | ❌ | Mobile dialogs | Doesn't exist - needs creation |
| SelectionManager | ❌ | Mobile tile selection | Doesn't exist - needs creation |

---

## Missing Components (Need to Create)

### Desktop
- [ ] **HandRenderer** - Render hand using showHand() logic
- [ ] **SelectionManager** - Unified tile selection across all phases
- [ ] **HandValidationManager** - Validate which tiles can be selected
- [ ] **AnimationManager** - Coordinate animations (optional, might be inline)

### Mobile
- [ ] **MobileDialogManager** - Mobile version of dialogs
- [ ] **MobileSelectionManager** - Touch-friendly tile selection
- [ ] **MobileHandValidationManager** - Mobile validation

---

## Integration Status

### What's Wired Up?
- ✅ ButtonManager - appears wired to PhaserAdapter
- ✅ TileManager - created in PhaserAdapter, but handlers might not use it
- ✅ DialogManager - created in PhaserAdapter, but handlers might not use it
- ✅ HintAnimationManager - exists, but stale references to Tiles

### What's NOT Wired Up?
- ❌ DialogManager methods not called from PhaserAdapter handlers
- ❌ TileManager not used for tile rendering
- ❌ SelectionManager doesn't exist
- ❌ HandRenderer doesn't exist
- ❌ PhaserAdapter event handlers are all stubs

---

## Key Findings

### 1. Infrastructure Exists But Not Connected
**Good news**: Most of the pieces exist (DialogManager, TileManager, ButtonManager)
**Bad news**: They're not actually being called from PhaserAdapter handlers

### 2. Hand Rendering Logic Missing
**Problem**: Old `gameObjects_hand.js` had showHand() that positioned tiles
**Need**: New HandRenderer that uses same logic but works with GameController

### 3. Mobile is Partially Prepared
**Good**: Components (MobileTile, HandRenderer) exist
**Bad**: Not integrated with GameController, need DialogManager equivalent

### 4. No Unified Selection System
**Problem**: Charleston, courtesy, and regular discard all need selection
**Need**: SelectionManager that works for all cases

---

## Recommended Implementation Order

### Phase 1: Wire Up Desktop (Use existing managers)
1. Implement PhaserAdapter handlers as pure messengers
2. Call existing managers (DialogManager, TileManager, ButtonManager)
3. Get game flowing without crashes

### Phase 2: Create Missing Desktop Managers
1. Create HandRenderer (copy showHand() logic)
2. Create SelectionManager
3. Create HandValidationManager
4. Integrate into PhaserAdapter

### Phase 3: Test Desktop MVP
1. Deal with animations
2. Charleston with selection
3. Full game flow

### Phase 4: Refactor Mobile
1. Update mobile/components to work with GameController events
2. Create MobileDialogManager
3. Create MobileSelectionManager
4. Create MobileRenderer (mirror of PhaserAdapter)

---

## Code Locations to Check/Fix

### Immediate Issues
- `PhaserAdapter.js` - Event handlers are stubs, need to call managers
- `gameObjects_hand.js` - showHand() logic needs extraction to HandRenderer
- `mobile/renderers/HandRenderer.js` - Check if it needs major refactor
- `mobile/components/MobileTile.js` - Check compatibility with GameController

### Managers to Review
- `desktop/managers/DialogManager.js` - Verify methods exist
- `desktop/managers/TileManager.js` - Check what's implemented
- `desktop/managers/ButtonManager.js` - Verify STATE-based updates
- `desktop/managers/HintAnimationManager.js` - Check for Tile vs TileData issues

---

## Next Steps

1. **Code review meetings** for each manager (DialogManager, TileManager, etc.)
2. **Extract HandRenderer logic** from gameObjects_hand.js showHand()
3. **Create SelectionManager** for unified tile selection
4. **Wire PhaserAdapter** to actually call the managers
5. **Test incrementally** as each piece is wired

This is less "broken everywhere" and more "pieces exist but not integrated."
The refactor work is real but manageable.
