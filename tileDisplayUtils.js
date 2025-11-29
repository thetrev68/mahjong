// tileDisplayUtils.js - Utilities for displaying colorized mahjong patterns with tile matching

import { SUIT, VNUMBER, DRAGON, WIND } from "./constants.js";

// Color mapping based on provided specs
const SUIT_COLORS = {
  [SUIT.VSUIT1]: "green",
  [SUIT.VSUIT2]: "red",
  [SUIT.VSUIT3]: "blue",
  [SUIT.FLOWER]: "black",
  // Note: VSUIT*_DRAGON colors are determined dynamically based on vsuitArray
  // in getTileDisplayChar(), not from static mappings here
  [SUIT.WIND]: "black",
  [SUIT.DRAGON]: "blue",
  [SUIT.JOKER]: "gray", // Added for jokers
  [SUIT.CRACK]: "red", // Assuming mappings for actual suits
  [SUIT.BAM]: "green",
  [SUIT.DOT]: "blue"
};

// Map tile to display character and color
/* knip-ignore */
export function getTileDisplayChar(tile, isEvenHand = false, vsuitArray = null, dragonMapping = null) {
  if (tile.suit === SUIT.JOKER) {
    return { char: "J", color: SUIT_COLORS[SUIT.JOKER], tile };
  }
  if (tile.suit === SUIT.FLOWER) {
    return { char: "F", color: SUIT_COLORS[SUIT.FLOWER], tile };
  }
  if (tile.suit === SUIT.WIND) {
    const windChars = { [WIND.NORTH]: "N", [WIND.EAST]: "E", [WIND.SOUTH]: "S", [WIND.WEST]: "W" };
    return { char: windChars[tile.number] || "?", color: SUIT_COLORS[SUIT.WIND], tile };
  }
  if (tile.suit === SUIT.DRAGON || tile.suit >= SUIT.VSUIT1_DRAGON && tile.suit <= SUIT.VSUIT3_DRAGON) {
    // White dragon as "0" (soap): Only when suit is SUIT.DRAGON and number is DRAGON.WHITE
    if (tile.suit === SUIT.DRAGON && tile.number === DRAGON.WHITE) {
      return { char: "0", color: "blue", tile };
    }

    // All other cases display as "D" - includes:
    // - SUIT.DRAGON with number RED (0) or GREEN (1)
    // - SUIT.VSUITx_DRAGON with number 0 (colored dragons matching their suit)

    let dragonColor = "blue"; // default
    if (tile.suit === SUIT.DRAGON) {
      // Regular dragon - color depends on the dragon type (number)
      // RED (0) = red, GREEN (1) = green, WHITE (2) = blue (though WHITE is handled above as "0")
      // Check if this is a translated VSUIT*_DRAGON placeholder (has _originalVsuit)
      if (tile._originalVsuit !== undefined && dragonMapping && dragonMapping.has(tile._originalVsuit)) {
        // Use the color from the dragon mapping for this virtual suit
        const mappedNumber = dragonMapping.get(tile._originalVsuit);
        const dragonColors = {
          [DRAGON.RED]: "red",
          [DRAGON.GREEN]: "green",
          [DRAGON.WHITE]: "blue"
        };
        dragonColor = dragonColors[mappedNumber] || "blue";
      } else {
        const dragonColors = {
          [DRAGON.RED]: "red",
          [DRAGON.GREEN]: "green",
          [DRAGON.WHITE]: "blue"
        };
        dragonColor = dragonColors[tile.number] || "blue";
      }
    } else if (tile.suit >= SUIT.VSUIT1_DRAGON && tile.suit <= SUIT.VSUIT3_DRAGON) {
      // Virtual suit dragons - determine color from dragonMapping
      // dragonMapping should always be populated by renderPatternVariation()
      if (dragonMapping && dragonMapping.has(tile.suit)) {
        const dragonNumber = dragonMapping.get(tile.suit);
        const dragonColors = {
          [DRAGON.RED]: "red",
          [DRAGON.GREEN]: "green",
          [DRAGON.WHITE]: "blue"
        };
        dragonColor = dragonColors[dragonNumber] || "blue";
      } else if (vsuitArray) {
        // Fallback: Try vsuitArray, but ONLY if the value is valid (>= 0)
        // vsuitArray can have -1 for unused positions when vsuitCount < 3
        const vsuitIndex = tile.suit - SUIT.VSUIT1_DRAGON;
        const dragonNumber = vsuitArray[vsuitIndex];
        if (dragonNumber >= 0 && dragonNumber <= 2) {
          const dragonColors = {
            [DRAGON.RED]: "red",
            [DRAGON.GREEN]: "green",
            [DRAGON.WHITE]: "blue"
          };
          dragonColor = dragonColors[dragonNumber] || "blue";
        } else {
          // vsuitArray value is -1 (unused), use fixed color based on vsuit index
          const vsuitColors = ["red", "green", "blue"];
          dragonColor = vsuitColors[vsuitIndex] || "blue";
        }
      } else {
        // Final fallback to fixed color mapping if no dragonMapping or vsuitArray
        // VSUIT1_DRAGON=red, VSUIT2_DRAGON=green, VSUIT3_DRAGON=blue
        const vsuitIndex = tile.suit - SUIT.VSUIT1_DRAGON; // 0, 1, or 2
        const vsuitColors = ["red", "green", "blue"];
        dragonColor = vsuitColors[vsuitIndex] || "blue";
      }
    }

    return { char: "D", color: dragonColor, tile };
  }
  if (tile.number >= 1 && tile.number <= 9) {
    // Handle virtual suits with dynamic color mapping
    if (vsuitArray && tile.suit >= SUIT.VSUIT1 && tile.suit <= SUIT.VSUIT3) {
      // Map virtual suit to real suit using vsuitArray
      const realSuit = vsuitArray[tile.suit - SUIT.VSUIT1];
      const realSuitColor = SUIT_COLORS[realSuit] || "blue";
      return { char: tile.number.toString(), color: realSuitColor, tile };
    }
    return { char: tile.number.toString(), color: SUIT_COLORS[tile.suit] || "blue", tile };
  }
  // Virtual numbers (consecutive) - adjust for even/odd hand
  if (tile.number >= VNUMBER.CONSECUTIVE1 && tile.number <= VNUMBER.CONSECUTIVE7) {
    const index = tile.number - VNUMBER.CONSECUTIVE1;
    const num = isEvenHand ? 2 + index * 2 : 1 + index * 2;
    
    // Handle virtual suits with dynamic color mapping
    if (vsuitArray && tile.suit >= SUIT.VSUIT1 && tile.suit <= SUIT.VSUIT3) {
      // Map virtual suit to real suit using vsuitArray
      const realSuit = vsuitArray[tile.suit - SUIT.VSUIT1];
      const realSuitColor = SUIT_COLORS[realSuit] || "blue";
      return { char: num.toString(), color: realSuitColor, tile };
    }
    return { char: num.toString(), color: SUIT_COLORS[tile.suit] || "blue", tile };
  }
  if (tile.number === 0) {
    return { char: "0", color: SUIT_COLORS[tile.suit] || "gray", tile }; // Handle zero as soap/blank
  }
  return { char: "?", color: "gray", tile }; // Fallback
}

