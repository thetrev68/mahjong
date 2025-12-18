import {debugPrint, debugTrace, gdebug} from "../../utils.js";
import {TileData} from "../models/TileData.js";
import {CardHand} from "./CardHand.js";
import {SUIT, VNUMBER} from "../../constants.js";

// PRIVATE CONSTANTS

// PRIVATE GLOBALS


// Currently support 2017, 2018, 2019, 2020, 2025 card

/**
 * Card - Hand validation and ranking engine
 *
 * Platform-agnostic card validator that works with plain data models (TileData, CardHand).
 * Handles:
 * - Hand validation (14 tiles, 13 tiles + drawn tile)
 * - Hand ranking by proximity to winning
 * - Pattern matching and component extraction
 * - Year-specific rule definitions (2017-2025)
 * - Hand generation from descriptions (for testing/training mode)
 *
 * @class Card
 */
export class Card {
    /**
     * @param {number} year - Card year (2017-2025)
     */
    constructor(year) {
        this.year = year;
        this.validHandGroups = null;
    }

    /**
     * Initialize card validator with year-specific hand patterns
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        const year = this.year;
        const {validHandGroups} = await import(`./${year}/card${year}.js`);
        this.validHandGroups = validHandGroups;

        // Debug only
        // eslint-disable-next-line no-constant-condition
        if (false) {
            // eslint-disable-next-line no-undef
            const cardTest = new CardTest(this);
            cardTest.test();
        }

        // Debug only
        // eslint-disable-next-line no-constant-condition
        if (false) {
            for (const group of this.validHandGroups) {
                for (const validHand of group.hands) {
                    const hand = this.generateHand(validHand.description);
                    if (!this.validateHand14(hand)) {
                        debugPrint("ERROR - generateHand produced invalid hand\n");
                    }
                }
            }
        }
    }

    /**
     * Generate a hand from a hand description (for testing/training mode)
     * @param {string} handDescription - Description of desired hand pattern
     * @param {number} [numTiles=14] - Number of tiles to generate (1-14)
     * @returns {CardHand} Hand with specified tile pattern
     */
    generateHand(handDescription, numTiles) {
        let currentNumTiles = numTiles;
        const vsuitArray = [SUIT.CRACK, SUIT.BAM, SUIT.DOT];
        const hand = new CardHand();
        let foundHand = null;

        if (!currentNumTiles) {
            currentNumTiles = 14;
        }

        // Find matching hand description
        outerLoop:
        for (const group of this.validHandGroups) {
            for (const validHand of group.hands) {
                if (validHand.description.valueOf() === handDescription.valueOf()) {
                    foundHand = validHand;
                    break outerLoop;
                }
            }
        }

        if (!foundHand) {
            return hand;
        }

        // Distribute tiles round-robin amongst components
        const tileCounts = [];
        for (let i = 0; i < foundHand.components.length; i++) {
            tileCounts.push(0);
        }

        let compIndex = 0;
        for (let i = 0; i < currentNumTiles; i++) {
            const comp = foundHand.components[compIndex];
            let suit = comp.suit;
            let number = comp.number;

            if (tileCounts[compIndex] >= 4) {
                // Quint - use joker
                hand.insertHidden(new TileData(SUIT.JOKER, 0));
            } else {
                let minNum = 1;
                if (hand.even) {
                    minNum = 2;
                }
                // Translate virtual suit to real suit using vsuitArray
                if (suit >= SUIT.VSUIT1_DRAGON) {
                    number = vsuitArray[suit - SUIT.VSUIT1_DRAGON];
                    suit = SUIT.DRAGON;
                } else if (suit >= SUIT.VSUIT1) {
                    // VSUIT
                    suit = vsuitArray[suit - SUIT.VSUIT1];

                    //  VNUMBER
                    if (number > 9) {
                        number = minNum + number - VNUMBER.CONSECUTIVE1;
                    }
                }

                hand.insertHidden(new TileData(suit, number));
            }
            tileCounts[compIndex]++;

            // Find next comp index
            let found = false;
            for (let j = 0; j < foundHand.components.length; j++) {
                compIndex++;
                if (compIndex >= foundHand.components.length) {
                    compIndex = 0;
                }

                if (tileCounts[compIndex] < foundHand.components[compIndex].count) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                break;
            }
        }

        return hand;
    }

