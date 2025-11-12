/**
 * PlayerData - Plain data representation of a player
 * NO Phaser dependencies
 */

import {HandData} from "./HandData.js";
import {PLAYER} from "../../constants.js";

export class PlayerData {
    /**
     * @param {number} position - Player position (from PLAYER enum)
     * @param {string} name - Player name
     */
    constructor(position, name = "") {
        /** @type {number} Position at table (0=BOTTOM, 1=RIGHT, 2=TOP, 3=LEFT) */
        this.position = position;

        /** @type {string} Player name */
        this.name = name || this.getDefaultName();

        /** @type {HandData} Player's hand */
        this.hand = new HandData();

        /** @type {boolean} Is this the human player? */
        this.isHuman = position === PLAYER.BOTTOM;

        /** @type {boolean} Is it this player's turn? */
        this.isCurrentTurn = false;

        /** @type {string} Wind assignment (N/E/S/W) */
        this.wind = "";
    }

    /**
     * Get default name based on position
     * @returns {string}
     */
    getDefaultName() {
        const names = ["You", "Opponent 1", "Opponent 2", "Opponent 3"];
        return names[this.position] || `Player ${this.position + 1}`;
    }

    /**
     * Create a deep copy
     * @returns {PlayerData}
     */
    clone() {
        const copy = new PlayerData(this.position, this.name);
        copy.hand = this.hand.clone();
        copy.isHuman = this.isHuman;
        copy.isCurrentTurn = this.isCurrentTurn;
        copy.wind = this.wind;
        return copy;
    }

    /**
     * Create PlayerData from Phaser Player object (migration helper)
     * @param {Player} phaserPlayer - Existing Phaser player
     * @returns {PlayerData}
     */
    static fromPhaserPlayer(phaserPlayer) {
        const playerData = new PlayerData(
            phaserPlayer.playerInfo.playerNum,
            phaserPlayer.playerInfo.name
        );

        playerData.hand = HandData.fromPhaserHand(phaserPlayer.hand);
        playerData.wind = phaserPlayer.playerInfo.wind;

        return playerData;
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            position: this.position,
            name: this.name,
            hand: this.hand.toJSON(),
            isHuman: this.isHuman,
            isCurrentTurn: this.isCurrentTurn,
            wind: this.wind
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} json
     * @returns {PlayerData}
     */
    static fromJSON(json) {
        const player = new PlayerData(json.position, json.name);
        player.hand = HandData.fromJSON(json.hand);
        player.isHuman = json.isHuman;
        player.isCurrentTurn = json.isCurrentTurn;
        player.wind = json.wind;
        return player;
    }
}