// Tally tile counts in player's hand (normalized)
function tally(tiles) {
  const counts = new Map();
  tiles.forEach(tile => {
    const key = `${tile.suit}-${tile.number}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return counts;
}

// Get display chars for pattern tiles, with matching against player's hand
// Supports joker substitution only for components with count >=3
/* knip-ignore */
export function getPatternDisplayChars(patternTiles, playerTiles, componentCounts, isEvenHand, vsuitArray = null, hiddenTiles = null, consecutiveMapping = null, dragonMapping = null) {
  const playerCounts = tally(playerTiles);
  const usedCounts = new Map();

  // Count available jokers for pattern matching
  // Use ALL jokers (both hidden and exposed) when checking if tiles match the pattern
  // Only hidden jokers can be used for substitution (exposed jokers are already committed)
  const hiddenCounts = hiddenTiles ? tally(hiddenTiles) : playerCounts;
  const availableJokersForSubstitution = hiddenCounts.get(`${SUIT.JOKER}-0`) || 0;
  let actualJokersUsed = 0;  // Track actual joker tiles matched from pattern
  let substitutedJokers = 0;  // Track jokers used for substitution

  return patternTiles.map((tile, index) => {
    let display;

    // Use the consistent consecutive mapping for display if provided
    if (consecutiveMapping && tile.number >= VNUMBER.CONSECUTIVE1 && tile.number <= VNUMBER.CONSECUTIVE7) {
      const mappedNumber = consecutiveMapping.get(tile.number);
      if (mappedNumber !== undefined) {
        const modifiedTile = { ...tile, number: mappedNumber };
        display = getTileDisplayChar(modifiedTile, isEvenHand, vsuitArray, dragonMapping);
      } else {
        display = getTileDisplayChar(tile, isEvenHand, vsuitArray, dragonMapping);
      }
    } else {
      display = getTileDisplayChar(tile, isEvenHand, vsuitArray, dragonMapping);
    }

    const key = `${tile.suit}-${tile.number}`;
    const componentCount = componentCounts[index];

    let isMatched = false;

    // Check exact match first
    const available = (playerCounts.get(key) || 0) - (usedCounts.get(key) || 0);
    if (available > 0) {
      isMatched = true;
      usedCounts.set(key, (usedCounts.get(key) || 0) + 1);

      // Track when we use an actual joker tile from the pattern
      // These are jokers that were already matched by the card validation
      if (tile.suit === SUIT.JOKER) {
        actualJokersUsed++;
      }
    } else if (componentCount >= 3 && tile.suit !== SUIT.JOKER) {
      // Joker substitution allowed only for pungs/kongs/quints
      // Only use hidden jokers that aren't already accounted for
      const totalJokersUsed = actualJokersUsed + substitutedJokers;
      if (totalJokersUsed < availableJokersForSubstitution) {
        isMatched = true;
        substitutedJokers++;
        display.char = "J"; // Display as J for substituted joker
        display.color = "gray";
      }
    }

    return { ...display, isMatched };
  });
}

// Get CSS classes for tile display (with inversion for matches)
/* knip-ignore */
// Explicit color class mappings to avoid Tailwind JIT purging
const COLOR_CLASS_MAP = {
  // Inverted (matched tiles): colored backgrounds with white text
  inverted: {
    red: "bg-red-600 text-white border border-red-700",
    green: "bg-green-600 text-white border border-green-700",
    blue: "bg-blue-600 text-white border border-blue-700",
    black: "bg-black text-white border border-gray-800",
    gray: "bg-gray-600 text-white border border-gray-700"
  },
  // Non-inverted (unmatched tiles): white background with colored text
  normal: {
    red: "bg-white text-red-600 border border-red-200",
    green: "bg-white text-green-600 border border-green-200",
    blue: "bg-white text-blue-600 border border-blue-200",
    black: "bg-white text-black border border-gray-300",
    gray: "bg-white text-gray-700 border border-gray-300"
  }
};

export function getTileCharClasses(displayChar, invert = true) {
  const base = "tile-char"; // Use the class for consistent styling
  const shouldInvert = invert && displayChar.isMatched;
  const color = displayChar.color;

  // Select the appropriate color map
  const colorMap = shouldInvert ? COLOR_CLASS_MAP.inverted : COLOR_CLASS_MAP.normal;

  // Get the color classes from the map, with gray as fallback
  const colorClasses = colorMap[color] || colorMap.gray;

  return `${base} ${colorClasses}`;
}

// Render the pattern with spacing per component
export function renderPatternVariation(rankedHand, playerTiles, hiddenTiles = null) {
  const patternTiles = [];
  const componentCounts = [];
  const isEvenHand = rankedHand.hand.even || false;

  // Build a consistent mapping for VNUMBER.CONSECUTIVE values by examining actual matched tiles
  // This ensures all CONSECUTIVE1 instances resolve to the same number across the entire hand
  const consecutiveMapping = new Map();

  // Build a dragon mapping for VSUIT*_DRAGON components
  // Maps VSUIT1_DRAGON/VSUIT2_DRAGON/VSUIT3_DRAGON to actual dragon numbers (RED/GREEN/WHITE)
  //
  // IMPORTANT: vsuitArray is ONLY for regular suits (CRACK/BAM/DOT), NOT for dragons!
  // When vsuitCount < 3, vsuitArray positions can be -1 (unused), which is invalid for dragons.
  // We must build dragonMapping independently.
  const dragonMapping = new Map();

  // First pass: Build dragon mapping from matched dragon tiles in componentInfoArray
  rankedHand.componentInfoArray.forEach(component => {
    const componentSuit = component.component.suit;

    // Check if this component is a virtual dragon suit
    if (componentSuit >= SUIT.VSUIT1_DRAGON && componentSuit <= SUIT.VSUIT3_DRAGON) {
      // Find the actual dragon tile that was matched (if any)
      if (component.tileArray && component.tileArray.length > 0) {
        const dragonTile = component.tileArray.find(tile => tile.suit === SUIT.DRAGON);
        if (dragonTile) {
          // Map this virtual dragon suit to the actual dragon number that was matched
          dragonMapping.set(componentSuit, dragonTile.number);
        }
      }
    }
  });

  // Second pass: Fill in missing dragon mappings with default distinct values
  // This ensures all VSUIT*_DRAGON components get a color even when not matched
  const virtualDragonSuits = [];
  rankedHand.componentInfoArray.forEach(component => {
    const componentSuit = component.component.suit;
    if (componentSuit >= SUIT.VSUIT1_DRAGON && componentSuit <= SUIT.VSUIT3_DRAGON) {
      if (!virtualDragonSuits.includes(componentSuit)) {
        virtualDragonSuits.push(componentSuit);
      }
    }
  });

  // Assign default dragon numbers to unmapped virtual suits
  const usedDragons = new Set(dragonMapping.values());
  const allDragons = [DRAGON.RED, DRAGON.GREEN, DRAGON.WHITE];
  const availableDragons = allDragons.filter(d => !usedDragons.has(d));
  let availableIndex = 0;

  virtualDragonSuits.forEach(vsuit => {
    if (!dragonMapping.has(vsuit)) {
      // Assign next available dragon, or cycle through if exhausted
      if (availableIndex < availableDragons.length) {
        dragonMapping.set(vsuit, availableDragons[availableIndex]);
        availableIndex++;
      } else {
        // Fallback: use default based on vsuit index (for visualization only)
        const vsuitIndex = vsuit - SUIT.VSUIT1_DRAGON;
        dragonMapping.set(vsuit, allDragons[vsuitIndex] || DRAGON.RED);
      }
    }
  });

  rankedHand.componentInfoArray.forEach(component => {
    if (component.tileArray && component.tileArray.length > 0) {
      // Check if this component uses a consecutive number
      const componentNumber = component.component.number;
      if (componentNumber >= VNUMBER.CONSECUTIVE1 && componentNumber <= VNUMBER.CONSECUTIVE7) {
        // Find the actual number from the matched tiles (excluding jokers)
        const actualTile = component.tileArray.find(tile => tile.suit !== SUIT.JOKER);
        if (actualTile && consecutiveMapping.size === 0) {
          // Found the first consecutive number - use it to map ALL consecutive numbers
          const consecutiveIndex = componentNumber - VNUMBER.CONSECUTIVE1; // 0-6
          const baseNumber = actualTile.number - consecutiveIndex; // The number that corresponds to CONSECUTIVE1

          // Map all 7 consecutive numbers based on this base
          for (let i = 0; i < 7; i++) {
            consecutiveMapping.set(VNUMBER.CONSECUTIVE1 + i, baseNumber + i);
          }
        }
      }
    }
  });

  // Use original component order
  rankedHand.componentInfoArray.forEach((component, compIndex) => {
    const expectedCount = component.component.count;
    const actualTileCount = component.tileArray ? component.tileArray.length : 0;

    // Add all the actual matched tiles
    if (component.tileArray && component.tileArray.length > 0) {
      component.tileArray.forEach(tile => {
        patternTiles.push(tile);
        componentCounts.push(expectedCount);
      });
    }

    // If we have fewer tiles than expected, add placeholders for the rest
    if (actualTileCount < expectedCount) {
      let placeholderTile;
      const componentSuit = component.component.suit;
      
      // For VSUIT*_DRAGON components, translate to actual DRAGON suit with mapped number
      // This allows matching against player's dragon tiles
      if (componentSuit >= SUIT.VSUIT1_DRAGON && componentSuit <= SUIT.VSUIT3_DRAGON) {
        const dragonNumber = dragonMapping.get(componentSuit);
        placeholderTile = {
          suit: SUIT.DRAGON,
          number: dragonNumber !== undefined ? dragonNumber : 0,
          // Store original virtual suit for color determination in getTileDisplayChar
          _originalVsuit: componentSuit
        };
      } else {
        placeholderTile = {
          suit: componentSuit || SUIT.INVALID,
          number: component.component.number || 0
        };
      }
      
      for (let i = actualTileCount; i < expectedCount; i++) {
        patternTiles.push(placeholderTile);
        componentCounts.push(expectedCount);
      }
    }

    // Add spacer only if not between two singles
    if (compIndex < rankedHand.componentInfoArray.length - 1) {
      const nextComponent = rankedHand.componentInfoArray[compIndex + 1];
      if (!(component.component.count === 1 && nextComponent.component.count === 1)) {
        patternTiles.push({ isSpacer: true });
        componentCounts.push(0);
      }
    }
  });

  // Only pass actual tiles to getPatternDisplayChars
  const actualTiles = patternTiles.filter(t => !t.isSpacer);
  const actualCounts = componentCounts.filter((_, i) => !patternTiles[i].isSpacer);
  const displayChars = getPatternDisplayChars(actualTiles, playerTiles, actualCounts, isEvenHand, rankedHand.vsuitArray, hiddenTiles, consecutiveMapping, dragonMapping);

  // Reinsert spacers into displayChars
  const finalDisplay = [];
  let tileIndex = 0;
  patternTiles.forEach(item => {
    if (item.isSpacer) {
      finalDisplay.push({ isSpacer: true });
    } else {
      finalDisplay.push(displayChars[tileIndex++]);
    }
  });

  let html = "<div class=\"pattern-row\">";
  finalDisplay.forEach(item => {
    if (item.isSpacer) {
      html += "<span class=\"component-spacer\"></span>";
    } else {
      html += `<span class="${getTileCharClasses(item)}">${item.char}</span>`;
    }
  });
  html += "</div>";

  return html;
}