    /**
     * Validate a complete 14-tile hand for winning patterns
     * @param {CardHand} hand - Hand with 14 tiles (hidden + exposed)
     * @returns {boolean} True if hand matches a valid winning pattern
     */
    validateHand14(hand) {
        // Consolidate hand (14 tiles) to test array
        // Include both hidden and exposed tiles for validation
        const test = hand.getAllTilesIncludingExposures ? hand.getAllTilesIncludingExposures() : hand.getTileArray();

        return this.validateHand(test, hand.isAllHidden());
    }

    /**
     * Diagnose why a hand is invalid by finding the closest matching hand
     * Identifies which tiles match vs. don't match the closest pattern
     * @param {CardHand} hand - Hand to diagnose
     * @returns {Object} {closestHand, closestGroup, rank, matchingTiles, nonMatchingTiles}
     */
    diagnoseInvalidHand(hand) {
        // Get all possible hands ranked by closeness
        const rankedHands = this.rankHandArray14(hand);
        this.sortHandRankArray(rankedHands);
        
        // The top-ranked hand is the closest match
        const closestMatch = rankedHands[0];
        
        // Collect all tiles that matched components
        const matchedTiles = new Set();
        for (const componentInfo of closestMatch.componentInfoArray) {
            for (const tile of componentInfo.tileArray) {
                matchedTiles.add(tile);
            }
        }
        
        // Get all tiles in hand (hidden + exposed)
        const allTiles = [];
        allTiles.push(...hand.getHiddenTileArray());
        for (const tileSet of hand.exposedTileSetArray) {
            allTiles.push(...tileSet.tileArray);
        }
        
        // Separate into matching and non-matching tiles
        const matchingTiles = [];
        const nonMatchingTiles = [];
        
        for (const tile of allTiles) {
            if (matchedTiles.has(tile)) {
                matchingTiles.push(tile);
            } else {
                nonMatchingTiles.push(tile);
            }
        }
        
        return {
            closestHand: closestMatch.hand.description,
            closestGroup: closestMatch.group.groupDescription,
            rank: closestMatch.rank,
            matchingTiles,
            nonMatchingTiles
        };
    }

    /**
     * Validate a 13-tile hand plus one additional tile for winning
     * @param {CardHand} hand - Hand with 13 tiles
     * @param {TileData} singleTile - The additional tile (14th tile)
     * @returns {boolean} True if hand+tile matches a valid winning pattern
     */
    validateHand13(hand, singleTile) {
        // Consolidate hand + singleTile to test array
        const test = hand.getTileArray();

        if (singleTile) {
            test.push(singleTile);
        }

        return this.validateHand(test, hand.isAllHidden());
    }

    // Input - tile array of length 14, allHidden
    // Output - validation info object
    /**
     * Validate tiles against all possible winning hands
     * @param {TileData[]} test - Array of tiles to validate
     * @param {boolean} allHidden - Whether all tiles are hidden (no exposures)
     * @returns {Object} {valid, tileCount, numJokers, minNumLow, minNumHigh, suits, allHidden}
     */
    validateHand(test, allHidden) {
        // Filter out blank tiles before validation
        const validationTiles = test.filter(tile => tile.suit !== SUIT.BLANK);

        // Must have exactly 14 non-blank tiles to win
        if (validationTiles.length !== 14) {
            return {
                valid: false,
                tileCount: test.length,
                numJokers: 0,
                minNumLow: 9999,
                minNumHigh: 9999,
                suits: [],
                allHidden
            };
        }

        // Validation info
        const info = {
            valid: false,
            tileCount: 0,
            numJokers: 0,
            minNumLow: 9999,
            minNumHigh: 9999,
            suits: [],
            allHidden
        };

        // Determine all suits  (dragons will be translated to CRACK, bam, dot)
        for (const tile of validationTiles) {
            let suit = tile.suit;
            if (suit === SUIT.DRAGON) {
                suit = tile.number;
            }
            if (info.suits.indexOf(suit) === -1) {
                info.suits.push(suit);
            }
            if (suit === SUIT.JOKER) {
                info.numJokers++;
            }
        }

        // Determine tile with smallest number
        info.minNumLow = 9999;
        info.minNumHigh = 9999;
        for (const tile of validationTiles) {
            if (tile.suit === SUIT.CRACK || tile.suit === SUIT.BAM || tile.suit === SUIT.DOT) {
                if (tile.number < info.minNumHigh) {
                    info.minNumHigh = tile.number;
                }
            }
        }
        // If >=3 jokers are present, then the minimum number could be in a range.  Test entire range.
        if (info.numJokers >= 3) {
            info.minNumLow = 1;
        } else {
            info.minNumLow = info.minNumHigh;
        }

        // Validate number of tiles
        info.tileCount = validationTiles.length;

        if (info.tileCount !== 14) {
            return info;
        }

        // Compare against all possible hands
        let found = false;

        outerLoop:
        for (const group of this.validHandGroups) {

            // Validate hand
            for (const validHand of group.hands) {

                debugTrace("Match hand: " + validHand.description + "\n");

                if (this.matchHand(validationTiles, info, group, validHand)) {
                    debugTrace("Match hand: found match\n");
                    found = true;
                    break outerLoop;
                } else {
                    debugTrace("Match hand: no match\n");
                }
            }

        }

        if (found) {
            info.valid = true;
        }

        return info;
    }

