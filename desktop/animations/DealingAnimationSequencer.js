import { AnimationSequencer } from "./AnimationSequencer.js";
import { TileData } from "../../core/models/TileData.js";
import { PLAYER, PLAYER_LAYOUT } from "../../constants.js";
import { debugError } from "../../utils.js";

/**
 * DealingAnimationSequencer
 *
 * Handles the initial tile dealing animation for all players on desktop.
 * Tiles fly from the wall position to each player's hand sequentially with staggered timing.
 *
 * Key Features:
 * - Sequential batch dealing (matches GameController sequence)
 * - Wall tile removal tracking
 * - Face-up for human, face-down for AI players
 * - Blue glow on human player's final dealt tile
 * - Proper recentering as tiles are added
 *
 * Architecture:
 * - Extends AnimationSequencer base class
 * - Uses TileManager for sprite management
 * - Uses HandRenderer for tile positioning
 * - Emits DEALING_COMPLETE when animation finishes
 *
 * Extracted from PhaserAdapter.onTilesDealt() to match mobile architecture
 *
 * @extends AnimationSequencer
 */
export class DealingAnimationSequencer extends AnimationSequencer {
    /**
     * @param {GameController} gameController - Game controller instance
     * @param {Phaser.Scene} scene - Phaser scene for creating tweens
     * @param {TileManager} tileManager - Tile manager for sprite access
     * @param {HandRenderer} handRenderer - Hand renderer for positioning
     * @param {Function} onTilesRemoved - Callback when tiles removed from wall (for counter update)
     */
    constructor(gameController, scene, tileManager, handRenderer, onTilesRemoved) {
        super(gameController, scene, tileManager, handRenderer);
        this.onTilesRemoved = onTilesRemoved;

        /** @type {Array<{tiles: TileData[], exposures: Array}>|null} Track staged hands during dealing */
        this.dealAnimationHands = null;

        /** @type {Tile|null} Track human player's last dealt tile for glow */
        this.pendingHumanGlowTile = null;

        // ========== ANIMATION TIMING (Adjust here) ==========
        /**
         * Delay between each tile in a batch (ms)
         * @type {number}
         */
        this.TILE_DEAL_STAGGER = 50;

        /**
         * Duration of tile fly animation (ms)
         * @type {number}
         */
        this.TILE_FLY_DURATION = 200;

        /**
         * Delay after batch before next batch (ms)
         * @type {number}
         */
        this.BATCH_TRANSITION_DELAY = 50;
        // ====================================================
    }

    /**
     * Main entry point - animate dealing sequence
     *
     * Called by PhaserAdapter when TILES_DEALT event fires.
     * Processes the sequence array from GameController to deal tiles
     * in the correct order to each player.
     *
     * @param {Object} data - From TILES_DEALT event
     * @param {Array} data.sequence - Array of {player, tiles} objects
     * @returns {Promise<void>}
     */
    async animateDeal(data = {}) {
        const sequence = Array.isArray(data.sequence) ? data.sequence : [];

        if (!sequence.length) {
            console.warn("DealingAnimationSequencer: Empty sequence, skipping animation");
            this.gameController.emit("DEALING_COMPLETE");
            return;
        }

        // Build staged HandData objects so we only render tiles that have actually been dealt
        this.dealAnimationHands = Array.from({length: 4}, () => ({
            tiles: [],
            exposures: []
        }));

        await this.executeSequence(
            sequence.map((step, index) => () => this.dealBatch(step, index, sequence.length))
        );
    }

    /**
     * Deal a single batch of tiles to one player
     * @param {Object} step - {player: number, tiles: TileData[]}
     * @param {number} batchIndex - Index of this batch in sequence
     * @param {number} totalBatches - Total number of batches
     * @returns {Promise<void>}
     * @private
     */
    async dealBatch(step, batchIndex, totalBatches) {
        const playerIndex = typeof step.player === "number" ? step.player : PLAYER.BOTTOM;
        const tilePayloads = Array.isArray(step.tiles) ? step.tiles : [];
        const animationHand = this.dealAnimationHands?.[playerIndex];

        if (!tilePayloads.length) {
            return;
        }

        const currentHandSize = animationHand ? animationHand.tiles.length : 0;
        const targetHandSize = currentHandSize + tilePayloads.length;

        // Animate each tile in the batch with stagger
        const animationPromises = tilePayloads.map((tileJSON, tileIndexInBatch) =>
            this.dealSingleTile(tileJSON, playerIndex, currentHandSize, targetHandSize, tileIndexInBatch)
        );

        // Wait for all tiles in batch to complete
        await Promise.all(animationPromises);

        // Recenter tiles after batch completes
        const stagedHand = this.dealAnimationHands?.[playerIndex];
        if (stagedHand) {
            this.handRenderer.syncAndRender(playerIndex, stagedHand);
        } else if (this.gameController?.players?.[playerIndex]?.hand) {
            this.handRenderer.syncAndRender(playerIndex, this.gameController.players[playerIndex].hand);
        }

        // Brief pause before next batch (except on last batch)
        if (batchIndex < totalBatches - 1) {
            await this.delay(this.BATCH_TRANSITION_DELAY);
        }
    }

