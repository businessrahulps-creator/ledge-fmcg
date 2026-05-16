import { useEffect } from "react";

/**
 * After an act transition, focus the first focusable field in the panel.
 * Respects user intent — won't steal focus if user has already focused something.
 */
export function useFocusFirstField(active: boolean, scopeRef: React.RefObject<HTMLElement>, deps: unknown[] = []) {
  useEffect(() => {
    if (!active) return;
    const el = scopeRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      // Don't steal focus if user is mid-action
      if (document.activeElement && el.contains(document.activeElement)) return;
      const first = el.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      );
      first?.focus({ preventScroll: true });
    }, 380); // after the page-turn settles
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
}
