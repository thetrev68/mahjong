import { HandData } from "../../core/models/HandData.js";
import { getElementCenterPosition } from "../utils/positionUtils.js";

/**
 * HandEventCoordinator
 *
 * Extracts event subscription logic from HandRenderer.
 * Manages subscriptions to GameController events and routes them to
 * HandRenderer and SelectionManager for handling.
 *
 * **Events Subscribed:**
 * - HAND_UPDATED: Updates hand render when player 0's hand changes
 * - TILE_SELECTED: Handles tile selection from external prompts
 * - TILE_DRAWN: Tracks newly drawn tiles for glow effect
 * - TILE_DISCARDED: Clears glow when tiles are discarded
 * - HINT_DISCARD_RECOMMENDATIONS: Highlights hint recommendations
 */
export class HandEventCoordinator {
  /**
   * @param {GameController} gameController - The game controller instance
   * @param {HandRenderer} handRenderer - The hand renderer instance
   * @param {SelectionManager} selectionManager - The selection manager instance (optional)
   */
  /**
   * @param {GameController} gameController - The game controller instance
   * @param {HandRenderer} handRenderer - The hand renderer instance
   * @param {SelectionManager} selectionManager - The selection manager instance (optional)
   * @param {MobileRenderer} mobileRenderer - The mobile renderer instance (for animation flags and callbacks)
   */
  constructor(gameController, handRenderer, selectionManager, mobileRenderer = null) {
    this.gameController = gameController;
    this.handRenderer = handRenderer;
    this.selectionManager = selectionManager;
    this.mobileRenderer = mobileRenderer;

    // Properties extracted from HandRenderer
    this.unsubscribeFns = [];
    this.hintRecommendationKeys = new Set();
    this.newlyDrawnTileIndex = null;

    // Charleston/Courtesy glow tracking
    this.previousHandSnapshot = null;

    this.setupEventListeners();
  }

  /**
   * Subscribe to GameController events
   */
  setupEventListeners() {
    if (!this.gameController || typeof this.gameController.on !== "function") {
      return;
    }

    // HAND_UPDATED: Re-render when hand changes
    this.unsubscribeFns.push(
      this.gameController.on("HAND_UPDATED", (data) => this.onHandUpdated(data))
    );

    // TILE_SELECTED: Handle external tile selection (prompts, etc.)
    this.unsubscribeFns.push(
      this.gameController.on("TILE_SELECTED", (data) => this.onTileSelected(data))
    );

    // TILE_DRAWN: Track newly drawn tiles for glow effect
    this.unsubscribeFns.push(
      this.gameController.on("TILE_DRAWN", (data) => this.onTileDrawn(data))
    );

    // TILE_DISCARDED: Clear glow when tiles are discarded
    this.unsubscribeFns.push(
      this.gameController.on("TILE_DISCARDED", (data) => this.onTileDiscarded(data))
    );

    // HINT_DISCARD_RECOMMENDATIONS: Highlight discard hints
    this.unsubscribeFns.push(
      this.gameController.on("HINT_DISCARD_RECOMMENDATIONS", (data) =>
        this.onHintRecommendations(data)
      )
    );
  }

