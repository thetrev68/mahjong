import { TileData } from "../../core/models/TileData.js";
import { tileSprites } from "../utils/tileSprites.js";

/**
 * DiscardSelectionModal - Modal overlay for selecting a tile from the discard pile
 *
 * Used for blank tile swap feature - allows user to visually select which
 * discard tile they want to exchange for their blank.
 */
export class DiscardSelectionModal {
    /**
     * @param {TileData[]} discards - Array of available discard tiles
     * @param {Function} onSelect - Callback when tile selected: (tileData) => void
     * @param {Function} onCancel - Callback when cancelled: () => void
     */
    constructor(discards, onSelect, onCancel) {
        this.discards = discards;
        this.onSelect = onSelect;
        this.onCancel = onCancel;
        this.element = null;
        this.render();
    }

    /**
     * Create and show the modal
     */
    render() {
        // Create modal overlay
        this.element = document.createElement("div");
        this.element.className = "discard-selection-modal";
        this.element.innerHTML = `
            <div class="discard-selection-modal__backdrop"></div>
            <div class="discard-selection-modal__content">
                <div class="discard-selection-modal__header">
                    <h2 class="discard-selection-modal__title">Select a tile from discards</h2>
                    <p class="discard-selection-modal__hint">Tap a tile to exchange with your blank</p>
                </div>
                <div class="discard-selection-modal__grid"></div>
                <div class="discard-selection-modal__footer">
                    <button class="discard-selection-modal__cancel">Cancel</button>
                </div>
            </div>
        `;

        // Populate grid with tiles
        const grid = this.element.querySelector(".discard-selection-modal__grid");
        this.discards.forEach((tile, index) => {
            const tileElement = this.createTileElement(tile, index);
            grid.appendChild(tileElement);
        });

        // Wire cancel button
        const cancelBtn = this.element.querySelector(".discard-selection-modal__cancel");
        cancelBtn.addEventListener("click", () => this.close(null));

        // Wire backdrop click to cancel
        const backdrop = this.element.querySelector(".discard-selection-modal__backdrop");
        backdrop.addEventListener("click", () => this.close(null));

        // Add to DOM
        document.body.appendChild(this.element);

        // Trigger animation
        requestAnimationFrame(() => {
            this.element.classList.add("discard-selection-modal--visible");
        });
    }

    /**
     * Create a clickable tile element
     * @param {TileData} tile - Tile data
     * @param {number} index - Tile index in discards array
     * @returns {HTMLElement}
     */
    createTileElement(tile, index) {
        const button = document.createElement("button");
        button.className = "discard-selection-modal__tile";
        button.dataset.index = index;
        button.title = tile.getText(); // Accessibility via tooltip

        // Create tile visual using tileSprites (default size)
        const tileDiv = tileSprites.createTileElement(tile);

        button.appendChild(tileDiv);

        // Wire click handler
        button.addEventListener("click", () => this.close(tile));

        return button;
    }

    /**
     * Close modal and invoke callback
     * @param {TileData|null} selectedTile - Selected tile or null if cancelled
     */
    close(selectedTile) {
        // Fade out animation
        this.element.classList.remove("discard-selection-modal--visible");

        // Wait for animation, then remove from DOM
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }

            // Invoke callback
            if (selectedTile) {
                this.onSelect(selectedTile);
            } else {
                this.onCancel();
            }
        }, 300); // Match CSS transition duration
    }
}
