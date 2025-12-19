/**
 * AnimationConfig - Centralized animation timing and configuration
 *
 * This file provides a unified source of truth for animation speeds and delays
 * across both Desktop (Phaser) and Mobile (CSS/DOM) platforms.
 */

export const ANIMATION_TIMINGS = {
  // Dealing phase animations
  DEALING: {
    TILE_DRAW_DELAY: 100, // ms between individual tile deals
    TILE_FLY_DURATION: 300, // ms for tile to travel from wall to hand
    TILE_DEAL_STAGGER: 50, // ms stagger between tiles in a batch (Desktop)
    BATCH_TRANSITION: 50, // ms delay between batches (Desktop)
    COMPLETE_DELAY: 500, // ms pause after dealing finishes
  },

  // Charleston phase animations
  CHARLESTON: {
    PASS_DURATION: 400, // ms for passing animation
    RECEIVE_DURATION: 400, // ms for receiving animation
    TRAVEL_DELAY: 200, // ms delay simulating tile travel between players
    PHASE_TRANSITION: 500, // ms delay between Charleston phases
  },

  // Courtesy phase animations
  COURTESY: {
    QUERY_DELAY: 300, // ms delay before showing vote query
    REVEAL_DURATION: 300, // ms for tile reveal animation
  },

  // Main gameplay animations
  GAMEPLAY: {
    DRAW_DURATION: 200, // ms for tile draw from wall
    DISCARD_HUMAN: 300, // ms for human player discard animation
    DISCARD_AI: 200, // ms for AI player discard animation
    EXPOSURE_DURATION: 250, // ms for exposure (pung/kong/quint) animation
    EXPOSURE_STAGGER: 50, // ms stagger between tiles in an exposure (Mobile)
    CLAIM_POPUP_DELAY: 100, // ms delay before showing claim popup
    HAND_SORT_DURATION: 400, // ms for hand sorting animation
    TURN_START_DURATION: 600, // ms for turn indicator appearing
    TURN_END_DURATION: 300, // ms for turn indicator disappearing
  },

  // Interaction feedback
  UI: {
    INVALID_ACTION: 500, // ms for "shake" or invalid feedback
    PULSE_DURATION: 500, // ms for generic pulse effects
    SELECTION_DURATION: 150, // ms for tile selection/deselection rise
  },

  // Game end
  END: {
    GAME_END_DELAY: 1000, // ms pause before showing results
  },

  // Legacy/Generic Delays (for GameController coordination)
  LEGACY: {
    TILE_DRAWN_DELAY: 300, // Total delay coordination for draw
    DISCARD_COMPLETE_DELAY: 500, // Total delay coordination for discard
  },
};
