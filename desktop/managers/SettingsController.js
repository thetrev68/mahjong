import { debugPrint } from "../../utils.js";
import SettingsManager from "../../shared/SettingsManager.js";

/**
 * SettingsController - Orchestrates Desktop Settings
 *
 * Coordinates between UI layer (SettingsUI), audio controls (AudioControlsManager),
 * and persistence layer (SettingsManager). Handles event binding and business logic.
 *
 * Responsibilities:
 * - Event binding (button clicks, form changes)
 * - Coordinating save/cancel/load flows
 * - Card year change detection and reinitialization
 * - Cross-component event dispatching
 */
export class SettingsController {
  /**
   * Create a new SettingsController
   * @param {SettingsUI} settingsUI - UI presentation layer
   * @param {AudioControlsManager} audioControls - Audio management layer
   * @param {SettingsManager} settingsManager - Persistence layer
   */
  constructor(settingsUI, audioControls, settingsManager = SettingsManager) {
    this.ui = settingsUI;
    this.audio = audioControls;
    this.settingsManager = settingsManager;

    // Store original settings for cancel functionality
    this.originalSettings = {};

    // Check localStorage availability
    if (!this.settingsManager.isAvailable()) {
      console.error("[SettingsController] localStorage is not available!");
    }

    this.setupEventListeners();
    this.loadSettings();
  }

