import { useState, useEffect } from "react";

/**
 * Page-loading flag.
 * - When `dataLoading` is provided, mirrors it directly (no synthetic delay).
 * - When omitted, falls back to a one-shot timer (legacy behaviour).
 */
export function usePageLoading(dataLoading?: boolean, delay = 0): boolean {
  if (dataLoading !== undefined) {
    return dataLoading;
  }

  // Legacy timer-only mode (kept for callers that don't pass dataLoading).
  const [timerDone, setTimerDone] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const timer = setTimeout(() => setTimerDone(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return !timerDone;
}
