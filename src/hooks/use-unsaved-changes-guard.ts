import { useEffect, useState, useCallback } from "react";

/**
 * Guards an in-progress form against accidental tab close / hard refresh.
 *
 * Router-agnostic: uses only the native `beforeunload` event so it works
 * with both data routers and the classic <BrowserRouter>.
 *
 * In-app navigation blocking is intentionally not handled here — pages
 * that need it should implement their own confirm flow on cancel/back.
 *
 * The returned `confirmOpen` / `confirmLeave` / `cancelLeave` are kept
 * for API compatibility with existing callers but are inert (no in-app
 * navigation is ever blocked, so the dialog never opens automatically).
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmLeave = useCallback(() => setConfirmOpen(false), []);
  const cancelLeave = useCallback(() => setConfirmOpen(false), []);

  return { confirmOpen, confirmLeave, cancelLeave };
}
