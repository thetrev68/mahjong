import * as Phaser from "phaser";
import {SUIT, SPRITE_HEIGHT, SPRITE_WIDTH, TILE_GAP} from "./constants.js";

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
    }
];

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
    }

    create() {
        this.sprite = this.scene.add.sprite(0, 0, "tiles", this.spriteName);
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

    animate(x, y, angle) {
        console.log("Tile.animate called for:", this.getText(), "this.sprite:", this.sprite);
        if (!this.sprite || !this.sprite.scene) {
            console.error("Tile.animate: this.sprite is undefined, null, or destroyed for tile:", this.getText());
            return; // Prevent further errors
        }
        const speed = 750;
        const distance = Math.hypot(x - this.sprite.x, y - this.sprite.y);
        const time = (distance * 1000 / speed);

        if (this.tween) {
            this.tween.stop();
        }

        // Save current depth to restore after animation
        const savedDepth = this.sprite.depth;
        this.sprite.depth = Math.max(1, savedDepth);
        this.spriteBack.depth = Math.max(1, savedDepth);

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
                this.sprite.depth = savedDepth;
                this.spriteBack.depth = savedDepth;
                this.tween = null;
                // FINAL GLOW POSITION UPDATE
                this.updateGlowPosition();
            }
        };

         
        if (Phaser.Math.Angle.Wrap(this.sprite.angle) !== Phaser.Math.Angle.Wrap(angle)) {
            tweenConfig.angle = angle;
        }

        this.tween = this.scene.tweens.add(tweenConfig);
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
    addGlowEffect(scene, color = 0xff0000, intensity = 0.6) {
        this.removeGlowEffect();

        this.glowColor = color;
        this.glowIntensity = intensity;

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
                        this.insert(tile);
                    }
                }
            }
        }

        console.log("Wall.create: Number of tiles = " + this.tileArray.length);
    }

    destroy() {
        // Intentionally empty
    }

    receiveOrganizedTilesFromHomePage(homePageTiles) {
        return new Promise((resolve, reject) => {
            if (homePageTiles.length !== 152) {
                console.error("Wall.receiveOrganizedTilesFromHomePage: Invalid tile count. Expected 152, got " + homePageTiles.length);
                return reject("Invalid tile count");
            }

            // Clear existing tiles if any
            if (this.tileArray.length > 0) {
                this.tileArray = [];
            }

            this.tileArray = homePageTiles;
            console.log("Wall received 152 tiles from HomePageTileManager.");
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

    showWall() {
        const WALL_SCALE = 0.6;

        // Calculate positions for all wall tiles
        let offsetX = 200;
        let offsetY = 200;
        for (const tile of this.tileArray) {
            // Tile.x = offsetX;
            // Tile.y = offsetY;
            // Tile.angle = 0;
            tile.animate(offsetX, offsetY, 0);
            offsetX += (SPRITE_WIDTH * WALL_SCALE) + TILE_GAP;

            if (offsetX > 800) {
                offsetX = 200;
                offsetY += (SPRITE_HEIGHT * WALL_SCALE) + TILE_GAP;
            }
        }

        // Return position where discarded tiles should start
        if (offsetX !== 200) {
            offsetY += (SPRITE_HEIGHT * WALL_SCALE) + TILE_GAP;
        }

        return {offsetX: 200,
            offsetY};
    }

    showWallBack() {
        const WALL_SCALE = 0.6;

        // Calculate positions for all wall tiles (face down)
        let offsetX = 200;
        let offsetY = 200;
        for (const tile of this.tileArray) {
            tile.animate(offsetX, offsetY, 0);
            // This will update the mask
            tile.scale = WALL_SCALE;
            // Show face down
            tile.showTile(true, false);

            offsetX += (SPRITE_WIDTH * WALL_SCALE) + TILE_GAP;

            if (offsetX > 800) {
                offsetX = 200;
                offsetY += (SPRITE_HEIGHT * WALL_SCALE) + TILE_GAP;
            }
        }
    }
}

export class Discards {
    constructor() {
        this.tileArray = [];
    }

    insertDiscard(tile) {
        this.tileArray.push(tile);
    }

    showDiscards(offsetX, offsetY) {
        // Calculate positions for all discarded tiles
        let currentOffsetX = offsetX;
        let currentOffsetY = offsetY;
        for (const tile of this.tileArray) {
            const DISCARD_SCALE = 0.6;
            // Tile.x = currentOffsetX;
            // Tile.y = currentOffsetY;
            // Tile.angle = 0;
            tile.sprite.setDepth(0);
            tile.spriteBack.setDepth(0);
            tile.animate(currentOffsetX, currentOffsetY, 0);
            tile.scale = DISCARD_SCALE;
            tile.showTile(true, true);

            currentOffsetX += (SPRITE_WIDTH * DISCARD_SCALE) + TILE_GAP;

            if (currentOffsetX > 800) {
                currentOffsetX = 200;
                currentOffsetY += (SPRITE_HEIGHT * DISCARD_SCALE) + TILE_GAP;
            }
        }
    }
}
