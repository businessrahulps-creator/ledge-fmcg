import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import { isPreviewEnv } from "@/lib/preview-env";


const UPDATED_KEY = "ledge_just_updated";
const TOAST_ID = "ledge-update-available";
const REMIND_AFTER_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 20_000; // Layer 1: aggressive polling
const META_CHECK_INTERVAL_MS = 30_000; // Layer 4: periodic meta-tag fetch

declare const __APP_VERSION__: string;

declare global {
  interface Window {
    __ledgeTriggerUpdate?: () => Promise<boolean>;
    __ledgeHasUpdate?: boolean;
    __ledgeAppVersion?: string;
    __ledgeLastCheck?: number;
  }
}

/**
 * Layer 4 — iOS escape hatch.
 * Fetch /index.html bypassing cache, parse the <meta name="app-version"> tag,
 * compare to the build-time __APP_VERSION__. If different, the deployed build
 * is newer than what we're running, regardless of what the SW thinks.
 */
async function checkRemoteVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/index.html?_=${Date.now()}`, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/<meta\s+name=["']app-version["']\s+content=["']([^"']+)["']/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function UpdatePrompt() {
  const updateFnRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);
  const remindTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadingRef = useRef(false);

  useEffect(() => {
    window.__ledgeAppVersion = __APP_VERSION__;

    // Show success toast if we just reloaded after an update
    if (sessionStorage.getItem(UPDATED_KEY)) {
      sessionStorage.removeItem(UPDATED_KEY);
      setTimeout(() => {
        toast.success("Updated to the latest version of Ledge", { duration: 3000 });
      }, 1200);
    }

    const triggerReload = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      sessionStorage.setItem(UPDATED_KEY, "1");
      // Prefer the SW-aware updater; fall back to hard reload.
      if (updateFnRef.current) {
        updateFnRef.current(true).catch(() => window.location.reload());
      } else {
        window.location.reload();
      }
    };

    const showUpdateToast = () => {
      window.__ledgeHasUpdate = true;
      toast("New version of Ledge is ready", {
        id: TOAST_ID,
        description: "Update now to get the latest improvements.",
        duration: Infinity,
        action: {
          label: "Update",
          onClick: triggerReload,
        },
        cancel: {
          label: "Later",
          onClick: () => {
            if (remindTimerRef.current) clearTimeout(remindTimerRef.current);
            remindTimerRef.current = setTimeout(showUpdateToast, REMIND_AFTER_MS);
          },
        },
      });
    };

    const updateSW = registerSW({
      onNeedRefresh() {
        showUpdateToast();
      },
      onOfflineReady() {},
    });
    updateFnRef.current = updateSW;

    // Layer 1: Auto-reload on SW controllerchange (new SW took over).
    const onControllerChange = () => {
      if (!reloadingRef.current) {
        reloadingRef.current = true;
        sessionStorage.setItem(UPDATED_KEY, "1");
        window.location.reload();
      }
    };
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

    // Manual trigger for the header "Refresh app" button.
    window.__ledgeTriggerUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        await reg?.update();
      } catch {
        // ignore
      }

      // Also do a Layer 4 check — handles iOS where SW.update() is throttled.
      const remote = await checkRemoteVersion();
      window.__ledgeLastCheck = Date.now();
      if (remote && remote !== __APP_VERSION__) {
        window.__ledgeHasUpdate = true;
        triggerReload();
        return true;
      }

      if (window.__ledgeHasUpdate) {
        triggerReload();
        return true;
      }
      return false;
    };

    // Layer 1: Aggressive SW polling
    const swInterval = setInterval(() => {
      navigator.serviceWorker?.getRegistration().then((r) => r?.update());
    }, POLL_INTERVAL_MS);

    // Layer 4: Periodic meta-tag check (the iOS escape hatch)
    const metaCheck = async () => {
      const remote = await checkRemoteVersion();
      if (remote && remote !== __APP_VERSION__) {
        window.__ledgeHasUpdate = true;
        showUpdateToast();
      }
    };
    const metaInterval = setInterval(metaCheck, META_CHECK_INTERVAL_MS);
    // Run one immediately on mount (catches stale iOS PWA on cold launch)
    setTimeout(metaCheck, 2000);

    // Re-check when the tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker?.getRegistration().then((r) => r?.update());
        metaCheck();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(swInterval);
      clearInterval(metaInterval);
      if (remindTimerRef.current) clearTimeout(remindTimerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
