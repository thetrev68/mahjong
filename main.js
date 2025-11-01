import GameScene from "./GameScene.js";
import {WINDOW_WIDTH, WINDOW_HEIGHT} from "./constants.js";

const config = {
    type: Phaser.AUTO,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    transparent: true,
    parent: "gamediv",
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// eslint-disable-next-line no-unused-vars
const game = new Phaser.Game(config);
