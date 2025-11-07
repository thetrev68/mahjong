import * as Phaser from "phaser";
import { Tile, gTileGroups } from "./gameObjects.js";
import { SUIT, SPRITE_WIDTH, SPRITE_HEIGHT, WINDOW_WIDTH, WINDOW_HEIGHT } from "./constants.js";
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
            if (Math.random() < 0.7) {
                tile.showTile(true, true);
            }
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



    async animateToPileAndStartGame() {
        this.isAnimating = true;
        this.animationState = "gathering";

        await this.animateJumpAndFlip();
        await this.animateFlyOffScreen();

        this.isAnimating = false;
        this.animationState = "complete";
        if (this.onAnimationComplete) {
            this.onAnimationComplete();
        }
    }

    animateJumpAndFlip() {
        const promises = [];
        this.tileArray.forEach((tile) => {
            promises.push(new Promise(resolve => {
                const initialY = tile.y;
                const jumpHeight = Phaser.Math.Between(5, 15);
                const delay = Phaser.Math.Between(0, 150);

                tile.withRaisedDepth(() => {
                    const timeline = this.scene.tweens.createTimeline();

                    timeline.add({
                        targets: tile,
                        y: initialY - jumpHeight,
                        scale: 0.65,
                        duration: 400,
                        ease: 'Cubic.Out',
                        delay: delay,
                    });
                    
                    timeline.add({
                        targets: tile,
                        y: initialY,
                        scale: 0.6,
                        duration: 400,
                        ease: 'Cubic.In',
                    });

                    const flipTimeline = this.scene.tweens.createTimeline();

                    flipTimeline.add({
                        targets: { scaleY: tile.sprite.scaleY },
                        scaleY: 0,
                        duration: 400,
                        ease: 'Cubic.In',
                        delay: delay,
                        onUpdate: (tween) => {
                            tile.sprite.scaleY = tween.targets[0].scaleY;
                            tile.spriteBack.scaleY = tween.targets[0].scaleY;
                        },
                        onComplete: () => {
                            tile.showTile(true, false);
                        }
                    });

                    flipTimeline.add({
                        targets: { scaleY: 0 },
                        scaleY: 0.6,
                        duration: 400,
                        ease: 'Cubic.Out',
                        onUpdate: (tween) => {
                            tile.sprite.scaleY = tween.targets[0].scaleY;
                            tile.spriteBack.scaleY = tween.targets[0].scaleY;
                        }
                    });

                    timeline.on('complete', () => resolve());
                    
                    timeline.play();
                    flipTimeline.play();

                    return timeline;
                });
            }));
        });
        return Promise.all(promises);
    }

    animateFlyOffScreen() {
        const promises = [];
        const batchSize = 20;
        const batchDelay = 150;

        for (let i = 0; i < this.tileArray.length; i += batchSize) {
            const batch = this.tileArray.slice(i, i + batchSize);
            promises.push(new Promise(resolveBatch => {
                this.scene.time.delayedCall(i / batchSize * batchDelay, () => {
                    const batchPromises = batch.map(tile => new Promise(resolveTile => {
                        const duration = Phaser.Math.Between(1200, 2000);
                        const endX = Phaser.Math.Between(-100, 0);
                        const endY = Phaser.Math.Between(-100, 0);

                        const controlX = Phaser.Math.Between(tile.x - 100, tile.x + 100);
                        const controlY = Phaser.Math.Between(tile.y - 200, tile.y);

                        const curve = new Phaser.Curves.QuadraticBezier(
                            new Phaser.Math.Vector2(tile.x, tile.y),
                            new Phaser.Math.Vector2(controlX, controlY),
                            new Phaser.Math.Vector2(endX, endY)
                        );
                        
                        const path = { t: 0, vec: new Phaser.Math.Vector2() };

                        this.scene.tweens.add({
                            targets: path,
                            t: 1,
                            duration: duration,
                            ease: 'Cubic.In',
                            onUpdate: () => {
                                curve.getPoint(path.t, path.vec);
                                tile.x = path.vec.x;
                                tile.y = path.vec.y;
                            },
                            onComplete: () => {
                                tile.showTile(false, false);
                                resolveTile();
                            }
                        });
                    }));
                    Promise.all(batchPromises).then(resolveBatch);
                });
            }));
        }

        return Promise.all(promises);
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
