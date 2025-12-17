import { AnimationSequencer } from "./AnimationSequencer.js";
import MobileAudioManager from "../MobileAudioManager.js";

/**
 * DealingAnimationSequencer
 *
 * Handles the initial tile dealing animation for the human player.
 * Tiles appear face-down then flip face-up sequentially with staggered timing.
 *
 * Key Features:
 * - Face-down to face-up reveal animation
 * - Staggered tile-by-tile reveal
 * - Blue glow on East player's 14th tile
 * - Mobile-optimized (human player only)
 *
 * Architecture:
 * - Extends AnimationSequencer base class
 * - Uses existing HandRenderer for tile rendering
 * - Uses existing AnimationController for glow effects
 * - Emits DEALING_COMPLETE when animation finishes
 *
 * @extends AnimationSequencer
 */
export class DealingAnimationSequencer extends AnimationSequencer {
    /**
     * @param {GameController} gameController - Game controller instance
     * @param {HandRenderer} handRenderer - Hand renderer for accessing tile elements
     * @param {AnimationController} animationController - Animation primitives
     * @param {MobileAudioManager} audioManager - Audio manager for sound effects
     */
    constructor(gameController, handRenderer, animationController, audioManager) {
        super(gameController, handRenderer, animationController);
        this.audioManager = audioManager || new MobileAudioManager();

        // ========== ANIMATION TIMING (Adjust here) ==========
        /**
         * Time between each tile flip (ms)
         * Lower = faster cascade effect
         * @type {number}
         */
        this.TILE_REVEAL_STAGGER = 100;  // Increased from 40ms to make it more visible

        /**
         * Duration of flip animation (ms)
         * Must match CSS animation duration
         * @type {number}
         */
        this.TILE_FLIP_DURATION = 500;   // Increased from 300ms to make it more visible

        /**
         * Pause before reveal starts (ms)
         * Gives breathing room after render
         * @type {number}
         */
        this.INITIAL_DELAY = 500;        // Increased from 100ms to give time to see face-down state
        // ====================================================
    }

    /**
     * Main entry point - animate dealing for human player
     *
     * Called by MobileRenderer when TILES_DEALT event fires.
     * Executes three-step sequence:
     * 1. Render hand with tiles face-down
     * 2. Reveal tiles sequentially
     * 3. Apply glow to East's 14th tile if applicable
     *
     * @param {Object} _dealSequence - From TILES_DEALT event (unused currently)
     * @returns {Promise<void>}
     */
    async animateDeal(_dealSequence) {
        const humanPlayer = this.gameController.players[0];
        if (!humanPlayer || !this.handRenderer) {
            console.error("DealingAnimationSequencer: Cannot animate deal - missing player or hand renderer");
            this.gameController.emit("DEALING_COMPLETE");
            return;
        }

        if (!humanPlayer.hand || !humanPlayer.hand.tiles || humanPlayer.hand.tiles.length === 0) {
            console.error("DealingAnimationSequencer: Cannot animate deal - player hand is empty");
            this.gameController.emit("DEALING_COMPLETE");
            return;
        }

        await this.executeSequence([
            () => this.renderHand(humanPlayer.hand),
            () => this.revealTilesSequentially(),
            () => this.applyEastGlowIfNeeded()
        ]);
    }

    /**
     * Render hand with all tiles face-down initially
     *
     * Uses HandRenderer to render tiles normally, then adds
     * "tile--face-down" class to make them appear darkened.
     *
     * @param {HandData} handData - Player's hand to render
     * @returns {Promise<void>}
     * @private
     */
    async renderHand(handData) {
        // Render hand normally
        this.handRenderer.render(handData);

        // Defensive guard: ensure tiles array exists and is valid
        const tiles = this.handRenderer && Array.isArray(this.handRenderer.tiles)
            ? this.handRenderer.tiles
            : null;

        if (!tiles || tiles.length === 0) {
            console.warn("DealingAnimationSequencer: No valid tiles to render");
            return;
        }

        // Add face-down class to all tiles
        tiles.forEach(tile => {
            tile.classList.add("tile--face-down");
        });

        // Brief pause before reveal starts
        await this.delay(this.INITIAL_DELAY);
    }

    /**
     * Flip tiles face-up with staggered timing
     *
     * Removes face-down class and adds revealing animation class
     * to each tile with TILE_REVEAL_STAGGER ms delay between tiles.
     * Creates a cascading reveal effect with sound effects.
     *
     * @returns {Promise<void>}
     * @private
     */
    async revealTilesSequentially() {
        // Defensive guard: ensure tiles array exists and is valid
        const tiles = this.handRenderer && Array.isArray(this.handRenderer.tiles)
            ? this.handRenderer.tiles
            : null;

        if (!tiles || tiles.length === 0) {
            console.warn("DealingAnimationSequencer: No valid tiles to reveal");
            return;
        }

        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];

            // Play normalflyin sound as tile flies into view
            if (this.audioManager) {
                this.audioManager.playSFX("wall_fail");
            }

            // Remove face-down, add flip animation
            tile.classList.remove("tile--face-down");
            tile.classList.add("tile--revealing");

            // Stagger each tile (except last - wait for animation after loop)
            if (i < tiles.length - 1) {
                // eslint-disable-next-line no-await-in-loop
                await this.delay(this.TILE_REVEAL_STAGGER);
            }
        }

        // Wait for last tile's animation to complete
        await this.delay(this.TILE_FLIP_DURATION);

        // Play rack_tile sound as final landing sound
        if (this.audioManager) {
            this.audioManager.playSFX("rack_tile");
        }

        // Cleanup animation classes
        tiles.forEach(tile => {
            tile.classList.remove("tile--revealing");
        });
    }

    /**
     * Apply glow to 14th tile if human is East
     *
     * East player starts with 14 tiles (everyone else has 13).
     * The 14th tile receives a blue glow using existing AnimationController.
     *
     * @returns {void}
     * @private
     */
    applyEastGlowIfNeeded() {
        const humanPlayer = this.gameController.players[0];

        // Check if human is East and has 14 tiles
        if (humanPlayer.wind === "E" && humanPlayer.hand.tiles.length === 14) {
            const tiles = this.handRenderer.tiles;
            const lastTile = tiles[tiles.length - 1];

            if (lastTile) {
                this.animationController.applyReceivedTileGlow(lastTile);
            }
        }
    }

    /**
     * Hook: Called after sequence completes successfully
     *
     * Emits DEALING_COMPLETE event to signal GameController
     * that animation is finished and game can proceed.
     *
     * @override
     */
    onSequenceComplete() {
        // Signal GameController that dealing is complete
        this.gameController.emit("DEALING_COMPLETE");
    }

    /**
     * Hook: Called when sequence encounters an error
     *
     * Ensures DEALING_COMPLETE is emitted even on error
     * so game doesn't hang waiting for animation.
     *
     * @override
     * @param {Error} error - The error that occurred
     */
    onSequenceError(error) {
        console.error("Dealing animation error:", error);

        // Still emit DEALING_COMPLETE to prevent game hang
        this.gameController.emit("DEALING_COMPLETE");
    }
}
