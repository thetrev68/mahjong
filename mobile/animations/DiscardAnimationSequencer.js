import { AnimationSequencer } from "./AnimationSequencer.js";
import { TileData } from "../../core/models/TileData.js";
import SettingsManager from "../../shared/SettingsManager.js";
import tileDroppingSoundUrl from "/assets/audio/tile_dropping.mp3?url";

const HUMAN_PLAYER = 0;

/**
 * Check if user prefers reduced motion
 * @returns {boolean} true if user prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

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

        // Capture the tile's CURRENT (selected) position so the arc starts where the user sees it
        const startRect = tileElement.getBoundingClientRect();
        const startPos = {
            x: startRect.left,
            y: startRect.top
        };

        // Build the clone up front while the tile is still in-place
        const tileClone = this.createDiscardTileClone(tileElement, startRect);
        if (!tileClone) {
            this.skipAnimation(tile, player);
            return;
        }
        // Hide the original tile before clearing selection to avoid visible "drop back" jank
        tileElement.style.visibility = "hidden";
        document.body.appendChild(tileClone);

        // Clear selection state (no visual impact because original is hidden)
        if (this.mobileRenderer?.selectionManager) {
            this.mobileRenderer.selectionManager.clearSelection();
        }

        // Set flag to prevent hand re-renders during animation
        if (this.mobileRenderer) {
            this.mobileRenderer.isDiscardAnimationRunning = true;
        }

        try {
            await this.executeSequence([
                () => this.prepareDiscard(player, tileClone),
                () => this.animateTileToDiscard(player, tile, animation, tileClone, startPos),
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
     * @param {HTMLElement} tileClone - Clone that will animate
     */
    async prepareDiscard(player, tileClone) {
        if (player !== HUMAN_PLAYER || !tileClone) {
            return;
        }

        tileClone.classList.add("tile-discarding-prep");
        // Force layout so the prep animation always triggers
        tileClone.getBoundingClientRect();
        await this.delay(100); // Brief pause for visual feedback
        tileClone.classList.remove("tile-discarding-prep");
    }

    /**
     * Animate tile from hand to discard pile
     * @param {number} player - Player index
     * @param {TileData} tile - Tile being discarded
     * @param {Object} animation - Animation metadata
     * @param {HTMLElement} tileClone - Pre-built tile clone
     * @param {{x: number, y: number}} startPos - Pre-captured start position
     */
    async animateTileToDiscard(player, tile, animation, tileClone, startPos) {
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
            // Slow the animation a bit for visibility; allow overrides via metadata
            duration: Math.max(
                220,
                (animation?.duration ?? (isHuman ? 550 : 320)) * (animation?.speedMultiplier ?? 1)
            ),
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

        // Force reflow before starting the animation to ensure it triggers
        tileClone.getBoundingClientRect();
        tileClone.classList.add("tile-discard-throw");
        
        // Only force inline animation if user does not prefer reduced motion
        if (!prefersReducedMotion()) {
            tileClone.style.setProperty(
                "animation",
                `tile-discard-throw ${trajectory.duration}ms ${trajectory.easing} forwards`,
                "important"
            );
        }

        // Play sound effect
        if (this.soundEnabled) {
            this.playDiscardSound();
        }

        // Use minimal delay for reduced motion users
        const delayDuration = prefersReducedMotion() ? 100 : trajectory.duration;
        await this.delay(delayDuration);
    }

    /**
     * Settle tile into discard pile with bounce
     * @param {TileData} _tile - Tile to add to discard pile (unused - already added)
     * @param {number} _player - Player who discarded (unused)
     */
    async settleTileInPile(_tile, _player) {
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
     * @param {{left:number, top:number}} startRect - Pre-captured bounds (avoids shifting after deselect)
     * @returns {HTMLElement|null} Cloned tile element
     */
    createDiscardTileClone(originalElement, startRect) {
        if (!originalElement || !startRect) {
            return null;
        }

        const clone = originalElement.cloneNode(true);
        clone.classList.add("tile-clone-animating");
        clone.classList.remove("selected"); // Prevent inherited lift transform
        clone.style.position = "fixed";
        clone.style.zIndex = "9999";
        clone.style.pointerEvents = "none";

        // Copy computed styles
        const computedStyle = window.getComputedStyle(originalElement);
        clone.style.width = computedStyle.width;
        clone.style.height = computedStyle.height;

        // Pin to the exact on-screen position we captured
        clone.style.left = `${startRect.left}px`;
        clone.style.top = `${startRect.top}px`;
        clone.style.transform = "translate3d(0, 0, 0)";

        return clone;
    }

    /**
     * Skip animation (instant discard)
     * @param {TileData} tile - Tile to discard
     * @param {number} player - Player who discarded
     */
    skipAnimation(tile, player) {
        this.discardPile.addDiscard(tile, player);
        if (this.soundEnabled) {
            this.playDiscardSound();
        }
    }

    /**
     * Play discard sound effect
     */
    playDiscardSound() {
        try {
            // Check user settings
            const settings = SettingsManager.load();
            if (settings.sfxMuted) {
                return;
            }

            // eslint-disable-next-line no-undef
            const audio = new Audio(tileDroppingSoundUrl);
            // Convert sfxVolume from 0-100 to 0-1 scale
            audio.volume = (settings.sfxVolume || 50) / 100;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Audio playback started successfully
                    })
                    .catch(err => {
                        console.warn("Could not play discard sound:", err.message);
                    });
            }
        } catch (err) {
            console.warn("Error creating discard audio:", err.message);
        }
    }
}
