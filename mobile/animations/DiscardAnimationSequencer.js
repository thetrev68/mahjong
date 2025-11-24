import { AnimationSequencer } from "./AnimationSequencer.js";
import { TileData } from "../../core/models/TileData.js";

const HUMAN_PLAYER = 0;

/**
 * Handles discard tile animations for mobile platform
 * Animates tiles flying from hand to discard pile with arc trajectory
 */
export class DiscardAnimationSequencer extends AnimationSequencer {
    constructor(gameController, handRenderer, animationController, discardPile, mobileRenderer) {
        super(gameController, handRenderer, animationController);
        this.discardPile = discardPile;
        this.mobileRenderer = mobileRenderer;
        this.soundEnabled = true;
    }

    /**
     * Main entry point - animates tile discard
     * @param {Object} data - From GameController TILE_DISCARDED event
     * @param {number} data.player - Player index (0-3)
     * @param {Object} data.tile - TileData object
     * @param {Object} data.animation - Animation metadata
     */
    async animateDiscard(data) {
        if (!data?.tile) {
            return;
        }

        const { player, tile: tileJSON, animation } = data;
        const tile = TileData.fromJSON(tileJSON);
        const tileIndex = animation?.tileIndex;

        // For AI players or when tile element not found, skip animation
        if (player !== HUMAN_PLAYER || tileIndex === undefined) {
            this.skipAnimation(tile, player);
            return;
        }

        // CRITICAL: Capture tile element reference IMMEDIATELY before any async operations
        // This must happen before HAND_UPDATED can fire and re-render the hand
        const tileElement = this.handRenderer.getTileElementByIndex(tileIndex);
        if (!tileElement) {
            this.skipAnimation(tile, player);
            return;
        }

        // Clear selection to ensure tile is in its natural position before capturing rect
        if (this.mobileRenderer?.selectionManager) {
            this.mobileRenderer.selectionManager.clearSelection();
        }

        // CRITICAL: Capture position IMMEDIATELY after clearing selection
        // This ensures we get the tile's actual resting position, not the "selected/lifted" position
        const startRect = tileElement.getBoundingClientRect();
        const startPos = {
            x: startRect.left,
            y: startRect.top
        };

        // Set flag to prevent hand re-renders during animation
        if (this.mobileRenderer) {
            this.mobileRenderer.isDiscardAnimationRunning = true;
        }

        try {
            await this.executeSequence([
                () => this.prepareDiscard(player, tileIndex, tileElement),
                () => this.animateTileToDiscard(player, tile, tileIndex, animation, tileElement, startPos),
                () => this.settleTileInPile(tile, player),
                () => this.updateHandAfterDiscard(player, tileIndex, tileElement)
            ]);
        } finally {
            // Clear flag and trigger hand re-render
            if (this.mobileRenderer) {
                this.mobileRenderer.isDiscardAnimationRunning = false;
            }

            // Force hand re-render now that animation is complete
            // This ensures the hand reflects the actual game state (tile removed)
            const currentPlayer = this.gameController?.players?.[0];
            if (currentPlayer?.hand) {
                this.handRenderer.render(currentPlayer.hand);
            }
        }
    }

    /**
     * Prepare tile for discard (visual highlight)
     * @param {number} player - Player index
     * @param {number} tileIndex - Index in hand
     * @param {HTMLElement} tileElement - Pre-captured tile element
     */
    async prepareDiscard(player, tileIndex, tileElement) {
        if (player !== HUMAN_PLAYER || !tileElement) {
            return;
        }

        tileElement.classList.add("tile-discarding-prep");
        await this.delay(100); // Brief pause for visual feedback
    }

    /**
     * Animate tile from hand to discard pile
     * @param {number} player - Player index
     * @param {TileData} tile - Tile being discarded
     * @param {number} tileIndex - Index in hand
     * @param {Object} animation - Animation metadata
     * @param {HTMLElement} tileElement - Pre-captured tile element
     * @param {{x: number, y: number}} startPos - Pre-captured start position
     */
    async animateTileToDiscard(player, tile, tileIndex, animation, tileElement, startPos) {
        // Add tile to discard pile FIRST to get its actual position
        this.discardPile.addDiscard(tile, player);

        // Get the actual position of the tile we just added
        const addedTileElement = this.discardPile.getLatestDiscardElement();
        if (!addedTileElement) {
            console.warn("Could not get discard tile element");
            return;
        }

        const targetRect = addedTileElement.getBoundingClientRect();
        const endPos = {
            x: targetRect.left,
            y: targetRect.top
        };

        // Hide the target tile (we'll animate a clone to it)
        addedTileElement.style.opacity = "0";

        // Create clone for animation
        const tileClone = this.createDiscardTileClone(tileElement, tile);
        document.body.appendChild(tileClone);

        // Hide original tile in hand
        if (tileElement) {
            tileElement.style.visibility = "hidden";
        }

        // Calculate trajectory
        const trajectory = this.calculateDiscardTrajectory(
            startPos,
            endPos,
            player,
            animation
        );

        // Animate clone
        await this.animateTileThrow(tileClone, trajectory);

        // Cleanup: remove clone and show target
        tileClone.remove();
        addedTileElement.style.opacity = "";
    }

