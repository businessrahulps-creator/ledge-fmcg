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

/**
 * Order form prefill: when a dealer is chosen, suggest the dealer's
 * assigned sales person. Never overwrite a choice the user made by hand.
 * `lastAuto` is the value this rule filled last time (null if none).
 * Returns the value the box should now hold.
 */
export function prefillOrderSalesperson(
  current: string,
  lastAuto: string | null,
  assignedId: string | null | undefined,
  rosterIds: string[],
): string {
  const userPicked = current !== "" && current !== lastAuto;
  if (userPicked) return current;
  if (assignedId && rosterIds.includes(assignedId)) return assignedId;
  // dealer has no (valid) assignee: clear only what we filled ourselves
  return current === lastAuto ? "" : current;
}

export interface CoverageRow { id: string; name: string; shopsAcquired: number; prospectsFound: number; dealersAssigned: number }
/**
 * Coverage & acquisition counts per sales person. Entity counts only —
 * never revenue (revenue stays on orders.salesperson_id).
 */
export function salespersonCoverage(
  team: { id: string; name: string }[],
  dealers: { acquiredBySalespersonId?: string | null; assignedSalespersonId?: string | null }[],
  prospects: { foundBySalespersonId?: string | null }[],
): CoverageRow[] {
  const inc = (m: Map<string, number>, k?: string | null) => { if (k) m.set(k, (m.get(k) ?? 0) + 1); };
  const acq = new Map<string, number>(), asg = new Map<string, number>(), fnd = new Map<string, number>();
  dealers.forEach(d => { inc(acq, d.acquiredBySalespersonId); inc(asg, d.assignedSalespersonId); });
  prospects.forEach(p => inc(fnd, p.foundBySalespersonId));
  return team.map(s => ({ id: s.id, name: s.name, shopsAcquired: acq.get(s.id) ?? 0, prospectsFound: fnd.get(s.id) ?? 0, dealersAssigned: asg.get(s.id) ?? 0 }));
}
