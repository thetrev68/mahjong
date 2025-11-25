/**
 * AIEngine - Platform-agnostic AI decision engine
 * Works with plain data models (TileData, HandData, PlayerData) instead of Phaser objects
 * Refactored from gameAI.js to enable cross-platform use (desktop + mobile)
 */

import {debugPrint, gdebug} from "../utils.js";
import {PLAYER_OPTION, SUIT, VNUMBER} from "../constants.js";
import {TileData} from "./models/TileData.js";

// PRIVATE CONSTANTS
const TILE_RECOMMENDATION = {
    KEEP: "KEEP",
    PASS: "PASS",
    DISCARD: "DISCARD"
};

export class AIEngine {
    /**
     * @param {Card} card - Hand validation engine (already platform-agnostic)
     * @param {Object} tableData - Plain game state object with players array
     * @param {string} difficulty - "easy", "medium", or "hard"
     */
    constructor(card, tableData, difficulty = "medium") {
        this.card = card;
        this.tableData = tableData;
        this.difficulty = difficulty;
        this.config = this.getDifficultyConfig(difficulty);
    }

    /**
     * Get difficulty configuration
     * @param {string} difficulty
     * @returns {Object} Configuration object
     *
     * IMPORTANT: Copied exactly from gameAI.js - do NOT modify
     */
    getDifficultyConfig(difficulty) {
        const configs = {
            easy: {
                // Pattern consideration
                maxPatterns: 2,              // Only look at top 2 winning patterns (tunnel vision)
                minDiscardable: 5,           // Need 5 tiles to throw away (very conservative)

                // Exposure strategy
                exposureThreshold: 70,       // Only expose tiles when hand is 70+ rank (very close to winning)

                // Courtesy pass voting
                courtesyThresholds: [55, 65, 75],  // More willing to pass tiles (helps opponents)

                // Charleston continuation voting
                charlestonContinueThreshold: 0.8,  // 80% chance to vote yes (wants more exchanges)

                // Blank tile usage
                blankExchangeRank: 999,      // Never exchange blanks (999 means impossible threshold)
                blankExchangeGain: 999,      // Never exchange blanks

                // Joker optimization
                jokerTopHands: 1,            // Only consider 1 pattern when evaluating joker swaps
                jokerRankThreshold: 60,      // Only optimize jokers when hand rank > 60
                jokerScaling: 0.8,           // Less aggressive joker optimization (80% effectiveness)

                // Mistake rate
                discardRandomness: 0.3       // 30% chance to discard a suboptimal tile
            },

            medium: {
                // Pattern consideration
                maxPatterns: 5,              // Look at top 5 winning patterns (good flexibility)
                minDiscardable: 4,           // Need 4 tiles to throw away (balanced)

                // Exposure strategy
                exposureThreshold: 55,       // Expose tiles when hand is 55+ rank (moderate timing)

                // Courtesy pass voting
                courtesyThresholds: [50, 60, 68],  // Balanced courtesy decisions

                // Charleston continuation voting
                charlestonContinueThreshold: 0.65, // 65% chance to vote yes (balanced)

                // Blank tile usage
                blankExchangeRank: 85,       // Exchange blanks when hand rank > 85 (conservative)
                blankExchangeGain: 25,       // Only if improvement is > 25 points (significant gain)

                // Joker optimization
                jokerTopHands: 2,            // Consider top 2 patterns for joker swaps
                jokerRankThreshold: 55,      // Optimize jokers when hand rank > 55
                jokerScaling: 0.9,           // Moderate joker optimization (90% effectiveness)

                // Mistake rate
                discardRandomness: 0.1       // 10% chance to discard a suboptimal tile
            },

            hard: {
                // Pattern consideration
                maxPatterns: 999,            // Look at all patterns dynamically (maximum flexibility)
                minDiscardable: 3,           // Need only 3 tiles to throw away (aggressive)

                // Exposure strategy
                exposureThreshold: 45,       // Expose tiles when hand is 45+ rank (aggressive timing)

                // Courtesy pass voting
                courtesyThresholds: [45, 55, 65],  // Optimal courtesy decisions

                // Charleston continuation voting
                charlestonContinueThreshold: 0.6,  // 60% chance to vote yes (strategic)

                // Blank tile usage
                blankExchangeRank: 80,       // Exchange blanks when hand rank > 80 (aggressive)
                blankExchangeGain: 20,       // Exchange if improvement > 20 points (moderate gain)

                // Joker optimization
                jokerTopHands: 3,            // Consider top 3 patterns for joker swaps
                jokerRankThreshold: 50,      // Optimize jokers when hand rank > 50
                jokerScaling: 1.0,           // Full joker optimization (100% effectiveness)

                // Mistake rate
                discardRandomness: 0         // 0% chance of mistakes (perfect play)
            }
        };

        // Return the config for the requested difficulty, or medium if invalid
        return configs[difficulty] || configs.medium;
    }

