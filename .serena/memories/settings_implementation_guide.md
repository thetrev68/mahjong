# Settings System Implementation Guide

## Overview

Complete settings management system for American Mahjong game using localStorage persistence and modal overlay UI.

## Files Involved

### 1. **index.html** (C:\Repos\mahjong\index.html)

Main HTML file with settings UI structure.

**Settings Button:**

- Line 41: `<button id="settings" class="button">Settings</button>`
- Located in the control div with Start Game, Sort buttons

**Settings Overlay Container:**

- Lines 47-151: Complete settings modal overlay
- ID: `#settings-overlay`
- Default: `display: none` (hidden until opened)

**Settings Header:**

- Lines 50-56: Header with back button and title
- Back button ID: `#settings-back`
- HTML: `<button id="settings-back" class="settings-back-button">← Back</button>`
- Contains sr-only span for accessibility

**Settings Sections:**

1. **Game Settings** (Lines 59-62)
   - Placeholder for future AI difficulty settings

2. **Training Mode** (Lines 64-92)
   - Form ID: `#trainform1` and `#trainform2`
   - Enable Training checkbox: `#trainCheckbox`
   - Hand Select dropdown: `#handSelect`
   - Tile count select: `#numTileSelect`
   - Skip Charleston checkbox: `#skipCharlestonCheckbox`
   - Fieldsets: `#trainfieldset1`, `#trainfieldset2`

3. **Year Selection** (Lines 94-107)
   - Year select dropdown: `#yearSelect`
   - Options: 2017, 2018, 2019, 2020, 2025 (default)

4. **Audio Controls** (Lines 109-137)
   - Background Music Volume Slider: `#bgmVolume` (0-100, default 70)
   - Background Music Mute: `#bgmMute`
   - Sound Effects Volume Slider: `#sfxVolume` (0-100, default 80)
   - Sound Effects Mute: `#sfxMute`

5. **House Rules** (Lines 139-148)
   - Blank Tiles checkbox: `#useBlankTiles`
   - When enabled: 8 blank tiles added to wall (160 total instead of 152)

### 2. **settings.js** (C:\Repos\mahjong\settings.js)

Main settings management class.

**SettingsManager Class:**

- Constructor initializes overlay, back button, settings button
- Calls init() and loadSettings()

**Key Methods:**

1. **Display/Hide Methods:**
   - `showSettings()`: Sets overlay display to "flex", focuses back button
   - `hideSettings()`: Sets overlay display to "none", returns focus to settings button

2. **Event Listeners (init method):**
   - Settings button click → showSettings()
   - Back button click → hideSettings()
   - Overlay click (outside container) → hideSettings()
   - Escape key → hideSettings()
   - Training checkbox change → updateTrainingFormVisibility() + saveTrainingSettings()
   - Hand/Tile/Skip selectors change → saveTrainingSettings()
   - Year select change → saveYearSettings()
   - Blank tiles checkbox change → saveHouseRuleSettings()
   - Audio controls → setupAudioControls()

3. **Storage Methods:**
   - `saveSetting(key, value)`: Saves to localStorage["mahjong-settings"]
   - `getSetting(key, defaultValue)`: Retrieves setting with fallback
   - `getAllSettings()`: Parses all stored settings as JSON object

4. **Training Settings:**
   - `saveTrainingSettings()`: Saves trainingMode, trainingHand, trainingTileCount, skipCharleston
   - `applyTrainingSettings(settings)`: Loads saved training settings to UI
   - `updateTrainingFormVisibility()`: Disables/enables trainfieldset2 based on trainCheckbox

5. **Year Settings:**
   - `saveYearSettings()`: Saves cardYear setting
   - `applyYearSettings(settings)`: Applies saved year to dropdown

6. **House Rules:**
   - `saveHouseRuleSettings()`: Saves useBlankTiles boolean
   - `applyHouseRuleSettings(settings)`: Applies saved value to checkbox
   - `getUseBlankTiles()`: Returns current blank tiles setting (default: false)

