/**
 * ButtonManager - State-based button visibility and interaction management
 *
 * Responsibilities:
 * - Update button visibility based on game state
 * - Set button text based on context
 * - Enable/disable buttons based on conditions
 * - Wire button clicks to GameController callbacks
 */

import {STATE} from "../../constants.js";

export class ButtonManager {
    /**
     * @param {GameScene} scene - Phaser scene
     * @param {GameController} gameController - Game controller for callbacks
     * @param {SelectionManager} selectionManager - Selection manager for accessing selected tiles
     */
    constructor(scene, gameController, selectionManager = null) {
        this.scene = scene;
        this.gameController = gameController;
        this.selectionManager = selectionManager;

        /**
         * Map of button ID → button element
         */
        this.buttons = {
            button1: document.getElementById("button1"),
            button2: document.getElementById("button2"),
            button3: document.getElementById("button3"),
            button4: document.getElementById("button4"),
            start: document.getElementById("start"),
            settings: document.getElementById("settings"),
            sort1: document.getElementById("sort1"),
            sort2: document.getElementById("sort2")
        };

        /**
         * Store current button callbacks
         * @type {Map<string, Function>}
         */
        this.buttonCallbacks = new Map();

        /**
         * Track current game state
         */
        this.currentState = STATE.INIT;

        this.setupButtonListeners();
    }

    /**
     * Set up click listeners for all buttons
     */
    setupButtonListeners() {
        Object.entries(this.buttons).forEach(([id, btn]) => {
            if (btn) {
                btn.addEventListener("click", () => this.onButtonClicked(id));
            }
        });
    }

    /**
     * Handle button click
     */
    onButtonClicked(buttonId) {
        const callback = this.buttonCallbacks.get(buttonId);
        if (callback && typeof callback === "function") {
            callback();
        }
    }

    /**
     * Update button visibility and state based on game state
     *
     * @param {number} state - Current game state from STATE enum
     */
    updateForState(state) {
        this.currentState = state;
        this.clearAllCallbacks();

        switch (state) {
            case STATE.INIT:
            case STATE.START:
                this.showStartButtons();
                break;

            case STATE.DEAL:
                this.showDealButtons();
                break;

            case STATE.CHARLESTON1:
                this.showCharlestonPassButtons();
                break;

            case STATE.CHARLESTON_QUERY:
                this.showCharlestonContinueButtons();
                break;

            case STATE.CHARLESTON2:
                this.showCharlestonPassButtons();
                break;

            case STATE.COURTESY_QUERY:
                this.showCourtesyVoteButtons();
                break;

            case STATE.COURTESY:
                this.showCourtesyPassButtons();
                break;

            case STATE.LOOP_PICK_FROM_WALL:
                this.showWallPickButtons();
                break;

            case STATE.LOOP_CHOOSE_DISCARD:
                this.showDiscardChoiceButtons();
                break;

            case STATE.LOOP_QUERY_CLAIM_DISCARD:
                this.showClaimButtons();
                break;

            case STATE.LOOP_EXPOSE_TILES:
                this.showExposureButtons();
                break;

            case STATE.END:
                this.showGameEndButtons();
                break;

            default:
                this.hideAllGameButtons();
        }
    }

    /**
     * Show start game buttons
     */
    showStartButtons() {
        this.show(["start", "settings"]);
        this.hide(["button1", "button2", "button3", "button4", "sort1", "sort2"]);

        this.buttonCallbacks.set("start", () => {
            this.gameController.startGame();
        });

        this.buttonCallbacks.set("settings", () => {
            // Settings handled separately in GameScene
        });
    }

    /**
     * Show buttons during deal phase
     */
    showDealButtons() {
        this.show(["sort1", "sort2"]);
        this.hide(["start", "settings", "button1", "button2", "button3", "button4"]);

        this.buttonCallbacks.set("sort1", () => {
            // Sort by suit
            if (this.gameController.onSortHandRequest) {
                this.gameController.onSortHandRequest("suit");
            }
        });

        this.buttonCallbacks.set("sort2", () => {
            // Sort by rank
            if (this.gameController.onSortHandRequest) {
                this.gameController.onSortHandRequest("rank");
            }
        });
    }

