import * as Phaser from "phaser";
import {SUIT, SPRITE_HEIGHT, SPRITE_WIDTH, TILE_GAP, WINDOW_WIDTH, WINDOW_HEIGHT, getTotalTileCount} from "./constants.js";
import {debugPrint} from "./utils.js";

// PRIVATE CONSTANTS


// PRIVATE GLOBALS

export const gTileGroups = [
    {
        suit: SUIT.CRACK,
        textArray: ["Crack"],
        prefix: ["C"],
        maxNum: 9,
        count: 4
    },
    {
        suit: SUIT.BAM,
        textArray: ["Bam"],
        prefix: ["B"],
        maxNum: 9,
        count: 4
    },
    {
        suit: SUIT.DOT,
        textArray: ["Dot"],
        prefix: ["D"],
        maxNum: 9,
        count: 4
    },
    {
        suit: SUIT.WIND,
        textArray: ["North", "South", "West", "East"],
        prefix: [
            "N",
            "S",
            "W",
            "E"
        ],
        maxNum: 1,
        count: 4
    },
    {
        suit: SUIT.DRAGON,
        textArray: ["Red dragon", "Green dragon", "White dragon"],
        prefix: [
            "DC",
            "DB",
            "DD"
        ],
        maxNum: 1,
        count: 4
    },
    {
        suit: SUIT.FLOWER,
        textArray: ["Flower"],
        prefix: [
            "F1",
            "F2",
            "F3",
            "F4",
            "F1",
            "F2",
            "F3",
            "F4"
        ],
        maxNum: 1,
        count: 1
    },
    {
        suit: SUIT.JOKER,
        textArray: ["Joker"],
        prefix: "J",
        maxNum: 1,
        count: 8
    },
    {
        suit: SUIT.BLANK,
        textArray: ["Blank"],
        prefix: ["BLANK"],
        maxNum: 1,
        count: 8
    }
];;

export class Tile {
    constructor(scene, suit, number, spriteName) {
        this.scene = scene;
        this.suit = suit;
        this.number = number;
        this.sprite = null;
        this.spriteName = spriteName;
        this.origX = 0;
        this.origY = 0;
        this.selected = false;
        this.tween = null;
        // Glow effect properties
        this.glowEffect = null;
        // Default red glow
        this.glowColor = 0xff0000;
        this.glowIntensity = 0.6;
        this.glowPriority = 0;
    }

    create() {
        // For blank tiles, use the back sprite instead of tiles sprite sheet
        if (this.suit === SUIT.BLANK) {
            this.sprite = this.scene.add.sprite(0, 0, "back");
        } else {
            this.sprite = this.scene.add.sprite(0, 0, "tiles", this.spriteName);
        }
        // console.log("Tile.create() called for tile:", this.suit, this.number, "sprite:", this.sprite);
        this.sprite.visible = false;
        this.sprite.setOrigin(0.5, 0.5);

        this.spriteBack = this.scene.add.sprite(0, 0, "back");
        this.spriteBack.visible = false;
        this.spriteBack.setOrigin(0.5, 0.5);

        // Create rounded corner mask with proper scaling
        const maskGraphics = this.scene.add.graphics();
        maskGraphics.fillStyle(0xffffff);
        let maskSizeW = SPRITE_WIDTH;
        let maskSizeH = SPRITE_HEIGHT;
        const cornerRadius = 6;

        // Reduce mask size for scaled tiles to prevent white overlap
        if (this.sprite.scaleX < 1.0 || this.sprite.scaleY < 1.0) {
            maskSizeW = SPRITE_WIDTH - TILE_GAP;
            maskSizeH = SPRITE_HEIGHT - TILE_GAP;
        }

        maskGraphics.fillRoundedRect(-maskSizeW / 2, -maskSizeH / 2, maskSizeW, maskSizeH, cornerRadius);
        const mask = maskGraphics.createGeometryMask();
        this.sprite.setMask(mask);
        this.spriteBack.setMask(mask);
        this.mask = mask;
    }

