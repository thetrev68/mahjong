# Animation Architecture Refactor Plan

**Status:** 🟡 Planning Phase
**Target:** Mobile Platform (Phase 1), Desktop (Phase 2)
**Focus:** Charleston Animations with Future-Proof Foundation
**Created:** 2025-01-23
**Last Updated:** 2025-01-23

---

## 📋 Progress Tracker

### Phase 1: Architecture + Charleston (Mobile)

| Task | Status | Owner | Est. Lines | Files |
|------|--------|-------|------------|-------|
| **Planning & Design** |
| 1.1 Architecture document (this file) | 🟡 In Progress | Sonnet | - | 1 |
| 1.2 Component interface design | ⚪ Not Started | Sonnet | - | - |
| 1.3 Event schema updates | ⚪ Not Started | Sonnet | - | - |
| 1.4 Animation timing diagrams | ⚪ Not Started | Sonnet | - | - |
| **HandRenderer Refactor** |
| 2.1 Create HandSelectionManager.js | ⚪ Not Started | Haiku | ~200 | 1 new |
| 2.2 Create HandEventCoordinator.js | ⚪ Not Started | Haiku | ~150 | 1 new |
| 2.3 Refactor HandRenderer.js (slim down) | ⚪ Not Started | Haiku | ~250 | 1 modified |
| 2.4 Update MobileRenderer integration | ⚪ Not Started | Sonnet | ~80 | 1 modified |
| 2.5 Write unit tests for new components | ⚪ Not Started | Haiku | ~300 | 3 new |
| **Animation System** |
| 3.1 Create AnimationSequencer.js (base) | ⚪ Not Started | Sonnet | ~150 | 1 new |
| 3.2 Create CharlestonAnimationSequencer.js | ⚪ Not Started | Sonnet | ~300 | 1 new |
| 3.3 Add CSS animations for pass/receive | ⚪ Not Started | Haiku | ~100 | 1 modified |
| 3.4 Implement FLIP sort animation | ⚪ Not Started | Haiku | ~80 | 2 modified |
| **Event Flow Updates** |
| 4.1 Update GameController TILES_RECEIVED | ⚪ Not Started | Sonnet | ~50 | 1 modified |
| 4.2 Add animation metadata to events | ⚪ Not Started | Sonnet | ~30 | 1 modified |
| 4.3 Wire up MobileRenderer → Sequencer | ⚪ Not Started | Sonnet | ~60 | 1 modified |
| **Testing & Polish** |
| 5.1 Integration testing (3 directions) | ⚪ Not Started | Sonnet | - | - |
| 5.2 Animation timing refinement | ⚪ Not Started | Sonnet | - | - |
| 5.3 Glow persistence validation | ⚪ Not Started | Sonnet | - | - |
| 5.4 Performance testing | ⚪ Not Started | Haiku | - | - |

**Legend:** ⚪ Not Started | 🟡 In Progress | 🟢 Complete | 🔴 Blocked

**Total Estimated Changes:** ~1,750 lines across ~15 files

---

## 🎯 Executive Summary

### The Problem
- HandRenderer is a 717-line "God Object" handling rendering, selection, events, hints, and sorting
- Charleston animations are missing entirely (tiles just disappear/reappear)
- No architectural pattern for orchestrating complex multi-step animations
- Future animations (dealing, discarding, claiming) will face the same problems

### The Solution
**Refactor HandRenderer** into focused components (rendering, selection, events) and create **AnimationSequencer pattern** for orchestrating complex animation flows. Start with Charleston as proof-of-concept.

### Success Criteria
1. ✅ Beautiful Charleston animations (pass out → travel → receive with glow → slow sort)
2. ✅ HandRenderer reduced to <300 lines, single responsibility
3. ✅ Clear extension pattern for future animations
4. ✅ No regressions in existing game functionality
5. ✅ Maintainable, testable, documented code

---

## 🔍 Existing Code Audit

**Purpose:** Cross-reference proposed architecture with existing codebase to avoid duplicates and dead code.

### What Already Exists

#### ✅ HandRenderer (mobile/renderers/HandRenderer.js) - 717 lines
**Current Methods:**
- ✅ `render(handData)` - Renders hand tiles
- ✅ `renderExposures(exposures)` - Renders exposed tile sets
- ✅ `clearTiles()` - Clears all tiles
- ✅ `getTileElementByIndex(index)` - Get tile element
- ✅ `getLastTileElement()` - Get last tile
- ✅ `createTileButton(tileData, index, selectionKey)` - Creates tile DOM
- ✅ `setupDOM()` - Initializes containers
- ✅ `destroy()` - Cleanup

**Selection Methods (MOVE to HandSelectionManager):**
- ✅ `setSelectionBehavior(behavior)` - Lines 316-321
- ✅ `setSelectionListener(callback)` - Lines 323-325
- ✅ `selectTile(index, options)` - Lines 362-409
- ✅ `clearSelection(silent)` - Lines 426-439
- ✅ `getSelectedTileIndices()` - Lines 441-449
- ✅ `getSelectedTiles()` - Lines 451-471
- ✅ `getSelectionState()` - Lines 473-480
- ✅ `handleTileClick(index)` - Lines 327-360
- ✅ `_validateTileForMode(index, validationMode)` - Lines 678-714
- ✅ `getTileSelectionKey(tile, fallbackIndex)` - Lines 628-636
- ✅ `notifySelectionChange()` - Lines 501-505

**Event Handling (MOVE to HandEventCoordinator):**
- ✅ `setupEventListeners()` - Lines 76-155
  - Subscribes to: HAND_UPDATED, TILE_SELECTED, TILE_DRAWN, TILE_DISCARDED, HINT_DISCARD_RECOMMENDATIONS
- ✅ `applyHintRecommendations()` - Lines 411-424

**Helper Methods (KEEP in HandRenderer):**
- ✅ `sortHand(mode)` - Lines 507-550
- ✅ `setInteractive(enabled)` - Lines 552-557
- ✅ `cloneHandData(handData)` - Lines 638-659
- ✅ `toTileData(tile)` - Lines 661-669
- ✅ `formatTileText(tile)` - Lines 593-626
- ✅ `getSuitName(suit)` - Lines 582-584
- ✅ `getDataNumber(tile)` - Lines 586-591

**Properties:**
- ✅ `container` - DOM container
- ✅ `handContainer` - Hand tiles container
- ✅ `exposedSection` - Exposed tiles container
- ✅ `tiles` - Array of tile elements
- ✅ `selectedIndices` - Set of selected keys
- ✅ `selectionKeyByIndex` - Map of index → key
- ✅ `selectionBehavior` - Selection config
- ✅ `hintRecommendationKeys` - Set of hint keys
- ✅ `selectionListener` - Callback for selection changes
- ✅ `unsubscribeFns` - Event unsubscribe functions
- ✅ `interactive` - Boolean flag
- ✅ `currentHandData` - Current hand state
- ✅ `currentSortMode` - Sort mode tracking
- ✅ `newlyDrawnTileIndex` - Track drawn tile for glow

---

#### ✅ AnimationController (mobile/animations/AnimationController.js) - 510 lines
**Existing Animation Methods:**
- ✅ `animateTileDraw(tileElement, startPos, endPos)` - Lines 84-123
- ✅ `animateTileDiscard(tileElement, targetPos)` - Lines 131-171
- ✅ `animateTileClaim(tileElement, sourcePlayer, targetPos, targetContainer)` - Lines 181-224
- ✅ `animateTurnStart(playerElement)` - Lines 231-233
- ✅ `animateTurnEnd(playerElement)` - Lines 240-242
- ✅ `animateHandSort(handContainer)` - Lines 249-251
- ✅ `animateExposure(tileElements, targetPos)` - Lines 259-291
- ✅ `animateInvalidAction(element)` - Lines 298-300
- ✅ `applyReceivedTileGlow(element)` - Lines 309-314 ⭐ **Already exists!**
- ✅ `removeReceivedTileGlow(element)` - Lines 321-326
- ✅ `removeReceivedTileGlowFromAll(elements)` - Lines 333-335

