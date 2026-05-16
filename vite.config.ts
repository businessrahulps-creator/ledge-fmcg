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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/react-router-dom/") || id.includes("/scheduler/")) return "react-vendor";
          if (id.includes("/@radix-ui/")) return "radix-vendor";
          if (id.includes("/@supabase/") || id.includes("/@tanstack/")) return "supabase-vendor";
          if (id.includes("/recharts/") || id.includes("/d3-")) return "charts";
          if (id.includes("/xlsx")) return "xlsx";
          if (id.includes("/lucide-react/")) return "icons";
          if (id.includes("/framer-motion/") || id.includes("/motion")) return "motion";
          if (id.includes("/date-fns/")) return "date-fns";
          return undefined;
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
