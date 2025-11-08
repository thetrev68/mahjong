# Mahjong Game Project Overview

## Purpose
American Mahjong game built with Phaser.IO and modern JavaScript (ES6 modules). Features 4-player gameplay with intelligent AI opponents, authentic American Mahjong rules including Charleston phases, courtesy passes, and exposures.

## Tech Stack
- **Framework:** Phaser.IO (game engine)
- **Language:** TypeScript/JavaScript (ES6 modules)
- **Build Tool:** Vite
- **Testing:** Playwright (e2e tests)
- **Linting:** ESLint
- **Styling:** CSS (custom styles for UI)

## Project Structure
```
src/
├── main.js              # Phaser game initialization
├── GameScene.js         # Main game scene
├── gameLogic.js         # Game state machine & flow
├── gameAI.js            # AI opponent logic
├── gameObjects.js       # Tile, Wall, Discard classes
├── gameObjects_hand.js  # Hand management
├── gameObjects_table.js # Table & player management
├── gameObjects_player.js # Player state
├── settings.js          # Settings management
├── card/                # Hand validation system
│   ├── card.js         # Core validation
│   └── YYYY/           # Year-specific patterns (2017-2020, 2025)
├── constants.js         # Game enums & constants
├── utils.js            # Utility functions
├── styles.css          # Styling
├── index.html          # UI structure
└── homePageTileManager.js

## Key Architectural Pattern
Game state machine with states defined in `constants.js`:
- INIT → START → DEAL
- CHARLESTON1 → CHARLESTON_QUERY → CHARLESTON2
- COURTESY_QUERY → COURTESY → COURTESY_COMPLETE
- LOOP_PICK_FROM_WALL → LOOP_CHOOSE_DISCARD → LOOP_QUERY_CLAIM_DISCARD → LOOP_EXPOSE_TILES
- END

GameLogic class manages transitions between states. Each state has corresponding methods.

## Blank Tiles Feature Status
**Current Progress:** Sections 1-6 complete
- ✅ Section 1: Constants updated
- ✅ Section 2: Tile creation
- ✅ Section 3: Wall tile counts
- ✅ Section 4: Settings page
- ✅ Section 5: Swap UI button
- ✅ Section 6: Blank swap functionality
- ⏳ Section 7: Game state & turn management (IN PROGRESS)
