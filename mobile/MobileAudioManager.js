// MobileAudioManager.js - Audio management for mobile platform
// Handles background music and sound effects with separate volume controls
// Uses Web Audio API instead of Phaser

import SettingsManager from "../shared/SettingsManager.js";
import bgmUrl from "/assets/audio/2406haidao_bgm_loop.mp3?url";
import rackTileUrl from "/assets/audio/rack_tile.mp3?url";
import tiledroppingUrl from "/assets/audio/tile_dropping.mp3?url";
import fireworksUrl from "/assets/audio/fireworks.mp3?url";
import wallFailUrl from "/assets/audio/normalflyin.mp3?url";

export default class MobileAudioManager {
    constructor() {
        this.bgm = null;
        this.bgmLoop = null;

        // Load settings from localStorage via settingsManager
        const settings = SettingsManager.load();
        const bgmVolumePercent = settings.bgmVolume ?? 50;
        const sfxVolumePercent = settings.sfxVolume ?? 50;

        this.bgmVolume = bgmVolumePercent / 100;
        this.bgmMuted = settings.bgmMuted ?? false;
        this.sfxVolume = sfxVolumePercent / 100;
        this.sfxMuted = settings.sfxMuted ?? false;

        // Audio context
        this.audioContext = null;
    }

    /**
     * Initialize audio context on first user interaction
     */
    initAudioContext() {
        if (this.audioContext) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (err) {
            console.warn("Web Audio API not supported:", err);
        }
    }

    /**
     * Play background music
     * @param {string} key - Audio key (e.g., "bgm")
     */
    playBGM(key) {
        // Stop current BGM if playing
        this.stopBGM();

        if (this.bgmMuted) {
            return;
        }

        let url;
        switch (key) {
            case "bgm":
                url = bgmUrl;
                break;
            default:
                return;
        }

        try {
            // eslint-disable-next-line no-undef
            this.bgm = new Audio(url);
            this.bgm.loop = true;
            this.bgm.volume = this.bgmVolume;
            this.bgm.play().catch(err => {
                console.warn("Could not play BGM:", err.message);
            });
        } catch (err) {
            console.warn("Error playing BGM:", err);
        }
    }

    /**
     * Stop background music
     */
    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
            this.bgm = null;
        }
    }

    /**
     * Set BGM volume
     * @param {number} volume - Volume 0-1
     */
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));

        if (this.bgm && !this.bgmMuted) {
            this.bgm.volume = this.bgmVolume;
        }
    }

    /**
     * Mute/unmute BGM
     * @param {boolean} muted
     */
    muteBGM(muted) {
        this.bgmMuted = muted;

        if (this.bgm) {
            this.bgm.volume = this.bgmMuted ? 0 : this.bgmVolume;
        }
    }

    /**
     * Get BGM volume
     * @returns {number} Volume 0-1
     */
    getBGMVolume() {
        return this.bgmVolume;
    }

    /**
     * Check if BGM is muted
     * @returns {boolean}
     */
    isBGMMuted() {
        return this.bgmMuted;
    }

    /**
     * Play sound effect
     * @param {string} key - Audio key (e.g., "tile_dropping", "rack_tile")
     */
    playSFX(key) {
        if (this.sfxMuted) {
            return;
        }

        let url;
        switch (key) {
            case "tile_dropping":
                url = tiledroppingUrl;
                break;
            case "rack_tile":
                url = rackTileUrl;
                break;
            case "fireworks":
                url = fireworksUrl;
                break;
            case "wall_fail":
                url = wallFailUrl;
                break;
            default:
                return;
        }

        try {
            // eslint-disable-next-line no-undef
            const audio = new Audio(url);
            audio.volume = this.sfxVolume;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn(`Could not play SFX (${key}):`, err.message);
                });
            }
        } catch (err) {
            console.warn(`Error playing SFX (${key}):`, err);
        }
    }

    /**
     * Set SFX volume
     * @param {number} volume - Volume 0-1
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Mute/unmute SFX
     * @param {boolean} muted
     */
    muteSFX(muted) {
        this.sfxMuted = muted;
    }

    /**
     * Get SFX volume
     * @returns {number} Volume 0-1
     */
    getSFXVolume() {
        return this.sfxVolume;
    }

    /**
     * Check if SFX is muted
     * @returns {boolean}
     */
    isSFXMuted() {
        return this.sfxMuted;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopBGM();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}
