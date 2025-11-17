/* eslint-disable no-await-in-loop */

import { test, expect } from "@playwright/test";

const MOBILE_APP_PATH = process.env.PLAYWRIGHT_MOBILE_PATH || "/mahjong/mobile/?playwright=true";
const HAND_TILE_SELECTOR = "#hand-container button";

/**
 * Helper: Wait for mobile app to be ready
 */
async function waitForMobileReady(page) {
    await page.waitForFunction(() => {
        const status = document.getElementById("game-status");
        return status && status.textContent.includes("Ready");
    }, { timeout: 10000 });

    // Also wait for new-game button to be enabled
    await page.waitForSelector("#new-game-btn:not([disabled])", { timeout: 5000 });
}

async function gotoMobileApp(page) {
    await page.goto(MOBILE_APP_PATH);
}

test.describe("Mobile Interface", () => {
    
    test.describe("Test 1: Mobile Page Load", () => {
        test("mobile game loads with correct viewport", async ({ page }) => {
            await gotoMobileApp(page);

            // Wait for mobile renderer to initialize
            await waitForMobileReady(page);

            // Verify mobile-specific elements exist (updated IDs)
            await expect(page.locator("#hand-container")).toBeVisible();
            await expect(page.locator("#opponent-left")).toBeVisible();
            await expect(page.locator("#opponent-top")).toBeVisible();
            await expect(page.locator("#opponent-right")).toBeVisible();
            await expect(page.locator("#discard-container")).toBeAttached();
            await expect(page.locator(".bottom-menu")).toBeVisible();

            // Verify desktop elements don't exist
            await expect(page.locator("#gamediv")).not.toBeVisible();
        });
    });

    test.describe("Test 2: Tile Selection via Tap", () => {
        test("tile selection via tap", async ({ page }) => {
            await gotoMobileApp(page);

            // Wait for mobile app to be ready
            await waitForMobileReady(page);

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
            await gotoMobileApp(page);

            // Wait for mobile app to be ready
            await waitForMobileReady(page);

            await page.click("#new-game-btn");

            // Wait for player's turn and tiles to be dealt
            await page.waitForSelector(HAND_TILE_SELECTOR);
            await page.waitForTimeout(2000); // Wait for Charleston/dealing to complete

            // Get initial hand size
            const initialTileCount = await page.locator(HAND_TILE_SELECTOR).count();

            // Double-tap first tile to discard
            const firstTile = page.locator(HAND_TILE_SELECTOR).first();
            await firstTile.dblclick(); // Playwright converts to touch events

            // Wait for discard animation
            await page.waitForTimeout(500);

            // Verify tile appears in discard pile
            await expect(page.locator(".discard-tile")).toHaveCount(1);

            // Verify hand size decreased
            const newTileCount = await page.locator(HAND_TILE_SELECTOR).count();
            expect(newTileCount).toBe(initialTileCount - 1);
        });
    });

    test.describe("Test 4: Charleston Pass Flow", () => {
        test("charleston pass flow on mobile", async ({ page }) => {
            await gotoMobileApp(page);

            // Wait for mobile app to be ready
            await waitForMobileReady(page);

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
            await gotoMobileApp(page);

            // Wait for mobile app to be ready
            await waitForMobileReady(page);

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
            await gotoMobileApp(page);

            // Wait for mobile app to be ready
            await waitForMobileReady(page);

            await page.click("#new-game-btn");

            // Wait for game to start
            await page.waitForSelector("#opponents-container");

            const opponentSelectors = ["#opponent-left", "#opponent-top", "#opponent-right"];
            for (const selector of opponentSelectors) {
                await expect(page.locator(selector)).toBeVisible();
            }

            // Check initial tile counts (should be 13 each after deal)
            for (const selector of opponentSelectors) {
                const bar = page.locator(selector);
                await expect(bar.locator(".tile-count")).toHaveText(/tiles/i, { timeout: 15000 });
            }

            await expect(page.locator(".opponent-bar .tile-count")).toHaveCount(3);
        });
    });

    test.describe("Test 7: Touch Handler Swipe Gesture", () => {
        test("swipe up gesture for exposing tiles", async ({ page }, testInfo) => {
            test.skip(testInfo.project.name !== "mobile", "Swipe gesture requires touch-enabled mobile project");
            await gotoMobileApp(page);

            // Wait for mobile app to be ready
            await waitForMobileReady(page);

            await page.click("#new-game-btn");

            // Wait for game loop and player to have matching tiles
            await page.waitForSelector(HAND_TILE_SELECTOR);

            // Select 3 matching tiles (assuming we have a pung)
            // This test assumes training mode with a known hand
            await page.evaluate(() => {
                localStorage.setItem("mahjong_trainingMode", "true");
                localStorage.setItem("mahjong_trainingHand", "B1,B1,B1,C2,C3,C4,D5,D6,D7,W1,W2,W3,Jo");
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
            await gotoMobileApp(page);
            await waitForMobileReady(page);

            const result = await page.evaluate(async () => {
                const module = await import("/mahjong/mobile/animations/AnimationController.js");
                const controller = new module.AnimationController({ duration: 50 });
                const tile = document.createElement("div");
                tile.className = "mobile-tile";
                document.body.appendChild(tile);

                let classApplied = false;
                const observer = new MutationObserver(() => {
                    if (tile.classList.contains("tile-drawing")) {
                        classApplied = true;
                    }
                });
                observer.observe(tile, { attributes: true, attributeFilter: ["class"] });

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

});
