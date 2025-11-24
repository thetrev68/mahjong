# DealingAnimationSequencer Specification

**Status:** 📋 Design Specification (Not Implemented)
**Priority:** High (Next animation after Charleston)
**Platform:** Mobile (Phase 1), Desktop (Phase 2)
**Estimated Effort:** 2-3 days
**Created:** 2025-01-23

---

## Overview

The `DealingAnimationSequencer` will orchestrate the initial tile dealing animation at game start, creating a visually engaging experience that mimics the physical dealing process in American Mahjong.

### Animation Goals
- **Educational**: Help new players understand dealing mechanics
- **Excitement**: Build anticipation for the game start
- **Clarity**: Show tile distribution clearly across all 4 players
- **Performance**: Maintain 60fps even with 152 tiles being dealt

---

## User Experience

### Visual Flow
```
1. Wall appears (all 152 tiles face-down in organized rows)
   ↓
2. Tiles deal in sequence (staggered timing):
   - Player 1 (BOTTOM): 4 tiles → slide from wall to hand
   - Player 2 (RIGHT): 4 tiles → slide from wall to hand
   - Player 3 (TOP): 4 tiles → slide from wall to hand
   - Player 4 (LEFT): 4 tiles → slide from wall to hand
   ↓ (repeat 3 more times for 16 tiles each)

3. Charleston tile (1 per player):
   - Deal 1 final tile to each player
   ↓

4. Final count: Each player has 13 tiles
   ↓

5. East player draws 14th tile (with blue glow)
   ↓

6. Tiles flip face-up for human player (BOTTOM)
   AI tiles remain face-down
```

### Timing Philosophy
- **Fast mode** (default): 2-3 seconds total
- **Slow mode** (first game/tutorial): 8-10 seconds total
- **Skip mode** (preference): Instant deal

---

## Technical Specification

### Class Structure

