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
        this.isExpanded = true; // Start expanded (panel visible by default)
        this.unsubscribeFns = [];
        this._disabled = false;
        this.latestHandData = null;

        // Bind toggle handler so we can properly remove it later
        this._onToggle = this.toggle.bind(this);

        // Touch gesture tracking
        this.touchStartY = 0;
        this.touchStartX = 0;
        this._onTouchStart = this.handleTouchStart.bind(this);
        this._onTouchEnd = this.handleTouchEnd.bind(this);

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

        // Setup swipe gestures on the toggle button
        this.toggleBtn.addEventListener("touchstart", this._onTouchStart, { passive: true });
        this.toggleBtn.addEventListener("touchend", this._onTouchEnd);

        // Set initial state (expanded with skeleton to reserve space)
        this.toggleBtn.setAttribute("aria-expanded", "true");
        this.contentEl.style.display = "block";

        // Show skeleton immediately to reserve layout space
        this.showSkeletonHints();
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

        // Only show skeleton and compute if panel is expanded
        // If collapsed, we'll show skeleton when user expands
        if (this.isExpanded) {
            this.showSkeletonHints();
            // Delay computation to keep skeleton visible and prevent layout jump
            setTimeout(() => {
                this.computeAndRenderHints(handData);
            }, 300); // 300ms delay to show skeleton
        }
    }

    /**
     * Show skeleton/placeholder hints to reserve layout space
     * This prevents layout shift when real hints load
     */
    showSkeletonHints() {
        if (this._disabled || !this.contentEl) {
            return;
        }

        console.log("HintsPanel.showSkeletonHints: Rendering skeleton HTML");
        // Create 3 skeleton pattern blocks with empty content
        // This reserves the vertical space so hand doesn't jump
        let html = "<div class=\"hint-item\">";
        for (let i = 0; i < 3; i++) {
            html += `
                <div class="hint-pattern hint-pattern-skeleton">
                    <div class="hint-pattern-header">
                        <strong>&nbsp;</strong>
                        <span class="hint-rank">&nbsp;</span>
                    </div>
                    <div class="hint-pattern-tiles" style="min-height: 32px;">&nbsp;</div>
                </div>
            `;
        }
        html += "</div>";

        this.contentEl.innerHTML = html;
        console.log("HintsPanel.showSkeletonHints: Skeleton HTML set");
    }

    /**
     * Compute and render actual hints (async operation)
     * @param {HandData} handData - Player's hand data
     */
    computeAndRenderHints(handData) {
        // Early return if component is disabled or DOM is missing
        if (this._disabled || !this.contentEl) {
            return;
        }

        console.log("HintsPanel.computeAndRenderHints: Starting computation");
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

            // Get AI recommendations to determine which patterns are actually being considered
            // Pass minDiscardableOverride=1 for hints during normal play (only need 1 tile to discard)
            const recommendationResult = this.aiEngine.getTileRecommendations(handData, 1);
            const consideredPatternCount = recommendationResult.consideredPatternCount;
            console.log("HintsPanel: consideredPatternCount:", consideredPatternCount);

            const discardRecommendations = recommendationResult.recommendations
                .filter((r) => r.recommendation === "DISCARD" && r.tile)
                .map((r) => r.tile);

            if (this.isExpanded) {
                this.emitDiscardRecommendations(discardRecommendations, true);
            }

            // Get all player tiles (including exposed tiles) for pattern matching
            const playerTiles = handData.getAllTilesIncludingExposures();
            const hiddenTiles = handData.tiles;

            // Render pattern visualizations with compact summaries
            let html = "<div class=\"hint-item\">";
            top3Patterns.forEach((rankHand, index) => {
                // Pattern #1 (index 0) is never dimmed
                // Patterns beyond consideredPatternCount are dimmed
                const isConsidered = index === 0 || index < consideredPatternCount;
                const dimStyle = isConsidered ? "" : "opacity: 0.4;";
                const notConsideredLabel = !isConsidered && index > 0 ? " <em>(not considered)</em>" : "";

                const patternHtml = renderPatternVariation(rankHand, playerTiles, hiddenTiles);
                const groupDesc = this.compactText(rankHand.group?.groupDescription);
                const handDesc = this.compactText(rankHand.hand?.description);
                const rank = rankHand.rank?.toFixed(2) || "0.00";
                const year = rankHand.card?.year || this.gameController.settings?.year || "";
                const concealed = rankHand.hand?.concealed === true;
                const badge = concealed ? "<span class=\"concealed-badge\" title=\"Concealed\">C</span>" : "";
                const headerParts = [year, groupDesc, handDesc].filter(Boolean);

                html += `
                    <div class="hint-pattern" style="${dimStyle}" title="${groupDesc}${handDesc ? " - " + handDesc : ""}">
                        <div class="hint-pattern-header">
                            <strong>${headerParts.join(" - ")}</strong>
                            <span class="hint-rank">(Rank: ${rank})${notConsideredLabel}</span>
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
     * Handle touch start for swipe detection
     */
    handleTouchStart(event) {
        if (event.touches.length > 0) {
            this.touchStartY = event.touches[0].clientY;
            this.touchStartX = event.touches[0].clientX;
        }
    }

    /**
     * Handle touch end for swipe detection
     */
    handleTouchEnd(event) {
        if (event.changedTouches.length > 0) {
            const touchEndY = event.changedTouches[0].clientY;
            const touchEndX = event.changedTouches[0].clientX;
            const deltaY = touchEndY - this.touchStartY;
            const deltaX = touchEndX - this.touchStartX;

            // Detect vertical swipe (more vertical than horizontal movement)
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 30) {
                event.preventDefault();

                if (deltaY < 0 && !this.isExpanded) {
                    // Swipe up to expand
                    this.expand();
                } else if (deltaY > 0 && this.isExpanded) {
                    // Swipe down to collapse
                    this.collapse();
                }
            }
        }
    }

    /**
     * Toggle panel open/closed
     */
    toggle() {
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    /**
     * Expand hints panel
     */
    expand() {
        // Early return if component is disabled or DOM is missing
        if (this._disabled || !this.contentEl || !this.toggleBtn) {
            return;
        }

        console.log("HintsPanel.expand: EXPANDING PANEL");
        this.isExpanded = true;
        this.contentEl.style.display = "block";
        this.toggleBtn.setAttribute("aria-expanded", "true");

        if (this.latestHandData) {
            console.log("HintsPanel.expand: Showing skeleton...");
            // Show skeleton immediately when expanding
            this.showSkeletonHints();

            // Compute and render actual hints asynchronously with delay
            // (computeAndRenderHints already handles discard recommendations)
            setTimeout(() => {
                console.log("HintsPanel.expand: Computing real hints...");
                this.computeAndRenderHints(this.latestHandData);
            }, 500); // 500ms delay to show skeleton before computing
        }
    }

    /**
     * Collapse hints panel
     */
    collapse() {
        // Early return if component is disabled or DOM is missing
        if (this._disabled || !this.contentEl || !this.toggleBtn) {
            return;
        }

        this.isExpanded = false;
        this.contentEl.style.display = "none";
        this.toggleBtn.setAttribute("aria-expanded", "false");
        this.emitDiscardRecommendations([], false);
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
        if (this.toggleBtn) {
            if (this._onToggle) {
                this.toggleBtn.removeEventListener("click", this._onToggle);
            }
            if (this._onTouchStart) {
                this.toggleBtn.removeEventListener("touchstart", this._onTouchStart);
            }
            if (this._onTouchEnd) {
                this.toggleBtn.removeEventListener("touchend", this._onTouchEnd);
            }
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
