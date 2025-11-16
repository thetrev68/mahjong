/**
 * Tile definitions for text rendering
 * Pure data, no Phaser dependencies
 * Extracted from gameObjects.js for use by core models
 */

import {SUIT} from "../constants.js";

export const gTileGroups = [
    {
        suit: SUIT.CRACK,
        textArray: ["Crack"],
        prefix: ["C"],
        maxNum: 9,
        count: 4
    },
    {
        suit: SUIT.BAM,
        textArray: ["Bam"],
        prefix: ["B"],
        maxNum: 9,
        count: 4
    },
    {
        suit: SUIT.DOT,
        textArray: ["Dot"],
        prefix: ["D"],
        maxNum: 9,
        count: 4
    },
    {
        suit: SUIT.WIND,
        textArray: ["North", "South", "West", "East"],
        prefix: ["N", "S", "W", "E"],
        maxNum: 1,
        count: 4
    },
    {
        suit: SUIT.DRAGON,
        textArray: ["Red dragon", "Green dragon", "White dragon"],
        prefix: ["DC", "DB", "DD"],
        maxNum: 1,
        count: 4
    },
    {
        suit: SUIT.FLOWER,
        textArray: ["Flower"],
        prefix: ["F1", "F2", "F3", "F4", "F1", "F2", "F3", "F4"],
        maxNum: 1,
        count: 1
    },
    {
        suit: SUIT.JOKER,
        textArray: ["Joker"],
        prefix: ["J"],
        maxNum: 1,
        count: 8
    },
    {
        suit: SUIT.BLANK,
        textArray: ["Blank"],
        prefix: ["BLANK"],
        maxNum: 1,
        count: 8
    }
];
