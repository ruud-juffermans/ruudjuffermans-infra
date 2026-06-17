import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    watch: { usePolling: true },
    // In dev, proxy API calls to the admin server container so the browser talks
    // same-origin and the session cookie flows without CORS friction.
    proxy: {
      "/api": {
        target: "http://admin-server:4000",
        changeOrigin: true,
      },
    },
  },
});
