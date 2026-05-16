import { useState, useEffect } from "react";

const formatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

export function LiveClock() {
  const [time, setTime] = useState(() => formatter.format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(formatter.format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-baseline gap-1 num text-[11px] font-medium text-muted-foreground/90">
      <span>{time}</span>
      <span className="text-[9px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/60">IST</span>
    </span>
  );
}
