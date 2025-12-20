import { debugPrint } from "../../shared/DebugUtils.js";

const gdebug = 0;

const TOUCH_STATE = {
  IDLE: "idle",
  TOUCHING: "touching",
  MOVED: "moved",
  ENDED: "ended",
};

/**
 * TouchHandler
 *
 * Detects touch gestures and emits standardized events.
 * Platform-agnostic wrapper around Touch Events API.
 */
export class TouchHandler {
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

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
  }

  createInitialState() {
    return {
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
  }

  /**
   * Initialize touch listeners
   */
  init() {
    debugPrint(gdebug, "TouchHandler initialized");
    this.rootElement.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    this.rootElement.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    this.rootElement.addEventListener("touchend", this.handleTouchEnd, {
      passive: false,
    });
    this.rootElement.addEventListener("touchcancel", this.handleTouchCancel, {
      passive: false,
    });
  }

  /**
   * Register a callback for a gesture type
   * @param {string} gestureType - 'tap' | 'doubletap' | 'longpress' | 'swipeup'
   * @param {Function} callback - Called with gesture data
   */
  on(gestureType, callback) {
    if (!this.listeners[gestureType]) {
      throw new Error(`Unknown gesture type: ${gestureType}`);
    }
    this.listeners[gestureType].push(callback);
  }

  /**
   * Unregister a callback
   * @param {string} gestureType
   * @param {Function} callback
   */
  off(gestureType, callback) {
    if (!this.listeners[gestureType]) return;
    this.listeners[gestureType] = this.listeners[gestureType].filter(
      (cb) => cb !== callback,
    );
  }

  emit(gestureType, data) {
    if (data.element && !document.body.contains(data.element)) {
      debugPrint(gdebug, "Element removed during gesture, ignoring event");
      return;
    }
    if (!this.listeners[gestureType]) return;
    this.listeners[gestureType].forEach((callback) => callback(data));
  }

  /**
   * Clean up listeners
   */
  destroy() {
    this.rootElement.removeEventListener("touchstart", this.handleTouchStart);
    this.rootElement.removeEventListener("touchmove", this.handleTouchMove);
    this.rootElement.removeEventListener("touchend", this.handleTouchEnd);
    this.rootElement.removeEventListener("touchcancel", this.handleTouchCancel);
    clearTimeout(this.state.longPressTimer);
  }

  /**
   * Get the element at touch coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {HTMLElement}
   */
  getElementAtPoint(x, y) {
    return document.elementFromPoint(x, y);
  }

  resetState() {
    clearTimeout(this.state.longPressTimer);
    this.state = this.createInitialState();
  }

  handleTouchStart(event) {
    if (event.touches.length > 1) {
      this.resetState();
      return;
    }

    const touch = event.touches[0];

    this.state.current = TOUCH_STATE.TOUCHING;
    this.state.startTime = Date.now();
    this.state.startX = touch.clientX;
    this.state.startY = touch.clientY;
    this.state.currentX = touch.clientX;
    this.state.currentY = touch.clientY;
    this.state.element = this.getElementAtPoint(touch.clientX, touch.clientY);

    if (this.options.enableLongPress) {
      this.state.longPressTimer = setTimeout(() => {
        if (this.state.current === TOUCH_STATE.TOUCHING) {
          const movement = Math.sqrt(
            Math.pow(this.state.currentX - this.state.startX, 2) +
              Math.pow(this.state.currentY - this.state.startY, 2),
          );

          if (movement < this.options.tapMaxMovement) {
            this.emit("longpress", {
              type: "longpress",
              element: this.state.element,
              coordinates: { x: this.state.startX, y: this.state.startY },
              timestamp: Date.now(),
            });
            this.resetState(); // Reset after long press to avoid conflicts
          }
        }
      }, this.options.longPressDuration);
    }
  }

  handleTouchMove(event) {
    if (this.state.current === TOUCH_STATE.IDLE) return;

    const touch = event.touches[0];
    this.state.currentX = touch.clientX;
    this.state.currentY = touch.clientY;

    const deltaX = this.state.currentX - this.state.startX;
    const deltaY = this.state.currentY - this.state.startY;
    const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (movement > this.options.tapMaxMovement) {
      this.state.current = TOUCH_STATE.MOVED;
      clearTimeout(this.state.longPressTimer);
    }
  }

  handleTouchEnd(event) {
    if (this.state.current === TOUCH_STATE.IDLE) return;

    const touch = event.changedTouches[0];
    const duration = Date.now() - this.state.startTime;
    const deltaX = Math.abs(touch.clientX - this.state.startX);
    const deltaY = Math.abs(touch.clientY - this.state.startY);
    const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    clearTimeout(this.state.longPressTimer);

    // Determine if this is a tap (selection) or drag/swipe
    if (
      this.state.current === TOUCH_STATE.TOUCHING &&
      duration < this.options.tapMaxDuration &&
      movement < this.options.tapMaxMovement
    ) {
      // It's a tap
      if (this.state.element && this.state.element.closest(".tile")) {
        this.handleTileTap(this.state.element.closest(".tile"));
      }

      this.emit("tap", {
        type: "tap",
        element: this.state.element,
        coordinates: { x: touch.clientX, y: touch.clientY },
        timestamp: Date.now(),
        target: event.target,
      });

      if (this.options.enableDoubleTap) {
        this.checkDoubleTap(touch.clientX, touch.clientY);
      } else {
        this.resetState();
      }
    } else if (deltaY > this.options.swipeMinDistance && deltaY > deltaX) {
      // Vertical swipe
      const dir = touch.clientY < this.state.startY ? "up" : "down";

      if (
        dir === "up" &&
        this.state.element &&
        this.state.element.closest(".tile")
      ) {
        this.handleTileDrag(this.state.element.closest(".tile"), deltaY);
      }

      this.emit(`swipe${dir}`, {
        type: `swipe${dir}`,
        element: this.state.element,
        distance: deltaY,
        timestamp: Date.now(),
      });
      this.resetState();
    } else if (deltaX > this.options.swipeMinDistance && deltaX > deltaY) {
      // Horizontal swipe
      const dir = touch.clientX < this.state.startX ? "left" : "right";
      this.emit(`swipe${dir}`, {
        type: `swipe${dir}`,
        element: this.state.element,
        distance: deltaX,
        timestamp: Date.now(),
      });
      this.resetState();
    } else {
      this.resetState();
    }

    // Clean up visual feedback
    document.querySelectorAll(".tile--selected").forEach((tile) => {
      tile.classList.remove("tile--selected");
    });
  }

  handleTileTap(tileElement) {
    // Don't add any classes here - HandRenderer handles selection state
    // Just emit the event for main.js to wire to HandRenderer
    const tileId = tileElement.dataset.tileId;
    this.emit("tile-touched", { tileId, element: tileElement });
  }

  handleTileDrag(tileElement, _delta) {
    // Swipe to discard
    // Only if swipe up
    this.emit("tile-swiped", {
      tileId: tileElement.dataset.tileId,
      direction: "up",
      element: tileElement,
    });
  }

  handleTouchCancel(event) {
    // Event parameter is required by the event listener but not used
    void event;
    this.resetState();
  }

  checkDoubleTap(x, y) {
    const now = Date.now();
    const lastTapTime = this.state.lastTapTime;
    const lastTapX = this.state.lastTapX;
    const lastTapY = this.state.lastTapY;

    // Preserve the current tap info before resetting state
    const currentElement = this.state.element;
    this.resetState(); // Reset state for the next interaction

    if (lastTapTime !== null) {
      const timeSinceLastTap = now - lastTapTime;
      const deltaX = Math.abs(x - lastTapX);
      const deltaY = Math.abs(y - lastTapY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (
        timeSinceLastTap < this.options.doubleTapWindow &&
        distance < this.options.doubleTapDistance
      ) {
        this.emit("doubletap", {
          type: "doubletap",
          element: currentElement,
          coordinates: { x, y },
          timestamp: now,
        });
        // Clear last tap info to prevent triple-tap issues
        return;
      }
    }

    // Store this tap for the next potential double-tap
    this.state.lastTapTime = now;
    this.state.lastTapX = x;
    this.state.lastTapY = y;
  }
}
