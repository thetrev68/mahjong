import {debugPrint} from "./utils.js";
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
    constructor(card, table) {
        this.card = card;
        this.table = table;
    }


    isNeededInPatterns(tile, patterns) {
        for (const ranked of patterns) {
            // Check if tile appears in this pattern's tile sequence
            for (const compInfo of ranked.componentInfoArray) {
                for (const compTile of compInfo.tileArray) {
                    if (tile.suit === compTile.suit && tile.number === compTile.number) {
                        return true;
                    }
                }
            }
        }
        return false;
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

        while (patternCount > 0) {
            const consideredPatterns = sortedRankCardHands.slice(0, patternCount);

            // Count how many tiles would NOT be needed in any considered pattern (i.e., discardable)
            let discardableCount = 0;
            for (const tile of handTiles) {
                // Jokers and blanks are always KEEP, so skip them
                if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
                    continue;
                }
                // If tile is not needed in any considered pattern, it's discardable
                if (!this.isNeededInPatterns(tile, consideredPatterns)) {
                    discardableCount++;
                }
            }

            debugPrint(`Considering ${patternCount} patterns: ${discardableCount} discardable tiles`);

            // If we have at least 3 discardable tiles, we're done
            if (discardableCount >= 3) {
                break;
            }

            // Not enough discardable tiles, reduce the number of patterns considered
            patternCount--;
        }

        debugPrint(`Final decision: considering ${patternCount} patterns`);

        // Now generate recommendations with the determined pattern count
        const consideredPatterns = sortedRankCardHands.slice(0, patternCount);

        for (const tile of handTiles) {
            let recommendation = TILE_RECOMMENDATION.DISCARD; // Default to DISCARD

            if (tile.suit === SUIT.JOKER || tile.suit === SUIT.BLANK) {
                // Blanks and jokers are always kept - AI should never discard them
                recommendation = TILE_RECOMMENDATION.KEEP;
            } else if (this.isNeededInPatterns(tile, consideredPatterns)) {
                recommendation = TILE_RECOMMENDATION.KEEP;
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
            const topHandsCount = Math.min(3, sortedRankCardHands.length);
            for (let j = 0; j < topHandsCount; j++) {
                const topHand = sortedRankCardHands[j];
                const originalIndex = rankCardHands.indexOf(topHand);

                let scale = 1.0;
                if (topHand.rank > 50) {
                    scale = Math.min(topHand.rank, 100);
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
        if (currentBestRank < 80) {
            debugPrint("exchangeBlanksForDiscards: Hand rank too low (" + currentBestRank + "), hoarding blanks\n");
            return false;
        }

        let bestSwap = null;
        let bestRankGain = 20; // Very high threshold: must improve by at least 20 points

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
    chooseDiscard(currPlayer) {

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

        // Recommendations are sorted KEEP, PASS, DISCARD. We want to discard from the end of the list.
        // Never discard blanks - find the first non-blank tile to discard
        let discardTile = null;
        for (let i = recommendations.length - 1; i >= 0; i--) {
            const tile = recommendations[i].tile;
            if (tile.suit !== SUIT.BLANK) {
                discardTile = tile;
                break;
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
    claimDiscard(player, discardTile) {
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
        if (!copyHand.isAllHidden() || (!rankInfo.hand.concealed && rankInfo.rank > 45)) {

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
    charlestonPass(player) {
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

    courtesyVote(player) {
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
        if (rank < 45) {
            return 3;
        }
        if (rank < 55) {
            return 2;
        }
        if (rank < 65) {
            return 1;
        }

        return 0;
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
