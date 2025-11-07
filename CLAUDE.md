# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

American Mahjong game built with Phaser.IO and modern JavaScript (ES6 modules). Features 4-player gameplay with intelligent AI opponents, authentic American Mahjong rules including Charleston phases, courtesy passes, and exposures.

## Development Commands

```bash
# Development
npm run dev          # Start Vite dev server (usually http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run knip         # Find unused files/exports/dependencies
```

## Architecture

### Core Game Loop State Machine

The game follows a strict state machine defined in `constants.js` STATE enum:
1. **INIT** → **START** → **DEAL** (Initial setup and tile distribution)
2. **CHARLESTON1** → **CHARLESTON_QUERY** → **CHARLESTON2** (Tile passing phase)
3. **COURTESY_QUERY** → **COURTESY** → **COURTESY_COMPLETE** (Optional tile exchange)
4. **LOOP_PICK_FROM_WALL** → **LOOP_CHOOSE_DISCARD** → **LOOP_QUERY_CLAIM_DISCARD** → **LOOP_EXPOSE_TILES** (Main game loop)
5. **END** (Game completion)

All game state transitions are managed by `GameLogic` class methods that correspond to these states.

### Key Components and Data Flow

```
GameLogic (gameLogic.js)
    ├─> Controls game state machine and turn flow
    ├─> Calls GameAI for computer player decisions
    ├─> Updates Table/Hand/Player objects
    └─> Delegates to Card for hand validation

GameAI (gameAI.js)
    ├─> chooseDiscard() - Evaluates which tile to discard
    ├─> claimDiscard() - Decides whether to claim discarded tiles
    ├─> charlestonPass() - Selects tiles to pass during Charleston
    ├─> courtesyVote() - Votes on courtesy pass
    ├─> exchangeTilesForJokers() - Optimizes joker swaps
    └─> Uses Card.rankHand() to evaluate hand strength

Card (card/card.js)
    ├─> validateHand() - Checks if hand matches winning patterns
    ├─> rankHand() - Scores hand based on proximity to winning
    ├─> matchComponents() - Breaks hand into valid component groups
    └─> Loads year-specific patterns from card/YYYY/ directories

Table (gameObjects_table.js)
    └─> Manages 4 players, wall, discard pile, turn order

Hand (gameObjects_hand.js)
    └─> Manages player's 13-14 tiles, exposures, sorting, UI interactions

Player (gameObjects_player.js)
    └─> Represents individual player state
```

### Game Object Hierarchy

- **Table**: Container for entire game state
  - **Player** (x4): Bottom (human), Right, Top, Left (AI opponents)
    - **Hand**: Manages tiles and exposures
      - **Tile** (x13-14): Individual tile sprites
    - **TileSet**: Groups of exposed tiles (Pung/Kong/Quint)
  - **Wall**: 152-tile pool (144 drawable + 8 dead wall)
  - **Discard**: Pile of discarded tiles

### Hand Validation System

The `card/` directory contains the mahjong pattern validation engine:

- **card.js**: Core validation and ranking logic
- **YYYY/**: Year-specific pattern definitions (2017, 2018, 2019, 2020, 2025)
  - Each year has category-specific files: handsSinglesPairs.js, handsConsecutive.js, handsLikeNumbers.js, hands2468.js, hands13579.js, handsWindsDragons.js, handsQuints.js, hands369.js (2025 only)
  - Patterns define valid 14-tile combinations using components (Pair, Pung, Kong, Quint, Run)

When adding new patterns or years:
1. Create new directory under `card/YYYY/`
2. Import pattern categories in `card/cardYYYY.js`
3. Update `card/card.js` init() to load the new year

### AI Decision Making

AI uses a ranking system to evaluate tiles and hands:

1. **getTileRecommendations()**: Ranks all tiles in hand by "keep value"
   - Evaluates which tiles are needed for potential winning patterns
   - Considers jokers, exposures, and hand components

2. **rankHand()**: Scores hand based on proximity to winning
   - Returns ranked array of possible winning hands
   - Used by AI to choose optimal discards and claims

3. **charlestonPass()**: Strategically selects tiles to pass
   - Passes least valuable tiles (bottom-ranked)
   - Avoids passing jokers

## Important Implementation Details

### Debugging

Toggle debug output via `gdebug` flag in [utils.js:14](utils.js#L14):
```javascript
export const gdebug = 0; // Set to 1 to enable debug messages
```

### Training Mode

Enable via Settings → Training Mode checkbox. Allows:
- Selecting specific starting hands
- Choosing tile count (1-14)
- Skipping Charleston phase

Controlled by `gameLogic.js` methods: `enableTrainingForm()`, `disableTrainingForm()`, `getTrainingInfo()`

### Phaser Integration

- **main.js**: Initializes Phaser game with GameScene
- **GameScene.js**: Phaser scene containing the game logic instance
- Game uses Phaser's sprite system for tile rendering and drag-and-drop

### Constants

All game enums and magic numbers are in [constants.js](constants.js):
- `STATE`: Game state machine states
- `SUIT`, `WIND`, `DRAGON`: Tile types
- `PLAYER`: Player positions (BOTTOM=0, RIGHT=1, TOP=2, LEFT=3)
- `SPRITE_WIDTH`, `SPRITE_HEIGHT`, `TILE_GAP`: Layout dimensions

### Tile Representation

Tiles have two representations:
1. **Sprite representation**: Phaser sprite objects with visual properties
2. **Logical representation**: `{suit, rank, index}` objects for game logic
   - `index` is unique identifier (0-151) for each physical tile

### Entry Points

- `index.html`: Main HTML with UI structure (buttons, textareas, settings overlay)
- `main.js`: Creates Phaser game instance
- Vite config: Sets base path to `/mahjong/` for GitHub Pages deployment

## Code Style

- ES6 modules with `import`/`export`
- Semicolons required (enforced by ESLint)
- Double quotes for strings
- Use `const`/`let`, no `var`
- Strict equality `===` required

Run `npm run lint` before committing to catch issues.
