import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Mobile Layout & CSS", () => {
    test("mobile site loads with correct layout", async ({ page }) => {
        // Use helper to navigate (handles URL and query params)
        await MobileTestHelpers.gotoMobileApp(page);
        await MobileTestHelpers.waitForMobileReady(page);

        // Verify CSS is loaded
        const hasBackground = await page.evaluate(() => {
            const body = window.getComputedStyle(document.body);
            return body.background.includes("gradient");
        });
        expect(hasBackground).toBe(true);

        // Verify all containers exist
        // Wall counter should be visible
        await expect(page.locator("#wall-counter")).toBeVisible();

        // Hints panel and player rack are hidden on home screen (class .hide-on-home)
        await expect(page.locator("#hints-panel")).toBeHidden();
        await expect(page.locator("#player-rack-container")).toBeHidden();

        await expect(page.locator(".bottom-menu")).toBeVisible();

        // Start game to verify game layout
        await MobileTestHelpers.startNewGame(page, true);

        // Now hints panel and rack should be visible
        await expect(page.locator("#hints-panel")).toBeVisible();
        await expect(page.locator("#player-rack-container")).toBeVisible();

        // Take snapshot for visual comparison
        await MobileTestHelpers.takeSnapshot(page, "layout-complete");
    });
});
