import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for American Mahjong game testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",

  // Match both E2E and unit tests
  testMatch: ["**/e2e/**/*.spec.js", "**/unit/**/*.test.js"],

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: "html",

  // Shared settings for all the projects below
  use: {
    // Base URL for tests (Vite dev server with base path)
    baseURL: "http://localhost:5173/mahjong",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",
  },

  // Configure projects for major browsers and mobile
  projects: [
    {
      name: "unit",
      testMatch: "**/unit/**/*.test.js",
      use: {
        // Unit tests don't need browser context
      },
    },
    {
      name: "desktop",
      testMatch: [
        "**/e2e/desktop/**/*.spec.js",
        "**/e2e/charleston-animations.spec.js",
      ],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "mobile",
      testMatch: "**/e2e/mobile/**/*.spec.js",
      use: {
        ...devices["iPhone 12"],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173/mahjong/",
    reuseExistingServer: !process.env.CI,
  },
});
