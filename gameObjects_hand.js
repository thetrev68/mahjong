import * as Phaser from "phaser";
import {
    STATE, PLAYER, SUIT, SPRITE_WIDTH,
    SPRITE_SCALE, WINDOW_WIDTH, WINDOW_HEIGHT, TILE_GAP
} from "./constants.js";

// PRIVATE CONSTANTS


// PRIVATE GLOBALS


class TileSet {
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

        // SIMPLE: Reset all tiles to grid level (600)
        for (const tile of this.tileArray) {
            if (tile.selected) {
                tile.selected = false;
                tile.x = tile.origX;
                tile.y = 600; // Always park at grid level
                tile.origY = 600; // Always park at grid level
                
                // Update sprite position immediately
                tile.sprite.y = 600;
                
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
            console.log(`showTileSet: Animating tile ${tile.getText()} to x=${x}, y=${y}, angle=${playerInfo.angle}`);
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
             
            const intersectRect = Phaser.Geom.Rectangle.Intersection(tileBounds, tempTile.sprite.getBounds());
            const area = intersectRect.width * intersectRect.height;

            if (area && (area > maxarea) && ((area / tileArea) > 0.7)) {
                maxarea = area;
                overlappedTile = tempTile;
            }
        }

        return overlappedTile;
    }


}

