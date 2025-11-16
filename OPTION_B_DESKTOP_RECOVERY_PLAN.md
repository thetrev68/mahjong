# Option B Desktop Recovery Plan

## Objectives
- Restore the approved Option B separation: `core/GameController` emits platform-agnostic events, while the desktop stack (PhaserAdapter + managers) handles rendering, prompts, and orchestration.
- Remove Phaser/table dependencies from `core/`, ensuring the same events can drive the future mobile renderer.
- Activate the new desktop managers (TileManager, HandRenderer, SelectionManager, DialogManager, ButtonManager) so PhaserAdapter becomes a thin messenger.

---

## Current Gaps (recap)
1. **GameController still mutates Phaser objects**  
   - Directly accesses `sharedTable.wall` and `Tile` objects during deal/draw/discard (`core/GameController.js:170-214`, `520-609`).
   - Emits prompts but also removes/ inserts `TileData` immediately, so adapters cannot control animation timing.

2. **PhaserAdapter owns rendering + logic**  
   - Handles deal sequencing, hand updates, prompts, and button wiring inline (`desktop/adapters/PhaserAdapter.js:236-520`, `840-980`).  
   - Instantiates managers but never calls them after construction.

3. **Managers remain unused / partially wired**  
   - `TileManager` cannot register sprites because adapter bypasses it.  
   - `HandRenderer` duplicates `Hand.showHand` but never receives events.  
   - Selection/Dialog/Button managers mix legacy + new flows, causing inconsistent UI.

---

## Proposed Workstream

### 1. Decouple GameController from Phaser
**Goal:** GameController should operate on pure data (TileData arrays, player indices) and emit events/prompts without touching Phaser tables.

**Steps**
1. Remove `sharedTable` reference and replace with pure wall model:
   - Introduce `this.wallTiles` as an array of `TileData` created via new `WallBuilder` helper or by cloning the Phaser wall before game start.
   - During `createWall` emit `WALL_CREATED` with counts only; no sprite references.
2. Update `dealTiles`, `pickFromWall`, `chooseDiscard`, Charleston/courtesy handlers to push/pop `TileData`, not Phaser `Tile`s.
3. Emit richer events so adapters can animate:
   - `TILE_DRAWN {player, tile, animationHint}` already exists; ensure `tile` contains a stable `id/index`.
   - `HAND_UPDATED` should include diffs (e.g., `addedTiles`, `removedTiles`) so renderers know what changed.
4. Ensure prompts always wait for adapter callbacks (no direct UI writes). Add explicit acknowledgements for phases that require animation completion (e.g., `DEAL_SEQUENCE_COMPLETE`, `CHARLESTON_PASS_COMPLETE`, etc.).

### 2. Reframe PhaserAdapter as Messenger
**Goal:** Adapter listens to controller events and delegates to specialized managers; it does not own business logic.

**Steps**
1. Extract all prompt handlers (`handleDiscardPrompt`, `handleCharlestonPassPrompt`, etc.) into Dialog/Selection manager APIs:
   - e.g., `selectionManager.requestSelection({min,max,mode}).then(...)`.
2. Replace inline deal/draw/discard code with manager calls:
   - `TileManager.initializeFromWall()` builds sprite map once.
   - `HandRenderer.renderHiddenHand(playerIndex, handSnapshot)` handles layout updates.
3. Adapter’s event handlers become simple routers:
   - `onTileDrawn => tileManager.handleTileDrawn(event); handRenderer.update(playerIndex, handSnapshot);`
   - `onCharlestonPhase => selectionManager.enable(modeConfig); dialogManager.showCharlestonPrompt(data);`
4. Push button state logic into `ButtonManager`/`SelectionManager` so adapter no longer manipulates DOM/scene elements directly.

### 3. Activate Desktop Managers
**Goal:** Each manager encapsulates a concern and exposes methods the adapter can call.

**Steps**
1. **TileManager**
   - Implement sprite registration (`registerTileSprite`) using the wall once during scene setup.
   - Provide APIs: `moveTileToHand(player, tileData, options)`, `moveTileToDiscard(tileData)`, `applySelectionState(tile, selected)`.
2. **HandRenderer**
   - Accepts `HandSnapshot` (hidden tiles + exposures) and positions sprites accordingly (reuse logic from `Hand.showHand`).
   - Provide `render(playerIndex, snapshot, {faceUpOverride})`.
3. **SelectionManager**
   - Convert current hand-bound implementation into manager-level service that listens for tile clicks and notifies adapter.
   - unify courtesy/charleston/discard/exposure flows by passing `selectionConfig`.
4. **DialogManager + ButtonManager**
   - Provide promise-based helpers (`await dialogManager.askCharlestonContinue()`), decoupling UI details from adapter.

### 4. Testing & Validation
1. **Unit-ish checks:**  
   - Simulate controller events by manually emitting `TILE_DRAWN`, `HAND_UPDATED`, etc., ensuring managers respond without runtime errors.
2. **Desktop flow walkthrough:**  
   - Start game → verify deal animation uses new manager APIs.  
   - Charleston: select tiles, ensure controller receives data and passes propagate correctly.  
   - Discard loop: draw/discard/claim/expose without crashes.
3. **Regression hooks:**  
   - Add logging/asserts to ensure adapter never invokes Phaser APIs directly (temporary dev assertions).

---

## Execution Order
1. **Refactor GameController (core)**
   - new wall abstraction, event payloads, prompt fences.
2. **Build manager APIs**
   - finalize TileManager/HandRenderer/SelectionManager promise-based methods.
3. **Rewrite PhaserAdapter handlers**
   - remove direct table access; wire events to managers; route UI prompts.
4. **Integration test desktop flow**
   - manual run-through; collect issues for follow-up tasks.

---

## Notes & Open Questions
- **Wall ownership:** easiest path is letting Phaser build tile sprites, then exporting `TileData` snapshots to controller; confirm ability to build identical walls for mobile or create deterministic seed.
- **Hand snapshots:** confirm `PlayerData.hand.toJSON()` includes stable `tileId/index`. If not, add `uid`.
- **Selection UX:** unify around SelectionManager events so both desktop and mobile can reuse validation logic (may become shared module later).

---

Prepared to guide implementation and adjust as we discover additional coupling hot spots.
