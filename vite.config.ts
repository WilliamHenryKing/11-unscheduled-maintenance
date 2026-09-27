import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwind()],
  server: { host: "127.0.0.1", port: 4521, strictPort: true },
  preview: { host: "127.0.0.1", port: 4621, strictPort: true },
  // three.js alone is ~700 kB minified; one chunk is fine for a single-scene game.
  build: { cssMinify: "lightningcss", chunkSizeWarningLimit: 1200 },
});
