import { test, expect } from "@playwright/test";

/**
 * Basic tests for American Mahjong game
 * Tests fundamental game loading and UI interactions
 */

test.describe("Game Initialization", () => {
  test("should load the game page successfully", async ({ page }) => {
    await page.goto("/");

    // Check for main game container
    await expect(page.locator("#game-container")).toBeVisible();

    // Check for start button
    await expect(page.locator("#start-button")).toBeVisible();
  });

  test("should show game controls", async ({ page }) => {
    await page.goto("/");

    // Check for main control buttons
    await expect(page.locator("#settings-button")).toBeVisible();
    await expect(page.locator("#card-button")).toBeVisible();
    await expect(page.locator("#log-button")).toBeVisible();
  });
});

test.describe("Game Start", () => {
  test("should start a new game when Start Game is clicked", async ({ page }) => {
    await page.goto("/");

    // Click start button
    await page.click("#start-button");

    // Wait for game to initialize
    await page.waitForTimeout(1000);

    // Check if game state has changed (tiles should be visible)
    // This is a basic check - you'll want to add more specific assertions
    const gameState = await page.evaluate(() => {
      return window.game?.scene?.scenes[0]?.gameLogic?.table?.state;
    });

    expect(gameState).toBeDefined();
  });
});

test.describe("Settings Panel", () => {
  test("should open and close settings overlay", async ({ page }) => {
    await page.goto("/");

    // Open settings
    await page.click("#settings-button");
    await expect(page.locator("#settings-overlay")).toBeVisible();

    // Close settings
    await page.click("#close-settings");
    await expect(page.locator("#settings-overlay")).toBeHidden();
  });

  test("should toggle training mode", async ({ page }) => {
    await page.goto("/");

    // Open settings
    await page.click("#settings-button");

    // Check initial state
    const initialState = await page.isChecked("#training-mode");

    // Toggle training mode
    await page.click("#training-mode");

    // Verify it changed
    const newState = await page.isChecked("#training-mode");
    expect(newState).toBe(!initialState);
  });
});

test.describe("Game Log", () => {
  test("should open and close game log", async ({ page }) => {
    await page.goto("/");

    // Open log
    await page.click("#log-button");
    await expect(page.locator("#log-overlay")).toBeVisible();

    // Close log
    await page.click("#close-log");
    await expect(page.locator("#log-overlay")).toBeHidden();
  });
});

test.describe("Card Display", () => {
  test("should open and close card display", async ({ page }) => {
    await page.goto("/");

    // Open card
    await page.click("#card-button");
    await expect(page.locator("#card-overlay")).toBeVisible();

    // Close card
    await page.click("#close-card");
    await expect(page.locator("#card-overlay")).toBeHidden();
  });
});
