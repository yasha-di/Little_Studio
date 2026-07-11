import { readFileSync } from "node:fs";
import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

// The one version number lives in package.json; everything in the app
// (About dialog, sidebar, splash) renders this constant.
const { version } = JSON.parse(readFileSync("./package.json", "utf-8")) as { version: string };

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development.
  //
  // 1. Prevent Vite from obscuring Rust errors.
  clearScreen: false,
  // 2. Tauri expects a fixed port; fail if that port is not available.
  server: {
    port: 1420,
    strictPort: true,
    host: host ?? false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. Tell Vite to ignore watching `src-tauri`.
      ignored: ["**/src-tauri/**"],
    },
  },
  // Env variables starting with the item of `envPrefix` will be exposed in
  // Tauri's source code through `import.meta.env`.
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    // Tauri on Windows uses Chromium (WebView2), so a modern target is safe.
    target: "chrome105",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
