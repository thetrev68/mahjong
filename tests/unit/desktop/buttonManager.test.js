import { test, expect } from "@playwright/test";
import { JSDOM } from "jsdom";
import { ButtonManager } from "../../../desktop/managers/ButtonManager.js";

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

  // Set globals for the test
  globalThis.window = window;
  globalThis.document = document;
  globalThis.MouseEvent = window.MouseEvent;
});

test.afterEach(() => {
  // Clean up globals
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.MouseEvent;
});

test.describe("ButtonManager", () => {
  test("removes DOM click handlers on destroy", () => {
    const btn = document.createElement("button");
    btn.id = "button1";
    document.body.appendChild(btn);

    const bm = new ButtonManager(null, null);

    let count = 0;
    bm.registerCallback("button1", () => {
      count += 1;
    });

    // Click should trigger
    btn.dispatchEvent(new window.MouseEvent("click"));
    expect(count).toBe(1);

    // Destroy should remove handlers
    bm.destroy();

    // Click again - should not increment
    btn.dispatchEvent(new window.MouseEvent("click"));
    expect(count).toBe(1);

    // Internal listeners map cleared
    expect(bm._domListeners).toBeNull();
  });
});
