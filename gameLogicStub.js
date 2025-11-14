/**
 * GameLogicStub - TEMPORARY BRIDGE - TO BE REMOVED IN PHASE 3.5
 *
 * This stub provides the minimal interface needed by Hand, TileSet, and HintAnimationManager classes
 * that still have UI interaction code tied to gameLogic state.
 *
 * Phase 3.5 will eliminate this stub by:
 * - Moving HintAnimationManager to desktop/managers/ with direct aiEngine reference
 * - Refactoring Hand/TileSet to not depend on gameLogic (state, discardTile, displayErrorText)
 * - Deleting gameLogicStub.js completely
 *
 * DEPRECATED: Do not add new functionality here. Use directly from GameController or PhaserAdapter.
 * NOTE: gameAI is legacy naming - use aiEngine from GameController instead
 */

export class GameLogicStub {
    constructor(scene, table, aiEngine, card) {
        this.scene = scene;
        this.table = table;
        this.gameAI = aiEngine;  // AIEngine instance for hint calculations
        this.card = card;  // Card validator for hand ranking
        this.state = null;  // Set by GameController
        this.discardTile = null;  // Set by GameController
        this.hintAnimationManager = null;  // Will be initialized after construction
    }

    displayErrorText(message) {
        if (this.scene && this.scene.errorText) {
            this.scene.errorText.setText(message);
            this.scene.errorText.visible = true;
        }
    }
}
