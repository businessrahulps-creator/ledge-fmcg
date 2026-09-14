/**
 * Credit exposure maths.
 *
 * A dealer's outstanding figure is always GST-inclusive and already net of credit
 * notes (it comes from the canonical `dealer_balances` view). An order that has not
 * been billed yet is held in pre-GST rupees. Adding one to the other understates the
 * exposure, so the app would wave an order through that the server later refuses at
 * billing time. Everything that projects a future balance must gross the order up to
 * its bill-equivalent value first — the same basis the server uses.
 */

export interface ExposureLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

/** Rupees this order will be billed for once GST is added, after scheme savings. */
export function billEquivalentTotal(
  lines: ExposureLine[],
  gstRateFor: (productId: string) => number,
  schemeSavings = 0,
): number {
  const valid = lines.filter(l => l.productId && (l.quantity ?? 0) > 0);
  const gross = valid.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  if (gross <= 0) return 0;
  // Savings shave the taxable value proportionally across the lines.
  const keepRatio = Math.max(0, (gross - Math.max(0, schemeSavings))) / gross;
  const total = valid.reduce((s, l) => {
    const taxable = l.quantity * l.unitPrice * keepRatio;
    const rate = gstRateFor(l.productId);
    return s + taxable * (1 + (Number.isFinite(rate) ? rate : 0) / 100);
  }, 0);
  return Math.round(total * 100) / 100;
}

/** What the dealer would owe once this order is billed. */
export function projectedExposure(
  currentOutstanding: number,
  billEquivalent: number,
  alreadyCountedBillEquivalent = 0,
): number {
  const projected = (currentOutstanding || 0) - alreadyCountedBillEquivalent + billEquivalent;
  return Math.round(projected * 100) / 100;
}
