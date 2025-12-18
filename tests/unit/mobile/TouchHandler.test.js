import { test, expect } from "@playwright/test";
import { JSDOM } from "jsdom";
import { TouchHandler } from "../../../mobile/gestures/TouchHandler.js";

// Set up jsdom environment for DOM globals
let dom;
let document;
let window;

test.beforeEach(() => {
  // Create a fresh JSDOM instance for each test
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost",
  });

  window = dom.window;
  document = dom.window.document;

  // Mock document.elementFromPoint (not available in jsdom)
  document.elementFromPoint = (_x, _y) => {
    // Simple mock: return the first element in the body
    return document.body.firstElementChild || document.body;
  };

  // Set globals for the test
  globalThis.window = window;
  globalThis.document = document;
});

test.afterEach(() => {
  // Clean up globals
  delete globalThis.window;
  delete globalThis.document;
});

test.describe("TouchHandler", () => {
  test("should initialize with default options", () => {
    const element = document.createElement("div");
    const handler = new TouchHandler(element);

    expect(handler.options.tapMaxDuration).toBe(300);
    expect(handler.options.tapMaxMovement).toBe(10);
    expect(handler.options.doubleTapWindow).toBe(500);
    expect(handler.options.longPressDuration).toBe(500);
    expect(handler.options.enableDoubleTap).toBe(false);
    expect(handler.options.enableLongPress).toBe(false);
  });

  test("should allow custom options", () => {
    const element = document.createElement("div");
    const handler = new TouchHandler(element, {
      tapMaxDuration: 400,
      enableDoubleTap: true,
      enableLongPress: true,
    });

    expect(handler.options.tapMaxDuration).toBe(400);
    expect(handler.options.enableDoubleTap).toBe(true);
    expect(handler.options.enableLongPress).toBe(true);
  });

  test("should detect a tap gesture", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const handler = new TouchHandler(element);
    handler.init();

    const events = [];
    handler.on("tap", (e) => events.push(e));

    // Simulate tap
    const touchStart = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    const touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });

    element.dispatchEvent(touchStart);
    element.dispatchEvent(touchEnd);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("tap");
    expect(events[0].coordinates.x).toBe(100);
    expect(events[0].coordinates.y).toBe(100);

    handler.destroy();
  });

  test("should not emit tap if user moves beyond threshold", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const handler = new TouchHandler(element);
    handler.init();

    const events = [];
    handler.on("tap", (e) => events.push(e));

    // Simulate touch with movement beyond threshold
    const touchStart = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    const touchMove = new window.TouchEvent("touchmove", {
      touches: [{ clientX: 120, clientY: 100 }],
      bubbles: true,
    });
    const touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 120, clientY: 100 }],
      bubbles: true,
    });

    element.dispatchEvent(touchStart);
    element.dispatchEvent(touchMove);
    element.dispatchEvent(touchEnd);

    expect(events.length).toBe(0);

    handler.destroy();
  });

  test("should detect a double-tap gesture when enabled", async () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const handler = new TouchHandler(element, { enableDoubleTap: true });
    handler.init();

    const events = [];
    handler.on("doubletap", (e) => events.push(e));

    // Simulate first tap
    let touchStart = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    let touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchStart);
    element.dispatchEvent(touchEnd);

    // Simulate second tap (within double-tap window)
    touchStart = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 102, clientY: 102 }],
      bubbles: true,
    });
    touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 102, clientY: 102 }],
      bubbles: true,
    });
    element.dispatchEvent(touchStart);
    element.dispatchEvent(touchEnd);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("doubletap");

    handler.destroy();
  });

  test("should detect a long-press gesture when enabled", async () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const handler = new TouchHandler(element, {
      enableLongPress: true,
      longPressDuration: 100, // Shorter for testing
    });
    handler.init();

    const events = [];
    handler.on("longpress", (e) => events.push(e));

    // Simulate long press
    const touchStart = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchStart);

    // Wait for long press duration
    await new Promise((resolve) => setTimeout(resolve, 150));

    const touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchEnd);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("longpress");

    handler.destroy();
  });

  test("should not detect long-press if user moves beyond threshold", async () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const handler = new TouchHandler(element, {
      enableLongPress: true,
      longPressDuration: 100,
    });
    handler.init();

    const events = [];
    handler.on("longpress", (e) => events.push(e));

    // Simulate touch start
    const touchStart = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchStart);

    // Move beyond threshold before long press fires
    const touchMove = new window.TouchEvent("touchmove", {
      touches: [{ clientX: 120, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchMove);

    // Wait for would-be long press duration
    await new Promise((resolve) => setTimeout(resolve, 150));

    const touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 120, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchEnd);

    expect(events.length).toBe(0);

    handler.destroy();
  });

  test("should register and call event listeners", () => {
    const element = document.createElement("div");
    const handler = new TouchHandler(element);

    const callback = test.info().project.use;
    const calls = [];
    const listener = (e) => calls.push(e);

    handler.on("tap", listener);
    handler.emit("tap", { type: "tap", test: "data" });

    expect(calls.length).toBe(1);
    expect(calls[0].type).toBe("tap");
  });

  test("should unregister event listeners with off()", () => {
    const element = document.createElement("div");
    const handler = new TouchHandler(element);

    const calls = [];
    const listener = (e) => calls.push(e);

    handler.on("tap", listener);
    handler.emit("tap", { type: "tap" });
    expect(calls.length).toBe(1);

    handler.off("tap", listener);
    handler.emit("tap", { type: "tap" });
    expect(calls.length).toBe(1); // Should still be 1, not 2
  });

  test("should throw error for unknown gesture type", () => {
    const element = document.createElement("div");
    const handler = new TouchHandler(element);

    expect(() => {
      handler.on("invalidgesture", () => {});
    }).toThrow("Unknown gesture type: invalidgesture");
  });

  test("should clean up listeners on destroy()", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const handler = new TouchHandler(element);
    handler.init();

    // Verify listeners are attached (by checking they respond)
    const events = [];
    handler.on("tap", (e) => events.push(e));

    const touchStart = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    const touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });

    element.dispatchEvent(touchStart);
    element.dispatchEvent(touchEnd);
    expect(events.length).toBe(1);

    // Destroy and verify no more events
    handler.destroy();

    element.dispatchEvent(touchStart);
    element.dispatchEvent(touchEnd);
    expect(events.length).toBe(1); // Should still be 1
  });

  test("should reset state on multi-touch", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const handler = new TouchHandler(element);
    handler.init();

    const events = [];
    handler.on("tap", (e) => events.push(e));

    // Start with one touch
    const touchStart1 = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchStart1);

    // Add second touch (should reset state)
    const touchStart2 = new window.TouchEvent("touchstart", {
      touches: [
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ],
      bubbles: true,
    });
    element.dispatchEvent(touchStart2);

    // End touch - should not emit tap
    const touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchEnd);

    expect(events.length).toBe(0);

    handler.destroy();
  });

  test("should handle touchcancel event", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);

    const handler = new TouchHandler(element);
    handler.init();

    const events = [];
    handler.on("tap", (e) => events.push(e));

    // Start touch
    const touchStart = new window.TouchEvent("touchstart", {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchStart);

    // Cancel touch
    const touchCancel = new window.TouchEvent("touchcancel", {
      bubbles: true,
    });
    element.dispatchEvent(touchCancel);

    // End touch - should not emit tap (state was reset)
    const touchEnd = new window.TouchEvent("touchend", {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true,
    });
    element.dispatchEvent(touchEnd);

    expect(events.length).toBe(0);

    handler.destroy();
  });
});
