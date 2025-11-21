 
/**
 * Service Worker for American Mahjong PWA
 *
 * Caching strategy:
 * - Static assets (JS/CSS/images): Cache-first
 * - HTML: Network-first with cache fallback
 * - Audio: Stale-while-revalidate
 */

// Cache version - increment this to force cache refresh
const CACHE_VERSION = "v1.0.1";
const CACHE_NAME = `mahjong-${CACHE_VERSION}`;

/* eslint-disable no-undef */
// Assets to cache immediately on install
const STATIC_ASSETS = [
    "/mahjong/mobile/",
    "/mahjong/mobile/index.html",
    "/mahjong/manifest.json",
    "/mahjong/favicon.svg",
    "/mahjong/icons/icon-192.png",
    "/mahjong/icons/icon-512.png"
];

// Note: Vite bundles will have hashed names, so we'll cache them dynamically

/**
 * Install Event - Cache static assets
 */
self.addEventListener("install", (event) => {
    console.log("[SW] Installing service worker...", CACHE_NAME);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log("[SW] Caching static assets");
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log("[SW] Static assets cached successfully");
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error("[SW] Failed to cache static assets:", error);
            })
    );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener("activate", (event) => {
    console.log("[SW] Activating service worker...", CACHE_NAME);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Delete old caches that don't match current version
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith("mahjong-") && cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log("[SW] Deleting old cache:", cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log("[SW] Old caches cleaned up");
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event - Serve from cache or network
 */
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") {
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
    return request.destination === "document" ||
           url.pathname.endsWith(".html") ||
           url.pathname.endsWith("/");
}

/**
 * Check if request is for audio
 */
function isAudioRequest(request) {
    return request.destination === "audio" ||
           request.url.includes("/audio/") ||
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
            console.log("[SW] Serving from cache:", request.url);
            return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log("[SW] Fetching from network:", request.url);
        const networkResponse = await fetch(request);

        // Cache the response for future use (only if successful)
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            // Clone the response because it can only be consumed once
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error("[SW] Cache-first strategy failed:", error);
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
        console.log("[SW] Fetching from network (network-first):", request.url);
        const networkResponse = await fetch(request);

        // Cache the response for offline use
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        console.log("[SW] Network failed, trying cache:", request.url);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log("[SW] Serving from cache (offline):", request.url);
            return cachedResponse;
        }

        // Both failed
        console.error("[SW] Network-first strategy failed:", error);
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
            console.warn("[SW] Background fetch failed:", request.url, error);
        });

    // Return cached response immediately if available
    if (cachedResponse) {
        console.log("[SW] Serving from cache (stale-while-revalidate):", request.url);
        return cachedResponse;
    }

    // No cached version, wait for network
    console.log("[SW] No cached version, waiting for network:", request.url);
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
                statusText: "Service Unavailable",
                headers: { "Content-Type": "text/html" }
            }
        );
    }

    // For other requests, return 503
    return new Response("Service Unavailable", {
        status: 503,
        statusText: "Service Unavailable"
    });
}

/**
 * Message handler for cache updates
 */
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        console.log("[SW] Received SKIP_WAITING message");
        self.skipWaiting();
    }

    if (event.data && event.data.type === "GET_VERSION") {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});