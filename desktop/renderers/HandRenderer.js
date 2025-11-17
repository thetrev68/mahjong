import { PLAYER, SPRITE_WIDTH, SPRITE_HEIGHT, SPRITE_SCALE, TILE_GAP, WINDOW_WIDTH, WINDOW_HEIGHT } from "../../constants.js";
import { debugPrint } from "../../utils.js";
import { PLAYER_LAYOUT } from "../config/playerLayout.js";

/**
 * HandRenderer - Pure rendering layer for player hands
 *
 * ARCHITECTURE:
 * - Owns Phaser sprite arrays for rendering (view state)
 * - Receives HandData from GameController (game state)
 * - Uses TileManager for sprite lookup (sprite registry)
 * - NO dependencies on legacy Player/Hand/Table objects
 *
 * Responsibilities:
 * - Convert HandData → Phaser sprites
 * - Position tiles based on player layout
 * - Handle rotation and scaling per player
 * - Manage rack graphics
 *
 * Does NOT handle:
 * - Game logic (GameController)
 * - Tile selection (SelectionManager)
 * - Sprite creation (TileManager)
 */
export class HandRenderer {
    /**
     * Create a new HandRenderer
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {TileManager} tileManager - Sprite registry
     */
    constructor(scene, tileManager) {
        this.scene = scene;
        this.tileManager = tileManager;

        // HandRenderer owns rendering state for each player
        this.playerHands = [
            { hiddenTiles: [], exposedSets: [], rackGraphics: null },
            { hiddenTiles: [], exposedSets: [], rackGraphics: null },
            { hiddenTiles: [], exposedSets: [], rackGraphics: null },
            { hiddenTiles: [], exposedSets: [], rackGraphics: null }
        ];
    }

    /**
     * Sync Phaser tiles with HandData model, then render
     *
     * This is the authoritative method for updating a player's hand.
     * Converts HandData (game state) into Phaser sprites (view state).
     *
     * @param {number} playerIndex - Player position (0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT)
     * @param {HandData} handData - Hand data model from GameController
     */
    syncAndRender(playerIndex, handData) {
        if (playerIndex < 0 || playerIndex > 3) {
            console.error(`HandRenderer.syncAndRender: Invalid playerIndex ${playerIndex}`);
            return;
        }

        const playerHand = this.playerHands[playerIndex];

        // Convert HandData indices to Phaser sprites
        playerHand.hiddenTiles = handData.tiles.map(tileData => {
            const phaserTile = this.tileManager.getTileSprite(tileData.index);
            if (!phaserTile) {
                console.error(`HandRenderer.syncAndRender: Could not find Phaser tile for index ${tileData.index}`);
            }
            return phaserTile;
        }).filter(tile => tile !== undefined);

        // Sync exposed tiles from HandData.exposures
        playerHand.exposedSets = handData.exposures.map(exposure => {
            return exposure.tiles.map(tileData => {
                const phaserTile = this.tileManager.getTileSprite(tileData.index);
                if (!phaserTile) {
                    console.error(`HandRenderer.syncAndRender: Could not find Phaser tile for exposure index ${tileData.index}`);
                }
                return phaserTile;
            }).filter(tile => tile !== undefined);
        });

        // Render the synced hand
        this.showHand(playerIndex, playerIndex === PLAYER.BOTTOM);
    }

    /**
     * Main entry point to render a player's complete hand
     *
     * @param {number} playerIndex - Player position (0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT)
     * @param {boolean} forceFaceup - Override face-up/down logic (default: false)
     */
    showHand(playerIndex, forceFaceup = false) {
        if (playerIndex < 0 || playerIndex > 3) {
            console.error(`HandRenderer.showHand: Invalid playerIndex ${playerIndex}`);
            return;
        }

        const playerInfo = PLAYER_LAYOUT[playerIndex];
        const playerHand = this.playerHands[playerIndex];

        debugPrint("HandRenderer.showHand called. playerIndex:", playerIndex, "forceFaceup:", forceFaceup);

        // Update rack graphics
        this.updateRackGraphics(playerIndex, playerInfo);

        // Determine face-up state
        const exposed = forceFaceup || (playerInfo.id === PLAYER.BOTTOM);

        // Render hidden tiles
        this.renderHiddenTiles(playerIndex, playerInfo, playerHand, exposed);

        // Render exposed tiles (always face-up)
        this.renderExposedTiles(playerIndex, playerInfo, playerHand);
    }

