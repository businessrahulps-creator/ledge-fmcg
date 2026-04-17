import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logError } from "@/utils/errorLog";

// Global error capture — unhandled promise rejections + uncaught errors
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    logError({ source: "global:unhandledrejection", error: e.reason ?? "Unhandled rejection" });
  });
  window.addEventListener("error", (e) => {
    logError({
      source: "global:window.onerror",
      error: e.error ?? e.message,
      context: { filename: e.filename, lineno: e.lineno, colno: e.colno },
    });
  });
}

// Guard: never register service workers in Lovable preview / iframes
import { isPreviewEnv } from "@/lib/preview-env";

if (isPreviewEnv) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  // Also nuke any caches left behind by a prior SW registration
  if (typeof caches !== "undefined") {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
  }
  // Reset global update flags used by UpdatePrompt so nothing thinks an update is pending
  try {
    (window as any).__ledgeHasUpdate = false;
    (window as any).__ledgeTriggerUpdate = undefined;
  } catch {}
  // Strip manifest link so the preview origin can't be treated as installable
  try {
    document.querySelectorAll('link[rel="manifest"]').forEach((el) => el.parentNode?.removeChild(el));
  } catch {}
}


createRoot(document.getElementById("root")!).render(<App />);

