import { useEffect, useState, useCallback } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Guards an in-progress form against accidental navigation / tab close.
 *
 * Behavior:
 * - When `isDirty` is true and the user attempts in-app navigation,
 *   `useBlocker` pauses it and exposes a confirm UI via `confirmOpen`.
 * - When the user attempts a tab close / hard refresh, a native
 *   `beforeunload` prompt is shown (browsers customise the message).
 *
 * The hook is UI-agnostic; the consuming component renders an AlertDialog
 * bound to `confirmOpen` / `confirmLeave` / `cancelLeave`.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  // Browser-level guard for tab close / hard refresh.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore the message but require returnValue to be set.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Surface the blocker as a controlled dialog.
  useEffect(() => {
    if (blocker.state === "blocked") setConfirmOpen(true);
  }, [blocker.state]);

  const confirmLeave = useCallback(() => {
    setConfirmOpen(false);
    if (blocker.state === "blocked") blocker.proceed();
  }, [blocker]);

  const cancelLeave = useCallback(() => {
    setConfirmOpen(false);
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);

  return { confirmOpen, confirmLeave, cancelLeave };
}
