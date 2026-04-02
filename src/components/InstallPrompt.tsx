import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show in iframe (Lovable preview)
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    // Check if already dismissed
    if (localStorage.getItem("ordra-install-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("ordra-install-dismissed", "1");
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-16 left-3 right-3 z-50 animate-slide-in-up md:bottom-6 md:left-auto md:right-6 md:w-80">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xl md:p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">O</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold md:text-sm">Install Ordra</p>
          <p className="text-[10px] text-muted-foreground md:text-xs">Add to home screen for the best experience</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" className="h-8 px-3 text-xs" onClick={handleInstall}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Install
          </Button>
          <button onClick={handleDismiss} className="p-1.5 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