    /**
     * Calculate the rectangular bounds of the player's tile rack
     */
    getHandRackPosition(playerInfo) {
        const tileScale = this.calculateTileScale(playerInfo);
        const TILE_W = SPRITE_WIDTH * tileScale;
        const TILE_H = SPRITE_HEIGHT * tileScale;
        const GAP = TILE_GAP;
        const PADDING = 8;
        const maxTiles = 14;

        let width, height, x, y;

        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            width = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING);
            height = 2 * TILE_H + GAP + (2 * PADDING);
            x = (WINDOW_WIDTH / 2) - (width / 2);
            y = WINDOW_HEIGHT - height - 10;
            break;
        case PLAYER.TOP:
            width = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING);
            height = 2 * TILE_H + GAP + (2 * PADDING);
            x = (WINDOW_WIDTH / 2) - (width / 2);
            y = 10;
            break;
        case PLAYER.LEFT:
            height = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING);
            width = 2 * TILE_H + GAP + (2 * PADDING);
            x = 10;
            y = (WINDOW_HEIGHT / 2) - (height / 2);
            break;
        case PLAYER.RIGHT:
        default:
            height = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING);
            width = 2 * TILE_H + GAP + (2 * PADDING);
            x = WINDOW_WIDTH - width - 10;
            y = (WINDOW_HEIGHT / 2) - (height / 2);
            break;
        }

        return { x, y, width, height };
    }

    /**
     * Get the scale factor for tiles based on player position
     */
    calculateTileScale(playerInfo) {
        return (playerInfo.id === PLAYER.BOTTOM) ? 1.0 : SPRITE_SCALE;
    }

    /**
     * Prepare a tile for animation by setting its correct scale and angle
     * This should be called before animating a tile from wall to hand
     * @param {object} tile - Phaser tile object
     * @param {number} playerIndex - Player position
     */
    prepareTileForAnimation(tile, playerIndex) {
        const playerInfo = PLAYER_LAYOUT[playerIndex];
        const tileScale = this.calculateTileScale(playerInfo);
        tile.scale = tileScale;
        tile.angle = playerInfo.angle;
    }

    /**
     * Calculate positions for hidden tiles
     *
     * Positions tiles starting from a fixed anchor point (not centered)
     * to prevent tiles from shifting as the hand size changes.
     */
    calculateHiddenTilePositions(playerInfo, hiddenCount) {
        const rackPos = this.getHandRackPosition(playerInfo);
        const tileScale = this.calculateTileScale(playerInfo);
        const tileWidth = SPRITE_WIDTH * tileScale;
        const tileHeight = SPRITE_HEIGHT * tileScale;
        const gap = TILE_GAP;

        let startX, startY;

        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            // Start from left edge of rack + padding
            startX = rackPos.x + 8 + (tileWidth / 2);
            startY = rackPos.y + rackPos.height - (tileHeight / 2) - 5;
            break;
        case PLAYER.TOP:
            // Start from left edge of rack + padding
            startX = rackPos.x + 8 + (tileWidth / 2);
            startY = rackPos.y + (tileHeight / 2) + 5;
            break;
        case PLAYER.LEFT:
            // Start from top edge of rack + padding
            startX = rackPos.x + (tileHeight / 2) + 5;
            startY = rackPos.y + 8 + (tileWidth / 2);
            break;
        case PLAYER.RIGHT:
        default:
            // Start from top edge of rack + padding
            startX = rackPos.x + rackPos.width - (tileHeight / 2) - 5;
            startY = rackPos.y + 8 + (tileWidth / 2);
            break;
        }

        return { startX, startY, tileWidth, tileHeight, gap };
    }

    /**
     * Calculate positions for exposed tile sets
     *
     * Positions exposed tiles starting from a fixed anchor point (not centered)
     * to prevent tiles from shifting as exposures are added.
     */
    calculateExposedTilePositions(playerInfo, exposedCount) {
        const rackPos = this.getHandRackPosition(playerInfo);
        const tileScale = this.calculateTileScale(playerInfo);
        const tileWidth = SPRITE_WIDTH * tileScale;
        const tileHeight = SPRITE_HEIGHT * tileScale;
        const gap = TILE_GAP;

        let startX, startY;

        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            // Start from left edge of rack + padding (top row for exposed)
            startX = rackPos.x + 8 + (tileWidth / 2);
            startY = rackPos.y + (tileHeight / 2) + 5;
            break;
        case PLAYER.TOP:
            // Start from left edge of rack + padding (bottom row for exposed)
            startX = rackPos.x + 8 + (tileWidth / 2);
            startY = rackPos.y + rackPos.height - (tileHeight / 2) - 5;
            break;
        case PLAYER.LEFT:
            // Start from top edge of rack + padding (right column for exposed)
            startX = rackPos.x + rackPos.width - (tileHeight / 2) - 5;
            startY = rackPos.y + 8 + (tileWidth / 2);
            break;
        case PLAYER.RIGHT:
        default:
            // Start from top edge of rack + padding (left column for exposed)
            startX = rackPos.x + (tileHeight / 2) + 5;
            startY = rackPos.y + 8 + (tileWidth / 2);
            break;
        }

        return { startX, startY, tileWidth, tileHeight, gap };
    }

    /**
     * Render all hidden (in-hand) tiles for a player
     */
    renderHiddenTiles(playerIndex, playerInfo, playerHand, exposed) {
        const hiddenTiles = playerHand.hiddenTiles;
        if (hiddenTiles.length === 0) {
            return;
        }

        const pos = this.calculateHiddenTilePositions(playerInfo, hiddenTiles.length);

        // Position tiles horizontally or vertically based on player
        if (playerInfo.id === PLAYER.BOTTOM || playerInfo.id === PLAYER.TOP) {
            // Horizontal layout
            this.positionTilesHorizontal(hiddenTiles, playerInfo, pos.startX, pos.startY, exposed, pos.tileWidth, pos.gap);
        } else {
            // Vertical layout (LEFT, RIGHT)
            this.positionTilesVertical(hiddenTiles, playerInfo, pos.startX, pos.startY, exposed, pos.tileWidth, pos.gap);
        }
    }

    /**
     * Render all exposed tile sets (pung/kong/quint) for a player
     */
    renderExposedTiles(playerIndex, playerInfo, playerHand) {
        const exposedSets = playerHand.exposedSets;
        if (exposedSets.length === 0) {
            return;
        }

        // Calculate total exposed tiles count
        const exposedCount = exposedSets.reduce((sum, set) => sum + set.length, 0);
        const pos = this.calculateExposedTilePositions(playerInfo, exposedCount);

        let currentX = pos.startX;
        let currentY = pos.startY;

        // Render each exposed set in sequence
        for (const tileSet of exposedSets) {
            if (playerInfo.id === PLAYER.BOTTOM || playerInfo.id === PLAYER.TOP) {
                // Horizontal layout
                this.positionTilesHorizontal(tileSet, playerInfo, currentX, currentY, true, pos.tileWidth, pos.gap);
                currentX += tileSet.length * (pos.tileWidth + pos.gap);
            } else {
                // Vertical layout
                this.positionTilesVertical(tileSet, playerInfo, currentX, currentY, true, pos.tileWidth, pos.gap);
                currentY += tileSet.length * (pos.tileWidth, pos.gap);
            }
        }
    }

    /**
     * Position tiles in horizontal layout (BOTTOM, TOP)
     */
    positionTilesHorizontal(tiles, playerInfo, startX, startY, exposed, tileWidth, gap) {
        const tileScale = this.calculateTileScale(playerInfo);

        tiles.forEach((tile, index) => {
            const x = startX + index * (tileWidth + gap);
            const y = startY;

            // Position both sprite and spriteBack
            tile.x = x;
            tile.y = y;
            tile.scale = tileScale;
            tile.angle = playerInfo.angle;
            tile.sprite.setDepth(10 + index);
            tile.spriteBack.setDepth(10 + index);

            // Show tile face-up or face-down using Tile's showTile method
            tile.showTile(true, exposed);
        });
    }

    /**
     * Position tiles in vertical layout (LEFT, RIGHT)
     */
    positionTilesVertical(tiles, playerInfo, startX, startY, exposed, tileWidth, gap) {
        const tileScale = this.calculateTileScale(playerInfo);

        tiles.forEach((tile, index) => {
            const x = startX;
            const y = startY + index * (tileWidth + gap);

            // Position both sprite and spriteBack
            tile.x = x;
            tile.y = y;
            tile.scale = tileScale;
            tile.angle = playerInfo.angle;
            tile.sprite.setDepth(10 + index);
            tile.spriteBack.setDepth(10 + index);

            // Show tile face-up or face-down using Tile's showTile method
            tile.showTile(true, exposed);
        });
    }

    /**
     * Update the visual background/border graphics for the tile rack
     */
    updateRackGraphics(playerIndex, playerInfo) {
        const playerHand = this.playerHands[playerIndex];
        const rackPos = this.getHandRackPosition(playerInfo);

        // Destroy old rack graphics if exists
        if (playerHand.rackGraphics) {
            playerHand.rackGraphics.destroy();
        }

        // Create new rack graphics
        playerHand.rackGraphics = this.scene.add.graphics();
        playerHand.rackGraphics.fillStyle(0x000000, 0.15);
        playerHand.rackGraphics.fillRoundedRect(
            rackPos.x,
            rackPos.y,
            rackPos.width,
            rackPos.height,
            8
        );
        playerHand.rackGraphics.setDepth(0);
    }

    /**
     * Get Phaser tiles for a player (for selection/interaction)
     * @param {number} playerIndex
     * @returns {Array} Array of Phaser tile sprites
     */
    getHiddenTiles(playerIndex) {
        return this.playerHands[playerIndex].hiddenTiles;
    }

    /**
     * Get exposed tile sets for a player
     * @param {number} playerIndex
     * @returns {Array<Array>} Array of tile arrays (each sub-array is a set)
     */
    getExposedSets(playerIndex) {
        return this.playerHands[playerIndex].exposedSets;
    }

    /**
     * Calculate tile position for animation target
     * Used when animating tiles from wall to hand
     *
     * Uses fixed anchor positioning to ensure consistent tile placement
     * as hand size changes during animations.
     *
     * @param {number} playerIndex
     * @param {number} tileIndex - Index in hidden tiles array
     * @param {number} handSize - Optional hand size override (unused, kept for compatibility)
     * @returns {{x: number, y: number}} Position coordinates
     */
    calculateTilePosition(playerIndex, tileIndex, handSize = -1) {
        const playerInfo = PLAYER_LAYOUT[playerIndex];
        const rackPos = this.getHandRackPosition(playerInfo);
        const tileScale = this.calculateTileScale(playerInfo);
        const tileWidth = SPRITE_WIDTH * tileScale;
        const tileHeight = SPRITE_HEIGHT * tileScale;
        const gap = TILE_GAP;

        let startX, startY;

        switch (playerInfo.id) {
            case PLAYER.BOTTOM:
                // Start from left edge of rack + padding
                startX = rackPos.x + 8 + (tileWidth / 2);
                startY = rackPos.y + rackPos.height - (tileHeight / 2) - 5;
                return {
                    x: startX + (tileIndex * (tileWidth + gap)),
                    y: startY
                };
            case PLAYER.TOP:
                // Start from left edge of rack + padding
                startX = rackPos.x + 8 + (tileWidth / 2);
                startY = rackPos.y + (tileHeight / 2) + 5;
                return {
                    x: startX + (tileIndex * (tileWidth + gap)),
                    y: startY
                };
            case PLAYER.LEFT:
                // Start from top edge of rack + padding
                startX = rackPos.x + (tileHeight / 2) + 5;
                startY = rackPos.y + 8 + (tileWidth / 2);
                return {
                    x: startX,
                    y: startY + (tileIndex * (tileWidth + gap))
                };
            case PLAYER.RIGHT:
            default:
                // Start from top edge of rack + padding
                startX = rackPos.x + rackPos.width - (tileHeight / 2) - 5;
                startY = rackPos.y + 8 + (tileWidth / 2);
                return {
                    x: startX,
                    y: startY + (tileIndex * (tileWidth + gap))
                };
        }
    }
}
