# AI Agents System (Post-Refactor)

## 1. Modern Architecture Overview

```
core/GameController.js (platform-agnostic)
├── AIEngine (core/AIEngine.js)
├── Card Validator (core/card/)
├── Data Models (core/models/*)
└── EventEmitter (core/events/EventEmitter.js)

Desktop Stack
   GameController → PhaserAdapter → Managers (Tile/Selection/Dialog/Button/HandRenderer) → Phaser Scene

Mobile Stack
   GameController → MobileRenderer → Reactivity layer (OpponentBar, HandRenderer, DiscardPile, Touch gestures)
```

- **Single Source of Truth:** `GameController` manages state, turn order, Charleston, courtesy, loop phases, and emits rich events. Both desktop (Phaser) and mobile (DOM/CSS) read the same state transitions.
- **Platform-Specific Rendering:** Desktop uses `PhaserAdapter` to translate controller events into sprite operations. Mobile uses `MobileRenderer` + lightweight web components.
- **AI Engine Everywhere:** `AIEngine` runs inside `GameController` regardless of platform. It consumes plain data models (`PlayerData`, `HandData`, `TileData`) so it can drive both renderers consistently.

## 2. Core Control Loop

1. **Initialization**

   ```javascript
   await gameController.init({
       aiEngine: new AIEngine(card, null, "medium"),
       cardValidator: card,
       wallGenerator: () => captureWallTiles(),
       settings: { year: 2025, skipCharleston: false, difficulty: "medium" }
   });
   ```

   - Builds data models, shuffles wall (unless injected), seeds AI config.

2. **State Machine**
   - `INIT → START → DEAL → CHARLESTON1 → ... → LOOP_* → END`
   - Every transition emits `STATE_CHANGED` with rich payloads so adapters can toggle UI, prompts, and accessibility affordances.

3. **AI Hooks**
   - **Charleston/Courtesy:** Controller calls `aiEngine.charlestonPass`, `charlestonContinueVote`, `courtesyVote`, `courtesyPass` for non-human seats.
   - **Game Loop:** `aiEngine.chooseDiscard()`, `aiEngine.claimDiscard()`, `aiEngine.jokerSwap()` etc. run for computer players while human interactions are routed through platform prompts.

4. **Event-Driven Rendering**
   - Desktop `PhaserAdapter` subscribes to `GAME_STARTED`, `TILES_DEALT`, `HAND_UPDATED`, `TURN_CHANGED`, `MESSAGE`, `UI_PROMPT`, etc. and fans them out to managers.
   - Mobile `MobileRenderer` listens for the same events but applies CSS transitions, DOM updates, and touch gestures.

## 3. AI Engine Responsibilities

### Pattern & Hand Evaluation

- Uses `Card` definitions (multiple years) to enumerate legal hands.
- Ranks candidate hands based on tile availability, joker pressure, virtual suit mapping, and run flexibility.
- Keeps full breakdowns: required tiles, exposures, joker placement, and risk scoring.

### Tile Ranking & Discard Selection

