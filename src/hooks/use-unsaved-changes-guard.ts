import { useEffect } from "react";

/**
 * Guards an in-progress form against accidental tab close / hard refresh.
 *
 * Router-agnostic: uses only the native `beforeunload` event so it works
 * with both data routers and the classic <BrowserRouter>. In-app navigation
 * blocking is intentionally not handled here — pages that need it should
 * implement their own confirm flow on cancel/back.
 */
export function useUnsavedChangesGuard(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
