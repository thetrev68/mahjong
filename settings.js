import {debugPrint} from "./utils.js";

// Settings.js - Settings management for American Mahjong
class SettingsManager {
    constructor() {
        this.overlay = document.getElementById("settings-overlay");
        this.saveButton = document.getElementById("settings-save");
        this.cancelButton = document.getElementById("settings-cancel");
        this.settingsButton = document.getElementById("settings");

        // Store original settings for cancel functionality
        this.originalSettings = {};

        this.init();
        this.loadSettings();
    }

    init() {
        // Settings button event listener
        this.settingsButton.addEventListener("click", () => {
            this.showSettings();
        });

        // Save button event listener
        this.saveButton.addEventListener("click", () => {
            this.saveAndClose();
        });

        // Cancel button event listener
        this.cancelButton.addEventListener("click", () => {
            this.cancelAndClose();
        });

        // Close on overlay click (outside container)
        this.overlay.addEventListener("click", (event) => {
            if (event.target === this.overlay) {
                this.cancelAndClose();
            }
        });

        // Close on Escape key - cancel instead of back
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.overlay.style.display !== "none") {
                this.cancelAndClose();
            }
        });

        // Training mode checkbox change listener - only update visibility, don't auto-save
        const trainCheckbox = document.getElementById("trainCheckbox");
        if (trainCheckbox) {
            trainCheckbox.addEventListener("change", () => {
                this.updateTrainingFormVisibility();
            });
        }

        // Audio controls event listeners
        this.setupAudioControls();
    }

    showSettings() {
        this.overlay.style.display = "flex";
        // Store current settings state for cancel functionality
        this.storeCurrentSettingsState();
        // Focus management for accessibility
        this.saveButton.focus();
    }

    hideSettings() {
        this.overlay.style.display = "none";
        // Return focus to settings button
        this.settingsButton.focus();
    }

    storeCurrentSettingsState() {
        // Store all current UI values to restore if user cancels
        this.originalSettings = {
            trainingMode: document.getElementById("trainCheckbox")?.checked ?? false,
            trainingHand: document.getElementById("handSelect")?.value ?? "",
            trainingTileCount: document.getElementById("numTileSelect")?.value ?? "9",
            skipCharleston: document.getElementById("skipCharlestonCheckbox")?.checked ?? false,
            cardYear: document.getElementById("yearSelect")?.value ?? "2025",
            useBlankTiles: document.getElementById("useBlankTiles")?.checked ?? false,
            bgmVolume: document.getElementById("bgmVolume")?.value ?? "70",
            bgmMuted: document.getElementById("bgmMute")?.checked ?? false,
            sfxVolume: document.getElementById("sfxVolume")?.value ?? "80",
            sfxMuted: document.getElementById("sfxMute")?.checked ?? false
        };
    }

    restoreOriginalSettings() {
        // Restore all UI elements to their original values
        const trainCheckbox = document.getElementById("trainCheckbox");
        const handSelect = document.getElementById("handSelect");
        const numTileSelect = document.getElementById("numTileSelect");
        const skipCharlestonCheckbox = document.getElementById("skipCharlestonCheckbox");
        const yearSelect = document.getElementById("yearSelect");
        const useBlankTiles = document.getElementById("useBlankTiles");
        const bgmVolumeSlider = document.getElementById("bgmVolume");
        const bgmVolumeValue = document.getElementById("bgmVolumeValue");
        const bgmMuteCheckbox = document.getElementById("bgmMute");
        const sfxVolumeSlider = document.getElementById("sfxVolume");
        const sfxVolumeValue = document.getElementById("sfxVolumeValue");
        const sfxMuteCheckbox = document.getElementById("sfxMute");

        if (trainCheckbox) trainCheckbox.checked = this.originalSettings.trainingMode;
        if (handSelect) handSelect.value = this.originalSettings.trainingHand;
        if (numTileSelect) numTileSelect.value = this.originalSettings.trainingTileCount;
        if (skipCharlestonCheckbox) skipCharlestonCheckbox.checked = this.originalSettings.skipCharleston;
        if (yearSelect) yearSelect.value = this.originalSettings.cardYear;
        if (useBlankTiles) useBlankTiles.checked = this.originalSettings.useBlankTiles;

        if (bgmVolumeSlider) {
            bgmVolumeSlider.value = this.originalSettings.bgmVolume;
            if (bgmVolumeValue) {
                bgmVolumeValue.textContent = `${this.originalSettings.bgmVolume}%`;
            }
        }
        if (bgmMuteCheckbox) bgmMuteCheckbox.checked = this.originalSettings.bgmMuted;

        if (sfxVolumeSlider) {
            sfxVolumeSlider.value = this.originalSettings.sfxVolume;
            if (sfxVolumeValue) {
                sfxVolumeValue.textContent = `${this.originalSettings.sfxVolume}%`;
            }
        }
        if (sfxMuteCheckbox) sfxMuteCheckbox.checked = this.originalSettings.sfxMuted;

        // Update form visibility
        this.updateTrainingFormVisibility();
    }

    saveAndClose() {
        // Check if card year changed before saving
        const oldYear = this.getSetting("cardYear", "2025");
        const newYear = document.getElementById("yearSelect")?.value ?? "2025";
        const yearChanged = oldYear !== newYear;

        // Save all current settings
        this.saveTrainingSettings();
        this.saveDifficultySettings();
        this.saveYearSettings();
        this.saveHouseRuleSettings();
        this.saveAudioSettings();

        // If year changed, reinitialize the card in game logic
        if (yearChanged && window.game && window.game.scene && window.game.scene.getScene("GameScene")) {
            const scene = window.game.scene.getScene("GameScene");
            if (scene.gGameLogic) {
                // Clear hand select before reinitializing
                const handSelect = document.getElementById("handSelect");
                if (handSelect) {
                    handSelect.innerHTML = "";
                }
                // Reinitialize card with new year
                scene.gGameLogic.init().then(() => {
                    debugPrint(`Card year updated to ${newYear}`);
                });
            }
        }

        this.hideSettings();
    }

    cancelAndClose() {
        // Restore original settings and close without saving
        this.restoreOriginalSettings();
        this.hideSettings();
    }

    getDifficulty() {
        return this.getSetting("aiDifficulty", "medium");
    }

    getCardYear() {
        return this.getSetting("cardYear", "2025");
    }

    // Settings persistence using localStorage
    saveSetting(key, value) {
        try {
            const settings = this.getAllSettings();
            settings[key] = value;
            localStorage.setItem("mahjong-settings", JSON.stringify(settings));
        } catch (error) {
            console.warn("Failed to save setting:", error);
        }
    }

    getSetting(key, defaultValue = null) {
        const settings = this.getAllSettings();

        if (Object.prototype.hasOwnProperty.call(settings, key)) {
            return settings[key];
        }

        return defaultValue;
    }

    getAllSettings() {
        try {
            const stored = localStorage.getItem("mahjong-settings");

            if (stored) {
                return JSON.parse(stored);
            }

            return {};
        } catch (error) {
            console.warn("Failed to load settings:", error);

            return {};
        }
    }

    loadSettings() {
        // Load and apply saved settings
        const settings = this.getAllSettings();
        debugPrint("Loaded settings:", settings);

        // Apply training mode settings
        this.applyTrainingSettings(settings);

        // Apply difficulty settings
        this.applyDifficultySettings(settings);

        // Apply year selection settings
        this.applyYearSettings(settings);

        // Apply house rules settings
        this.applyHouseRuleSettings(settings);
    }

    applyTrainingSettings(settings) {
        const trainCheckbox = document.getElementById("trainCheckbox");
        const handSelect = document.getElementById("handSelect");
        const numTileSelect = document.getElementById("numTileSelect");
        const skipCharlestonCheckbox = document.getElementById("skipCharlestonCheckbox");

        if (trainCheckbox && Object.prototype.hasOwnProperty.call(settings, "trainingMode")) {
            trainCheckbox.checked = settings.trainingMode;
        }

        if (handSelect && settings.trainingHand) {
            handSelect.value = settings.trainingHand;
        }

        if (numTileSelect && settings.trainingTileCount) {
            numTileSelect.value = settings.trainingTileCount.toString();
        }

        if (skipCharlestonCheckbox && Object.prototype.hasOwnProperty.call(settings, "skipCharleston")) {
            skipCharlestonCheckbox.checked = settings.skipCharleston;
        }

        // Update form visibility based on loaded settings
        this.updateTrainingFormVisibility();
    }

    applyDifficultySettings(settings) {
        const difficultySelect = document.getElementById("difficultySelect");
        if (difficultySelect && settings.aiDifficulty) {
            difficultySelect.value = settings.aiDifficulty;
        }
    }

    applyYearSettings(settings) {
        const yearSelect = document.getElementById("yearSelect");

        if (yearSelect && settings.cardYear) {
            yearSelect.value = settings.cardYear;
        }
    }

    updateTrainingFormVisibility() {
        const trainCheckbox = document.getElementById("trainCheckbox");
        const trainFieldset2 = document.getElementById("trainfieldset2");

        if (trainCheckbox && trainFieldset2) {
            trainFieldset2.disabled = !trainCheckbox.checked;
        }
    }

    saveTrainingSettings() {
        const trainCheckbox = document.getElementById("trainCheckbox");
        const handSelect = document.getElementById("handSelect");
        const numTileSelect = document.getElementById("numTileSelect");
        const skipCharlestonCheckbox = document.getElementById("skipCharlestonCheckbox");

        const trainingSettings = {};

        if (trainCheckbox) {
            trainingSettings.trainingMode = trainCheckbox.checked;
        } else {
            trainingSettings.trainingMode = false;
        }

        if (handSelect) {
            trainingSettings.trainingHand = handSelect.value;
        } else {
            trainingSettings.trainingHand = "";
        }

        if (numTileSelect) {
            trainingSettings.trainingTileCount = parseInt(numTileSelect.value, 10);
        } else {
            trainingSettings.trainingTileCount = 9;
        }

        if (skipCharlestonCheckbox) {
            trainingSettings.skipCharleston = skipCharlestonCheckbox.checked;
        } else {
            trainingSettings.skipCharleston = true;
        }

        // Save each setting individually
        Object.keys(trainingSettings).forEach((key) => {
            this.saveSetting(key, trainingSettings[key]);
        });
    }

    saveDifficultySettings() {
        const difficultySelect = document.getElementById("difficultySelect");
        if (difficultySelect) {
            this.saveSetting("aiDifficulty", difficultySelect.value);
        }
    }

    saveYearSettings() {
        const yearSelect = document.getElementById("yearSelect");
        if (yearSelect) {
            this.saveSetting("cardYear", yearSelect.value);
        }
    }

    saveHouseRuleSettings() {
        const useBlankTiles = document.getElementById("useBlankTiles");
        if (useBlankTiles) {
            this.saveSetting("useBlankTiles", useBlankTiles.checked);
        }
    }

    saveAudioSettings() {
        const bgmVolumeSlider = document.getElementById("bgmVolume");
        const bgmMuteCheckbox = document.getElementById("bgmMute");
        const sfxVolumeSlider = document.getElementById("sfxVolume");
        const sfxMuteCheckbox = document.getElementById("sfxMute");

        if (bgmVolumeSlider) {
            const volume = parseInt(bgmVolumeSlider.value, 10) / 100;
            this.saveSetting("bgmVolume", volume);
        }
        if (bgmMuteCheckbox) {
            this.saveSetting("bgmMuted", bgmMuteCheckbox.checked);
        }
        if (sfxVolumeSlider) {
            const volume = parseInt(sfxVolumeSlider.value, 10) / 100;
            this.saveSetting("sfxVolume", volume);
        }
        if (sfxMuteCheckbox) {
            this.saveSetting("sfxMuted", sfxMuteCheckbox.checked);
        }
    }

    applyHouseRuleSettings(settings) {
        const useBlankTiles = document.getElementById("useBlankTiles");
        if (useBlankTiles && Object.prototype.hasOwnProperty.call(settings, "useBlankTiles")) {
            useBlankTiles.checked = settings.useBlankTiles;
        }
    }

    getUseBlankTiles() {
        return this.getSetting("useBlankTiles", false);
    }

    // Audio controls setup and management
    setupAudioControls() {
        const bgmVolumeSlider = document.getElementById("bgmVolume");
        const bgmVolumeValue = document.getElementById("bgmVolumeValue");
        const bgmMuteCheckbox = document.getElementById("bgmMute");
        const sfxVolumeSlider = document.getElementById("sfxVolume");
        const sfxVolumeValue = document.getElementById("sfxVolumeValue");
        const sfxMuteCheckbox = document.getElementById("sfxMute");

        debugPrint("Setting up audio controls...", {
            bgmVolumeSlider: !!bgmVolumeSlider,
            bgmMuteCheckbox: !!bgmMuteCheckbox,
            sfxVolumeSlider: !!sfxVolumeSlider,
            sfxMuteCheckbox: !!sfxMuteCheckbox
        });

        // Load saved audio settings
        const savedBgmVolume = this.getSetting("bgmVolume", 0.7);
        const savedBgmMuted = this.getSetting("bgmMuted", false);
        const savedSfxVolume = this.getSetting("sfxVolume", 0.8);
        const savedSfxMuted = this.getSetting("sfxMuted", false);

        // Apply saved settings to UI
        if (bgmVolumeSlider) {
            bgmVolumeSlider.value = Math.round(savedBgmVolume * 100);
            if (bgmVolumeValue) {
                bgmVolumeValue.textContent = `${Math.round(savedBgmVolume * 100)}%`;
            }
        }
        if (bgmMuteCheckbox) {
            bgmMuteCheckbox.checked = savedBgmMuted;
        }
        if (sfxVolumeSlider) {
            sfxVolumeSlider.value = Math.round(savedSfxVolume * 100);
            if (sfxVolumeValue) {
                sfxVolumeValue.textContent = `${Math.round(savedSfxVolume * 100)}%`;
            }
        }
        if (sfxMuteCheckbox) {
            sfxMuteCheckbox.checked = savedSfxMuted;
        }

        // BGM volume slider - update UI and audio manager, but don't save to localStorage yet
        if (bgmVolumeSlider) {
            bgmVolumeSlider.addEventListener("input", (e) => {
                const volume = parseInt(e.target.value, 10) / 100;
                debugPrint(`BGM volume changed to: ${volume}`);
                if (bgmVolumeValue) {
                    bgmVolumeValue.textContent = `${e.target.value}%`;
                }
                this.updateAudioManager("bgmVolume", volume);
            });
        }

        // BGM mute checkbox - update audio manager, but don't save to localStorage yet
        if (bgmMuteCheckbox) {
            bgmMuteCheckbox.addEventListener("change", (e) => {
                const muted = e.target.checked;
                this.updateAudioManager("bgmMuted", muted);
            });
        }

        // SFX volume slider - update UI and audio manager, but don't save to localStorage yet
        if (sfxVolumeSlider) {
            sfxVolumeSlider.addEventListener("input", (e) => {
                const volume = parseInt(e.target.value, 10) / 100;
                if (sfxVolumeValue) {
                    sfxVolumeValue.textContent = `${e.target.value}%`;
                }
                this.updateAudioManager("sfxVolume", volume);
            });
        }

        // SFX mute checkbox - update audio manager, but don't save to localStorage yet
        if (sfxMuteCheckbox) {
            sfxMuteCheckbox.addEventListener("change", (e) => {
                const muted = e.target.checked;
                this.updateAudioManager("sfxMuted", muted);
            });
        }
    }

    updateAudioManager(setting, value) {
        // Access the audio manager through the game scene if available
        // The game scene will be created after DOM loads, so this may be called before it exists
        debugPrint(`updateAudioManager called: ${setting} = ${value}`);
        debugPrint("window.game exists:", !!window.game);

        if (window.game && window.game.scene && window.game.scene.getScene("GameScene")) {
            const scene = window.game.scene.getScene("GameScene");
            debugPrint("GameScene found, audioManager exists:", !!scene.audioManager);

            if (scene.audioManager) {
                switch (setting) {
                    case "bgmVolume":
                        scene.audioManager.setBGMVolume(value);
                        debugPrint(`Set BGM volume to ${value}`);
                        break;
                    case "bgmMuted":
                        scene.audioManager.muteBGM(value);
                        debugPrint(`Set BGM muted to ${value}`);
                        break;
                    case "sfxVolume":
                        scene.audioManager.setSFXVolume(value);
                        debugPrint(`Set SFX volume to ${value}`);
                        break;
                    case "sfxMuted":
                        scene.audioManager.muteSFX(value);
                        debugPrint(`Set SFX muted to ${value}`);
                        break;
                }
            }
        } else {
            debugPrint("Audio manager not available yet - game scene not created");
        }
    }

    // Framework for future settings sections
    registerSettingSection(sectionId, config) {
        // Placeholder for registering dynamic settings sections
        // Config: { title, controls: [], onChange: callback }
        debugPrint(`Registered settings section: ${sectionId}`, config);
    }
}

// Initialize settings manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.settingsManager = new SettingsManager();
});

export default SettingsManager;
