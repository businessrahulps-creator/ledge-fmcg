/**
 * One rounding rule for every rupee figure, matching the database's
 * numeric round(x, 2): half a paisa rounds away from zero.
 * Plain Math.round(x * 100) / 100 gets 1.005 wrong (gives 1.00) because of
 * how computers store decimals; the tiny nudge fixes that.
 */
export function roundPaise(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const r = Math.sign(n) * Math.round(Math.abs(n) * 100 + 1e-7) / 100;
  return r === 0 ? 0 : r; // never -0
}
