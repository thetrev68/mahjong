# Test Suite Audit & Expansion Plan

**Date:** 2025-11-16
**Context:** Post-refactor test evaluation (after Phase 3 desktop refactor + Phase 4 mobile implementation)

---

## Current Test Suite Status

### Existing Tests (1,668 total lines)

| File | Lines | Type | Status | Coverage |
|------|-------|------|--------|----------|
| `aiengine.test.js` | 289 | Unit (jsdom) | ⚠️ Needs Update | AIEngine only |
| `game-basic.spec.js` | 175 | E2E (Playwright) | ⚠️ Pre-refactor | Desktop basics |
| `mobile.spec.js` | 246 | E2E (Playwright) | ⚠️ Pre-refactor | Mobile basics |
| `mobile-tile.test.js` | 411 | Unit (jsdom) | ✅ Component | MobileTile only |
| `touch-handler.spec.js` | 63 | E2E (Playwright) | ✅ Gesture | TouchHandler only |

**Current Issues:**
1. ❌ Tests fail on import (`window is not defined` for Phaser)
2. ⚠️ Written before 2 major refactors:
   - Desktop: GameController + PhaserAdapter architecture
   - Mobile: MobileRenderer implementation
3. ⚠️ Missing coverage for:
   - New manager APIs (TileManager, SelectionManager, DialogManager, ButtonManager)
   - HandRenderer (desktop & mobile)
   - GameController event system
   - Cross-platform validation (same logic, different renderers)

---

## Test Categories & Gaps

### 1. Unit Tests (Component Level)

**Existing:**
- ✅ AIEngine (difficulty configs, tile scoring, discard logic)
- ✅ MobileTile (sprite rendering, creation)

**Missing:**
- ❌ **GameController** (state machine, event emission, game flow)
- ❌ **TileData/HandData/PlayerData** (core models)
- ❌ **Card validator** (hand validation, pattern matching)
- ❌ **Desktop Managers:**
  - TileManager (sprite registry, tile movement)
  - SelectionManager (selection validation, promise API)
  - DialogManager (modal prompts)
  - ButtonManager (button state management)
  - HandRenderer (tile positioning for 4 players)
- ❌ **Mobile Components:**
  - HandRenderer (CSS-based rendering)
  - DiscardPile (discard display)
  - OpponentBar (opponent state display)
  - MobileRenderer (event routing)

### 2. Integration Tests (Cross-Component)

**Missing:**
- ❌ **GameController → Adapters:**
  - Events emitted correctly
  - Callbacks invoked properly
  - State transitions synchronized
- ❌ **PhaserAdapter → Managers:**
  - Event routing to correct manager
  - Manager responses handled correctly
- ❌ **MobileRenderer → Components:**
  - Event routing to mobile components
  - Touch interactions triggering game actions

### 3. E2E Tests (Full Game Flows)

**Existing (Pre-Refactor):**
- ⚠️ Desktop: Game load, start, settings panel
- ⚠️ Mobile: Page load, tile selection, Charleston

**Missing:**
- ❌ **Desktop Complete Flows:**
  - Full Charleston (3 passes + query + 2nd Charleston)
  - Courtesy vote & pass
  - Main game loop (pick → discard → claim → expose)
  - Mahjong declaration
  - Wall exhaustion
  - Training mode
- ❌ **Mobile Complete Flows:**
  - Full game from start to Mahjong
  - Touch gestures (tap, double-tap, swipe)
  - Mobile Charleston UI
  - Mobile claim prompts
- ❌ **Cross-Platform Validation:**
  - Same seed → same tile deals
  - Same AI decisions on both platforms
  - Identical game outcomes

### 4. Regression Tests

**Missing:**
- ❌ **Architectural Constraints:**
  - PhaserAdapter never directly manipulates Phaser objects
  - GameController has zero Phaser imports
  - Mobile has zero Phaser dependencies
- ❌ **Settings Persistence:**
  - Settings survive page reload
  - Settings sync between desktop/mobile
- ❌ **Edge Cases:**
  - Empty wall handling
  - Invalid tile selections
  - Race conditions in async flows
  - Prompt timeout/cancellation

---

## Test Execution Issues

### Problem: `window is not defined`

**Root Cause:**
Playwright tries to import Phaser during test setup (for desktop tests), but Phaser requires browser globals.

**Current Workaround:**
Unit tests use jsdom to mock `window`/`document` (see `aiengine.test.js:15-20`)

**Solutions:**

1. **Separate Unit vs E2E test files** (RECOMMENDED)
   ```
   tests/
   ├── unit/           # jsdom-based, no Phaser
   │   ├── core/       # GameController, AIEngine, models
   │   ├── managers/   # Desktop managers
   │   └── mobile/     # Mobile components
   └── e2e/            # Playwright browser tests
       ├── desktop/    # Desktop game flows
       └── mobile/     # Mobile game flows
   ```

2. **Update playwright.config.js** to exclude unit tests from browser runs
   ```js
   testMatch: ["**/e2e/**/*.spec.js"]  // Only run E2E in browser
   ```

3. **Add Node.js test runner for unit tests**
   ```json
   "test:unit": "node --test tests/unit/**/*.test.js"
   ```

---

## Recommended Test Expansion Plan

### Phase 1: Fix Existing Tests (Priority: HIGH)

**Goal:** Get current tests passing

1. ✅ Restructure test directory (unit vs e2e)
2. ✅ Update imports for `core/card/` move
3. ✅ Fix Playwright config
4. ✅ Run and verify all tests pass

