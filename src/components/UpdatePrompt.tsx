import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

const UPDATED_KEY = "ledge_just_updated";

export function UpdatePrompt() {
  useEffect(() => {
    // Show toast if we just reloaded after an update
    if (sessionStorage.getItem(UPDATED_KEY)) {
      sessionStorage.removeItem(UPDATED_KEY);
      // Small delay so the app is fully rendered before showing
      setTimeout(() => {
        toast.success("Updated to latest version", {
          duration: 3000,
        });
      }, 1500);
    }

    const updateSW = registerSW({
      onNeedRefresh() {
        // Flag that an update is about to happen
        sessionStorage.setItem(UPDATED_KEY, "1");
        // Auto-update: reload immediately to pick up new version
        updateSW(true);
      },
      onOfflineReady() {},
    });

    // Poll for SW updates every 60 seconds
    const interval = setInterval(() => {
      navigator.serviceWorker?.getRegistration().then((r) => r?.update());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
