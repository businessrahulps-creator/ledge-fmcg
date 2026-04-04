import { useState, useEffect } from "react";

export function usePageLoading(delay = 300): boolean {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return isLoading;
}
