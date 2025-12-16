/**
 * Mobile Test Helpers
 * Utility functions for testing the mobile implementation
 */

const MOBILE_APP_PATH = process.env.PLAYWRIGHT_MOBILE_PATH || "/mobile/?playwright=true";

export class MobileTestHelpers {
    /**
     * Wait for mobile app to be ready (GameController initialized)
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @param {number} timeout - Maximum wait time in milliseconds
     */
    static async waitForMobileReady(page, timeout = 10000) {
        // Wait for GameController to be available
        await page.waitForFunction(() => window.gameController, { timeout });

        // Wait for game status to show "Ready"
        await page.waitForFunction(() => {
            const status = document.getElementById("game-status");
            return status && status.textContent.includes("Ready");
        }, { timeout });

        // Wait for new-game button to be enabled
        await page.waitForSelector("#new-game-btn:not([disabled])", { timeout: 5000 });
    }

    /**
     * Wait for sprite assets to load
     * @param {import('@playwright/test').Page} page - Playwright page object
     */
    static async waitForSpriteLoad(page) {
        await page.waitForFunction(() => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = "/pwa/assets/tiles.png";
            });
        }, { timeout: 10000 });
    }

    /**
     * Take a screenshot for visual comparison
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @param {string} name - Screenshot name (without extension)
     */
    static async takeSnapshot(page, name) {
        await page.screenshot({
            path: `test-results/mobile-${name}.png`,
            fullPage: true
        });
    }

    /**
     * Navigate to mobile app
     * @param {import('@playwright/test').Page} page - Playwright page object
     */
    static async gotoMobileApp(page) {
        await page.goto(MOBILE_APP_PATH);
    }

    /**
     * Start a new game and wait for it to be ready
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @param {boolean} skipCharleston - Whether to skip Charleston phase
     */
    static async startNewGame(page, skipCharleston = false) {
        if (skipCharleston) {
            // Enable training mode to skip Charleston
            await page.evaluate(() => {
                localStorage.setItem("mahjong_trainingMode", "true");
            });
            await page.reload();
            await this.waitForMobileReady(page);
        }

        await page.click("#new-game-btn");

        // Wait for tiles to be dealt
        await page.waitForSelector("#hand-container button", { timeout: 15000 });
    }

    /**
     * Wait for loading indicators to disappear
     * @param {import('@playwright/test').Page} page - Playwright page object
     */
    static async waitForLoadingComplete(page) {
        await page.waitForFunction(() => {
            const loadingElements = document.querySelectorAll(".loading");
            return loadingElements.length === 0;
        }, { timeout: 10000 });
    }

    /**
     * Check if CSS is loaded properly
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @returns {Promise<boolean>} - True if CSS is loaded
     */
    static isCSSLoaded(page) {
        return page.evaluate(() => {
            const body = window.getComputedStyle(document.body);
            // Check if background has been styled (not default white)
            return body.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                body.backgroundColor !== "rgb(255, 255, 255)";
        });
    }

    /**
     * Get computed style of an element
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @param {string} selector - CSS selector
     * @param {string} property - CSS property name
     * @returns {Promise<string>} - Computed style value
     */
    static getComputedStyle(page, selector, property) {
        return page.evaluate(([sel, prop]) => {
            const element = document.querySelector(sel);
            if (!element) return null;
            return window.getComputedStyle(element)[prop];
        }, [selector, property]);
    }

    /**
     * Check if sprites are being used (not text-based tiles)
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @returns {Promise<boolean>} - True if sprites are used
     */
    static areSpritesUsed(page) {
        return page.evaluate(() => {
            const tiles = document.querySelectorAll(".tile, .mobile-tile");
            if (tiles.length === 0) return false;

            // Check if tiles have background-image set
            let spriteCount = 0;
            tiles.forEach(tile => {
                const style = window.getComputedStyle(tile);
                if (style.backgroundImage !== "none") {
                    spriteCount++;
                }
            });

            return spriteCount > 0;
        });
    }

    /**
     * Count elements matching a selector
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @param {string} selector - CSS selector
     * @returns {Promise<number>} - Element count
     */
    static countElements(page, selector) {
        return page.locator(selector).count();
    }

    /**
     * Wait for animation to complete
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @param {number} duration - Animation duration in milliseconds
     */
    static async waitForAnimation(page, duration = 500) {
        await page.waitForTimeout(duration);
    }

    /**
     * Check console for errors during a test action
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @param {Function} callback - Async function to run while collecting errors
     * @returns {Promise<Array>} - Array of console errors collected during callback
     */
    static async getConsoleErrors(page, callback) {
        const errors = [];
        const listener = (msg) => {
            if (msg.type() === "error") {
                errors.push(msg.text());
            }
        };

        // Register listener
        page.on("console", listener);

        try {
            // Run the callback
            await callback();
        } finally {
            // Always remove listener, even if callback throws
            page.off("console", listener);
        }

        return errors;
    }

    /**
     * Verify all critical containers exist and are visible
     * @param {import('@playwright/test').Page} page - Playwright page object
     * @returns {Promise<Object>} - Object with visibility status for each container
     */
    static async verifyCriticalContainers(page) {
        const containers = {
            opponentsContainer: "#opponents-container",
            gameCenter: "#game-center",
            handArea: "#hand-area",
            handContainer: "#hand-container",
            discardContainer: "#discard-container",
            bottomMenu: ".bottom-menu"
        };

        const results = {};
        /* eslint-disable no-await-in-loop */
        for (const [key, selector] of Object.entries(containers)) {
            try {
                results[key] = await page.locator(selector).isVisible();
            } catch {
                results[key] = false;
            }
        }
        /* eslint-enable no-await-in-loop */

        return results;
    }
}
