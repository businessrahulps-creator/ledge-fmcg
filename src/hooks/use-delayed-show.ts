import { useEffect, useState } from "react";

/**
 * Returns false for the first `delayMs` after mount, then true.
 * Used to suppress loaders for very fast transitions — the prefetched
 * majority — so users only see the loading moment when it's actually needed.
 */
export function useDelayedShow(delayMs = 250): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShow(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);
  return show;
}