**Files to Update:**
- `aiengine.test.js` → import from `../core/card/card.js`
- `game-basic.spec.js` → verify selectors still exist
- `mobile.spec.js` → verify mobile DOM structure

### Phase 2: Add Core Unit Tests (Priority: HIGH)

**Goal:** Test platform-agnostic logic

1. **GameController Tests** (NEW)
   ```js
   tests/unit/core/GameController.test.js
   - State machine transitions
   - Event emission (TILE_DRAWN, HAND_UPDATED, etc.)
   - Prompt callbacks
   - Charleston logic
   - Courtesy logic
   - Claim validation
   ```

2. **Data Models Tests** (NEW)
   ```js
   tests/unit/core/models/TileData.test.js
   tests/unit/core/models/HandData.test.js
   tests/unit/core/models/PlayerData.test.js
   - Creation, serialization
   - Conversion helpers
   ```

3. **Card Validator Tests** (EXPAND)
   ```js
   tests/unit/core/card/card.test.js
   - Hand validation
   - Pattern matching
   - Scoring
   ```

### Phase 3: Add Desktop Manager Tests (Priority: MEDIUM)

**Goal:** Test desktop-specific managers

```js
tests/unit/desktop/managers/
├── TileManager.test.js         # Sprite registry, tile lookup
├── SelectionManager.test.js    # Selection validation, promise API
├── DialogManager.test.js       # Modal prompts
├── ButtonManager.test.js       # Button state
└── HandRenderer.test.js        # Tile positioning
```

### Phase 4: Add Mobile Component Tests (Priority: MEDIUM)

**Goal:** Test mobile-specific components

```js
tests/unit/mobile/
├── MobileRenderer.test.js      # Event routing
├── HandRenderer.test.js        # CSS rendering
├── DiscardPile.test.js         # Discard display
└── OpponentBar.test.js         # Opponent state
```

### Phase 5: Add E2E Game Flows (Priority: HIGH)

**Goal:** Test complete user journeys

```js
tests/e2e/desktop/
├── charleston.spec.js          # Full Charleston flow
├── courtesy.spec.js            # Courtesy vote & pass
├── main-game-loop.spec.js      # Pick → discard → claim
├── mahjong.spec.js             # Winning flow
└── training-mode.spec.js       # Training features

tests/e2e/mobile/
├── charleston.spec.js          # Mobile Charleston
├── touch-interactions.spec.js  # Tap, double-tap, swipe
├── main-game-loop.spec.js      # Full game on mobile
└── pwa.spec.js                 # Install prompt
```

### Phase 6: Add Cross-Platform Tests (Priority: MEDIUM)

**Goal:** Ensure desktop & mobile produce identical logic

```js
tests/e2e/cross-platform/
└── game-equivalence.spec.js    # Same seed → same outcomes
```

### Phase 7: Add Regression Tests (Priority: LOW)

**Goal:** Prevent architectural violations

```js
tests/regression/
├── architecture-constraints.spec.js  # No Phaser in GameController
├── settings-persistence.spec.js      # Settings survive reload
└── edge-cases.spec.js                # Empty wall, timeouts, etc.
```

---

## Test Metrics Goals

| Metric | Current | Target (Phase 5) | Target (Phase 7) |
|--------|---------|------------------|------------------|
| Total Tests | ~15 | 100+ | 150+ |
| Coverage (Core) | ~30% | 80% | 90% |
| Coverage (Desktop) | ~10% | 60% | 75% |
| Coverage (Mobile) | ~20% | 60% | 75% |
| E2E Scenarios | 3 | 20 | 30 |

---

## Implementation Priority

**Immediate (Week 1):**
1. ✅ Fix existing tests (Phase 1)
2. ✅ Add GameController unit tests (Phase 2)
3. ✅ Add desktop Charleston E2E test (Phase 5)

**Short-term (Week 2-3):**
4. ✅ Add manager unit tests (Phase 3)
5. ✅ Add mobile component tests (Phase 4)
6. ✅ Add main game loop E2E tests (Phase 5)

**Medium-term (Month 1-2):**
7. ✅ Complete E2E coverage (Phase 5)
8. ✅ Add cross-platform tests (Phase 6)

**Long-term (Ongoing):**
9. ✅ Add regression tests as bugs are found (Phase 7)
10. ✅ Maintain 80%+ coverage

---

## Next Steps

1. **Restructure test directory:**
   ```bash
   mkdir -p tests/unit/core tests/unit/desktop/managers tests/unit/mobile
   mkdir -p tests/e2e/desktop tests/e2e/mobile tests/e2e/cross-platform
   ```

2. **Update playwright.config.js:**
   - Separate unit vs e2e test matching
   - Add unit test runner (Node.js or Vitest)

3. **Fix import paths:**
   - Update `card` imports to `core/card`
   - Verify all tests run

4. **Prioritize critical tests:**
   - GameController (core logic)
   - Charleston flow (complex state machine)
   - Main game loop (most user time)

---

## Decision Log

**Why separate unit vs E2E?**
- Unit tests run faster (no browser startup)
- Can run on CI without headless browser
- Better isolation (test one component at a time)

**Why prioritize GameController tests?**
- Single source of truth for game logic
- Most complex component (737 lines)
- Bugs here affect both platforms

**Why delay regression tests?**
- Need baseline of working tests first
- Better to add as bugs are discovered
- Lower ROI than feature coverage

---

Last Updated: 2025-11-16
