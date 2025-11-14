# Phase 5C: Service Worker for Offline Support

**Assignee:** MiniMax2
**Complexity:** Low
**Estimated Tokens:** 4K
**Prerequisites:** Phase 5A complete (manifest.json exists)

---

## Task Overview

Create a service worker that caches game assets for offline play and fast loading. This enables the PWA to:
- Load instantly on repeat visits (cached assets)
- Work offline after first load
- Automatically update when new versions are deployed
- Reduce server load and bandwidth usage

**Caching Strategy:**
- **Cache-first** for static assets (JS, CSS, images)
- **Network-first** for HTML (ensure latest version)
- **Stale-while-revalidate** for audio files

---

## Deliverables

### 1. Service Worker File

**File:** `pwa/service-worker.js`

Create a service worker with version management and intelligent caching:

```javascript
/**
 * Service Worker for American Mahjong PWA
 *
 * Caching strategy:
 * - Static assets (JS/CSS/images): Cache-first
 * - HTML: Network-first with cache fallback
 * - Audio: Stale-while-revalidate
 */

// Cache version - increment this to force cache refresh
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `mahjong-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/mahjong/mobile/',
    '/mahjong/mobile/index.html',
    '/mahjong/pwa/manifest.json',
    '/mahjong/favicon.svg',
    '/mahjong/pwa/icons/icon-192.png',
    '/mahjong/pwa/icons/icon-512.png'
];

// Note: Vite bundles will have hashed names, so we'll cache them dynamically

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...', CACHE_NAME);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...', CACHE_NAME);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Delete old caches that don't match current version
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('mahjong-') && cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Old caches cleaned up');
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event - Serve from cache or network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Determine caching strategy based on request type
    if (isHTMLRequest(request)) {
        // HTML: Network-first (ensure latest version)
        event.respondWith(networkFirstStrategy(request));
    } else if (isAudioRequest(request)) {
        // Audio: Stale-while-revalidate (allow background updates)
        event.respondWith(staleWhileRevalidateStrategy(request));
    } else {
        // Everything else (JS, CSS, images): Cache-first
        event.respondWith(cacheFirstStrategy(request));
    }
});

/**
 * Check if request is for HTML
 */
function isHTMLRequest(request) {
    const url = new URL(request.url);
    return request.destination === 'document' ||
           url.pathname.endsWith('.html') ||
           url.pathname.endsWith('/');
}

/**
 * Check if request is for audio
 */
function isAudioRequest(request) {
    return request.destination === 'audio' ||
           request.url.includes('/audio/') ||
           request.url.match(/\.(mp3|wav|ogg)$/);
}

/**
 * Cache-First Strategy
 * Try cache first, fall back to network, cache the response
 */
async function cacheFirstStrategy(request) {
    try {
        // Try to get from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[SW] Serving from cache:', request.url);
            return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[SW] Fetching from network:', request.url);
        const networkResponse = await fetch(request);

        // Cache the response for future use (only if successful)
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            // Clone the response because it can only be consumed once
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache-first strategy failed:', error);
        // If both cache and network fail, return offline page
        return createOfflineResponse(request);
    }
}

/**
 * Network-First Strategy
 * Try network first, fall back to cache if offline
 */
async function networkFirstStrategy(request) {
    try {
        // Try network first
        console.log('[SW] Fetching from network (network-first):', request.url);
        const networkResponse = await fetch(request);

        // Cache the response for offline use
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        console.log('[SW] Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('[SW] Serving from cache (offline):', request.url);
            return cachedResponse;
        }

        // Both failed
        console.error('[SW] Network-first strategy failed:', error);
        return createOfflineResponse(request);
    }
}

/**
 * Stale-While-Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(CACHE_NAME);

    // Try to get from cache
    const cachedResponse = await caches.match(request);

    // Fetch from network in background (don't wait)
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.warn('[SW] Background fetch failed:', request.url, error);
        });

    // Return cached response immediately if available
    if (cachedResponse) {
        console.log('[SW] Serving from cache (stale-while-revalidate):', request.url);
        return cachedResponse;
    }

    // No cached version, wait for network
    console.log('[SW] No cached version, waiting for network:', request.url);
    return fetchPromise;
}

/**
 * Create offline response when all strategies fail
 */
