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
            if (window.confirm('Reset all settings to defaults?')) {
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
        window.dispatchEvent(new window.CustomEvent('settingsChanged', { detail: settings }));
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