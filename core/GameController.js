/* eslint-disable no-await-in-loop */

/**
 * GameController - Platform-agnostic game state machine
 *
 * This is the central orchestrator for the mahjong game logic.
 * It manages game state, coordinates turns, and emits events for UI layers to consume.
 *
 * NO PHASER DEPENDENCIES - works with plain data models only.
 * Desktop and mobile UIs subscribe to events and render accordingly.
 *
 * Events emitted:
 * - STATE_CHANGED: {oldState, newState}
 * - GAME_STARTED: {players}
 * - TILES_DEALT: {players}
 * - TILE_DRAWN: {player, tile}
 * - TILE_DISCARDED: {player, tile}
 * - HAND_UPDATED: {player, hand}
 * - TURN_CHANGED: {currentPlayer, previousPlayer}
 * - CHARLESTON_PHASE: {phase: 1|2, direction}
 * - CHARLESTON_PASS: {player, tiles, direction}
 * - COURTESY_VOTE: {player, vote}
 * - COURTESY_PASS: {fromPlayer, toPlayer, tile}
 * - DISCARD_CLAIMED: {claimingPlayer, tile, claimType}
 * - TILES_EXPOSED: {player, exposureType, tiles}
 * - MAHJONG: {winner, hand}
 * - GAME_ENDED: {reason, winner}
 * - MESSAGE: {text, type: 'info'|'error'|'hint'}
 * - UI_PROMPT: {promptType, options, callback}
 */

import { EventEmitter } from "./events/EventEmitter.js";
import {
  STATE,
  PLAYER,
  PLAYER_OPTION,
  SUIT,
  WIND,
  ANIMATION_TIMINGS,
} from "../constants.js";
import { PlayerData } from "./models/PlayerData.js";
import { TileData } from "./models/TileData.js";
import { ExposureData } from "./models/HandData.js";
import * as GameEvents from "./events/GameEvents.js";
import { gTileGroups } from "./tileDefinitions.js";
import { debugPrint, debugWarn, debugError } from "../utils.js";
import { StateError } from "./errors/GameErrors.js";

const CHARLESTON_DIRECTION_SEQUENCE = {
  1: ["right", "across", "left"],
  2: ["left", "across", "right"],
};

const CHARLESTON_DIRECTION_OFFSETS = {
  right: PLAYER.RIGHT,
  across: PLAYER.TOP,
  left: PLAYER.LEFT,
};

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

export class GameController extends EventEmitter {
  constructor() {
    super();

    /** @type {STATE} Current game state */
    this.state = STATE.INIT;

    /** @type {PlayerData[]} Four players */
    this.players = [];

    /** @type {TileData[]} Wall of undrawn tiles */
    this.wallTiles = [];

    /** @type {TileData[]} Discard pile */
    this.discards = [];

    /** @type {number} Current player index (0-3) */
    this.currentPlayer = 0;

    /** @type {Object} Game settings */
    this.settings = {
      year: 2025,
      difficulty: "medium",
      useBlankTiles: false,
      skipCharleston: false,
      trainingMode: false,
      trainingHand: "",
      trainingTileCount: 13,
    };

    /** @type {boolean} Optional verbose debug logging flag */
    this.debug = false;

    /** @type {Object} Charleston state */
    this.charlestonState = {
      phase: 0, // 0, 1, 2
      passCount: 0,
      continueToPhase2: false,
      courtesyVotes: [],
    };

    /** @type {Object} Game result */
    this.gameResult = {
      mahjong: false,
      winner: -1,
      winningHand: null,
    };

    /** @type {Function} AI engine reference (injected) */
    this.aiEngine = null;

    /** @type {Function} Card validation reference (injected) */
    this.cardValidator = null;

    /** @type {Function|null} Optional wall generator (returns tile data array) */
    this.wallGenerator = null;
  }

  /**
   * Initialize the game controller with dependencies
   * @param {Object} options - Configuration
   * @param {Object} options.aiEngine - AI decision engine
   * @param {Object} options.cardValidator - Hand validation system
   * @param {Object} options.settings - Game settings
   */
  init(options = {}) {
    this.aiEngine = options.aiEngine;
    this.cardValidator = options.cardValidator;
    this.wallGenerator = options.wallGenerator || null;

    if (options.settings) {
      this.settings = { ...this.settings, ...options.settings };
    }

    // Initialize 4 players
    this.players = [
      new PlayerData(PLAYER.BOTTOM, "You"),
      new PlayerData(PLAYER.RIGHT, "Bot Bob"),
      new PlayerData(PLAYER.TOP, "Sally Bot"),
      new PlayerData(PLAYER.LEFT, "Stephen Bot"),
    ];

    this.assignPlayerWinds();

    // Emit initialization message
    const msgEvent = GameEvents.createMessageEvent(
      `Game initialized with ${this.settings.year} card`,
      "info",
    );
    this.emit("MESSAGE", msgEvent);
  }

  /**
   * Assign fixed winds to seats following NMJL orientation.
   * Player 0 (human) is always East; opponents map clockwise North/West/South.
   */
  assignPlayerWinds() {
    const winds = {
      [PLAYER.BOTTOM]: WIND.EAST,
      [PLAYER.RIGHT]: WIND.NORTH,
      [PLAYER.TOP]: WIND.WEST,
      [PLAYER.LEFT]: WIND.SOUTH,
    };

    Object.entries(winds).forEach(([position, wind]) => {
      const player = this.players[position];
      if (!player) return;
      player.wind = wind;
    });
  }