- Produces per-tile deltas: "keep", "pass", or "discard" (see `TILE_RECOMMENDATION` constants).
- Integrates **opponent safety** (don't feed recent exposures), **wall depth** (probabilities shrink later), and **training mode** overrides.
- Injects controlled randomness based on difficulty for more "human" play.

### Charleston & Courtesy Strategy

- Phase-specific heuristics:
  - Prefers shedding isolated honors early.
  - Avoids passing tiles that weaken best pattern groups.
  - Votes to continue/skip depending on hand rank thresholds.
- Courtesy votes respect game state, difficulty config, and exposure risk.

### Exposure & Claim Logic

- Evaluates whether claiming a discard increases hand rank beyond the configured threshold.
- Distinguishes between pung/kong/quint, training prompts, and joker swaps.
- Provides structured payloads to adapters so UI can animate exposures correctly.

### Configurable Difficulty (`easy`, `medium`, `hard`)

- Tunable knobs (from `AIEngine.getDifficultyConfig`):
  - `maxPatterns`, `minDiscardable`, `exposureThreshold`
  - Courtesy thresholds, Charleston continuation chance
  - Blank/joker optimization aggressiveness
  - `discardRandomness` for mistake simulation

## 4. Platform Integration Highlights

### Desktop (Phaser)

- `PhaserAdapter` bridges controller events into managers:
  - **TileManager** registers sprites, handles drag/drop, and animations.
  - **SelectionManager** enforces prompts (`min/max` selection) for Charleston, courtesy, exposures, discards.
  - **DialogManager` renders modal prompts (e.g., "Claim discards?").
  - **HandRenderer/ButtonManager** sync UI state with controller states.
- Desktop exposes `window.gameController` for debugging/tests; Playwright asserts controller state changes and event emissions.

### Mobile (Web Components + CSS Animations)

- `MobileRenderer` attaches to DOM containers (`hand-container`, `discard-container`, `opponent bars`).
- Components:
  - `OpponentBar` shows tile counts, exposures, and turn highlights.
  - `HandRenderer` manages button-based tiles (mobile-friendly).
  - `DiscardPile`, `TouchHandler` for gestures (double-tap, swipe expose).
  - `SettingsSheet`, `InstallPrompt`, etc.
- Animations handled via `AnimationController` (CSS class toggles). Tests import this module to confirm classes drop as expected.

## 5. Configuration & Extension

| Area | How to Customize |
|------|------------------|
| **AI Difficulty** | Pass `difficulty: "easy" \| "medium" \| "hard"` in `gameController.init`. Adjust configs in `AIEngine.getDifficultyConfig`. |
| **Card Years** | Instantiate `Card(year)` with any supported year, pass to controller. Patterns auto-load from `core/card/<year>/`. |
| **Training Mode** | Settings manager toggles `skipCharleston`, fixed hands via `trainingHand`, tile counts, etc., and controller honors those values. |
| **Platform Hooks** | Subscribe to `GameController` events to add overlays, analytics, or sound. All events are plain JS objects. |
| **AI Experiments** | Extend `AIEngine` with new heuristics (e.g., Monte Carlo search) while keeping interface (`chooseDiscard`, `courtesyVote`) intact. |

## 6. Testing & Validation

- **Unit Tests:** `core` models, AI ranking, and future manager tests (planned for phases 2-4 per `TEST_AUDIT.md`).
- **E2E Tests:** Playwright suites for desktop (`tests/e2e/desktop/`) and mobile (`tests/e2e/mobile/`). They boot the real app, wait for `window.gameController`, and assert event-driven behaviors.
- **Helpers:** `waitForMobileReady`, `waitForGameController`, log-based assertions ensure asynchronous flows (Charleston, exposures) settle before checking results.

## 7. Roadmap / Future Enhancements

1. **Machine Learning Assist:** Plug-in scoring functions or reinforcement-learning policies by wrapping `AIEngine`'s selection methods.
2. **Monte Carlo Rollouts:** Simulate future draws before deciding on a discard or claim.
3. **Opponent Modeling:** Track opponents' exposures and discards to feed into risk heuristics.
4. **Cross-Platform Consistency Tests:** "Same seed, same outcome" regression suite tying desktop and mobile runs together.
5. **Telemetry Hooks:** Stream `STATE_CHANGED`, `MESSAGE`, and AI confidence metrics for analytics dashboards or live spectators.

## 8. Debugging & Development Tips for LLMs

### Key Entry Points for Debugging

- **GameController**: Start with `core/GameController.js` - this is the central hub for game state and AI integration
- **AIEngine**: `core/AIEngine.js` contains all AI decision-making logic
- **Event System**: `core/events/` directory contains event definitions and emitter

### Common Debugging Scenarios

#### AI Not Making Expected Moves

1. Check `AIEngine.chooseDiscard()` and related methods
2. Examine difficulty configuration in `AIEngine.getDifficultyConfig()`
3. Verify tile rankings and pattern evaluation logic

#### State Transition Issues

1. Review the state machine in `GameController`
2. Check event emissions and subscriptions
3. Verify adapter implementations handle all required events

#### Cross-Platform Inconsistencies

1. Compare event handling between `PhaserAdapter` and `MobileRenderer`
2. Ensure both platforms subscribe to the same events
3. Verify data model consistency across platforms

### Adding New Features

#### New AI Strategies

1. Extend `AIEngine` with new methods while maintaining existing interface
2. Add new difficulty configurations in `getDifficultyConfig()`
3. Update pattern evaluation and tile ranking logic as needed

#### New Game Modes

1. Add new state transitions in `GameController`
2. Create corresponding event types in `core/events/GameEvents.js`
3. Implement platform-specific rendering in both adapters

#### New Card Years

1. Create new card definition files in `core/card/<year>/`
2. Implement year-specific pattern validation
3. Update `Card` class to support the new year

### Testing New Features

- **Unit Tests**: Add tests for core logic in the appropriate test files
- **E2E Tests**: Create Playwright tests in `tests/e2e/` directories
- **Manual Testing**: Use `window.gameController` for debugging in desktop mode

## 9. File Structure Reference

```
core/
├── AIEngine.js              # Main AI logic
├── GameController.js        # Central game state management
├── tileDefinitions.js       # Tile definitions
├── card/                    # Card validation and patterns
│   ├── card.js              # Base card class
│   ├── CardHand.js          # Hand management
│   └── <year>/              # Year-specific implementations
├── events/                  # Event system
│   ├── EventEmitter.js      # Event emitter
│   └── GameEvents.js        # Event definitions
└── models/                  # Data models
    ├── HandData.js
    ├── PlayerData.js
    └── TileData.js

desktop/
├── adapters/
│   └── PhaserAdapter.js     # Desktop platform adapter
└── ...                      # Desktop-specific components

mobile/
├── MobileRenderer.js        # Mobile platform renderer
└── ...                      # Mobile-specific components
```

---

**Key Takeaway:** After the refactors, AI agents live inside a platform-neutral controller that exposes deterministic events. Adapters render state, while AI logic stays shared across desktop and mobile, ensuring consistent strategy and easier future enhancements. This architecture provides clear separation of concerns and well-defined extension points for adding new features.
