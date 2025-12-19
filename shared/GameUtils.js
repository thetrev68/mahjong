/**
 * GameUtils - Shared utility functions
 */

/**
 * Get total number of tiles in the game based on settings
 * @returns {number} 152 (standard) or 160 (with blanks)
 */
export function getTotalTileCount() {
  // Default to 152 if settingsManager is not yet initialized or method doesn't exist
  if (
    !window.settingsManager ||
    typeof window.settingsManager.getUseBlankTiles !== "function"
  ) {
    return 152;
  }
  return window.settingsManager.getUseBlankTiles() ? 160 : 152;
}
