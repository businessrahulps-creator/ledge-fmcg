/** What is still to collect on one bill/order: total − returns credited − money received. Never below zero. */
export function orderBalanceDue(docTotal: number, credited: number, received: number): number {
  return Math.max(0, Math.round((docTotal - (credited || 0) - (received || 0)) * 100) / 100);
}
