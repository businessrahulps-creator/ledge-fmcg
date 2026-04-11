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
    <span className="hidden items-center gap-1 font-mono text-xs text-muted-foreground sm:inline-flex">
      {time}
      <span className="text-[10px] opacity-60">IST</span>
    </span>
  );
}
