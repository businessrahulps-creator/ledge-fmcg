import { istDateKey } from "@/utils/dateKey";

/** Earliest/latest allowed delivery day (IST "YYYY-MM-DD"). */
export function deliveryDateBounds(order: { dispatchDate?: string | null; date: string }, today: string) {
  const raw = order.dispatchDate || order.date;
  const min = raw.length > 10 ? istDateKey(new Date(raw)) : raw.slice(0, 10);
  return { min, max: today };
}

/** Returns a plain message when the day is not allowed, else null. */
export function validateDeliveryDate(day: string, bounds: { min: string; max: string }): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "Pick a delivery date.";
  if (day > bounds.max) return "Delivery date can't be in the future.";
  if (day < bounds.min) return "Delivery date can't be before the order was sent.";
  return null;
}

/** IST noon of that day, so the calendar day never shifts. */
export const deliveryDayToTimestamp = (day: string) => new Date(`${day}T12:00:00+05:30`).toISOString();
