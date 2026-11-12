import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "./",
  // Firebase product SDKs must share the same component registry.
  resolve: { dedupe: ["@firebase/app", "@firebase/component"] },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Тише — трекер курения",
        short_name: "Тише",
        lang: "ru",
        display: "standalone",
        start_url: "./",
        theme_color: "#f5f5f0",
        background_color: "#f5f5f0",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,woff2}"] },
    }),
  ],
});
