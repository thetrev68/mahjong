import { AnimationSequencer } from "./AnimationSequencer.js";
import { TileData } from "../../core/models/TileData.js";
import { PLAYER } from "../../shared/GameConstants.js";
import { debugError } from "../../utils.js";

/**
 * DiscardAnimationSequencer - Handles discard tile animations for desktop platform
 *
 * Animates tiles moving from hand to discard pile with arc trajectory.
 * Uses TileManager's addTileToDiscardPile which handles the Phaser tween animation.
 *
 * Key Features:
 * - Arc animation from hand to discard pile
 * - Blue glow on newly discarded tile
 * - Clears previous discard glow
 * - Clears human player's draw glow
 * - Sound effects on discard
 *
 * Desktop version adapted from mobile/animations/DiscardAnimationSequencer.js
 * Uses existing TileManager.addTileToDiscardPile() for animation.
 *
 * @extends AnimationSequencer
 */
export class DiscardAnimationSequencer extends AnimationSequencer {
  /**
   * @param {GameController} gameController
   * @param {Phaser.Scene} scene
   * @param {TileManager} tileManager
   * @param {HandRenderer} handRenderer
   * @param {Object} options - Additional dependencies
   * @param {Function} options.clearHumanDrawGlow - Callback to clear human glow
   * @param {Function} options.clearLastDiscardGlow - Callback to clear last discard glow
   * @param {Object} options.blankSwapManager - BlankSwapManager instance
   */
  constructor(gameController, scene, tileManager, handRenderer, options = {}) {
    super(gameController, scene, tileManager, handRenderer);
    this.clearHumanDrawGlow = options.clearHumanDrawGlow;
    this.blankSwapManager = options.blankSwapManager;

    /** @type {Tile|null} Track last discarded tile for glow cleanup */
    this.lastDiscardGlowTile = null;
  }

  /**
   * Main entry point - animates tile discard
   * @param {Object} data - From GameController TILE_DISCARDED event
   * @param {number} data.player - Player index (0-3)
   * @param {Object} data.tile - TileData object (as JSON)
   * @param {Object} data.animation - Animation metadata (optional)
   */
  async animateDiscard(data) {
    if (!data?.tile) {
      return;
    }

    const { player: playerIndex, tile: tileJSON } = data;
    const tileData = TileData.fromJSON(tileJSON);

    if (this.isAnimating) {
      // If another discard animation is running, render immediately so claim prompts have a visible discard.
      this.applyFallbackDiscard(playerIndex, tileData);
      return;
    }

    try {
      await this.executeSequence([
        () => this.prepareDiscard(playerIndex, tileData),
        () => this.animateTileToDiscard(playerIndex, tileData),
        () => this.applyDiscardGlow(tileData),
        () => this.finalizeDiscard(),
      ]);
    } catch (error) {
      // Fall back to an immediate discard update so the pile stays in sync
      console.error("Discard animation failed, applying fallback:", error);
      this.applyFallbackDiscard(playerIndex, tileData);
    }
  }

  /**
   * Prepare tile for discard (clear glows, validation)
   * @param {number} playerIndex - Player discarding
   * @param {TileData} tileData - Tile being discarded
   * @private
   */
  prepareDiscard(playerIndex, tileData) {
    const phaserTile = this.tileManager.getOrCreateTile(tileData);

    if (!phaserTile) {
      debugError(`Could not find Phaser Tile for index ${tileData.index}`);
      throw new Error(`Tile sprite not found: ${tileData.index}`);
    }

    // Clear human player's draw glow
    if (playerIndex === PLAYER.BOTTOM && this.clearHumanDrawGlow) {
      this.clearHumanDrawGlow(phaserTile);
    }

    // Clear glow from previous discard
    if (
      this.lastDiscardGlowTile &&
      typeof this.lastDiscardGlowTile.removeGlowEffect === "function"
    ) {
      this.lastDiscardGlowTile.removeGlowEffect();
      this.lastDiscardGlowTile = null;
    }

    // No delay needed - preparation is instant
  }

  /**
   * Animate tile from hand to discard pile
   * @param {number} playerIndex - Player discarding
   * @param {TileData} tileData - Tile being discarded
   * @returns {Promise<void>}
   * @private
   */
  async animateTileToDiscard(playerIndex, tileData) {
    const phaserTile = this.tileManager.getOrCreateTile(tileData);

    if (!phaserTile) {
      return;
    }

    // Use TileManager's addTileToDiscardPile which handles animation + audio
    const discardTween = this.tileManager.addTileToDiscardPile(phaserTile);

    // Wait for animation to complete
    if (discardTween) {
      await new Promise((resolve) => {
        discardTween.once("complete", resolve);
      });
    }
  }

  /**
   * Apply blue glow to newly discarded tile
   * @param {TileData} tileData - Tile that was discarded
   * @private
   */
  applyDiscardGlow(tileData) {
    const phaserTile = this.tileManager.getOrCreateTile(tileData);

    if (!phaserTile || typeof phaserTile.addGlowEffect !== "function") {
      return;
    }

    // Dark blue glow (0x2563eb is blue-600, matches mobile)
    // Priority 5: Lower than new-tile glow (10) but higher than hint glow (0)
    // Intensity 0.9 for prominence
    phaserTile.addGlowEffect(this.scene, 0x2563eb, 0.9, 5);

    // Track for cleanup on next discard
    this.lastDiscardGlowTile = phaserTile;
  }

  /**
   * Finalize discard (update managers, logging)
   * @private
   */
  finalizeDiscard() {
    // Notify blank swap manager
    if (this.blankSwapManager?.handleDiscardPileChanged) {
      this.blankSwapManager.handleDiscardPileChanged();
    }

    // Note: Logging is handled by PhaserAdapter.onTileDiscarded
    // No delay needed
  }

  /**
   * Get the last discarded tile (for glow cleanup)
   * @returns {Tile|null}
   */
  getLastDiscardGlowTile() {
    return this.lastDiscardGlowTile;
  }

  /**
   * Clear the last discard glow tile reference
   */
  clearLastDiscardReference() {
    this.lastDiscardGlowTile = null;
  }

  /**
   * Fallback path when the animated sequence fails.
   * Inserts the tile directly into the discard pile so gameplay stays consistent.
   * @param {number} playerIndex
   * @param {TileData} tileData
   */
  applyFallbackDiscard(playerIndex, tileData) {
    const phaserTile = this.tileManager?.getOrCreateTile(tileData);
    if (!phaserTile || !this.tileManager?.discards) {
      return;
    }

    if (
      this.lastDiscardGlowTile &&
      typeof this.lastDiscardGlowTile.removeGlowEffect === "function"
    ) {
      this.lastDiscardGlowTile.removeGlowEffect();
      this.lastDiscardGlowTile = null;
    }

    // Clear any human draw glow to avoid stale highlights
    if (playerIndex === PLAYER.BOTTOM && this.clearHumanDrawGlow) {
      this.clearHumanDrawGlow(phaserTile);
    }

    this.tileManager.discards.insertDiscard(phaserTile);
    this.tileManager.discards.layoutTiles();
    phaserTile.showTile(true, true);

    this.applyDiscardGlow(tileData);

    if (this.blankSwapManager?.handleDiscardPileChanged) {
      this.blankSwapManager.handleDiscardPileChanged();
    }
  }

  /**
   * Hook: Called when sequence encounters an error
   * @override
   */
  onSequenceError(error) {
    console.error("Discard animation error:", error);
    return Promise.resolve();
  }
}
