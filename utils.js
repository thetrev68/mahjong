// Print to message window
export function printMessage(str) {
    const textArea = window.document.getElementById("messages");
    if (!textArea) {
        return;
    }
    const message = str.endsWith("\n") ? str : `${str}\n`;
    textArea.value += message;
    textArea.scrollTop = textArea.scrollHeight;
}

// Print to info window
export function printInfo(str) {
    const textArea = window.document.getElementById("info");
    textArea.value = str;
}

export const gdebug = 0; // Set to 0 to disable debug messages

/** @knipignore */
export function getGtrace() {
    return gdebug;
}

// Conditional debug functions
let debugPrint = function() {};
let debugTrace = function() {};
let debugWarn = function() {};
let debugError = function() {};

if (gdebug) {
    debugPrint = function(str, data = null) {
        if (data !== null) {
            console.log(str, data);
        } else {
            console.log(str);
        }
    };
    debugTrace = function(str) {
        if (getGtrace()) { // This will now check gdebug
            console.log(str);
        }
    };
    debugWarn = function(str, data = null) {
        if (data !== null) {
            console.warn(str, data);
        } else {
            console.warn(str);
        }
    };
    debugError = function(str, data = null) {
        if (data !== null) {
            console.error(str, data);
        } else {
            console.error(str);
        }
    };
}

export { debugPrint, debugTrace, debugWarn, debugError };

// Print to hint window
export function printHint(html) {
    const hintContent = window.document.getElementById("hint-content");
    hintContent.innerHTML = html;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
