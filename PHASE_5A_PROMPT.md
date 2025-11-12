# Phase 5A: PWA Manifest & App Icons

**Assignee:** Claude Haiku
**Complexity:** Low
**Estimated Tokens:** 1K
**Prerequisites:** Phase 4 complete (mobile UI components functional)

---

## Task Overview

Create a Progressive Web App (PWA) manifest file and generate app icons to enable the American Mahjong mobile app to be installed on users' home screens. This will make the app feel like a native application on iOS and Android devices.

---

## Deliverables

### 1. PWA Manifest File
**File:** `pwa/manifest.json`

Create a complete PWA manifest with the following specifications:

```json
{
    "name": "American Mahjong",
    "short_name": "Mahjong",
    "description": "American Mahjong game with AI opponents. Play authentic American Mahjong with Charleston, courtesy passes, and smart AI opponents.",
    "start_url": "/mahjong/mobile/",
    "scope": "/mahjong/",
    "display": "standalone",
    "orientation": "portrait-primary",
    "theme_color": "#0c6d3a",
    "background_color": "#0c6d3a",
    "categories": ["games", "entertainment"],
    "icons": [
        {
            "src": "/mahjong/pwa/icons/icon-72.png",
            "sizes": "72x72",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/mahjong/pwa/icons/icon-96.png",
            "sizes": "96x96",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/mahjong/pwa/icons/icon-128.png",
            "sizes": "128x128",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/mahjong/pwa/icons/icon-144.png",
            "sizes": "144x144",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/mahjong/pwa/icons/icon-152.png",
            "sizes": "152x152",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/mahjong/pwa/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/mahjong/pwa/icons/icon-384.png",
            "sizes": "384x384",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/mahjong/pwa/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/mahjong/pwa/icons/icon-maskable-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
        },
        {
            "src": "/mahjong/pwa/icons/icon-maskable-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
        }
    ],
    "shortcuts": [
        {
            "name": "New Game",
            "short_name": "New Game",
            "description": "Start a new game immediately",
            "url": "/mahjong/mobile/?action=new",
            "icons": [
                {
                    "src": "/mahjong/pwa/icons/icon-96.png",
                    "sizes": "96x96"
                }
            ]
        }
    ]
}
```

**Key Requirements:**
- `start_url` and `scope` must match the GitHub Pages deployment path (`/mahjong/`)
- `orientation` locked to `portrait-primary` (mobile is portrait-only)
- `display: standalone` to hide browser UI
- Theme colors match the mahjong table green (`#0c6d3a`)

---

### 2. App Icon Generation

**Source:** Use existing `favicon.svg` (located at project root) as the base design

**Required Icon Sizes:**
Generate PNG icons from `favicon.svg` in the following sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

**Additional Maskable Icons:**
Create "maskable" versions for adaptive icons on Android:
- 192x192 (maskable)
- 512x512 (maskable)

**Maskable Icon Requirements:**
- Add 10% safe zone padding around the existing design
- Ensure all important visual elements are within the safe zone
- Background should extend to full canvas (no transparency in corners)

**Output Location:** `pwa/icons/`

**Naming Convention:**
- Regular icons: `icon-{size}.png` (e.g., `icon-192.png`)
- Maskable icons: `icon-maskable-{size}.png` (e.g., `icon-maskable-512.png`)

**Icon Generation Method:**
You can use one of these approaches:
1. **Automated (Preferred):** Use a tool like `sharp` (Node.js) or ImageMagick to convert SVG to PNG
2. **Manual:** Use an online tool like https://realfavicongenerator.net/ or https://maskable.app/
3. **Code-based:** Write a Node.js script using the `sharp` library

**Example Node.js Script (if using sharp):**
```javascript
// scripts/generate-icons.js
import sharp from 'sharp';
import { readFileSync } from 'fs';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
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
```

---

### 3. Link Manifest in Mobile HTML

**File to Update:** `mobile/index.html` (this file needs to be created as part of mobile integration)

Add the following to the `<head>` section:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/mahjong/pwa/manifest.json">

<!-- iOS-specific meta tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Mahjong">
<link rel="apple-touch-icon" href="/mahjong/pwa/icons/icon-180.png">

<!-- Theme color for browsers -->
<meta name="theme-color" content="#0c6d3a">
```

**Note:** If `mobile/index.html` doesn't exist yet, create a TODO note to add these lines when the file is created.

---

## iOS Considerations

iOS requires special handling for PWA icons:

### Additional Icon for iOS (180x180)
Generate one additional icon specifically for iOS:
- Size: 180x180
- Filename: `icon-180.png`
- Location: `pwa/icons/`

This is the standard iOS home screen icon size and won't be listed in `manifest.json` but will be referenced via `<link rel="apple-touch-icon">`.

---

## Testing Checklist

After implementation, verify:

1. **Manifest Validity:**
   - [ ] Visit https://manifest-validator.appspot.com/ and validate your manifest
   - [ ] All icon paths resolve correctly (check browser DevTools)
   - [ ] `start_url` loads correctly when manifest is installed

2. **Icon Display:**
   - [ ] All icon sizes exist in `pwa/icons/` directory
   - [ ] Icons are properly formatted PNG files
   - [ ] Maskable icons have adequate safe zone (test at https://maskable.app/editor)

3. **Browser DevTools Check:**
   - [ ] Open Chrome DevTools → Application → Manifest
   - [ ] Verify manifest loads without errors
   - [ ] Check that all icons display in preview

4. **Install Prompt (Manual Test):**
   - [ ] Serve the app locally (`npm run dev`)
   - [ ] Open Chrome on mobile (or use DevTools device emulation)
   - [ ] Verify "Install" prompt appears in browser menu
   - [ ] Install the app and verify icon appears on home screen

---

## File Locations Summary

```
pwa/
├── manifest.json                    # NEW - PWA manifest
└── icons/
    ├── icon-72.png                  # NEW - Generated from favicon.svg
    ├── icon-96.png                  # NEW
    ├── icon-128.png                 # NEW
    ├── icon-144.png                 # NEW
    ├── icon-152.png                 # NEW
    ├── icon-180.png                 # NEW - iOS-specific
    ├── icon-192.png                 # NEW
    ├── icon-384.png                 # NEW
    ├── icon-512.png                 # NEW
    ├── icon-maskable-192.png        # NEW - Maskable for Android
    └── icon-maskable-512.png        # NEW - Maskable for Android

mobile/
└── index.html                       # UPDATED - Add manifest link (if exists)
```

---

## Expected Output

When complete, provide:
1. ✅ `pwa/manifest.json` created
2. ✅ 11 icon files generated in `pwa/icons/`
3. ✅ Manifest validation report (screenshot or URL)
4. ✅ Confirmation that icons display correctly in browser DevTools

---

## Resources

- [MDN: Web App Manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable Icons Spec](https://web.dev/maskable-icon/)
- [iOS PWA Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [PWA Builder](https://www.pwabuilder.com/) - Can generate icons and validate manifest

---

## Notes

- The `/mahjong/` path prefix is required because this app deploys to GitHub Pages at `https://username.github.io/mahjong/`
- The manifest will enable the "Add to Home Screen" functionality on both iOS and Android
- Phase 5B will implement the custom install prompt UI (this phase just sets up the manifest infrastructure)
