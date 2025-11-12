/**
 * Test suite for Phase 1A data models
 * Validates TileData, HandData, and PlayerData
 * @type {NodeJS.Process} process - Node.js process object for exit codes
 */

/* eslint-disable no-undef */

import {TileData} from "./TileData.js";
import {HandData, ExposureData} from "./HandData.js";
import {PlayerData} from "./PlayerData.js";
import {SUIT, PLAYER} from "../../constants.js";

console.log("🧪 Starting Phase 1A Data Models Validation\n");

let passCount = 0;
let failCount = 0;

function test(name, assertion, message) {
    try {
        console.assert(assertion, message);
        if (assertion) {
            console.log(`✅ ${name}`);
            passCount++;
        } else {
            console.log(`❌ ${name}: ${message}`);
            failCount++;
        }
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        failCount++;
    }
}

// ============================================================================
// TILEDATA TESTS
// ============================================================================
console.log("📌 TileData Tests\n");

// Test 1: Basic creation and getText()
const tile = new TileData(SUIT.CRACK, 5, 0);
test("TileData getText() - Crack 5", tile.getText() === "Crack 5", "getText() failed");

// Test 2: equals() ignores index
const tile1 = new TileData(SUIT.CRACK, 5, 0);
const tile2 = new TileData(SUIT.CRACK, 5, 1);
test("TileData equals() - same suit/number", tile1.equals(tile2) === true, "equals() should be true");
test("TileData isSameTile() - different index", tile1.isSameTile(tile2) === false, "isSameTile() should be false");

// Test 3: clone() creates independent copy
const original = new TileData(SUIT.BAM, 3, 10);
const clonedTile = original.clone();
clonedTile.suit = SUIT.DOT;
test("TileData clone() - doesn't affect original", original.suit === SUIT.BAM, "clone() should not affect original");

// Test 4: Type checks
const joker = new TileData(SUIT.JOKER, 0, 50);
test("TileData isJoker()", joker.isJoker() === true, "isJoker() failed");

const wind = new TileData(SUIT.WIND, 0, 100);
test("TileData isWind()", wind.isWind() === true, "isWind() failed");

const dragon = new TileData(SUIT.DRAGON, 0, 110);
test("TileData isDragon()", dragon.isDragon() === true, "isDragon() failed");

const blank = new TileData(SUIT.BLANK, 0, 120);
test("TileData isBlank()", blank.isBlank() === true, "isBlank() failed");

const flower = new TileData(SUIT.FLOWER, 1, 130);
test("TileData isFlower()", flower.isFlower() === true, "isFlower() failed");

const numberedTile = new TileData(SUIT.DOT, 7, 140);
test("TileData isNumberedSuit()", numberedTile.isNumberedSuit() === true, "isNumberedSuit() failed");

const invalidTile = new TileData(SUIT.INVALID, 0, 150);
test("TileData isInvalid()", invalidTile.isInvalid() === true, "isInvalid() failed");

// Test 5: JSON serialization
const tile3 = new TileData(SUIT.DOT, 7, 42);
const json = tile3.toJSON();
const restored = TileData.fromJSON(json);
test("TileData JSON roundtrip - equals", restored.equals(tile3), "equals after roundtrip failed");
test("TileData JSON roundtrip - isSameTile", restored.isSameTile(tile3), "isSameTile after roundtrip failed");

// ============================================================================
// HANDDATA TESTS
// ============================================================================
console.log("\n📌 HandData Tests\n");

// Test 1: Add/remove tiles
const hand = new HandData();
const htile1 = new TileData(SUIT.CRACK, 1, 0);
const htile2 = new TileData(SUIT.CRACK, 2, 1);
hand.addTile(htile1);
hand.addTile(htile2);
test("HandData getLength() - 2 tiles", hand.getLength() === 2, "getLength() failed");
test("HandData hasTile()", hand.hasTile(htile1) === true, "hasTile() failed");

hand.removeTile(htile1);
test("HandData removeTile()", hand.getLength() === 1, "removeTile() failed");

// Test 2: Count tiles
hand.addTile(new TileData(SUIT.BAM, 5, 10));
hand.addTile(new TileData(SUIT.BAM, 5, 11));
test("HandData countTile()", hand.countTile(SUIT.BAM, 5) === 2, "countTile() failed");

