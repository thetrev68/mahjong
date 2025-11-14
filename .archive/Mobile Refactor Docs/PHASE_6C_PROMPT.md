# Phase 6C: Cross-Platform Settings UI

**Assignee:** Gemini Pro 2.5
**Complexity:** Medium
**Estimated Tokens:** 6K
**Prerequisites:** Phase 6B complete (shared/SettingsManager.js exists)

---

## Task Overview

Create a mobile-optimized settings UI that adapts to screen size and integrates with the shared `SettingsManager`. The desktop version uses an overlay modal; the mobile version will use a bottom sheet that slides up from the bottom of the screen.

**Key Goals:**
1. Create mobile settings UI (bottom sheet design)
2. Make existing desktop settings responsive
3. Both platforms use `SettingsManager` for persistence
4. Responsive breakpoint at 768px

---

## Current Desktop Settings Analysis

### Existing Desktop UI ([index.html](index.html))

The desktop settings overlay includes:
- Card year selection (2017-2025)
- Blank tiles toggle
- Training mode controls
- Audio volume sliders (BGM + SFX)
- Mute checkboxes

**Current Layout:** Full-screen overlay with centered modal (400px wide).

**Issue:** Not mobile-friendly (too much vertical content, small touch targets).

---

## Deliverables

### 1. Mobile Settings UI

**File:** `mobile/components/SettingsSheet.js`

Create a mobile-specific settings component:

