import {
    STATE, PLAYER, SUIT, SPRITE_WIDTH,
    SPRITE_SCALE, WINDOW_WIDTH, WINDOW_HEIGHT, TILE_GAP
} from "./constants.js";

// PRIVATE CONSTANTS


// PRIVATE GLOBALS

export class TileSet {
    constructor(scene, gameLogic, inputEnabled) {
        this.scene = scene;
        this.gameLogic = gameLogic;
        this.tileArray = [];
        this.inputEnabled = inputEnabled;
        this.selectCount = 0;
    }

    getLength() {
        return this.tileArray.length;
    }

    // Return tileset as simple array of tiles
    getTileArray() {
        const temp = [];

        for (const tile of this.tileArray) {
            temp.push(tile);
        }

        return temp;
    }

    reset(wall) {
        // Reset tileset - return all tiles to wall
        while (this.tileArray.length) {
            const tile = this.tileArray[0];
            this.remove(tile);
            wall.insert(tile);
        }
    }

    resetSelection() {
        console.log("TileSet.resetSelection() called");
        if (this.selectCount === 0) {
            return;
        }

        window.document.getElementById("button1").disabled = true;

        for (const tile of this.tileArray) {
            if (tile.selected) {
                tile.selected = false;
                tile.x = tile.origX;
                tile.y = tile.origY;
                this.selectCount--;
            }
        }
    }

    getSelection() {
        const temp = [];

        for (const tile of this.tileArray) {
            if (tile.selected) {
                temp.push(tile);
            }
        }

        return temp;
    }

    getSelectionCount() {
        let count = 0;
        for (const tile of this.tileArray) {
            if (tile.selected) {
                count++;
            }
        }

        return count;
    }

    sortRank() {
        this.tileArray.sort((a, b) => {
            let vala = a.number;
            let valb = b.number;

            if (a.suit > SUIT.DOT) {
                // Sort order of winds dragons is > crack/bam/dot
                vala += 10 + (a.suit * 10);
            } else {
                // Add suit to number to make sure crack/bam/dot are grouped together
                vala += a.suit;
            }
            if (b.suit > SUIT.DOT) {
                valb += 10 + (b.suit * 10);
            } else {
                valb += b.suit;
            }

            return vala - valb;
        });

        this.moveFlowerToFront();
        this.moveJokerToFront();
    }

    sortSuit() {
        this.tileArray.sort((a, b) => {
            const vala = a.number + (a.suit * 10);
            const valb = b.number + (b.suit * 10);

            return vala - valb;
        });

        this.moveFlowerToFront();
        this.moveJokerToFront();
    }

    moveJokerToFront() {
        const jokers = [];

        for (const tile of this.tileArray) {
            if (tile.suit === SUIT.JOKER) {
                jokers.unshift(tile);
            }
        }

        for (const tile of jokers) {
            // Remove tile
            this.tileArray.splice(this.tileArray.indexOf(tile), 1);
            // Insert in front of array
            this.tileArray.unshift(tile);
        }
    }

    moveFlowerToFront() {
        const flowers = [];

        for (const tile of this.tileArray) {
            if (tile.suit === SUIT.FLOWER) {
                flowers.unshift(tile);
            }
        }

        for (const tile of flowers) {
            // Remove tile
            this.tileArray.splice(this.tileArray.indexOf(tile), 1);
            // Insert in front of array
            this.tileArray.unshift(tile);
        }
    }

    getTileWidth(playerInfo) {
        let width = 0;

        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            width = SPRITE_WIDTH;
            break;
        case PLAYER.TOP:
        case PLAYER.LEFT:
        case PLAYER.RIGHT:
        default:
            width = SPRITE_WIDTH * SPRITE_SCALE;
            break;
        }

