# Phaser 2 to Phaser 3 Migration Plan

This document outlines the steps required to migrate the American Mahjong game from Phaser 2.10.5 to the latest version of Phaser 3.

---

### Phase 1: Project Setup and Basic Scene

- **Task**: [1. Setup Phaser 3 Project Structure](#)
  - **Step 1.1**: Update the `index.html` to include the latest Phaser 3 library from a CDN. The current version will be replaced.
  - **Step 1.2**: Create a new `main.js` file to replace `game.js`. This file will contain the Phaser 3 game configuration object.
  - **Step 1.3**: In `main.js`, define the game configuration, including `type`, `width`, `height`, `scene`, and the new `scale` settings.

- **Task**: [2. Create a Main Game Scene](#)
  - **Step 2.1**: Create a new file, `GameScene.js`, for the main `Phaser.Scene`.
  - **Step 2.2**: Move the logic from `preload`, `create`, and `update` in `game.js` into the `preload`, `create`, and `update` methods of `GameScene`.
  - **Step 2.3**: Reference `GameScene` in the `scene` property of the game config in `main.js`.

### Phase 2: Asset Loading and Game Object Migration

- **Task**: [3. Update Asset Loading](#)
  - **Step 3.1**: In `GameScene.js`, refactor the `preload` method to use the Phaser 3 syntax:
    - [`game.load.atlasJSONHash("tiles", ...)` -> `this.load.atlas("tiles", ...)` ](game.js:25)
    - [`game.load.image("back", ...)` -> `this.load.image("back", ...)` ](game.js:26)

- **Task**: [4. Refactor Game Object Creation](#)
  - **Step 4.1**: In the `Tile` class ([`gameObjects.js`](gameObjects.js)), update the `create` method:
    - [`game.add.sprite(...)` -> `this.scene.add.sprite(...)`](gameObjects.js:92)
    - The scene context will need to be passed to the `Tile` constructor.
  - **Step 4.2**: Update anchor points to origins:
    - [`sprite.anchor.setTo(0.5, 0.5)` -> `sprite.setOrigin(0.5, 0.5)`](gameObjects.js:94)
  - **Step 4.3**: Refactor text object creation in `gameLogic.js`:
    - [`game.add.text(...)` -> `this.scene.add.text(...)`](gameLogic.js:38)
    - The scene context will need to be accessible from the `GameLogic` class.

### Phase 3: Core Game Mechanics Refactoring

- **Task**: [5. Migrate the Scale Manager](#)
  - **Step 5.1**: In `main.js`, configure the `scale` property in the game config to replicate the old behavior:
    - **`scaleMode: Phaser.ScaleManager.SHOW_ALL`** becomes `mode: Phaser.Scale.FIT`
    - **`pageAlignHorizontally` and `pageAlignVertically`** are replaced by `autoCenter: Phaser.Scale.CENTER_BOTH`
  - **Step 5.2**: The [`resizeCallback`](game.js:35) will be replaced with a `'resize'` event listener on `this.scale`.

- **Task**: [6. Update Tween Animations](#)
  - **Step 6.1**: In the `Tile` class's [`animate`](gameObjects.js:134) method, refactor the tween creation:
    - [`game.add.tween(...)` -> `this.scene.tweens.add(...)`](gameObjects.js:147)
    - **`tween.to(...)`** syntax will change to a configuration object passed to `this.scene.tweens.add()`.
    - **`onComplete`** will be handled with an event listener: `tween.on('complete', ...)`

### Phase 4: UI, Input, and Logic

- **Task**: [7. Refactor Input Handling and UI (Detailed)](#)
  - The current implementation uses a mix of native DOM events for UI buttons and Phaser 2's input system for tile interactions (clicks and drags). The migration to Phaser 3 will require a complete overhaul of the tile input system.
  - **Step 7.1: Migrate Tile Click Events (Selection Logic)**
    - **Analysis**: In [`gameObjects_hand.js`](gameObjects_hand.js), tile selection is handled by adding an `onInputUp` event listener to each tile's sprite ([`tile.sprite.events.onInputUp.add(...)`](gameObjects_hand.js:508)). This logic, which is inside the [`insertHidden`](gameObjects_hand.js:503) method, manages selecting and deselecting tiles for actions like Charleston, discarding, and exposing sets.
    - **Refactor Plan**:
      1. In the `Hand.insertHidden()` method, after creating a sprite, make it interactive using `tile.sprite.setInteractive()`.
      2. Instead of `onInputUp`, I will attach a `'pointerup'` event listener to the sprite: `tile.sprite.on('pointerup', (pointer) => { ... });`.
      3. The core selection logic from the existing callback will be moved into this new listener. This logic checks the game state (`gGameLogic.state`), manages `selectCount`, and visually moves the tile to indicate selection.
  - **Step 7.2: Migrate Tile Drag-and-Drop Events**
    - **Analysis**: Drag functionality for reordering tiles in the player's hand is enabled via `tile.sprite.input.enableDrag()` and managed with `onDragStart` and `onDragStop` listeners ([`gameObjects_hand.js:587-609`](gameObjects_hand.js:587-609)). The `onDragUpdate` listener checks for overlap with other tiles to handle the swapping logic.
    - **Refactor Plan**:
      1. I will enable drag-and-drop on the sprite using `this.scene.input.setDraggable(tile.sprite);`. This requires a scene reference.
      2. The existing `onDragStart`, `onDragUpdate`, and `onDragStop` events will be replaced with scene-level drag events:
         - `this.scene.input.on('dragstart', (pointer, gameObject) => { ... });`
         - `this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => { ... });`
         - `this.scene.input.on('dragend', (pointer, gameObject) => { ... });`
      3. The logic for swapping tiles on overlap ([`checkOverlap`](gameObjects_hand.js:252) and [`swapTiles`](gameObjects_hand.js:274)) will be called from within the `'drag'` event listener.
  - **Step 7.3: Migrate Exposed Joker Click Events**
    - **Analysis**: Exposed jokers are also interactive, allowing players to swap them for a matching tile from their hand. This is handled by a separate `onInputUp` listener added in the [`insertExposed`](gameObjects_hand.js:631) method ([`gameObjects_hand.js:652`](gameObjects_hand.js:652)).
    - **Refactor Plan**:
      1. Similar to hidden tiles, I will use `tile.sprite.setInteractive()` for exposed jokers.
      2. The selection logic will be moved into a `'pointerup'` event handler attached to the joker sprite. This logic validates that the player has correctly selected a matching tile from their hand before allowing the joker to be selected.
  - **Step 7.4: Refactor UI Button Event Listeners**
    - **Analysis**: The game's main buttons (Start, Pass, Discard, etc.) are standard HTML DOM elements controlled via `document.getElementById` and `addEventListener` in [`gameLogic.js`](gameLogic.js). This is independent of the Phaser canvas.
    - **Refactor Plan**: This part of the input system does **not** need a major overhaul. The existing DOM manipulation will continue to function correctly alongside a Phaser 3 game. My main task here will be to ensure that the functions called by these event listeners (e.g., `this.start()`, `this.charlestonPass()`) are correctly bound and can access the new scene-based game logic. The global `gGameLogic` object will facilitate this, though a better long-term solution might be to use a global event bus or registry. For this migration, we will keep the existing structure to minimize scope.
  - **Step 7.5: Update Game Object References**
    - **Analysis**: The input handlers frequently reference a global `gGameLogic` object to access game state and other parts of the system.
    - **Refactor Plan**: This dependency will remain for now to control the scope of the refactor. However, I will need to ensure that the scene is properly passed into or made accessible by the `Hand` and `Tile` classes so that the new input system can function correctly. For example, `this.scene.input.setDraggable()` requires a scene reference. This will likely involve passing the scene down from `GameScene` -> `GameLogic` -> `Table` -> `Player` -> `Hand`.

- **Task**: [8. Migrate Game Logic and State Management](#)
  - **Step 8.1**: The global `game` object will be removed. All references to `game` will be replaced with `this` (referring to the scene) or `this.scene` where appropriate. This will be a major search-and-replace operation across the codebase.
  - **Step 8.2**: The state machine in [`gameLogic.js`](gameLogic.js) can largely remain as it is, but the way it interacts with Phaser objects needs to be updated to use the scene context.

### Phase 5: Finalization

- **Task**: [9. Testing and Debugging](#)
  - **Step 9.1**: Thoroughly test all game phases: dealing, Charleston, courtesy passing, discarding, claiming, and game end.
  - **Step 9.2**: Use the browser's developer console to identify and fix errors.

- **Task**: [10. Final Code Cleanup and Review](#)
  - **Step 10.1**: Remove any leftover Phaser 2 code.
  - **Step 10.2**: Ensure the code follows Phaser 3 best practices.
