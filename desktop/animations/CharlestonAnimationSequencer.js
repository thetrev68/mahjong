import { AnimationSequencer } from "./AnimationSequencer.js";
import { TileData } from "../../core/models/TileData.js";
import { PLAYER } from "../../constants.js";
import { debugPrint } from "../../utils.js";

/**
 * CharlestonAnimationSequencer - Orchestrates Charleston tile pass/receive animations
 *
 * Handles the complete animation flow:
 * 1. Tiles exit hand (fade out + small offset in direction)
 * 2. Brief travel delay
 * 3. New tiles enter hand (fade in from opposite direction)
 * 4. Blue glow applied to received tiles
 * 5. Hand re-renders with updated tiles
 *
 * Direction vectors define exit/entry offsets:
 * - "right": Pass to right player (exit right, receive from left)
 * - "across": Pass to opposite player (exit up, receive from down)
 * - "left": Pass to left player (exit left, receive from right)
 *
 * Desktop version adapted from mobile/animations/CharlestonAnimationSequencer.js
 * Uses Phaser tweens instead of CSS animations.
 *
 * @extends AnimationSequencer
 */
export class CharlestonAnimationSequencer extends AnimationSequencer {
  /**
   * @param {GameController} gameController
   * @param {Phaser.Scene} scene
   * @param {TileManager} tileManager
   * @param {HandRenderer} handRenderer
   */
  constructor(gameController, scene, tileManager, handRenderer) {
    super(gameController, scene, tileManager, handRenderer);

    // Track received tiles for glow application (use tile IDs, not indices)
    this.receivedTileIds = new Set();

    // Direction vectors for animation offsets
    this.directionVectors = {
      right: { exit: { x: 100, y: -30 }, entry: { x: -100, y: 30 } },
      across: { exit: { x: 0, y: -100 }, entry: { x: 0, y: 100 } },
      left: { exit: { x: -100, y: -30 }, entry: { x: 100, y: 30 } },
    };

    // Animation timing constants (ms)
    this.PASS_OUT_DURATION = 300;
    this.TRAVEL_DELAY = 200;
    this.RECEIVE_DURATION = 300;
  }

  /**
   * Main entry point for Charleston pass animation
   * Called when player confirms tile pass
   * @param {Object} data - Charleston pass event data
   * @param {number} data.player - Player index (0 = human)
   * @param {Array} data.tiles - Tiles being passed
   * @param {string} data.direction - "right", "across", or "left"
   * @param {Array<TileData>} passingTiles - TileData objects being passed
   */
  async animateCharlestonPass(data, passingTiles) {
    if (data.player !== PLAYER.BOTTOM) {
      // Only animate for human player
      return;
    }

    const { direction } = data;

    await this.executeSequence([
      // Step 1: Animate tiles leaving hand
      () => this.animateTilesLeaving(passingTiles, direction),

      // Step 2: Travel delay (simulates tiles moving to other player)
      () => this.delay(this.TRAVEL_DELAY),

      // Note: Steps 3-4 (receive, glow) are triggered by TILES_RECEIVED event
      // which arrives after GameController processes the exchange
    ]);
  }

  /**
   * Handle receiving tiles from another player
   * Called when TILES_RECEIVED event fires
   * @param {Object} data - Tiles received event data
   * @param {number} data.player - Receiving player index
   * @param {Array} data.tiles - Tiles received (as JSON)
   * @param {string} data.direction - Direction received from
   */
  async handleTilesReceived(data) {
    if (data.player !== PLAYER.BOTTOM) {
      return;
    }

    const direction = data.animation?.direction || data.direction;
    const tilesData = data.tiles.map((t) => TileData.fromJSON(t));

    debugPrint("[CharlestonAnimationSequencer] handleTilesReceived:", {
      count: tilesData.length,
      direction,
    });

    // Store tile IDs for glow application (these persist across sorting)
    this.receivedTileIds = new Set(tilesData.map((t) => t.index));

    await this.executeSequence([
      // Step 3: Animate tiles arriving
      () => this.animateTilesArriving(tilesData, direction),

      // Step 4: Apply blue glow to received tiles
      () => this.applyGlowToReceivedTiles(tilesData),
    ]);
  }

