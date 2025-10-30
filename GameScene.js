// GameScene.js
import {GameLogic} from "./gameLogic.js";
import {Table} from "./gameObjects_table.js";

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
        this.gGameLogic = new GameLogic(this);
        this.gTable = new Table(this, this.gGameLogic);
        this.gGameLogic.table = this.gTable;
        this.gGameLogic.gameAI.table = this.gTable;

        // Create sprites etc
        this.gGameLogic.wallText = this.add.text(190, 160, "", {
            font: "14px Arial",
            fill: "#ffffff",
            align: "left"
        });
        this.gGameLogic.wallText.visible = false;

        this.gGameLogic.errorText = this.add.text(400, 400, "", {
            font: "14px Arial",
            fill: "#ff8080",
            backgroundColor: 'rgba(0,0,0,1)',
            align: "left"
        });
        this.gGameLogic.errorText.visible = false;

        this.gTable.create();

        // Set up the UI buttons
        this.gGameLogic.init();
        this.resize(this.sys.game.canvas.width, this.sys.game.canvas.height);
    }

    update() {
        // from game.js update() - it was empty
    }

    resize(gameSize, baseSize, displaySize, resolution) {
        const { width, height } = gameSize;
        const uicenterdiv = document.getElementById('uicenterdiv');
        const canvas = this.sys.canvas;

        // Center the uicenterdiv based on the canvas's position and size
        const canvasBounds = canvas.getBoundingClientRect();
        const left = canvasBounds.left + (canvasBounds.width / 2) - (uicenterdiv.offsetWidth / 2);
        const top = canvasBounds.top + (canvasBounds.height * 0.75) - (uicenterdiv.offsetHeight / 2); // 0.75 to position it lower

        uicenterdiv.style.position = 'absolute';
        uicenterdiv.style.left = `${left}px`;
        uicenterdiv.style.top = `${top}px`;
    }
}

export default GameScene;