function createOfflineResponse(request) {
    // For HTML requests, return a basic offline page
    if (isHTMLRequest(request)) {
        return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - American Mahjong</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: 'Courier New', monospace;
                        background: linear-gradient(135deg, #0c6d3a 0%, #044328 100%);
                        color: white;
                        height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                    }
                    h1 { font-size: 24px; margin-bottom: 16px; }
                    p { font-size: 16px; opacity: 0.9; }
                    button {
                        margin-top: 24px;
                        padding: 12px 24px;
                        font-size: 16px;
                        font-family: 'Courier New', monospace;
                        background: #ffd166;
                        color: #1f1400;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div>
                    <h1>You're Offline</h1>
                    <p>American Mahjong requires an internet connection.</p>
                    <p>Please check your connection and try again.</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            </body>
            </html>`,
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }

    // For other requests, return 503
    return new Response('Service Unavailable', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

/**
 * Message handler for cache updates
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});
```

---

### 2. Service Worker Registration

**File:** `mobile/main.js` (or mobile entry point)

Add service worker registration:

```javascript
/**
 * Register Service Worker
 */
async function registerServiceWorker() {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
        console.log('Service workers not supported');
        return;
    }

    try {
        // Register the service worker
        const registration = await navigator.serviceWorker.register(
            '/mahjong/pwa/service-worker.js',
            { scope: '/mahjong/' }
        );

        console.log('Service worker registered:', registration);

        // Check for updates on page load
        registration.update();

        // Listen for updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('Service worker update found');

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('New service worker installed, ready to activate');
                    showUpdateNotification(registration);
                }
            });
        });

    } catch (error) {
        console.error('Service worker registration failed:', error);
    }
}

/**
 * Show notification when update is available
 */
function showUpdateNotification(registration) {
    // Create update banner
    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ffd166;
            color: #1f1400;
            padding: 12px;
            text-align: center;
            font-family: 'Courier New', monospace;
            z-index: 10001;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        ">
            <strong>Update Available!</strong>
            <button onclick="location.reload()" style="
                margin-left: 16px;
                padding: 6px 16px;
                background: #044328;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
            ">Reload to Update</button>
        </div>
    `;
    document.body.appendChild(banner);

    // Tell the waiting service worker to skip waiting
    if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
}

// Register on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerServiceWorker);
} else {
    registerServiceWorker();
}
```

---

### 3. Update Vite Configuration

**File to Update:** `vite.config.js`

Ensure service worker isn't processed by Vite:

```javascript
import { defineConfig } from "vite";

export default defineConfig({
    base: "/mahjong/",
    build: {
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            input: {
                desktop: 'index.html',              // Desktop entry
                mobile: 'mobile/index.html'         // Mobile entry (when created)
            }
        }
    },
    server: {
        hmr: {
            overlay: false,
        },
    },
    // Exclude service worker from processing
    publicDir: 'pwa',  // Serve pwa/ as static files
    logLevel: "info",
});
```

**Alternative:** Copy service worker to `public/` directory if you create one.

---

## Cache Version Management

### When to Update Cache Version

Increment `CACHE_VERSION` in service-worker.js when you:
- Deploy new features
- Fix critical bugs
- Update game assets (images, audio)
- Change game logic (JS files)

Example version progression:
- `v1.0.0` - Initial release
- `v1.0.1` - Bug fixes
- `v1.1.0` - New features
- `v2.0.0` - Major updates

### Version Update Flow

1. Developer updates `CACHE_VERSION` in service-worker.js
2. Service worker detects version mismatch on install
3. Old cache is deleted, new cache is created
4. User sees "Update Available" banner
5. User clicks "Reload to Update"
6. New version loads with fresh cache

---

## Testing Checklist

### Functional Testing

1. **Initial Install:**
   - [ ] Open mobile app in Chrome
   - [ ] Open DevTools → Application → Service Workers
   - [ ] Verify service worker registered successfully
   - [ ] Check "Cache Storage" shows `mahjong-v1.0.0`
   - [ ] Verify static assets are cached

2. **Offline Functionality:**
   - [ ] Load app normally (online)
   - [ ] Open DevTools → Network tab
   - [ ] Check "Offline" checkbox
   - [ ] Reload page → app should load from cache
   - [ ] Verify game is playable offline

3. **Cache Strategies:**
   - [ ] **HTML (network-first):** Edit HTML remotely, verify updates appear
   - [ ] **JS/CSS (cache-first):** Assets load instantly from cache
   - [ ] **Audio (stale-while-revalidate):** Audio plays from cache, updates in background

4. **Cache Updates:**
   - [ ] Change `CACHE_VERSION` to `v1.0.1`
   - [ ] Reload page
   - [ ] Verify update banner appears
   - [ ] Click "Reload to Update"
   - [ ] Verify old cache deleted, new cache created
   - [ ] Check Cache Storage shows `mahjong-v1.0.1`

5. **Offline Fallback:**
   - [ ] Clear all caches
   - [ ] Go offline
   - [ ] Try to load app
   - [ ] Verify offline page appears with "You're Offline" message

### Browser Testing

Test in:
- [ ] Chrome Mobile (Android)
- [ ] Safari (iOS) - limited support
- [ ] Chrome Desktop
- [ ] Firefox Mobile

---

## Performance Metrics

After implementation, measure:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| First Load Time | < 3s | Chrome DevTools Lighthouse |
| Repeat Load Time | < 0.5s | Lighthouse "Cached" |
| Cache Hit Rate | > 90% | DevTools Application → Cache Storage |
| Offline Functionality | 100% | Test with network disabled |

---

## Debugging

### Enable Verbose Logging

Add this to service-worker.js during development:

```javascript
const DEBUG = true;

