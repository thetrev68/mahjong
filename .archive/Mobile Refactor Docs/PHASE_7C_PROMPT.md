# Phase 7C Implementation Prompt: Performance Optimization

**Assignee:** Grok X1 Fast
**Complexity:** Medium
**Estimated Tokens:** 6K
**Dependencies:** Phases 1-6 (all features complete)
**Status:** Ready to Start

---

## Objective

Audit and optimize mobile bundle size and runtime performance. Target metrics: JavaScript bundle < 200KB gzipped, First Contentful Paint < 1.5s, maintain 60 FPS animations. Focus on code splitting, asset optimization, and lazy loading non-critical components.

---

## Performance Targets

### Load Performance

- **First Contentful Paint (FCP):** < 1.5 seconds
- **Time to Interactive (TTI):** < 3 seconds
- **Total Blocking Time (TBT):** < 200ms
- **Largest Contentful Paint (LCP):** < 2.5 seconds
- **Cumulative Layout Shift (CLS):** < 0.1

### Bundle Size

- **JavaScript (gzipped):** < 200KB
- **CSS (gzipped):** < 20KB
- **HTML:** < 10KB
- **Total initial load:** < 300KB
- **Asset cache size:** < 1MB

### Runtime Performance

- **Animation frame rate:** 60 FPS
- **Touch response time:** < 100ms
- **State update time:** < 16ms (60 FPS budget)
- **AI decision time:** < 500ms (medium difficulty)
- **Memory usage:** < 50MB (mobile)

---

## Step 1: Bundle Analysis

### 1.1 Install Rollup Visualizer

```bash
npm install --save-dev rollup-plugin-visualizer
```

### 1.2 Update Vite Config

Add visualizer plugin to `vite.config.js`:

```javascript
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        desktop: resolve(__dirname, "desktop/index.html"),
        mobile: resolve(__dirname, "mobile/index.html"),
      },
    },
    // Generate source maps for analysis
    sourcemap: true,
  },
  plugins: [
    visualizer({
      filename: "./dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

### 1.3 Build and Analyze

```bash
npm run build
# Opens stats.html in browser showing bundle composition
```

### 1.4 Identify Large Dependencies

Look for:

- Large libraries (> 50KB)
- Duplicate code between mobile/desktop bundles
- Unused exports from libraries
- Phaser library (desktop only, should not be in mobile bundle)

**Example Analysis Report Format:**

```markdown
## Bundle Analysis Results

### Mobile Bundle Breakdown (before optimization)

- Total size: 450KB (uncompressed), 180KB (gzipped)
- Largest modules:
  1. core/GameController.js - 85KB (35%)
  2. core/AIEngine.js - 120KB (40%)
  3. core/card/\* - 60KB (20%)
  4. mobile/renderers/\* - 30KB (10%)
  5. shared/SettingsManager.js - 8KB (2%)

### Desktop Bundle Breakdown (before optimization)

- Total size: 850KB (uncompressed), 320KB (gzipped)
- Largest modules:
  1. Phaser library - 600KB (70%)
  2. core/GameController.js - 85KB (10%)
  3. core/AIEngine.js - 120KB (14%)
  4. desktop/adapters/\* - 45KB (5%)

### Issues Found

- ❌ AIEngine loaded on initial page load (should be lazy)
- ❌ All card patterns (2017-2025) bundled (should load year dynamically)
- ❌ Desktop bundle includes mobile code (tree-shaking not working)
- ✅ Phaser correctly excluded from mobile bundle
```

---

## Step 2: Code Splitting

### 2.1 Lazy Load AI Engine

**Problem:** AIEngine (120KB) loaded immediately but only used after game starts.

**Solution:** Dynamic import when game starts.

**File:** `mobile/main.js`

```javascript
// BEFORE
import { AIEngine } from "../core/AIEngine.js";
import { GameController } from "../core/GameController.js";

const gameController = new GameController();
const aiEngine = new AIEngine();
gameController.setAI(aiEngine);

// AFTER
import { GameController } from "../core/GameController.js";

const gameController = new GameController();
let aiEngineLoaded = false;

document.getElementById("start").addEventListener("click", async () => {
  if (!aiEngineLoaded) {
    // Lazy load AI engine
    const { AIEngine } = await import("../core/AIEngine.js");
    const aiEngine = new AIEngine();
    gameController.setAI(aiEngine);
    aiEngineLoaded = true;
  }

  gameController.startGame();
});
```

**Expected Savings:** 120KB removed from initial bundle

### 2.2 Lazy Load Card Patterns

**Problem:** All card years (2017-2025) bundled, but only one year used per game.

**Solution:** Load card patterns dynamically based on settings.

**File:** `core/card/card.js`

```javascript
// BEFORE
import { hands2017 } from "./2017/card2017.js";
import { hands2018 } from "./2018/card2018.js";
import { hands2019 } from "./2019/card2019.js";
import { hands2020 } from "./2020/card2020.js";
import { hands2025 } from "./2025/card2025.js";

