/**
 * GameEndModal - Modal overlay for game end announcements
 *
 * Displays a modal when the game ends with either:
 * - Mahjong win announcement
 * - Wall game announcement
 */
export class GameEndModal {
    /**
     * @param {string} title - Modal title ("Mahjong!" or "Wall Game")
     * @param {string} message - Game end message
     * @param {Function} onClose - Callback when modal closed: () => void
     */
    constructor(title, message, onClose) {
        this.title = title;
        this.message = message;
        this.onClose = onClose;
        this.element = null;
        this.isClosing = false;
        this.render();
    }

    /**
     * Create and show the modal
     */
    render() {
        // Create modal overlay
        this.element = document.createElement("div");
        this.element.className = "game-end-modal";
        this.element.innerHTML = `
            <div class="game-end-modal__backdrop"></div>
            <div class="game-end-modal__content">
                <div class="game-end-modal__header">
                    <h1 class="game-end-modal__title">${this.escapeHtml(this.title)}</h1>
                </div>
                <div class="game-end-modal__body">
                    <p class="game-end-modal__message">${this.escapeHtml(this.message)}</p>
                </div>
                <div class="game-end-modal__footer">
                    <button class="game-end-modal__ok">OK</button>
                </div>
            </div>
        `;

        // Wire OK button
        const okBtn = this.element.querySelector(".game-end-modal__ok");
        okBtn.addEventListener("click", () => this.close());

        // Wire backdrop click to close
        const backdrop = this.element.querySelector(".game-end-modal__backdrop");
        backdrop.addEventListener("click", () => this.close());

        // Add to DOM
        document.body.appendChild(this.element);

        // Trigger animation
        window.requestAnimationFrame(() => {
            this.element.classList.add("game-end-modal--visible");
        });
    }

    /**
     * Close modal and invoke callback
     */
    close() {
        // Prevent double-click duplicate callbacks
        if (this.isClosing) return;
        this.isClosing = true;

        // Fade out animation
        this.element.classList.remove("game-end-modal--visible");

        // Wait for animation, then remove from DOM
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }

            // Invoke callback
            if (this.onClose) {
                this.onClose();
            }
        }, 300); // Match CSS transition duration
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
}
