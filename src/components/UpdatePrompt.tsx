// Offline mode is paused — see mem://features/offline-mode-paused.
// The original SW-aware update prompt has been short-circuited. We keep the
// component mounted (and the global hooks defined as no-ops) so callers like
// the "Refresh app" header button don't break.

declare global {
  interface Window {
    __ledgeTriggerUpdate?: () => Promise<boolean>;
    __ledgeHasUpdate?: boolean;
    __ledgeAppVersion?: string;
    __ledgeLastCheck?: number;
  }
}

export function UpdatePrompt() {
  if (typeof window !== "undefined") {
    window.__ledgeHasUpdate = false;
    window.__ledgeTriggerUpdate = async () => {
      // No SW to coordinate with — a plain reload is the safest behavior.
      window.location.reload();
      return true;
    };
  }
  return null;
}