  /**
   * Handle HAND_UPDATED event
   * Converts plain JSON to HandData and renders
   */
  /**
   * Handle HAND_UPDATED event
   * Converts plain JSON to HandData and renders
   * This is now the SINGLE handler for HAND_UPDATED (MobileRenderer no longer listens)
   */
  onHandUpdated(data = {}) {
    if (data.player === 0) {
      // Skip if dealing animation is running
      if (this.mobileRenderer?.isDealingAnimationRunning) {
        return;
      }

      // Skip if discard animation is running
      if (this.mobileRenderer?.isDiscardAnimationRunning) {
        return;
      }

      // Skip if dealing just completed (but update snapshots)
      const handData = HandData.fromJSON(data.hand);
      if (this.mobileRenderer?.justCompletedDealingAnimation) {
        this.mobileRenderer.justCompletedDealingAnimation = false;
        this.previousHandSnapshot = handData.clone();
        if (this.mobileRenderer) {
          this.mobileRenderer.latestHandSnapshot = handData;
          this.mobileRenderer.previousHandSnapshot = handData.clone();
        }
        return;
      }

      // Detect newly received tiles (Charleston/Courtesy)
      const newlyReceivedTiles = this._findNewlyReceivedTiles(this.previousHandSnapshot, handData);

      // Reset sort mode when hand updated from game (not user sort)
      if (this.handRenderer) {
        this.handRenderer.currentSortMode = null;
      }

      // Render the hand
      if (this.handRenderer) {
        this.handRenderer.render(handData);
        
        // Reapply any active hint highlights after rerender
        this.applyHintRecommendations();
      }

      // Update player rack with exposures (via MobileRenderer callback)
      if (this.mobileRenderer?.playerRack) {
        this.mobileRenderer.playerRack.update(handData.toJSON());
      }

      // Update button visibility (via MobileRenderer callbacks)
      if (this.mobileRenderer) {
        this.mobileRenderer.updateJokerSwapButton();
        this.mobileRenderer.updateBlankSwapButton();
        this.mobileRenderer.updateMahjongButton();
      }

      // Apply glow to newly received tiles after rendering
      if (newlyReceivedTiles.length > 0 && this.handRenderer && this.mobileRenderer?.animationController) {
        // newlyReceivedTiles contains tile.index values (0-151), need to find positions in hand
        const handTiles = handData.tiles;
        newlyReceivedTiles.forEach(tileIndex => {
          // Find position in hand that has this tile index
          const position = handTiles.findIndex(t => t?.index === tileIndex);
          if (position >= 0) {
            const tileElement = this.handRenderer.getTileElementByIndex(position);
            if (tileElement) {
              this.mobileRenderer.animationController.applyReceivedTileGlow(tileElement);
            }
          }
        });
      }

      // Store current hand as previous for next comparison
      this.previousHandSnapshot = handData.clone();
      if (this.mobileRenderer) {
        this.mobileRenderer.latestHandSnapshot = handData;
        this.mobileRenderer.previousHandSnapshot = handData.clone();
      }

      // If we just drew a tile (hand size increased to 14), animate it
      if (handData.tiles.length % 3 === 2 && this.handRenderer && this.mobileRenderer?.animationController) {
        const lastTile = this.handRenderer.getLastTileElement();
        if (lastTile) {
          // Calculate draw animation from wall position (top-left) to hand position
          const startPos = {
            x: window.innerWidth * -0.20, // -20vw: off-screen top-left
            y: window.innerHeight * -0.20 // -20vh: off-screen top-left
          };
          const endPos = getElementCenterPosition(lastTile);
          this.mobileRenderer.animationController.animateTileDraw(lastTile, startPos, endPos);
        }
      }
    } else {
      // Handle opponent bar updates
      if (this.mobileRenderer && this.gameController) {
        const player = this.gameController.players[data.player];
        if (player) {
          const bar = this.mobileRenderer.opponentBars.find(ob => ob.playerIndex === data.player);
          if (bar) {
            bar.bar.update(player);
          }
        }
      }
    }
  }

  /**
   * Handle TILE_SELECTED event
   * Routes selection through SelectionManager
   */
  onTileSelected(data = {}) {
    if (!this.selectionManager) {
      return;
    }

    // Single tile selection
    if (typeof data.index === "number") {
      this.selectionManager.selectTile(data.index, {
        toggle: data.toggle !== false,
        clearOthers: !!data.exclusive,
        state: data.state
      });
      return;
    }

    // Multiple tile selection
    if (Array.isArray(data.indices)) {
      if (data.clearExisting) {
        this.selectionManager.clearSelection();
      }
      data.indices.forEach((index) => {
        if (typeof index === "number") {
          this.selectionManager.selectTile(index, { state: data.state ?? "on", toggle: false });
        }
      });
    }
  }

