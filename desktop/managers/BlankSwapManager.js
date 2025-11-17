import {PLAYER, SUIT} from "../../constants.js";
import {TileData} from "../../core/models/TileData.js";
import {printInfo, printMessage} from "../../utils.js";

/**
 * BlankSwapManager - Handles blank tile exchange interactions on desktop.
 *
 * Keeps PhaserAdapter slim by encapsulating all UI wiring (button state,
 * discard pile selection, prompts) related to the house-rule blank swap.
 */
export class BlankSwapManager {
    constructor({table, selectionManager, buttonManager, gameController}) {
        this.table = table;
        this.selectionManager = selectionManager;
        this.buttonManager = buttonManager;
        this.gameController = gameController;

        this.inDiscardPrompt = false;
        this.isSelectingDiscard = false;
    }

    /**
     * Called when the discard prompt becomes active.
     */
    handleDiscardPromptStart() {
        this.inDiscardPrompt = true;
        this.refreshButton();
    }

    /**
     * Called when the discard prompt resolves or is cancelled.
     */
    handleDiscardPromptEnd() {
        this.inDiscardPrompt = false;
        this.cancelSwapFlow(false);
        this.hideSwapButton();
    }

    /**
     * Called whenever the human hand is updated.
     * Ensures eligibility is re-evaluated while in discard mode.
     */
    handleHandUpdated(playerIndex) {
        if (playerIndex === PLAYER.BOTTOM && this.inDiscardPrompt) {
            this.refreshButton();
        }
    }

    /**
     * Called whenever a tile is discarded (pile contents changed).
     */
    handleDiscardPileChanged() {
        if (this.inDiscardPrompt) {
            this.refreshButton();
        }
    }

    /**
     * Called after GameController confirms a blank exchange.
     */
    handleBlankExchangeEvent() {
        this.isSelectingDiscard = false;
        this.table?.discards?.disableDiscardSelection?.();
        this.selectionManager?.clearSelection?.();
        this.printDefaultPrompt();
        this.refreshButton();
    }

    /**
     * Show or hide the Swap button based on availability.
     */
    refreshButton() {
        if (!this.buttonManager) {
            return;
        }

        if (!this.inDiscardPrompt || !this.isSwapPossible()) {
            this.hideSwapButton();
            return;
        }

        this.buttonManager.show(["button4"]);
        this.buttonManager.setText("button4", "Swap Blank");
        this.buttonManager.enableButton("button4");
        this.buttonManager.registerCallback("button4", () => this.beginSwapFlow());
    }

    hideSwapButton() {
        if (!this.buttonManager) {
            return;
        }
        this.buttonManager.hide(["button4"]);
        this.buttonManager.registerCallback("button4", () => {});
    }

    /**
     * Determine if swap is possible given current state.
     */
    isSwapPossible() {
        if (!this.gameController?.settings?.useBlankTiles) {
            return false;
        }

        const humanHand = this.table?.players?.[PLAYER.BOTTOM]?.hand;
        const tiles = humanHand?.hiddenTileSet?.tileArray || [];
        const hasBlank = tiles.some(tile => tile.suit === SUIT.BLANK);
        const selectableDiscards = this.table?.discards?.getSelectableDiscards?.() || [];

        return hasBlank && selectableDiscards.length > 0;
    }

    /**
     * Start the swap workflow (user clicked the button).
     */
    beginSwapFlow() {
        if (this.isSelectingDiscard) {
            return;
        }

        const selection = this.selectionManager?.getSelection?.() || [];
        if (selection.length !== 1 || selection[0].suit !== SUIT.BLANK) {
            printInfo("Select exactly one blank tile before swapping.");
            return;
        }

        const discardPile = this.table?.discards;
        if (!discardPile || (discardPile.getSelectableDiscards?.() || []).length === 0) {
            printInfo("No discard tiles are available to retrieve.");
            return;
        }

        this.isSelectingDiscard = true;
        this.buttonManager?.disableButton("button4");
        printInfo("Select a discard tile to retrieve with your blank.");

        discardPile.enableDiscardSelection((targetTile) => {
            discardPile.disableDiscardSelection();
            this.isSelectingDiscard = false;
            this.commitSwap(selection[0], targetTile);
        });
    }

    /**
     * Cancel the workflow if the discard prompt exits while selection is open.
     */
    cancelSwapFlow(printPrompt = true) {
        if (this.isSelectingDiscard) {
            this.table?.discards?.disableDiscardSelection?.();
            this.isSelectingDiscard = false;
        }
        if (printPrompt) {
            this.printDefaultPrompt();
        }
    }

    /**
     * Send swap request to GameController.
     */
    commitSwap(blankTile, discardTile) {
        if (!blankTile || !discardTile) {
            this.buttonManager?.enableButton("button4");
            this.printDefaultPrompt();
            return;
        }

        try {
            const blankTileData = TileData.fromPhaserTile(blankTile);
            const discardTileData = TileData.fromPhaserTile(discardTile);
            this.gameController.exchangeBlankWithDiscard(blankTileData, discardTileData);
        } catch (error) {
            printMessage(`Blank exchange failed: ${error.message}`);
            this.buttonManager?.enableButton("button4");
            this.printDefaultPrompt();
        }
    }

    printDefaultPrompt() {
        printInfo("Select a tile to discard.");
    }
}