    /**
     * Test if tiles match a specific hand pattern
     * @param {TileData[]} test - Array of tiles to match
     * @param {Object} info - Hand validation info (suits, jokers, etc.)
     * @param {Object} handGroup - Hand group definition
     * @param {Object} validHand - Hand pattern to match against
     * @returns {boolean} True if tiles match this hand pattern
     */
    matchHand(test, info, handGroup, validHand) {
        let match = false;

        if (validHand.concealed && !info.allHidden) {
            return false;
        }

        // Calculate effective vsuitCount by considering both regular and dragon virtual suits
        // vsuitCount only accounts for regular VSUIT1/2/3, but VSUIT*_DRAGON components also need
        // valid vsuitArray positions. The vsuitArray values are used as dragon numbers (0=RED, 1=GREEN, 2=WHITE).
        const effectiveVsuitCount = this._getEffectiveVsuitCount(validHand);

        // Number of suits (crack,dot,bam,flower,dragon,wind,joker) must be >= number of vsuits
        if (info.suits.length < validHand.vsuitCount) {
            return false;
        }

        // Generate permutations of VSUIT1, VSUIT2, VSUIT3
        const permVsuit0 = [[-1, -1, -1]];

        const permVsuit1 = [
            [SUIT.CRACK, -1, -1],
            [SUIT.BAM, -1, -1],
            [SUIT.DOT, -1, -1]
        ];

        const permVsuit2 = [
            [SUIT.CRACK, SUIT.BAM, -1],
            [SUIT.CRACK, SUIT.DOT, -1],
            [SUIT.BAM, SUIT.CRACK, -1],
            [SUIT.BAM, SUIT.DOT, -1],
            [SUIT.DOT, SUIT.CRACK, -1],
            [SUIT.DOT, SUIT.BAM, -1]
        ];

        const permVsuit3 = [
            [SUIT.CRACK, SUIT.BAM, SUIT.DOT],
            [SUIT.CRACK, SUIT.DOT, SUIT.BAM],
            [SUIT.BAM, SUIT.CRACK, SUIT.DOT],
            [SUIT.BAM, SUIT.DOT, SUIT.CRACK],
            [SUIT.DOT, SUIT.CRACK, SUIT.BAM],
            [SUIT.DOT, SUIT.BAM, SUIT.CRACK]
        ];

        let permArray = null;
        switch (effectiveVsuitCount) {
        case 1:
            permArray = permVsuit1;
            break;
        case 2:
            permArray = permVsuit2;
            break;
        case 3:
            permArray = permVsuit3;
            break;
        default:
            // No virtual suits used
            permArray = permVsuit0;
            break;
        }

        // Iterate over minNum range (may be an unknown range due to jokers)
        for (let minNum = info.minNumLow; minNum <= info.minNumHigh; minNum++) {
            debugTrace("minNum = " + minNum + "\n");

            // Iterate over permutations of virtual suits
            for (const vsuitArray of permArray) {
                debugTrace("VsuitArray = " + vsuitArray + "\n");

                // Validate components of hand
                match = this.matchComponents(test, info, validHand, vsuitArray, minNum);
                if (match) {
                    break;
                }
            }
            if (match) {
                break;
            }
        }

        return match;
    }

