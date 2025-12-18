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

import {
  PLAYER,
  SUIT,
  SPRITE_WIDTH,
  SPRITE_SCALE,
  TILE_GAP,
  WINDOW_WIDTH,
  WINDOW_HEIGHT,
} from "../../constants.js";
import { Tile } from "../gameObjects/PhaserTileSprites.js";

export class TileManager {
  /**
   * @param {GameScene} scene - Phaser scene
   * @param {Object} wall - Wall object with tileArray
   * @param {Object} discards - Discard pile object
   */
  constructor(scene, wall, discards) {
    this.scene = scene;
    // Phase 5: Store direct dependencies instead of entire table
    this.wall = wall;
    this.discards = discards;

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
   * Register all existing tiles from the wall
   * Phase 5: Simplified to only register wall tiles - hands are managed via HandRenderer
   */
  initializeFromWall() {
    this.tileSprites.clear();

    const registerTile = (tile) => {
      if (tile && typeof tile.index === "number") {
        this.tileSprites.set(tile.index, tile);
      }
    };

    if (this.wall?.tileArray) {
      this.wall.tileArray.forEach(registerTile);
    }
  }

  /**
   * Ensure a Phaser tile exists for the provided TileData
   * @param {TileData|Object} tileData
   * @returns {Tile|null}
   */
  getOrCreateTile(tileData) {
    if (!tileData || typeof tileData.index !== "number") {
      return null;
    }

    if (this.tileSprites.has(tileData.index)) {
      return this.tileSprites.get(tileData.index);
    }

    const wallTile = this.findTileInWall(tileData.index);
    if (wallTile) {
      this.tileSprites.set(tileData.index, wallTile);
      return wallTile;
    }

    // Create a brand new tile (fallback during migration)
    const spriteName = this.getTileSpriteName(tileData);
    const tile = new Tile(
      this.scene,
      tileData.suit,
      tileData.number,
      spriteName,
    );
    tile.index = tileData.index;
    tile.create();
    this.tileSprites.set(tile.index, tile);
    return tile;
  }

  /**
   * Remove tile from wall registry if still present
   * @param {number} tileIndex
   */
  removeTileFromWall(tileIndex) {
    if (!this.wall?.tileArray) {
      return;
    }
    const wallTiles = this.wall.tileArray;
    const idx = wallTiles.findIndex((tile) => tile.index === tileIndex);
    if (idx >= 0) {
      wallTiles.splice(idx, 1);
    }
  }

  /**
   * Add a tile to the shared discard pile and refresh layout
   * @param {Tile} tile
   */
  addTileToDiscardPile(tile) {
    if (!tile || !this.discards) {
      return null;
    }
    this.discards.insertDiscard(tile);
    const lastIndex = this.discards.tileArray.length - 1;
    this.discards.layoutTiles(tile);
    const { x, y, scale } = this.discards.getTilePosition(lastIndex);
    tile.scale = scale;
    tile.angle = 0;
    tile.showTile(true, true);
    tile.sprite.depth = 50;
    tile.spriteBack.depth = 50;
    const tween = tile.animate(x, y, 0);
    if (tween && this.scene?.audioManager) {
      tween.once("complete", () => {
        this.scene.audioManager.playSFX("tile_dropping");
      });
    }
    return tween;
  }

  /**
   * Get a tile sprite currently tracked by the manager
   * @param {number|TileData} tileRef
   * @returns {Tile|null}
   */
  getTileSprite(tileRef) {
    const index = typeof tileRef === "number" ? tileRef : tileRef?.index;
    if (typeof index !== "number") {
      return null;
    }
    return this.tileSprites.get(index) || null;
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
          startX: (WINDOW_WIDTH - tileCount * spacing) / 2,
          startY: WINDOW_HEIGHT - 80,
          spacing,
          direction: "horizontal",
        };

      case PLAYER.RIGHT:
        // Right player: tiles spread vertically downward
        return {
          startX: WINDOW_WIDTH - 60,
          startY: (WINDOW_HEIGHT - tileCount * spacing) / 2,
          spacing,
          direction: "vertical",
        };

      case PLAYER.TOP:
        // Top player: tiles spread horizontally (reversed)
        return {
          startX: (WINDOW_WIDTH + tileCount * spacing) / 2,
          startY: 60,
          spacing,
          direction: "horizontal-reverse",
        };

      case PLAYER.LEFT:
        // Left player: tiles spread vertically upward
        return {
          startX: 40,
          startY: (WINDOW_HEIGHT + tileCount * spacing) / 2,
          spacing,
          direction: "vertical-reverse",
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
          x: layout.startX + tileIndex * layout.spacing,
          y: layout.startY,
        };

      case "horizontal-reverse":
        return {
          x: layout.startX - tileIndex * layout.spacing,
          y: layout.startY,
        };

      case "vertical":
        return {
          x: layout.startX,
          y: layout.startY + tileIndex * layout.spacing,
        };

      case "vertical-reverse":
        return {
          x: layout.startX,
          y: layout.startY - tileIndex * layout.spacing,
        };

      default:
        return { x: 0, y: 0 };
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
        return {
          x: WINDOW_WIDTH - 150,
          y: WINDOW_HEIGHT - 200,
          direction: "horizontal",
        };
      case PLAYER.RIGHT:
        return { x: WINDOW_WIDTH - 150, y: 100, direction: "vertical" };
      case PLAYER.TOP:
        return { x: 150, y: 60, direction: "horizontal" };
      case PLAYER.LEFT:
        return { x: 40, y: WINDOW_HEIGHT - 150, direction: "vertical" };
      default:
        return { x: 0, y: 0 };
    }
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
   * Convert TileData objects to Phaser Tile instances
   * @param {Array<Object>} tileDatas
   * @returns {Tile[]}
   */
  convertTileDataArray(tileDatas = []) {
    return tileDatas.map((data) => this.getOrCreateTile(data)).filter(Boolean);
  }

