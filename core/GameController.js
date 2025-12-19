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
  SUIT,
  WIND,
} from "../constants.js";
import { PlayerData } from "./models/PlayerData.js";
import { TileData } from "./models/TileData.js";
import * as GameEvents from "./events/GameEvents.js";
import { gTileGroups } from "./tileDefinitions.js";
import { debugWarn } from "../utils.js";
import { StateError } from "./errors/GameErrors.js";
import { DealingManager } from "./phases/DealingManager.js";
import { CharlestonManager } from "./phases/CharlestonManager.js";
import { CourtesyManager } from "./phases/CourtesyManager.js";
import { GameLoopManager } from "./phases/GameLoopManager.js";
import { JokerExchangeManager } from "./phases/JokerExchangeManager.js";

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

    /** @type {DealingManager} Manages tile dealing logic */
    this.dealingManager = new DealingManager(this);

    /** @type {CharlestonManager} Manages Charleston tile passing phase */
    this.charlestonManager = new CharlestonManager(this);

    /** @type {CourtesyManager} Manages courtesy pass phase */
    this.courtesyManager = new CourtesyManager(this);

    /** @type {GameLoopManager} Manages main game loop (draw/discard/claim cycle) */
    this.gameLoopManager = new GameLoopManager(this);

    /** @type {JokerExchangeManager} Manages joker exchange functionality */
    this.jokerExchangeManager = new JokerExchangeManager(this);
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
  async dealTiles() {
    this.setState(STATE.DEAL);

    const dealSequence = this.dealingManager.buildInitialDealSequence();
    this.dealingManager.emitDealingStartEvent(dealSequence);
    await this.dealingManager.waitForDealingComplete();
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
    await this.charlestonManager.executeCharlestonPasses(1);

    // Query whether to continue to phase 2
    this.setState(STATE.CHARLESTON_QUERY);
    const continueToPhase2 =
      await this.charlestonManager.queryCharlestonContinue();

    if (continueToPhase2) {
      // Charleston Phase 2 (optional)
      this.charlestonState.phase = 2;
      await this.charlestonManager.executeCharlestonPasses(2);
    }

    // Courtesy pass query
    await this.courtesyPhase();

    // Move to game loop
    await this.gameLoop();
  }

  /**
   * Courtesy pass phase (optional tile exchange)
   * Delegates to CourtesyManager for all courtesy phase logic
   */
  async courtesyPhase() {
    await this.courtesyManager.executeCourtesyPhase();
  }

  /**
   * Main game loop (draw → discard → claim check → repeat)
   * Delegates to GameLoopManager for all main game loop logic
   */
  async gameLoop() {
    await this.gameLoopManager.execute();
  }

  /**
   * Exchange a blank tile from the human player's hand with a tile in the discard pile
   * Delegates to GameLoopManager
   * @param {TileData|Object} blankTileInput
   * @param {TileData|Object} discardTileInput
   * @returns {boolean} True if exchange succeeded
   */
  exchangeBlankWithDiscard(blankTileInput, discardTileInput) {
    return this.gameLoopManager.exchangeBlankWithDiscard(
      blankTileInput,
      discardTileInput,
    );
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
   * Delegates to JokerExchangeManager
   * @returns {Promise<boolean>} - True if exchange occurred
   */
  async onExchangeJoker() {
    return this.jokerExchangeManager.execute();
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