    /**
     * Show buttons during Charleston pass phase
     */
    showCharlestonPassButtons() {
        this.show(["button1"]);
        this.hide(["button2", "button3", "button4", "start", "settings", "sort1", "sort2"]);

        this.setText("button1", "Pass Tiles");
        this.setDisabled("button1", true);  // Enabled when 3 tiles selected

        this.buttonCallbacks.set("button1", () => {
            // Pass selected tiles - callback is registered by PhaserAdapter.handleCharlestonPassPrompt
            // This is just a fallback if no callback was registered
            if (this.selectionManager && this.gameController.onCharlestonPass) {
                const selectedTiles = this.selectionManager.getSelection();
                if (selectedTiles.length === 3) {
                    this.gameController.onCharlestonPass();
                }
            }
        });
    }

    /**
     * Show buttons for Charleston continue query
     */
    showCharlestonContinueButtons() {
        this.show(["button1", "button2"]);
        this.hide(["button3", "button4", "start", "settings", "sort1", "sort2"]);

        this.setText("button1", "No");
        this.setText("button2", "Yes");
        this.setDisabled("button1", false);
        this.setDisabled("button2", false);

        this.buttonCallbacks.set("button1", () => {
            if (this.gameController.onCharlestonContinueQuery) {
                this.gameController.onCharlestonContinueQuery(false);
            }
        });

        this.buttonCallbacks.set("button2", () => {
            if (this.gameController.onCharlestonContinueQuery) {
                this.gameController.onCharlestonContinueQuery(true);
            }
        });
    }

    /**
     * Show buttons for courtesy vote
     */
    showCourtesyVoteButtons() {
        this.show(["button1", "button2", "button3", "button4"]);
        this.hide(["start", "settings", "sort1", "sort2"]);

        this.setText("button1", "0 Tiles");
        this.setText("button2", "1 Tile");
        this.setText("button3", "2 Tiles");
        this.setText("button4", "3 Tiles");

        this.buttonCallbacks.set("button1", () => {
            if (this.gameController.onCourtesyVote) {
                this.gameController.onCourtesyVote(0);
            }
        });

        this.buttonCallbacks.set("button2", () => {
            if (this.gameController.onCourtesyVote) {
                this.gameController.onCourtesyVote(1);
            }
        });

        this.buttonCallbacks.set("button3", () => {
            if (this.gameController.onCourtesyVote) {
                this.gameController.onCourtesyVote(2);
            }
        });

        this.buttonCallbacks.set("button4", () => {
            if (this.gameController.onCourtesyVote) {
                this.gameController.onCourtesyVote(3);
            }
        });
    }

    /**
     * Show buttons for courtesy pass phase
     */
    showCourtesyPassButtons() {
        this.show(["button1"]);
        this.hide(["button2", "button3", "button4", "start", "settings", "sort1", "sort2"]);

        this.setText("button1", "Exchange Tiles");
        this.setDisabled("button1", true);

        this.buttonCallbacks.set("button1", () => {
            if (this.gameController.onCourtesyPass) {
                this.gameController.onCourtesyPass();
            }
        });
    }

    /**
     * Show buttons for wall pick phase
     */
    showWallPickButtons() {
        this.hide(["button1", "button2", "button3", "button4", "start", "settings", "sort1", "sort2"]);
        // Game proceeds automatically when wall tile is drawn
    }

    /**
     * Show buttons for discard choice phase
     */
    showDiscardChoiceButtons() {
        this.show(["button1", "button2", "button3", "sort1", "sort2"]);
        this.hide(["button4", "start", "settings"]);

        this.setText("button1", "Discard");
        this.setText("button2", "Exchange Joker");
        this.setText("button3", "Mahjong!");

        this.setDisabled("button1", true);  // Enabled when tile selected
        this.setDisabled("button2", true);  // Enabled when joker available
        this.setDisabled("button3", true);  // Enabled when can mahjong

        this.buttonCallbacks.set("button1", () => {
            if (this.gameController.onChooseDiscard) {
                this.gameController.onChooseDiscard();
            }
        });

        this.buttonCallbacks.set("button2", () => {
            if (this.gameController.onExchangeJoker) {
                this.gameController.onExchangeJoker();
            }
        });

        this.buttonCallbacks.set("button3", () => {
            if (this.gameController.onMahjong) {
                this.gameController.onMahjong();
            }
        });

        this.buttonCallbacks.set("sort1", () => {
            if (this.gameController.onSortHandRequest) {
                this.gameController.onSortHandRequest("suit");
            }
        });

        this.buttonCallbacks.set("sort2", () => {
            if (this.gameController.onSortHandRequest) {
                this.gameController.onSortHandRequest("rank");
            }
        });
    }