    matchComponents(test, info, validHand, vsuitArray, minNum) {
        let match = true;

        // Make sure odd/even hand has minNum set appropriately
        if (minNum !== 9999) {
            if (validHand.even && (minNum & 0x1)) {
                return false;
            }

            if (validHand.odd && !(minNum & 0x1)) {
                return false;
            }
        }

        // Make copy of test array
        const testCopy = [];
        for (const tile of test) {
            testCopy.push(tile);
        }

        let compIndex = 0;

        for (const comp of validHand.components) {
            let count = 0;
            let compSuit = comp.suit;
            let compNum = comp.number;

            debugTrace("Component index: " + compIndex + "\n");

            // Translate virtual suit to real suit using vsuitArray
            if (compSuit >= SUIT.VSUIT1_DRAGON) {
                compNum = vsuitArray[compSuit - SUIT.VSUIT1_DRAGON];
                compSuit = SUIT.DRAGON;
            } else if (compSuit >= SUIT.VSUIT1) {
                // VSUIT
                compSuit = vsuitArray[compSuit - SUIT.VSUIT1];

                //  VNUMBER
                if (compNum > 9) {
                    compNum = minNum + compNum - VNUMBER.CONSECUTIVE1;
                }
            }
            // Search testCopy for tiles that match components
            let found = false;
            do {
                found = false;
                for (const tile of testCopy) {
                    if (tile.suit === compSuit && tile.number === compNum) {
                        // Found tile match
                        found = true;
                        // Remove tile from testCopy array
                        const index = testCopy.indexOf(tile);
                        testCopy.splice(index, 1);

                        count++;
                        break;
                    }
                }

                if (!found && (comp.count > 2)) {
                    // Tile not found, use joker if possible
                    // - component count > 2 (i.e. no single or pair)

                    for (const tile of testCopy) {
                        if (tile.suit === SUIT.JOKER) {
                            // Found tile match
                            found = true;
                            // Remove tile from testCopy array
                            const index = testCopy.indexOf(tile);
                            testCopy.splice(index, 1);

                            count++;
                            break;
                        }
                    }
                }

            } while (found && (count < comp.count));

            if (count === comp.count) {
                debugTrace("Component Match: yes\n");
            } else {
                debugTrace("Component Match: no\n");
                match = false;
                break;
            }

            compIndex++;
        }

        return match;
    }

    /**
     * Print validation info to debug console
     * @param {Object} info - Validation info object from validateHand()
     * @returns {void}
     */
    printValidationInfo(info) {
        if (!gdebug) {
            return;
        }
        debugPrint("valid = " + info.valid + "\n");
        debugPrint("tileCount = " + info.tileCount + "\n");
        debugPrint("numJokers = " + info.numJokers + "\n");
        debugPrint("minNumLow = " + info.minNumLow + "\n");
        debugPrint("minNumHigh = " + info.minNumHigh + "\n");
        let suitStr = "";
        for (const suit of info.suits) {
            suitStr += suit + ", ";
        }
        debugPrint("suit(s) = " + suitStr + "\n");
    }

    /**
     * Rank a 14-tile hand against all possible winning hands
     * @param {CardHand} hand - Hand with 14 tiles (hidden + exposed)
     * @returns {Array} Array of rankInfo objects (unsorted, in group/hand order)
     */
    rankHandArray14(hand) {
        const rankCardHands = [];

        for (const group of this.validHandGroups) {
            for (const validHand of group.hands) {
                // Add new Rank info for this validHand
                const rankInfo = {
                    group,
                    hand: validHand,
                    rank: 0,
                    componentInfoArray: [],
                    vsuitArray: null  // Store the vsuitArray that produced this ranking
                };
                rankCardHands.push(rankInfo);

                this.rankHand(hand, rankInfo, validHand);
            }
        }

        return rankCardHands;
    }


