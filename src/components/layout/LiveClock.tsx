import { useState, useEffect } from "react";

const formatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex flex-col items-end gap-0.5 whitespace-nowrap text-right">
      <span className="inline-flex items-baseline gap-1 num text-[11px] font-medium text-muted-foreground/90">
        <span>{formatter.format(now)}</span>
        <span className="text-[9px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/60">IST</span>
      </span>
      <span className="num text-[10px] font-medium leading-none text-muted-foreground/75">
        {dateFormatter.format(now)}
      </span>
    </span>
  );
}
