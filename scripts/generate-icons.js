// scripts/generate-icons.js
import sharp from 'sharp';
import { readFileSync } from 'fs';

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const svgBuffer = readFileSync('favicon.svg');

for (const size of sizes) {
    await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(`pwa/icons/icon-${size}.png`);
}

// Generate maskable icons with safe zone
for (const size of [192, 512]) {
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
}

console.log('✅ Icons generated successfully');