  /**
   * Start a new game
   *
   * Phase 2B: Full implementation
   * GameController now handles entire game flow.
   */
  async startGame() {
    // Prevent multiple simultaneous game starts
    if (this.state !== STATE.INIT && this.state !== STATE.END) {
      debugWarn(
        "GameController: startGame called while game in progress, ignoring",
      );
      return;
    }

    this.setState(STATE.START);

    // Reset game state
    this.gameResult = { mahjong: false, winner: -1, winningHand: null };
    this.charlestonState = {
      phase: 0,
      passCount: 0,
      continueToPhase2: false,
      courtesyVotes: [],
    };
    this.discards = [];
    this.currentPlayer = PLAYER.BOTTOM;

    // Clear all player hands before dealing
    this.players.forEach((player) => player.hand.clear());

    // Create wall
    this.createWall();

    // Emit game started event with rich structure
    const gameStartedEvent = GameEvents.createGameStartedEvent(
      this.players.map((player) => player.toJSON()),
    );
    this.emit("GAME_STARTED", gameStartedEvent);

    // Deal tiles to all players
    await this.dealTiles();

    // Charleston phase or skip to game loop
    if (!this.settings.skipCharleston) {
      await this.charlestonPhase();
    } else {
      await this.gameLoop();
    }
  }

  /**
   * Create the wall of tiles
   * Works with Phaser Wall from shared table
   */
  createWall() {
    const rawTiles = this.wallGenerator
      ? this.wallGenerator()
      : buildDefaultWallTiles(this.settings.useBlankTiles);

    if (!Array.isArray(rawTiles) || rawTiles.length === 0) {
      throw new StateError(
        "Failed to generate wall tiles. Wall generator returned empty set.",
      );
    }

    // Normalize into TileData instances
    const normalizedTiles = rawTiles.map((tile, idx) =>
      normalizeTileData(tile, idx),
    );

    // Shuffle for randomness
    this.wallTiles = shuffleTileArray(normalizedTiles);

    // Emit event so adapters can prepare their own tile maps
    this.emit("WALL_CREATED", {
      tileCount: this.wallTiles.length,
    });

    this.emit("MESSAGE", {
      text: `Wall created with ${this.wallTiles.length} tiles`,
      type: "info",
    });
  }

  /**
   * Deal tiles to all players (Player 0 gets 14, others get 13)
   * Mimics real NMJL tournament play: 4-4-4-4, 4-4-4-4, 4-4-4-4, 1-1-1-1, then 1 extra for dealer
   * Based on sequentialDealTiles from commit 07c41b9
   *
   * Note: Actual dealing is handled entirely by PhaserAdapter to access Phaser timing
   */
  dealTiles() {
    this.setState(STATE.DEAL);

    const dealSequence = this.buildInitialDealSequence();

    // Emit event to trigger adapters to animate dealing using provided sequence
    const dealtEvent = GameEvents.createTilesDealtEvent(dealSequence);
    this.emit("TILES_DEALT", dealtEvent);

    // DO NOT emit HAND_UPDATED here - it would show all tiles instantly
    // Wait for dealing animation to complete, then emit HAND_UPDATED
    // PhaserAdapter will emit DEALING_COMPLETE when animation finishes

    // Wait for dealing to complete with fallback for headless/mobile environments
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

        // Emit HAND_UPDATED after dealing animation completes (or timeout)
        this.players.forEach((player, index) => {
          const handEvent = GameEvents.createHandUpdatedEvent(
            index,
            player.hand.toJSON(),
          );
          this.emit("HAND_UPDATED", handEvent);
        });
        resolve();
      };

      // Listen for DEALING_COMPLETE from PhaserAdapter
      this.once("DEALING_COMPLETE", completeDealing);

