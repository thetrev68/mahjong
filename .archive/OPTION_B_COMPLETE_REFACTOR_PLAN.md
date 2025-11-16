# Option B: Complete the Architectural Refactor to MVP

## Vision
Create a stable, feature-complete application that works reliably on both **Desktop (Phaser)** and **Mobile (HTML/CSS)** with a clean separation of concerns.

**Platform-Agnostic Core** ← **GameController** (pure logic, no rendering)
**Platform-Specific Renderers** ← **PhaserAdapter** (desktop) & **MobileRenderer** (mobile)

---

## Current Understanding

### What We Have (Good)
- ✅ **GameController** exists and emits game events
- ✅ **TileData/HandData/PlayerData** models created (platform-agnostic)
- ✅ **AIEngine** works with abstract data models
- ✅ **Card validator** works independently
- ✅ **Test infrastructure** (AIEngine unit tests pass)

### What We Don't Have (Broken)
- ❌ **PhaserAdapter** is mostly stubs - event handlers are incomplete
- ❌ **Tile rendering and animation** not implemented in PhaserAdapter
- ❌ **Charleston UI** - no button/dialog implementation
- ❌ **Tile selection system** - clicking tile should select, not discard
- ❌ **Hand management UI** - tile positioning, dragging, sorting
- ❌ **Hint panel integration** - crashes due to tile lookup issues
- ❌ **MobileRenderer** doesn't exist at all
- ❌ **Game state transitions** not wired to UI updates

### Key Misconception I Had
I assumed PhaserAdapter could be a lightweight adapter. **You're saying it needs to be much more substantial** - it needs to handle:
- All tile rendering and sprite management
- All animations (dealing, discarding, claiming, exposing)
- All UI dialogs (Charleston pass, courtesy vote, claim options)
- Hand management (tile selection, dragging, reordering)
- Hint panel integration

Is this correct? PhaserAdapter is essentially the "View" layer for desktop?

---

## Architecture Clarification (NEED YOUR INPUT)

### GameController's Responsibility
- Manages game state machine (states: INIT, DEAL, CHARLESTON1, etc.)
- Manages player data (hands, exposures, scores)
- Makes decisions (whose turn, did they win, can they claim)
- Emits EVENTS for everything that happens
- **Does NOT**: Handle rendering, animations, UI dialogs, user input

### PhaserAdapter's Responsibility
- Listens to ALL GameController events
- Creates/destroys Phaser sprite objects
- Manages tile animations and positioning
- Implements UI dialogs (buttons, prompts, selections)
- Handles user input (clicks, drags, selections)
- Converts user actions back to GameController callbacks
- **Does NOT**: Make game logic decisions, validate hands, check rules

### Questions I Need Answered
1. **Who owns the Hand display logic?**
   - Should PhaserAdapter recreate the hand.showHand() logic from old GameLogic?
   - Or should GameController emit detailed "HAND_UPDATED" events with animation parameters?

2. **Charleston phase - how detailed should events be?**
   - GameController just says "CHARLESTON_QUERY_STARTED"?
   - PhaserAdapter creates the full dialog, handles clicking buttons, etc?

3. **Tile selection during Charleston**
   - Should GameController expose a method like `selectTileForCharleston(tileIndex)` that PhaserAdapter calls?
   - Should tiles emit SELECT events that PhaserAdapter tracks?

4. **Hand validation (Charleston/Courtesy/Play/Expose)**
   - Old code had `hand.setValidationMode("charleston")` - should this stay?
   - Should PhaserAdapter handle highlighting valid selections, or GameController?

5. **Mobile renderer - can it reuse components?**
   - Will mobile/components/MobileTile.js and mobile/renderers/HandRenderer.js be compatible?
   - Or do they need refactoring to work with GameController?

---

## What Broke (Specific Issues)

### Issue #1: Tile Deal Animation Missing
**What should happen:**
- Tiles animate from wall position (640, 360) to player hand positions

**What's happening:**
- Tiles appear in hands with no animation
- homePageTileManager animates the scatter, but then game starts with tiles already placed

**Why:**
- PhaserAdapter.onTileDrawn() exists but only has skeleton code
- No animation tweens are being created

**Fix needed:**
- Implement full onTileDrawn() with:
  - Position tile at wall coordinates
  - Find target hand position for player
  - Create Phaser tween to animate from wall to hand

---

### Issue #2: Player 0 Gets 14 Tiles Instead of 13
**What should happen:**
- Each player gets exactly 13 tiles from deal
- Player 0 gets 1 extra tile after deal (turn starts with 14)

**What's happening:**
- Player 0 already has 14 after dealing completes

**Why:**
- Unknown - need to check:
  - Is GameController.dealTiles() adding an extra tile?
  - Is PhaserAdapter duplicate-adding tiles?
  - Is hand initialization wrong?

**Fix needed:**
- Trace through dealTiles() logic
- Check if PhaserAdapter is adding tiles correctly

---

### Issue #3: Charleston UI Shows No Buttons/Text
**What should happen:**
- Action panel shows button(s) for Charleston actions
- "Choose X tiles to pass" text
- PASS and CANCEL buttons

**What's happening:**
- Action panel is completely empty

**Why:**
- PhaserAdapter.handleCharlestonPassPrompt() is a stub
- DialogManager probably doesn't exist or is incomplete

**Fix needed:**
- Check if DialogManager class exists
- Implement handleCharlestonPassPrompt() to:
  - Show dialog with instructions
  - Enable tile selection (max 3)
  - Show PASS/CANCEL buttons
  - Call callback with selected tiles or empty array

---

