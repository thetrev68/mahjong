/* eslint-disable no-await-in-loop */

import { test, expect } from "@playwright/test";

test.describe("Mobile Interface", () => {
    
    test.describe("Test 1: Mobile Page Load", () => {
        test("mobile game loads with correct viewport", async ({ page }) => {
            await page.goto("/mobile/");

            // Verify mobile-specific elements exist (updated IDs)
            await expect(page.locator("#hand-container")).toBeVisible();
            await expect(page.locator(".opponent-bar")).toHaveCount(3);
            await expect(page.locator("#discard-container")).toBeVisible();
            await expect(page.locator(".bottom-menu")).toBeVisible();

            // Verify desktop elements don't exist
            await expect(page.locator("#gamediv")).not.toBeVisible();
        });
    });

    test.describe("Test 2: Tile Selection via Tap", () => {
        test("tile selection via tap", async ({ page }) => {
            await page.goto("/mobile/");

            // Wait for game to start and tiles to be dealt
            await page.click("#new-game-btn");
            await page.waitForSelector(".mobile-tile");

            // Tap first tile
            const firstTile = page.locator(".mobile-tile").first();
            await firstTile.tap();

            // Verify tile is selected (has 'selected' class)
            await expect(firstTile).toHaveClass(/selected/);

            // Tap second tile
            const secondTile = page.locator(".mobile-tile").nth(1);
            await secondTile.tap();

            // Verify first tile is deselected, second is selected
            await expect(firstTile).not.toHaveClass(/selected/);
            await expect(secondTile).toHaveClass(/selected/);
        });
    });

    test.describe("Test 3: Tile Discard via Double-Tap", () => {
        test("tile discard via double-tap", async ({ page }) => {
            await page.goto("/mobile/");
            await page.click("#new-game-btn");

            // Wait for player's turn and tiles to be dealt
            await page.waitForSelector(".mobile-tile");
            await page.waitForTimeout(2000); // Wait for Charleston/dealing to complete

            // Get initial hand size
            const initialTileCount = await page.locator(".mobile-tile").count();

            // Double-tap first tile to discard
            const firstTile = page.locator(".mobile-tile").first();
            await firstTile.dblclick(); // Playwright converts to touch events

            // Wait for discard animation
            await page.waitForTimeout(500);

            // Verify tile appears in discard pile
            await expect(page.locator(".discard-tile")).toHaveCount(1);

            // Verify hand size decreased
            const newTileCount = await page.locator(".mobile-tile").count();
            expect(newTileCount).toBe(initialTileCount - 1);
        });
    });

    test.describe("Test 4: Charleston Pass Flow", () => {
        test("charleston pass flow on mobile", async ({ page }) => {
            await page.goto("/mobile/");

            // Enable settings to ensure Charleston happens
            await page.click("#mobile-settings-btn");
            await page.selectOption("#card-year-select", "2025");
            await page.uncheck("#training-mode"); // Ensure Charleston is not skipped
            await page.click("#save-settings");

            // Start game
            await page.click("#new-game-btn");
            await page.waitForSelector(".mobile-tile");

            // Wait for Charleston phase
            await page.waitForSelector("#charleston-prompt", { timeout: 10000 });

            // Select 3 tiles for Charleston pass
            const tiles = page.locator(".mobile-tile");
            await tiles.nth(0).tap();
            await tiles.nth(1).tap();
            await tiles.nth(2).tap();

            // Verify 3 tiles are selected
            const selectedTiles = page.locator(".mobile-tile.selected");
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
            await page.goto("/mobile/");

            // Wait for mobile app to load
            await page.waitForSelector("#mobile-settings-btn");

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
            await page.goto("/mobile/");
            await page.click("#new-game-btn");

            // Wait for game to start
            await page.waitForSelector(".opponent-bar");

            // Verify 3 opponent bars exist (Right, Top, Left players)
            const opponentBars = page.locator(".opponent-bar");
            await expect(opponentBars).toHaveCount(3);

            // Check initial tile counts (should be 13 each after deal)
            for (let i = 0; i < 3; i++) {
                const bar = opponentBars.nth(i);
                await expect(bar.locator(".tile-count")).toContainText("13");
            }

            // Check that one bar has "current turn" indicator
            await expect(page.locator(".opponent-bar.current-turn")).toHaveCount(1);
        });
    });

    test.describe("Test 7: Touch Handler Swipe Gesture", () => {
        test("swipe up gesture for exposing tiles", async ({ page }) => {
            await page.goto("/mobile/");
            await page.click("#new-game-btn");

            // Wait for game loop and player to have matching tiles
            await page.waitForSelector(".mobile-tile");

            // Select 3 matching tiles (assuming we have a pung)
            // This test assumes training mode with a known hand
            await page.evaluate(() => {
                localStorage.setItem("mahjong_trainingMode", "true");
                localStorage.setItem("mahjong_trainingHand", "B1,B1,B1,C2,C3,C4,D5,D6,D7,W1,W2,W3,Jo");
            });
            await page.reload();
            await page.click("#new-game-btn");
            await page.waitForSelector(".mobile-tile");

            // Select tiles for pung
            await page.locator(".mobile-tile").nth(0).tap();
            await page.locator(".mobile-tile").nth(1).tap();
            await page.locator(".mobile-tile").nth(2).tap();

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
        test("tile animations play smoothly", async ({ page }) => {
            await page.goto("/mobile/");
            await page.click("#new-game-btn");

            // Wait for tile draw animation
            await page.waitForSelector(".mobile-tile.tile-drawing", { timeout: 5000 });

            // Verify animation completes
            await page.waitForFunction(() => {
                const drawingTiles = document.querySelectorAll(".mobile-tile.tile-drawing");
                return drawingTiles.length === 0;
            }, { timeout: 3000 });

            // Discard a tile and verify discard animation
            const firstTile = page.locator(".mobile-tile").first();
            await firstTile.dblclick();

            // Check for discard animation class
            await expect(page.locator(".mobile-tile.tile-discarding")).toHaveCount(1);

            // Wait for animation to complete
            await page.waitForTimeout(500);
            await expect(page.locator(".mobile-tile.tile-discarding")).toHaveCount(0);
        });
    });

});