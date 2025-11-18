import {printMessage} from "../../utils.js";
import {
    PLAYER, PLAYER_OPTION, SUIT,
    getTotalTileCount
} from "../../constants.js";
import {Wall, Discards} from "./gameObjects.js";

/**
 * Table - Legacy class from Phase 5
 *
 * CURRENT ARCHITECTURE (Phase 6):
 * - GameController manages all game state (players, hands, turn flow)
 * - HandRenderer handles all visual rendering
 * - This Table class now ONLY manages:
 *   1. Wall (tile pool)
 *   2. Discards (discard pile)
 *   3. Visual turn indicator boxes
 *
 * LEGACY CODE WARNING:
 * Methods below (deal, charlestonPass, courtesyPass, exchangeJoker, etc.)
 * reference this.players[] which is NEVER INITIALIZED.
 * These methods are DEAD CODE - not called anywhere in current codebase.
 * They remain for reference during migration but will be deleted in cleanup.
 *
 * TODO Phase 6 Cleanup:
 * - Delete all methods that reference this.players
 * - Keep only: wall, discards, boxes, reset(), switchPlayer()
 * - Consider moving Wall/Discards to TileManager
 */

// Phase 6: gPlayerInfo moved to desktop/config/playerLayout.js (PLAYER_LAYOUT)


export class Table {
    constructor(scene) {
        this.scene = scene;
        this.gameLogic = null;  // Will be set after construction
        this.wall = new Wall(scene);
        this.discards = new Discards();

        this.boxes = [];
        for (let i = 0; i < 4; i++) {
            this.boxes[i] = null;
        }

        // Visual turn indicator boxes (graphics objects)
        this.player02CourtesyVote = 0;
        this.player13CourtesyVote = 0;
    }

    create(skipTileCreation = false) {

        for (let i = 0; i < 4; i++) {
            const graphics = this.scene.add.graphics(0, 0);
            // Remove light green fill to match background
            // Graphics.fillStyle(0x8FBF00);
            // Graphics.fillRect(gPlayerInfo[i].rectX, gPlayerInfo[i].rectY, gPlayerInfo[i].rectWidth, gPlayerInfo[i].rectHeight);
            this.boxes[i] = graphics;
        }

        this.wall.create(skipTileCreation);
    }

    reset() {
        // Phase 6: Hand reset now handled by GameController (HandData)
        // Just reset discards back to wall

        while (this.discards.tileArray.length) {
            this.wall.insert(this.discards.tileArray.pop());
        }

        // Verify there are 152 (or 160 with blanks) tiles in wall
        // Dynamic tile count based on settings (152 or 160 with blanks)
        const expectedTileCount = getTotalTileCount();
        if (this.wall.tileArray.length !== expectedTileCount) {
            printMessage("ERROR - table.reset() - total tile count is not " + expectedTileCount + ". Tile count = " + this.wall.tileArray.length + "\n");
        }
    }

    switchPlayer(player) {
        for (let i = 0; i < 4; i++) {
            this.boxes[i].visible = false;
        }

        this.boxes[player].visible = true;
    }

    // ============================================================================
    // DEAD CODE - NOT CALLED IN CURRENT ARCHITECTURE
    // ============================================================================
    // All methods below reference this.players[] which is NEVER initialized.
    // These are legacy methods from Phase 5 when Table managed Player objects.
    // They are NOT called anywhere in the current codebase (grep confirmed).
    // Kept temporarily for reference during migration, will be deleted in cleanup.
    // ============================================================================

    // Apply training hands and exposed sets before animated dealing
    applyTrainingHands(initPlayerHandArray) {
        // Deal player hands.
        // Use initPlayerHandArray to pre-populate  (useful for testing/training mode)
        // Note: pre-populate hand may be less than a full hand
        for (let player = 0; player < 4; player++) {
            const initPlayerHand = initPlayerHandArray[player];

            if (!initPlayerHand) {
                continue;
            }

            // Hidden
            for (let i = 0; i < initPlayerHand.hiddenTileSet.getLength(); i++) {
                const findTile = initPlayerHand.hiddenTileSet.tileArray[i];
                const tile = this.wall.findAndRemove(findTile);
                if (tile) {
                    this.players[player].hand.insertHidden(tile);
                }
            }

            // Exposed
            for (const tileSet of initPlayerHand.exposedTileSetArray) {
                const tileArray = [];
                for (let i = 0; i < tileSet.getLength(); i++) {
                    const findTile = tileSet.tileArray[i];
                    const tile = this.wall.findAndRemove(findTile);
                    if (tile) {
                        tileArray.push(tile);
                    }
                }
                this.players[player].hand.insertExposed(tileArray);
            }
        }
    }

    // Finalize initial hands after sequential dealing
    finalizeInitialHands() {
        // Sort and show all players hands
        for (let i = 0; i < 4; i++) {
            this.players[i].hand.sortSuitHidden();
            // Show Player 0 (human) tiles face-up, others remain face-down
            if (i === PLAYER.BOTTOM) {
                this.players[i].showHand(true);
            } else {
                this.players[i].showHand(false);
            }
        }
    }

