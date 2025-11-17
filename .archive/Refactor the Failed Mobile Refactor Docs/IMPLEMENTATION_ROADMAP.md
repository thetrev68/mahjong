# Implementation Roadmap: Completing Option B

Based on deep investigation of:
1. Current codebase (managers, PhaserAdapter, etc.)
2. Commit 07c41b9 (last working version)
3. DialogManager analysis
4. Complete game flow documentation

---

## Phase 1: Understand Current State (✅ COMPLETE)

### What We've Learned

**DialogManager**: ✅ 100% Complete
- All dialog types implemented
- Perfect patterns
- Ready to use immediately

**PhaserAdapter**: ⚠️ Partially Connected
- Some handlers call DialogManager correctly
- But most handlers are stubs or don't route properly
- Tile animation logic missing

**Existing Managers**:
- `ButtonManager` - exists, incomplete
- `TileManager` - exists, incomplete
- `HintAnimationManager` - exists, should work
- `DialogManager` - exists, fully functional

**Missing Components** (Must Create):
- `SelectionManager` - track selected tiles
- `HandRenderer` - render hands using showHand() logic
- `AnimationLibrary` (may already partially exist)

**Old System Insights** (from 07c41b9):
- Promise-based async flow via button clicks
- Tile selection via Y-position (575 = selected, 600 = normal)
- State-based UI updates via updateUI()
- Tile selection tracked in TileSet.selectCount
- Hand.getSelectionHidden() returns selected tiles

---

## Phase 2: Create Critical Missing Component

### SelectionManager (Must Create)

**Purpose**: Track which tiles are selected and manage selection state

**Methods Needed**:
```typescript
interface SelectionManager {
    // Enable/disable selection for current phase
    enableTileSelection(minCount: number, maxCount: number, mode: "charleston"|"courtesy"|"play"|"expose")
    disableTileSelection()

    // Get current selection
    getSelection(): Tile[]
    getSelectionCount(): number

    // Manual selection control (called from tile click handlers)
    toggleTile(tile: Tile): boolean  // Returns true if added, false if removed
    selectTile(tile: Tile): boolean
    deselectTile(tile: Tile): boolean
    clearSelection()

    // Validation
    isValidSelection(): boolean  // Check min/max count
    canSelectMore(): boolean

    // Visual feedback
    visualizeTile(tile: Tile, selected: boolean)  // Y-position 575 vs 600
}
```

**Based On** (from 07c41b9):
```javascript
TileSet {
    selectCount = 0
    getSelection() → returns tiles where selected
    resetSelection() → clears all
}
```

**Implementation Strategy**:
1. Extend or refactor Hand.TileSet selection logic
2. Create SelectionManager that wraps/coordinates this
3. Wire up tile click handlers to call SelectionManager

---

## Phase 3: Wire Up PhaserAdapter Handlers

### Current State of Key Handlers

| Handler | Current | Needs |
|---------|---------|-------|
| onGameStarted | ✅ Implemented | Minor tweaks |
| onStateChanged | ⚠️ Stub | Wire to ButtonManager |
| onCharlestonPhase | ❌ Stub (just prints) | Enable tile selection |
| onUIPrompt | ⚠️ Partially | Route to DialogManager calls |
| handleCharlestonPassPrompt | ⚠️ Calls DialogManager | Depends on SelectionManager |
| onTileDrawn | ❌ Missing animation | Create tile animation |
| onTileDiscarded | ⚠️ Missing animation | Create discard animation |
| onTurnChanged | ⚠️ Needs work | Update UI |

### Required Implementation

**For Each Event, PhaserAdapter Must**:
1. Unpack event data
2. Route to appropriate manager(s)
3. For user input events: set up callbacks/promises
4. Return results to GameController

**Example: Charleston Phase**
```javascript
// Current (broken)
onCharlestonPhase(data) {
    printMessage(`Charleston Phase ${phase}...`)
    // Nothing else - dialog never shows!
}

// Needed
onCharlestonPhase(data) {
    // Enable tile selection for this phase
    this.selectionManager.enableTileSelection(3, 3, "charleston")

    // Prepare hand renderer for selection mode
    this.handRenderer.setSelectionMode("charleston")

    // When UI_PROMPT comes in, dialog will be shown
    // This event is just "phase started"
}
```

