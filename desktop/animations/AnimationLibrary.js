/**
 * AnimationLibrary - Centralized, reusable animation functions for Phaser
 *
 * All animations:
 * - Take animation data from GameController events
 * - Use Phaser tweens for smooth visuals
 * - Return Promises that resolve when complete
 * - Can be chained or awaited
 *
 * Used by PhaserAdapter to render all visual feedback
 */

/**
 * Animate a tile sliding from one position to another
 * Used for dealing, drawing from wall, or moving between positions
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite to animate
 * @param {Object} fromPos - Starting position {x, y}
 * @param {Object} toPos - Ending position {x, y}
 * @param {number} duration - Animation duration in milliseconds
 * @param {string} easing - Phaser easing function name (e.g., "Quad.easeOut")
 * @param {Function} onComplete - Optional callback when animation completes
 * @returns {Promise} Resolves when animation completes
 */
export function animateTileSlide(sprite, fromPos, toPos, duration = 400, easing = "Quad.easeOut", onComplete = null) {
    if (!sprite) return Promise.resolve();

    sprite.setPosition(fromPos.x, fromPos.y);

    return new Promise((resolve) => {
        const scene = sprite.scene;
        scene.tweens.add({
            targets: sprite,
            x: toPos.x,
            y: toPos.y,
            duration,
            ease: easing,
            onComplete: () => {
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}

/**
 * Animate a tile being discarded (slide + rotation)
 * Shows visual feedback of tile moving to discard pile
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
 * @param {Object} fromPos - Starting position
 * @param {Object} toPos - Ending position (discard pile)
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateTileDiscard(sprite, fromPos, toPos, duration = 300, onComplete = null) {
    if (!sprite) return Promise.resolve();

    sprite.setPosition(fromPos.x, fromPos.y);
    sprite.setRotation(0);

    return new Promise((resolve) => {
        const scene = sprite.scene;
        scene.tweens.add({
            targets: sprite,
            x: toPos.x,
            y: toPos.y,
            rotation: Math.PI / 4,  // 45 degree rotation for discarded effect
            duration,
            ease: "Power2.easeInOut",
            onComplete: () => {
                sprite.setRotation(0);  // Reset rotation
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}

/**
 * Animate tiles being passed during Charleston or courtesy phases
 *
 * @param {Phaser.Physics.Arcade.Sprite[]} sprites - Array of tile sprites
 * @param {Object} fromPos - Starting position
 * @param {Object} toPos - Ending position
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateTilePass(sprites, fromPos, toPos, duration = 400, onComplete = null) {
    if (!sprites || sprites.length === 0) return Promise.resolve();

    const validSprites = sprites.filter(s => s);
    if (validSprites.length === 0) return Promise.resolve();

    // Position all tiles at starting position
    validSprites.forEach(sprite => {
        sprite.setPosition(fromPos.x, fromPos.y);
    });

    return new Promise((resolve) => {
        const scene = validSprites[0].scene;
        scene.tweens.add({
            targets: validSprites,
            x: toPos.x,
            y: toPos.y,
            duration,
            ease: "Quad.easeInOut",
            onComplete: () => {
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}

/**
 * Animate a tile receiving (glow effect when player receives tiles)
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateTileReceive(sprite, duration = 200, onComplete = null) {
    if (!sprite) return Promise.resolve();

    const originalAlpha = sprite.alpha;

    return new Promise((resolve) => {
        const scene = sprite.scene;
        scene.tweens.add({
            targets: sprite,
            alpha: {from: 0.5, to: originalAlpha},
            duration,
            ease: "Quad.easeOut",
            yoyo: false,
            onComplete: () => {
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}

/**
 * Animate tiles moving to exposure area
 *
 * @param {Phaser.Physics.Arcade.Sprite[]} sprites - Array of tile sprites
 * @param {Object} exposurePos - Position where exposure tiles should appear
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateExposure(sprites, exposurePos, duration = 300, onComplete = null) {
    if (!sprites || sprites.length === 0) return Promise.resolve();

    const validSprites = sprites.filter(s => s);
    if (validSprites.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
        const scene = validSprites[0].scene;

        // Spread tiles in exposure area formation
        scene.tweens.add({
            targets: validSprites,
            x: (target, index) => exposurePos.x + (index * 40),
            y: exposurePos.y,
            duration,
            ease: "Quad.easeOut",
            onComplete: () => {
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}

/**
 * Apply a glow effect to a tile sprite
 * Used to highlight claimed tiles or important tiles
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
 * @param {number} color - Glow color (e.g., 0x1e3a8a for blue)
 * @param {number} duration - Duration of glow in ms
 * @param {number} alpha - Glow alpha intensity
 * @returns {Object} Tween object for later cancellation
 */
export function applyGlowEffect(sprite, color = 0x1e3a8a, duration = 600, alpha = 0.7) {
    if (!sprite) return null;

    const scene = sprite.scene;

    return scene.tweens.add({
        targets: sprite,
        glowColor: color,
        glowAlpha: {from: 0, to: alpha},
        duration,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1  // Continuous glow until removed
    });
}

/**
 * Remove glow effect from a tile
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
 * @param {Object} tween - Tween object from applyGlowEffect
 */
export function removeGlowEffect(sprite, tween) {
    if (!sprite) return;

    if (tween) {
        tween.stop();
    }

    // Reset sprite properties
    sprite.clearTint();
}

/**
 * Flash a tile (brief highlight)
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
 * @param {number} color - Flash color
 * @param {number} duration - Flash duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function flashTile(sprite, color = 0xffffff, duration = 150, onComplete = null) {
    if (!sprite) return Promise.resolve();

    sprite.setTint(color);

    return new Promise((resolve) => {
        const scene = sprite.scene;
        setTimeout(() => {
            sprite.clearTint();
            if (onComplete) onComplete();
            resolve();
        }, duration);
    });
}

/**
 * Animate tiles moving to a position to form a group/set
 * Used for organizing exposures or hand formations
 *
 * @param {Phaser.Physics.Arcade.Sprite[]} sprites - Array of tiles
 * @param {Object} centerPos - Center position of formation
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateTilesIntoFormation(sprites, centerPos, duration = 400, onComplete = null) {
    if (!sprites || sprites.length === 0) return Promise.resolve();

    const validSprites = sprites.filter(s => s);
    if (validSprites.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
        const firstSprite = validSprites[0];
        const count = validSprites.length;
        const spacing = 45;

        validSprites.forEach((sprite, index) => {
            const offset = (index - count / 2) * spacing;
            firstSprite.scene.tweens.add({
                targets: sprite,
                x: centerPos.x + offset,
                y: centerPos.y,
                duration,
                ease: "Back.easeOut"
            });
        });

        // Resolve after animation completes
        firstSprite.scene.time.delayedCall(duration, () => {
            if (onComplete) onComplete();
            resolve();
        });
    });
}

/**
 * Animate tile highlight when selected
 * Raises tile up when clicked
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
 * @param {Object} toPos - Position to raise to
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateTileSelect(sprite, toPos, duration = 150, onComplete = null) {
    if (!sprite) return Promise.resolve();

    return new Promise((resolve) => {
        const scene = sprite.scene;
        scene.tweens.add({
            targets: sprite,
            y: toPos.y,
            duration,
            ease: "Quad.easeOut",
            onComplete: () => {
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}

/**
 * Animate tile deselect when deselected
 * Lowers tile back down
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
 * @param {Object} toPos - Position to lower to
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateTileDeselect(sprite, toPos, duration = 150, onComplete = null) {
    if (!sprite) return Promise.resolve();

    return new Promise((resolve) => {
        const scene = sprite.scene;
        scene.tweens.add({
            targets: sprite,
            y: toPos.y,
            duration,
            ease: "Quad.easeOut",
            onComplete: () => {
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}

/**
 * Show claim animation feedback (brief highlight/zoom)
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Tile sprite
 * @param {number} duration - Duration in ms
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateClaimFeedback(sprite, duration = 300, onComplete = null) {
    if (!sprite) return Promise.resolve();

    const originalScale = sprite.scale;

    return new Promise((resolve) => {
        const scene = sprite.scene;
        scene.tweens.add({
            targets: sprite,
            scaleX: originalScale * 1.1,
            scaleY: originalScale * 1.1,
            duration: duration / 2,
            ease: "Quad.easeOut",
            yoyo: true,
            onComplete: () => {
                sprite.setScale(originalScale);
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}

/**
 * Generic tween for any sprite property
 *
 * @param {Phaser.Physics.Arcade.Sprite} sprite - Sprite to animate
 * @param {Object} props - Properties to animate (e.g., {x: 100, alpha: 0.5})
 * @param {number} duration - Duration in ms
 * @param {string} easing - Easing function name
 * @param {Function} onComplete - Optional callback
 * @returns {Promise}
 */
export function animateGeneric(sprite, props, duration = 400, easing = "Quad.easeOut", onComplete = null) {
    if (!sprite) return Promise.resolve();

    return new Promise((resolve) => {
        const scene = sprite.scene;
        scene.tweens.add({
            targets: sprite,
            ...props,
            duration,
            ease: easing,
            onComplete: () => {
                if (onComplete) onComplete();
                resolve();
            }
        });
    });
}