    /**
     * Compute rank score for a hand against a specific pattern
     * Populates rankInfo with rank score and component matching info
     * @param {CardHand} hand - Hand to rank
     * @param {Object} rankInfo - RankInfo object to populate (from rankHandArray14)
     * @param {Object} validHand - Hand pattern to rank against
     * @returns {void}
     */
    rankHand(hand, rankInfo, validHand) {

        // Rank is 0 if test hand has exposures and validHand is required to be concealed
        if (validHand.concealed && !hand.isAllHidden()) {
            rankInfo.rank = 0;

            return;
        }

        // Calculate effective vsuitCount by considering both regular and dragon virtual suits
        // vsuitCount only accounts for regular VSUIT1/2/3, but VSUIT*_DRAGON components also need
        // valid vsuitArray positions. The vsuitArray values are used as dragon numbers (0=RED, 1=GREEN, 2=WHITE).
        const effectiveVsuitCount = this._getEffectiveVsuitCount(validHand);

        // Generate permutations of VSUIT1, VSUIT2, VSUIT3
        const permVsuit0 = [[-1, -1, -1]];

        const permVsuit1 = [
            [SUIT.CRACK, -1, -1],
            [SUIT.BAM, -1, -1],
            [SUIT.DOT, -1, -1]
        ];

        const permVsuit2 = [
            [SUIT.CRACK, SUIT.BAM, -1],
            [SUIT.CRACK, SUIT.DOT, -1],
            [SUIT.BAM, SUIT.CRACK, -1],
            [SUIT.BAM, SUIT.DOT, -1],
            [SUIT.DOT, SUIT.CRACK, -1],
            [SUIT.DOT, SUIT.BAM, -1]
        ];

        const permVsuit3 = [
            [SUIT.CRACK, SUIT.BAM, SUIT.DOT],
            [SUIT.CRACK, SUIT.DOT, SUIT.BAM],
            [SUIT.BAM, SUIT.CRACK, SUIT.DOT],
            [SUIT.BAM, SUIT.DOT, SUIT.CRACK],
            [SUIT.DOT, SUIT.CRACK, SUIT.BAM],
            [SUIT.DOT, SUIT.BAM, SUIT.CRACK]
        ];

        let permArray = null;
        switch (effectiveVsuitCount) {
        case 1:
            permArray = permVsuit1;
            break;
        case 2:
            permArray = permVsuit2;
            break;
        case 3:
            permArray = permVsuit3;
            break;
        default:
            // No virtual suits used
            permArray = permVsuit0;
            break;
        }

        // Determine if virtual number are used by any components
        let bVirtualNumbers = false;
        for (const comp of validHand.components) {
            if (comp.number > 9) {
                bVirtualNumbers = true;
                break;
            }
        }

        let start = 1;
        let end = 1;
        let delta = 1;

        if (bVirtualNumbers) {
            end = 9;
            if (validHand.odd) {
                start = 1;
                end = 9;
                delta = 2;
            } else if (validHand.even) {
                start = 2;
                end = 8;
                delta = 2;
            }
        }

        // Iterate over all potential starting numbers for CONSECUTIVE1
        for (let minNum = start; minNum <= end; minNum += delta) {
            // Iterate over permutations of virtual suits
            for (const vsuitArray of permArray) {
                // Group tiles into matching components
                const componentInfoArray = this.rankFormComponents(hand, minNum, validHand, vsuitArray);

                // Calculate ranking
                let rank = 0;
                for (const componentInfo of componentInfoArray) {
                    const comp = componentInfo.component;
                    const count = componentInfo.tileArray.length;

                    // Update rank based on number of matching tiles (count) with the component length (comp.count)
                    // Each component is worth 100 * comp.count / 14.
                    rank += (100 * comp.count / 14) * (count / comp.count);
                }

                // Use maximum rank of all permutations
                if (rank > rankInfo.rank) {
                    rankInfo.rank = rank;
                    rankInfo.componentInfoArray = componentInfoArray;
                    rankInfo.vsuitArray = vsuitArray;  // Store the vsuitArray that produced this ranking
                }
            }
        }
    }

