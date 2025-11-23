import { debugPrint } from "../../utils.js";
import { tileSprites } from "../utils/tileSprites.js";

export class HomePageTiles {
    constructor(container) {
        this.container = container;
        this.tiles = [];
        this.isAnimating = false;
        if (container) {
            // render() must be called explicitly
        }
    }

    render() {
        debugPrint("HomePageTiles: Rendering scattered tiles");
        // Create scattered layout of micro tiles (144 visible - full set)
        for (let i = 0; i < 144; i++) {
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
            tile.style.backgroundImage = "url('/mahjong/assets/back.png')";
            tile.style.backgroundSize = "cover";
            tile.style.backgroundRepeat = "no-repeat";
        } else {
            const suit = Math.floor(Math.random() * 3); // 0=CRACK, 1=BAM, 2=DOT
            const number = Math.floor(Math.random() * 9) + 1;
            try {
                const pos = tileSprites.getSpritePosition({ suit, number });
                tile.style.backgroundPosition = `${pos.xPct}% ${pos.yPct}%`;
            } catch (err) {
                console.error("Failed to get sprite position:", err);
                // Fallback to back tile
                tile.classList.add("tile--back");
                tile.style.backgroundImage = "url('/mahjong/assets/back.png')";
                tile.style.backgroundSize = "cover";
            }
        }
        return tile;
    }

    async animateStart() {
        if (this.isAnimating || this.tiles.length === 0) return;
        this.isAnimating = true;

        // Get viewport dimensions for calculating exit points
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Animate all tiles flying off to randomized exit points in top-left corner
        // This creates a funnel effect similar to desktop version
        const animations = this.tiles.map((tile) =>
            new Promise(resolve => {
                const duration = 1200 + Math.random() * 800; // 1200-2000ms like desktop
                const delay = Math.random() * 300;

                // Randomized exit point in top-left corner (like desktop: -200 to -50 pixels)
                // Use absolute pixel values that scale with viewport
                const exitX = -(viewportWidth * 0.15 + Math.random() * viewportWidth * 0.10); // -15% to -25% of screen width
                const exitY = -(viewportHeight * 0.15 + Math.random() * viewportHeight * 0.10); // -15% to -25% of screen height

                window.requestAnimationFrame(() => {
                    // Use ease-in cubic for acceleration toward exit point
                    tile.style.transition = `transform ${duration}ms cubic-bezier(0.55, 0.085, 0.68, 0.53) ${delay}ms`;
                    // All tiles converge to randomized points in top-left corner
                    tile.style.transform = `translate(${exitX}px, ${exitY}px) rotate(${Math.random() * 720}deg)`;
                    // Keep tiles visible as they slide off - they'll be clipped by overflow:hidden
                });

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

    destroy() {
        if (this.isAnimating) {
            // Cancel ongoing animations
            this.tiles.forEach(tile => {
                tile.remove();
            });
        }
        this.tiles = [];
        this.isAnimating = false;
        if (this.container) {
            this.container.innerHTML = "";
            this.container.style.display = "none";
        }
    }
}
