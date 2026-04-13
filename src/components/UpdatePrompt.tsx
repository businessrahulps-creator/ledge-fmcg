import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";

export function UpdatePrompt() {
  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
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
