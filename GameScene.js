// GameScene.js
import {GameLogic} from "./gameLogic.js";
import {Table} from "./gameObjects_table.js";

// The old globals. We need to get rid of them, but for now, let's see.
let gTable = null;
let gGameLogic = null;

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // from game.js preload()
        this.load.atlas("tiles", "assets/tiles.png", "assets/tiles.json");
        this.load.image("back", "assets/back.png");

        // The scale manager stuff will be handled in main.js config, so I'm omitting it here as per the plan.
        // The resizeCallback is also a separate step.
    }

    create() {
        // from game.js create()

        this.scale.on('resize', this.resize, this);

        // Create game objects
        gTable = new Table(this);
        gGameLogic = new GameLogic(this, gTable);

        // Making gGameLogic global so UI buttons can access it.
        // This is a temporary solution that mimics the old architecture.
        window.gGameLogic = gGameLogic;

        // Init game logic
        gGameLogic.init();

        // Create sprites etc
        gGameLogic.create();
        gTable.create();
    }

    update() {
        // from game.js update() - it was empty
    }

    resize(gameSize, baseSize, displaySize, resolution) {
        let s = document.getElementById("uicenterdiv");
        let left = 400 * this.scale.width / 800;
        let top = 450 * this.scale.height / 600;
        s.style.left = left + "px";
        s.style.top = top + "px";
    }
}

export default GameScene;
