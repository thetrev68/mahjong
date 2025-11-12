/**
 * EventEmitter - Simple event system for GameController
 * Provides subscribe/unsubscribe pattern for loose coupling between core and UI layers
 */

export class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} eventType - Event name (e.g., 'TILE_DRAWN')
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }

        this.listeners.get(eventType).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(eventType);
            if (!callbacks || callbacks.length === 0) {
                return;
            }
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                if (callbacks.length === 0) {
                    this.listeners.delete(eventType);
                }
            }
        };
    }

    /**
     * Subscribe to event, auto-unsubscribe after first trigger
     * @param {string} eventType - Event name
     * @param {Function} callback - Handler function
     */
    once(eventType, callback) {
        const unsubscribe = this.on(eventType, (data) => {
            unsubscribe();
            callback(data);
        });
    }

    /**
     * Emit an event to all subscribers
     * @param {string} eventType - Event name
     * @param {*} data - Event payload
     */
    emit(eventType, data) {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.slice().forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event type
     * @param {string} eventType - Event name
     */
    off(eventType) {
        this.listeners.delete(eventType);
    }

    /**
     * Remove all listeners for all events
     */
    clear() {
        this.listeners.clear();
    }
}
