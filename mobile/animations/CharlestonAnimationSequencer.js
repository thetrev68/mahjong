import { AnimationSequencer } from "./AnimationSequencer.js";

/**
 * CharlestonAnimationSequencer - Orchestrates Charleston tile pass/receive animations
 *
 * Handles the complete animation flow:
 * 1. Tiles exit hand (pass out animation)
 * 2. Brief travel delay
 * 3. New tiles enter hand (receive animation)
 * 4. Blue glow applied to received tiles
 * 5. Hand sorts with glow persisting
 *
 * Direction vectors define exit/entry coordinates:
 * - "right": Pass to right player (exit right, receive from left)
 * - "across": Pass to opposite player (exit up, receive from down)
 * - "left": Pass to left player (exit left, receive from right)
 */
export class CharlestonAnimationSequencer extends AnimationSequencer {
    /**
     * @param {GameController} gameController
     * @param {HandRenderer} handRenderer
     * @param {AnimationController} animationController
     */
    constructor(gameController, handRenderer, animationController, refreshHints) {
        super(gameController, handRenderer, animationController);

        // Track received tiles for glow application
        this.receivedTileIndices = new Set();
        // Optional callback to reapply hint highlights after re-render
        this.refreshHints = refreshHints;

        // Direction vectors for animation coordinates
        this.directionVectors = {
            right: { exit: { x: 300, y: -100 }, entry: { x: -300, y: 100 } },
            across: { exit: { x: 0, y: -300 }, entry: { x: 0, y: 300 } },
            left: { exit: { x: -300, y: -100 }, entry: { x: 300, y: 100 } }
        };

        // Animation timing constants (ms)
        this.PASS_OUT_DURATION = 600;
        this.TRAVEL_DELAY = 300;
        this.RECEIVE_DURATION = 600;
        this.SORT_DURATION = 800;
    }

    /**
     * Main entry point for Charleston pass animation
     * Called when player confirms tile pass
     * @param {Object} data - Charleston pass event data
     * @param {number} data.player - Player index (0 = human)
     * @param {Array} data.tiles - Tiles being passed
     * @param {string} data.direction - "right", "across", or "left"
     * @param {Array<number>} passingIndices - Indices of tiles being passed in hand
     */
    async animateCharlestonPass(data, passingIndices) {
        if (data.player !== 0) {
            // Only animate for human player
            return;
        }

        const { direction } = data;

        await this.executeSequence([
            // Step 1: Animate tiles leaving hand
            () => this.animateTilesLeaving(passingIndices, direction),

            // Step 2: Travel delay (simulates tiles moving to other player)
            () => this.delay(this.TRAVEL_DELAY)

            // Note: Steps 3-5 (receive, glow, sort) are triggered by TILES_RECEIVED event
            // which arrives after GameController processes the exchange
        ]);
    }

    /**
     * Handle receiving tiles from another player
     * Called when TILES_RECEIVED event fires
     * @param {Object} data - Tiles received event data
     * @param {number} data.player - Receiving player index
     * @param {Array} data.tiles - Tiles received
     * @param {string} data.direction - Direction received from
     * @param {Array<number>} receivedIndices - Indices of received tiles in new hand
     */
    async handleTilesReceived(data, receivedIndices) {
        if (data.player !== 0) {
            return;
        }

        const direction = data.animation?.direction || data.direction;
        this.receivedTileIndices = new Set(receivedIndices);

        await this.executeSequence([
            // Step 3: Animate tiles arriving
            () => this.animateTilesArriving(receivedIndices, direction),

            // Step 4: Apply blue glow to received tiles
            () => this.applyGlowToReceivedTiles(receivedIndices),

            // Step 5: Sort hand with glow persisting
            () => this.animateSortWithGlow()
        ]);
    }

    /**
     * Animate tiles exiting hand in specified direction
     * @param {Array<number>} indices - Tile indices to animate out
     * @param {string} direction - "right", "across", or "left"
     * @returns {Promise<void>}
     * @private
     */
    async animateTilesLeaving(indices, direction) {
        const tileElements = this.getTileElements(indices);
        if (tileElements.length === 0) {
            return;
        }

        const vector = this.getDirectionVector(direction);
        if (!vector) {
            console.warn(`Unknown direction: ${direction}`);
            return;
        }

        // Set CSS variables for exit animation
        tileElements.forEach(tile => {
            tile.style.setProperty("--exit-x", `${vector.exit.x}px`);
            tile.style.setProperty("--exit-y", `${vector.exit.y}px`);
            tile.classList.add("tile-charleston-leaving");
        });

        // Wait for animation to complete
        await this.delay(this.PASS_OUT_DURATION);

        // Remove tiles from DOM and tiles array immediately
        // Sort indices in reverse order to avoid index shifting issues
        const sortedIndices = [...indices].sort((a, b) => b - a);
        sortedIndices.forEach(idx => {
            const tile = this.handRenderer.tiles[idx];
            if (tile && tile.parentNode) {
                tile.parentNode.removeChild(tile);
            }
            this.handRenderer.tiles.splice(idx, 1);
        });
    }

