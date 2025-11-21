import { getElementCenterPosition } from "../utils/positionUtils.js";

const TILE_ANIMATION_CLASSES = [
    "tile-drawing",
    "tile-discarding",
    "tile-claiming-pulse",
    "tile-claiming-move",
    "tile-exposing"
];

const TURN_ANIMATION_CLASSES = ["turn-starting", "turn-ending"];
const HAND_SORT_CLASS = "hand-sorting";
const INVALID_ACTION_CLASS = "invalid-action";

const DEFAULT_PULSE_DURATION = 500;
const HAND_SORT_DURATION = 400;
const TURN_START_DURATION = 600;
const TURN_END_DURATION = 300;
const INVALID_ACTION_DURATION = 500;
const EXPOSURE_STAGGER = 50;

const MIN_FRAME_MS = 16;

const toPx = (value, fallback = 0) => {
    const numeric = typeof value === "number" && !Number.isNaN(value) ? value : fallback;
    return `${numeric}px`;
};

const toElementArray = elements => {
    if (!elements) {
        return [];
    }
    if (Array.isArray(elements)) {
        return elements.filter(Boolean);
    }
    return Array.from(elements).filter(Boolean);
};

/**
 * Calculate distance and direction between two points
 * @param {{x: number, y: number}} start
 * @param {{x: number, y: number}} end
 * @returns {{dx: number, dy: number, distance: number}}
 */
const calculateMovement = (start, end) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return { dx, dy, distance };
};

/**
 * AnimationController - Manages CSS-based animations for mobile
 *
 * Responsibilities:
 * - Animate tile draw from wall to hand
 * - Animate tile discard from hand to center
 * - Animate tile claim from center to hand
 * - Animate turn indicator transitions
 * - Use CSS transitions or Web Animations API (no heavy libraries)
 */
export class AnimationController {
    /**
     * @param {Object} options - Configuration options
     * @param {number} options.duration - Default animation duration (ms)
     * @param {string} options.easing - Default easing function
     */
    constructor(options = {}) {
        this.duration = typeof options.duration === "number" ? options.duration : 350; // Slightly longer for smoothness
        this.easing = options.easing || "var(--ease-smooth)"; // Use custom smooth easing
        this.prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false;

        this._elementTimers = new WeakMap();
    }

    /**
     * Animate a tile being drawn from wall to hand
     * @param {HTMLElement} tileElement - The tile DOM element
     * @param {Object} startPos - {x, y} start position (optional, will be calculated if not provided)
     * @param {Object} endPos - {x, y} end position (optional, will be calculated if not provided)
     * @returns {Promise} Resolves when animation completes
     */
    animateTileDraw(tileElement, startPos = null, endPos = null) {
        return new Promise(resolve => {
            if (!tileElement) {
                resolve();
                return;
            }

            this._resetElementAnimation(tileElement, TILE_ANIMATION_CLASSES);

            // Calculate positions if not provided
            const actualEndPos = endPos || getElementCenterPosition(tileElement);
            const actualStartPos = startPos || {
                x: actualEndPos.x,
                y: actualEndPos.y - 200 // Start from above
            };

            // Calculate movement for smooth animation
            const movement = calculateMovement(actualStartPos, actualEndPos);
            
            const cssVars = {
                "--start-x": toPx(actualStartPos.x),
                "--start-y": toPx(actualStartPos.y),
                "--end-x": toPx(actualEndPos.x),
                "--end-y": toPx(actualEndPos.y),
                "--movement-dx": toPx(movement.dx),
                "--movement-dy": toPx(movement.dy),
                "--tile-draw-duration": `${this.duration}ms`,
                "--tile-draw-easing": this.easing
            };

            this._setCssVariables(tileElement, cssVars);
            this._applyAnimationClass(tileElement, "tile-drawing");

            this._scheduleTimer(tileElement, this.duration, () => {
                tileElement.classList.remove("tile-drawing");
                this._clearCssVariables(tileElement, Object.keys(cssVars));
                resolve();
            });
        });
    }

    /**
     * Animate a tile being discarded from hand to discard pile
     * @param {HTMLElement} tileElement - The tile DOM element
     * @param {Object} targetPos - {x, y} target position in discard pile (optional, will use current position)
     * @returns {Promise} Resolves when animation completes
     */
    animateTileDiscard(tileElement, targetPos = null) {
        return new Promise(resolve => {
            if (!tileElement) {
                resolve();
                return;
            }

            this._resetElementAnimation(tileElement, TILE_ANIMATION_CLASSES);

            // Calculate positions
            const actualStartPos = getElementCenterPosition(tileElement);
            const actualTargetPos = targetPos || {
                x: actualStartPos.x + 50, // Move slightly to the right by default
                y: actualStartPos.y + 100 // Move down towards discard area
            };

            // Calculate movement for smooth animation
            const movement = calculateMovement(actualStartPos, actualTargetPos);
            
            const discardDuration = this.duration + 100;
            const cssVars = {
                "--start-x": toPx(actualStartPos.x),
                "--start-y": toPx(actualStartPos.y),
                "--target-x": toPx(actualTargetPos.x),
                "--target-y": toPx(actualTargetPos.y),
                "--movement-dx": toPx(movement.dx),
                "--movement-dy": toPx(movement.dy),
                "--tile-discard-duration": `${discardDuration}ms`,
                "--tile-discard-easing": "ease-in"
            };

            this._setCssVariables(tileElement, cssVars);
            this._applyAnimationClass(tileElement, "tile-discarding");

            this._scheduleTimer(tileElement, discardDuration, () => {
                tileElement.classList.remove("tile-discarding");
                this._clearCssVariables(tileElement, Object.keys(cssVars));
                resolve();
            });
        });
    }

