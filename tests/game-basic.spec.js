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

    // Verify start button is visible initially
    const startButton = page.locator("#start");
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();

    // Click start button
    await startButton.click();

    // Wait for the game to hide the start button (proof that game started)
    await page.waitForTimeout(500);

    // Verify the button is now hidden (game successfully started)
    await expect(startButton).toBeHidden();
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
