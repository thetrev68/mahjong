
import { test, expect } from "@playwright/test";
import { CourtesyManager } from "../../../core/phases/CourtesyManager.js";
import { PlayerData } from "../../../core/models/PlayerData.js";
import { TileData } from "../../../core/models/TileData.js";
import { SUIT, PLAYER } from "../../../constants.js";

// Mock GameController
class MockGameController {
  constructor() {
    this.players = [
      new PlayerData(PLAYER.BOTTOM, "Human"),
      new PlayerData(PLAYER.RIGHT, "Bot1"),
      new PlayerData(PLAYER.TOP, "Bot2"),
      new PlayerData(PLAYER.LEFT, "Bot3"),
    ];
    this.players[0].isHuman = true;
    this.players[1].isHuman = false;
    this.players[2].isHuman = false;
    this.players[3].isHuman = false;
    
    this.state = null;
    this.events = [];
    
    this.aiEngine = {
      courtesyPass: async (hand, count) => {
          return hand.tiles.slice(0, count);
      }
    };
    
    this.mockPromptResult = null;
  }

  setState(state) {
    this.state = state;
  }

  emit(event, data) {
    this.events.push({ event, data });
  }

  async promptUI(type, options) {
    return this.mockPromptResult;
  }
}

test.describe("CourtesyManager", () => {
  let gameController;
  let courtesyManager;

  test.beforeEach(() => {
    gameController = new MockGameController();
    courtesyManager = new CourtesyManager(gameController);
  });

  test("collectCourtesyTiles - Successfully collects tiles from human and AI", async () => {
      const votes = [
          { player: 0, vote: 3 },
          { player: 1, vote: 0 },
          { player: 2, vote: 3 },
          { player: 3, vote: 0 }
      ];
      
      const player0 = gameController.players[0];
      const player2 = gameController.players[2];
      
      const tile0_1 = new TileData(SUIT.BAMBOO, 1, 0);
      const tile2_1 = new TileData(SUIT.DOT, 1, 10);
      
      player0.hand.addTile(tile0_1);
      player2.hand.addTile(tile2_1);
      
      // We are passing 3 tiles, but hand only has 1. 
      // passingCount will be min(3, 3) = 3.
      // But wait, the votes input to collectCourtesyTiles are used to calculate passingCount.
      
      gameController.mockPromptResult = [tile0_1];
      
      const tilesToPass = await courtesyManager.collectCourtesyTiles(votes, 1, 0);
      
      expect(tilesToPass[0]).toHaveLength(1);
      expect(tilesToPass[0][0]).toBe(tile0_1);
      expect(tilesToPass[2]).toHaveLength(1);
      expect(tilesToPass[2][0]).toBe(tile2_1);
      
      // Verify removed from hand
      expect(player0.hand.tiles.length).toBe(0);
      expect(player2.hand.tiles.length).toBe(0);
      
      // Verify events
      const passEvents = gameController.events.filter(e => e.event === "COURTESY_PASS");
      expect(passEvents.length).toBe(2); // Player 0 and Player 2
  });
});
