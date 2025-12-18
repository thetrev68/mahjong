import { debugPrint } from "./utils.js";
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

    // Check localStorage availability
    if (!SettingsManager.isAvailable()) {
      console.error("[DesktopSettings] localStorage is not available!");
    }

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
    this.loadSettings();
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
      trainingMode:
        document.getElementById("trainCheckbox")?.checked ??
        SettingsManager.getDefault("trainingMode"),
      trainingHand:
        document.getElementById("handSelect")?.value ??
        SettingsManager.getDefault("trainingHand"),
      trainingTileCount:
        document.getElementById("numTileSelect")?.value ??
        SettingsManager.getDefault("trainingTileCount").toString(),
      skipCharleston:
        document.getElementById("skipCharlestonCheckbox")?.checked ??
        SettingsManager.getDefault("skipCharleston"),
      cardYear:
        document.getElementById("yearSelect")?.value ??
        SettingsManager.getDefault("cardYear").toString(),
      useBlankTiles:
        document.getElementById("useBlankTiles")?.checked ??
        SettingsManager.getDefault("useBlankTiles"),
      bgmVolume:
        document.getElementById("bgmVolume")?.value ??
        SettingsManager.getDefault("bgmVolume").toString(),
      bgmMuted:
        document.getElementById("bgmMute")?.checked ??
        SettingsManager.getDefault("bgmMuted"),
      sfxVolume:
        document.getElementById("sfxVolume")?.value ??
        SettingsManager.getDefault("sfxVolume").toString(),
      sfxMuted:
        document.getElementById("sfxMute")?.checked ??
        SettingsManager.getDefault("sfxMuted"),
    };
  }

  restoreOriginalSettings() {
    // Restore all UI elements to their original values
    const trainCheckbox = document.getElementById("trainCheckbox");
    const handSelect = document.getElementById("handSelect");
    const numTileSelect = document.getElementById("numTileSelect");
    const skipCharlestonCheckbox = document.getElementById(
      "skipCharlestonCheckbox",
    );
    const yearSelect = document.getElementById("yearSelect");
    const useBlankTiles = document.getElementById("useBlankTiles");
    const bgmVolumeSlider = document.getElementById("bgmVolume");
    const bgmVolumeValue = document.getElementById("bgmVolumeValue");
    const bgmMuteCheckbox = document.getElementById("bgmMute");
    const sfxVolumeSlider = document.getElementById("sfxVolume");
    const sfxVolumeValue = document.getElementById("sfxVolumeValue");
    const sfxMuteCheckbox = document.getElementById("sfxMute");

    if (trainCheckbox)
      trainCheckbox.checked = this.originalSettings.trainingMode;
    if (handSelect) handSelect.value = this.originalSettings.trainingHand;
    if (numTileSelect)
      numTileSelect.value = this.originalSettings.trainingTileCount;
    if (skipCharlestonCheckbox)
      skipCharlestonCheckbox.checked = this.originalSettings.skipCharleston;
    if (yearSelect) yearSelect.value = this.originalSettings.cardYear;
    if (useBlankTiles)
      useBlankTiles.checked = this.originalSettings.useBlankTiles;

    if (bgmVolumeSlider) {
      bgmVolumeSlider.value = this.originalSettings.bgmVolume;
      if (bgmVolumeValue) {
        bgmVolumeValue.textContent = `${this.originalSettings.bgmVolume}%`;
      }
    }
    if (bgmMuteCheckbox)
      bgmMuteCheckbox.checked = this.originalSettings.bgmMuted;

    if (sfxVolumeSlider) {
      sfxVolumeSlider.value = this.originalSettings.sfxVolume;
      if (sfxVolumeValue) {
        sfxVolumeValue.textContent = `${this.originalSettings.sfxVolume}%`;
      }
    }
    if (sfxMuteCheckbox)
      sfxMuteCheckbox.checked = this.originalSettings.sfxMuted;

    // Update form visibility
    this.updateTrainingFormVisibility();
  }

  saveAndClose() {
    // Check if card year changed before saving
    const oldYear = Number(
      this.getSetting("cardYear", SettingsManager.getDefault("cardYear")),
    );
    const newYearValue = parseInt(
      document.getElementById("yearSelect")?.value ??
        SettingsManager.getDefault("cardYear").toString(),
      10,
    );
    const yearChanged = oldYear !== newYearValue;

    // Save all current settings
    this.saveGameSettings();
    this.saveTrainingSettings();
    this.saveDifficultySettings();
    this.saveYearSettings();
    this.saveHouseRuleSettings();
    this.saveAudioSettings();

    // Dispatch settings changed event ONCE after all saves are complete
    const allSettings = SettingsManager.load();
    window.dispatchEvent(
      new window.CustomEvent("settingsChanged", {
        detail: {
          ...allSettings,
          source: "desktop", // Mark as coming from desktop to prevent reload loop
        },
      }),
    );

    // If year changed, reinitialize the card in game logic
    if (
      yearChanged &&
      window.game &&
      window.game.scene &&
      window.game.scene.getScene("GameScene")
    ) {
      const scene = window.game.scene.getScene("GameScene");
      if (scene.gGameLogic) {
        // Clear hand select before reinitializing
        const handSelect = document.getElementById("handSelect");
        if (handSelect) {
          handSelect.innerHTML = "";
        }
        // Reinitialize card with new year
        scene.gGameLogic.init().then(() => {
          debugPrint(`Card year updated to ${newYearValue}`);
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
    return this.getSetting("difficulty", "medium");
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

    // Apply general game settings
    this.applyGameSettings(settings);

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

  applyGameSettings(settings) {
    const skipCharlestonCheckbox = document.getElementById(
      "skipCharlestonCheckbox",
    );

    if (
      skipCharlestonCheckbox &&
      Object.prototype.hasOwnProperty.call(settings, "skipCharleston")
    ) {
      skipCharlestonCheckbox.checked = settings.skipCharleston;
    }
  }

  applyTrainingSettings(settings) {
    const trainCheckbox = document.getElementById("trainCheckbox");
    const handSelect = document.getElementById("handSelect");
    const numTileSelect = document.getElementById("numTileSelect");

    if (
      trainCheckbox &&
      Object.prototype.hasOwnProperty.call(settings, "trainingMode")
    ) {
      trainCheckbox.checked = settings.trainingMode;
    }

    if (handSelect && settings.trainingHand) {
      handSelect.value = settings.trainingHand;
    }

    if (numTileSelect && settings.trainingTileCount) {
      numTileSelect.value = settings.trainingTileCount.toString();
    }

    // Update form visibility based on loaded settings
    this.updateTrainingFormVisibility();
  }

  applyDifficultySettings(settings) {
    const difficultySelect = document.getElementById("difficultySelect");
    if (difficultySelect && settings.difficulty) {
      difficultySelect.value = settings.difficulty;
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

  saveGameSettings() {
    const settings = {};
    settings.skipCharleston =
      document.getElementById("skipCharlestonCheckbox")?.checked ??
      SettingsManager.getDefault("skipCharleston");
    SettingsManager.save(settings);
  }

  saveTrainingSettings() {
    const settings = {};

    settings.trainingMode =
      document.getElementById("trainCheckbox")?.checked ??
      SettingsManager.getDefault("trainingMode");
    settings.trainingHand =
      document.getElementById("handSelect")?.value ??
      SettingsManager.getDefault("trainingHand");
    settings.trainingTileCount = parseInt(
      document.getElementById("numTileSelect")?.value ??
        SettingsManager.getDefault("trainingTileCount").toString(),
      10,
    );

    // Save settings to SettingsManager
    SettingsManager.save(settings);

    // DON'T dispatch event here - it will be dispatched once at the end of saveAndClose()
    // to avoid reloading settings before all saves are complete
  }

  saveDifficultySettings() {
    const settings = {};
    settings.difficulty =
      document.getElementById("difficultySelect")?.value ??
      SettingsManager.getDefault("difficulty");
    SettingsManager.save(settings);
  }

  saveYearSettings() {
    const settings = {};
    settings.cardYear = parseInt(
      document.getElementById("yearSelect")?.value ??
        SettingsManager.getDefault("cardYear").toString(),
      10,
    );
    SettingsManager.save(settings);
  }

  saveHouseRuleSettings() {
    const settings = {};
    settings.useBlankTiles =
      document.getElementById("useBlankTiles")?.checked ??
      SettingsManager.getDefault("useBlankTiles");
    SettingsManager.save(settings);
  }

  saveAudioSettings() {
    const settings = {};

    settings.bgmVolume = parseInt(
      document.getElementById("bgmVolume")?.value ??
        SettingsManager.getDefault("bgmVolume").toString(),
      10,
    );
    settings.bgmMuted =
      document.getElementById("bgmMute")?.checked ??
      SettingsManager.getDefault("bgmMuted");
    settings.sfxVolume = parseInt(
      document.getElementById("sfxVolume")?.value ??
        SettingsManager.getDefault("sfxVolume").toString(),
      10,
    );
    settings.sfxMuted =
      document.getElementById("sfxMute")?.checked ??
      SettingsManager.getDefault("sfxMuted");

    SettingsManager.save(settings);
  }

  applyHouseRuleSettings(settings) {
    const useBlankTiles = document.getElementById("useBlankTiles");
    if (
      useBlankTiles &&
      Object.prototype.hasOwnProperty.call(settings, "useBlankTiles")
    ) {
      useBlankTiles.checked = settings.useBlankTiles;
    }
  }

  applyAudioSettings(settings) {
    // Apply audio settings to UI with defaults from SettingsManager
    const bgmVolumeSlider = document.getElementById("bgmVolume");
    const bgmVolumeValue = document.getElementById("bgmVolumeValue");
    const bgmMuteCheckbox = document.getElementById("bgmMute");
    const sfxVolumeSlider = document.getElementById("sfxVolume");
    const sfxVolumeValue = document.getElementById("sfxVolumeValue");
    const sfxMuteCheckbox = document.getElementById("sfxMute");

    if (bgmVolumeSlider) {
      // Use SettingsManager defaults instead of hardcoded values
      const volume =
        settings.bgmVolume ?? SettingsManager.getDefault("bgmVolume");
      bgmVolumeSlider.value = volume;
      if (bgmVolumeValue) {
        bgmVolumeValue.textContent = `${volume}%`;
      }
    }

    if (bgmMuteCheckbox) {
      bgmMuteCheckbox.checked =
        settings.bgmMuted ?? SettingsManager.getDefault("bgmMuted");
    }

    if (sfxVolumeSlider) {
      // Use SettingsManager defaults instead of hardcoded values
      const volume =
        settings.sfxVolume ?? SettingsManager.getDefault("sfxVolume");
      sfxVolumeSlider.value = volume;
      if (sfxVolumeValue) {
        sfxVolumeValue.textContent = `${volume}%`;
      }
    }

    if (sfxMuteCheckbox) {
      sfxMuteCheckbox.checked =
        settings.sfxMuted ?? SettingsManager.getDefault("sfxMuted");
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
      sfxMuteCheckbox: !!sfxMuteCheckbox,
    });

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

    if (
      window.game &&
      window.game.scene &&
      window.game.scene.getScene("GameScene")
    ) {
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

  // Initial UI state setup
  const controlDiv = document.getElementById("controldiv");
  const uiCenterDiv = document.getElementById("uicenterdiv");

  if (controlDiv) {
    controlDiv.style.visibility = "visible";
  }
  if (uiCenterDiv) {
    uiCenterDiv.style.display = "none";
  }

  // Listen for settings changes from mobile
  window.addEventListener("settingsChanged", (event) => {
    const newSettings = event.detail;

    // DON'T reload settings if the event came from desktop settings manager itself
    // (prevents reload loop during save)
    if (event.detail.source === "desktop") {
      return;
    }

    // Update UI if settings panel is open (only for events from mobile/external)
    if (
      window.settingsManager &&
      window.settingsManager.overlay.style.display !== "none"
    ) {
      window.settingsManager.loadSettings();
    }

    // Update game if needed
    if (
      window.game &&
      window.game.scene &&
      window.game.scene.getScene("GameScene")
    ) {
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
