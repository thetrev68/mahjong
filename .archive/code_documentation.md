# Code Documentation

This document provides a summary of the classes, functions, and constants defined and used in the core files of the project.

### `constants.js`

- **Defines:**
  - `const WINDOW_HEIGHT`
  - `const WINDOW_WIDTH`
  - `const SPRITE_HEIGHT`
  - `const SPRITE_WIDTH`
  - `const SPRITE_SCALE`
  - `const TILE_GAP`
  - `const STATE`
  - `const PLAYER_OPTION`
  - `const PLAYER`
  - `const SUIT`
  - `const VNUMBER`
  - `const WIND`
  - `const DRAGON`
- **Used In:**
  - `main.js`
  - `gameLogic.js`
  - `gameAI.js`
  - `gameObjects.js`
  - `gameObjects_hand.js`
  - `gameObjects_player.js`
  - `gameObjects_table.js`
  - `card/card.js`

### `utils.js`

- **Defines:**
  - `function printMessage(str)`
  - `function printInfo(str)`
  - `const gdebug`
  - `const gtrace`
  - `function debugPrint(str)`
  - `function debugTrace(str)`
  - `function printHint(html)`
- **Used In:**
  - `gameLogic.js`
  - `gameAI.js`
  - `gameObjects_table.js`
  - `card/card.js`

### `main.js`

- **Defines:**
  - `const config`
  - `const game`
- **Uses:**
  - `class Phaser.Game`
  - `class GameScene`
  - `const WINDOW_WIDTH`
  - `const WINDOW_HEIGHT`

### `GameScene.js`

- **Defines:**
  - `class GameScene extends Phaser.Scene`
    - `constructor()`
    - `preload()`
    - `create()`
    - `update()`
    - `getDragBounds()`
    - `getClampedCommandBarPosition(left, top, bar, boundsRect)`
    - `getDefaultCommandBarPosition(bar, canvasBounds, boundsRect)`
    - `enableCommandBarDrag()`
    - `resize(_gameSize, _baseSize, _displaySize, _resolution)`
- **Uses:**
  - `class Phaser.Scene`
  - `class GameLogic`
  - `class Table`

### `gameLogic.js`

- **Defines:**
  - `class HintAnimationManager`
    - `constructor(gameLogic)`
    - `applyGlowToDiscardSuggestions(tileRankArray)`
    - `findNextUnhighlightedTileInHand(hand, targetTile, highlightedTiles)`
    - `clearAllGlows()`
    - `restoreGlowEffects()`
    - `isHintPanelExpanded()`
    - `updateHintsForNewTiles()`
    - `updateHintDisplayOnly()`
    - `updateHintDisplay(rankCardHands, tileRankArray)`
  - `class GameLogic`
    - `constructor(scene)`
    - `init()`
    - `start()`
    - `deal()`
    - `charleston()`
    - `loop()`
    - `end()`
    - `pickFromWall()`
    - `chooseDiscard()`
    - `canPlayerClaimExposure(player, discardTile)`
    - `canPlayerMahjongWithDiscard(player, discardTile)`
    - `claimDiscard(player, discardTile)`
    - `yesNoQuery()`
    - `charlestonPass(playerId)`
    - `exposeTiles()`
    - `playerExposeTiles()`
    - `courtesyQuery()`
    - `courtesyPass()`
    - `updateUI()`
    - `enableSortButtons()`
    - `disableSortButtons()`
    - `getTrainingInfo()`
    - `updateTrainingForm()`
    - `enableTrainingForm()`
    - `disableTrainingForm()`
    - `displayErrorText(str)`
    - `displayAllError()`
    - `sleep(ms)`
- **Uses:**
  - `function printMessage`
  - `function printInfo`
  - `function debugPrint`
  - `function printHint`
  - `const STATE`
  - `const PLAYER_OPTION`
  - `const PLAYER`
  - `const SUIT`
  - `const VNUMBER`
  - `class GameAI`
  - `class Card`
  - `class Tile`

### `gameAI.js`

- **Defines:**
  - `class GameAI`
    - `constructor(card, table)`
    - `rankTiles13(hand)`
    - `rankTiles14(hand)`
    - `printTileRankArray(tileRankArray, elemCount)`
    - `exchangeTilesForJokers(currPlayer, hand)`
    - `chooseDiscard(currPlayer)`
    - `validateComponentForExposure(player, compInfo)`
    - `claimDiscard(player, discardTile)`
    - `charlestonPass(player)`
    - `courtesyVote(player)`
    - `courtesyPass(player, maxCount)`
- **Uses:**
  - `function debugPrint`
  - `const gdebug`
  - `const PLAYER_OPTION`
  - `const SUIT`
  - `const VNUMBER`
  - `class Tile`

### `gameObjects.js`

- **Defines:**
  - `class Tile`
    - `constructor(scene, suit, number, spriteName)`
    - `create()`
    - `get x()`
    - `get y()`
    - `get angle()`
    - `set x(x)`
    - `set y(y)`
    - `set angle(angle)`
    - `get scale()`
    - `set scale(scale)`
    - `animate(x, y, angle)`
    - `tweenUpdateCallback()`
    - `showTile(visible, faceUp)`
    - `getText()`
    - `addGlowEffect(scene, color, intensity)`
    - `updateGlowPosition()`
    - `removeGlowEffect()`
  - `class Wall`
    - `constructor(scene)`
    - `create()`
    - `destroy()`
    - `getCount()`
    - `findAndRemove(findTile)`
    - `insert(tile)`
    - `remove()`
    - `shuffle()`
    - `showWall()`
    - `showWallBack()`
  - `class Discards`
    - `constructor()`
    - `insertDiscard(tile)`
    - `showDiscards(offsetX, offsetY)`
