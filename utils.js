// Print to message window
export function printMessage(str) {
    const textArea = window.document.getElementById("messages");
    textArea.value += str;
    textArea.scrollTop = textArea.scrollHeight;
}

// Print to info window
export function printInfo(str) {
    const textArea = window.document.getElementById("info");
    textArea.value = str;
}

export const gdebug = 1; // Set to 0 to disable debug messages

/** @knipignore */
export function getGtrace() {
    return gdebug;
}

// Conditional debug functions
let debugPrint = function() {};
let debugTrace = function() {};

if (gdebug) {
    debugPrint = function(str) {
        console.log(str);
    };
    debugTrace = function(str) {
        if (getGtrace()) { // This will now check gdebug
            console.log(str);
        }
    };
}

export { debugPrint, debugTrace };

// Print to hint window
export function printHint(html) {
    const hintContent = window.document.getElementById("hint-content");
    hintContent.innerHTML = html;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
