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
import {STATE, PLAYER, SUIT, PLAYER_OPTION} from "../constants.js";
import {TileData} from "./models/TileData.js";
import {PlayerData} from "./models/PlayerData.js";
import {ExposureData} from "./models/HandData.js";

const CHARLESTON_DIRECTION_SEQUENCE = {
    1: ["right", "across", "left"],
    2: ["left", "across", "right"]
};

const CHARLESTON_DIRECTION_OFFSETS = {
    right: PLAYER.RIGHT,
    across: PLAYER.TOP,
    left: PLAYER.LEFT
};

/**
 * Wrapper to make a Phaser Wall act like a GameController wall
 * Converts between Phaser Tile objects and TileData
 */
class WallDataWrapper {
    constructor(phaserWall) {
        this.phaserWall = phaserWall;
    }

    pop() {
        const phaserTile = this.phaserWall.remove();
        if (!phaserTile) return null;

        // Convert Phaser Tile to TileData
        return new TileData(phaserTile.suit, phaserTile.number, phaserTile.index);
    }

    getCount() {
        return this.phaserWall.getCount();
    }

    shuffle() {
        return this.phaserWall.shuffle();
    }
}

export class GameController extends EventEmitter {
    constructor() {
        super();

        /** @type {STATE} Current game state */
        this.state = STATE.INIT;

        /** @type {PlayerData[]} Four players */
        this.players = [];

        /** @type {TileData[]} Wall of undrawn tiles */
        this.wall = [];

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
        this.sharedTable = options.sharedTable; // Share the Phaser table with GameLogic

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

        this.emit("MESSAGE", {
            text: `Game initialized with ${this.settings.year} card`,
            type: "info"
        });
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

        // Emit game started event
        this.emit("GAME_STARTED", {
            players: this.players.map(player => player.toJSON())
        });

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
     * Matches the tile generation logic from gameObjects.js
     */
    createWall() {
        // If we have a shared table (GameLogic's table), use it directly
        if (this.sharedTable && this.sharedTable.wall) {
            // Shuffle the existing wall
            this.sharedTable.wall.shuffle();

            // Create a wrapper to make wall.pop() work with TileData conversion
            this.wall = new WallDataWrapper(this.sharedTable.wall);

            this.emit("MESSAGE", {
                text: `Wall created with ${this.sharedTable.wall.getCount()} tiles`,
                type: "info"
            });
            return;
        }

        // Fallback: Create standalone wall (for non-Phaser environments)
        this.wall = [];
        let index = 0;

        const tileGroups = [
            {suit: SUIT.CRACK, prefix: ["C"], maxNum: 9, count: 4},
            {suit: SUIT.BAM, prefix: ["B"], maxNum: 9, count: 4},
            {suit: SUIT.DOT, prefix: ["D"], maxNum: 9, count: 4},
            {suit: SUIT.WIND, prefix: ["N", "S", "W", "E"], maxNum: 1, count: 4},
            {suit: SUIT.DRAGON, prefix: ["DC", "DB", "DD"], maxNum: 1, count: 4},
            {suit: SUIT.FLOWER, prefix: ["F1", "F2", "F3", "F4", "F1", "F2", "F3", "F4"], maxNum: 1, count: 1},
            {suit: SUIT.JOKER, prefix: ["J"], maxNum: 1, count: 8}
        ];

        // Add BLANK tiles if enabled
        if (this.settings.useBlankTiles) {
            tileGroups.push({suit: SUIT.BLANK, prefix: ["BLANK"], maxNum: 1, count: 8});
        }

        // Generate tiles
        for (const group of tileGroups) {
            for (const prefix of group.prefix) {
                for (let num = 1; num <= group.maxNum; num++) {
                    let number = num;

                    // Special handling for non-numeric tiles
                    if (group.maxNum === 1) {
                        if (group.suit === SUIT.FLOWER) {
                            number = 0;  // Flowers always use 0
                        } else {
                            number = group.prefix.indexOf(prefix);  // Wind/Dragon index
                        }
                    }

                    // Create duplicate tiles (4 of each crack/bam/dot, 8 jokers, etc.)
                    for (let j = 0; j < group.count; j++) {
                        const tile = new TileData(group.suit, number, index);
                        this.wall.push(tile);
                        index++;
                    }
                }
            }
        }

        // Shuffle wall using Fisher-Yates algorithm
        this.shuffleWall();

        this.emit("MESSAGE", {
            text: `Wall created with ${this.wall.length} tiles`,
            type: "info"
        });
    }

    /**
     * Shuffle the wall using Fisher-Yates algorithm
     */
    shuffleWall() {
        for (let i = this.wall.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.wall[i], this.wall[j]] = [this.wall[j], this.wall[i]];
        }
    }