### Issue #4: Tile Click Discards Immediately (Wrong)
**What should happen:**
- Click tile → tile raises to position 575 (selected state)
- Click another tile → previous tile lowers, new tile raises
- Click DISCARD button → only then is tile discarded

**What's happening:**
- Click tile → discarded immediately

**Why:**
- Old Hand.js had click handlers for selection
- New code might not have this, or it's wired to discard directly

**Fix needed:**
- Check if Hand.enableTileSelection() exists
- Implement tile selection lifecycle in PhaserAdapter/Hand

---

### Issue #5: Hint Panel Crashes
**What should happen:**
- Hint panel shows top 3 possible hands and discard suggestions
- Red glow on suggested discard tiles

**What's happening:**
- Crashes when trying to access hint data

**Why:**
- HintAnimationManager exists but might have stale references
- Probably calling undefined methods on tiles or hands

**Fix needed:**
- Check HintAnimationManager compatibility with new tile system
- Fix any Tile → TileData mismatches

---

## Implementation Strategy (High-Level)

### Phase 1: Understand Current State
1. **Map all GameController events**
   - List every event GameController emits
   - Identify which ones PhaserAdapter needs to handle

2. **Map all PhaserAdapter handlers**
   - List every handler that exists
   - Identify which are stubs vs partially implemented

3. **Create event flow diagram**
   - Game event → PhaserAdapter handler → UI update → User action → GameController callback

### Phase 2: Fix Critical Path (Deal & Discard)
1. Implement proper tile dealing animation
2. Fix player tile count issue
3. Implement discard animation
4. Test: Can you deal and discard tiles?

### Phase 3: Fix Charleston Phase
1. Implement Charleston UI (dialogs, buttons)
2. Implement tile selection system
3. Handle pass direction logic
4. Test: Can you select and pass tiles?

### Phase 4: Fix Remaining Phases
1. Courtesy pass
2. Exposures and joker swaps
3. Claim discard flow
4. Main game loop

### Phase 5: Mobile Renderer (Parallel or After)
1. Create MobileRenderer with same event listener pattern
2. Implement mobile-specific tile rendering (HTML/CSS)
3. Test on mobile devices

---

## Files That Need Work (Inventory)

### Priority 1: Critical Path (Must Fix)
- `desktop/adapters/PhaserAdapter.js` - 90% of work is here
  - [ ] onTileDrawn() - implement full animation
  - [ ] onTileDiscarded() - implement animation + discard pile UI
  - [ ] onCharlestonPhase() - show UI
  - [ ] onStateChanged() - update buttons based on state
  - [ ] handleCharlestonPassPrompt() - create dialog
  - [ ] Hand integration - tile selection system

- `desktop/managers/DialogManager.js` (if it exists)
  - [ ] showCharlestonPassDialog()
  - [ ] showCourtesyVoteDialog()
  - [ ] showClaimDialog()
  - [ ] All other dialogs

### Priority 2: Supporting Infrastructure
- `gameObjects_hand.js` - check if still compatible
  - [ ] setValidationMode() - tile selection validation
  - [ ] enableTileSelection() - click handlers
  - [ ] showHand() - positioning logic

- `HintAnimationManager.js` - fix tile/TileData mismatch
  - [ ] Update to work with new tile system

- `core/GameController.js` - audit event payloads
  - [ ] Ensure all events have required data
  - [ ] Ensure callbacks are implemented

### Priority 3: Mobile (Lower priority but needed)
- `mobile/renderers/HandRenderer.js` - create/audit
- `mobile/components/MobileTile.js` - create/audit
- Create `MobileRenderer` (equivalent to PhaserAdapter for mobile)

---

## Questions Before We Start

1. **Do you want me to audit the current code first** to see what actually exists vs what's stubs?
2. **Should PhaserAdapter be split into sub-managers** (TileManager, DialogManager, AnimationManager) or keep as one big class?
3. **For mobile - do the existing mobile/renderers and mobile/components work at all**, or are they also incomplete?
4. **Game state transitions - who's responsible?**
   - GameController.setState() emits STATE_CHANGED?
   - PhaserAdapter listens and updates buttons?
5. **Tile selection during Charleston**
   - Should tiles visually indicate they're selected (raise up)?
   - Should max-3 limit be enforced visually?

---

## Success Criteria

### Desktop MVP Complete When:
- [ ] Game deals 52 tiles correctly (13 to each player, 1 to dealer)
- [ ] Tiles animate from wall to hands
- [ ] Charleston phase allows selecting and passing 3 tiles
- [ ] Courtesy phase works (vote + optional pass)
- [ ] Main game loop works (draw, discard, claim, expose)
- [ ] Game completes without crashing
- [ ] Hint system works properly

### Mobile MVP Complete When:
- [ ] Same game flow works on mobile
- [ ] Tiles render with HTML/CSS, not Phaser
- [ ] Touch-friendly tile selection (maybe tap to select, not drag)
- [ ] DialogManager works on mobile
- [ ] No Phaser dependencies in mobile renderer

---

## Next Steps

Before I start coding, I need you to review:

1. **Do my understandings match reality?**
   - Is PhaserAdapter supposed to be this comprehensive?
   - Is my architecture understanding correct?

2. **Answer the 5 questions above** so I understand exactly what you envision

3. **Confirm priority order** - should I focus on getting desktop MVP first, or build both in parallel?

4. **Point out any other major misconceptions** I have

Once we align on this, I can create detailed task breakdowns for each phase and we'll have a solid implementation plan.

---

## Notes

- This plan assumes we're not reverting - we're completing the refactor
- Timeline estimate: 4-6 hours for desktop MVP + another 3-4 for mobile
- The key is that we need to be **methodical** not **reactive** - each fix should be intentional and documented
- We should commit frequently (after each working piece)
