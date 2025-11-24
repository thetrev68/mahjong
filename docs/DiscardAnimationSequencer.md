# DiscardAnimationSequencer Specification

**Status:** 📋 Design Specification (Not Implemented)
**Priority:** High (Core gameplay animation)
**Platform:** Mobile (Phase 1), Desktop (Phase 2)
**Estimated Effort:** 1-2 days
**Created:** 2025-01-23

---

## Overview

The `DiscardAnimationSequencer` orchestrates tile discard animations during the main game loop, providing satisfying visual feedback for the most common player action in American Mahjong.

### Animation Goals
- **Feedback**: Clear confirmation that discard was successful
- **Clarity**: Show which tile was discarded
- **Speed**: Fast enough to not slow down gameplay (200-350ms)
- **Satisfaction**: Subtle "throw" feeling with bounce/settle physics

---

## User Experience

### Visual Flow
```
1. Player selects tile to discard
   ↓
2. Tile lifts slightly from hand (hover state)
   ↓
3. Player confirms discard (clicks button or double-tap)
   ↓
4. Tile animates from hand → discard pile:
   - Slides out with slight rotation
   - Arc trajectory (parabolic curve)
   - Lands in discard pile with bounce/settle
   ↓
5. Tile settles into position in discard pile grid
   ↓
6. Hand re-renders without discarded tile
   ↓
7. Hand auto-sorts (if setting enabled)
```

### Animation Variants

**Human Player Discard** (BOTTOM):
- Full animation with bounce
- Sound effect (tile click)
- 300ms duration

**AI Player Discard** (RIGHT/TOP/LEFT):
- Faster animation (200ms)
- No bounce (AI is "precise")
- Different exit angle based on player position

---

## Technical Specification

### Class Structure