export class Hand {
    constructor(scene, gameLogic, inputEnabled) {
        this.scene = scene;
        this.gameLogic = gameLogic;
        this.hiddenTileSet = new TileSet(scene, gameLogic, inputEnabled);
        this.exposedTileSetArray = [];
        // Track if tiles were dragged this turn to avoid showHand() interference
        this.tilesWereDraggedThisTurn = false;
        // Properties for visual insertion feedback
        this.insertionFeedbackGhost = null;
        this.insertionFeedbackLine = null;
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

        // Note: We don't copy insertion feedback properties since they're ephemeral
        // and only exist during active drag operations

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
        
        // Clean up any visual insertion feedback that might be active
        this.clearInsertionFeedback();
        
        // Reset drag tracking flag
        this.tilesWereDraggedThisTurn = false;
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
        console.log("Hand.showHand called. playerInfo:", playerInfo, "forceFaceup:", forceFaceup);
        // Calculate starting position for all tiles in hand
        let x = playerInfo.x;
        let y = playerInfo.y;

        const handWidth = this.getHandWidth(playerInfo);
        const tileWidth = this.hiddenTileSet.getTileWidth(playerInfo);

        console.log(`Hand.showHand: Initial x=${x}, y=${y}, handWidth=${handWidth}, tileWidth=${tileWidth}`);

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

    // Helper to calculate the grid position for a tile at a given index
    calculateTilePosition(playerInfo, index) {
        const handWidth = this.getHandWidth(playerInfo);
        const tileWidth = this.hiddenTileSet.getTileWidth(playerInfo);
        const tileGap = TILE_GAP;

        let startX = 0;
        let startY = 0;

        switch (playerInfo.id) {
            case PLAYER.BOTTOM:
                startX = (WINDOW_WIDTH / 2) - (handWidth / 2) + (tileWidth / 2);
                return {
                    x: startX + (index * (tileWidth + tileGap)),
                    y: playerInfo.y
                };
            case PLAYER.TOP:
                startX = (WINDOW_WIDTH / 2) + (handWidth / 2) - (tileWidth / 2);
                return {
                    x: startX - (index * (tileWidth + tileGap)),
                    y: playerInfo.y
                };
            case PLAYER.LEFT:
                startY = (WINDOW_HEIGHT / 2) - (handWidth / 2) + (tileWidth / 2);
                return {
                    x: playerInfo.x,
                    y: startY + (index * (tileWidth + tileGap))
                };
            case PLAYER.RIGHT:
            default:
                startY = (WINDOW_HEIGHT / 2) + (handWidth / 2) - (tileWidth / 2);
                return {
                    x: playerInfo.x,
                    y: startY - (index * (tileWidth + tileGap))
                };
        }
    }

    // Helper method to determine insertion index based on drag position
    getInsertionIndex(dragX, tileArray, draggedTile) {
        let filteredIndex = 0;
        
        console.log(`getInsertionIndex: dragX=${dragX}, checking ${tileArray.length} tiles`);
        
        for (let i = 0; i < tileArray.length; i++) {
            const currentTile = tileArray[i];
            if (currentTile === draggedTile) {
                console.log(`Skipping dragged tile: ${currentTile.getText()}`);
                continue;
            }
            
            // Use the actual current visual position of the tile
            const tileVisualX = currentTile.x;
            
            console.log(`getInsertionIndex: comparing dragX ${dragX} with tile ${currentTile.getText()} at x=${tileVisualX}`);
            
            if (dragX < tileVisualX) {
                console.log(`getInsertionIndex: returning index ${filteredIndex}`);
                return filteredIndex;
            }
            filteredIndex++;
        }
        
        console.log(`getInsertionIndex: returning end index ${filteredIndex}`);
        return filteredIndex;
    }

    // Helper method to show visual insertion feedback
    showInsertionFeedback(insertionIndex, tileArray, draggedTile, dragX) {
        console.log(`Showing insertion feedback at index ${insertionIndex} for dragX ${dragX}`);
        
        // Clear any existing feedback first
        this.clearInsertionFeedback();
        
        // Only show feedback if we have a valid insertion index
        if (insertionIndex >= 0 && insertionIndex < tileArray.length) {
            const currentPlayerInfo = this.gameLogic.table.players[PLAYER.BOTTOM].playerInfo;
            const tileWidth = this.hiddenTileSet.getTileWidth(currentPlayerInfo);
            const tileGap = TILE_GAP;
            
            // Calculate position between tiles (not on tile centers)
            const insertionPosition = this.calculateInsertionPosition(currentPlayerInfo, insertionIndex, tileWidth, tileGap);
            
            console.log("Insertion position calculated:", insertionPosition.x, insertionPosition.y);
            
            // Create a visual indicator (ghost tile or gap marker)
            const ghostTile = this.scene.add.rectangle(
                insertionPosition.x,
                insertionPosition.y,
                SPRITE_WIDTH * 0.6, // Smaller ghost for gap indication
                SPRITE_WIDTH * 1.4,
                0x00ff00,
                0.2
            );
            ghostTile.setStrokeStyle(1, 0x00aa00);
            ghostTile.setDepth(200);
            
            // Store the ghost tile for cleanup
            this.insertionFeedbackGhost = ghostTile;
            
            // Create a vertical line to mark the insertion point (between tiles)
            const lineLength = SPRITE_WIDTH * 1.6;
            const insertionLine = this.scene.add.line(
                0, 0,
                insertionPosition.x, insertionPosition.y - lineLength/2,
                insertionPosition.x, insertionPosition.y + lineLength/2,
                0x00ff00,
                0.8
            );
            insertionLine.setDepth(201);
            
            // Store the line for cleanup
            this.insertionFeedbackLine = insertionLine;
            
            console.log("Visual insertion feedback created at", insertionPosition.x, insertionPosition.y);
        } else {
            console.log("Invalid insertion index, no feedback shown");
        }
    }

    // Helper method to calculate insertion position between tiles
    calculateInsertionPosition(playerInfo, insertionIndex, tileWidth, tileGap) {
        const insertionPosition = { x: 0, y: playerInfo.y };
        
        if (insertionIndex === 0) {
            // Inserting at beginning - position before first tile
            const firstTilePos = this.calculateTilePosition(playerInfo, 0);
            insertionPosition.x = firstTilePos.x - (tileWidth + tileGap) / 2;
        } else if (insertionIndex === this.hiddenTileSet.tileArray.length) {
            // Inserting at end - position after last tile
            const lastTilePos = this.calculateTilePosition(playerInfo, this.hiddenTileSet.tileArray.length - 1);
            insertionPosition.x = lastTilePos.x + (tileWidth + tileGap) / 2;
        } else {
            // Inserting between tiles - position between two tiles
            const leftTilePos = this.calculateTilePosition(playerInfo, insertionIndex - 1);
            const rightTilePos = this.calculateTilePosition(playerInfo, insertionIndex);
            insertionPosition.x = (leftTilePos.x + rightTilePos.x) / 2;
        }
        
        return insertionPosition;
    }

    // Helper method to clear visual insertion feedback
    clearInsertionFeedback() {
        // Remove ghost tile if it exists
        if (this.insertionFeedbackGhost) {
            this.insertionFeedbackGhost.destroy();
            this.insertionFeedbackGhost = null;
        }
        
        // Remove insertion line if it exists
        if (this.insertionFeedbackLine) {
            this.insertionFeedbackLine.destroy();
            this.insertionFeedbackLine = null;
        }
    }

    // Simplified method to reposition all tiles after drag operation
    repositionTilesAfterDrag(playerInfo) {
        console.log("Repositioning all tiles after drag operation");
        
        // Reposition each tile based on its current array index - SIMPLE Y positioning
        for (let i = 0; i < this.hiddenTileSet.tileArray.length; i++) {
            const tile = this.hiddenTileSet.tileArray[i];
            const targetPos = this.calculateTilePosition(playerInfo, i);
            
            // Update both current position and orig position - HARDCODE Y
            tile.x = targetPos.x;
            tile.y = 600; // Always park at grid level
            tile.origX = targetPos.x;
            tile.origY = 600; // Always park at grid level
            
            // Update sprite position immediately to avoid visual jump
            tile.sprite.y = 600;
            
            // Animate to the new position
            tile.animate(targetPos.x, targetPos.y, playerInfo.angle);
            
            console.log(`Positioned tile ${tile.getText()} at index ${i}: x=${targetPos.x}, y=600`);
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
                        // SIMPLE DESELECT: Click toggles selection state
                        tile.selected = false;
                        const playerObject = this.gameLogic.table.players[PLAYER.BOTTOM];
                        tile.animate(tile.origX, 600, playerObject.angle); // Always park at 600
                        tileSet.selectCount--;
                    } else if (tileSet.selectCount < maxSelect) {
                        // SIMPLE SELECT: Click toggles selection state
                        const playerObject = this.gameLogic.table.players[PLAYER.BOTTOM];
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
                            tile.animate(tile.origX, 575, playerObject.angle); // Always elevate to 575
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
                console.log("=== DRAGSTART ===");
                
                tile.drag = true;
                this.tilesWereDraggedThisTurn = true;

                // Clear any existing visual insertion feedback first
                this.clearInsertionFeedback();

                // Store current index for drag operation
                const currentTileIndex = tileSet.tileArray.indexOf(tile);
                if (currentTileIndex === -1) {
                    console.error("ERROR: Tile not found in tileArray during dragstart!");
                    return;
                }
                tile.originalIndex = currentTileIndex; // Store original index

                // Bring the dragged tile to the top visually
                tile.sprite.setDepth(100);
                if (tile.spriteBack) {
                    tile.spriteBack.setDepth(100);
                }

                console.log("Drag started for tile:", tile.getText(), "at index:", tile.originalIndex);
                console.log("=== DRAGSTART END ===");
            });
            tile.sprite.on("drag", (pointer, dragX, dragY) => {
                if (!pointer) {
                    console.warn("Drag event received null pointer");
                    return;
                }
                // Update dragged tile's position
                tile.x = dragX;
                tile.y = dragY;

                // Show visual insertion feedback during drag
                const insertionIndex = this.getInsertionIndex(dragX, tileSet.tileArray, tile);
                this.showInsertionFeedback(insertionIndex, tileSet.tileArray, tile, dragX);
            });
            // eslint-disable-next-line no-unused-vars
tile.sprite.on("dragend", (_pointer, dragX, _dragY, _dropped) => {
                console.log("=== DRAGEND START ===");
                console.log("Dragged Tile:", tile.getText());
                console.log("Original Index:", tile.originalIndex);
                
                // COMPREHENSIVE COORDINATE DEBUGGING
                console.log("=== MOUSE COORDINATE DEBUGGING ===");
                console.log("Phaser pointer worldX:", _pointer.worldX);
                console.log("Phaser pointer worldY:", _pointer.worldY);
                console.log("Phaser pointer x:", _pointer.x);
                console.log("Phaser pointer y:", _pointer.y);
                console.log("Phaser dragX parameter:", dragX);
                console.log("Phaser dragY parameter:", _dragY);
                console.log("Sprite world position x:", tile.sprite.worldX);
                console.log("Sprite world position y:", tile.sprite.worldY);
                console.log("Sprite screen position x:", tile.sprite.x);
                console.log("Sprite screen position y:", tile.sprite.y);
                console.log("Scene camera scrollX:", tile.sprite.scene.cameras.main.scrollX);
                console.log("Scene camera scrollY:", tile.sprite.scene.cameras.main.scrollY);
                console.log("Scene camera zoom:", tile.sprite.scene.cameras.main.zoom);
                console.log("Scene game scale:", tile.sprite.scene.scale);
                console.log("Scene game canvas width:", tile.sprite.scene.scale.gameSize.width);
                console.log("Scene game canvas height:", tile.sprite.scene.scale.gameSize.height);
                console.log("=== END COORDINATE DEBUGGING ===");
                
                tile.drag = false;

                // Clear visual insertion feedback
                this.clearInsertionFeedback();

                // CLAMP DRAG POSITION TO HAND BOUNDARIES
                // Calculate hand boundaries based on current tile positions
                const handTiles = tileSet.tileArray.filter(t => t !== tile);
                let minX = Math.min(...handTiles.map(t => t.x)) - 30; // 30 pixels margin
                let maxX = Math.max(...handTiles.map(t => t.x)) + 30; // 30 pixels margin
                
                // Ensure we have valid boundaries
                if (!isFinite(minX) || !isFinite(maxX)) {
                    minX = 100;
                    maxX = 900;
                }
                
                // IMPORTANT: Phaser's dragX parameter is often incorrect!
                // Use the actual sprite position instead, which matches the visual position
                const actualDragX = tile.sprite.x;
                console.log("Using actual sprite position instead of dragX parameter");
                console.log(`dragX parameter: ${dragX} (unreliable)`);
                console.log(`sprite.x position: ${actualDragX} (reliable)`);
                
                // Clamp the drag position to the hand area
                const clampedDragX = Math.max(minX, Math.min(maxX, actualDragX));
                console.log(`DragX clamped from ${actualDragX} to ${clampedDragX} (bounds: ${minX} to ${maxX})`);
                
                // Handle undefined dragX/dragY by falling back to current position
                const finalDragX = dragX !== undefined ? clampedDragX : tile.x;

                let finalTargetIndex = tileSet.tileArray.length; // Default to end of hand

                // Determine the final insertion index based on final drag position
                // Use the actual current visual positions of tiles
                const currentArrayLength = tileSet.tileArray.length;
                let filteredIndex = 0;
                finalTargetIndex = currentArrayLength; // Default to end
                
                console.log(`Calculating insertion for dragX ${finalDragX}`);
                console.log(`Current tile array length: ${currentArrayLength}`);
                
                for (let i = 0; i < currentArrayLength; i++) {
                    const currentTile = tileSet.tileArray[i];
                    
                    if (currentTile === tile) {
                        console.log(`Skipping dragged tile at index ${i}`);
                        continue; // Skip the dragged tile itself
                    }
                    
                    // Use the actual current visual position of the tile
                    const tileVisualX = currentTile.x;
                    
                    console.log(`Comparing dragX ${finalDragX} with tile ${currentTile.getText()} at index ${i}: x=${tileVisualX}`);
                    
                    if (finalDragX < tileVisualX) {
                        finalTargetIndex = filteredIndex;
                        console.log(`Setting finalTargetIndex to ${finalTargetIndex} (before tile ${currentTile.getText()})`);
                        break;
                    }
                    filteredIndex++;
                }
                
                console.log(`Final target index determined: ${finalTargetIndex}`);

                // Adjust target index if the tile is being moved from right to left
                // and the original index was before the target index
                if (tile.originalIndex < finalTargetIndex) {
                    finalTargetIndex--;
                }

                // Ensure target index is within valid bounds
                finalTargetIndex = Math.max(0, Math.min(finalTargetIndex, tileSet.tileArray.length - 1));

                console.log("Final Target Index:", finalTargetIndex);
                console.log("tileSet.tileArray BEFORE:", tileSet.tileArray.map(t => t.getText()));

                // CRITICAL DEBUG: Log the exact insertion decision
                console.log("=== CRITICAL INSERTION DEBUG ===");
                console.log(`Dragged tile: ${tile.getText()}`);
                console.log(`Dragged from index: ${tile.originalIndex}`);
                console.log(`Trying to insert at index: ${finalTargetIndex}`);
                console.log(`Drag X position: ${finalDragX}`);
                
                // Show where each tile currently is
                tileSet.tileArray.forEach((t, idx) => {
                    console.log(`Tile ${idx}: ${t.getText()} at x=${t.x}`);
                });
                console.log("=== END CRITICAL DEBUG ===");

                // Perform array manipulation safely
                try {
                    // Remove the dragged tile from its original position
                    const removedTile = tileSet.tileArray.splice(tile.originalIndex, 1)[0];
                    
                    if (!removedTile || removedTile !== tile) {
                        console.error("ERROR: Failed to remove correct tile from array!");
                        console.log("Expected:", tile.getText(), "Got:", removedTile ? removedTile.getText() : "null");
                        // Restore tile to original position and return
                        tile.x = tile.origX;
                        tile.y = tile.origY;
                        return;
                    }

                    console.log("Successfully removed tile from index", tile.originalIndex);

                    // Insert the dragged tile at the new position
                    tileSet.tileArray.splice(finalTargetIndex, 0, tile);
                    
                    console.log("Successfully inserted tile at index", finalTargetIndex);
                    console.log("tileSet.tileArray AFTER:", tileSet.tileArray.map(t => t.getText()));
                    
                    // CRITICAL: Verify the tile ended up where we expected
                    const newIndex = tileSet.tileArray.indexOf(tile);
                    console.log(`*** VERIFICATION: Dragged tile is now at index ${newIndex} ***`);
                    
                } catch (error) {
                    console.error("ERROR during array manipulation:", error);
                    // Restore tile to original position on error
                    tile.x = tile.origX;
                    tile.y = tile.origY;
                    return;
                }

                // CRITICAL: Position the tile at the target location after successful array manipulation
                const currentPlayerInfo = this.gameLogic.table.players[PLAYER.BOTTOM].playerInfo;
                const finalPos = this.calculateTilePosition(currentPlayerInfo, finalTargetIndex);
                
                // Update origX/origY BEFORE positioning to prevent other animations from overriding
                tile.origX = finalPos.x;
                tile.origY = finalPos.y;
                tile.x = finalPos.x;
                tile.y = finalPos.y;
                console.log(`Positioned dragged tile at final position: x=${finalPos.x}, y=${finalPos.y} (index ${finalTargetIndex})`);

                // Reset tile depth to normal level
                tile.sprite.setDepth(0);
                if (tile.spriteBack) {
                    tile.spriteBack.setDepth(0);
                }

                // Clear any remaining selection state - always park at grid level
                if (tile.selected) {
                    tile.selected = false;
                    tileSet.selectCount--; // CRITICAL: Also decrement selectCount
                }
                
                // SIMPLE: Always park dragged tiles at grid level (600)
                // Remove complex Y positioning calculations - just use hardcoded values
                tile.x = finalPos.x;
                tile.y = 600; // Always park at grid level
                tile.origX = finalPos.x;
                tile.origY = 600; // Always park at grid level
                
                // Update sprite position immediately to avoid visual jump
                tile.sprite.y = 600;
                
                // Now animate to final position
                tile.animate(tile.x, tile.y, currentPlayerInfo.angle);
                
                // Reposition all tiles - they will all be at 600 anyway
                this.repositionTilesAfterDrag(currentPlayerInfo);

                console.log(`Final Y position correction: tile.y=${tile.y}, tile.origY=${tile.origY}, currentPlayerInfo.y=${currentPlayerInfo.y}`);
                
                console.log("=== DRAGEND COMPLETE - drag operation finished ===");
                
                console.log("=== DRAGEND END ===");
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
                            // SIMPLE: Reset to original position
                            tile.x = tile.origX;
                            tile.y = 600; // Always park at grid level
                            tile.origY = 600; // Always park at grid level
                            tile.sprite.y = 600;
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
                                tile.origY = 600; // Always park at grid level

                                // Simple elevated positioning for exposed jokers
                                tile.y = 575; // Always elevate to 575
                                tile.sprite.y = 575;
                                
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