7. **Audio Controls (setupAudioControls method):**
   - Loads saved settings: bgmVolume (default 0.7), bgmMuted (false), sfxVolume (0.8), sfxMuted (false)
   - Updates UI sliders with percentage values
   - Event listeners on volume sliders: saves and calls `updateAudioManager()`
   - Event listeners on mute checkboxes: saves and calls `updateAudioManager()`
   - `updateAudioManager()`: Communicates with AudioManager via window.game scene

8. **Accessibility:**
   - Card Year: `getCardYear()` returns current year (default: "2025")
   - Focus management on open/close
   - Escape key support
   - Click-outside overlay support

**Initialization:**

- Listens for DOMContentLoaded event
- Creates window.settingsManager instance
- Exported as default export

### 3. **styles.css** (C:\Repos\mahjong\styles.css)

**Settings Overlay Styling (Lines 514-524):**

- Fixed positioning, full viewport coverage
- Dark semi-transparent background (0.75 opacity)
- Backdrop blur filter (8px)
- Z-index: 1000 (high priority)
- Flexbox centered layout

**Settings Container (Lines 526-537):**

- Gradient background (--gradient-table)
- Max width: 600px, full width on smaller screens
- Max height: 90vh with flex column layout
- Scrollable content

**Header (Lines 539-547):**

- Dark green gradient background
- Flexbox with gap
- Bottom border separator

**Back Button (Lines 549-567):**

- Text color: --color-accent (golden)
- Hover/focus: Background highlight + outline
- Smooth transition (120ms)
- Font-weight: 600

**Title (Lines 569-574):**

- 1.5rem font size
- Primary text color
- Margin reset

**Content Area (Lines 576-583):**

- Scrollable (overflow-y: auto)
- Padding and gap for sections
- Flex layout with column direction

**Sections (Lines 585-592):**

- Elevated surface color
- Rounded borders
- Subtle border and shadow
- Backdrop blur

**Training Form Styles (Lines 615-626):**

- Grid layout with margins
- Toggle and grid items positioned

**Year Selection (Lines 628-645):**

- Flexbox layout
- 80px min-width label
- 200px max-width select

**House Rules (Lines 647-677):**

- Column flex layout
- 18px checkboxes with accent color
- Padding and gaps

**Audio Controls (Lines 679-774):**

- Group-based layout with gaps
- Slider styling:
  - 6px height
  - 18px thumb with accent color
  - Hover scale transform (1.15)
  - Cross-browser support (::-webkit, ::-moz)
  - Flex layout for aligning label-slider-value
- Checkbox styling (18x18, accent color)
- Value display (45px min-width, right-aligned)

**Responsive Design (Lines 776-816):**

- @media (max-width: 720px):
  - Smaller padding and gaps
  - Reduced font sizes
  - Max height 95vh
- @media (prefers-reduced-motion):
  - Remove transitions and transforms

### 4. **gameLogic.js** (C:\Repos\mahjong\gameLogic.js)

**Training Mode Integration:**

- Line 246: `const year = window.settingsManager.getCardYear()` - Gets selected card year
- Line 301: `const trainInfo = this.getTrainingInfo()` - Gets training settings
- Lines 1677-1695: `getTrainingInfo()` method
  - Returns object with: trainCheckbox, handDescription, numTiles, skipCharlestonCheckbox
  - Reads from HTML form elements
- Lines 1698-1702: `updateTrainingForm()` - Enables/disables trainfieldset2 based on checkbox
- Lines 1704-1709: `enableTrainingForm()` - Enables trainfieldset1, calls updateTrainingForm()
- Lines 1711-1716: `disableTrainingForm()` - Disables both fieldsets
- Line 1770: `this.table.applyTrainingHands(initPlayerHandArray)` - Applies training hand setup

