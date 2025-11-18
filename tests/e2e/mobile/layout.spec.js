import { test, expect } from '@playwright/test';
import { MobileTestHelpers } from '../../utils/mobile-helpers.js';

test.describe('Mobile Layout & CSS', () => {
    test('mobile site loads with correct layout', async ({ page }) => {
        // Use helper to navigate (handles URL and query params)
        await MobileTestHelpers.gotoMobileApp(page);
        await MobileTestHelpers.waitForMobileReady(page);

        // Verify CSS is loaded
        const hasBackground = await page.evaluate(() => {
            const body = window.getComputedStyle(document.body);
            return body.background.includes('gradient');
        });
        expect(hasBackground).toBe(true);

        // Verify all containers exist
        await expect(page.locator('#wall-counter')).toBeVisible();
        await expect(page.locator('#hints-panel')).toBeVisible();
        await expect(page.locator('.bottom-menu')).toBeVisible();

        // Take snapshot for visual comparison
        await MobileTestHelpers.takeSnapshot(page, 'layout-complete');
    });
});