  /**
   * Animate tiles exiting hand in specified direction
   * @param {Array<TileData>} tileDatas - Tiles to animate out
   * @param {string} direction - "right", "across", or "left"
   * @returns {Promise<void>}
   * @private
   */
  async animateTilesLeaving(tileDatas, direction) {
    const phaserTiles = this.getTileSprites(tileDatas);
    if (phaserTiles.length === 0) {
      return;
    }

    const vector = this.getDirectionVector(direction);
    if (!vector) {
      console.warn(`Unknown direction: ${direction}`);
      return;
    }

    // Animate each tile fading out with offset
    const tweenPromises = phaserTiles.map((tile) => {
      return new Promise((resolve) => {
        // Animate position offset and fade
        this.scene.tweens.add({
          targets: tile,
          x: tile.x + vector.exit.x,
          y: tile.y + vector.exit.y,
          alpha: 0,
          duration: this.PASS_OUT_DURATION,
          ease: "Cubic.easeIn",
          onComplete: resolve,
        });

        // Fade sprites too
        this.scene.tweens.add({
          targets: [tile.sprite, tile.spriteBack],
          alpha: 0,
          duration: this.PASS_OUT_DURATION,
          ease: "Cubic.easeIn",
        });
      });
    });

    // Wait for all tiles to fade out
    await Promise.all(tweenPromises);

    // Hide tiles completely
    phaserTiles.forEach((tile) => {
      tile.sprite.visible = false;
      if (tile.spriteBack) {
        tile.spriteBack.visible = false;
      }
    });
  }

  /**
   * Animate tiles entering hand from specified direction
   * @param {Array<TileData>} tileDatas - Tiles to animate in
   * @param {string} direction - Direction tiles are coming from
   * @returns {Promise<void>}
   * @private
   */
  async animateTilesArriving(tileDatas, direction) {
    const phaserTiles = this.getTileSprites(tileDatas);
    if (phaserTiles.length === 0) {
      return;
    }

    const vector = this.getDirectionVector(direction);
    if (!vector) {
      console.warn(`Unknown direction: ${direction}`);
      return;
    }

    // Get current hand to find tile positions
    const humanHand = this.gameController.players[PLAYER.BOTTOM].hand;
    if (!humanHand) {
      return;
    }

    // Re-render hand to get tiles in correct positions
    this.handRenderer.syncAndRender(PLAYER.BOTTOM, humanHand);

    // Animate each tile fading in from offset position
    const tweenPromises = phaserTiles.map((tile) => {
      // Store final position
      const finalX = tile.x;
      const finalY = tile.y;

      // Set initial position (offset from final)
      tile.x = finalX + vector.entry.x;
      tile.y = finalY + vector.entry.y;
      tile.sprite.setAlpha(0);
      if (tile.spriteBack) {
        tile.spriteBack.setAlpha(0);
      }

      // Make visible
      tile.sprite.visible = true;
      if (tile.spriteBack) {
        tile.spriteBack.visible = true;
      }

      return new Promise((resolve) => {
        // Animate to final position
        this.scene.tweens.add({
          targets: tile,
          x: finalX,
          y: finalY,
          alpha: 1,
          duration: this.RECEIVE_DURATION,
          ease: "Cubic.easeOut",
          onComplete: resolve,
        });

        // Fade sprites in
        this.scene.tweens.add({
          targets: [tile.sprite, tile.spriteBack],
          alpha: 1,
          duration: this.RECEIVE_DURATION,
          ease: "Cubic.easeOut",
        });
      });
    });

    // Wait for all tiles to arrive
    await Promise.all(tweenPromises);
  }

  /**
   * Apply blue glow to received tiles
   * @param {Array<TileData>} tileDatas - Tiles to glow
   * @private
   */
  applyGlowToReceivedTiles(tileDatas) {
    const phaserTiles = this.getTileSprites(tileDatas);
    phaserTiles.forEach((tile) => {
      if (typeof tile.addGlowEffect === "function") {
        // Blue glow (priority 10 for received tiles)
        tile.addGlowEffect(this.scene, 0x1e3a8a, 0.5, 10);
      }
    });

    // No delay needed - glow is instant
  }

  /**
   * Get direction vector for animation offsets
   * @param {string} direction - "right", "across", or "left"
   * @returns {{exit: {x: number, y: number}, entry: {x: number, y: number}}|null}
   * @private
   */
  getDirectionVector(direction) {
    return this.directionVectors[direction] || null;
  }

  /**
   * Hook: Called after sequence completes
   * @override
   */
  onSequenceComplete() {
    // Re-render hand to ensure correct layout after animations
    const humanHand = this.gameController.players[PLAYER.BOTTOM].hand;
    if (humanHand) {
      this.handRenderer.syncAndRender(PLAYER.BOTTOM, humanHand);
    }

    // Glow persists until player discards
    return Promise.resolve();
  }

  /**
   * Hook: Called when sequence encounters an error
   * @override
   */
  onSequenceError(error) {
    console.error("Charleston animation error:", error);
    return Promise.resolve();
  }
}
