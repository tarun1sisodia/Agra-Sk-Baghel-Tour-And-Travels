import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import fs from "node:fs";

function spaFallback200(): Plugin {
  return {
    name: "spa-fallback-200",
    closeBundle() {
      const distIndex = fileURLToPath(new URL("./dist/index.html", import.meta.url));
      const dist200 = fileURLToPath(new URL("./dist/200.html", import.meta.url));
      if (fs.existsSync(distIndex)) {
        fs.copyFileSync(distIndex, dist200);
      }
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/",
  plugins: [react(), tailwindcss(), spaFallback200()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4175,
    strictPort: false,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run")) {
            return "vendor-router";
          }
          if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-lucide";
          }
        },
      },
    },
  },
});
