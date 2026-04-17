/**
 * Canonical Indian Rupee formatting helpers.
 *
 * All currency rendering across the app should funnel through these helpers
 * so that grouping always follows the Indian numbering system
 * (lakh / crore — e.g. ₹12,45,678 not ₹1,245,678).
 *
 * `formatCurrency` from `@/data/mock-data` already uses `Intl.NumberFormat("en-IN")`
 * and is re-exported here as the canonical name for new code.
 */
export { formatCurrency, formatNumber } from "@/data/mock-data";

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