  /**
   * Set up all event listeners for settings interactions
   */
  setupEventListeners() {
    // Settings button - show settings
    const settingsButton = document.getElementById("settings");
    if (settingsButton) {
      settingsButton.addEventListener("click", () => {
        this.showSettings();
      });
    }

    // Save button - save and close
    const saveButton = document.getElementById("settings-save");
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        this.saveAndClose();
      });
    }

    // Cancel button - restore and close
    const cancelButton = document.getElementById("settings-cancel");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        this.cancelAndClose();
      });
    }

    // Close on overlay click (outside container)
    if (this.ui.overlay) {
      this.ui.overlay.addEventListener("click", (event) => {
        if (event.target === this.ui.overlay) {
          this.cancelAndClose();
        }
      });
    }

    // Close on Escape key
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.ui.isVisible()) {
        this.cancelAndClose();
      }
    });

    // Training mode checkbox - update form visibility
    const trainCheckbox = document.getElementById("trainCheckbox");
    if (trainCheckbox) {
      trainCheckbox.addEventListener("change", () => {
        this.ui.updateTrainingFormVisibility();
      });
    }

    // Audio controls - live preview (don't save until user clicks Save)
    this.setupAudioControls();
  }

  /**
   * Set up audio control event listeners
   */
  setupAudioControls() {
    // BGM volume slider
    const bgmVolumeSlider = document.getElementById("bgmVolume");
    if (bgmVolumeSlider) {
      bgmVolumeSlider.addEventListener("input", (e) => {
        const volume = parseInt(e.target.value, 10);
        // Update UI display
        const bgmVolumeValue = document.getElementById("bgmVolumeValue");
        if (bgmVolumeValue) {
          bgmVolumeValue.textContent = `${volume}%`;
        }
        // Live preview
        this.audio.setBGMVolume(volume);
      });
    }

    // BGM mute checkbox
    const bgmMuteCheckbox = document.getElementById("bgmMute");
    if (bgmMuteCheckbox) {
      bgmMuteCheckbox.addEventListener("change", (e) => {
        this.audio.muteBGM(e.target.checked);
      });
    }

    // SFX volume slider
    const sfxVolumeSlider = document.getElementById("sfxVolume");
    if (sfxVolumeSlider) {
      sfxVolumeSlider.addEventListener("input", (e) => {
        const volume = parseInt(e.target.value, 10);
        // Update UI display
        const sfxVolumeValue = document.getElementById("sfxVolumeValue");
        if (sfxVolumeValue) {
          sfxVolumeValue.textContent = `${volume}%`;
        }
        // Live preview
        this.audio.setSFXVolume(volume);
      });
    }

    // SFX mute checkbox
    const sfxMuteCheckbox = document.getElementById("sfxMute");
    if (sfxMuteCheckbox) {
      sfxMuteCheckbox.addEventListener("change", (e) => {
        this.audio.muteSFX(e.target.checked);
      });
    }
  }

  /**
   * Show the settings panel
   */
  showSettings() {
    this.loadSettings();
    this.ui.show();
    // Store current state for cancel functionality
    this.storeCurrentState();
  }

  /**
   * Store current form state for cancel functionality
   */
  storeCurrentState() {
    this.originalSettings = this.ui.getFormValues();
  }

  /**
   * Restore original settings (for cancel)
   */
  restoreOriginalSettings() {
    this.ui.setFormValues(this.originalSettings);
    // Also restore audio state
    this.audio.applySettings({
      bgmVolume: this.originalSettings.bgmVolume,
      bgmMuted: this.originalSettings.bgmMuted,
      sfxVolume: this.originalSettings.sfxVolume,
      sfxMuted: this.originalSettings.sfxMuted,
    });
  }

  /**
   * Load settings from persistence and update UI
   */
  loadSettings() {
    const settings = this.settingsManager.load();
    debugPrint("SettingsController: Loaded settings", settings);

    // Merge with defaults
    const values = {
      trainingMode:
        settings.trainingMode ??
        this.settingsManager.getDefault("trainingMode"),
      trainingHand:
        settings.trainingHand ??
        this.settingsManager.getDefault("trainingHand"),
      trainingTileCount:
        settings.trainingTileCount ??
        this.settingsManager.getDefault("trainingTileCount"),
      skipCharleston:
        settings.skipCharleston ??
        this.settingsManager.getDefault("skipCharleston"),
      cardYear:
        settings.cardYear ?? this.settingsManager.getDefault("cardYear"),
      useBlankTiles:
        settings.useBlankTiles ??
        this.settingsManager.getDefault("useBlankTiles"),
      difficulty:
        settings.difficulty ?? this.settingsManager.getDefault("difficulty"),
      bgmVolume:
        settings.bgmVolume ?? this.settingsManager.getDefault("bgmVolume"),
      bgmMuted:
        settings.bgmMuted ?? this.settingsManager.getDefault("bgmMuted"),
      sfxVolume:
        settings.sfxVolume ?? this.settingsManager.getDefault("sfxVolume"),
      sfxMuted:
        settings.sfxMuted ?? this.settingsManager.getDefault("sfxMuted"),
    };

    // Update UI
    this.ui.setFormValues(values);

    // Apply audio settings
    this.audio.applySettings(values);
  }

  /**
   * Save settings and close panel
   */
  saveAndClose() {
    // Detect card year change before saving
    const oldYear = Number(
      this.settingsManager.get("cardYear") ??
        this.settingsManager.getDefault("cardYear"),
    );
    const newYear = this.ui.getCardYear();
    const yearChanged = oldYear !== newYear;

    // Get all form values
    const values = this.ui.getFormValues();

    // Save to persistence
    this.settingsManager.save(values);
    debugPrint("SettingsController: Saved settings", values);

    // Dispatch settings changed event
    window.dispatchEvent(
      new window.CustomEvent("settingsChanged", {
        detail: {
          ...values,
          source: "desktop", // Mark as coming from desktop
        },
      }),
    );

    // Handle card year change
    if (yearChanged) {
      this.handleCardYearChange(newYear);
    }

    this.ui.hide();
  }

  /**
   * Cancel changes and close panel
   */
  cancelAndClose() {
    this.restoreOriginalSettings();
    this.ui.hide();
  }

  /**
   * Handle card year change - reinitialize card
   * @param {number} newYear - New card year
   */
  handleCardYearChange(newYear) {
    if (
      window.game &&
      window.game.scene &&
      window.game.scene.getScene("GameScene")
    ) {
      const scene = window.game.scene.getScene("GameScene");
      if (scene.gGameLogic) {
        // Clear hand select dropdown
        this.ui.clearHandSelect();

        // Reinitialize card with new year
        scene.gGameLogic.init().then(() => {
          debugPrint(`Card year updated to ${newYear}`);
        });
      }
    }
  }

  /**
   * Get current difficulty setting
   * @returns {string} Current difficulty
   */
  getDifficulty() {
    return (
      this.settingsManager.get("difficulty") ??
      this.settingsManager.getDefault("difficulty")
    );
  }

  /**
   * Get current card year setting
   * @returns {number} Current card year
   */
  getCardYear() {
    return (
      this.settingsManager.get("cardYear") ??
      this.settingsManager.getDefault("cardYear")
    );
  }

  /**
   * Get use blank tiles setting
   * @returns {boolean} Whether to use blank tiles
   */
  getUseBlankTiles() {
    return (
      this.settingsManager.get("useBlankTiles") ??
      this.settingsManager.getDefault("useBlankTiles")
    );
  }

  /**
   * Get all settings
   * @returns {Object} All settings
   */
  getAllSettings() {
    return this.settingsManager.load();
  }
}

export default SettingsController;
