/** One rule for showing cancelled orders: they keep delivery_status 'pending' in the database. */
export type DisplayDeliveryStatus = "pending" | "dispatched" | "delivered" | "cancelled";

export const isOrderCancelled = (o: { cancelledAt?: string | null }): boolean => !!o.cancelledAt;

export function displayDeliveryStatus(o: { cancelledAt?: string | null; deliveryStatus: string }): DisplayDeliveryStatus {
  if (o.cancelledAt) return "cancelled";
  return o.deliveryStatus as DisplayDeliveryStatus;
}

/** Orders still waiting to be sent — cancelled ones are not waiting for anything. */
export const isAwaitingDispatch = (o: { cancelledAt?: string | null; deliveryStatus: string }): boolean =>
  displayDeliveryStatus(o) === "pending";
