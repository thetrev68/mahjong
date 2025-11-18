import {PLAYER} from "../../constants.js";
import {Hand} from "./gameObjects_hand.js";

//TODO: This file is to be phased out and removed.

// PRIVATE CONSTANTS


// PRIVATE GLOBALS


export class Player {
    constructor(scene, playerInfo, table) {
        // Player ID
        // 0 - player, bottom of screen
        // 1 - computer, right
        // 2 - computer, top
        // 3 - computer, left
        //
        // This is in "turn" order
        this.playerInfo = playerInfo;
        const inputEnabled = (playerInfo.id === PLAYER.BOTTOM);
        this.hand = new Hand(scene, table, inputEnabled);  // Pass table directly to Hand
    }


    create() {
        // Intentionally empty
    }

    showHand(forceFaceup) {
        this.hand.showHand(this.playerInfo, forceFaceup);
    }
}

