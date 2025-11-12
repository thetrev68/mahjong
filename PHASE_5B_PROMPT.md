# Phase 5B: PWA Install Prompt

**Assignee:** Gemini Flash 2.0
**Complexity:** Low
**Estimated Tokens:** 2K
**Prerequisites:** Phase 5A complete (manifest.json exists and is linked)

---

## Task Overview

Implement a custom "Add to Home Screen" install prompt that appears after the user has played 2 games. This provides a better user experience than the browser's default install prompt and allows us to control when users are prompted to install the PWA.

**Key Behavior:**
- Intercept the browser's default install prompt
- Show custom UI after user plays 2+ games
- Save install state to localStorage (don't re-prompt)
- Provide "Install" and "Not Now" buttons
- Track installation status

---

## Deliverables

### 1. Install Prompt Manager

**File:** `mobile/components/InstallPrompt.js`

Create a module that manages the PWA install prompt lifecycle:

```javascript
/**
 * InstallPrompt.js - Manages PWA installation prompt
 *
 * This module:
 * - Captures the beforeinstallprompt event
 * - Tracks games played via localStorage
 * - Shows custom install UI after 2 games
 * - Handles user responses (install / dismiss)
 */

class InstallPrompt {
    constructor() {
        this.deferredPrompt = null;
        this.installBanner = null;

        this.init();
    }

    init() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the default browser prompt
            e.preventDefault();

            // Store the event for later use
            this.deferredPrompt = e;

            console.log('PWA install prompt captured');

            // Check if we should show the prompt
            this.checkShouldShowPrompt();
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.markAsInstalled();
            this.hidePrompt();
        });

        // Create the install banner UI
        this.createBannerUI();
    }

    /**
     * Check if conditions are met to show install prompt
     */
    checkShouldShowPrompt() {
        // Don't show if already installed
        if (this.isAlreadyInstalled()) {
            console.log('App already installed, skipping prompt');
            return;
        }

        // Don't show if user dismissed recently
        if (this.wasRecentlyDismissed()) {
            console.log('User dismissed prompt recently, skipping');
            return;
        }

        // Check game count
        const gamesPlayed = this.getGamesPlayed();
        console.log(`Games played: ${gamesPlayed}`);

        if (gamesPlayed >= 2) {
            // Wait a bit before showing (don't interrupt immediately)
            setTimeout(() => {
                this.showPrompt();
            }, 2000); // 2 second delay
        }
    }

    /**
     * Get number of games played from localStorage
     */
    getGamesPlayed() {
        return parseInt(localStorage.getItem('gamesPlayed') || '0', 10);
    }

    /**
     * Increment games played counter
     * Call this from mobile/main.js when a game ends
     */
    static incrementGamesPlayed() {
        const current = parseInt(localStorage.getItem('gamesPlayed') || '0', 10);
        localStorage.setItem('gamesPlayed', (current + 1).toString());
        console.log(`Games played: ${current + 1}`);
    }

    /**
     * Check if app is already installed
     */
    isAlreadyInstalled() {
        // Check if running in standalone mode (installed)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }

        // Check localStorage flag
        return localStorage.getItem('appInstalled') === 'true';
    }

    /**
     * Check if user dismissed the prompt recently
     */
    wasRecentlyDismissed() {
        const dismissedAt = localStorage.getItem('installPromptDismissedAt');
        if (!dismissedAt) return false;

        // Don't show again for 7 days after dismissal
        const dismissedTime = parseInt(dismissedAt, 10);
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        return (now - dismissedTime) < sevenDaysMs;
    }

    /**
     * Mark app as installed
     */
    markAsInstalled() {
        localStorage.setItem('appInstalled', 'true');
    }

    /**
     * Create the install banner HTML and CSS
     */
    createBannerUI() {
        // Create banner element
        this.installBanner = document.createElement('div');
        this.installBanner.id = 'install-banner';
        this.installBanner.className = 'install-banner';
        this.installBanner.style.display = 'none';

        this.installBanner.innerHTML = `
            <div class="install-banner__content">
                <div class="install-banner__icon">
                    <svg width="48" height="48" viewBox="0 0 64 64">
                        <rect x="4" y="4" width="56" height="56" rx="12" fill="#0c6d3a"/>
                        <rect x="15" y="15" width="34" height="34" rx="6" fill="rgba(4, 24, 14, 0.65)" stroke="#f5fbf7" stroke-width="2"/>
                        <rect x="19" y="19" width="26" height="26" rx="4" fill="#ffd166"/>
                    </svg>
                </div>
                <div class="install-banner__text">
                    <h3 class="install-banner__title">Install Mahjong</h3>
                    <p class="install-banner__message">Add to home screen for quick access</p>
                </div>
                <div class="install-banner__actions">
                    <button class="install-banner__btn install-banner__btn--install" id="install-btn">
                        Install
                    </button>
                    <button class="install-banner__btn install-banner__btn--dismiss" id="dismiss-btn">
                        Not Now
                    </button>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(this.installBanner);

        // Add event listeners
        const installBtn = this.installBanner.querySelector('#install-btn');
        const dismissBtn = this.installBanner.querySelector('#dismiss-btn');

        installBtn.addEventListener('click', () => this.handleInstall());
        dismissBtn.addEventListener('click', () => this.handleDismiss());

        // Add CSS
        this.injectStyles();
    }

    /**
     * Inject CSS styles for install banner
     */
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(4, 36, 21, 0.98), rgba(4, 36, 21, 0.95));
                backdrop-filter: blur(10px);
                border-top: 2px solid #ffd166;
                padding: 16px;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                animation: slideUp 0.3s ease-out;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                }
                to {
                    transform: translateY(0);
                }
            }

            .install-banner__content {
                display: flex;
                align-items: center;
                gap: 12px;
                max-width: 600px;
                margin: 0 auto;
            }

            .install-banner__icon {
                flex-shrink: 0;
            }

            .install-banner__text {
                flex: 1;
                min-width: 0;
            }

            .install-banner__title {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #f5fbf7;
                font-family: 'Courier New', monospace;
            }

            .install-banner__message {
                margin: 4px 0 0;
                font-size: 13px;
                color: rgba(245, 251, 247, 0.8);
                font-family: 'Courier New', monospace;
            }

            .install-banner__actions {
                display: flex;
                flex-direction: column;
                gap: 8px;
                flex-shrink: 0;
            }

            .install-banner__btn {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                font-family: 'Courier New', monospace;
                cursor: pointer;
                transition: all 0.2s;
                min-width: 100px;
            }

            .install-banner__btn--install {
                background: #ffd166;
                color: #1f1400;
            }

            .install-banner__btn--install:hover {
                background: #ffda7a;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(255, 209, 102, 0.4);
            }

            .install-banner__btn--dismiss {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(245, 251, 247, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .install-banner__btn--dismiss:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            /* Mobile responsive */
            @media (max-width: 480px) {
                .install-banner__content {
                    flex-wrap: wrap;
                }

                .install-banner__actions {
                    flex-direction: row;
                    width: 100%;
                    margin-top: 8px;
                }

                .install-banner__btn {
                    flex: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show the install prompt
     */
    showPrompt() {
        if (!this.deferredPrompt) {
            console.log('No deferred prompt available');
            return;
        }

        this.installBanner.style.display = 'block';
        console.log('Install banner shown');
    }

    /**
     * Hide the install prompt
     */
    hidePrompt() {
        if (this.installBanner) {
            this.installBanner.style.display = 'none';
        }
    }

    /**
     * Handle install button click
     */
    async handleInstall() {
        if (!this.deferredPrompt) {
            console.error('No deferred prompt available');
            return;
        }

        // Show the browser's install prompt
        this.deferredPrompt.prompt();

        // Wait for user choice
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`Install prompt outcome: ${outcome}`);

        if (outcome === 'accepted') {
            console.log('User accepted install');
            this.markAsInstalled();
        } else {
            console.log('User dismissed install');
            this.handleDismiss();
        }

        // Clear the deferred prompt
        this.deferredPrompt = null;

        // Hide the banner
        this.hidePrompt();
    }

    /**
     * Handle dismiss button click
     */
    handleDismiss() {
        // Record dismissal time
        localStorage.setItem('installPromptDismissedAt', Date.now().toString());
        console.log('Install prompt dismissed by user');

        // Hide the banner
        this.hidePrompt();
    }
}

// Export for use in mobile/main.js
export default InstallPrompt;
```

---

### 2. Integration with Mobile App

**File to Update:** `mobile/main.js` (or wherever the mobile game initializes)

Add the following code:

```javascript
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
```

**Integration Requirements:**
- Find where the game detects "game over" state
- Call `InstallPrompt.incrementGamesPlayed()` when a game completes
- The install prompt will automatically handle showing/hiding based on conditions

---

## Behavior Specifications

### When to Show Prompt

The prompt should show when **ALL** of these conditions are met:
1. ✅ User has played 2 or more games (`gamesPlayed >= 2`)
2. ✅ App is not already installed (not in standalone mode)
3. ✅ User hasn't dismissed the prompt in the last 7 days
4. ✅ Browser supports PWA installation (`beforeinstallprompt` fired)

### When NOT to Show Prompt

- ❌ User is already running app in standalone mode (installed)
- ❌ User dismissed prompt less than 7 days ago
- ❌ Browser doesn't support PWA installation
- ❌ User has `appInstalled: true` in localStorage

---

## localStorage Schema

The following keys are used:

```javascript
{
    "gamesPlayed": "3",                      // Number of games completed (string)
    "appInstalled": "true",                  // Installation status (string boolean)
    "installPromptDismissedAt": "1699876543210"  // Unix timestamp (string)
}
```

---

## Testing Checklist

### Manual Testing

1. **First-time User Flow:**
   - [ ] Clear localStorage
   - [ ] Play 1 game → prompt should NOT appear
   - [ ] Play 2nd game → prompt should appear after 2 seconds
   - [ ] Click "Install" → browser prompt appears
   - [ ] Accept installation → app installs, banner disappears

2. **Dismissal Flow:**
   - [ ] Clear localStorage
   - [ ] Play 2 games → prompt appears
   - [ ] Click "Not Now" → banner disappears
   - [ ] Play 3rd game → banner should NOT reappear
   - [ ] Verify `installPromptDismissedAt` in localStorage has timestamp

3. **Already Installed:**
   - [ ] Install the PWA
   - [ ] Launch from home screen (standalone mode)
   - [ ] Verify install banner never appears

4. **7-Day Dismissal Expiry:**
   - [ ] Manually set `installPromptDismissedAt` to 8 days ago
   - [ ] Reload page → prompt should appear again

### Browser Testing

Test in:
- [ ] Chrome Mobile (Android)
- [ ] Safari (iOS 15+)
- [ ] Chrome Desktop (with device emulation)
- [ ] Edge Mobile

**Note:** iOS Safari has limited PWA support. The `beforeinstallprompt` event is not supported on iOS, so the banner won't appear there. iOS users must manually "Add to Home Screen" from Safari's share menu.

---

## iOS Fallback Strategy

Since iOS doesn't support `beforeinstallprompt`, consider adding iOS detection and showing alternative instructions:

```javascript
// Detect iOS
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

if (isIOS && !this.isAlreadyInstalled() && gamesPlayed >= 2) {
    // Show iOS-specific instructions
    this.showIOSInstructions();
}
```

**iOS Instructions Banner (Optional Enhancement):**
```html
<div class="ios-install-instructions">
    <p>To install: Tap the Share button <svg>...</svg> and select "Add to Home Screen"</p>
</div>
```

---

## Expected Output

When complete, provide:

1. ✅ `mobile/components/InstallPrompt.js` created
2. ✅ Integration code added to `mobile/main.js`
3. ✅ Manual testing report with screenshots:
   - Prompt appearing after 2 games
   - Install flow working
   - Dismissal working
4. ✅ Confirmation that localStorage tracking works correctly

---

## File Locations Summary

```
mobile/
├── components/
│   └── InstallPrompt.js         # NEW - Install prompt manager
└── main.js                      # UPDATED - Import and initialize InstallPrompt
```

---

## Resources

- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [Web.dev: Patterns for promoting PWA installation](https://web.dev/promote-install/)
- [Chrome: Add to Home Screen](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start/)

---

## Notes

- The install prompt is a **progressive enhancement** - the app works fine without it
- iOS users won't see this custom prompt (they use Safari's native flow)
- The 7-day dismissal cooldown prevents annoying users with repeated prompts
- The 2-game threshold ensures users are engaged before being prompted
- The banner uses the mahjong table color scheme for visual consistency
