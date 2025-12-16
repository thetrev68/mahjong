import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/mahjong/" : "/",
  build: {
    chunkSizeWarningLimit: 1500, // phaser is large
    rollupOptions: {
      input: {
        desktop: "index.html",              // Desktop entry
        mobile: "mobile/index.html"         // Mobile entry
      }
    }
  },
  server: {
    hmr: {
      overlay: false, // Disable error overlay
    },
  },
  // Exclude service worker from processing
  publicDir: "pwa",  // Serve pwa/ as static files
  logLevel: "info", // Show startup messages and info
});
