
export class TileSprites {
    constructor() {
        // Map tile keys to sprite indices (0-38)
        // Layout based on tiles.json: 39 tiles in a single row
        this.tileIndices = new Map();
        this.initMapping();
    }

    initMapping() {
        let index = 0;

        // Ranks 1-9 for BAM, CRACK, DOT (Interleaved: 1B, 1C, 1D, 2B, 2C, 2D...)
        for (let num = 1; num <= 9; num++) {
            this.tileIndices.set(`BAM-${num}`, index++);
            this.tileIndices.set(`CRACK-${num}`, index++);
            this.tileIndices.set(`DOT-${num}`, index++);
        }

        // Dragons: DB, DC, DD
        // DB = Green?, DC = Red?, DD = White?
        // Based on tileDefinitions: DC=Red, DB=Green, DD=White
        // But JSON filenames are DB, DC, DD.
        // Let's assume standard order or just map by filename suffix
        // DB -> Green, DC -> Red, DD -> White
        this.tileIndices.set("DRAGON-1", index++); // Green (DB) - Check mapping
        this.tileIndices.set("DRAGON-0", index++); // Red (DC)
        this.tileIndices.set("DRAGON-2", index++); // White (DD)

        // Wait, let's verify Dragon mapping from JSON filenames vs typical IDs
        // JSON: DB, DC, DD.
        // tileDefinitions: Red=0, Green=1, White=2.
        // If DB=Green, DC=Red, DD=White.
        // Then index 27=Green, 28=Red, 29=White.

        // Winds: E, N, S, W
        // JSON order after Dragons: E (30), F1-F4, J, N (36), S (37), W (38)
        this.tileIndices.set("WIND-3", 30); // East

        // Flowers (Handle 0-7, mapping to F1-F4 repeated)
        // F1 (31), F2 (32), F3 (33), F4 (34)
        for (let i = 0; i < 8; i++) {
            // Map 0->F1, 1->F2, 2->F3, 3->F4, 4->F1, etc.
            const spriteOffset = i % 4;
            this.tileIndices.set(`FLOWER-${i}`, 31 + spriteOffset);
            // Also keep 1-based just in case (FLOWER-1 to FLOWER-8)
            this.tileIndices.set(`FLOWER-${i + 1}`, 31 + spriteOffset);
        }

        // Joker (Handle 0-7, all map to J)
        for (let i = 0; i < 8; i++) {
            this.tileIndices.set(`JOKER-${i}`, 35);
        }

        // Remaining Winds
        this.tileIndices.set("WIND-0", 36); // North
        this.tileIndices.set("WIND-1", 37); // South
        this.tileIndices.set("WIND-2", 38); // West

        // BLANK tiles (house rule - swap with discard pile)
        // These should display the back of the tile
        // Map all BLANK tiles to a special marker
        for (let i = 0; i < 8; i++) {
            this.tileIndices.set(`BLANK-${i}`, -1); // Special marker for back tile
        }
    }

    getSpritePosition(tile) {
        const key = this.getTileKey(tile);
        const index = this.tileIndices.get(key);

        if (index === undefined) {
            console.warn("No sprite index found for tile:", tile, key);
            return { xPct: 0, yPct: 0 };
        }

        // Calculate percentage position
        // Total tiles = 39. Range 0% to 100%.
        // Position = (index / (total - 1)) * 100
        const xPct = (index / 38) * 100;
        return { xPct, yPct: 0 };
    }

    getTileKey(tile) {
        if (!tile) return "unknown";

        // Normalize suit/type
        let suit = tile.suit;
        const number = tile.number;

        // Handle numeric suits
        if (suit === 0 || suit === "CRACK") suit = "CRACK";
        if (suit === 1 || suit === "BAM") suit = "BAM";
        if (suit === 2 || suit === "DOT") suit = "DOT";
        if (suit === 3 || suit === "WIND") suit = "WIND";
        if (suit === 4 || suit === "DRAGON") suit = "DRAGON";
        if (suit === 5 || suit === "FLOWER") suit = "FLOWER";
        if (suit === 6 || suit === "JOKER") suit = "JOKER";
        if (suit === 7 || suit === "BLANK") suit = "BLANK";

        return `${suit}-${number}`;
    }

    createTileElement(tile, size = "normal") {
        const div = document.createElement("div");
        div.className = `tile tile--${size}`;

        const key = this.getTileKey(tile);
        const index = this.tileIndices.get(key);

        // Handle BLANK tiles specially - show the back of the tile
        if (index === -1) {
            div.style.backgroundImage = "url('/mahjong/assets/back.png')";
            div.style.backgroundPosition = "center";
            div.style.backgroundSize = "contain";
        } else if (index === undefined) {
            console.error("createTileElement: No sprite index for tile", tile, "key:", key);
            // Show tile back as fallback
            div.style.backgroundImage = "url('/mahjong/assets/back.png')";
            div.style.backgroundPosition = "center";
            div.style.backgroundSize = "contain";
        } else {
            const pos = this.getSpritePosition(tile);
            // Use CSS class for background image to avoid 404s with absolute paths
            // Only set position here
            div.style.backgroundPosition = `${pos.xPct}% ${pos.yPct}%`;
        }

        div.dataset.tileId = key;
        return div;
    }
}

// Export singleton instance
export const tileSprites = new TileSprites();
