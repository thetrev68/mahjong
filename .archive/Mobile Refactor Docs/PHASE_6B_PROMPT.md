# Phase 6B: Shared Settings Manager

**Assignee:** Claude Haiku
**Complexity:** Low
**Estimated Tokens:** 3K
**Prerequisites:** None (standalone utility module)

---

## Task Overview

Create a platform-agnostic settings management module that handles persistent storage for game preferences. This will work identically on both desktop (Phaser) and mobile (DOM) platforms, using localStorage as the backing store.

**Key Goal:** Centralize all settings logic in one place, replacing scattered localStorage calls throughout the codebase.

---

## Current State Analysis

### Existing Settings Implementation

The current [settings.js](settings.js) is tightly coupled to the desktop UI:

- Directly manipulates DOM elements (checkboxes, sliders, selects)
- Contains UI event handlers mixed with storage logic
- ~300 lines of code (mostly UI management)

### Settings Used Across Codebase

**Game Settings:**

- `cardYear` - Which pattern card year to use (2017-2025)
- `useBlankTiles` - House rule toggle
- `difficulty` - AI difficulty (easy/medium/hard)

**Training Mode:**

- `trainingMode` - Enable training mode
- `trainingHand` - Selected starting hand pattern
- `trainingTileCount` - Number of tiles (1-14)
- `skipCharleston` - Skip Charleston in training

**Audio Settings:**

- `bgmVolume` - Background music volume (0-100)
- `bgmMuted` - BGM mute toggle
- `sfxVolume` - Sound effects volume (0-100)
- `sfxMuted` - SFX mute toggle

---

## Deliverable

### Shared Settings Manager

**File:** `shared/SettingsManager.js`

Create a pure JavaScript module with **no UI dependencies**:

```javascript
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
  bgmVolume: 70,
  bgmMuted: false,
  sfxVolume: 80,
  sfxMuted: false,
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
      console.error(
        `Type mismatch for ${key}: expected ${expectedType}, got ${actualType}`,
      );
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
```

---

## Usage Examples

### Loading Settings on Game Start

```javascript
// main.js or mobile/main.js
import SettingsManager from "./shared/SettingsManager.js";

const settings = SettingsManager.load();
console.log("Card year:", settings.cardYear); // 2025
console.log("Difficulty:", settings.difficulty); // "medium"

// Initialize card with loaded year
card.init(settings.cardYear);

// Set AI difficulty
aiEngine = new AIEngine(card, tableData, settings.difficulty);
```

### Saving Settings from UI

```javascript
// After user changes a setting
function onSettingsChanged() {
  const newSettings = {
    cardYear: parseInt(document.getElementById("yearSelect").value),
    difficulty: document.getElementById("difficultySelect").value,
    bgmVolume: parseInt(document.getElementById("bgmVolume").value),
    // ... other settings
  };

  SettingsManager.save(newSettings);
}
```

### Getting/Setting Individual Values

```javascript
// Get current difficulty
const difficulty = SettingsManager.get("difficulty"); // "medium"

// Update difficulty
SettingsManager.set("difficulty", "hard");

// Reset to defaults
SettingsManager.reset();
```

### Subscribing to Changes (Cross-Tab Sync)

```javascript
// React to setting changes from other tabs
const unsubscribe = SettingsManager.subscribe("difficulty", (newDifficulty) => {
  console.log("Difficulty changed to:", newDifficulty);
  aiEngine.updateDifficulty(newDifficulty);
});

// Later, unsubscribe
unsubscribe();
```

---

## Validation Requirements

### Type Safety

```javascript
// ✅ Valid
SettingsManager.set("cardYear", 2025); // number
SettingsManager.set("useBlankTiles", true); // boolean

// ❌ Invalid (should log error and reject)
SettingsManager.set("cardYear", "2025"); // string instead of number
SettingsManager.set("useBlankTiles", 1); // number instead of boolean
```

### Range Validation (Optional Enhancement)

If time permits, add range validation:

```javascript
static set(key, value) {
    // ... existing type check ...

    // Range validation
    if (key === "cardYear" && (value < 2017 || value > 2025)) {
        console.error(`Invalid cardYear: ${value} (must be 2017-2025)`);
        return;
    }

    if (key === "bgmVolume" && (value < 0 || value > 100)) {
        console.error(`Invalid bgmVolume: ${value} (must be 0-100)`);
        return;
    }

    // ... save to localStorage ...
}
```

---

## Testing Checklist

### Manual Testing

1. **Load Defaults:**
   - [ ] Clear localStorage (`localStorage.clear()`)
   - [ ] Call `SettingsManager.load()`
   - [ ] Verify all settings have default values

2. **Save/Load:**
   - [ ] Change settings via `set()` or `save()`
   - [ ] Refresh page
   - [ ] Verify settings persist

3. **Type Validation:**
   - [ ] Try setting `cardYear` to a string
   - [ ] Verify error logged and value rejected

4. **Reset:**
   - [ ] Change multiple settings
   - [ ] Call `SettingsManager.reset()`
   - [ ] Verify all settings back to defaults

5. **Cross-Tab Sync:**
   - [ ] Open game in two tabs
   - [ ] Change setting in Tab 1
   - [ ] Verify Tab 2 receives update via `subscribe()`

### Browser Compatibility

Test in:

- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop
- [ ] Chrome Mobile (Android)
- [ ] Safari (iOS)

**Note:** All modern browsers support localStorage. Private mode may disable it (check with `isAvailable()`).

---

## Integration Plan

### Phase 1: Create Module (This Task)

- [ ] Create `shared/SettingsManager.js`
- [ ] Test basic load/save functionality

### Phase 2: Desktop Integration (Future)

- [ ] Update `settings.js` to use `SettingsManager`
- [ ] Replace scattered `localStorage.getItem()` calls
- [ ] Remove storage logic from settings.js (keep only UI)

### Phase 3: Mobile Integration (Phase 6C)

- [ ] Import `SettingsManager` in `mobile/main.js`
- [ ] Create mobile settings UI
- [ ] Both desktop and mobile now share same storage

---

## File Locations

```text
shared/
└── SettingsManager.js       # NEW - 200-250 lines
```

---

## Expected Output

When complete, provide:

1. ✅ `shared/SettingsManager.js` created
2. ✅ Manual testing report (load/save/reset)
3. ✅ Browser console screenshot showing:
   - Settings loaded with defaults
   - Settings saved successfully
   - Type validation error (when passing wrong type)
4. ✅ Confirmation that `isAvailable()` returns true

---

## Resources

- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MDN: Storage Event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
- [Current settings.js](settings.js) - Reference for existing settings

---

## Notes

- This module is **pure JavaScript** with zero dependencies
- Works identically in Node.js (if localStorage is polyfilled)
- The `STORAGE_PREFIX` prevents conflicts with other apps on the same domain
- The `subscribe()` method enables reactive UIs without polling
- Type validation prevents common bugs (e.g., saving string "70" instead of number 70)
