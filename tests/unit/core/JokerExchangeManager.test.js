import { test, expect } from "@playwright/test";
import { JokerExchangeManager } from "../../../core/phases/JokerExchangeManager.js";
import { PlayerData } from "../../../core/models/PlayerData.js";
import { TileData } from "../../../core/models/TileData.js";
import { SUIT, PLAYER } from "../../../constants.js";

// Mock GameController
class MockGameController {
  constructor() {
    this.players = [
      new PlayerData(PLAYER.BOTTOM, "Human"),
      new PlayerData(PLAYER.RIGHT, "Bot1"),
    ];
    this.players[0].isHuman = true;
    this.players[1].isHuman = false;

    this.events = [];
  }

  emit(event, data) {
    this.events.push({ event, data });
  }
}

test.describe("JokerExchangeManager", () => {
  let gameController;
  let jokerExchangeManager;

  test.beforeEach(() => {
    gameController = new MockGameController();
    jokerExchangeManager = new JokerExchangeManager(gameController);
  });

  test("performExchange - Successfully exchanges tile for joker", async () => {
    const humanPlayer = gameController.players[0];
    const botPlayer = gameController.players[1];

    const humanTile = new TileData(SUIT.BAMBOO, 1, 0);
    humanPlayer.hand.addTile(humanTile);

    const jokerTile = new TileData(SUIT.JOKER, 0, 99);
    botPlayer.hand.addExposure(
      [new TileData(SUIT.BAMBOO, 1, 10), jokerTile],
      "Pung",
    );

    const exchange = {
      playerIndex: 1,
      exposureIndex: 0,
      tileIndex: 1,
      jokerTile: jokerTile,
      requiredTiles: [new TileData(SUIT.BAMBOO, 1, 10)],
    };

    const result = jokerExchangeManager.performExchange(exchange, humanPlayer);

    expect(result).toBe(true);

    // Human should have the joker
    expect(humanPlayer.hand.tiles.some((t) => t.isJoker())).toBe(true);
    expect(humanPlayer.hand.tiles.some((t) => t.isSameTile(humanTile))).toBe(
      false,
    );

    // Bot exposure should have the human tile
    expect(botPlayer.hand.exposures[0].tiles[1]).toBe(humanTile);

    // Events
    expect(gameController.events.some((e) => e.event === "JOKER_SWAPPED")).toBe(
      true,
    );
    expect(
      gameController.events.filter((e) => e.event === "HAND_UPDATED"),
    ).toHaveLength(2);
  });

  test("performExchange - Returns false if tile not in hand", async () => {
    const humanPlayer = gameController.players[0];
    const exchange = {
      requiredTiles: [new TileData(SUIT.DOT, 1, 5)],
    };

    const result = jokerExchangeManager.performExchange(exchange, humanPlayer);
    expect(result).toBe(false);
  });
});
