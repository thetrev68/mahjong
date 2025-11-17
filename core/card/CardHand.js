/**
 * CardHand - Minimal Hand implementation for card validator only
 *
 * This is NOT the main game Hand class. This is a stripped-down version
 * used exclusively by the card validation engine (card.js) to generate
 * and validate tile combinations.
 *
 * DO NOT use this class in game logic or UI code.
 */

/**
 * Minimal TileSet for card validator
 */
class CardTileSet {
    constructor() {
        this.tileArray = [];
    }

    insert(tile) {
        this.tileArray.push(tile);
    }

    getLength() {
        return this.tileArray.length;
    }

    getTileArray() {
        return [...this.tileArray];
    }
}

/**
 * Minimal Hand for card validator
 * Supports only the methods needed by card.js and test files
 */
export class CardHand {
    constructor() {
        this.hiddenTileSet = new CardTileSet();
        this.exposedTileSetArray = [];
        this.even = false;  // Used by generateHand() for pattern matching
    }

    insertHidden(tile) {
        this.hiddenTileSet.insert(tile);
    }

    getHiddenTileArray() {
        return this.hiddenTileSet.getTileArray();
    }

    getLength() {
        return this.hiddenTileSet.getLength() +
               this.exposedTileSetArray.reduce((sum, ts) => sum + ts.getLength(), 0);
    }

    getTileArray() {
        const allTiles = [];
        allTiles.push(...this.getHiddenTileArray());
        for (const tileSet of this.exposedTileSetArray) {
            allTiles.push(...tileSet.getTileArray());
        }
        return allTiles;
    }
}
