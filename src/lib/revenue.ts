import type { Order } from "@/data/mock-data";

/** Net revenue value for a single order (after scheme discounts). */
export const netTotal = (o: Order): number => Math.max(0, (o.total || 0) - (o.schemeSavings || 0));

export const isDelivered = (o: Order): boolean => o.deliveryStatus === "delivered";
export const isBooked = (o: Order): boolean =>
  o.deliveryStatus === "pending" || o.deliveryStatus === "dispatched";
/** "returned" or any future cancelled state. */
export const isExcluded = (o: Order): boolean => !isDelivered(o) && !isBooked(o);

export const deliveredRevenue = (orders: Order[]): number =>
  orders.reduce((s, o) => (isDelivered(o) ? s + netTotal(o) : s), 0);

export const bookedRevenue = (orders: Order[]): number =>
  orders.reduce((s, o) => (isBooked(o) ? s + netTotal(o) : s), 0);

/** Date key for time-series. Delivered orders use delivered_at; pipeline uses order date. */
export const revenueDate = (o: Order): string =>
  (isDelivered(o) && o.deliveredAt) ? o.deliveredAt.slice(0, 10) : o.date;

export type RevenueMode = "delivered" | "booked";

export const orderInScope = (o: Order, mode: RevenueMode): boolean =>
  mode === "delivered" ? isDelivered(o) : (isDelivered(o) || isBooked(o));

export const orderDateForMode = (o: Order, mode: RevenueMode): string =>
  mode === "delivered" ? ((o.deliveredAt || o.dispatchDate || o.date).slice(0, 10)) : o.date;
