/**
 * TileManager - Manages all tile sprites on the game board
 *
 * Responsibilities:
 * - Create/destroy tile sprites
 * - Track and update tile positions for all players
 * - Handle tile layout for all 4 positions (bottom, right, top, left)
 * - Manage tile selection/deselection
 * - Sync sprite visual state with game state
 * - Support hand reordering and interactions
 */

import {PLAYER, SPRITE_WIDTH, SPRITE_SCALE, TILE_GAP, WINDOW_WIDTH, WINDOW_HEIGHT} from "../../constants.js";
import {animateTileSelect, animateTileDeselect} from "../animations/AnimationLibrary.js";

export class TileManager {
    /**
     * @param {GameScene} scene - Phaser scene
     * @param {Table} table - Game table with players and tiles
     */
    constructor(scene, table) {
        this.scene = scene;
        this.table = table;

        /**
         * Map of tile index → Phaser sprite
         * Key: tile.index (0-151)
         * Value: Phaser sprite
         */
        this.tileSprites = new Map();

        /**
         * Track selected tiles for Charleston, courtesy, or discard selection
         * @type {Set<number>} Set of tile indices
         */
        this.selectedTiles = new Set();

        /**
         * Callback when tile is selected
         * @type {Function|null}
         */
        this.onTileSelected = null;

        /**
         * Callback when tile is deselected
         * @type {Function|null}
         */
        this.onTileDeselected = null;

        /**
         * Track which players have drag enabled
         * @type {Set<number>}
         */
        this.dragEnabledPlayers = new Set();
    }

    /**
     * Get hand layout positions for a player
     * Returns starting position and spacing for tiles
     *
     * @param {number} playerIndex - Player position (0=bottom, 1=right, 2=top, 3=left)
     * @param {number} tileCount - Number of tiles in hand
     * @returns {Object} {startX, startY, spacing, direction}
     */
    getHandLayout(playerIndex, tileCount = 14) {
        const TILE_WIDTH = SPRITE_WIDTH * SPRITE_SCALE;
        const spacing = TILE_WIDTH + TILE_GAP;

        switch (playerIndex) {
            case PLAYER.BOTTOM:
                // Bottom player: tiles spread horizontally
                return {
                    startX: (WINDOW_WIDTH - (tileCount * spacing)) / 2,
                    startY: WINDOW_HEIGHT - 80,
                    spacing,
                    direction: "horizontal"
                };

            case PLAYER.RIGHT:
                // Right player: tiles spread vertically downward
                return {
                    startX: WINDOW_WIDTH - 60,
                    startY: (WINDOW_HEIGHT - (tileCount * spacing)) / 2,
                    spacing,
                    direction: "vertical"
                };

            case PLAYER.TOP:
                // Top player: tiles spread horizontally (reversed)
                return {
                    startX: (WINDOW_WIDTH + (tileCount * spacing)) / 2,
                    startY: 60,
                    spacing,
                    direction: "horizontal-reverse"
                };

            case PLAYER.LEFT:
                // Left player: tiles spread vertically upward
                return {
                    startX: 40,
                    startY: (WINDOW_HEIGHT + (tileCount * spacing)) / 2,
                    spacing,
                    direction: "vertical-reverse"
                };

            default:
                throw new Error(`Invalid player index: ${playerIndex}`);
        }
    }

    /**
     * Get screen position for a tile in a player's hand
     *
     * @param {number} playerIndex - Player position
     * @param {number} tileIndex - Index within hand (0-13)
     * @param {number} totalTiles - Total tiles in hand
     * @returns {{x: number, y: number}}
     */
    getTileScreenPosition(playerIndex, tileIndex, totalTiles = 14) {
        const layout = this.getHandLayout(playerIndex, totalTiles);

        switch (layout.direction) {
            case "horizontal":
                return {
                    x: layout.startX + (tileIndex * layout.spacing),
                    y: layout.startY
                };

            case "horizontal-reverse":
                return {
                    x: layout.startX - (tileIndex * layout.spacing),
                    y: layout.startY
                };

            case "vertical":
                return {
                    x: layout.startX,
                    y: layout.startY + (tileIndex * layout.spacing)
                };

            case "vertical-reverse":
                return {
                    x: layout.startX,
                    y: layout.startY - (tileIndex * layout.spacing)
                };

            default:
                return {x: 0, y: 0};
        }
    }

    /**
     * Get exposure area position for a player
     * (Where claimed/exposed tiles are displayed)
     *
     * @param {number} playerIndex - Player position
     * @returns {{x: number, y: number, direction: string}}
     */
    getExposurePosition(playerIndex) {
        switch (playerIndex) {
            case PLAYER.BOTTOM:
                return {x: WINDOW_WIDTH - 150, y: WINDOW_HEIGHT - 200, direction: "horizontal"};
            case PLAYER.RIGHT:
                return {x: WINDOW_WIDTH - 150, y: 100, direction: "vertical"};
            case PLAYER.TOP:
                return {x: 150, y: 60, direction: "horizontal"};
            case PLAYER.LEFT:
                return {x: 40, y: WINDOW_HEIGHT - 150, direction: "vertical"};
            default:
                return {x: 0, y: 0};
        }
    }