const allHands = {
  2017: hands2017,
  2018: hands2018,
  2019: hands2019,
  2020: hands2020,
  2025: hands2025,
};

// AFTER
const allHands = {};

async function loadCardYear(year) {
  if (allHands[year]) {
    return allHands[year]; // Already loaded
  }

  let hands;
  switch (year) {
    case 2017:
      hands = (await import("./2017/card2017.js")).hands2017;
      break;
    case 2018:
      hands = (await import("./2018/card2018.js")).hands2018;
      break;
    case 2019:
      hands = (await import("./2019/card2019.js")).hands2019;
      break;
    case 2020:
      hands = (await import("./2020/card2020.js")).hands2020;
      break;
    case 2025:
      hands = (await import("./2025/card2025.js")).hands2025;
      break;
    default:
      hands = (await import("./2025/card2025.js")).hands2025;
  }

  allHands[year] = hands;
  return hands;
}

export { loadCardYear };
```

**Update Card.init():**

```javascript
// core/card/card.js
async init(year = 2025) {
    const hands = await loadCardYear(year);
    this.hands = hands;
    // ... rest of init
}
```

**Expected Savings:** 48KB removed from initial bundle (4 unused years × 12KB)

### 2.3 Split Mobile Components

**Problem:** All mobile renderers bundled even if not needed on desktop.

**Solution:** Use Vite's manual chunks to create separate files.

**File:** `vite.config.js`

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        desktop: resolve(__dirname, "desktop/index.html"),
        mobile: resolve(__dirname, "mobile/index.html"),
      },
      output: {
        manualChunks: {
          // Separate AI engine chunk (lazy loaded)
          "ai-engine": ["./core/AIEngine.js"],

          // Card validation (lazy loaded)
          "card-core": ["./core/card/card.js"],

          // Mobile renderers (only for mobile bundle)
          "mobile-ui": [
            "./mobile/renderers/HandRenderer.js",
            "./mobile/renderers/OpponentBar.js",
            "./mobile/renderers/DiscardPile.js",
            "./mobile/components/MobileTile.js",
          ],

          // Desktop Phaser code (only for desktop bundle)
          "desktop-phaser": [
            "./desktop/adapters/PhaserAdapter.js",
            "./desktop/gameObjects.js",
            "./desktop/gameObjects_hand.js",
            "./desktop/gameObjects_table.js",
            "./desktop/gameObjects_player.js",
          ],
        },
      },
    },
  },
});
```

**Expected Savings:** Better cache invalidation, smaller individual files

---

## Step 3: Asset Optimization

### 3.1 Compress Images

**Problem:** PNG images are large (mahjong sprites, icons).

**Solution:** Convert to WebP format (better compression), or use optimized PNGs.

**Install image optimization tool:**

```bash
npm install --save-dev @squoosh/lib
```

**Create optimization script:**

```javascript
// scripts/optimize-images.js
import { ImagePool } from "@squoosh/lib";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

async function optimizeImages(inputDir, outputDir) {
  const imagePool = new ImagePool();
  const files = await readdir(inputDir);

  for (const file of files) {
    if (!file.endsWith(".png")) continue;

    const inputPath = join(inputDir, file);
    const image = imagePool.ingestImage(await readFile(inputPath));

    await image.encode({
      webp: { quality: 80 },
    });

    const { binary } = await image.encodedWith.webp;
    const outputPath = join(outputDir, file.replace(".png", ".webp"));
    await writeFile(outputPath, binary);

    console.log(`Optimized: ${file} -> ${file.replace(".png", ".webp")}`);
  }

  await imagePool.close();
}

// Run optimization
optimizeImages("./assets/tiles", "./assets/tiles-optimized");
```

**Update image references:**

```javascript
// mobile/components/MobileTile.js
// BEFORE
<img src="/assets/tiles/crack5.png" alt="Crack 5">

// AFTER
<img src="/assets/tiles/crack5.webp" alt="Crack 5">
```

**Expected Savings:** 30-50% image file size reduction

### 3.2 Lazy Load Non-Critical Assets

**Problem:** All tile images loaded immediately.

**Solution:** Use lazy loading for off-screen tiles.