**Helper Methods:**
- ✅ `_runSimpleAnimation(element, className, duration)` - Lines 345-370
- ✅ `_resetElementAnimation(element, classes)` - Lines 378-385
- ✅ `_setCssVariables(element, variables)` - Lines 393-404
- ✅ `_clearCssVariables(element, names)` - Lines 412-417
- ✅ `_applyAnimationClass(element, className)` - Lines 425-434
- ✅ `_scheduleTimer(element, duration, callback)` - Lines 443-452
- ✅ `_registerTimer(element, timerId)` - Lines 460-470
- ✅ `_deregisterTimer(element, timerId)` - Lines 478-490
- ✅ `_cancelTimers(element)` - Lines 497-507

**Properties:**
- ✅ `duration` - Default animation duration
- ✅ `easing` - Default easing function
- ✅ `prefersReducedMotion` - Accessibility flag
- ✅ `_elementTimers` - WeakMap for timer tracking

**Constants:**
- ✅ `TILE_ANIMATION_CLASSES` - Array of tile animation class names
- ✅ `TURN_ANIMATION_CLASSES` - Turn animation class names
- ✅ `DEFAULT_PULSE_DURATION` = 500ms
- ✅ `HAND_SORT_DURATION` = 400ms
- ✅ `TURN_START_DURATION` = 600ms
- ✅ `TURN_END_DURATION` = 300ms
- ✅ `INVALID_ACTION_DURATION` = 500ms
- ✅ `EXPOSURE_STAGGER` = 50ms

**✅ VERDICT:** AnimationController is solid! We don't need to replace it, just extend it with sequencers.

---

#### ✅ MobileRenderer (mobile/MobileRenderer.js) - 1,384 lines
**Event Handlers (Already exists):**
- ✅ `registerEventListeners()` - Lines 106-133
  - Subscribes to: STATE_CHANGED, GAME_STARTED, GAME_ENDED, HAND_UPDATED, TILE_DRAWN, TILE_DISCARDED, TURN_CHANGED, DISCARD_CLAIMED, TILES_EXPOSED, JOKER_SWAPPED, BLANK_EXCHANGED, MESSAGE
  - ✅ Subscribes to `CHARLESTON_PHASE` - Line 124 (just updates status)
  - ✅ Subscribes to `COURTESY_VOTE` - Line 127
  - ❌ **MISSING:** Subscription to `TILES_RECEIVED` event
  - ❌ **MISSING:** Subscription to `CHARLESTON_PASS` event for animation

**UI Prompt Handling:**
- ✅ `handleUIPrompt(data)` - Lines 962-1073
  - Handles: CHOOSE_DISCARD, CHARLESTON_PASS, CHARLESTON_CONTINUE, CLAIM, COURTESY_VOTE, COURTESY_PASS, JOKER_SWAP, BLANK_SWAP
  - ✅ `CHARLESTON_PASS` handled - Lines 981-993 (selection prompt, no animation)

**Other Methods:**
- ✅ `startTileSelectionPrompt(options)` - Lines 1075-1127
- ✅ `onHandUpdated(data)` - Lines 567-637 (includes `_findNewlyReceivedTiles` for courtesy)
- ✅ `_findNewlyReceivedTiles(previousHand, currentHand)` - Lines 646-690

**Properties:**
- ✅ `gameController` - GameController instance
- ✅ `handRenderer` - HandRenderer instance
- ✅ `animationController` - AnimationController instance ⭐ **Already injected!**
- ✅ `discardPile` - DiscardPile component
- ✅ `opponentBars` - OpponentBar components
- ✅ `subscriptions` - Array of unsubscribe functions

---

#### ✅ GameController Events (core/events/GameEvents.js)
**Existing Event Factories:**
- ✅ `createStateChangedEvent(oldState, newState)` - Line 21
- ✅ `createGameStartedEvent(players)` - Line 34
- ✅ `createTilesDealtEvent(sequence)` - Line 47
- ✅ `createTileDrawnEvent(player, tile, animation)` - Line 59
- ✅ `createTileDiscardedEvent(player, tile, animation)` - Line 80
- ✅ `createHandUpdatedEvent(player, hand)` - Line 117
- ✅ `createTurnChangedEvent(currentPlayer, previousPlayer)` - Line 130
- ✅ `createCharlestonPhaseEvent(phase, passCount, direction)` - Line 143 ⭐ **EXISTS!**
- ✅ `createCharlestonPassEvent(fromPlayer, toPlayer, direction, tiles, animation)` - Line 157 ⭐ **EXISTS!**
- ✅ `createCharlestonContinueQueryEvent(phase)` - Line 187
- ✅ `createCourtesyVoteEvent(player, vote)` - Line 199
- ✅ `createCourtesyPassEvent(fromPlayer, toPlayer, tiles, animation)` - Line 212
- ✅ `createSortHandEvent(player, sortType)` - Line 233
- ✅ `createTilesReceivedEvent(player, tiles, fromPlayer, animation)` - Line 246 ⭐ **EXISTS!**
- ✅ `createDiscardClaimedEvent(claimingPlayer, tile, claimType)` - Line 267
- ✅ `createTilesExposedEvent(player, exposureType, tiles, animation)` - Line 281
- ✅ `createMahjongEvent(winner, hand, animation)` - Line 302
- ✅ `createGameEndedEvent(reason, winner, mahjong)` - Line 321
- ✅ `createMessageEvent(text, type)` - Line 335
- ✅ `createUIPromptEvent(promptType, options, callback)` - Line 348

**⭐ IMPORTANT:** `TILES_RECEIVED` event already exists with animation metadata!

---

### What We Need to Create

#### ❌ HandSelectionManager (NEW - ~200 lines)
**Responsibility:** Extract selection logic from HandRenderer

**Methods to Extract:**
- `setSelectionBehavior(behavior)` ← from HandRenderer:316-321
- `setSelectionListener(callback)` ← from HandRenderer:323-325
- `selectTile(index, options)` ← from HandRenderer:362-409
- `clearSelection(silent)` ← from HandRenderer:426-439
- `getSelectedTileIndices()` ← from HandRenderer:441-449
- `getSelectedTiles(handData)` ← from HandRenderer:451-471 (need handData param)
- `getSelectionState()` ← from HandRenderer:473-480
- `isSelected(index)` ← NEW helper
- `canSelectTile(tile, mode)` ← from HandRenderer:_validateTileForMode:678-714 (refactored)
- `validateSelection(count, rules)` ← NEW

**Properties to Extract:**
- `selectedIndices` ← from HandRenderer
- `selectionKeyByIndex` ← from HandRenderer
- `selectionBehavior` ← from HandRenderer
- `selectionListener` ← from HandRenderer

---

#### ❌ HandEventCoordinator (NEW - ~150 lines)
**Responsibility:** Extract event subscriptions from HandRenderer

**Methods to Extract:**
- `setupEventListeners()` ← from HandRenderer:76-155
- `onHandUpdated(data)` ← from HandRenderer event handler
- `onTileDrawn(data)` ← from HandRenderer event handler
- `onTileDiscarded(data)` ← from HandRenderer event handler
- `onTileSelected(data)` ← from HandRenderer event handler
- `onHintRecommendations(data)` ← from HandRenderer event handler
- `applyHintRecommendations()` ← from HandRenderer:411-424
- `destroy()` ← unsubscribe logic

**Properties to Extract:**
- `unsubscribeFns` ← from HandRenderer
- `hintRecommendationKeys` ← from HandRenderer
- `newlyDrawnTileIndex` ← from HandRenderer

**Dependencies:**
- Needs `gameController` reference
- Needs `handRenderer` reference
- Needs `selectionManager` reference

---

#### ❌ AnimationSequencer (NEW Base Class - ~150 lines)
**Responsibility:** Base class for orchestrating multi-step animations

**Methods:**
```javascript
async executeSequence(steps)  // Run sequence of animation functions
async delay(ms)                // Promise-based delay
isRunning()                    // Check if animation in progress
cancel()                       // Cancel running animation
getTileElements(indices)       // Get tile elements from HandRenderer
calculateDirection(from, to)   // Calculate direction vector
async onSequenceStart()        // Hook (override in subclass)
async onSequenceComplete()     // Hook (override in subclass)
async onSequenceError(error)   // Hook (override in subclass)
```

**Properties:**
```javascript
gameController          // GameController reference
handRenderer           // HandRenderer reference
animationController    // AnimationController reference
isAnimating           // Boolean flag
currentSequence       // Current sequence data
```

---