```javascript
import { AnimationSequencer } from './AnimationSequencer.js';

export class DiscardAnimationSequencer extends AnimationSequencer {
    constructor(gameController, handRenderer, animationController, discardPile) {
        super(gameController, handRenderer, animationController);

        this.discardPile = discardPile; // Reference to DiscardPile component
        this.soundEnabled = true;
    }

    /**
     * Main entry point - animates tile discard
     * @param {Object} data - From GameController TILE_DISCARDED event
     * @param {number} data.player - Player index (0-3)
     * @param {Object} data.tile - TileData object
     * @param {number} data.tileIndex - Index in hand before discard
     * @param {Object} data.animation - Animation metadata
     */
    async animateDiscard(data) {
        const { player, tile, tileIndex, animation } = data;

        await this.executeSequence([
            () => this.prepareDiscard(player, tileIndex),
            () => this.animateTileToDiscard(player, tile, animation),
            () => this.settleTileInPile(tile),
            () => this.updateHandAfterDiscard(player, tileIndex)
        ]);
    }

    /**
     * Prepare tile for discard (visual highlight)
     */
    async prepareDiscard(player, tileIndex) {
        if (player !== 0) return; // Only for human player

        const tileElement = this.handRenderer.getTileElementByIndex(tileIndex);
        if (tileElement) {
            tileElement.classList.add('tile-discarding-prep');
            await this.delay(100); // Brief pause for visual feedback
        }
    }

    /**
     * Animate tile from hand to discard pile
     */
    async animateTileToDiscard(player, tile, animation) {
        // Get tile element position
        const tileElement = this.handRenderer.getTileElementByIndex(tile.index);
        if (!tileElement) {
            console.warn('Tile element not found for discard animation');
            return this.skipAnimation(tile);
        }

        const startPos = tileElement.getBoundingClientRect();
        const endPos = this.discardPile.getNextTilePosition();

        // Create clone for animation
        const tileClone = this.createDiscardTileClone(tileElement, tile);
        document.body.appendChild(tileClone);

        // Hide original tile
        tileElement.style.visibility = 'hidden';

        // Calculate trajectory
        const trajectory = this.calculateDiscardTrajectory(
            startPos,
            endPos,
            player,
            animation
        );

        // Animate clone
        await this.animateTileThrow(tileClone, trajectory);

        // Cleanup
        tileClone.remove();
    }

    /**
     * Calculate parabolic arc from hand to discard pile
     */
    calculateDiscardTrajectory(startPos, endPos, player, animation) {
        const isHuman = player === 0;

        // Calculate arc height based on distance
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const arcHeight = isHuman ? -80 : -40; // Human has higher arc

        // Control point for quadratic bezier
        const controlPoint = {
            x: startPos.x + dx * 0.5,
            y: startPos.y + dy * 0.5 + arcHeight
        };

        return {
            start: { x: startPos.x, y: startPos.y },
            control: controlPoint,
            end: { x: endPos.x, y: endPos.y },
            duration: animation?.duration || (isHuman ? 300 : 200),
            rotation: isHuman ? 360 : 180, // Human has full spin
            easing: animation?.easing || 'ease-out'
        };
    }

    /**
     * Animate tile along trajectory with CSS
     */
    async animateTileThrow(tileClone, trajectory) {
        // Set CSS custom properties
        tileClone.style.setProperty('--start-x', `${trajectory.start.x}px`);
        tileClone.style.setProperty('--start-y', `${trajectory.start.y}px`);
        tileClone.style.setProperty('--control-x', `${trajectory.control.x}px`);
        tileClone.style.setProperty('--control-y', `${trajectory.control.y}px`);
        tileClone.style.setProperty('--end-x', `${trajectory.end.x}px`);
        tileClone.style.setProperty('--end-y', `${trajectory.end.y}px`);
        tileClone.style.setProperty('--rotation', `${trajectory.rotation}deg`);
        tileClone.style.setProperty('--duration', `${trajectory.duration}ms`);

        tileClone.classList.add('tile-discarding');

        // Play sound effect
        if (this.soundEnabled) {
            this.playDiscardSound();
        }

        await this.delay(trajectory.duration);
    }

    /**
     * Settle tile into discard pile with bounce
     */
    async settleTileInPile(tile) {
        // Add tile to discard pile component
        const discardTileElement = this.discardPile.addTile(tile);

        // Apply bounce animation
        discardTileElement.classList.add('tile-settle-bounce');

        await this.delay(200); // Bounce duration

        // Remove animation class
        discardTileElement.classList.remove('tile-settle-bounce');
    }

    /**
     * Update hand renderer after discard
     */
    async updateHandAfterDiscard(player, tileIndex) {
        // Hand will be re-rendered via HAND_UPDATED event
        // This just ensures cleanup of any animation states
        const tileElement = this.handRenderer.getTileElementByIndex(tileIndex);
        if (tileElement) {
            tileElement.style.visibility = '';
            tileElement.classList.remove('tile-discarding-prep');
        }
    }

    /**
     * Create clone of tile for animation
     */
    createDiscardTileClone(originalElement, tile) {
        const clone = originalElement.cloneNode(true);
        clone.classList.add('tile-clone-animating');
        clone.style.position = 'fixed';
        clone.style.zIndex = '9999';

        // Copy computed styles
        const computedStyle = getComputedStyle(originalElement);
        clone.style.width = computedStyle.width;
        clone.style.height = computedStyle.height;

        return clone;
    }

    /**
     * Skip animation (instant discard)
     */
    skipAnimation(tile) {
        this.discardPile.addTile(tile);
    }

    /**
     * Play discard sound effect
     */
    playDiscardSound() {
        // TODO: Integrate with audio system
        // Play subtle "tile click" sound
        console.log('🔊 Discard sound');
    }

    /**
     * Handle claim interruption (tile is claimed mid-animation)
     */
    async handleClaimInterrupt(data) {
        // If tile is claimed while animating, change trajectory
        // to go to claiming player instead of discard pile

        if (!this.isRunning()) return;

        // Cancel current sequence
        this.cancel();

        // Re-route to claiming player
        await this.animateDiscardClaim(data);
    }

    /**
     * Animate discard being claimed by another player
     */
    async animateDiscardClaim(data) {
        const { tile, claimingPlayer, claimType } = data;

        // Get last tile position in discard pile
        const discardPos = this.discardPile.getLastTilePosition();

        // Get claiming player hand position
        const claimPos = this.getPlayerHandPosition(claimingPlayer);

        // Animate tile from discard to claiming player
        const trajectory = {
            start: discardPos,
            control: {
                x: (discardPos.x + claimPos.x) / 2,
                y: Math.min(discardPos.y, claimPos.y) - 60
            },
            end: claimPos,
            duration: 400,
            rotation: 180,
            easing: 'ease-in-out'
        };

        // Create tile element and animate
        const tileClone = this.createClaimTileClone(tile);
        await this.animateTileThrow(tileClone, trajectory);

        // Add to claiming player's hand
        this.handRenderer.addTileToHand(claimingPlayer, tile);
    }

    /**
     * Get player hand position for claim animation
     */
    getPlayerHandPosition(playerIndex) {
        const positions = {
            0: { x: 400, y: 650 },  // BOTTOM
            1: { x: 950, y: 360 },  // RIGHT
            2: { x: 400, y: 70 },   // TOP
            3: { x: 50, y: 360 }    // LEFT
        };
        return positions[playerIndex];
    }

    /**
     * Create tile clone for claim animation
     */
    createClaimTileClone(tile) {
        const clone = document.createElement('div');
        clone.className = 'tile tile-claim-animating';
        clone.dataset.suit = tile.suit;
        clone.dataset.rank = tile.rank;
        clone.style.position = 'fixed';
        clone.style.zIndex = '10000';
        return clone;
    }
}
```