// Test 3: Exposures
const exposure = new ExposureData();
exposure.type = "PUNG";
exposure.tiles = [
    new TileData(SUIT.DOT, 3, 20),
    new TileData(SUIT.DOT, 3, 21),
    new TileData(SUIT.DOT, 3, 22)
];
hand.addExposure(exposure);
test("HandData getLength() with exposure", hand.getLength() === 6, "Exposure not counted in length"); // 3 hidden + 3 exposed

// Test 4: Sorting
const hand2 = new HandData();
hand2.addTile(new TileData(SUIT.DOT, 5, 0));
hand2.addTile(new TileData(SUIT.CRACK, 2, 1));
hand2.addTile(new TileData(SUIT.BAM, 9, 2));
hand2.sortBySuit();
test("HandData sortBySuit()", hand2.tiles[0].suit === SUIT.CRACK, "sortBySuit() failed");

// Test 5: getHiddenCount
test("HandData getHiddenCount()", hand.getHiddenCount() === 3, "getHiddenCount() failed");

// Test 6: Clone
const clonedHand = hand.clone();
clonedHand.addTile(new TileData(SUIT.JOKER, 0, 100));
test("HandData clone() - doesn't affect original", hand.getLength() === 6 && clonedHand.getLength() === 7, "clone() not independent");

// Test 7: JSON serialization
const json2 = hand.toJSON();
const restored2 = HandData.fromJSON(json2);
test("HandData JSON roundtrip - length", restored2.getLength() === hand.getLength(), "JSON roundtrip failed");
test("HandData JSON roundtrip - exposures", restored2.exposures.length === hand.exposures.length, "JSON roundtrip exposures failed");

// Test ExposureData
const expClone = exposure.clone();
expClone.type = "KONG";
test("ExposureData clone() - doesn't affect original", exposure.type === "PUNG", "ExposureData clone() not independent");

const expJson = exposure.toJSON();
const expRestored = ExposureData.fromJSON(expJson);
test("ExposureData JSON roundtrip", expRestored.type === exposure.type && expRestored.tiles.length === exposure.tiles.length, "ExposureData JSON roundtrip failed");

// ============================================================================
// PLAYERDATA TESTS
// ============================================================================
console.log("\n📌 PlayerData Tests\n");

// Test 1: Default names
const player0 = new PlayerData(PLAYER.BOTTOM);
const player1 = new PlayerData(PLAYER.RIGHT);
test("PlayerData default name - You", player0.name === "You", "Default name for human failed");
test("PlayerData default name - Opponent 1", player1.name === "Opponent 1", "Default name for AI failed");
test("PlayerData isHuman - true for BOTTOM", player0.isHuman === true, "isHuman should be true for BOTTOM");
test("PlayerData isHuman - false for others", player1.isHuman === false, "isHuman should be false for others");

// Test 2: Hand integration
test("PlayerData hand is HandData", player0.hand instanceof HandData, "hand should be HandData instance");
test("PlayerData new hand is empty", player0.hand.getLength() === 0, "New player should have empty hand");

// Test 3: Wind assignment
player0.wind = "E";
test("PlayerData wind assignment", player0.wind === "E", "Wind assignment failed");

// Test 4: Clone
const clonedPlayer = player0.clone();
clonedPlayer.name = "Modified";
test("PlayerData clone() - doesn't affect original", player0.name === "You", "Clone should not affect original");

// Test 5: JSON serialization
const json3 = player0.toJSON();
const restored3 = PlayerData.fromJSON(json3);
test("PlayerData JSON roundtrip - position", restored3.position === player0.position, "JSON roundtrip position failed");
test("PlayerData JSON roundtrip - name", restored3.name === player0.name, "JSON roundtrip name failed");
test("PlayerData JSON roundtrip - wind", restored3.wind === player0.wind, "JSON roundtrip wind failed");

// Test custom name
const customPlayer = new PlayerData(PLAYER.TOP, "Alice");
test("PlayerData custom name", customPlayer.name === "Alice", "Custom name failed");

// ============================================================================
// SUMMARY
// ============================================================================
console.log("\n" + "=".repeat(50));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log("=".repeat(50));

if (failCount > 0) {
    process.exit(1);
} else {
    console.log("\n🎉 All tests passed! Phase 1A validation complete.");
    process.exit(0);
}