#### ❌ CharlestonAnimationSequencer (NEW - ~300 lines)
**Responsibility:** Charleston-specific animation orchestration

**Methods:**
```javascript
async animateCharlestonPass(data)           // Main entry point
async animateTilesLeaving(tiles, direction) // Exit animation
async animateTilesArriving(tiles, direction) // Enter animation
async applyGlowToTiles(tileIndices)        // Add blue glow
async animateSortWithGlow(handData, glowIndices) // FLIP sort
getDirectionVector(direction)               // "right" → {x, y}
calculateExitPoint(tile, direction)         // Calculate exit coords
calculateEntryPoint(tile, direction)        // Calculate entry coords
```

**Extends:** AnimationSequencer

**Subscribes to Events:**
- `CHARLESTON_PASS` (from GameController)
- `TILES_RECEIVED` (from GameController)

---

### What We Need to Modify

#### 🔧 HandRenderer (REFACTOR - 717 → ~250 lines)
**Remove:**
- All selection methods → HandSelectionManager
- All event subscription logic → HandEventCoordinator
- Selection-related properties

**Keep:**
- DOM creation and rendering
- Layout helpers
- Sorting logic (sortHand)
- Utility methods (formatTileText, etc.)

**Add:**
```javascript
renderWithGlow(handData, glowIndices)     // NEW: Render with specific tiles glowing
getTileElementsByIndices(indices)         // NEW: Get multiple tile elements
hideTemporarily(indices)                  // NEW: For animation coordination
showWithAnimation(indices, animationClass) // NEW: Show with CSS animation
```

---

#### 🔧 MobileRenderer (ADD ~80 lines)
**Add Event Subscriptions:**
```javascript
// In registerEventListeners()
gc.on("CHARLESTON_PASS", (data) => this.onCharlestonPass(data));
gc.on("TILES_RECEIVED", (data) => this.onTilesReceived(data));
```

**Add Methods:**
```javascript
onCharlestonPass(data) {
  // Route to CharlestonAnimationSequencer
  this.charlestonSequencer.animateCharlestonPass(data);
}

onTilesReceived(data) {
  // Route to CharlestonAnimationSequencer
  if (data.context === "charleston") {
    this.charlestonSequencer.handleTilesReceived(data);
  }
}
```

**Add Property:**
```javascript
this.charlestonSequencer = new CharlestonAnimationSequencer(
  this.gameController,
  this.handRenderer,
  this.animationController
);
```

---

#### 🔧 GameController (MODIFY ~50 lines)
**Current Charleston Code (core/GameController.js:338-495):**
- ✅ Emits `CHARLESTON_PHASE` event (Line 383)
- ❌ **MISSING:** Emit `CHARLESTON_PASS` event when tiles passed
- ❌ **MISSING:** Emit `TILES_RECEIVED` event when tiles received
- ❌ **MISSING:** Add animation metadata (exitVector, entryVector, direction)

**Need to Add:**
```javascript
// After collecting tiles from player (around line 407)
const passEvent = GameEvents.createCharlestonPassEvent(
  playerIndex,
  recipientIndex,
  directionName,
  tilesToPass,
  {
    exitVector: calculateExitVector(directionName),
    duration: 600,
    easing: "ease-in-out"
  }
);
this.emit("CHARLESTON_PASS", passEvent);

// After distributing received tiles (around line 450)
const receiveEvent = GameEvents.createTilesReceivedEvent(
  playerIndex,
  receivedTiles,
  senderIndex,
  {
    entryVector: calculateEntryVector(directionName),
    duration: 600,
    glow: { persist: true, color: 0x1e90ff }
  }
);
this.emit("TILES_RECEIVED", receiveEvent);
```

---

#### 🔧 CSS Animations (ADD ~100 lines to animations.css)
**New Keyframes:**
```css
@keyframes charleston-pass-out { ... }
.tile-charleston-leaving { ... }

@keyframes charleston-receive { ... }
.tile-charleston-arriving { ... }

.tile-sorting { transition: transform 800ms cubic-bezier(...); }
```

**Already Exists:**
- `.tile--newly-drawn` with blue glow animation ✅

---

### Summary

| Component | Status | Action | Lines |
|-----------|--------|--------|-------|
| HandRenderer | ✅ Exists | Refactor (slim down) | 717 → 250 |
| HandSelectionManager | ❌ Missing | Create (extract from HandRenderer) | +200 |
| HandEventCoordinator | ❌ Missing | Create (extract from HandRenderer) | +150 |
| AnimationController | ✅ Exists | **Keep as-is** ✅ | 510 |
| AnimationSequencer | ❌ Missing | Create (base class) | +150 |
| CharlestonAnimationSequencer | ❌ Missing | Create | +300 |
| MobileRenderer | ✅ Exists | Modify (add event handlers) | +80 |
| GameController | ✅ Exists | Modify (emit events) | +50 |
| GameEvents.js | ✅ Exists | **Already has events!** ✅ | 0 |
| animations.css | ✅ Exists | Add keyframes | +100 |

**Total New Code:** ~980 lines
**Total Refactored:** ~467 lines (HandRenderer split)
**Total Modified:** ~130 lines (MobileRenderer + GameController)
**Net Change:** ~1,110 lines

**✅ Good News:**
- AnimationController is solid - no changes needed!
- Events already exist - just need to emit them!
- Blue glow CSS already exists!

**🔧 Main Work:**
1. Split HandRenderer into 3 files
2. Create 2 new sequencer classes
3. Wire up event emissions in GameController
4. Add CSS keyframes for Charleston animations

---

## 🏗️ Architecture Overview

### Current Architecture (Mobile)

```
┌─────────────────────────────────────────────────────────┐
│                   MobileRenderer                         │
│  - Listens to GameController events                      │
│  - Coordinates UI updates                                │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌────────────────────┐
│  HandRenderer    │    │  DiscardPile       │
│  (717 lines!)    │    │  OpponentBar       │
│                  │    │  etc.              │
│  - DOM creation  │    └────────────────────┘
│  - Selection     │
│  - Event listen  │
│  - Hints         │
│  - Sorting       │
│  - Validation    │
└──────────────────┘
```

### Proposed Architecture (Mobile)

```
┌─────────────────────────────────────────────────────────────────┐
│                        MobileRenderer                            │
│  - Coordinates components (orchestrator pattern)                 │
│  - Listens to high-level GameController events                   │
└────────────┬────────────────────────────────────────────────────┘
             │
   ┌─────────┼─────────────────────────────────┐
   │         │                                 │
   ▼         ▼                                 ▼
┌─────────────────┐  ┌──────────────────────────────────────┐
│  HandRenderer   │  │   Animation Orchestration Layer       │
│  (~250 lines)   │  │                                       │
│                 │  │  ┌────────────────────────────────┐  │
│  - DOM creation │◄─┤  │  CharlestonAnimationSequencer  │  │
│  - Rendering    │  │  │  - Pass out animation          │  │
│  - Layout       │  │  │  - Receive animation           │  │
└────┬────────────┘  │  │  - Glow application            │  │
     │               │  │  - Sort animation              │  │
     │ uses          │  └────────────────────────────────┘  │
     │               │                                       │
     ▼               │  ┌────────────────────────────────┐  │
┌─────────────────┐  │  │  AnimationSequencer (base)    │  │
│  HandSelection  │  │  │  - Timing coordination        │  │
│  Manager        │  │  │  - Promise-based flow         │  │
│  (~200 lines)   │  │  │  - State tracking             │  │
│                 │  │  └────────────────────────────────┘  │
│  - Selection    │  │               ▲                      │
│  - Validation   │  │               │ extends              │
│  - Behavior     │  │  Future: DealingAnimationSequencer   │
└────┬────────────┘  │          DiscardAnimationSequencer   │
     │               │          ClaimAnimationSequencer     │
     ▼               └──────────────────────────────────────┘
┌─────────────────┐                  │
│  HandEvent      │                  │ uses
│  Coordinator    │                  ▼
│  (~150 lines)   │       ┌─────────────────────┐
│                 │       │ AnimationController │
│  - Event subs   │       │ (existing)          │
│  - Callbacks    │       │ - CSS primitives    │
│  - Hints        │       │ - Timing helpers    │
└─────────────────┘       └─────────────────────┘
```

### Key Architectural Decisions

