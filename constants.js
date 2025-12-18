// CONSTANTS
export const WINDOW_HEIGHT = 648,
    WINDOW_WIDTH = 1052,
    SPRITE_HEIGHT = 69,
    SPRITE_WIDTH = 52,
    SPRITE_SCALE = 0.75,
    TILE_GAP = 4;

// Game state
export const STATE = {
    // INIT - create wall, shuffle tiles
    INIT: 0,
    // START  - start game
    START: 1,
    // DEAL - deal tiles
    DEAL: 2,
    // CHARLESTON 1
    CHARLESTON1: 3,
    // Ask user whether to continue charleston
    CHARLESTON_QUERY: 4,
    CHARLESTON_QUERY_COMPLETE: 5,
    // CHARLSTON 2
    CHARLESTON2: 6,
    // COURTESY_QUERY
    COURTESY_QUERY: 7,
    COURTESY_QUERY_COMPLETE: 8,
    // COURTESEY
    COURTESY: 9,
    COURTESY_COMPLETE: 10,
    // LOOP - main game logic loop (remove tile from wall, discard from hand, query discard)
    LOOP_PICK_FROM_WALL: 11,
    LOOP_CHOOSE_DISCARD: 12,
    LOOP_QUERY_CLAIM_DISCARD: 13,
    LOOP_QUERY_CLAIM_DISCARD_COMPLETE: 14,
    LOOP_EXPOSE_TILES: 15,
    LOOP_EXPOSE_TILES_COMPLETE: 16,
    // END - end game (mahjong, wall game, quit, cleanup)
    END: 17
};

export const PLAYER_OPTION = {
    EXPOSE_TILES: 0,
    DISCARD_TILE: 1,
    MAHJONG: 2
};

// Player
export const PLAYER = {
    BOTTOM: 0,
    RIGHT: 1,
    TOP: 2,
    LEFT: 3
};

// Suit types
export const SUIT = {
    CRACK: 0,
    BAM: 1,
    DOT: 2,
    WIND: 3,
    DRAGON: 4,
    FLOWER: 5,
    JOKER: 6,
    BLANK: 7,
    // Virtual suits used to describe legal hands
    VSUIT1: 8,
    VSUIT2: 9,
    VSUIT3: 10,
    VSUIT1_DRAGON: 11,
    VSUIT2_DRAGON: 12,
    VSUIT3_DRAGON: 13,
    // INVALID - for padding hand to 14 tiles
    INVALID: 99
};;

export const VNUMBER = {
    // 0 - not used
    // 1-9 reserved for normal numbers (crack, bam, dot)
    CONSECUTIVE1: 10,
    CONSECUTIVE2: 11,
    CONSECUTIVE3: 12,
    CONSECUTIVE4: 13,
    CONSECUTIVE5: 14,
    CONSECUTIVE6: 15,
    CONSECUTIVE7: 16,
    // INVALID - for padding hand to 14 tiles
    INVALID: 99
};

// Winds
export const WIND = {
    NORTH: 0,
    SOUTH: 1,
    WEST: 2,
    EAST: 3
};

// Dragons
// Note - dragon ordering matches SUIT ordering.  e.g. red = crack = 0
export const DRAGON = {
    // Crack
    RED: 0,
    // Bamboo
    GREEN: 1,
    // Dot
    WHITE: 2
};


// Animation Timing Configuration (milliseconds)
// These constants control animation speeds throughout the game
export const ANIMATION_TIMINGS = {
    // Dealing phase animations
    TILE_DRAW_DELAY: 100,           // Delay between dealing individual tiles
    TILE_FLY_DURATION: 300,         // Duration of tile flying from wall to hand
    DEALING_COMPLETE_DELAY: 500,    // Pause after dealing finishes

    // Charleston phase animations
    CHARLESTON_PASS: 400,           // Duration of Charleston pass animation
    CHARLESTON_RECEIVE: 400,        // Duration of Charleston receive animation
    CHARLESTON_TRANSITION: 500,     // Delay between Charleston phases

    // Courtesy phase animations
    COURTESY_QUERY_DELAY: 300,      // Delay before courtesy vote query
    COURTESY_REVEAL: 300,           // Duration of courtesy tile reveal

    // Main gameplay animations
    DRAW_ANIMATION: 200,            // Duration of tile draw from wall
    DISCARD_ANIMATION_HUMAN: 300,   // Duration of human player discard
    DISCARD_ANIMATION_AI: 200,      // Duration of AI player discard
    EXPOSURE_ANIMATION: 250,        // Duration of exposure (pung/kong/quint) animation
    CLAIM_POPUP_DELAY: 100,         // Delay before showing claim popup

    // Game end animations
    GAME_END_DELAY: 1000,           // Pause before showing end game results

    // Generic delays (used in GameController sleep() calls)
    TILE_DRAWN_DELAY: 300,          // Delay after tile is drawn (line 876)
    DISCARD_COMPLETE_DELAY: 500     // Delay after discard is complete (line 945)
};

// UI Position Constants (Desktop Phaser coordinates)
// Screen dimensions: 0,0 (top-left) to WINDOW_WIDTH,WINDOW_HEIGHT (bottom-right)
export const UI_POSITIONS = {
    // Tile Y-positions for selection feedback (PLAYER.BOTTOM only)
    TILE_SELECTED_Y: 575,           // Y position when tile is selected (raised)
    TILE_NORMAL_Y: 600,             // Y position when tile is in normal state

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
    SELECTION_RAISE_OFFSET: 25      // How many pixels to raise selected tiles (600 - 575)
};

// Tile Count Helper
export function getTotalTileCount() {
    // Default to 152 if settingsManager is not yet initialized or method doesn't exist
    if (!window.settingsManager || typeof window.settingsManager.getUseBlankTiles !== "function") {
        return 152;
    }
    return window.settingsManager.getUseBlankTiles() ? 160 : 152;
}

