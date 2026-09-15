/**
 * Receivables — the single truth for "what a dealer still owes us".
 *
 * Rule, everywhere in the app:
 *
 *     due = GST bills  −  posted receipts  −  credit notes
 *
 * Nothing here looks at `order.total` or at `order.paymentStatus`. Those are
 * pre-GST booking figures and a coarse flag; they cannot be reconciled with
 * the canonical dealer balance (`dealer_outstanding()` / `dealer_balances`),
 * which is computed on exactly the three sources above.
 */

import type { Order } from "@/data/mock-data";
import type { Invoice } from "@/context/data-types";
import { bucketize, type AgingBucket } from "@/lib/aging";

export interface ReceivableRow {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  orderId: string | null;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  /** GST-inclusive bill total. */
  billed: number;
  /** Posted receipts applied to this bill. */
  received: number;
  /** Credit notes raised against this bill. */
  credited: number;
  /** What is still collectable, floored at zero. */
  due: number;
  ageDays: number;
  bucket: AgingBucket;
}

export interface ReceivablesInput {
  invoices: Invoice[];
  orders: Order[];
  receivedByInvoice: Map<string, number>;
  creditedByInvoice: Map<string, number>;
  today?: Date;
}

const dayDiff = (fromISO: string, today: Date): number => {
  const ref = new Date(`${fromISO.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(ref.getTime())) return 0;
  return Math.max(0, Math.floor((today.getTime() - ref.getTime()) / 86400000));
};

/** Every unpaid GST bill in the workspace, aged from its bill date. */
export function buildReceivables({
  invoices,
  orders,
  receivedByInvoice,
  creditedByInvoice,
  today = new Date(),
}: ReceivablesInput): ReceivableRow[] {
  const ordersById = new Map(orders.map(o => [o.id, o]));
  const rows: ReceivableRow[] = [];

  for (const inv of invoices) {
    if (inv.docType !== "gst_invoice") continue;
    if (inv.status === "draft") continue;
    const order = inv.sourceOrderId ? ordersById.get(inv.sourceOrderId) : undefined;
    const billed = Number(inv.grandTotal || 0);
    const received = receivedByInvoice.get(inv.id) || 0;
    const credited = creditedByInvoice.get(inv.id) || 0;
    const due = Math.max(0, Math.round((billed - received - credited) * 100) / 100);
    if (due <= 0.5) continue;
    const ageDays = dayDiff(inv.invoiceDate, today);
    rows.push({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      orderId: order?.id ?? inv.sourceOrderId ?? null,
      orderNumber: order?.orderNumber ?? "",
      distributorId: order?.distributorId ?? "",
      distributorName: order?.distributorName ?? inv.buyerName,
      billed,
      received,
      credited,
      due,
      ageDays,
      bucket: bucketize(ageDays),
    });
  }

  return rows.sort((a, b) => b.ageDays - a.ageDays);
}

export function receivablesForDealer(rows: ReceivableRow[], distributorId: string): ReceivableRow[] {
  return rows.filter(r => r.distributorId === distributorId);
}

export const sumDue = (rows: ReceivableRow[]): number =>
  Math.round(rows.reduce((s, r) => s + r.due, 0) * 100) / 100;

/** Advance money sitting on orders that have not been billed yet. */
export function advancesByDealer(
  orders: Order[],
  invoices: Invoice[],
  receivedByOrder: Map<string, number>,
): Map<string, number> {
  const billedOrderIds = new Set(
    invoices.filter(i => i.docType === "gst_invoice" && i.sourceOrderId).map(i => i.sourceOrderId as string),
  );
  const map = new Map<string, number>();
  for (const o of orders) {
    if (billedOrderIds.has(o.id)) continue;
    const held = receivedByOrder.get(o.id) || 0;
    if (held <= 0) continue;
    map.set(o.distributorId, (map.get(o.distributorId) || 0) + held);
  }
  return map;
}

/**
 * Per-dealer ageing built from unpaid bills. Same row shape the dashboard and
 * command widgets already render, so only the source changes, not the UI.
 */
export interface DealerReceivableAging {
  distributorId: string;
  distributorName: string;
  creditLimit: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  totalOutstanding: number;
  oldestAgeDays: number;
  worstBucket: AgingBucket | null;
  partialCount: number;
}

const BUCKET_FIELD: Record<AgingBucket, keyof Pick<DealerReceivableAging,
  "bucket_0_30" | "bucket_31_60" | "bucket_61_90" | "bucket_90_plus">> = {
  b0: "bucket_0_30",
  b31: "bucket_31_60",
  b61: "bucket_61_90",
  b90: "bucket_90_plus",
};

export function agingFromReceivables(
  rows: ReceivableRow[],
  distributors: Array<{ id: string; name: string; creditLimit?: number }>,
): DealerReceivableAging[] {
  const byDealer = new Map<string, DealerReceivableAging>();
  for (const d of distributors) {
    byDealer.set(d.id, {
      distributorId: d.id,
      distributorName: d.name,
      creditLimit: d.creditLimit || 0,
      bucket_0_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0,
      totalOutstanding: 0, oldestAgeDays: 0, worstBucket: null, partialCount: 0,
    });
  }
  for (const r of rows) {
    const agg = byDealer.get(r.distributorId);
    if (!agg) continue;
    agg[BUCKET_FIELD[r.bucket]] += r.due;
    agg.totalOutstanding += r.due;
    if (r.ageDays > agg.oldestAgeDays) agg.oldestAgeDays = r.ageDays;
    if (r.received > 0) agg.partialCount += 1;
  }
  return [...byDealer.values()]
    .filter(a => a.totalOutstanding > 0)
    .map(a => ({
      ...a,
      totalOutstanding: Math.round(a.totalOutstanding * 100) / 100,
      worstBucket: bucketize(a.oldestAgeDays),
    }));
}

/** Money actually received in a period — posted receipts only. */
export function collectedInPeriod(
  receipts: Array<{ amount: number; paidOn: string; status: string }>,
  from: Date,
  to: Date,
): number {
  const total = receipts.reduce((sum, r) => {
    if (r.status !== "posted") return sum;
    const d = new Date(`${(r.paidOn || "").slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime()) || d < from || d > to) return sum;
    return sum + (r.amount || 0);
  }, 0);
  return Math.round(total * 100) / 100;
}
