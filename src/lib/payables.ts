/**
 * Buying maths — pure and mirrored by the database. The server is the source
 * of truth (it recalculates everything on save); these power previews/lists.
 */
export const GST_RATES = [0, 5, 12, 18, 28] as const;
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface DraftLine { quantity: number; rate: number; gstRate: number }
export interface LineCalc { taxable: number; cgst: number; sgst: number; igst: number; total: number }

/** Same rounding as record_purchase_bill_atomic: per line, CGST = SGST = taxable × rate / 200. */
export function calcLine(l: DraftLine, inter: boolean): LineCalc {
  const taxable = r2(l.quantity * r2(l.rate));
  if (inter) { const igst = r2(taxable * l.gstRate / 100); return { taxable, cgst: 0, sgst: 0, igst, total: r2(taxable + igst) }; }
  const half = r2(taxable * l.gstRate / 200);
  return { taxable, cgst: half, sgst: half, igst: 0, total: r2(taxable + 2 * half) };
}

export function calcBill(lines: DraftLine[], inter: boolean) {
  const t = { subtotal: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, total: 0 };
  for (const l of lines) {
    const c = calcLine(l, inter);
    t.subtotal += c.taxable; t.cgst += c.cgst; t.sgst += c.sgst; t.igst += c.igst;
  }
  t.subtotal = r2(t.subtotal); t.cgst = r2(t.cgst); t.sgst = r2(t.sgst); t.igst = r2(t.igst);
  t.tax = r2(t.cgst + t.sgst + t.igst); t.total = r2(t.subtotal + t.tax);
  return t;
}

/** Inter-state when both state codes are known and differ (same rule as the server). */
export const isInterState = (supplierState: string, companyState: string) =>
  !!companyState && (supplierState || companyState) !== companyState;

export interface SupplierLite { id: string; name: string; openingBalance: number }
export interface BillLite { id: string; supplierId: string; grandTotal: number; status: string; billDate: string }
export interface ReturnLite { billId: string; supplierId: string; grandTotal: number }
export interface PaymentLite { supplierId: string; amount: number; status: string }

/** Money you owe a supplier = opening + posted bills − returns on posted bills − posted payments. */
export function supplierBalances(suppliers: SupplierLite[], bills: BillLite[], returns: ReturnLite[], payments: PaymentLite[]) {
  const posted = new Set(bills.filter(b => b.status === "posted").map(b => b.id));
  const m = new Map<string, number>(suppliers.map(s => [s.id, s.openingBalance || 0]));
  const add = (id: string, n: number) => m.set(id, (m.get(id) || 0) + n);
  for (const b of bills) if (b.status === "posted") add(b.supplierId, b.grandTotal);
  for (const r of returns) if (posted.has(r.billId)) add(r.supplierId, -r.grandTotal);
  for (const p of payments) if (p.status === "posted") add(p.supplierId, -p.amount);
  for (const [k, v] of m) m.set(k, r2(v));
  return m;
}

/**
 * Bill-by-bill paid status for display: payments settle the oldest dues first
 * (opening amount, then bills by date). Totals never depend on this.
 */
export function billPaidStatus(supplier: SupplierLite, bills: BillLite[], returns: ReturnLite[], payments: PaymentLite[]) {
  let pool = payments.filter(p => p.supplierId === supplier.id && p.status === "posted").reduce((n, p) => n + p.amount, 0);
  pool = Math.max(0, pool - (supplier.openingBalance || 0));
  const returned = new Map<string, number>();
  for (const r of returns) returned.set(r.billId, (returned.get(r.billId) || 0) + r.grandTotal);
  const out = new Map<string, { due: number; status: "paid" | "partial" | "unpaid" }>();
  const mine = bills.filter(b => b.supplierId === supplier.id && b.status === "posted").sort((a, b) => a.billDate.localeCompare(b.billDate));
  for (const b of mine) {
    const net = r2(b.grandTotal - (returned.get(b.id) || 0));
    const used = Math.min(pool, net); pool = r2(pool - used);
    const due = r2(net - used);
    out.set(b.id, { due, status: due <= 0 ? "paid" : used > 0 ? "partial" : "unpaid" });
  }
  return out;
}
