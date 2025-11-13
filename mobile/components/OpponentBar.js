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
        nameElement.textContent = `${playerData.name} (${this.getPositionName(playerData.position)})`;

        // Update tile count
        const countElement = this.element.querySelector(".tile-count");
        const count = playerData.tileCount;
        countElement.textContent = `${count} tile${count !== 1 ? "s" : ""}`;

        // Update exposures
        this.updateExposures(playerData.exposures);

        // Update turn indicator
        this.setCurrentTurn(playerData.isCurrentTurn);
    }

    /**
     * Get human-readable position name
     * @param {number} position - Player position (1=Right, 2=Top, 3=Left)
     * @returns {string} Position name
     */
    getPositionName(position) {
        const positions = ["Bottom", "East", "North", "West"];
        return positions[position] || "Unknown";
    }

    /**
     * Update exposed sets display
     * @param {Array} exposures - Array of {type, tiles} objects
     */
    updateExposures(exposures) {
        const exposuresContainer = this.element.querySelector(".exposures");
        exposuresContainer.innerHTML = "";

        if (!exposures || exposures.length === 0) {
            return; // No exposures to display
        }

        exposures.forEach(exposure => {
            const icon = document.createElement("span");
            icon.className = `exposure-icon ${exposure.type.toLowerCase()}`;
            icon.textContent = this.getExposureLabel(exposure.type);
            icon.title = this.getExposureTooltip(exposure);
            exposuresContainer.appendChild(icon);
        });
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