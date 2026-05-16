import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// Offline mode is paused — see mem://features/offline-mode-paused.
// import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const buildTimestamp = Date.now().toString();
  return {
  define: {
    __APP_VERSION__: JSON.stringify(buildTimestamp),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      name: "html-inject-build-timestamp",
      transformIndexHtml(html: string) {
        return html.replace(/%BUILD_TIMESTAMP%/g, buildTimestamp);
      },
    },
    // VitePWA(...) intentionally removed while offline mode is paused.
    // See mem://features/offline-mode-paused for the full config + revival recipe.
  ].filter(Boolean),
  // Recharts/d3 hit a Rollup inter-chunk init bug when manually chunked, so
  // we leave charts in their default chunk. Everything else heavy that's safe
  // to isolate gets its own chunk so the entry stays lean.
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("jspdf") || id.includes("html2canvas") || id.includes("@react-pdf"))
              return "vendor-pdf";
            if (id.includes("framer-motion") || id.includes("/motion/"))
              return "vendor-motion";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("date-fns")) return "vendor-datefns";
          }
        },
      },
    },
  },
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : {},
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  };
});