    /**
     * Create or get a tile sprite
     *
     * @param {TileData} tileData - Tile data object
     * @returns {Phaser.Physics.Arcade.Sprite} Phaser sprite
     * @throws {Error} If sprite does not exist and cannot be created
     */
    createTileSprite(tileData) {
        // Check if already exists
        if (this.tileSprites.has(tileData.index)) {
            return this.tileSprites.get(tileData.index);
        }

        // TODO: Implement actual sprite creation from table.wall
        // Currently, sprites must be pre-registered via registerTileSprite()
        // See: https://github.com/anthropics/mahjong/issues/XXX
        throw new Error(
            `Sprite creation not implemented. Tile index ${tileData.index} ` +
            `(suit: ${tileData.suit}, number: ${tileData.number}) ` +
            `not found in sprite registry. Ensure registerTileSprite() ` +
            `is called during initialization.`
        );
    }

    /**
     * Register an existing tile sprite (from table.wall)
     *
     * @param {TileData} tileData - Tile data
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Phaser sprite
     */
    registerTileSprite(tileData, sprite) {
        if (sprite) {
            this.tileSprites.set(tileData.index, sprite);
        }
    }

    /**
     * Destroy a tile sprite
     *
     * @param {TileData} tileData - Tile data
     */
    destroyTileSprite(tileData) {
        const sprite = this.tileSprites.get(tileData.index);
        if (sprite) {
            sprite.destroy();
            this.tileSprites.delete(tileData.index);
        }
    }

    /**
     * Get sprite for a tile
     *
     * @param {TileData|number} tileData - Tile data or index
     * @returns {Phaser.Physics.Arcade.Sprite|null}
     */
    getTileSprite(tileData) {
        const index = typeof tileData === "number" ? tileData : tileData.index;
        return this.tileSprites.get(index) || null;
    }

    /**
     * Update hand display for a player
     * Positions all tiles in the hand according to layout
     *
     * @param {number} playerIndex - Player position
     * @param {Tile[]} hand - Array of tile sprites
     */
    updateHandDisplay(playerIndex, hand) {
        if (!hand || hand.length === 0) return;

        const totalTiles = hand.length;

        hand.forEach((tile, index) => {
            if (tile) {
                const pos = this.getTileScreenPosition(playerIndex, index, totalTiles);
                tile.setPosition(pos.x, pos.y);
                tile.setDepth(index);  // Tiles closer to right/front have higher depth
            }
        });
    }

    /**
     * Update exposures display for a player
     * Shows exposed tiles (Pung, Kong, Quint) in proper formation
     *
     * @param {number} playerIndex - Player position
     * @param {TileSet[]} exposures - Array of exposure groups
     */
    updateExposuresDisplay(playerIndex, exposures) {
        if (!exposures || exposures.length === 0) return;

        const expPos = this.getExposurePosition(playerIndex);
        let currentX = expPos.x;
        let currentY = expPos.y;
        const spacing = (SPRITE_WIDTH * SPRITE_SCALE) + TILE_GAP;

        exposures.forEach((tileSet) => {
            if (tileSet && tileSet.tiles && tileSet.tiles.length > 0) {
                // Position tiles in the exposure group
                tileSet.tiles.forEach((tile, index) => {
                    if (tile) {
                        let x = currentX;
                        let y = currentY;

                        if (expPos.direction === "horizontal") {
                            x = currentX + (index * spacing);
                        } else {
                            y = currentY + (index * spacing);
                        }

                        tile.setPosition(x, y);
                        tile.setDepth(1000 + index);  // Exposures have higher depth
                    }
                });

                // Move to next group
                if (expPos.direction === "horizontal") {
                    currentX += (tileSet.tiles.length * spacing) + 20;
                } else {
                    currentY += (tileSet.tiles.length * spacing) + 20;
                }
            }
        });
    }

    /**
     * Select a tile (called when player clicks a tile)
     * Raises tile up visually and tracks selection
     *
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
     * @returns {Promise}
     */
    selectTile(sprite) {
        if (!sprite) return Promise.resolve();

        const index = this.findTileIndexBySprite(sprite);
        if (index === null || this.selectedTiles.has(index)) {
            return Promise.resolve();  // Already selected
        }

        this.selectedTiles.add(index);

        // Raise tile up
        const currentY = sprite.y;
        const raisedY = currentY - 30;

        return animateTileSelect(sprite, {y: raisedY}, 150, () => {
            if (this.onTileSelected) {
                this.onTileSelected(sprite, index);
            }
        });
    }

    /**
     * Deselect a tile
     *
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
     * @returns {Promise}
     */
    deselectTile(sprite) {
        if (!sprite) return Promise.resolve();

        const index = this.findTileIndexBySprite(sprite);
        if (index === null || !this.selectedTiles.has(index)) {
            return Promise.resolve();  // Not selected
        }

        this.selectedTiles.delete(index);

        // Lower tile back down
        const raisedY = sprite.y;
        const normalY = raisedY + 30;

        return animateTileDeselect(sprite, {y: normalY}, 150, () => {
            if (this.onTileDeselected) {
                this.onTileDeselected(sprite, index);
            }
        });
    }