    /**
     * Calculate how many of each tile type are needed across all considered patterns
     * Returns a Map with keys like "SUIT-NUMBER" and values like {needed: N, have: M}
     * @param {TileData[]} handTiles - Array of plain tile data
     * @param {Array} patterns - Ranked pattern array from card.rankHandArray14()
     * @returns {Map}
     */
    calculateTileNeeds(handTiles, patterns) {
        const tileNeeds = new Map();

        // For each pattern, count how many of each tile type it needs
        // Then take the MAXIMUM across all patterns (union of all needs)
        for (const ranked of patterns) {
            const patternNeeds = new Map();

            // Count tiles needed in this specific pattern
            // For each component, we want to know: how many non-joker/non-blank tiles of each type should we keep?
            // Answer: Keep all non-joker/non-blank tiles that are part of this component
            for (const compInfo of ranked.componentInfoArray) {
                // Count each non-joker/non-blank tile type in this component
                const tileCounts = new Map();
                for (const tile of compInfo.tileArray) {
                    if (tile.suit !== SUIT.JOKER && tile.suit !== SUIT.BLANK) {
                        const tileKey = `${tile.suit}-${tile.number}`;
                        tileCounts.set(tileKey, (tileCounts.get(tileKey) || 0) + 1);
                    }
                }

                // Add these counts to the pattern's needs
                for (const [tileKey, count] of tileCounts.entries()) {
                    patternNeeds.set(tileKey, (patternNeeds.get(tileKey) || 0) + count);
                }
            }

            // Update global needs with max from this pattern
            for (const [tileKey, count] of patternNeeds.entries()) {
                if (!tileNeeds.has(tileKey)) {
                    tileNeeds.set(tileKey, { needed: 0, have: 0 });
                }
                const current = tileNeeds.get(tileKey);
                current.needed = Math.max(current.needed, count);
            }
        }

        // Count how many of each tile we actually have
        for (const tile of handTiles) {
            if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
                continue;
            }
            const tileKey = `${tile.suit}-${tile.number}`;
            if (!tileNeeds.has(tileKey)) {
                tileNeeds.set(tileKey, { needed: 0, have: 0 });
            }
            tileNeeds.get(tileKey).have++;
        }

        // For each tile type, the "needed" count is how many we should KEEP
        // If pattern needs 2 and we have 3, we KEEP 2 and DISCARD 1
        // If pattern needs 2 and we have 1, we KEEP 1 (still need 1 more)
        for (const counts of tileNeeds.values()) {
            counts.needed = Math.min(counts.needed, counts.have);
        }

