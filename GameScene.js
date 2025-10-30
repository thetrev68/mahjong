// GameScene.js
import {GameLogic} from "./gameLogic.js";
import {Table} from "./gameObjects_table.js";

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.commandBarManualPosition = false;
        this.commandBarPosition = null;
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
        this.enableCommandBarDrag();
        this.resize(this.sys.game.canvas.width, this.sys.game.canvas.height);
    }

    update() {
        // from game.js update() - it was empty
    }

    getDragBounds() {
        const parent = document.getElementById('parentdiv');
        if (parent) {
            return parent.getBoundingClientRect();
        }
        return this.sys.canvas.getBoundingClientRect();
    }

    getClampedCommandBarPosition(left, top, bar, boundsRect) {
        const padding = 16;
        const rect = bar.getBoundingClientRect();
        const halfWidth = (rect.width || bar.offsetWidth || 0) / 2;
        const barHeight = rect.height || bar.offsetHeight || 0;

        let minLeft = boundsRect.left + halfWidth + padding;
        let maxLeft = boundsRect.right - halfWidth - padding;
        if (minLeft > maxLeft) {
            const center = boundsRect.left + (boundsRect.width / 2);
            minLeft = center;
            maxLeft = center;
        }

        let minTop = boundsRect.top + padding;
        let maxTop = boundsRect.bottom - barHeight - padding;
        if (minTop > maxTop) {
            const mid = boundsRect.top + (boundsRect.height / 2);
            minTop = mid;
            maxTop = mid;
        }

        const clampedLeft = Math.min(Math.max(left, minLeft), maxLeft);
        const clampedTop = Math.min(Math.max(top, minTop), maxTop);

        return {left: clampedLeft, top: clampedTop};
    }

    getDefaultCommandBarPosition(bar, canvasBounds, boundsRect) {
        const dock = document.getElementById('commandDock');
        if (dock) {
            const dockRect = dock.getBoundingClientRect();
            if (dockRect.width && dockRect.height) {
                const targetLeft = dockRect.left + (dockRect.width / 2);
                const targetTop = dockRect.top + Math.max((dockRect.height - (bar.offsetHeight || 0)) / 2, 0);
                return this.getClampedCommandBarPosition(targetLeft, targetTop, bar, boundsRect);
            }
        }

        const barWidth = bar.offsetWidth || 0;
        const barHeight = bar.offsetHeight || 0;
        const fallbackLeft = canvasBounds.right - (barWidth / 2) - 24;
        const fallbackTop = canvasBounds.bottom - barHeight - 120;
        return this.getClampedCommandBarPosition(fallbackLeft, fallbackTop, bar, boundsRect);
    }

    enableCommandBarDrag() {
        const bar = document.getElementById('uicenterdiv');
        const canvas = this.sys.canvas;
        if (!bar || !canvas) {
            return;
        }

        const rootStyle = document.documentElement.style;
        let isDragging = false;
        let pointerOffsetX = 0;
        let pointerOffsetY = 0;

        const onPointerMove = (event) => {
            if (!isDragging) {
                return;
            }
            const boundsRect = this.getDragBounds();
            const rect = bar.getBoundingClientRect();
            const tentativeLeft = event.clientX - pointerOffsetX + (rect.width || bar.offsetWidth || 0) / 2;
            const tentativeTop = event.clientY - pointerOffsetY;
            const {left, top} = this.getClampedCommandBarPosition(tentativeLeft, tentativeTop, bar, boundsRect);

            rootStyle.setProperty('--command-bar-left', `${left}px`);
            rootStyle.setProperty('--command-bar-top', `${top}px`);
            this.commandBarPosition = {left, top};
            this.commandBarManualPosition = true;
        };

        const onPointerUp = (event) => {
            if (!isDragging) {
                return;
            }
            isDragging = false;
            bar.classList.remove('command-bar--dragging');
            try {
                bar.releasePointerCapture(event.pointerId);
            } catch (err) {
                // ignore if pointer capture was not set
            }
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };

        const onPointerDown = (event) => {
            if (event.button !== 0) {
                return;
            }
            if (event.target.closest('#buttondiv')) {
                return;
            }

            const rect = bar.getBoundingClientRect();
            pointerOffsetX = event.clientX - rect.left;
            pointerOffsetY = event.clientY - rect.top;
            isDragging = true;
            bar.classList.add('command-bar--dragging');

            try {
                bar.setPointerCapture(event.pointerId);
            } catch (err) {
                // Ignore if capture fails (older browsers)
            }

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerUp);
            event.preventDefault();
        };

        bar.addEventListener('pointerdown', onPointerDown);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            bar.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        });
    }

    resize(gameSize, baseSize, displaySize, resolution) {
        const uicenterdiv = document.getElementById('uicenterdiv');
        const canvas = this.sys.canvas;

        if (!uicenterdiv || !canvas) {
            return;
        }

        const canvasBounds = canvas.getBoundingClientRect();
        const boundsRect = this.getDragBounds();
        const rootStyle = document.documentElement.style;

        if (this.commandBarManualPosition && this.commandBarPosition) {
            const {left, top} = this.getClampedCommandBarPosition(
                this.commandBarPosition.left,
                this.commandBarPosition.top,
                uicenterdiv,
                boundsRect
            );
            this.commandBarPosition = {left, top};
            rootStyle.setProperty('--command-bar-left', `${left}px`);
            rootStyle.setProperty('--command-bar-top', `${top}px`);
            return;
        }

        const {left, top} = this.getDefaultCommandBarPosition(uicenterdiv, canvasBounds, boundsRect);

        this.commandBarPosition = {left, top};
        rootStyle.setProperty('--command-bar-left', `${left}px`);
        rootStyle.setProperty('--command-bar-top', `${top}px`);
    }
}

export default GameScene;