```html
<!-- mobile/components/MobileTile.js -->
<img src="/assets/tiles/crack5.webp" alt="Crack 5" loading="lazy" />
```

### 3.3 Preload Critical Assets

**Problem:** Key assets (fonts, first-view tiles) load too late.

**Solution:** Add preload hints to HTML.

```html
<!-- mobile/index.html -->
<head>
  <!-- Preload critical assets -->
  <link rel="preload" href="/mobile/main.js" as="script" />
  <link rel="preload" href="/mobile/styles.css" as="style" />
  <link rel="preload" href="/assets/tiles/joker.webp" as="image" />
</head>
```

---

## Step 4: Minification & Compression

### 4.1 Enable Terser Minification

**File:** `vite.config.js`

```javascript
export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ["console.info", "console.debug"],
      },
      mangle: {
        safari10: true, // Safari 10 compatibility
      },
    },
  },
});
```

**Expected Savings:** 10-15% JavaScript size reduction

### 4.2 Enable CSS Minification

Vite already minifies CSS by default, but ensure:

```javascript
export default defineConfig({
  build: {
    cssMinify: true,
  },
});
```

### 4.3 Configure Server Compression

**File:** `vite.config.js`

```javascript
import compression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    compression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
  ],
});
```

**Install plugin:**

```bash
npm install --save-dev vite-plugin-compression
```

---

## Step 5: Runtime Performance

### 5.1 Optimize Animation Performance

**Problem:** CSS animations may cause layout thrashing.

**Solution:** Use `transform` and `opacity` only (GPU-accelerated).

```css
/* mobile/animations/AnimationController.css */

/* ❌ BAD: Causes layout recalculation */
@keyframes tile-draw-bad {
  from {
    top: -200px;
  }
  to {
    top: 0;
  }
}

/* ✅ GOOD: GPU-accelerated */
@keyframes tile-draw {
  from {
    transform: translateY(-200px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.tile-drawing {
  animation: tile-draw 300ms ease-out;
  /* Force GPU acceleration */
  will-change: transform, opacity;
}
```

### 5.2 Debounce Touch Events

**Problem:** Touch events fire rapidly, causing performance issues.

**Solution:** Debounce handler calls.

```javascript
// mobile/gestures/TouchHandler.js

class TouchHandler {
  constructor(element, callbacks) {
    this.callbacks = callbacks;
    this.touchStartTime = 0;
    this.touchStartPos = { x: 0, y: 0 };

    // Debounced handlers
    this.handleTouchStart = this.debounce(
      this._handleTouchStart.bind(this),
      16,
    );
    this.handleTouchMove = this.debounce(this._handleTouchMove.bind(this), 16);

    element.addEventListener("touchstart", this.handleTouchStart);
    element.addEventListener("touchmove", this.handleTouchMove);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  _handleTouchStart(e) {
    // Original implementation
  }

  _handleTouchMove(e) {
    // Original implementation
  }
}
```

**Expected Improvement:** Reduced CPU usage during gestures

### 5.3 Use RequestAnimationFrame for Updates

**Problem:** Direct DOM updates may cause jank.

**Solution:** Batch updates with requestAnimationFrame.

```javascript
// mobile/renderers/HandRenderer.js

class HandRenderer {
  constructor(container, gameController) {
    this.container = container;
    this.pendingUpdate = false;
    this.latestHandData = null;

    gameController.on("HAND_UPDATED", (data) => {
      this.latestHandData = data.hand;

      if (!this.pendingUpdate) {
        this.pendingUpdate = true;
        requestAnimationFrame(() => {
          this.render(this.latestHandData);
          this.pendingUpdate = false;
        });
      }
    });
  }

  render(handData) {
    // Batch all DOM updates here
    // Only called once per frame
  }
}
```

---

## Step 6: Service Worker Optimization

### 6.1 Cache Strategy

**Problem:** Service worker caches everything, slowing initial install.

**Solution:** Use cache-on-demand strategy for non-critical assets.

**File:** `pwa/service-worker.js`

```javascript
const CACHE_NAME = "mahjong-v2";
const CRITICAL_CACHE = [
  "/mobile/",
  "/mobile/main.js",
  "/mobile/styles.css",
  "/pwa/manifest.json",
];

// Install: Cache critical assets only
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CRITICAL_CACHE);
    }),
  );
  self.skipWaiting();
});

// Fetch: Cache-first for assets, network-first for HTML
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Network-first for HTML
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Cache-first for assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached, but fetch and update cache in background
        fetch(request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response);
          });
        });
        return cachedResponse;
      }

      // Not in cache, fetch and cache
      return fetch(request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      });
    }),
  );
});
```

