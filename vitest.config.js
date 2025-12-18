import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.spec.js"],
    exclude: ["tests/e2e/**", "tests/unit/**/*.test.js"],
    globals: false,
  },
});