```javascript
/**
 * SettingsSheet.js - Mobile bottom sheet settings UI
 *
 * Displays settings in a slide-up bottom sheet optimized for touch.
 * Uses shared/SettingsManager for persistence.
 */

import SettingsManager from '../../shared/SettingsManager.js';

class SettingsSheet {
    constructor() {
        this.sheet = null;
        this.settingsButton = null;
        this.isOpen = false;

        this.createUI();
        this.loadSettings();
        this.attachEventListeners();
    }

    /**
     * Create the bottom sheet HTML structure
     */
    createUI() {
        // Create overlay backdrop
        const overlay = document.createElement('div');
        overlay.id = 'settings-overlay-mobile';
        overlay.className = 'settings-overlay-mobile';

        // Create bottom sheet
        const sheet = document.createElement('div');
        sheet.id = 'settings-sheet';
        sheet.className = 'settings-sheet';

        sheet.innerHTML = `
            <div class="settings-sheet__header">
                <h2 class="settings-sheet__title">Settings</h2>
                <button class="settings-sheet__close" aria-label="Close settings">×</button>
            </div>

            <div class="settings-sheet__content">
                <!-- Game Settings Section -->
                <section class="settings-section">
                    <h3 class="settings-section__title">Game</h3>

                    <div class="settings-item">
                        <label for="mobile-year">Card Year</label>
                        <select id="mobile-year" class="settings-select">
                            <option value="2025">2025</option>
                            <option value="2020">2020</option>
                            <option value="2019">2019</option>
                            <option value="2018">2018</option>
                            <option value="2017">2017</option>
                        </select>
                    </div>

                    <div class="settings-item">
                        <label for="mobile-difficulty">AI Difficulty</label>
                        <select id="mobile-difficulty" class="settings-select">
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    <div class="settings-item settings-item--toggle">
                        <label for="mobile-blank-tiles">Use Blank Tiles</label>
                        <input type="checkbox" id="mobile-blank-tiles" class="settings-checkbox">
                    </div>
                </section>

                <!-- Audio Settings Section -->
                <section class="settings-section">
                    <h3 class="settings-section__title">Audio</h3>

                    <div class="settings-item">
                        <label for="mobile-bgm-volume">
                            Music Volume
                            <span class="volume-value" id="mobile-bgm-value">70</span>
                        </label>
                        <div class="volume-control">
                            <input type="range" id="mobile-bgm-volume" class="settings-slider"
                                   min="0" max="100" step="1" value="70">
                            <label class="mute-toggle">
                                <input type="checkbox" id="mobile-bgm-mute">
                                <span>Mute</span>
                            </label>
                        </div>
                    </div>

                    <div class="settings-item">
                        <label for="mobile-sfx-volume">
                            Sound Effects
                            <span class="volume-value" id="mobile-sfx-value">80</span>
                        </label>
                        <div class="volume-control">
                            <input type="range" id="mobile-sfx-volume" class="settings-slider"
                                   min="0" max="100" step="1" value="80">
                            <label class="mute-toggle">
                                <input type="checkbox" id="mobile-sfx-mute">
                                <span>Mute</span>
                            </label>
                        </div>
                    </div>
                </section>

                <!-- Training Mode Section (Optional) -->
                <section class="settings-section">
                    <h3 class="settings-section__title">Training Mode</h3>

                    <div class="settings-item settings-item--toggle">
                        <label for="mobile-training-mode">Enable Training Mode</label>
                        <input type="checkbox" id="mobile-training-mode" class="settings-checkbox">
                    </div>

                    <div class="settings-item" id="mobile-training-controls" style="display: none;">
                        <label for="mobile-training-tiles">Starting Tiles</label>
                        <select id="mobile-training-tiles" class="settings-select">
                            <option value="9">9 tiles</option>
                            <option value="10">10 tiles</option>
                            <option value="11">11 tiles</option>
                            <option value="12">12 tiles</option>
                            <option value="13">13 tiles</option>
                            <option value="14">14 tiles</option>
                        </select>
                    </div>

                    <div class="settings-item settings-item--toggle" id="mobile-training-skip" style="display: none;">
                        <label for="mobile-skip-charleston">Skip Charleston</label>
                        <input type="checkbox" id="mobile-skip-charleston" class="settings-checkbox">
                    </div>
                </section>
            </div>

            <div class="settings-sheet__footer">
                <button class="settings-btn settings-btn--secondary" id="mobile-settings-reset">
                    Reset to Defaults
                </button>
                <button class="settings-btn settings-btn--primary" id="mobile-settings-save">
                    Save & Close
                </button>
            </div>
        `;

        overlay.appendChild(sheet);
        document.body.appendChild(overlay);

        this.sheet = sheet;
        this.overlay = overlay;
    }

    /**
     * Load current settings from SettingsManager
     */
    loadSettings() {
        const settings = SettingsManager.load();

        // Game settings
        document.getElementById('mobile-year').value = settings.cardYear;
        document.getElementById('mobile-difficulty').value = settings.difficulty;
        document.getElementById('mobile-blank-tiles').checked = settings.useBlankTiles;

        // Audio settings
        document.getElementById('mobile-bgm-volume').value = settings.bgmVolume;
        document.getElementById('mobile-bgm-value').textContent = settings.bgmVolume;
        document.getElementById('mobile-bgm-mute').checked = settings.bgmMuted;

        document.getElementById('mobile-sfx-volume').value = settings.sfxVolume;
        document.getElementById('mobile-sfx-value').textContent = settings.sfxVolume;
        document.getElementById('mobile-sfx-mute').checked = settings.sfxMuted;

        // Training mode
        document.getElementById('mobile-training-mode').checked = settings.trainingMode;
        document.getElementById('mobile-training-tiles').value = settings.trainingTileCount;
        document.getElementById('mobile-skip-charleston').checked = settings.skipCharleston;

        // Show/hide training controls
        this.updateTrainingVisibility(settings.trainingMode);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Open button (in mobile UI)
        const openBtn = document.getElementById('mobile-settings-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => this.open());
        }

        // Close button
        this.sheet.querySelector('.settings-sheet__close').addEventListener('click', () => this.close());

        // Overlay click (close on backdrop tap)
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Volume sliders (update value display)
        document.getElementById('mobile-bgm-volume').addEventListener('input', (e) => {
            document.getElementById('mobile-bgm-value').textContent = e.target.value;
        });

        document.getElementById('mobile-sfx-volume').addEventListener('input', (e) => {
            document.getElementById('mobile-sfx-value').textContent = e.target.value;
        });

        // Training mode toggle (show/hide controls)
        document.getElementById('mobile-training-mode').addEventListener('change', (e) => {
            this.updateTrainingVisibility(e.target.checked);
        });

        // Save button
        document.getElementById('mobile-settings-save').addEventListener('click', () => {
            this.saveSettings();
            this.close();
        });

        // Reset button
        document.getElementById('mobile-settings-reset').addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
                SettingsManager.reset();
                this.loadSettings();
            }
        });
    }

    /**
     * Save current UI values to SettingsManager
     */
    saveSettings() {
        const settings = {
            cardYear: parseInt(document.getElementById('mobile-year').value),
            difficulty: document.getElementById('mobile-difficulty').value,
            useBlankTiles: document.getElementById('mobile-blank-tiles').checked,

            bgmVolume: parseInt(document.getElementById('mobile-bgm-volume').value),
            bgmMuted: document.getElementById('mobile-bgm-mute').checked,
            sfxVolume: parseInt(document.getElementById('mobile-sfx-volume').value),
            sfxMuted: document.getElementById('mobile-sfx-mute').checked,

            trainingMode: document.getElementById('mobile-training-mode').checked,
            trainingTileCount: parseInt(document.getElementById('mobile-training-tiles').value),
            skipCharleston: document.getElementById('mobile-skip-charleston').checked,
            trainingHand: ""  // Not used on mobile
        };

        SettingsManager.save(settings);
        console.log('Settings saved:', settings);

        // Dispatch event so game can react to settings changes
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
    }

    /**
     * Show/hide training mode controls
     */
    updateTrainingVisibility(enabled) {
        const controls = document.getElementById('mobile-training-controls');
        const skipControl = document.getElementById('mobile-training-skip');

        if (controls) {
            controls.style.display = enabled ? 'block' : 'none';
        }
        if (skipControl) {
            skipControl.style.display = enabled ? 'flex' : 'none';
        }
    }

    /**
     * Open settings sheet
     */
    open() {
        this.isOpen = true;
        this.overlay.classList.add('open');
        this.sheet.classList.add('open');
        document.body.style.overflow = 'hidden';  // Prevent scrolling
    }

    /**
     * Close settings sheet
     */
    close() {
        this.isOpen = false;
        this.overlay.classList.remove('open');
        this.sheet.classList.remove('open');
        document.body.style.overflow = '';
    }
}

export default SettingsSheet;
```

