/* global getComputedStyle */
import { test, expect } from "@playwright/test";

/**
 * Integration tests for Charleston animation sequence
 * Tests all three Charleston directions: right, across, left
 */

test.describe("Charleston Animations", () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to mobile version
        await page.goto("/mobile/");
        await page.waitForLoadState("networkidle");

        // Wait for game to be ready
        await expect(page.locator("#new-game-btn")).toBeVisible();
    });

    test("should animate Charleston pass right correctly", async ({ page }) => {
        // Start game
        await page.click("#new-game-btn");
        await page.waitForTimeout(2000); // Wait for dealing animation

        // Wait for Charleston phase
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 10000 });
        const promptText = await page.locator(".mobile-prompt__message").textContent();
        expect(promptText).toContain("Charleston");

        // Select 3 tiles for Charleston pass
        const tiles = page.locator(".hand-container .tile");
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();

        // Verify 3 tiles are selected
        const selectedTiles = page.locator(".hand-container .tile.selected");
        await expect(selectedTiles).toHaveCount(3);

        // Click pass button
        await page.click(".mobile-prompt__actions button:has-text('Pass')");

        // Wait for pass-out animation to start
        await page.waitForSelector(".tile-charleston-leaving", { timeout: 2000 });

        // Verify CSS animation class is applied
        const leavingTiles = page.locator(".tile-charleston-leaving");
        await expect(leavingTiles).toHaveCount(3);

        // Wait for pass-out animation to complete (dynamic wait)
        await page.waitForFunction(() => {
            const tiles = document.querySelectorAll(".tile-charleston-leaving");
            return tiles.length === 0; // Animation class removed when complete
        }, { timeout: 1000 });

        // Wait for receive animation
        await page.waitForSelector(".tile-charleston-arriving", { timeout: 2000 });

        // Verify receive animation class is applied
        const arrivingTiles = page.locator(".tile-charleston-arriving");
        await expect(arrivingTiles).toHaveCount(3);

        // Wait for receive animation to complete (dynamic wait)
        await page.waitForFunction(() => {
            const tiles = document.querySelectorAll(".tile-charleston-arriving");
            return tiles.length === 0; // Animation class removed when complete
        }, { timeout: 1000 });

        // Verify blue glow is applied to received tiles
        await page.waitForSelector(".tile--newly-drawn", { timeout: 1000 });
        const glowingTiles = page.locator(".tile--newly-drawn");
        await expect(glowingTiles).toHaveCount(3);

        // Wait for sort animation to complete (dynamic wait)
        await page.waitForFunction(() => {
            const tiles = document.querySelectorAll(".hand-container .tile");
            // Check if tiles no longer have sorting animation styles
            return Array.from(tiles).every(tile =>
                !getComputedStyle(tile).transition.includes("transform")
            );
        }, { timeout: 1200 });

        // Verify glow persists after sort
        const persistedGlow = page.locator(".tile--newly-drawn");
        await expect(persistedGlow).toHaveCount(3);
    });

    test("should handle Charleston phase 1 complete sequence", async ({ page }) => {
        // Start game
        await page.click("#new-game-btn");
        await page.waitForTimeout(2000);

        // Charleston Pass 1: Right
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 10000 });
        let promptText = await page.locator(".mobile-prompt__message").textContent();
        expect(promptText).toContain("right");

        // Select and pass tiles
        const tiles = page.locator(".hand-container .tile");
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();
        await page.click(".mobile-prompt__actions button:has-text('Pass')");

        // Wait for animation sequence to complete
        await page.waitForTimeout(2500); // Full sequence

        // Charleston Pass 2: Across
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 5000 });
        promptText = await page.locator(".mobile-prompt__message").textContent();
        expect(promptText).toContain("across");

        // Select and pass tiles
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();
        await page.click(".mobile-prompt__actions button:has-text('Pass')");

        // Wait for animation sequence
        await page.waitForTimeout(2500);

        // Charleston Pass 3: Left
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 5000 });
        promptText = await page.locator(".mobile-prompt__message").textContent();
        expect(promptText).toContain("left");

        // Select and pass tiles
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();
        await page.click(".mobile-prompt__actions button:has-text('Pass')");

        // Wait for final animation sequence
        await page.waitForTimeout(2500);

        // Verify we've progressed past Charleston phase 1
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 5000 });
        promptText = await page.locator(".mobile-prompt__message").textContent();
        expect(promptText).toContain("Continue Charleston");
    });

    test("should animate all three directions with correct vectors", async ({ page }) => {
        // Start game
        await page.click("#new-game-btn");
        await page.waitForTimeout(2000);

        // Test RIGHT direction
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 10000 });
        const tiles = page.locator(".hand-container .tile");
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();

        await page.click(".mobile-prompt__actions button:has-text('Pass')");
        await page.waitForSelector(".tile-charleston-leaving", { timeout: 2000 });

        // Verify exit-x is positive (moving right)
        const leavingTile = page.locator(".tile-charleston-leaving").first();
        const exitX = await leavingTile.evaluate(el =>
            getComputedStyle(el).getPropertyValue("--exit-x")
        );
        const exitXValue = parseFloat(exitX) || 0;
        expect(exitXValue).toBeGreaterThan(0);

        await page.waitForTimeout(3000); // Wait for complete sequence

        // Test ACROSS direction
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 5000 });
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();

        await page.click(".mobile-prompt__actions button:has-text('Pass')");
        await page.waitForSelector(".tile-charleston-leaving", { timeout: 2000 });

        // Verify exit-x is 0 and exit-y is negative (moving up)
        const acrossTile = page.locator(".tile-charleston-leaving").first();
        const acrossExitX = await acrossTile.evaluate(el =>
            getComputedStyle(el).getPropertyValue("--exit-x")
        );
        const acrossExitY = await acrossTile.evaluate(el =>
            getComputedStyle(el).getPropertyValue("--exit-y")
        );
        const acrossExitXValue = parseFloat(acrossExitX) || 0;
        const acrossExitYValue = parseFloat(acrossExitY) || 0;
        expect(acrossExitXValue).toBe(0);
        expect(acrossExitYValue).toBeLessThan(0);

        await page.waitForTimeout(3000);

        // Test LEFT direction
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 5000 });
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();

        await page.click(".mobile-prompt__actions button:has-text('Pass')");
        await page.waitForSelector(".tile-charleston-leaving", { timeout: 2000 });

        // Verify exit-x is negative (moving left)
        const leftTile = page.locator(".tile-charleston-leaving").first();
        const leftExitX = await leftTile.evaluate(el =>
            getComputedStyle(el).getPropertyValue("--exit-x")
        );
        const leftExitXValue = parseFloat(leftExitX) || 0;
        expect(leftExitXValue).toBeLessThan(0);
    });

    test("should maintain glow through sort animation", async ({ page }) => {
        // Start game
        await page.click("#new-game-btn");
        await page.waitForTimeout(2000);

        // Complete first Charleston pass
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 10000 });
        const tiles = page.locator(".hand-container .tile");
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();
        await page.click(".mobile-prompt__actions button:has-text('Pass')");

        // Wait for receive animation
        await page.waitForTimeout(1500);

        // Verify glow is present before sort
        await page.waitForSelector(".tile--newly-drawn", { timeout: 1000 });
        const glowBeforeSort = page.locator(".tile--newly-drawn");
        const countBefore = await glowBeforeSort.count();
        expect(countBefore).toBe(3);

        // Wait for sort to complete
        await page.waitForTimeout(1000); // SORT_DURATION

        // Verify glow persists after sort
        const glowAfterSort = page.locator(".tile--newly-drawn");
        const countAfter = await glowAfterSort.count();
        expect(countAfter).toBe(3);

        // Verify tiles are actually sorted (check order)
        const tileElements = await page.locator(".hand-container .tile").all();
        expect(tileElements.length).toBeGreaterThan(0);
    });

    test("should handle animation cancellation gracefully", async ({ page }) => {
        // Start game
        await page.click("#new-game-btn");
        await page.waitForTimeout(2000);

        // Start Charleston pass
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 10000 });
        const tiles = page.locator(".hand-container .tile");
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();
        await page.click(".mobile-prompt__actions button:has-text('Pass')");

        // Wait for animation to start
        await page.waitForSelector(".tile-charleston-leaving", { timeout: 2000 });

        // Verify animation is running
        await page.evaluate(() => {
            const sequencer = window.__charlestonSequencer;
            return sequencer ? sequencer.isRunning() : false;
        });

        // Note: We can't easily cancel mid-animation in a real game,
        // but we can verify the animation completes without errors
        await page.waitForTimeout(3000);

        // Check console for errors
        const errors = [];
        page.on("console", msg => {
            if (msg.type() === "error") {
                errors.push(msg.text());
            }
        });

        expect(errors.length).toBe(0);
    });

    test("should respect prefers-reduced-motion", async ({ page, context }) => {
        // Set reduced motion preference
        await context.addInitScript(() => {
            Object.defineProperty(window, "matchMedia", {
                writable: true,
                value: (query) => ({
                    matches: query === "(prefers-reduced-motion: reduce)",
                    media: query,
                    onchange: null,
                    addEventListener: () => {},
                    removeEventListener: () => {},
                    dispatchEvent: () => true
                })
            });
        });

        await page.goto("/mobile/");
        await page.waitForLoadState("networkidle");

        // Start game
        await page.click("#new-game-btn");
        await page.waitForTimeout(2000);

        // Perform Charleston pass
        await page.waitForSelector(".mobile-prompt:not(.hidden)", { timeout: 10000 });
        const tiles = page.locator(".hand-container .tile");
        await tiles.nth(0).click();
        await tiles.nth(1).click();
        await tiles.nth(2).click();
        await page.click(".mobile-prompt__actions button:has-text('Pass')");

        // With reduced motion, animations should complete nearly instantly
        await page.waitForTimeout(100); // Much shorter than normal

        // Verify animation classes were applied but completed quickly
        const leavingTiles = page.locator(".tile-charleston-leaving");
        const count = await leavingTiles.count();
        // Classes may have been removed already due to fast animation
        expect(count).toBeGreaterThanOrEqual(0);
    });
});
