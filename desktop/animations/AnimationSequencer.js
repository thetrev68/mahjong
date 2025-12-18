/**
 * AnimationSequencer - Base class for orchestrating complex multi-step Phaser animations
 *
 * Provides a framework for sequencing multiple animations with:
 * - Promise-based flow control
 * - Cancellation support
 * - Error handling
 * - Extensibility via hooks
 *
 * Desktop version adapted from mobile/animations/AnimationSequencer.js
 * Works with Phaser tweens and sprite-based animations.
 *
 * Subclasses (e.g., DealingAnimationSequencer) extend this to implement
 * specific animation flows while leveraging common functionality.
 */
import { debugPrint } from "../../utils.js";

export class AnimationSequencer {
  /**
   * @param {GameController} gameController - Game controller instance
   * @param {Phaser.Scene} scene - Phaser scene for creating tweens
   * @param {TileManager} tileManager - Tile manager for sprite access
   * @param {HandRenderer} handRenderer - Hand renderer for tile positioning
   */
  constructor(gameController, scene, tileManager, handRenderer) {
    this.gameController = gameController;
    this.scene = scene;
    this.tileManager = tileManager;
    this.handRenderer = handRenderer;
    this.isAnimating = false;
    this.currentSequence = null;
    this.cancelRequested = false;
  }

  /**
   * Execute a sequence of animation steps
   * @param {Array<Function>} steps - Array of async functions to execute in order
   * @returns {Promise<void>}
   */
  async executeSequence(steps) {
    if (this.isAnimating) {
      console.warn("Animation already in progress, skipping new sequence");
      return;
    }

    this.isAnimating = true;
    this.cancelRequested = false;
    this.currentSequence = { steps, currentStep: 0 };

    try {
      await this.onSequenceStart();

      for (let i = 0; i < steps.length; i++) {
        if (this.cancelRequested) {
          debugPrint("Animation sequence cancelled");
          break;
        }

        this.currentSequence.currentStep = i;
        const step = steps[i];

        if (typeof step !== "function") {
          console.warn(`Step ${i} is not a function, skipping`);
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        await step();
      }

      await this.onSequenceComplete();
    } catch (error) {
      await this.onSequenceError(error);
      throw error; // Re-throw so caller can handle if needed
    } finally {
      this.isAnimating = false;
      this.currentSequence = null;
      this.cancelRequested = false;
    }
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    if (this.cancelRequested) {
      return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if animation sequence is currently running
   * @returns {boolean}
   */
  isRunning() {
    return this.isAnimating;
  }

  /**
   * Request cancellation of current animation sequence
   * Note: Cancellation happens at next step boundary
   */
  cancel() {
    if (this.isAnimating) {
      this.cancelRequested = true;
    }
  }

  /**
   * Get Phaser tile sprites by their TileData indices
   * @param {Array<TileData>} tileDatas - Array of TileData objects
   * @returns {Array<Tile>} Array of Phaser tile sprites
   */
  getTileSprites(tileDatas) {
    if (!this.tileManager) {
      console.warn("TileManager not available");
      return [];
    }
    return tileDatas
      .map((td) => this.tileManager.getOrCreateTile(td))
      .filter(Boolean);
  }

  /**
   * Calculate direction vector and distance between two points
   * @param {{x: number, y: number}} from - Starting position
   * @param {{x: number, y: number}} to - Ending position
   * @returns {{dx: number, dy: number, distance: number}}
   */
  calculateDirection(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return { dx, dy, distance };
  }

  // ========== Hooks for Subclasses ==========

  /**
   * Hook called before sequence starts
   * Override in subclass to perform setup
   * @returns {Promise<void>}
   */
  async onSequenceStart() {
    // Override in subclass
  }

  /**
   * Hook called after sequence completes successfully
   * Override in subclass to perform cleanup
   * @returns {Promise<void>}
   */
  async onSequenceComplete() {
    // Override in subclass
  }

  /**
   * Hook called when sequence encounters an error
   * Override in subclass to handle errors
   * @param {Error} error - The error that occurred
   * @returns {Promise<void>}
   */
  onSequenceError(error) {
    console.error("Animation sequence error:", error);
    // Override in subclass for custom error handling
    return Promise.resolve();
  }
}