    /**
     * Try to match tile set against a component pattern
     * @param {TileData[]} test - Tile array to match (not modified)
     * @param {number} minNum - Minimum tile number for virtual number translation
     * @param {Object} comp - Component pattern to match
     * @param {Array} vsuitArray - Virtual suit array mapping
     * @returns {Object} {match: boolean, tileArray: TileData[]} Tiles that match the component
     */
    rankMatchComp(test, minNum, comp, vsuitArray) {
        let compSuit = comp.suit;
        let compNum = comp.number;
        const matchInfo = {
            match: false,
            tileArray: []
        };

        if (test.length === 0) {
            return matchInfo;
        }

        // Translate virtual suit to real suit using vsuitArray
        if (compSuit >= SUIT.VSUIT1_DRAGON) {
            compNum = vsuitArray[compSuit - SUIT.VSUIT1_DRAGON];
            compSuit = SUIT.DRAGON;
        } else if (compSuit >= SUIT.VSUIT1) {
            // VSUIT
            compSuit = vsuitArray[compSuit - SUIT.VSUIT1];

            //  VNUMBER
            if (compNum > 9) {
                compNum = minNum + compNum - VNUMBER.CONSECUTIVE1;
            }
        }

        for (const tile of test) {
            let match = false;
            if (tile.suit === compSuit && tile.number === compNum) {
                match = true;
            } else if (tile.suit === SUIT.JOKER) {
                match = true;
            }

            if (match) {
                matchInfo.tileArray.push(tile);
                if (matchInfo.tileArray.length === comp.count) {
                    break;
                }
            }
        }

        if (test.length === comp.count && matchInfo.tileArray.length === comp.count) {
            // Perfect match
            matchInfo.match = true;
        }

        return matchInfo;
    }

