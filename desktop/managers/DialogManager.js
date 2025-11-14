/**
 * DialogManager - Handles UI prompts, dialogs, and user selections
 *
 * Responsibilities:
 * - Show modal dialogs for user choices
 * - Handle yes/no prompts
 * - Tile selection dialogs (Charleston, courtesy, etc.)
 * - Return results via callbacks
 * - Block game interaction while dialog is open
 */

export class DialogManager {
    /**
     * @param {GameScene} scene - Phaser scene
     */
    constructor(scene) {
        this.scene = scene;

        /**
         * Container for dialog overlay and content
         * @type {HTMLElement|null}
         */
        this.dialogOverlay = null;

        /**
         * Currently pending dialog callback
         * @type {Function|null}
         */
        this.pendingCallback = null;

        /**
         * Whether dialog is currently open
         * @type {boolean}
         */
        this.isOpen = false;
    }

    /**
     * Show a yes/no dialog
     *
     * @param {string} question - Question to ask
     * @param {Function} callback - Callback with boolean result
     * @returns {Promise<boolean>}
     */
    showYesNoDialog(question, callback) {
        return new Promise((resolve) => {
            this.pendingCallback = callback;
            this.showModalDialog(
                question,
                [
                    {label: "No", value: false},
                    {label: "Yes", value: true}
                ],
                (result) => {
                    if (callback) callback(result);
                    resolve(result);
                }
            );
        });
    }

    /**
     * Show Charleston pass selection dialog
     * Allows player to select 3 tiles to pass
     *
     * @param {Function} callback - Called with array of selected tile indices
     * @returns {Promise}
     */
    showCharlestonPassDialog(callback) {
        return new Promise((resolve) => {
            this.pendingCallback = callback;
            this.showModalDialog(
                "Select 3 tiles to pass",
                [
                    {label: "Cancel", value: null},
                    {label: "Pass Selected", value: "pass"}
                ],
                (result) => {
                    if (callback) callback(result);
                    resolve(result);
                }
            );
        });
    }

    /**
     * Show courtesy pass selection dialog
     * Allows player to select 1-3 tiles to exchange
     *
     * @param {number} maxTiles - Maximum tiles to select (1-3)
     * @param {Function} callback - Called with array of selected tile indices
     * @returns {Promise}
     */
    showCourtesyPassDialog(maxTiles = 3, callback) {
        return new Promise((resolve) => {
            this.pendingCallback = callback;
            const options = [
                {label: "Cancel", value: null},
                {label: `Exchange ${maxTiles} Tiles`, value: maxTiles}
            ];

            this.showModalDialog(
                `Select up to ${maxTiles} tiles to exchange`,
                options,
                (result) => {
                    if (callback) callback(result);
                    resolve(result);
                }
            );
        });
    }

    /**
     * Show tile selection dialog
     * Allows player to select a variable number of tiles (min to max)
     *
     * @param {number} minTiles - Minimum tiles to select
     * @param {number} maxTiles - Maximum tiles to select
     * @param {Function} callback - Called with "select" or null
     * @returns {Promise}
     */
    showSelectTilesDialog(minTiles = 1, maxTiles = 3, callback) {
        return new Promise((resolve) => {
            this.pendingCallback = callback;
            const options = [
                {label: "Cancel", value: null},
                {label: "Confirm Selection", value: "select"}
            ];

            this.showModalDialog(
                `Select ${minTiles}–${maxTiles} tiles`,
                options,
                (result) => {
                    if (callback) callback(result);
                    resolve(result);
                }
            );
        });
    }

    /**
     * Show exposure selection dialog
     * Allows player to choose which exposure type (Pung, Kong, Quint)
     *
     * @param {string[]} options - Available exposure types
     * @param {Function} callback - Called with selected type
     * @returns {Promise}
     */
    showExposureDialog(options, callback) {
        return new Promise((resolve) => {
            this.pendingCallback = callback;
            const buttons = (options || []).map((opt) => ({
                label: opt,
                value: opt
            }));

            buttons.push({label: "Cancel", value: null});

            this.showModalDialog(
                "Select how to expose these tiles",
                buttons,
                (result) => {
                    if (callback) callback(result);
                    resolve(result);
                }
            );
        });
    }

    /**
     * Show claim options dialog
     * Allows player to choose how to claim or pass
     *
     * @param {string[]} claimTypes - Available claim types (e.g., ["Pung", "Kong", "Mahjong"])
     * @param {Function} callback - Called with selected claim type or "pass"
     * @returns {Promise}
     */
    showClaimDialog(claimTypes, callback) {
        return new Promise((resolve) => {
            this.pendingCallback = callback;
            const buttons = (claimTypes || []).map((type) => ({
                label: type,
                value: type
            }));

            buttons.push({label: "Pass", value: "pass"});

            this.showModalDialog(
                "Claim this discard?",
                buttons,
                (result) => {
                    if (callback) callback(result);
                    resolve(result);
                }
            );
        });
    }

