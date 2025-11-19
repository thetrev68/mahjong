/**
 * HintsPanel Component
 *
 * Displays AI-powered tile discard recommendations to help the player.
 * Panel can be toggled open/closed via the HINTS button.
 */
export class HintsPanel {
    /**
     * @param {HTMLElement} container - DOM element containing the hints panel
     * @param {GameController} gameController - Game controller instance
     * @param {AIEngine} aiEngine - AI engine for recommendations
     */
    constructor(container, gameController, aiEngine) {
        if (!container) {
            throw new Error("HintsPanel requires a container element");
        }
        if (!gameController) {
            throw new Error("HintsPanel requires a gameController instance");
        }
        if (!aiEngine) {
            throw new Error("HintsPanel requires an aiEngine instance");
        }

        this.container = container;
        this.gameController = gameController;
        this.aiEngine = aiEngine;
        this.isExpanded = false;
        this.unsubscribeFns = [];
        this._disabled = false;

        // Bind toggle handler so we can properly remove it later
        this._onToggle = this.toggle.bind(this);

        this.render();
        this.setupListeners();
    }

    /**
     * Initial render and setup
     */
    render() {
        this.toggleBtn = this.container.querySelector("#hints-toggle");
        this.contentEl = this.container.querySelector("#hints-content");

        if (!this.toggleBtn || !this.contentEl) {
            console.error("HintsPanel: Missing required DOM elements");
            this._disabled = true;
            // Clean up any subscriptions that were already set up
            this.destroy();
            return;
        }

        // Setup toggle button with bound handler
        this.toggleBtn.addEventListener("click", this._onToggle);

        // Set initial state (collapsed)
        this.contentEl.style.display = "none";
    }

    /**
     * Setup event listeners for game events
     */
    setupListeners() {
        // Update hints when player's hand changes
        const handleHandUpdated = (data) => {
            if (data.player === 0) { // Human player only
                this.updateHints(data.hand);
            }
        };
        this.unsubscribeFns.push(
            this.gameController.on("HAND_UPDATED", handleHandUpdated)
        );

        // Clear hints when game ends
        const handleGameEnded = () => {
            this.clearHints();
        };
        this.unsubscribeFns.push(
            this.gameController.on("GAME_ENDED", handleGameEnded)
        );
    }

    /**
     * Update hints based on current hand
     * @param {HandData} handData - Player's hand data
     */
    updateHints(handData) {
        // Early return if component is disabled or DOM is missing
        if (this._disabled || !this.contentEl) {
            return;
        }

        if (!handData || !handData.tiles || handData.tiles.length === 0) {
            this.clearHints();
            return;
        }

        try {
            // Get AI recommendations for which tiles to keep/discard
            const recommendations = this.aiEngine.getTileRecommendations(handData);

            if (!recommendations || recommendations.length === 0) {
                this.contentEl.innerHTML = `
                    <div class="hint-item">
                        <span class="hint-label">No recommendations available</span>
                    </div>
                `;
                return;
            }

            // Show top 3 discard recommendations
            const top3 = recommendations.slice(0, 3);

            this.contentEl.innerHTML = `
                <div class="hint-item">
                    <span class="hint-label">Best Discards:</span>
                    <div class="hint-patterns">
                        ${top3.map(rec => `
                            <div class="hint-pattern">
                                ${this.formatTile(rec.tile)} - Keep Value: ${rec.keepValue?.toFixed(2) || "N/A"}
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error("HintsPanel: Error getting tile recommendations:", error);
            this.contentEl.innerHTML = `
                <div class="hint-item">
                    <span class="hint-label">Unable to generate hints</span>
                </div>
            `;
        }
    }

    /**
     * Format a tile for display
     * @param {Object} tile - Tile data
     * @returns {string}
     */
    formatTile(tile) {
        if (!tile) return "Unknown";

        // Use getText if available, otherwise format manually
        if (typeof tile.getText === "function") {
            return tile.getText();
        }

        // Manual formatting based on tile type
        const { suit, number } = tile;

        if (suit === 0 || suit === "CRACK") return `${number}C`;
        if (suit === 1 || suit === "BAM") return `${number}B`;
        if (suit === 2 || suit === "DOT") return `${number}D`;
        if (suit === 3 || suit === "WIND") {
            const winds = ["N", "S", "W", "E"];
            return winds[number] || `W${number}`;
        }
        if (suit === 4 || suit === "DRAGON") {
            const dragons = ["Red", "Green", "White"];
            return dragons[number] || `D${number}`;
        }
        if (suit === 5 || suit === "FLOWER") return `F${number + 1}`;
        if (suit === 6 || suit === "JOKER") return "J";

        return `${suit}-${number}`;
    }

    /**
     * Clear all hints
     */
    clearHints() {
        // Early return if component is disabled or DOM is missing
        if (this._disabled || !this.contentEl) {
            return;
        }

        this.contentEl.innerHTML = `
            <div class="hint-item">
                <span class="hint-label">Play to see recommendations</span>
            </div>
        `;
    }

    /**
     * Toggle panel open/closed
     */
    toggle() {
        // Early return if component is disabled or DOM is missing
        if (this._disabled || !this.contentEl || !this.toggleBtn) {
            return;
        }

        this.isExpanded = !this.isExpanded;
        this.contentEl.style.display = this.isExpanded ? "block" : "none";
        this.toggleBtn.setAttribute("aria-expanded", String(this.isExpanded));
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        // Unsubscribe from all game events
        this.unsubscribeFns.forEach(unsub => {
            if (typeof unsub === "function") {
                unsub();
            }
        });
        this.unsubscribeFns = [];

        // Remove toggle button listener using the bound handler
        if (this.toggleBtn && this._onToggle) {
            this.toggleBtn.removeEventListener("click", this._onToggle);
        }

        // Mark as disabled
        this._disabled = true;

        // Clear references
        this.container = null;
        this.gameController = null;
        this.aiEngine = null;
        this.toggleBtn = null;
        this.contentEl = null;
        this._onToggle = null;
    }
}
