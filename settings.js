import {debugPrint} from "./utils.js";
import SettingsManager from "./shared/SettingsManager.js";

// Settings.js - Settings management for American Mahjong
class DesktopSettingsManager {
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

    // Settings persistence using SettingsManager
    saveSetting(key, value) {
        try {
            SettingsManager.set(key, value);
        } catch (error) {
            console.warn("Failed to save setting:", error);
        }
    }

    getSetting(key, defaultValue = null) {
        return SettingsManager.get(key) ?? defaultValue;
    }

    getAllSettings() {
        return SettingsManager.load();
    }

    loadSettings() {
        // Load and apply saved settings from SettingsManager
        const settings = SettingsManager.load();
        debugPrint("Loaded settings:", settings);

        // Apply training mode settings
        this.applyTrainingSettings(settings);

        // Apply difficulty settings
        this.applyDifficultySettings(settings);

        // Apply year selection settings
        this.applyYearSettings(settings);

        // Apply house rules settings
        this.applyHouseRuleSettings(settings);
        
        // Apply audio settings
        this.applyAudioSettings(settings);
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
        const settings = {};
        
        settings.trainingMode = document.getElementById("trainCheckbox")?.checked ?? false;
        settings.trainingHand = document.getElementById("handSelect")?.value ?? "";
        settings.trainingTileCount = parseInt(document.getElementById("numTileSelect")?.value ?? "9", 10);
        settings.skipCharleston = document.getElementById("skipCharlestonCheckbox")?.checked ?? true;

        // Save settings to SettingsManager
        SettingsManager.save(settings);
        
        // Dispatch event so game can react to settings changes
        window.dispatchEvent(new window.CustomEvent("settingsChanged", { detail: settings }));
    }

    saveDifficultySettings() {
        const settings = {};
        settings.aiDifficulty = document.getElementById("difficultySelect")?.value ?? "medium";
        SettingsManager.save(settings);
    }

    saveYearSettings() {
        const settings = {};
        settings.cardYear = parseInt(document.getElementById("yearSelect")?.value ?? "2025", 10);
        SettingsManager.save(settings);
    }

    saveHouseRuleSettings() {
        const settings = {};
        settings.useBlankTiles = document.getElementById("useBlankTiles")?.checked ?? false;
        SettingsManager.save(settings);
    }

    saveAudioSettings() {
        const settings = {};
        
        settings.bgmVolume = parseInt(document.getElementById("bgmVolume")?.value ?? "70", 10);
        settings.bgmMuted = document.getElementById("bgmMute")?.checked ?? false;
        settings.sfxVolume = parseInt(document.getElementById("sfxVolume")?.value ?? "80", 10);
        settings.sfxMuted = document.getElementById("sfxMute")?.checked ?? false;
        
        SettingsManager.save(settings);
    }

    applyHouseRuleSettings(settings) {
        const useBlankTiles = document.getElementById("useBlankTiles");
        if (useBlankTiles) {
            useBlankTiles.checked = settings.useBlankTiles;
        }
    }
    
    applyAudioSettings(settings) {
        // Apply audio settings to UI
        const bgmVolumeSlider = document.getElementById("bgmVolume");
        const bgmVolumeValue = document.getElementById("bgmVolumeValue");
        const bgmMuteCheckbox = document.getElementById("bgmMute");
        const sfxVolumeSlider = document.getElementById("sfxVolume");
        const sfxVolumeValue = document.getElementById("sfxVolumeValue");
        const sfxMuteCheckbox = document.getElementById("sfxMute");
        
        if (bgmVolumeSlider) {
            bgmVolumeSlider.value = settings.bgmVolume;
            if (bgmVolumeValue) {
                bgmVolumeValue.textContent = `${settings.bgmVolume}%`;
            }
        }
        
        if (bgmMuteCheckbox) {
            bgmMuteCheckbox.checked = settings.bgmMuted;
        }
        
        if (sfxVolumeSlider) {
            sfxVolumeSlider.value = settings.sfxVolume;
            if (sfxVolumeValue) {
                sfxVolumeValue.textContent = `${settings.sfxVolume}%`;
            }
        }
        
        if (sfxMuteCheckbox) {
            sfxMuteCheckbox.checked = settings.sfxMuted;
        }
    }

    getUseBlankTiles() {
        return SettingsManager.get("useBlankTiles");
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

        // Load settings from SettingsManager
        const settings = SettingsManager.load();

        // BGM volume slider - update UI and audio manager, but don't save to SettingsManager yet
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

        // BGM mute checkbox - update audio manager, but don't save to SettingsManager yet
        if (bgmMuteCheckbox) {
            bgmMuteCheckbox.addEventListener("change", (e) => {
                const muted = e.target.checked;
                this.updateAudioManager("bgmMuted", muted);
            });
        }

        // SFX volume slider - update UI and audio manager, but don't save to SettingsManager yet
        if (sfxVolumeSlider) {
            sfxVolumeSlider.addEventListener("input", (e) => {
                const volume = parseInt(e.target.value, 10) / 100;
                if (sfxVolumeValue) {
                    sfxVolumeValue.textContent = `${e.target.value}%`;
                }
                this.updateAudioManager("sfxVolume", volume);
            });
        }

        // SFX mute checkbox - update audio manager, but don't save to SettingsManager yet
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
    window.settingsManager = new DesktopSettingsManager();
    
    // Listen for settings changes from mobile
    window.addEventListener("settingsChanged", (event) => {
        const newSettings = event.detail;
        console.log("Settings changed from mobile:", newSettings);
        
        // Update UI if settings panel is open
        if (window.settingsManager && window.settingsManager.overlay.style.display !== "none") {
            window.settingsManager.loadSettings();
        }
        
        // Update game if needed
        if (window.game && window.game.scene && window.game.scene.getScene("GameScene")) {
            const scene = window.game.scene.getScene("GameScene");
            if (scene.gGameLogic) {
                // Check if card year changed
                const oldYear = window.settingsManager.getCardYear();
                if (newSettings.cardYear && oldYear !== newSettings.cardYear) {
                    // Reinitialize card with new year
                    scene.gGameLogic.init().then(() => {
                        debugPrint(`Card year updated to ${newSettings.cardYear}`);
                    });
                }
            }
        }
    });
});

export default DesktopSettingsManager;
