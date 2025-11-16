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

import {EventEmitter} from "./events/EventEmitter.js";
import {STATE, PLAYER, PLAYER_OPTION, SUIT} from "../constants.js";
import {PlayerData} from "./models/PlayerData.js";
import {TileData} from "./models/TileData.js";
import {ExposureData} from "./models/HandData.js";
import * as GameEvents from "./events/GameEvents.js";
import {gTileGroups} from "./tileDefinitions.js";

const CHARLESTON_DIRECTION_SEQUENCE = {
    1: ["right", "across", "left"],
    2: ["left", "across", "right"]
};

const CHARLESTON_DIRECTION_OFFSETS = {
    right: PLAYER.RIGHT,
    across: PLAYER.TOP,
    left: PLAYER.LEFT
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
    [PLAYER.BOTTOM, 1]
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
            skipCharleston: false
        };

        /** @type {Object} Charleston state */
        this.charlestonState = {
            phase: 0,  // 0, 1, 2
            passCount: 0,
            continueToPhase2: false,
            courtesyVotes: []
        };

        /** @type {Object} Game result */
        this.gameResult = {
            mahjong: false,
            winner: -1,
            winningHand: null
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
            this.settings = {...this.settings, ...options.settings};
        }

        // Initialize 4 players
        this.players = [
            new PlayerData(PLAYER.BOTTOM, "You"),
            new PlayerData(PLAYER.RIGHT, "Opponent 1"),
            new PlayerData(PLAYER.TOP, "Opponent 2"),
            new PlayerData(PLAYER.LEFT, "Opponent 3")
        ];

        // Emit initialization message
        const msgEvent = GameEvents.createMessageEvent(
            `Game initialized with ${this.settings.year} card`,
            "info"
        );
        this.emit("MESSAGE", msgEvent);
    }

    /**
     * Start a new game
     *
     * Phase 2B: Full implementation
     * GameController now handles entire game flow.
     */
    async startGame() {
        this.setState(STATE.START);

        // Reset game state
        this.gameResult = {mahjong: false, winner: -1, winningHand: null};
        this.charlestonState = {phase: 0, passCount: 0, continueToPhase2: false, courtesyVotes: []};
        this.discards = [];
        this.currentPlayer = PLAYER.BOTTOM;

        // Create wall
        this.createWall();

        // Emit game started event with rich structure
        const gameStartedEvent = GameEvents.createGameStartedEvent(
            this.players.map(player => player.toJSON())
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
            throw new Error("Failed to generate wall tiles. Wall generator returned empty set.");
        }

        // Normalize into TileData instances
        const normalizedTiles = rawTiles.map((tile, idx) => normalizeTileData(tile, idx));

        // Shuffle for randomness
        this.wallTiles = shuffleTileArray(normalizedTiles);

        // Emit event so adapters can prepare their own tile maps
        this.emit("WALL_CREATED", {
            tileCount: this.wallTiles.length
        });

        this.emit("MESSAGE", {
            text: `Wall created with ${this.wallTiles.length} tiles`,
            type: "info"
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

        // Emit updated hands for all players so UI layers can sync immediately
        this.players.forEach((player, index) => {
            const handEvent = GameEvents.createHandUpdatedEvent(index, player.hand.toJSON());
            this.emit("HAND_UPDATED", handEvent);
        });

        // Wait for dealing to complete (PhaserAdapter will trigger this via callback)
        return new Promise(resolve => {
            this.once("DEALING_COMPLETE", resolve);
        });
    }

    /**
     * Build the initial dealing sequence and mutate player hands accordingly
     * @returns {Array<{player:number, tiles:Object[]}>}
     */
    buildInitialDealSequence() {
        const sequence = [];

        for (const [playerIndex, tileCount] of DEAL_SEQUENCE) {
            const tilesForPlayer = [];
            const player = this.players[playerIndex];

            for (let i = 0; i < tileCount; i++) {
                const tileData = this.drawTileFromWall();
                player.hand.addTile(tileData);
                tilesForPlayer.push(tileData.toJSON());
            }

            // Keep human hand sorted for readability
            player.hand.sortBySuit();

            sequence.push({
                player: playerIndex,
                tiles: tilesForPlayer
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
        const directionSequence = CHARLESTON_DIRECTION_SEQUENCE[phase] || CHARLESTON_DIRECTION_SEQUENCE[1];

        for (let i = 0; i < directionSequence.length; i++) {
            const directionName = directionSequence[i];
            const direction = CHARLESTON_DIRECTION_OFFSETS[directionName];
            if (typeof direction !== "number") {
                continue;
            }
            this.setState(phase === 1 ? STATE.CHARLESTON1 : STATE.CHARLESTON2);

            // Emit rich Charleston phase event
            const phaseEvent = GameEvents.createCharlestonPhaseEvent(phase, i + 1, directionName);
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
                        requiredCount: 3
                    });
                } else {
                    // AI selects tiles
                    tilesToPass = await this.aiEngine.charlestonPass(player.hand);
                }

                // Remove tiles from player's hand
                tilesToPass.forEach(tile => player.hand.removeTile(tile));

                charlestonPassArray[playerIndex] = tilesToPass;

                // Emit rich Charleston pass event
                const toPlayer = (playerIndex + direction) % 4;
                const passEvent = GameEvents.createCharlestonPassEvent(
                    playerIndex,
                    toPlayer,
                    directionName,
                    tilesToPass.map(t => ({suit: t.suit, number: t.number})),
                    {duration: 400}
                );
                this.emit("CHARLESTON_PASS", passEvent);
            }

            // Exchange tiles between players based on direction
            for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
                const fromPlayer = playerIndex;
                const toPlayer = (playerIndex + direction) % 4;

                // Add tiles to receiving player
                charlestonPassArray[fromPlayer].forEach(tile => {
                    this.players[toPlayer].hand.addTile(tile);
                });

                // Emit hand updated for receiving player
                const handEvent = GameEvents.createHandUpdatedEvent(
                    toPlayer,
                    this.players[toPlayer].hand.toJSON()
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
            options: ["Yes", "No"]
        });

        // AI players vote
        const aiVotes = this.players
            .filter(p => !p.isHuman)
            .map(p => this.aiEngine.charlestonContinueVote(p.hand));

        const yesVotes = [humanVote === "Yes", ...aiVotes].filter(v => v).length;

        return yesVotes >= 2;  // Majority wins
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
                    question: "Courtesy Pass: How many tiles to exchange with opposite player?",
                    options: ["0", "1", "2", "3"]
                });
                vote = parseInt(voteStr, 10);
                if (isNaN(vote) || vote < 0 || vote > 3) {
                    vote = 0; // Default to 0 for safety
                }
            } else {
                vote = await this.aiEngine.courtesyVote(player.hand);
            }

            votes.push({player: player.position, vote});

            // Emit rich courtesy vote event
            const voteEvent = GameEvents.createCourtesyVoteEvent(player.position, vote);
            this.emit("COURTESY_VOTE", voteEvent);
        }

        // If at least 2 players voted for more than 0 tiles, do courtesy pass
        const yesVotes = votes.filter(v => v.vote > 0).length;
        if (yesVotes >= 2) {
            this.setState(STATE.COURTESY);

            // Calculate agreed-upon courtesy pass counts for opposite players
            const player02Vote = Math.min(votes[0].vote, votes[2].vote);
            const player13Vote = Math.min(votes[1].vote, votes[3].vote);

            if (player02Vote > 0 || player13Vote > 0) {
                // Emit rich message event
                const msgEvent = GameEvents.createMessageEvent(
                    `Courtesy pass approved. P0-P2 pass ${player02Vote}, P1-P3 pass ${player13Vote}.`,
                    "info"
                );
                this.emit("MESSAGE", msgEvent);

                // Collect tiles from each player
                const tilesToPass = [];

                // Sequential processing required - human player needs to select tiles via UI
                for (let i = 0; i < 4; i++) {
                    const player = this.players[i];
                    const maxTiles = (i === 0 || i === 2) ? player02Vote : player13Vote;

                    if (maxTiles === 0) {
                        tilesToPass[i] = [];
                        continue;
                    }

                    let selectedTiles;
                    if (player.isHuman) {
                        // Prompt human to select tiles (flexible range: 1 to maxTiles)
                        selectedTiles = await this.promptUI("SELECT_TILES", {
                            question: `Select 1–${maxTiles} tile(s) to pass to opposite player`,
                            minTiles: 1,
                            maxTiles: maxTiles
                        });
                    } else {
                        // AI selects tiles using courtesyPass method
                        selectedTiles = await this.aiEngine.courtesyPass(player.hand, maxTiles);
                    }

                    tilesToPass[i] = selectedTiles;

                    // Remove tiles from player's hand
                    selectedTiles.forEach(tile => player.hand.removeTile(tile));

                    // Emit rich courtesy pass event
                    const oppositePlayer = (i + 2) % 4;
                    const passEvent = GameEvents.createCourtesyPassEvent(
                        i,
                        oppositePlayer,
                        selectedTiles.map(t => ({suit: t.suit, number: t.number})),
                        {duration: 500}
                    );
                    this.emit("COURTESY_PASS", passEvent);
                }

                // Exchange tiles with opposite players (0↔2, 1↔3)
                for (let i = 0; i < 4; i++) {
                    const oppositePlayer = (i + 2) % 4;
                    const receivedTiles = tilesToPass[oppositePlayer];

                    receivedTiles.forEach(tile => this.players[i].hand.addTile(tile));

                    if (receivedTiles.length > 0) {
                        // Emit rich tiles received event
                        const receivedEvent = GameEvents.createTilesReceivedEvent(
                            i,
                            receivedTiles.map(t => ({suit: t.suit, number: t.number})),
                            oppositePlayer,
                            {duration: 500}
                        );
                        this.emit("TILES_RECEIVED", receivedEvent);
                    }
                }

                // Sort all hands
                this.players.forEach(player => player.hand.sortBySuit());

                // Emit hand updates for all players
                this.players.forEach((player, i) => {
                    const handEvent = GameEvents.createHandUpdatedEvent(i, player.hand.toJSON());
                    this.emit("HAND_UPDATED", handEvent);
                });

                // Emit completion message
                const completeMsg = GameEvents.createMessageEvent("Courtesy pass complete.", "info");
                this.emit("MESSAGE", completeMsg);
            } else {
                // Emit skip message
                const skipMsg = GameEvents.createMessageEvent(
                    "Courtesy pass skipped (opposite players must both agree).",
                    "info"
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
            // Current player draws a tile
            await this.pickFromWall();

            // Check for Mahjong after drawing (self-draw win)
            if (this.checkMahjong()) {
                this.endGame("mahjong");
                return;
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
                    return;  // Game ended
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
            throw new Error("Attempted to draw from an empty wall");
        }
        return this.wallTiles.pop();
    }

    /**
     * Current player picks a tile from wall
     */
    async pickFromWall() {
        this.setState(STATE.LOOP_PICK_FROM_WALL);

        if (this.wallTiles.length === 0) {
            return;  // Wall game
        }

        const player = this.players[this.currentPlayer];

        const tileDataObject = this.drawTileFromWall();
        player.hand.addTile(tileDataObject);
        player.hand.sortBySuit();

        // Emit rich tile drawn event with animation
        const drawnEvent = GameEvents.createTileDrawnEvent(this.currentPlayer, tileDataObject.toJSON(), {
            type: "wall-draw",
            duration: 300,
            easing: "Quad.easeOut"
        });
        this.emit("TILE_DRAWN", drawnEvent);

        // Emit hand updated event
        const handEvent = GameEvents.createHandUpdatedEvent(this.currentPlayer, player.hand.toJSON());
        this.emit("HAND_UPDATED", handEvent);

        await this.sleep(300);
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
                hand: player.hand.toJSON()
            });
        } else {
            // AI chooses discard
            tileToDiscard = await this.aiEngine.chooseDiscard(player.hand);
        }

        // Remove from hand
        player.hand.removeTile(tileToDiscard);

        // Add to discard pile
        this.discards.push(tileToDiscard);

        // Emit rich tile discarded event with animation
        // Pass complete TileData including index
        const tileData = {
            suit: tileToDiscard.suit,
            number: tileToDiscard.number,
            index: tileToDiscard.index
        };
        const discardEvent = GameEvents.createTileDiscardedEvent(this.currentPlayer, tileData, {
            type: "discard-slide",
            duration: 300,
            easing: "Power2.easeInOut"
        });
        this.emit("TILE_DISCARDED", discardEvent);

        // Emit hand updated event
        const handEvent = GameEvents.createHandUpdatedEvent(this.currentPlayer, player.hand.toJSON());
        this.emit("HAND_UPDATED", handEvent);

        await this.sleep(500);
    }

    /**
     * Query other players whether they want to claim the discard
     * @returns {Promise<{claimed: boolean, player: number, claimType: string}>}
     */
    async queryClaimDiscard() {
        this.setState(STATE.LOOP_QUERY_CLAIM_DISCARD);

        const lastDiscard = this.discards[this.discards.length - 1];

        // Query each other player
        for (let i = 1; i <= 3; i++) {
            const playerIndex = (this.currentPlayer + i) % 4;
            const player = this.players[playerIndex];

            let claimDecision;
            if (player.isHuman) {
                // Prompt human
                claimDecision = await this.promptUI("CLAIM_DISCARD", {
                    tile: lastDiscard.toJSON(),
                    options: ["Mahjong", "Pung", "Kong", "Pass"]
                });
            } else {
                // AI decides
                const aiDecision = await this.aiEngine.claimDiscard(lastDiscard, playerIndex, player.hand);

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
                    claimType: claimDecision
                };
            }
        }

        return {claimed: false};
    }

    /**
     * Handle a claimed discard
     * @param {Object} claimResult
     */
    handleDiscardClaim(claimResult) {
        const {player: claimingPlayerIndex, claimType} = claimResult;
        const tile = this.discards.pop();  // Remove from discard pile

        const claimingPlayer = this.players[claimingPlayerIndex];

        if (claimType === "Mahjong") {
            // Player won with this tile
            this.gameResult.mahjong = true;
            this.gameResult.winner = claimingPlayerIndex;
            this.endGame("mahjong");
            return;
        }

        // Add tile to claiming player's hand
        claimingPlayer.hand.addTile(tile);

        // Emit rich discard claimed event
        const tileData = {suit: tile.suit, number: tile.number, index: tile.index};
        const claimedEvent = GameEvents.createDiscardClaimedEvent(claimingPlayerIndex, tileData, claimType);
        this.emit("DISCARD_CLAIMED", claimedEvent);

        // Expose tiles
        this.setState(STATE.LOOP_EXPOSE_TILES);
        this.exposeTiles(claimingPlayerIndex, claimType, tile);

        // Claiming player becomes current player
        this.currentPlayer = claimingPlayerIndex;
        const turnEvent = GameEvents.createTurnChangedEvent(this.currentPlayer, (this.currentPlayer + 3) % 4);
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

        // Find matching tiles in hand
        const matchingTiles = player.hand.tiles.filter(t => t.equals(claimedTile));

        const requiredCount = exposureType === "Pung" ? 2 : exposureType === "Kong" ? 3 : 4;

        if (matchingTiles.length >= requiredCount) {
            // Remove from hidden hand
            const tilesToExpose = [claimedTile, ...matchingTiles.slice(0, requiredCount)];
            tilesToExpose.forEach(t => player.hand.removeTile(t));

            // Add to exposures
            const exposure = new ExposureData({
                type: exposureType.toUpperCase(),
                tiles: tilesToExpose
            });
            player.hand.addExposure(exposure);

            // Emit rich tiles exposed event
            const exposedEvent = GameEvents.createTilesExposedEvent(
                playerIndex,
                exposureType,
                tilesToExpose.map(t => ({suit: t.suit, number: t.number, index: t.index})),
                {duration: 300}
            );
            this.emit("TILES_EXPOSED", exposedEvent);

            // Emit hand updated event
            const handEvent = GameEvents.createHandUpdatedEvent(playerIndex, player.hand.toJSON());
            this.emit("HAND_UPDATED", handEvent);
        }

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
            const tiles = player.hand.tiles;
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
        const turnEvent = GameEvents.createTurnChangedEvent(this.currentPlayer, previousPlayer);
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
            this.gameResult.mahjong
        );
        this.emit("GAME_ENDED", gameEndEvent);

        if (reason === "mahjong") {
            const winner = this.players[this.gameResult.winner];
            const msgEvent = GameEvents.createMessageEvent(`${winner.name} wins with Mahjong!`, "info");
            this.emit("MESSAGE", msgEvent);
        } else if (reason === "wall_game") {
            const msgEvent = GameEvents.createMessageEvent("Wall game - no winner", "info");
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
                callback: (result) => resolve(result)
            });
        });
    }

    /**
     * Helper to sleep/delay
     * @param {number} ms - Milliseconds
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current game state snapshot (for debugging/persistence)
     * @returns {Object}
     */
    getGameState() {
        return {
            state: this.state,
            currentPlayer: this.currentPlayer,
            players: this.players.map(p => p.toJSON()),
            wallCount: this.wallTiles.length,
            discardCount: this.discards.length,
            gameResult: this.gameResult
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

        const prefixes = Array.isArray(group.prefix) ? group.prefix : [group.prefix];

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
