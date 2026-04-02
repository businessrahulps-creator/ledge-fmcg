import { useState, useEffect, useCallback } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "ordra-install-state"; // "dismissed" | "never" | undefined

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show in iframe / standalone / permanently dismissed
    try { if (window.self !== window.top) return; } catch { return; }
    if (isStandalone()) return;
    const state = localStorage.getItem(STORAGE_KEY);
    if (state === "never") return;

    // For Android/Chrome — listen for native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For iOS — show manual instructions after delay
    if (isIOS() && state !== "never") {
      const timer = setTimeout(() => setShowIOS(true), 3000);
      return () => { clearTimeout(timer); window.removeEventListener("beforeinstallprompt", handler); };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Show prompt 3s after the native event fires (or iOS detection)
  useEffect(() => {
    if (!deferredPrompt && !showIOS) return;
    const state = localStorage.getItem(STORAGE_KEY);
    if (state === "never") return;
    const timer = setTimeout(() => setVisible(true), deferredPrompt ? 3000 : 0);
    return () => clearTimeout(timer);
  }, [deferredPrompt, showIOS]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setVisible(false);
    }
  }, [deferredPrompt]);

  const handleLater = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "dismissed");
  }, []);

  const handleNever = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "never");
  }, []);

  const showPrompt = visible && (!!deferredPrompt || showIOS);

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-3 right-3 z-[60] md:bottom-6 md:left-auto md:right-6 md:w-[360px]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-background/70 p-4 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-[1.8] dark:border-border/20 dark:bg-background/50">
            {/* Close button */}
            <button
              onClick={handleLater}
              className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              {/* App icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground shadow-sm">
                <span className="text-lg font-bold text-background">O</span>
              </div>

              <div className="min-w-0 flex-1 pr-4">
                <p className="text-sm font-semibold">Install Ordra</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {showIOS
                    ? "Add to your home screen for the best experience"
                    : "Install for instant access, offline support & a native feel"}
                </p>

                {/* iOS-specific instructions */}
                {showIOS && (
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

                {/* Action buttons */}
                <div className="mt-3 flex items-center gap-2">
                  {!showIOS && (
                    <Button size="sm" className="h-8 rounded-lg px-4 text-xs" onClick={handleInstall}>
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Install
                    </Button>
                  )}
                  <button
                    onClick={handleNever}
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