        return width;
    }

    getWidth(playerInfo) {
        // Width of tileset including gaps between tiles
        const tileWidth = this.getTileWidth(playerInfo);
        const numTiles = this.tileArray.length;
        if (numTiles === 0) {
            return 0;
        }

        return (numTiles * tileWidth) + ((numTiles - 1) * TILE_GAP);
    }

    // Returns updated x, y
    showTileSet(playerInfo, posX, posY, exposed) {

        let x = posX;
        let y = posY;
        const tileWidth = this.getTileWidth(playerInfo);

        for (let i = 0; i < this.tileArray.length; i++) {
            const tile = this.tileArray[i];
            // Tile.x = x;
            // Tile.y = y;
            // Tile.angle = playerInfo.angle;
            tile.animate(x, y, playerInfo.angle);
            if (playerInfo.id === PLAYER.BOTTOM) {
                tile.scale = 1.0;
            } else {
                tile.scale = SPRITE_SCALE;
            }

            if (playerInfo.id === PLAYER.BOTTOM) {
                tile.showTile(true, true);
            } else {
                tile.showTile(true, exposed);
            }

            switch (playerInfo.id) {
            case PLAYER.BOTTOM:
                x += tileWidth + TILE_GAP;
                break;
            case PLAYER.TOP:
                x -= tileWidth + TILE_GAP;
                break;
            case PLAYER.LEFT:
                y += tileWidth + TILE_GAP;
                break;
            case PLAYER.RIGHT:
            default:
                y -= tileWidth + TILE_GAP;
                break;
            }
        }

        return {
            x,
            y
        };
    }

    insert(tile) {
        this.tileArray.push(tile);
    }

    remove(tile) {

        if (this.inputEnabled) {
            tile.selected = false;
            tile.sprite.removeAllListeners();
            tile.sprite.disableInteractive();
        }
        const index = this.tileArray.indexOf(tile);
        if (index !== -1) {
            this.tileArray.splice(index, 1);
        }

        return tile;
    }

    checkOverlap(tile) {
        let overlappedTile = null;
        let maxarea = 0;
        const tileBounds = tile.sprite.getBounds();
        const tileArea = (tileBounds.width * tileBounds.height);

        for (const tempTile of this.tileArray) {
            if (tile === tempTile) {
                continue;
            }
            // eslint-disable-next-line new-cap
            const intersectRect = Phaser.Geom.Rectangle.Intersection(tileBounds, tempTile.sprite.getBounds());
            const area = intersectRect.width * intersectRect.height;

            if (area && (area > maxarea) && ((area / tileArea) > 0.7)) {
                maxarea = area;
                overlappedTile = tempTile;
            }
        }

        return overlappedTile;
    }

    swapTiles(tile, overlappedTile) {
        // Swap tile sprite positions
        const tempx = tile.origX;
        const tempy = tile.origY;

        tile.origX = overlappedTile.x;
        tile.origy = overlappedTile.y;
        overlappedTile.x = tempx;
        overlappedTile.y = tempy;

        // Swap tile positions in the tile array
        const tileIndex = this.tileArray.indexOf(tile);
        const overlappedTileIndex = this.tileArray.indexOf(overlappedTile);

        const temp = this.tileArray[tileIndex];
        this.tileArray[tileIndex] = this.tileArray[overlappedTileIndex];
        this.tileArray[overlappedTileIndex] = temp;
    }

}

export class Hand {
    constructor(scene, gameLogic, inputEnabled) {
        this.scene = scene;
        this.gameLogic = gameLogic;
        this.hiddenTileSet = new TileSet(scene, gameLogic, inputEnabled);
        this.exposedTileSetArray = [];
        // When adding new variables, make sure to update dupHand()
    }

    // Duplicate hand
    // - hiddenTileSet and exposedTileSetArray can then be freely manipulated
    dupHand() {
        const newHand = new Hand(this.scene, this.gameLogic, false);

        for (const tile of this.hiddenTileSet.tileArray) {
            newHand.hiddenTileSet.tileArray.push(tile);
        }

        for (const tileset of this.exposedTileSetArray) {
            const newTileSet = new TileSet(this.scene, this.gameLogic, false);
            for (const tile of tileset.tileArray) {
                newTileSet.insert(tile);
            }
            newHand.exposedTileSetArray.push(newTileSet);
        }

        return newHand;
    }

    getLength() {
        let length = 0;

        length += this.hiddenTileSet.getLength();
        for (const tileset of this.exposedTileSetArray) {
            length += tileset.getLength();
        }

        return length;
    }

