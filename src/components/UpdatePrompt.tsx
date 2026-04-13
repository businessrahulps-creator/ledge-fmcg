import { useEffect, useState, useCallback } from "react";
import { registerSW } from "virtual:pwa-register";

export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {},
    });

    setUpdateSW(() => update);

    // Check for SW updates every 60 seconds
    const interval = setInterval(() => {
      navigator.serviceWorker?.getRegistration().then((r) => r?.update());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const handleReload = useCallback(() => {
    if (updateSW) {
      updateSW(true).catch(() => window.location.reload());
    } else {
      window.location.reload();
    }
  }, [updateSW]);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl px-4 py-3 shadow-lg">
        <p className="text-sm text-foreground">A new version is available</p>
        <button
          onClick={handleReload}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
