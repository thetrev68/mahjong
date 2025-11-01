import {PLAYER} from "./constants.js";
import {Hand} from "./gameObjects_hand.js"

// PRIVATE CONSTANTS


// PRIVATE GLOBALS


export class Player {
    constructor(scene, gameLogic, playerInfo) {
        // Player ID
        // 0 - player, bottom of screen
        // 1 - computer, right
        // 2 - computer, top
        // 3 - computer, left
        //
        // This is in "turn" order
        this.playerInfo = playerInfo;
        const inputEnabled = (playerInfo.id === PLAYER.BOTTOM)
        this.hand = new Hand(scene, gameLogic, inputEnabled);
    }


    create() {
        // Intentionally empty
    }

    showHand(forceFaceup) {
        this.hand.showHand(this.playerInfo, forceFaceup);
    }
}

