/**
 * WallCounter Component
 *
 * Displays the number of remaining tiles in the wall.
 * Updates automatically when tiles are drawn from the wall.
 */
export class WallCounter {
  /**
   * @param {HTMLElement} container - DOM element to render into
   * @param {GameController} gameController - Game controller instance
   */
  constructor(container, gameController) {
    if (!container) {
      throw new Error("WallCounter requires a container element");
    }
    if (!gameController) {
      throw new Error("WallCounter requires a gameController instance");
    }

    this.container = container;
    this.gameController = gameController;
    this.unsubscribeFns = [];

    this.render();
    this.setupListeners();
  }

  /**
   * Initial render of the wall counter
   */
  render() {
    // Container already has the structure from HTML, just update the count
    const tilesEl = this.container.querySelector(".wall-tiles");
    if (tilesEl) {
      tilesEl.textContent = this.getWallCount();
    }
  }

  /**
   * Setup event listeners for game events
   */
  setupListeners() {
    // Update when a tile is drawn from the wall
    const handleTileDrawn = () => this.update();
    this.unsubscribeFns.push(
      this.gameController.on("TILE_DRAWN", handleTileDrawn),
    );

    // Update when game starts (initial wall count)
    const handleGameStarted = () => this.update();
    this.unsubscribeFns.push(
      this.gameController.on("GAME_STARTED", handleGameStarted),
    );

    // Update when tiles are dealt
    const handleTilesDealt = () => this.update();
    this.unsubscribeFns.push(
      this.gameController.on("TILES_DEALT", handleTilesDealt),
    );
  }

  /**
   * Get the current wall tile count
   * @returns {number}
   */
  getWallCount() {
    if (!this.gameController.wallTiles) {
      return 0;
    }
    return this.gameController.wallTiles.length;
  }

  /**
   * Update the displayed wall count
   */
  update() {
    const tilesEl = this.container.querySelector(".wall-tiles");
    if (tilesEl) {
      const count = this.getWallCount();
      tilesEl.textContent = count;

      // Add visual warning when wall is getting low
      if (count <= 8) {
        tilesEl.classList.add("low-count");
      } else {
        tilesEl.classList.remove("low-count");
      }
    }
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    this.unsubscribeFns.forEach((unsub) => {
      if (typeof unsub === "function") {
        unsub();
      }
    });
    this.unsubscribeFns = [];
    this.container = null;
    this.gameController = null;
  }
}
