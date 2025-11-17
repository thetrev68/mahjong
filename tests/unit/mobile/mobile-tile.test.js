import { test, expect } from "@playwright/test";
import { JSDOM } from "jsdom";
import { SUIT } from "../../../constants.js";
import { MobileTile } from "../../../mobile/components/MobileTile.js";

// Set up jsdom environment for DOM globals
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost"
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;

// Mock Image constructor
globalThis.Image = class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = "";
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
};

// Mock data for testing
const mockTileData = {
    CRACK_5: { suit: SUIT.CRACK, number: 5, index: 42 },
    BAM_3: { suit: SUIT.BAM, number: 3, index: 10 },
    DOT_7: { suit: SUIT.DOT, number: 7, index: 25 },
    WIND_NORTH: { suit: SUIT.WIND, number: 0, index: 35 },
    WIND_SOUTH: { suit: SUIT.WIND, number: 1, index: 36 },
    WIND_WEST: { suit: SUIT.WIND, number: 2, index: 37 },
    WIND_EAST: { suit: SUIT.WIND, number: 3, index: 38 },
    DRAGON_RED: { suit: SUIT.DRAGON, number: 0, index: 39 },
    DRAGON_GREEN: { suit: SUIT.DRAGON, number: 1, index: 40 },
    DRAGON_WHITE: { suit: SUIT.DRAGON, number: 2, index: 41 },
    JOKER: { suit: SUIT.JOKER, number: 0, index: 43 },
    FLOWER_1: { suit: SUIT.FLOWER, number: 0, index: 44 },
    FLOWER_4: { suit: SUIT.FLOWER, number: 3, index: 47 },
    BLANK: { suit: SUIT.BLANK, number: 0, index: 48 }
};

