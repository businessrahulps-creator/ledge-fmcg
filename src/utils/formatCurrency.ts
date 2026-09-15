/**
 * Canonical Indian Rupee formatting helpers.
 *
 * All currency rendering across the app funnels through these helpers so that
 * grouping always follows the Indian numbering system
 * (lakh / crore — e.g. ₹12,45,678 not ₹1,245,678).
 */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const plain = new Intl.NumberFormat("en-IN");

export function formatCurrency(amount: number): string {
  return inr.format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(num: number): string {
  return plain.format(Number.isFinite(num) ? num : 0);
}

/**
 * Compact INR for tight spaces (KPI tiles, chart axes).
 * Examples: ₹4.8L, ₹1.2Cr, ₹85K
 */
export function formatCurrencyCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_00_00_000) {
    return `${sign}₹${(abs / 1_00_00_000).toFixed(abs >= 10_00_00_000 ? 0 : 1)}Cr`;
  }
  if (abs >= 1_00_000) {
    return `${sign}₹${(abs / 1_00_000).toFixed(abs >= 10_00_000 ? 0 : 1)}L`;
  }
  if (abs >= 1_000) {
    return `${sign}₹${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  }
  return `${sign}₹${Math.round(abs)}`;
}
