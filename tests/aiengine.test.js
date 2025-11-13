/**
 * AIEngine Unit Tests
 * Tests the platform-agnostic AI decision engine
 */

import { test, expect } from "@playwright/test";
import { JSDOM } from "jsdom";
import { AIEngine } from "../core/AIEngine.js";
import { TileData } from "../core/models/TileData.js";
import { HandData } from "../core/models/HandData.js";
import { Card } from "../card/card.js";
import { SUIT, PLAYER_OPTION } from "../constants.js";

// Set up jsdom environment for DOM globals (needed by Card class)
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost"
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;

// Helper to create test fixtures
function createTestFixtures(difficulty = "medium") {
    const card = new Card();
    card.init(2025);

    const tableData = {
        players: [
            { hand: new HandData(), exposures: [] },
            { hand: new HandData(), exposures: [] },
            { hand: new HandData(), exposures: [] },
            { hand: new HandData(), exposures: [] }
        ]
    };

    const aiEngine = new AIEngine(card, tableData, difficulty);

    return { aiEngine, card, tableData };
}

test("AIEngine getDifficultyConfig - returns easy config", () => {
    const { aiEngine } = createTestFixtures("easy");
    expect(aiEngine.config.discardRandomness).toBe(0.3);
    expect(aiEngine.config.maxPatterns).toBe(2);
    expect(aiEngine.config.minDiscardable).toBe(5);
});

test("AIEngine getDifficultyConfig - returns medium config", () => {
    const { aiEngine } = createTestFixtures("medium");
    expect(aiEngine.config.discardRandomness).toBe(0.1);
    expect(aiEngine.config.maxPatterns).toBe(5);
    expect(aiEngine.config.minDiscardable).toBe(4);
});

test("AIEngine getDifficultyConfig - returns hard config", () => {
    const { aiEngine } = createTestFixtures("hard");
    expect(aiEngine.config.discardRandomness).toBe(0);
    expect(aiEngine.config.maxPatterns).toBe(999);
    expect(aiEngine.config.minDiscardable).toBe(3);
});

test("AIEngine getDifficultyConfig - defaults to medium for invalid difficulty", () => {
    const { aiEngine } = createTestFixtures("invalid");
    expect(aiEngine.config.discardRandomness).toBe(0.1);
});

test("AIEngine chooseDiscard - returns a TileData object", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    // Create a simple 14-tile hand
    for (let i = 0; i < 14; i++) {
        handData.addTile(new TileData(SUIT.CRACK, (i % 9) + 1, i));
    }

    const discard = aiEngine.chooseDiscard(handData);

    expect(discard.suit).toBeDefined();
    expect(discard.number).toBeDefined();
    expect(handData.tiles.some(t => t.index === discard.index)).toBe(true);
});

test("AIEngine chooseDiscard - never discards jokers", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    // Hand with mostly jokers
    handData.addTile(new TileData(SUIT.JOKER, 0, 0));
    handData.addTile(new TileData(SUIT.JOKER, 0, 1));
    handData.addTile(new TileData(SUIT.JOKER, 0, 2));
    for (let i = 3; i < 14; i++) {
        handData.addTile(new TileData(SUIT.CRACK, 1, i));
    }

    const discard = aiEngine.chooseDiscard(handData);

    expect(discard.suit).not.toBe(SUIT.JOKER);
});

test("AIEngine claimDiscard - returns valid playerOption", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    // Create a simple hand
    for (let i = 0; i < 13; i++) {
        handData.addTile(new TileData(SUIT.CRACK, (i % 9) + 1, i));
    }

    const discardedTile = new TileData(SUIT.CRACK, 1, 13);

    const result = aiEngine.claimDiscard(discardedTile, 1, handData, false);

    expect(result).toHaveProperty("playerOption");
    expect(result).toHaveProperty("tileArray");
    expect([PLAYER_OPTION.MAHJONG, PLAYER_OPTION.DISCARD_TILE, PLAYER_OPTION.EXPOSE_TILES])
        .toContain(result.playerOption);
});

test("AIEngine charlestonPass - returns 3 tiles", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    // Create a 13-tile hand
    for (let i = 0; i < 13; i++) {
        handData.addTile(new TileData(SUIT.CRACK, (i % 9) + 1, i));
    }

    const pass = aiEngine.charlestonPass(handData, "left", 1);

    expect(pass).toHaveLength(3);
    expect(pass[0].suit).toBeDefined();
});

test("AIEngine charlestonPass - never passes jokers", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    // Hand with jokers
    handData.addTile(new TileData(SUIT.JOKER, 0, 0));
    handData.addTile(new TileData(SUIT.JOKER, 0, 1));
    for (let i = 2; i < 13; i++) {
        handData.addTile(new TileData(SUIT.CRACK, 1, i));
    }

    const pass = aiEngine.charlestonPass(handData, "left", 1);

    expect(pass).toHaveLength(3);
    expect(pass.every(tile => tile.suit !== SUIT.JOKER)).toBe(true);
});

