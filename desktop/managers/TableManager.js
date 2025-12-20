import { printMessage } from "../../shared/DebugUtils.js";
import { getTotalTileCount } from "../../shared/GameUtils.js";
import { Wall, Discards } from "../gameObjects/PhaserTileSprites.js";

/**
 * TableManager - Manages wall, discards, and visual turn indicators
 *
 * CURRENT ARCHITECTURE (Phase 6):
 * - GameController manages all game state (players, hands, turn flow)
 * - HandRenderer handles all visual rendering
 * - This TableManager now ONLY manages:
 *   1. Wall (tile pool)
 *   2. Discards (discard pile)
 *   3. Visual turn indicator boxes
 *
 * RESPONSIBILITIES:
 * - wall: Wall instance managing the tile pool
 * - discards: Discards instance managing the discard pile
 * - boxes: Array of 4 Phaser graphics objects (turn indicators)
 * - reset(): Returns all discarded tiles back to wall
 * - switchPlayer(): Updates visual turn indicator
 *
 * FUTURE CONSIDERATION:
 * - Moving Wall/Discards to TileManager could further consolidate tile management
 */

export class TableManager {
  constructor(scene) {
    this.scene = scene;
    this.wall = new Wall(scene);
    this.discards = new Discards();

    // Visual turn indicator boxes (graphics objects)
    this.boxes = [];
    for (let i = 0; i < 4; i++) {
      this.boxes[i] = null;
    }
  }

  create(skipTileCreation = false) {
    for (let i = 0; i < 4; i++) {
      const graphics = this.scene.add.graphics(0, 0);
      // Remove light green fill to match background
      // Graphics.fillStyle(0x8FBF00);
      // Graphics.fillRect(gPlayerInfo[i].rectX, gPlayerInfo[i].rectY, gPlayerInfo[i].rectWidth, gPlayerInfo[i].rectHeight);
      this.boxes[i] = graphics;
    }

    this.wall.create(skipTileCreation);
  }

  reset() {
    // Phase 6: Hand reset now handled by GameController (HandData)
    // Just reset discards back to wall

    while (this.discards.tileArray.length) {
      this.wall.insert(this.discards.tileArray.pop());
    }

    // Verify there are 152 (or 160 with blanks) tiles in wall
    // Dynamic tile count based on settings (152 or 160 with blanks)
    const expectedTileCount = getTotalTileCount();
    if (this.wall.tileArray.length !== expectedTileCount) {
      printMessage(
        "ERROR - TableManager.reset() - total tile count is not " +
          expectedTileCount +
          ". Tile count = " +
          this.wall.tileArray.length +
          "\n",
      );
    }
  }

  switchPlayer(player) {
    for (let i = 0; i < 4; i++) {
      this.boxes[i].visible = false;
    }

    this.boxes[player].visible = true;
  }
}
