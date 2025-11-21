import { TileData } from "../../core/models/TileData.js";
import { MobileTile } from "./MobileTile.js";

/**
 * DiscardPile - Displays discarded tiles in center area
 *
 * Responsibilities:
 * - Render discards in 9-column grid
 * - Highlight most recent discard (yellow border + pulse)
 * - Scroll vertically when more than ~108 tiles
 * - Allow clicking discards to see who discarded them
 */
export class DiscardPile {
    /**
     * @param {HTMLElement} container - DOM element to render into
     * @param {GameController} gameController - Core game controller instance
     */
    constructor(container, gameController = null) {
        this.container = container;
        this.gameController = gameController;
        this.discards = []; // Array of {tile: TileData, player: number}
        this.element = null;
        this.eventUnsubscribers = [];
        this._onResize = this.updateTileSizing.bind(this);

        this.render();
        if (this.gameController) {
            this.setupEventListeners();
        }
    }

    /**
     * Initial render of discard pile
     */
    render() {
        this.element = document.createElement("div");
        this.element.className = "discard-pile";
        this.container.appendChild(this.element);
        this.updateTileSizing();
        window.addEventListener("resize", this._onResize, { passive: true });
    }

    /**
     * Set up GameController event subscriptions
     */
    setupEventListeners() {
        if (!this.gameController || typeof this.gameController.on !== "function") {
            return;
        }
        this.eventUnsubscribers.push(
            this.gameController.on("TILE_DISCARDED", (data) => {
                const tile = TileData.fromJSON(data.tile);
                this.addDiscard(tile, data.player);
            })
        );

        this.eventUnsubscribers.push(
            this.gameController.on("DISCARD_CLAIMED", () => {
                this.removeLatestDiscard();
            })
        );

        this.eventUnsubscribers.push(
            this.gameController.on("GAME_STARTED", () => {
                this.clear();
            })
        );
    }

    /**
     * Add a discard to the pile
     * @param {TileData} tile - The discarded tile
     * @param {number} player - Player who discarded (0-3)
     */
    addDiscard(tile, player) {
        // Add to discards array
        this.discards.push({ tile, player });

        // Create tile element
        const tileElement = this.createDiscardTile(tile, player);
        this.element.appendChild(tileElement);

        // Mark as latest discard
        this.highlightLatest(tileElement);

        // Scroll to latest if needed
        this.scrollToLatest();
    }

    /**
     * Create a tile element for the discard pile
     * @param {TileData} tile - Tile data
     * @param {number} player - Player who discarded
     * @returns {HTMLElement} Tile element
     */
    createDiscardTile(tile, player) {
        // Use MobileTile to create the element
        const tileElement = MobileTile.createDiscardTile(tile).createElement();

        // Add discard-tile class for existing styles/logic if needed, 
        // though MobileTile adds 'tile tile--discard'
        tileElement.classList.add("discard-tile");

        tileElement.dataset.player = player;
        tileElement.title = `Discarded by ${this.getPlayerName(player)}`;

        // Click to show discard info
        tileElement.addEventListener("click", () => {
            this.showDiscardInfo(tile, player);
        });

        return tileElement;
    }

    /**
     * Get tile text for display
     * @param {TileData} tile - Tile data
     * @returns {string} Display text
     */
    getTileText(tile) {
        // Use TileData.getText() method
        return tile.getText();
    }

    /**
     * Get player name from position
     * @param {number} player - Player position (0-3)
     * @returns {string} Player name
     */
    getPlayerName(player) {
        const names = ["You", "Opponent 1", "Opponent 2", "Opponent 3"];
        return names[player] || "Unknown";
    }

    /**
     * Highlight the latest discard
     * @param {HTMLElement} tileElement - The latest tile element
     */
    highlightLatest(tileElement) {
        // Remove highlight from all tiles
        this.element.querySelectorAll(".discard-tile").forEach(tile => {
            tile.classList.remove("latest");
        });

        // Add highlight to latest tile
        tileElement.classList.add("latest");
    }

    /**
     * Remove the latest discard (when claimed by another player)
     */
    removeLatestDiscard() {
        if (this.discards.length > 0) {
            this.discards.pop();
            const lastTile = this.element.querySelector(".discard-tile:last-child");
            if (lastTile) {
                lastTile.remove();
            }
        }
    }

    getLatestDiscardElement() {
        return this.element.querySelector(".discard-tile:last-child");
    }

    /**
     * Show info about a discarded tile
     * @param {TileData} tile - The tile
     * @param {number} player - Who discarded it
     */
    showDiscardInfo(tile, player) {
        // Simple alert for now (can be enhanced with modal later)
        // eslint-disable-next-line no-undef
        alert(`${tile.getText()}\nDiscarded by: ${this.getPlayerName(player)}`);
    }

    /**
     * Scroll to bottom of discard pile
     */
    scrollToLatest() {
        this.element.scrollTo({
            top: this.element.scrollHeight,
            left: this.element.scrollWidth,
            behavior: "smooth"
        });
    }

    updateTileSizing() {
        if (!this.container || !this.element) return;
        const containerWidth = this.container.clientWidth || window.innerWidth;
        const gap = 4;
        const padding = 8;
        const tileWidth = Math.max(
            26,
            Math.floor((containerWidth - (8 * gap) - (2 * padding)) / 9)
        );
        this.element.style.setProperty("--discard-tile-width", `${tileWidth}px`);
        this.element.style.setProperty("--discard-gap", `${gap}px`);
        this.element.style.setProperty("--discard-padding", `${padding}px`);
    }

    /**
     * Clear all discards
     */
    clear() {
        this.discards = [];
        this.element.innerHTML = "";
    }

    /**
     * Destroy this component
     */
    destroy() {
        this.eventUnsubscribers.forEach(unsub => unsub());
        this.eventUnsubscribers = [];
        window.removeEventListener("resize", this._onResize);
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
