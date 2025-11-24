import { SUIT, WIND, DRAGON } from "../../constants.js";
import { TileData } from "../../core/models/TileData.js";
import { tileSprites } from "../utils/tileSprites.js";

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
     */
    constructor(container) {
        if (!container) {
            throw new Error("HandRenderer requires a container element");
        }

        this.container = container;
        this.debug = false; // optional verbose logging flag
        this.tiles = [];
        this.interactive = true;
        this.handContainer = null;
        this.exposedSection = null;
        this.currentHandData = null;
        this.currentSortMode = null; // Track explicit sort mode ('suit', 'rank', or null for auto)

        // Dependencies injected via setSelectionManager() and setEventCoordinator()
        this.selectionManager = null;
        this.eventCoordinator = null;

        this.setupDOM();
    }

    /**
     * Inject the selection manager dependency
     * @param {HandSelectionManager} selectionManager
     */
    setSelectionManager(selectionManager) {
        this.selectionManager = selectionManager;
    }

    /**
     * Inject the event coordinator dependency
     * @param {HandEventCoordinator} eventCoordinator
     */
    setEventCoordinator(eventCoordinator) {
        this.eventCoordinator = eventCoordinator;
    }

    /**
     * Render hand data and apply glow to specified tile indices
     * @param {HandData} handData
     * @param {Set|Array} glowIndices - Tile indices to glow
     */
    renderWithGlow(handData, glowIndices) {
        this.render(handData);
        const indices = Array.isArray(glowIndices) ? glowIndices : Array.from(glowIndices || []);
        indices.forEach(index => {
            const tileEl = this.tiles[index];
            if (tileEl) {
                tileEl.classList.add("tile--newly-drawn");
            }
        });
    }

    /**
     * Get tile elements by their indices in the hand
     * @param {Array<number>} indices - Tile indices
     * @returns {Array<HTMLElement>} Array of tile elements
     */
    getTileElementsByIndices(indices) {
        return indices.map(idx => this.tiles[idx]).filter(Boolean);
    }

    /**
     * Temporarily hide tiles by setting visibility to hidden
     * @param {Array<number>} indices - Tile indices to hide
     */
    hideTemporarily(indices) {
        indices.forEach(idx => {
            const tile = this.tiles[idx];
            if (tile) {
                tile.style.visibility = "hidden";
            }
        });
    }

    /**
     * Show tiles and apply animation class
     * @param {Array<number>} indices - Tile indices to show
     * @param {string} animationClass - CSS animation class to apply
     */
    showWithAnimation(indices, animationClass) {
        indices.forEach(idx => {
            const tile = this.tiles[idx];
            if (tile) {
                tile.style.visibility = "visible";
                tile.classList.add(animationClass);
            }
        });
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

        // Only auto-sort by suit if no explicit sort mode is active
        // This prevents overriding user-requested rank sorting
        if (this.currentSortMode === null && handData.sortBySuit) {
            handData.sortBySuit();
        }

        this.currentHandData = handData;
        this.renderExposures(Array.isArray(handData.exposures) ? handData.exposures : []);
        this.clearTiles();

        const tiles = Array.isArray(handData.tiles) ? handData.tiles : [];
        if (this.debug) {
            console.log(`[HandRenderer] Rendering ${tiles.length} tiles`);
        }
        tiles.forEach((tileData, index) => {
            const tileButton = this.createTileButton(tileData, index);

            // Register tile with selection manager using stable selection key
            if (this.selectionManager) {
                const selectionKey = this.getTileSelectionKey(tileData, index);
                this.selectionManager.registerTile(index, selectionKey);
            }

            // Check selection via selectionManager
            if (this.selectionManager?.isSelected(index)) {
                tileButton.classList.add("selected");
            }

            // Apply glow via eventCoordinator
            if (this.eventCoordinator?.newlyDrawnTileIndex === tileData.index) {
                tileButton.classList.add("tile--newly-drawn");
            }

            this.tiles.push(tileButton);
            this.handContainer.appendChild(tileButton);
        });

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
                // Use tileSprites for exposed tiles too
                const exposedTile = document.createElement("div");
                exposedTile.className = "tile tile--small";
                exposedTile.setAttribute("role", "img");

                if (tile) {
                    const pos = tileSprites.getSpritePosition(tile);
                    // Use CSS class for image, only set position
                    exposedTile.style.backgroundPosition = `${pos.xPct}% ${pos.yPct}%`;
                }

                exposedTile.dataset.suit = this.getSuitName(tile?.suit);
                exposedTile.dataset.number = this.getDataNumber(tile);

                const textLabel = this.formatTileText(tile);
                if (textLabel) {
                    exposedTile.setAttribute("aria-label", textLabel);
                }

                // No text content; accessibility handled via aria-label above
                exposureSet.appendChild(exposedTile);
            });

            this.exposedSection.appendChild(exposureSet);
        });
    }

    clearTiles() {
        if (this.debug) {
            console.log(`[HandRenderer] Clearing ${this.tiles.length} tiles from DOM`);
        }
        this.tiles.forEach(tileButton => {
            const handler = tileButton.__handRendererHandler;
            if (handler) {
                tileButton.removeEventListener("click", handler);
                delete tileButton.__handRendererHandler;
            }
        });

        // Reset selection mappings when tiles are cleared so new renders register fresh keys
        if (this.selectionManager) {
            this.selectionManager.clearSelection(true);
            if (this.selectionManager.selectionKeyByIndex?.clear) {
                this.selectionManager.selectionKeyByIndex.clear();
            }
        }

        this.tiles = [];

        if (this.handContainer) {
            this.handContainer.innerHTML = "";
            if (this.debug) {
                console.log(`[HandRenderer] DOM cleared, handContainer.children.length = ${this.handContainer.children.length}`);
            }
        }
    }

    createTileButton(tileData, index) {
        const tileButton = document.createElement("button");
        tileButton.type = "button";
        // Use .tile class for sprite styling
        tileButton.className = "tile tile--default";

        // Apply sprite background position
        if (tileData) {
            const pos = tileSprites.getSpritePosition(tileData);
            tileButton.style.backgroundPosition = `${pos.xPct}% ${pos.yPct}%`;
        }

        tileButton.dataset.suit = this.getSuitName(tileData?.suit);
        tileButton.dataset.number = this.getDataNumber(tileData);
        tileButton.dataset.index = String(index);

        const textLabel = this.formatTileText(tileData);
        if (textLabel) {
            tileButton.setAttribute("aria-label", textLabel);
        }

        // No text content; accessibility handled via aria-label above
        tileButton.disabled = !this.interactive;

        const clickHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!this.interactive) {
                return;
            }

            // Route to selectionManager instead of handleTileClick
            if (this.selectionManager) {
                this.selectionManager.handleTileClick(index);
            }
        };

        tileButton.__handRendererHandler = clickHandler;
        tileButton.addEventListener("click", clickHandler);

        return tileButton;
    }

    getLastTileElement() {
        if (this.tiles && this.tiles.length > 0) {
            return this.tiles[this.tiles.length - 1];
        }
        return null;
    }

    /**
     * Get a tile element by its index in the hand
     * @param {number} index - Index of the tile in the hand array
     * @returns {HTMLElement|null} The tile element or null if not found
     */
    getTileElementByIndex(index) {
        if (this.tiles && index >= 0 && index < this.tiles.length) {
            return this.tiles[index];
        }
        return null;
    }

    /**
     * Apply selection styling to tiles based on selected indices
     * @param {number[]|Set<number>} selectedIndices - Indices that should be marked selected
     */
    applySelectionIndices(selectedIndices = []) {
        const selectedSet = selectedIndices instanceof Set ? selectedIndices : new Set(selectedIndices);
        this.tiles.forEach((tileButton, index) => {
            if (!tileButton) {
                return;
            }
            if (selectedSet.has(index)) {
                tileButton.classList.add("selected");
            } else {
                tileButton.classList.remove("selected");
            }
        });
    }

    sortHand(mode = "suit") {
        if (!this.currentHandData) {
            return;
        }

        // Set the current sort mode to prevent auto-sorting from overriding
        this.currentSortMode = mode;

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
        this.clearTiles();

        if (this.exposedSection) {
            this.exposedSection.innerHTML = "";
        }

        this.container = null;
        this.handContainer = null;
        this.exposedSection = null;
        this.currentHandData = null;
        this.selectionManager = null;
        this.eventCoordinator = null;
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

        const { suit, number } = tile;

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

    cloneHandData(handData) {
        if (!handData) {
            return null;
        }
        if (typeof handData.clone === "function") {
            return handData.clone();
        }

        return {
            tiles: Array.isArray(handData.tiles)
                ? handData.tiles.map(tile => ({ ...tile }))
                : [],
            exposures: Array.isArray(handData.exposures)
                ? handData.exposures.map(exposure => ({
                    type: exposure?.type,
                    tiles: Array.isArray(exposure?.tiles)
                        ? exposure.tiles.map(tile => ({ ...tile }))
                        : []
                }))
                : []
        };
    }

    toTileData(tile) {
        if (!tile) {
            return null;
        }
        if (tile instanceof TileData) {
            return tile.clone();
        }
        return TileData.fromJSON(tile);
    }

    /**
     * Generate a stable selection key for a tile
     * Uses tile.index (unique 0-151) if available, otherwise suit:number:fallback
     * @param {TileData} tile - Tile data
     * @param {number} fallbackIndex - Fallback index if tile.index unavailable
     * @returns {string} Selection key
     */
    getTileSelectionKey(tile, fallbackIndex) {
        if (!tile) {
            return `missing-${fallbackIndex}`;
        }
        if (typeof tile.index === "number" && tile.index >= 0) {
            return `idx-${tile.index}`;
        }
        const suit = tile.suit ?? "unknown";
        const number = tile.number ?? "unknown";
        return `${suit}:${number}:${fallbackIndex}`;
    }
}
