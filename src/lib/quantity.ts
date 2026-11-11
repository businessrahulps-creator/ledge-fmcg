/** Stock amounts are stored with up to 6 decimals. Keep JS float noise out of saved totals. */
export const roundQty = (n: number): number => Math.round((Number(n) || 0) * 1e6) / 1e6;

/** Show a stock amount with up to 3 decimals and no trailing zeros (10, 10.25). Display only. */
export const formatQty = (n: number): string =>
  (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });
