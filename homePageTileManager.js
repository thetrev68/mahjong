import * as Phaser from "phaser";
import { Tile, gTileGroups } from "./gameObjects.js";
import { SUIT, SPRITE_WIDTH, SPRITE_HEIGHT, TILE_GAP, WINDOW_WIDTH, WINDOW_HEIGHT } from "./constants.js";
import {debugPrint} from "./utils.js";

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
            const { x, y, scale, angle } = this.generateRandomPosition();
            tile.x = x;
            tile.y = y;
            tile.scale = scale;
            tile.angle = angle;
            tile.sprite.setDepth(i); // Use index for z-depth
            tile.showTile(true, false); // Show face down
        }
    }

    generateRandomPosition() {
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

        u = 0;
        v = 0;
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
            
            // Animate to the center of the screen to form a pile
            const promise = this.animateSingleTile(tile, centerX, centerY, 0, 1500, 0);
            promises.push(promise);
        }

        Promise.all(promises).then(() => {
            debugPrint("All tiles have reached the center pile.");
            this.animationState = "piled";
            this.animatePileToWall();
        });
    }

    animatePileToWall() {
      this.animationState = "dealing";
      const promises = [];
      for (let i = 0; i < this.tileArray.length; i++) {
        const tile = this.tileArray[i];
        // Hide all tiles off-screen
        const promise = this.animateSingleTile(tile, -100, -100, 0, 500, i * 5);
        promises.push(promise);
        tile.showTile(false, false); // Hide all tiles
      }
      Promise.all(promises).then(() => {
        debugPrint("All tiles moved off-screen.");
        this.isAnimating = false;
        this.animationState = "complete";
        if (this.onAnimationComplete) this.onAnimationComplete();
      });
    }


    animateSingleTile(tile, x, y, angle, duration, delay) {
        return new Promise((resolve) => {
            const anim = {
                x: tile.x,
                y: tile.y,
                angle: tile.angle,
                scale: tile.scale
            };

            this.scene.tweens.add({
                targets: anim,
                x: x,
                y: y,
                scaleX: 0.6,
                scaleY: 0.6,
                angle: angle,
                duration: duration,
                delay: delay,
                ease: "Cubic.easeOut",
                onUpdate: () => {
                    tile.x = anim.x;
                    tile.y = anim.y;
                    tile.angle = anim.angle;
                    tile.scale = anim.scale;
                },
                onComplete: () => {
                    tile.x = x;
                    tile.y = y;
                    tile.angle = angle;
                    tile.scale = 0.6;
                    resolve();
                }
            });
        });
    }

    async transitionToWallSystem() {
        await this.wall.receiveOrganizedTilesFromHomePage(this.tileArray);
    }

    cleanup() {
        // We no longer destroy the tiles, as they have been handed off to the Wall.
        // We just clear the array to release the HomePageTileManager's reference to them.
        this.tileArray = [];
        debugPrint("HomePageTileManager cleaned up.");
    }

    // Add this new method at the end of the file
    calculatePlayerHandPositions() {
      const positions = [];
      const HAND_SCALE = 0.6;
      const TILE_W = SPRITE_WIDTH * HAND_SCALE;
      const TILE_H = SPRITE_HEIGHT * HAND_SCALE;
      // Bottom
      for (let i = 0; i < 13; i++) positions.push({x: (WINDOW_WIDTH / 2) - (6.5 * TILE_W) + (i * TILE_W), y: WINDOW_HEIGHT - TILE_H - 10, angle: 0});
      // Top
      for (let i = 0; i < 13; i++) positions.push({x: (WINDOW_WIDTH / 2) - (6.5 * TILE_W) + (i * TILE_W), y: TILE_H + 10, angle: 180});
      // Left
      for (let i = 0; i < 13; i++) positions.push({x: TILE_H + 10, y: (WINDOW_HEIGHT / 2) - (6.5 * TILE_W) + (i * TILE_W), angle: -90});
      // Right
      for (let i = 0; i < 13; i++) positions.push({x: WINDOW_WIDTH - TILE_H - 10, y: (WINDOW_HEIGHT / 2) - (6.5 * TILE_W) + (i * TILE_W), angle: 90});
      return positions;
    }
}
