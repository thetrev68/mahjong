/**
 * GameEvents - Event definitions and builders
 *
 * This module defines the structure and data for all events emitted by GameController.
 * Each event includes animation parameters that PhaserAdapter can use to render
 * animations without needing to know about game state details.
 *
 * Animation parameters follow this pattern:
 * - type: name of animation (e.g., "deal-slide", "discard-slide")
 * - fromPosition: {x, y} starting position
 * - toPosition: {x, y} ending position
 * - duration: milliseconds
 * - easing: Phaser easing function name
 * - Additional parameters specific to animation type
 */

/**
 * Event: STATE_CHANGED
 * Emitted whenever the game state changes
 */
export function createStateChangedEvent(oldState, newState) {
    return {
        type: "STATE_CHANGED",
        oldState,
        newState,
        timestamp: Date.now()
    };
}

/**
 * Event: GAME_STARTED
 * Emitted at the beginning of a new game
 */
export function createGameStartedEvent(players) {
    return {
        type: "GAME_STARTED",
        players,
        timestamp: Date.now()
    };
}

/**
 * Event: TILES_DEALT
 * Signals PhaserAdapter to handle the entire dealing sequence
 * PhaserAdapter will manipulate Phaser wall/hands and sync to core model
 */
export function createTilesDealtEvent(sequence = []) {
    return {
        type: "TILES_DEALT",
        sequence,
        timestamp: Date.now()
    };
}

/**
 * Event: TILE_DRAWN
 * Emitted when a tile is drawn from the wall during dealing or main loop
 */
export function createTileDrawnEvent(player, tile, animation = {}) {
    return {
        type: "TILE_DRAWN",
        player,
        tile,
        animation: {
            type: animation.type || "deal-slide",
            fromPosition: animation.fromPosition || {x: 640, y: 360},  // Wall center default
            toPosition: animation.toPosition || {x: 450, y: 575},     // Player hand default
            duration: animation.duration || 400,
            easing: animation.easing || "Quad.easeOut",
            ...animation
        },
        timestamp: Date.now()
    };
}

/**
 * Event: TILE_DISCARDED
 * Emitted when a player discards a tile
 */
export function createTileDiscardedEvent(player, tile, animation = {}) {
    return {
        type: "TILE_DISCARDED",
        player,
        tile,
        animation: {
            type: animation.type || "discard-slide",
            fromPosition: animation.fromPosition || {x: 450, y: 575},   // Hand position
            toPosition: animation.toPosition || {x: 350, y: 420},       // Discard pile center
            duration: animation.duration || 300,
            easing: animation.easing || "Power2.easeInOut",
            glow: animation.glow || {color: 0x1e3a8a, alpha: 0.9},     // Dark blue glow
            ...animation
        },
        timestamp: Date.now()
    };
}

/**
 * Event: HAND_UPDATED
 * Emitted when a player's hand changes (tiles added/removed)
 */
export function createHandUpdatedEvent(player, hand) {
    return {
        type: "HAND_UPDATED",
        player,
        hand,
        timestamp: Date.now()
    };
}

/**
 * Event: TURN_CHANGED
 * Emitted when the current player changes
 */
export function createTurnChangedEvent(currentPlayer, previousPlayer) {
    return {
        type: "TURN_CHANGED",
        currentPlayer,
        previousPlayer,
        timestamp: Date.now()
    };
}

/**
 * Event: CHARLESTON_PHASE
 * Emitted when entering a Charleston phase or pass
 */
export function createCharlestonPhaseEvent(phase, passCount, direction) {
    return {
        type: "CHARLESTON_PHASE",
        phase,
        passCount,
        direction,  // "right", "across", "left"
        timestamp: Date.now()
    };
}

/**
 * Event: CHARLESTON_PASS
 * Emitted when tiles are passed during Charleston
 */
export function createCharlestonPassEvent(fromPlayer, toPlayer, direction, tiles, animation = {}) {
    const directionOffsets = {
        right: 1,
        across: 2,
        left: 3
    };
    const offset = directionOffsets[direction] || 1;

    return {
        type: "CHARLESTON_PASS",
        fromPlayer,
        toPlayer,
        direction,
        tiles,
        animation: {
            type: animation.type || "pass-tiles",
            direction: animation.direction || direction,
            duration: animation.duration || 500,
            easing: animation.easing || "Sine.easeInOut",
            offset,  // Player offset for positioning
            ...animation
        },
        timestamp: Date.now()
    };
}

