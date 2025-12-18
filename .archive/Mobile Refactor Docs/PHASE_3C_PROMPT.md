# Phase 3C: Touch Handler Implementation

**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 8K
**Status:** Ready after Phase 3B complete
**Branch:** mobile-core
**Dependencies:** Phase 3B (MOBILE_INTERFACES.md)

---

## Task Overview

Implement **TouchHandler.js** that detects mobile gestures and emits standardized events. This component must work across iOS Safari and Chrome Mobile, handling all touch interactions for the mobile mahjong game.

**Key Principle:** Touch Handler is a low-level utility. It knows nothing about mahjong tiles or game logic - it only detects gestures and reports them via events.

---

## Context

### What You Have

1. **Interface specification:** [mobile/MOBILE_INTERFACES.md](mobile/MOBILE_INTERFACES.md) - Read the TouchHandler section
2. **Mockup reference:** [mobile/mockup.html](mobile/mockup.html) - See what needs to be tappable
3. **Target devices:** iPhone 12 (iOS Safari), Android mid-range (Chrome Mobile)

### What You're Building

A single JavaScript class that wraps the Touch Events API (or Pointer Events API) and provides a clean, high-level gesture detection interface.

---

## Required Gestures

### 1. Tap (Single Touch)

**Definition:** Touch start → Touch end within 300ms, no movement > 10px

**Parameters:**

```javascript
{
    type: 'tap',
    element: HTMLElement,      // The element that was tapped
    coordinates: { x: 150, y: 400 },  // Touch coordinates
    timestamp: Date.now(),
    target: event.target       // Original DOM target
}
```

**Use Cases:**

- Select a tile in hand
- Tap DRAW button
- Tap SORT button
- Tap opponent's exposed tile (info)
- Tap discard pile tile (info)

---

### 2. Double-Tap (Future Enhancement - Implement but Don't Wire Up)

**Definition:** Two taps within 500ms, same location (±20px tolerance)

**Parameters:**

```javascript
{
    type: 'doubletap',
    element: HTMLElement,
    coordinates: { x: 150, y: 400 },
    timestamp: Date.now()
}
```

**Use Cases:**

- Quick discard (bypass confirmation popup)
- Quick expose tiles

**Note:** Implement the detection logic, but don't enable it yet. Future phases will wire this up.

---

### 3. Long-Press (Future Enhancement - Implement but Don't Wire Up)

**Definition:** Touch start → Hold for 500ms without moving > 10px

**Parameters:**

```javascript
{
    type: 'longpress',
    element: HTMLElement,
    coordinates: { x: 150, y: 400 },
    timestamp: Date.now()
}
```

**Use Cases:**

- Show tile details
- Context menu for tile actions

**Note:** Implement the detection logic, but don't enable it yet.

---

### 4. Swipe-Up (Future Enhancement - Not Required)

**Definition:** Touch start → Move vertically > 50px → Touch end within 300ms

**Status:** Spec this interface, but implementation optional. Low priority for initial release.

**Parameters:**

```javascript
{
    type: 'swipeup',
    element: HTMLElement,
    startCoordinates: { x: 150, y: 400 },
    endCoordinates: { x: 152, y: 280 },
    distance: 120,  // pixels
    duration: 150,  // ms
    timestamp: Date.now()
}
```

**Use Cases:**

- Expose tiles (future alternative to button press)

---

## Interface Specification

```javascript
/**
 * TouchHandler
 *
 * Detects touch gestures and emits standardized events.
 * Platform-agnostic wrapper around Touch Events API.
 */
class TouchHandler {
  /**
   * @param {HTMLElement} rootElement - The container to attach listeners to
   * @param {Object} options - Configuration options
   * @param {number} options.tapMaxDuration - Max ms for tap (default: 300)
   * @param {number} options.tapMaxMovement - Max px movement for tap (default: 10)
   * @param {number} options.doubleTapWindow - Max ms between taps for double-tap (default: 500)
   * @param {number} options.doubleTapDistance - Max px between taps for double-tap (default: 20)
   * @param {number} options.longPressDuration - Min ms for long press (default: 500)
   * @param {number} options.swipeMinDistance - Min px for swipe (default: 50)
   * @param {boolean} options.enableDoubleTap - Enable double-tap detection (default: false)
   * @param {boolean} options.enableLongPress - Enable long-press detection (default: false)
   * @param {boolean} options.enableSwipe - Enable swipe detection (default: false)
   */
  constructor(rootElement, options = {}) {}

  /**
   * Initialize touch listeners
   */
  init() {
    // Attach touchstart, touchmove, touchend listeners
    // OR attach pointerdown, pointermove, pointerup listeners
  }

  /**
   * Register a callback for a gesture type
   * @param {string} gestureType - 'tap' | 'doubletap' | 'longpress' | 'swipeup'
   * @param {Function} callback - Called with gesture data
   */
  on(gestureType, callback) {}

  /**
   * Unregister a callback
   * @param {string} gestureType
   * @param {Function} callback
   */
  off(gestureType, callback) {}

  /**
   * Clean up listeners
   */
  destroy() {}

  /**
   * Get the element at touch coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {HTMLElement}
   */
  getElementAtPoint(x, y) {
    return document.elementFromPoint(x, y);
  }
}
```

