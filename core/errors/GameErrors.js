/**
 * Base class for all game-specific errors
 */
export class GameError extends Error {
  constructor(message, code = "UNKNOWN", recoverable = false) {
    super(message);
    this.name = "GameError";
    this.code = code;
    this.recoverable = recoverable;
  }
}

/**
 * Thrown when game rule validation fails (e.g. invalid move, illegal hand)
 */
export class ValidationError extends GameError {
  constructor(message) {
    super(message, "VALIDATION_FAILED", false);
    this.name = "ValidationError";
  }
}

/**
 * Thrown when a rendering operation fails but game state might be intact
 */
export class RenderingError extends GameError {
  constructor(message) {
    super(message, "RENDERING_FAILED", true); // Can often fallback
    this.name = "RenderingError";
  }
}

/**
 * Thrown when a critical game state inconsistency is detected
 */
export class StateError extends GameError {
  constructor(message) {
    super(message, "STATE_ERROR", false);
    this.name = "StateError";
  }
}
