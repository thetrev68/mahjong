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
    constructor(scene, gameController, aiEngine, card, tileManager) {
        this.scene = scene;
        this.gameController = gameController;
        this.aiEngine = aiEngine;
        this.card = card;
        this.tileManager = tileManager;  // Phase 5: Use TileManager for sprite access instead of table
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

        // Phase 5: Get HandData from GameController (authoritative source)
        const handData = this.gameController.players[PLAYER.BOTTOM].hand;

        // Track which tiles we've already highlighted to handle duplicates
        const highlightedTiles = new Set();

        discardRecs.forEach((rec, index) => {
            debugPrint(`Processing tile ${index + 1}: ${rec.tile.getText()} with recommendation ${rec.recommendation}`);

            const targetTile = this.findNextUnhighlightedTileInHand(handData, rec.tile, highlightedTiles);
            if (targetTile) {
                // Use TileData's getText() for debug logging (safer than sprite's getText())
                debugPrint(`Applying red glow to tile: ${rec.tile.getText()}`);
                targetTile.addGlowEffect(this.scene, 0xff0000, 0.6);
                this.glowedTiles.push(targetTile);
                // Mark this specific tile instance as highlighted
                highlightedTiles.add(targetTile);
            } else {
                debugPrint(`Could not find tile for: ${rec.tile.getText()}`);
            }
        });

        debugPrint(`Applied glow to ${this.glowedTiles.length} tiles out of ${discardRecs.length} discard tiles requested`);

        // Store current hint data for state management
        this.currentHintData = {recommendations: [...recommendations]};
        this.isPanelExpanded = true;
    }

    // Find the next unhighlighted tile in hand that matches the target tile
    // Phase 5: Works with HandData + TileManager instead of legacy Hand object
    findNextUnhighlightedTileInHand(handData, targetTile, highlightedTiles) {
        // Get TileData array from HandData (hidden tiles only)
        const hiddenTileDataArray = handData.tiles;

        for (const tileData of hiddenTileDataArray) {
            // Check if this tile matches the target
            if (tileData.suit === targetTile.suit && tileData.number === targetTile.number) {
                // Get the Phaser sprite for this tile via TileManager
                const phaserTile = this.tileManager.getTileSprite(tileData.index);

                // Check if this specific tile instance hasn't been highlighted yet
                if (phaserTile && !highlightedTiles.has(phaserTile)) {
                    return phaserTile;
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

    /**
     * Build a 14-tile HandData for hint engine
     * Clones the current hand and pads to 14 tiles if needed (AI expects 14)
     */
    buildHandDataForHintEngine() {
        const handData = this.gameController.players[PLAYER.BOTTOM].hand.clone();

        // Add invalid tile if hand has 13 tiles, as the engine expects 14
        if (handData.getLength() === 13) {
            handData.addTile(new TileData(SUIT.INVALID, VNUMBER.INVALID));
        }

        return handData;
    }

    // Centralized method to get recommendations from the AI engine
    getRecommendations() {
        const handData = this.buildHandDataForHintEngine();
        const result = this.aiEngine.getTileRecommendations(handData);

        // Reverse recommendations for display: DISCARD, PASS, KEEP
        return {
            recommendations: result.recommendations.reverse(),
            consideredPatternCount: result.consideredPatternCount
        };
    }

    // Get all tiles in player's hand (hidden + exposed)
    // Phase 5: Returns Phaser sprites via TileManager from HandData
    getAllPlayerTiles() {
        const handData = this.gameController.players[PLAYER.BOTTOM].hand;
        const allPhaserTiles = [];

        // Get hidden tiles
        for (const tileData of handData.tiles) {
            const phaserTile = this.tileManager.getTileSprite(tileData.index);
            if (phaserTile) {
                allPhaserTiles.push(phaserTile);
            }
        }

        // Get exposed tiles
        for (const exposure of handData.exposures) {
            for (const tileData of exposure.tiles) {
                const phaserTile = this.tileManager.getTileSprite(tileData.index);
                if (phaserTile) {
                    allPhaserTiles.push(phaserTile);
                }
            }
        }

        return allPhaserTiles;
    }

    // Get only hidden tiles in player's hand
    // Phase 5: Returns Phaser sprites via TileManager from HandData
    getHiddenPlayerTiles() {
        const handData = this.gameController.players[PLAYER.BOTTOM].hand;
        const hiddenPhaserTiles = [];

        for (const tileData of handData.tiles) {
            const phaserTile = this.tileManager.getTileSprite(tileData.index);
            if (phaserTile) {
                hiddenPhaserTiles.push(phaserTile);
            }
        }

        return hiddenPhaserTiles;
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

        // Use helper to get 14-tile hand for ranking
        const handData = this.buildHandDataForHintEngine();
        const rankCardHands = this.card.rankHandArray14(handData);
        this.card.sortHandRankArray(rankCardHands);

        // Update visual glow effects (only if panel is expanded)
        this.applyGlowToDiscardSuggestions(result.recommendations);

        // Always update hint text content
        this.updateHintDisplay(rankCardHands, result.recommendations, result.consideredPatternCount);
    }

    // New method for updating hint text without glow effects
    updateHintDisplayOnly() {
        const result = this.getRecommendations();

        // Use helper to get 14-tile hand for ranking
        const handData = this.buildHandDataForHintEngine();
        const rankCardHands = this.card.rankHandArray14(handData);
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
