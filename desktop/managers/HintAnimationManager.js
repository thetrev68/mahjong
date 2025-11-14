/**
 * HintAnimationManager - Manages hint display and glow effects for player tiles
 * Extracted from legacy gameLogic.js during Phase 3 refactor
 *
 * Phase 3.5 Refactoring:
 * - Moved from root to desktop/managers/
 * - Updated to receive aiEngine, card, scene, table directly (not gameLogicStub)
 * - No longer depends on gameLogic stub
 */

import {debugPrint, printHint} from "../../utils.js";
import {PLAYER, SUIT, VNUMBER} from "../../constants.js";
import {TileData} from "../../core/models/TileData.js";
import { renderPatternVariation } from "../../tileDisplayUtils.js";

export class HintAnimationManager {
    constructor(scene, table, aiEngine, card) {
        this.scene = scene;
        this.table = table;
        this.aiEngine = aiEngine;  // Modern name, not legacy gameAI
        this.card = card;
        this.savedGlowData = null;
        this.currentHintData = null;
        this.isPanelExpanded = false;
        this.glowedTiles = [];
    }

    // Apply glow effects to discard suggestion tiles
    applyGlowToDiscardSuggestions(recommendations) {
        this.clearAllGlows();

        // Filter to only DISCARD recommendations
        const discardRecs = recommendations.filter(rec =>
            rec.tile.suit !== SUIT.INVALID && rec.recommendation === "DISCARD"
        );

        // Highlight ALL discard recommendations (not limited to 3)
        // This ensures we show all available discards, even if only 1 or 2
        const hand = this.table.players[PLAYER.BOTTOM].hand;

        // Track which tiles we've already highlighted to handle duplicates
        const highlightedTiles = new Set();

        discardRecs.forEach((rec, index) => {
            debugPrint(`Processing tile ${index + 1}: ${rec.tile.getText()} with recommendation ${rec.recommendation}`); // Debug log

            const targetTile = this.findNextUnhighlightedTileInHand(hand, rec.tile, highlightedTiles);
            if (targetTile) {
                debugPrint(`Applying red glow to tile: ${targetTile.getText()}`); // Debug log
                targetTile.addGlowEffect(this.scene, 0xff0000, 0.6);
                this.glowedTiles.push(targetTile);
                // Mark this specific tile instance as highlighted
                highlightedTiles.add(targetTile);
            } else {
                debugPrint(`Could not find tile for: ${rec.tile.getText()}`); // Debug log
            }
        });

        debugPrint(`Applied glow to ${this.glowedTiles.length} tiles out of ${discardRecs.length} discard tiles requested`); // Debug log

        // Store current hint data for state management
        this.currentHintData = {recommendations: [...recommendations]};
        this.isPanelExpanded = true;
    }

    // Find the next unhighlighted tile in hand that matches the target tile
    // Handles duplicates by finding available instances that haven't been highlighted yet
    findNextUnhighlightedTileInHand(hand, targetTile, highlightedTiles) {
        const hiddenTiles = hand.getHiddenTileArray();

        for (const tile of hiddenTiles) {
            // Check if this tile matches the target
            if (tile.suit === targetTile.suit && tile.number === targetTile.number) {
                // Check if this specific tile instance hasn't been highlighted yet
                if (!highlightedTiles.has(tile)) {
                    return tile;
                }
            }
        }

        return null;
    }

    // Clear all glow effects
    clearAllGlows() {
        if (this.glowedTiles.length > 0) {
            // Save current glow state before clearing (avoid ternary operator)
            let savedRecommendations = null;
            if (this.currentHintData) {
                savedRecommendations = this.currentHintData.recommendations;
            }

            this.savedGlowData = {
                recommendations: savedRecommendations,
                timestamp: Date.now()
            };
        }

        this.glowedTiles.forEach((tile) => tile.removeGlowEffect());
        this.glowedTiles = [];
        this.isPanelExpanded = false;
    }

    // Restore glow effects from saved state
    restoreGlowEffects() {
        if (this.savedGlowData && this.savedGlowData.recommendations) {
            // Re-apply glow effects to the same tiles
            this.applyGlowToDiscardSuggestions(this.savedGlowData.recommendations);
            this.isPanelExpanded = true;

            // Clear saved state after restoration
            this.savedGlowData = null;
        } else if (this.currentHintData && this.currentHintData.recommendations) {
            // Fallback: re-calculate if saved state is not available
            this.applyGlowToDiscardSuggestions(this.currentHintData.recommendations);
            this.isPanelExpanded = true;
        }
    }

    // Check if hint panel is currently expanded
    isHintPanelExpanded() {
        const hintContent = window.document.getElementById("hint-content");

        return hintContent && !hintContent.classList.contains("hidden");
    }

