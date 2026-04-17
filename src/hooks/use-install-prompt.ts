import { useState, useEffect, useCallback } from "react";
import { isPreviewEnv } from "@/lib/preview-env";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "ledge-install-state"; // "dismissed" | "never" | undefined
const DASHBOARD_VISITS_KEY = "ledge-dashboard-visits";
const FIRST_ORDER_KEY = "ledge-first-order-created";

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** Check if user has engaged enough to warrant an install prompt */
export function hasReachedMilestone(): boolean {
  const visits = Number(localStorage.getItem(DASHBOARD_VISITS_KEY) || 0);
  const firstOrder = localStorage.getItem(FIRST_ORDER_KEY) === "true";
  return visits >= 3 || firstOrder;
}

/** Track a dashboard visit */
export function trackDashboardVisit() {
  const visits = Number(localStorage.getItem(DASHBOARD_VISITS_KEY) || 0);
  localStorage.setItem(DASHBOARD_VISITS_KEY, String(visits + 1));
}

/** Track first order creation */
export function trackFirstOrderCreated() {
  localStorage.setItem(FIRST_ORDER_KEY, "true");
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const iosDevice = typeof navigator !== "undefined" && isIOS();
  const standalone = typeof window !== "undefined" && isStandalone();
  const iframe = typeof window !== "undefined" && isInIframe();

  useEffect(() => {
    if (iframe || standalone) return;
    const state = localStorage.getItem(STORAGE_KEY);
    if (state === "never") {
      setDismissed(true);
      return;
    }
    if (state === "dismissed") setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [iframe, standalone]);

  const canInstall = !standalone && !iframe && (!!deferredPrompt || iosDevice);
  const permanentlyDismissed = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "never";

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "dismissed");
  }, []);

  const dismissForever = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "never");
  }, []);

  return {
    canInstall,
    isIOS: iosDevice,
    isStandalone: standalone,
    dismissed,
    permanentlyDismissed,
    triggerInstall,
    dismiss,
    dismissForever,
  };
}