1. **Separation of Concerns**: Each component has ONE job
   - HandRenderer: DOM creation and layout
   - HandSelectionManager: Selection state and rules
   - HandEventCoordinator: Event subscriptions and routing
   - CharlestonAnimationSequencer: Complex animation orchestration

2. **Orchestrator Pattern**: AnimationSequencer coordinates multiple animations
   - Promise-based flow control
   - State machine for animation sequences
   - Delegates primitive animations to AnimationController

3. **Event-Driven**: Components communicate through events
   - GameController emits rich events with animation metadata
   - MobileRenderer routes to appropriate sequencer
   - Sequencer commands HandRenderer (one-way flow)

4. **Extensibility**: Pattern scales to future animations
   - Base AnimationSequencer class provides common functionality
   - New sequencers inherit and implement specific flows
   - Same HandRenderer used by all sequencers

---

## 📐 Component Design Specifications

### 1. HandRenderer (Refactored)

**File:** `mobile/renderers/HandRenderer.js`
**Size:** ~250 lines (down from 717)
**Responsibility:** DOM creation, rendering, and layout

#### Interface
```javascript
class HandRenderer {
  constructor(container, gameController) { }

  // Core rendering
  render(handData) { }
  renderExposures(exposures) { }
  clearTiles() { }

  // Layout helpers
  getTileElementByIndex(index) { }
  getLastTileElement() { }

  // Animation support (NEW)
  renderWithGlow(handData, glowIndices) { }
  getTileElementsByIndices(indices) { }
  hideTemporarily(indices) { } // For animation coordination
  showWithAnimation(indices, animationClass) { }

  // Lifecycle
  destroy() { }
}
```

#### What It Does
- Creates tile DOM elements with sprites
- Manages hand-container and exposed-section
- Applies CSS classes for visual states
- Provides accessors for animation targets
- **Does NOT** handle selection, events, or logic

#### What It Does NOT Do
- ❌ Selection management (moved to HandSelectionManager)
- ❌ Event subscriptions (moved to HandEventCoordinator)
- ❌ Hint logic (moved to HandEventCoordinator)
- ❌ Animation orchestration (handled by sequencers)

---

### 2. HandSelectionManager (NEW)

**File:** `mobile/renderers/HandSelectionManager.js`
**Size:** ~200 lines
**Responsibility:** Tile selection state and validation

#### Interface
```javascript
class HandSelectionManager {
  constructor() { }

  // Configuration
  setSelectionBehavior(behavior) { }
  setValidationMode(mode) { } // charleston, courtesy, play, blank-only
  setSelectionListener(callback) { }

  // Selection operations
  selectTile(index, options) { }
  clearSelection(silent) { }
  getSelectedTileIndices() { }
  getSelectedTiles(handData) { }
  isSelected(index) { }

  // Validation
  canSelectTile(tile, mode) { }
  validateSelection(count, rules) { }

  // State
  getSelectionState() { } // {count, indices, tiles}
}
```

#### What It Does
- Tracks selected tile indices (Set-based)
- Validates selection rules (max count, tile types)
- Enforces validation modes (charleston = no jokers)
- Notifies listeners on selection changes
- Pure state management (no DOM manipulation)

---

### 3. HandEventCoordinator (NEW)

**File:** `mobile/renderers/HandEventCoordinator.js`
**Size:** ~150 lines
**Responsibility:** Event subscriptions and routing

#### Interface
```javascript
class HandEventCoordinator {
  constructor(gameController, handRenderer, selectionManager) { }

  // Setup
  setupEventListeners() { }

  // Event handlers
  onHandUpdated(data) { }
  onTileDrawn(data) { }
  onTileDiscarded(data) { }
  onTileSelected(data) { }
  onHintRecommendations(data) { }

  // Cleanup
  destroy() { }
}
```

#### What It Does
- Subscribes to GameController events
- Routes events to appropriate handlers
- Coordinates between HandRenderer and HandSelectionManager
- Manages hint system (glow/highlight tiles)
- Tracks newly drawn tiles for blue glow
- Cleans up subscriptions on destroy

---

### 4. AnimationSequencer (Base Class - NEW)

**File:** `mobile/animations/AnimationSequencer.js`
**Size:** ~150 lines
**Responsibility:** Base class for complex animation flows

#### Interface
```javascript
class AnimationSequencer {
  constructor(gameController, handRenderer, animationController) { }

  // Core flow control
  async executeSequence(steps) { }
  async delay(ms) { }

  // State management
  isRunning() { }
  cancel() { }

  // Helpers
  getTileElements(indices) { }
  calculateDirection(from, to) { }

  // Hooks (override in subclasses)
  async onSequenceStart() { }
  async onSequenceComplete() { }
  async onSequenceError(error) { }
}
```

#### What It Does
- Provides promise-based animation flow
- Manages animation state (running, cancelled)
- Offers timing and coordination helpers
- Delegates primitive animations to AnimationController
- Base class for specific sequencers (Charleston, Dealing, etc.)

---

### 5. CharlestonAnimationSequencer (NEW)

**File:** `mobile/animations/CharlestonAnimationSequencer.js`
**Size:** ~300 lines
**Responsibility:** Charleston pass/receive animation orchestration

#### Interface
```javascript
class CharlestonAnimationSequencer extends AnimationSequencer {
  constructor(gameController, handRenderer, animationController) { }

  // Main flow
  async animateCharlestonPass(data) { }

  // Sub-sequences
  async animateTilesLeaving(tiles, direction) { }
  async animateTilesArriving(tiles, direction) { }
  async applyGlowToTiles(tileIndices) { }
  async animateSortWithGlow(handData, glowIndices) { }

  // Utilities
  getDirectionVector(direction) { } // "left" → {x: -200, y: -100}
  calculateExitPoint(tile, direction) { }
  calculateEntryPoint(tile, direction) { }
}
```

#### Animation Flow
```
1. User confirms pass (3 tiles selected)
   ↓
2. animateTilesLeaving(selectedTiles, direction)
   - Get exit coordinates based on direction
   - Animate tiles sliding out with rotation
   - Duration: 600ms
   ↓
3. delay(300ms) // Travel time
   ↓
4. GameController updates hand (removes passed, adds received)
   ↓
5. animateTilesArriving(receivedTiles, oppositeDirection)
   - Calculate entry points (opposite of exit)
   - Animate tiles sliding in
   - Duration: 600ms
   ↓
6. applyGlowToTiles(receivedTileIndices)
   - Add blue glow CSS class
   - Glow persists during sort
   ↓
7. animateSortWithGlow(newHandData, glowIndices)
   - Capture FLIP positions (First/Last/Invert/Play)
   - Sort hand by suit
   - Animate tiles moving to new positions
   - Retain glow on received tiles
   - Duration: 800ms (slower for clarity)
   ↓
8. Complete (glow remains until next action)
```

#### Direction Vectors
```javascript
const DIRECTION_VECTORS = {
  "right":   { exit: { x:  300, y: -100 }, entry: { x: -300, y:  100 } },
  "across":  { exit: { x:    0, y: -300 }, entry: { x:    0, y:  300 } },
  "left":    { exit: { x: -300, y: -100 }, entry: { x:  300, y:  100 } }
};
```

---

## 📡 Event Schema Updates

### TILES_RECEIVED Event (Enhanced)

**Current:** Exists but not fully utilized
**Location:** `core/events/GameEvents.js:246`

**Enhanced Schema:**
```javascript
{
  type: "TILES_RECEIVED",
  player: 0,                    // Receiving player index
  fromPlayer: 2,                // Sending player index
  tiles: [...],                 // Array of TileData objects
  context: "charleston",        // "charleston", "courtesy", "exposure"
  direction: "across",          // "left", "right", "across" (Charleston only)
  animation: {
    type: "receive-tiles",
    duration: 600,
    easing: "ease-out",
    entryVector: { x: 0, y: 300 },  // NEW: Where tiles come from
    glow: { color: 0x1e90ff, alpha: 0.7, persist: true }  // NEW: Glow config
  },
  timestamp: Date.now()
}
```

### CHARLESTON_PASS Event (Enhanced)

**Current:** Exists, basic info
**Location:** Emitted in `core/GameController.js`

