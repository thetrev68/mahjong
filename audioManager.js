// audioManager.js - Audio management for American Mahjong
// Handles background music and sound effects with separate volume controls

export default class AudioManager {
    constructor(scene, settingsManager) {
        this.scene = scene;
        this.settingsManager = settingsManager;

        // Audio instances
        this.bgm = null;
        this.currentBGMKey = null;

        // Load settings from localStorage via settingsManager
        this.bgmVolume = this.settingsManager.getSetting("bgmVolume", 0.25);
        this.bgmMuted = this.settingsManager.getSetting("bgmMuted", false);
        this.sfxVolume = this.settingsManager.getSetting("sfxVolume", 0.7);
        this.sfxMuted = this.settingsManager.getSetting("sfxMuted", false);
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
            volume: this.bgmMuted ? 0 : this.bgmVolume
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
            volume: this.sfxVolume
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
