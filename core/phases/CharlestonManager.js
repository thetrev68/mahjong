/* eslint-disable no-await-in-loop */

import { STATE } from "../../constants.js";
import { debugPrint } from "../../utils.js";
import * as GameEvents from "../events/GameEvents.js";

/**
 * Charleston direction sequences for each phase
 */
const CHARLESTON_DIRECTION_SEQUENCE = {
  1: ["right", "across", "left"],
  2: ["left", "across", "right"],
};

/**
 * Charleston direction player offsets
 */
const CHARLESTON_DIRECTION_OFFSETS = {
  right: 1, // PLAYER.RIGHT
  across: 2, // PLAYER.TOP
  left: 3, // PLAYER.LEFT
};

/**
 * CharlestonManager - Handles Charleston tile passing phase
 *
 * Responsibilities:
 * - Execute Charleston passes (Phase 1 and optional Phase 2)
 * - Collect tiles from players
 * - Exchange tiles between players
 * - Handle Charleston continuation voting
 * - Emit Charleston-related events
 */
export class CharlestonManager {
  /**
   * @param {GameController} gameController - Reference to game controller
   */
  constructor(gameController) {
    this.gameController = gameController;
  }

  /**
   * Execute Charleston passes (3 passes per phase)
   * @param {number} phase - 1 or 2
   */
  async executeCharlestonPasses(phase) {
    const directionSequence =
      CHARLESTON_DIRECTION_SEQUENCE[phase] || CHARLESTON_DIRECTION_SEQUENCE[1];

    for (let i = 0; i < directionSequence.length; i++) {
      const directionName = directionSequence[i];
      const direction = CHARLESTON_DIRECTION_OFFSETS[directionName];
      if (typeof direction !== "number") {
        continue;
      }

      await this.executeSingleCharlestonPass(
        phase,
        i + 1,
        directionName,
        direction,
      );
    }
  }

  /**
   * Execute a single Charleston pass in a given direction
   * @param {number} phase - 1 or 2
   * @param {number} passNumber - 1, 2, or 3
   * @param {string} directionName - "right", "across", or "left"
   * @param {number} direction - Player offset (1, 2, or 3)
   */
  async executeSingleCharlestonPass(
    phase,
    passNumber,
    directionName,
    direction,
  ) {
    this.gameController.setState(
      phase === 1 ? STATE.CHARLESTON1 : STATE.CHARLESTON2,
    );

    this.emitCharlestonPhaseEvent(phase, passNumber, directionName);

    const charlestonPassArray = await this.collectCharlestonTiles(
      directionName,
      direction,
    );

    this.exchangeCharlestonTiles(charlestonPassArray, direction, directionName);

    await this.gameController.sleep(500);
  }

  /**
   * Emit Charleston phase event
   * @param {number} phase - 1 or 2
   * @param {number} passNumber - 1, 2, or 3
   * @param {string} directionName - "right", "across", or "left"
   * @private
   */
  emitCharlestonPhaseEvent(phase, passNumber, directionName) {
    const phaseEvent = GameEvents.createCharlestonPhaseEvent(
      phase,
      passNumber,
      directionName,
    );
    this.gameController.emit("CHARLESTON_PHASE", phaseEvent);
  }

  /**
   * Collect tiles from all players for Charleston pass
   * @param {string} directionName - "right", "across", or "left"
   * @param {number} direction - Player offset
   * @returns {Promise<Array<TileData[]>>}
   */
  async collectCharlestonTiles(directionName, direction) {
    const charlestonPassArray = [];
    const { players } = this.gameController;

    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      const player = players[playerIndex];

      const tilesToPass = await this.selectTilesToPass(
        player,
        playerIndex,
        directionName,
      );

      this.removeTilesFromPlayerHand(player, playerIndex, tilesToPass);
      charlestonPassArray[playerIndex] = tilesToPass;

      this.emitHandUpdatedForPlayer(playerIndex);
      this.emitCharlestonPassEvent(
        playerIndex,
        direction,
        directionName,
        tilesToPass,
      );
    }