---

## Implementation Requirements

### 1. Touch Events API vs Pointer Events API

**Decision:** Choose Touch Events API for better iOS Safari support.

**Rationale:**

- Touch Events have better iOS Safari support (v3.2+)
- Pointer Events have better cross-device support but require polyfill for older iOS
- Target audience: Modern iOS (95%+) and Android (99%+)

**Implementation:**

```javascript
init() {
    this.rootElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.rootElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.rootElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.rootElement.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
}
```

**Note:** Use `{ passive: false }` to allow preventDefault() for preventing scroll during gestures.

---

### 2. State Machine for Gesture Detection

Track touch state through a simple state machine:

```javascript
// Touch states
const TOUCH_STATE = {
  IDLE: "idle",
  TOUCHING: "touching",
  MOVED: "moved",
  ENDED: "ended",
};

// Internal state
this.state = {
  current: TOUCH_STATE.IDLE,
  startTime: null,
  startX: null,
  startY: null,
  currentX: null,
  currentY: null,
  element: null,
  lastTapTime: null,
  lastTapX: null,
  lastTapY: null,
  longPressTimer: null,
};
```

**State Transitions:**

```
IDLE → (touchstart) → TOUCHING
TOUCHING → (touchmove, movement > threshold) → MOVED
TOUCHING → (touchend, duration < tapMaxDuration) → IDLE (emit 'tap')
TOUCHING → (touchend, duration >= tapMaxDuration) → IDLE (no event)
TOUCHING → (longPressDuration elapsed) → IDLE (emit 'longpress')
MOVED → (touchend) → IDLE (check for swipe)
```

---

### 3. Tap Detection Logic

```javascript
handleTouchEnd(event) {
    const touch = event.changedTouches[0];
    const duration = Date.now() - this.state.startTime;
    const deltaX = Math.abs(touch.clientX - this.state.startX);
    const deltaY = Math.abs(touch.clientY - this.state.startY);
    const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check if it's a tap
    if (duration < this.options.tapMaxDuration &&
        movement < this.options.tapMaxMovement &&
        this.state.current === TOUCH_STATE.TOUCHING) {

        // Clear long press timer
        clearTimeout(this.state.longPressTimer);

        // Emit tap event
        this.emit('tap', {
            type: 'tap',
            element: this.state.element,
            coordinates: { x: touch.clientX, y: touch.clientY },
            timestamp: Date.now(),
            target: event.target
        });

        // Check for double-tap
        if (this.options.enableDoubleTap) {
            this.checkDoubleTap(touch.clientX, touch.clientY);
        }
    }

    // Reset state
    this.resetState();
}
```

---

### 4. Double-Tap Detection Logic

```javascript
checkDoubleTap(x, y) {
    const now = Date.now();

    if (this.state.lastTapTime !== null) {
        const timeSinceLastTap = now - this.state.lastTapTime;
        const deltaX = Math.abs(x - this.state.lastTapX);
        const deltaY = Math.abs(y - this.state.lastTapY);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (timeSinceLastTap < this.options.doubleTapWindow &&
            distance < this.options.doubleTapDistance) {

            // Emit double-tap event
            this.emit('doubletap', {
                type: 'doubletap',
                element: this.state.element,
                coordinates: { x, y },
                timestamp: now
            });

            // Clear last tap to prevent triple-tap being detected as another double-tap
            this.state.lastTapTime = null;
            this.state.lastTapX = null;
            this.state.lastTapY = null;
            return;
        }
    }

    // Store this tap for potential double-tap
    this.state.lastTapTime = now;
    this.state.lastTapX = x;
    this.state.lastTapY = y;
}
```