**Enhanced Schema:**
```javascript
{
  type: "CHARLESTON_PASS",
  player: 0,
  tiles: [...],                 // Tiles being passed
  direction: "right",           // "left", "right", "across"
  phase: 1,                     // 1 or 2
  round: 2,                     // 1, 2, or 3
  animation: {
    exitVector: { x: 300, y: -100 },  // NEW: Where tiles exit to
    duration: 600,
    easing: "ease-in-out"
  },
  timestamp: Date.now()
}
```

### HAND_UPDATED Event (Coordination Flag)

**Add flag to suppress auto-render during animation:**
```javascript
{
  type: "HAND_UPDATED",
  player: 0,
  hand: {...},
  suppressRender: true,  // NEW: Let sequencer handle rendering
  timestamp: Date.now()
}
```

---

## 🎬 Animation Implementation Details

### CSS Animations (New)

**File:** `mobile/styles/animations.css`
**Add:**

```css
/* Charleston Pass Out Animation */
@keyframes charleston-pass-out {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
  30% {
    transform: translate3d(
      calc(var(--exit-x, 0) * 0.3),
      calc(var(--exit-y, 0) * 0.3),
      0
    ) rotate(5deg) scale(1.05);
    opacity: 0.9;
  }
  100% {
    transform: translate3d(var(--exit-x, 0), var(--exit-y, 0), 0)
               rotate(15deg) scale(0.5);
    opacity: 0;
  }
}

.tile-charleston-leaving {
  animation: charleston-pass-out 600ms ease-in-out forwards;
  will-change: transform, opacity;
}

/* Charleston Receive Animation */
@keyframes charleston-receive {
  0% {
    transform: translate3d(var(--entry-x, 0), var(--entry-y, 0), 0)
               rotate(-15deg) scale(0.5);
    opacity: 0;
  }
  60% {
    transform: translate3d(
      calc(var(--entry-x, 0) * 0.2),
      calc(var(--entry-y, 0) * 0.2),
      0
    ) rotate(-5deg) scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
}

.tile-charleston-arriving {
  animation: charleston-receive 600ms ease-out forwards;
  will-change: transform, opacity;
}

/* Slow Sort Animation (FLIP technique) */
.tile-sorting {
  transition: transform 800ms cubic-bezier(0.4, 0.0, 0.2, 1);
  will-change: transform;
}
```

### FLIP Sort Implementation

**FLIP = First, Last, Invert, Play**

```javascript
async animateSortWithGlow(handData, glowIndices) {
  // 1. FIRST: Capture current positions
  const firstPositions = this.tiles.map(tile => ({
    x: tile.offsetLeft,
    y: tile.offsetTop
  }));

  // 2. Sort the hand data (instant DOM update)
  handData.sortBySuit();
  this.handRenderer.render(handData);

  // 3. LAST: Capture new positions
  const lastPositions = this.tiles.map(tile => ({
    x: tile.offsetLeft,
    y: tile.offsetTop
  }));

  // 4. INVERT: Calculate deltas and apply as transform
  this.tiles.forEach((tile, i) => {
    const deltaX = firstPositions[i].x - lastPositions[i].x;
    const deltaY = firstPositions[i].y - lastPositions[i].y;
    tile.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    tile.style.transition = 'none';

    // Retain glow during sort
    if (glowIndices.has(i)) {
      tile.classList.add('tile--newly-drawn');
    }
  });

  // Force reflow
  document.body.offsetHeight;

  // 5. PLAY: Transition back to natural position
  this.tiles.forEach(tile => {
    tile.style.transition = 'transform 800ms cubic-bezier(0.4, 0.0, 0.2, 1)';
    tile.style.transform = '';
  });

  // Wait for animation
  await this.delay(800);

  // Cleanup
  this.tiles.forEach(tile => {
    tile.style.transition = '';
  });
}
```

---

## 🔄 Data Flow Diagrams

### Charleston Pass Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTION                              │
│  User selects 3 tiles → Clicks "Pass Tiles" button              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GAME CONTROLLER                             │
│  - Validates selection                                           │
│  - Removes tiles from hand                                       │
│  - Emits CHARLESTON_PASS event (with exitVector)                │
│  - Stores tiles for exchange                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE RENDERER                             │
│  - Listens to CHARLESTON_PASS                                   │
│  - Routes to CharlestonAnimationSequencer                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CHARLESTON ANIMATION SEQUENCER                      │
│                                                                  │
│  Step 1: animateTilesLeaving()                                  │
│    - Get tile elements from HandRenderer                        │
│    - Calculate exit coordinates                                 │
│    - Apply .tile-charleston-leaving class                       │
│    - Wait 600ms                                                 │
│                                                                  │
│  Step 2: delay(300ms) // Travel time                            │
│                                                                  │
│  [Meanwhile: GameController exchanges tiles with other players] │
│  [GameController adds received tiles to hand]                   │
│  [GameController emits TILES_RECEIVED event]                    │
│                                                                  │
│  Step 3: animateTilesArriving()                                 │
│    - Listen for TILES_RECEIVED event                            │
│    - Calculate entry coordinates (opposite of exit)             │
│    - Create tile elements (via HandRenderer)                    │
│    - Apply .tile-charleston-arriving class                      │
│    - Wait 600ms                                                 │
│                                                                  │
│  Step 4: applyGlowToTiles()                                     │
│    - Add .tile--newly-drawn class to received tiles             │
│                                                                  │
│  Step 5: animateSortWithGlow()                                  │
│    - Capture current positions (FLIP)                           │
│    - Sort hand by suit                                          │
│    - Render sorted hand                                         │
│    - Animate to new positions (retain glow)                     │
│    - Wait 800ms                                                 │
│                                                                  │
│  Complete: Glow persists until next discard                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Unit Tests

**HandSelectionManager.test.js**
- Selection rules enforcement
- Validation mode behavior
- State consistency

**HandEventCoordinator.test.js**
- Event routing correctness
- Cleanup on destroy
- Hint system integration

**CharlestonAnimationSequencer.test.js**
- Direction vector calculations
- Sequence flow control
- Error handling

### Integration Tests

**Charleston Flow Tests (Playwright)**
```javascript
test("Charleston pass animates tiles correctly", async ({ page }) => {
  // 1. Start game
  // 2. Select 3 tiles
  // 3. Click "Pass Right"
  // 4. Verify tiles animate out (wait for .tile-charleston-leaving)
  // 5. Wait for received tiles (wait for .tile-charleston-arriving)
  // 6. Verify blue glow applied (.tile--newly-drawn)
  // 7. Verify sort animation completes
  // 8. Verify glow persists
});

test("Charleston all three directions", async ({ page }) => {
  // Test: right, across, left
});

test("Charleston Phase 1 → Phase 2 transition", async ({ page }) => {
  // Verify animations work across phase boundary
});
```

### Visual Regression Tests

- Screenshot comparison before/after animations
- Verify glow color consistency
- Check timing feels "natural"

---

## 📝 Phase 1A: Detailed Execution Guide

**Context:** This section provides step-by-step instructions for Phase 1A that can be executed independently. Each task is self-contained with file paths, line numbers, and acceptance criteria.

---

### Task 1A.1: Create HandSelectionManager.js

**Owner:** Haiku
**Estimated Time:** 4 hours
**File:** `mobile/renderers/HandSelectionManager.js` (NEW)

**Purpose:** Extract all selection logic from HandRenderer into a dedicated manager.

**Step-by-Step Instructions:**

1. **Create new file:** `mobile/renderers/HandSelectionManager.js`

2. **Copy these methods from HandRenderer.js:**
   - `setSelectionBehavior()` (lines 316-321)
   - `setSelectionListener()` (lines 323-325)
   - `selectTile()` (lines 362-409)
   - `clearSelection()` (lines 426-439)
   - `getSelectedTileIndices()` (lines 441-449)
   - `getSelectedTiles()` (lines 451-471) - **MODIFY:** Add `handData` parameter
   - `getSelectionState()` (lines 473-480)
   - `handleTileClick()` (lines 327-360)
   - `_validateTileForMode()` (lines 678-714) - **RENAME:** to `canSelectTile()`
   - `getTileSelectionKey()` (lines 628-636)
   - `notifySelectionChange()` (lines 501-505)

3. **Copy these properties from HandRenderer constructor:**
   - `selectedIndices` (Set)
   - `selectionKeyByIndex` (Map)
   - `selectionBehavior` (object)
   - `selectionListener` (function)

