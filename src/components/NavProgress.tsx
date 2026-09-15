import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TopProgress } from "@/components/ui/top-progress";

export const NAV_START_EVENT = "ledge:nav-start";

/** Tell the shell a navigation was just triggered (call on pointer-down). */
export function signalNavStart() {
  window.dispatchEvent(new CustomEvent(NAV_START_EVENT));
}

/**
 * Global navigation progress bar. Page chunks are code-split, so on a slow
 * phone a tap could leave the screen looking frozen. This starts the top bar
 * the instant a nav link is pressed and clears it once the new page paints.
 */
export function NavProgress() {
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onStart = () => setActive(true);
    window.addEventListener(NAV_START_EVENT, onStart as EventListener);
    return () => window.removeEventListener(NAV_START_EVENT, onStart as EventListener);
  }, []);

  // New route rendered — let it paint, then finish the bar.
  useEffect(() => {
    if (!active) return;
    const raf = requestAnimationFrame(() => setActive(false));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Safety net: never leave the bar running (e.g. press without navigating).
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(false), 8000);
    return () => window.clearTimeout(t);
  }, [active]);

  return <TopProgress active={active} />;
}