---

### 5. Long-Press Detection Logic

```javascript
handleTouchStart(event) {
    const touch = event.touches[0];

    this.state.current = TOUCH_STATE.TOUCHING;
    this.state.startTime = Date.now();
    this.state.startX = touch.clientX;
    this.state.startY = touch.clientY;
    this.state.currentX = touch.clientX;
    this.state.currentY = touch.clientY;
    this.state.element = this.getElementAtPoint(touch.clientX, touch.clientY);

    // Set up long press timer
    if (this.options.enableLongPress) {
        this.state.longPressTimer = setTimeout(() => {
            if (this.state.current === TOUCH_STATE.TOUCHING) {
                // Check if user hasn't moved
                const movement = Math.sqrt(
                    Math.pow(this.state.currentX - this.state.startX, 2) +
                    Math.pow(this.state.currentY - this.state.startY, 2)
                );

                if (movement < this.options.tapMaxMovement) {
                    this.emit('longpress', {
                        type: 'longpress',
                        element: this.state.element,
                        coordinates: { x: this.state.startX, y: this.state.startY },
                        timestamp: Date.now()
                    });
                }
            }
        }, this.options.longPressDuration);
    }
}
```

---

### 6. Event Emitter Pattern

```javascript
class TouchHandler {
  constructor(rootElement, options = {}) {
    this.rootElement = rootElement;
    this.options = {
      tapMaxDuration: 300,
      tapMaxMovement: 10,
      doubleTapWindow: 500,
      doubleTapDistance: 20,
      longPressDuration: 500,
      swipeMinDistance: 50,
      enableDoubleTap: false,
      enableLongPress: false,
      enableSwipe: false,
      ...options,
    };
    this.listeners = {
      tap: [],
      doubletap: [],
      longpress: [],
      swipeup: [],
    };
    this.state = this.createInitialState();
  }

  on(gestureType, callback) {
    if (!this.listeners[gestureType]) {
      throw new Error(`Unknown gesture type: ${gestureType}`);
    }
    this.listeners[gestureType].push(callback);
  }

  off(gestureType, callback) {
    if (!this.listeners[gestureType]) return;
    this.listeners[gestureType] = this.listeners[gestureType].filter(
      (cb) => cb !== callback,
    );
  }

  emit(gestureType, data) {
    if (!this.listeners[gestureType]) return;
    this.listeners[gestureType].forEach((callback) => callback(data));
  }
}
```

---

## Testing Specification

### Test 1: Basic Tap Detection

```javascript
describe("TouchHandler", () => {
  it("should detect a tap gesture", (done) => {
    const handler = new TouchHandler(document.body);
    handler.init();

    handler.on("tap", (data) => {
      expect(data.type).toBe("tap");
      expect(data.coordinates.x).toBeGreaterThan(0);
      expect(data.timestamp).toBeDefined();
      done();
    });

    // Simulate touch
    const element = document.querySelector(".tile-btn");
    simulateTouchSequence(element, [
      { event: "touchstart", x: 100, y: 100, delay: 0 },
      { event: "touchend", x: 100, y: 100, delay: 100 },
    ]);
  });
});
```

### Test 2: Tap vs Movement

```javascript
it("should not emit tap if user moves > threshold", (done) => {
  const handler = new TouchHandler(document.body);
  handler.init();

  let tapEmitted = false;
  handler.on("tap", () => {
    tapEmitted = true;
  });

  simulateTouchSequence(element, [
    { event: "touchstart", x: 100, y: 100, delay: 0 },
    { event: "touchmove", x: 120, y: 100, delay: 50 }, // Moved 20px
    { event: "touchend", x: 120, y: 100, delay: 100 },
  ]);

  setTimeout(() => {
    expect(tapEmitted).toBe(false);
    done();
  }, 200);
});
```

### Test 3: Tap vs Long Duration

```javascript
it("should not emit tap if duration > threshold", (done) => {
  const handler = new TouchHandler(document.body);
  handler.init();

  let tapEmitted = false;
  handler.on("tap", () => {
    tapEmitted = true;
  });

  simulateTouchSequence(element, [
    { event: "touchstart", x: 100, y: 100, delay: 0 },
    { event: "touchend", x: 100, y: 100, delay: 400 }, // 400ms > 300ms threshold
  ]);

  setTimeout(() => {
    expect(tapEmitted).toBe(false);
    done();
  }, 500);
});
```

