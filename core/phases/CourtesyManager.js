/* eslint-disable no-await-in-loop */

/**
 * CourtesyManager - Handles courtesy pass phase logic
 *
 * Manages the optional courtesy tile exchange between opposite players (0↔2, 1↔3).
 * Players vote on how many tiles (0-3) to exchange, and the minimum of opposite
 * player votes determines the exchange count.
 *
 * Responsibilities:
 * - Collect courtesy votes from all players
 * - Calculate agreed-upon exchange counts for opposite pairs
 * - Prompt players to select tiles for exchange
 * - Execute tile exchanges between opposite players
 * - Emit courtesy-related events (COURTESY_VOTE, COURTESY_PASS, TILES_RECEIVED)
 *
 * This manager is called from GameController during the Charleston phase,
 * after optional Charleston Phase 2.
 */

import * as GameEvents from "../events/GameEvents.js";
import { STATE } from "../../constants.js";

export class CourtesyManager {
  /**
   * @param {GameController} gameController - Reference to main game controller
   */
  constructor(gameController) {
    /** @type {GameController} */
    this.gameController = gameController;
  }

  /**
   * Execute full courtesy phase
   * - Query all players for votes
   * - If at least 2 players vote yes, execute tile exchange
   * - Emit completion message
   */
  async executeCourtesyPhase() {
    this.gameController.setState(STATE.COURTESY_QUERY);

    // Collect votes from all players
    const votes = await this.collectCourtesyVotes();

    // Check if courtesy pass should occur (at least 2 players voted yes)
    const yesVotes = votes.filter((v) => v.vote > 0).length;
    if (yesVotes >= 2) {
      await this.executeCourtesyPass(votes);
    }

    this.gameController.setState(STATE.COURTESY_COMPLETE);
  }

  /**
   * Collect courtesy votes from all players
   * @returns {Promise<Array<{player: number, vote: number}>>}
   */
  async collectCourtesyVotes() {
    const votes = [];

    for (const player of this.gameController.players) {
      let vote;
      if (player.isHuman) {
        const voteStr = await this.gameController.promptUI("COURTESY_VOTE", {
          question:
            "Courtesy Pass: How many tiles to exchange with opposite player?",
          options: ["0", "1", "2", "3"],
        });
        vote = parseInt(voteStr, 10);
        if (isNaN(vote) || vote < 0 || vote > 3) {
          vote = 0; // Default to 0 for safety
        }
      } else {
        vote = await this.gameController.aiEngine.courtesyVote(player.hand);
      }

      votes.push({ player: player.position, vote });

      // Emit rich courtesy vote event
      const voteEvent = GameEvents.createCourtesyVoteEvent(
        player.position,
        vote,
      );
      this.gameController.emit("COURTESY_VOTE", voteEvent);
    }

    return votes;
  }

  /**
   * Execute the courtesy pass based on collected votes
   * @param {Array<{player: number, vote: number}>} votes
   */
  async executeCourtesyPass(votes) {
    this.gameController.setState(STATE.COURTESY);

    // Calculate agreed-upon courtesy pass counts for opposite players
    const player02Vote = Math.min(votes[0].vote, votes[2].vote);
    const player13Vote = Math.min(votes[1].vote, votes[3].vote);

    if (player02Vote === 0 && player13Vote === 0) {
      // No tiles to pass - emit skip message
      const skipMsg = GameEvents.createMessageEvent(
        "Courtesy pass skipped (opposite players must both agree).",
        "info",
      );
      this.gameController.emit("MESSAGE", skipMsg);
      return;
    }

    // Emit vote result message
    this.emitCourtesyVoteMessage(votes, player02Vote);

    // Collect tiles from all players
    const tilesToPass = await this.collectCourtesyTiles(
      votes,
      player02Vote,
      player13Vote,
    );

    // Exchange tiles between opposite players
    this.exchangeCourtesyTiles(tilesToPass);

    // Update all hands and emit events
    this.finalizeCourtesyPass();

    await this.gameController.sleep(1000);
  }

