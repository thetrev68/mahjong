/**
 * SettingsUI - UI Presentation Layer for Desktop Settings
 *
 * Handles pure UI operations: showing/hiding overlay, reading form values,
 * updating form UI. Does NOT handle persistence, audio, or business logic.
 *
 * Responsibilities:
 * - Show/hide settings overlay
 * - Read form input values
 * - Update form input values
 * - Manage form visibility states
 * - Focus management for accessibility
 */
export class SettingsUI {
  /**
   * Create a new SettingsUI instance
   * @param {string} overlayId - ID of the settings overlay element
   */
  constructor(overlayId = "settings-overlay") {
    this.overlay = document.getElementById(overlayId);
    this.saveButton = document.getElementById("settings-save");
    this.cancelButton = document.getElementById("settings-cancel");
    this.settingsButton = document.getElementById("settings");

    if (!this.overlay) {
      throw new Error(`Settings overlay element '${overlayId}' not found`);
    }
  }

  /**
   * Show the settings overlay
   */
  show() {
    this.overlay.style.display = "flex";
    // Focus management for accessibility
    this.saveButton?.focus();
  }

  /**
   * Hide the settings overlay
   */
  hide() {
    this.overlay.style.display = "none";
    // Return focus to settings button
    this.settingsButton?.focus();
  }

  /**
   * Check if settings overlay is visible
   * @returns {boolean} True if overlay is visible
   */
  isVisible() {
    return this.overlay.style.display !== "none";
  }

  /**
   * Get all current form values as an object
   * @returns {Object} Current form values
   */
  getFormValues() {
    return {
      trainingMode: this.getTrainingMode(),
      trainingHand: this.getTrainingHand(),
      trainingTileCount: this.getTrainingTileCount(),
      skipCharleston: this.getSkipCharleston(),
      cardYear: this.getCardYear(),
      useBlankTiles: this.getUseBlankTiles(),
      difficulty: this.getDifficulty(),
      bgmVolume: this.getBGMVolume(),
      bgmMuted: this.getBGMMuted(),
      sfxVolume: this.getSFXVolume(),
      sfxMuted: this.getSFXMuted(),
    };
  }

  /**
   * Set all form values from an object
   * @param {Object} values - Form values to set
   */
  setFormValues(values) {
    if (values.trainingMode !== undefined)
      this.setTrainingMode(values.trainingMode);
    if (values.trainingHand !== undefined)
      this.setTrainingHand(values.trainingHand);
    if (values.trainingTileCount !== undefined)
      this.setTrainingTileCount(values.trainingTileCount);
    if (values.skipCharleston !== undefined)
      this.setSkipCharleston(values.skipCharleston);
    if (values.cardYear !== undefined) this.setCardYear(values.cardYear);
    if (values.useBlankTiles !== undefined)
      this.setUseBlankTiles(values.useBlankTiles);
    if (values.difficulty !== undefined) this.setDifficulty(values.difficulty);
    if (values.bgmVolume !== undefined) this.setBGMVolume(values.bgmVolume);
    if (values.bgmMuted !== undefined) this.setBGMMuted(values.bgmMuted);
    if (values.sfxVolume !== undefined) this.setSFXVolume(values.sfxVolume);
    if (values.sfxMuted !== undefined) this.setSFXMuted(values.sfxMuted);

    // Update training form visibility based on training mode
    this.updateTrainingFormVisibility();
  }

  // Training Mode
  getTrainingMode() {
    return document.getElementById("trainCheckbox")?.checked ?? false;
  }

  setTrainingMode(value) {
    const checkbox = document.getElementById("trainCheckbox");
    if (checkbox) checkbox.checked = value;
  }

  getTrainingHand() {
    return document.getElementById("handSelect")?.value ?? "";
  }

  setTrainingHand(value) {
    const select = document.getElementById("handSelect");
    if (select) select.value = value;
  }

  getTrainingTileCount() {
    return parseInt(
      document.getElementById("numTileSelect")?.value ?? "14",
      10,
    );
  }

  setTrainingTileCount(value) {
    const select = document.getElementById("numTileSelect");
    if (select) select.value = value.toString();
  }

  updateTrainingFormVisibility() {
    const trainCheckbox = document.getElementById("trainCheckbox");
    const trainFieldset2 = document.getElementById("trainfieldset2");

    if (trainCheckbox && trainFieldset2) {
      trainFieldset2.disabled = !trainCheckbox.checked;
    }
  }

  // Game Settings
  getSkipCharleston() {
    return document.getElementById("skipCharlestonCheckbox")?.checked ?? false;
  }

  setSkipCharleston(value) {
    const checkbox = document.getElementById("skipCharlestonCheckbox");
    if (checkbox) checkbox.checked = value;
  }

  getCardYear() {
    return parseInt(document.getElementById("yearSelect")?.value ?? "2025", 10);
  }

  setCardYear(value) {
    const select = document.getElementById("yearSelect");
    if (select) select.value = value.toString();
  }

  getUseBlankTiles() {
    return document.getElementById("useBlankTiles")?.checked ?? true;
  }

  setUseBlankTiles(value) {
    const checkbox = document.getElementById("useBlankTiles");
    if (checkbox) checkbox.checked = value;
  }

  getDifficulty() {
    return document.getElementById("difficultySelect")?.value ?? "medium";
  }

  setDifficulty(value) {
    const select = document.getElementById("difficultySelect");
    if (select) select.value = value;
  }

  // Audio Settings
  getBGMVolume() {
    return parseInt(document.getElementById("bgmVolume")?.value ?? "50", 10);
  }

  setBGMVolume(value) {
    const slider = document.getElementById("bgmVolume");
    const display = document.getElementById("bgmVolumeValue");
    if (slider) slider.value = value;
    if (display) display.textContent = `${value}%`;
  }

  getBGMMuted() {
    return document.getElementById("bgmMute")?.checked ?? false;
  }

  setBGMMuted(value) {
    const checkbox = document.getElementById("bgmMute");
    if (checkbox) checkbox.checked = value;
  }

  getSFXVolume() {
    return parseInt(document.getElementById("sfxVolume")?.value ?? "50", 10);
  }

  setSFXVolume(value) {
    const slider = document.getElementById("sfxVolume");
    const display = document.getElementById("sfxVolumeValue");
    if (slider) slider.value = value;
    if (display) display.textContent = `${value}%`;
  }

  getSFXMuted() {
    return document.getElementById("sfxMute")?.checked ?? false;
  }

  setSFXMuted(value) {
    const checkbox = document.getElementById("sfxMute");
    if (checkbox) checkbox.checked = value;
  }

  /**
   * Clear the hand select dropdown (used when card year changes)
   */
  clearHandSelect() {
    const handSelect = document.getElementById("handSelect");
    if (handSelect) {
      handSelect.innerHTML = "";
    }
  }
}