---

## CSS Animations

### animations.css additions

```css
/* Discard preparation (lift) */
.tile-discarding-prep {
    animation: tile-discard-prep 100ms ease-out;
    transform: translateY(-8px);
}

@keyframes tile-discard-prep {
    from {
        transform: translateY(0);
    }
    to {
        transform: translateY(-8px);
    }
}

/* Discard throw animation */
.tile-discarding {
    animation: tile-discard-throw var(--duration, 300ms) var(--easing, ease-out) forwards;
}

@keyframes tile-discard-throw {
    0% {
        transform: translate(var(--start-x), var(--start-y)) rotate(0deg);
        opacity: 1;
    }
    50% {
        /* Bezier arc peak */
        transform: translate(var(--control-x), var(--control-y))
                   rotate(calc(var(--rotation, 360deg) * 0.5));
        opacity: 1;
    }
    100% {
        transform: translate(var(--end-x), var(--end-y))
                   rotate(var(--rotation, 360deg));
        opacity: 0.9;
    }
}

/* Settle bounce in discard pile */
.tile-settle-bounce {
    animation: tile-settle 200ms cubic-bezier(0.5, 1.5, 0.5, 1);
}

@keyframes tile-settle {
    0% {
        transform: scale(1.1) translateY(-5px);
    }
    50% {
        transform: scale(0.95) translateY(2px);
    }
    100% {
        transform: scale(1) translateY(0);
    }
}

/* Claim animation (discard → claiming player) */
.tile-claim-animating {
    animation: tile-claim-travel var(--duration, 400ms) ease-in-out forwards;
}

@keyframes tile-claim-travel {
    0% {
        transform: translate(var(--start-x), var(--start-y)) rotate(0deg) scale(1);
    }
    50% {
        transform: translate(var(--control-x), var(--control-y))
                   rotate(calc(var(--rotation, 180deg) * 0.5)) scale(1.1);
    }
    100% {
        transform: translate(var(--end-x), var(--end-y))
                   rotate(var(--rotation, 180deg)) scale(1);
    }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
    .tile-discarding,
    .tile-claim-animating {
        animation-duration: 50ms;
    }

    .tile-settle-bounce {
        animation: none;
    }
}
```

---

## Event Integration

### GameController Changes

```javascript
// In core/GameController.js - handleDiscard() method

async handleDiscard(tileIndex) {
    const currentPlayer = this.currentPlayerIndex;
    const tile = this.players[currentPlayer].hand.tiles[tileIndex];

    // Remove tile from hand
    this.players[currentPlayer].hand.removeTile(tileIndex);

    // Add to discard pile
    this.discardPile.push({
        tile,
        player: currentPlayer,
        turn: this.turnCount
    });

    // Emit discard event with animation metadata
    this.emit('TILE_DISCARDED', {
        type: 'TILE_DISCARDED',
        player: currentPlayer,
        tile,
        tileIndex,
        animation: {
            type: 'discard',
            duration: currentPlayer === 0 ? 300 : 200, // Human vs AI
            easing: 'ease-out',
            rotation: currentPlayer === 0 ? 360 : 180
        },
        timestamp: Date.now()
    });

    // Wait for animation
    await this.delay(currentPlayer === 0 ? 350 : 250);

    // Check for claims
    await this.queryClaimDiscard();
}
```

### MobileRenderer Integration