    // Return hand as simple array of tiles
    getTileArray() {
        let temp = [];

        temp = temp.concat(this.hiddenTileSet.getTileArray());

        for (const tileset of this.exposedTileSetArray) {
            temp = temp.concat(tileset.getTileArray());
        }

        return temp;
    }

    getHiddenTileArray() {
        return this.hiddenTileSet.getTileArray();
    }

    isAllHidden() {
        let length = 0;

        for (const tileset of this.exposedTileSetArray) {
            length += tileset.getLength();
        }

        if (length === 0) {
            return true;
        }

        return false;
    }

    // Return array of joker tiles (if any).  Does NOT remove from hidden tileset.
    getHiddenJokers() {
        const jokerArray = [];
        for (const tile of this.hiddenTileSet.tileArray) {
            if (tile.suit === SUIT.JOKER) {
                jokerArray.push(tile);
            }
        }

        return jokerArray;
    }

    reset(wall) {
        // Reset hand - return all tiles to wall
        this.hiddenTileSet.reset(wall);

        for (const tileset of this.exposedTileSetArray) {
            tileset.reset(wall);
        }
        this.exposedTileSetArray = [];
    }

    getSeperatorDistance(playerInfo) {
        let seperatorDistance = 0;
        const separatorScale = 0.2;

        // Separate hidden and exposed tiles
        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            seperatorDistance = SPRITE_WIDTH * separatorScale;
            break;
        case PLAYER.TOP:
        case PLAYER.LEFT:
        case PLAYER.RIGHT:
        default:
            seperatorDistance = SPRITE_WIDTH * SPRITE_SCALE * separatorScale;
            break;
        }

