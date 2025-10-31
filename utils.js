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

export const gdebug = 1;
export const gtrace = 0;

export function debugPrint(str) {
    if (gdebug) {
        console.log(str);
    }
}

export function debugTrace(str) {
    if (gtrace) {
        console.log(str);
    }
}

// Print to hint window
export function printHint(html) {
    const hintContent = window.document.getElementById("hint-content");
    hintContent.innerHTML = html;
}
