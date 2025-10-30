import GameScene from './GameScene.js';
import {WINDOW_WIDTH, WINDOW_HEIGHT} from "./constants.js";

const config = {
    type: Phaser.AUTO,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    backgroundColor: '#006400',
    parent: 'gamediv',
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);
