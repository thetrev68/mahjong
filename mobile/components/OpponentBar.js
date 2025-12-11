import { MobileTile } from "./MobileTile.js";
import { WIND, PLAYER } from "../../constants.js";

/**
 * OpponentBar - Displays opponent info compactly
 *
 * Responsibilities:
 * - Show player name, position, tile count
 * - Display exposed sets (Pung/Kong/Quint) as icons
 * - Highlight bar when it's player's turn
 * - Update dynamically when player state changes
 */
export class OpponentBar {
    /**
     * @param {HTMLElement} container - DOM element to render into
     * @param {PlayerData} playerData - Initial player data
     */
    constructor(container, playerData) {
        this.container = container;
        this.playerData = playerData;
        this.element = null;

        this.render();
    }

    /**
     * Initial render of the opponent bar
     */
    render() {
        this.element = document.createElement("div");
        this.element.className = "opponent-bar";
        this.element.dataset.player = this.playerData.position;

        // Create inner HTML structure
        this.element.innerHTML = `
            <div class="opponent-info">
                <span class="opponent-name"></span>
                <span class="tile-count"></span>
            </div>
            <div class="exposures"></div>
        `;

        this.container.appendChild(this.element);
        this.update(this.playerData);
    }

    /**
     * Update the bar with new player data
     * @param {PlayerData} playerData - Updated player data
     */
    update(playerData) {
        if (!this.element) return;
        this.playerData = playerData;

        // Update name and position
        const nameElement = this.element.querySelector(".opponent-name");
        const windLabel = this.getWindLabel(playerData);
        nameElement.textContent = windLabel ? `${playerData.name} (${windLabel})` : playerData.name;

        // Update tile count - HIDDEN per UX improvements (will show exposures only)
        const countElement = this.element.querySelector(".tile-count");
        // const count = this.getTileCount(playerData);
        countElement.textContent = ""; // Hide tile count - exposures are visible instead

        // Update exposures
        this.updateExposures(this.getExposures(playerData));

        // Update turn indicator
        this.setCurrentTurn(playerData.isCurrentTurn);
    }

    getWindLabel(playerData = {}) {
        if (typeof playerData.wind === "string" && playerData.wind) {
            return playerData.wind;
        }
        const windValue = playerData.wind;
        const labels = {
            [WIND.NORTH]: "North",
            [WIND.SOUTH]: "South",
            [WIND.WEST]: "West",
            [WIND.EAST]: "East"
        };
        if (windValue in labels) {
            return labels[windValue];
        }
        // Fallbacks based on table seat if wind is missing
        const fallback = {
            [PLAYER.RIGHT]: "North",
            [PLAYER.TOP]: "West",
            [PLAYER.LEFT]: "South",
            [PLAYER.BOTTOM]: "East"
        };
        return fallback[playerData.position] || "";
    }

    getTileCount(playerData = {}) {
        if (typeof playerData.tileCount === "number") {
            return playerData.tileCount;
        }
        const hand = playerData.hand;
        if (!hand) return null;
        const hiddenCount = Array.isArray(hand.tiles) ? hand.tiles.length : 0;
        const exposureCount = Array.isArray(hand.exposures)
            ? hand.exposures.reduce((sum, exp) => sum + (Array.isArray(exp.tiles) ? exp.tiles.length : 0), 0)
            : 0;
        const total = hiddenCount + exposureCount;
        return total > 0 ? total : 0;
    }

    getExposures(playerData = {}) {
        if (Array.isArray(playerData.exposures)) {
            return playerData.exposures;
        }
        if (playerData.hand && Array.isArray(playerData.hand.exposures)) {
            return playerData.hand.exposures;
        }
        return [];
    }

    /**
     * Update exposed sets display
     * @param {Array} exposures - Array of {type, tiles} objects
     */
    updateExposures(exposures) {
        const exposuresContainer = this.element.querySelector(".exposures");
        exposuresContainer.innerHTML = "";

        if (!exposures || exposures.length === 0) {
            // Remove compact class if empty
            exposuresContainer.classList.remove("compact");
            return;
        }

        // Calculate total tile count to decide on compaction
        let totalTiles = 0;
        exposures.forEach(exposure => {
            if (Array.isArray(exposure.tiles)) {
                totalTiles += exposure.tiles.length;
            }
        });

        // If more than 4 tiles (wrapping expected), use compact mode
        if (totalTiles > 4) {
            exposuresContainer.classList.add("compact");
        } else {
            exposuresContainer.classList.remove("compact");
        }

        exposures.forEach(exposure => {
            exposure.tiles.forEach(tile => {
                const tileEl = MobileTile.createExposedTile(tile).createElement();
                tileEl.classList.add("exposure-icon"); // Maintain class for layout
                tileEl.title = this.getExposureTooltip(exposure);
                exposuresContainer.appendChild(tileEl);
            });
        });
    }

    /**
     * Add temporary dealing tiles to the opponent bar (for animation)
     * @param {number} tileCount - Number of tiles to add
     * @returns {HTMLElement[]} Array of created tile elements
     */
    addDealingTiles(tileCount) {
        const exposuresContainer = this.element.querySelector(".exposures");
        const tiles = [];

        for (let i = 0; i < tileCount; i++) {
            const tileEl = document.createElement("div");
            tileEl.className = "mobile-tile tile-back dealing-tile";
            tileEl.style.width = "24px";
            tileEl.style.height = "32px";
            tileEl.style.display = "inline-block";
            tileEl.style.marginRight = "2px";
            exposuresContainer.appendChild(tileEl);
            tiles.push(tileEl);
        }

        return tiles;
    }

    /**
     * Remove dealing tiles from the opponent bar
     */
    clearDealingTiles() {
        const exposuresContainer = this.element.querySelector(".exposures");
        const dealingTiles = exposuresContainer.querySelectorAll(".dealing-tile");
        dealingTiles.forEach(tile => tile.remove());
    }

    /**
     * Get short label for exposure type
     * @param {string} type - Exposure type (PUNG, KONG, QUINT)
     * @returns {string} Short label
     */
    getExposureLabel(type) {
        const labels = {
            "PUNG": "P",
            "KONG": "K",
            "QUINT": "Q"
        };
        return labels[type] || "?";
    }

    /**
     * Get tooltip text for exposure
     * @param {Object} exposure - Exposure object with type and tiles
     * @returns {string} Tooltip text
     */
    getExposureTooltip(exposure) {
        const tileNames = exposure.tiles.map(t => t.getText()).join(", ");
        return `${exposure.type}: ${tileNames}`;
    }

    /**
     * Set current turn indicator
     * @param {boolean} isCurrent - Is this player's turn?
     */
    setCurrentTurn(isCurrent) {
        if (!this.element) return;
        if (isCurrent) {
            this.element.classList.add("current-turn");
        } else {
            this.element.classList.remove("current-turn");
        }
    }

    /**
     * Destroy this component
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}
