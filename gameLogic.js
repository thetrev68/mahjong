import {printMessage, printInfo, debugPrint, printHint, sleep} from "./utils.js";
import {STATE, PLAYER_OPTION, PLAYER, SUIT, VNUMBER, getTotalTileCount} from "./constants.js";
import {GameAI} from "./gameAI.js";
import {Card} from "./card/card.js";
import {Tile} from "./gameObjects.js";
import {} from "./gameObjects_hand.js";

import { renderPatternVariation } from "./tileDisplayUtils.js";

class HintAnimationManager {
    constructor(gameLogic) {
        this.gameLogic = gameLogic;
        this.savedGlowData = null;
        this.currentHintData = null;
        this.isPanelExpanded = false;
        this.glowedTiles = [];
    }

    // Apply glow effects to discard suggestion tiles
    applyGlowToDiscardSuggestions(recommendations) {
        this.clearAllGlows();

        const top3Recs = recommendations.slice(0, 3);
        const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand;

        // Track which tiles we've already highlighted to handle duplicates
        const highlightedTiles = new Set();

        // Filter out invalid tiles
        const validTopRecs = top3Recs.filter(rec => rec.tile.suit !== SUIT.INVALID);
        
        validTopRecs.forEach((rec, index) => {
            debugPrint(`Processing tile ${index + 1}: ${rec.tile.getText()} with recommendation ${rec.recommendation}`); // Debug log
            
            const targetTile = this.findNextUnhighlightedTileInHand(hand, rec.tile, highlightedTiles);
            if (targetTile) {
                debugPrint(`Applying red glow to tile: ${targetTile.getText()}`); // Debug log
                targetTile.addGlowEffect(this.gameLogic.scene, 0xff0000, 0.6);
                this.glowedTiles.push(targetTile);
                // Mark this specific tile instance as highlighted
                highlightedTiles.add(targetTile);
            } else {
                debugPrint(`Could not find tile for: ${rec.tile.getText()}`); // Debug log
            }
        });
        
        debugPrint(`Applied glow to ${this.glowedTiles.length} tiles out of ${validTopRecs.length} valid tiles requested`); // Debug log

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
        const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand.dupHand();

        // Add invalid tile if hand has 13 tiles, as the engine expects 14
        if (hand.getLength() === 13) {
            const invalidTile = new Tile(SUIT.INVALID, VNUMBER.INVALID);
            hand.insertHidden(invalidTile);
        }

        const recommendations = this.gameLogic.gameAI.getTileRecommendations(hand);
        
        // Reverse for display: DISCARD, PASS, KEEP
        return recommendations.reverse();
    }

    // Get all tiles in player's hand (hidden + exposed)
    getAllPlayerTiles() {
        const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand;
        const allTiles = [...hand.getHiddenTileArray()];
        
        hand.exposedTileSetArray.forEach(set => {
            allTiles.push(...set.tileArray);
        });
        
        return allTiles;
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
        const recommendations = this.getRecommendations();
        const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand.dupHand();
        if (hand.getLength() === 13) {
            hand.insertHidden(new Tile(SUIT.INVALID, VNUMBER.INVALID));
        }
        const rankCardHands = this.gameLogic.card.rankHandArray14(hand);
        this.gameLogic.card.sortHandRankArray(rankCardHands);

        // Update visual glow effects (only if panel is expanded)
        this.applyGlowToDiscardSuggestions(recommendations);

        // Always update hint text content
        this.updateHintDisplay(rankCardHands, recommendations);
    }

    // New method for updating hint text without glow effects
    updateHintDisplayOnly() {
        const recommendations = this.getRecommendations();
        const hand = this.gameLogic.table.players[PLAYER.BOTTOM].hand.dupHand();
        if (hand.getLength() === 13) {
            hand.insertHidden(new Tile(SUIT.INVALID, VNUMBER.INVALID));
        }
        const rankCardHands = this.gameLogic.card.rankHandArray14(hand);
        this.gameLogic.card.sortHandRankArray(rankCardHands);

        // Update hint text content only (no glow effects)
        this.updateHintDisplay(rankCardHands, recommendations);
    }

    // Update hint panel text with colorized patterns
    updateHintDisplay(rankCardHands, recommendations) {
        let html = "<h3>Top Possible Hands:</h3>";
        
        // Get all player tiles for matching
        const playerTiles = this.getAllPlayerTiles();
        
        for (let i = 0; i < Math.min(3, rankCardHands.length); i++) {
            const rankHand = rankCardHands[i];
            html += `<p><strong>${rankHand.group.groupDescription}</strong> - ${rankHand.hand.description} (Rank: ${rankHand.rank.toFixed(2)})</p>`;
            
            // Render colorized pattern with matching
            const patternHtml = renderPatternVariation(rankHand, playerTiles);
            html += patternHtml;
        }

        html += "<h3>Discard Suggestions (Best to Discard First):</h3>";
        const validRecommendations = recommendations.filter(rec => rec.tile.suit !== SUIT.INVALID);
        for (let i = 0; i < Math.min(3, validRecommendations.length); i++) {
            const rec = validRecommendations[i];
            html += `<p>${rec.tile.getText()} (Action: ${rec.recommendation})</p>`;
        }

        printHint(html);
    }
}

export class GameLogic {
    constructor(scene) {
        this.scene = scene;
        this.state = STATE.INIT;
        // Will be set later
        this.table = null;
        this.card = null;
        this.gameAI = null;
        this.currPlayer = 0;
        this.button1Function = null;
        this.button2Function = null;
        this.button3Function = null;
        this.button4Function = null;
        this.sort1Function = null;
        this.sort2Function = null;
        this.hintFunction = null;
        this.startButtonFunction = null;
        this.hintAnimationManager = null;
        this.errorText = null;
        this.errorTextArray = [];
        this.errorTextSemaphore = 0;
        this.discardTile = null;
        this.gameResult = {mahjong: false,
            winner: 0};
    }