test("AIEngine charlestonPass - never passes blanks", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    // Hand with blanks
    handData.addTile(new TileData(SUIT.BLANK, 0, 0));
    for (let i = 1; i < 13; i++) {
        handData.addTile(new TileData(SUIT.CRACK, 1, i));
    }

    const pass = aiEngine.charlestonPass(handData, "left", 1);

    expect(pass).toHaveLength(3);
    expect(pass.every(tile => tile.suit !== SUIT.BLANK)).toBe(true);
});

test("AIEngine courtesyVote - returns a number between 0 and 3", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    // Create a 13-tile hand
    for (let i = 0; i < 13; i++) {
        handData.addTile(new TileData(SUIT.CRACK, (i % 9) + 1, i));
    }

    const vote = aiEngine.courtesyVote(handData);

    expect(vote).toBeGreaterThanOrEqual(0);
    expect(vote).toBeLessThanOrEqual(3);
    expect(Number.isInteger(vote)).toBe(true);
});

test("AIEngine courtesyPass - returns up to maxCount tiles", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    // Create a 13-tile hand
    for (let i = 0; i < 13; i++) {
        handData.addTile(new TileData(SUIT.CRACK, (i % 9) + 1, i));
    }

    const pass = aiEngine.courtesyPass(handData, 2);

    expect(pass.length).toBeLessThanOrEqual(2);
    expect(pass[0].suit).toBeDefined();
});

test("AIEngine courtesyPass - never passes jokers or blanks", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    handData.addTile(new TileData(SUIT.JOKER, 0, 0));
    handData.addTile(new TileData(SUIT.BLANK, 0, 1));
    for (let i = 2; i < 13; i++) {
        handData.addTile(new TileData(SUIT.CRACK, 1, i));
    }

    const pass = aiEngine.courtesyPass(handData, 3);

    expect(pass.every(tile => tile.suit !== SUIT.JOKER && tile.suit !== SUIT.BLANK)).toBe(true);
});

test("AIEngine exchangeTilesForJokers - returns object with correct properties", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    for (let i = 0; i < 14; i++) {
        handData.addTile(new TileData(SUIT.CRACK, 1, i));
    }

    const exposedJokers = [new TileData(SUIT.CRACK, 1, 100)];
    const result = aiEngine.exchangeTilesForJokers(handData, exposedJokers);

    expect(result).toHaveProperty("shouldExchange");
    expect(result).toHaveProperty("tile");
    expect(typeof result.shouldExchange).toBe("boolean");
});

test("AIEngine exchangeTilesForJokers - returns false when no exposed jokers", () => {
    const { aiEngine } = createTestFixtures();
    const handData = new HandData();

    for (let i = 0; i < 14; i++) {
        handData.addTile(new TileData(SUIT.CRACK, 1, i));
    }

    const result = aiEngine.exchangeTilesForJokers(handData, []);

    expect(result.shouldExchange).toBe(false);
    expect(result.tile).toBeNull();
});

test("AIEngine validateComponentForExposure - rejects components with less than 3 tiles", () => {
    const { aiEngine } = createTestFixtures();
    const compInfo = {
        component: { count: 2 },
        tileArray: [
            new TileData(SUIT.CRACK, 1, 0),
            new TileData(SUIT.CRACK, 1, 1)
        ]
    };

    const result = aiEngine.validateComponentForExposure(compInfo);

    expect(result).toBe(false);
});

test("AIEngine validateComponentForExposure - accepts valid pung (3 tiles)", () => {
    const { aiEngine } = createTestFixtures();
    const compInfo = {
        component: { count: 3 },
        tileArray: [
            new TileData(SUIT.CRACK, 1, 0),
            new TileData(SUIT.CRACK, 1, 1),
            new TileData(SUIT.CRACK, 1, 2)
        ]
    };

    const result = aiEngine.validateComponentForExposure(compInfo);

    expect(result).toBe(true);
});

test("AIEngine validateComponentForExposure - accepts valid kong (4 tiles)", () => {
    const { aiEngine } = createTestFixtures();
    const compInfo = {
        component: { count: 4 },
        tileArray: [
            new TileData(SUIT.CRACK, 1, 0),
            new TileData(SUIT.CRACK, 1, 1),
            new TileData(SUIT.CRACK, 1, 2),
            new TileData(SUIT.CRACK, 1, 3)
        ]
    };

    const result = aiEngine.validateComponentForExposure(compInfo);

    expect(result).toBe(true);
});