    /**
     * Calculate parabolic arc from hand to discard pile
     * @param {{x: number, y: number}} startPos - Starting position (top-left)
     * @param {{x: number, y: number}} endPos - Ending position (top-left)
     * @param {number} player - Player index
     * @param {Object} animation - Animation metadata
     * @returns {Object} Trajectory data
     */
    calculateDiscardTrajectory(startPos, endPos, player, animation) {
        const isHuman = player === HUMAN_PLAYER;

        // Calculate arc - using top-left coordinates
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;

        // Arc upward (negative Y) for nice parabolic effect
        const arcHeight = isHuman ? -100 : -50; // Human has higher arc

        // Control point for quadratic bezier (midpoint + arc offset)
        const controlPoint = {
            x: startPos.x + dx * 0.5,
            y: startPos.y + dy * 0.5 + arcHeight
        };

        return {
            start: { x: startPos.x, y: startPos.y },
            control: controlPoint,
            end: { x: endPos.x, y: endPos.y },
            duration: animation?.duration || (isHuman ? 400 : 250),
            rotation: animation?.rotation || (isHuman ? 360 : 180),
            easing: animation?.easing || "ease-out"
        };
    }

    /**
     * Animate tile along trajectory with CSS
     * @param {HTMLElement} tileClone - Cloned tile element
     * @param {Object} trajectory - Trajectory data
     */
    async animateTileThrow(tileClone, trajectory) {
        // Calculate deltas (relative offsets from starting position)
        const deltaX = trajectory.end.x - trajectory.start.x;
        const deltaY = trajectory.end.y - trajectory.start.y;
        const midX = trajectory.control.x - trajectory.start.x;
        const midY = trajectory.control.y - trajectory.start.y;

        // Set CSS custom properties (using deltas for transform)
        tileClone.style.setProperty("--delta-x", `${deltaX}px`);
        tileClone.style.setProperty("--delta-y", `${deltaY}px`);
        tileClone.style.setProperty("--mid-x", `${midX}px`);
        tileClone.style.setProperty("--mid-y", `${midY}px`);
        tileClone.style.setProperty("--rotation", `${trajectory.rotation}deg`);
        tileClone.style.setProperty("--duration", `${trajectory.duration}ms`);

        tileClone.classList.add("tile-discard-throw");

        // Play sound effect
        if (this.soundEnabled) {
            this.playDiscardSound();
        }

        await this.delay(trajectory.duration);
    }

    /**
     * Settle tile into discard pile with bounce
     * @param {TileData} tile - Tile to add to discard pile
     * @param {number} player - Player who discarded
     */
    async settleTileInPile(tile, player) {
        // Tile was already added in animateTileToDiscard
        // Just apply the bounce animation
        const discardTileElement = this.discardPile.getLatestDiscardElement();
        if (!discardTileElement) {
            return;
        }

        // Apply bounce animation
        discardTileElement.classList.add("tile-settle-bounce");

        await this.delay(200); // Bounce duration

        // Remove animation class
        discardTileElement.classList.remove("tile-settle-bounce");
    }

    /**
     * Update hand renderer after discard
     * @param {number} player - Player index
     * @param {number} tileIndex - Index that was discarded
     * @param {HTMLElement} tileElement - Pre-captured tile element
     */
    updateHandAfterDiscard(player, tileIndex, tileElement) {
        // Hand will be re-rendered via HAND_UPDATED event
        // This just ensures cleanup of any animation states
        if (player === HUMAN_PLAYER && tileElement) {
            tileElement.style.visibility = "";
            tileElement.classList.remove("tile-discarding-prep");
        }
    }

    /**
     * Create clone of tile for animation
     * @param {HTMLElement} originalElement - Original tile element
     * @returns {HTMLElement} Cloned tile element
     */
    createDiscardTileClone(originalElement) {
        const clone = originalElement.cloneNode(true);
        clone.classList.add("tile-clone-animating");
        clone.style.position = "fixed";
        clone.style.zIndex = "9999";
        clone.style.pointerEvents = "none";

        // Copy computed styles
        const computedStyle = window.getComputedStyle(originalElement);
        clone.style.width = computedStyle.width;
        clone.style.height = computedStyle.height;

        // Get initial position from original element
        const rect = originalElement.getBoundingClientRect();
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;

        return clone;
    }

    /**
     * Skip animation (instant discard)
     * @param {TileData} tile - Tile to discard
     * @param {number} player - Player who discarded
     */
    skipAnimation(tile, player) {
        this.discardPile.addDiscard(tile, player);
    }

    /**
     * Play discard sound effect
     */
    playDiscardSound() {
        try {
            // Use relative path from mobile directory
            const audio = new Audio("../pwa/assets/audio/tile_dropping.mp3");
            audio.volume = 0.5;
            audio.play().catch(err => {
                console.warn("Could not play discard sound:", err);
            });
        } catch (err) {
            console.warn("Error creating discard audio:", err);
        }
    }
}