      // Fallback timeout for mobile/headless (no animation adapter present)
      // If DEALING_COMPLETE doesn't arrive within 30 seconds, proceed anyway
      // Desktop dealing animation takes 6-12 seconds depending on tile count
      timeoutId = setTimeout(() => {
        this.off("DEALING_COMPLETE", completeDealing); // Remove event listener
        completeDealing();
      }, 30000);
    });
  }

  /**
   * Build the initial dealing sequence and mutate player hands accordingly
   * In training mode, player 0 gets a generated hand instead of random tiles
   * @returns {Array<{player:number, tiles:Object[]}>}
   */
  buildInitialDealSequence() {
    const sequence = [];
    let trainingTiles = null;
    let trainingTileIndex = 0;

    // Training mode: Pre-generate tiles for player 0
    if (this.settings.trainingMode && this.settings.trainingHand) {
      // Generate training hand using card validator
      const generatedHand = this.cardValidator.generateHand(
        this.settings.trainingHand,
        this.settings.trainingTileCount,
      );

      const templateTiles = generatedHand.getTileArray();

      // Find matching tiles from the wall for each generated tile
      // This ensures proper indices for rendering
      trainingTiles = [];
      for (const template of templateTiles) {
        // Find a matching tile in the wall
        const wallIndex = this.wallTiles.findIndex(
          (wallTile) =>
            wallTile.suit === template.suit &&
            wallTile.number === template.number,
        );

        if (wallIndex !== -1) {
          // Remove from wall and use it
          const matchedTile = this.wallTiles.splice(wallIndex, 1)[0];
          trainingTiles.push(matchedTile);
        } else {
          // Fallback: use the template (shouldn't happen with a valid wall)
          debugWarn(
            `Could not find matching tile for ${template.suit}-${template.number}`,
          );
          trainingTiles.push(template);
        }
      }

      if (this.debug) {
        debugPrint("Training Mode Settings:", {
          trainingMode: this.settings.trainingMode,
          trainingHand: this.settings.trainingHand,
          trainingTileCount: this.settings.trainingTileCount,
        });
        debugPrint(
          "Generated hand tiles:",
          trainingTiles.map((t) => `${t.suit}-${t.number} (index: ${t.index})`),
        );
      }

      this.emit("MESSAGE", {
        text: `Training Mode: Dealing ${this.settings.trainingTileCount} tiles for "${this.settings.trainingHand}"`,
        type: "info",
      });
    }

    // Use standard dealing sequence for animation
    for (const [playerIndex, tileCount] of DEAL_SEQUENCE) {
      const tilesForPlayer = [];
      const player = this.players[playerIndex];

      for (let i = 0; i < tileCount; i++) {
        let tileData;

        // Player 0 in training mode: use pre-generated tiles
        if (
          playerIndex === PLAYER.BOTTOM &&
          trainingTiles &&
          trainingTileIndex < trainingTiles.length
        ) {
          tileData = trainingTiles[trainingTileIndex++];
        } else {
          // Normal: draw from wall
          tileData = this.drawTileFromWall();
        }

        player.hand.addTile(tileData);
        tilesForPlayer.push(tileData.toJSON());
      }

      // Keep human hand sorted for readability
      player.hand.sortBySuit();

      sequence.push({
        player: playerIndex,
        tiles: tilesForPlayer,
      });
    }

    return sequence;
  }

  /**
   * Charleston tile passing phase
   */
  async charlestonPhase() {
    // Check if Charleston should be skipped (training mode)
    if (this.settings.skipCharleston) {
      // Skip Charleston and Courtesy, go straight to game loop
      await this.gameLoop();
      return;
    }

    // Charleston Phase 1 (required)
    this.charlestonState.phase = 1;
    await this.executeCharlestonPasses(1);

    // Query whether to continue to phase 2
    this.setState(STATE.CHARLESTON_QUERY);
    const continueToPhase2 = await this.queryCharlestonContinue();

    if (continueToPhase2) {
      // Charleston Phase 2 (optional)
      this.charlestonState.phase = 2;
      await this.executeCharlestonPasses(2);
    }

    // Courtesy pass query
    await this.courtesyPhase();

    // Move to game loop
    await this.gameLoop();
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
      this.setState(phase === 1 ? STATE.CHARLESTON1 : STATE.CHARLESTON2);

      // Emit rich Charleston phase event
      const phaseEvent = GameEvents.createCharlestonPhaseEvent(
        phase,
        i + 1,
        directionName,
      );
      this.emit("CHARLESTON_PHASE", phaseEvent);

      // Collect tiles from all players
      const charlestonPassArray = [];

      for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
        const player = this.players[playerIndex];

        let tilesToPass;
        if (player.isHuman) {
          // Prompt human player
          tilesToPass = await this.promptUI("CHARLESTON_PASS", {
            direction: directionName,
            requiredCount: 3,
          });
        } else {
          // AI selects tiles
          tilesToPass = await this.aiEngine.charlestonPass(player.hand);
        }

        // Remove tiles from player's hand
        tilesToPass.forEach((tile) => player.hand.removeTile(tile));
        debugPrint(
          `[GameController] Player ${playerIndex} removed ${tilesToPass.length} tiles, hand now has ${player.hand.tiles.length} tiles`,
        );

        charlestonPassArray[playerIndex] = tilesToPass;

        // Emit hand updated for sending player (tiles removed)
        const senderHandEvent = GameEvents.createHandUpdatedEvent(
          playerIndex,
          this.players[playerIndex].hand.toJSON(),
        );
        this.emit("HAND_UPDATED", senderHandEvent);

        // Emit rich Charleston pass event
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
        this.emit("CHARLESTON_PASS", passEvent);
      }

      // Exchange tiles between players based on direction
      for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
        const fromPlayer = playerIndex;
        const toPlayer = (playerIndex + direction) % 4;

        // Add tiles to receiving player
        charlestonPassArray[fromPlayer].forEach((tile) => {
          this.players[toPlayer].hand.addTile(tile);
        });
        debugPrint(
          `[GameController] Player ${toPlayer} received ${charlestonPassArray[fromPlayer].length} tiles, hand now has ${this.players[toPlayer].hand.tiles.length} tiles`,
        );

        // Emit tiles received event (for animation coordination)
        const receivedTiles = charlestonPassArray[fromPlayer].map((t) => ({
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
        this.emit("TILES_RECEIVED", tilesReceivedEvent);

        // Emit hand updated for receiving player
        const handEvent = GameEvents.createHandUpdatedEvent(
          toPlayer,
          this.players[toPlayer].hand.toJSON(),
        );
        this.emit("HAND_UPDATED", handEvent);
      }

      await this.sleep(500);
    }
  }

  /**
   * Query players whether to continue Charleston to phase 2
   * @returns {Promise<boolean>}
   */
  async queryCharlestonContinue() {
    // Human player votes
    const humanVote = await this.promptUI("CHARLESTON_CONTINUE", {
      question: "Continue Charleston to phase 2?",
      options: ["Yes", "No"],
    });

    // AI players vote
    const aiVotes = this.players
      .filter((p) => !p.isHuman)
      .map((p) => this.aiEngine.charlestonContinueVote(p.hand));

    const allVotes = [humanVote === "Yes", ...aiVotes];
    const yesVotes = allVotes.filter((v) => v).length;
    const noVotes = allVotes.filter((v) => !v).length;

    // TEMPORARY: Force continuation for testing Charleston Phase 2 glow bug
    const continueToPhase2 = true; // Must be unanimous (normally: yesVotes === 4)

    if (continueToPhase2) {
      const msgEvent = GameEvents.createMessageEvent(
        "All players voted YES - continuing to Charleston phase 2",
        "info",
      );
      this.emit("MESSAGE", msgEvent);
    } else {
      const msgEvent = GameEvents.createMessageEvent(
        `Vote: ${yesVotes} Yes, ${noVotes} No - skipping Charleston phase 2`,
        "info",
      );
      this.emit("MESSAGE", msgEvent);
    }

    return continueToPhase2;
  }

  /**
   * Courtesy pass phase (optional tile exchange)
   */
  async courtesyPhase() {
    this.setState(STATE.COURTESY_QUERY);

    // Each player votes on how many tiles to pass for courtesy (0-3)
    const votes = [];
    for (const player of this.players) {
      let vote;
      if (player.isHuman) {
        const voteStr = await this.promptUI("COURTESY_VOTE", {
          question:
            "Courtesy Pass: How many tiles to exchange with opposite player?",
          options: ["0", "1", "2", "3"],
        });
        vote = parseInt(voteStr, 10);
        if (isNaN(vote) || vote < 0 || vote > 3) {
          vote = 0; // Default to 0 for safety
        }
      } else {
        vote = await this.aiEngine.courtesyVote(player.hand);
      }

      votes.push({ player: player.position, vote });

      // Emit rich courtesy vote event
      const voteEvent = GameEvents.createCourtesyVoteEvent(
        player.position,
        vote,
      );
      this.emit("COURTESY_VOTE", voteEvent);
    }

    // If at least 2 players voted for more than 0 tiles, do courtesy pass
    const yesVotes = votes.filter((v) => v.vote > 0).length;
    if (yesVotes >= 2) {
      this.setState(STATE.COURTESY);

      // Calculate agreed-upon courtesy pass counts for opposite players
      const player02Vote = Math.min(votes[0].vote, votes[2].vote);
      const player13Vote = Math.min(votes[1].vote, votes[3].vote);

      if (player02Vote > 0 || player13Vote > 0) {
        // Build informative message showing individual votes
        const voteMessages = [];
        for (let i = 0; i < 4; i++) {
          const playerName = this.players[i].name;
          const vote = votes[i].vote;
          voteMessages.push(`${playerName} voted ${vote}`);
        }

        // Emit rich message event with detailed vote information
        const msgEvent = GameEvents.createMessageEvent(
          `Courtesy pass: ${voteMessages.join(", ")}. Passing ${player02Vote > 0 ? player02Vote + " tile(s) with opposite player" : "no tiles"}.`,
          "info",
        );
        this.emit("MESSAGE", msgEvent);

        // Collect tiles from each player
        const tilesToPass = [];

        // Sequential processing required - human player needs to select tiles via UI
        for (let i = 0; i < 4; i++) {
          const player = this.players[i];
          const passingCount = i === 0 || i === 2 ? player02Vote : player13Vote;

          if (passingCount === 0) {
            tilesToPass[i] = [];
            continue;
          }

          let selectedTiles;
          if (player.isHuman) {
            // Get opposite player's info for better messaging
            const oppositePlayer = this.players[(i + 2) % 4];
            const oppositeVote = votes[(i + 2) % 4].vote;
            const yourVote = votes[i].vote;

            // Prompt human to select exact number of tiles (minimum of both votes)
            selectedTiles = await this.promptUI("SELECT_TILES", {
              question: `${oppositePlayer.name} voted ${oppositeVote}, you voted ${yourVote}. Select exactly ${passingCount} tile(s) to pass.`,
              minTiles: passingCount,
              maxTiles: passingCount,
            });
          } else {
            // AI selects tiles using courtesyPass method
            selectedTiles = await this.aiEngine.courtesyPass(
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
          this.emit("COURTESY_PASS", passEvent);
        }

        // Exchange tiles with opposite players (0↔2, 1↔3)
        for (let i = 0; i < 4; i++) {
          const oppositePlayer = (i + 2) % 4;
          const receivedTiles = tilesToPass[oppositePlayer];

          receivedTiles.forEach((tile) => this.players[i].hand.addTile(tile));

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
            this.emit("TILES_RECEIVED", receivedEvent);
          }
        }

        // Sort all hands
        this.players.forEach((player) => player.hand.sortBySuit());

        // Emit hand updates for all players
        this.players.forEach((player, i) => {
          const handEvent = GameEvents.createHandUpdatedEvent(
            i,
            player.hand.toJSON(),
          );
          this.emit("HAND_UPDATED", handEvent);
        });

        // Emit completion message
        const completeMsg = GameEvents.createMessageEvent(
          "Courtesy pass complete.",
          "info",
        );
        this.emit("MESSAGE", completeMsg);
      } else {
        // Emit skip message
        const skipMsg = GameEvents.createMessageEvent(
          "Courtesy pass skipped (opposite players must both agree).",
          "info",
        );
        this.emit("MESSAGE", skipMsg);
      }

      await this.sleep(1000);
    }

    this.setState(STATE.COURTESY_COMPLETE);
  }

  /**
   * Main game loop (draw → discard → claim check → repeat)
   */
  async gameLoop() {
    this.setState(STATE.LOOP_PICK_FROM_WALL);

    while (this.state !== STATE.END && this.wallTiles.length > 0) {
      // Draw only when the current player is at the standard 13-tile count
      if (this.shouldDrawTile()) {
        await this.pickFromWall();

        // Check for Mahjong after drawing (self-draw win)
        if (this.checkMahjong()) {
          this.endGame("mahjong");
          return;
        }
      }

      // Current player chooses tile to discard
      await this.chooseDiscard();

      // Query other players to claim the discard
      const claimResult = await this.queryClaimDiscard();

      if (claimResult.claimed) {
        // Tile was claimed - handle the claim
        this.handleDiscardClaim(claimResult);

        // Check if claiming player won with Mahjong
        if (this.gameResult.mahjong) {
          return; // Game ended
        }

        // Claiming player must discard a tile
        await this.chooseDiscard();

        // Continue loop with current player (the claimer)
      } else {
        // No claim - advance to next player
        this.advanceTurn();
      }
    }

    // Wall is empty - wall game
    if (this.wallTiles.length === 0 && !this.gameResult.mahjong) {
      this.endGame("wall_game");
    }
  }

  /**
   * Remove top tile from wall
   * @returns {TileData}
   */
  drawTileFromWall() {
    if (this.wallTiles.length === 0) {
      throw new StateError("Attempted to draw from an empty wall");
    }
    return this.wallTiles.pop();
  }

  /**
   * Determine whether current player should draw from wall
   * @returns {boolean}
   */
  shouldDrawTile() {
    const player = this.players[this.currentPlayer];
    if (!player || !player.hand) {
      return false;
    }
    return player.hand.getLength() === 13;
  }

  /**
   * Determine if player can form an exposure using discarded tile
   * @param {PlayerData} player
   * @param {TileData} tile
   * @returns {boolean}
   */
  canPlayerFormExposure(player, tile) {
    if (!player || !player.hand) {
      return false;
    }
    const hiddenTiles = player.hand.tiles || [];
    if (hiddenTiles.length === 0) {
      return false;
    }
    const matchingCount = hiddenTiles.filter(
      (t) => t.suit === tile.suit && t.number === tile.number,
    ).length;
    const jokerCount = hiddenTiles.filter((t) => t.isJoker()).length;
    return matchingCount + jokerCount >= 2;
  }

  /**
   * Determine if player could call Mahjong with discarded tile
   * @param {PlayerData} player
   * @param {TileData} tile
   * @returns {boolean}
   */
  canPlayerMahjongWithTile(player, tile) {
    if (!this.cardValidator || !player || !player.hand) {
      return false;
    }
    const tempHand = player.hand.clone();
    const tileClone = tile.clone
      ? tile.clone()
      : new TileData(tile.suit, tile.number, tile.index);
    tempHand.addTile(tileClone);
    // Include both hidden and exposed tiles for validation
    const tiles = tempHand.getAllTilesIncludingExposures
      ? tempHand.getAllTilesIncludingExposures()
      : tempHand.tiles;
    const allHidden = tempHand.exposures.length === 0;
    try {
      const result = this.cardValidator.validateHand(tiles, allHidden);
      return Boolean(result && result.valid);
    } catch (error) {
      debugError("CRITICAL: CardValidator crashed during checkMahjong", error);
      // Return false to prevent game crash, but log specifically as critical
      return false;
    }
  }

  /**
   * Current player picks a tile from wall
   */
  async pickFromWall() {
    this.setState(STATE.LOOP_PICK_FROM_WALL);

    if (this.wallTiles.length === 0) {
      return; // Wall game
    }

    const player = this.players[this.currentPlayer];

    const tileDataObject = this.drawTileFromWall();
    player.hand.addTile(tileDataObject);
    player.hand.sortBySuit();

    // Emit rich tile drawn event with animation
    const drawnEvent = GameEvents.createTileDrawnEvent(
      this.currentPlayer,
      tileDataObject.toJSON(),
      {
        type: "wall-draw",
        duration: 300,
        easing: "Quad.easeOut",
      },
    );
    this.emit("TILE_DRAWN", drawnEvent);

    // Emit hand updated event
    const handEvent = GameEvents.createHandUpdatedEvent(
      this.currentPlayer,
      player.hand.toJSON(),
    );
    this.emit("HAND_UPDATED", handEvent);

    await this.sleep(ANIMATION_TIMINGS.TILE_DRAWN_DELAY);
  }

  /**
   * Current player chooses which tile to discard
   */
  async chooseDiscard() {
    this.setState(STATE.LOOP_CHOOSE_DISCARD);

    const player = this.players[this.currentPlayer];

    let tileToDiscard;
    if (player.isHuman) {
      // Prompt human player to select tile
      tileToDiscard = await this.promptUI("CHOOSE_DISCARD", {
        hand: player.hand.toJSON(),
      });
    } else {
      // AI chooses discard
      tileToDiscard = await this.aiEngine.chooseDiscard(player.hand);
    }

    if (!tileToDiscard) {
      // Attempt recovery by picking first available tile
      if (player.hand.tiles.length > 0) {
        debugWarn(
          `chooseDiscard: No tile returned for player ${this.currentPlayer}, falling back to first tile.`,
        );
        tileToDiscard = player.hand.tiles[0];
      } else {
        throw new StateError(
          `chooseDiscard: Player ${this.currentPlayer} hand is empty, cannot discard.`,
        );
      }
    }

    // Capture tile index before removing from hand (needed for animation)
    const tileIndex = player.hand.tiles.findIndex((t) =>
      t.isSameTile(tileToDiscard),
    );

    // Remove from hand
    const removed = player.hand.removeTile(tileToDiscard);
    if (!removed) {
      throw new StateError(
        `chooseDiscard: Failed to remove tile ${tileToDiscard.toString()} from player ${this.currentPlayer} hand.`,
      );
    }

    // Add to discard pile
    this.discards.push(tileToDiscard);

    // Emit rich tile discarded event with animation
    // Pass complete TileData including index
    const tileData = {
      suit: tileToDiscard.suit,
      number: tileToDiscard.number,
      index: tileToDiscard.index,
    };
    // Create animation payload - treat negative index as "no index"
    const animationPayload = {
      type: "discard-arc",
      duration:
        this.currentPlayer === 0
          ? ANIMATION_TIMINGS.DISCARD_ANIMATION_HUMAN
          : ANIMATION_TIMINGS.DISCARD_ANIMATION_AI,
      easing: "ease-out",
      rotation: this.currentPlayer === 0 ? 360 : 180,
    };
    if (tileIndex >= 0) {
      animationPayload.tileIndex = tileIndex;
    }

    const discardEvent = GameEvents.createTileDiscardedEvent(
      this.currentPlayer,
      tileData,
      animationPayload,
    );
    this.emit("TILE_DISCARDED", discardEvent);

    // Emit hand updated event
    const handEvent = GameEvents.createHandUpdatedEvent(
      this.currentPlayer,
      player.hand.toJSON(),
    );
    this.emit("HAND_UPDATED", handEvent);

    await this.sleep(ANIMATION_TIMINGS.DISCARD_COMPLETE_DELAY);
  }

  /**
   * Query other players whether they want to claim the discard
   * @returns {Promise<{claimed: boolean, player: number, claimType: string}>}
   */
  async queryClaimDiscard() {
    this.setState(STATE.LOOP_QUERY_CLAIM_DISCARD);

    const lastDiscard = this.discards[this.discards.length - 1];

    // Jokers and blanks are dead when discarded - cannot be claimed
    if (!lastDiscard || lastDiscard.isJoker() || lastDiscard.isBlank()) {
      return { claimed: false };
    }

    // Query each other player
    for (let i = 1; i <= 3; i++) {
      const playerIndex = (this.currentPlayer + i) % 4;
      const player = this.players[playerIndex];

      let claimDecision;
      if (player.isHuman) {
        const canExpose = this.canPlayerFormExposure(player, lastDiscard);
        const canMahjong = this.canPlayerMahjongWithTile(player, lastDiscard);
        if (!canExpose && !canMahjong) {
          continue;
        }
        // Prompt human
        claimDecision = await this.promptUI("CLAIM_DISCARD", {
          tile: lastDiscard.toJSON(),
          options: ["Mahjong", "Pung", "Kong", "Pass"],
        });
      } else {
        // AI decides
        const aiDecision = await this.aiEngine.claimDiscard(
          lastDiscard,
          playerIndex,
          player.hand,
        );

        // Convert PLAYER_OPTION enum to string for consistency
        if (aiDecision.playerOption === PLAYER_OPTION.MAHJONG) {
          claimDecision = "Mahjong";
        } else if (aiDecision.playerOption === PLAYER_OPTION.EXPOSE_TILES) {
          // Determine exposure type based on number of tiles
          const tileCount = aiDecision.tileArray.length;
          if (tileCount === 3) {
            claimDecision = "Pung";
          } else if (tileCount === 4) {
            claimDecision = "Kong";
          } else if (tileCount === 5) {
            claimDecision = "Quint";
          }
        } else {
          // PLAYER_OPTION.DISCARD_TILE or unknown
          claimDecision = "Pass";
        }
      }

      if (claimDecision !== "Pass") {
        // Player claimed the tile
        return {
          claimed: true,
          player: playerIndex,
          claimType: claimDecision,
        };
      }
    }

    return { claimed: false };
  }

  /**
   * Exchange a blank tile from the human player's hand with a tile in the discard pile
   * @param {TileData|Object} blankTileInput
   * @param {TileData|Object} discardTileInput
   * @returns {boolean} True if exchange succeeded
   */
  exchangeBlankWithDiscard(blankTileInput, discardTileInput) {
    if (!this.settings.useBlankTiles) {
      throw new Error("Blank exchange is disabled (house rule off)");
    }
    if (this.state !== STATE.LOOP_CHOOSE_DISCARD) {
      throw new Error("Blank exchange only allowed during discard selection");
    }

    const player = this.players[PLAYER.BOTTOM];
    if (!player || !player.isHuman) {
      throw new Error("Blank exchange only available to human player");
    }

    const blankTile = normalizeTileData(blankTileInput);
    const targetDiscardTile = normalizeTileData(discardTileInput);

    if (!blankTile.isBlank()) {
      throw new Error("Selected tile is not a blank");
    }

    const removed = player.hand.removeTile(blankTile);
    if (!removed) {
      throw new Error("Blank tile not found in hand");
    }

    const discardIndex = this.discards.findIndex((tile) =>
      tile.isSameTile(targetDiscardTile),
    );
    if (discardIndex === -1) {
      throw new Error("Selected discard tile no longer available");
    }

    const candidateTile = this.discards[discardIndex];
    if (candidateTile.isJoker()) {
      throw new Error("Cannot exchange blank for a joker");
    }

    // Remove selected tile from discard pile and push blank to the top
    const [tileToTake] = this.discards.splice(discardIndex, 1);
    this.discards.push(blankTile);

    // Add retrieved tile to hand
    player.hand.addTile(tileToTake);
    player.hand.sortBySuit();

    // Emit blank exchange event for renderers
    const exchangeEvent = GameEvents.createBlankExchangeEvent(
      PLAYER.BOTTOM,
      blankTile.toJSON(),
      tileToTake.toJSON(),
      this.discards.length - 1,
    );
    this.emit("BLANK_EXCHANGED", exchangeEvent);

    // Notify UI of updated hand state
    const handEvent = GameEvents.createHandUpdatedEvent(
      PLAYER.BOTTOM,
      player.hand.toJSON(),
    );
    this.emit("HAND_UPDATED", handEvent);

    // Inform player via message log
    const messageEvent = GameEvents.createMessageEvent(
      `Blank exchanged for ${tileToTake.getText()} from discards.`,
      "info",
    );
    this.emit("MESSAGE", messageEvent);

    return true;
  }

  /**
   * Handle a claimed discard
   * @param {Object} claimResult
   */
  handleDiscardClaim(claimResult) {
    const { player: claimingPlayerIndex, claimType } = claimResult;
    const tile = this.discards.pop(); // Remove from discard pile

    const claimingPlayer = this.players[claimingPlayerIndex];

    if (claimType === "Mahjong") {
      // Player claims mahjong - validate before accepting
      // Add claimed tile to hand temporarily for validation
      claimingPlayer.hand.addTile(tile);

      // Include both hidden and exposed tiles for validation
      const tiles = claimingPlayer.hand.getAllTilesIncludingExposures
        ? claimingPlayer.hand.getAllTilesIncludingExposures()
        : claimingPlayer.hand.tiles;
      const allHidden = claimingPlayer.hand.exposures.length === 0;

      try {
        const result = this.cardValidator.validateHand(tiles, allHidden);
        if (result && result.valid) {
          // Valid mahjong - player won!
          this.gameResult.mahjong = true;
          this.gameResult.winner = claimingPlayerIndex;
          this.endGame("mahjong");
          return;
        } else {
          // Invalid mahjong claim - remove tile and continue play
          claimingPlayer.hand.removeTile(tile);
          this.discards.push(tile); // Return tile to discard pile
          debugWarn(
            `Player ${claimingPlayerIndex} made invalid Mahjong claim - continuing play`,
          );
          this.emit(
            "MESSAGE",
            GameEvents.createMessageEvent(
              "Invalid Mahjong claim - hand does not match any winning pattern",
              "error",
            ),
          );
          return; // Don't expose tiles, just continue
        }
      } catch (error) {
        // Validation crashed - reject claim
        claimingPlayer.hand.removeTile(tile);
        this.discards.push(tile);
        debugError("CRITICAL: CardValidator crashed during Mahjong claim", error);
        this.emit(
          "MESSAGE",
          GameEvents.createMessageEvent(
            "Invalid Mahjong claim - validation error",
            "error",
          ),
        );
        return;
      }
    }

    // Add tile to claiming player's hand
    claimingPlayer.hand.addTile(tile);

    // Emit rich discard claimed event
    const tileData = {
      suit: tile.suit,
      number: tile.number,
      index: tile.index,
    };
    const claimedEvent = GameEvents.createDiscardClaimedEvent(
      claimingPlayerIndex,
      tileData,
      claimType,
    );
    this.emit("DISCARD_CLAIMED", claimedEvent);

    // Expose tiles
    this.setState(STATE.LOOP_EXPOSE_TILES);
    this.exposeTiles(claimingPlayerIndex, claimType, tile);

    // Claiming player becomes current player
    this.currentPlayer = claimingPlayerIndex;
    const turnEvent = GameEvents.createTurnChangedEvent(
      this.currentPlayer,
      (this.currentPlayer + 3) % 4,
    );
    this.emit("TURN_CHANGED", turnEvent);
  }

  /**
   * Player exposes tiles (Pung, Kong, Quint)
   * @param {number} playerIndex
   * @param {string} exposureType
   * @param {TileData} claimedTile
   */
  exposeTiles(playerIndex, exposureType, claimedTile) {
    const player = this.players[playerIndex];

    // Find matching tiles and jokers in hand (excluding the claimed tile itself)
    const matchingTiles = player.hand.tiles.filter(
      (t) => t.equals(claimedTile) && !t.isSameTile(claimedTile),
    );
    const jokerTiles = player.hand.tiles.filter((t) => t.isJoker());

    const requiredCount =
      exposureType === "Pung" ? 2 : exposureType === "Kong" ? 3 : 4;
    const totalAvailable = matchingTiles.length + jokerTiles.length;

    if (totalAvailable < requiredCount) {
      console.warn("Exposure attempted without enough tiles", {
        playerIndex,
        exposureType,
        claimedTile,
      });
      this.setState(STATE.LOOP_EXPOSE_TILES_COMPLETE);
      return;
    }

    const claimedRemoved = player.hand.removeTile(claimedTile);
    if (!claimedRemoved) {
      console.warn("Failed to remove claimed tile from hand during exposure", {
        playerIndex,
        claimedTile,
      });
    }

    const naturalTiles = matchingTiles.slice(
      0,
      Math.min(requiredCount, matchingTiles.length),
    );
    const remainingNeeded = requiredCount - naturalTiles.length;
    const jokersUsed = jokerTiles.slice(0, Math.max(0, remainingNeeded));

    const tilesToExpose = [claimedTile, ...naturalTiles, ...jokersUsed];

    // Remove from hidden hand (jokers + naturals)
    [...naturalTiles, ...jokersUsed].forEach((t) => {
      if (!player.hand.removeTile(t)) {
        console.warn("Failed to remove tile during exposure", {
          playerIndex,
          tile: t,
        });
      }
    });

    // Add to exposures
    const exposure = new ExposureData({
      type: exposureType.toUpperCase(),
      tiles: tilesToExpose,
    });
    player.hand.addExposure(exposure);

    // Emit rich tiles exposed event
    const exposedEvent = GameEvents.createTilesExposedEvent(
      playerIndex,
      exposureType,
      tilesToExpose.map((t) => ({
        suit: t.suit,
        number: t.number,
        index: t.index,
      })),
      { duration: 300 },
    );
    this.emit("TILES_EXPOSED", exposedEvent);

    // Emit hand updated event
    const handEvent = GameEvents.createHandUpdatedEvent(
      playerIndex,
      player.hand.toJSON(),
    );
    this.emit("HAND_UPDATED", handEvent);

    this.setState(STATE.LOOP_EXPOSE_TILES_COMPLETE);
  }

  /**
   * Check if current player has mahjong
   * @returns {boolean}
   */
  checkMahjong() {
    const player = this.players[this.currentPlayer];

    if (player.hand.getLength() !== 14) {
      return false;
    }

    // Use card validator to check for winning hand
    if (this.cardValidator) {
      // Card validator expects array of tiles and allHidden flag
      // Include both hidden and exposed tiles for validation
      const tiles = player.hand.getAllTilesIncludingExposures
        ? player.hand.getAllTilesIncludingExposures()
        : player.hand.tiles;
      const allHidden = player.hand.exposures.length === 0;
      const isWinning = this.cardValidator.validateHand(tiles, allHidden);
      if (isWinning && isWinning.valid) {
        this.gameResult.mahjong = true;
        this.gameResult.winner = this.currentPlayer;
        return true;
      }
    }

    return false;
  }

  /**
   * Advance to next player's turn
   */
  advanceTurn() {
    const previousPlayer = this.currentPlayer;
    this.currentPlayer = (this.currentPlayer + 1) % 4;

    // Update turn flags
    this.players[previousPlayer].isCurrentTurn = false;
    this.players[this.currentPlayer].isCurrentTurn = true;

    // Emit rich turn changed event
    const turnEvent = GameEvents.createTurnChangedEvent(
      this.currentPlayer,
      previousPlayer,
    );
    this.emit("TURN_CHANGED", turnEvent);
  }

  /**
   * End the game
   * @param {string} reason - 'mahjong', 'wall_game', 'quit'
   */
  endGame(reason) {
    this.setState(STATE.END);

    // Emit rich game ended event
    const gameEndEvent = GameEvents.createGameEndedEvent(
      reason,
      this.gameResult.winner,
      this.gameResult.mahjong,
    );
    this.emit("GAME_ENDED", gameEndEvent);

    if (reason === "mahjong") {
      const winner = this.players[this.gameResult.winner];
      const msgEvent = GameEvents.createMessageEvent(
        `${winner.name} wins with Mahjong!`,
        "info",
      );
      this.emit("MESSAGE", msgEvent);
    } else if (reason === "wall_game") {
      const msgEvent = GameEvents.createMessageEvent(
        "Wall game - no winner",
        "info",
      );
      this.emit("MESSAGE", msgEvent);
    }
  }

  /**
   * Set game state and emit event
   * @param {STATE} newState
   */
  setState(newState) {
    const oldState = this.state;
    this.state = newState;

    // Emit rich state change event
    const stateEvent = GameEvents.createStateChangedEvent(oldState, newState);
    this.emit("STATE_CHANGED", stateEvent);
  }

  /**
   * Handle hand sort requests coming from UI
   * Sorts Player 0's HandData and emits HAND_UPDATED to trigger rendering
   * @param {string} sortType - "suit" or "rank"
   */
  onSortHandRequest(sortType = "suit") {
    const player0 = this.players[PLAYER.BOTTOM];
    if (!player0 || !player0.hand) {
      return;
    }

    // Sort the hand data
    if (sortType === "rank") {
      player0.hand.sortByRank();
    } else {
      player0.hand.sortBySuit();
    }

    // Emit HAND_UPDATED to trigger rendering
    const handEvent = GameEvents.createHandUpdatedEvent(
      PLAYER.BOTTOM,
      player0.hand.toJSON(),
    );
    this.emit("HAND_UPDATED", handEvent);
  }

  /**
   * Handle joker exchange - human player exchanges a tile for an exposed joker
   * Called when human clicks "Exchange Joker" button
   * @returns {boolean} - True if exchange occurred
   */
  onExchangeJoker() {
    const humanPlayer = this.players[PLAYER.BOTTOM];

    // Safety guards
    if (!humanPlayer || !humanPlayer.hand) {
      return false;
    }

    // Prevent joker exchange during invalid game states
    const invalidStates = [
      STATE.INIT,
      STATE.DEAL,
      STATE.CHARLESTON1,
      STATE.CHARLESTON2,
      STATE.CHARLESTON_QUERY,
      STATE.COURTESY_QUERY,
      STATE.COURTESY,
    ];
    if (invalidStates.includes(this.state)) {
      this.emit(
        "MESSAGE",
        GameEvents.createMessageEvent(
          "Cannot exchange jokers during this phase",
          "warning",
        ),
      );
      return false;
    }

    // Find all exposed jokers across all players
    const exposedJokers = [];
    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      const player = this.players[playerIndex];
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

    if (exposedJokers.length === 0) {
      this.emit(
        "MESSAGE",
        GameEvents.createMessageEvent("No exposed jokers available", "info"),
      );
      return false;
    }

    // Check if human has any matching tiles
    const matchingExchanges = exposedJokers.filter((ej) =>
      ej.requiredTiles.some((reqTile) =>
        humanPlayer.hand.tiles.some(
          (handTile) =>
            handTile.suit === reqTile.suit &&
            handTile.number === reqTile.number,
        ),
      ),
    );

    if (matchingExchanges.length === 0) {
      this.emit(
        "MESSAGE",
        GameEvents.createMessageEvent("No matching tiles to exchange", "info"),
      );
      return false;
    }

    // For now, auto-select the first available exchange
    // TODO #1: Future enhancement - let user choose among multiple exchanges
    // Could use promptUI to present matchingExchanges array for selection
    const exchange = matchingExchanges[0];
    const requiredTile = exchange.requiredTiles[0];

    // Find the tile in human's hand
    const tileIndex = humanPlayer.hand.tiles.findIndex(
      (t) => t.suit === requiredTile.suit && t.number === requiredTile.number,
    );

    if (tileIndex === -1) {
      return false;
    }

    // Perform the exchange
    const humanTile = humanPlayer.hand.tiles[tileIndex];
    const jokerTile = exchange.jokerTile;

    // Remove tile from human's hand, add joker (use HandData API)
    humanPlayer.hand.removeTile(humanTile);
    humanPlayer.hand.addTile(jokerTile);

    // Update the exposure - replace joker with human's tile
    const ownerPlayer = this.players[exchange.playerIndex];
    ownerPlayer.hand.exposures[exchange.exposureIndex].tiles[
      exchange.tileIndex
    ] = humanTile;

    // Emit joker swapped event (for backward compatibility with PhaserAdapter)
    this.emit("JOKER_SWAPPED", {
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
    this.emit("HAND_UPDATED", humanHandEvent);

    const ownerHandEvent = GameEvents.createHandUpdatedEvent(
      exchange.playerIndex,
      ownerPlayer.hand.toJSON(),
    );
    this.emit("HAND_UPDATED", ownerHandEvent);

    this.emit(
      "MESSAGE",
      GameEvents.createMessageEvent(
        `Exchanged ${humanTile.getText()} for joker`,
        "info",
      ),
    );

    return true;
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

  /**
   * Prompt UI layer for user input (returns a Promise)
   * UI layer must call the provided callback with the result
   * @param {string} promptType
   * @param {Object} options
   * @returns {Promise}
   */
  promptUI(promptType, options) {
    return new Promise((resolve) => {
      this.emit("UI_PROMPT", {
        promptType,
        options,
        callback: (result) => resolve(result),
      });
    });
  }

  /**
   * Helper to sleep/delay
   * @param {number} ms - Milliseconds
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current game state snapshot (for debugging/persistence)
   * @returns {Object}
   */
  getGameState() {
    return {
      state: this.state,
      currentPlayer: this.currentPlayer,
      players: this.players.map((p) => p.toJSON()),
      wallCount: this.wallTiles.length,
      discardCount: this.discards.length,
      gameResult: this.gameResult,
    };
  }
}

/**
 * Normalize tile data into TileData instances
 * @param {TileData|Object} tile
 * @param {number} fallbackIndex
 * @returns {TileData}
 */
function normalizeTileData(tile, fallbackIndex = -1) {
  if (tile instanceof TileData) {
    return tile.clone();
  }

  if (tile && typeof tile === "object" && typeof tile.suit === "number") {
    const index = typeof tile.index === "number" ? tile.index : fallbackIndex;
    return new TileData(tile.suit, tile.number ?? 0, index);
  }

  throw new Error("Wall generator produced invalid tile data");
}

/**
 * Build default tile set (used for tests or non-visual environments)
 * @param {boolean} includeBlanks
 * @returns {TileData[]}
 */
function buildDefaultWallTiles(includeBlanks = false) {
  const tiles = [];
  let indexCounter = 0;

  for (const group of gTileGroups) {
    if (group.suit === SUIT.BLANK && !includeBlanks) {
      continue;
    }

    const prefixes = Array.isArray(group.prefix)
      ? group.prefix
      : [group.prefix];

    for (const prefix of prefixes) {
      for (let num = 1; num <= group.maxNum; num++) {
        let tileNumber = num;
        if (group.maxNum === 1) {
          if (group.suit === SUIT.FLOWER) {
            tileNumber = 0;
          } else {
            tileNumber = prefixes.indexOf(prefix);
          }
        }

        for (let dup = 0; dup < group.count; dup++) {
          tiles.push(new TileData(group.suit, tileNumber, indexCounter++));
        }
      }
    }
  }

  return tiles;
}

/**
 * Fisher-Yates shuffle producing a new array
 * @param {TileData[]} tiles
 * @returns {TileData[]}
 */
function shuffleTileArray(tiles) {
  const shuffled = tiles.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