    // Centralized method to get recommendations from the AI engine
    getRecommendations() {
        const hand = this.table.players[PLAYER.BOTTOM].hand.dupHand();

        // Add invalid tile if hand has 13 tiles, as the engine expects 14
        if (hand.getLength() === 13) {
            const invalidTile = new TileData(SUIT.INVALID, VNUMBER.INVALID);
            hand.insertHidden(invalidTile);
        }

        const result = this.aiEngine.getTileRecommendations(hand);

        // Reverse recommendations for display: DISCARD, PASS, KEEP
        return {
            recommendations: result.recommendations.reverse(),
            consideredPatternCount: result.consideredPatternCount
        };
    }

    // Get all tiles in player's hand (hidden + exposed)
    getAllPlayerTiles() {
        const hand = this.table.players[PLAYER.BOTTOM].hand;
        const allTiles = [...hand.getHiddenTileArray()];

        hand.exposedTileSetArray.forEach(set => {
            allTiles.push(...set.tileArray);
        });

        return allTiles;
    }

    // Get only hidden tiles in player's hand
    getHiddenPlayerTiles() {
        const hand = this.table.players[PLAYER.BOTTOM].hand;
        return hand.getHiddenTileArray();
    }

    // Update hint with new hand state
    updateHintsForNewTiles() {
        // Only update glow effects if panel is expanded
        if (!this.isHintPanelExpanded()) {
            // Panel is collapsed, just update the text content without glow effects
            this.updateHintDisplayOnly();
            return;
        }

        // Panel is expanded, proceed with full update including glow effects
        const result = this.getRecommendations();
        const hand = this.table.players[PLAYER.BOTTOM].hand.dupHand();
        if (hand.getLength() === 13) {
            hand.insertHidden(new TileData(SUIT.INVALID, VNUMBER.INVALID));
        }
        const rankCardHands = this.card.rankHandArray14(hand);
        this.card.sortHandRankArray(rankCardHands);

        // Update visual glow effects (only if panel is expanded)
        this.applyGlowToDiscardSuggestions(result.recommendations);

        // Always update hint text content
        this.updateHintDisplay(rankCardHands, result.recommendations, result.consideredPatternCount);
    }

    // New method for updating hint text without glow effects
    updateHintDisplayOnly() {
        const result = this.getRecommendations();
        const hand = this.table.players[PLAYER.BOTTOM].hand.dupHand();
        if (hand.getLength() === 13) {
            hand.insertHidden(new TileData(SUIT.INVALID, VNUMBER.INVALID));
        }
        const rankCardHands = this.card.rankHandArray14(hand);
        this.card.sortHandRankArray(rankCardHands);

        // Update hint text content only (no glow effects)
        this.updateHintDisplay(rankCardHands, result.recommendations, result.consideredPatternCount);
    }

    // Update hint panel text with colorized patterns
    updateHintDisplay(rankCardHands, recommendations, consideredPatternCount) {
        let html = "<h3>Top Possible Hands:</h3>";

        // Get all player tiles for matching (includes exposed tiles)
        const playerTiles = this.getAllPlayerTiles();

        // Get only hidden tiles (for joker substitution availability)
        const hiddenTiles = this.getHiddenPlayerTiles();

        for (let i = 0; i < Math.min(3, rankCardHands.length); i++) {
            const rankHand = rankCardHands[i];
            // Pattern #1 (index 0) is never dimmed
            const isConsidered = i === 0 || i < consideredPatternCount;
            const dimStyle = isConsidered ? "" : "opacity: 0.4;";

            html += `<p style="${dimStyle}"><strong>${rankHand.group.groupDescription}</strong> - ${rankHand.hand.description} (Rank: ${rankHand.rank.toFixed(2)})`;
            // Only show "not considered" label for patterns after #1
            if (!isConsidered && i > 0) {
                html += " <em>(not considered)</em>";
            }
            html += "</p>";

            // Render colorized pattern with matching
            const patternHtml = renderPatternVariation(rankHand, playerTiles, hiddenTiles);
            html += `<div style="${dimStyle}">${patternHtml}</div>`;
        }

        html += "<h3>Discard Suggestions (Best to Discard First):</h3>";
        // Only show DISCARD recommendations, and limit to actual count available (not artificially capped at 3)
        const discardRecommendations = recommendations.filter(rec =>
            rec.tile.suit !== SUIT.INVALID && rec.recommendation === "DISCARD"
        );
        const displayCount = discardRecommendations.length;
        for (let i = 0; i < displayCount; i++) {
            const rec = discardRecommendations[i];
            html += `<p>${rec.tile.getText()}</p>`;
        }

        printHint(html);
    }
}
