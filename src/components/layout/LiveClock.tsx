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
    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground sm:text-xs">
      {time}
      <span className="text-[8px] opacity-60 sm:text-[10px]">IST</span>
    </span>
  );
}
