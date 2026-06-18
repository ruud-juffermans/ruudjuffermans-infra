import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    watch: { usePolling: true },
    // In dev, proxy API calls to the admin server so the browser talks
    // same-origin and the session cookie flows without CORS friction. Defaults to
    // the Docker service name; override with ADMIN_PROXY_TARGET when running the
    // client directly on the host (e.g. http://localhost:4100).
    proxy: {
      "/api": {
        target: process.env.ADMIN_PROXY_TARGET || "http://admin-server:4000",
        changeOrigin: true,
      },
    },
  },
});
