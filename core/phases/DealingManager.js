import { PLAYER } from "../../constants.js";
import { debugPrint, debugWarn } from "../../utils.js";
import * as GameEvents from "../events/GameEvents.js";

/**
 * Dealing sequence: 4-4-4-4, 4-4-4-4, 4-4-4-4, 1-1-1-1, then 1 extra for dealer
 * Mimics real NMJL tournament play
 */
const DEAL_SEQUENCE = [
  [PLAYER.BOTTOM, 4],
  [PLAYER.RIGHT, 4],
  [PLAYER.TOP, 4],
  [PLAYER.LEFT, 4],
  [PLAYER.BOTTOM, 4],
  [PLAYER.RIGHT, 4],
  [PLAYER.TOP, 4],
  [PLAYER.LEFT, 4],
  [PLAYER.BOTTOM, 4],
  [PLAYER.RIGHT, 4],
  [PLAYER.TOP, 4],
  [PLAYER.LEFT, 4],
  [PLAYER.BOTTOM, 1],
  [PLAYER.RIGHT, 1],
  [PLAYER.TOP, 1],
  [PLAYER.LEFT, 1],
  [PLAYER.BOTTOM, 1],
];

/**
 * DealingManager - Handles tile dealing logic
 *
 * Responsibilities:
 * - Generate dealing sequences
 * - Handle training mode tile generation
 * - Coordinate dealing animations
 * - Emit dealing-related events
 */
export class DealingManager {
  /**
   * @param {GameController} gameController - Reference to game controller
   */
  constructor(gameController) {
    this.gameController = gameController;
  }

  /**
   * Build the initial dealing sequence and mutate player hands accordingly
   * In training mode, player 0 gets a generated hand instead of random tiles
   * @returns {Array<{player:number, tiles:Object[]}>}
   */
  buildInitialDealSequence() {
    const trainingTiles = this.generateTrainingTilesIfEnabled();
    const sequence = this.distributeTilesToPlayers(trainingTiles);
    return sequence;
  }

  /**
   * Generate training tiles for player 0 if training mode is enabled
   * @returns {Array<TileData>|null} Training tiles or null if not in training mode
   * @private
   */
  generateTrainingTilesIfEnabled() {
    const { settings, cardValidator } = this.gameController;

    if (!settings.trainingMode || !settings.trainingHand) {
      return null;
    }

    const generatedHand = cardValidator.generateHand(
      settings.trainingHand,
      settings.trainingTileCount,
    );

    const templateTiles = generatedHand.getTileArray();
    const trainingTiles = this.matchTrainingTilesToWall(templateTiles);

    this.logTrainingModeInfo(trainingTiles);
    this.emitTrainingModeMessage();

    return trainingTiles;
  }

  /**
   * Match training tiles to actual tiles from the wall
   * @param {Array} templateTiles - Generated tile templates
   * @returns {Array<TileData>} Matched tiles from wall
   * @private
   */
  matchTrainingTilesToWall(templateTiles) {
    const trainingTiles = [];
    const { wallTiles } = this.gameController;

    for (const template of templateTiles) {
      const wallIndex = wallTiles.findIndex(
        (wallTile) =>
          wallTile.suit === template.suit &&
          wallTile.number === template.number,
      );

      if (wallIndex !== -1) {
        const matchedTile = wallTiles.splice(wallIndex, 1)[0];
        trainingTiles.push(matchedTile);
      } else {
        debugWarn(
          `Could not find matching tile for ${template.suit}-${template.number}`,
        );
        trainingTiles.push(template);
      }
    }

    return trainingTiles;
  }

  /**
   * Log training mode information for debugging
   * @param {Array<TileData>} trainingTiles - Training tiles
   * @private
   */
  logTrainingModeInfo(trainingTiles) {
    const { debug, settings } = this.gameController;

    if (!debug) return;

    debugPrint("Training Mode Settings:", {
      trainingMode: settings.trainingMode,
      trainingHand: settings.trainingHand,
      trainingTileCount: settings.trainingTileCount,
    });
    debugPrint(
      "Generated hand tiles:",
      trainingTiles.map((t) => `${t.suit}-${t.number} (index: ${t.index})`),
    );
  }

