# Home Page Tile Pile Implementation Plan

## 🎯 Objective

Implement a visually appealing disorganized pile of 152 wall tiles on the home page that smoothly animates into an organized pile when "Start Game" is clicked, then transitions seamlessly into the existing gameplay system.

## 🏗️ Architecture Overview

### New Class: `HomePageTileManager`

**File**: `homePageTileManager.js`

**Purpose**: Manages tile display and animations on the home page before gameplay begins.

**Key Properties**:

- `scene` - Phaser scene reference
- `wall` - Reference to existing Wall class
- `tileArray` - Array of 152 Tile objects for home page display
- `animationState` - Current animation state (idle, scattered, gathering, stacking, standardizing, complete)
- `isAnimating` - Boolean animation flag
- `onAnimationComplete` - Callback for animation completion

**Key Methods**:

#### `constructor(scene, wall)`

- Receives Phaser scene and wall reference
- Initializes tile management system
- Sets up animation state tracking

#### `createScatteredTiles()`

- Creates 152 Tile objects with random positioning
- Random positions within bounds (50px-1100px x, 100px-600px y)
- Random angles (-90° to +90°) for "poured out" effect
- Random scale variations (0.8 to 1.0) for visual depth
- Z-depth variations (1-10) for layered appearance
- All tiles show back.png sprite face-down at scale 0.6 (same as wall)
- Sets tiles to non-interactive state for home page only
- Memory-efficient object creation to prevent leaks

#### `generateRandomPosition(tileIndex)`

- Calculates random x,y coordinates within bounds
- Ensures minimum spacing (60px) to prevent overlap
- Considers tile scale for collision detection
- Returns `{x, y, scale, angle}` object

#### `animateToPileAndStartGame()`

- Main animation sequence coordinator
- Single phase: Animate all tiles directly to organized stack position (2000ms, ease-out cubic)
- Uses existing Wall.showWallBack() positioning logic
- Calls `gameLogic.start()` after completion
- Implements 60fps performance optimization and staggered wave timing
- Includes error handling with fallback to immediate game start

#### `animateTilesToStack()`

- Single animation method that moves all tiles to organized stack positions
- Uses Wall.showWallBack() positioning algorithm (200, 200) starting point
- Wave-based animation (8 tiles per wave, 100ms delay) for 60fps performance
- All tiles animate to 0-degree angle and 0.6 scale
- Promise-based completion tracking with error recovery

#### `transitionToWallSystem()`

- Handoff method to Wall class
- Calls `wall.receiveOrganizedTilesFromHomePage(tileArray)`
- Validates tile count (must be exactly 152)
- Ensures tiles are standardized for game compatibility
- Cleans up home page tile objects
- Returns promise that resolves when transition complete

#### `cleanup()`

- Destroys all home page tile objects and tweens
- Removes event listeners
- Clears references to prevent memory leaks
- Resets animation state

## 🔧 Modified Classes

### GameScene.js

#### New Properties:

```javascript
this.homePageTileManager = null;
```

#### Modified Methods:

**`preload()`**:

- No changes needed (assets already loaded)

**`create()`**:

- Initialize HomePageTileManager after wall creation:

```javascript
// After this.gTable.create() and this.gGameLogic.init()
this.homePageTileManager = new HomePageTileManager(this, this.gTable.wall);
this.homePageTileManager.createScatteredTiles();
```

**Start Button Handler**:

```javascript
startButton.addEventListener("click", () => {
  this.homePageTileManager.animateToPileAndStartGame();
});
```

### Wall.js (in gameObjects.js)

#### New Methods:

**`receiveOrganizedTilesFromHomePage(homePageTiles)`**:

- Receives array of Tile objects from HomePageTileManager
- Validates tile count (must be exactly 152)
- Clears existing tile array if not in active game
- Replaces tileArray with home page tiles
- Maintains all existing Wall functionality
- Returns promise that resolves when integration complete

#### Modified Methods:

**`create(skipTileCreation = false)`**:

- Added optional parameter `skipTileCreation`
- If true, skips automatic tile creation
- Allows Wall to receive tiles from external source
- Default behavior unchanged for backward compatibility

**`showWallBack()`**:

- No changes needed
- Works with tiles received from HomePageTileManager

### GameLogic.js

#### Modified Methods:

**`start()`**:

- No changes needed - animation completes before calling start()
- Maintains all existing functionality

## 📊 Animation Sequence Details

### Phase 1: Scatter Display (0ms - on page load)

- **Duration**: Immediate
- **Effect**: All 152 tiles randomly positioned
- **Properties**:
  - Random X: 50px to 1100px
  - Random Y: 100px to 600px
  - Random angle: -90° to +90°
  - Random scale: 0.8 to 1.0
  - Back sprite visible (face down)
  - Depth: 1-10 for layering