---

## Phase 4: Implement Tile Animations

### onTileDrawn Implementation
```javascript
onTileDrawn(data) {
    const {player, tile} = data
    const phaserTile = this.tileManager.getTile(tile.index)

    // Position at wall
    phaserTile.sprite.setPosition(wallX, wallY)
    phaserTile.sprite.setAlpha(0)

    // Animate to hand position
    const targetPos = this.handRenderer.getTargetPosition(player)
    this.scene.tweens.add({
        targets: phaserTile.sprite,
        x: targetPos.x,
        y: targetPos.y,
        alpha: 1,
        duration: 200
    })
}
```

### onTileDiscarded Implementation
```javascript
onTileDiscarded(data) {
    const {player, tile} = data
    const phaserTile = this.tileManager.getTile(tile.index)

    // Position at current position
    const currentPos = this.handRenderer.getTilePosition(player, tile)

    // Animate to discard center (350, 420)
    this.scene.tweens.add({
        targets: phaserTile.sprite,
        x: 350,
        y: 420,
        duration: 350,
        onComplete: () => {
            this.scene.audioManager.playSFX("tile_dropping")
        }
    })
}
```

---

## Phase 5: Implement HandRenderer

**Purpose**: Render player hands using showHand() logic from old system

**Methods Needed**:
```typescript
interface HandRenderer {
    showHand(player: Player, forceFaceup?: boolean)

    getTargetPosition(playerIndex: number, tileIndex?: number): {x, y}
    getTilePosition(playerIndex: number, tile: Tile): {x, y}

    setSelectionMode(mode: string)  // "charleston" | "courtesy" | "play" | "expose"

    highlightSelectedTiles()
    unhighlightTiles()
}
```

**Implementation**: Copy showHand() logic from 07c41b9 gameObjects_hand.js, adapt for new system.

---

## Phase 6: Complete ButtonManager Wiring

**Current**: ButtonManager exists but probably not fully connected

**Needed**:
1. ButtonManager.updateForState(newState) - show/hide buttons correctly
2. Button text updates based on state
3. Button disabled state based on selection validity
4. Button click handlers properly routed to GameController

---

## Work Breakdown (Detailed)

### Component 1: SelectionManager (~2 hours)
```
1. Analyze TileSet selection logic in 07c41b9 (1 hour)
2. Design SelectionManager API (30 min)
3. Implement SelectionManager (30 min)
   - Wrap existing hand/tileset logic
   - Add visual feedback methods
4. Wire tile click handlers (30 min)
5. Test with Charleston phase (30 min)
```

### Component 2: HandRenderer (~1.5 hours)
```
1. Extract showHand() logic from 07c41b9 (30 min)
2. Design HandRenderer class (30 min)
3. Implement for all 4 player positions (30 min)
4. Test rendering and positioning (30 min)
```

### Component 3: PhaserAdapter Handlers (~2 hours)
```
1. Wire onCharlestonPhase → SelectionManager (30 min)
2. Wire onUIPrompt → DialogManager (30 min)
3. Implement onTileDrawn animation (30 min)
4. Implement onTileDiscarded animation (30 min)
5. Wire other handlers (30 min)
```

### Component 4: ButtonManager Integration (~1 hour)
```
1. Review ButtonManager current implementation (15 min)
2. Implement updateForState() (30 min)
3. Wire button click handlers (15 min)
```

### Component 5: Testing (~2 hours)
```
1. Test deal and hand rendering (30 min)
2. Test Charleston with tile selection (45 min)
3. Test main game loop (45 min)
```

**Total Estimate**: ~8.5 hours for desktop MVP

---

## Dependency Graph