    /**
     * Show buttons for claim discard phase
     */
    showClaimButtons() {
        this.show(["button1", "button2", "button3", "button4"]);
        this.hide(["start", "settings", "sort1", "sort2"]);

        this.setText("button1", "Mahjong");
        this.setText("button2", "Pung");
        this.setText("button3", "Kong");
        this.setText("button4", "Pass");

        this.buttonCallbacks.set("button1", () => {
            if (this.gameController.onClaimDiscard) {
                this.gameController.onClaimDiscard("Mahjong");
            }
        });

        this.buttonCallbacks.set("button2", () => {
            if (this.gameController.onClaimDiscard) {
                this.gameController.onClaimDiscard("Pung");
            }
        });

        this.buttonCallbacks.set("button3", () => {
            if (this.gameController.onClaimDiscard) {
                this.gameController.onClaimDiscard("Kong");
            }
        });

        this.buttonCallbacks.set("button4", () => {
            if (this.gameController.onClaimDiscard) {
                this.gameController.onClaimDiscard("Pass");
            }
        });
    }

    /**
     * Show buttons for exposure phase
     */
    showExposureButtons() {
        this.show(["button1", "button2"]);
        this.hide(["button3", "button4", "start", "settings", "sort1", "sort2"]);

        this.setText("button1", "Select Exposure");
        this.setText("button2", "Skip");

        this.buttonCallbacks.set("button1", () => {
            if (this.gameController.onExposeTiles) {
                this.gameController.onExposeTiles();
            }
        });

        this.buttonCallbacks.set("button2", () => {
            if (this.gameController.onSkipExposure) {
                this.gameController.onSkipExposure();
            }
        });
    }

    /**
     * Show buttons for game end
     */
    showGameEndButtons() {
        this.show(["button1", "start"]);
        this.hide(["button2", "button3", "button4", "settings", "sort1", "sort2"]);

        this.setText("button1", "View Results");
        this.setText("start", "Start New Game");

        this.buttonCallbacks.set("button1", () => {
            // Show game results
        });

        this.buttonCallbacks.set("start", () => {
            this.gameController.startGame();
        });
    }

    /**
     * Show specified buttons
     *
     * @param {string[]} buttonIds - Array of button IDs to show
     */
    show(buttonIds) {
        buttonIds.forEach((id) => {
            if (this.buttons[id]) {
                this.buttons[id].style.display = "block";
                this.buttons[id].disabled = false;
            }
        });
    }

    /**
     * Hide specified buttons
     *
     * @param {string[]} buttonIds - Array of button IDs to hide
     */
    hide(buttonIds) {
        buttonIds.forEach((id) => {
            if (this.buttons[id]) {
                this.buttons[id].style.display = "none";
            }
        });
    }

    /**
     * Set button text
     *
     * @param {string} buttonId - Button ID
     * @param {string} text - Text to display
     */
    setText(buttonId, text) {
        if (this.buttons[buttonId]) {
            this.buttons[buttonId].textContent = text;
        }
    }

    /**
     * Enable/disable button
     *
     * @param {string} buttonId - Button ID
     * @param {boolean} disabled - Whether to disable
     */
    setDisabled(buttonId, disabled) {
        if (this.buttons[buttonId]) {
            this.buttons[buttonId].disabled = disabled;
        }
    }

    /**
     * Hide all game buttons
     */
    hideAllGameButtons() {
        this.hide(["button1", "button2", "button3", "button4", "sort1", "sort2"]);
    }

    /**
     * Clear all button callbacks
     */
    clearAllCallbacks() {
        this.buttonCallbacks.clear();
    }

    /**
     * Register callback for a button
     *
     * @param {string} buttonId - Button ID
     * @param {Function} callback - Callback function
     */
    registerCallback(buttonId, callback) {
        if (typeof callback === "function") {
            this.buttonCallbacks.set(buttonId, callback);
        }
    }

    /**
     * Enable specific button for action
     * Used when tile is selected or condition is met
     *
     * @param {string} buttonId - Button ID to enable
     */
    enableButton(buttonId) {
        this.setDisabled(buttonId, false);
    }

    /**
     * Disable specific button
     *
     * @param {string} buttonId - Button ID to disable
     */
    disableButton(buttonId) {
        this.setDisabled(buttonId, true);
    }
}
