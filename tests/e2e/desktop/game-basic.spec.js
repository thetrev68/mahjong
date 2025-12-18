import { test, expect } from "@playwright/test";

/**
 * Wait until GameController is available on window.
 */
async function waitForGameController(page) {
  await page.waitForFunction(
    () => {
      const gc = window.gameController;
      return gc && Array.isArray(gc.players) && gc.players.length === 4;
    },
    { timeout: 15000 },
  );
}

/**
 * Utility to clear previous test subscriptions before registering new ones.
 */
async function resetTestSubscriptions(page) {
  await page.evaluate(() => {
    if (Array.isArray(window.__gcTestSubscriptions)) {
      window.__gcTestSubscriptions.forEach((unsub) => {
        try {
          unsub?.();
        } catch (error) {
          console.warn("Failed to unsubscribe test handler", error);
        }
      });
    }
    window.__gcTestSubscriptions = [];
  });
}

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
  test("should start a new game when Start Game is clicked", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for game to initialize
    await page.waitForSelector("#controldiv", { state: "visible" });
    await waitForGameController(page);

    // Verify start button is visible initially
    const startButton = page.locator("#start");
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    // Click start button
    await startButton.click();

    // Wait for game log to report that the game has started (dealing complete)
    await page.waitForFunction(
      () => {
        const log = document.querySelector("#messages");
        return log && log.value.includes("Game started!");
      },
      { timeout: 15000 },
    );

    const logText = await page.locator("#messages").inputValue();
    expect(logText).toContain("Game started!");

    // Verify each player has tiles in their hand (dealer receives 14, others 13)
    const handSizes = await page.evaluate(() => {
      if (
        !window.gameController ||
        !Array.isArray(window.gameController.players)
      ) {
        return [];
      }
      return window.gameController.players.map(
        (player) => player?.hand?.tiles?.length || 0,
      );
    });
    expect(handSizes[0]).toBeGreaterThanOrEqual(13);
    handSizes.slice(1).forEach((count) => {
      expect(count).toBeGreaterThanOrEqual(13);
    });
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
    await waitForGameController(page);
    await resetTestSubscriptions(page);

    // Set up a listener for GameController events
    await page.evaluate(() => {
      window.capturedEvents = new Set();
      const pushEvent = (eventName) => {
        window.capturedEvents.add(eventName);
      };

      const subscriptions = [
        window.gameController.on("GAME_STARTED", () =>
          pushEvent("GAME_STARTED"),
        ),
        window.gameController.on("TILES_DEALT", () => pushEvent("TILES_DEALT")),
      ];

      window.__gcTestSubscriptions.push(...subscriptions);
    });

    await page.click("#start");
    await page.waitForFunction(
      () => {
        if (!window.capturedEvents) {
          return false;
        }
        return (
          window.capturedEvents.has("GAME_STARTED") &&
          window.capturedEvents.has("TILES_DEALT")
        );
      },
      { timeout: 20000 },
    );

    // Retrieve the captured events
    const events = await page.evaluate(() => Array.from(window.capturedEvents));

    // Verify key events were emitted
    expect(events).toContain("GAME_STARTED");
    expect(events).toContain("TILES_DEALT");
  });

  test("game progresses through states", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");

    // Wait for GameController to be initialized
    await waitForGameController(page);

    // Ensure Charleston is enabled (training mode can disable it)
    await page.click("#settings");
    const trainingCheckbox = page.locator("#trainCheckbox");
    if (await trainingCheckbox.isChecked()) {
      await trainingCheckbox.uncheck();
    }
    const skipCharlestonCheckbox = page.locator("#skipCharlestonCheckbox");
    if (await skipCharlestonCheckbox.isChecked()) {
      await skipCharlestonCheckbox.uncheck();
    }
    await page.click("#settings-save");

    await page.click("#start");

    await page.waitForFunction(
      () => {
        const log = document.querySelector("#messages");
        if (!log) {
          return false;
        }
        return log.value.includes("Charleston Phase 1");
      },
      { timeout: 45000 },
    );

    const logText = await page.locator("#messages").inputValue();
    expect(logText).toContain("Charleston Phase 1");
  });
});
