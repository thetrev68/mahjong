import { debugPrint } from "./utils.js";
import SettingsManager from "./shared/SettingsManager.js";
import { SettingsUI } from "./desktop/managers/SettingsUI.js";
import { AudioControlsManager } from "./shared/AudioControlsManager.js";
import { SettingsController } from "./desktop/managers/SettingsController.js";

/**
 * Desktop Settings Entry Point
 *
 * Initializes the settings system using the separated architecture:
 * - SettingsUI: UI presentation layer
 * - AudioControlsManager: Audio control and persistence
 * - SettingsController: Orchestration and event handling
 *
 * This file is now a thin initialization wrapper that sets up the components.
 */

// Initialize settings manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Create UI layer
  const settingsUI = new SettingsUI("settings-overlay");

  // Create audio controls layer (audio manager will be set later)
  const audioControls = new AudioControlsManager(null, SettingsManager);

  // Create controller to orchestrate
  const settingsController = new SettingsController(
    settingsUI,
    audioControls,
    SettingsManager,
  );

  // Expose on window for backwards compatibility
  window.settingsManager = settingsController;

  // Initial UI state setup
  const controlDiv = document.getElementById("controldiv");
  const uiCenterDiv = document.getElementById("uicenterdiv");

  if (controlDiv) {
    controlDiv.style.visibility = "visible";
  }
  if (uiCenterDiv) {
    uiCenterDiv.style.display = "none";
  }

  // Listen for settings changes from mobile or other sources
  window.addEventListener("settingsChanged", (event) => {
    const newSettings = event.detail;

    // Don't reload settings if the event came from desktop settings manager itself
    // (prevents reload loop during save)
    if (event.detail.source === "desktop") {
      return;
    }

    // Update UI if settings panel is open (only for events from mobile/external)
    if (settingsUI.isVisible()) {
      settingsController.loadSettings();
    }

    // Update game if needed
    if (
      window.game &&
      window.game.scene &&
      window.game.scene.getScene("GameScene")
    ) {
      const scene = window.game.scene.getScene("GameScene");
      if (scene.gGameLogic) {
        // Check if card year changed
        const oldYear = settingsController.getCardYear();
        if (newSettings.cardYear && oldYear !== newSettings.cardYear) {
          // Reinitialize card with new year
          scene.gGameLogic.init().then(() => {
            debugPrint(`Card year updated to ${newSettings.cardYear}`);
          });
        }
      }
    }
  });

  // When the game scene is ready, connect the audio manager
  window.addEventListener("gameSceneReady", (event) => {
    const { audioManager } = event.detail;
    if (audioManager) {
      audioControls.setAudioManager(audioManager);
      debugPrint("Settings: Audio manager connected");
    }
  });
});

// Export for backwards compatibility (though window.settingsManager is preferred)
export default SettingsController;
