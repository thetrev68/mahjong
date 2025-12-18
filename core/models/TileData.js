/**
 * TileData - Plain data representation of a mahjong tile
 * NO Phaser dependencies - this is pure game state
 */

import { SUIT } from "../../constants.js";
import { gTileGroups } from "../tileDefinitions.js";

export class TileData {
  /**
   * @param {number} suit - Tile suit (from SUIT enum)
   * @param {number} number - Tile number/rank
   * @param {number} index - Unique identifier for this physical tile (0-159)
   */
  constructor(suit, number, index = -1) {
    this.suit = suit;
    this.number = number;
    this.index = index;
  }

  /**
   * Get human-readable text representation
   * @returns {string} e.g., "Crack 5", "North wind", "Joker"
   */
  getText() {
    for (const group of gTileGroups) {
      if (group.suit === this.suit) {
        if (this.suit <= SUIT.DOT) {
          // Numbered suits (Crack, Bam, Dot)
          return `${group.textArray[0]} ${this.number}`;
        } else if (this.suit === SUIT.WIND) {
          // Winds
          return `${group.textArray[this.number]} wind`;
        } else if (this.suit === SUIT.DRAGON) {
          // Dragons
          return `${group.textArray[this.number]}`;
        } else if (this.suit === SUIT.FLOWER) {
          // Flowers
          return `${group.textArray[0]} ${this.number + 1}`;
        } else if (this.suit === SUIT.JOKER) {
          return "Joker";
        } else if (this.suit === SUIT.BLANK) {
          return "Blank";
        }
      }
    }

    // Invalid or unknown tile
    if (this.suit === SUIT.INVALID) {
      return "Invalid";
    }

    return `Unknown tile (${this.suit}:${this.number})`;
  }

  /**
   * Check if two tiles match (same suit and number)
   * @param {TileData} other - Tile to compare
   * @returns {boolean}
   */
  equals(other) {
    if (!other) {
      return false;
    }
    return this.suit === other.suit && this.number === other.number;
  }

  /**
   * Check if this is the exact same physical tile (same index)
   * @param {TileData} other - Tile to compare
   * @returns {boolean}
   */
  isSameTile(other) {
    if (!other) {
      return false;
    }
    return this.index === other.index;
  }

  /**
   * Create a deep copy of this tile
   * @returns {TileData}
   */
  clone() {
    return new TileData(this.suit, this.number, this.index);
  }

  /**
   * Check if this is a joker tile
   * @returns {boolean}
   */
  isJoker() {
    return this.suit === SUIT.JOKER;
  }

  /**
   * Check if this is a blank tile
   * @returns {boolean}
   */
  isBlank() {
    return this.suit === SUIT.BLANK;
  }

  /**
   * Check if this is a flower tile
   * @returns {boolean}
   */
  isFlower() {
    return this.suit === SUIT.FLOWER;
  }

  /**
   * Check if this is a wind tile
   * @returns {boolean}
   */
  isWind() {
    return this.suit === SUIT.WIND;
  }

  /**
   * Check if this is a dragon tile
   * @returns {boolean}
   */
  isDragon() {
    return this.suit === SUIT.DRAGON;
  }

  /**
   * Check if this is a numbered suit (Crack, Bam, Dot)
   * @returns {boolean}
   */
  isNumberedSuit() {
    return this.suit >= SUIT.CRACK && this.suit <= SUIT.DOT;
  }

  /**
   * Check if this is an invalid/placeholder tile
   * @returns {boolean}
   */
  isInvalid() {
    return this.suit === SUIT.INVALID;
  }

  /**
   * Create TileData from existing Phaser Tile object
   * Used during migration to bridge old and new systems
   * @param {Tile} phaserTile - Existing Phaser tile
   * @returns {TileData}
   */
  static fromPhaserTile(phaserTile) {
    return new TileData(phaserTile.suit, phaserTile.number, phaserTile.index);
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      suit: this.suit,
      number: this.number,
      index: this.index,
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} json
   * @returns {TileData}
   */
  static fromJSON(json) {
    return new TileData(json.suit, json.number, json.index);
  }
}
