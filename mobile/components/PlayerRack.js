import { tileSprites } from "../utils/tileSprites.js";

export class PlayerRack {
    constructor(container) {
        this.container = container;
        this.element = null;
        if (container) {
            this.render();
        }
    }

    render() {
        this.element = document.createElement("div");
        this.element.className = "player-rack";
        this.element.innerHTML = `
            <div class="player-rack__exposed"></div>
        `;
        this.container.appendChild(this.element);
    }

    update(handData) {
        if (!this.element || !handData) return;

        const exposedSection = this.element.querySelector(".player-rack__exposed");

        if (handData.exposures && handData.exposures.length > 0) {
            this.renderExposures(handData.exposures, exposedSection);
        } else {
            exposedSection.innerHTML = "";
        }
    }

    renderExposures(exposures, container) {
        // Defensive null/shape checks for container
        if (!container || !container.innerHTML) {
            console.warn("PlayerRack.renderExposures: Invalid container provided");
            return;
        }

        // Clear container
        container.innerHTML = "";

        // Defensive null/shape checks for exposures
        if (!exposures || !Array.isArray(exposures)) {
            console.warn("PlayerRack.renderExposures: Invalid exposures array provided");
            return;
        }

        // Process each exposure with defensive checks
        exposures.forEach((exposure, index) => {
            // Skip null/undefined exposures
            if (!exposure) {
                console.warn(`PlayerRack.renderExposures: Skipping null/undefined exposure at index ${index}`);
                return;
            }

            // Ensure exposure.tiles is an array
            const tiles = Array.isArray(exposure.tiles) ? exposure.tiles : [];
            if (tiles.length === 0) {
                console.warn(`PlayerRack.renderExposures: Empty or invalid tiles array for exposure at index ${index}`);
            }

            const set = document.createElement("div");
            set.className = "exposure-set";

            // Process tiles with defensive check
            tiles.forEach(tile => {
                if (tile) {
                    const tileEl = tileSprites.createTileElement(tile, "small");
                    tileEl.classList.add("exposed-tile");
                    set.appendChild(tileEl);
                }
            });

            // Only append if set has children or tiles were processed
            if (set.children.length > 0) {
                container.appendChild(set);
            }
        });
    }
}
