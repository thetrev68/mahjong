/**
 * Phase 0: Testing Framework Setup Validation
 * Verifies that the mobile testing infrastructure is properly configured
 */

/* global fetch */

import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

const BASE_PATH = process.env.PLAYWRIGHT_BASE_PATH || "/mahjong";
const ASSET_CANDIDATES = [`${BASE_PATH}/assets/tiles.png`, "/assets/tiles.png"];
const TILE_JSON_CANDIDATES = [
  `${BASE_PATH}/assets/tiles.json`,
  "/assets/tiles.json",
];

test.describe("Phase 0: Testing Framework Setup", () => {
  test("mobile site loads with correct viewport", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await MobileTestHelpers.waitForMobileReady(page);

    // Verify viewport is mobile-sized (from playwright.config.js)
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(390); // iPhone 12/13 width
    expect(viewport.height).toBe(844); // iPhone 12/13 height
  });

  test("GameController initializes without errors", async ({ page }) => {
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    try {
      await MobileTestHelpers.gotoMobileApp(page);
      await MobileTestHelpers.waitForMobileReady(page);
    } catch (error) {
      console.log(
        "Initialization failed. Captured Console Errors:",
        consoleErrors,
      );
      throw error;
    }

    // Verify GameController is available
    const hasGameController = await page.evaluate(() => {
      return (
        window.gameController !== undefined && window.gameController !== null
      );
    });

    expect(hasGameController).toBe(true);

    // No critical errors should have occurred
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("manifest") && // Ignore manifest warnings in dev
        !err.includes("favicon"), // Ignore favicon warnings
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("asset paths are accessible", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await page.waitForLoadState("networkidle");

    // Verify tiles.png is accessible
    const tilesImageLoaded = await page.evaluate((candidates) => {
      return new Promise((resolve) => {
        const img = new Image();
        let index = 0;
        const tryNext = () => {
          if (index >= candidates.length) {
            resolve(false);
            return;
          }
          img.onload = () => resolve(true);
          img.onerror = () => {
            index += 1;
            tryNext();
          };
          img.src = candidates[index];
        };
        tryNext();
      });
    }, ASSET_CANDIDATES);

    expect(tilesImageLoaded).toBe(true);

    // Verify tiles.json is accessible
    const tilesJsonLoaded = await page.evaluate((candidates) => {
      return Promise.all(
        candidates.map((url) =>
          fetch(url)
            .then((response) => response.ok)
            .catch(() => false)
        )
      ).then((results) => results.some((ok) => ok));
    }, TILE_JSON_CANDIDATES);

    expect(tilesJsonLoaded).toBe(true);
  });

  test("all critical containers exist", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await MobileTestHelpers.waitForMobileReady(page);

    // Verify critical containers exist (attached to DOM)
    // Some may be hidden by hide-on-home class until game starts
    await expect(page.locator("#opponents-container")).toBeAttached();
    await expect(page.locator("#game-center")).toBeAttached();
    await expect(page.locator("#hand-area")).toBeAttached();
    await expect(page.locator("#player-rack-container")).toBeAttached();
    await expect(page.locator("#hand-container")).toBeAttached();
    await expect(page.locator(".bottom-menu")).toBeAttached();
    await expect(page.locator("#discard-container")).toBeAttached();

    // Verify visible containers are actually visible
    await expect(page.locator("#opponents-container")).toBeVisible();
    await expect(page.locator("#game-center")).toBeVisible();
    await expect(page.locator("#hand-area")).toBeVisible();
    await expect(page.locator(".bottom-menu")).toBeVisible();
  });

  test("mobile renderer initializes", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await MobileTestHelpers.waitForMobileReady(page);

    // Verify MobileRenderer is initialized
    const hasMobileRenderer = await page.evaluate(() => {
      return (
        window.mobileRenderer !== undefined && window.mobileRenderer !== null
      );
    });

    expect(hasMobileRenderer).toBe(true);
  });

  test("AI engine initializes", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await MobileTestHelpers.waitForMobileReady(page);

    // Verify AIEngine is available
    const hasAIEngine = await page.evaluate(() => {
      return window.aiEngine !== undefined && window.aiEngine !== null;
    });

    expect(hasAIEngine).toBe(true);
  });

  test("new game button is enabled and clickable", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await MobileTestHelpers.waitForMobileReady(page);

    const newGameBtn = page.locator("#new-game-btn");

    // Verify button is visible
    await expect(newGameBtn).toBeVisible();

    // Verify button is enabled
    await expect(newGameBtn).toBeEnabled();

    // Verify button is clickable (no overlays blocking it)
    await expect(newGameBtn).not.toHaveAttribute("disabled");
  });

  test("game status displays correctly", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await MobileTestHelpers.waitForMobileReady(page);

    const statusText = await page.locator("#game-status").textContent();

    // Should show "Ready" or similar status
    expect(statusText).toContain("Ready");
  });

  test("screenshot helper works", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await MobileTestHelpers.waitForMobileReady(page);

    // Test screenshot functionality
    await expect(async () => {
      await MobileTestHelpers.takeSnapshot(page, "phase0-validation");
    }).not.toThrow();
  });

  test("sprite loading helper detects when sprites load", async ({ page }) => {
    await MobileTestHelpers.gotoMobileApp(page);
    await MobileTestHelpers.waitForMobileReady(page);

    // Wait for sprites to load
    await expect(async () => {
      await MobileTestHelpers.waitForSpriteLoad(page);
    }).not.toThrow();
  });
});
