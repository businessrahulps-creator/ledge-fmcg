import { useEffect, useState } from "react";

interface SmartTimeProps {
  date: Date | string | number;
  /** Render as `<time>` with ISO datetime attribute. Default true. */
  semantic?: boolean;
  className?: string;
}

function toDate(d: Date | string | number): Date {
  if (d instanceof Date) return d;
  if (typeof d === "number") return new Date(d);
  // Treat bare YYYY-MM-DD as local midnight to avoid TZ surprises.
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T00:00:00`);
  return new Date(d);
}

function format(date: Date, now: Date): string {
  const diff = now.getTime() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 0) return "just now";
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return "Yesterday";

  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Universal "smart" timestamp: just now → N min ago → today HH:MM → Yesterday
 * → Tue 12 May → 12 May 2024. Updates itself once a minute while mounted.
 */
export function SmartTime({ date, semantic = true, className }: SmartTimeProps) {
  const d = toDate(date);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const label = format(d, new Date());
  if (!semantic) return <span className={className}>{label}</span>;
  return (
    <time className={className} dateTime={d.toISOString()} title={d.toLocaleString("en-IN")}>
      {label}
    </time>
  );
}
