import InstallPrompt from './components/InstallPrompt.js';

// Initialize install prompt manager
const installPrompt = new InstallPrompt();

// TODO: Call this when a game ends
// Example integration point:
function onGameEnd() {
    // Existing game end logic...

    // Increment games played counter
    InstallPrompt.incrementGamesPlayed();

    // The InstallPrompt will automatically check and show prompt if conditions are met
}

// Placeholder for mobile app initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Mobile Mahjong app initializing...');

    // Hide loading message
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }

    // TODO: Initialize mobile game components here
    // - GameController
    // - HandRenderer
    // - TouchHandler
    // - etc.

    // Register Service Worker
    registerServiceWorker();
});

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