    rankFormComponents(hand, minNum, validHand, vsuitArray) {

        // Init ranking results  (return value)
        const componentInfoArray = [];
        for (const comp of validHand.components) {
            // Component Info - return actual tiles representing the component.
            // AI needs this for pung/kong/quint decisions
            const componentInfo = {
                component: comp,
                tileArray: []
            };
            componentInfoArray.push(componentInfo);
        }

        // Remaining components infos
        const remCompInfo = [];
        for (const componentInfo of componentInfoArray) {
            remCompInfo.push(componentInfo);
        }

        // To avoid errors in matching, match components to tiles in the following order:
        // 1. Exposed tiles (including exposed jokers)
        // 2. Hidden tiles (excluding jokers)
        // 3. Hidden Jokers

        // 1. Handle Exposed tilesets
        for (const tileSet of hand.exposedTileSetArray) {
            // Check components in their original order
            for (const componentInfo of componentInfoArray) {
                if (componentInfo.tileArray.length > 0) {
                    continue; // Already has tiles assigned
                }
                
                const matchInfo = this.rankMatchComp(tileSet.tileArray, minNum, componentInfo.component, vsuitArray);
                if (matchInfo.match) {
                    // Exactly matching component
                    componentInfo.tileArray = matchInfo.tileArray;
                    break;
                }
            }
            
            // Verify all exposed tiles were processed
            let allTilesProcessed = true;
            for (const tile of tileSet.tileArray) {
                let found = false;
                for (const componentInfo of componentInfoArray) {
                    if (componentInfo.tileArray.includes(tile)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    allTilesProcessed = false;
                    break;
                }
            }
            
            if (!allTilesProcessed) {
                // Exposures must match exactly to the component. Otherwise, we stop.
                return componentInfoArray;
            }
        }

        // Remaining hidden tiles
        const remHiddenTiles = hand.getHiddenTileArray();
        const remHiddenTilesWithoutJokers = [];
        const remHiddenJokers = [];

        for (const tile of remHiddenTiles) {
            if (tile.suit === SUIT.JOKER) {
                remHiddenJokers.push(tile);
            } else {
                remHiddenTilesWithoutJokers.push(tile);
            }
        }

        // 2. Handle Hidden tiles (without jokers)
        // Process components in their original order to maintain the pattern sequence
        for (const componentInfo of componentInfoArray) {
            const comp = componentInfo.component;
            
            // Skip if this component already has tiles from exposed tile processing
            if (componentInfo.tileArray.length > 0) {
                continue;
            }
            
            const matchInfo = this.rankMatchComp(remHiddenTilesWithoutJokers, minNum, comp, vsuitArray);

            componentInfo.tileArray = matchInfo.tileArray;

            // Remove the tiles from the remaining tiles array
            for (const tile of matchInfo.tileArray) {
                const index = remHiddenTilesWithoutJokers.indexOf(tile);
                if (index !== -1) {
                    remHiddenTilesWithoutJokers.splice(index, 1);
                }
            }
        }

        // 3. Handle Hidden Jokers
        //    Add jokers to pung/kongs/quints (if needed)

        for (const joker of remHiddenJokers) {
            let comp2 = null;
            let comp1 = null;
            let compAny = null;
            for (const componentInfo of remCompInfo) {
                const delta = componentInfo.component.count - componentInfo.tileArray.length;
                if ((componentInfo.component.count >= 3) && delta) {
                    switch (delta) {
                    case 2:
                        comp2 = componentInfo;
                        break;
                    case 1:
                        comp1 = componentInfo;
                        break;
                    default:
                        compAny = componentInfo;
                        break;
                    }
                }
            }

            // Add joker
            if (comp1) {
                comp1.tileArray.push(joker);
            } else if (comp2) {
                comp2.tileArray.push(joker);
            } else if (compAny) {
                compAny.tileArray.push(joker);
            }
        }

        return componentInfoArray;
    }

    // Calculate the effective vsuitCount for a hand by considering both regular virtual suits
    // (VSUIT1/2/3) AND dragon virtual suits (VSUIT1/2/3_DRAGON).
    // This is necessary because vsuitCount in hand definitions only accounts for regular virtual suits,
    // but VSUIT*_DRAGON components also require valid vsuitArray positions.
    // The vsuitArray values serve dual purposes:
    // - For regular VSUITs: map to actual suits (CRACK=0, BAM=1, DOT=2)
    // - For VSUIT*_DRAGONs: map to dragon numbers (RED=0, GREEN=1, WHITE=2)
    _getEffectiveVsuitCount(validHand) {
        let maxIndex = -1;
        
        for (const comp of validHand.components) {
            if (comp.suit >= SUIT.VSUIT1_DRAGON && comp.suit <= SUIT.VSUIT3_DRAGON) {
                // Dragon virtual suit - index is 0, 1, or 2
                const index = comp.suit - SUIT.VSUIT1_DRAGON;
                maxIndex = Math.max(maxIndex, index);
            } else if (comp.suit >= SUIT.VSUIT1 && comp.suit <= SUIT.VSUIT3) {
                // Regular virtual suit - index is 0, 1, or 2
                const index = comp.suit - SUIT.VSUIT1;
                maxIndex = Math.max(maxIndex, index);
            }
        }
        
        // Return effective count (1, 2, or 3 based on max index, or 0 if no virtual suits)
        return maxIndex >= 0 ? maxIndex + 1 : 0;
    }

    /**
     * Sort hand rank array by rank score (descending)
     * @param {Array} rankCardHands - Array of rankInfo objects (from rankHandArray14)
     * @returns {void} Sorts in place
     */
    sortHandRankArray(rankCardHands) {
        rankCardHands.sort((a, b) => b.rank - a.rank);
    }

    /**
     * Print hand rank array to debug console
     * @param {Array} rankCardHands - Array of rankInfo objects
     * @param {number} [elemCount] - Number of elements to print (default all)
     * @returns {void}
     */
    printHandRankArray(rankCardHands, elemCount) {
        debugPrint("Hand Rank Info\n");

        let count = rankCardHands.length;
        if (elemCount) {
            count = Math.min(elemCount, count);
        }

        for (let i = 0; i < count; i++) {
            const rankInfo = rankCardHands[i];
            debugPrint("Group = " + rankInfo.group.groupDescription + "\n");
            debugPrint("Hand = " + rankInfo.hand.description + "\n");
            debugPrint("Rank = " + rankInfo.rank + "\n");

            // Components
            let str = "";
            for (const compInfo of rankInfo.componentInfoArray) {
                str += "[" + compInfo.component.count + "] ";
                for (const tile of compInfo.tileArray) {
                    str += tile.getText() + " ";
                }
            }
            debugPrint(str);
        }
    }
}

