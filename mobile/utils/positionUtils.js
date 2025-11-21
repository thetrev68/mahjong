/**
 * Position utility functions for mobile rendering
 * Provides shared position calculation logic for animations and layout
 */

/**
 * Get the center position of an element relative to the viewport
 * @param {HTMLElement} element - The element to get the position of
 * @returns {{x: number, y: number}} Center coordinates in viewport space
 */
export function getElementCenterPosition(element) {
    if (!element || !element.getBoundingClientRect) {
        return { x: 0, y: 0 };
    }
    const rect = element.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}