        return tileNeeds;
    }

    /**
     * Count how many tiles in handTiles are discardable given the considered patterns
     * @param {TileData[]} handTiles - Array of plain tile data
     * @param {Array} patterns - Ranked pattern array
     * @returns {number}
     */
    countDiscardableTiles(handTiles, patterns) {
        const tileNeeds = this.calculateTileNeeds(handTiles, patterns);
        let discardableCount = 0;

        for (const tile of handTiles) {
            if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
                continue; // Jokers/blanks are never discardable
            }

            const tileKey = `${tile.suit}-${tile.number}`;
            const need = tileNeeds.get(tileKey);

            if (!need || need.needed === 0) {
                discardableCount++;
            }
        }

        return discardableCount;
    }

    /**
     * Get tile recommendations for a hand
     * @param {HandData} handData - Plain hand data object (13 or 14 tiles)
     * @returns {Object} {recommendations: Array, consideredPatternCount: number}
     */
    getTileRecommendations(handData) {
        const recommendations = [];

        // Ensure we have 14 tiles for pattern ranking (pad with INVALID if needed)
        const workingHand = handData.clone();
        while (workingHand.getLength() < 14) {
            workingHand.addTile(new TileData(SUIT.INVALID, VNUMBER.INVALID));
        }

        const rankCardHands = this.card.rankHandArray14(workingHand);
        const sortedRankCardHands = [...rankCardHands].sort((a, b) => b.rank - a.rank);

        // Use ORIGINAL hand tiles for recommendations (not the padded version)
        const handTiles = handData.getTileArray();

        debugPrint(`Total patterns available: ${sortedRankCardHands.length}`);

        // Dynamically determine how many patterns to consider
        // Start with all patterns and reduce until we have at least 3 discardable tiles
        let patternCount = sortedRankCardHands.length;

        // Apply difficulty-based pattern limit
        if (this.config.maxPatterns < 999) {
            patternCount = Math.min(patternCount, this.config.maxPatterns);
        }

        while (patternCount > 1) {  // Changed from > 0 to > 1 - always keep at least pattern #1
            const consideredPatterns = sortedRankCardHands.slice(0, patternCount);
            const discardableCount = this.countDiscardableTiles(handTiles, consideredPatterns);

            debugPrint(`Considering ${patternCount} patterns: ${discardableCount} discardable tiles`);

            // If we have at least 3 discardable tiles, we're done
            if (discardableCount >= this.config.minDiscardable) {
                break;
            }

            // Not enough discardable tiles, reduce the number of patterns considered
            patternCount--;
        }

        // Ensure we always consider at least pattern #1
        if (patternCount === 0) {
            patternCount = 1;
        }

        debugPrint(`Final decision: considering ${patternCount} patterns`);

        // Now generate recommendations with the determined pattern count
        const consideredPatterns = sortedRankCardHands.slice(0, patternCount);

        // Build a map of how many of each tile type we need vs. have
        const tileNeeds = this.calculateTileNeeds(handTiles, consideredPatterns);

        debugPrint("Tile needs map:");
        for (const [tileKey, counts] of tileNeeds.entries()) {
            debugPrint(`  ${tileKey}: needed=${counts.needed}, have=${counts.have}`);
        }

        for (const tile of handTiles) {
            let recommendation = TILE_RECOMMENDATION.DISCARD; // Default to DISCARD

            if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
                // Blanks and jokers are always kept - AI should never discard them
                recommendation = TILE_RECOMMENDATION.KEEP;
            } else {
                const tileKey = `${tile.suit}-${tile.number}`;
                const need = tileNeeds.get(tileKey);

                if (need && need.needed > 0) {
                    // We still need this tile for a pattern
                    recommendation = TILE_RECOMMENDATION.KEEP;
                    debugPrint(`  ${tile.getText()}: KEEP (need.needed=${need.needed} before decrement)`);
                    need.needed--; // Decrement so next instance might be DISCARD
                } else {
                    debugPrint(`  ${tile.getText()}: DISCARD (need=${need ? `${need.needed}/${need.have}` : "not found"})`);
                }
                // else: tile not needed or we have excess, so DISCARD
            }

            recommendations.push({ tile, recommendation });
        }

        // For consistency and easier use later, sort by recommendation: KEEP, DISCARD
        // Secondary sort: Jokers and blanks always first
        recommendations.sort((a, b) => {
            const order = { [TILE_RECOMMENDATION.KEEP]: 0, [TILE_RECOMMENDATION.PASS]: 1, [TILE_RECOMMENDATION.DISCARD]: 2 };
            const orderDiff = order[a.recommendation] - order[b.recommendation];

            // If same recommendation level, jokers and blanks come first
            if (orderDiff === 0) {
                const aIsSpecial = (a.tile.suit === SUIT.JOKER || a.tile.suit === SUIT.BLANK) ? 1 : 0;
                const bIsSpecial = (b.tile.suit === SUIT.JOKER || b.tile.suit === SUIT.BLANK) ? 1 : 0;
                return bIsSpecial - aIsSpecial; // Special tiles (1) before regular tiles (0)
            }

            return orderDiff;
        });

        return { recommendations, consideredPatternCount: patternCount };
    }

    /**
     * Choose which tile to discard from hand
     * @param {HandData} handData - Plain hand data {tiles: TileData[], exposures: []}
     * @returns {TileData} Tile to discard
     */
    chooseDiscard(handData) {
        // Choose tile to discard using the recommendation engine
        const result = this.getTileRecommendations(handData);
        const recommendations = result.recommendations;

        let discardTile = null;

        // Get all discardable recommendations (excluding blanks)
        const discardableRecommendations = recommendations.filter(
            (r) => r.recommendation === "DISCARD" && r.tile.suit !== SUIT.BLANK
        );

        // Apply difficulty-based randomness
        if (this.config.discardRandomness > 0 && Math.random() < this.config.discardRandomness && discardableRecommendations.length > 0) {
            // Easy/Medium: Sometimes make a suboptimal choice
            // Pick one of the worst 3 tiles randomly instead of the absolute worst
            const randomIndex = Math.floor(
                Math.random() * Math.min(3, discardableRecommendations.length)
            );
            discardTile = discardableRecommendations[randomIndex].tile;

            if (gdebug) {
                console.log(`[AIEngine] Made suboptimal discard choice (difficulty: ${this.difficulty})`);
            }
        } else {
            // Hard: Always pick the optimal (worst-ranked) tile
            for (let i = recommendations.length - 1; i >= 0; i--) {
                const tile = recommendations[i].tile;
                if (tile.suit !== SUIT.BLANK) {
                    discardTile = tile;
                    break;
                }
            }
        }

        // Fallback: if all remaining tiles are blanks (extreme edge case), discard a blank
        if (!discardTile && recommendations.length > 0) {
            discardTile = recommendations[recommendations.length - 1].tile;
        }

        return discardTile;
    }

    /**
     * Decide whether to claim a discarded tile
     * @param {TileData} tileThrown - Discarded tile
     * @param {number} playerThrowing - Player index (0-3)
     * @param {HandData} handData - Current player's hand data
     * @param {boolean} ignoreRank - If true, ignore rank threshold for exposures
     * @returns {Object} {playerOption: string, tileArray: TileData[] | null}
     */
    claimDiscard(tileThrown, playerThrowing, handData, ignoreRank = false) {
        // Create a copy of hand with the discarded tile added
        const copyHand = handData.clone();
        copyHand.addTile(tileThrown.clone());

        // Check for mahjong
        const validInfo = this.card.validateHand14(copyHand);

        if (validInfo.valid) {
            // Mahjong!
            return {
                playerOption: PLAYER_OPTION.MAHJONG,
                tileArray: null
            };
        }

        // Check for pung/kong/quint
        const rankCardHands = this.card.rankHandArray14(copyHand);
        this.card.sortHandRankArray(rankCardHands);
        const rankInfo = rankCardHands[0];

        // Allow exposure if we have already exposed, or hand rank is greater than a certain level
        // Lower threshold to encourage more exposures and prevent wall games
        const hasExposures = handData.exposures.length > 0;
        const rankThresholdMet = ignoreRank || rankInfo.rank > this.config.exposureThreshold;

        if (hasExposures || (!rankInfo.hand.concealed && rankThresholdMet)) {
            // Find component with the discarded tile
            let compInfo = null;
            outerloop:
            for (const tempcompInfo of rankInfo.componentInfoArray) {
                for (const tile of tempcompInfo.tileArray) {
                    if (tile.equals(tileThrown)) {
                        compInfo = tempcompInfo;
                        break outerloop;
                    }
                }
            }

            if (compInfo && this.validateComponentForExposure(compInfo)) {
                // If it's part of a completed component => let's claim it for exposure
                return {
                    playerOption: PLAYER_OPTION.EXPOSE_TILES,
                    tileArray: compInfo.tileArray
                };
            }
        }

        // Do not claim discard
        return {
            playerOption: PLAYER_OPTION.DISCARD_TILE,
            tileArray: [tileThrown]
        };
    }

    /**
     * Test if this component is suitable for exposure
     * @param {Object} compInfo - Component info from card.rankHandArray14()
     * @returns {boolean}
     */
    validateComponentForExposure(compInfo) {
        // Reject single/pairs components
        if (compInfo.component.count < 3) {
            return false;
        }

        if (compInfo.tileArray.length !== compInfo.component.count) {
            return false;
        }

        return true;
    }

    /**
     * Select tiles to pass during Charleston
     * @param {HandData} handData - Current hand data (13 tiles)
     * @returns {TileData[]} Array of 3 tiles to pass
     */
    charlestonPass(handData) {
        const pass = [];

        // getTileRecommendations handles 13-tile hands by padding internally
        const result = this.getTileRecommendations(handData);
        const recommendations = result.recommendations;

        debugPrint(`[Charleston] Total recommendations: ${recommendations.length}`);
        debugPrint(`[Charleston] Jokers in hand: ${recommendations.filter(r => r.tile.suit === SUIT.JOKER).length}`);
        debugPrint(`[Charleston] Blanks in hand: ${recommendations.filter(r => r.tile.suit === SUIT.BLANK).length}`);

        // Filter out jokers and blanks (cannot pass jokers or blanks per NMJL rules)
        // then sort recommendations: DISCARD, PASS, KEEP
        const validRecommendations = recommendations.filter(r =>
            !r.tile.isJoker() &&
            !r.tile.isBlank()
        );

        debugPrint(`[Charleston] Valid recommendations after filtering: ${validRecommendations.length}`);
        debugPrint(`[Charleston] Jokers in valid: ${validRecommendations.filter(r => r.tile.suit === SUIT.JOKER).length}`);
        debugPrint(`[Charleston] Blanks in valid: ${validRecommendations.filter(r => r.tile.suit === SUIT.BLANK).length}`);

        validRecommendations.sort((a, b) => {
            const order = { [TILE_RECOMMENDATION.DISCARD]: 0, [TILE_RECOMMENDATION.PASS]: 1, [TILE_RECOMMENDATION.KEEP]: 2 };
            return order[a.recommendation] - order[b.recommendation];
        });

        // Select the top 3 tiles to pass (will be DISCARDs then PASSs)
        for (let i = 0; i < 3; i++) {
            if (validRecommendations.length > i) {
                const tile = validRecommendations[i].tile;
                debugPrint(`[Charleston] Passing tile ${i}: ${tile.getText()} (suit=${tile.suit})`);
                pass.push(tile);
            }
        }

        return pass;
    }

    /**
     * Decide whether to vote for courtesy pass
     * @param {HandData} handData - Current hand data (13 tiles for players 1-3)
     * @returns {number} Number of tiles to vote for (0, 1, 2, or 3)
     */
    courtesyVote(handData) {
        // Player 1-3 will only have 13 tiles in their hands during the courtesy
        // Add a bogus tile to make 14.
        const copyHand = handData.clone();
        const invalidTile = new TileData(SUIT.INVALID, VNUMBER.INVALID);
        copyHand.addTile(invalidTile);

        const rankCardHands = this.card.rankHandArray14(copyHand);
        this.card.sortHandRankArray(rankCardHands);
        const rankInfo = rankCardHands[0];
        const rank = rankInfo.rank;

        debugPrint("courtesyVote: rank = " + rank);
        this.card.printHandRankArray(rankCardHands, 1);

        // Adjust courtesy voting to be more aggressive in early game
        // Encourage tile exchange to improve hands and prevent stagnation
        const thresholds = this.config.courtesyThresholds;

        if (rank < thresholds[0]) {
            return 3;  // Vote to pass 3 tiles
        }
        if (rank < thresholds[1]) {
            return 2;  // Vote to pass 2 tiles
        }
        if (rank < thresholds[2]) {
            return 1;  // Vote to pass 1 tile
        }

        return 0;  // Vote to pass 0 tiles (decline courtesy)
    }

    /**
     * Vote whether to continue Charleston to phase 2
     * @returns {boolean} True to continue, false to skip phase 2
     */
    charlestonContinueVote(handData) {
        // Evaluate hand strength and vote to continue Phase 2 based on whether we have a good hand
        // Strong hands: less likely to continue (want to keep what we have)
        // Weak hands: more likely to continue (need more tile exchanges)

        const copyHand = handData.clone();
        const invalidTile = new TileData(SUIT.INVALID, VNUMBER.INVALID);
        copyHand.addTile(invalidTile);

        const rankCardHands = this.card.rankHandArray14(copyHand);
        this.card.sortHandRankArray(rankCardHands);
        const rankInfo = rankCardHands[0];
        const rank = rankInfo.rank;

        debugPrint("charlestonContinueVote: rank = " + rank);

        // Adjust voting based on hand strength and difficulty
        // Weak hands (high rank value): vote YES to continue (more exchanges)
        // Strong hands (low rank value): vote NO to stop (keep what we have)
        const baseThreshold = this.config.charlestonContinueThreshold || 0.7;

        // Scale threshold based on hand rank
        // If rank is very high (bad hand): increase threshold (more likely to vote YES)
        // If rank is very low (good hand): decrease threshold (more likely to vote NO)
        let adjustedThreshold = baseThreshold;

        // Thresholds for voting: adjust based on how close we are to winning
        const thresholds = this.config.courtesyThresholds;
        if (rank >= thresholds[2]) {
            // Very weak hand: strongly encourage continuation
            adjustedThreshold = baseThreshold + 0.2;
        } else if (rank >= thresholds[1]) {
            // Weak hand: slightly encourage continuation
            adjustedThreshold = baseThreshold + 0.1;
        } else if (rank >= thresholds[0]) {
            // Moderate hand: use base threshold
            adjustedThreshold = baseThreshold;
        } else {
            // Strong hand: discourage continuation
            adjustedThreshold = Math.max(baseThreshold - 0.2, 0.3);
        }

        return Math.random() < adjustedThreshold;
    }

    /**
     * Select tiles to pass during courtesy pass
     * @param {HandData} handData - Current hand data
     * @param {number} maxCount - Maximum number of tiles to pass
     * @returns {TileData[]} Array of tiles to pass
     */
    courtesyPass(handData, maxCount) {
        const result = this.getTileRecommendations(handData);
        const tileRecommendations = result.recommendations;

        const pass = [];
        // Pass the lowest value tiles (DISCARD recommendations at the end of the array)
        // Never pass jokers or blanks per NMJL rules
        for (let i = tileRecommendations.length - 1; i >= 0 && pass.length < maxCount; i--) {
            const tile = tileRecommendations[i].tile;
            // Skip jokers and blanks - cannot pass them during courtesy
            if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
                continue;
            }
            pass.push(tile);
        }

        return pass;
    }

    /**
     * Optimize joker placements in hand
     * NOTE: This method is more complex to adapt as it requires access to exposed jokers
     * from the table. For now, returning false (no exchange).
     * Full implementation would need table-level joker tracking.
     *
     * @param {HandData} handData - Current hand data
     * @param {TileData[]} exposedJokerArray - Array of tiles that have exposed jokers
     * @returns {Object} {shouldExchange: boolean, tile: TileData | null}
     */
    exchangeTilesForJokers(handData, exposedJokerArray) {
        if (!exposedJokerArray || exposedJokerArray.length === 0) {
            return { shouldExchange: false, tile: null };
        }

        const rankCardHands = this.card.rankHandArray14(handData);
        const sortedRankCardHands = [...rankCardHands].sort((a, b) => b.rank - a.rank);
        let bestRank = -100000;
        let bestTile = null;

        const handTiles = handData.tiles;

        // For each tile
        for (let i = 0; i < handTiles.length; i++) {
            const tile = handTiles[i];
            let jokerFound = false;

            // Does this tile have an exchangeable joker?
            for (const uniqueTile of exposedJokerArray) {
                if (tile.suit === uniqueTile.suit && tile.number === uniqueTile.number) {
                    jokerFound = true;
                    break;
                }
            }

            if (!jokerFound) {
                continue;
            }

            // Rank hand with a joker replacing the tile
            const copyHand = handData.clone();
            copyHand.tiles[i] = new TileData(SUIT.JOKER, 0);

            // Get card rank array of copyHand
            const copyHandRankArray = this.card.rankHandArray14(copyHand);
            let rank = 0;

            // Compute rank for this tile
            const topHandsCount = Math.min(this.config.jokerTopHands, sortedRankCardHands.length);
            for (let j = 0; j < topHandsCount; j++) {
                const topHand = sortedRankCardHands[j];
                const originalIndex = rankCardHands.indexOf(topHand);

                let scale = 1.0;
                if (topHand.rank > this.config.jokerRankThreshold) {
                    scale = Math.min(topHand.rank * this.config.jokerScaling, 100);
                }
                rank += (copyHandRankArray[originalIndex].rank - rankCardHands[originalIndex].rank) * scale;
            }

            debugPrint("exchangeTilesForJokers. Joker found for exchange. rank = " + rank + "\n");

            if (rank > bestRank) {
                bestRank = rank;
                bestTile = tile;
            }
        }

        if (bestTile && (bestRank > 0)) {
            debugPrint("exchangeTilesForJokers. bestRank = " + bestRank + "\n");
            return { shouldExchange: true, tile: bestTile };
        }

        return { shouldExchange: false, tile: null };
    }
}
