
import { test, expect } from "@playwright/test";
import { GameLoopManager } from "../../../core/phases/GameLoopManager.js";
import { PlayerData } from "../../../core/models/PlayerData.js";
import { HandData } from "../../../core/models/HandData.js";
import { TileData } from "../../../core/models/TileData.js";
import { SUIT, PLAYER, STATE } from "../../../constants.js";

// Mock GameController
class MockGameController {
  constructor() {
    this.players = [
      new PlayerData(PLAYER.BOTTOM, "Human"),
      new PlayerData(PLAYER.RIGHT, "Bot"),
    ];
    this.players[0].isHuman = true;
    this.players[1].isHuman = false;
    
    this.currentPlayer = 0;
    this.state = null;
    this.discards = [];
    
    this.events = [];
    
    this.aiEngine = {
      chooseDiscard: async () => null // Default mock
    };
    
    this.settings = {
        useBlankTiles: true
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

  async sleep(ms) {
    // No-op
  }
}

test.describe("GameLoopManager", () => {
  let gameController;
  let gameLoopManager;
  let tile1, tile2;

  test.beforeEach(() => {
    gameController = new MockGameController();
    gameLoopManager = new GameLoopManager(gameController);
    
    // Setup tiles
    tile1 = new TileData(SUIT.BAMBOO, 1, 0);
    tile2 = new TileData(SUIT.DOT, 5, 1);
  });

  // Tests for exposeTiles
  test("exposeTiles - Creates a Pung (2 matching tiles + claimed)", async () => {
      const player = gameController.players[0];
      const claimedTile = new TileData(SUIT.BAMBOO, 1, 100);
      
      // Hand has 2 matching tiles
      const match1 = new TileData(SUIT.BAMBOO, 1, 1);
      const match2 = new TileData(SUIT.BAMBOO, 1, 2);
      player.hand.addTile(match1);
      player.hand.addTile(match2);
      // Some other tile
      player.hand.addTile(new TileData(SUIT.DOT, 1, 3));
      
      // Note: claimedTile is typically NOT in hand when exposeTiles is called in flow,
      // but if logic assumes it is NOT, verify.
      // Logic: find matches from hand (excluding claimed).
      // Then removes matches from hand.
      // Then constructs array with matches + claimed.
      // Then removes ALL from hand.
      
      // If claimedTile IS NOT in hand, removeTile(claimedTile) will return false/do nothing?
      // HandData.removeTile usually checks by ID or reference.
      
      // Let's assume standard flow where claimedTile IS NOT in hand initially.
      
      gameLoopManager.exposeTiles(0, "Pung", claimedTile);
      
      // Verify exposure created
      expect(player.hand.exposures.length).toBe(1);
      const exposure = player.hand.exposures[0];
      expect(exposure.type).toBe("Pung");
      expect(exposure.tiles.length).toBe(3);
      
      // Verify matches removed from hand
      expect(player.hand.tiles.length).toBe(1); // Only the Dot left
      expect(player.hand.tiles[0].suit).toBe(SUIT.DOT);
      
      // Events
      const exposedEvent = gameController.events.find(e => e.event === "TILES_EXPOSED");
      expect(exposedEvent).toBeDefined();
      expect(exposedEvent.data.tiles.length).toBe(3);
  });
  
  test("exposeTiles - Uses Jokers if matching tiles insufficient", async () => {
      const player = gameController.players[0];
      const claimedTile = new TileData(SUIT.BAMBOO, 1, 100);
      
      // Hand has 1 matching tile and 1 Joker
      const match1 = new TileData(SUIT.BAMBOO, 1, 1);
      const joker1 = new TileData(SUIT.JOKER, 0, 99);
      player.hand.addTile(match1);
      player.hand.addTile(joker1);
      
      gameLoopManager.exposeTiles(0, "Pung", claimedTile);
      
      expect(player.hand.exposures.length).toBe(1);
      const exposure = player.hand.exposures[0];
      expect(exposure.tiles.length).toBe(3); // Match + Joker + Claimed
      
      // Verify Joker was used
      const exposedJoker = exposure.tiles.find(t => t.isJoker());
      expect(exposedJoker).toBeDefined();
      
      // Hand empty
      expect(player.hand.tiles.length).toBe(0);
  });
  
  test("exposeTiles - Does nothing if not enough tiles", async () => {
      const player = gameController.players[0];
      const claimedTile = new TileData(SUIT.BAMBOO, 1, 100);
      
      // Hand has only 1 matching tile, need 2 for Pung
      const match1 = new TileData(SUIT.BAMBOO, 1, 1);
      player.hand.addTile(match1);
      
      gameLoopManager.exposeTiles(0, "Pung", claimedTile);
      
      expect(player.hand.exposures.length).toBe(0);
      expect(player.hand.tiles.length).toBe(1); // Tile still there
  });
});
