import { HandData } from "../../core/models/HandData.js";

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
  constructor(gameController, handRenderer, selectionManager) {
    this.gameController = gameController;
    this.handRenderer = handRenderer;
    this.selectionManager = selectionManager;

    // Properties extracted from HandRenderer
    this.unsubscribeFns = [];
    this.hintRecommendationKeys = new Set();
    this.newlyDrawnTileIndex = null;

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
  onHandUpdated(data = {}) {
    if (data.player === 0) {
      // Reset sort mode when hand updated from game (not user sort)
      // This allows auto-sort to resume after hand changes (draw, discard, etc.)
      if (this.handRenderer) {
        this.handRenderer.currentSortMode = null;
      }

      // Convert plain JSON object to HandData instance
      const handData = HandData.fromJSON(data.hand);
      if (this.handRenderer) {
        this.handRenderer.render(handData);
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
