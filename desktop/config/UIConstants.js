/**
 * UIConstants - Desktop-specific UI configuration
 *
 * Contains dimensions, scaling factors, and positioning constants used by Phaser.
 */

export const WINDOW_HEIGHT = 648;
export const WINDOW_WIDTH = 1052;
export const SPRITE_HEIGHT = 69;
export const SPRITE_WIDTH = 52;
export const SPRITE_SCALE = 0.75;
export const TILE_GAP = 4;

// UI Position Constants (Desktop Phaser coordinates)
// Screen dimensions: 0,0 (top-left) to WINDOW_WIDTH,WINDOW_HEIGHT (bottom-right)
export const UI_POSITIONS = {
  // Tile Y-positions for selection feedback (PLAYER.BOTTOM only)
  TILE_SELECTED_Y: 575, // Y position when tile is selected (raised)
  TILE_NORMAL_Y: 600, // Y position when tile is in normal state

  // Player hand base positions (from playerLayout.js - duplicated here for reference)
  BOTTOM_PLAYER_X: 200,
  BOTTOM_PLAYER_Y: 600,
  RIGHT_PLAYER_X: 1000,
  RIGHT_PLAYER_Y: 520,
  TOP_PLAYER_X: 750,
  TOP_PLAYER_Y: 50,
  LEFT_PLAYER_X: 50,
  LEFT_PLAYER_Y: 50,

  // Selection visual offset
  SELECTION_RAISE_OFFSET: 25, // How many pixels to raise selected tiles (600 - 575)
};