  /**
   * Emit a message showing courtesy vote results
   * @param {Array<{player: number, vote: number}>} votes
   * @param {number} player02Vote
   */
  emitCourtesyVoteMessage(votes, player02Vote) {
    const voteMessages = [];
    for (let i = 0; i < 4; i++) {
      const playerName = this.gameController.players[i].name;
      const vote = votes[i].vote;
      voteMessages.push(`${playerName} voted ${vote}`);
    }

    const msgEvent = GameEvents.createMessageEvent(
      `Courtesy pass: ${voteMessages.join(", ")}. Passing ${player02Vote > 0 ? player02Vote + " tile(s) with opposite player" : "no tiles"}.`,
      "info",
    );
    this.gameController.emit("MESSAGE", msgEvent);
  }

  /**
   * Collect tiles from each player for courtesy pass
   * @param {Array<{player: number, vote: number}>} votes
   * @param {number} player02Vote
   * @param {number} player13Vote
   * @returns {Promise<Array<TileData[]>>}
   */
  async collectCourtesyTiles(votes, player02Vote, player13Vote) {
    const tilesToPass = [];

    // Sequential processing required - human player needs to select tiles via UI
    for (let i = 0; i < 4; i++) {
      const player = this.gameController.players[i];
      const passingCount = i === 0 || i === 2 ? player02Vote : player13Vote;

      if (passingCount === 0) {
        tilesToPass[i] = [];
        continue;
      }

      let selectedTiles;
      if (player.isHuman) {
        // Get opposite player's info for better messaging
        const oppositePlayer = this.gameController.players[(i + 2) % 4];
        const oppositeVote = votes[(i + 2) % 4].vote;
        const yourVote = votes[i].vote;

        // Prompt human to select exact number of tiles (minimum of both votes)
        selectedTiles = await this.gameController.promptUI("SELECT_TILES", {
          question: `${oppositePlayer.name} voted ${oppositeVote}, you voted ${yourVote}. Select exactly ${passingCount} tile(s) to pass.`,
          minTiles: passingCount,
          maxTiles: passingCount,
        });
      } else {
        // AI selects tiles using courtesyPass method
        selectedTiles = await this.gameController.aiEngine.courtesyPass(
          player.hand,
          passingCount,
        );
      }

      tilesToPass[i] = selectedTiles;

      // Remove tiles from player's hand
      selectedTiles.forEach((tile) => player.hand.removeTile(tile));

      // Emit rich courtesy pass event
      const oppositePlayer = (i + 2) % 4;
      const passEvent = GameEvents.createCourtesyPassEvent(
        i,
        oppositePlayer,
        selectedTiles.map((t) => ({
          suit: t.suit,
          number: t.number,
          index: t.index,
        })),
        { duration: 500 },
      );
      this.gameController.emit("COURTESY_PASS", passEvent);
    }

    return tilesToPass;
  }

  /**
   * Exchange tiles with opposite players (0↔2, 1↔3)
   * @param {Array<TileData[]>} tilesToPass
   */
  exchangeCourtesyTiles(tilesToPass) {
    for (let i = 0; i < 4; i++) {
      const oppositePlayer = (i + 2) % 4;
      const receivedTiles = tilesToPass[oppositePlayer];

      receivedTiles.forEach((tile) =>
        this.gameController.players[i].hand.addTile(tile),
      );

      if (receivedTiles.length > 0) {
        // Emit rich tiles received event
        const receivedEvent = GameEvents.createTilesReceivedEvent(
          i,
          receivedTiles.map((t) => ({
            suit: t.suit,
            number: t.number,
            index: t.index,
          })),
          oppositePlayer,
          { duration: 500 },
        );
        this.gameController.emit("TILES_RECEIVED", receivedEvent);
      }
    }
  }

  /**
   * Sort hands and emit final updates after courtesy pass
   */
  finalizeCourtesyPass() {
    // Sort all hands
    this.gameController.players.forEach((player) => player.hand.sortBySuit());

    // Emit hand updates for all players
    this.gameController.players.forEach((player, i) => {
      const handEvent = GameEvents.createHandUpdatedEvent(
        i,
        player.hand.toJSON(),
      );
      this.gameController.emit("HAND_UPDATED", handEvent);
    });

    // Emit completion message
    const completeMsg = GameEvents.createMessageEvent(
      "Courtesy pass complete.",
      "info",
    );
    this.gameController.emit("MESSAGE", completeMsg);
  }
}
