import {debugPrint, gdebug} from "./utils.js";
import {PLAYER_OPTION, SUIT, VNUMBER} from "./constants.js";
import {Tile} from "./gameObjects.js";

// PRIVATE CONSTANTS
const TILE_RECOMMENDATION = {
    KEEP: "KEEP",
    PASS: "PASS",
    DISCARD: "DISCARD"
};


// PRIVATE GLOBALS

export class GameAI {
    constructor(card, table, difficulty = "medium") {
        this.card = card;
        this.table = table;
        this.difficulty = difficulty;
        this.config = this.getDifficultyConfig(difficulty);
    }

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

    // Calculate how many of each tile type are needed across all considered patterns
    // Returns a Map with keys like "SUIT-NUMBER" and values like {needed: N, have: M}
    calculateTileNeeds(handTiles, patterns) {
        const tileNeeds = new Map();

        // For each pattern, count how many of each tile type it needs
        // Then take the MAXIMUM across all patterns (union of all needs)
        for (const ranked of patterns) {
            const patternNeeds = new Map();

            // Count tiles needed in this specific pattern
            for (const compInfo of ranked.componentInfoArray) {
                for (const compTile of compInfo.tileArray) {
                    const tileKey = `${compTile.suit}-${compTile.number}`;
                    patternNeeds.set(tileKey, (patternNeeds.get(tileKey) || 0) + 1);
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

    // Count how many tiles in handTiles are discardable given the considered patterns
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

    getTileRecommendations(hand) {
        const recommendations = [];
        const rankCardHands = this.card.rankHandArray14(hand);
        const sortedRankCardHands = [...rankCardHands].sort((a, b) => b.rank - a.rank);
        const handTiles = hand.getHiddenTileArray();

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
                    need.needed--; // Decrement so next instance might be DISCARD
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


    // Return true if hand is modified by swapping jokers
    exchangeTilesForJokers(currPlayer, hand) {
        const exposedJokerArray = this.table.getExposedJokerArray();
        const rankCardHands = this.card.rankHandArray14(hand);
        const sortedRankCardHands = [...rankCardHands].sort((a, b) => b.rank - a.rank);
        let bestRank = -100000;
        let bestTile = null;

        const test = hand.getHiddenTileArray();

        // For each tile
        for (let i = 0; i < test.length; i++) {
            const tile = test[i];
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
            // - make copy of hand
            // - replace tile with joker
            const copyHand = hand.dupHand();
            copyHand.hiddenTileSet.tileArray[i] = new Tile(SUIT.JOKER, 0);

            // Get card rank array of copyHand (same order as original rankCardHands before sorting)
            const copyHandRankArray = this.card.rankHandArray14(copyHand);
            let rank = 0;

            // Compute rank for this tile
            // - compare delta in copyHandRankArray and rankCardHands (both in original unsorted order)
            // - don't discard tiles that would cause large negative deltas
            // Add weighting for joker exchanges to be more aggressive
            // Only consider top 3 highest-ranked hands for focused recommendations
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

            debugPrint("exchangeTilesForJokers.  Joker found for exchange. rank = " + rank + "\n");

            if (rank > bestRank) {
                bestRank = rank;
                bestTile = tile;
            }
        }

        if (bestTile && (bestRank > 0)) {
            debugPrint("exchangeTilesForJokers. bestRank = " + bestRank + "\n");

            // Hand improved with joker.  Make the exchange in the real hand.
            this.table.exchangeJoker(currPlayer, hand, bestTile);

            return true;
        }

        return false;
    }

    // Return true if hand is modified by swapping blanks for discard tiles
    // AI strategy: Blanks are extremely valuable - only trade them for critical tiles very late in game
    exchangeBlanksForDiscards(currPlayer, hand) {
        // Get all blanks in the player's hand
        const blankArray = hand.getHiddenTileArray().filter(tile => tile.suit === SUIT.BLANK);

        // If no blanks, nothing to exchange
        if (blankArray.length === 0) {
            return false;
        }

        // Get discards (excluding jokers and blanks - can't swap for those)
        const discardArray = this.table.discards.tileArray.filter(tile =>
            tile.suit !== SUIT.JOKER && tile.suit !== SUIT.BLANK
        );

        // If no swappable discards, can't improve
        if (discardArray.length === 0) {
            return false;
        }

        // Evaluate current hand rank
        const rankCardHands = this.card.rankHandArray14(hand);
        const sortedRankCardHands = [...rankCardHands].sort((a, b) => b.rank - a.rank);
        const currentBestRank = sortedRankCardHands[0].rank;

        // AI should be EXTREMELY conservative about trading blanks
        // Only consider if:
        // 1. Hand rank is already very high (>80) - close to winning
        // 2. The swap would result in immediate Mahjong or massive improvement (>20 points)
        if (currentBestRank < this.config.blankExchangeRank) {
            debugPrint("exchangeBlanksForDiscards: Hand rank too low (" + currentBestRank + "), hoarding blanks\n");
            return false;
        }

        let bestSwap = null;
        let bestRankGain = this.config.blankExchangeGain; // Very high threshold: must improve by at least 20 points

        // For each blank in hand
        for (const blank of blankArray) {
            // For each discard, evaluate if swapping improves hand
            for (const discard of discardArray) {
                // Create a copy of hand
                const copyHand = hand.dupHand();

                // Find and replace the blank with the discard tile
                const blankIndex = copyHand.hiddenTileSet.tileArray.indexOf(blank);
                if (blankIndex === -1) {
                    continue;
                }

                copyHand.hiddenTileSet.tileArray[blankIndex] = new Tile(discard.suit, discard.number);

                // Evaluate new hand rank
                const copyHandRankArray = this.card.rankHandArray14(copyHand);
                const sortedCopyRankHands = [...copyHandRankArray].sort((a, b) => b.rank - a.rank);
                const newBestRank = sortedCopyRankHands[0].rank;

                // Calculate improvement
                const rankGain = newBestRank - currentBestRank;

                debugPrint("exchangeBlanksForDiscards: Blank -> " + discard.getText() + " would give rank gain: " + rankGain + "\n");

                if (rankGain > bestRankGain) {
                    bestRankGain = rankGain;
                    bestSwap = { blank, discard };
                }
            }
        }

        // Only execute swap if it gives massive improvement
        if (bestSwap && bestRankGain > 20) {
            debugPrint("exchangeBlanksForDiscards: Executing swap with rank gain: " + bestRankGain + "\n");

            // Perform the swap
            hand.removeHidden(bestSwap.blank);
            this.table.discards.removeDiscardTile(bestSwap.discard);

            // CRITICAL: Destroy the discard tile's old sprite before moving it to hand
            // The sprite was created in the discard pile's scene context and won't work in hand
            if (bestSwap.discard.sprite) {
                bestSwap.discard.sprite.destroy();
                bestSwap.discard.sprite = null;
            }
            if (bestSwap.discard.spriteBack) {
                bestSwap.discard.spriteBack.destroy();
                bestSwap.discard.spriteBack = null;
            }
            if (bestSwap.discard.mask && bestSwap.discard.mask.geometryMask) {
                bestSwap.discard.mask.geometryMask.destroy();
                bestSwap.discard.mask = null;
            }

            // Update the tile's scene reference to the hand's scene
            bestSwap.discard.scene = hand.scene;

            // Recreate the sprite in the hand's scene context
            bestSwap.discard.create();

            hand.insertHidden(bestSwap.discard);
            this.table.discards.insertDiscard(bestSwap.blank);

            // Update displays for all players
            for (let i = 0; i < 4; i++) {
                this.table.players[i].showHand();
            }
            this.table.discards.showDiscards();

            return true;
        }

        return false;
    }

    // Player AI
    // Just picked a new tile from wall (or completed exposure).  Hand has 14 tiles.
    // - Check for Mahjong
    // - Exchange for jokers (if possible and it would improve hand)
    // - Mahjong (if possible)
    // - Otherwise, select tile to discard
    //
    // Return
    //    {playerOption, tileArray}
    // eslint-disable-next-line require-await
    async chooseDiscard(currPlayer) {
        // Just picked new tile from wall. Hand will contain 14 tiles.
        const hand = this.table.players[currPlayer].hand;

        // Check for mahjong
        let validInfo = this.card.validateHand14(hand);

        if (validInfo.valid) {
            // Mahjong!
            return {
                playerOption: PLAYER_OPTION.MAHJONG,
                tileArray: null
            };
        }

        // Exchange jokers (if possible and it improves hand)

        let modified = false;
        do {
            modified = this.exchangeTilesForJokers(currPlayer, hand);

            if (modified) {
                // Check for mahjong again
                validInfo = this.card.validateHand14(hand);

                if (validInfo.valid) {
                    // Mahjong!
                    return {
                        playerOption: PLAYER_OPTION.MAHJONG,
                        tileArray: null
                    };
                }
            }
        } while (modified);

        // Exchange blanks (if possible and it improves hand)
        do {
            modified = this.exchangeBlanksForDiscards(currPlayer, hand);

            if (modified) {
                // Check for mahjong again
                validInfo = this.card.validateHand14(hand);

                if (validInfo.valid) {
                    // Mahjong!
                    return {
                        playerOption: PLAYER_OPTION.MAHJONG,
                        tileArray: null
                    };
                }
            }
        } while (modified);

        // Choose tile to discard using the new recommendation engine
        const result = this.getTileRecommendations(hand);
        const recommendations = result.recommendations;

        let discardTile = null;

        // Get all discardable recommendations (excluding blanks)
        const discardableRecommendations = recommendations.filter(
            (r) => r.recommendation === "DISCARD" && r.tile.suit !== SUIT.BLANK
        );

        // Apply difficulty-based randomness
        if (this.config.discardRandomness > 0 && Math.random() < this.config.discardRandomness) {
            // Easy/Medium: Sometimes make a suboptimal choice
            // Pick one of the worst 3 tiles randomly instead of the absolute worst
            const randomIndex = Math.floor(
                Math.random() * Math.min(3, discardableRecommendations.length)
            );
            discardTile = discardableRecommendations[randomIndex].tile;

            if (gdebug) {
                console.log(`[AI ${currPlayer.position}] Made suboptimal discard choice (difficulty: ${this.difficulty})`);
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

        // Remove tile from player's hidden tiles
        this.table.players[currPlayer].hand.removeHidden(discardTile);
        this.table.players[currPlayer].hand.sortSuitHidden();

        return {
            playerOption: PLAYER_OPTION.DISCARD_TILE,
            tileArray: [discardTile]
        };
    }

    // Test if this component is suitable for exposure
    //
    // Input: - compInfo.tileArray with discardTile as one of the tiles
    //          Guaranteed to be hidden.
    // Output: true - exposure ok (pung/kong/quint)
    validateComponentForExposure(player, compInfo) {

        // Reject single/pairs components
        if (compInfo.component.count < 3) {
            return false;
        }

        if (compInfo.tileArray.length !== compInfo.component.count) {
            return false;
        }

        return true;
    }

    // Player AI
    // Someone discarded a tile, decide whether to claim it.  Hand has 13 tiles.
    // - Dup hand.  Form 14 card hand with discardTile
    // - Check for Mahjong
    // - Check for pung/kong/quint exposure with discardTile.
    // - Otherwise, return discard
    //
    // Return
    //    {playerOption, tileArray}
    // eslint-disable-next-line require-await
    async claimDiscard(player, discardTile) {
        // Duplicate hand
        const copyHand = this.table.players[player].hand.dupHand();

        // Form 14 tile hand with discardTile
        copyHand.insertHidden(discardTile);

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
        if (!copyHand.isAllHidden() || (!rankInfo.hand.concealed && rankInfo.rank > this.config.exposureThreshold)) {

            // Find component with the discarded tile
            let compInfo = null;
            outerloop:
            for (const tempcompInfo of rankInfo.componentInfoArray) {
                for (const tile of tempcompInfo.tileArray) {
                    if (tile === discardTile) {
                        compInfo = tempcompInfo;
                        break outerloop;
                    }
                }
            }

            if (compInfo && this.validateComponentForExposure(player, compInfo, discardTile)) {
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
            tileArray: [discardTile]
        };
    }

    // Return 3 tiles to remove in Charleston
    // eslint-disable-next-line require-await
    async charlestonPass(player) {
        const hand = this.table.players[player].hand;
        const pass = [];

        // We have 13 tiles, but recommendation engine works on 14. Add a bogus tile.
        const copyHand = hand.dupHand();
        const invalidTile = new Tile(SUIT.INVALID, VNUMBER.INVALID);
        copyHand.insertHidden(invalidTile);

        const result = this.getTileRecommendations(copyHand);
        const recommendations = result.recommendations;

        // Filter out the invalid tile, jokers, and blanks (cannot pass jokers or blanks per NMJL rules)
        // then sort recommendations: DISCARD, PASS, KEEP
        const validRecommendations = recommendations.filter(r =>
            r.tile !== invalidTile &&
            r.tile.suit !== SUIT.JOKER &&
            r.tile.suit !== SUIT.BLANK
        );
        validRecommendations.sort((a, b) => {
            const order = { [TILE_RECOMMENDATION.DISCARD]: 0, [TILE_RECOMMENDATION.PASS]: 1, [TILE_RECOMMENDATION.KEEP]: 2 };
            return order[a.recommendation] - order[b.recommendation];
        });

        // Select the top 3 tiles to pass (will be DISCARDs then PASSs)
        for (let i = 0; i < 3; i++) {
            if (validRecommendations.length > i) {
                const tile = validRecommendations[i].tile;
                pass.push(tile);
                hand.removeHidden(tile);
            }
        }

        return pass;
    }

    // eslint-disable-next-line require-await
    async courtesyVote(player) {
        // Player 1-3 will only have 13 tiles in their hands during the courtesy
        // Add a bogus tile to make 14.
        const copyHand = this.table.players[player].hand.dupHand();
        const invalidTile = new Tile(SUIT.INVALID, VNUMBER.INVALID);
        copyHand.insertHidden(invalidTile);

        const rankCardHands = this.card.rankHandArray14(copyHand);
        this.card.sortHandRankArray(rankCardHands);
        const rankInfo = rankCardHands[0];
        const rank = rankInfo.rank;

        debugPrint("courtesyVote: Player " + player + ", rank = " + rank);
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

    courtesyPass(player, maxCount) {
        // Player 1-3 will only have 13 tiles in their hands during the courtesy
        const result = this.getTileRecommendations(this.table.players[player].hand);
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
            this.table.players[player].hand.removeHidden(tile);
            pass.push(tile);
        }

        return pass;
    }

}
