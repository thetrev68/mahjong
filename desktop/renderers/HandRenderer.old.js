import { PLAYER, SPRITE_WIDTH, SPRITE_HEIGHT, SPRITE_SCALE, TILE_GAP, WINDOW_WIDTH, WINDOW_HEIGHT } from "../../constants.js";
import { debugPrint } from "../../utils.js";

/**
 * HandRenderer - Renders player hands for all 4 positions
 *
 * Separates rendering concerns from game logic by providing a clean API
 * for positioning and displaying tiles across different player perspectives.
 *
 * Handles tile positioning, rotation, and layout for:
 * - PLAYER.BOTTOM (human): Horizontal row at bottom, face-up, full size
 * - PLAYER.RIGHT (AI): Vertical column on right, face-down, scaled 0.75
 * - PLAYER.TOP (AI): Horizontal row at top, face-down, scaled 0.75
 * - PLAYER.LEFT (AI): Vertical column on left, face-down, scaled 0.75
 *
 * Does NOT handle:
 * - Tile selection (handled by SelectionManager)
 * - Click events (handled by Hand/SelectionManager)
 * - Game logic (handled by GameLogic)
 * - Tile creation/destruction (handled by Hand/Wall)
 */
export class HandRenderer {
    /**
     * Create a new HandRenderer
     * @param {Phaser.Scene} scene - The Phaser scene containing the game
     * @param {Table} table - The game table object containing all players
     * @param {TileManager} tileManager - The tile manager for sprite lookup
     */
    constructor(scene, table, tileManager) {
        this.scene = scene;
        this.table = table;
        this.tileManager = tileManager;
    }

    /**
     * Sync Phaser tiles with HandData model, then render
     *
     * This is the authoritative method for updating a player's hand after
     * data changes (Charleston, draw, discard, etc.). It rebuilds the
     * Phaser tile array from the HandData model to ensure visual consistency.
     *
     * @param {number} playerIndex - Player position (0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT)
     * @param {HandData} handData - Hand data model from GameController
     * @returns {undefined}
     *
     * @example
     * // Update hand after Charleston pass
     * handRenderer.syncAndRender(PLAYER.BOTTOM, handData);
     */
    syncAndRender(playerIndex, handData) {
        if (playerIndex < 0 || playerIndex > 3) {
            console.error(`HandRenderer.syncAndRender: Invalid playerIndex ${playerIndex}`);
            return;
        }

        const player = this.table.players[playerIndex];
        const hand = player.hand;

        // Auto-sort Player 0's hand by suit before rendering
        // This ensures consistent sorting after any hand change (draw, claim, swap, etc.)
        if (playerIndex === PLAYER.BOTTOM && handData.sortBySuit) {
            handData.sortBySuit();
        }

        // Sync hidden tiles: rebuild Phaser tileArray from HandData
        hand.hiddenTileSet.tileArray = handData.tiles.map(tileData => {
            // Get Phaser sprite by tile index (stable identifier)
            const phaserTile = this.tileManager.getTileSprite(tileData.index);
            if (!phaserTile) {
                console.error(`HandRenderer.syncAndRender: Could not find Phaser tile for index ${tileData.index}`);
            }
            return phaserTile;
        }).filter(tile => tile !== undefined);

        // Sync exposed tiles (if HandData includes exposures)
        // For now, exposures are managed separately - this is a future enhancement

        // Render the synced hand
        this.showHand(playerIndex, playerIndex === PLAYER.BOTTOM);
    }

