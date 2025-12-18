/**
 * Asset Error Detector
 *
 * Detects when critical assets (like tiles.png) fail to load
 * and triggers text mode fallback automatically.
 */

export class AssetErrorDetector {
  constructor() {
    this.assetsLoaded = new Map();
    this.errorCallbacks = [];
    this.testImage = null;
    this.hasDetectedError = false;
  }

  /**
   * Register a callback to be called when an asset fails to load
   * @param {Function} callback - Function to call on asset error
   */
  onAssetError(callback) {
    this.errorCallbacks.push(callback);
  }

  /**
   * Test if the tiles.png sprite sheet can be loaded
   * @param {string} tilesPath - Path to tiles.png (default: /mahjong/assets/tiles.png)
   * @returns {Promise<boolean>} - Resolves to true if loaded, false if error
   */
  testTilesAsset(tilesPath = "/mahjong/assets/tiles.png") {
    return new Promise((resolve) => {
      // If we already detected an error, return false immediately
      if (this.hasDetectedError) {
        resolve(false);
        return;
      }

      // If we already tested this asset successfully, return true
      if (this.assetsLoaded.get(tilesPath) === true) {
        resolve(true);
        return;
      }

      const img = new Image();
      this.testImage = img;

      img.onload = () => {
        this.assetsLoaded.set(tilesPath, true);
        this.testImage = null;
        resolve(true);
      };

      img.onerror = () => {
        this.assetsLoaded.set(tilesPath, false);
        this.hasDetectedError = true;
        this.testImage = null;

        // Notify all registered callbacks
        this.errorCallbacks.forEach(callback => {
          try {
            callback("tiles.png", tilesPath);
          } catch (err) {
            console.error("Error in asset error callback:", err);
          }
        });

        resolve(false);
      };

      // Set source to trigger load
      img.src = tilesPath;
    });
  }

  /**
   * Check if assets have loaded successfully
   * @param {string} assetPath - Path to check
   * @returns {boolean|null} - true if loaded, false if error, null if not tested
   */
  isAssetLoaded(assetPath) {
    return this.assetsLoaded.get(assetPath) ?? null;
  }

  /**
   * Reset the detector state (for testing)
   */
  reset() {
    this.assetsLoaded.clear();
    this.errorCallbacks = [];
    this.hasDetectedError = false;
    if (this.testImage) {
      this.testImage.src = "";
      this.testImage = null;
    }
  }
}

// Export singleton instance
export const assetErrorDetector = new AssetErrorDetector();
