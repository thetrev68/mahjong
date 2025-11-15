# Phase 4: Wire Mobile Renderer to GameController

## Overview

Mobile renderer infrastructure is already built (AnimationController, HandRenderer, components, CSS). Phase 4 wires this existing renderer to GameController, proving the architecture works across platforms.

**This is NOT building a mobile renderer - it's integrating the existing one.**

## Current State (After Phase 3.5)

- GameController is complete and pure logic
- PhaserAdapter is complete Phaser rendering
- Mobile renderer components exist but are disconnected
- gameLogicStub and legacy dependencies are eliminated
- Hand/TileSet are clean data structures

## Mobile Infrastructure Already Built

### Existing Files
- `mobile/main.js` - Entry point (partially complete)
- `mobile/renderers/HandRenderer.js` - Renders player hand
- `mobile/components/DiscardPile.js` - Shows discard pile
- `mobile/components/MobileTile.js` - Individual tile component
- `mobile/components/OpponentBar.js` - Shows opponent status
- `mobile/components/SettingsSheet.js` - Settings UI
- `mobile/components/InstallPrompt.js` - PWA install prompt
- `mobile/gestures/TouchHandler.js` - Touch input handling
- `mobile/animations/AnimationController.js` - Animation orchestration
- `mobile/styles/` - Complete CSS for all components

### What Needs to Happen

Mobile main.js needs to:
1. Create GameController (same way desktop does)
2. Create mobile renderer components
3. Subscribe to GameController events
4. Update mobile UI based on events
5. Wire user interactions back to GameController

## Architecture

```
GameController
    ↓ (events)
    ├─→ PhaserAdapter (Phaser/Desktop)
    │
    └─→ MobileRenderer (HTML/CSS/Mobile)
        ├─→ HandRenderer
        ├─→ DiscardPile
        ├─→ OpponentBar
        └─→ TouchHandler
```

## Tasks

### Task 4.1: Connect GameController to Mobile main.js

**Goal**: Create GameController instance in mobile context

**Current State**: mobile/main.js has skeleton structure but doesn't create GameController

**Actions**:
1. In mobile/main.js DOMContentLoaded handler:
   ```javascript
   // Create GameController
   gameController = new GameController();
   await gameController.init({
       sharedTable: null,  // Mobile creates its own data structures
       settings: {
           year: window.settingsManager.getCardYear(),
           difficulty: window.settingsManager.getDifficulty(),
           useBlankTiles: window.settingsManager.getUseBlankTiles(),
           skipCharleston: false
       }
   });
   ```
2. Verify GameController initializes without Phaser
3. Test: No errors on mobile/index.html load

**Output**: GameController running in mobile context

---

### Task 4.2: Wire Opponent Bars

**Goal**: Display opponent status during game

**Current State**: OpponentBar components exist but not connected

**Actions**:
1. Create 3 opponent bar elements (Right, Top, Left players)
2. Subscribe to GameController events:
   - STATE_CHANGED - update button availability
   - TILE_DRAWN - update tile count
   - TILE_DISCARDED - update discard display
   - TURN_CHANGED - highlight current player

3. Implement event handlers:
   ```javascript
   gameController.on("TURN_CHANGED", (data) => {
       const {currentPlayer} = data;
       opponentBars.forEach((bar, i) => {
           bar.setActive(i === currentPlayer - 1); // Adjust for player indexing
       });
   });

   gameController.on("TILE_DRAWN", (data) => {
       const {player, tile} = data;
       if (player !== PLAYER.BOTTOM) {
           opponentBars[player - 1].addTile(tile);
       }
   });
   ```
4. Test: Opponent bars update during game

**Output**: Opponent display working

---

### Task 4.3: Wire Hand Renderer for Human Player

**Goal**: Display and enable interaction with human player's hand

**Current State**: HandRenderer exists but not connected to GameController

**Actions**:
1. In mobile/main.js:
   ```javascript
   const handRenderer = new HandRenderer(
       document.getElementById("player-hand-container"),
       gameController,
       table  // or null, HandRenderer creates its own?
   );
   ```
2. Subscribe to hand-related events:
   - TILES_DEALT - render initial hand
   - TILE_DRAWN - add tile to hand
   - TILE_DISCARDED - remove from hand
   - TILES_EXPOSED - show exposed sets

3. Wire user interactions (via TouchHandler):
   - Tile tap → select tile
   - Tile drag → reorder tiles
   - Sort button → request sort

4. HandRenderer converts user actions to GameController callbacks:
   ```javascript
   onTileSelected(tile) {
       // This should trigger a callback in the current UI prompt
       // The prompt has a resolve() callback for user selection
   }
   ```

5. Test: Can see hand, select tiles, hand updates

**Output**: Hand rendering and selection working

---

### Task 4.4: Wire Discard Pile Display

**Goal**: Show discarded tiles in central display

**Current State**: DiscardPile component exists

