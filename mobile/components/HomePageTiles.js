import { tileSprites } from "../utils/tileSprites.js";

export class HomePageTiles {
    constructor(container) {
        this.container = container;
        this.tiles = [];
        this.isAnimating = false;
        if (container) {
            this.render();
        }
    }

    render() {
        console.log("HomePageTiles: Rendering scattered tiles");
        // Create scattered layout of micro tiles (approx 50 visible)
        for (let i = 0; i < 50; i++) {
            const tile = this.createRandomTile();
            tile.classList.add("home-page-tile");

            // Position randomly within the container
            // Using a slightly centralized distribution if possible, or just random for now
            tile.style.left = `${Math.random() * 80 + 10}%`;
            tile.style.top = `${Math.random() * 60 + 20}%`;

            // Random rotation
            tile.style.transform = `rotate(${Math.random() * 360}deg)`;

            this.container.appendChild(tile);
            this.tiles.push(tile);
        }
        this.container.style.display = "block";
    }

    createRandomTile() {
        const tile = document.createElement("div");
        tile.className = "tile tile--micro home-page-tile";

        // 30% chance to be face down
        if (Math.random() < 0.3) {
            tile.classList.add("tile--back");
            tile.style.backgroundImage = "url('/mahjong/pwa/assets/back.png')";
            tile.style.backgroundSize = "cover";
            tile.style.backgroundRepeat = "no-repeat";
        } else {
            const suit = Math.floor(Math.random() * 3); // 0=CRACK, 1=BAM, 2=DOT
            const number = Math.floor(Math.random() * 9) + 1;
            const pos = tileSprites.getSpritePosition({ suit, number });
            // console.log("Created tile:", { suit, number, pos });
            tile.style.backgroundPosition = `${pos.xPct}% ${pos.yPct}%`;
        }
        return tile;
    }

    async animateStart() {
        if (this.isAnimating || this.tiles.length === 0) return;
        this.isAnimating = true;

        // Animate all tiles flying off to top-left
        const animations = this.tiles.map((tile, index) =>
            new Promise(resolve => {
                const duration = 800 + Math.random() * 800; // Variable speed
                const delay = Math.random() * 200;

                tile.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}ms`;
                tile.style.transform = `translate(-150vw, -150vh) rotate(${Math.random() * 360}deg)`;
                tile.style.opacity = "0";

                setTimeout(() => {
                    tile.remove();
                    resolve();
                }, duration + delay);
            })
        );

        await Promise.all(animations);
        this.tiles = [];
        this.isAnimating = false;
        // Hide container after animation
        if (this.container) {
            this.container.style.display = "none";
        }
    }
}