/**
 * Event: CHARLESTON_CONTINUE_QUERY
 * Emitted when asking players whether to continue to phase 2
 */
export function createCharlestonContinueQueryEvent(phase) {
    return {
        type: "CHARLESTON_CONTINUE_QUERY",
        phase,
        timestamp: Date.now()
    };
}

/**
 * Event: COURTESY_VOTE
 * Emitted when a player votes on courtesy pass tile count
 */
export function createCourtesyVoteEvent(player, vote) {
    return {
        type: "COURTESY_VOTE",
        player,
        vote,  // 0, 1, 2, or 3
        timestamp: Date.now()
    };
}

/**
 * Event: COURTESY_PASS
 * Emitted when tiles are passed for courtesy exchange
 */
export function createCourtesyPassEvent(fromPlayer, toPlayer, tiles, animation = {}) {
    return {
        type: "COURTESY_PASS",
        fromPlayer,
        toPlayer,
        tiles,
        animation: {
            type: animation.type || "courtesy-exchange",
            duration: animation.duration || 600,
            easing: animation.easing || "Sine.easeInOut",
            glow: animation.glow || {color: 0x1e90ff, alpha: 0.7},  // Dodge blue
            ...animation
        },
        timestamp: Date.now()
    };
}

/**
 * Event: SORT_HAND_REQUESTED
 * Emitted when UI asks to sort a player's hand
 */
export function createSortHandEvent(player, sortType) {
    return {
        type: "SORT_HAND_REQUESTED",
        player,
        sortType,
        timestamp: Date.now()
    };
}

/**
 * Event: TILES_RECEIVED
 * Emitted when a player receives tiles (courtesy or exposure)
 */
export function createTilesReceivedEvent(player, tiles, fromPlayer, animation = {}) {
    return {
        type: "TILES_RECEIVED",
        player,
        fromPlayer,
        tiles,
        animation: {
            type: animation.type || "receive-tiles",
            duration: animation.duration || 400,
            easing: animation.easing || "Power2.easeOut",
            glow: animation.glow || {color: 0x1e90ff, alpha: 0.7},
            ...animation
        },
        timestamp: Date.now()
    };
}

/**
 * Event: DISCARD_CLAIMED
 * Emitted when a discard is claimed by another player
 */
export function createDiscardClaimedEvent(claimingPlayer, tile, claimType) {
    return {
        type: "DISCARD_CLAIMED",
        claimingPlayer,
        tile,
        claimType,  // "Pung", "Kong", "Quint", "Mahjong"
        timestamp: Date.now()
    };
}

/**
 * Event: TILES_EXPOSED
 * Emitted when a player exposes tiles (Pung, Kong, Quint)
 */
export function createTilesExposedEvent(player, exposureType, tiles, animation = {}) {
    return {
        type: "TILES_EXPOSED",
        player,
        exposureType,  // "PUNG", "KONG", "QUINT"
        tiles,
        animation: {
            type: animation.type || "expose-tiles",
            duration: animation.duration || 300,
            easing: animation.easing || "Power2.easeOut",
            effect: animation.effect || "highlight",
            ...animation
        },
        timestamp: Date.now()
    };
}

/**
 * Event: MAHJONG
 * Emitted when a player wins with Mahjong
 */
export function createMahjongEvent(winner, hand, animation = {}) {
    return {
        type: "MAHJONG",
        winner,
        hand,
        animation: {
            type: animation.type || "mahjong-win",
            duration: animation.duration || 2000,
            effect: animation.effect || "fireworks",
            ...animation
        },
        timestamp: Date.now()
    };
}

/**
 * Event: GAME_ENDED
 * Emitted when the game ends
 */
export function createGameEndedEvent(reason, winner, mahjong) {
    return {
        type: "GAME_ENDED",
        reason,  // "mahjong", "wall_game", "quit"
        winner,
        mahjong,
        timestamp: Date.now()
    };
}

/**
 * Event: MESSAGE
 * Emitted for informational or error messages
 */
export function createMessageEvent(text, type = "info") {
    return {
        type: "MESSAGE",
        text,
        messageType: type,  // "info", "error", "hint", "warning"
        timestamp: Date.now()
    };
}

/**
 * Event: UI_PROMPT
 * Emitted when GameController needs user input
 */
export function createUIPromptEvent(promptType, options, callback) {
    return {
        type: "UI_PROMPT",
        promptType,  // "CHARLESTON_PASS", "CHOOSE_DISCARD", "CLAIM_DISCARD", etc.
        options,
        callback,  // Function to call with result
        timestamp: Date.now()
    };
}
