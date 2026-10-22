/** Cash overpay given back as change at the counter: only the amount due is kept and saved. */
export function splitCashOverpay(tendered: number, due: number): { save: number; change: number } {
  const t = Math.round(Number(tendered || 0) * 100) / 100;
  const d = Math.max(0, Math.round(Number(due || 0) * 100) / 100);
  if (t <= d) return { save: t, change: 0 };
  return { save: d, change: Math.round((t - d) * 100) / 100 };
}

/** The extra is handed back as change right away (no "to give back" entry). */
export const isCashChange = (mode: string, action: string | null | undefined) =>
  mode === "cash" && action === "refund";
