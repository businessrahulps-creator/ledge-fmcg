import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { logError } from "@/utils/errorLog";
import {
  isChunkLoadError,
  handleAssetFailure,
  clearChunkReloadFlag,
} from "@/lib/chunk-recovery";

// Global error capture — unhandled promise rejections + uncaught errors
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    logError({ source: "global:unhandledrejection", error: e.reason ?? "Unhandled rejection" });
    if (isChunkLoadError(e.reason)) handleAssetFailure("Ledge couldn't load part of the app.");
  });
  window.addEventListener("error", (e) => {
    logError({
      source: "global:window.onerror",
      error: e.error ?? e.message,
      context: { filename: e.filename, lineno: e.lineno, colno: e.colno },
    });
    if (isChunkLoadError(e.error ?? e.message)) handleAssetFailure("Ledge couldn't load part of the app.");
  });

  // Resource-level failures (stylesheet / script 404 after a new release) do
  // not surface as normal errors — they only fire on the element, capture phase.
  window.addEventListener(
    "error",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target || target === (window as unknown as HTMLElement)) return;
      const tag = target.tagName?.toLowerCase();
      const stylesheetHref = tag === "link" ? (target as HTMLLinkElement).href : "";
      let isAppStylesheet = false;
      try {
        const stylesheetUrl = new URL(stylesheetHref);
        isAppStylesheet =
          (target as HTMLLinkElement).rel === "stylesheet" &&
          stylesheetUrl.origin === window.location.origin &&
          /\/assets\/[^/]+\.css$/.test(stylesheetUrl.pathname);
      } catch {
        isAppStylesheet = false;
      }
      const isAppScript =
        tag === "script" &&
        (target as HTMLScriptElement).src.startsWith(window.location.origin) &&
        /\/assets\//.test((target as HTMLScriptElement).src || "");
      if (isAppStylesheet || isAppScript) {
        handleAssetFailure("Ledge couldn't load its files.");
      }
    },
    true,
  );
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


createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);

// Stylesheet sentinel — if the app's CSS never arrived (stale cached document
// pointing at a deleted asset), the app renders as raw unstyled text. Detect
// that and self-repair once instead of leaving the user on a broken screen.
requestAnimationFrame(() => {
  setTimeout(() => {
    const token = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
    if (!token) {
      handleAssetFailure("Ledge couldn't load its styling.");
    } else {
      clearChunkReloadFlag();
    }
  }, 0);
});

