import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Mobile Discard Visibility", () => {
    test("discard pile remains visible on small screens", async ({ page }) => {
        // Set viewport to small mobile size
        await page.setViewportSize({ width: 375, height: 600 });

        await MobileTestHelpers.gotoMobileApp(page);
        await MobileTestHelpers.waitForMobileReady(page);

        // Start game (skip Charleston for speed)
        await MobileTestHelpers.startNewGame(page, true);

        // Discard a few tiles to fill the pile slightly (or just check container)
        // We can just check the container height and visibility

        const discardContainer = page.locator("#discard-container");
        await expect(discardContainer).toBeVisible();

        // Check if discard pile has correct min-height (as per our fix)
        // 34*2 + 3 + 12 = 83px approx
        const box = await discardContainer.boundingBox();
        expect(box.height).toBeGreaterThan(80);

        // Check computed style for grid-template-rows
        const pile = page.locator(".discard-pile");
        await expect(pile).toBeVisible();

        // Verify it's not collapsed
        const pileBox = await pile.boundingBox();
        expect(pileBox.height).toBeGreaterThan(80);
    });

    test("opponent bars compact when many exposures", async ({ page }) => {
        await MobileTestHelpers.gotoMobileApp(page);
        await MobileTestHelpers.waitForMobileReady(page);
        await MobileTestHelpers.startNewGame(page, true);

        // Inject many exposures into an opponent
        await page.evaluate(() => {
            const opponentBar = mobileRenderer.opponentBars[0].bar;
            // Mock exposures: 5 pungs (15 tiles) -> should trigger compact
            const mockExposures = [
                { type: "PUNG", tiles: [{ suit: "BAM", number: 1 }, { suit: "BAM", number: 1 }, { suit: "BAM", number: 1 }] }, // 3
                { type: "PUNG", tiles: [{ suit: "BAM", number: 2 }, { suit: "BAM", number: 2 }, { suit: "BAM", number: 2 }] }, // 6
                // This alone is > 4, so should compact
            ];

            // We need to create TileData objects or mocks that match what OpponentBar expects
            // OpponentBar usage: exposure.tiles.forEach(tile => tile.getText())
            // Implementation uses MobileTile.createExposedTile(tile)

            // Let's use the actual GameController/Player structure if possible, 
            // or just call updateExposures directly on the component instance if reachable.

            // Since we can access mobileRenderer global (exposed in main.js for testing), let's use it
            const mockTiles = Array(5).fill(0).map(() => ({
                suit: "BAM", number: 1, getText: () => "1 Bam"
            }));

            const exposure = { type: "PUNG", tiles: mockTiles };
            opponentBar.updateExposures([exposure]); // 5 tiles > 4 -> compact
        });

        // Check for .compact class
        const exposures = page.locator(".opponent-bar").first().locator(".exposures");
        await expect(exposures).toHaveClass(/compact/);
    });
});
