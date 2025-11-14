/* eslint-env node */
/* global process */
/* eslint-disable no-await-in-loop */

// scripts/generate-icons.js
import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync } from "fs";

// Validate input
if (!existsSync("favicon.svg")) {
    console.error("❌ Error: favicon.svg not found");
    process.exit(1);
}

// Ensure output directory exists
if (!existsSync("pwa/icons")) {
    mkdirSync("pwa/icons", { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
let svgBuffer;
try {
    svgBuffer = readFileSync("favicon.svg");
} catch (err) {
    console.error("❌ Error reading favicon.svg:", err.message);
    process.exit(1);
}

for (const size of sizes) {
    try {
        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(`pwa/icons/icon-${size}.png`);
    } catch (err) {
        console.error(`❌ Error generating icon-${size}.png:`, err.message);
        process.exit(1);
    }
}

// Generate maskable icons with safe zone
for (const size of [192, 512]) {
    try {
        const canvas = sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 12, g: 109, b: 58, alpha: 1 } // #0c6d3a
            }
        });

        const iconSize = Math.floor(size * 0.8); // 80% of canvas (20% safe zone)
        const offset = Math.floor((size - iconSize) / 2);

        const icon = await sharp(svgBuffer)
            .resize(iconSize, iconSize)
            .png()
            .toBuffer();

        await canvas
            .composite([{ input: icon, top: offset, left: offset }])
            .png()
            .toFile(`pwa/icons/icon-maskable-${size}.png`);
    } catch (err) {
        console.error(`❌ Error generating maskable icon for size ${size}:`, err.message);
    }
}

console.log("✅ Icons generated successfully");