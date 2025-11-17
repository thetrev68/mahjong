/**
 * Player layout configuration for rendering
 * Defines positioning and display properties for all 4 player positions
 */

import {
    PLAYER,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
    SPRITE_HEIGHT,
    SPRITE_SCALE
} from "../../constants.js";

/**
 * Player layout information for each position
 * Used by HandRenderer for tile positioning and rotation
 */
export const PLAYER_LAYOUT = [
    // Player 0 (human, bottom of screen)
    {
        id: PLAYER.BOTTOM,
        x: 200,
        y: 600,
        angle: 0,
        rectX: 0,
        rectY: 600 - (SPRITE_HEIGHT / 2),
        rectWidth: WINDOW_WIDTH,
        rectHeight: SPRITE_HEIGHT
    },
    // Player 1 (computer, right)
    {
        id: PLAYER.RIGHT,
        x: 1000,
        y: 520,
        angle: 270,
        rectX: 1000 - (SPRITE_HEIGHT * SPRITE_SCALE / 2),
        rectY: 0,
        rectWidth: SPRITE_HEIGHT * SPRITE_SCALE,
        rectHeight: WINDOW_HEIGHT
    },
    // Player 2 (computer, top)
    {
        id: PLAYER.TOP,
        x: 750,
        y: 50,
        angle: 180,
        rectX: 0,
        rectY: 50 - (SPRITE_HEIGHT * SPRITE_SCALE / 2),
        rectWidth: WINDOW_WIDTH,
        rectHeight: SPRITE_HEIGHT * SPRITE_SCALE
    },
    // Player 3 (computer, left)
    {
        id: PLAYER.LEFT,
        x: 50,
        y: 50,
        angle: 90,
        rectX: 50 - (SPRITE_HEIGHT * SPRITE_SCALE / 2),
        rectY: 0,
        rectWidth: SPRITE_HEIGHT * SPRITE_SCALE,
        rectHeight: WINDOW_HEIGHT
    }
];