4. **Refactor dependencies:**
   - `getSelectedTiles()` needs `handData` passed in (not stored internally)
   - `handleTileClick()` needs tile data passed in (not accessed via `this.currentHandData`)

5. **Add new helper methods:**
   ```javascript
   isSelected(index) {
     const key = this.selectionKeyByIndex.get(index);
     return this.selectedIndices.has(key);
   }

   validateSelection(count, rules) {
     // Validate selection meets requirements
     return {
       valid: this.selectedIndices.size === count,
       message: this.selectedIndices.size < count ?
         `Select ${count - this.selectedIndices.size} more` :
         `Select only ${count}`
     };
   }
   ```

6. **Class structure:**
   ```javascript
   export class HandSelectionManager {
     constructor() {
       this.selectedIndices = new Set();
       this.selectionKeyByIndex = new Map();
       this.selectionBehavior = {
         mode: "multiple",
         maxSelectable: Infinity,
         allowToggle: true
       };
       this.selectionListener = null;
     }

     // Methods here...
   }
   ```

**Acceptance Criteria:**
- [ ] File exports `HandSelectionManager` class
- [ ] All 11 methods extracted correctly
- [ ] All 4 properties initialized in constructor
- [ ] No external dependencies (pure logic class)
- [ ] ESLint passes
- [ ] Can be imported without errors

---

### Task 1A.2: Create HandEventCoordinator.js

**Owner:** Haiku
**Estimated Time:** 3 hours
**File:** `mobile/renderers/HandEventCoordinator.js` (NEW)

**Purpose:** Extract all event subscriptions from HandRenderer into a coordinator.

**Step-by-Step Instructions:**

1. **Create new file:** `mobile/renderers/HandEventCoordinator.js`

2. **Copy event handler logic from HandRenderer.setupEventListeners():**
   - `handleHandUpdated` (lines 82-91)
   - `handleTileSelected` (lines 94-115)
   - `handleTileDrawn` (lines 118-124)
   - `handleTileDiscarded` (lines 127-138)
   - `handleHintRecommendations` (lines 141-155)

3. **Copy these methods:**
   - `applyHintRecommendations()` (lines 411-424)

4. **Copy these properties from HandRenderer:**
   - `unsubscribeFns` (array)
   - `hintRecommendationKeys` (Set)
   - `newlyDrawnTileIndex` (number)

5. **Class structure:**
   ```javascript
   export class HandEventCoordinator {
     constructor(gameController, handRenderer, selectionManager) {
       this.gameController = gameController;
       this.handRenderer = handRenderer;
       this.selectionManager = selectionManager;
       this.unsubscribeFns = [];
       this.hintRecommendationKeys = new Set();
       this.newlyDrawnTileIndex = null;

       this.setupEventListeners();
     }

     setupEventListeners() {
       const gc = this.gameController;

       this.unsubscribeFns.push(
         gc.on("HAND_UPDATED", (data) => this.onHandUpdated(data))
       );
       // ... other subscriptions
     }

     onHandUpdated(data) {
       if (data.player === 0) {
         const handData = HandData.fromJSON(data.hand);
         this.handRenderer.render(handData);
       }
     }

     // ... other handlers

     destroy() {
       this.unsubscribeFns.forEach(unsub => unsub());
       this.unsubscribeFns = [];
     }
   }
   ```

**Dependencies:**
- Import `HandData` from `../../core/models/HandData.js`

**Acceptance Criteria:**
- [ ] File exports `HandEventCoordinator` class
- [ ] Subscribes to 5 events (HAND_UPDATED, TILE_SELECTED, TILE_DRAWN, TILE_DISCARDED, HINT_DISCARD_RECOMMENDATIONS)
- [ ] Routes events to HandRenderer and SelectionManager
- [ ] `destroy()` method cleans up subscriptions
- [ ] ESLint passes
- [ ] Can be imported without errors

---

### Task 1A.3: Refactor HandRenderer.js

**Owner:** Haiku
**Estimated Time:** 6 hours
**File:** `mobile/renderers/HandRenderer.js` (MODIFY)

**Purpose:** Slim down HandRenderer by removing extracted logic and adding new interfaces.

**Step-by-Step Instructions:**

1. **Remove selection methods** (delete these):
   - Lines 316-321: `setSelectionBehavior()`
   - Lines 323-325: `setSelectionListener()`
   - Lines 327-360: `handleTileClick()`
   - Lines 362-409: `selectTile()`
   - Lines 411-424: `applyHintRecommendations()`
   - Lines 426-439: `clearSelection()`
   - Lines 441-449: `getSelectedTileIndices()`
   - Lines 451-471: `getSelectedTiles()`
   - Lines 473-480: `getSelectionState()`
   - Lines 501-505: `notifySelectionChange()`
   - Lines 628-636: `getTileSelectionKey()`
   - Lines 678-714: `_validateTileForMode()`

2. **Remove event subscription logic:**
   - Lines 76-155: Delete `setupEventListeners()` method
   - Remove from constructor (lines 52-53):
     ```javascript
     this.unsubscribeFns = [];
     this.setupEventListeners(); // DELETE THIS LINE
     ```

3. **Remove properties from constructor:**
   - `selectedIndices`
   - `selectionKeyByIndex`
   - `selectionBehavior`
   - `hintRecommendationKeys`
   - `selectionListener`
   - `unsubscribeFns`
   - `newlyDrawnTileIndex`

4. **Add new properties to constructor:**
   ```javascript
   this.selectionManager = null; // Will be injected
   this.eventCoordinator = null; // Will be injected
   ```

5. **Modify constructor signature:**
   ```javascript
   constructor(container) {
     // Remove gameController parameter
     // Will be set via dependency injection instead
   }
   ```

6. **Add dependency injection methods:**
   ```javascript
   setSelectionManager(selectionManager) {
     this.selectionManager = selectionManager;
   }

   setEventCoordinator(eventCoordinator) {
     this.eventCoordinator = eventCoordinator;
   }
   ```

7. **Add new animation helper methods:**
   ```javascript
   renderWithGlow(handData, glowIndices) {
     // Same as render(), but apply glow to specific indices
     this.render(handData);
     glowIndices.forEach(index => {
       const tileEl = this.tiles[index];
       if (tileEl) {
         tileEl.classList.add('tile--newly-drawn');
       }
     });
   }

   getTileElementsByIndices(indices) {
     return indices.map(idx => this.tiles[idx]).filter(Boolean);
   }

   hideTemporarily(indices) {
     indices.forEach(idx => {
       const tile = this.tiles[idx];
       if (tile) {
         tile.style.visibility = 'hidden';
       }
     });
   }

   showWithAnimation(indices, animationClass) {
     indices.forEach(idx => {
       const tile = this.tiles[idx];
       if (tile) {
         tile.style.visibility = 'visible';
         tile.classList.add(animationClass);
       }
     });
   }
   ```

8. **Update createTileButton() to use selectionManager:**
   ```javascript
   createTileButton(tileData, index, selectionKey) {
     // ... existing code ...

     const clickHandler = (event) => {
       event.preventDefault();
       event.stopPropagation();
       if (!this.interactive) return;

       // Route to selectionManager instead of handleTileClick
       if (this.selectionManager) {
         this.selectionManager.handleTileClick(index);
       }
     };

     // ... rest of method
   }
   ```

9. **Update render() to use selectionManager:**
   ```javascript
   render(handData) {
     // ... existing code ...

     tiles.forEach((tileData, index) => {
       // ... existing code ...

       // Check selection via selectionManager
       if (this.selectionManager?.isSelected(index)) {
         tileButton.classList.add("selected");
       }

       // Apply glow via eventCoordinator
       if (this.eventCoordinator?.newlyDrawnTileIndex === tileData.index) {
         tileButton.classList.add("tile--newly-drawn");
       }

       // ... rest of method
     });
   }
   ```

10. **Update destroy() method:**
    ```javascript
    destroy() {
      // Remove event coordinator cleanup (now external)
      // Keep: clearTiles(), DOM cleanup
      this.clearTiles();

      if (this.exposedSection) {
        this.exposedSection.innerHTML = "";
      }

      this.container = null;
      this.handContainer = null;
      this.exposedSection = null;
      this.currentHandData = null;
      this.selectionManager = null;
      this.eventCoordinator = null;
    }
    ```

