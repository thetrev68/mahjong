import { STATE, PLAYER, SUIT, WIND, DRAGON } from "../../constants.js";
import * as GameEvents from "../events/GameEvents.js";

/**
 * JokerExchangeManager - Handles joker exchange functionality
 *
 * Responsibilities:
 * - Finding exposed jokers across all players
 * - Validating exchange eligibility (game state, available tiles)
 * - Prompting human player for exchange choice
 * - Performing joker-tile swap and updating game state
 * - Emitting exchange-related events
 */
export class JokerExchangeManager {
  /**
   * @param {GameController} gameController - Reference to game controller
   */
  constructor(gameController) {
    this.gameController = gameController;
  }

  /**
   * Handle joker exchange - human player exchanges a tile for an exposed joker
   * Called when human clicks "Exchange Joker" button
   * @returns {Promise<boolean>} - True if exchange occurred
   */
  async execute() {
    const humanPlayer = this.gameController.players[PLAYER.BOTTOM];

    // Safety guards
    if (!humanPlayer || !humanPlayer.hand) {
      return false;
    }

    // Prevent joker exchange during invalid game states
    if (!this.isValidStateForExchange()) {
      this.gameController.emit(
        "MESSAGE",
        GameEvents.createMessageEvent(
          "Cannot exchange jokers during this phase",
          "warning",
        ),
      );
      return false;
    }

    // Find all exposed jokers across all players
    const exposedJokers = this.findExposedJokers();

    if (exposedJokers.length === 0) {
      this.gameController.emit(
        "MESSAGE",
        GameEvents.createMessageEvent("No exposed jokers available", "info"),
      );
      return false;
    }

    // Check if human has any matching tiles
    const matchingExchanges = this.filterMatchingExchanges(
      exposedJokers,
      humanPlayer,
    );

    if (matchingExchanges.length === 0) {
      this.gameController.emit(
        "MESSAGE",
        GameEvents.createMessageEvent("No matching tiles to exchange", "info"),
      );
      return false;
    }

    // Select exchange (prompt if multiple, auto-select if single)
    const exchange = await this.selectExchange(matchingExchanges);

    // Perform the exchange
    return this.performExchange(exchange, humanPlayer);
  }

  /**
   * Check if current game state allows joker exchange
   * @returns {boolean}
   */
  isValidStateForExchange() {
    const invalidStates = [
      STATE.INIT,
      STATE.DEAL,
      STATE.CHARLESTON1,
      STATE.CHARLESTON2,
      STATE.CHARLESTON_QUERY,
      STATE.COURTESY_QUERY,
      STATE.COURTESY,
    ];
    return !invalidStates.includes(this.gameController.state);
  }

  /**
   * Find all exposed jokers across all players
   * @returns {Array} - Array of exposed joker info objects
   */
  findExposedJokers() {
    const exposedJokers = [];

    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      const player = this.gameController.players[playerIndex];
      player.hand.exposures.forEach((exposure, exposureIndex) => {
        exposure.tiles.forEach((tile, tileIndex) => {
          if (tile.suit === SUIT.JOKER) {
            exposedJokers.push({
              playerIndex,
              exposureIndex,
              tileIndex,
              jokerTile: tile,
              // Find what tiles can replace this joker based on the exposure
              requiredTiles: this.getRequiredTilesForJoker(exposure),
            });
          }
        });
      });
    }