---

### 2. Mobile Settings Styles

**File:** `mobile/styles/SettingsSheet.css`

```css
/* Settings Sheet - Mobile Bottom Sheet */

.settings-overlay-mobile {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.settings-overlay-mobile.open {
    display: block;
    opacity: 1;
}

.settings-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 85vh;
    background: linear-gradient(to bottom, #044328, #0c6d3a);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    transform: translateY(100%);
    transition: transform 0.3s ease-out;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.settings-sheet.open {
    transform: translateY(0);
}

/* Header */
.settings-sheet__header {
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.settings-sheet__title {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: #f5fbf7;
    font-family: 'Courier New', monospace;
}

.settings-sheet__close {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #f5fbf7;
    font-size: 32px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.settings-sheet__close:active {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(0.95);
}

/* Content */
.settings-sheet__content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    -webkit-overflow-scrolling: touch;
}

.settings-section {
    margin-bottom: 24px;
}

.settings-section__title {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    color: #ffd166;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'Courier New', monospace;
}

/* Settings Items */
.settings-item {
    margin-bottom: 16px;
}

.settings-item label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: #f5fbf7;
    font-family: 'Courier New', monospace;
}

.volume-value {
    float: right;
    color: #ffd166;
    font-weight: 600;
}

/* Select Inputs */
.settings-select {
    width: 100%;
    padding: 12px;
    font-size: 16px;
    font-family: 'Courier New', monospace;
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #1f1400;
    cursor: pointer;
}

/* Checkbox Toggles */
.settings-item--toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.settings-item--toggle label {
    margin: 0;
    flex: 1;
}

.settings-checkbox {
    width: 48px;
    height: 28px;
    appearance: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    position: relative;
    cursor: pointer;
    transition: background 0.3s;
}

.settings-checkbox:checked {
    background: #ffd166;
}

.settings-checkbox::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
}

.settings-checkbox:checked::after {
    transform: translateX(20px);
}

/* Sliders */
.settings-slider {
    width: 100%;
    height: 6px;
    appearance: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
    outline: none;
    margin-bottom: 8px;
}

.settings-slider::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    background: #ffd166;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.settings-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: #ffd166;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.volume-control {
    display: flex;
    flex-direction: column;
}

.mute-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(245, 251, 247, 0.8);
    cursor: pointer;
}

.mute-toggle input {
    width: auto;
}

/* Footer */
.settings-sheet__footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    flex-shrink: 0;
}

.settings-btn {
    flex: 1;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.settings-btn--primary {
    background: #ffd166;
    color: #1f1400;
}

.settings-btn--primary:active {
    background: #ffda7a;
    transform: scale(0.98);
}

.settings-btn--secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #f5fbf7;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.settings-btn--secondary:active {
    background: rgba(255, 255, 255, 0.15);
}
```

---

### 3. Desktop Settings Integration

**File to Update:** `settings.js`

Add SettingsManager integration to existing desktop settings:

```javascript
// At top of settings.js
import SettingsManager from './shared/SettingsManager.js';

class SettingsManager {
    constructor() {
        // ... existing constructor code ...
    }

    loadSettings() {
        // Replace all localStorage.getItem() calls with SettingsManager
        const settings = SettingsManager.load();

        // Apply to UI
        document.getElementById("yearSelect").value = settings.cardYear;
        document.getElementById("useBlankTiles").checked = settings.useBlankTiles;
        document.getElementById("bgmVolume").value = settings.bgmVolume;
        // ... etc.
    }

    saveSettings() {
        // Collect UI values
        const settings = {
            cardYear: parseInt(document.getElementById("yearSelect").value),
            useBlankTiles: document.getElementById("useBlankTiles").checked,
            // ... all other settings
        };

        // Save via SettingsManager
        SettingsManager.save(settings);

        // Dispatch event
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: settings }));
    }
}
```