    /**
     * Animate tiles entering hand from specified direction
     * @param {Array<number>} indices - Tile indices to animate in
     * @param {string} direction - Direction tiles are coming from
     * @returns {Promise<void>}
     * @private
     */
    async animateTilesArriving(indices, direction) {
        const tileElements = this.getTileElements(indices);
        if (tileElements.length === 0) {
            return;
        }

        const vector = this.getDirectionVector(direction);
        if (!vector) {
            console.warn(`Unknown direction: ${direction}`);
            return;
        }

        // Set CSS variables for entry animation (opposite of exit)
        tileElements.forEach(tile => {
            tile.style.setProperty("--entry-x", `${vector.entry.x}px`);
            tile.style.setProperty("--entry-y", `${vector.entry.y}px`);
            tile.classList.add("tile-charleston-arriving");
        });

        // Wait for animation to complete
        await this.delay(this.RECEIVE_DURATION);

        // Cleanup animation classes but keep tiles visible
        tileElements.forEach(tile => {
            tile.classList.remove("tile-charleston-arriving");
            tile.style.removeProperty("--entry-x");
            tile.style.removeProperty("--entry-y");
        });
    }

    /**
     * Apply blue glow to received tiles
     * Uses existing AnimationController method
     * @param {Array<number>} indices - Tile indices to glow
     * @private
     */
    applyGlowToReceivedTiles(indices) {
        const tileElements = this.getTileElements(indices);
        tileElements.forEach(tile => {
            this.animationController.applyReceivedTileGlow(tile);
        });

        // No delay needed - glow is instant
    }

    /**
     * Animate hand sorting using FLIP technique
     * Glow persists on received tiles during and after sort
     * @returns {Promise<void>}
     * @private
     */
    async animateSortWithGlow() {
        // Get the FRESH hand data from GameController instead of using cached currentHandData
        // This is critical because currentHandData may be stale if a render was skipped
        const humanPlayer = this.gameController.players[0];
        if (!humanPlayer || !humanPlayer.hand) {
            console.warn("CharlestonAnimationSequencer: Cannot sort - no human player hand");
            return;
        }
        const handData = humanPlayer.hand;

        // Get all current tile elements and their positions (FIRST)
        const tiles = this.handRenderer.tiles;
        const firstPositions = tiles.map(tile => ({
            x: tile.offsetLeft,
            y: tile.offsetTop
        }));

        // Sort the hand data
        handData.sortBySuit();

        // Re-render with glow on received tiles (LAST)
        this.handRenderer.renderWithGlow(handData, this.receivedTileIndices);
        // Reapply hint highlights after rerender (Charleston refresh clears DOM)
        if (typeof this.refreshHints === "function") {
            this.refreshHints();
        }

        // Get new positions after render
        const newTiles = this.handRenderer.tiles;
        const lastPositions = newTiles.map(tile => ({
            x: tile.offsetLeft,
            y: tile.offsetTop
        }));

        // INVERT: Calculate deltas and apply as transform
        newTiles.forEach((tile, i) => {
            if (i >= firstPositions.length) {
                return; // New tile, no animation
            }

            const deltaX = firstPositions[i].x - lastPositions[i].x;
            const deltaY = firstPositions[i].y - lastPositions[i].y;

            // Apply transform without transition
            tile.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            tile.style.transition = "none";
        });

        // Force reflow
        void document.body.offsetHeight;

        // PLAY: Transition back to natural position
        newTiles.forEach(tile => {
            tile.style.transition = `transform ${this.SORT_DURATION}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;
            tile.style.transform = "";
        });

        // Wait for animation
        await this.delay(this.SORT_DURATION);

        // Cleanup
        newTiles.forEach(tile => {
            tile.style.transition = "";
        });

        // Glow persists until player discards
    }

    /**
     * Get direction vector for animation coordinates
     * @param {string} direction - "right", "across", or "left"
     * @returns {{exit: {x: number, y: number}, entry: {x: number, y: number}}|null}
     * @private
     */
    getDirectionVector(direction) {
        return this.directionVectors[direction] || null;
    }

    /**
     * Hook: Called before sequence starts
     * @override
     */
    async onSequenceStart() {
        // Could disable interactions during animation
        // this.handRenderer.setInteractive(false);
    }

    /**
     * Hook: Called after sequence completes
     * @override
     */
    async onSequenceComplete() {
        // Re-enable interactions
        // this.handRenderer.setInteractive(true);
    }

    /**
     * Hook: Called when sequence encounters an error
     * @override
     */
    onSequenceError(error) {
        console.error("Charleston animation error:", error);
        // Ensure interactions are re-enabled even on error
        // this.handRenderer.setInteractive(true);
        return Promise.resolve();
    }
}