- **Uses:**
  - `class Phaser`
  - `const SUIT`
  - `const SPRITE_HEIGHT`
  - `const SPRITE_WIDTH`
  - `const TILE_GAP`

### `gameObjects_hand.js`

- **Defines:**
  - `class TileSet`
    - `constructor(scene, gameLogic, inputEnabled)`
    - `getLength()`
    - `getTileArray()`
    - `reset(wall)`
    - `resetSelection()`
    - `getSelection()`
    - `getSelectionCount()`
    - `sortRank()`
    - `sortSuit()`
    - `moveJokerToFront()`
    - `moveFlowerToFront()`
    - `getTileWidth(playerInfo)`
    - `getWidth(playerInfo)`
    - `showTileSet(playerInfo, posX, posY, exposed)`
    - `insert(tile)`
    - `remove(tile)`
    - `checkOverlap(tile)`
    - `swapTiles(tile, overlappedTile)`
  - `class Hand`
    - `constructor(scene, gameLogic, inputEnabled)`
    - `dupHand()`
    - `getLength()`
    - `getTileArray()`
    - `getHiddenTileArray()`
    - `isAllHidden()`
    - `getHiddenJokers()`
    - `reset(wall)`
    - `getSeperatorDistance(playerInfo)`
    - `getHandWidth(playerInfo)`
    - `showHand(playerInfo, forceFaceup)`
    - `calculateTilePosition(playerInfo, index)`
    - `getInsertionIndex(dragX, tileArray, draggedTile)`
    - `showInsertionFeedback(insertionIndex, tileArray, draggedTile)`
    - `clearInsertionFeedback(tileArray)`
    - `resetSelection()`
    - `getSelectionHidden()`
    - `getSelectionHiddenCount()`
    - `sortRankHidden()`
    - `sortSuitHidden()`
    - `insertHidden(tile)`
    - `removeHidden(tile)`
    - `getSelectionExposedCount()`
    - `insertExposed(tileArray)`
    - `removeDiscard()`
- **Uses:**
  - `class Phaser`
  - `const STATE`
  - `const PLAYER`
  - `const SUIT`
  - `const SPRITE_WIDTH`
  - `const SPRITE_SCALE`
  - `const WINDOW_WIDTH`
  - `const WINDOW_HEIGHT`
  - `const TILE_GAP`

### `gameObjects_player.js`

- **Defines:**
  - `class Player`
    - `constructor(scene, gameLogic, playerInfo)`
    - `create()`
    - `showHand(forceFaceup)`
- **Uses:**
  - `const PLAYER`
  - `class Hand`

### `gameObjects_table.js`

- **Defines:**
  - `class Table`
    - `constructor(scene, gameLogic)`
    - `create()`
    - `reset()`
    - `switchPlayer(player)`
    - `deal(initPlayerHandArray)`
    - `charlestonPass(player, charlestonPassArray)`
    - `courtesyVote(courtesyVoteArray)`
    - `courtesyPass(courtesyPassArray)`
    - `processClaimArray(currPlayer, claimArray, discardTile)`
    - `exchangeUserSelectedTileForExposedJoker()`
    - `getExposedJokerArray()`
    - `exchangeJoker(currPlayer, hand, swapTile)`
- **Uses:**
  - `function printMessage`
  - `const PLAYER`
  - `const PLAYER_OPTION`
  - `const SUIT`
  - `const WINDOW_WIDTH`
  - `const WINDOW_HEIGHT`
  - `const SPRITE_HEIGHT`
  - `const SPRITE_SCALE`
  - `class Wall`
  - `class Discards`
  - `class Player`

### `card/card.js`

- **Defines:**
  - `class Card`
    - `constructor(year)`
    - `init()`
    - `generateHand(handDescription, numTiles)`
    - `validateHand14(hand)`
    - `validateHand13(hand, singleTile)`
    - `validateHand(test, allHidden)`
    - `matchHand(test, info, handGroup, validHand)`
    - `matchComponents(test, info, validHand, vsuitArray, minNum)`
    - `printValidationInfo(info)`
    - `rankHandArray14(hand)`
    - `rankHand(hand, rankInfo, validHand)`
    - `rankMatchComp(test, minNum, comp, vsuitArray)`
    - `rankFormComponents(hand, minNum, validHand, vsuitArray)`
    - `sortHandRankArray(rankCardHands)`
    - `printHandRankArray(rankCardHands, elemCount)`
- **Uses:**
  - `function debugPrint`
  - `function debugTrace`
  - `const gdebug`
  - `class Tile`
  - `class Hand`
  - `const SUIT`
  - `const VNUMBER`

### `settings.js`

- **Defines:**
  - `class SettingsManager`
    - `constructor()`
    - `init()`
    - `showSettings()`
    - `hideSettings()`
    - `getCardYear()`
    - `saveSetting(key, value)`
    - `getSetting(key, defaultValue)`
    - `getAllSettings()`
    - `loadSettings()`
    - `applyTrainingSettings(settings)`
    - `applyYearSettings(settings)`
    - `updateTrainingFormVisibility()`
    - `saveTrainingSettings()`
    - `saveYearSettings()`
    - `registerSettingSection(sectionId, config)`
- **Uses:**
  - _(None from the analyzed files)_
