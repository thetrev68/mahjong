/* eslint-disable no-await-in-loop */

import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

/**
 * Integration tests for initial dealing animation sequence (MOBILE ONLY)
 * Tests tile reveal animation and East player glow
 */

test.describe("Mobile Dealing Animations", () => {
    test.beforeEach(async ({ page }) => {
        await MobileTestHelpers.gotoMobileApp(page);
        await MobileTestHelpers.waitForMobileReady(page);
    });

    test("should animate dealing tiles with face-down reveal", async ({ page }) => {
        // Start new game
        await page.click("#new-game-btn");

        // Wait for tiles to be rendered face-down
        // Home page animation (1-2s) + dealing animation (0.5s initial delay) = up to 2.5s
        await page.waitForSelector(".tile--face-down", { timeout: 5000 });

        // Verify tiles start face-down (darkened)
        const faceDownTiles = page.locator(".tile--face-down");
        const initialCount = await faceDownTiles.count();
        expect(initialCount).toBeGreaterThan(0);

        // Wait for reveal animation to start
        await page.waitForSelector(".tile--revealing", { timeout: 1000 });

        // Wait for all tiles to be revealed (no more face-down tiles)
        await page.waitForFunction(() => {
            const faceDown = document.querySelectorAll(".tile--face-down");
            return faceDown.length === 0;
        }, { timeout: 5000 });

        // Verify final hand has correct tile count (13 or 14)
        const finalTiles = page.locator("#hand-container button");
        const finalCount = await finalTiles.count();
        expect(finalCount).toBeGreaterThanOrEqual(13);
        expect(finalCount).toBeLessThanOrEqual(14);

        // Verify no face-down tiles remain
        await expect(page.locator(".tile--face-down")).toHaveCount(0);
    });

    test("should apply glow to East player 14th tile", async ({ page }) => {
        // Increase timeout for this probabilistic test
        test.setTimeout(65000);

        // Start multiple games until we get East wind
        let isEast = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isEast && attempts < maxAttempts) {
            await page.click("#new-game-btn");

            // Wait for dealing to complete
            await page.waitForFunction(() => {
                const tiles = document.querySelectorAll("#hand-container button");
                const faceDown = document.querySelectorAll(".tile--face-down");
                return tiles.length >= 13 && faceDown.length === 0;
            }, { timeout: 5000 });

            // Check tile count
            const tiles = page.locator("#hand-container button");
            const tileCount = await tiles.count();

            if (tileCount === 14) {
                isEast = true;

                // Wait a bit for glow to be applied
                await page.waitForTimeout(500);

                // Verify last tile has glow class
                const lastTile = tiles.last();
                const hasGlow = await lastTile.evaluate(el => {
                    return el.classList.contains("tile--newly-drawn");
                });

                expect(hasGlow).toBe(true);
            } else {
                // Not East, try again
                attempts++;
                await page.waitForTimeout(1000);
            }
        }

        // If we never got East, skip the glow check (test probabilistic)
        if (!isEast) {
            test.skip();
        }
    });

    test("should complete animation in reasonable time", async ({ page }) => {
        const startTime = Date.now();

        // Start game
        await page.click("#new-game-btn");

        // Wait for dealing to fully complete (increased timeout for CI environments)
        await page.waitForFunction(() => {
            const tiles = document.querySelectorAll("#hand-container button");
            const faceDown = document.querySelectorAll(".tile--face-down");
            return tiles.length >= 13 && faceDown.length === 0;
        }, { timeout: 15000 });

        const duration = Date.now() - startTime;

        // Animation should complete in less than 8 seconds (relaxed for CI load)
        expect(duration).toBeLessThan(8000);
    });

    test("should handle rapid game restart gracefully", async ({ page }) => {
        // Start first game
        await page.click("#new-game-btn");
        // Home page animation (1-2s) + dealing animation (0.5s initial delay) = up to 2.5s
        await page.waitForSelector(".tile--face-down", { timeout: 5000 });

        // Immediately restart before animation completes
        await page.click("#new-game-btn");

        // Wait for second dealing animation
        await page.waitForFunction(() => {
            const tiles = document.querySelectorAll("#hand-container button");
            const faceDown = document.querySelectorAll(".tile--face-down");
            return tiles.length >= 13 && faceDown.length === 0;
        }, { timeout: 10000 });

        // Verify no errors occurred
        const tiles = page.locator("#hand-container button");
        const finalCount = await tiles.count();
        expect(finalCount).toBeGreaterThanOrEqual(13);
        expect(finalCount).toBeLessThanOrEqual(14);
    });

    test("should update opponent bars after dealing", async ({ page }) => {
        // Start game
        await page.click("#new-game-btn");

        // Wait for dealing to complete
        await page.waitForFunction(() => {
            const tiles = document.querySelectorAll("#hand-container button");
            return tiles.length >= 13;
        }, { timeout: 5000 });

        // Verify opponent bars show correct tile counts
        const opponentBars = page.locator(".opponent-bar");
        await expect(opponentBars).toHaveCount(3);

        // Check each opponent has tile count displayed
        for (let i = 0; i < 3; i++) {
            const tileCount = await opponentBars.nth(i).locator(".opponent-bar__tile-count").textContent();
            const count = parseInt(tileCount, 10);
            expect(count).toBeGreaterThanOrEqual(13);
            expect(count).toBeLessThanOrEqual(14);
        }
    });
});