**Expected Improvement:** Faster initial install, better cache efficiency

---

## Step 7: Measure Results

### 7.1 Run Lighthouse

```bash
# Start production build
npm run build
npm run preview

# Open Chrome DevTools
# Lighthouse → Mobile → Performance
# Run audit
```

**Target Scores:**

- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

### 7.2 Compare Before/After

Create a comparison table:

```markdown
## Performance Metrics

| Metric              | Before | After | Improvement   |
| ------------------- | ------ | ----- | ------------- |
| FCP                 | 2.1s   | 1.2s  | 43% faster    |
| TTI                 | 4.5s   | 2.8s  | 38% faster    |
| LCP                 | 3.2s   | 1.9s  | 41% faster    |
| TBT                 | 450ms  | 180ms | 60% reduction |
| CLS                 | 0.15   | 0.08  | 47% better    |
| JS Bundle (gzipped) | 320KB  | 185KB | 42% smaller   |
| Total Page Weight   | 1.2MB  | 680KB | 43% smaller   |
| Lighthouse Score    | 72     | 94    | +22 points    |
```

### 7.3 Real Device Testing

Test on actual devices:

- iPhone 12 (iOS Safari)
- Samsung Galaxy S21 (Chrome Android)
- iPhone SE (slower device)

**Measure:**

- Load time
- Animation smoothness
- Touch responsiveness
- Memory usage (Chrome DevTools Memory tab)

---

## Step 8: Memory Optimization

### 8.1 Profile Memory Usage

```javascript
// Add to mobile/main.js for development
if (window.performance && window.performance.memory) {
  setInterval(() => {
    const mem = performance.memory;
    console.log("Memory:", {
      used: (mem.usedJSHeapSize / 1048576).toFixed(2) + " MB",
      total: (mem.totalJSHeapSize / 1048576).toFixed(2) + " MB",
      limit: (mem.jsHeapSizeLimit / 1048576).toFixed(2) + " MB",
    });
  }, 5000);
}
```

### 8.2 Fix Memory Leaks

**Common leaks to check:**

- Event listeners not removed (use `removeEventListener`)
- Timers not cleared (use `clearTimeout`, `clearInterval`)
- DOM references held after removal
- GameController event subscriptions not cleaned up

**Example fix:**

```javascript
// mobile/renderers/HandRenderer.js
class HandRenderer {
  constructor(container, gameController) {
    this.container = container;
    this.gameController = gameController;

    // Store handler reference for cleanup
    this.handUpdateHandler = (data) => this.render(data.hand);
    gameController.on("HAND_UPDATED", this.handUpdateHandler);
  }

  destroy() {
    // Clean up event listener
    this.gameController.off("HAND_UPDATED", this.handUpdateHandler);

    // Clear DOM references
    this.container = null;
    this.gameController = null;
  }
}
```

---

## Deliverables

### 1. Performance Report

**Filename:** `PHASE_7C_PERFORMANCE_REPORT.md`

Include:

- Bundle analysis (before/after sizes)
- Lighthouse scores (before/after)
- Real device test results
- Optimization techniques applied
- Code changes made (with file references)
- Remaining optimization opportunities

### 2. Optimized Build Configuration

- Updated `vite.config.js` with code splitting
- Image optimization script
- Service worker cache strategy

### 3. Code Changes

- Lazy loading implementations
- Animation optimizations
- Memory leak fixes
- Asset preloading

---

## Success Criteria

✅ **JavaScript bundle (gzipped) < 200KB**

✅ **First Contentful Paint < 1.5s**

✅ **Lighthouse performance score ≥ 90**

✅ **60 FPS animations on mobile**

✅ **Memory usage < 50MB**

✅ **No memory leaks detected**

✅ **Build time < 30 seconds**

---

## Optional Enhancements

If time permits:

### Prerendering

Use vite-plugin-ssr to prerender mobile/index.html for faster initial load.

### HTTP/2 Server Push

Configure server to push critical assets before browser requests them.

### Resource Hints

Add `rel="prefetch"` for likely next navigation (e.g., settings page).

### Code Coverage Analysis

Use Istanbul to identify unused code that can be removed.

---

## Time Estimate

**Bundle Analysis:** 1 hour
**Code Splitting:** 2 hours
**Asset Optimization:** 1 hour
**Runtime Optimization:** 1 hour
**Testing & Measurement:** 1 hour

**Total:** ~6 hours (6K tokens)

---

This completes the Phase 7C implementation prompt. Focus on measurable performance improvements and document all results!