**Acceptance Criteria:**
- [ ] File reduced from 717 to ~250-300 lines
- [ ] All selection logic removed
- [ ] All event subscription logic removed
- [ ] 4 new animation helper methods added
- [ ] Dependency injection pattern implemented
- [ ] ESLint passes
- [ ] No compilation errors

---

### Task 1A.4: Create AnimationSequencer.js Base Class

**Owner:** Sonnet
**Estimated Time:** 3 hours
**File:** `mobile/animations/AnimationSequencer.js` (NEW)

**Purpose:** Create base class for orchestrating complex multi-step animations.

**Step-by-Step Instructions:**

1. **Create new file:** `mobile/animations/AnimationSequencer.js`

2. **Implement base class:**
   ```javascript
   export class AnimationSequencer {
     constructor(gameController, handRenderer, animationController) {
       this.gameController = gameController;
       this.handRenderer = handRenderer;
       this.animationController = animationController;
       this.isAnimating = false;
       this.currentSequence = null;
       this.cancelRequested = false;
     }

     async executeSequence(steps) {
       if (this.isAnimating) {
         console.warn("Animation already in progress");
         return;
       }

       this.isAnimating = true;
       this.cancelRequested = false;

       try {
         await this.onSequenceStart();

         for (const step of steps) {
           if (this.cancelRequested) break;
           await step();
         }

         await this.onSequenceComplete();
       } catch (error) {
         await this.onSequenceError(error);
       } finally {
         this.isAnimating = false;
         this.currentSequence = null;
       }
     }

     async delay(ms) {
       return new Promise(resolve => setTimeout(resolve, ms));
     }

     isRunning() {
       return this.isAnimating;
     }

     cancel() {
       this.cancelRequested = true;
     }

     getTileElements(indices) {
       return this.handRenderer.getTileElementsByIndices(indices);
     }

     calculateDirection(from, to) {
       return {
         dx: to.x - from.x,
         dy: to.y - from.y,
         distance: Math.sqrt(
           Math.pow(to.x - from.x, 2) +
           Math.pow(to.y - from.y, 2)
         )
       };
     }

     // Hooks for subclasses to override
     async onSequenceStart() {
       // Override in subclass
     }

     async onSequenceComplete() {
       // Override in subclass
     }

     async onSequenceError(error) {
       console.error("Animation sequence error:", error);
     }
   }
   ```

**Acceptance Criteria:**
- [ ] File exports `AnimationSequencer` class
- [ ] Promise-based animation flow
- [ ] Cancellation support
- [ ] Helper methods for common tasks
- [ ] Extensible via hooks
- [ ] ESLint passes
- [ ] Can be imported and extended

---

### Task 1A.5: Update MobileRenderer Integration

**Owner:** Sonnet
**Estimated Time:** 2 hours
**File:** `mobile/MobileRenderer.js` (MODIFY)

**Purpose:** Wire up the new component architecture in MobileRenderer.

**Step-by-Step Instructions:**

1. **Add imports at top of file:**
   ```javascript
   import { HandSelectionManager } from "./renderers/HandSelectionManager.js";
   import { HandEventCoordinator } from "./renderers/HandEventCoordinator.js";
   ```

2. **Modify HandRenderer initialization in constructor (around line 46):**
   ```javascript
   // OLD:
   this.handRenderer = new HandRenderer(options.handContainer, options.gameController);

   // NEW:
   this.handRenderer = new HandRenderer(options.handContainer);
   this.selectionManager = new HandSelectionManager();
   this.eventCoordinator = new HandEventCoordinator(
     options.gameController,
     this.handRenderer,
     this.selectionManager
   );

   // Inject dependencies
   this.handRenderer.setSelectionManager(this.selectionManager);
   this.handRenderer.setEventCoordinator(this.eventCoordinator);
   ```

3. **Update destroy() method (around line 92):**
   ```javascript
   destroy() {
     this.subscriptions.forEach(unsub => unsub?.());
     this.subscriptions = [];

     this.handRenderer?.destroy();
     this.selectionManager = null;
     this.eventCoordinator?.destroy();
     this.eventCoordinator = null;
     // ... rest of destroy
   }
   ```

4. **Update references to HandRenderer methods:**
   - Search for `this.handRenderer.setSelectionBehavior` → Change to `this.selectionManager.setSelectionBehavior`
   - Search for `this.handRenderer.setSelectionListener` → Change to `this.selectionManager.setSelectionListener`
   - Search for `this.handRenderer.clearSelection` → Change to `this.selectionManager.clearSelection`
   - Search for `this.handRenderer.getSelectedTiles` → Change to `this.selectionManager.getSelectedTiles(handData)`

5. **Find and update all occurrences** (approximately 10-15 places in the file)

**Acceptance Criteria:**
- [ ] New components properly instantiated
- [ ] Dependency injection wired correctly
- [ ] All references to moved methods updated
- [ ] No compilation errors
- [ ] ESLint passes
- [ ] Game still runs (even if selection broken temporarily)

---

### Task 1A.6: Write Unit Tests

**Owner:** Haiku
**Estimated Time:** 4 hours
**Files:**
- `tests/unit/mobile/HandSelectionManager.test.js` (NEW)
- `tests/unit/mobile/HandEventCoordinator.test.js` (NEW)
- `tests/unit/mobile/AnimationSequencer.test.js` (NEW)

**Purpose:** Ensure new components work correctly in isolation.

**Test Coverage Requirements:**

**HandSelectionManager.test.js:**
```javascript
describe("HandSelectionManager", () => {
  test("initializes with empty selection", () => { ... });
  test("selectTile adds to selection", () => { ... });
  test("clearSelection empties selection", () => { ... });
  test("validates Charleston mode (no jokers)", () => { ... });
  test("enforces max selection limit", () => { ... });
  test("calls listener on selection change", () => { ... });
  test("preserves selection across indices", () => { ... });
});
```

**HandEventCoordinator.test.js:**
```javascript
describe("HandEventCoordinator", () => {
  test("subscribes to all required events", () => { ... });
  test("routes HAND_UPDATED to HandRenderer", () => { ... });
  test("tracks newly drawn tile index", () => { ... });
  test("applies hint recommendations", () => { ... });
  test("cleans up subscriptions on destroy", () => { ... });
});
```

**AnimationSequencer.test.js:**
```javascript
describe("AnimationSequencer", () => {
  test("executeSequence runs steps in order", () => { ... });
  test("delay waits specified time", () => { ... });
  test("cancel stops sequence", () => { ... });
  test("calls onSequenceStart/Complete hooks", () => { ... });
  test("handles errors gracefully", () => { ... });
});
```

**Acceptance Criteria:**
- [ ] All 3 test files created
- [ ] Minimum 80% code coverage
- [ ] All tests pass
- [ ] No test warnings or errors
- [ ] Tests run in < 5 seconds

---

### Phase 1A Validation Checklist

**Before moving to Phase 1B, verify:**

- [ ] All 6 tasks completed
- [ ] ESLint passes on all modified/new files
- [ ] All unit tests pass (new + existing)
- [ ] No compilation errors
- [ ] Game launches successfully
- [ ] Can navigate to game screen
- [ ] Hand tiles render correctly
- [ ] **Selection may be broken** - This is OK! We're refactoring structure.
- [ ] No console errors (except expected functionality loss)

**Expected Issues (Temporary):**
- Tile selection might not work (wiring in progress)
- Hints might not appear (will fix in integration)
- Blue glow on draw might not work (OK for now)

**NOT Expected:**
- Game crashes on load
- Tiles don't render at all
- Major console errors
- Performance degradation

---

## 🚀 Implementation Plan

### Phase 1A: Foundation (Week 1)

**Goal:** Refactor HandRenderer, create base classes

| Task | Owner | Est. Hours | Files |
|------|-------|------------|-------|
| Create HandSelectionManager.js | Haiku | 4h | 1 new |
| Create HandEventCoordinator.js | Haiku | 3h | 1 new |
| Refactor HandRenderer.js | Haiku | 6h | 1 modified |
| Create AnimationSequencer.js base | Sonnet | 3h | 1 new |
| Update MobileRenderer integration | Sonnet | 2h | 1 modified |
| Write unit tests | Haiku | 4h | 3 new |

**Deliverable:** Refactored components with tests, no functionality changes

