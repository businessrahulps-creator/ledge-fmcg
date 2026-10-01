import { useEffect, useState } from "react";
import { todayKey } from "@/utils/dateKey";

/** Today's date (Indian time) that updates itself when the day changes. */
export function useBusinessDay(): string {
  const [day, setDay] = useState(todayKey);
  useEffect(() => {
    const id = window.setInterval(() => {
      const k = todayKey();
      setDay(prev => (prev === k ? prev : k));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return day;
}