    get x() {
        return this.sprite.x;
    }

    get y() {
        return this.sprite.y;
    }

    get angle() {
        return this.sprite.angle;
    }

    set x(x) {
        this.sprite.x = x;
        this.spriteBack.x = x;
        if (this.mask) {
            this.mask.geometryMask.x = x;
        }
    }

    set y(y) {
        this.sprite.y = y;
        this.spriteBack.y = y;
        if (this.mask) {
            this.mask.geometryMask.y = y;
        }
    }

    set angle(angle) {
        this.sprite.angle = angle;
        this.spriteBack.angle = angle;

        // Rotate mask geometry to match tile rotation
        if (this.mask && this.mask.geometryMask) {
            this.mask.geometryMask.angle = angle;
        }
    }

    get scale() {
        return this.sprite.scale;
    }

    set scale(scale) {
        this.sprite.setScale(scale);
        this.spriteBack.setScale(scale);

        // Update mask for scaled tiles - scale the mask geometry too
        if (this.mask && this.mask.geometryMask) {
            this.mask.geometryMask.setScale(scale);
        }

        // UPDATE GLOW FOR SCALE CHANGES
        this.updateGlowPosition();
    }

    animate(x, y, angle, fixedDuration = null) {
        debugPrint("Tile.animate called for:", this.getText(), "this.sprite:", this.sprite);
        if (!this.sprite || !this.sprite.scene) {
            console.error("Tile.animate: this.sprite is undefined, null, or destroyed for tile:", this.getText());
            return; // Prevent further errors
        }
        const speed = 1500;
        const distance = Math.hypot(x - this.sprite.x, y - this.sprite.y);
        const time = fixedDuration !== null ? fixedDuration : (distance * 1000 / speed);

        if (this.tween) {
            this.tween.stop();
        }

        return this.withRaisedDepth(() => {
            const tweenConfig = {
                targets: this.sprite,
                x,
                y,
                duration: time,
                ease: "Linear",
                onUpdate: () => {
                    this.spriteBack.x = this.sprite.x;
                    this.spriteBack.y = this.sprite.y;
                    this.spriteBack.angle = this.sprite.angle;
                    if (this.mask && this.mask.geometryMask) {
                        this.mask.geometryMask.x = this.sprite.x;
                        this.mask.geometryMask.y = this.sprite.y;
                        this.mask.geometryMask.angle = this.sprite.angle;
                    }
                    // UPDATE GLOW POSITION DURING ANIMATION
                    this.updateGlowPosition();
                },
                onComplete: () => {
                    this.sprite.x = x;
                    this.sprite.y = y;
                    this.sprite.angle = angle;
                    this.spriteBack.x = x;
                    this.spriteBack.y = y;
                    this.spriteBack.angle = angle;
                    if (this.mask && this.mask.geometryMask) {
                        this.mask.geometryMask.x = x;
                        this.mask.geometryMask.y = y;
                        this.mask.geometryMask.angle = angle;
                    }
                    this.tween = null;
                    // FINAL GLOW POSITION UPDATE
                    this.updateGlowPosition();
                }
            };

            if (Phaser.Math.Angle.Wrap(this.sprite.angle) !== Phaser.Math.Angle.Wrap(angle)) {
                tweenConfig.angle = angle;
            }

            this.tween = this.scene.tweens.add(tweenConfig);
            return this.tween;
        });
    }

    withRaisedDepth(tweenFactory) {
        const base = Math.max(1, this.sprite.depth);
        const raiseBy = 100;
        this._raisedDepthCount = (this._raisedDepthCount ?? 0) + 1;
        const targetDepth = base + raiseBy;
        this.sprite.depth = targetDepth;
        this.spriteBack.depth = targetDepth;
        if (this.glowEffect) this.glowEffect.setDepth(targetDepth - 1);

        const tween = tweenFactory(targetDepth);
        tween.once("complete", () => {
            this._raisedDepthCount -= 1;
            if (this._raisedDepthCount === 0) {
                this.sprite.depth = base;
                this.spriteBack.depth = base;
                if (this.glowEffect) this.glowEffect.setDepth(base - 1);
            }
        });
        return tween;
    }