    /**
     * Animate a tile being claimed from discard pile to hand
     * @param {HTMLElement} tileElement - The tile DOM element
     * @param {number} _sourcePlayer - Player who discarded (0-3)
     * @param {Object} targetPos - {x, y} target position in hand (optional, will calculate from container)
     * @param {HTMLElement} targetContainer - The container element for target position calculation
     * @returns {Promise} Resolves when animation completes
     */
    animateTileClaim(tileElement, _sourcePlayer = 0, targetPos = null, targetContainer = null) {
        return new Promise(resolve => {
            if (!tileElement) {
                resolve();
                return;
            }

            this._resetElementAnimation(tileElement, TILE_ANIMATION_CLASSES);

            // Calculate positions
            const currentPos = getElementCenterPosition(tileElement);
            const actualTargetPos = targetPos || (targetContainer ? getElementCenterPosition(targetContainer) : {
                x: currentPos.x,
                y: currentPos.y - 150 // Default move up
            });

            // Calculate movement for smooth animation
            const movement = calculateMovement(currentPos, actualTargetPos);
            
            const cssVars = {
                "--start-x": toPx(currentPos.x),
                "--start-y": toPx(currentPos.y),
                "--target-x": toPx(actualTargetPos.x),
                "--target-y": toPx(actualTargetPos.y),
                "--movement-dx": toPx(movement.dx),
                "--movement-dy": toPx(movement.dy),
                "--tile-claim-duration": `${this.duration}ms`
            };

            this._setCssVariables(tileElement, cssVars);
            this._applyAnimationClass(tileElement, "tile-claiming-pulse");

            this._scheduleTimer(tileElement, DEFAULT_PULSE_DURATION, () => {
                tileElement.classList.remove("tile-claiming-pulse");
                this._applyAnimationClass(tileElement, "tile-claiming-move");

                this._scheduleTimer(tileElement, this.duration, () => {
                    tileElement.classList.remove("tile-claiming-move");
                    this._clearCssVariables(tileElement, Object.keys(cssVars));
                    resolve();
                });
            });
        });
    }

    /**
     * Animate turn indicator appearing on player
     * @param {HTMLElement} playerElement - Player/opponent bar element
     * @returns {Promise} Resolves when animation completes
     */
    animateTurnStart(playerElement) {
        return this._runSimpleAnimation(playerElement, "turn-starting", TURN_START_DURATION);
    }

    /**
     * Animate turn indicator disappearing from player
     * @param {HTMLElement} playerElement - Player/opponent bar element
     * @returns {Promise} Resolves when animation completes
     */
    animateTurnEnd(playerElement) {
        return this._runSimpleAnimation(playerElement, "turn-ending", TURN_END_DURATION);
    }

    /**
     * Animate hand sorting (tiles rearranging)
     * @param {HTMLElement} handContainer - Hand container element
     * @returns {Promise} Resolves when animation completes
     */
    animateHandSort(handContainer) {
        return this._runSimpleAnimation(handContainer, HAND_SORT_CLASS, HAND_SORT_DURATION);
    }

    /**
     * Animate exposure creation (tiles moving to exposure area)
     * @param {HTMLElement[]} tileElements - Array of tile elements
     * @param {Object} targetPos - {x, y} target position
     * @returns {Promise} Resolves when animation completes
     */
    animateExposure(tileElements, targetPos = {}) {
        const tiles = toElementArray(tileElements);

        return new Promise(resolve => {
            if (!tiles.length) {
                resolve();
                return;
            }

            tiles.forEach((tile, index) => {
                this._resetElementAnimation(tile, TILE_ANIMATION_CLASSES);
                const cssVars = {
                    "--target-x": toPx(targetPos.x, 0),
                    "--target-y": toPx(targetPos.y, 0)
                };
                this._setCssVariables(tile, cssVars);
                tile.style.animationDelay = this.prefersReducedMotion ? "0ms" : `${index * EXPOSURE_STAGGER}ms`;
                this._applyAnimationClass(tile, "tile-exposing");
            });

            const totalDuration = this.duration + (tiles.length * EXPOSURE_STAGGER);
            const anchor = tiles[0];

            this._scheduleTimer(anchor, totalDuration, () => {
                tiles.forEach(tile => {
                    tile.classList.remove("tile-exposing");
                    tile.style.animationDelay = "";
                    this._clearCssVariables(tile, ["--target-x", "--target-y"]);
                });
                resolve();
            });
        });
    }

