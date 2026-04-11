import { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useInstallPrompt, hasReachedMilestone } from "@/hooks/use-install-prompt";

export function InstallPrompt() {
  const {
    canInstall,
    isIOS,
    isStandalone,
    dismissed,
    permanentlyDismissed,
    triggerInstall,
    dismiss,
    dismissForever,
  } = useInstallPrompt();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canInstall || isStandalone || permanentlyDismissed) return;

    // Check milestone periodically (user may reach it while on page)
    const check = () => {
      if (hasReachedMilestone() && !dismissed) {
        setVisible(true);
      }
    };

    // Initial check after 2s delay
    const timer = setTimeout(check, 2000);
    // Re-check every 10s in case milestones are reached
    const interval = setInterval(check, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [canInstall, isStandalone, permanentlyDismissed, dismissed]);

  // Hide when dismissed
  useEffect(() => {
    if (dismissed) setVisible(false);
  }, [dismissed]);

  const handleInstall = async () => {
    const accepted = await triggerInstall();
    if (accepted) setVisible(false);
  };

  const showPrompt = visible && canInstall && !dismissed;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-24 left-3 right-3 z-[60] md:bottom-6 md:left-auto md:right-6 md:w-[360px]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/70 p-4 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-[1.8] dark:border-border/20 dark:bg-background/50">
            <button
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <img src="/pwa-192.png" alt="Ledge" className="h-12 w-12 shrink-0 rounded-xl shadow-sm" />

              <div className="min-w-0 flex-1 pr-4">
                <p className="text-sm font-semibold">Install Ledge App</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isIOS
                    ? "Install Ledge as an app for fast offline access to orders, stock, and reports — even in godowns."
                    : "Install Ledge as an app for fast offline access to orders, stock, and reports — even in godowns."}
                </p>

                {isIOS && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                        <Share className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span>Tap the <strong className="text-foreground">Share</strong> button</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                        <Plus className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span>Select <strong className="text-foreground">Add to Home Screen</strong></span>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {!isIOS && (
                    <Button size="sm" className="h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 text-xs shadow-sm" onClick={handleInstall}>
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Install App
                    </Button>
                  )}
                  <button
                    onClick={dismissForever}
                    className="text-[11px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                  >
                    Don't show again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
