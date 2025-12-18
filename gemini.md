# Gemini Project Overview: American Mahjong Game

This document provides a high-level overview and technical guide for the American Mahjong game project.

## 1. Project Goal

The project is a cross-platform, 4-player American Mahjong game. It features a single human player competing against three AI-controlled opponents. The game runs on Desktop (using Phaser 3) and Mobile (using a custom HTML/CSS renderer as a PWA).

## 2. Core Technologies

* **JavaScript (ES6 Modules):** The entire codebase uses modern JavaScript with ES6 modules.
* **Vite:** Used for the development server and build process.
* **Desktop Renderer:** **Phaser 3** (`v3.90.0`) handles rendering and input for the desktop experience.
* **Mobile Renderer:** **HTML5 & CSS Grid** (Custom DOM-based renderer) for the mobile PWA experience.
* **Architecture:** Custom **Event-Driven Architecture** (Pub/Sub) with a strict separation between Core Logic and Platform Adapters.

## 3. Architecture Overview

### High-Level Structure

```
┌─────────────────────────────────────────────────────────┐
│                   PLATFORM LAYER                         │
│  ┌─────────────────────┐    ┌─────────────────────┐    │
│  │  Desktop (Phaser)   │    │  Mobile (HTML/CSS)  │    │
│  │  - PhaserAdapter    │    │  - MobileRenderer   │    │
│  │  - Managers         │    │  - Components       │    │
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

* **`core/`**: Platform-agnostic logic.
  * `GameController.js`: The central state machine and orchestrator.
  * `AIEngine.js`: AI decision logic.
  * `card/`: Hand validation and pattern matching.
  * `models/`: Pure data models (`TileData`, `HandData`, `PlayerData`).
  * `events/`: Event system (`EventEmitter`, `GameEvents`).
* **`desktop/`**: Phaser-specific implementation.
  * `adapters/PhaserAdapter.js`: Translates core events to Phaser actions.
  * `animations/`: Animation Sequencers (Dealing, Charleston, Discard).
  * `managers/`: specialized managers (Selection, Button, Dialog).
  * `scenes/`: Phaser scenes.
* **`mobile/`**: Mobile PWA implementation.
  * `MobileRenderer.js`: Translates core events to DOM updates.
  * `components/`: UI components (MobileTile, DiscardPile).
  * `animations/`: CSS-based Animation Sequencers.
* **`shared/`**: Cross-platform utilities.
  * `BaseAdapter.js`: Base class for adapters (handles event cleanup).
  * `SettingsManager.js`: `localStorage` persistence.

## 4. Key Architectural Patterns

1. **Adapter Pattern:** `GameController` knows nothing about the view. It emits events. `PhaserAdapter` and `MobileRenderer` listen to these events and update their respective UIs.
2. **BaseAdapter & Memory Management:** Both adapters extend `shared/BaseAdapter.js`. This class tracks event subscriptions. **Crucially, all managers and adapters must implement a `destroy()` method** to clean up listeners and references, preventing memory leaks on game restart.
3. **Animation Sequencers:** Both platforms use an "Animation Sequencer" pattern (e.g., `DealingAnimationSequencer`, `CharlestonAnimationSequencer`) to handle complex animation flows using Promises.
4. **Legacy Object Phase-Out:** The project is moving away from `desktop/gameObjects/` (e.g., `gameObjects_hand.js`). New code should use `core/models/` (`HandData`, `TileData`).

## 5. Development Guidelines

* **State Management:** `GameController` is the **Single Source of Truth**. Do not create parallel state in the UI layer.
* **Event Cleanup:** When creating a component that listens to events (DOM or GameController), ensure there is a `destroy()` or cleanup mechanism.
* **Logging:** Use `gdebug` from `utils.js` to gate debug logs. Avoid leaving `console.log` in production code.

    ```javascript
    import { gdebug } from '../../utils.js';
    if (gdebug) console.log("Debug info");
    ```

* **Constants:** Use `constants.js` for game-wide values (States, Tile IDs, Dimensions). Do not use "magic numbers".
* **UI Prompts:** The game uses a callback-based prompt system.

    ```javascript
    // GameController emits UI_PROMPT
    // Adapter handles it, gets user input, and calls the callback provided in the event.
    ```

* **Parity:** When implementing features, ensure they work on both Desktop and Mobile unless explicitly platform-specific.

## 6. Running the Project

* **Development:** `npm run dev` (Starts Vite server).
* **Testing:** `npm test` (Runs Playwright tests).
* **Linting:** `npm run lint`.

## 7. Critical Knowledge for Gemini

* **No Redux:** The state is managed entirely by `GameController`.
* **Platform Specifics:**
  * **Desktop:** Uses `phaser` (canvas/webgl).
  * **Mobile:** Uses HTML DOM elements.
* **Legacy Warning:** If you see files starting with `gameObjects_` in `desktop/`, be aware these are legacy. Prefer `core/models/` for logic.
* **Mobile vs Desktop Animation:** Both now use a unified "Sequencer" architecture.
