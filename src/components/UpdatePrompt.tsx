import { useEffect, useRef } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

const UPDATED_KEY = "ledge_just_updated";
const TOAST_ID = "ledge-update-available";
const REMIND_AFTER_MS = 5 * 60 * 1000; // 5 minutes

declare global {
  interface Window {
    __ledgeTriggerUpdate?: () => Promise<boolean>;
    __ledgeHasUpdate?: boolean;
  }
}

export function UpdatePrompt() {
  const updateFnRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);
  const remindTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Show success toast if we just reloaded after an update
    if (sessionStorage.getItem(UPDATED_KEY)) {
      sessionStorage.removeItem(UPDATED_KEY);
      setTimeout(() => {
        toast.success("Updated to the latest version of Ledge", { duration: 3000 });
      }, 1200);
    }

    const showUpdateToast = () => {
      window.__ledgeHasUpdate = true;
      toast("New version of Ledge is ready", {
        id: TOAST_ID,
        description: "Update now to get the latest improvements.",
        duration: Infinity,
        action: {
          label: "Update",
          onClick: () => {
            sessionStorage.setItem(UPDATED_KEY, "1");
            updateFnRef.current?.(true);
          },
        },
        cancel: {
          label: "Later",
          onClick: () => {
            // Re-show the toast after a delay so users don't forget
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

    // Global manual trigger for the header "Refresh app" button.
    // Returns true if an update was available and triggered, false otherwise.
    window.__ledgeTriggerUpdate = async () => {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        await reg?.update();
      } catch {
        // ignore
      }
      if (window.__ledgeHasUpdate) {
        sessionStorage.setItem(UPDATED_KEY, "1");
        await updateSW(true);
        return true;
      }
      return false;
    };

    // Poll for SW updates every 60 seconds
    const interval = setInterval(() => {
      navigator.serviceWorker?.getRegistration().then((r) => r?.update());
    }, 60_000);

    // Re-check when the tab becomes visible again (catches users returning after hours)
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        navigator.serviceWorker?.getRegistration().then((r) => r?.update());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      if (remindTimerRef.current) clearTimeout(remindTimerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
