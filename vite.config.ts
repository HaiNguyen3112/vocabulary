import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

const API_TARGET = "http://127.0.0.1:3001";
const DAY_SECONDS = 24 * 60 * 60;

/** Offline: app shell precached, `GET /api/*` network-first (writes always need the network). */
const pwa = VitePWA({
  registerType: "prompt",
  injectRegister: false,
  devOptions: { enabled: false },
  includeAssets: ["favicon.ico", "logo192.png"],
  manifest: {
    id: "/",
    name: "Studying Vocabulary",
    short_name: "Vocabulary",
    description: "Học từ vựng tiếng Anh: ghép từ với nghĩa và quản lý kho từ",
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#1677ff",
    background_color: "#f5f7fb",
    icons: [
      { src: "logo192.png", sizes: "192x192", type: "image/png" },
      { src: "logo512.png", sizes: "512x512", type: "image/png" },
      { src: "logo-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/api\//],
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
        method: "GET",
        handler: "NetworkFirst",
        options: {
          cacheName: "api",
          networkTimeoutSeconds: 4,
          cacheableResponse: { statuses: [200] },
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * DAY_SECONDS },
        },
      },
      {
        urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
        handler: "StaleWhileRevalidate",
        options: { cacheName: "google-fonts-css" },
      },
      {
        urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          cacheableResponse: { statuses: [0, 200] },
          expiration: { maxEntries: 30, maxAgeSeconds: 365 * DAY_SECONDS },
        },
      },
    ],
  },
});

export default defineConfig({
  plugins: [react(), pwa],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: { "/api": { target: API_TARGET, changeOrigin: true } },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: { "/api": { target: API_TARGET, changeOrigin: true } },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "shared/**/*.test.ts", "server/**/*.test.ts"],
  },
});
