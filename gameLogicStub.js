/**
 * GameLogicStub - Minimal stub to support legacy Hand/TileSet and HintAnimationManager
 * This stub provides the minimal interface needed by Hand, TileSet, and HintAnimationManager classes
 * that still have UI interaction code tied to gameLogic state.
 *
 * This is a temporary bridge during the refactor. These dependencies will be fully
 * refactored in Phase 4 when Hand/TileSet UI code is moved to PhaserAdapter.
 *
 * TODO (Phase 4): Refactor Hand/TileSet to remove gameLogic dependency
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