function log(...args) {
    if (DEBUG) {
        console.log('[SW]', ...args);
    }
}
```

### Clear Cache Manually

In DevTools:
1. Application → Cache Storage
2. Right-click cache → Delete
3. Application → Service Workers
4. Click "Unregister"

### Force Update

In console:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
    reg.unregister().then(() => location.reload());
});
```

---

## Common Issues

### Issue: Service Worker Not Updating

**Cause:** Browser caches service worker file
**Fix:** Add cache-busting headers or use `registration.update()`

### Issue: Assets Not Caching

**Cause:** Incorrect paths in `STATIC_ASSETS`
**Fix:** Verify all paths are relative to base URL (`/mahjong/`)

### Issue: Offline Page Not Showing

**Cause:** Network request succeeds but returns error page
**Fix:** Check response status in cache strategies

---

## Expected Output

When complete, provide:

1. ✅ `pwa/service-worker.js` created
2. ✅ Service worker registration added to `mobile/main.js`
3. ✅ `vite.config.js` updated (if needed)
4. ✅ Testing report with:
   - Screenshot of DevTools showing service worker registered
   - Screenshot of Cache Storage with cached assets
   - Screenshot of app loading offline
   - Screenshot of update banner
5. ✅ Performance metrics report

---

## File Locations Summary

```
pwa/
└── service-worker.js            # NEW - Service worker with caching logic

mobile/
└── main.js                      # UPDATED - Service worker registration

vite.config.js                   # UPDATED - Exclude SW from bundling
```

---

## Resources

- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev: Service Worker Caching Strategies](https://web.dev/offline-cookbook/)
- [Workbox](https://developers.google.com/web/tools/workbox) - Google's SW library (optional alternative)
- [Chrome: Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)

---

## Notes

- Service workers only work over HTTPS (or localhost)
- GitHub Pages automatically provides HTTPS, so deployment will work
- iOS Safari has limited service worker support (caching works, but some features may not)
- The cache-first strategy provides instant load times for repeat visitors
- Audio uses stale-while-revalidate to avoid blocking gameplay while updating