    return charlestonPassArray;
  }

  /**
   * Select tiles to pass for a player (human or AI)
   * @param {PlayerData} player - Player data
   * @param {number} playerIndex - Player index
   * @param {string} directionName - Direction name
   * @returns {Promise<Array<TileData>>}
   * @private
   */
  async selectTilesToPass(player, playerIndex, directionName) {
    if (player.isHuman) {
      return this.gameController.promptUI("CHARLESTON_PASS", {
        direction: directionName,
        requiredCount: 3,
      });
    }
    return this.gameController.aiEngine.charlestonPass(player.hand);
  }

  /**
   * Remove tiles from player's hand
   * @param {PlayerData} player - Player data
   * @param {number} playerIndex - Player index
   * @param {Array<TileData>} tilesToPass - Tiles to remove
   * @private
   */
  removeTilesFromPlayerHand(player, playerIndex, tilesToPass) {
    tilesToPass.forEach((tile) => player.hand.removeTile(tile));
    debugPrint(
      `[CharlestonManager] Player ${playerIndex} removed ${tilesToPass.length} tiles, hand now has ${player.hand.tiles.length} tiles`,
    );
  }

  /**
   * Emit HAND_UPDATED event for a player
   * @param {number} playerIndex - Player index
   * @private
   */
  emitHandUpdatedForPlayer(playerIndex) {
    const handEvent = GameEvents.createHandUpdatedEvent(
      playerIndex,
      this.gameController.players[playerIndex].hand.toJSON(),
    );
    this.gameController.emit("HAND_UPDATED", handEvent);
  }

  /**
   * Emit Charleston pass event
   * @param {number} playerIndex - Sending player index
   * @param {number} direction - Player offset
   * @param {string} directionName - Direction name
   * @param {Array<TileData>} tilesToPass - Tiles being passed
   * @private
   */
  emitCharlestonPassEvent(playerIndex, direction, directionName, tilesToPass) {
    const toPlayer = (playerIndex + direction) % 4;
    const passEvent = GameEvents.createCharlestonPassEvent(
      playerIndex,
      toPlayer,
      directionName,
      tilesToPass.map((t) => ({
        suit: t.suit,
        number: t.number,
        index: t.index,
      })),
      {
        type: "charleston-pass",
        direction: directionName,
        duration: 600,
        easing: "ease-in-out",
      },
    );
    this.gameController.emit("CHARLESTON_PASS", passEvent);
  }

  /**
   * Exchange Charleston tiles between players
   * @param {Array<TileData[]>} charlestonPassArray - Tiles passed by each player
   * @param {number} direction - Player offset
   * @param {string} directionName - "right", "across", or "left"
   */
  exchangeCharlestonTiles(charlestonPassArray, direction, directionName) {
    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      const fromPlayer = playerIndex;
      const toPlayer = (playerIndex + direction) % 4;

      this.addTilesToReceivingPlayer(
        toPlayer,
        fromPlayer,
        charlestonPassArray[fromPlayer],
      );

      this.emitTilesReceivedEvent(
        toPlayer,
        fromPlayer,
        directionName,
        charlestonPassArray[fromPlayer],
      );

      this.emitHandUpdatedForPlayer(toPlayer);
    }
  }

  /**
   * Add tiles to receiving player's hand
   * @param {number} toPlayer - Receiving player index
   * @param {number} fromPlayer - Sending player index
   * @param {Array<TileData>} tiles - Tiles to add
   * @private
   */
  addTilesToReceivingPlayer(toPlayer, fromPlayer, tiles) {
    tiles.forEach((tile) => {
      this.gameController.players[toPlayer].hand.addTile(tile);
    });
    debugPrint(
      `[CharlestonManager] Player ${toPlayer} received ${tiles.length} tiles, hand now has ${this.gameController.players[toPlayer].hand.tiles.length} tiles`,
    );
  }

  /**
   * Emit TILES_RECEIVED event
   * @param {number} toPlayer - Receiving player index
   * @param {number} fromPlayer - Sending player index
   * @param {string} directionName - Direction name
   * @param {Array<TileData>} tiles - Received tiles
   * @private
   */
  emitTilesReceivedEvent(toPlayer, fromPlayer, directionName, tiles) {
    const receivedTiles = tiles.map((t) => ({
      suit: t.suit,
      number: t.number,
      index: t.index,
    }));
    const tilesReceivedEvent = GameEvents.createTilesReceivedEvent(
      toPlayer,
      receivedTiles,
      fromPlayer,
      {
        type: "charleston-receive",
        direction: directionName,
        duration: 600,
        glow: { persist: true, color: 0x1e90ff },
      },
    );
    this.gameController.emit("TILES_RECEIVED", tilesReceivedEvent);
  }

  /**
   * Query players whether to continue Charleston to phase 2
   * @returns {Promise<boolean>}
   */
  async queryCharlestonContinue() {
    const humanVote = await this.getHumanVote();
    const aiVotes = this.getAIVotes();
    const continueToPhase2 = this.calculateVoteResult(humanVote, aiVotes);

    this.emitVoteResultMessage(continueToPhase2, humanVote, aiVotes);

    return continueToPhase2;
  }

  /**
   * Get human player vote
   * @returns {Promise<string>} "Yes" or "No"
   * @private
   */
  async getHumanVote() {
    return this.gameController.promptUI("CHARLESTON_CONTINUE", {
      question: "Continue Charleston to phase 2?",
      options: ["Yes", "No"],
    });
  }

  /**
   * Get AI player votes
   * @returns {Array<boolean>}
   * @private
   */
  getAIVotes() {
    return this.gameController.players
      .filter((p) => !p.isHuman)
      .map((p) => this.gameController.aiEngine.charlestonContinueVote(p.hand));
  }

  /**
   * Calculate vote result
   * @param {string} _humanVote - "Yes" or "No"
   * @param {Array<boolean>} _aiVotes - AI votes
   * @returns {boolean}
   * @private
   */
  calculateVoteResult(_humanVote, _aiVotes) {
    // TEMPORARY: Force continuation for testing Charleston Phase 2 glow bug
    return true; // Must be unanimous normally
  }

  /**
   * Emit vote result message
   * @param {boolean} continueToPhase2 - Vote result
   * @param {string} humanVote - Human vote
   * @param {Array<boolean>} aiVotes - AI votes
   * @private
   */
  emitVoteResultMessage(continueToPhase2, humanVote, aiVotes) {
    const allVotes = [humanVote === "Yes", ...aiVotes];
    const yesVotes = allVotes.filter((v) => v).length;
    const noVotes = allVotes.filter((v) => !v).length;

    const message = continueToPhase2
      ? "All players voted YES - continuing to Charleston phase 2"
      : `Vote: ${yesVotes} Yes, ${noVotes} No - skipping Charleston phase 2`;

    const msgEvent = GameEvents.createMessageEvent(message, "info");
    this.gameController.emit("MESSAGE", msgEvent);
  }
}
