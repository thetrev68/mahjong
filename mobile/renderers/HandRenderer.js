import {SUIT, WIND, DRAGON} from "../../constants.js";

const SUIT_NAMES = {
    [SUIT.CRACK]: "CRACK",
    [SUIT.BAM]: "BAM",
    [SUIT.DOT]: "DOT",
    [SUIT.WIND]: "WIND",
    [SUIT.DRAGON]: "DRAGON",
    [SUIT.FLOWER]: "FLOWER",
    [SUIT.JOKER]: "JOKER",
    [SUIT.BLANK]: "BLANK"
};

const WIND_TEXT = {
    [WIND.NORTH]: "N",
    [WIND.SOUTH]: "S",
    [WIND.WEST]: "W",
    [WIND.EAST]: "E"
};

const DRAGON_TEXT = {
    [DRAGON.RED]: "R",
    [DRAGON.GREEN]: "G",
    [DRAGON.WHITE]: "0"
};

export class HandRenderer {
    /**
     * @param {HTMLElement} container
     * @param {GameController} gameController
     */
    constructor(container, gameController) {
        if (!container) {
            throw new Error("HandRenderer requires a container element");
        }

        this.container = container;
        this.gameController = gameController;
        this.tiles = [];
        this.selectedIndices = new Set();
        this.selectionKeyByIndex = new Map();
        this.unsubscribeFns = [];
        this.interactive = true;
        this.handContainer = null;
        this.exposedSection = null;
        this.currentHandData = null;

        this.setupDOM();
        this.setupEventListeners();
    }

    setupDOM() {
        this.container.innerHTML = "";
        this.container.classList.add("hand-section");

        this.exposedSection = document.createElement("div");
        this.exposedSection.className = "exposed-section";
        this.container.appendChild(this.exposedSection);

        this.handContainer = document.createElement("div");
        this.handContainer.className = "hand-container hand-grid";
        this.container.appendChild(this.handContainer);
    }

    setupEventListeners() {
        if (!this.gameController || typeof this.gameController.on !== "function") {
            return;
        }

        const handleHandUpdated = (data = {}) => {
            if (data.player === 0) {
                this.render(data.hand);
            }
        };
        this.unsubscribeFns.push(this.gameController.on("HAND_UPDATED", handleHandUpdated));

        const handleTileSelected = (data = {}) => {
            if (typeof data.index === "number") {
                this.selectTile(data.index, {
                    toggle: data.toggle !== false,
                    clearOthers: !!data.exclusive,
                    state: data.state
                });
                return;
            }

            if (Array.isArray(data.indices)) {
                if (data.clearExisting) {
                    this.clearSelection();
                }
                data.indices.forEach(index => {
                    if (typeof index === "number") {
                        this.selectTile(index, {state: data.state ?? "on", toggle: false});
                    }
                });
            }
        };
        this.unsubscribeFns.push(this.gameController.on("TILE_SELECTED", handleTileSelected));
    }

    /**
     * @param {HandData} handData
     */
    render(handData) {
        if (!handData) {
            this.renderExposures([]);
            this.clearTiles();
            this.currentHandData = null;
            return;
        }

        this.currentHandData = handData;
        this.renderExposures(Array.isArray(handData.exposures) ? handData.exposures : []);
        this.clearTiles();

        const preservedSelections = new Set();
        this.selectionKeyByIndex.clear();

        const tiles = Array.isArray(handData.tiles) ? handData.tiles : [];
        tiles.forEach((tileData, index) => {
            const selectionKey = this.getTileSelectionKey(tileData, index);
            this.selectionKeyByIndex.set(index, selectionKey);

            const tileButton = this.createTileButton(tileData, index, selectionKey);
            if (this.selectedIndices.has(selectionKey)) {
                tileButton.classList.add("selected");
                preservedSelections.add(selectionKey);
            }

            this.tiles.push(tileButton);
            this.handContainer.appendChild(tileButton);
        });

        this.selectedIndices = preservedSelections;
        this.setInteractive(this.interactive);
    }

    renderExposures(exposures) {
        if (!this.exposedSection) {
            return;
        }

        this.exposedSection.innerHTML = "";

        if (!Array.isArray(exposures) || exposures.length === 0) {
            return;
        }

        exposures.forEach(exposure => {
            if (!exposure || !Array.isArray(exposure.tiles)) {
                return;
            }

            const exposureSet = document.createElement("div");
            exposureSet.className = "exposure-set";
            if (exposure.type) {
                exposureSet.dataset.type = exposure.type;
            }

            exposure.tiles.forEach(tile => {
                const exposedTile = document.createElement("button");
                exposedTile.type = "button";
                exposedTile.className = "exposed-tile";
                exposedTile.dataset.suit = this.getSuitName(tile?.suit);
                exposedTile.dataset.number = this.getDataNumber(tile);
                exposedTile.textContent = this.formatTileText(tile);
                exposureSet.appendChild(exposedTile);
            });

            this.exposedSection.appendChild(exposureSet);
        });
    }

    clearTiles() {
        this.tiles.forEach(tileButton => {
            const handler = tileButton.__handRendererHandler;
            if (handler) {
                tileButton.removeEventListener("click", handler);
                delete tileButton.__handRendererHandler;
            }
        });

        this.tiles = [];
        this.selectionKeyByIndex.clear();

        if (this.handContainer) {
            this.handContainer.innerHTML = "";
        }
    }