// Mock sprite data (simplified version of tiles.json structure)
const mockSpriteData = {
    frames: {
        "5C.png": { frame: { x: 676, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "3B.png": { frame: { x: 312, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "7D.png": { frame: { x: 1040, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "N.png": { frame: { x: 1872, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "S.png": { frame: { x: 1924, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "W.png": { frame: { x: 1976, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "E.png": { frame: { x: 1560, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "DB.png": { frame: { x: 1404, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "DC.png": { frame: { x: 1456, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "DD.png": { frame: { x: 1508, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "J.png": { frame: { x: 1820, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "F1.png": { frame: { x: 1612, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } },
        "F4.png": { frame: { x: 1768, y: 0, w: 52, h: 69 }, sourceSize: { w: 52, h: 69 } }
    },
    meta: {
        size: { w: 2028, h: 69 }
    }
};

test.describe("MobileTile", () => {
    test.beforeEach(() => {
        // Reset static properties before each test
        MobileTile.spritePath = null;
        MobileTile.spriteData = null;
        MobileTile.isLoaded = false;
    });

    test.describe("Static Methods", () => {
        test("should load sprite data correctly", async () => {
            await MobileTile.loadSprites("../assets/tiles.png", mockSpriteData);
            
            expect(MobileTile.isLoaded).toBe(true);
            expect(MobileTile.spritePath).toBe("../assets/tiles.png");
            expect(MobileTile.spriteData).toBeDefined();
            expect(MobileTile.spriteData.frames["5C.png"]).toBeDefined();
            expect(MobileTile.spriteData.frames["5C.png"].frame.x).toBe(676);
        });

        test("should handle sprite load failure gracefully", async () => {
            const invalidData = { frames: {}, meta: { size: { w: 0, h: 0 } } };

            // Mock Image constructor to simulate load failure
            const originalImage = globalThis.Image;
            globalThis.Image = class FailingImage {
                constructor() {
                    this.onload = null;
                    this.onerror = null;
                    this.src = "";
                    setTimeout(() => {
                        if (this.onerror) this.onerror();
                    }, 10);
                }
            };

            try {
                await expect(MobileTile.loadSprites("invalid.png", invalidData))
                    .rejects.toThrow("Sprite sheet load failed");
            } finally {
                globalThis.Image = originalImage;
            }
        });
    });

    test.describe("Constructor", () => {
        test("should create tile with default options", () => {
            const tile = new MobileTile(mockTileData.CRACK_5);
            
            expect(tile.tileData).toEqual(mockTileData.CRACK_5);
            expect(tile.options.width).toBe(45);
            expect(tile.options.height).toBe(60);
            expect(tile.options.state).toBe("normal");
            expect(tile.options.useSprites).toBe(true);
            expect(tile.currentState).toBe("normal");
        });

        test("should create tile with custom options", () => {
            const tile = new MobileTile(mockTileData.BAM_3, {
                width: 32,
                height: 42,
                state: "selected",
                useSprites: false
            });
            
            expect(tile.options.width).toBe(32);
            expect(tile.options.height).toBe(42);
            expect(tile.options.state).toBe("selected");
            expect(tile.options.useSprites).toBe(false);
        });
    });

    test.describe("Element Creation", () => {
        test("should create tile element with correct attributes", () => {
            const tile = MobileTile.createHandTile(mockTileData.CRACK_5);
            const element = tile.createElement();
            
            expect(element.tagName).toBe("BUTTON");
            expect(element.className).toBe("mobile-tile");
            expect(element.dataset.suit).toBe(String(SUIT.CRACK));
            expect(element.dataset.number).toBe("5");
            expect(element.dataset.index).toBe("42");
            expect(element.style.width).toBe("45px");
            expect(element.style.height).toBe("60px");
        });

        test("should use sprites when loaded", async () => {
            await MobileTile.loadSprites("../assets/tiles.png", mockSpriteData);
            const tile = MobileTile.createHandTile(mockTileData.CRACK_5);
            const element = tile.createElement();
            
            expect(element.style.backgroundImage).toContain("tiles.png");
            expect(element.style.backgroundPosition).toBe("-676px 0px");
            expect(element.style.backgroundSize).toContain("2028px");
        });

        test("should fallback to text when sprites not loaded", () => {
            MobileTile.isLoaded = false;
            const tile = new MobileTile(mockTileData.CRACK_5, { useSprites: true });
            const element = tile.createElement();
            
            expect(element.textContent).toBe("5C");
            expect(element.style.backgroundImage).toBe("");
        });

        test("should use text when useSprites is false", () => {
            MobileTile.isLoaded = true;
            const tile = new MobileTile(mockTileData.BAM_3, { useSprites: false });
            const element = tile.createElement();
            
            expect(element.textContent).toBe("3B");
            expect(element.style.backgroundImage).toBe("");
        });
    });

    test.describe("State Management", () => {
        test("should apply state classes correctly", () => {
            const tile = MobileTile.createHandTile(mockTileData.DOT_7);
            const element = tile.createElement();
            
            // Initial state should be 'normal'
            expect(element.classList.contains("mobile-tile--selected")).toBe(false);
            expect(element.classList.contains("mobile-tile--disabled")).toBe(false);
            expect(element.classList.contains("mobile-tile--highlighted")).toBe(false);
            
            // Test selected state
            tile.setState("selected");
            expect(element.classList.contains("mobile-tile--selected")).toBe(true);
            expect(element.classList.contains("mobile-tile--disabled")).toBe(false);
            expect(element.classList.contains("mobile-tile--highlighted")).toBe(false);
            
            // Test disabled state
            tile.setState("disabled");
            expect(element.classList.contains("mobile-tile--selected")).toBe(false);
            expect(element.classList.contains("mobile-tile--disabled")).toBe(true);
            expect(element.classList.contains("mobile-tile--highlighted")).toBe(false);
            
            // Test highlighted state
            tile.setState("highlighted");
            expect(element.classList.contains("mobile-tile--selected")).toBe(false);
            expect(element.classList.contains("mobile-tile--disabled")).toBe(false);
            expect(element.classList.contains("mobile-tile--highlighted")).toBe(true);
            
            // Test normal state
            tile.setState("normal");
            expect(element.classList.contains("mobile-tile--selected")).toBe(false);
            expect(element.classList.contains("mobile-tile--disabled")).toBe(false);
            expect(element.classList.contains("mobile-tile--highlighted")).toBe(false);
        });

        test("should handle setState before element creation", () => {
            const tile = new MobileTile(mockTileData.JOKER);
            
            // Should not throw error
            expect(() => tile.setState("selected")).not.toThrow();
            expect(tile.currentState).toBe("selected");
            
            // State should be applied when element is created
            const element = tile.createElement();
            expect(element.classList.contains("mobile-tile--selected")).toBe(true);
        });
    });

    test.describe("Sprite Frame Names", () => {
        test("should generate correct sprite frame names for all suits", () => {
            const tile = new MobileTile(mockTileData.CRACK_5);
            expect(tile.getSpriteFrameName()).toBe("5C.png");
            
            const tile2 = new MobileTile(mockTileData.BAM_3);
            expect(tile2.getSpriteFrameName()).toBe("3B.png");
            
            const tile3 = new MobileTile(mockTileData.DOT_7);
            expect(tile3.getSpriteFrameName()).toBe("7D.png");
            
            const tile4 = new MobileTile(mockTileData.JOKER);
            expect(tile4.getSpriteFrameName()).toBe("J.png");
        });

        test("should generate correct sprite frame names for winds", () => {
            const tile = new MobileTile(mockTileData.WIND_NORTH);
            expect(tile.getSpriteFrameName()).toBe("N.png");
            
            const tile2 = new MobileTile(mockTileData.WIND_SOUTH);
            expect(tile2.getSpriteFrameName()).toBe("S.png");
            
            const tile3 = new MobileTile(mockTileData.WIND_WEST);
            expect(tile3.getSpriteFrameName()).toBe("W.png");
            
            const tile4 = new MobileTile(mockTileData.WIND_EAST);
            expect(tile4.getSpriteFrameName()).toBe("E.png");
        });

        test("should generate correct sprite frame names for dragons", () => {
            const tile = new MobileTile(mockTileData.DRAGON_RED);
            expect(tile.getSpriteFrameName()).toBe("DB.png");
            
            const tile2 = new MobileTile(mockTileData.DRAGON_GREEN);
            expect(tile2.getSpriteFrameName()).toBe("DC.png");
            
            const tile3 = new MobileTile(mockTileData.DRAGON_WHITE);
            expect(tile3.getSpriteFrameName()).toBe("DD.png");
        });

        test("should generate correct sprite frame names for flowers", () => {
            const tile = new MobileTile(mockTileData.FLOWER_1);
            expect(tile.getSpriteFrameName()).toBe("F1.png");
            
            const tile2 = new MobileTile(mockTileData.FLOWER_4);
            expect(tile2.getSpriteFrameName()).toBe("F4.png");
        });

        test("should handle unknown suit gracefully", () => {
            const unknownTile = { suit: 999, number: 0, index: 0 };
            const tile = new MobileTile(unknownTile);
            const frameName = tile.getSpriteFrameName();
            
            expect(frameName).toBe("blank.png");
        });
    });

    test.describe("Text Fallback", () => {
        test("should generate correct text for all suits", () => {
            expect(new MobileTile(mockTileData.CRACK_5).getTileText()).toBe("5C");
            expect(new MobileTile(mockTileData.BAM_3).getTileText()).toBe("3B");
            expect(new MobileTile(mockTileData.DOT_7).getTileText()).toBe("7D");
            expect(new MobileTile(mockTileData.JOKER).getTileText()).toBe("J");
        });

        test("should generate correct text for winds", () => {
            expect(new MobileTile(mockTileData.WIND_NORTH).getTileText()).toBe("N");
            expect(new MobileTile(mockTileData.WIND_SOUTH).getTileText()).toBe("S");
            expect(new MobileTile(mockTileData.WIND_WEST).getTileText()).toBe("W");
            expect(new MobileTile(mockTileData.WIND_EAST).getTileText()).toBe("E");
        });

        test("should generate correct text for dragons", () => {
            expect(new MobileTile(mockTileData.DRAGON_RED).getTileText()).toBe("R");
            expect(new MobileTile(mockTileData.DRAGON_GREEN).getTileText()).toBe("G");
            expect(new MobileTile(mockTileData.DRAGON_WHITE).getTileText()).toBe("W");
        });

        test("should generate correct text for flowers", () => {
            expect(new MobileTile(mockTileData.FLOWER_1).getTileText()).toBe("F1");
            expect(new MobileTile(mockTileData.FLOWER_4).getTileText()).toBe("F4");
        });

        test("should handle unknown suit in text fallback", () => {
            const unknownTile = { suit: 999, number: 0, index: 0 };
            const tile = new MobileTile(unknownTile);
            expect(tile.getTileText()).toBe("?");
        });
    });

    test.describe("Factory Methods", () => {
        test("should create hand tiles with correct dimensions", () => {
            const tile = MobileTile.createHandTile(mockTileData.CRACK_5);
            expect(tile.options.width).toBe(45);
            expect(tile.options.height).toBe(60);
            expect(tile.options.useSprites).toBe(false); // Should be false initially
        });

        test("should create exposed tiles with correct dimensions", () => {
            const tile = MobileTile.createExposedTile(mockTileData.BAM_3);
            expect(tile.options.width).toBe(32);
            expect(tile.options.height).toBe(42);
            expect(tile.options.useSprites).toBe(false);
        });

        test("should create discard tiles with correct dimensions", () => {
            const tile = MobileTile.createDiscardTile(mockTileData.DOT_7);
            expect(tile.options.width).toBe(32);
            expect(tile.options.height).toBe(42);
            expect(tile.options.useSprites).toBe(false);
        });

        test("should enable sprites after loading", async () => {
            await MobileTile.loadSprites("../assets/tiles.png", mockSpriteData);
            const tile = MobileTile.createHandTile(mockTileData.JOKER);
            expect(tile.options.useSprites).toBe(true);
        });
    });

    test.describe("Scale Calculation", () => {
        test("should calculate scale correctly", () => {
            const tile = new MobileTile(mockTileData.CRACK_5, { width: 45 });
            expect(tile.getScale()).toBeCloseTo(45 / 52, 2); // ~0.865
            
            const tile2 = new MobileTile(mockTileData.BAM_3, { width: 32 });
            expect(tile2.getScale()).toBeCloseTo(32 / 52, 2); // ~0.615
        });
    });

    test.describe("Data Access", () => {
        test("should return tile data correctly", () => {
            const tile = new MobileTile(mockTileData.CRACK_5);
            const data = tile.getData();
            expect(data).toEqual(mockTileData.CRACK_5);
            expect(data).toBe(tile.tileData); // Returns the same reference
        });
    });

    test.describe("Lifecycle", () => {
        test("should destroy tile and clean up DOM", () => {
            const tile = MobileTile.createHandTile(mockTileData.CRACK_5);
            const element = tile.createElement();

            // Append to DOM to test parentNode assertion
            document.body.appendChild(element);

            // Verify element is created and in DOM
            expect(element.parentNode).toBeTruthy();
            expect(tile.element).toBe(element);

            // Destroy should remove element from DOM
            tile.destroy();
            expect(tile.element).toBeNull();
        });

        test("should handle destroy when not in DOM", () => {
            const tile = new MobileTile(mockTileData.CRACK_5);
            expect(() => tile.destroy()).not.toThrow();
        });

        test("should handle destroy before element creation", () => {
            const tile = new MobileTile(mockTileData.CRACK_5);
            expect(() => tile.destroy()).not.toThrow();
        });
    });

    test.describe("Edge Cases", () => {
        test("should handle missing sprite frame gracefully", async () => {
            await MobileTile.loadSprites("../assets/tiles.png", { frames: {}, meta: { size: { w: 0, h: 0 } } });
            const tile = new MobileTile(mockTileData.CRACK_5);
            const element = tile.createElement();
            
            // Should fallback to text and log warning
            expect(element.textContent).toBe("5C");
        });

        test("should handle invalid tile data", () => {
            const invalidTile = { suit: null, number: NaN, index: undefined };
            const tile = new MobileTile(invalidTile);
            
            expect(() => tile.getSpriteFrameName()).not.toThrow();
            expect(() => tile.getTileText()).not.toThrow();
        });
    });
});