    deal(initPlayerHandArray) {
        // Apply training hands and exposed sets
        this.applyTrainingHands(initPlayerHandArray);

        // Deal remainder of tiles from wall
        for (let player = 0; player < 4; player++) {
            let handLength = 13;
            if (player === 0) {
                handLength = 14;
            }

            // Init hand may be < 13 (or 14).
            const numRemainingTiles = handLength - this.players[player].hand.getLength();
            for (let j = 0; j < numRemainingTiles; j++) {
                const tile = this.wall.remove();
                this.players[player].hand.insertHidden(tile);
            }
        }

        // Show all players hands
        this.finalizeInitialHands();

        // Update wall counter after dealing
        if (this.scene.updateWallTileCounter) {
            this.scene.updateWallTileCounter(this.wall.getCount());
        }

    }

    // Insert pass tile arrays into players hands.
    // Note - pass tiles have already been removed from the player's hand
    charlestonPass(player, charlestonPassArray) {
        const delta = player - PLAYER.BOTTOM;

        // Track received tiles for player 0 (for glow effect)
        const receivedTilesPlayer0 = [];

        // Insert 3 cards from player 0-3 to the appropriate player
        for (let i = 0; i < 4; i++) {
            const from = i;
            let to = i + delta;
            if (to > 3) {
                to -= 4;
            }

            for (const tile of charlestonPassArray[from]) {
                this.players[to].hand.insertHidden(tile);
                // Track tiles received by player 0
                if (to === PLAYER.BOTTOM) {
                    receivedTilesPlayer0.push(tile);
                }
            }
        }

        // Show all players hands
        for (let i = 0; i < 4; i++) {
            if (i !== 0) {
                this.players[i].hand.sortSuitHidden();
            }
            this.players[i].showHand(i === PLAYER.BOTTOM);
        }

        // Return received tiles for player 0 (for glow effect)
        return receivedTilesPlayer0;
    }

    courtesyVote(courtesyVoteArray) {

        // Calculate actual courtesy count using voting from each player
        this.player02CourtesyVote = Math.min(courtesyVoteArray[0], courtesyVoteArray[2]);
        this.player13CourtesyVote = Math.min(courtesyVoteArray[1], courtesyVoteArray[3]);
    }

    courtesyPass(courtesyPassArray) {
        // Delta = player opposite
        const delta = 2;

        // Track received tiles for player 0 (for glow effect)
        const receivedTilesPlayer0 = [];

        // Insert courtesy cards from player 0-3 to the appropriate player
        for (let i = 0; i < 4; i++) {
            const from = i;
            let to = i + delta;
            if (to > 3) {
                to -= 4;
            }

            for (const tile of courtesyPassArray[from]) {
                this.players[to].hand.insertHidden(tile);
                // Track tiles received by player 0
                if (to === PLAYER.BOTTOM) {
                    receivedTilesPlayer0.push(tile);
                }
            }
        }

        // Show all players hands
        for (let i = 0; i < 4; i++) {
            if (i !== 0) {
                this.players[i].hand.sortSuitHidden();
            }
            this.players[i].showHand(i === PLAYER.BOTTOM);
        }

        // Return received tiles for player 0 (for glow effect)
        return receivedTilesPlayer0;
    }

    // Return
    //      - playerOption  (discard, exposure, mahjong )
    //      - winningPlayer (valid only for exposure, mahjong)
    processClaimArray(currPlayer, claimArray, discardTile) {
        let numDiscard = 0;
        let numMahjong = 0;

        // Count types of claims
        for (let i = 0; i < 4; i++) {
            switch (claimArray[i].playerOption) {
            case PLAYER_OPTION.EXPOSE_TILES:
                break;
            case PLAYER_OPTION.DISCARD_TILE:
                numDiscard++;
                break;
            case PLAYER_OPTION.MAHJONG:
                numMahjong++;
                break;
            default:
                printMessage("ERROR - processClaimArray. Unknown claim type\n");
                break;
            }
        }

        if (numDiscard === 4) {
            // If no-one wants the discard, add to discard pile
            this.discards.insertDiscard(discardTile);
            this.discards.showDiscards();

            // Note: tile_dropping sound is played in gameLogic.js when animation completes

            return {
                playerOption: PLAYER_OPTION.DISCARD_TILE,
                winningPlayer: 0
            };
        }


        // Mahjong takes priority over exposure (pung/kong/quints)
        let searchOption = PLAYER_OPTION.EXPOSE_TILES;

        if (numMahjong) {
            searchOption = PLAYER_OPTION.MAHJONG;
        }

        let winningPlayer = currPlayer;

        // Determine winner
        // Tie breaking - first player counterclockwise from player who discarded tile

        for (let i = 0; i < 3; i++) {
            winningPlayer++;
            if (winningPlayer > 3) {
                winningPlayer = 0;
            }

            if (claimArray[winningPlayer].playerOption === searchOption) {
                break;
            }
        }

        if (searchOption === PLAYER_OPTION.MAHJONG) {
            // Move discard to winner's hand
            this.players[winningPlayer].hand.insertHidden(discardTile);
        } else {
            // Expose winner's (discard+exposure) tiles

            const tilesToExpose = claimArray[winningPlayer].tileArray;
            const hand = this.players[winningPlayer].hand;

            // Find tiles to remove from hidden hand by value
            const tilesToRemove = [];
            const hiddenTilesCopy = [...hand.getHiddenTileArray()]; // Copy to avoid issues while removing

            for (const exposedTile of tilesToExpose) {
                if (exposedTile !== discardTile) {
                    const index = hiddenTilesCopy.findIndex(hiddenTile => hiddenTile.suit === exposedTile.suit && hiddenTile.number === exposedTile.number);
                    if (index !== -1) {
                        tilesToRemove.push(hiddenTilesCopy[index]);
                        hiddenTilesCopy.splice(index, 1); // Remove from copy to handle duplicates in hand
                    }
                }
            }

            for (const tile of tilesToRemove) {
                hand.removeHidden(tile);
            }

            hand.insertExposed(tilesToExpose);
        }

        this.players[winningPlayer].showHand(winningPlayer === PLAYER.BOTTOM);

        return {
            playerOption: searchOption,
            winningPlayer
        };
    }

