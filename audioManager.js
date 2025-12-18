// audioManager.js - Audio management for American Mahjong
// Handles background music and sound effects with separate volume controls

import SettingsManager from "./shared/SettingsManager.js";

export default class AudioManager {
  constructor(scene, settingsManager) {
    this.scene = scene;
    this.settingsManager = settingsManager;

    // Audio instances
    this.bgm = null;
    this.currentBGMKey = null;

    // Load settings from localStorage via settingsManager
    // SettingsManager stores volume as 0-100 percentage, convert to 0-1 scale for Phaser
    const bgmVolumePercent = this.settingsManager.getSetting(
      "bgmVolume",
      SettingsManager.getDefault("bgmVolume"),
    );
    const sfxVolumePercent = this.settingsManager.getSetting(
      "sfxVolume",
      SettingsManager.getDefault("sfxVolume"),
    );

    this.bgmVolume = bgmVolumePercent / 100;
    this.bgmMuted = this.settingsManager.getSetting(
      "bgmMuted",
      SettingsManager.getDefault("bgmMuted"),
    );
    this.sfxVolume = sfxVolumePercent / 100;
    this.sfxMuted = this.settingsManager.getSetting(
      "sfxMuted",
      SettingsManager.getDefault("sfxMuted"),
    );
  }

  // Background Music Methods
  playBGM(key) {
    // Stop current BGM if playing
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
    }

    // Create new BGM sound
    this.currentBGMKey = key;
    this.bgm = this.scene.sound.add(key, {
      loop: true,
      volume: this.bgmMuted ? 0 : this.bgmVolume,
    });

    this.bgm.play();
  }

  stopBGM() {
    if (this.bgm && this.bgm.isPlaying) {
      this.bgm.stop();
    }
  }

  setBGMVolume(volume) {
    // Volume should be 0-1 scale
    this.bgmVolume = Math.max(0, Math.min(1, volume));

    // Don't save if called from settings manager to avoid circular updates
    // Settings manager already saves before calling this

    if (this.bgm && !this.bgmMuted) {
      this.bgm.setVolume(this.bgmVolume);
    }
  }

  muteBGM(muted) {
    this.bgmMuted = muted;

    // Don't save if called from settings manager to avoid circular updates
    // Settings manager already saves before calling this

    if (this.bgm) {
      this.bgm.setVolume(this.bgmMuted ? 0 : this.bgmVolume);
    }
  }

  getBGMVolume() {
    return this.bgmVolume;
  }

  isBGMMuted() {
    return this.bgmMuted;
  }

  // Sound Effects Methods
  playSFX(key) {
    if (this.sfxMuted) {
      return;
    }

    // Play one-shot sound effect
    this.scene.sound.play(key, {
      volume: this.sfxVolume,
    });
  }

  setSFXVolume(volume) {
    // Volume should be 0-1 scale
    this.sfxVolume = Math.max(0, Math.min(1, volume));

    // Don't save if called from settings manager to avoid circular updates
    // Settings manager already saves before calling this
  }

  muteSFX(muted) {
    this.sfxMuted = muted;

    // Don't save if called from settings manager to avoid circular updates
    // Settings manager already saves before calling this
  }

  getSFXVolume() {
    return this.sfxVolume;
  }

  isSFXMuted() {
    return this.sfxMuted;
  }

  // Cleanup
  destroy() {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
    }
  }
}