  /**
   * Emit training mode message to UI
   * @private
   */
  emitTrainingModeMessage() {
    const { settings } = this.gameController;

    this.gameController.emit("MESSAGE", {
      text: `Training Mode: Dealing ${settings.trainingTileCount} tiles for "${settings.trainingHand}"`,
      type: "info",
    });
  }

  /**
   * Distribute tiles to all players following the dealing sequence
   * @param {Array<TileData>|null} trainingTiles - Pre-generated tiles for player 0 or null
   * @returns {Array<{player:number, tiles:Object[]}>} Deal sequence
   * @private
   */
  distributeTilesToPlayers(trainingTiles) {
    const sequence = [];
    let trainingTileIndex = 0;
    const { players } = this.gameController;

    for (const [playerIndex, tileCount] of DEAL_SEQUENCE) {
      const tilesForPlayer = [];
      const player = players[playerIndex];

      for (let i = 0; i < tileCount; i++) {
        const tileData = this.getNextTileForPlayer(
          playerIndex,
          trainingTiles,
          trainingTileIndex,
        );

        if (
          playerIndex === PLAYER.BOTTOM &&
          trainingTiles &&
          trainingTileIndex < trainingTiles.length
        ) {
          trainingTileIndex++;
        }

        player.hand.addTile(tileData);
        tilesForPlayer.push(tileData.toJSON());
      }

      player.hand.sortBySuit();

      sequence.push({
        player: playerIndex,
        tiles: tilesForPlayer,
      });
    }

    return sequence;
  }

  /**
   * Get the next tile for a player (training tile for player 0, or from wall)
   * @param {number} playerIndex - Player index
   * @param {Array<TileData>|null} trainingTiles - Training tiles or null
   * @param {number} trainingTileIndex - Current index in training tiles
   * @returns {TileData} Next tile to deal
   * @private
   */
  getNextTileForPlayer(playerIndex, trainingTiles, trainingTileIndex) {
    if (
      playerIndex === PLAYER.BOTTOM &&
      trainingTiles &&
      trainingTileIndex < trainingTiles.length
    ) {
      return trainingTiles[trainingTileIndex];
    }
    return this.gameController.gameLoopManager.drawTileFromWall();
  }

  /**
   * Emit TILES_DEALT event to trigger dealing animation
   * @param {Array} dealSequence - Sequence of tiles to deal
   */
  emitDealingStartEvent(dealSequence) {
    const dealtEvent = GameEvents.createTilesDealtEvent(dealSequence);
    this.gameController.emit("TILES_DEALT", dealtEvent);
  }

  /**
   * Wait for dealing animation to complete, then emit HAND_UPDATED events
   * Uses promise with timeout fallback for headless/mobile environments
   * @returns {Promise<void>}
   */
  waitForDealingComplete() {
    return new Promise((resolve) => {
      let timeoutId = null;
      let resolved = false;

      // Shared completion logic - emits HAND_UPDATED and resolves promise
      const completeDealing = () => {
        if (resolved) return; // Prevent double execution
        resolved = true;

        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        this.emitHandUpdatedForAllPlayers();
        resolve();
      };

      // Listen for DEALING_COMPLETE from PhaserAdapter
      this.gameController.once("DEALING_COMPLETE", completeDealing);

      // Fallback timeout for mobile/headless (no animation adapter present)
      // Desktop dealing animation takes 6-12 seconds depending on tile count
      timeoutId = setTimeout(() => {
        this.gameController.off("DEALING_COMPLETE", completeDealing);
        completeDealing();
      }, 30000);
    });
  }

  /**
   * Emit HAND_UPDATED events for all players after dealing completes
   */
  emitHandUpdatedForAllPlayers() {
    const { players } = this.gameController;

    players.forEach((player, index) => {
      const handEvent = GameEvents.createHandUpdatedEvent(
        index,
        player.hand.toJSON(),
      );
      this.gameController.emit("HAND_UPDATED", handEvent);
    });
  }
}