    return exposedJokers;
  }

  /**
   * Filter exposed jokers to only those the human can exchange for
   * @param {Array} exposedJokers - All exposed jokers
   * @param {PlayerData} humanPlayer - Human player
   * @returns {Array} - Jokers that can be exchanged
   */
  filterMatchingExchanges(exposedJokers, humanPlayer) {
    return exposedJokers.filter((ej) =>
      ej.requiredTiles.some((reqTile) =>
        humanPlayer.hand.tiles.some(
          (handTile) =>
            handTile.suit === reqTile.suit &&
            handTile.number === reqTile.number,
        ),
      ),
    );
  }

  /**
   * Select which exchange to perform (prompt user if multiple options)
   * @param {Array} matchingExchanges - Valid exchanges
   * @returns {Promise<Object>} - Selected exchange
   */
  selectExchange(matchingExchanges) {
    // If multiple exchanges available, let user choose
    if (matchingExchanges.length > 1) {
      // Build options for user selection
      const options = matchingExchanges.map((ex) => {
        const tile = ex.requiredTiles[0];
        const player = this.gameController.players[ex.playerIndex];
        const tileStr = this.formatTileForDisplay(tile);
        return {
          label: `Trade your ${tileStr} for Joker from ${player.name}`,
          value: ex,
        };
      });

      return this.gameController.promptUI("JOKER_EXCHANGE_CHOICE", {
        question: "Multiple joker exchanges available. Choose one:",
        options,
      });
    } else {
      // Single exchange, auto-select
      return matchingExchanges[0];
    }
  }

  /**
   * Perform the joker-tile exchange
   * @param {Object} exchange - Exchange info
   * @param {PlayerData} humanPlayer - Human player
   * @returns {boolean} - True if successful
   */
  performExchange(exchange, humanPlayer) {
    const requiredTile = exchange.requiredTiles[0];

    // Find the tile in human's hand
    const tileIndex = humanPlayer.hand.tiles.findIndex(
      (t) => t.suit === requiredTile.suit && t.number === requiredTile.number,
    );

    if (tileIndex === -1) {
      return false;
    }

    const humanTile = humanPlayer.hand.tiles[tileIndex];

    this.executeExchange(humanPlayer, humanTile, exchange);
    this.emitExchangeEvents(humanPlayer, humanTile, exchange);

    return true;
  }

  /**
   * Execute the physical exchange of tiles
   * @param {PlayerData} humanPlayer
   * @param {TileData} humanTile
   * @param {Object} exchange
   */
  executeExchange(humanPlayer, humanTile, exchange) {
    const jokerTile = exchange.jokerTile;

    // Remove tile from human's hand, add joker (use HandData API)
    humanPlayer.hand.removeTile(humanTile);
    humanPlayer.hand.addTile(jokerTile);

    // Update the exposure - replace joker with human's tile
    const ownerPlayer = this.gameController.players[exchange.playerIndex];
    ownerPlayer.hand.exposures[exchange.exposureIndex].tiles[
      exchange.tileIndex
    ] = humanTile;
  }

  /**
   * Emit events related to joker exchange
   * @param {PlayerData} humanPlayer
   * @param {TileData} humanTile
   * @param {Object} exchange
   */
  emitExchangeEvents(humanPlayer, humanTile, exchange) {
    const jokerTile = exchange.jokerTile;
    const ownerPlayer = this.gameController.players[exchange.playerIndex];

    // Emit joker swapped event (for backward compatibility with PhaserAdapter)
    this.gameController.emit("JOKER_SWAPPED", {
      player: exchange.playerIndex,
      exposureIndex: exchange.exposureIndex,
      jokerIndex: jokerTile.index,
      replacementTile: humanTile,
      recipient: PLAYER.BOTTOM,
    });

    // Emit hand updated events
    const humanHandEvent = GameEvents.createHandUpdatedEvent(
      PLAYER.BOTTOM,
      humanPlayer.hand.toJSON(),
    );
    this.gameController.emit("HAND_UPDATED", humanHandEvent);

    const ownerHandEvent = GameEvents.createHandUpdatedEvent(
      exchange.playerIndex,
      ownerPlayer.hand.toJSON(),
    );
    this.gameController.emit("HAND_UPDATED", ownerHandEvent);

    this.gameController.emit(
      "MESSAGE",
      GameEvents.createMessageEvent(
        `Exchanged ${humanTile.getText()} for joker`,
        "info",
      ),
    );
  }

  /**
   * Format a tile for user-friendly display
   * @param {TileData} tile
   * @returns {string} - Formatted tile string (e.g., "5 Crack", "North Wind", "Red Dragon")
   */
  formatTileForDisplay(tile) {
    if (!tile) {
      return "";
    }

    const { suit, number } = tile;

    if (suit === SUIT.CRACK) {
      return `${number} Crack`;
    }
    if (suit === SUIT.BAM) {
      return `${number} Bam`;
    }
    if (suit === SUIT.DOT) {
      return `${number} Dot`;
    }
    if (suit === SUIT.WIND) {
      const windNames = {
        [WIND.NORTH]: "North Wind",
        [WIND.SOUTH]: "South Wind",
        [WIND.EAST]: "East Wind",
        [WIND.WEST]: "West Wind",
      };
      return windNames[number] || "Wind";
    }
    if (suit === SUIT.DRAGON) {
      const dragonNames = {
        [DRAGON.RED]: "Red Dragon",
        [DRAGON.GREEN]: "Green Dragon",
        [DRAGON.WHITE]: "White Dragon",
      };
      return dragonNames[number] || "Dragon";
    }
    if (suit === SUIT.FLOWER) {
      return `Flower ${typeof number === "number" ? number + 1 : 1}`;
    }
    if (suit === SUIT.JOKER) {
      return "Joker";
    }
    if (suit === SUIT.BLANK) {
      return "Blank";
    }

    return `${number ?? ""}`;
  }

  /**
   * Determine what tiles can replace a joker in an exposure
   * @param {ExposureData} exposure
   * @returns {TileData[]} - Array of tiles that can replace this joker
   */
  getRequiredTilesForJoker(exposure) {
    // If exposure has other non-joker tiles, use those as template
    const nonJokerTiles = exposure.tiles.filter((t) => t.suit !== SUIT.JOKER);

    if (nonJokerTiles.length > 0) {
      // Return tiles matching the non-joker tiles (same suit/number)
      return [nonJokerTiles[0]];
    }

    // If all jokers (shouldn't happen in valid game), return empty
    return [];
  }
}