    /**
     * Deal tiles to all players (13 tiles each)
     */
    async dealTiles() {
        this.setState(STATE.DEAL);

        // Deal 13 tiles to each player
        for (let round = 0; round < 13; round++) {
            for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
                const tile = this.wall.pop();
                if (!tile) {
                    throw new Error("Wall empty during dealing!");
                }

                this.players[playerIndex].hand.addTile(tile);

                this.emit("TILE_DRAWN", {
                    player: playerIndex,
                    tile: tile.toJSON()
                });

                // Small delay for animation (optional, configurable)
                if (this.settings.animateDealing) {
                    await this.sleep(50);
                }
            }
        }

        this.emit("TILES_DEALT", {
            players: this.players.map(player => ({
                position: player.position,
                tileCount: player.hand.getLength()
            }))
        });

        this.emit("MESSAGE", {
            text: "Tiles dealt to all players",
            type: "info"
        });
    }

    /**
     * Charleston tile passing phase
     */
    async charlestonPhase() {
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

            this.emit("CHARLESTON_PHASE", {
                phase,
                passCount: i + 1,
                direction: directionName
            });

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
                    tilesToPass = await this.aiEngine.charlestonPass(player.hand, direction);
                }

                // Remove tiles from player's hand
                tilesToPass.forEach(tile => player.hand.removeTile(tile));

                charlestonPassArray[playerIndex] = tilesToPass;

                this.emit("CHARLESTON_PASS", {
                    player: playerIndex,
                    tiles: tilesToPass.map(t => t.toJSON()),
                    direction: directionName
                });
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
                this.emit("HAND_UPDATED", {
                    player: toPlayer,
                    hand: this.players[toPlayer].hand.toJSON()
                });
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
            .map(() => this.aiEngine.charlestonContinueVote());

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
            this.emit("COURTESY_VOTE", {player: player.position, vote});
        }

        // If at least 2 players voted for more than 0 tiles, do courtesy pass
        const yesVotes = votes.filter(v => v.vote > 0).length;
        if (yesVotes >= 2) {
            this.setState(STATE.COURTESY);

            // Calculate agreed-upon courtesy pass counts for opposite players
            const player02Vote = Math.min(votes[0].vote, votes[2].vote);
            const player13Vote = Math.min(votes[1].vote, votes[3].vote);

            if (player02Vote > 0 || player13Vote > 0) {
                this.emit("MESSAGE", {
                    text: `Courtesy pass approved. P0-P2 pass ${player02Vote}, P1-P3 pass ${player13Vote}.`,
                    type: "info"
                });

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

                    this.emit("COURTESY_PASS", {
                        player: i,
                        tiles: selectedTiles.map(t => t.toJSON()),
                        count: selectedTiles.length
                    });
                }

                // Exchange tiles with opposite players (0↔2, 1↔3)
                for (let i = 0; i < 4; i++) {
                    const oppositePlayer = (i + 2) % 4;
                    const receivedTiles = tilesToPass[oppositePlayer];

                    receivedTiles.forEach(tile => this.players[i].hand.addTile(tile));

                    if (receivedTiles.length > 0) {
                        this.emit("TILES_RECEIVED", {
                            player: i,
                            tiles: receivedTiles.map(t => t.toJSON()),
                            fromPlayer: oppositePlayer
                        });
                    }
                }

                // Sort all hands
                this.players.forEach(player => player.hand.sortBySuit());

                // Emit hand updates for all players
                this.players.forEach((player, i) => {
                    this.emit("HAND_UPDATED", {
                        player: i,
                        hand: player.hand.toJSON()
                    });
                });

                this.emit("MESSAGE", {
                    text: "Courtesy pass complete.",
                    type: "info"
                });
            } else {
                this.emit("MESSAGE", {
                    text: "Courtesy pass skipped (opposite players must both agree).",
                    type: "info"
                });
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

        while (this.state !== STATE.END && this.wall.length > 0) {
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
        if (this.wall.length === 0 && !this.gameResult.mahjong) {
            this.endGame("wall_game");
        }
    }

    /**
     * Current player picks a tile from wall
     */
    async pickFromWall() {
        this.setState(STATE.LOOP_PICK_FROM_WALL);

        if (this.wall.length === 0) {
            return;  // Wall game
        }

        // Draw tile from wall
        const tile = this.wall.pop();
        const player = this.players[this.currentPlayer];

        player.hand.addTile(tile);

        this.emit("TILE_DRAWN", {
            player: this.currentPlayer,
            tile: tile.toJSON()
        });

        this.emit("HAND_UPDATED", {
            player: this.currentPlayer,
            hand: player.hand.toJSON()
        });

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

        this.emit("TILE_DISCARDED", {
            player: this.currentPlayer,
            tile: tileToDiscard.toJSON()
        });

        this.emit("HAND_UPDATED", {
            player: this.currentPlayer,
            hand: player.hand.toJSON()
        });

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

        this.emit("DISCARD_CLAIMED", {
            player: claimingPlayerIndex,
            tile: tile.toJSON(),
            claimType
        });

        // Expose tiles
        this.setState(STATE.LOOP_EXPOSE_TILES);
        this.exposeTiles(claimingPlayerIndex, claimType, tile);

        // Claiming player becomes current player
        this.currentPlayer = claimingPlayerIndex;
        this.emit("TURN_CHANGED", {
            currentPlayer: this.currentPlayer,
            previousPlayer: (this.currentPlayer + 3) % 4
        });
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

            this.emit("TILES_EXPOSED", {
                player: playerIndex,
                exposureType,
                tiles: tilesToExpose.map(t => t.toJSON())
            });

            this.emit("HAND_UPDATED", {
                player: playerIndex,
                hand: player.hand.toJSON()
            });
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

        this.emit("TURN_CHANGED", {
            currentPlayer: this.currentPlayer,
            previousPlayer
        });
    }

    /**
     * End the game
     * @param {string} reason - 'mahjong', 'wall_game', 'quit'
     */
    endGame(reason) {
        this.setState(STATE.END);

        this.emit("GAME_ENDED", {
            reason,
            winner: this.gameResult.winner,
            mahjong: this.gameResult.mahjong
        });

        if (reason === "mahjong") {
            const winner = this.players[this.gameResult.winner];
            this.emit("MESSAGE", {
                text: `${winner.name} wins with Mahjong!`,
                type: "info"
            });
        } else if (reason === "wall_game") {
            this.emit("MESSAGE", {
                text: "Wall game - no winner",
                type: "info"
            });
        }
    }

    /**
     * Set game state and emit event
     * @param {STATE} newState
     */
    setState(newState) {
        const oldState = this.state;
        this.state = newState;

        this.emit("STATE_CHANGED", {
            oldState,
            newState
        });
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
            wallCount: this.wall.length,
            discardCount: this.discards.length,
            gameResult: this.gameResult
        };
    }
}
