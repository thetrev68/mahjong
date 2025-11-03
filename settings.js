import {debugPrint} from "./utils.js";

// Settings.js - Settings management for American Mahjong
class SettingsManager {
    constructor() {
        this.overlay = document.getElementById("settings-overlay");
        this.backButton = document.getElementById("settings-back");
        this.settingsButton = document.getElementById("settings");

        this.init();
        this.loadSettings();
    }

    init() {
        // Settings button event listener
        this.settingsButton.addEventListener("click", () => {
            this.showSettings();
        });

        // Back button event listener
        this.backButton.addEventListener("click", () => {
            this.hideSettings();
        });

        // Close on overlay click (outside container)
        this.overlay.addEventListener("click", (event) => {
            if (event.target === this.overlay) {
                this.hideSettings();
            }
        });

        // Close on Escape key
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.overlay.style.display !== "none") {
                this.hideSettings();
            }
        });

        // Training mode checkbox change listener
        const trainCheckbox = document.getElementById("trainCheckbox");
        if (trainCheckbox) {
            trainCheckbox.addEventListener("change", () => {
                this.updateTrainingFormVisibility();
                this.saveTrainingSettings();
            });
        }

        // Training form change listeners for auto-save
        const handSelect = document.getElementById("handSelect");
        const numTileSelect = document.getElementById("numTileSelect");
        const skipCharlestonCheckbox = document.getElementById("skipCharlestonCheckbox");
        const yearSelect = document.getElementById("yearSelect");

        if (handSelect) {
            handSelect.addEventListener("change", () => this.saveTrainingSettings());
        }
        if (numTileSelect) {
            numTileSelect.addEventListener("change", () => this.saveTrainingSettings());
        }
        if (skipCharlestonCheckbox) {
            skipCharlestonCheckbox.addEventListener("change", () => this.saveTrainingSettings());
        }
        if (yearSelect) {
            yearSelect.addEventListener("change", () => this.saveYearSettings());
        }
    }

    showSettings() {
        this.overlay.style.display = "flex";
        // Focus management for accessibility
        this.backButton.focus();
    }

    hideSettings() {
        this.overlay.style.display = "none";
        // Return focus to settings button
        this.settingsButton.focus();
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

        // Apply year selection settings
        this.applyYearSettings(settings);
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

    saveYearSettings() {
        const yearSelect = document.getElementById("yearSelect");
        if (yearSelect) {
            this.saveSetting("cardYear", yearSelect.value);
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