```javascript
import { AnimationSequencer } from './AnimationSequencer.js';

export class DealingAnimationSequencer extends AnimationSequencer {
    constructor(gameController, handRenderer, animationController) {
        super(gameController, handRenderer, animationController);

        // Dealing-specific configuration
        this.dealSpeed = 'fast'; // 'fast', 'slow', 'skip'
        this.wallPosition = { x: 640, y: 360 }; // Center of screen
        this.staggerDelay = 50; // ms between each tile
    }

    /**
     * Main entry point - animates full dealing sequence
     * @param {Object} dealSequence - From GameController TILES_DEALT event
     * @param {Array} dealSequence.rounds - Array of dealing rounds
     * @param {string} dealSequence.speed - 'fast' | 'slow' | 'skip'
     */
    async animateDeal(dealSequence) {
        if (dealSequence.speed === 'skip') {
            return this.skipDeal(dealSequence);
        }

        this.dealSpeed = dealSequence.speed;

        await this.executeSequence([
            () => this.showWall(),
            () => this.dealInitialRounds(dealSequence.rounds.slice(0, 4)),
            () => this.dealCharlestonTile(dealSequence.rounds[4]),
            () => this.dealEastStarterTile(dealSequence.rounds[5]),
            () => this.flipHumanTiles(),
            () => this.hideWall()
        ]);
    }

    /**
     * Show wall of tiles in center (all face-down)
     */
    async showWall() {
        const wallContainer = document.getElementById('wall-container');
        wallContainer.classList.remove('hidden');
        wallContainer.classList.add('wall-appear');

        await this.delay(this.dealSpeed === 'slow' ? 500 : 200);
    }

    /**
     * Deal tiles in rounds (4 tiles to each player, 4 rounds)
     * @param {Array} rounds - First 4 dealing rounds
     */
    async dealInitialRounds(rounds) {
        for (const round of rounds) {
            await this.dealRound(round);
        }
    }

    /**
     * Deal one round (4 tiles per player)
     * @param {Object} round
     * @param {Array} round.deals - [{player, tiles: [4 tiles]}]
     */
    async dealRound(round) {
        for (const deal of round.deals) {
            await this.dealTilesToPlayer(deal.player, deal.tiles);
        }
    }

    /**
     * Animate tiles from wall to player hand
     * @param {number} playerIndex - 0-3 (BOTTOM, RIGHT, TOP, LEFT)
     * @param {Array} tiles - Tiles to deal
     */
    async dealTilesToPlayer(playerIndex, tiles) {
        const playerPosition = this.getPlayerHandPosition(playerIndex);
        const dealDelay = this.dealSpeed === 'slow' ? 100 : this.staggerDelay;

        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const tileElement = this.createDealingTile(tile);

            // Calculate trajectory
            const trajectory = this.calculateDealPath(
                this.wallPosition,
                playerPosition,
                i // offset for stacking
            );

            // Animate
            await this.animateTileSlide(tileElement, trajectory);

            // Add to hand renderer
            this.handRenderer.addTileToHand(playerIndex, tile);

            if (i < tiles.length - 1) {
                await this.delay(dealDelay);
            }
        }
    }

    /**
     * Deal Charleston tile (1 per player)
     */
    async dealCharlestonTile(round) {
        // Similar to dealRound but with visual distinction
        for (const deal of round.deals) {
            await this.dealTilesToPlayer(deal.player, deal.tiles);
        }
        await this.delay(this.dealSpeed === 'slow' ? 300 : 100);
    }

    /**
     * Deal East player's 14th tile (with glow)
     */
    async dealEastStarterTile(deal) {
        await this.dealTilesToPlayer(deal.player, deal.tiles);

        // Apply glow to East's last tile
        const lastTile = this.handRenderer.getLastTileElement(deal.player);
        this.animationController.applyReceivedTileGlow(lastTile);
    }

    /**
     * Flip human player tiles face-up
     */
    async flipHumanTiles() {
        const humanTiles = this.handRenderer.getTileElements(0); // Player 0 = BOTTOM

        for (let i = 0; i < humanTiles.length; i++) {
            const tile = humanTiles[i];
            tile.classList.add('tile-flip-reveal');

            if (this.dealSpeed === 'slow') {
                await this.delay(50); // Stagger flip
            }
        }

        if (this.dealSpeed !== 'slow') {
            await this.delay(300); // Let all flips complete
        }
    }

    /**
     * Hide wall after dealing
     */
    async hideWall() {
        const wallContainer = document.getElementById('wall-container');
        wallContainer.classList.add('wall-disappear');
        await this.delay(300);
        wallContainer.classList.add('hidden');
    }

    /**
     * Skip animation - instant deal
     */
    skipDeal(dealSequence) {
        // Instantly populate all hands without animation
        dealSequence.rounds.forEach(round => {
            round.deals.forEach(deal => {
                this.handRenderer.addTilesToHand(deal.player, deal.tiles);
            });
        });
    }

    /**
     * Calculate bezier curve path from wall to player
     */
    calculateDealPath(wallPos, playerPos, tileOffset) {
        // Quadratic bezier for smooth arc
        const controlPoint = {
            x: (wallPos.x + playerPos.x) / 2,
            y: wallPos.y - 100 // Arc upward
        };

        return {
            start: wallPos,
            control: controlPoint,
            end: {
                x: playerPos.x + (tileOffset * 45), // Tile width + gap
                y: playerPos.y
            },
            duration: this.dealSpeed === 'slow' ? 600 : 300
        };
    }

    /**
     * Get player hand position coordinates
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
     * Animate tile along bezier path
     */
    async animateTileSlide(tileElement, trajectory) {
        const wall = document.getElementById('wall-container');
        wall.appendChild(tileElement);

        // Set CSS variables for animation
        tileElement.style.setProperty('--start-x', `${trajectory.start.x}px`);
        tileElement.style.setProperty('--start-y', `${trajectory.start.y}px`);
        tileElement.style.setProperty('--control-x', `${trajectory.control.x}px`);
        tileElement.style.setProperty('--control-y', `${trajectory.control.y}px`);
        tileElement.style.setProperty('--end-x', `${trajectory.end.x}px`);
        tileElement.style.setProperty('--end-y', `${trajectory.end.y}px`);

        tileElement.classList.add('tile-dealing');

        await this.delay(trajectory.duration);

        tileElement.remove(); // Remove from wall, tile now in hand
    }

    /**
     * Create temporary tile element for dealing animation
     */
    createDealingTile(tile) {
        const tileEl = document.createElement('div');
        tileEl.className = 'tile tile-dealing-temp';
        tileEl.dataset.suit = tile.suit;
        tileEl.dataset.rank = tile.rank;
        return tileEl;
    }
}
```

