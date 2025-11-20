/**
 * HandData - Plain data representation of a player's hand
 * Contains hidden tiles and exposed tile sets
 * NO Phaser dependencies
 */

import {TileData} from "./TileData.js";

export class HandData {
    constructor() {
        /** @type {TileData[]} Hidden tiles in hand */
        this.tiles = [];

        /** @type {ExposureData[]} Exposed tile sets (Pung, Kong, Quint) */
        this.exposures = [];
    }

    /**
     * Compatibility getter for old Card code that expects exposedTileSetArray
     * @returns {ExposureData[]}
     */
    get exposedTileSetArray() {
        return this.exposures;
    }

    /**
     * Get total number of tiles (hidden + exposed)
     * @returns {number}
     */
    getLength() {
        const exposedCount = this.exposures.reduce((sum, exp) => sum + exp.tiles.length, 0);
        return this.tiles.length + exposedCount;
    }

    /**
     * Get number of hidden tiles
     * @returns {number}
     */
    getHiddenCount() {
        return this.tiles.length;
    }

    /**
     * Compatibility helper for legacy Card/AI code that expects Phaser Hand API
     * @returns {TileData[]}
     */
    getHiddenTileArray() {
        return this.tiles;
    }

    /**
     * Get all tiles (hidden tiles only for card validation)
     * The Card class uses this to validate hands.
     * Hidden tiles are what count for validation.
     * @returns {TileData[]}
     */
    getTileArray() {
        return this.tiles;
    }

    /**
     * Add a hidden tile to hand
     * @param {TileData} tile
     */
    addTile(tile) {
        this.tiles.push(tile);
    }

    /**
     * Remove a hidden tile from hand
     * @param {TileData} tile - Tile to remove
     * @returns {boolean} True if tile was found and removed
     */
    removeTile(tile) {
        const index = this.tiles.findIndex(t => t.isSameTile(tile));
        if (index !== -1) {
            this.tiles.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Add an exposed set to hand
     * @param {ExposureData} exposure
     */
    addExposure(exposure) {
        this.exposures.push(exposure);
    }

    /**
     * Check if hand contains a specific tile
     * @param {TileData} tile
     * @returns {boolean}
     */
    hasTile(tile) {
        return this.tiles.some(t => t.equals(tile));
    }

    /**
     * Check if all tiles are hidden (no exposures)
     * Compatibility method for Card validation code
     * @returns {boolean}
     */
    isAllHidden() {
        return this.exposures.length === 0;
    }

    /**
     * Count how many of a specific tile are in hand
     * @param {number} suit
     * @param {number} number
     * @returns {number}
     */
    countTile(suit, number) {
        return this.tiles.filter(t => t.suit === suit && t.number === number).length;
    }

    /**
     * Sort tiles by suit
     */
    sortBySuit() {
        this.tiles.sort((a, b) => {
            if (a.suit !== b.suit) {
                return a.suit - b.suit;
            }
            return a.number - b.number;
        });
    }

    /**
     * Sort tiles by rank/number
     */
    sortByRank() {
        this.tiles.sort((a, b) => {
            if (a.number !== b.number) {
                return a.number - b.number;
            }
            return a.suit - b.suit;
        });
    }

    /**
     * Clear all tiles and exposures from hand
     */
    clear() {
        this.tiles = [];
        this.exposures = [];
    }

    /**
     * Create a deep copy of this hand
     * @returns {HandData}
     */
    clone() {
        const copy = new HandData();
        copy.tiles = this.tiles.map(t => t.clone());
        copy.exposures = this.exposures.map(e => e.clone());
        return copy;
    }

    /**
     * Create HandData from Phaser Hand object (migration helper)
     * @param {Hand} phaserHand - Existing Phaser hand
     * @returns {HandData}
     */
    static fromPhaserHand(phaserHand) {
        const handData = new HandData();

        // Convert hidden tiles
        const hiddenTiles = phaserHand.getHiddenTileArray();
        handData.tiles = hiddenTiles.map(tile => TileData.fromPhaserTile(tile));

        // Convert exposed tile sets
        phaserHand.exposedTileSetArray.forEach(tileSet => {
            const exposure = new ExposureData();
            exposure.type = determineExposureType(tileSet.tileArray.length);
            exposure.tiles = tileSet.tileArray.map(tile => TileData.fromPhaserTile(tile));
            handData.exposures.push(exposure);
        });

        return handData;
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            tiles: this.tiles.map(t => t.toJSON()),
            exposures: this.exposures.map(e => e.toJSON())
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} json
     * @returns {HandData}
     */
    static fromJSON(json) {
        const hand = new HandData();
        hand.tiles = json.tiles.map(t => TileData.fromJSON(t));
        hand.exposures = json.exposures.map(e => ExposureData.fromJSON(e));
        return hand;
    }
}

/**
 * ExposureData - Represents an exposed tile set (Pung, Kong, Quint)
 */
export class ExposureData {
    constructor(data = {}) {
        /** @type {string} Type: 'PUNG', 'KONG', 'QUINT' */
        this.type = data.type || "";

        /** @type {TileData[]} Tiles in this exposure */
        this.tiles = data.tiles || [];
    }

    /**
     * Create a deep copy
     * @returns {ExposureData}
     */
    clone() {
        const copy = new ExposureData();
        copy.type = this.type;
        copy.tiles = this.tiles.map(t => t.clone());
        return copy;
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            type: this.type,
            tiles: this.tiles.map(t => t.toJSON())
        };
    }

    /**
     * Compatibility getter to mimic Phaser TileSet API (tileSet.tileArray)
     * @returns {TileData[]}
     */
    get tileArray() {
        return this.tiles;
    }

    /**
     * Legacy helper matching TileSet.getTileArray()
     * @returns {TileData[]}
     */
    getTileArray() {
        return this.tiles;
    }

    /**
     * Legacy helper matching TileSet.getLength()
     * @returns {number}
     */
    getLength() {
        return this.tiles.length;
    }

    /**
     * Deserialize from JSON
     * @param {Object} json
     * @returns {ExposureData}
     */
    static fromJSON(json) {
        const exposure = new ExposureData();
        exposure.type = json.type;
        exposure.tiles = json.tiles.map(t => TileData.fromJSON(t));
        return exposure;
    }
}

/**
 * Helper to determine exposure type from tile count
 * @param {number} count
 * @returns {string}
 */
function determineExposureType(count) {
    if (count === 3) {
        return "PUNG";
    }
    if (count === 4) {
        return "KONG";
    }
    if (count === 5) {
        return "QUINT";
    }
    return "UNKNOWN";
}