  /**
   * Handle TILE_DRAWN event
   * Track newly drawn tiles for blue glow effect
   */
  onTileDrawn(data = {}) {
    if (data.player === 0 && data.tile) {
      // Store the drawn tile's index to highlight it after next render
      this.newlyDrawnTileIndex = data.tile.index;
      // Pass it to HandRenderer if available
      if (this.handRenderer) {
        this.handRenderer.newlyDrawnTileIndex = this.newlyDrawnTileIndex;
      }
    }
  }

  /**
   * Handle TILE_DISCARDED event
   * Clear newly drawn glow when a tile is discarded
   */
  onTileDiscarded(data = {}) {
    if (data.player === 0) {
      this.newlyDrawnTileIndex = null;
      if (this.handRenderer) {
        this.handRenderer.newlyDrawnTileIndex = null;
        // Remove glow from all tiles
        this.handRenderer.tiles.forEach((tileEl) => {
          if (tileEl) {
            tileEl.classList.remove("tile--newly-drawn");
          }
        });
      }
    }
  }

  /**
   * Handle HINT_DISCARD_RECOMMENDATIONS event
   * Highlight discard recommendations from hints panel
   */
  onHintRecommendations(data = {}) {
    const tiles = Array.isArray(data.tiles) ? data.tiles : [];
    const active = data.active !== false;

    if (!active || tiles.length === 0) {
      this.hintRecommendationKeys.clear();
      this.applyHintRecommendations();
      return;
    }

    // Convert tiles to selection keys
    const keys = tiles
      .map((tile, idx) => this.getTileSelectionKey(tile, idx))
      .filter(Boolean);
    this.hintRecommendationKeys = new Set(keys);
    this.applyHintRecommendations();
  }

  /**
   * Apply hint recommendation styling to tiles
   * Updates CSS classes based on hintRecommendationKeys
   */
  applyHintRecommendations() {
    if (!this.handRenderer) {
      return;
    }

    const tiles = this.handRenderer.currentHandData?.tiles || [];
    this.handRenderer.tiles.forEach((button, index) => {
      const key = this.getTileSelectionKey(tiles[index], index);
      if (!key) {
        button.classList.remove("tile--hint-discard");
        return;
      }
      if (this.hintRecommendationKeys.has(key)) {
        button.classList.add("tile--hint-discard");
      } else {
        button.classList.remove("tile--hint-discard");
      }
    });
  }

  /**
   * Get a selection key for a tile (same logic as HandRenderer)
   * Used for tracking hint recommendations across renders
   */
  getTileSelectionKey(tile, fallbackIndex) {
    if (!tile) {
      return `missing-${fallbackIndex}`;
    }
    if (typeof tile.index === "number" && tile.index >= 0) {
      return `idx-${tile.index}`;
    }
    return `${tile.suit}:${tile.number}:${fallbackIndex}`;
  }

  /**
   * Clean up all event subscriptions
   */
  /**
   * Find newly received tiles by comparing previous and current hand snapshots
   * Used for Charleston/Courtesy glow effects
   * @param {HandData} prevHand - Previous hand snapshot
   * @param {HandData} currentHand - Current hand snapshot
   * @returns {number[]} Array of tile indices that are new
   */
  _findNewlyReceivedTiles(prevHand, currentHand) {
    if (!prevHand || !currentHand) {
      return [];
    }

    // Filter out undefined/non-numeric indices when building index arrays
    const prevIndices = new Set(
      prevHand.tiles
        .map(t => t?.index)
        .filter(idx => typeof idx === "number" && !isNaN(idx))
    );
    const currentIndices = currentHand.tiles
      .map(t => t?.index)
      .filter(idx => typeof idx === "number" && !isNaN(idx));

    // Find tiles in current hand that weren't in previous hand
    return currentIndices.filter(idx => !prevIndices.has(idx));
  }

  destroy() {
    this.unsubscribeFns.forEach((unsub) => {
      if (typeof unsub === "function") {
        unsub();
      }
    });
    this.unsubscribeFns = [];
    this.hintRecommendationKeys.clear();
    this.newlyDrawnTileIndex = null;

    this.gameController = null;
    this.handRenderer = null;
    this.selectionManager = null;
  }
}
