/**
 * SettingsManager - Cross-platform settings persistence
 *
 * Handles localStorage read/write for all game settings.
 * Platform-agnostic (works on desktop and mobile).
 */

const DEFAULTS = {
    // Game settings
    cardYear: 2025,
    useBlankTiles: false,
    difficulty: "medium",

    // Training mode
    trainingMode: false,
    trainingHand: "",
    trainingTileCount: 9,
    skipCharleston: false,

    // Audio settings
    bgmVolume: 20,
    bgmMuted: false,
    sfxVolume: 20,
    sfxMuted: false
};

// Storage key prefix (avoid conflicts with other apps)
const STORAGE_PREFIX = "mahjong_";

class SettingsManager {
    /**
     * Load all settings from localStorage
     * Returns default values for any missing settings
     *
     * @returns {Object} Complete settings object
     */
    static load() {
        const settings = {};

        // Load each setting, falling back to default if not found
        for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
            const storageKey = STORAGE_PREFIX + key;
            const storedValue = localStorage.getItem(storageKey);

            if (storedValue === null) {
                // Setting doesn't exist, use default
                settings[key] = defaultValue;
            } else {
                // Parse stored value based on type
                settings[key] = this.parseValue(storedValue, typeof defaultValue);
            }
        }

        return settings;
    }

    /**
     * Save all settings to localStorage
     *
     * @param {Object} settings - Settings object to save
     */
    static save(settings) {
        for (const [key, value] of Object.entries(settings)) {
            // Skip keys not in DEFAULTS (invalid settings)
            if (!(key in DEFAULTS)) {
                console.warn(`Unknown setting key: ${key}`);
                continue;
            }

            const storageKey = STORAGE_PREFIX + key;
            localStorage.setItem(storageKey, String(value));
        }

        console.log("Settings saved:", settings);
    }

    /**
     * Get a single setting value
     *
     * @param {string} key - Setting key
     * @returns {*} Setting value, or default if not found
     */
    static get(key) {
        if (!(key in DEFAULTS)) {
            console.warn(`Unknown setting key: ${key}`);
            return undefined;
        }

        const storageKey = STORAGE_PREFIX + key;
        const storedValue = localStorage.getItem(storageKey);

        if (storedValue === null) {
            return DEFAULTS[key];
        }

        return this.parseValue(storedValue, typeof DEFAULTS[key]);
    }

    /**
     * Set a single setting value
     *
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    static set(key, value) {
        if (!(key in DEFAULTS)) {
            console.warn(`Unknown setting key: ${key}`);
            return;
        }

        // Validate type matches default
        const expectedType = typeof DEFAULTS[key];
        const actualType = typeof value;

        if (actualType !== expectedType) {
            console.error(`Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`);
            return;
        }

        const storageKey = STORAGE_PREFIX + key;
        localStorage.setItem(storageKey, String(value));

        console.log(`Setting updated: ${key} = ${value}`);
    }

    /**
     * Reset all settings to defaults
     */
    static reset() {
        // Clear all settings from localStorage
        for (const key of Object.keys(DEFAULTS)) {
            const storageKey = STORAGE_PREFIX + key;
            localStorage.removeItem(storageKey);
        }

        console.log("Settings reset to defaults");
    }

    /**
     * Get default value for a setting
     *
     * @param {string} key - Setting key
     * @returns {*} Default value
     */
    static getDefault(key) {
        return DEFAULTS[key];
    }

    /**
     * Get all default settings
     *
     * @returns {Object} Defaults object
     */
    static getDefaults() {
        return { ...DEFAULTS };
    }

    /**
     * Parse string value from localStorage to correct type
     *
     * @param {string} value - String value from localStorage
     * @param {string} type - Expected type ("number", "boolean", "string")
     * @returns {*} Parsed value
     * @private
     */
    static parseValue(value, type) {
        switch (type) {
            case "number":
                return parseInt(value, 10);

            case "boolean":
                return value === "true";

            case "string":
                return value;

            default:
                console.warn(`Unknown type: ${type}`);
                return value;
        }
    }

    /**
     * Check if localStorage is available
     * (Some browsers disable it in private mode)
     *
     * @returns {boolean} True if localStorage is available
     */
    static isAvailable() {
        try {
            const testKey = "__storage_test__";
            localStorage.setItem(testKey, "test");
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.error("localStorage is not available:", e);
            return false;
        }
    }

    /**
     * Export settings as JSON (for backup/debugging)
     *
     * @returns {string} JSON string of all settings
     */
    static exportJSON() {
        const settings = this.load();
        return JSON.stringify(settings, null, 2);
    }

    /**
     * Import settings from JSON
     *
     * @param {string} json - JSON string of settings
     * @returns {boolean} True if import succeeded
     */
    static importJSON(json) {
        try {
            const settings = JSON.parse(json);

            // Validate all keys exist in DEFAULTS
            for (const key of Object.keys(settings)) {
                if (!(key in DEFAULTS)) {
                    console.error(`Invalid setting key in import: ${key}`);
                    return false;
                }
            }

            // Save imported settings
            this.save(settings);
            return true;

        } catch (e) {
            console.error("Failed to import settings:", e);
            return false;
        }
    }

    /**
     * Subscribe to setting changes (for reactive UIs)
     * Returns unsubscribe function
     *
     * @param {string} key - Setting key to watch
     * @param {Function} callback - Called with new value when setting changes
     * @returns {Function} Unsubscribe function
     */
    static subscribe(key, callback) {
        // Listen for storage events (changes from other tabs)
        const handler = (event) => {
            if (event.key === STORAGE_PREFIX + key) {
                const newValue = this.parseValue(event.newValue, typeof DEFAULTS[key]);
                callback(newValue);
            }
        };

        window.addEventListener("storage", handler);

        // Return unsubscribe function
        return () => {
            window.removeEventListener("storage", handler);
        };
    }
}

export default SettingsManager;