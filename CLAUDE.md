# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

American Mahjong game with **multi-platform support**: Desktop (Phaser.js) and Mobile (Progressive Web App). Features 4-player gameplay with intelligent AI opponents, authentic American Mahjong rules including Charleston phases, courtesy passes, and exposures.

**Architecture**: Event-driven with platform-agnostic core logic and platform-specific adapters/renderers.

## Development Commands

```bash
# Development
npm run dev          # Start Vite dev server (http://localhost:5173)
                     # Desktop: / | Mobile: /mobile/

# Production Build
npm run build        # Creates dist/index.html (desktop) + dist/mobile/index.html
npm run preview      # Preview production build

# Testing
npm test             # Run Playwright tests (headless)
npm run test:ui      # Run tests in UI mode (interactive)
npm run test:headed  # Run tests with browser visible
npm run test:report  # View last test report

# Code Quality
npm run lint         # Run ESLint
npm run knip         # Find unused files/exports/dependencies
```

## Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                   PLATFORM LAYER                         │
│  ┌─────────────────────┐    ┌─────────────────────┐    │
│  │  Desktop (Phaser)   │    │  Mobile (HTML/CSS)  │    │
│  │  - PhaserAdapter    │    │  - MobileRenderer   │    │
│  │  - Managers (6)     │    │  - Components (6)   │    │
│  │  - HandRenderer     │    │  - HandRenderer     │    │
│  └──────────┬──────────┘    └──────────┬──────────┘    │
└─────────────┼──────────────────────────┼───────────────┘
              │                          │
              └─────────┬────────────────┘
                        │ EventEmitter (pub/sub)
              ┌─────────▼───────────────────┐
              │  CORE LAYER (Platform-agnostic)│
              │  - GameController            │
              │  - AIEngine                  │
              │  - Card (Validator)          │
              │  - Data Models               │
              └──────────────────────────────┘
```

### Directory Structure

```
c:\Repos\mahjong\
├── core/                    # Platform-agnostic game logic
│   ├── card/                # Hand validation engine
│   │   ├── card.js          # Pattern matching & ranking
│   │   └── [2017-2025]/     # Year-specific rule definitions
│   ├── GameController.js    # State machine & orchestration
│   ├── AIEngine.js          # AI decision making
│   ├── events/
│   │   ├── EventEmitter.js  # Pub/sub event system
│   │   └── GameEvents.js    # Event factory functions
│   └── models/              # Plain data models (no Phaser)
│       ├── TileData.js
│       ├── HandData.js
│       └── PlayerData.js
│
├── desktop/                 # Phaser-specific implementation
│   ├── adapters/
│   │   └── PhaserAdapter.js # Event → Phaser translator (extends BaseAdapter)
│   ├── config/              # Desktop configuration
│   │   ├── UIConstants.js   # Phaser-specific dimensions
│   │   └── playerLayout.js  # Hand positions and angles
│   ├── animations/          # Animation sequencers (matches mobile architecture)
│   │   ├── AnimationSequencer.js
│   │   ├── DealingAnimationSequencer.js
│   │   ├── CharlestonAnimationSequencer.js
│   │   └── DiscardAnimationSequencer.js
│   ├── managers/            # Specialized desktop managers
│   │   ├── ButtonManager.js
│   │   ├── DialogManager.js
│   │   ├── SelectionManager.js
│   │   ├── TileManager.js
│   │   ├── HintAnimationManager.js
│   │   └── HomePageTileManager.js
│   ├── renderers/
│   │   └── HandRenderer.js  # Tile positioning & layout
│   ├── gameObjects/         # Legacy Phaser objects (being phased out)
│   └── scenes/
│       └── GameScene.js     # Phaser scene initialization
│
├── mobile/                  # Mobile-specific implementation
│   ├── MobileRenderer.js    # Event → HTML/CSS translator (extends BaseAdapter)
│   ├── components/          # HTML/CSS UI components
│   ├── renderers/
│   │   └── HandRenderer.js  # Mobile hand rendering (CSS Grid)
│   └── animations/
│       ├── AnimationController.js          # CSS animation utilities
│       └── ... (sequencers)
│
├── shared/                  # Cross-platform utilities (IMPORTANT)
│   ├── GameConstants.js     # Global enums (STATE, SUIT, PLAYER, etc.)
│   ├── AnimationConfig.js   # Unified animation timing source of truth
│   ├── SettingsManager.js   # localStorage persistence
│   ├── BaseAdapter.js       # Event subscription tracking base class
│   ├── GameUtils.js         # Shared logic (getTotalTileCount)
│   └── GameDisplayUtils.js  # Pattern rendering logic
│
├── index.html               # Desktop entry point
├── main.js                  # Desktop initialization
└── mobile/main.js           # Mobile initialization
```

## Core Architecture

### State Management (No Redux)

**The codebase uses a custom event-driven architecture, NOT Redux or any formal state management library.**

#### State Location

- **GameController** ([core/GameController.js](core/GameController.js)) - Single source of truth
  - Owns game state machine (STATE enum from [shared/GameConstants.js](shared/GameConstants.js))
  - Maintains player data, wall tiles, discard pile
  - Manages turn order and game phase transitions

### Game State Machine

Defined in [shared/GameConstants.js](shared/GameConstants.js) `STATE` enum, managed by [core/GameController.js](core/GameController.js):

```
INIT → START → DEAL → CHARLESTON1 → CHARLESTON_QUERY → CHARLESTON2
  → COURTESY_QUERY → COURTESY → COURTESY_COMPLETE
  → LOOP_PICK_FROM_WALL → LOOP_CHOOSE_DISCARD
  → LOOP_QUERY_CLAIM_DISCARD → LOOP_EXPOSE_TILES
  → END
```

## Shared Components

Both platforms use:

- [core/GameController.js](core/GameController.js) - Game orchestration
- [core/AIEngine.js](core/AIEngine.js) - AI decisions
- [card/card.js](card/card.js) - Hand validation
- [shared/GameConstants.js](shared/GameConstants.js) - Shared enums and constants
- [shared/AnimationConfig.js](shared/AnimationConfig.js) - Unified animation timings
- [shared/SettingsManager.js](shared/SettingsManager.js) - Settings persistence
- [shared/BaseAdapter.js](shared/BaseAdapter.js) - Event subscription tracking base class

## Important Implementation Details

### Shared Configuration

**CRITICAL**: Avoid using "magic numbers" or platform-specific hardcoded values for shared logic.

- Use [shared/GameConstants.js](shared/GameConstants.js) for all game-logic enums.
- Use [shared/AnimationConfig.js](shared/AnimationConfig.js) for all animation durations and delays.
- Use [shared/GameUtils.js](shared/GameUtils.js) for shared utility functions.
- Use [desktop/config/UIConstants.js](desktop/config/UIConstants.js) for desktop-only dimensions.

### Memory Management

**CRITICAL**: All adapters and managers must implement `destroy()` method for proper cleanup:

1. **Event Listener Cleanup** - Unsubscribe from all GameController events (via BaseAdapter)
2. **DOM Event Cleanup** - Remove all DOM event listeners
3. **Reference Cleanup** - Set object references to null to break circular dependencies

### Legacy Objects

- Legacy files starting with `gameObjects_` are being phased out.
- Use [core/models/](core/models/) classes for new code.
- Always prefer `TileData`, `HandData`, and `PlayerData` over legacy wrappers.

## testing

Run `npm test` before committing. Ensure all Playwright tests pass on both desktop and mobile.