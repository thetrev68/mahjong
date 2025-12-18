/* eslint-disable no-await-in-loop */

import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

const HAND_TILE_SELECTOR = "#hand-container button";
const BASE_PATH = process.env.PLAYWRIGHT_BASE_PATH || "/mahjong";
const MOBILE_HOME = `${BASE_PATH}/mobile/?playwright=true`;
const MOBILE_SKIP_CHARLESTON = `${BASE_PATH}/mobile/?skipCharleston=true&playwright=true`;

test.describe("Mobile Interface", () => {
  test.describe("Test 1: Mobile Page Load", () => {
    test("mobile game loads with correct viewport", async ({ page }) => {
      await MobileTestHelpers.gotoMobileApp(page);

      // Wait for mobile renderer to initialize
      await MobileTestHelpers.waitForMobileReady(page);

      // Verify mobile-specific elements exist and are attached to DOM
      // Hand container is hidden before game starts, check it's attached
      await expect(page.locator("#hand-container")).toBeAttached();
      // Opponent containers should be visible
      await expect(page.locator("#opponent-left")).toBeVisible();
      await expect(page.locator("#opponent-top")).toBeVisible();
      await expect(page.locator("#opponent-right")).toBeVisible();
      // Discard container should be attached
      await expect(page.locator("#discard-container")).toBeAttached();
      // Bottom menu should be visible
      await expect(page.locator(".bottom-menu")).toBeVisible();

      // Verify desktop elements don't exist
      await expect(page.locator("#gamediv")).not.toBeVisible();
    });
  });

  test.describe("Test 2: Tile Selection via Tap", () => {
    test("tile selection via tap", async ({ page }) => {
      await MobileTestHelpers.gotoMobileApp(page);

      // Wait for mobile app to be ready
      await MobileTestHelpers.waitForMobileReady(page);

      // Wait for game to start and tiles to be dealt
      await page.click("#new-game-btn");
      await page.waitForSelector(HAND_TILE_SELECTOR);

      // Tap first tile
      const firstTile = page.locator(HAND_TILE_SELECTOR).first();
      await firstTile.click();

      // Verify tile is selected (has 'selected' class)
      await expect(firstTile).toHaveClass(/selected/);

      // Tap second tile
      const secondTile = page.locator(HAND_TILE_SELECTOR).nth(1);
      await secondTile.click();

      // Verify both tiles are selected (multi-select supported)
      await expect(firstTile).toHaveClass(/selected/);
      await expect(secondTile).toHaveClass(/selected/);
    });
  });

  test.describe("Test 3: Tile Discard via Double-Tap", () => {
    test("tile discard via double-tap", async ({ page }) => {
      await MobileTestHelpers.gotoMobileApp(page);

      // Wait for mobile app to be ready
      await MobileTestHelpers.waitForMobileReady(page);

      // Start game with Charleston skipped for simpler testing
      await page.goto(MOBILE_SKIP_CHARLESTON);
      await MobileTestHelpers.waitForMobileReady(page);
      await page.click("#new-game-btn");

      // Wait for player's turn and tiles to be dealt
      await page.waitForSelector(HAND_TILE_SELECTOR);
      // Wait for dealing animation to complete (home page + dealing)
      await page.waitForTimeout(3000);

      // Get initial hand size
      const initialTileCount = await page.locator(HAND_TILE_SELECTOR).count();

      // Double-tap first tile to discard
      const firstTile = page.locator(HAND_TILE_SELECTOR).first();
      await firstTile.dblclick(); // Playwright converts to touch events

      // Wait for discard animation
      await page.waitForTimeout(1000);

      // Verify tile appears in discard pile
      await expect(page.locator(".discard-tile")).toHaveCount(1);

      // Verify hand size decreased
      const newTileCount = await page.locator(HAND_TILE_SELECTOR).count();
      expect(newTileCount).toBe(initialTileCount - 1);
    });
  });

  test.describe("Test 4: Charleston Pass Flow", () => {
    test("charleston pass flow on mobile", async ({ page }) => {
      await MobileTestHelpers.gotoMobileApp(page);

      // Wait for mobile app to be ready
      await MobileTestHelpers.waitForMobileReady(page);

      // Enable settings to ensure Charleston happens
      await page.click("#mobile-settings-btn");
      await page.selectOption("#card-year-select", "2025");
      await page.uncheck("#training-mode"); // Ensure Charleston is not skipped
      await page.click("#save-settings");

      // Start game
      await page.click("#new-game-btn");
      await page.waitForSelector(HAND_TILE_SELECTOR);

      // Wait for Charleston phase
      await page.waitForSelector("#charleston-prompt", { timeout: 10000 });

      // Select 3 tiles for Charleston pass
      const tiles = page.locator(HAND_TILE_SELECTOR);
      await tiles.nth(0).tap();
      await tiles.nth(1).tap();
      await tiles.nth(2).tap();

      // Verify 3 tiles are selected
      const selectedTiles = page.locator(`${HAND_TILE_SELECTOR}.selected`);
      await expect(selectedTiles).toHaveCount(3);

      // Click pass button
      await page.click("#charleston-pass-button");

      // Wait for next Charleston phase or game loop
      await page.waitForFunction(() => {
        const prompt = document.getElementById("charleston-prompt");
        return !prompt || prompt.style.display === "none";
      });
    });
  });

  test.describe("Test 5: Settings Save/Load", () => {
    test("settings persist across page reloads", async ({ page }) => {
      await MobileTestHelpers.gotoMobileApp(page);

      // Wait for mobile app to be ready
      await MobileTestHelpers.waitForMobileReady(page);

      // Open settings
      await page.click("#mobile-settings-btn");

      // Wait for settings sheet to appear
      await page.waitForSelector("#settings-sheet");

      // Change settings
      await page.selectOption("#mobile-year", "2020");
      await page.selectOption("#mobile-difficulty", "hard");
      await page.fill("#mobile-bgm-volume", "50");
      await page.check("#mobile-blank-tiles");

      // Save settings
      await page.click("#mobile-settings-save");

      // Reload page
      await page.reload();

      // Wait for mobile app to load again
      await page.waitForSelector("#mobile-settings-btn");

      // Open settings again
      await page.click("#mobile-settings-btn");

      // Wait for settings sheet to appear
      await page.waitForSelector("#settings-sheet");

      // Verify settings persisted
      await expect(page.locator("#mobile-year")).toHaveValue("2020");
      await expect(page.locator("#mobile-difficulty")).toHaveValue("hard");
      await expect(page.locator("#mobile-bgm-volume")).toHaveValue("50");
      await expect(page.locator("#mobile-blank-tiles")).toBeChecked();
    });
  });

  test.describe("Test 6: Opponent Bar Updates", () => {
    test("opponent bars update during game", async ({ page }) => {
      await MobileTestHelpers.gotoMobileApp(page);

      // Wait for mobile app to be ready
      await MobileTestHelpers.waitForMobileReady(page);

      await page.click("#new-game-btn");

      // Wait for game to start
      await page.waitForSelector("#opponents-container");

      const opponentSelectors = [
        "#opponent-left",
        "#opponent-top",
        "#opponent-right",
      ];
      for (const selector of opponentSelectors) {
        await expect(page.locator(selector)).toBeVisible();
      }

      // Check initial tile counts (should be 13 each after deal)
      for (const selector of opponentSelectors) {
        const bar = page.locator(selector);
        await expect(bar.locator(".tile-count")).toHaveText(/tiles/i, {
          timeout: 15000,
        });
      }

      await expect(page.locator(".opponent-bar .tile-count")).toHaveCount(3);
    });
  });

  test.describe("Test 7: Touch Handler Swipe Gesture", () => {
    test("swipe up gesture for exposing tiles", async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== "mobile",
        "Swipe gesture requires touch-enabled mobile project",
      );
      await MobileTestHelpers.gotoMobileApp(page);

      // Wait for mobile app to be ready
      await MobileTestHelpers.waitForMobileReady(page);

      await page.click("#new-game-btn");

      // Wait for game loop and player to have matching tiles
      await page.waitForSelector(HAND_TILE_SELECTOR);

      // Select 3 matching tiles (assuming we have a pung)
      // This test assumes training mode with a known hand
      await page.evaluate(() => {
        localStorage.setItem("mahjong_trainingMode", "true");
        localStorage.setItem(
          "mahjong_trainingHand",
          "B1,B1,B1,C2,C3,C4,D5,D6,D7,W1,W2,W3,Jo",
        );
      });
      await page.reload();
      await page.click("#new-game-btn");
      await page.waitForSelector(HAND_TILE_SELECTOR);

      // Select tiles for pung
      await page.locator(HAND_TILE_SELECTOR).nth(0).click();
      await page.locator(HAND_TILE_SELECTOR).nth(1).click();
      await page.locator(HAND_TILE_SELECTOR).nth(2).click();

      // Perform swipe-up gesture (expose tiles)
      const handContainer = page.locator("#mobile-hand-container");
      const box = await handContainer.boundingBox();
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height - 20;
      const endY = box.y + 20;

      // Simulate touch swipe gesture
      await page.touchscreen.down({ x: startX, y: startY });
      await page.touchscreen.move({ x: startX, y: startY - 50 }); // Move up halfway
      await page.touchscreen.move({ x: startX, y: endY }); // Move to final position
      await page.touchscreen.up();

      // Verify exposure was created
      await page.waitForSelector(".exposure-icon");
      await expect(page.locator(".exposure-icon")).toHaveCount(1);
    });
  });

  test.describe("Test 8: Mobile Animations", () => {
    test("tile animations controller toggles classes", async ({ page }) => {
      await MobileTestHelpers.gotoMobileApp(page);
      await MobileTestHelpers.waitForMobileReady(page);

      const result = await page.evaluate(async () => {
        const controller = window.mobileRenderer?.animationController;
        if (!controller) {
          return { classApplied: false, classStillPresent: false };
        }
        const tile = document.createElement("div");
        tile.className = "mobile-tile";
        document.body.appendChild(tile);

        let classApplied = false;
        const observer = new MutationObserver(() => {
          if (tile.classList.contains("tile-drawing")) {
            classApplied = true;
          }
        });
        observer.observe(tile, {
          attributes: true,
          attributeFilter: ["class"],
        });

        await controller.animateTileDraw(tile, { x: 0, y: 0 }, { x: 0, y: 0 });
        observer.disconnect();

        const classStillPresent = tile.classList.contains("tile-drawing");
        tile.remove();

        return { classApplied, classStillPresent };
      });

      expect(result.classApplied).toBe(true);
      expect(result.classStillPresent).toBe(false);
    });
  });

  test.describe("Test 9: Training Mode Settings", () => {
    test("training mode settings are available and functional", async ({
      page,
    }) => {
      await MobileTestHelpers.gotoMobileApp(page);
      await MobileTestHelpers.waitForMobileReady(page);

      // Open settings
      await page.click("#mobile-settings-btn");
      await page.waitForSelector("#settings-sheet.open", { timeout: 3000 });

      // Check that training mode checkbox exists
      const trainingCheckbox = page.locator("#mobile-training-mode");
      await expect(trainingCheckbox).toBeVisible();

      // Enable training mode
      await trainingCheckbox.check();
      await page.waitForSelector("#mobile-training-controls:visible", {
        timeout: 1000,
      });

      // Verify hand selector is visible and populated
      const handSelector = page.locator("#mobile-training-hand");
      await expect(handSelector).toBeVisible();

      // Check that hand selector has options (should be populated from card patterns)
      const optionCount = await handSelector.locator("option").count();
      expect(optionCount).toBeGreaterThan(1); // Should have "Select a hand..." plus actual patterns

      // Check that there are optgroups for categories
      const optgroupCount = await handSelector.locator("optgroup").count();
      expect(optgroupCount).toBeGreaterThan(0);

      // Verify tile count selector is visible
      const tileCountSelector = page.locator("#mobile-training-tiles");
      await expect(tileCountSelector).toBeVisible();

      // Select a specific hand
      await handSelector.selectOption({ index: 1 }); // Select first actual hand (not the placeholder)
      const selectedValue = await handSelector.inputValue();
      expect(selectedValue).not.toBe(""); // Should not be empty

      // Select tile count
      await tileCountSelector.selectOption("10");

      // Save settings
      await page.click("#mobile-settings-save");
      await page.waitForSelector("#settings-sheet:not(.open)", {
        timeout: 1000,
      });

      // Verify settings were saved
      const savedSettings = await page.evaluate(() => {
        return {
          trainingMode: localStorage.getItem("mahjong_trainingMode"),
          trainingHand: localStorage.getItem("mahjong_trainingHand"),
          trainingTileCount: localStorage.getItem("mahjong_trainingTileCount"),
        };
      });

      expect(savedSettings.trainingMode).toBe("true");
      expect(savedSettings.trainingHand).not.toBe("");
      expect(savedSettings.trainingHand).not.toBe(null);
      expect(savedSettings.trainingTileCount).toBe("10");
    });

    test("training mode deals correct number of tiles", async ({ page }) => {
      await MobileTestHelpers.gotoMobileApp(page);
      await MobileTestHelpers.waitForMobileReady(page);

      // Configure training mode via localStorage before starting game
      await page.evaluate(() => {
        localStorage.setItem("mahjong_trainingMode", "true");
        // Get first available hand pattern (will be set in settings)
        localStorage.setItem("mahjong_trainingTileCount", "11");
      });

      // Reload to pick up settings
      await page.reload();
      await MobileTestHelpers.waitForMobileReady(page);

      // Open settings and select a hand pattern
      await page.click("#mobile-settings-btn");
      await page.waitForSelector("#settings-sheet.open");
      await page.locator("#mobile-training-mode").check();
      await page.waitForSelector("#mobile-training-controls:visible");

      // Select first available hand
      await page.locator("#mobile-training-hand").selectOption({ index: 1 });
      await page.locator("#mobile-training-tiles").selectOption("11");
      await page.click("#mobile-settings-save");
      await page.waitForSelector("#settings-sheet:not(.open)");

      // Start game
      await page.click("#new-game-btn");

      // Wait for tiles to be dealt
      await page.waitForSelector(HAND_TILE_SELECTOR, { timeout: 20000 });

      // Count tiles in hand
      const tileCount = await page.locator(HAND_TILE_SELECTOR).count();

      // Should have exactly 11 tiles (training mode with 11 tiles selected)
      expect(tileCount).toBe(11);
    });
  });
});
