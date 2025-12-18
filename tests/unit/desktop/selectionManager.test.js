import { test, expect } from "@playwright/test";
import { SelectionManager } from "../../../desktop/managers/SelectionManager.js";

test.describe("SelectionManager destroy", () => {
  test("clears selections and breaks references", () => {
    const fakeHandRenderer = {};
    const sm = new SelectionManager(fakeHandRenderer, 0, null);

    const fakeTile = { selected: true };
    sm.selectedTiles.add(fakeTile);
    sm.clickHandlers.set(fakeTile, () => {});
    sm.onSelectionChanged = () => {};

    sm.destroy();

    expect(sm.selectedTiles.size).toBe(0);
    expect(sm.clickHandlers.size).toBe(0);
    expect(sm.onSelectionChanged).toBeNull();
    expect(sm.handRenderer).toBeNull();
    expect(sm.buttonManager).toBeNull();
  });
});
