import { useEffect, useState } from "react";
import { TopProgress } from "@/components/ui/top-progress";

export const NAV_START_EVENT = "ledge:nav-start";
export const NAV_DONE_EVENT = "ledge:nav-done";

/** Tell the shell a navigation was just triggered (call on pointer-down). */
export function signalNavStart() {
  window.dispatchEvent(new CustomEvent(NAV_START_EVENT));
}

/** Tell the shell the destination page has mounted. */
export function signalNavDone() {
  window.dispatchEvent(new CustomEvent(NAV_DONE_EVENT));
}

/**
 * Global navigation progress bar. Page chunks are code-split, so on a slow
 * phone a tap could leave the screen looking frozen. This starts the top bar
 * the instant a nav link is pressed and clears it once the destination page
 * has actually mounted (the app shell reports that).
 */
export function NavProgress() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onStart = () => setActive(true);
    const onDone = () => setActive(false);
    window.addEventListener(NAV_START_EVENT, onStart as EventListener);
    window.addEventListener(NAV_DONE_EVENT, onDone as EventListener);
    return () => {
      window.removeEventListener(NAV_START_EVENT, onStart as EventListener);
      window.removeEventListener(NAV_DONE_EVENT, onDone as EventListener);
    };
  }, []);

  // Safety net: never leave the bar running (e.g. a press that never navigates).
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(false), 8000);
    return () => window.clearTimeout(t);
  }, [active]);

  return <TopProgress active={active} />;
}
