import { Tile, TileRecommendation } from '@amj/shared-types';
import { matchesTileFamily } from '@amj/shared-utils';
import { RankedPattern } from './types';

/**
 * @fileoverview Tile Recommendation Engine
 * @description Provides intelligent KEEP/PASS/DISCARD recommendations for tiles in a player's hand.
 * This engine analyzes the player's current hand against ranked patterns to determine which tiles
 * are most valuable for completing high-scoring patterns, helping players make strategic decisions
 * about which tiles to keep, pass during Charleston, or discard.
 *
 * **Recommendation Strategy:**
 * - **KEEP**: Tiles essential for top-ranked patterns (positions 1-3)
 * - **PASS**: Tiles useful for medium-ranked patterns (positions 4-8)
 * - **DISCARD**: Tiles not needed in any high-ranking patterns
 * - **Jokers**: Always marked as KEEP due to their wildcard value
 *
 * **Intelligence Integration:**
 * This engine works in conjunction with the Pattern Analysis and Ranking engines to provide
 * a complete AI assistance system for American Mahjong players.
 *
 * @example
 * ```typescript
 * import { generateTileRecommendations } from './tile-recommendation-engine';
 * import { rankPatterns } from './pattern-ranking-engine';
 * import { runPatternAnalysis } from './pattern-analysis-engine';
 *
 * const matches = runPatternAnalysis(playerHand, allPatterns);
 * const rankings = rankPatterns(matches, wallTiles, discardedTiles);
 * const recommendations = generateTileRecommendations(rankings, playerHand);
 *
 * // Show recommendations for each tile
 * playerHand.forEach(tile => {
 *   const rec = recommendations.get(tile.instanceId);
 *   console.log(`${tile.tileId}: ${rec}`);
 * });
 * ```
 */
/**
 * Generates intelligent KEEP/PASS/DISCARD recommendations for each tile in the player's hand.
 *
 * This function analyzes each tile in the player's hand against the ranked patterns to determine
 * its strategic value. The recommendations help players make informed decisions about which tiles
 * to keep for pattern completion, which to pass during Charleston, and which to discard.
 *
 * **Recommendation Algorithm:**
 * 1. **Top Pattern Analysis**: Check if tile is needed in the top 3 ranked patterns
 * 2. **Medium Pattern Analysis**: Check if tile is needed in patterns ranked 4-8
 * 3. **Joker Handling**: Jokers are always marked as KEEP due to their wildcard value
 * 4. **Strategic Mapping**: Convert analysis results to KEEP/PASS/DISCARD recommendations
 *
 * **Strategic Rationale:**
 * - **KEEP**: Essential for completing high-value patterns (top 3)
 * - **PASS**: Useful for medium-value patterns but not critical (ranks 4-8)
 * - **DISCARD**: Not needed in any strategically valuable patterns
 *
 * @param {RankedPattern[]} rankedPatterns - Array of ranked patterns from the ranking engine, sorted by score (best first)
 * @param {Tile[]} hand - The player's current hand as an array of Tile objects
 * @returns {Map<string, TileRecommendation>} Map of tile instanceId to recommendation ('KEEP' | 'PASS' | 'DISCARD')
 *
 * @example
 * ```typescript
 * const rankings = rankPatterns(matches, wallTiles, discardedTiles);
 * const recommendations = generateTileRecommendations(rankings, playerHand);
 *
 * // Display recommendations to player
 * playerHand.forEach(tile => {
 *   const recommendation = recommendations.get(tile.instanceId);
 *   const actionText = {
 *     'KEEP': '🔒 Keep this tile',
 *     'PASS': '🔄 Pass during Charleston',
 *     'DISCARD': '🗑️ Safe to discard'
 *   }[recommendation];
 *
 *   console.log(`${tile.tileId}: ${actionText}`);
 * });
 * ```
 *
 * @see {@link analyzeTileImportance} - The core tile analysis algorithm
 * @see {@link isNeededInPatterns} - Pattern requirement checking logic
 * @see {@link TileRecommendation} - The recommendation type definition
 */