    /**
     * Main entry point to render a player's complete hand (hidden + exposed tiles)
     *
     * @param {number} playerIndex - Player position (0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT)
     * @param {boolean} forceFaceup - Override face-up/down logic (default: false)
     *                                 false = BOTTOM face-up, AI face-down
     *                                 true = All players face-up
     * @returns {undefined}
     *
     * @example
     * // Render human player's hand (face-up)
     * handRenderer.showHand(PLAYER.BOTTOM);
     *
     * // Render AI player's hand (face-down)
     * handRenderer.showHand(PLAYER.TOP);
     *
     * // Force all tiles face-up for debugging
     * handRenderer.showHand(PLAYER.RIGHT, true);
     */
    showHand(playerIndex, forceFaceup = false) {
        // Validate playerIndex
        if (playerIndex < 0 || playerIndex > 3) {
            console.error(`HandRenderer.showHand: Invalid playerIndex ${playerIndex}`);
            return;
        }

        // Get player and playerInfo
        const player = this.table.players[playerIndex];
        const playerInfo = player.playerInfo;
        const hand = player.hand;

        debugPrint("HandRenderer.showHand called. playerInfo:", playerInfo, "forceFaceup:", forceFaceup);

        // Update rack graphics
        this.updateRackGraphics(playerInfo, hand);

        // Determine face-up state
        // Bottom player always face-up, AI players face-down unless forceFaceup
        const exposed = forceFaceup || (playerInfo.id === PLAYER.BOTTOM);

        // Render hidden tiles
        this.renderHiddenTiles(playerInfo, hand, exposed);

        // Render exposed tiles (always face-up)
        this.renderExposedTiles(playerInfo, hand);
    }

