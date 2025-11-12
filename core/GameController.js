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
 * - CHARLESTON_PHASE: {phase: 1|2, passDirection}
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
import {STATE, PLAYER, SUIT, VNUMBER} from "../constants.js";
import {TileData} from "./models/TileData.js";
import {HandData} from "./models/HandData.js";
import {PlayerData} from "./models/PlayerData.js";

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
    async init(options = {}) {
        this.aiEngine = options.aiEngine;
        this.cardValidator = options.cardValidator;

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
     * Phase 2A: Placeholder implementation
     * GameLogic still handles actual game flow.
     * This method will be fully implemented in Phase 2B.
     */
    async startGame() {
        this.setState(STATE.START);

        // Reset game state
        this.gameResult = {mahjong: false, winner: -1, winningHand: null};
        this.charlestonState = {phase: 0, passCount: 0, continueToPhase2: false, courtesyVotes: []};
        this.discards = [];
        this.currentPlayer = PLAYER.BOTTOM;

        // Phase 2A: Skip wall creation - use existing Phaser wall from GameLogic
        // this.createWall();

        // Emit game started event
        this.emit("GAME_STARTED", {
            players: this.players.map(p => p.toJSON())
        });

        // Phase 2A: Skip dealing - GameLogic handles this
        // await this.dealTiles();

        // Phase 2A: Skip Charleston and game loop - GameLogic handles these
        // if (!this.settings.skipCharleston) {
        //     await this.charlestonPhase();
        // } else {
        //     await this.gameLoop();
        // }
    }

    /**
     * Create the wall of tiles
     */
    createWall() {
        this.wall = [];
        const tileCount = this.settings.useBlankTiles ? 160 : 152;

        // TODO: This needs to match the tile generation logic from gameObjects.js
        // For now, create a placeholder implementation
        // Phase 2A (PhaserAdapter) will handle actual tile creation

        this.emit("MESSAGE", {
            text: `Wall created with ${tileCount} tiles`,
            type: "info"
        });
    }

    /**
     * Deal tiles to all players
     */
    async dealTiles() {
        this.setState(STATE.DEAL);

        // TODO: Implement actual dealing logic
        // For now, emit event to signal dealing phase

        this.emit("TILES_DEALT", {
            players: this.players.map(p => ({
                position: p.position,
                tileCount: p.hand.getLength()
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
        const passDirections = phase === 1
            ? ["right", "across", "left"]
            : ["left", "across", "right"];

        for (let i = 0; i < 3; i++) {
            const direction = passDirections[i];
            this.setState(phase === 1 ? STATE.CHARLESTON1 : STATE.CHARLESTON2);

            this.emit("CHARLESTON_PHASE", {
                phase,
                passCount: i + 1,
                direction
            });

            // Each player selects 3 tiles to pass
            for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
                const player = this.players[playerIndex];

                let tilesToPass;
                if (player.isHuman) {
                    // Prompt human player
                    tilesToPass = await this.promptHumanCharlestonPass(direction);
                } else {
                    // AI selects tiles
                    tilesToPass = await this.aiEngine.charlestonPass(player.hand, direction);
                }

                this.emit("CHARLESTON_PASS", {
                    player: playerIndex,
                    tiles: tilesToPass,
                    direction
                });
            }

            // TODO: Actually move tiles between players
            // This requires tracking which tiles go where

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
            .map(p => this.aiEngine.charlestonContinueVote());

        const yesVotes = [humanVote === "Yes", ...aiVotes].filter(v => v).length;

        return yesVotes >= 2;  // Majority wins
    }

    /**
     * Courtesy pass phase (optional tile exchange)
     */
    async courtesyPhase() {
        this.setState(STATE.COURTESY_QUERY);

        // Each player votes whether to do courtesy pass
        const votes = [];
        for (const player of this.players) {
            let vote;
            if (player.isHuman) {
                vote = await this.promptUI("COURTESY_VOTE", {
                    question: "Participate in courtesy pass?",
                    options: ["Yes", "No"]
                });
                vote = vote === "Yes";
            } else {
                vote = await this.aiEngine.courtesyVote(player.hand);
            }

            votes.push({player: player.position, vote});
            this.emit("COURTESY_VOTE", {player: player.position, vote});
        }

        // If at least 2 players voted yes, do courtesy pass
        const yesVotes = votes.filter(v => v.vote).length;
        if (yesVotes >= 2) {
            this.setState(STATE.COURTESY);
            // TODO: Implement courtesy pass logic (opposite players exchange 1 tile)
        }

        this.setState(STATE.COURTESY_COMPLETE);
    }

    /**
     * Main game loop
     */
    async gameLoop() {
        while (this.state !== STATE.END) {
            // Pick from wall
            await this.pickFromWall();

            // Choose tile to discard
            await this.chooseDiscard();

            // Query other players to claim discard
            const claimResult = await this.queryClaimDiscard();

            if (claimResult.claimed) {
                // Tile was claimed
                await this.handleDiscardam(claimResult);
            }

            // Check for mahjong
            if (this.checkMahjong()) {
                await this.endGame("mahjong");
                return;
            }

            // Check for wall game
            if (this.wall.length === 0) {
                await this.endGame("wall_game");
                return;
            }

            // Next player's turn
            this.advanceTurn();
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
        const tile = this.wall.shift();
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
                claimDecision = await this.aiEngine.claimDiscard(player.hand, lastDiscard);
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
    async handleDiscardClaim(claimResult) {
        const {player: claimingPlayerIndex, claimType} = claimResult;
        const tile = this.discards.pop();  // Remove from discard pile

        const claimingPlayer = this.players[claimingPlayerIndex];

        if (claimType === "Mahjong") {
            // Player won with this tile
            this.gameResult.mahjong = true;
            this.gameResult.winner = claimingPlayerIndex;
            await this.endGame("mahjong");
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
        await this.exposeTiles(claimingPlayerIndex, claimType, tile);

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
    async exposeTiles(playerIndex, exposureType, claimedTile) {
        const player = this.players[playerIndex];

        // Find matching tiles in hand
        const matchingTiles = player.hand.tiles.filter(t => t.equals(claimedTile));

        const requiredCount = exposureType === "Pung" ? 2 : exposureType === "Kong" ? 3 : 4;

        if (matchingTiles.length >= requiredCount) {
            // Remove from hidden hand
            const tilesToExpose = [claimedTile, ...matchingTiles.slice(0, requiredCount)];
            tilesToExpose.forEach(t => player.hand.removeTile(t));

            // Add to exposures
            const exposure = {
                type: exposureType.toUpperCase(),
                tiles: tilesToExpose
            };
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
            const isWinning = this.cardValidator.validateHand(player.hand);
            if (isWinning) {
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
    async endGame(reason) {
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