    /**
     * Shake animation for invalid action
     * @param {HTMLElement} element - Element to shake
     * @returns {Promise} Resolves when animation completes
     */
    animateInvalidAction(element) {
        return this._runSimpleAnimation(element, INVALID_ACTION_CLASS, INVALID_ACTION_DURATION);
    }

    /**
     * Runs a single CSS animation class and resolves when finished.
     * @param {HTMLElement} element
     * @param {string} className
     * @param {number} duration
     * @returns {Promise}
     * @private
     */
    _runSimpleAnimation(element, className, duration) {
        return new Promise(resolve => {
            if (!element) {
                resolve();
                return;
            }

            const classesToReset = [];

            if (TURN_ANIMATION_CLASSES.includes(className)) {
                classesToReset.push(...TURN_ANIMATION_CLASSES);
            } else if (className === HAND_SORT_CLASS) {
                classesToReset.push(HAND_SORT_CLASS);
            } else if (className === INVALID_ACTION_CLASS) {
                classesToReset.push(INVALID_ACTION_CLASS);
            }

            this._resetElementAnimation(element, classesToReset);
            this._applyAnimationClass(element, className);

            this._scheduleTimer(element, duration, () => {
                element.classList.remove(className);
                resolve();
            });
        });
    }

    /**
     * Forcefully removes prior animation classes and timers.
     * @param {HTMLElement} element
     * @param {string[]} classes
     * @private
     */
    _resetElementAnimation(element, classes = []) {
        if (!element) {
            return;
        }

        this._cancelTimers(element);
        classes.forEach(className => element.classList.remove(className));
    }

    /**
     * Sets CSS custom properties on an element.
     * @param {HTMLElement} element
     * @param {Object} variables
     * @private
     */
    _setCssVariables(element, variables = {}) {
        if (!element || !element.style) {
            return;
        }
        Object.entries(variables).forEach(([name, value]) => {
            if (value === undefined || value === null) {
                element.style.removeProperty(name);
            } else {
                element.style.setProperty(name, value);
            }
        });
    }

    /**
     * Removes CSS custom properties from an element.
     * @param {HTMLElement} element
     * @param {string[]} names
     * @private
     */
    _clearCssVariables(element, names = []) {
        if (!element || !element.style) {
            return;
        }
        names.forEach(name => element.style.removeProperty(name));
    }

    /**
     * Re-triggers a CSS animation class by forcing reflow.
     * @param {HTMLElement} element
     * @param {string} className
     * @private
     */
    _applyAnimationClass(element, className) {
        if (!element) {
            return;
        }
        element.classList.remove(className);
        // Force a reflow so the animation restarts even if the class was already present
         
        element.offsetWidth;
        element.classList.add(className);
    }

    /**
     * Schedule a timer tied to a specific element so it can be cancelled/reset safely.
     * @param {HTMLElement} element
     * @param {number} duration
     * @param {Function} callback
     * @private
     */
    _scheduleTimer(element, duration, callback) {
        const effectiveDuration = this.prefersReducedMotion ? Math.min(duration, MIN_FRAME_MS) : duration;
        const timerId = setTimeout(() => {
            this._deregisterTimer(element, timerId);
            callback();
        }, effectiveDuration);

        this._registerTimer(element, timerId);
        return timerId;
    }

    /**
     * Register a timer handle for later cleanup.
     * @param {HTMLElement} element
     * @param {number} timerId
     * @private
     */
    _registerTimer(element, timerId) {
        if (!element) {
            return;
        }
        let timers = this._elementTimers.get(element);
        if (!timers) {
            timers = new Set();
            this._elementTimers.set(element, timers);
        }
        timers.add(timerId);
    }

    /**
     * Remove timer handle after completion.
     * @param {HTMLElement} element
     * @param {number} timerId
     * @private
     */
    _deregisterTimer(element, timerId) {
        if (!element) {
            return;
        }
        const timers = this._elementTimers.get(element);
        if (!timers) {
            return;
        }
        timers.delete(timerId);
        if (timers.size === 0) {
            this._elementTimers.delete(element);
        }
    }

    /**
     * Clears all pending timers for an element.
     * @param {HTMLElement} element
     * @private
     */
    _cancelTimers(element) {
        if (!element) {
            return;
        }
        const timers = this._elementTimers.get(element);
        if (!timers) {
            return;
        }
        timers.forEach(timerId => clearTimeout(timerId));
        this._elementTimers.delete(element);
    }
}