    // Called at game update time
    tweenUpdateCallback() {
        // Make sure tile back sprite is also updated
        this.spriteBack.x = this.sprite.x;
        this.spriteBack.y = this.sprite.y;
        this.spriteBack.angle = this.sprite.angle;
    }

    showTile(visible, faceUp) {
        this.sprite.visible = false;
        this.spriteBack.visible = false;

        if (visible) {
            if (faceUp) {
                this.sprite.visible = true;
            } else {
                this.spriteBack.visible = true;
            }
        }

        // UPDATE GLOW VISIBILITY
        this.updateGlowPosition();

        // Debug - all tiles face up
        // eslint-disable-next-line no-constant-condition
        if (false) {
            this.sprite.visible = visible;
            this.spriteBack.visible = false;
        }
    }

    getText() {
        if (this.suit === SUIT.INVALID) {
            return "Invalid";
        }
        const group = gTileGroups[this.suit];
        let text = null;

        if (group.textArray.length === 1) {
            text = group.textArray[0];
        } else {
            text = group.textArray[this.number];
        }

        if (group.maxNum !== 1) {
            text = this.number + " " + text;
        }

        return text;
    }

    // Dynamic glow effect methods
    addGlowEffect(scene, color = 0xff0000, intensity = 0.6, priority = 0) {
        // Priority system: higher priority glows override lower priority ones
        // Blue new-tile glow (priority 10) > Red hint glow (priority 0)
        if (this.glowEffect && this.glowPriority > priority) {
            // Don't override a higher priority glow
            return;
        }

        this.removeGlowEffect();

        this.glowColor = color;
        this.glowIntensity = intensity;
        this.glowPriority = priority;

        // Create glow effect that will be positioned dynamically
        this.glowEffect = scene.add.graphics();
        this.updateGlowPosition();

        // Set depth below tile but above background
        this.glowEffect.setDepth(this.sprite.depth - 1);
    }

    // Update glow position and appearance dynamically
    updateGlowPosition() {
        if (!this.glowEffect) {
            return;
        }

        this.glowEffect.clear();

        if (!this.sprite.visible) {
            this.glowEffect.setVisible(false);

            return;
        }

        this.glowEffect.setVisible(true);
        this.glowEffect.fillStyle(this.glowColor, this.glowIntensity);

        const bounds = this.sprite.getBounds();
        const glowSize = 8;

        // Account for tile scale in glow size
        const scaleFactor = this.sprite.scaleX;
        const scaledGlowSize = glowSize * scaleFactor;

        this.glowEffect.fillRoundedRect(
            bounds.x - (scaledGlowSize / 2),
            bounds.y - (scaledGlowSize / 2),
            bounds.width + scaledGlowSize,
            bounds.height + scaledGlowSize,
            10 * scaleFactor
        );

        // Update depth to match tile
        this.glowEffect.setDepth(this.sprite.depth - 1);
    }

    removeGlowEffect() {
        if (this.glowEffect) {
            this.glowEffect.destroy();
            this.glowEffect = null;
            this.glowPriority = 0; // Reset priority when removing glow
        }
    }
}


export class Wall {
    constructor(scene) {
        this.scene = scene;
        this.tileArray = [];
    }

