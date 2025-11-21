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
        container.innerHTML = "";
        exposures.forEach(exposure => {
            const set = document.createElement("div");
            set.className = "exposure-set";
            exposure.tiles.forEach(tile => {
                const tileEl = tileSprites.createTileElement(tile, "small");
                tileEl.classList.add("exposed-tile");
                set.appendChild(tileEl);
            });
            container.appendChild(set);
        });
    }
}
