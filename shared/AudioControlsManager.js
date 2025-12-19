import { debugPrint } from "../utils.js";
import SettingsManager from "./SettingsManager.js";

/**
 * AudioControlsManager - Cross-platform Audio Management
 *
 * Manages audio settings and synchronization with audio manager instances.
 * Handles both persistence (via SettingsManager) and runtime audio control.
 *
 * Platform-agnostic - works with any audio manager that implements:
 * - setBGMVolume(volume)
 * - muteBGM(muted)
 * - setSFXVolume(volume)
 * - muteSFX(muted)
 */
export class AudioControlsManager {
  /**
   * Create a new AudioControlsManager
   * @param {Object} audioManager - Platform-specific audio manager instance
   * @param {SettingsManager} settingsManager - Settings persistence manager
   */
  constructor(audioManager = null, settingsManager = SettingsManager) {
    this.audioManager = audioManager;
    this.settingsManager = settingsManager;
  }

  /**
   * Set the audio manager instance (call after initialization)
   * @param {Object} audioManager - Platform-specific audio manager
   */
  setAudioManager(audioManager) {
    this.audioManager = audioManager;
    debugPrint("AudioControlsManager: audio manager set");
  }

  /**
   * Set BGM volume (0-100)
   * @param {number} volume - Volume percentage (0-100)
   */
  setBGMVolume(volume) {
    const normalizedVolume = volume / 100;
    debugPrint(`AudioControlsManager: Setting BGM volume to ${volume}%`);

    if (this.audioManager && this.audioManager.setBGMVolume) {
      this.audioManager.setBGMVolume(normalizedVolume);
    } else {
      debugPrint("AudioControlsManager: Audio manager not available");
    }
  }

  /**
   * Mute/unmute BGM
   * @param {boolean} muted - True to mute, false to unmute
   */
  muteBGM(muted) {
    debugPrint(`AudioControlsManager: ${muted ? "Muting" : "Unmuting"} BGM`);

    if (this.audioManager && this.audioManager.muteBGM) {
      this.audioManager.muteBGM(muted);
    } else {
      debugPrint("AudioControlsManager: Audio manager not available");
    }
  }

  /**
   * Set SFX volume (0-100)
   * @param {number} volume - Volume percentage (0-100)
   */
  setSFXVolume(volume) {
    const normalizedVolume = volume / 100;
    debugPrint(`AudioControlsManager: Setting SFX volume to ${volume}%`);

    if (this.audioManager && this.audioManager.setSFXVolume) {
      this.audioManager.setSFXVolume(normalizedVolume);
    } else {
      debugPrint("AudioControlsManager: Audio manager not available");
    }
  }

  /**
   * Mute/unmute SFX
   * @param {boolean} muted - True to mute, false to unmute
   */
  muteSFX(muted) {
    debugPrint(`AudioControlsManager: ${muted ? "Muting" : "Unmuting"} SFX`);

    if (this.audioManager && this.audioManager.muteSFX) {
      this.audioManager.muteSFX(muted);
    } else {
      debugPrint("AudioControlsManager: Audio manager not available");
    }
  }

  /**
   * Apply audio settings from a settings object
   * @param {Object} settings - Settings object with bgmVolume, bgmMuted, sfxVolume, sfxMuted
   */
  applySettings(settings) {
    debugPrint("AudioControlsManager: Applying audio settings", settings);

    if (settings.bgmVolume !== undefined) {
      this.setBGMVolume(settings.bgmVolume);
    }

    if (settings.bgmMuted !== undefined) {
      this.muteBGM(settings.bgmMuted);
    }

    if (settings.sfxVolume !== undefined) {
      this.setSFXVolume(settings.sfxVolume);
    }

    if (settings.sfxMuted !== undefined) {
      this.muteSFX(settings.sfxMuted);
    }
  }

  /**
   * Save audio settings to persistence
   * @param {Object} audioSettings - Audio settings to save
   */
  saveSettings(audioSettings) {
    this.settingsManager.save(audioSettings);
    debugPrint("AudioControlsManager: Saved audio settings", audioSettings);
  }

  /**
   * Load audio settings from persistence
   * @returns {Object} Audio settings object
   */
  loadSettings() {
    const settings = this.settingsManager.load();
    return {
      bgmVolume:
        settings.bgmVolume ?? this.settingsManager.getDefault("bgmVolume"),
      bgmMuted:
        settings.bgmMuted ?? this.settingsManager.getDefault("bgmMuted"),
      sfxVolume:
        settings.sfxVolume ?? this.settingsManager.getDefault("sfxVolume"),
      sfxMuted:
        settings.sfxMuted ?? this.settingsManager.getDefault("sfxMuted"),
    };
  }
}


