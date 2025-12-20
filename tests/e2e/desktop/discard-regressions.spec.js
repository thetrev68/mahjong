import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.PLAYWRIGHT_BASE_PATH || "/mahjong";
const DESKTOP_HOME = `${BASE_PATH}/`;

async function waitForGameController(page) {
  await page.waitForFunction(
    () => {
      const gc = window.gameController;
      return gc && Array.isArray(gc.players) && gc.players.length === 4;
    },
    { timeout: 15000 },
  );
}

async function waitForGameScene(page) {
  await page.waitForFunction(
    () => {
      const game = window.game;
      if (!game || !game.scene) {
        return false;
      }
      const scene = game.scene.getScene("GameScene");
      return Boolean(scene && scene.gTable && scene.adapter);
    },
    { timeout: 15000 },
  );
}

async function resetTestSubscriptions(page) {
  await page.evaluate(() => {
    if (Array.isArray(window.__gcTestSubscriptions)) {
      window.__gcTestSubscriptions.forEach((unsub) => {
        try {
          unsub?.();
        } catch (error) {
          console.warn("Failed to unsubscribe test handler", error);
        }
      });
    }
    window.__gcTestSubscriptions = [];
  });
}

async function configureQuickStart(page) {
  await page.click("#settings");
  const trainingCheckbox = page.locator("#trainCheckbox");
  if (await trainingCheckbox.isChecked()) {
    await trainingCheckbox.uncheck();
  }
  const skipCharlestonCheckbox = page.locator("#skipCharlestonCheckbox");
  if (!(await skipCharlestonCheckbox.isChecked())) {
    await skipCharlestonCheckbox.check();
  }
  await page.click("#settings-save");
}

async function waitForDealtHands(page) {
  await page.waitForFunction(
    () => {
      const gc = window.gameController;
      if (!gc || !gc.players || gc.players.length !== 4) {
        return false;
      }
      return gc.players.every(
        (player) =>
          Array.isArray(player.hand?.tiles) && player.hand.tiles.length >= 13,
      );
    },
    { timeout: 20000 },
  );
}

async function clearDiscardPile(page) {
  await page.evaluate(() => {
    const scene = window.game?.scene?.getScene("GameScene");
    const discards = scene?.gTable?.discards?.tileArray;
    if (!Array.isArray(discards)) {
      return;
    }
    discards.forEach((tile) => {
      if (tile?.showTile) {
        tile.showTile(false, false);
      }
    });
    discards.length = 0;
  });
}

async function emitTestDiscards(page, count) {
  await page.evaluate(async (discardCount) => {
    const gc = window.gameController;
    const baseIndex =
      typeof window.__testDiscardIndexBase === "number"
        ? window.__testDiscardIndexBase
        : 1000;
    window.__testDiscardIndexBase = baseIndex + discardCount;

    const delays = [];
    for (let i = 0; i < discardCount; i += 1) {
      const tileData = {
        suit: 0,
        number: (i % 9) + 1,
        index: baseIndex + i,
      };
      gc.emit("TILE_DISCARDED", {
        type: "TILE_DISCARDED",
        player: 1,
        tile: tileData,
        animation: { type: "discard-arc" },
      });
      delays.push(new Promise((resolve) => setTimeout(resolve, 20)));
    }
    await Promise.all(delays);
  }, count);
}

