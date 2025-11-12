import { SUIT } from "../../constants.js";

/**
 * MobileTile
 *
 * Renders a single mahjong tile using sprite images.
 * Supports multiple sizes and states (normal, selected, disabled, highlighted).
 */
export class MobileTile {
    // Static properties shared across all tiles
    static spritePath = null;
    static spriteData = null;
    static isLoaded = false;

    /**
     * Load sprite sheet data (call once on app init)
     * @param {string} spritePath - Path to tiles.png
     * @param {Object} spriteData - Parsed tiles.json
     */
    // eslint-disable-next-line require-await
    static async loadSprites(spritePath, spriteData) {
        MobileTile.spritePath = spritePath;
        MobileTile.spriteData = spriteData;

        // Convert frames array to frames object for easier lookup
        if (spriteData.frames && Array.isArray(spriteData.frames)) {
            const framesObject = {};
            spriteData.frames.forEach(frame => {
                framesObject[frame.filename] = {
                    frame: frame.frame,
                    sourceSize: frame.sourceSize
                };
            });
            MobileTile.spriteData.frames = framesObject;
        }

        // Preload the sprite sheet image
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                MobileTile.isLoaded = true;
                resolve();
            };
            img.onerror = () => {
                console.error("Failed to load sprite sheet");
                reject(new Error("Sprite sheet load failed"));
            };
            img.src = spritePath;
        });
    }

    /**
     * @param {Object} tileData - Tile information (suit, number, index)
     * @param {Object} options - Rendering options
     * @param {number} options.width - Tile width in pixels (default: 45)
     * @param {number} options.height - Tile height in pixels (default: 60)
     * @param {string} options.state - 'normal' | 'selected' | 'disabled' | 'highlighted' (default: 'normal')
     * @param {boolean} options.useSprites - Use sprite images vs text fallback (default: true)
     */
    constructor(tileData, options = {}) {
        this.tileData = tileData;
        this.options = {
            width: 45,
            height: 60,
            state: "normal",
            useSprites: true,
            ...options
        };
        this.element = null;
        this.currentState = this.options.state;
    }

    /**
     * Create and return the DOM element for this tile
     * @returns {HTMLElement}
     */
    createElement() {
        const div = document.createElement("button");
        div.className = "mobile-tile";
        div.dataset.suit = this.tileData.suit;
        div.dataset.number = this.tileData.number;
        div.dataset.index = this.tileData.index;

        if (this.options.useSprites && MobileTile.isLoaded) {
            const frameName = this.getSpriteFrameName();
            const frame = MobileTile.spriteData?.frames[frameName];

            div.style.width = `${this.options.width}px`;
            div.style.height = `${this.options.height}px`;
            div.style.backgroundImage = `url(${MobileTile.spritePath})`;
            
            if (frame) {
                div.style.backgroundPosition = `-${frame.frame.x}px 0px`;
                div.style.backgroundSize = `${MobileTile.spriteData.meta.size.w * this.getScale()}px auto`;
            } else {
                console.warn(`Sprite frame not found: ${frameName}, falling back to text`);
                div.textContent = this.getTileText();
            }
        } else {
            // Text fallback
            div.textContent = this.getTileText();
            div.style.width = `${this.options.width}px`;
            div.style.height = `${this.options.height}px`;
        }

        this.element = div;
        this.setState(this.options.state);
        return div;
    }

    /**
     * Update the tile's visual state
     * @param {string} state - 'normal' | 'selected' | 'disabled' | 'highlighted'
     */
    setState(state) {
        this.currentState = state;

        if (!this.element) return;

        // Remove all state classes
        this.element.classList.remove("mobile-tile--selected", "mobile-tile--disabled", "mobile-tile--highlighted");

        // Add new state class
        switch (state) {
            case "selected":
                this.element.classList.add("mobile-tile--selected");
                break;
            case "disabled":
                this.element.classList.add("mobile-tile--disabled");
                break;
            case "highlighted":
                this.element.classList.add("mobile-tile--highlighted");
                break;
            case "normal":
            default:
                // No additional class
                break;
        }
    }

    /**
     * Get the tile's data
     * @returns {Object}
     */
    getData() {
        return this.tileData;
    }

    /**
     * Destroy the tile and clean up
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }

    /**
     * Get the sprite frame name for this tile
     * @returns {string} - e.g., '1C.png', 'N.png', 'J.png'
     */
    getSpriteFrameName() {
        const { suit, number } = this.tileData;

        // Define lookup tables to avoid lexical declaration issues
        const winds = ["N", "S", "W", "E"];
        const dragons = ["DB", "DC", "DD"];

        switch (suit) {
            case SUIT.CRACK:
                return `${number}C.png`;
            case SUIT.BAM:
                return `${number}B.png`;
            case SUIT.DOT:
                return `${number}D.png`;
            case SUIT.WIND:
                // number: 0=North, 1=South, 2=West, 3=East
                return `${winds[number]}.png`;
            case SUIT.DRAGON:
                // number: 0=Red (DB), 1=Green (DC), 2=White (DD)
                return `${dragons[number]}.png`;
            case SUIT.JOKER:
                return "J.png";
            case SUIT.FLOWER:
                return `F${number + 1}.png`;  // Flowers are 1-indexed
            case SUIT.BLANK:
                return "blank.png";  // Fallback if no blank sprite
            default:
                console.error("Unknown suit:", suit);
                return "blank.png";
        }
    }

    /**
     * Get the text representation of this tile
     * @returns {string} - e.g., '5C', 'N', 'J', 'F1'
     */
    getTileText() {
        const { suit, number } = this.tileData;

        switch (suit) {
            case SUIT.CRACK:
                return `${number}C`;
            case SUIT.BAM:
                return `${number}B`;
            case SUIT.DOT:
                return `${number}D`;
            case SUIT.WIND:
                return ["N", "S", "W", "E"][number];
            case SUIT.DRAGON:
                return ["R", "G", "W"][number];
            case SUIT.JOKER:
                return "J";
            case SUIT.FLOWER:
                return `F${number + 1}`;
            case SUIT.BLANK:
                return "BL";
            default:
                return "?";
        }
    }

    /**
     * Calculate the scale factor for sprite positioning
     * @returns {number} - scale factor
     */
    getScale() {
        // Original sprite tile width: 52px
        // Desired width: this.options.width
        return this.options.width / 52;
    }

    /**
     * Create a hand tile (45px × 60px)
     * @param {Object} tileData - Tile information
     * @param {string} state - Visual state
     * @returns {MobileTile}
     */
    static createHandTile(tileData, state = "normal") {
        return new MobileTile(tileData, {
            width: 45,
            height: 60,
            state,
            useSprites: MobileTile.isLoaded
        });
    }

    /**
     * Create an exposed tile (32px × 42px)
     * @param {Object} tileData - Tile information
     * @param {string} state - Visual state
     * @returns {MobileTile}
     */
    static createExposedTile(tileData, state = "normal") {
        return new MobileTile(tileData, {
            width: 32,
            height: 42,
            state,
            useSprites: MobileTile.isLoaded
        });
    }

    /**
     * Create a discard pile tile (32px × 42px)
     * @param {Object} tileData - Tile information
     * @param {string} state - Visual state
     * @returns {MobileTile}
     */
    static createDiscardTile(tileData, state = "normal") {
        return new MobileTile(tileData, {
            width: 32,
            height: 42,
            state,
            useSprites: MobileTile.isLoaded
        });
    }
}