/* eslint-disable no-await-in-loop */
import { STATE, PLAYER_OPTION, ANIMATION_TIMINGS } from "../../constants.js";
import { debugWarn, debugError, normalizeTileData } from "../../utils.js";
import * as GameEvents from "../events/GameEvents.js";
import { StateError } from "../errors/GameErrors.js";
import { TileData } from "../models/TileData.js";

/**
 * GameLoopManager - Handles main game loop logic
 *
 * Responsibilities:
 * - Main game loop orchestration (draw → discard → claim → repeat)
 * - Tile drawing from wall
 * - Discard selection (human and AI)
 * - Claim queries and processing
 * - Exposure handling (Pung, Kong, Quint)
 * - Mahjong validation and win condition checking
 * - Blank tile exchange logic
 * - Turn advancement
 */
export class GameLoopManager {
  /**
   * @param {GameController} gameController - Reference to game controller
   */
  constructor(gameController) {
    this.gameController = gameController;
  }

  /**
   * Main game loop (draw → discard → claim check → repeat)
   */
  async execute() {
    this.gameController.setState(STATE.LOOP_PICK_FROM_WALL);

    while (
      this.gameController.state !== STATE.END &&
      this.gameController.wallTiles.length > 0
    ) {
      // Draw only when the current player is at the standard 13-tile count
      if (this.shouldDrawTile()) {
        await this.pickFromWall();

        // Check for Mahjong after drawing (self-draw win)
        if (this.checkMahjong()) {
          this.gameController.endGame("mahjong");
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
        if (this.gameController.gameResult.mahjong) {
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
    if (
      this.gameController.wallTiles.length === 0 &&
      !this.gameController.gameResult.mahjong
    ) {
      this.gameController.endGame("wall_game");
    }
  }

  /**
   * Remove top tile from wall
   * @returns {TileData}
   */
  drawTileFromWall() {
    if (this.gameController.wallTiles.length === 0) {
      throw new StateError("Attempted to draw from an empty wall");
    }
    return this.gameController.wallTiles.pop();
  }

  /**
   * Determine whether current player should draw from wall
   * @returns {boolean}
   */
  shouldDrawTile() {
    const player =
      this.gameController.players[this.gameController.currentPlayer];
    if (!player || !player.hand) {
      return false;
    }
    return player.hand.getLength() === 13;
  }

  /**
   * Current player picks a tile from wall
   */
  async pickFromWall() {
    this.gameController.setState(STATE.LOOP_PICK_FROM_WALL);

    if (this.gameController.wallTiles.length === 0) {
      return; // Wall game
    }

    const player =
      this.gameController.players[this.gameController.currentPlayer];

    const tileDataObject = this.drawTileFromWall();
    player.hand.addTile(tileDataObject);
    player.hand.sortBySuit();

    // Emit rich tile drawn event with animation
    const drawnEvent = GameEvents.createTileDrawnEvent(
      this.gameController.currentPlayer,
      tileDataObject.toJSON(),
      {
        type: "wall-draw",
        duration: 300,
        easing: "Quad.easeOut",
      },
    );
    this.gameController.emit("TILE_DRAWN", drawnEvent);

    // Emit hand updated event
    const handEvent = GameEvents.createHandUpdatedEvent(
      this.gameController.currentPlayer,
      player.hand.toJSON(),
    );
    this.gameController.emit("HAND_UPDATED", handEvent);

    await this.gameController.sleep(ANIMATION_TIMINGS.TILE_DRAWN_DELAY);
  }

  /**
   * Current player chooses which tile to discard
   */
  async chooseDiscard() {
    this.gameController.setState(STATE.LOOP_CHOOSE_DISCARD);

    const player =
      this.gameController.players[this.gameController.currentPlayer];

    let tileToDiscard;
    if (player.isHuman) {
      // Prompt human player to select tile
      tileToDiscard = await this.gameController.promptUI("CHOOSE_DISCARD", {
        hand: player.hand.toJSON(),
      });
    } else {
      // AI chooses discard
      tileToDiscard = await this.gameController.aiEngine.chooseDiscard(
        player.hand,
      );
    }

    if (!tileToDiscard) {
      // Attempt recovery by picking first available tile
      if (player.hand.tiles.length > 0) {
        debugWarn(
          `chooseDiscard: No tile returned for player ${this.gameController.currentPlayer}, falling back to first tile.`,
        );
        tileToDiscard = player.hand.tiles[0];
      } else {
        throw new StateError(
          `chooseDiscard: Player ${this.gameController.currentPlayer} hand is empty, cannot discard.`,
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
        `chooseDiscard: Failed to remove tile ${tileToDiscard.toString()} from player ${this.gameController.currentPlayer} hand.`,
      );
    }

    // Add to discard pile
    this.gameController.discards.push(tileToDiscard);

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
        this.gameController.currentPlayer === 0
          ? ANIMATION_TIMINGS.DISCARD_ANIMATION_HUMAN
          : ANIMATION_TIMINGS.DISCARD_ANIMATION_AI,
      easing: "ease-out",
      rotation: this.gameController.currentPlayer === 0 ? 360 : 180,
    };
    if (tileIndex >= 0) {
      animationPayload.tileIndex = tileIndex;
    }

    const discardEvent = GameEvents.createTileDiscardedEvent(
      this.gameController.currentPlayer,
      tileData,
      animationPayload,
    );
    this.gameController.emit("TILE_DISCARDED", discardEvent);

    // Emit hand updated event
    const handEvent = GameEvents.createHandUpdatedEvent(
      this.gameController.currentPlayer,
      player.hand.toJSON(),
    );
    this.gameController.emit("HAND_UPDATED", handEvent);

    await this.gameController.sleep(ANIMATION_TIMINGS.DISCARD_COMPLETE_DELAY);
  }

  /**
   * Query other players whether they want to claim the discard
   * @returns {Promise<{claimed: boolean, player: number, claimType: string}>}
   */
  async queryClaimDiscard() {
    this.gameController.setState(STATE.LOOP_QUERY_CLAIM_DISCARD);

    const lastDiscard =
      this.gameController.discards[this.gameController.discards.length - 1];

    // Jokers and blanks are dead when discarded - cannot be claimed
    if (!lastDiscard || lastDiscard.isJoker() || lastDiscard.isBlank()) {
      return { claimed: false };
    }

    // Query each other player in turn order
    for (let i = 1; i <= 3; i++) {
      const playerIndex = (this.gameController.currentPlayer + i) % 4;
      const player = this.gameController.players[playerIndex];

      const claimDecision = await this.getPlayerClaimDecision(
        player,
        playerIndex,
        lastDiscard,
      );

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
   * Get claim decision from a single player (human or AI)
   * @param {PlayerData} player
   * @param {number} playerIndex
   * @param {TileData} lastDiscard
   * @returns {Promise<string>} - "Mahjong", "Pung", "Kong", "Quint", or "Pass"
   */
  getPlayerClaimDecision(player, playerIndex, lastDiscard) {
    if (player.isHuman) {
      return this.getHumanClaimDecision(player, lastDiscard);
    } else {
      return this.getAIClaimDecision(player, playerIndex, lastDiscard);
    }
  }

  /**
   * Get claim decision from human player
   * @param {PlayerData} player
   * @param {TileData} lastDiscard
   * @returns {Promise<string>}
   */
  getHumanClaimDecision(player, lastDiscard) {
    const canExpose = this.canPlayerFormExposure(player, lastDiscard);
    const canMahjong = this.canPlayerMahjongWithTile(player, lastDiscard);

    if (!canExpose && !canMahjong) {
      return Promise.resolve("Pass");
    }

    // Prompt human
    return this.gameController.promptUI("CLAIM_DISCARD", {
      tile: lastDiscard.toJSON(),
      options: ["Mahjong", "Pung", "Kong", "Pass"],
    });
  }

  /**
   * Get claim decision from AI player
   * @param {PlayerData} player
   * @param {number} playerIndex
   * @param {TileData} lastDiscard
   * @returns {Promise<string>}
   */
  async getAIClaimDecision(player, playerIndex, lastDiscard) {
    // AI decides
    const aiDecision = await this.gameController.aiEngine.claimDiscard(
      lastDiscard,
      playerIndex,
      player.hand,
    );

    return this.convertAIDecisionToClaimType(aiDecision);
  }

  /**
   * Convert AI decision enum to claim type string
   * @param {Object} aiDecision - {playerOption: PLAYER_OPTION, tileArray: TileData[]}
   * @returns {string} - "Mahjong", "Pung", "Kong", "Quint", or "Pass"
   */
  convertAIDecisionToClaimType(aiDecision) {
    // Convert PLAYER_OPTION enum to string for consistency
    if (aiDecision.playerOption === PLAYER_OPTION.MAHJONG) {
      return "Mahjong";
    } else if (aiDecision.playerOption === PLAYER_OPTION.EXPOSE_TILES) {
      // Determine exposure type based on number of tiles
      const tileCount = aiDecision.tileArray.length;
      if (tileCount === 3) {
        return "Pung";
      } else if (tileCount === 4) {
        return "Kong";
      } else if (tileCount === 5) {
        return "Quint";
      }
    }

    // PLAYER_OPTION.DISCARD_TILE or unknown
    return "Pass";
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
    if (
      !this.gameController.cardValidator ||
      !player ||
      !player.hand
    ) {
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
      const result = this.gameController.cardValidator.validateHand(
        tiles,
        allHidden,
      );
      return Boolean(result && result.valid);
    } catch (error) {
      debugError("CRITICAL: CardValidator crashed during checkMahjong", error);
      // Return false to prevent game crash, but log specifically as critical
      return false;
    }
  }

  /**
   * Handle a claimed discard
   * @param {Object} claimResult
   */
  handleDiscardClaim(claimResult) {
    const { player: claimingPlayerIndex, claimType } = claimResult;
    const tile = this.gameController.discards.pop(); // Remove from discard pile

    const claimingPlayer = this.gameController.players[claimingPlayerIndex];

    // Handle Mahjong claims separately (win condition)
    if (claimType === "Mahjong") {
      this.handleMahjongClaim(claimingPlayerIndex, claimingPlayer, tile);
      return;
    }

    // Handle exposure claims (Pung, Kong, Quint)
    this.handleExposureClaim(
      claimingPlayerIndex,
      claimingPlayer,
      tile,
      claimType,
    );
  }

  /**
   * Validate and handle a Mahjong claim
   * @param {number} claimingPlayerIndex
   * @param {PlayerData} claimingPlayer
   * @param {TileData} tile
   */
  handleMahjongClaim(claimingPlayerIndex, claimingPlayer, tile) {
    // Add claimed tile to hand temporarily for validation
    claimingPlayer.hand.addTile(tile);

    // Include both hidden and exposed tiles for validation
    const tiles = claimingPlayer.hand.getAllTilesIncludingExposures
      ? claimingPlayer.hand.getAllTilesIncludingExposures()
      : claimingPlayer.hand.tiles;
    const allHidden = claimingPlayer.hand.exposures.length === 0;

    try {
      const result = this.gameController.cardValidator.validateHand(
        tiles,
        allHidden,
      );
      if (result && result.valid) {
        // Valid mahjong - player won!
        this.gameController.gameResult.mahjong = true;
        this.gameController.gameResult.winner = claimingPlayerIndex;
        this.gameController.endGame("mahjong");
        return;
      } else {
        // Invalid mahjong claim
        this.rejectMahjongClaim(claimingPlayerIndex, claimingPlayer, tile);
      }
    } catch (error) {
      // Validation crashed - reject claim
      debugError("CRITICAL: CardValidator crashed during Mahjong claim", error);
      this.rejectMahjongClaim(claimingPlayerIndex, claimingPlayer, tile, true);
    }
  }

  /**
   * Reject an invalid Mahjong claim and return tile to discard pile
   * @param {number} claimingPlayerIndex
   * @param {PlayerData} claimingPlayer
   * @param {TileData} tile
   * @param {boolean} validationError
   */
  rejectMahjongClaim(
    claimingPlayerIndex,
    claimingPlayer,
    tile,
    validationError = false,
  ) {
    // Remove tile and return to discard pile
    claimingPlayer.hand.removeTile(tile);
    this.gameController.discards.push(tile);

    debugWarn(
      `Player ${claimingPlayerIndex} made invalid Mahjong claim - continuing play`,
    );

    const errorMessage = validationError
      ? "Invalid Mahjong claim - validation error"
      : "Invalid Mahjong claim - hand does not match any winning pattern";

    this.gameController.emit(
      "MESSAGE",
      GameEvents.createMessageEvent(errorMessage, "error"),
    );
  }

  /**
   * Handle an exposure claim (Pung, Kong, Quint)
   * @param {number} claimingPlayerIndex
   * @param {PlayerData} claimingPlayer
   * @param {TileData} tile
   * @param {string} claimType
   */
  handleExposureClaim(claimingPlayerIndex, claimingPlayer, tile, claimType) {
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
    this.gameController.emit("DISCARD_CLAIMED", claimedEvent);

    // Expose tiles
    this.gameController.setState(STATE.LOOP_EXPOSE_TILES);
    this.exposeTiles(claimingPlayerIndex, claimType, tile);

    // Claiming player becomes current player
    this.gameController.currentPlayer = claimingPlayerIndex;
    const turnEvent = GameEvents.createTurnChangedEvent(
      this.gameController.currentPlayer,
      (this.gameController.currentPlayer + 3) % 4,
    );
    this.gameController.emit("TURN_CHANGED", turnEvent);
  }

  /**
   * Player exposes tiles (Pung, Kong, Quint)
   * @param {number} playerIndex
   * @param {string} exposureType
   * @param {TileData} claimedTile
   */
  exposeTiles(playerIndex, exposureType, claimedTile) {
    const player = this.gameController.players[playerIndex];

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
      return;
    }

    // Take matching tiles first
    const tilesToExpose = matchingTiles.slice(0, requiredCount);

    // Add jokers if needed
    const jokersNeeded = requiredCount - tilesToExpose.length;
    if (jokersNeeded > 0) {
      const jokersToUse = jokerTiles.slice(0, jokersNeeded);
      tilesToExpose.push(...jokersToUse);
    }

    // Remove from hand
    tilesToExpose.forEach((tile) => {
      player.hand.removeTile(tile);
    });

    // Include claimed tile in exposure
    tilesToExpose.push(claimedTile);

    // Add to exposures
    player.hand.addExposure(tilesToExpose, exposureType);

    // Emit event
    const exposedEvent = GameEvents.createTilesExposedEvent(
      playerIndex,
      tilesToExpose.map((t) => t.toJSON()),
      exposureType,
    );
    this.gameController.emit("TILES_EXPOSED", exposedEvent);

    // Emit hand updated event
    const handEvent = GameEvents.createHandUpdatedEvent(
      playerIndex,
      player.hand.toJSON(),
    );
    this.gameController.emit("HAND_UPDATED", handEvent);
  }

  /**
   * Exchange a blank tile from the human player's hand with a tile in the discard pile
   * @param {TileData|Object} blankTileInput
   * @param {TileData|Object} discardTileInput
   * @returns {boolean} True if exchange succeeded
   */
  exchangeBlankWithDiscard(blankTileInput, discardTileInput) {
    if (!this.gameController.settings.useBlankTiles) {
      throw new Error("Blank exchange is disabled (house rule off)");
    }
    if (this.gameController.state !== STATE.LOOP_CHOOSE_DISCARD) {
      throw new Error("Blank exchange only allowed during discard selection");
    }

    const player = this.gameController.players[0]; // PLAYER.BOTTOM
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

    const discardIndex = this.gameController.discards.findIndex((tile) =>
      tile.isSameTile(targetDiscardTile),
    );
    if (discardIndex === -1) {
      throw new Error("Selected discard tile no longer available");
    }

    const candidateTile = this.gameController.discards[discardIndex];
    if (candidateTile.isJoker()) {
      throw new Error("Cannot exchange blank for a joker");
    }

    // Remove selected tile from discard pile and push blank to the top
    const [tileToTake] = this.gameController.discards.splice(discardIndex, 1);
    this.gameController.discards.push(blankTile);

    // Add retrieved tile to hand
    player.hand.addTile(tileToTake);
    player.hand.sortBySuit();

    // Emit blank exchange event for renderers
    const exchangeEvent = GameEvents.createBlankExchangeEvent(
      0, // PLAYER.BOTTOM
      blankTile.toJSON(),
      tileToTake.toJSON(),
      this.gameController.discards.length - 1,
    );
    this.gameController.emit("BLANK_EXCHANGED", exchangeEvent);

    // Notify UI of updated hand state
    const handEvent = GameEvents.createHandUpdatedEvent(
      0, // PLAYER.BOTTOM
      player.hand.toJSON(),
    );
    this.gameController.emit("HAND_UPDATED", handEvent);

    // Inform player via message log
    const messageEvent = GameEvents.createMessageEvent(
      `Blank exchanged for ${tileToTake.getText()} from discards.`,
      "info",
    );
    this.gameController.emit("MESSAGE", messageEvent);

    return true;
  }

  /**
   * Check if current player has mahjong
   * @returns {boolean}
   */
  checkMahjong() {
    const player =
      this.gameController.players[this.gameController.currentPlayer];

    if (player.hand.getLength() !== 14) {
      return false;
    }

    // Use card validator to check for winning hand
    if (this.gameController.cardValidator) {
      // Card validator expects array of tiles and allHidden flag
      // Include both hidden and exposed tiles for validation
      const tiles = player.hand.getAllTilesIncludingExposures
        ? player.hand.getAllTilesIncludingExposures()
        : player.hand.tiles;
      const allHidden = player.hand.exposures.length === 0;
      const isWinning = this.gameController.cardValidator.validateHand(
        tiles,
        allHidden,
      );
      if (isWinning && isWinning.valid) {
        this.gameController.gameResult.mahjong = true;
        this.gameController.gameResult.winner =
          this.gameController.currentPlayer;
        return true;
      }
    }

    return false;
  }

  /**
   * Advance to next player's turn
   */
  advanceTurn() {
    const previousPlayer = this.gameController.currentPlayer;
    this.gameController.currentPlayer =
      (this.gameController.currentPlayer + 1) % 4;

    const turnEvent = GameEvents.createTurnChangedEvent(
      this.gameController.currentPlayer,
      previousPlayer,
    );
    this.gameController.emit("TURN_CHANGED", turnEvent);
  }
}
