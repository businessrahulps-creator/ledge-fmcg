import { useEffect, useState } from "react";
import { istDateKey } from "@/utils/dateKey";

/** Today's India date ("YYYY-MM-DD"); changes on its own at IST midnight. */
export function useIstDay(): string {
  const [day, setDay] = useState(() => istDateKey(new Date()));
  useEffect(() => {
    // Check every minute: cheap, and survives the computer sleeping past midnight.
    const id = window.setInterval(() => {
      const now = istDateKey(new Date());
      setDay(prev => (prev === now ? prev : now));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return day;
}
