import { printMessage } from "../../utils.js";
import {
  // PLAYER, PLAYER_OPTION, SUIT,
  getTotalTileCount,
} from "../../constants.js";
import { Wall, Discards } from "./gameObjects.js";

/**
 * Table - Legacy class from Phase 5
 *
 * CURRENT ARCHITECTURE (Phase 6):
 * - GameController manages all game state (players, hands, turn flow)
 * - HandRenderer handles all visual rendering
 * - This Table class now ONLY manages:
 *   1. Wall (tile pool)
 *   2. Discards (discard pile)
 *   3. Visual turn indicator boxes
 *
 * TODO Phase 6 Cleanup:
 * - Delete all methods that reference this.players
 * - Keep only: wall, discards, boxes, reset(), switchPlayer()
 * - Consider moving Wall/Discards to TileManager
 */

// Phase 6: gPlayerInfo moved to desktop/config/playerLayout.js (PLAYER_LAYOUT)

export class Table {
  constructor(scene) {
    this.scene = scene;
    this.gameLogic = null; // Will be set after construction
    this.wall = new Wall(scene);
    this.discards = new Discards();

    this.boxes = [];
    for (let i = 0; i < 4; i++) {
      this.boxes[i] = null;
    }

    // Visual turn indicator boxes (graphics objects)
    this.player02CourtesyVote = 0;
    this.player13CourtesyVote = 0;
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
        "ERROR - table.reset() - total tile count is not " +
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
