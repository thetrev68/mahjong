import * as Phaser from "phaser";

export function animateToPileAndStartGame(scene, tileArray, calculateStackPosition, animateSingleTile, onAnimationComplete) {
    this.isAnimating = true;
    this.animationState = "gathering";

    const promises = [];
    const centerX = scene.sys.game.config.width / 2;
    const centerY = scene.sys.game.config.height / 2;

    for (let i = 0; i < tileArray.length; i++) {
        const tile = tileArray[i];
        const targetPos = calculateStackPosition(i);

        // Calculate distance from center to create a spiral-in effect
        const distance = Phaser.Math.Distance.Between(tile.x, tile.y, centerX, centerY);
        const delay = distance * 2.5; // Adjust multiplier for desired effect

        const promise = animateSingleTile(scene, tile, targetPos.x, targetPos.y, 0, 2000, delay);
        promises.push(promise);
    }

    Promise.all(promises).then(() => {
        console.log("All tiles have reached their destination.");
        this.isAnimating = false;
        this.animationState = "complete";
        if (onAnimationComplete) {
            onAnimationComplete();
        }
    });
}

export function animateSingleTile(scene, tile, x, y, angle, duration, delay) {
    return new Promise((resolve) => {
        scene.tweens.add({
            targets: tile.sprite,
            x: x,
            y: y,
            scaleX: 0.6,
            scaleY: 0.6,
            angle: angle,
            duration: duration,
            delay: delay,
            ease: "Cubic.easeOut",
            onUpdate: () => {
                tile.spriteBack.x = tile.sprite.x;
                tile.spriteBack.y = tile.sprite.y;
                tile.spriteBack.angle = tile.sprite.angle;
                tile.spriteBack.scaleX = tile.sprite.scaleX;
                tile.spriteBack.scaleY = tile.sprite.scaleY;
            },
            onComplete: () => {
                resolve();
            }
        });
    });
}
