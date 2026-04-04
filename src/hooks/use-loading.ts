import { useState, useEffect } from "react";

export function usePageLoading(dataLoading?: boolean, delay = 300): boolean {
  const [timerDone, setTimerDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  // Show loading if either the timer hasn't finished OR data is still loading
  if (dataLoading !== undefined) {
    return !timerDone || dataLoading;
  }
  return !timerDone;
}