    /**
     * Check if a tile is selected
     *
     * @param {Phaser.Physics.Arcade.Sprite|number} tileData - Sprite or index
     * @returns {boolean}
     */
    isSelectedTile(tileData) {
        let index;
        if (typeof tileData === "number") {
            index = tileData;
        } else {
            index = this.findTileIndexBySprite(tileData);
        }
        return index !== null && this.selectedTiles.has(index);
    }

    /**
     * Get array of selected tiles
     *
     * @returns {Phaser.Physics.Arcade.Sprite[]}
     */
    getSelectedTiles() {
        const tiles = [];
        this.selectedTiles.forEach((index) => {
            const sprite = this.tileSprites.get(index);
            if (sprite) {
                tiles.push(sprite);
            }
        });
        return tiles;
    }

    /**
     * Get selected tile indices
     *
     * @returns {number[]}
     */
    getSelectedTileIndices() {
        return Array.from(this.selectedTiles);
    }

    /**
     * Clear all selections
     *
     * @returns {Promise} Resolves when all animations complete
     */
    async resetSelection() {
        const promises = [];
        const selectedTiles = this.getSelectedTiles();

        for (const sprite of selectedTiles) {
            promises.push(this.deselectTile(sprite));
        }

        await Promise.all(promises);
        this.selectedTiles.clear();
    }

    /**
     * Find tile index by sprite
     * Searches through tileSprites map to find index
     *
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Sprite to find
     * @returns {number|null} Tile index or null
     */
    findTileIndexBySprite(sprite) {
        for (const [index, spr] of this.tileSprites) {
            if (spr === sprite) {
                return index;
            }
        }
        return null;
    }

    /**
     * Enable drag for a player's hand
     * Allows reordering tiles by dragging
     *
     * @param {number} playerIndex - Player to enable drag for
     */
    enableTileDragForPlayer(playerIndex) {
        this.dragEnabledPlayers.add(playerIndex);
        // TODO: Set up drag event handlers for this player's tiles
    }

    /**
     * Disable drag for a player's hand
     *
     * @param {number} playerIndex - Player to disable drag for
     */
    disableTileDragForPlayer(playerIndex) {
        this.dragEnabledPlayers.delete(playerIndex);
        // TODO: Remove drag event handlers
    }

    /**
     * Reorder tiles in a hand visually
     * Called when hand is sorted by suit/rank
     *
     * @param {number} playerIndex - Player position
     * @param {Tile[]} newHandOrder - New order of tiles
     * @returns {Promise}
     */
    sortTiles(playerIndex, newHandOrder) {
        return new Promise((resolve) => {
            this.updateHandDisplay(playerIndex, newHandOrder);

            // Animate tiles to new positions
            const duration = 300;
            const promises = [];

            newHandOrder.forEach((tile, index) => {
                if (tile) {
                    const pos = this.getTileScreenPosition(playerIndex, index, newHandOrder.length);
                    const promise = new Promise((res) => {
                        this.scene.tweens.add({
                            targets: tile,
                            x: pos.x,
                            y: pos.y,
                            duration,
                            ease: "Quad.easeOut",
                            onComplete: res
                        });
                    });
                    promises.push(promise);
                }
            });

            Promise.all(promises).then(resolve);
        });
    }

    /**
     * Highlight a tile (for hints or focus)
     *
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Sprite to highlight
     * @param {number} color - Color to highlight with
     */
    highlightTile(sprite, color = 0xffff00) {
        if (sprite) {
            sprite.setTint(color);
        }
    }

    /**
     * Remove highlight from a tile
     *
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Sprite to unhighlight
     */
    unhighlightTile(sprite) {
        if (sprite) {
            sprite.clearTint();
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        this.tileSprites.forEach((sprite) => {
            sprite.clearTint();
        });
    }

    /**
     * Get tile at specific hand position for a player
     *
     * @param {number} playerIndex - Player position
     * @param {number} handIndex - Index in hand (0-13)
     * @returns {Phaser.Physics.Arcade.Sprite|null}
     */
    getTileAtHandPosition(playerIndex, handIndex) {
        if (!this.table || !this.table.players) return null;

        const player = this.table.players[playerIndex];
        if (!player || !player.hand || !player.hand.tiles) return null;

        const tile = player.hand.tiles[handIndex];
        return tile ? this.getTileSprite(tile) : null;
    }

    /**
     * Disable interaction with all tiles temporarily
     * Used during animations or dialogs
     */
    disableAllInteraction() {
        this.dragEnabledPlayers.clear();
        this.tileSprites.forEach((sprite) => {
            if (sprite.setInteractive) {
                sprite.disableInteractive();
            }
        });
    }

    /**
     * Re-enable interaction with tiles
     */
    enableAllInteraction() {
        // Re-enable as needed based on game state
    }
}