    // Handle Exchange Joker button
    // This will only be called if
    // 1. User (player 0) has one tile selected
    // 2. Player 0-3 has one joker selected in an exposure and tile is a match for that exposure.
    exchangeUserSelectedTileForExposedJoker() {

        // Get user's selected tile (also reset's selection of any tiles in hiddenTileArray)
        const selectedTile = this.players[PLAYER.BOTTOM].hand.removeDiscard();
        const text = selectedTile.getText();
        printMessage("Player 0 exchanged " + text + " for joker\n");

        // Find player and exposed tileSet which has the selected joker
        for (let i = 0; i < 4; i++) {
            for (const tileset of this.players[i].hand.exposedTileSetArray) {
                if (tileset.getSelectionCount() === 1) {
                    // Get selected joker
                    const selectionArray = tileset.getSelection();
                    const joker = selectionArray[0];
                    tileset.resetSelection();

                    // Remove joker from exposure and place into hidden hand
                    tileset.remove(joker);
                    this.players[PLAYER.BOTTOM].hand.insertHidden(joker);

                    // Put player 0's tile into exposure (replacing the joker).  Don't need to add input handler, so add directly to tileset.
                    tileset.insert(selectedTile);
                    break;
                }
            }
        }

        // Show all players hands
        for (let i = 0; i < 4; i++) {
            this.players[i].showHand(i === PLAYER.BOTTOM);
        }
    }


    // Search all player's exposed tilesets containing joker(s)
    // Return array of unique tiles that can be swapped for jokers
    getExposedJokerArray() {
        const tileArray = [];

        for (let i = 0; i < 4; i++) {
            for (const tileset of this.players[i].hand.exposedTileSetArray) {

                // Find unique tile in pung/kong/quint (i.e. non-joker)
                let uniqueTile = null;
                for (const tile of tileset.tileArray) {
                    if (tile.suit !== SUIT.JOKER) {
                        uniqueTile = tile;
                        break;
                    }
                }

                // For each joker in pung/kong/quint, return the unique tile
                if (uniqueTile) {
                    for (const tile of tileset.tileArray) {
                        if (tile.suit === SUIT.JOKER) {
                            tileArray.push(uniqueTile);
                        }
                    }
                }
            }
        }

        return tileArray;
    }

    // Swap given tile with an exposed joker
    // Input
    // - hand
    // - tile (contained in hand, known to match an exposed pung/kong/quint with joker)
    // Output
    // - replace tile with joker in hand
    // - exposed pung/kong/quint replace joker with tile
    exchangeJoker(currPlayer, hand, swapTile) {
        outerLoop:
        for (let i = 0; i < 4; i++) {
            for (const tileset of this.players[i].hand.exposedTileSetArray) {

                // Find unique tile in pung/kong/quint (i.e. non-joker)
                let uniqueTile = null;
                for (const tile of tileset.tileArray) {
                    if (tile.suit !== SUIT.JOKER) {
                        uniqueTile = tile;
                        break;
                    }
                }

                // If pung/kong/quint matches swapTile, exchange joker (if any)
                if (uniqueTile && (uniqueTile.suit === swapTile.suit) &&
                    (uniqueTile.number === swapTile.number)) {

                    for (const tile of tileset.tileArray) {
                        if (tile.suit === SUIT.JOKER) {
                            const text = swapTile.getText();
                            printMessage("Player " + currPlayer + " *exchanged* " + text + " for joker\n");

                            // Exchange swapTile
                            hand.removeHidden(swapTile);
                            tileset.insert(swapTile);

                            // Exchange joker
                            tileset.remove(tile);
                            hand.insertHidden(tile);

                            // Show all players hands
                            for (let k = 0; k < 4; k++) {
                                this.players[k].showHand();
                            }
                            break outerLoop;
                        }
                    }
                }
            }
        }

    }
}