    /**
     * Deal a single tile with animation
     * @param {Object} tileJSON - TileData JSON object
     * @param {number} playerIndex - Player receiving tile
     * @param {number} currentHandSize - Size of hand before this tile
     * @param {number} targetHandSize - Size of hand after entire batch
     * @param {number} tileIndexInBatch - Index within current batch
     * @returns {Promise<void>}
     * @private
     */
    async dealSingleTile(tileJSON, playerIndex, currentHandSize, targetHandSize, tileIndexInBatch) {
        // Stagger tile animation start
        if (tileIndexInBatch > 0) {
            await this.delay(this.TILE_DEAL_STAGGER);
        }

        const tileData = TileData.fromJSON(tileJSON);
        const phaserTile = this.tileManager.getOrCreateTile(tileData);

        if (!phaserTile) {
            debugError(`Could not find Phaser Tile for index ${tileData.index} during dealing`);
            return;
        }

        // Remove from wall
        this.tileManager.removeTileFromWall(tileData.index);

        // Position tile at wall initially
        const wallX = 50;
        const wallY = 50;
        phaserTile.x = wallX;
        phaserTile.y = wallY;
        phaserTile.sprite.setAlpha(0);
        if (phaserTile.spriteBack) {
            phaserTile.spriteBack.setAlpha(0);
        }

        // Prepare tile with correct scale/angle BEFORE animation
        this.handRenderer.prepareTileForAnimation(phaserTile, playerIndex);

        // Show tile (face-up for human, face-down for AI)
        phaserTile.showTile(true, playerIndex === PLAYER.BOTTOM);

        // Calculate target position
        const targetIndex = currentHandSize + tileIndexInBatch;
        const targetPos = this.handRenderer.calculateTilePosition(playerIndex, targetIndex, targetHandSize);

        // Add to staged hand
        const animationHand = this.dealAnimationHands?.[playerIndex];
        if (animationHand) {
            animationHand.tiles.splice(targetIndex, 0, tileData);
        }

        // Animate tile to hand
        const tween = phaserTile.animate(targetPos.x, targetPos.y, PLAYER_LAYOUT[playerIndex].angle, this.TILE_FLY_DURATION);

        // Fade in during animation
        this.scene.tweens.add({
            targets: [phaserTile.sprite, phaserTile.spriteBack],
            alpha: 1,
            duration: this.TILE_FLY_DURATION
        });

        // Track human player's tile for glow
        if (playerIndex === PLAYER.BOTTOM) {
            this.pendingHumanGlowTile = phaserTile;
        }

        // Notify wall counter
        if (this.onTilesRemoved) {
            this.onTilesRemoved(1);
        }

        // Wait for animation to complete
        if (tween) {
            await new Promise(resolve => {
                tween.once("complete", () => {
                    if (this.scene.audioManager) {
                        this.scene.audioManager.playSFX("rack_tile");
                    }
                    resolve();
                });
            });
        }
    }

    /**
     * Hook: Called after sequence completes successfully
     * @override
     */
    onSequenceComplete() {
        // Auto-sort human hand and apply glow
        const humanHand = this.gameController.players[PLAYER.BOTTOM].hand;
        if (humanHand) {
            humanHand.sortBySuit();
            this.handRenderer.syncAndRender(PLAYER.BOTTOM, humanHand);
        }

        // Apply glow to human's last dealt tile
        if (this.pendingHumanGlowTile && typeof this.pendingHumanGlowTile.addGlowEffect === "function") {
            this.pendingHumanGlowTile.addGlowEffect(this.scene, 0x1e3a8a, 0.5, 10);
        }

        // Notify scene animation is complete
        if (this.scene && typeof this.scene.handleDealAnimationComplete === "function") {
            this.scene.handleDealAnimationComplete();
        }

        // Clear animation state
        this.dealAnimationHands = null;
        this.pendingHumanGlowTile = null;

        // Signal GameController that dealing is complete
        this.gameController.emit("DEALING_COMPLETE");

        return Promise.resolve();
    }

    /**
     * Hook: Called when sequence encounters an error
     * @override
     * @param {Error} error - The error that occurred
     */
    onSequenceError(error) {
        console.error("Dealing animation error:", error);

        // Clear animation state
        this.dealAnimationHands = null;
        this.pendingHumanGlowTile = null;

        // Still emit DEALING_COMPLETE to prevent game hang
        this.gameController.emit("DEALING_COMPLETE");
    }
}
