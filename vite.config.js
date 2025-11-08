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
  logLevel: "info", // Show startup messages and info
});
