import * as Phaser from "phaser";
import { Tile, gTileGroups } from "./gameObjects.js";
import { SUIT, SPRITE_WIDTH, SPRITE_HEIGHT, TILE_GAP } from "./constants.js";

export class HomePageTileManager {
    constructor(scene, wall) {
        this.scene = scene;
        this.wall = wall;
        this.tileArray = [];
        this.animationState = "idle";
        this.isAnimating = false;
        this.onAnimationComplete = null;
    }

    createScatteredTiles() {
        // Create all 152 tiles
        for (const group of gTileGroups) {
            for (const prefix of group.prefix) {
                for (let num = 1; num <= group.maxNum; num++) {
                    let number = num;
                    if (group.maxNum === 1) {
                        if (group.suit === SUIT.FLOWER) {
                            // Number is irrelevant for flowers
                            number = 0;
                        } else {
                            number = group.prefix.indexOf(prefix);
                        }
                    }
                    let spriteName = prefix;
                    if (group.maxNum !== 1) {
                        spriteName = num + spriteName;
                    }
                    spriteName += ".png";

                    // Create duplicate tiles
                    for (let j = 0; j < group.count; j++) {
                        const tile = new Tile(this.scene, group.suit, number, spriteName);
                        tile.create();
                        this.tileArray.push(tile);
                    }
                }
            }
        }

        // Now, position them randomly
        for (let i = 0; i < this.tileArray.length; i++) {
            const tile = this.tileArray[i];
            const { x, y, scale, angle } = this.generateRandomPosition(i);
            tile.x = x;
            tile.y = y;
            tile.scale = scale;
            tile.angle = angle;
            tile.sprite.setDepth(i); // Use index for z-depth
            tile.showTile(true, false); // Show face down
        }
    }

    generateRandomPosition(tileIndex) {
        // The goal is a "dumped pile" look, clustered in the center.
        // We can use a Gaussian distribution to achieve this.
        const centerX = this.scene.sys.game.config.width / 2;
        const centerY = this.scene.sys.game.config.height / 2;
        const spreadX = 200; // Standard deviation for X
        const spreadY = 100; // Standard deviation for Y

        // Basic Box-Muller transform for a normal distribution.
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

        const x = centerX + (num * spreadX);

        u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

        const y = centerY + (num * spreadY);


        const scale = Phaser.Math.FloatBetween(0.55, 0.65);
        const angle = Phaser.Math.Between(-90, 90);

        return { x, y, scale, angle };
    }

    calculateStackPosition(tileIndex) {
        // Use same logic as Wall.showWallBack()
        const WALL_SCALE = 0.6;

        let offsetX = 200;
        let offsetY = 200;

        // Calculate position for this tile in the grid
        for (let i = 0; i <= tileIndex; i++) {
            if (i === tileIndex) break; // This is our target position

            offsetX += (SPRITE_WIDTH * WALL_SCALE) + TILE_GAP;
            if (offsetX > 800) {
                offsetX = 200;
                offsetY += (SPRITE_HEIGHT * WALL_SCALE) + TILE_GAP;
            }
        }

        return {
            x: offsetX,
            y: offsetY,
            angle: 0, // Standard orientation
            scale: WALL_SCALE // 0.6 standard game scale
        };
    }

    animateToPileAndStartGame() {
        this.isAnimating = true;
        this.animationState = "gathering";

        const promises = [];
        const centerX = this.scene.sys.game.config.width / 2;
        const centerY = this.scene.sys.game.config.height / 2;

        for (let i = 0; i < this.tileArray.length; i++) {
            const tile = this.tileArray[i];
            const targetPos = this.calculateStackPosition(i);

            // Calculate distance from center to create a spiral-in effect
            const distance = Phaser.Math.Distance.Between(tile.x, tile.y, centerX, centerY);
            const delay = distance * 2; // Adjust multiplier for desired effect

            const promise = this.animateSingleTile(tile, targetPos.x, targetPos.y, 0, 1500, delay);
            promises.push(promise);
        }

        Promise.all(promises).then(() => {
            console.log("All tiles have reached their destination.");
            this.isAnimating = false;
            this.animationState = "complete";
            if (this.onAnimationComplete) {
                this.onAnimationComplete();
            }
        });
    }

    animateSingleTile(tile, x, y, angle, duration, delay) {
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: tile.sprite,
                x: x,
                y: y,
                scaleX: 0.6,
                scaleY: 0.6,
                angle: angle,
                duration: duration,
                delay: delay,
                ease: 'Cubic.easeOut',
                onUpdate: () => {
                    tile.spriteBack.x = tile.sprite.x;
                    tile.spriteBack.y = tile.sprite.y;
                    tile.spriteBack.angle = tile.sprite.angle;
                    tile.spriteBack.scaleX = tile.sprite.scaleX;
                    tile.spriteBack.scaleY = tile.sprite.scaleY;
                },
                onComplete: () => {
                    resolve();
                }
            });
        });
    }

    transitionToWallSystem() {
        this.wall.receiveOrganizedTilesFromHomePage(this.tileArray);
    }

    cleanup() {
        // We no longer destroy the tiles, as they have been handed off to the Wall.
        // We just clear the array to release the HomePageTileManager's reference to them.
        this.tileArray = [];
        console.log("HomePageTileManager cleaned up.");
    }
}
