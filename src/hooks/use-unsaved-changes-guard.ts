import { useEffect, useRef } from "react";

const MESSAGE = "You have unsaved changes. Leave this page and lose them?";

/**
 * Guards an in-progress form against losing work.
 *
 * Covers both:
 *  - closing / reloading the tab (native `beforeunload`), and
 *  - navigating away inside the app.
 *
 * In-app navigation is intercepted at the history level rather than through the
 * data-router `useBlocker` API, because the app mounts a classic <BrowserRouter>.
 * A blocked back/forward is restored by pushing the current entry back on.
 */
export function useUnsavedChangesGuard(isDirty: boolean): void {
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    if (!isDirty) return;

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);

    // --- in-app navigation ---
    const originalPush = window.history.pushState.bind(window.history);
    const originalReplace = window.history.replaceState.bind(window.history);

    const confirmLeave = () => {
      if (!dirtyRef.current) return true;
      return window.confirm(MESSAGE);
    };

    window.history.pushState = function (...args: Parameters<History["pushState"]>) {
      const nextUrl = args[2];
      // Same-URL pushes (query/state housekeeping) never count as leaving.
      if (nextUrl && String(nextUrl) !== window.location.pathname && !confirmLeave()) return;
      return originalPush(...args);
    };
    window.history.replaceState = function (...args: Parameters<History["replaceState"]>) {
      return originalReplace(...args);
    };

    // Back / forward buttons.
    window.history.pushState(window.history.state, "", window.location.href);
    const onPopState = () => {
      if (dirtyRef.current && !window.confirm(MESSAGE)) {
        originalPush(window.history.state, "", window.location.href);
      }
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPopState);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, [isDirty]);
}
