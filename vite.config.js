import { defineConfig } from "vite";

export default defineConfig({
  base: "/mahjong/",
  build: {
    chunkSizeWarningLimit: 1500, // phaser is large
  },
  server: {
    hmr: {
      overlay: false, // Disable error overlay
    },
  },
  logLevel: "warn", // Only show warnings and errors, not info messages
});