**Blank Tiles Integration:**

- Line 1444: Checks `window.settingsManager.getUseBlankTiles()` to determine wall size

### 5. **GameScene.js** (C:\Repos\mahjong\GameScene.js)

**Audio Manager Creation:**

- Line 57: `this.audioManager = new AudioManager(this, window.settingsManager)`
- Passes settingsManager instance to audio manager for settings access

### 6. **audioManager.js** (C:\Repos\mahjong\audioManager.js)

**Settings Integration:**

- Constructor receives settingsManager parameter
- Lines 14-17: Loads audio settings from settingsManager:
  - bgmVolume (default 0.25)
  - bgmMuted (default false)
  - sfxVolume (default 0.7)
  - sfxMuted (default false)
- Methods: setBGMVolume(), muteBGM(), setSFXVolume(), muteSFX()

### 7. **constants.js** (C:\Repos\mahjong\constants.js)

**Blank Tiles Integration:**

- Lines 112-116: `getTotalTileCount()` function
  - Returns 160 if blank tiles enabled
  - Returns 152 (default) if disabled
  - Uses `window.settingsManager.getUseBlankTiles()`

### 8. **main.js** (C:\Repos\mahjong\main.js)

**Game Instance Exposure:**

- Line 31: `window.game = game` - Exposes Phaser game instance for settings manager access

## Data Flow

### Opening Settings

1. User clicks "Settings" button (#settings)
2. SettingsManager.showSettings() triggered
3. Overlay display set to "flex"
4. Back button focused
5. Current settings displayed from localStorage

### Closing Settings

- Back button → hideSettings() → display "none", focus settings button
- Escape key → hideSettings()
- Click outside overlay → hideSettings()

### Saving Settings

1. User changes form input
2. Change event listener triggers
3. saveSetting() stores to localStorage["mahjong-settings"]
4. For audio: updateAudioManager() notifies AudioManager
5. For training/year: Settings applied on next game start
6. For blank tiles: getTotalTileCount() returns updated value

### Loading Settings

1. DOMContentLoaded event
2. SettingsManager initialized
3. loadSettings() called
4. Applies all setting sections to UI
5. Restores user's previous preferences

## localStorage Key Structure

```json
{
  "trainingMode": boolean,
  "trainingHand": string,
  "trainingTileCount": number,
  "skipCharleston": boolean,
  "cardYear": string (2017|2018|2019|2020|2025),
  "useBlankTiles": boolean,
  "bgmVolume": number (0-1),
  "bgmMuted": boolean,
  "sfxVolume": number (0-1),
  "sfxMuted": boolean
}
```

## Back Button Implementation Details

**HTML Structure (index.html lines 51-54):**

```html
<button id="settings-back" class="settings-back-button">
  <span class="sr-only">Back to Game</span>
  ← Back
</button>
```

**CSS Styling (styles.css lines 549-567):**

- Appearance: none (no default button styling)
- Border: none
- Background: none
- Color: accent color (golden)
- Font-weight: 600
- Padding: var(--spacing-xs) var(--spacing-sm)
- Border-radius: var(--radius-sm)
- Hover/Focus: Semi-transparent background highlight + outline
- Transition: 120ms ease

**JavaScript Handler (settings.js lines 21-23):**

```javascript
this.backButton.addEventListener("click", () => {
  this.hideSettings();
});
```

**Accessibility Features:**

- sr-only span for screen readers
- Focus management (sets focus when settings open)
- Escape key also triggers close
- Returns focus to settings button after close

## Key Integration Points

1. **Card Year Selection** → gameLogic.js uses year for hand validation
2. **Training Mode** → gameLogic.js applies training hands/Charleston skip
3. **Blank Tiles** → constants.getTotalTileCount() adjusts wall size
4. **Audio Settings** → gameScene.audioManager applies volume/mute settings
5. **Settings Persistence** → localStorage maintains state across sessions
