import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Mobile Sprite Rendering", () => {
    test.beforeEach(async ({ page }) => {
        // Go to mobile page
        await MobileTestHelpers.gotoMobileApp(page);

        // Wait for game controller to be initialized and ready
        await MobileTestHelpers.waitForMobileReady(page);
    });

    test("should render hand tiles with sprite background", async ({ page }) => {
        // Start a game to get tiles
        await page.evaluate(() => {
            window.gameController.startNewGame();
        });

        // Check for tile elements
        const tile = page.locator(".hand-container .tile").first();
        await expect(tile).toBeVisible();

        // Verify sprite classes
        await expect(tile).toHaveClass(/tile/);
        await expect(tile).toHaveClass(/tile--normal/);

        // Verify background image is set (computed style)
        const bgImage = await tile.evaluate((el) => {
            return window.getComputedStyle(el).backgroundImage;
        });
        console.log("Computed background image:", bgImage);
        expect(bgImage).toContain("tiles.png");

        // Verify background position is set
        const bgPos = await tile.evaluate((el) => {
            return window.getComputedStyle(el).backgroundPosition;
        });
        console.log("Computed background position:", bgPos);
        expect(bgPos).not.toBe("0% 0%");
    });

    test("should render discard tiles with sprite background", async ({ page }) => {
        // Start game and discard a tile
        await page.evaluate(() => {
            window.gameController.startNewGame();
            // Force a discard
            const tile = window.gameController.gameState.players[0].hand.tiles[0];
            window.gameController.handleTileDiscard(0, tile);
        });

        // Check for discard tile
        const discardTile = page.locator(".discard-pile .tile").first();
        await expect(discardTile).toBeVisible();

        // Verify sprite classes
        await expect(discardTile).toHaveClass(/tile/);
        await expect(discardTile).toHaveClass(/tile--discard/);

        // Verify background image
        const bgImage = await discardTile.evaluate((el) => {
            return window.getComputedStyle(el).backgroundImage;
        });
        expect(bgImage).toContain("tiles.png");
    });
});