---

### 4. Responsive Breakpoint

**File to Update:** `styles.css` (desktop)

Add media query to make desktop settings responsive:

```css
/* Desktop Settings Overlay (existing) */
.settings-overlay {
    /* ... existing styles ... */
}

/* Mobile Adaptation (< 768px) */
@media (max-width: 768px) {
    .settings-overlay {
        /* Hide desktop settings on mobile */
        display: none !important;
    }

    /* Mobile settings button should trigger SettingsSheet instead */
    #settings {
        /* Button still visible, but opens mobile sheet */
    }
}
```

---

## Integration Steps

### Step 1: Initialize SettingsSheet

In `mobile/main.js`:

```javascript
import SettingsSheet from './components/SettingsSheet.js';
import SettingsManager from '../shared/SettingsManager.js';

// Initialize settings sheet
const settingsSheet = new SettingsSheet();

// Load settings on startup
const settings = SettingsManager.load();
console.log('Loaded settings:', settings);

// Listen for settings changes
window.addEventListener('settingsChanged', (event) => {
    const newSettings = event.detail;
    console.log('Settings changed:', newSettings);

    // Update game (e.g., change AI difficulty)
    if (gameController) {
        gameController.updateSettings(newSettings);
    }
});
```

### Step 2: Add Settings Button to Mobile UI

In `mobile/index.html`, add settings button to bottom menu:

```html
<div class="bottom-menu">
    <button class="menu-btn menu-btn--primary" id="drawBtn">
        DRAW
    </button>
    <button class="menu-btn" id="sortBtn">
        SORT
    </button>
    <button class="menu-btn" id="mobile-settings-btn">
        ⚙️ SETTINGS
    </button>
</div>
```

---

## Testing Checklist

### Functional Testing

1. **Mobile Bottom Sheet:**
   - [ ] Opens with smooth slide-up animation
   - [ ] Closes on backdrop tap
   - [ ] Closes on X button
   - [ ] Prevents body scroll when open

2. **Settings Persistence:**
   - [ ] Change setting → Save → Reload page → Verify persisted
   - [ ] Both desktop and mobile see same settings
   - [ ] Cross-tab sync works (change in one tab, see in another)

3. **Responsive Behavior:**
   - [ ] Desktop shows overlay modal (> 768px)
   - [ ] Mobile shows bottom sheet (< 768px)
   - [ ] Breakpoint transition works smoothly

4. **Touch Interactions:**
   - [ ] All touch targets are >= 44px (iOS guideline)
   - [ ] Sliders work smoothly with touch
   - [ ] Toggle switches are easy to tap

### Visual Testing

Test in:
- [ ] iPhone 12 (390x844) - Safari
- [ ] iPhone SE (375x667) - Safari
- [ ] Android Phone (360x740) - Chrome
- [ ] iPad (768x1024) - Safari (should use mobile sheet)

---

## Expected Output

When complete, provide:

1. ✅ `mobile/components/SettingsSheet.js` created
2. ✅ `mobile/styles/SettingsSheet.css` created
3. ✅ `settings.js` updated to use `SettingsManager`
4. ✅ `styles.css` updated with responsive breakpoint
5. ✅ Screenshots:
   - Mobile bottom sheet open
   - Desktop overlay modal
   - Settings persisting across reload

---

## File Locations Summary

```
mobile/
├── components/
│   └── SettingsSheet.js         # NEW - Mobile settings UI
└── styles/
    └── SettingsSheet.css        # NEW - Mobile settings styles

settings.js                      # UPDATED - Use SettingsManager
styles.css                       # UPDATED - Responsive breakpoint
```

---

## Resources

- [shared/SettingsManager.js](shared/SettingsManager.js) - Settings persistence layer
- [settings.js](settings.js) - Desktop settings implementation
- [mobile/mockup.css](mobile/mockup.css) - Mobile design system colors

---

## Notes

- The bottom sheet design is standard on mobile (iOS/Android)
- Touch targets follow Apple's 44pt minimum guideline
- The slide-up animation uses CSS transforms (GPU-accelerated)
- The backdrop blur effect may not work on all browsers (graceful degradation)
- Training mode is simplified on mobile (no hand selection dropdown)