**Validation:** All existing tests pass, game works identically

---

### Phase 1B: Charleston Animations (Week 2)

**Goal:** Implement full Charleston animation flow

| Task | Owner | Est. Hours | Files |
|------|-------|------------|-------|
| Create CharlestonAnimationSequencer.js | Sonnet | 6h | 1 new |
| Add CSS animations (pass/receive) | Haiku | 2h | 1 modified |
| Update GameController events | Sonnet | 2h | 2 modified |
| Wire MobileRenderer → Sequencer | Sonnet | 2h | 1 modified |
| Implement FLIP sort animation | Haiku | 3h | 2 modified |
| Integration testing | Sonnet | 4h | - |
| Timing and UX polish | Sonnet | 3h | - |

**Deliverable:** Beautiful Charleston animations on mobile

**Validation:**
- All 3 directions animate smoothly
- Blue glow persists correctly
- Sort animation feels natural
- No performance issues

---

### Phase 1C: Documentation & Extension Guide (Week 3)

**Goal:** Document pattern for future animations

| Task | Owner | Est. Hours | Files |
|------|-------|------------|-------|
| Write DealingAnimationSequencer spec | Sonnet | 2h | 1 doc |
| Write DiscardAnimationSequencer spec | Sonnet | 2h | 1 doc |
| Update FUTURE_REFACTORS.md | Sonnet | 1h | 1 modified |
| Create animation timing reference | Sonnet | 2h | 1 new |
| Performance benchmarks | Haiku | 3h | - |

**Deliverable:** Clear roadmap for next animations

---

## 🔮 Future Extension Points

### How to Add New Animation Sequencers

**Pattern:**
1. Extend `AnimationSequencer` base class
2. Implement specific animation flow
3. Register in MobileRenderer event handlers
4. Add CSS keyframes if needed
5. Write tests

**Example: DealingAnimationSequencer**
```javascript
class DealingAnimationSequencer extends AnimationSequencer {
  async animateDeal(dealSequence) {
    // dealSequence = [{player, tiles, timing}, ...]

    for (const deal of dealSequence) {
      await this.animateTileToDeal(deal.player, deal.tiles);
      await this.delay(deal.timing);
    }
  }

  async animateTileToDeal(player, tiles) {
    // Animate from wall → player hand
    // Use directional exit/entry points
  }
}
```

**Register in MobileRenderer:**
```javascript
this.dealingSequencer = new DealingAnimationSequencer(
  this.gameController,
  this.handRenderer,
  this.animationController
);

this.subscriptions.push(
  gc.on("TILES_DEALT", (data) => this.dealingSequencer.animateDeal(data))
);
```

### Planned Future Sequencers

1. **DealingAnimationSequencer** (~250 lines)
   - Animate initial tile dealing (wall → hands)
   - Stagger for visual clarity
   - Support "fast deal" option

2. **DiscardAnimationSequencer** (~200 lines)
   - Animate tile hand → discard pile
   - Bounce/settle effect
   - Audio sync

3. **ClaimAnimationSequencer** (~200 lines)
   - Animate discard pile → claiming player
   - Highlight claimed tile
   - Move to exposure area

4. **ExposureAnimationSequencer** (~150 lines)
   - Animate tiles hand → exposure area
   - Rotate/flip effect
   - Group formation

5. **JokerSwapAnimationSequencer** (~180 lines)
   - Animate joker ⇄ tile swap
   - Cross-fade effect
   - Position exchange

---

## 🎨 UX Design Notes

### Animation Timing Philosophy

**Guideline:** Animations should feel natural, not sluggish

- **Fast actions** (discard, select): 200-350ms
- **Medium actions** (draw, claim): 350-600ms
- **Slow actions** (Charleston pass, deal): 600-900ms
- **Very slow** (sort, reorganize): 800-1200ms

**Why Charleston is slow:**
- Educational: Players need to understand what's happening
- Directional clarity: Show where tiles are going/coming from
- Anticipation: Build excitement for received tiles
- Glow visibility: Give time to notice which tiles are new

### Easing Functions

**Use cubic-bezier for personality:**
- **ease-in-out**: Gentle start/end (Charleston pass)
- **ease-out**: Quick start, gentle end (receive tiles)
- **ease-in**: Gentle start, quick end (discard)
- **cubic-bezier(0.4, 0.0, 0.2, 1)**: Material Design standard (sort)

### Glow Color Rationale

**Blue (#1e90ff)** for received tiles:
- ✅ Distinct from selection yellow
- ✅ Calm, informative (not alarming)
- ✅ High contrast on dark tiles
- ✅ Accessible (WCAG AA compliant)

**Red** for hint recommendations:
- ✅ Action-oriented
- ✅ Draws attention without alarm
- ✅ Distinct from blue received tiles

### Mobile Performance Considerations

- Use `transform` and `opacity` only (GPU accelerated)
- Avoid animating `width`, `height`, `margin` (layout thrash)
- Apply `will-change` sparingly (memory cost)
- Limit simultaneous animations (max 14 tiles + UI)
- Use `contain: layout style paint` for isolation

---

## 🛡️ Risk Mitigation

### High-Risk Areas

1. **Timing Coordination**
   - **Risk:** Animation conflicts with game state updates
   - **Mitigation:** Use `suppressRender` flag, sequencer owns timing
   - **Fallback:** If animation fails, game still works (instant updates)

2. **HandRenderer Refactor**
   - **Risk:** Breaking existing selection/rendering
   - **Mitigation:** Comprehensive unit tests, phased rollout
   - **Fallback:** Keep original HandRenderer in .archive during transition

3. **Performance on Low-End Devices**
   - **Risk:** Animations stutter on older phones
   - **Mitigation:** `prefers-reduced-motion` support, GPU acceleration
   - **Fallback:** Instant mode (skip animations)

4. **Event Race Conditions**
   - **Risk:** TILES_RECEIVED arrives before pass animation completes
   - **Mitigation:** Sequencer controls flow, waits for completion
   - **Fallback:** Queue events, process sequentially

### Testing Checkpoints

- [ ] All existing Playwright tests pass
- [ ] New unit tests for refactored components
- [ ] Visual regression tests for animations
- [ ] Performance benchmarks (60fps target)
- [ ] Manual testing on 3 devices (modern, mid-range, old)
- [ ] Accessibility testing (screen reader, keyboard nav)

---

## 📚 References

### Existing Architecture Docs
- [ADAPTER_PATTERNS.md](ADAPTER_PATTERNS.md) - Event-driven UI patterns
- [FUTURE_REFACTORS.md](FUTURE_REFACTORS.md) - Planned improvements
- [CLAUDE.md](CLAUDE.md) - Project overview

### External Resources
- [FLIP Animations](https://aerotwist.com/blog/flip-your-animations/) - Paul Lewis
- [CSS Animation Performance](https://web.dev/animations-guide/) - web.dev
- [Orchestrating Complex Animations](https://css-tricks.com/orchestrating-complexity-with-web-animations-api/) - CSS Tricks

---

## 🤝 Sub-Agent Delegation Strategy

### When to Use Haiku

**Ideal for:**
- Mechanical refactoring (splitting files)
- Writing tests with clear specs
- CSS animation implementation
- Code cleanup and linting
- Documentation formatting

**Instructions format:**
```
Task: Extract selection logic from HandRenderer into HandSelectionManager

Context: [paste HandRenderer code]
Requirements:
- Move methods: selectTile, clearSelection, getSelectedTiles, etc.
- Create new file: mobile/renderers/HandSelectionManager.js
- Update HandRenderer to use new manager
- Write unit tests

Output: Complete file contents for review
```

### When to Use Sonnet (You)

**Ideal for:**
- Architectural decisions
- Event flow design
- Animation orchestration logic
- Integration work (MobileRenderer)
- UX polish and timing
- Reviewing Haiku's work

---

## 📝 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-23 | 0.1 | Initial document creation | Sonnet |

---

## ✅ Next Steps

1. **Review this document** - Iterate on architecture decisions
2. **Create detailed task breakdown** - Granular sub-tasks for Haiku
3. **Set up testing infrastructure** - Test harness for refactored components
4. **Begin Phase 1A** - Start HandRenderer refactor
5. **Validate with user** - Show Charleston animation mockup for feedback

---

**Questions? Concerns? Ideas?** Update this document and iterate!