    /**
     * Show courtesy vote dialog
     * Player selects how many tiles to exchange (0-3)
     *
     * @param {Function} callback - Called with vote count (0-3)
     * @returns {Promise}
     */
    showCourtesyVoteDialog(callback) {
        return new Promise((resolve) => {
            this.pendingCallback = callback;
            this.showModalDialog(
                "How many tiles for courtesy pass?",
                [
                    {label: "0 Tiles", value: 0},
                    {label: "1 Tile", value: 1},
                    {label: "2 Tiles", value: 2},
                    {label: "3 Tiles", value: 3}
                ],
                (result) => {
                    if (callback) callback(result);
                    resolve(result);
                }
            );
        });
    }

    /**
     * Show custom message dialog
     *
     * @param {string} message - Message to display
     * @param {Function} onClose - Called when dialog closes
     * @returns {Promise}
     */
    showMessageDialog(message, onClose) {
        return new Promise((resolve) => {
            this.showModalDialog(
                message,
                [{label: "OK", value: true}],
                (result) => {
                    if (onClose) onClose();
                    resolve(result);
                }
            );
        });
    }

    /**
     * Show generic modal dialog with buttons
     * This is the core dialog method used by all specific dialogs
     *
     * @param {string} content - Dialog content/question
     * @param {Array} buttons - Array of {label, value} button objects
     * @param {Function} callback - Called when button clicked
     */
    showModalDialog(content, buttons, callback) {
        // Remove existing dialog if any
        this.closeDialog();

        // Create overlay
        this.dialogOverlay = document.createElement("div");
        this.dialogOverlay.className = "dialog-overlay";
        this.dialogOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        // Create dialog box
        const dialogBox = document.createElement("div");
        dialogBox.className = "dialog-box";
        dialogBox.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 30px;
            max-width: 500px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            text-align: center;
        `;

        // Add content
        const contentEl = document.createElement("p");
        contentEl.textContent = content;
        contentEl.style.cssText = `
            margin: 0 0 20px 0;
            font-size: 18px;
            color: #333;
        `;
        dialogBox.appendChild(contentEl);

        // Add buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "dialog-buttons";
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        `;

        buttons.forEach((btn) => {
            const button = document.createElement("button");
            button.textContent = btn.label;
            button.className = "dialog-button";
            button.style.cssText = `
                padding: 10px 20px;
                margin: 5px;
                font-size: 14px;
                border: none;
                border-radius: 4px;
                background: #007bff;
                color: white;
                cursor: pointer;
                transition: background 0.3s;
            `;

            button.addEventListener("mouseover", () => {
                button.style.background = "#0056b3";
            });

            button.addEventListener("mouseout", () => {
                button.style.background = "#007bff";
            });

            button.addEventListener("click", () => {
                this.closeDialog();
                if (callback) callback(btn.value);
            });

            buttonContainer.appendChild(button);
        });

        dialogBox.appendChild(buttonContainer);
        this.dialogOverlay.appendChild(dialogBox);

        // Add to DOM
        document.body.appendChild(this.dialogOverlay);
        this.isOpen = true;

        // Prevent interaction with game while dialog open
        if (this.scene && this.scene.input) {
            this.scene.input.enabled = false;
        }
    }

    /**
     * Close any open dialog
     */
    closeDialog() {
        if (this.dialogOverlay && this.dialogOverlay.parentNode) {
            this.dialogOverlay.parentNode.removeChild(this.dialogOverlay);
        }

        this.dialogOverlay = null;
        this.isOpen = false;
        this.pendingCallback = null;

        // Re-enable game input
        if (this.scene && this.scene.input) {
            this.scene.input.enabled = true;
        }
    }

    /**
     * Check if a dialog is currently open
     *
     * @returns {boolean}
     */
    hasOpenDialog() {
        return this.isOpen;
    }

    /**
     * Show an error message
     *
     * @param {string} message - Error message
     * @returns {Promise}
     */
    showError(message) {
        const errorMsg = document.createElement("div");
        errorMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        errorMsg.textContent = message;

        document.body.appendChild(errorMsg);

        return new Promise((resolve) => {
            setTimeout(() => {
                if (errorMsg.parentNode) {
                    errorMsg.parentNode.removeChild(errorMsg);
                }
                resolve();
            }, 3000);
        });
    }

    /**
     * Show a success message
     *
     * @param {string} message - Success message
     * @returns {Promise}
     */
    showSuccess(message) {
        const successMsg = document.createElement("div");
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        successMsg.textContent = message;

        document.body.appendChild(successMsg);

        return new Promise((resolve) => {
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
                resolve();
            }, 2000);
        });
    }

    /**
     * Show a notification toast
     *
     * @param {string} message - Message to show
     * @param {string} type - Type: "info", "success", "error", "warning"
     * @param {number} duration - Duration in ms (default 3000)
     */
    showNotification(message, type = "info", duration = 3000) {
        const colors = {
            info: "#17a2b8",
            success: "#28a745",
            error: "#dc3545",
            warning: "#ffc107"
        };

        const notification = document.createElement("div");
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: ${colors[type] || colors.info};
            color: ${type === "warning" ? "black" : "white"};
            padding: 15px 20px;
            border-radius: 4px;
            z-index: 9999;
            animation: slideUp 0.3s ease-out;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }
}
