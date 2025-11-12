import { expect } from "@playwright/test";

/**
 * Mobile test helper functions for Playwright
 * Provides common operations for mobile mahjong game testing
 */

/**
 * Wait for mobile game UI to fully load
 */
export async function waitForMobileGameLoad(page) {
    await page.waitForSelector("#mobile-hand-container", { state: "visible" });
    await page.waitForSelector(".opponent-bar", { state: "visible" });
    await page.waitForSelector("#mobile-action-bar", { state: "visible" });
}

/**
 * Tap a tile by index (0-based)
 */
export async function tapTile(page, tileIndex) {
    const tile = page.locator(".mobile-tile").nth(tileIndex);
    await tile.tap();
}

/**
 * Double-tap a tile to discard it
 */
export async function doubleTapTile(page, tileIndex) {
    const tile = page.locator(".mobile-tile").nth(tileIndex);
    await tile.dblclick();
}

/**
 * Perform swipe-up gesture on hand container
 */
export async function swipeUp(page, startX, startY) {
    await page.touchscreen.swipe(
        { x: startX, y: startY },
        { x: startX, y: startY - 100 }
    );
}

/**
 * Select multiple tiles for Charleston pass
 */
export async function selectCharlestonTiles(page, indices) {
    const tapPromises = indices.map(index => tapTile(page, index));
    await Promise.all(tapPromises);
}

/**
 * Verify opponent bar displays correct data
 */
export async function verifyOpponentBar(page, playerIndex, expectedData) {
    const bar = page.locator(".opponent-bar").nth(playerIndex);

    if (expectedData.name) {
        await expect(bar.locator(".opponent-name")).toContainText(expectedData.name);
    }

    if (expectedData.tileCount !== undefined) {
        await expect(bar.locator(".tile-count")).toContainText(String(expectedData.tileCount));
    }

    if (expectedData.isCurrentTurn !== undefined) {
        if (expectedData.isCurrentTurn) {
            await expect(bar).toHaveClass(/current-turn/);
        } else {
            await expect(bar).not.toHaveClass(/current-turn/);
        }
    }
}

/**
 * Start game with training mode hand
 */
export async function startGameWithTrainingHand(page, handString) {
    await page.evaluate((hand) => {
        localStorage.setItem("mahjong_trainingMode", "true");
        localStorage.setItem("mahjong_trainingHand", hand);
        localStorage.setItem("mahjong_skipCharleston", "true");
    }, handString);

    await page.reload();
    await page.click("#start");
    await waitForMobileGameLoad(page);
}