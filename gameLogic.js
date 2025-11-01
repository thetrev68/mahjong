import {printMessage, printInfo, debugPrint, printHint} from "./utils.js";
import {STATE, PLAYER_OPTION, PLAYER, SUIT, VNUMBER} from "./constants.js";
import {GameAI} from "./gameAI.js";
import {Card} from "./card/card.js";
import {Tile} from "./gameObjects.js";
import {} from "./gameObjects_hand.js";

// PRIVATE CONSTANTS

// PRIVATE GLOBALS

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
        this.wallText = null;
        this.errorText = null;
        this.errorTextArray = [];
        this.errorTextSemaphore = 0;
        this.discardTile = null;
        this.gameResult = {mahjong: false,
            winner: 0};
        this.updateUI();
    }

    async init() {
        const year = window.settingsManager.getCardYear();
        this.card = new Card(year);
        await this.card.init();
        this.gameAI = new GameAI(this.card, this.table);

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
            initPlayerHandArray[0] = this.card.generateHand(trainInfo.handDescription, trainInfo.numTiles); ;

            // Hand.insertHidden(new Tile(SUIT.JOKER, 0));
            // Hand.insertHidden(new Tile(SUIT.JOKER, 0));
        }

        // If (false) {
        //     // InitPlayerHandArray[0] = this.card.generateHand("111 222 3333 4444 (2 suits, 4 consecutive numbers)", 14);

        //     InitPlayerHandArray[0] = new Hand(false);

        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.DOT, 4));
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.DOT, 4));
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.DOT, 4));

        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.BAM, 5));
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.BAM, 5));
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.BAM, 5));
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.BAM, 5));

        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.BAM, 6));
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.BAM, 6));
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.BAM, 6));
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.BAM, 6));

        //     // Create new "exposed" TileSet
        //     InitPlayerHandArray[0].exposedTileSetArray = [];
        //     Const tileSet = new TileSet(false);
        //     TileSet.insert(new Tile(SUIT.JOKER, 0));
        //     TileSet.insert(new Tile(SUIT.JOKER, 0));
        //     TileSet.insert(new Tile(SUIT.JOKER, 0));
        //     InitPlayerHandArray[0].exposedTileSetArray.push(tileSet);

        // }

        // If (false) {
        //     // Test exposed jokers

        //     // Player 0
        //     InitPlayerHandArray[0] = new Hand(false);
        //     InitPlayerHandArray[0].insertHidden(new Tile(SUIT.DOT, 4));

        //     // Player 1-3
        //     For (let i = 1; i < 4; i++) {
        //         InitPlayerHandArray[i] = new Hand(false);

        //         InitPlayerHandArray[i].exposedTileSetArray = [];
        //         Const tileSet = new TileSet(false);
        //         TileSet.insert(new Tile(SUIT.DOT, 4));
        //         TileSet.insert(new Tile(SUIT.JOKER, 0));
        //         TileSet.insert(new Tile(SUIT.JOKER, 0));
        //         InitPlayerHandArray[i].exposedTileSetArray.push(tileSet);
        //     }
        // }

        this.table.deal(initPlayerHandArray);

        this.wallText.setText("Wall tile count = " + this.table.wall.getCount());

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
        await this.charlestonPass(PLAYER.TOP);
        await this.charlestonPass(PLAYER.LEFT);

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
            await this.charlestonPass(PLAYER.TOP);
            await this.charlestonPass(PLAYER.RIGHT);

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

        if (this.table.player02CourtesyVote) {
            // Wait for user to select courtesy pass tiles
            await this.courtesyPass();
        }

        this.state = STATE.COURTESY_COMPLETE;
        this.updateUI();

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
        this.table.courtesyPass(courtesyPassArray);

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
            }
            skipPick = false;

            this.state = STATE.LOOP_CHOOSE_DISCARD;
            this.updateUI();

            // CHOOSE TILE TO DISCARD (or mahjong!)
            // eslint-disable-next-line no-await-in-loop
            const discardInfo = await this.chooseDiscard();
            this.table.players[this.currPlayer].showHand();

            if (this.currPlayer !== PLAYER.BOTTOM) {
                // eslint-disable-next-line no-await-in-loop
                await this.sleep(500);
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
                const {offsetX, offsetY} = this.table.wall.showWall();
                this.table.discards.showDiscards(offsetX, offsetY);

                //  Move to next player
                this.currPlayer++;
                if (this.currPlayer > 3) {
                    this.currPlayer = 0;
                }
                continue;
            }

            // CLAIM DISCARD? (for exposure/mahjong).

            // Show tile - position it above the discard pile to avoid overlap
            // DiscardTile.x = 350;
            // DiscardTile.y = 475;
            // DiscardTile.angle = 0;

            // Add highlight background first using a rectangle sprite
            // Match the golden color of the Yes/No buttons (#ffd166 / 0xffd166)
            const highlightRect = this.scene.add.rectangle(350, 420, 70, 90, 0xffd166, 0.7);
            highlightRect.setStrokeStyle(3, 0xffd166, 0.9);
            // Below the tile
            highlightRect.setDepth(49);
            discardTile.highlightGraphics = highlightRect;

            // Animate and show tile
            discardTile.scale = 1.0;
            discardTile.showTile(true, true);

            // Store desired depth before animation
            discardTile.sprite.depth = 50;
            discardTile.spriteBack.depth = 50;

            // Now animate - this will preserve the depth we just set
            discardTile.animate(350, 420, 0);

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
            if (discardTile.highlightGraphics) {
                discardTile.highlightGraphics.destroy();
                discardTile.highlightGraphics = null;
            }
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
            } else {
                // Tile discarded - move to next player
                this.currPlayer++;
                if (this.currPlayer > 3) {
                    this.currPlayer = 0;
                }
            }

            // Validate tile count is always 152
            let tileCount = 0;
            tileCount += this.table.wall.tileArray.length;
            tileCount += this.table.discards.tileArray.length;
            for (let i = 0; i < 4; i++) {
                tileCount += this.table.players[i].hand.getLength();
            }
            if (tileCount !== 152) {
                printMessage("ERROR - total tile count is not 152. Tile count = " + tileCount + "\n");
            }
        }

        this.end();
    }

    end() {

        // Start button will be enabled
        this.state = STATE.END;
        this.updateUI();
    }

    pickFromWall() {

        const tile = this.table.wall.remove();

        this.wallText.setText("Wall tile count = " + this.table.wall.getCount());

        if (tile) {
            printMessage("Player " + this.currPlayer + " picks from wall\n");
            debugPrint("Player " + this.currPlayer + " picks " + tile.getText() + " from wall\n");

            this.table.players[this.currPlayer].hand.insertHidden(tile);
            this.table.players[this.currPlayer].showHand();

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
                    this.table.charlestonPass(playerId, charlestonPassArray);
                    printMessage("Pass " + playerText[playerId] + " complete\n");

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
                    this.playerExposeTiles();
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
        const hint = window.document.getElementById("hint");
        const numTileSelect = window.document.getElementById("numTileSelect");
        const skipCharlestonCheckbox = window.document.getElementById("skipCharlestonCheckbox");

        switch (this.state) {
        case STATE.INIT:

            printMessage("American Mahjong v1.00\n");
            printMessage("Press Start Game button\n");
            sort1.style.display = "none";
            sort2.style.display = "none";
            hint.style.display = "none";
            // Settings button style display
            window.document.getElementById("controldiv").style.visibility = "visible";

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

            // Add hint panel toggle event listener
            {
                const hintToggle = window.document.getElementById("hint-toggle");
                const hintContent = window.document.getElementById("hint-content");
                const hintDiv = window.document.getElementById("hintdiv");

                hintToggle.addEventListener("click", () => {
                    const isExpanded = hintToggle.getAttribute("aria-expanded") === "true";
                    hintToggle.setAttribute("aria-expanded", !isExpanded);
                    hintContent.classList.toggle("hidden");
                });

                // Hide hint panel on home page - only show during gameplay
                hintDiv.style.display = "none";
            }
            break;

        case STATE.START:
            printMessage("Game started\n");
            startButton.disabled = true;
            sort1.style.display = "";
            sort2.style.display = "";
            hint.style.display = "";
            // SettingsButton.style.display = "";
            this.disableSortButtons();
            button1.style.display = "none";
            button2.style.display = "none";
            button3.style.display = "none";
            button4.style.display = "none";
            window.document.getElementById("buttondiv").style.visibility = "visible";
            window.document.getElementById("info").style.visibility = "visible";
            this.disableTrainingForm();
            this.wallText.visible = true;
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
            this.wallText.setText("Wall tile count = " + this.table.wall.getCount());
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
            printInfo("Form a pong/kong/quintet with claimed tile");
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

                    str = "Group = " + rankCardHands[0].group.groupDescription + "\n"
                    printMessage(str);
                    debugPrint(str);

                    str = "Hand = " + rankCardHands[0].hand.description + "\n"
                    printMessage(str);
                    debugPrint(str);

                    // Show winner's hidden tiles
                    hand.sortSuitHidden();
                    this.table.players[this.gameResult.winner].showHand(true);

                } else {
                    const str = "Game over - Invalid Mahjong by player " + this.gameResult.winner
                    printMessage(str + "\n");
                    printInfo(str);
                    debugPrint(str + "\n");
                }
            } else {
                const str = "Game over - Wall game"
                printMessage(str + "\n");
                printInfo(str);
                debugPrint(str + "\n")
            }
            printMessage("===============================\n");
            button1.style.display = "none";
            button2.style.display = "none";
            button3.style.display = "none";
            button4.style.display = "none";

            this.disableSortButtons();
            sort1.style.display = "none";
            sort2.style.display = "none";
            hint.style.display = "none";
            // SettingsButton.style.display = "none";
            this.enableTrainingForm();

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
        const hint = window.document.getElementById("hint");

        sort1.disabled = false;
        sort2.disabled = false;
        hint.disabled = false;

        if (this.sort1Function) {
            sort1.removeEventListener("click", this.sort1Function);
            this.sort1Function = null;
        }

        if (this.sort2Function) {
            sort2.removeEventListener("click", this.sort2Function);
            this.sort2Function = null;
        }

        if (this.hintFunction) {
            hint.removeEventListener("click", this.hintFunction);
            this.hintFunction = null;
        }

        this.sort1Function = function sort1Function() {
            this.table.players[PLAYER.BOTTOM].hand.sortSuitHidden();
            this.table.players[PLAYER.BOTTOM].showHand();
        }.bind(this);

        this.sort2Function = function sort2Function() {
            this.table.players[PLAYER.BOTTOM].hand.sortRankHidden();
            this.table.players[PLAYER.BOTTOM].showHand();
        }.bind(this);

        this.hintFunction = function hintFunction() {
            const hand = this.table.players[PLAYER.BOTTOM].hand.dupHand();
            if (hand.getLength() === 13) {
                const invalidTile = new Tile(SUIT.INVALID, VNUMBER.INVALID);
                hand.insertHidden(invalidTile);
            }
            const rankCardHands = this.card.rankHandArray14(hand);
            this.card.sortHandRankArray(rankCardHands);

            let html = "<h3>Top Possible Hands:</h3>";
            for (let i = 0; i < Math.min(3, rankCardHands.length); i++) {
                const rankHand = rankCardHands[i];
                html += `<p><strong>${rankHand.group.groupDescription}</strong> - ${rankHand.hand.description} (Rank: ${rankHand.rank.toFixed(2)})</p>`;
            }

            // Add tile ranking for discard suggestions
            const tileRankArray = this.gameAI.rankTiles14(hand);
            html += "<h3>Discard Suggestions (Best to Discard First):</h3>";
            for (let i = 0; i < Math.min(3, tileRankArray.length); i++) {
                const rankInfo = tileRankArray[i];
                html += `<p>${rankInfo.tile.getText()} (Less Impact: ${rankInfo.rank.toFixed(2)})</p>`;
            }

            printHint(html);
        }.bind(this);

        sort1.addEventListener("click", this.sort1Function);
        sort2.addEventListener("click", this.sort2Function);
        hint.addEventListener("click", this.hintFunction);
    }

    disableSortButtons() {
        const sort1 = window.document.getElementById("sort1");
        const sort2 = window.document.getElementById("sort2");
        const hint = window.document.getElementById("hint");

        sort1.disabled = true;
        sort2.disabled = true;
        hint.disabled = true;

        if (this.sort1Function) {
            sort1.removeEventListener("click", this.sort1Function);
            this.sort1Function = null;
        }

        if (this.sort2Function) {
            sort2.removeEventListener("click", this.sort2Function);
            this.sort2Function = null;
        }

        if (this.hintFunction) {
            hint.removeEventListener("click", this.hintFunction);
            this.hintFunction = null;
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
            await this.sleep(4000);
            this.errorTextSemaphore--;
        }
        this.errorText.visible = false;
    }

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
