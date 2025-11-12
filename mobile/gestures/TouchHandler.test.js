
import { TouchHandler } from "./TouchHandler.js";

// Helper to simulate touch events
const simulateTouch = (element, eventType, x, y) => {
    const touch = { clientX: x, clientY: y, target: element };
    const event = new Event(eventType, {
        bubbles: true,
        cancelable: true
    });
    Object.defineProperty(event, "touches", {
        value: [touch],
        enumerable: false
    });
    Object.defineProperty(event, "changedTouches", {
        value: [touch],
        enumerable: false
    });
    element.dispatchEvent(event);
};

const simulateTouchSequence = (element, sequence) => {
    let delay = 0;
    sequence.forEach(item => {
        delay += item.delay;
        setTimeout(() => {
            simulateTouch(element, item.event, item.x, item.y);
        }, delay);
    });
};


describe("TouchHandler", () => {
    let handler;
    let element;

    beforeEach(() => {
        document.body.innerHTML = "<div id=\"test-element\" style=\"width: 50px; height: 50px; background: red;\"></div>";
        element = document.getElementById("test-element");
    });

    afterEach(() => {
        if (handler) {
            handler.destroy();
        }
        document.body.innerHTML = "";
    });

    it("should detect a tap gesture", (done) => {
        handler = new TouchHandler(document.body);
        handler.init();

        handler.on("tap", (data) => {
            expect(data.type).toBe("tap");
            expect(data.coordinates.x).toBe(100);
            expect(data.timestamp).toBeDefined();
            done();
        });

        simulateTouchSequence(element, [
            { event: "touchstart", x: 100, y: 100, delay: 0 },
            { event: "touchend", x: 100, y: 100, delay: 100 }
        ]);
    });

    it("should not emit tap if user moves > threshold", (done) => {
        handler = new TouchHandler(document.body);
        handler.init();

        let tapEmitted = false;
        handler.on("tap", () => { tapEmitted = true; });

        simulateTouchSequence(element, [
            { event: "touchstart", x: 100, y: 100, delay: 0 },
            { event: "touchmove", x: 120, y: 100, delay: 50 },  // Moved 20px
            { event: "touchend", x: 120, y: 100, delay: 100 }
        ]);

        setTimeout(() => {
            expect(tapEmitted).toBe(false);
            done();
        }, 300);
    });

    it("should not emit tap if duration > threshold", (done) => {
        handler = new TouchHandler(document.body);
        handler.init();

        let tapEmitted = false;
        handler.on("tap", () => { tapEmitted = true; });

        simulateTouchSequence(element, [
            { event: "touchstart", x: 100, y: 100, delay: 0 },
            { event: "touchend", x: 100, y: 100, delay: 400 }  // 400ms > 300ms threshold
        ]);

        setTimeout(() => {
            expect(tapEmitted).toBe(false);
            done();
        }, 500);
    });

    it("should detect double-tap when enabled", (done) => {
        handler = new TouchHandler(document.body, { enableDoubleTap: true });
        handler.init();

        handler.on("doubletap", (data) => {
            expect(data.type).toBe("doubletap");
            done();
        });

        simulateTouchSequence(element, [
            { event: "touchstart", x: 100, y: 100, delay: 0 },
            { event: "touchend", x: 100, y: 100, delay: 100 },
            { event: "touchstart", x: 102, y: 102, delay: 50 },
            { event: "touchend", x: 102, y: 102, delay: 100 }
        ]);
    });

    it("should not detect double-tap if too far apart", (done) => {
        handler = new TouchHandler(document.body, { enableDoubleTap: true });
        handler.init();

        let doubleTapEmitted = false;
        handler.on("doubletap", () => { doubleTapEmitted = true; });

        simulateTouchSequence(element, [
            { event: "touchstart", x: 100, y: 100, delay: 0 },
            { event: "touchend", x: 100, y: 100, delay: 100 },
            { event: "touchstart", x: 130, y: 130, delay: 50 }, // 30px away
            { event: "touchend", x: 130, y: 130, delay: 100 }
        ]);

        setTimeout(() => {
            expect(doubleTapEmitted).toBe(false);
            done();
        }, 400);
    });


    it("should detect long-press when enabled", (done) => {
        handler = new TouchHandler(document.body, { enableLongPress: true });
        handler.init();

        handler.on("longpress", (data) => {
            expect(data.type).toBe("longpress");
            done();
        });

        simulateTouchSequence(element, [
            { event: "touchstart", x: 100, y: 100, delay: 0 },
            // No touchend, just wait for the timer
        ]);
    });

    it("should not detect long-press if movement occurs", (done) => {
        handler = new TouchHandler(document.body, { enableLongPress: true });
        handler.init();

        let longPressEmitted = false;
        handler.on("longpress", () => { longPressEmitted = true; });

        simulateTouchSequence(element, [
            { event: "touchstart", x: 100, y: 100, delay: 0 },
            { event: "touchmove", x: 120, y: 100, delay: 200 },
        ]);

        setTimeout(() => {
            expect(longPressEmitted).toBe(false);
            done();
        }, 700);
    });

    it("should reset state on touchcancel", (done) => {
        handler = new TouchHandler(document.body, { enableLongPress: true });
        handler.init();

        let longPressEmitted = false;
        handler.on("longpress", () => { longPressEmitted = true; });

        simulateTouch(element, "touchstart", 100, 100);

        setTimeout(() => {
            simulateTouch(element, "touchcancel", 100, 100);
        }, 200);

        setTimeout(() => {
            expect(longPressEmitted).toBe(false);
            expect(handler.state.current).toBe("idle");
            done();
        }, 700);
    });
});