### Test 4: Double-Tap Detection

```javascript
it("should detect double-tap when enabled", (done) => {
  const handler = new TouchHandler(document.body, { enableDoubleTap: true });
  handler.init();

  handler.on("doubletap", (data) => {
    expect(data.type).toBe("doubletap");
    done();
  });

  simulateTouchSequence(element, [
    { event: "touchstart", x: 100, y: 100, delay: 0 },
    { event: "touchend", x: 100, y: 100, delay: 100 },
    { event: "touchstart", x: 102, y: 102, delay: 150 }, // 2px difference OK
    { event: "touchend", x: 102, y: 102, delay: 250 },
  ]);
});
```

### Test 5: Long-Press Detection

```javascript
it("should detect long-press when enabled", (done) => {
  const handler = new TouchHandler(document.body, { enableLongPress: true });
  handler.init();

  handler.on("longpress", (data) => {
    expect(data.type).toBe("longpress");
    done();
  });

  simulateTouchSequence(element, [
    { event: "touchstart", x: 100, y: 100, delay: 0 },
    { event: "touchend", x: 100, y: 100, delay: 600 }, // 600ms > 500ms threshold
  ]);
});
```

---

## Edge Cases to Handle

### 1. Multi-Touch

**Problem:** User accidentally touches screen with multiple fingers.

**Solution:**

```javascript
handleTouchStart(event) {
    // Only track first touch, ignore additional touches
    if (event.touches.length > 1) {
        this.resetState();
        return;
    }
    // ... normal logic
}
```

### 2. Touch Cancel

**Problem:** Browser cancels touch (e.g., system gesture, scroll).

**Solution:**

```javascript
handleTouchCancel(event) {
    // Clean up timers
    clearTimeout(this.state.longPressTimer);
    // Reset state
    this.resetState();
}
```

### 3. Rapid Taps

**Problem:** User taps very quickly, events overlap.

**Solution:**

- Reset state completely after each gesture
- Use timestamp checks to prevent event duplication
- Clear all timers before starting new gesture

### 4. Element Removed During Touch

**Problem:** User starts touching a tile, but it's removed from DOM before touchend.

**Solution:**

```javascript
emit(gestureType, data) {
    // Check if element still exists
    if (data.element && !document.body.contains(data.element)) {
        console.warn('Element removed during gesture, ignoring event');
        return;
    }
    // ... emit logic
}
```

---

## Browser Compatibility

### iOS Safari

- Test on iOS 14+ (primary target)
- Handle `-webkit-` prefixes if needed
- Prevent default scroll behavior during game interactions

### Chrome Mobile (Android)

- Test on Android 10+ (Chrome 90+)
- Handle Pointer Events fallback if Touch Events unavailable

### Prevent Zoom on Double-Tap

```html
<!-- In mobile/index.html -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
```

```css
/* In mobile.css */
.tile-btn,
.menu-btn,
.exposed-tile {
  touch-action: manipulation; /* Prevents double-tap zoom */
}
```

---

## Deliverables

- [ ] Create `mobile/gestures/TouchHandler.js`
- [ ] Implement tap detection
- [ ] Implement double-tap detection (disabled by default)
- [ ] Implement long-press detection (disabled by default)
- [ ] Implement event emitter pattern (on/off/emit)
- [ ] Handle edge cases (multi-touch, touch cancel, etc.)
- [ ] Add JSDoc comments for all public methods
- [ ] Create test file `mobile/gestures/TouchHandler.test.js`
- [ ] Test on iOS Safari (device or simulator)
- [ ] Test on Chrome Mobile (device or emulator)

---

## Example Usage

```javascript
// In HandRenderer.js
import { TouchHandler } from "./gestures/TouchHandler.js";

class HandRenderer {
  constructor(container, gameController) {
    this.container = container;
    this.gameController = gameController;
    this.touchHandler = new TouchHandler(this.container);
  }

  init() {
    this.touchHandler.init();

    this.touchHandler.on("tap", (data) => {
      // Check if tapped element is a tile
      if (data.element.classList.contains("tile-btn")) {
        this.handleTileTap(data);
      }
    });
  }

  handleTileTap(data) {
    const tileIndex = data.element.dataset.index;
    // Toggle selection
    // Show confirmation popup
  }

  destroy() {
    this.touchHandler.destroy();
  }
}
```

---

**Ready to Implement?** Build the TouchHandler that will power all mobile interactions!
