/**
 * Sales Team page money rules: rupee figures only for people with `see_money`.
 */
export interface SalesTeamRow {
  name: string;
  phone: string;
  email: string;
  region: string;
  totalOrders: number;
  totalValue: number;
}

export function salesTeamExport(
  rows: SalesTeamRow[],
  canSeeMoney: boolean,
  formatMoney: (n: number) => string,
): { headers: string[]; rows: string[][] } {
  const headers = ["Name", "Phone", "Email", "Region", "Total Orders"];
  if (canSeeMoney) headers.push("Total Value");
  return {
    headers,
    rows: rows.map((s) => {
      const r = [s.name, s.phone, s.email, s.region, String(s.totalOrders)];
      if (canSeeMoney) r.push(formatMoney(s.totalValue));
      return r;
    }),
  };
}

/** Top performer: by revenue when money is visible, otherwise by order count (no revenue ranking leak). */
export function topPerformer<T extends { totalOrders: number; totalValue: number }>(
  items: T[],
  canSeeMoney: boolean,
): T | null {
  if (items.length === 0) return null;
  const key = (x: T) => (canSeeMoney ? x.totalValue || 0 : x.totalOrders || 0);
  return items.reduce((a, b) => (key(b) > key(a) ? b : a));
}
