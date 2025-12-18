import { describe, it, expect } from "vitest";
import { GameController } from "../../core/GameController.js";
import { BaseAdapter } from "../../shared/BaseAdapter.js";

describe("BaseAdapter teardown", () => {
  it("registers event listeners and unsubscribes them on destroy", () => {
    const gc = new GameController();

    class FakeAdapter extends BaseAdapter {
      constructor(gc) {
        super(gc);
        this.registerEventHandlers({
          GAME_STARTED: () => {},
          TILES_DEALT: () => {},
        });
      }
    }

    const adapter = new FakeAdapter(gc);

    // EventEmitter stores listeners in a Map - ensure expected listeners exist
    expect(gc.listeners.get("GAME_STARTED")).toBeDefined();
    expect(gc.listeners.get("TILES_DEALT")).toBeDefined();

    // Destroy adapter and ensure those listeners are removed
    adapter.destroy();

    expect(gc.listeners.has("GAME_STARTED")).toBe(false);
    expect(gc.listeners.has("TILES_DEALT")).toBe(false);
  });
});