    createTileButton(tileData, index, selectionKey) {
        const tileButton = document.createElement("button");
        tileButton.type = "button";
        tileButton.className = "tile-btn";
        tileButton.dataset.suit = this.getSuitName(tileData?.suit);
        tileButton.dataset.number = this.getDataNumber(tileData);
        tileButton.dataset.selectionKey = selectionKey;
        tileButton.textContent = this.formatTileText(tileData);
        tileButton.disabled = !this.interactive;

        const clickHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!this.interactive) {
                return;
            }
            this.selectTile(index);
        };

        tileButton.__handRendererHandler = clickHandler;
        tileButton.addEventListener("click", clickHandler);

        return tileButton;
    }

    selectTile(index, options = {}) {
        const button = this.tiles[index];
        if (!button) {
            return;
        }

        const selectionKey = this.selectionKeyByIndex.get(index);
        if (!selectionKey) {
            return;
        }

        const {state, toggle = true, clearOthers = false} = options;

        if (clearOthers) {
            this.clearSelection();
        }

        let shouldSelect;
        if (state === "on") {
            shouldSelect = true;
        } else if (state === "off") {
            shouldSelect = false;
        } else if (!toggle) {
            shouldSelect = true;
        } else {
            shouldSelect = !this.selectedIndices.has(selectionKey);
        }

        if (shouldSelect) {
            this.selectedIndices.add(selectionKey);
            button.classList.add("selected");
        } else {
            this.selectedIndices.delete(selectionKey);
            button.classList.remove("selected");
        }
    }

    clearSelection() {
        this.selectedIndices.clear();
        this.tiles.forEach(tileButton => tileButton.classList.remove("selected"));
    }

    sortHand(mode = "suit") {
        if (!this.currentHandData) {
            return;
        }

        if (typeof this.gameController?.sortHand === "function") {
            this.gameController.sortHand(0, mode);
            return;
        }

        const handCopy = this.cloneHandData(this.currentHandData);
        if (!handCopy) {
            return;
        }

        if (mode === "rank") {
            if (typeof handCopy.sortByRank === "function") {
                handCopy.sortByRank();
            } else if (Array.isArray(handCopy.tiles)) {
                handCopy.tiles.sort((a, b) => {
                    if (a.number !== b.number) {
                        return a.number - b.number;
                    }
                    return a.suit - b.suit;
                });
            }
        } else {
            if (typeof handCopy.sortBySuit === "function") {
                handCopy.sortBySuit();
            } else if (Array.isArray(handCopy.tiles)) {
                handCopy.tiles.sort((a, b) => {
                    if (a.suit !== b.suit) {
                        return a.suit - b.suit;
                    }
                    return a.number - b.number;
                });
            }
        }

        this.render(handCopy);
    }

    setInteractive(enabled) {
        this.interactive = !!enabled;
        this.tiles.forEach(tileButton => {
            tileButton.disabled = !this.interactive;
        });
    }

    destroy() {
        this.unsubscribeFns.forEach(unsub => {
            if (typeof unsub === "function") {
                unsub();
            }
        });
        this.unsubscribeFns = [];

        this.clearTiles();
        this.clearSelection();

        if (this.exposedSection) {
            this.exposedSection.innerHTML = "";
        }

        this.container = null;
        this.gameController = null;
        this.handContainer = null;
        this.exposedSection = null;
        this.currentHandData = null;
    }

    getSuitName(suit) {
        return SUIT_NAMES[suit] || "UNKNOWN";
    }

    getDataNumber(tile) {
        if (!tile || typeof tile.number === "undefined") {
            return "";
        }
        return String(tile.number);
    }

    formatTileText(tile) {
        if (!tile) {
            return "";
        }

        const {suit, number} = tile;

        if (suit === SUIT.CRACK) {
            return `${number}C`;
        }
        if (suit === SUIT.BAM) {
            return `${number}B`;
        }
        if (suit === SUIT.DOT) {
            return `${number}D`;
        }
        if (suit === SUIT.WIND) {
            return WIND_TEXT[number] || "";
        }
        if (suit === SUIT.DRAGON) {
            return DRAGON_TEXT[number] || "D";
        }
        if (suit === SUIT.FLOWER) {
            return `F${(typeof number === "number" ? number + 1 : 1)}`;
        }
        if (suit === SUIT.JOKER) {
            return "J";
        }
        if (suit === SUIT.BLANK) {
            return "BL";
        }

        return `${number ?? ""}`;
    }

    getTileSelectionKey(tile, fallbackIndex) {
        if (!tile) {
            return `missing-${fallbackIndex}`;
        }
        if (typeof tile.index === "number" && tile.index >= 0) {
            return `idx-${tile.index}`;
        }
        return `${tile.suit}:${tile.number}:${fallbackIndex}`;
    }

    cloneHandData(handData) {
        if (!handData) {
            return null;
        }
        if (typeof handData.clone === "function") {
            return handData.clone();
        }

        return {
            tiles: Array.isArray(handData.tiles)
                ? handData.tiles.map(tile => ({...tile}))
                : [],
            exposures: Array.isArray(handData.exposures)
                ? handData.exposures.map(exposure => ({
                    type: exposure?.type,
                    tiles: Array.isArray(exposure?.tiles)
                        ? exposure.tiles.map(tile => ({...tile}))
                        : []
                }))
                : []
        };
    }
}