### Phase 2: Stack Animation (2000ms)

- **Duration**: 2000ms
- **Easing**: Phaser.Math.Easing.Cubic.Out
- **Effect**: All tiles animate directly to organized stack positions
- **Target**: Uses Wall.showWallBack() positioning (200, 200) starting point
- **Wave Timing**: 8 tiles per wave, 100ms delay between waves
- **Properties**: All tiles rotate to 0° and scale to 0.6 during animation
- **Performance**: Optimized for 60fps on desktop devices

### Phase 3: Game Handoff (0ms)

- **Duration**: 0ms
- **Effect**: Immediate transition to existing game initialization
- **Action**: Call `gameLogic.start()` with organized tiles
- **Cleanup**: Remove home page tile objects (handled by Wall system)
- **Performance**: No frame drops during handoff

## 🎨 Visual Specifications

### Random Scattering Algorithm

```javascript
generateRandomPosition(index) {
    const minDistance = 60;
    const maxScaleVariation = 0.2; // 0.8 to 1.0 scale range
    const maxAngleVariation = 180; // ±90 degrees

    let attempts = 0;
    let x, y, scale, angle;

    do {
        x = Phaser.Math.Between(50, 1100);
        y = Phaser.Math.Between(100, 600);
        scale = 1.0 - (Math.random() * maxScaleVariation); // 0.8 to 1.0
        angle = (Math.random() - 0.5) * maxAngleVariation; // -90 to +90 degrees
        attempts++;
    } while (attempts < 50 && this.isPositionTooClose(x, y, minDistance));

    return { x, y, scale, angle };
}
```

### Stack Positioning Algorithm

```javascript
calculateStackPosition(tileIndex) {
    // Use same logic as Wall.showWallBack()
    const WALL_SCALE = 0.6;
    const SPRITE_WIDTH = 32; // from constants
    const SPRITE_HEIGHT = 44; // from constants
    const TILE_GAP = 2; // from constants

    let offsetX = 200;
    let offsetY = 200;

    // Calculate position for this tile in the grid
    for (let i = 0; i <= tileIndex; i++) {
        if (i === tileIndex) break; // This is our target position

        offsetX += (SPRITE_WIDTH * WALL_SCALE) + TILE_GAP;
        if (offsetX > 800) {
            offsetX = 200;
            offsetY += (SPRITE_HEIGHT * WALL_SCALE) + TILE_GAP;
        }
    }

    return {
        x: offsetX,
        y: offsetY,
        angle: 0, // Standard orientation
        scale: WALL_SCALE // 0.6 standard game scale
    };
}
```

### Wave Animation Algorithm

```javascript
animateTilesToStack() {
    const promises = [];
    const tilesPerWave = 8;
    const waveDelay = 100; // 100ms between waves

    for (let waveIndex = 0; waveIndex < Math.ceil(152 / tilesPerWave); waveIndex++) {
        const waveStartIndex = waveIndex * tilesPerWave;
        const waveEndIndex = Math.min(waveStartIndex + tilesPerWave, 152);

        setTimeout(() => {
            for (let i = waveStartIndex; i < waveEndIndex; i++) {
                const tile = this.tileArray[i];
                const targetPos = this.calculateStackPosition(i);
                const promise = this.animateSingleTile(tile, targetPos.x, targetPos.y, targetPos.angle, 2000);
                promises.push(promise);
            }
        }, waveIndex * waveDelay);
    }

    return Promise.all(promises);
}
```

### Tile Properties on Home Page

- **Sprite**: "back" (face down)
- **Scale**: 0.8 to 1.0 (random for depth effect)
- **Angle**: -90° to +90° (random for scattered look)
- **Depth**: 1 to 10 (random for layering)
- **Alpha**: 0.95 (slight transparency)
- **Interactive**: false (not clickable)

### Animation Timing Constants

```javascript
const ANIMATION_CONFIG = {
  DURATION: 2000, // 2 second total animation
  TILES_PER_WAVE: 8,
  WAVE_DELAY: 100, // 100ms between waves
  TOTAL_WAVES: Math.ceil(152 / 8), // 19 waves total
  FRAME_RATE_TARGET: 60, // Ensure 60fps performance
};
```

## 🔄 Integration Flow

### Current Flow (Before Changes):

```
GameScene.create() → Wall.create() → [Grid Layout] → Start Game →
gameLogic.start() → gameLogic.deal() → table.deal() → Wall.showWallBack() → Deal
```

### Existing Animation Location:

The current wall animation happens in **`gameObjects.js` → `Wall.showWallBack()`** (lines 469-489):

**Sequence Flow:**

