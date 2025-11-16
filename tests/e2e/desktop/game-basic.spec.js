import { test, expect } from "@playwright/test";

/**
 * Basic tests for American Mahjong game
 * Tests fundamental game loading and UI interactions
 */

test.describe("Game Initialization", () => {
  test("should load the game page successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for game to initialize
    await page.waitForSelector("#controldiv", { state: "visible" });

    // Check for main game container
    await expect(page.locator("#parentdiv")).toBeVisible();

    // Check for start button
    await expect(page.locator("#start")).toBeVisible();
  });

  test("should show game controls", async ({ page }) => {
    await page.goto("/");

    // Wait for game to initialize
    await page.waitForSelector("#controldiv", { state: "visible" });

    // Check for main control buttons (sort buttons are hidden initially)
    await expect(page.locator("#settings")).toBeVisible();
    await expect(page.locator("#start")).toBeVisible();
  });
});

test.describe("Game Start", () => {
  test("should start a new game when Start Game is clicked", async ({ page }) => {
    await page.goto("/");

    // Wait for game to initialize
    await page.waitForSelector("#controldiv", { state: "visible" });
    await page.waitForFunction(() => window.gameController !== undefined, { timeout: 10000 });

    // Verify start button is visible initially
    const startButton = page.locator("#start");
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    // Click start button
    await startButton.click();

    // Wait for game to actually start by checking GameController state
    await page.waitForFunction(() => {
      return window.gameController &&
             window.gameController.currentState !== "INIT" &&
             window.gameController.currentState !== "START";
    }, { timeout: 5000 });

    // Verify game started - check that we're in a game state
    const gameState = await page.evaluate(() => window.gameController.currentState);
    expect(gameState).not.toBe("INIT");
    expect(gameState).not.toBe("START");
  });
});

test.describe("Settings Panel", () => {
  test("should open and close settings overlay", async ({ page }) => {
    await page.goto("/");

    // Wait for game to initialize
    await page.waitForSelector("#controldiv", { state: "visible" });

    // Open settings
    await page.click("#settings");
    await expect(page.locator("#settings-overlay")).toBeVisible();

    // Close settings
    await page.click("#settings-cancel");
    await expect(page.locator("#settings-overlay")).toBeHidden();
  });

  test("should toggle training mode", async ({ page }) => {
    await page.goto("/");

    // Wait for game to initialize
    await page.waitForSelector("#controldiv", { state: "visible" });

    // Open settings
    await page.click("#settings");

    // Check initial state
    const initialState = await page.isChecked("#trainCheckbox");

    // Toggle training mode
    await page.click("#trainCheckbox");

    // Verify it changed
    const newState = await page.isChecked("#trainCheckbox");
    expect(newState).toBe(!initialState);
  });
});

test.describe("UI Elements", () => {
  test("should display game log area", async ({ page }) => {
    await page.goto("/");

    // Check that game log is visible
    await expect(page.locator("#messages")).toBeVisible();
  });

  test("should display hint section", async ({ page }) => {
    await page.goto("/");

    // Check that hint toggle button is visible
    await expect(page.locator("#hint-toggle")).toBeVisible();
  });
});

test.describe("Game Logic", () => {
  test("desktop game has no console errors", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.click("#start");
    await page.waitForTimeout(5000); // Let game run

    expect(errors).toEqual([]);
  });

  test("GameController emits events", async ({ page }) => {
    await page.goto("/");

    // Wait for GameController to be initialized
    await page.waitForFunction(() => window.gameController !== undefined, { timeout: 10000 });

    // Set up a listener for GameController events
    await page.evaluate(() => {
      window.capturedEvents = [];
      window.gameController.on("GAME_STARTED", () => {
        window.capturedEvents.push("GAME_STARTED");
      });
      window.gameController.on("TILES_DEALT", () => {
        window.capturedEvents.push("TILES_DEALT");
      });
    });

    await page.click("#start");
    await page.waitForTimeout(3000);

    // Retrieve the captured events
    const events = await page.evaluate(() => window.capturedEvents);

    // Verify key events were emitted
    expect(events).toContain("GAME_STARTED");
    expect(events).toContain("TILES_DEALT");
  });

  test("game progresses through states", async ({ page }) => {
    await page.goto("/");

    // Wait for GameController to be initialized
    await page.waitForFunction(() => window.gameController !== undefined, { timeout: 10000 });

    // Set up a listener for state changes
    await page.evaluate(() => {
      window.capturedStates = [];
      window.gameController.on("STATE_CHANGED", (data) => {
        window.capturedStates.push(data.newState);
      });
    });

    await page.click("#start");

    // Wait for a few seconds to allow the game to progress
    await page.waitForTimeout(5000);

    // Retrieve the captured states
    const states = await page.evaluate(() => window.capturedStates);

    // Check that the game has progressed through several states
    expect(states).toContain("DEAL");
    expect(states).toContain("CHARLESTON1");
    expect(states).toContain("LOOP_PICK_FROM_WALL");
  });
});
