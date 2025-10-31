// settings.js - Settings management for American Mahjong
class SettingsManager {
    constructor() {
        this.overlay = document.getElementById('settings-overlay');
        this.backButton = document.getElementById('settings-back');
        this.settingsButton = document.getElementById('settings');

        this.init();
        this.loadSettings();
    }

    init() {
        // Settings button event listener
        this.settingsButton.addEventListener('click', () => {
            this.showSettings();
        });

        // Back button event listener
        this.backButton.addEventListener('click', () => {
            this.hideSettings();
        });

        // Close on overlay click (outside container)
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                this.hideSettings();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.overlay.style.display !== 'none') {
                this.hideSettings();
            }
        });
    }

    showSettings() {
        this.overlay.style.display = 'flex';
        // Focus management for accessibility
        this.backButton.focus();
    }

    hideSettings() {
        this.overlay.style.display = 'none';
        // Return focus to settings button
        this.settingsButton.focus();
    }

    // Settings persistence using localStorage
    saveSetting(key, value) {
        try {
            const settings = this.getAllSettings();
            settings[key] = value;
            localStorage.setItem('mahjong-settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save setting:', error);
        }
    }

    getSetting(key, defaultValue = null) {
        const settings = this.getAllSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    getAllSettings() {
        try {
            const stored = localStorage.getItem('mahjong-settings');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return {};
        }
    }

    loadSettings() {
        // Load and apply saved settings
        // This will be expanded as settings are implemented
        const settings = this.getAllSettings();
        console.log('Loaded settings:', settings);
    }

    // Framework for future settings sections
    registerSettingSection(sectionId, config) {
        // Placeholder for registering dynamic settings sections
        // config: { title, controls: [], onChange: callback }
        console.log(`Registered settings section: ${sectionId}`, config);
    }
}

// Initialize settings manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.settingsManager = new SettingsManager();
});

export default SettingsManager;