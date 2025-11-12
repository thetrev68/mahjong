
import { test, expect } from "@playwright/test";

test.describe("TouchHandler", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.setContent(`
      <div id="test-area" style="width: 200px; height: 200px; background: lightblue;"></div>
      <script type="module">
        import { TouchHandler } from '/mobile/gestures/TouchHandler.js';
        window.TouchHandler = TouchHandler;
        window.events = [];
        const handler = new TouchHandler(document.getElementById('test-area'), {
            enableDoubleTap: true,
            enableLongPress: true
        });
        handler.init();
        handler.on('tap', (e) => window.events.push(e));
        handler.on('doubletap', (e) => window.events.push(e));
        handler.on('longpress', (e) => window.events.push(e));
      </script>
    `);
  });

  test("should detect a tap gesture", async ({ page }) => {
    await page.tap("#test-area");
    await page.waitForTimeout(350); // wait for potential double tap to fail
    const events = await page.evaluate(() => window.events);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("tap");
  });

  test("should not emit tap if user moves > threshold", async ({ page }) => {
    const testArea = await page.locator("#test-area");
    await testArea.dispatchEvent("touchstart", { touches: [{ clientX: 100, clientY: 100 }] });
    await page.mouse.move(120, 100);
    await testArea.dispatchEvent("touchend", { changedTouches: [{ clientX: 120, clientY: 100 }] });
    await page.waitForTimeout(200);
    const events = await page.evaluate(() => window.events);
    expect(events.length).toBe(0);
  });

  test("should detect a double-tap gesture", async ({ page }) => {
    await page.tap("#test-area");
    await page.tap("#test-area");
    await page.waitForTimeout(200);
    const events = await page.evaluate(() => window.events);
    const doubleTapEvent = events.find(e => e.type === "doubletap");
    expect(doubleTapEvent).toBeDefined();
  });

  test("should detect a long-press gesture", async ({ page }) => {
    const testArea = await page.locator("#test-area");
    await testArea.dispatchEvent("touchstart", { touches: [{ clientX: 100, clientY: 100 }] });
    await page.waitForTimeout(600); // wait for long press
    await testArea.dispatchEvent("touchend", { changedTouches: [{ clientX: 100, clientY: 100 }] });
    const events = await page.evaluate(() => window.events);
    const longPressEvent = events.find(e => e.type === "longpress");
    expect(longPressEvent).toBeDefined();
  });
});
