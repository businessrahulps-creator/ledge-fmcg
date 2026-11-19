/**
 * Who is the signed-in person on the sales team?
 * Only an explicit login link (salespersons.user_id) counts.
 * Never guess from email or name — a wrong guess would give the wrong person credit.
 */
export interface LinkableSalesperson { id: string; userId?: string | null }

export function resolveCurrentSalesperson<T extends LinkableSalesperson>(
  userId: string | null | undefined,
  roster: readonly T[],
): T | null {
  if (!userId) return null;
  return roster.find((s) => !!s.userId && s.userId === userId) ?? null;
}

const STAMP = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true,
});

/** "19 Nov 2026, 12:30 PM" in India time — the actual moment the visit was noted. */
export function formatVisitStamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(STAMP.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} ${String(p.dayPeriod).toUpperCase()}`;
}

/** Plain labels for dealer attribution; empty values never invent credit. */
export function acquiredByLabel(name: string | null | undefined, date: string | null | undefined, fmt: (d: string) => string): string {
  if (!name) return "Direct onboarding";
  return date ? `Acquired by ${name} on ${fmt(date)}` : `Acquired by ${name}`;
}
export function assignedLabel(name: string | null | undefined): string {
  return name ? `Looked after by ${name}` : "Unassigned";
}