    async init() {
        const year = window.settingsManager.getCardYear();
        this.card = new Card(year);
        await this.card.init();
        this.gameAI = new GameAI(this.card, this.table);
        this.hintAnimationManager = new HintAnimationManager(this);

        printMessage("Using " + this.card.year + " Mahjong card\n\n");

        // Populate hand select
        const handSelect = window.document.getElementById("handSelect");
        for (const group of this.card.validHandGroups) {
            const optionGroup = window.document.createElement("optgroup");
            optionGroup.label = group.groupDescription;
            handSelect.add(optionGroup);

            for (const validHand of group.hands) {
                const option = window.document.createElement("option");
                option.text = validHand.description;
                handSelect.add(option);
            }
        }
    }

    start() {
        // START
        this.state = STATE.START;
        this.updateUI();

        this.gameResult.mahjong = false;
        this.gameResult.winner = 0;

        this.table.switchPlayer(PLAYER.BOTTOM);

        // Reset table
        this.table.reset();

        // Clear glow effects when starting new game
        this.hintAnimationManager.clearAllGlows();

        // Start background music
        if (this.scene.audioManager) {
            this.scene.audioManager.playBGM("bgm");
        }

        this.deal();
    }

    deal() {
        // DEAL
        this.state = STATE.DEAL;
        this.updateUI();

        // Create hand for debugging / testing
        const initPlayerHandArray = [null, null, null, null];

        const trainInfo = this.getTrainingInfo();

        if (trainInfo.trainCheckbox) {
            // Player 0  (14 tiles)
            initPlayerHandArray[0] = this.card.generateHand(trainInfo.handDescription, trainInfo.numTiles);
        }

        // Perform sequential dealing animation
        this.sequentialDealTiles(initPlayerHandArray, () => {
            // Start automatic hints for player 0 after sequential dealing completes
            if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0) {
                this.hintAnimationManager.updateHintsForNewTiles();
            }
        });

