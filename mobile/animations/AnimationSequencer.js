/**
 * AnimationSequencer - Base class for orchestrating complex multi-step animations
 *
 * Provides a framework for sequencing multiple animations with:
 * - Promise-based flow control
 * - Cancellation support
 * - Error handling
 * - Extensibility via hooks
 *
 * Subclasses (e.g., CharlestonAnimationSequencer) extend this to implement
 * specific animation flows while leveraging common functionality.
 */
import { debugPrint } from "../../shared/DebugUtils.js";

export class AnimationSequencer {
  /**
   * @param {GameController} gameController - Game controller instance
   * @param {HandRenderer} handRenderer - Hand renderer for accessing tile elements
   * @param {AnimationController} animationController - Animation primitives
   */
  constructor(gameController, handRenderer, animationController) {
    this.gameController = gameController;
    this.handRenderer = handRenderer;
    this.animationController = animationController;
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
   * Get tile DOM elements by their indices in the hand
   * @param {number[]} indices - Array of tile indices
   * @returns {HTMLElement[]} Array of tile elements
   */
  getTileElements(indices) {
    if (!this.handRenderer?.getTileElementsByIndices) {
      console.warn("HandRenderer does not support getTileElementsByIndices");
      return [];
    }
    return this.handRenderer.getTileElementsByIndices(indices);
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
