import { useState, useEffect } from "react";

/**
 * Page-loading flag.
 * - When `dataLoading` is provided, mirrors it directly (no synthetic delay).
 * - When omitted, falls back to a one-shot timer (legacy behaviour).
 */
export function usePageLoading(dataLoading?: boolean, delay = 0): boolean {
  const [timerDone, setTimerDone] = useState(delay === 0);

  useEffect(() => {
    if (dataLoading !== undefined) return; // mirror mode → no timer
    if (delay === 0) return;
    const t = setTimeout(() => setTimerDone(true), delay);
    return () => clearTimeout(t);
  }, [dataLoading, delay]);

  return dataLoading !== undefined ? dataLoading : !timerDone;
}