1. **GameScene.js:67-68**: `startButton.addEventListener("click", () => { this.gGameLogic.start(); })`
2. **gameLogic.js:232**: `start()` method
3. **gameLogic.js:248**: Calls `this.deal()`
4. **gameLogic.js:266**: Calls `this.table.deal()`
5. **gameObjects.js:469**: **`Wall.showWallBack()`** - The actual wall tile animation
   - Animates 152 tiles to grid positions (200, 200) starting point
   - Uses `tile.animate()` for each tile with WALL_SCALE (0.6)
   - Grid layout: 20x8 with proper spacing

**Key Point**: Our home page animation will complete before `gameLogic.start()` is called, ensuring seamless integration with the existing `Wall.showWallBack()` animation.

### New Flow (With Changes):

```
GameScene.create() → HomePageTileManager.createScatteredTiles() →
[Random Layout] → Start Game → animateToPileAndStartGame() →
transitionToWallSystem() → Wall.receiveOrganizedTilesFromHomePage() →
Wall.showWallBack() → gameLogic.start() → Deal
```

**Key Integration Point**: The home page animation completes before calling the existing `gameLogic.start()`, ensuring seamless handoff to the established game flow.

## 📝 Implementation Steps

### Phase 1: Core Infrastructure (Steps 1-3)

1. **Create HomePageTileManager class** (`homePageTileManager.js`)
   - Basic constructor and tile creation
   - Random positioning algorithm with collision detection
   - Animation state management

2. **Modify GameScene.js**
   - Add HomePageTileManager initialization
   - Update start button handler to trigger animation

3. **Test basic functionality**
   - Verify 152 tiles appear scattered on home page
   - Test start button triggers animation sequence

### Phase 2: Animation System (Steps 4-6)

4. **Implement stack animation**
   - Single animation directly to organized positions
   - Uses existing Wall.showWallBack() positioning logic
   - Wave-based timing for smooth performance

5. **Add error handling**
   - Timeout protection with fallback to immediate game start
   - Promise-based completion tracking
   - Tile count validation

6. **Test animation performance**
   - Verify smooth 2-second animation
   - Confirm 60fps performance on desktop devices
   - Validate all 152 tiles animate correctly

### Phase 3: Wall Integration (Steps 7-8)

7. **Modify Wall.js**
   - Add `receiveOrganizedTilesFromHomePage()` method
   - Add `skipTileCreation` parameter to `create()`
   - Ensure seamless handoff to existing dealing system

8. **Test complete integration**
   - Verify tiles transfer correctly to Wall system
   - Test game start timing and dealing
   - Confirm no memory leaks or tile loss

### Phase 4: User Testing (Steps 9-10)

9. **Polish visual effects**
   - Add depth layering and shadows
   - Test animation timing and feel
   - Optimize for smooth user experience

10. **User testing and validation**
    - Test across different desktop browsers
    - Verify all 152 tiles account for in gameplay
    - Test edge cases (rapid clicking, browser refresh)
    - Validate performance on various hardware

## 🎯 Success Criteria

### Functional Requirements:

- ✅ All 152 tiles visible on home page in scattered pattern
- ✅ Smooth 2-second animation when "Start Game" clicked
- ✅ Seamless transition to organized gameplay
- ✅ No performance impact on game functionality
- ✅ Maintains existing game start timing
- ✅ Proper cleanup of home page resources

### Visual Requirements:

- ✅ Natural "poured out" appearance with random angles
- ✅ Smooth, non-jarring animation transitions
- ✅ Proper depth layering for visual appeal
- ✅ Consistent with existing game aesthetic

### Technical Requirements:

- ✅ No memory leaks from tile objects
- ✅ Proper error handling with fallback to immediate game start
- ✅ Backward compatibility with existing code
- ✅ Maintainable and well-documented code
- ✅ Follows existing code patterns and conventions

## 🔧 Technical Considerations

### Performance Optimization:

- Wave-based animation prevents frame drops with 152 tiles
- Staggered timing ensures 60fps performance
- Reuse existing Tile.animate() method where possible

### Memory Management:

- Proper cleanup of Phaser objects in `cleanup()` method
- Destroy tweens and clear references to prevent leaks
- Remove event listeners during transition

### Error Handling:

- Animation timeout with fallback to immediate game start
- Tile count validation (must be exactly 152)
- Invalid state detection and recovery
- Graceful degradation if animation fails

## 📚 File Dependencies

### New Files:

- `homePageTileManager.js` - Main implementation class

### Modified Files:

- `GameScene.js` - Integration with home page tile system
- `gameObjects.js` - Wall class enhancements
- `gameLogic.js` - Timing coordination

### Asset Dependencies:

- `assets/back.png` - Already exists, used for tile backs
- `assets/tiles.png` - Already exists, standard tile assets

### No New Assets Required

The implementation uses existing tile assets and follows established patterns in the codebase for maximum compatibility and minimal disruption to existing functionality.
