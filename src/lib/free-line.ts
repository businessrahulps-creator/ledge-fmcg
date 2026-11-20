/** A bill/order line given away by an offer: has quantity but ₹0 price and ₹0 amount. */
export function isFreeLine(l: { quantity: number; unitPrice: number; amount?: number | null; isFree?: boolean }): boolean {
  if (l.isFree) return true;
  return (l.quantity || 0) > 0 && Number(l.unitPrice || 0) === 0 && Number(l.amount ?? 0) === 0;
}
export const FREE_SUFFIX = " (Free)";
export function freeName(name: string, free: boolean): string {
  return free && !name.endsWith(FREE_SUFFIX) ? name + FREE_SUFFIX : name;
}