        return seperatorDistance;
    }

    getHandWidth(playerInfo) {
        let width = 0;
        const sepDist = this.getSeperatorDistance(playerInfo);

        width += this.hiddenTileSet.getWidth(playerInfo);
        for (const tileset of this.exposedTileSetArray) {
            width += sepDist;
            width += tileset.getWidth(playerInfo);
        }

        return width;
    }

    showHand(playerInfo, forceFaceup) {
        // Calculate starting position for all tiles in hand
        let x = playerInfo.x;
        let y = playerInfo.y;

        const handWidth = this.getHandWidth(playerInfo);
        const tileWidth = this.hiddenTileSet.getTileWidth(playerInfo);

        switch (playerInfo.id) {
        case PLAYER.BOTTOM:
            x = (WINDOW_WIDTH / 2) - (handWidth / 2) + (tileWidth / 2);
            break;
        case PLAYER.TOP:
            x = (WINDOW_WIDTH / 2) + (handWidth / 2) - (tileWidth / 2);
            break;
        case PLAYER.LEFT:
            y = (WINDOW_HEIGHT / 2) - (handWidth / 2) + (tileWidth / 2);
            break;
        case PLAYER.RIGHT:
        default:
            y = (WINDOW_HEIGHT / 2) + (handWidth / 2) - (tileWidth / 2);
            break;
        }

        // Display all tilesets
        let exposed = false;
        if (forceFaceup) {
            exposed = true;
        }
        ({x, y} = this.hiddenTileSet.showTileSet(playerInfo, x, y, exposed));

        for (const tileset of this.exposedTileSetArray) {
            const sepDist = this.getSeperatorDistance(playerInfo);

            // Separate hidden and exposed tiles
            switch (playerInfo.id) {
            case PLAYER.BOTTOM:
                x += sepDist;
                break;
            case PLAYER.TOP:
                x -= sepDist;
                break;
            case PLAYER.LEFT:
                y += sepDist;
                break;
            case PLAYER.RIGHT:
            default:
                y -= sepDist;
                break;
            }

            ({x, y} = tileset.showTileSet(playerInfo, x, y, true));
        }
    }

    resetSelection() {
        console.log("Hand.resetSelection() called");
        console.trace();
        this.hiddenTileSet.resetSelection();

        for (const tileset of this.exposedTileSetArray) {
            tileset.resetSelection();
        }
    }

    // Return selected tiles from hidden group
    //  - will not remove from hand
    //  - will not unselect
    getSelectionHidden() {
        return this.hiddenTileSet.getSelection();
    }

    getSelectionHiddenCount() {
        return this.hiddenTileSet.getSelectionCount();
    }

    sortRankHidden() {
        this.resetSelection();
        this.hiddenTileSet.sortRank();
    }

    sortSuitHidden() {
        this.resetSelection();
        this.hiddenTileSet.sortSuit();
    }

    insertHidden(tile) {
        const tileSet = this.hiddenTileSet;

        if (tileSet.inputEnabled) {

            tile.sprite.on("pointerup", () => {
                if (tile.drag) {
                    return;
                }
                let maxSelect = 3;
                let minSelect = 3;

                switch (this.gameLogic.state) {
                case STATE.LOOP_CHOOSE_DISCARD:
                    maxSelect = 1;
                    minSelect = 1;
                    break;
                case STATE.CHARLESTON1:
                case STATE.CHARLESTON2:
                    maxSelect = 3;
                    minSelect = 3;
                    break;
                case STATE.COURTESY:
                    maxSelect = this.gameLogic.table.player02CourtesyVote;
                    minSelect = this.gameLogic.table.player02CourtesyVote;
                    break;
                case STATE.LOOP_EXPOSE_TILES:
                    maxSelect = 4;
                    minSelect = 2;
                    break;
                default:
                    maxSelect = 0;
                    minSelect = 0;
                    break;
                }
                console.log(`Tile clicked. State: ${this.gameLogic.state}, selectCount: ${tileSet.selectCount}, min: ${minSelect}, max: ${maxSelect}`);

                if (maxSelect) {
                    if (tile.selected) {
                        // Deselect
                        tile.selected = false;
                        tile.animate(tile.origX, tile.origY, tile.angle);
                        tileSet.selectCount--;
                    } else if (tileSet.selectCount < maxSelect) {
                        // Select
                        let bSelectOk = true;

                        if (this.gameLogic.state === STATE.LOOP_EXPOSE_TILES) {
                            if (tile.suit !== SUIT.JOKER &&
                                (tile.suit !== this.gameLogic.discardTile.suit || tile.number !== this.gameLogic.discardTile.number)) {
                                bSelectOk = false;
                                this.gameLogic.displayErrorText(" Select same tile or joker to form pong/kong/quint ");
                            }
                        }

                        if (this.gameLogic.state === STATE.CHARLESTON1 || this.gameLogic.state === STATE.CHARLESTON2 ||
                            this.gameLogic.state === STATE.COURTESY) {
                            if (tile.suit === SUIT.JOKER) {
                                bSelectOk = false;
                                this.gameLogic.displayErrorText(" Joker cannot be passed during Charleston ");
                            }
                        }

                        if (bSelectOk) {
                            tile.selected = true;
                            tile.origX = tile.x;
                            tile.origY = tile.y;
                            tile.animate(tile.x, tile.y - 25, tile.angle);
                            tileSet.selectCount++;
                        }
                    }

                    if (tileSet.selectCount >= minSelect && tileSet.selectCount <= maxSelect) {
                        window.document.getElementById("button1").disabled = false;
                    } else {
                        window.document.getElementById("button1").disabled = true;
                    }
                }
            });

            // Enable drag and drop
            console.log("insertHidden() called for tile:", tile.suit, tile.number, "sprite:", tile.sprite);
            tile.sprite.setInteractive();
            this.scene.input.setDraggable(tile.sprite);
            // eslint-disable-next-line no-unused-vars
            tile.sprite.on("dragstart", (_pointer, _dragX, _dragY) => {
                tile.drag = true;
                if (!tile.selected) {
                    tile.origX = tile.x;
                    tile.origY = tile.y;
                }
            });
            tile.sprite.on("drag", (pointer, dragX, dragY) => {
                tile.sprite.x = dragX;
                tile.sprite.y = dragY;
                const overlappedTile = tileSet.checkOverlap(tile);
                if (overlappedTile) {
                    tileSet.swapTiles(tile, overlappedTile);
                }
            });
            // eslint-disable-next-line no-unused-vars
            tile.sprite.on("dragend", (_pointer, _dragX, _dragY, _dropped) => {
                tile.drag = false;
            });
        }

        tileSet.insert(tile);
    }

    removeHidden(tile) {
        // Remove tile from hidden tile set
        return this.hiddenTileSet.remove(tile);
    }

    getSelectionExposedCount() {
        let count = 0;
        for (const tileset of this.exposedTileSetArray) {
            count += tileset.getSelectionCount();
        }

        return count;
    }

    // Input - pong/kong/quint
    insertExposed(tileArray) {
        let uniqueTile = null;

        // Create new "exposed" TileSet
        const tileSet = new TileSet(this.scene, this.gameLogic, true);

        for (const tile of tileArray) {
            tileSet.insert(tile);

            if (!uniqueTile && tile.suit !== SUIT.JOKER) {
                uniqueTile = tile;
            }
        }

        // Add new TileSet to "exposed" TileSet array
        this.exposedTileSetArray.push(tileSet);

        // To support swapping for exposed jokers, add tile button press handler for jokers only
        for (const tile of tileArray) {
            if (tile.suit === SUIT.JOKER) {
                tile.sprite.setInteractive();
                tile.sprite.on("pointerup", () => {
                    let maxSelect = 1;
                    let minSelect = 1;

                    switch (this.gameLogic.state) {
                    case STATE.LOOP_CHOOSE_DISCARD:
                        maxSelect = 1;
                        minSelect = 1;
                        break;
                    default:
                        maxSelect = 0;
                        minSelect = 0;
                        break;
                    }

                    if (maxSelect) {
                        if (tile.selected) {
                            tile.x = tile.origX;
                            tile.y = tile.origY;
                            tileSet.selectCount--;
                            tile.selected = !tile.selected;
                        } else if (tileSet.selectCount < maxSelect) {
                            let bSelectOk = true;

                            if (this.gameLogic.table.players[PLAYER.BOTTOM].hand.getSelectionHiddenCount() !== 1) {
                                bSelectOk = false;
                                this.gameLogic.displayErrorText(" To swap for an exposed joker, please select a hidden tile first ");
                            } else if (this.getSelectionExposedCount() > 0) {
                                bSelectOk = false;
                                this.gameLogic.displayErrorText(" Only one joker can be selected ");
                            } else {
                                const hiddenTileArray = this.gameLogic.table.players[PLAYER.BOTTOM].hand.getSelectionHidden();
                                const hiddenTile = hiddenTileArray[0];

                                if (uniqueTile) {
                                    if (hiddenTile.suit !== uniqueTile.suit || hiddenTile.number !== uniqueTile.number) {
                                        bSelectOk = false;
                                        this.gameLogic.displayErrorText(" To swap for an exposed joker, tile must match exposed pong/kong/quint ");
                                    }
                                } else {
                                    bSelectOk = false;
                                }
                            }

                            if (bSelectOk) {
                                tile.origX = tile.x;
                                tile.origY = tile.y;

                                switch (tile.angle) {
                                case 270:
                                case -90:
                                    tile.x -= 25;
                                    break;
                                case 180:
                                case -180:
                                    tile.y += 25;
                                    break;
                                case 90:
                                case -270:
                                    tile.x += 25;
                                    break;
                                default:
                                    tile.y -= 25;
                                    break;
                                }
                                tileSet.selectCount++;
                                tile.selected = !tile.selected;
                            }
                        }

                        if (tileSet.selectCount > maxSelect || tileSet.selectCount < minSelect) {
                            window.document.getElementById("button2").disabled = true;
                        } else {
                            window.document.getElementById("button2").disabled = false;
                        }
                    }
                });
            }
        }
    }

    // Remove selected tile and reset selection (hiddenTileSet only)
    // NOTE - only call for PLAYER.BOTTOM (user)
    removeDiscard() {
        let tile = null;

        if (this.hiddenTileSet.inputEnabled) {
            // Human player (0) pressed the discard button
            const selectedTiles = this.hiddenTileSet.getSelection();
            tile = selectedTiles[0];

            // Reset selectCount
            this.hiddenTileSet.resetSelection();
        }
        // Remove tile from tile set
        this.removeHidden(tile);

        return tile;
    }


}