test.describe("Desktop Discard Regressions", () => {
  test("discard appears before claim prompt", async ({ page }) => {
    await page.goto(DESKTOP_HOME);
    await waitForGameController(page);
    await waitForGameScene(page);
    await resetTestSubscriptions(page);
    await clearDiscardPile(page);

    await page.evaluate(() => {
      window.__claimPromptCheck = {
        seen: false,
        ok: false,
        discardCount: 0,
        lastVisible: false,
      };

      const gc = window.gameController;
      const scene = window.game.scene.getScene("GameScene");
      const unsub = gc.on("UI_PROMPT", (data) => {
        if (!data || data.promptType !== "CLAIM_DISCARD") {
          return;
        }
        const discards = scene?.gTable?.discards?.tileArray || [];
        const last = discards[discards.length - 1];
        const lastVisible = Boolean(last?.sprite?.visible);

        window.__claimPromptCheck = {
          seen: true,
          ok: discards.length > 0 && lastVisible,
          discardCount: discards.length,
          lastVisible,
        };
      });

      window.__gcTestSubscriptions.push(unsub);
    });

    await page.evaluate(() => {
      const gc = window.gameController;
      const tileData = { suit: 0, number: 1, index: 2000 };
      gc.emit("TILE_DISCARDED", {
        type: "TILE_DISCARDED",
        player: 1,
        tile: tileData,
        animation: { type: "discard-arc" },
      });
      gc.emit("UI_PROMPT", {
        promptType: "CLAIM_DISCARD",
        options: { tile: tileData, options: ["Pung", "Pass"] },
        callback: () => {},
      });
    });

    await page.waitForFunction(() => Boolean(window.__claimPromptCheck?.seen), {
      timeout: 5000,
    });

    const result = await page.evaluate(() => window.__claimPromptCheck);
    expect(result.ok).toBe(true);
  });

  test("AI discard cadence includes a pause between discards", async ({
    page,
  }) => {
    test.setTimeout(45000);
    await page.goto(DESKTOP_HOME);
    await waitForGameController(page);
    await configureQuickStart(page);

    await page.evaluate(() => {
      if (window.gameController?.players) {
        window.gameController.players.forEach((player) => {
          player.isHuman = false;
        });
      }
    });

    await resetTestSubscriptions(page);

    await page.evaluate(() => {
      window.__discardTimes = [];
      const gc = window.gameController;
      const unsub = gc.on("TILE_DISCARDED", (data) => {
        if (typeof data?.player !== "number") {
          return;
        }
        window.__discardTimes.push(Date.now());
      });
      window.__gcTestSubscriptions.push(unsub);
    });

    await page.click("#start");
    await waitForDealtHands(page);

    await page.waitForFunction(
      () =>
        Array.isArray(window.__discardTimes) &&
        window.__discardTimes.length >= 4,
      { timeout: 20000 },
    );

    const discardTimes = await page.evaluate(() => window.__discardTimes);
    const deltas = discardTimes
      .slice(1)
      .map((time, index) => time - discardTimes[index]);

    deltas.forEach((delta) => {
      expect(delta).toBeGreaterThanOrEqual(200);
    });
  });

  test("discard pile layout does not stack tiles", async ({ page }) => {
    await page.goto(DESKTOP_HOME);
    await waitForGameController(page);
    await waitForGameScene(page);
    await clearDiscardPile(page);

    await emitTestDiscards(page, 8);
    await page.waitForTimeout(500);

    const positions = await page.evaluate(() => {
      const scene = window.game.scene.getScene("GameScene");
      const discards = scene?.gTable?.discards?.tileArray || [];
      return discards.map((tile) => ({
        x: Math.round(tile?.sprite?.x || 0),
        y: Math.round(tile?.sprite?.y || 0),
      }));
    });

    const unique = new Set(positions.map((pos) => `${pos.x}:${pos.y}`));
    expect(unique.size).toBe(positions.length);
  });

  test("only the latest discard has glow", async ({ page }) => {
    await page.goto(DESKTOP_HOME);
    await waitForGameController(page);
    await waitForGameScene(page);
    await clearDiscardPile(page);

    await emitTestDiscards(page, 3);
    await page.waitForTimeout(300);

    const glowInfo = await page.evaluate(() => {
      const scene = window.game.scene.getScene("GameScene");
      const discards = scene?.gTable?.discards?.tileArray || [];
      const glowCount = discards.filter((tile) =>
        Boolean(tile?.glowEffect),
      ).length;
      const lastGlow = Boolean(discards[discards.length - 1]?.glowEffect);
      return { glowCount, lastGlow };
    });

    expect(glowInfo.glowCount).toBe(1);
    expect(glowInfo.lastGlow).toBe(true);
  });
});
