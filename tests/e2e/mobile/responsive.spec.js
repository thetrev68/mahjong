import { test, expect } from "@playwright/test";
import { MobileTestHelpers } from "../../utils/mobile-helpers.js";

test.describe("Phase 5: Responsive Design & Component Polish", () => {
    const viewports = [
        { width: 375, height: 667, name: "iPhone SE" },
        { width: 390, height: 844, name: "iPhone 12" },
        { width: 768, height: 1024, name: "iPad" }
    ];

    viewports.forEach(viewport => {
        test(`layout looks correct on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto("/mobile/?playwright=true");
            await MobileTestHelpers.waitForMobileReady(page);

            // Start game to populate UI
            await page.click("#new-game-btn");
            await page.waitForTimeout(2000);

            // Verify key elements are visible and properly sized
            await expect(page.locator(".hand-container")).toBeVisible();
            await expect(page.locator(".discard-container")).toBeVisible();
            await expect(page.locator(".opponents-container")).toBeVisible();

            // Check hand container has tiles
            const handTiles = await page.locator(".hand-container .tile").count();
            expect(handTiles).toBeGreaterThan(0);
            expect(handTiles).toBeLessThanOrEqual(14); // American Mahjong max hand size

            // Verify discard pile grid columns based on viewport
            const discardPile = page.locator(".discard-pile");
            const gridColumns = await discardPile.evaluate(el =>
                window.getComputedStyle(el).gridTemplateColumns.split(" ").length
            );

            if (viewport.width < 768) {
                // Mobile: 9 columns
                expect(gridColumns).toBe(9);
            } else {
                // Tablet: 12 columns
                expect(gridColumns).toBe(12);
            }

            // Take snapshot for visual comparison
            await MobileTestHelpers.takeSnapshot(page, `responsive-${viewport.name}`);
        });

        test(`tiles are appropriately sized on ${viewport.name}`, async ({ page }) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.goto("/mobile/?playwright=true");
            await MobileTestHelpers.waitForMobileReady(page);

            await page.click("#new-game-btn");
            await page.waitForTimeout(2000);

            // Check hand tile size
            const handTileSize = await page.evaluate(() => {
                const tile = document.querySelector(".hand-container .tile--default");
                if (!tile) return null;
                const rect = tile.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
            });

            expect(handTileSize).not.toBeNull();

            // Verify tiles are reasonable size for viewport
            if (viewport.width === 375) {
                // iPhone SE - smaller tiles
                expect(handTileSize.width).toBeGreaterThanOrEqual(40);
                expect(handTileSize.width).toBeLessThanOrEqual(44);
            } else if (viewport.width === 390) {
                // iPhone 12 - standard mobile size
                expect(handTileSize.width).toBeGreaterThanOrEqual(43);
                expect(handTileSize.width).toBeLessThanOrEqual(47);
            } else if (viewport.width === 768) {
                // iPad - larger tiles
                expect(handTileSize.width).toBeGreaterThanOrEqual(58);
                expect(handTileSize.width).toBeLessThanOrEqual(62);
            }
        });
    });

    test("opponent bar highlights current turn with golden glow", async ({ page }) => {
        await page.goto("/mobile/?playwright=true");
        await MobileTestHelpers.waitForMobileReady(page);

        await page.click("button:has-text(\"NEW GAME\")");
        await page.waitForTimeout(2000);

        // Find opponent bar with current turn
        const currentTurnBar = page.locator(".opponent-bar.current-turn").first();

        // Verify styling
        const hasGoldenBorder = await currentTurnBar.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.borderColor.includes("255, 209, 102") || style.borderColor.includes("ffd166");
        });

        expect(hasGoldenBorder).toBeTruthy();

        const hasBoxShadow = await currentTurnBar.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.boxShadow && style.boxShadow !== "none";
        });

        expect(hasBoxShadow).toBeTruthy();
    });

    test("latest discard has pulse animation", async ({ page }) => {
        await page.goto("/mobile/?playwright=true");
        await MobileTestHelpers.waitForMobileReady(page);

        await page.click("button:has-text(\"NEW GAME\")");
        await page.waitForTimeout(3000); // Wait for game to progress

        // Check if latest discard has animation class
        const latestDiscard = page.locator(".discard-tile.latest").first();
        const latestCount = await latestDiscard.count();

        if (latestCount > 0) {
            // Verify it has the pulse animation
            const hasAnimation = await latestDiscard.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.animationName.includes("pulse");
            });

            expect(hasAnimation).toBeTruthy();
        }
    });

    test("exposed tiles display correctly as sprites", async ({ page }) => {
        await page.goto("/mobile/?playwright=true");
        await MobileTestHelpers.waitForMobileReady(page);

        await page.click("button:has-text(\"NEW GAME\")");
        await page.waitForTimeout(5000); // Wait for potential exposures

        // Check if any exposures exist
        const exposureCount = await page.locator(".exposure-set").count();

        if (exposureCount > 0) {
            // Verify exposed tiles are using sprites
            const exposedTile = page.locator(".exposure-set .tile--small").first();
            const hasSpriteBg = await exposedTile.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.backgroundImage !== "none" &&
                    style.backgroundImage.includes("tiles.png");
            });

            expect(hasSpriteBg).toBeTruthy();
        }
    });

    test("hand grid wraps properly with 14 tiles", async ({ page }) => {
        await page.goto("/mobile/?playwright=true");
        await MobileTestHelpers.waitForMobileReady(page);

        await page.click("button:has-text(\"NEW GAME\")");
        await page.waitForTimeout(2000);

        // Check hand container grid
        const handGrid = page.locator(".hand-container");
        const gridProps = await handGrid.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
                display: style.display,
                gridTemplateColumns: style.gridTemplateColumns
            };
        });

        expect(gridProps.display).toBe("grid");
        expect(gridProps.gridTemplateColumns.split(" ").length).toBe(7);

        // Verify tiles are in grid
        const tileCount = await page.locator(".hand-container .tile").count();
        expect(tileCount).toBeGreaterThan(0);
    });

    test("tiles have visual feedback when selected", async ({ page }) => {
        await page.goto("/mobile/?playwright=true");
        await MobileTestHelpers.waitForMobileReady(page);

        await page.click("button:has-text(\"NEW GAME\")");
        await page.waitForTimeout(2000);

        // Click a tile to select it
        const firstTile = page.locator(".hand-container .tile").first();
        await firstTile.tap();

        await page.waitForTimeout(300); // Wait for selection animation

        // Check if tile has selected class or visual change
        const isSelected = await firstTile.evaluate(el => {
            return el.classList.contains("selected") ||
                el.classList.contains("tile--selected");
        });

        expect(isSelected).toBeTruthy();
    });

    test("responsive breakpoints adjust tile sizes correctly", async ({ page }) => {
        const breakpoints = [
            { width: 374, name: "Below 375px", expectedTileWidth: 42 },
            { width: 390, name: "Standard mobile", expectedTileWidth: 45 },
            { width: 768, name: "Tablet", expectedTileWidth: 60 }
        ];

        /* eslint-disable no-await-in-loop */
        for (const breakpoint of breakpoints) {
            await page.setViewportSize({ width: breakpoint.width, height: 844 });
            await page.goto("/mobile/?playwright=true");
            await MobileTestHelpers.waitForMobileReady(page);

            await page.click("#new-game-btn");
            await page.waitForTimeout(1000);

            // Check actual tile width
            const tileWidth = await page.evaluate(() => {
                const tile = document.querySelector(".hand-container .tile--default");
                return tile ? tile.getBoundingClientRect().width : 0;
            });

            // Allow ±3px tolerance for rounding/layout
            expect(tileWidth).toBeGreaterThanOrEqual(breakpoint.expectedTileWidth - 3);
            expect(tileWidth).toBeLessThanOrEqual(breakpoint.expectedTileWidth + 3);
        }
        /* eslint-enable no-await-in-loop */
    });

    test("all UI elements fit within viewport without horizontal scroll", async ({ page }) => {
        const viewports = [
            { width: 375, height: 667 },
            { width: 390, height: 844 },
            { width: 768, height: 1024 }
        ];

        /* eslint-disable no-await-in-loop */
        for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await page.goto("/mobile/?playwright=true");
            await MobileTestHelpers.waitForMobileReady(page);

            await page.click("#new-game-btn");
            await page.waitForTimeout(1000);

            // Check if horizontal scrollbar exists
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth;
            });

            expect(hasHorizontalScroll).toBe(false);

            // Verify all containers fit within viewport
            const containers = [".opponents-container", ".game-center", ".hand-area", ".bottom-menu"];
            for (const selector of containers) {
                const isWithinBounds = await page.evaluate(({ sel, vw }) => {
                    const el = document.querySelector(sel);
                    if (!el) return true; // Element might not exist yet
                    const rect = el.getBoundingClientRect();
                    return rect.right <= vw;
                }, { sel: selector, vw: viewport.width });

                expect(isWithinBounds).toBe(true);
            }
        }
        /* eslint-enable no-await-in-loop */
    });
});