    create(skipTileCreation = false) {
        if (skipTileCreation) {
            return;
        }
        // Create all tiles (152 base + 8 blanks if enabled)
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
                        this.insert(tile);
                    }
                }
            }
        }

        debugPrint("Wall.create: Number of tiles = " + this.tileArray.length);
    }

    destroy() {
        // Intentionally empty
    }

    receiveOrganizedTilesFromHomePage(homePageTiles) {
        return new Promise((resolve, reject) => {
            // Phase 2: Dynamic tile count based on settings (152 or 160)
            const expectedTileCount = getTotalTileCount();
            if (homePageTiles.length !== expectedTileCount) {
                console.error("Wall.receiveOrganizedTilesFromHomePage: Invalid tile count. Expected " + expectedTileCount + ", got " + homePageTiles.length);
                return reject("Invalid tile count");
            }

            // Clear existing tiles if any
            if (this.tileArray.length > 0) {
                this.tileArray = [];
            }

            this.tileArray = homePageTiles;
            debugPrint("Wall received " + homePageTiles.length + " tiles from HomePageTileManager.");
            resolve();
        });
    }

    getCount() {
        return this.tileArray.length;
    }

    findAndRemove(findTile) {
        for (const tile of this.tileArray) {
            if (tile.suit === findTile.suit && tile.number === findTile.number) {
                // Remove tile from array
                const index = this.tileArray.indexOf(tile);
                this.tileArray.splice(index, 1);

                return tile;
            }
        }

        return null;
    }

    insert(tile) {
        tile.showTile(false, false);
        this.tileArray.push(tile);
    }

    remove() {
        const tile = this.tileArray.pop();

        return tile;
    }

    shuffle() {
        // Fisher-Yates shuffle
        const array = this.tileArray;
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }


}

export class Discards {
    constructor() {
        this.tileArray = [];
        this.selectionEnabled = false;
        this.selectionCallback = null;
    }

    insertDiscard(tile) {
        this.tileArray.push(tile);
    }

    showDiscards() {
      if (this.tileArray.length === 0) return;
      const centerX = WINDOW_WIDTH / 2;
      const centerY = WINDOW_HEIGHT / 2 - 100;
      const DISCARD_SCALE = 0.5;
      const tilesPerRow = 17; // Increased from 14 to 17 for more tiles per row
      const tileSpacing = SPRITE_WIDTH * DISCARD_SCALE + TILE_GAP;
      const totalWidth = Math.min(this.tileArray.length, tilesPerRow) * tileSpacing - TILE_GAP;
      let currentX = centerX - totalWidth / 2;
      let currentY = centerY;
      let rowCount = 0;
      for (const tile of this.tileArray) {
        tile.animate(currentX, currentY, 0);
        tile.scale = DISCARD_SCALE;
        tile.showTile(true, true);
        // Set discard pile depth below pending claim tiles (which use depth 200)
        tile.sprite.depth = 50;
        tile.spriteBack.depth = 50;
        currentX += tileSpacing;
        if (++rowCount >= tilesPerRow) {
          rowCount = 0;
          currentX = centerX - totalWidth / 2;
          currentY += SPRITE_HEIGHT * DISCARD_SCALE + TILE_GAP;
        }
      }
    }

    getSelectableDiscards() {
        // Return array of tiles in discard pile that aren't jokers
        return this.tileArray.filter(tile => tile.suit !== SUIT.JOKER);
    }

    enableDiscardSelection(onSelectCallback) {
        // Make non-joker discard tiles clickable
        this.selectionEnabled = true;
        this.selectionCallback = onSelectCallback;

        for (const tile of this.getSelectableDiscards()) {
            // Add pointer events to enable clicking
            tile.sprite.setInteractive();
            tile.sprite.on("pointerup", () => {
                if (this.selectionEnabled && this.selectionCallback) {
                    this.selectionCallback(tile);
                }
            });

            // Visual feedback - highlight selectable tiles
            tile.sprite.setTint(0xffff00); // Yellow tint to indicate selectable
        }
    }

    disableDiscardSelection() {
        // Disable discard selection and remove visual feedback
        this.selectionEnabled = false;
        this.selectionCallback = null;

        for (const tile of this.tileArray) {
            // Remove click handler and tint
            tile.sprite.clearTint();
            tile.sprite.removeInteractive();
            tile.sprite.off("pointerup");
        }
    }

    removeDiscardTile(tile) {
        // Remove specific tile from discard pile
        const index = this.tileArray.indexOf(tile);
        if (index > -1) {
            this.tileArray.splice(index, 1);
            // Remove sprite from display
            tile.sprite.destroy();
            if (tile.spriteBack) {
                tile.spriteBack.destroy();
            }
        }
    }
}