  /**
   * Find a tile still residing in the wall
   * @param {number} index
   * @returns {Tile|null}
   */
  findTileInWall(index) {
    if (!this.wall?.tileArray) {
      return null;
    }
    return this.wall.tileArray.find((tile) => tile.index === index) || null;
  }

  /**
   * Determine sprite name based on tile data (matches wall creation logic)
   * @param {TileData} tileData
   * @returns {string}
   */
  getTileSpriteName(tileData) {
    const { suit, number } = tileData;

    if (suit === SUIT.CRACK) {
      return `${number}C.png`;
    }
    if (suit === SUIT.BAM) {
      return `${number}B.png`;
    }
    if (suit === SUIT.DOT) {
      return `${number}D.png`;
    }
    if (suit === SUIT.WIND) {
      const windNames = ["N", "S", "W", "E"];
      return `${windNames[number] || "N"}.png`;
    }
    if (suit === SUIT.DRAGON) {
      const dragonNames = ["DC", "DB", "DD"];
      return `${dragonNames[number] || "DC"}.png`;
    }
    if (suit === SUIT.FLOWER) {
      const flowerNum = (number % 4) + 1;
      return `F${flowerNum}.png`;
    }
    if (suit === SUIT.JOKER) {
      return "J.png";
    }
    if (suit === SUIT.BLANK) {
      return "BLANK.png";
    }
    return `tile_${suit}_${number}.png`;
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
        tile.setDepth(index); // Tiles closer to right/front have higher depth
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
    const spacing = SPRITE_WIDTH * SPRITE_SCALE + TILE_GAP;

    exposures.forEach((tileSet) => {
      if (tileSet && tileSet.tiles && tileSet.tiles.length > 0) {
        // Position tiles in the exposure group
        tileSet.tiles.forEach((tile, index) => {
          if (tile) {
            let x = currentX;
            let y = currentY;

            if (expPos.direction === "horizontal") {
              x = currentX + index * spacing;
            } else {
              y = currentY + index * spacing;
            }

            tile.setPosition(x, y);
            tile.setDepth(1000 + index); // Exposures have higher depth
          }
        });

        // Move to next group
        if (expPos.direction === "horizontal") {
          currentX += tileSet.tiles.length * spacing + 20;
        } else {
          currentY += tileSet.tiles.length * spacing + 20;
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
      return Promise.resolve(); // Already selected
    }

    this.selectedTiles.add(index);

    // Raise tile up with animation
    const currentY = sprite.y;
    const raisedY = currentY - 30;

    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: sprite,
        y: raisedY,
        duration: 150,
        ease: "Quad.easeOut",
        onComplete: () => {
          if (this.onTileSelected) {
            this.onTileSelected(sprite, index);
          }
          resolve();
        },
      });
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
      return Promise.resolve(); // Not selected
    }

    this.selectedTiles.delete(index);

    // Lower tile back down with animation
    const raisedY = sprite.y;
    const normalY = raisedY + 30;

    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: sprite,
        y: normalY,
        duration: 150,
        ease: "Quad.easeOut",
        onComplete: () => {
          if (this.onTileDeselected) {
            this.onTileDeselected(sprite, index);
          }
          resolve();
        },
      });
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
    // TODO #4: Set up drag event handlers for this player's tiles
  }

  /**
   * Disable drag for a player's hand
   *
   * @param {number} playerIndex - Player to disable drag for
   */
  disableTileDragForPlayer(playerIndex) {
    this.dragEnabledPlayers.delete(playerIndex);
    // TODO #4: Remove drag event handlers
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
          const pos = this.getTileScreenPosition(
            playerIndex,
            index,
            newHandOrder.length,
          );
          const promise = new Promise((res) => {
            this.scene.tweens.add({
              targets: tile,
              x: pos.x,
              y: pos.y,
              duration,
              ease: "Quad.easeOut",
              onComplete: res,
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
