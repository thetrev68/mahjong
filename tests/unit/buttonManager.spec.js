/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { ButtonManager } from "../../desktop/managers/ButtonManager.js";

describe("ButtonManager", () => {
  beforeEach(() => {
    // Clean up DOM between tests
    document.body.innerHTML = "";
  });

  it("removes DOM click handlers on destroy", () => {
    const btn = document.createElement("button");
    btn.id = "button1";
    document.body.appendChild(btn);

    const bm = new ButtonManager(null, null);

    let count = 0;
    bm.registerCallback("button1", () => { count += 1; });

    // Click should trigger
    btn.dispatchEvent(new MouseEvent("click"));
    expect(count).toBe(1);

    // Destroy should remove handlers
    bm.destroy();

    // Click again - should not increment
    btn.dispatchEvent(new MouseEvent("click"));
    expect(count).toBe(1);

    // Internal listeners map cleared
    expect(bm._domListeners).toBeNull();
  });
});
