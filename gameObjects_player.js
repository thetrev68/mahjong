import {PLAYER} from "./constants.js";
import {Hand} from "./gameObjects_hand.js";

// PRIVATE CONSTANTS


// PRIVATE GLOBALS


export class Player {
    constructor(scene, playerInfo) {
        // Player ID
        // 0 - player, bottom of screen
        // 1 - computer, right
        // 2 - computer, top
        // 3 - computer, left
        //
        // This is in "turn" order
        this.playerInfo = playerInfo;
        const inputEnabled = (playerInfo.id === PLAYER.BOTTOM);
        this.hand = new Hand(scene, null, inputEnabled);  // gameLogic will be set after construction
    }


    create() {
        // Intentionally empty
    }

    showHand(forceFaceup) {
        this.hand.showHand(this.playerInfo, forceFaceup);
    }
}

