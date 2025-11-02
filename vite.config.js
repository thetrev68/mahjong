import { defineConfig } from "vite";

export default defineConfig({
  base: "/mahjong/",
  build: {
    chunkSizeWarningLimit: 1500, // phaser is large
  },
});
