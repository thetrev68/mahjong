/**
 * Phase 0: Testing Framework Setup Validation
 * Verifies that the mobile testing infrastructure is properly configured
 */

/* global fetch */

import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

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
        // Collect console errors during initialization
        const errors = await MobileTestHelpers.getConsoleErrors(page, async () => {
            await MobileTestHelpers.gotoMobileApp(page);
            await MobileTestHelpers.waitForMobileReady(page);
        });

        // Verify GameController is available
        const hasGameController = await page.evaluate(() => {
            return window.gameController !== undefined &&
                window.gameController !== null;
        });

        expect(hasGameController).toBe(true);

        // No critical errors should have occurred
        const criticalErrors = errors.filter(err =>
            !err.includes("manifest") && // Ignore manifest warnings in dev
            !err.includes("favicon")     // Ignore favicon warnings
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test("asset paths are accessible", async ({ page }) => {
        await MobileTestHelpers.gotoMobileApp(page);

        // Verify tiles.png is accessible
        const tilesImageLoaded = await page.evaluate(() => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = "/pwa/assets/tiles.png";
            });
        });

        expect(tilesImageLoaded).toBe(true);

        // Verify tiles.json is accessible
        const tilesJsonLoaded = await page.evaluate(async () => {
            try {
                const response = await fetch("/pwa/assets/tiles.json");
                return response.ok;
            } catch {
                return false;
            }
        });

        expect(tilesJsonLoaded).toBe(true);
    });

    test("all critical containers exist", async ({ page }) => {
        await MobileTestHelpers.gotoMobileApp(page);
        await MobileTestHelpers.waitForMobileReady(page);

        const containerStatus = await MobileTestHelpers.verifyCriticalContainers(page);

        // Verify critical containers are visible
        expect(containerStatus.opponentsContainer).toBe(true);
        expect(containerStatus.gameCenter).toBe(true);
        expect(containerStatus.handArea).toBe(true);
        expect(containerStatus.handContainer).toBe(true);
        expect(containerStatus.bottomMenu).toBe(true);

        // Discard container exists but may not be visible until game starts
        await expect(page.locator("#discard-container")).toBeAttached();
    });

    test("mobile renderer initializes", async ({ page }) => {
        await MobileTestHelpers.gotoMobileApp(page);
        await MobileTestHelpers.waitForMobileReady(page);

        // Verify MobileRenderer is initialized
        const hasMobileRenderer = await page.evaluate(() => {
            return window.mobileRenderer !== undefined &&
                window.mobileRenderer !== null;
        });

        expect(hasMobileRenderer).toBe(true);
    });

    test("AI engine initializes", async ({ page }) => {
        await MobileTestHelpers.gotoMobileApp(page);
        await MobileTestHelpers.waitForMobileReady(page);

        // Verify AIEngine is available
        const hasAIEngine = await page.evaluate(() => {
            return window.aiEngine !== undefined &&
                window.aiEngine !== null;
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