        // Debugging - skip charleston
        if (trainInfo.trainCheckbox && trainInfo.skipCharlestonCheckbox) {
            this.loop();
        } else {
            this.charleston();
        }


    }

    async charleston() {
        // CHARLESTON
        this.state = STATE.CHARLESTON1;
        this.updateUI();

        await this.charlestonPass(PLAYER.RIGHT);
        // Update hints after Charleston pass 1 is complete (player 0 has received tiles)
        if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0) {
            this.hintAnimationManager.updateHintsForNewTiles();
        }

        await this.charlestonPass(PLAYER.TOP);
        // Update hints after Charleston pass 2 is complete
        if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0) {
            this.hintAnimationManager.updateHintsForNewTiles();
        }

        await this.charlestonPass(PLAYER.LEFT);
        // Update hints after Charleston pass 3 is complete
        if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0) {
            this.hintAnimationManager.updateHintsForNewTiles();
        }

        // Continue Charleston?
        this.state = STATE.CHARLESTON_QUERY;
        this.updateUI();

        const query = await this.yesNoQuery();

        this.state = STATE.CHARLESTON_QUERY_COMPLETE;
        this.updateUI();

        if (query === true) {
            this.state = STATE.CHARLESTON2;
            this.updateUI();

            await this.charlestonPass(PLAYER.LEFT);
            // Update hints after Charleston pass 4 is complete
            if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0) {
                this.hintAnimationManager.updateHintsForNewTiles();
            }

            await this.charlestonPass(PLAYER.TOP);
            // Update hints after Charleston pass 5 is complete
            if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0) {
                this.hintAnimationManager.updateHintsForNewTiles();
            }

            await this.charlestonPass(PLAYER.RIGHT);
            // Update hints after Charleston pass 6 is complete
            if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0) {
                this.hintAnimationManager.updateHintsForNewTiles();
            }
        }

        this.state = STATE.COURTESY_QUERY;
        this.updateUI();

        const player0CourtesyVote = await this.courtesyQuery();

        this.state = STATE.COURTESY_QUERY_COMPLETE;
        this.updateUI();

        this.state = STATE.COURTESY;
        this.updateUI();

        // Get courtesy votes for all players
        const courtesyVoteArray = [];

        courtesyVoteArray[0] = player0CourtesyVote;
        for (let i = 1; i < 4; i++) {
            courtesyVoteArray[i] = this.gameAI.courtesyVote(i);
        }

        for (let i = 0; i < 4; i++) {
            printMessage("Player " + i + " wants to exchange " + courtesyVoteArray[i] + " tiles\n");
        }

        // Perform courtesy voting
        this.table.courtesyVote(courtesyVoteArray);

        if (this.table.player02CourtesyVote > 0) {
            // Wait for user to select courtesy pass tiles
            await this.courtesyPass();
        }

        this.state = STATE.COURTESY_COMPLETE;
        this.updateUI();

        // Only process courtesy pass if tiles are being exchanged
        if (this.table.player02CourtesyVote > 0 || this.table.player13CourtesyVote > 0) {
            const courtesyPassArray = [];

            // Player 0 (human) pressed "Pass" button
            courtesyPassArray[0] = this.table.players[0].hand.getSelectionHidden();

            // Reset selectCount
            this.table.players[0].hand.resetSelection();

            // Remove from tile set
            for (const tile of courtesyPassArray[0]) {
                this.table.players[0].hand.removeHidden(tile);
            }

            // Players 1 - 3, get courtesy pass.
            // Note: tiles are removed from player's hands
            courtesyPassArray[1] = this.gameAI.courtesyPass(1, this.table.player13CourtesyVote);
            courtesyPassArray[2] = this.gameAI.courtesyPass(2, this.table.player02CourtesyVote);
            courtesyPassArray[3] = this.gameAI.courtesyPass(3, this.table.player13CourtesyVote);

            // Perform courtesy pass exchange
            const receivedTiles = this.table.courtesyPass(courtesyPassArray);

            // Add blue glow to received tiles for player 0
            if (receivedTiles && receivedTiles.length > 0) {
                for (const tile of receivedTiles) {
                    tile.addGlowEffect(this.scene, 0x1e90ff, 0.7, 10); // DodgerBlue color, high priority
                }

                // Remove glow and sort after delay
                setTimeout(() => {
                    for (const tile of receivedTiles) {
                        tile.removeGlowEffect();
                    }
                    // Sort hand by suit after glow ends
                    this.table.players[PLAYER.BOTTOM].hand.sortSuitHidden();
                    this.table.players[PLAYER.BOTTOM].showHand(true);
                    // Update hints with the sorted hand
                    this.hintAnimationManager.updateHintsForNewTiles();
                }, 2000); // 2.0 second delay
            }
        }

        // Update hints after courtesy pass is complete (for player 0) - only if no tiles were received
        if (this.table.players[PLAYER.BOTTOM].hand.getLength() > 0 &&
            (this.table.player02CourtesyVote === 0 && this.table.player13CourtesyVote === 0)) {
            this.hintAnimationManager.updateHintsForNewTiles();
        }

        printMessage("Courtesy complete\n");

        // Start main game loop
        this.loop();


    }

    // Main loop
    // For current player
    //      Pick from wall  (except dealer on first turn)
    //      Choose discard
    //      Query if other players want it (no prompt needed for dealers discard)
    async loop() {
        // Dealer doesn't get a first wall pick
        let skipPick = true;

        this.currPlayer = 0;

        while (true) {
            // Update table
            this.table.switchPlayer(this.currPlayer);

            this.state = STATE.LOOP_PICK_FROM_WALL;
            this.updateUI();

            // PICK TILE FROM WALL
            if (!skipPick) {
                const pick = this.pickFromWall();
                if (!pick) {
                    // No more tiles - wall game.
                    break;
                }

                // Note: For Player 0, hints are updated after a delay in pickFromWall()
                // to allow visual feedback (blue glow) and automatic sorting
            }
            skipPick = false;

            this.state = STATE.LOOP_CHOOSE_DISCARD;
            this.updateUI();

            // CHOOSE TILE TO DISCARD (or mahjong!)
            // eslint-disable-next-line no-await-in-loop
            const discardInfo = await this.chooseDiscard();
            // Only call showHand() if tiles haven't been dragged this turn
            // Dragged tiles are already positioned correctly by drag operations
            if (!this.table.players[this.currPlayer].hand.tilesWereDraggedThisTurn) {
                this.table.players[this.currPlayer].showHand(this.currPlayer === PLAYER.BOTTOM);
            }
            // Reset drag flag for next turn
            this.table.players[this.currPlayer].hand.tilesWereDraggedThisTurn = false;

            if (this.currPlayer !== PLAYER.BOTTOM) {
                // eslint-disable-next-line no-await-in-loop
                await sleep(500);
            }

            if (discardInfo.playerOption === PLAYER_OPTION.MAHJONG) {
                this.gameResult.mahjong = true;
                this.gameResult.winner = this.currPlayer;
                break;
            }

            const discardTile = discardInfo.tileArray[0];

            if (discardTile.suit === SUIT.JOKER) {
                // Joker discarded - add to discard pile
                this.table.discards.insertDiscard(discardTile);
                this.table.discards.showDiscards();

                // Play tile dropping sound (Jokers don't animate, so play immediately)
                if (this.scene.audioManager) {
                    this.scene.audioManager.playSFX("tile_dropping");
                }

                //  Move to next player
                this.currPlayer++;
                if (this.currPlayer > 3) {
                    this.currPlayer = 0;
                }
                continue;
            }

            // CLAIM DISCARD? (for exposure/mahjong).

            // Animate and show tile
            discardTile.scale = 1.0;
            discardTile.showTile(true, true);

            // Add a dynamic dark blue glow that will follow the animation
            discardTile.addGlowEffect(this.scene, 0x1e3a8a, 0.9); // 0x1e3a8a is dark blue for better contrast

            // Store desired depth before animation
            discardTile.sprite.depth = 200;
            discardTile.spriteBack.depth = 200;

            // Now animate. The glow will follow automatically because the
            // animate() method is being updated to handle it.
            const discardTween = discardTile.animate(350, 420, 0);

            // Add onComplete callback to play sound when tile hits discard pile
            if (discardTween && this.scene.audioManager) {
                discardTween.on("complete", () => {
                    this.scene.audioManager.playSFX("tile_dropping");
                });
            }

            // Ask all players if the discard is wanted  (currPlayer == i automatically returns discard)
            const claimArray = [];
            for (let i = 0; i < 4; i++) {
                // eslint-disable-next-line no-await-in-loop
                claimArray[i] = await this.claimDiscard(i, discardTile);
            }

            // Process claim array for each player
            // Returns {playerOption, winningPlayer}
            const claimResult = this.table.processClaimArray(this.currPlayer, claimArray, discardTile);

            // Clear highlight effect after claim is processed
            discardTile.removeGlowEffect();
            discardTile.sprite.depth = 0;

            if (claimResult.playerOption === PLAYER_OPTION.MAHJONG) {
                this.gameResult.mahjong = true;
                this.gameResult.winner = claimResult.winningPlayer;
                break;
            }

            if (claimResult.playerOption === PLAYER_OPTION.EXPOSE_TILES) {
                // Tile claimed with exposure. Winning Player is next to discard.
                this.currPlayer = claimResult.winningPlayer;
                skipPick = true;

                const text = discardTile.getText();
                printMessage("Player " + this.currPlayer + " *claims* " + text + " \n");

                // Update hints after claiming discard (for player 0)
                if (this.currPlayer === PLAYER.BOTTOM) {
                    this.hintAnimationManager.updateHintsForNewTiles();
                }
            } else {
                // Tile discarded - move to next player
                this.currPlayer++;
                if (this.currPlayer > 3) {
                    this.currPlayer = 0;
                }
            }

            // Validate tile count is always 160 (152 base + 8 blanks if enabled)
            let tileCount = 0;
            tileCount += this.table.wall.tileArray.length;
            tileCount += this.table.discards.tileArray.length;
            for (let i = 0; i < 4; i++) {
                tileCount += this.table.players[i].hand.getLength();
            }
            // Dynamic tile count based on settings (152 or 160 with blanks)
            const expectedTileCount = getTotalTileCount();
            if (tileCount !== expectedTileCount) {
                printMessage("ERROR - total tile count is not " + expectedTileCount + ". Tile count = " + tileCount + "\n");
            }
        }

        this.end();
    }

    async end() {
        // Start button will be enabled
        this.state = STATE.END;
        
        // Trigger fireworks display for player 0 victory
        if (this.gameResult.mahjong && this.gameResult.winner === 0) {
            try {
                await this.scene.createFireworksDisplay(this.gameResult);
            } catch (error) {
                console.warn("[GameLogic] Fireworks display error:", error);
            }
        }
        
        this.updateUI();
    }

    pickFromWall() {
        const tile = this.table.wall.remove();
        // Wall text is now hidden - counter handles display
        this.scene.updateWallTileCounter(this.table.wall.getCount());

        if (tile) {
            printMessage("Player " + this.currPlayer + " picks from wall\n");
            debugPrint("Player " + this.currPlayer + " picks " + tile.getText() + " from wall\n");

            this.table.players[this.currPlayer].hand.insertHidden(tile);

            // For human player, add visual feedback and delay sorting
            if (this.currPlayer === PLAYER.BOTTOM) {
                // Add blue glow to newly drawn tile so user can identify it
                tile.addGlowEffect(this.scene, 0x1e90ff, 0.7, 10); // DodgerBlue color, high priority

                // Sort after a brief delay to let user see which tile was drawn
                // Then update hints with the sorted hand
                setTimeout(() => {
                    tile.removeGlowEffect();
                    this.table.players[PLAYER.BOTTOM].hand.sortSuitHidden();
                    this.table.players[PLAYER.BOTTOM].showHand(true);
                    // Update hints now that hand is sorted
                    this.hintAnimationManager.updateHintsForNewTiles();
                }, 2000); // 2.0 second delay
            }

            // Note: rack_tile sound is played in showTileSetInRack/showTileSetInRackVertical
            // when tile animation completes (tile hits the rack)
            this.table.players[this.currPlayer].showHand(this.currPlayer === PLAYER.BOTTOM);

            return true;
        }

        return false;
    }

    // Return promise with discard info
    //      Discard/mahjong
    //      TileArray (if discard)
    chooseDiscard() {
        let promise = null;

        // Player i picks discard
        if (this.currPlayer === PLAYER.BOTTOM) {
            // Create promise to return the discarded tile (async operation)
            promise = new Promise(
                (resolve) => {
                    // Human player picks own discard. Setup discard button.
                    const button1 = window.document.getElementById("button1");

                    button1.removeEventListener("click", this.button1Function);
                    this.button1Function = function button1Function() {
                        const discardedTile = this.table.players[this.currPlayer].hand.removeDiscard();
                        const text = discardedTile.getText();
                        printMessage("Player " + this.currPlayer + " discards " + text + " \n");

                        const tileArray = [];
                        tileArray.push(discardedTile);

                        resolve({playerOption: PLAYER_OPTION.DISCARD_TILE,
                            tileArray});
                    }.bind(this);
                    button1.addEventListener("click", this.button1Function);

                    // Exchange jokers button
                    const button2 = window.document.getElementById("button2");
                    button2.removeEventListener("click", this.button2Function);
                    this.button2Function = function button2Function() {
                        this.table.exchangeUserSelectedTileForExposedJoker();
                        window.document.getElementById("button2").disabled = true;

                        // Do not resolve() - must still discard
                    }.bind(this);

                    button2.addEventListener("click", this.button2Function);

                    // Mahjong button
                    const button3 = window.document.getElementById("button3");
                    button3.removeEventListener("click", this.button3Function);
                    this.button3Function = function button3Function() {
                        // Unselect any tiles
                        this.table.players[this.currPlayer].hand.resetSelection();

                        resolve({playerOption: PLAYER_OPTION.MAHJONG,
                            tileArray: []});
                    }.bind(this);

                    button3.addEventListener("click", this.button3Function);
                });
        } else {
            // Create promise to return the discarded tile (async operation)
            promise = new Promise(
                (resolve) => {
                    const resolveResult = this.gameAI.chooseDiscard(this.currPlayer);

                    if (resolveResult.playerOption === PLAYER_OPTION.DISCARD_TILE) {
                        const text = resolveResult.tileArray[0].getText();
                        printMessage("Player " + this.currPlayer + " discards " + text + " \n");
                    }
                    resolve(resolveResult);
                });
        }

        return promise;
    }

    canPlayerClaimExposure(player, discardTile) {
        const hand = this.table.players[player].hand;
        const hiddenTiles = hand.getHiddenTileArray();
        let matches = 0;

        for (const tile of hiddenTiles) {
            if (tile.suit === SUIT.JOKER) {
                matches++;
            } else if (tile.suit === discardTile.suit && tile.number === discardTile.number) {
                matches++;
            }
        }

        return matches >= 2;
    }

    canPlayerMahjongWithDiscard(player, discardTile) {
        const copyHand = this.table.players[player].hand.dupHand();
        copyHand.insertHidden(discardTile);
        const validInfo = this.card.validateHand14(copyHand);

        return validInfo.valid;
    }

    // Return promise with claim info
    //      Discard/expose/mahjong
    //      TileArray (if discard or exposure)
    async claimDiscard(player, discardTile) {
        // Special case
        // If current player === player, then we already know its a discard.
        //
        if (this.currPlayer === player) {
            return new Promise(
                (resolve) => {
                    const tileArray = [];
                    tileArray.push(discardTile);
                    resolve({playerOption: PLAYER_OPTION.DISCARD_TILE,
                        tileArray});
                });
        }

        if (player !== PLAYER.BOTTOM) {
            // Create promise to return the claim info (async operation)
            return new Promise(
                (resolve) => {
                    // Player (1-3)
                    const resolveResult = this.gameAI.claimDiscard(player, discardTile);
                    resolve(resolveResult);
                });
        }
        // Player 0  (PLAYER.BOTTOM)
        const canMahjong = this.canPlayerMahjongWithDiscard(player, discardTile);
        const canExpose = this.canPlayerClaimExposure(player, discardTile);

        if (!canMahjong && !canExpose) {
            return {
                playerOption: PLAYER_OPTION.DISCARD_TILE,
                tileArray: [discardTile]
            };
        }

        this.state = STATE.LOOP_QUERY_CLAIM_DISCARD;
        this.updateUI();

        // Ask user if the tile is wanted
        const claimYesNo = await this.yesNoQuery();

        this.state = STATE.LOOP_QUERY_CLAIM_DISCARD_COMPLETE;
        this.updateUI();

        if (claimYesNo) {
            // Tile is wanted - wait for user to expose tiles (or cancel)
            //
            // 1. expose tiles (must select tiles/jokers to form exposure)
            // 2. return claimed discard
            // 3. mahjong

            this.state = STATE.LOOP_EXPOSE_TILES;
            this.updateUI();

            // Save discardTile so it can be accessed by Hand object when selecting tiles
            this.discardTile = discardTile;

            const exposeInfo = await this.exposeTiles();

            this.state = STATE.LOOP_EXPOSE_TILES_COMPLETE;
            this.updateUI();

            switch (exposeInfo.playerOption) {
            case PLAYER_OPTION.EXPOSE_TILES:
                // Create promise to return the exposed tiles (async operation)
                return new Promise(
                    (resolve) => {
                        exposeInfo.tileArray.push(discardTile);
                        resolve({playerOption: PLAYER_OPTION.EXPOSE_TILES,
                            tileArray: exposeInfo.tileArray});
                    });
            case PLAYER_OPTION.MAHJONG:
                // Create promise to return mahjong! (async operation)
                return new Promise(
                    (resolve) => {
                        const tileArray = [];
                        tileArray.push(discardTile);
                        resolve({playerOption: PLAYER_OPTION.MAHJONG,
                            tileArray: []});
                    });
            default:
                printMessage("ERROR - unknown discardOption\n");

                return new Promise(
                    (resolve) => {
                        resolve({playerOption: PLAYER_OPTION.DISCARD_TILE,
                            tileArray: [discardTile]});
                    });
            }
        }

        return new Promise(
            (resolve) => {
                resolve({playerOption: PLAYER_OPTION.DISCARD_TILE,
                    tileArray: [discardTile]});
            });
    }

    yesNoQuery() {
        // Create promise to wait for player input (async operation)
        // Value returned
        //      True = yes
        //      False = no
        return new Promise(
            (resolve) => {
                // No button
                const button1 = window.document.getElementById("button1");
                button1.removeEventListener("click", this.button1Function);
                this.button1Function = function button1Function() {
                    resolve(false);
                };

                button1.addEventListener("click", this.button1Function);

                // Yes button
                const button2 = window.document.getElementById("button2");
                button2.removeEventListener("click", this.button2Function);
                this.button2Function = function button2Function() {
                    resolve(true);
                };

                button2.addEventListener("click", this.button2Function);
            });
    }

    charlestonPass(playerId) {
        // Create promise to wait for player input (async operation)
        // No value returned in promise
        return new Promise(
            (resolve) => {
                const playerText = ["self", "right", "across", "left"];

                printInfo("Choose 3 tiles to pass " + playerText[playerId]);

                //  Setup "pass tiles" button
                const button1 = window.document.getElementById("button1");

                button1.removeEventListener("click", this.button1Function);

                this.button1Function = function button1Function() {
                    const charlestonPassArray = [];

                    // Player 0 (human) pressed "Pass" button
                    // Get 3 tiles picked by player 0 (human)
                    charlestonPassArray[0] = this.table.players[0].hand.getSelectionHidden();

                    // Reset selectCount
                    this.table.players[0].hand.resetSelection();

                    // Remove from hand
                    for (const tile of charlestonPassArray[0]) {
                        this.table.players[0].hand.removeHidden(tile);
                    }

                    // Remove 3 cards for player 1, 2, 3
                    for (let i = 1; i < 4; i++) {
                        charlestonPassArray[i] = this.gameAI.charlestonPass(i);
                    }

                    // Exchange charleston passes among all players
                    const receivedTiles = this.table.charlestonPass(playerId, charlestonPassArray);
                    printMessage("Pass " + playerText[playerId] + " complete\n");

                    // Add blue glow to received tiles for player 0
                    if (receivedTiles && receivedTiles.length > 0) {
                        for (const tile of receivedTiles) {
                            tile.addGlowEffect(this.scene, 0x1e90ff, 0.7, 10); // DodgerBlue color, high priority
                        }

                        // Remove glow and sort after delay
                        setTimeout(() => {
                            for (const tile of receivedTiles) {
                                tile.removeGlowEffect();
                            }
                            // Sort hand by suit after glow ends
                            this.table.players[PLAYER.BOTTOM].hand.sortSuitHidden();
                            this.table.players[PLAYER.BOTTOM].showHand(true);
                            // Update hints with the sorted hand
                            this.hintAnimationManager.updateHintsForNewTiles();
                        }, 2000); // 2.0 second delay
                    }

                    resolve();
                }.bind(this);

                button1.addEventListener("click", this.button1Function);
            });
    }

    exposeTiles() {
        // Create promise to wait for player input (async operation)
        return new Promise(
            (resolve) => {
                // Expose tiles button
                const button1 = window.document.getElementById("button1");

                button1.removeEventListener("click", this.button1Function);
                this.button1Function = function button1Function() {
                    const exposedTiles = this.playerExposeTiles();
                    if (exposedTiles) {
                        resolve({
                            playerOption: PLAYER_OPTION.EXPOSE_TILES,
                            tileArray: exposedTiles
                        });
                    }
                }.bind(this);

                button1.addEventListener("click", this.button1Function);

                // Return tile button
                const button2 = window.document.getElementById("button2");

                button2.removeEventListener("click", this.button2Function);
                this.button2Function = function button2Function() {
                    // Unselect any tiles
                    this.table.players[PLAYER.BOTTOM].hand.resetSelection();
                    resolve({playerOption: PLAYER_OPTION.DISCARD_TILE,
                        tileArray: []});
                }.bind(this);

                button2.addEventListener("click", this.button2Function);

                // Mahjong! button
                const button3 = window.document.getElementById("button3");

                button3.removeEventListener("click", this.button3Function);
                this.button3Function = function button3Function() {
                    // Unselect any tiles
                    this.table.players[PLAYER.BOTTOM].hand.resetSelection();
                    resolve({
                        playerOption: PLAYER_OPTION.MAHJONG,
                        tileArray: []
                    });
                }.bind(this);

                button3.addEventListener("click", this.button3Function);
            });
    }

    playerExposeTiles() {
        const playerHand = this.table.players[PLAYER.BOTTOM].hand;
        const selectedTiles = playerHand.getSelectionHidden();

        // Validate: 2 to 4 tiles must be selected from hand.
        if (selectedTiles.length < 2 || selectedTiles.length > 4) {
            this.displayErrorText("Invalid number of tiles selected for exposure. Select 2, 3, or 4 tiles.");
            return null;
        }

        // Validate: all non-joker tiles must match the discarded tile.
        for (const tile of selectedTiles) {
            if (tile.suit !== SUIT.JOKER && (tile.suit !== this.discardTile.suit || tile.number !== this.discardTile.number)) {
                this.displayErrorText("Selected tiles must match the discarded tile or be jokers.");
                return null;
            }
        }

        // Validation passed. Return the selected tiles.
        return selectedTiles;
    }

    courtesyQuery() {
        // Create promise to wait for player input (async operation)
        // Value returned 0-3
        return new Promise(
            (resolve) => {
                // 0 button
                const button1 = window.document.getElementById("button1");

                button1.removeEventListener("click", this.button1Function);
                this.button1Function = function button1Function() {
                    resolve(0);
                };

                button1.addEventListener("click", this.button1Function);

                // 1 button
                const button2 = window.document.getElementById("button2");

                button2.removeEventListener("click", this.button2Function);
                this.button2Function = function button2Function() {
                    resolve(1);
                };

                button2.addEventListener("click", this.button2Function);

                // 2 button
                const button3 = window.document.getElementById("button3");

                button3.removeEventListener("click", this.button3Function);
                this.button3Function = function button3Function() {
                    resolve(2);
                };

                button3.addEventListener("click", this.button3Function);

                // 3 button
                const button4 = window.document.getElementById("button4");

                button4.removeEventListener("click", this.button4Function);
                this.button4Function = function button4Function() {
                    resolve(3);
                };

                button4.addEventListener("click", this.button4Function);
            });
    }

    courtesyPass() {
        // Perform courtesy pass when tiles selected and "pass button" is pressed
        // Create promise to wait for player input (async operation)
        return new Promise(
            (resolve) => {
                printInfo("Courtesy pass - select " + this.table.player02CourtesyVote + " tile(s)\n");

                // Pass tiles button
                const button1 = window.document.getElementById("button1");

                button1.removeEventListener("click", this.button1Function);
                this.button1Function = function button1Function() {
                    resolve();
                };

                button1.addEventListener("click", this.button1Function);
            });
    }

    updateUI () {
        const button1 = window.document.getElementById("button1");
        const button2 = window.document.getElementById("button2");
        const button3 = window.document.getElementById("button3");
        const button4 = window.document.getElementById("button4");
        const startButton = window.document.getElementById("start");
        const sort1 = window.document.getElementById("sort1");
        const sort2 = window.document.getElementById("sort2");
        const numTileSelect = window.document.getElementById("numTileSelect");
        const skipCharlestonCheckbox = window.document.getElementById("skipCharlestonCheckbox");

        switch (this.state) {
        case STATE.INIT:

            printMessage("American Mahjong v1.00\n");
            printMessage("Press Start Game button\n");
            sort1.style.display = "none";
            sort2.style.display = "none";
            window.document.getElementById("controldiv").style.visibility = "visible";
            window.document.getElementById("uicenterdiv").style.visibility = "hidden";

            // Populate number of tiles select
            for (let i = 1; i <= 14; i++) {
                const option = window.document.createElement("option");
                option.text = i;
                numTileSelect.add(option);
            }
            // 9 tiles default
            numTileSelect.selectedIndex = 8;
            skipCharlestonCheckbox.checked = true;

            // Training form event listener is now handled in settings.js
            this.updateTrainingForm();

            // Clear glow effects and saved state when returning to init
            this.hintAnimationManager.clearAllGlows();
            this.hintAnimationManager.savedGlowData = null;

            // Add hint panel toggle event listener with glow effect control
            {
                const hintToggle = window.document.getElementById("hint-toggle");
                const hintContent = window.document.getElementById("hint-content");
                const hintDiv = window.document.getElementById("hintdiv");

                hintToggle.addEventListener("click", () => {
                    const isExpanded = hintToggle.getAttribute("aria-expanded") === "true";
                    hintToggle.setAttribute("aria-expanded", !isExpanded);
                    hintContent.classList.toggle("hidden");

                    // Control glow effects based on panel state
                    if (!isExpanded) {
                        // Panel is being expanded - restore glow effects
                        this.hintAnimationManager.restoreGlowEffects();
                    } else {
                        // Panel is being collapsed - remove glow effects
                        this.hintAnimationManager.clearAllGlows();
                    }
                });

                // Hide hint panel on home page - only show during gameplay
                hintDiv.style.display = "none";
            }
            break;

        case STATE.START:
            this.scene.updateWallTileCounter(this.table.wall.getCount());
            printMessage("Game started\n");
            startButton.disabled = true;
            sort1.style.display = "";
            sort2.style.display = "";
            this.disableSortButtons();
            button1.style.display = "none";
            button2.style.display = "none";
            button3.style.display = "none";
            button4.style.display = "none";
            window.document.getElementById("uicenterdiv").style.visibility = "visible";
            window.document.getElementById("buttondiv").style.visibility = "visible";
            window.document.getElementById("info").style.visibility = "visible";
            this.disableTrainingForm();
            window.document.getElementById("hintdiv").style.display = "";
            break;

        case STATE.DEAL:
            printMessage("Shuffling wall\n");
            printMessage("Dealing hands\n");
            this.enableSortButtons();
            break;

        case STATE.CHARLESTON1:
            printMessage("Starting Charleston #1\n");
            button1.innerText = "Pass Tiles";
            button1.disabled = true;
            button1.style.display = "";
            // Wall text is now hidden - counter handles display
            break;

        case STATE.CHARLESTON_QUERY:
            printMessage("Charleston #1 complete\n");
            printInfo("Continue Charleston?");

            button1.innerText = "No";
            button1.disabled = false;
            button1.style.display = "";
            button2.innerText = "Yes";
            button2.disabled = false;
            button2.style.display = "";
            break;

        case STATE.CHARLESTON_QUERY_COMPLETE:
            break;

        case STATE.CHARLESTON2:
            printMessage("Starting Charleston #2\n");
            button1.innerText = "Pass Tiles";
            button1.disabled = true;
            button1.style.display = "";
            button2.style.display = "none";
            break;

        case STATE.COURTESY_QUERY:
            printMessage("Charleston #2 complete\n");
            printInfo("Choose number of tiles for courtesy exchange");

            button1.innerText = "0";
            button1.disabled = false;
            button1.style.display = "";
            button2.innerText = "1";
            button2.disabled = false;
            button2.style.display = "";
            button3.innerText = "2";
            button3.disabled = false;
            button3.style.display = "";
            button4.innerText = "3";
            button4.disabled = false;
            button4.style.display = "";
            break;

        case STATE.COURTESY_QUERY_COMPLETE:
            button2.style.display = "none";
            button3.style.display = "none";
            button4.style.display = "none";
            break;

        case STATE.COURTESY:
            printMessage("Courtesy pass\n");
            button1.innerText = "Pass Tiles";
            button1.disabled = true;
            button1.style.display = "";
            break;

        case STATE.COURTESY_COMPLETE:
            printMessage("Courtesy pass complete\n");
            button1.disabled = true;
            button1.removeEventListener("click", this.button1Function);
            break;

        case STATE.LOOP_PICK_FROM_WALL:
            break;

        case STATE.LOOP_CHOOSE_DISCARD:
            printInfo("Select one tile to discard or declare Mahjong\n");
            button1.innerText = "Discard";
            button1.disabled = true;
            button1.style.display = "";
            button2.innerText = "Exchange joker";
            button2.disabled = true;
            button2.style.display = "";
            button3.innerText = "Mahjong!";
            button3.disabled = false;
            button3.style.display = "";
            break;

        case STATE.LOOP_QUERY_CLAIM_DISCARD:
            printInfo("Claim discard?");
            button1.innerText = "No";
            button1.disabled = false;
            button1.style.display = "";
            button2.innerText = "Yes";
            button2.disabled = false;
            button2.style.display = "";
            button3.style.display = "none";
            break;

        case STATE.LOOP_QUERY_CLAIM_DISCARD_COMPLETE:
            break;

        case STATE.LOOP_EXPOSE_TILES:
            printInfo("Form a pung/kong/quint with claimed tile");
            button1.innerText = "Expose tiles";
            button1.disabled = true;
            button1.style.display = "";
            button2.innerText = "Return claimed discard";
            button2.disabled = false;
            button2.style.display = "";
            button3.innerText = "Mahjong!";
            button3.disabled = false;
            button3.style.display = "";
            break;

        case STATE.LOOP_EXPOSE_TILES_COMPLETE:
            button2.style.display = "none";
            button3.style.display = "none";
            button4.style.display = "none";
            break;

        case STATE.END:
            printMessage("===============================\n");
            if (this.gameResult.mahjong) {
                const hand = this.table.players[this.gameResult.winner].hand;
                const validInfo = this.card.validateHand14(hand);
                if (validInfo.valid) {
                    const rankCardHands = this.card.rankHandArray14(hand);
                    this.card.sortHandRankArray(rankCardHands);

                    let str = "Game over - Mahjong by player " + this.gameResult.winner;
                    printMessage(str + "\n");
                    printInfo(str);
                    debugPrint(str + "\n");

                    str = "Group = " + rankCardHands[0].group.groupDescription + "\n";
                    printMessage(str);
                    debugPrint(str);

                    str = "Hand = " + rankCardHands[0].hand.description + "\n";
                    printMessage(str);
                    debugPrint(str);

                    // Show winner's hidden tiles
                    hand.sortSuitHidden();
                    this.table.players[this.gameResult.winner].showHand(true);
                } else {
                    const str = "Game over - Invalid Mahjong by player " + this.gameResult.winner;
                    printMessage(str + "\n");
                    printInfo(str);
                    debugPrint(str + "\n");
                }
            } else {
                const str = "Game over - Wall game";
                printMessage(str + "\n");
                printInfo(str);
                debugPrint(str + "\n");

                // Show all players' hands so user can see what bots had
                for (let i = 0; i < 4; i++) {
                    const player = this.table.players[i];
                    player.hand.sortSuitHidden();
                    player.showHand(true);
                }
            }
            printMessage("===============================\n");
            printMessage("Click 'Start Game' to play again\n");
            button1.style.display = "none";
            button2.style.display = "none";
            button3.style.display = "none";
            button4.style.display = "none";

            this.disableSortButtons();
            sort1.style.display = "none";
            sort2.style.display = "none";
            this.enableTrainingForm();

            // Make Start Game button visible and enabled again
            window.document.getElementById("controldiv").style.visibility = "visible";
            startButton.style.display = ""; // Reset display (was set to "none" on click)
            startButton.disabled = false;

            break;

        default:
            printMessage("ERROR - updateUI - unknown state\n");
            break;
        }
    }

    enableSortButtons() {
        const sort1 = window.document.getElementById("sort1");
        const sort2 = window.document.getElementById("sort2");

        sort1.disabled = false;
        sort2.disabled = false;

        if (this.sort1Function) {
            sort1.removeEventListener("click", this.sort1Function);
            this.sort1Function = null;
        }

        if (this.sort2Function) {
            sort2.removeEventListener("click", this.sort2Function);
            this.sort2Function = null;
        }

        this.sort1Function = function sort1Function() {
            this.table.players[PLAYER.BOTTOM].hand.sortSuitHidden();
            this.table.players[PLAYER.BOTTOM].showHand(true);
            // Update hints after sorting
            this.hintAnimationManager.updateHintsForNewTiles();
        }.bind(this);

        this.sort2Function = function sort2Function() {
            this.table.players[PLAYER.BOTTOM].hand.sortRankHidden();
            this.table.players[PLAYER.BOTTOM].showHand(true);
            // Update hints after sorting
            this.hintAnimationManager.updateHintsForNewTiles();
        }.bind(this);

        sort1.addEventListener("click", this.sort1Function);
        sort2.addEventListener("click", this.sort2Function);
    }

    disableSortButtons() {
        const sort1 = window.document.getElementById("sort1");
        const sort2 = window.document.getElementById("sort2");

        sort1.disabled = true;
        sort2.disabled = true;

        if (this.sort1Function) {
            sort1.removeEventListener("click", this.sort1Function);
            this.sort1Function = null;
        }

        if (this.sort2Function) {
            sort2.removeEventListener("click", this.sort2Function);
            this.sort2Function = null;
        }
    }

    getTrainingInfo() {
        const traincheckbox = window.document.getElementById("trainCheckbox");
        const handSelect = window.document.getElementById("handSelect");
        const numTileSelect = window.document.getElementById("numTileSelect");
        const skipCharlestonCheckbox = window.document.getElementById("skipCharlestonCheckbox");

        const trainInfo = {
            trainCheckbox: false,
            handDescription: "",
            numTiles: 0,
            skipCharlestonCheckbox: false
        };

        trainInfo.trainCheckbox = traincheckbox.checked;
        trainInfo.handDescription = handSelect.value;
        trainInfo.numTiles = parseInt(numTileSelect.value, 10);
        trainInfo.skipCharlestonCheckbox = skipCharlestonCheckbox.checked;

        return trainInfo;
    }

    updateTrainingForm() {
        const trainInfo = this.getTrainingInfo();
        const trainfieldset2 = window.document.getElementById("trainfieldset2");
        trainfieldset2.disabled = !trainInfo.trainCheckbox;
    }

    enableTrainingForm() {
        const trainfieldset1 = window.document.getElementById("trainfieldset1");

        trainfieldset1.disabled = false;
        this.updateTrainingForm();
    }

    disableTrainingForm() {
        const trainfieldset1 = window.document.getElementById("trainfieldset1");
        const trainfieldset2 = window.document.getElementById("trainfieldset2");
        trainfieldset1.disabled = true;
        trainfieldset2.disabled = true;
    }

    displayErrorText(str) {
        // Don't repeat error messages
        if (this.errorTextArray.length) {
            if (str === this.errorTextArray[this.errorTextArray.length - 1]) {
                return;
            }
        }

        if (this.errorTextSemaphore === 0) {
            this.errorTextSemaphore++;
            this.errorTextArray.push(str);
            this.displayAllError();
        } else {
            this.errorTextSemaphore++;
            this.errorTextArray.push(str);
        }
    }

    async displayAllError() {
        this.errorText.visible = true;

        while (this.errorTextSemaphore) {
            const str = this.errorTextArray.shift();
            this.errorText.setText(str);
            // eslint-disable-next-line no-await-in-loop
            await sleep(4000);
            this.errorTextSemaphore--;
        }
        this.errorText.visible = false;
    }

    // Sequential dealing sequence with animation using Phaser tween callbacks
    // Deals tiles in groups (4 at a time, then 1 at a time for final round)
    sequentialDealTiles(initPlayerHandArray, onComplete) {
        // Shuffle the wall before dealing
        this.table.wall.shuffle();

        // Apply training hands and exposed sets before animated dealing
        this.table.applyTrainingHands(initPlayerHandArray);

        // Define the dealing sequence: each entry is [playerIndex, tileCount]
        const DEAL_SEQUENCE = [
            // Round 1 - 4 tiles each
            [PLAYER.BOTTOM, 4],
            [PLAYER.RIGHT, 4],
            [PLAYER.TOP, 4],
            [PLAYER.LEFT, 4],
            // Round 2 - 4 tiles each
            [PLAYER.BOTTOM, 4],
            [PLAYER.RIGHT, 4],
            [PLAYER.TOP, 4],
            [PLAYER.LEFT, 4],
            // Round 3 - 4 tiles each
            [PLAYER.BOTTOM, 4],
            [PLAYER.RIGHT, 4],
            [PLAYER.TOP, 4],
            [PLAYER.LEFT, 4],
            // Final tiles - 1 tile each
            [PLAYER.BOTTOM, 1],
            [PLAYER.RIGHT, 1],
            [PLAYER.TOP, 1],
            [PLAYER.LEFT, 1],
            // Last tile for dealer
            [PLAYER.BOTTOM, 1]
        ];

        let currentStepIndex = 0;

        const dealNextGroup = () => {
            if (currentStepIndex >= DEAL_SEQUENCE.length) {
                // All tiles dealt - finalize hands
                this.table.finalizeInitialHands();

                // Call completion callback if provided
                if (onComplete) {
                    onComplete();
                }
                return;
            }

            const [playerIndex, tileCount] = DEAL_SEQUENCE[currentStepIndex];

            // Deal all tiles for this player at once
            for (let i = 0; i < tileCount; i++) {
                const tile = this.table.wall.remove();
                if (!tile) {
                    throw new Error("No tiles remaining in wall during dealing sequence");
                }

                this.table.players[playerIndex].hand.insertHidden(tile);
            }

            // Show all tiles at once (triggers animations for all)
            this.table.players[playerIndex].showHand(false);

            // Update wall counter after dealing tiles
            this.scene.updateWallTileCounter(this.table.wall.getCount());

            // Get the last tile that was inserted to hook into its animation
            const hand = this.table.players[playerIndex].hand;
            const lastTile = hand.hiddenTileSet.tileArray[hand.hiddenTileSet.tileArray.length - 1];

            // Wait for the last tile's tween to complete, then deal next group
            if (lastTile && lastTile.tween) {
                lastTile.tween.once("complete", () => {
                    currentStepIndex++;
                    // Add a small pause between players for visual clarity
                    this.scene.time.delayedCall(150, dealNextGroup);
                });
            } else {
                // Fallback if no tween exists (shouldn't happen, but safety net)
                currentStepIndex++;
                this.scene.time.delayedCall(150, dealNextGroup);
            }
        };

        // Start the dealing sequence
        dealNextGroup();
    }
}
