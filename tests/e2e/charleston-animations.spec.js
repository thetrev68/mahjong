import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.PLAYWRIGHT_BASE_PATH || "/mahjong";
const MOBILE_HOME = `${BASE_PATH}/mobile/?playwright=true`;

// Charleston animation sequencer is currently disabled in MobileRenderer.
// Keep a sentinel test so the suite stays discoverable without blocking CI.
test.describe("Charleston Animations (temporarily skipped)", () => {
  test("skipped while Charleston animation sequencer is disabled", async ({
    page,
  }) => {
    await page.goto(MOBILE_HOME);
    await page.waitForSelector("#new-game-btn");
    expect(true).toBe(true);
  });
});
