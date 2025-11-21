/**
 * HintsPanel Component
 *
 * Displays AI-powered tile discard recommendations to help the player.
 * Panel can be toggled open/closed via the HINTS button.
 */
import { HandData } from "../../core/models/HandData.js";
import { renderPatternVariation } from "../../tileDisplayUtils.js";

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
        this.isExpanded = true;
        this.unsubscribeFns = [];
        this._disabled = false;
        this.latestHandData = null;

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

        // Set initial state (expanded so it's visible by default)
        this.toggleBtn.setAttribute("aria-expanded", "true");
        this.contentEl.style.display = "block";
    }

    /**
     * Setup event listeners for game events
     */
    setupListeners() {
        // Update hints when player's hand changes
        const handleHandUpdated = (data) => {
            if (data.player === 0) { // Human player only
                // Convert plain JSON object to HandData instance
                const handData = HandData.fromJSON(data.hand);
                this.updateHints(handData);
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

        this.latestHandData = handData;

        if (!handData || !handData.tiles || handData.tiles.length === 0) {
            this.clearHints();
            return;
        }

        try {
            // Rank the hand to get top patterns
            const rankCardHands = this.aiEngine.card.rankHandArray14(handData);
            // console.log("HintsPanel: rankCardHands:", rankCardHands);

            if (!rankCardHands || rankCardHands.length === 0) {
                console.log("HintsPanel: No patterns available");
                this.contentEl.innerHTML = `
                    <div class="hint-item">
                        <span class="hint-label">No patterns available</span>
                    </div>
                `;
                return;
            }

            // Get top 3 patterns sorted by rank
            const sortedPatterns = [...rankCardHands].sort((a, b) => b.rank - a.rank);
            const top3Patterns = sortedPatterns.slice(0, 3);
            console.log("HintsPanel: top3Patterns:", top3Patterns);

            const discardRecommendations = this.getDiscardRecommendations(handData);
            if (this.isExpanded) {
                this.emitDiscardRecommendations(discardRecommendations, true);
            }

            // Get all player tiles (including exposed tiles)
            const playerTiles = handData.getTileArray();
            const hiddenTiles = handData.tiles;

            // Render pattern visualizations with compact summaries
            let html = "<div class=\"hint-item\">";
            top3Patterns.forEach((rankHand, index) => {
                const patternHtml = renderPatternVariation(rankHand, playerTiles, hiddenTiles);
                const groupDesc = this.compactText(rankHand.group?.groupDescription);
                const handDesc = this.compactText(rankHand.hand?.description);
                const rank = rankHand.rank?.toFixed(2) || "0.00";
                const year = rankHand.card?.year || this.gameController.settings?.year || "";
                const concealed = rankHand.hand?.concealed === true;
                const badge = concealed ? "<span class=\"concealed-badge\" title=\"Concealed\">C</span>" : "";
                const headerParts = [year, groupDesc, handDesc].filter(Boolean);

                html += `
                    <div class="hint-pattern" title="${groupDesc}${handDesc ? " - " + handDesc : ""}">
                        <div class="hint-pattern-header">
                            <strong>${headerParts.join(" - ")}</strong>
                            <span class="hint-rank">(Rank: ${rank})</span>
                            ${badge}
                        </div>
                        ${patternHtml}
                    </div>
                `;
            });
            html += "</div>";

            this.contentEl.innerHTML = html;
        } catch (error) {
            console.error("HintsPanel: Error generating hints:", error);
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
     * Compact long text by removing parentheticals and trimming whitespace
     * @param {string} text
     * @returns {string}
     */
    compactText(text = "") {
        return text.replace(/\s*\(.*?\)/g, "").trim();
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

        if (this.isExpanded) {
            this.emitDiscardRecommendations([], false);
        }
    }

    /**
     * Toggle panel open/closed
     */
    toggle() {
        // Early return if component is disabled or DOM is missing
        if (this._disabled || !this.contentEl || !this.toggleBtn) {
            console.log("HintsPanel: toggle blocked - disabled or missing DOM");
            return;
        }

        this.isExpanded = !this.isExpanded;
        this.contentEl.style.display = this.isExpanded ? "block" : "none";
        this.toggleBtn.setAttribute("aria-expanded", String(this.isExpanded));

        if (this.isExpanded && this.latestHandData) {
            const recs = this.getDiscardRecommendations(this.latestHandData);
            this.emitDiscardRecommendations(recs, true);
        } else {
            this.emitDiscardRecommendations([], false);
        }
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

    /**
     * Compute discard recommendations using AI engine
     * @param {HandData} handData
     * @returns {Array} recommended discard tiles
     */
    getDiscardRecommendations(handData) {
        if (!handData || !this.aiEngine || typeof this.aiEngine.getTileRecommendations !== "function") {
            return [];
        }
        try {
            const result = this.aiEngine.getTileRecommendations(handData);
            if (!result || !Array.isArray(result.recommendations)) {
                return [];
            }
            return result.recommendations
                .filter((r) => r.recommendation === "DISCARD" && r.tile)
                .map((r) => r.tile);
        } catch (err) {
            console.warn("HintsPanel: getDiscardRecommendations failed:", err);
            return [];
        }
    }

    /**
     * Emit discard recommendation tiles so the hand renderer can highlight them
     * @param {Array} tiles
     * @param {boolean} active
     */
    emitDiscardRecommendations(tiles = [], active = true) {
        if (!this.gameController || typeof this.gameController.emit !== "function") {
            return;
        }
        this.gameController.emit("HINT_DISCARD_RECOMMENDATIONS", { tiles, active });
    }
}