export function generateTileRecommendations(
   rankedPatterns: RankedPattern[],
   hand: Tile[]
): Map<string, TileRecommendation> {
  const recommendations = new Map<string, TileRecommendation>();

  // Get top patterns to consider
  const topPatterns = rankedPatterns.slice(0, 3);
  const mediumPatterns = rankedPatterns.slice(3, 8);

  for (const tile of hand) {
    const recommendation = analyzeTileImportance(
      tile,
      topPatterns,
      mediumPatterns
    );
    recommendations.set(tile.instanceId, recommendation);
  }

  return recommendations;
}

/**
 * Determines the importance of a single tile based on pattern rankings.
 *
 * @param tile - The tile to analyze
 * @param topPatterns - Top 3 ranked patterns
 * @param mediumPatterns - Patterns ranked 4-8
 * @returns KEEP, PASS, or DISCARD recommendation
 */
function analyzeTileImportance(
  tile: Tile,
  topPatterns: RankedPattern[],
  mediumPatterns: RankedPattern[]
): TileRecommendation {
  // Jokers are always KEEP
  if (tile.isJoker) {
    return 'KEEP';
  }

  // Check if tile is needed in top patterns
  const neededInTop = isNeededInPatterns(tile, topPatterns);
  if (neededInTop) {
    return 'KEEP';
  }

  // Check if tile is needed in medium patterns
  const neededInMedium = isNeededInPatterns(tile, mediumPatterns);
  if (neededInMedium) {
    return 'PASS';
  }

  // Not needed in any good patterns
  return 'DISCARD';
}

/**
 * Checks if a tile is needed in any of the given patterns.
 *
 * Matches tile against the 14-tile sequence in each pattern variation.
 * Pattern tiles are already in tileId format (post-TICKET-010.11).
 *
 * @param tile - The tile to check
 * @param patterns - Array of ranked patterns to check against
 * @returns true if tile is needed in at least one pattern
 */
function isNeededInPatterns(tile: Tile, patterns: RankedPattern[]): boolean {
  for (const ranked of patterns) {
    // Check if tile appears in this pattern's tile sequence
    for (const patternTileId of ranked.variation.tiles) {
      if (matchesTileFamily(tile.tileId, patternTileId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Alternative recommendation strategy: Statistical approach
 * Calculates a score for each tile based on frequency across all patterns.
 *
 * This function is provided as an alternative approach and can be swapped
 * in later if the primary strategy proves too conservative or aggressive.
 *
 * @param rankedPatterns - Sorted patterns from ranking engine
 * @param hand - The player's current hand
 * @returns Map of tile instanceId to recommendation
 */
export function generateStatisticalRecommendations(
  rankedPatterns: RankedPattern[],
  hand: Tile[]
): Map<string, TileRecommendation> {
  const recommendations = new Map<string, TileRecommendation>();
  const tileScores = new Map<string, number>();

  // Calculate score for each tile
  for (const tile of hand) {
    let score = 0;

    for (let i = 0; i < rankedPatterns.length; i++) {
      const pattern = rankedPatterns[i];
      const weight = Math.max(1, 10 - i); // Top patterns have higher weight (10, 9, 8, ...)

      if (isNeededInPatterns(tile, [pattern])) {
        score += weight;
      }
    }

    tileScores.set(tile.instanceId, score);
  }

  // Convert scores to recommendations based on average
  const scores = Array.from(tileScores.values());
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  for (const tile of hand) {
    const score = tileScores.get(tile.instanceId) || 0;

    if (score > avgScore * 1.5) {
      recommendations.set(tile.instanceId, 'KEEP');
    } else if (score > avgScore * 0.5) {
      recommendations.set(tile.instanceId, 'PASS');
    } else {
      recommendations.set(tile.instanceId, 'DISCARD');
    }
  }

  return recommendations;
}