---

## CSS Animations

### animations.css additions

```css
/* Wall appearance */
.wall-appear {
    animation: wall-fade-in 300ms ease-out;
}

@keyframes wall-fade-in {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* Wall disappearance */
.wall-disappear {
    animation: wall-fade-out 300ms ease-in forwards;
}

@keyframes wall-fade-out {
    from {
        opacity: 1;
        transform: scale(1);
    }
    to {
        opacity: 0;
        transform: scale(0.95);
    }
}

/* Tile dealing animation (bezier curve) */
.tile-dealing {
    position: absolute;
    animation: tile-deal-slide var(--deal-duration, 300ms) ease-out forwards;
}

@keyframes tile-deal-slide {
    0% {
        transform: translate(var(--start-x), var(--start-y));
        opacity: 0.8;
    }
    50% {
        /* Bezier control point */
        transform: translate(var(--control-x), var(--control-y));
        opacity: 1;
    }
    100% {
        transform: translate(var(--end-x), var(--end-y));
        opacity: 1;
    }
}

/* Tile flip reveal (for human player) */
.tile-flip-reveal {
    animation: tile-flip 400ms ease-out;
}

@keyframes tile-flip {
    0% {
        transform: rotateY(180deg);
        filter: brightness(0.5);
    }
    50% {
        transform: rotateY(90deg) scale(1.05);
    }
    100% {
        transform: rotateY(0deg) scale(1);
        filter: brightness(1);
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .tile-dealing {
        animation-duration: 50ms;
    }

    .tile-flip-reveal {
        animation: none;
        transform: rotateY(0deg);
    }
}
```

---

## Event Integration

### GameController Changes

```javascript
// In core/GameController.js - dealTiles() method

async dealTiles() {
    this.setState(STATE.DEAL);

    // Build dealing sequence
    const dealSequence = {
        speed: this.settings.dealSpeed, // 'fast', 'slow', 'skip'
        rounds: []
    };

    // 4 rounds of 4 tiles each
    for (let round = 0; round < 4; round++) {
        const roundDeals = [];
        for (let player = 0; player < 4; player++) {
            const tiles = this.wallTiles.splice(0, 4);
            roundDeals.push({ player, tiles });
        }
        dealSequence.rounds.push({ deals: roundDeals });
    }

    // Charleston tile (1 per player)
    const charlestonRound = [];
    for (let player = 0; player < 4; player++) {
        const tile = this.wallTiles.splice(0, 1);
        charlestonRound.push({ player, tiles: tile });
    }
    dealSequence.rounds.push({ deals: charlestonRound });

    // East player starter tile
    const eastPlayer = this.getEastPlayerIndex();
    const starterTile = this.wallTiles.splice(0, 1);
    dealSequence.rounds.push({
        deals: [{ player: eastPlayer, tiles: starterTile }]
    });

    // Emit event with full sequence
    this.emit('TILES_DEALT', {
        type: 'TILES_DEALT',
        sequence: dealSequence,
        timestamp: Date.now()
    });

    // Wait for animation to complete (or skip)
    if (dealSequence.speed !== 'skip') {
        await this.delay(this.calculateDealDuration(dealSequence));
    }
}

calculateDealDuration(dealSequence) {
    if (dealSequence.speed === 'skip') return 0;
    if (dealSequence.speed === 'slow') return 10000; // 10 seconds
    return 3000; // 3 seconds (fast)
}
```

---

## Performance Considerations

### Optimization Strategies

1. **GPU Acceleration**
   - Use `transform` and `opacity` only (no layout thrashing)
   - Apply `will-change: transform` to dealing tiles
   - Remove `will-change` after animation completes

2. **Staggered Rendering**
   - Don't render all 152 tiles at once
   - Create tiles on-demand as they're dealt
   - Remove temporary dealing tiles after they reach destination