```
SelectionManager
    ├─ Depends on: TileSet (old code)
    └─ Needed by: PhaserAdapter, HandRenderer

HandRenderer
    ├─ Depends on: showHand() logic (07c41b9)
    └─ Needed by: PhaserAdapter handlers

PhaserAdapter Handlers
    ├─ Depend on: SelectionManager, HandRenderer, DialogManager, ButtonManager
    └─ Depend on: GameController events

TileManager
    ├─ Already exists
    └─ Needed by: PhaserAdapter for animations

DialogManager
    ├─ Already exists and works
    └─ Needed by: PhaserAdapter handlers

ButtonManager
    ├─ Already exists
    ├─ Needs: wiring to GameController
    └─ Needed by: PhaserAdapter for UI updates
```

**Critical Path**:
1. SelectionManager (blocks PhaserAdapter implementation)
2. HandRenderer (blocks animations)
3. PhaserAdapter handlers (blocks overall flow)

---

## Success Criteria

### Phase 2 Complete (SelectionManager)
- [ ] Can select 3 tiles during Charleston
- [ ] Selected tiles visually indicate selection (Y-position)
- [ ] Can deselect tiles
- [ ] Selection count tracked correctly
- [ ] Validation works (min/max count)

### Phase 3 Complete (PhaserAdapter Wiring)
- [ ] Charleston dialog appears when expected
- [ ] Other dialogs (courtesy, claim) appear
- [ ] Button text updates correctly
- [ ] Buttons are hidden/shown appropriately

### Phase 4 Complete (Animations)
- [ ] Tiles animate from wall to hand
- [ ] Tiles animate to discard pile
- [ ] Animations have correct duration/easing

### Phase 5 Complete (HandRenderer)
- [ ] Hands display correctly for all 4 players
- [ ] Tiles positioned correctly in each hand
- [ ] Hand reorders when tiles removed

### Phase 6 Complete (ButtonManager)
- [ ] Correct buttons shown for each state
- [ ] Button text reflects current action
- [ ] Buttons disabled when selection invalid

### Desktop MVP Complete
- [ ] Deal completes without freezing
- [ ] Charleston works (can select and pass tiles)
- [ ] Courtesy works
- [ ] Main loop works (pick, discard, claim)
- [ ] Game ends properly (mahjong or wall game)
- [ ] No crashes during normal play

---

## Implementation Notes

### Reusable Code from 07c41b9
```
- TileSet.selectCount logic
- Hand.showHand() method (entire method)
- chooseDiscard() flow (button setup pattern)
- charlestonPass() flow (promise + button pattern)
- updateUI() method (state-based UI logic)
- getSelectionHidden() method
```

### Do NOT Reuse (Incompatible with New Architecture)
```
- GameLogic class (refactored to GameController)
- Direct button manipulation from game logic
- HintAnimationManager constructor (needs updating)
```

### Architectural Decisions Made
```
✅ Promise-based async (button click → resolve)
✅ Event-driven (GameController → PhaserAdapter)
✅ Manager pattern (DialogManager, TileManager, etc.)
✅ Separation of concerns (logic vs rendering)
✅ Reuse existing managers where possible
```

---

## Risk Mitigation

### Highest Risk: SelectionManager
**Risk**: If selection system doesn't work, nothing works
**Mitigation**: Test early with simple test case (5 tiles, select 3)

### High Risk: Tile Animations
**Risk**: Animation timing or positioning wrong
**Mitigation**: Use existing animation library, test with one animation type first

### Medium Risk: HandRenderer
**Risk**: Position calculations wrong for different player positions
**Mitigation**: Test each player position individually

### Low Risk: PhaserAdapter Wiring
**Risk**: Wrong event handler called
**Mitigation**: Add logging to verify events flow correctly

---

## Next Steps

1. **Immediately**: Create SelectionManager implementation plan
2. **Within 1 hour**: Start SelectionManager implementation
3. **Every 30 min**: Test working components
4. **When stuck**: Refer back to 07c41b9 for exact implementation patterns

## Questions for Trevor

1. Should SelectionManager replace Hand selection logic, or wrap it?
2. Should HandRenderer be a separate class or part of PhaserAdapter?
3. For Phase 6 (ButtonManager), are there existing tests we can reference?
4. What's the priority - get it working or make it pretty?

---

This roadmap is detailed enough to guide implementation without micro-managing.
The 07c41b9 investigation gives us exact patterns to follow.
