import { tileSprites } from "../utils/tileSprites.js";

/**
 * MobileTile
 *
 * Renders a single mahjong tile using sprite images.
 * Supports multiple sizes and states (normal, selected, disabled, highlighted).
 */
export class MobileTile {
    /**
     * @param {Object} tileData - Tile information (suit, number, index)
     * @param {Object} options - Rendering options
     * @param {number} options.width - Tile width in pixels (default: 45)
     * @param {number} options.height - Tile height in pixels (default: 60)
     * @param {string} options.state - 'normal' | 'selected' | 'disabled' | 'highlighted' (default: 'normal')
     * @param {string} options.size - 'normal' | 'small' | 'discard' (default: 'normal')
     */
    constructor(tileData, options = {}) {
        this.tileData = tileData;
        this.options = {
            width: 45,
            height: 60,
            state: "normal",
            size: "normal",
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
        // Use tileSprites to create the base element
        const div = tileSprites.createTileElement(this.tileData, this.options.size);

        // Add mobile-tile class for backward compatibility if needed,
        // but primarily rely on .tile from tileSprites
        div.classList.add("mobile-tile");

        // Set data attributes
        div.dataset.suit = this.tileData.suit;
        div.dataset.number = this.tileData.number;
        if (this.tileData.index !== undefined) {
            div.dataset.index = this.tileData.index;
        }

        // Get size-specific default dimensions
        const sizeDefaults = this._getSizeDefaults(this.options.size);

        // Apply custom dimensions if specified and different from size-specific defaults
        if (this.options.width !== sizeDefaults.width || this.options.height !== sizeDefaults.height) {
            div.style.width = `${this.options.width}px`;
            div.style.height = `${this.options.height}px`;

            // Adjust background-size to maintain sprite aspect ratio
            // Original sprite sheet: 1300px wide for 39 tiles (33.33px per tile)
            // Scale factor = custom width / original tile width
            const scaleFactor = this.options.width / 33.33;
            const backgroundWidth = Math.round(1300 * scaleFactor);
            div.style.backgroundSize = `${backgroundWidth}px auto`;
        }

        this.element = div;
        this.setState(this.options.state);
        return div;
    }

    /**
     * Get default dimensions for each semantic size
     * @param {string} size - 'normal' | 'small' | 'discard'
     * @returns {{width: number, height: number}}
     * @private
     */
    _getSizeDefaults(size) {
        const defaults = {
            normal: { width: 45, height: 60 },
            small: { width: 32, height: 42 },
            discard: { width: 30, height: 40 }
        };
        return defaults[size] || defaults.normal;
    }

    /**
     * Update the tile's visual state
     * @param {string} state - 'normal' | 'selected' | 'disabled' | 'highlighted'
     */
    setState(state) {
        this.currentState = state;

        if (!this.element) return;

        // Remove all state classes
        this.element.classList.remove("selected", "disabled", "highlighted");

        // Add new state class
        switch (state) {
            case "selected":
                this.element.classList.add("selected");
                break;
            case "disabled":
                this.element.classList.add("disabled");
                break;
            case "highlighted":
                this.element.classList.add("highlighted");
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
     * Create a hand tile (45px × 60px)
     * @param {Object} tileData - Tile information
     * @param {string} state - Visual state
     * @returns {MobileTile}
     */
    static createHandTile(tileData, state = "normal") {
        return new MobileTile(tileData, {
            size: "normal",
            state
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
            size: "small",
            state
        });
    }

    /**
     * Create a discard pile tile (30px × 40px)
     * @param {Object} tileData - Tile information
     * @param {string} state - Visual state
     * @returns {MobileTile}
     */
    static createDiscardTile(tileData, state = "normal") {
        return new MobileTile(tileData, {
            size: "discard",
            state
        });
    }
}