```javascript
// In mobile/MobileRenderer.js

import { DiscardAnimationSequencer } from './animations/DiscardAnimationSequencer.js';

class MobileRenderer {
    constructor(options) {
        // ...existing code...

        // Initialize discard sequencer
        this.discardSequencer = new DiscardAnimationSequencer(
            this.gameController,
            this.handRenderer,
            this.animationController,
            this.discardPile
        );
    }

    registerEventListeners() {
        // ...existing subscriptions...

        this.subscriptions.push(
            this.gameController.on('TILE_DISCARDED', (data) =>
                this.onTileDiscarded(data)
            )
        );

        this.subscriptions.push(
            this.gameController.on('DISCARD_CLAIMED', (data) =>
                this.onDiscardClaimed(data)
            )
        );
    }

    onTileDiscarded(data) {
        // Route to discard sequencer
        this.discardSequencer.animateDiscard(data);
    }

    onDiscardClaimed(data) {
        // Handle claim interruption
        this.discardSequencer.handleClaimInterrupt(data);
    }
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Single Tile Animation**
   - Only one tile animates at a time (turn-based game)
   - No performance concerns with simultaneous animations

2. **GPU Acceleration**
   - Use `transform` and `opacity` exclusively
   - Apply `will-change: transform` to animating tile
   - Remove after animation completes

3. **Clone Cleanup**
   - Remove tile clones immediately after animation
   - No memory leaks from orphaned DOM elements

4. **Smooth Bezier Curves**
   - CSS handles interpolation (no JS frame updates needed)
   - 60fps guaranteed on modern devices

### Performance Budget
- **Target:** 60fps throughout animation
- **Duration:** 200-350ms (fast gameplay feel)
- **Memory:** < 1MB for animation assets
- **CPU:** < 5% usage during animation

---

## Testing Strategy

### Unit Tests

```javascript
describe('DiscardAnimationSequencer', () => {
    test('calculates correct trajectory for human player', () => {
        const sequencer = new DiscardAnimationSequencer(...);
        const trajectory = sequencer.calculateDiscardTrajectory(
            { x: 400, y: 650 },
            { x: 640, y: 400 },
            0, // Human player
            {}
        );

        expect(trajectory.rotation).toBe(360); // Full spin for human
        expect(trajectory.duration).toBe(300);
        expect(trajectory.control.y).toBeLessThan(400); // Arc upward
    });

    test('calculates faster trajectory for AI', () => {
        const sequencer = new DiscardAnimationSequencer(...);
        const trajectory = sequencer.calculateDiscardTrajectory(
            { x: 950, y: 360 },
            { x: 640, y: 400 },
            1, // AI player
            {}
        );

        expect(trajectory.rotation).toBe(180); // Half spin for AI
        expect(trajectory.duration).toBe(200); // Faster
    });
});
```

### Integration Tests (Playwright)

```javascript
test('should animate tile discard correctly', async ({ page }) => {
    // Start game and advance to main loop
    await page.click('#new-game-btn');
    await page.waitForTimeout(5000); // Skip Charleston

    // Select and discard a tile
    const tile = page.locator('.hand-container .tile').first();
    await tile.click();
    await page.click('button:has-text("Discard")');

    // Wait for discard animation to start
    await page.waitForSelector('.tile-discarding', { timeout: 1000 });

    // Verify tile appears in discard pile
    await page.waitForFunction(() => {
        const discardedTiles = document.querySelectorAll('.discard-pile .tile');
        return discardedTiles.length > 0;
    }, { timeout: 2000 });

    // Verify discard pile has correct count
    const discardPileTiles = page.locator('.discard-pile .tile');
    await expect(discardPileTiles).toHaveCount(1);
});
```

---

## Accessibility

### Screen Reader Support
- Announce discard: "You discarded Red Dragon"
- Announce AI discard: "Player 2 discarded 3 Bamboo"

### Keyboard Support
- `Enter` on selected tile → Discard
- `Space` on selected tile → Discard

### Reduced Motion
- Instant discard (no arc animation)
- No rotation
- No bounce

---

## Future Enhancements

1. **Sound Effects**
   - Tile click sound (different per suit)
   - Bounce/settle sound
   - "Whoosh" for throw

2. **Visual Effects**
   - Particle trail during flight
   - Impact ripple on landing
   - Highlight last discarded tile

3. **Customization**
   - Discard arc height preference
   - Animation speed preference
   - Disable bounce option

---

## Implementation Checklist

- [ ] Create `DiscardAnimationSequencer.js` extending `AnimationSequencer`
- [ ] Add CSS animations for discard, bounce, and claim
- [ ] Update `GameController.handleDiscard()` to emit animation metadata
- [ ] Wire sequencer into `MobileRenderer`
- [ ] Implement claim interruption handling
- [ ] Add sound effect placeholders
- [ ] Write unit tests for trajectory calculation
- [ ] Write Playwright tests for discard flow
- [ ] Accessibility testing (screen reader, keyboard)
- [ ] Performance validation (60fps, smooth arcs)

---

## References

- [AnimationSequencer.js](../mobile/animations/AnimationSequencer.js) - Base class
- [CharlestonAnimationSequencer.js](../mobile/animations/CharlestonAnimationSequencer.js) - Similar pattern
- [DiscardPile.js](../mobile/components/DiscardPile.js) - Discard pile component