3. **RequestAnimationFrame**
   - Use RAF for smooth bezier curve interpolation
   - Batch DOM updates per frame

4. **Reduced Motion**
   - Skip bezier curves, use linear slides
   - Reduce animation duration to 50ms
   - Skip flip animations entirely

### Performance Budget
- **Target:** 60fps (16.67ms per frame)
- **Max simultaneous animations:** 4 tiles (one per player)
- **Memory:** < 5MB for all dealing assets
- **Total duration:** 2-10 seconds (configurable)

---

## Testing Strategy

### Unit Tests

```javascript
describe('DealingAnimationSequencer', () => {
    test('calculates correct bezier path', () => {
        const sequencer = new DealingAnimationSequencer(...);
        const path = sequencer.calculateDealPath(
            {x: 640, y: 360},
            {x: 400, y: 650},
            0
        );

        expect(path.control.y).toBeLessThan(path.start.y); // Arc upward
        expect(path.end.x).toBe(400);
    });

    test('respects deal speed setting', async () => {
        const sequencer = new DealingAnimationSequencer(...);
        sequencer.dealSpeed = 'fast';

        const start = Date.now();
        await sequencer.dealTilesToPlayer(0, [tile1, tile2, tile3, tile4]);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(500); // Fast mode
    });
});
```

### Integration Tests (Playwright)

```javascript
test('should deal all tiles in correct order', async ({ page }) => {
    await page.click('#new-game-btn');

    // Wait for dealing to start
    await page.waitForSelector('.wall-container:not(.hidden)');

    // Verify tiles are being dealt
    await page.waitForSelector('.tile-dealing', { timeout: 2000 });

    // Wait for dealing to complete
    await page.waitForFunction(() => {
        const handTiles = document.querySelectorAll('.hand-container .tile');
        return handTiles.length === 13; // Human player should have 13 tiles
    }, { timeout: 15000 });

    // Verify human tiles are face-up
    const humanTiles = page.locator('.hand-container .tile');
    await expect(humanTiles).toHaveCount(13);
});
```

---

## User Settings

### Settings Integration

Add to [mobile/components/SettingsSheet.js](../mobile/components/SettingsSheet.js):

```html
<div class="setting-item">
    <label for="deal-speed">Dealing Speed</label>
    <select id="deal-speed">
        <option value="fast">Fast (3 seconds)</option>
        <option value="slow">Slow (10 seconds)</option>
        <option value="skip">Skip Animation</option>
    </select>
</div>
```

Default: `fast` for returning players, `slow` for first game

---

## Future Enhancements

1. **Sound Effects**
   - Tile sliding sound (subtle whoosh)
   - Tile flip sound (card flip)
   - Wall appearance sound (shuffle)

2. **Visual Polish**
   - Particle effects when wall appears
   - Subtle glow on tiles in flight
   - Shadow effects for depth

3. **Customization**
   - Custom dealing patterns (clockwise vs counter-clockwise)
   - Wall position preferences
   - Tile flight speed curves

4. **Accessibility**
   - Screen reader announcements ("Dealing tiles to player 1")
   - High contrast mode for tile visibility
   - Keyboard shortcut to skip dealing

---

## Implementation Checklist

- [ ] Create `DealingAnimationSequencer.js` extending `AnimationSequencer`
- [ ] Add wall container to [mobile/index.html](../mobile/index.html)
- [ ] Implement CSS animations for dealing, wall, and flip
- [ ] Update `GameController.dealTiles()` to emit detailed sequence
- [ ] Wire sequencer into `MobileRenderer`
- [ ] Add deal speed setting to SettingsSheet
- [ ] Write unit tests for path calculation and timing
- [ ] Write Playwright tests for full dealing flow
- [ ] Performance profiling (60fps validation)
- [ ] Accessibility testing (screen reader, reduced motion)

---

## References

- [AnimationSequencer.js](../mobile/animations/AnimationSequencer.js) - Base class
- [CharlestonAnimationSequencer.js](../mobile/animations/CharlestonAnimationSequencer.js) - Similar pattern
- [ANIMATION_ARCHITECTURE_REFACTOR.md](../ANIMATION_ARCHITECTURE_REFACTOR.md) - Architecture overview
