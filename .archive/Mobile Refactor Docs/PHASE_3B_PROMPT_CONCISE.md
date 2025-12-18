# Phase 3B: Mobile Scene Architecture (CONCISE)

**Assignee:** Claude Sonnet 4.5
**Status:** Ready to start
**Branch:** mobile-core

---

## Task: Create `mobile/MOBILE_INTERFACES.md`

Define complete interface specifications for all mobile components. This is a **design-only phase** - no implementation code.

### Context Files

- Mockup: [mobile/mockup.html](mobile/mockup.html), [mobile/mockup.css](mobile/mockup.css)
- Core: [core/GameController.js](core/GameController.js)
- Reference: [desktop/adapters/PhaserAdapter.js](desktop/adapters/PhaserAdapter.js)

---

## Document Structure

### 1. Component Interfaces (10 total)

For each component, define:

- **Purpose** (1 sentence)
- **Constructor params**
- **Public methods** (with JSDoc signatures)
- **Events listened to** (from GameController)
- **Events emitted** (if any)
- **State managed** (what properties it holds)

**Components:**

1. MobileGameController (orchestrator)
2. HandRenderer (2-row player hand)
3. ExposedTilesRenderer (player's exposed tiles)
4. OpponentBar (single opponent info)
5. DiscardPileRenderer (9×12 grid)
6. HintsPanel (AI recommendations)
7. WallCounter (floating counter)
8. BottomMenu (DRAW/SORT buttons)
9. TouchHandler (gesture detection - high-level only)
10. TileComponent (individual tile - high-level only)

### 2. Event Flow Scenarios (4 required)

Document these as step-by-step flows:

1. **Player draws tile** (wall → hand)
2. **Player discards tile** (hand → discard pile)
3. **Opponent exposes tiles** (update OpponentBar)
4. **Hand changes** (update HintsPanel)

Format:

```
Event X fires → ComponentA receives → ComponentA does Y → ComponentB updates
```

### 3. Critical Decisions (4 required)

**Decision 1: Component Creation**

- Eager (all components created upfront) vs Lazy (created on demand)?
- Document choice + rationale

**Decision 2: Error Handling**

- What happens if event fires before component ready?
- Event queue? Ignore? Re-query state?

**Decision 3: Animation Coordination**

- How to prevent animation conflicts when rapid events occur?
- Lock UI? Queue changes? Cancel animations?

**Decision 4: Touch Event Propagation**

- How to handle overlapping touch targets (exposed tiles above hand)?
- z-index? event.target check? stopPropagation?

### 4. Architecture Questions (answer all)

1. **Component communication:** Direct calls or GameController events only?
2. **State of truth:** GameController only, or can components hold UI state?
3. **Event naming:** ALL_CAPS vs camelCase vs namespaced?
4. **Sprite loading:** Who loads assets/tiles.png? When?
5. **Responsive behavior:** Who handles window resize?
6. **Accessibility:** ARIA labels needed? Keyboard support?

### 5. Test Scenarios (3 per component)

Format:

```
Test: [Component] handles [scenario]
Given: [initial state]
When: [action]
Then: [expected result]
And: [additional assertions]
```

Example:

```
Test: HandRenderer handles rapid state changes
Given: HandRenderer initialized
When: 3 HAND_UPDATED events fire within 100ms
Then: Final state renders correctly
And: No duplicate tiles or visual glitches
```

### 6. Example Usage

Show how to bootstrap the system:

```javascript
// mobile/main.js example
import { MobileGameController } from "./MobileGameController.js";
import { GameController } from "../core/GameController.js";

async function initMobileGame() {
  const gameController = new GameController();
  const mobileUI = new MobileGameController(document.body, gameController);
  await mobileUI.init();
  gameController.startGame();
}
```

---

## Interface Template (use this for each component)

```javascript
/**
 * [ComponentName]
 *
 * [Purpose - 1 sentence]
 */
class [ComponentName] {
    /**
     * @param {Type} param1 - Description
     * @param {Type} param2 - Description
     */
    constructor(param1, param2) {}

    /**
     * Initialize component and subscribe to events
     */
    init() {
        // Document which events are subscribed to
        // this.gameController.on('EVENT_NAME', handler);
    }

    /**
     * [Method description]
     * @param {Type} param - Description
     * @returns {Type} Description
     */
    publicMethod(param) {}

    /**
     * Clean up listeners and DOM
     */
    destroy() {}
}

// State managed:
// - property1: description
// - property2: description

// Events listened to:
// - EVENT_NAME: { data structure }

// Events emitted:
// - EVENT_NAME: { data structure }
```

---

## Constraints

- **No Phaser:** Vanilla JS + DOM only
- **Event-driven:** Use GameController's event system
- **Mobile-first:** Touch optimized
- **Sprite-ready:** Support both text (mockup) and sprite (production)

---

## Success Criteria

- ✅ All 10 components fully specified
- ✅ All 4 event flows documented
- ✅ All 4 decisions made with rationale
- ✅ All 6 architecture questions answered
- ✅ Test scenarios for each component
- ✅ Example usage provided
- ✅ Zero ambiguity (implementer needs no clarification)

---

## Deliverable

Single file: **`mobile/MOBILE_INTERFACES.md`**

This document will be used by other LLMs in Phases 3C, 3D, and 4A-4D to implement the actual components.
