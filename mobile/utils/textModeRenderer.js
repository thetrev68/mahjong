/**
 * Text Mode Renderer
 *
 * Provides text-based tile rendering as a fallback when sprite assets fail to load.
 * Uses the same colorized tile-char format as the pattern visualizer in hints panel.
 */

import { SUIT, WIND, DRAGON } from "../../shared/GameConstants.js";

// Color mapping matching tileDisplayUtils.js
const SUIT_COLORS = {
  [SUIT.CRACK]: "red",
  [SUIT.BAM]: "green",
  [SUIT.DOT]: "blue",
  [SUIT.WIND]: "black",
  [SUIT.DRAGON]: "blue",
  [SUIT.FLOWER]: "black",
  [SUIT.JOKER]: "gray",
  [SUIT.BLANK]: "gray",
};

/**
 * Get display character and color for a tile
 * @param {Object} tile - Tile data {suit, number}
 * @returns {{char: string, color: string}}
 */
export function getTileTextDisplay(tile) {
  if (!tile) {
    return { char: "?", color: "gray" };
  }

  const { suit, number } = tile;

  // Joker
  if (suit === SUIT.JOKER) {
    return { char: "J", color: SUIT_COLORS[SUIT.JOKER] };
  }

  // Flower
  if (suit === SUIT.FLOWER) {
    return { char: "F", color: SUIT_COLORS[SUIT.FLOWER] };
  }

  // Winds
  if (suit === SUIT.WIND) {
    const windChars = {
      [WIND.NORTH]: "N",
      [WIND.EAST]: "E",
      [WIND.SOUTH]: "S",
      [WIND.WEST]: "W",
    };
    return {
      char: windChars[number] || "?",
      color: SUIT_COLORS[SUIT.WIND],
    };
  }

  // Dragons
  if (suit === SUIT.DRAGON) {
    // White dragon as "0" (soap)
    if (number === DRAGON.WHITE) {
      return { char: "0", color: "blue" };
    }

    // Red and Green dragons as "D" with appropriate color
    const dragonColors = {
      [DRAGON.RED]: "red",
      [DRAGON.GREEN]: "green",
      [DRAGON.WHITE]: "blue",
    };

    return {
      char: "D",
      color: dragonColors[number] || "blue",
    };
  }

  // Numbered tiles (Crack, Bam, Dot)
  if (number >= 1 && number <= 9) {
    return {
      char: number.toString(),
      color: SUIT_COLORS[suit] || "blue",
    };
  }

  // Blank tiles
  if (suit === SUIT.BLANK) {
    return { char: "BL", color: SUIT_COLORS[SUIT.BLANK] };
  }

  // Fallback
  return { char: "?", color: "gray" };
}

/**
 * Create a text-mode tile element
 * @param {Object} tile - Tile data
 * @param {string} size - 'normal' | 'small' | 'discard'
 * @returns {HTMLElement}
 */
export function createTextModeTile(tile, size = "normal") {
  const display = getTileTextDisplay(tile);

  const div = document.createElement("div");
  div.className = `tile tile--text-mode tile--${size}`;
  div.dataset.suit = tile.suit;
  div.dataset.number = tile.number;
  if (tile.index !== undefined) {
    div.dataset.index = tile.index;
  }

  // Apply color classes matching pattern visualizer
  const colorClasses = getTextModeColorClasses(display.color);
  div.className += ` ${colorClasses}`;

  // Set text content
  div.textContent = display.char;

  // Accessibility
  div.setAttribute("role", "img");
  div.setAttribute("aria-label", getAccessibleLabel(tile));

  return div;
}

/**
 * Get CSS color classes for text mode tiles
 * @param {string} color - Color name (red, green, blue, black, gray)
 * @returns {string} CSS classes
 */
function getTextModeColorClasses(color) {
  const colorMap = {
    red: "bg-red-600 text-white border-red-700",
    green: "bg-green-600 text-white border-green-700",
    blue: "bg-blue-600 text-white border-blue-700",
    black: "bg-black text-white border-gray-800",
    gray: "bg-gray-600 text-white border-gray-700",
  };
  return colorMap[color] || colorMap.gray;
}

/**
 * Get accessible label for screen readers
 * @param {Object} tile - Tile data
 * @returns {string} Accessible description
 */
function getAccessibleLabel(tile) {
  if (!tile) return "Unknown tile";

  const { suit, number } = tile;

  if (suit === SUIT.JOKER) return "Joker";
  if (suit === SUIT.FLOWER) return `Flower ${number + 1}`;
  if (suit === SUIT.BLANK) return "Blank tile";

  if (suit === SUIT.WIND) {
    const windNames = {
      [WIND.NORTH]: "North",
      [WIND.EAST]: "East",
      [WIND.SOUTH]: "South",
      [WIND.WEST]: "West",
    };
    return `${windNames[number] || "Unknown"} Wind`;
  }

  if (suit === SUIT.DRAGON) {
    const dragonNames = {
      [DRAGON.RED]: "Red",
      [DRAGON.GREEN]: "Green",
      [DRAGON.WHITE]: "White",
    };
    return `${dragonNames[number] || "Unknown"} Dragon`;
  }

  const suitNames = {
    [SUIT.CRACK]: "Crack",
    [SUIT.BAM]: "Bam",
    [SUIT.DOT]: "Dot",
  };

  if (suitNames[suit] && number >= 1 && number <= 9) {
    return `${number} ${suitNames[suit]}`;
  }

  return "Unknown tile";
}