    /**
     * Calculate the rectangular bounds of the player's tile rack
     *
     * The rack is the background area that holds both hidden and exposed tiles.
     * Sized to fit 14 tiles (13 hand + 1 potential pickup) with padding.
     *
     * @param {object} playerInfo - Player information object with id property
     * @returns {{ x: number, y: number, width: number, height: number }}
     *          Rectangle bounds in pixels
     *
     * @example
     * const rackPos = handRenderer.getHandRackPosition(player.playerInfo);
     * // BOTTOM: { x: 126, y: 480, width: 800, height: 158 }
     */
    getHandRackPosition(playerInfo) {
        // Use the correct scale for each player
        const tileScale = this.calculateTileScale(playerInfo);
        const TILE_W = SPRITE_WIDTH * tileScale;
        const TILE_H = SPRITE_HEIGHT * tileScale;
        const GAP = TILE_GAP;
        const PADDING = 8; // Padding around tiles within rack
        const maxTiles = 14; // Max tiles to fit (13 hand + 1 pickup)

        let width, height, x, y;

        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            // Bottom rack: two rows (top: exposed, bottom: hidden)
            width = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING);
            height = 2 * TILE_H + GAP + (2 * PADDING); // Two rows with gap
            x = (WINDOW_WIDTH / 2) - (width / 2);
            y = WINDOW_HEIGHT - height - 10;
            break;
        case PLAYER.TOP:
            // Top rack: two rows (top: hidden, bottom: exposed)
            width = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING);
            height = 2 * TILE_H + GAP + (2 * PADDING);
            x = (WINDOW_WIDTH / 2) - (width / 2);
            y = 10;
            break;
        case PLAYER.LEFT:
            // Left rack: two columns (left: hidden, right: exposed)
            height = maxTiles * (TILE_W + GAP) - GAP + (2 * PADDING);
            width = 2 * TILE_H + GAP + (2 * PADDING);
            x = 10;
            y = (WINDOW_HEIGHT / 2) - (height / 2);
            break;
        case PLAYER.RIGHT:
        default:
            // Right rack: two columns (right: hidden, left: exposed)
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
     *
     * @param {object} playerInfo - Player information object with id property
     * @returns {number} Scale factor (1.0 for BOTTOM, 0.75 for AI players)
     *
     * @example
     * const scale = handRenderer.calculateTileScale(playerInfo);
     * // 1.0 for BOTTOM, 0.75 for RIGHT/TOP/LEFT
     */
    calculateTileScale(playerInfo) {
        return (playerInfo.id === PLAYER.BOTTOM) ? 1.0 : SPRITE_SCALE;
    }

    /**
     * Calculate X/Y coordinates for hidden tiles in the hand
     *
     * Returns the starting position for the first tile, plus dimensions
     * needed to position subsequent tiles.
     *
     * @param {object} playerInfo - Player information
     * @param {Hand} hand - Hand object containing tiles
     * @returns {{ startX: number, startY: number, tileWidth: number, tileHeight: number, gap: number }}
     *
     * @example
     * const pos = handRenderer.calculateHiddenTilePositions(playerInfo, hand);
     * // BOTTOM: { startX: 164, startY: 598.5, tileWidth: 52, tileHeight: 69, gap: 4 }
     */
    calculateHiddenTilePositions(playerInfo, hand) {
        const rackPos = this.getHandRackPosition(playerInfo);
        const tileScale = this.calculateTileScale(playerInfo);
        const tileWidth = SPRITE_WIDTH * tileScale;
        const tileHeight = SPRITE_HEIGHT * tileScale;
        const gap = TILE_GAP;

        const hiddenCount = hand.hiddenTileSet.getLength();
        const totalHiddenWidth = hiddenCount * (tileWidth + gap) - gap;

        let startX, startY;

        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            // Bottom player: horizontal row at bottom of rack
            startX = rackPos.x + (rackPos.width / 2) - (totalHiddenWidth / 2) + (tileWidth / 2);
            startY = rackPos.y + rackPos.height - (tileHeight / 2) - 5; // Small margin from bottom
            break;
        case PLAYER.TOP:
            // Top player: horizontal row at top of rack
            startX = rackPos.x + (rackPos.width / 2) - (totalHiddenWidth / 2) + (tileWidth / 2);
            startY = rackPos.y + (tileHeight / 2) + 5; // Small margin from top
            break;
        case PLAYER.LEFT:
            // Left player: vertical column at left of rack
            startX = rackPos.x + (tileHeight / 2) + 5; // Small margin from left
            startY = rackPos.y + (rackPos.height / 2) - (totalHiddenWidth / 2) + (tileWidth / 2);
            break;
        case PLAYER.RIGHT:
        default:
            // Right player: vertical column at right of rack
            startX = rackPos.x + rackPos.width - (tileHeight / 2) - 5; // Small margin from right
            startY = rackPos.y + (rackPos.height / 2) - (totalHiddenWidth / 2) + (tileWidth / 2);
            break;
        }

        return { startX, startY, tileWidth, tileHeight, gap };
    }

    /**
     * Calculate starting X/Y coordinates for exposed tile sets
     *
     * Returns position for the exposed area (opposite row/column from hidden tiles).
     *
     * @param {object} playerInfo - Player information
     * @param {Hand} hand - Hand object with exposedTileSetArray
     * @returns {{ startX: number, startY: number, tileWidth: number, tileHeight: number, gap: number }}
     *
     * @example
     * const pos = handRenderer.calculateExposedTilePositions(playerInfo, hand);
     * // BOTTOM: { startX: 460, startY: 519.5, tileWidth: 52, tileHeight: 69, gap: 4 }
     */
    calculateExposedTilePositions(playerInfo, hand) {
        const rackPos = this.getHandRackPosition(playerInfo);
        const tileScale = this.calculateTileScale(playerInfo);
        const tileWidth = SPRITE_WIDTH * tileScale;
        const tileHeight = SPRITE_HEIGHT * tileScale;
        const gap = TILE_GAP;

        // Calculate total width of all exposed tiles
        const exposedCount = hand.exposedTileSetArray.reduce(
            (sum, set) => sum + set.getLength(), 0
        );
        const totalExposedWidth = exposedCount * (tileWidth + gap) - gap;

        let startX, startY;

        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            // Bottom player: exposed on top row
            startX = rackPos.x + (rackPos.width / 2) - (totalExposedWidth / 2) + (tileWidth / 2);
            startY = rackPos.y + (tileHeight / 2) + 5; // Small margin from top
            break;
        case PLAYER.TOP:
            // Top player: exposed on bottom row
            startX = rackPos.x + (rackPos.width / 2) - (totalExposedWidth / 2) + (tileWidth / 2);
            startY = rackPos.y + rackPos.height - (tileHeight / 2) - 5; // Small margin from bottom
            break;
        case PLAYER.LEFT:
            // Left player: exposed on right column
            startX = rackPos.x + rackPos.width - (tileHeight / 2) - 5; // Small margin from right
            startY = rackPos.y + (rackPos.height / 2) - (totalExposedWidth / 2) + (tileWidth / 2);
            break;
        case PLAYER.RIGHT:
        default:
            // Right player: exposed on left column
            startX = rackPos.x + (tileHeight / 2) + 5; // Small margin from left
            startY = rackPos.y + (rackPos.height / 2) - (totalExposedWidth / 2) + (tileWidth / 2);
            break;
        }

        return { startX, startY, tileWidth, tileHeight, gap };
    }

    /**
     * Render all hidden (in-hand) tiles for a player
     *
     * Positions tiles in the hidden area of the rack and sets face-up/down state.
     *
     * @param {object} playerInfo - Player information (id, angle)
     * @param {Hand} hand - Hand object with hiddenTileSet
     * @param {boolean} exposed - Whether to show tiles face-up (true) or face-down (false)
     * @returns {undefined}
     *
     * @example
     * // Render human player's hidden tiles (face-up)
     * handRenderer.renderHiddenTiles(playerInfo, hand, true);
     *
     * // Render AI player's hidden tiles (face-down)
     * handRenderer.renderHiddenTiles(playerInfo, hand, false);
     */
    renderHiddenTiles(playerInfo, hand, exposed) {
        const pos = this.calculateHiddenTilePositions(playerInfo, hand);

        // Use horizontal or vertical layout based on player position
        if (playerInfo.id === PLAYER.BOTTOM || playerInfo.id === PLAYER.TOP) {
            // Horizontal layout
            hand.hiddenTileSet.showTileSetInRack(
                playerInfo,
                pos.startX,
                pos.startY,
                exposed,
                pos.tileWidth,
                pos.gap
            );
        } else {
            // Vertical layout (LEFT, RIGHT)
            hand.hiddenTileSet.showTileSetInRackVertical(
                playerInfo,
                pos.startX,
                pos.startY,
                exposed,
                pos.tileWidth,
                pos.gap
            );
        }
    }

    /**
     * Render all exposed tile sets (pung/kong/quint) for a player
     *
     * Positions each exposed set in sequence in the exposed area.
     * Exposed tiles are always face-up for all players.
     *
     * @param {object} playerInfo - Player information (id, angle)
     * @param {Hand} hand - Hand object with exposedTileSetArray
     * @returns {undefined}
     *
     * @example
     * // Render exposed sets (always face-up)
     * handRenderer.renderExposedTiles(playerInfo, hand);
     */
    renderExposedTiles(playerInfo, hand) {
        // Skip if no exposed tiles
        if (hand.exposedTileSetArray.length === 0) {
            return;
        }

        const pos = this.calculateExposedTilePositions(playerInfo, hand);

        // Track current position as we place each set
        let currentX = pos.startX;
        let currentY = pos.startY;

        // Render each exposed tileset in sequence
        for (const tileset of hand.exposedTileSetArray) {
            if (playerInfo.id === PLAYER.BOTTOM || playerInfo.id === PLAYER.TOP) {
                // Horizontal layout
                tileset.showTileSetInRack(
                    playerInfo,
                    currentX,
                    currentY,
                    true, // Always face-up for exposed tiles
                    pos.tileWidth,
                    pos.gap
                );
                // Advance X position for next set
                currentX += tileset.getLength() * (pos.tileWidth + pos.gap);
            } else {
                // Vertical layout (LEFT, RIGHT)
                tileset.showTileSetInRackVertical(
                    playerInfo,
                    currentX,
                    currentY,
                    true, // Always face-up for exposed tiles
                    pos.tileWidth,
                    pos.gap
                );
                // Advance Y position for next set
                currentY += tileset.getLength() * (pos.tileWidth + pos.gap);
            }
        }
    }

    /**
     * Update the visual background/border graphics for the tile rack
     *
     * Passthrough to Hand.updateRack() method.
     * Kept in HandRenderer for completeness (all rendering goes through HandRenderer).
     *
     * @param {object} playerInfo - Player information
     * @param {Hand} hand - Hand object
     * @returns {undefined}
     *
     * @example
     * handRenderer.updateRackGraphics(playerInfo, hand);
     */
    updateRackGraphics(playerInfo, hand) {
        hand.updateRack(playerInfo);
    }
}
