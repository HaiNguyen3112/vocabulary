import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

const API_TARGET = "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [react()],
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
