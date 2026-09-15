/**
 * Calendar-day keys ("YYYY-MM-DD") built from the device's own calendar.
 *
 * Never use `date.toISOString().slice(0, 10)` for this: that converts to UTC
 * first, so a date built locally can slip back a day and a period can quietly
 * drop its last day.
 */
export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Today, in the device's calendar. */
export const todayKey = (): string => toDateKey(new Date());

/** Shift a "YYYY-MM-DD" key by whole days, staying on the calendar. */
export const addDaysToKey = (key: string, days: number): string => {
  const [y, m, d] = key.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
};