**Actions**:
1. Subscribe to TILE_DISCARDED events
2. Add tile to discard pile display
3. Show discard pile in easy-to-read format (maybe last 5 tiles?)
4. Test: Discards appear and update

**Output**: Discard pile display working

---

### Task 4.5: Implement Charleston Phase UI

**Goal**: First interactive phase in mobile

**Current Implementation Details**:
- Charleston requires selecting 3 tiles
- "Pass" button confirms selection
- Need to prevent invalid selections (jokers, blanks during pass)

**Actions**:
1. GameController emits UI_PROMPT for Charleston
2. Mobile receives prompt, identifies it as "select_tiles" with count=3
3. DialogManager equivalent in mobile:
   ```javascript
   gameController.on("UI_PROMPT", async (data) => {
       if (data.type === "select_tiles") {
           const {minTiles, maxTiles} = data;

           // Hand is now in selection mode
           handRenderer.setSelectionMode({
               minTiles,
               maxTiles,
               validation: 'charleston'  // Prevents joker/blank selection
           });

           // User selects tiles
           // Hand renderer calls resolve callback when done
           const selectedTiles = await new Promise(resolve => {
               handRenderer.onSelectionComplete = resolve;
           });

           // Return to GameController
           return selectedTiles;
       }
   });
   ```
4. Test: Can play through Charleston phase on mobile

**Output**: Charleston phase playable on mobile

---

### Task 4.6: Implement Main Loop Interaction

**Goal**: Play basic main loop on mobile (discard, claim, expose)

**Actions**:
1. Handle LOOP_CHOOSE_DISCARD state:
   - Highlight hand, require selection of 1 tile
   - "Discard" button confirms

2. Handle LOOP_QUERY_CLAIM_DISCARD state:
   - Show dialog: "Claim discard? Yes/No"
   - Buttons for response

3. Handle LOOP_EXPOSE_TILES state:
   - Show dialog: "Expose tiles? Yes/No"
   - Or if yes, select which tiles to expose
   - Validate selection (must contain discard tile)

4. Implement via UI_PROMPT handler similar to Charleston

5. Test: Play multiple turns on mobile

**Output**: Main loop playable on mobile

---

### Task 4.7: Wire Audio (Optional)

**Goal**: Play same audio as desktop during events

**Actions**:
1. Create simple audio player manager for mobile
2. Subscribe to audio events (from PhaserAdapter pattern)
3. Play sounds for:
   - Tile pickup
   - Tile discard
   - Tile drop
   - Game complete

**Note**: This is optional but nice-to-have for parity with desktop

**Output**: Audio feedback on mobile (optional)

---

### Task 4.8: Document Mobile Renderer Integration

**Goal**: Explain how to integrate any renderer with GameController

**Create**: `MOBILE_RENDERER_INTEGRATION.md`

**Contents**:
1. How GameController events work
2. How to subscribe to events
3. How to convert UI prompts to mobile dialogs
4. How to wire user input back to GameController
5. Key event examples with mobile implementations
6. Architecture pattern for new renderers

**Output**: Documentation for future renderers

---

### Task 4.9: Test Mobile with Same GameController as Desktop

**Goal**: Prove both use identical GameController

**Test Plan**:
1. Start desktop (Phaser) - play one game
2. Open mobile (HTML/CSS) - play same game with same seed/settings
3. Both should:
   - Deal same tiles
   - Progress through same phases
   - Require same user inputs
   - End game same way

4. Try different settings:
   - Different difficulty
   - Different card year
   - With/without blank tiles

**Output**: Confidence that GameController is truly platform-agnostic

---

## Phase 4 Completion Criteria

- [ ] GameController runs in mobile context
- [ ] Opponent bars display and update
- [ ] Hand renderer displays and allows interaction
- [ ] Discard pile displays
- [ ] Charleston phase is playable on mobile
- [ ] Main loop is playable on mobile
- [ ] User interactions wire back to GameController
- [ ] GameController events drive all mobile UI
- [ ] Mobile and desktop use identical GameController
- [ ] No GameController modifications needed for mobile
- [ ] Documentation complete
- [ ] No console errors on mobile
- [ ] Lint and build pass

## Success Indicator

When you can:

1. **Desktop**: Start Phaser app → play full game with animations and audio
2. **Mobile**: Start HTML app → play same full game without Phaser
3. **Both**: Use identical GameController code, make same decisions, reach same end state

**Then you have proven Option C works and the codebase is ready for multiple renderers.**

## Future Enhancements (Post-Phase 4)

Once wiring is complete:
1. Add mobile-specific touches (swipe for select/discard)
2. Add mobile-specific styling (responsive design)
3. Add proper PWA setup for app installation
4. Add offline support / service workers
5. Build as actual mobile app (React Native, Flutter, etc.)

All without touching GameController.

## Notes

- This is the final proof that the refactor works
- After this, GameController is truly platform-agnostic
- The codebase is ready for production mobile development
- Mobile development can proceed independently from desktop
- Any future renderer (web, native, terminal, AI) can use same GameController
