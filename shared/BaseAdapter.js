/**
 * BaseAdapter - simple helper to register GameController event handlers
 * and automatically track unsubscribe functions for deterministic cleanup.
 */
export class BaseAdapter {
  /**
   * @param {GameController} gameController
   */
  constructor(gameController) {
    this.gameController = gameController;
    this.subscriptions = [];
  }

  /**
   * Register a map of eventName -> handler and track unsubscribe functions.
   * @param {Object<string, Function>} handlers
   */
  registerEventHandlers(handlers = {}) {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      const unsub = this.gameController.on(eventName, handler);
      if (typeof unsub === "function") {
        this.subscriptions.push(unsub);
      }
    });
  }

  /**
   * Unsubscribe all registered handlers
   */
  destroy() {
    if (Array.isArray(this.subscriptions)) {
      this.subscriptions.forEach((unsub) => {
        try {
          if (typeof unsub === "function") unsub();
        } catch (_e) {
          /* Suppress unsubscribe errors */
        }
      });
      this.subscriptions = [];
    }
  }
}
