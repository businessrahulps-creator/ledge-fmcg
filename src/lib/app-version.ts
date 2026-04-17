declare const __APP_VERSION__: string;

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

function tsToDate(ts: string): Date | null {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a build timestamp into a friendly version label like
 * "Ledge v26.4.17.1351" → year.month.day.HHMM in IST.
 */
export function formatPrettyVersion(ts: string): string {
  const d = tsToDate(ts);
  if (!d) return `Ledge ${ts}`;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const yy = get("year");
  const m = get("month");
  const day = get("day");
  const hh = get("hour").padStart(2, "0");
  const mm = get("minute").padStart(2, "0");
  return `Ledge v${yy}.${m}.${day}.${hh}${mm}`;
}

/** "Ledge v26.4.17.1351" */
export const PRETTY_VERSION: string = formatPrettyVersion(APP_VERSION);

/** Just the "v26.4.17.1351" portion, for tight UI like a collapsed sidebar. */
export const SHORT_VERSION: string = PRETTY_VERSION.startsWith("Ledge ")
  ? PRETTY_VERSION.slice("Ledge ".length)
  : PRETTY_VERSION;
