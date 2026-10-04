import { roundPaise } from "@/lib/money";
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
  /** Dealer credit (extra money kept on the dealer, not tied to a bill), used up oldest bill first. */
  dealerCreditByDealer?: Map<string, number>;
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
  dealerCreditByDealer,
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
    const due = Math.max(0, roundPaise(billed - received - credited));
    // Keep bills with even a few paise left — they are genuinely short paid.
    if (due <= 0) continue;
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

  // Dealer credit pays the oldest bills first, so a bill isn't shown overdue
  // when the dealer already has money sitting with us.
  if (dealerCreditByDealer && dealerCreditByDealer.size) {
    const pool = new Map(dealerCreditByDealer);
    const oldestFirst = [...rows].sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate) || a.invoiceNumber.localeCompare(b.invoiceNumber));
    for (const r of oldestFirst) {
      const left = pool.get(r.distributorId) || 0;
      if (left <= 0) continue;
      const use = Math.min(left, r.due);
      r.received = roundPaise(r.received + use);
      r.due = roundPaise(r.due - use);
      pool.set(r.distributorId, roundPaise(left - use));
    }
    return rows.filter(r => r.due > 0).sort((a, b) => b.ageDays - a.ageDays);
  }

  return rows.sort((a, b) => b.ageDays - a.ageDays);
}

export function receivablesForDealer(rows: ReceivableRow[], distributorId: string): ReceivableRow[] {
  return rows.filter(r => r.distributorId === distributorId);
}

export const sumDue = (rows: ReceivableRow[]): number =>
  roundPaise(rows.reduce((s, r) => s + r.due, 0));

/** Advance money sitting on orders that have not been billed yet. */
export function advancesByDealer(
  orders: Order[],
  invoices: Invoice[],
  receivedByOrder: Map<string, number>,
): Map<string, number> {
  const billedOrderIds = new Set(
    invoices.filter(i => i.docType === "gst_invoice" && i.status !== "draft" && i.sourceOrderId).map(i => i.sourceOrderId as string),
  );
  const map = new Map<string, number>();
  for (const o of orders) {
    // Money kept on a cancelled order is dealer credit (used against old bills), not an advance.
    if (billedOrderIds.has(o.id) || o.cancelledAt) continue;
    const held = receivedByOrder.get(o.id) || 0;
    if (held <= 0) continue;
    map.set(o.distributorId, (map.get(o.distributorId) || 0) + held);
  }
  return map;
}

export type DerivedPaymentStatus = "paid" | "partial" | "pending";

/**
 * What an order's payment chip should say, derived from receipts only.
 *
 *   billed order   → paid when bill − receipts − credit notes is settled,
 *                    partial when some money came in, else pending.
 *   unbilled order → partial when an advance is held, else pending.
 *                    It can never be "paid": there is no bill to settle.
 *
 * `orders.payment_status` is a legacy flag and is deliberately ignored.
 */
export function paymentStatusByOrder(
  orders: Order[],
  invoices: Invoice[],
  receivedByInvoice: Map<string, number>,
  receivedByOrder: Map<string, number>,
  creditedByInvoice: Map<string, number>,
  /** Still-due per open bill after dealer credit (from buildReceivables). When given, it decides "paid". */
  dueAfterCreditByInvoice?: Map<string, number>,
): Map<string, DerivedPaymentStatus> {
  const invByOrder = new Map<string, Invoice>();
  for (const inv of invoices) {
    if (inv.docType !== "gst_invoice" || inv.status === "draft" || !inv.sourceOrderId) continue;
    invByOrder.set(inv.sourceOrderId, inv);
  }

  const map = new Map<string, DerivedPaymentStatus>();
  for (const o of orders) {
    const inv = invByOrder.get(o.id);
    if (inv) {
      const billed = Number(inv.grandTotal || 0);
      const received = receivedByInvoice.get(inv.id) || 0;
      const credited = creditedByInvoice.get(inv.id) || 0;
      const raw = roundPaise(billed - received - credited);
      const due = dueAfterCreditByInvoice ? (dueAfterCreditByInvoice.get(inv.id) ?? 0) : raw;
      const someMoney = received > 0 || due < raw;
      map.set(o.id, due <= 0 ? "paid" : someMoney ? "partial" : "pending");
    } else {
      map.set(o.id, (receivedByOrder.get(o.id) || 0) > 0 ? "partial" : "pending");
    }
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
  distributors: Array<{ id: string; name: string; creditLimit?: number; outstandingAmount?: number }>,
  /** Pass true only when `rows` is every open bill (not a filtered view). */
  opts: { settleToBalance?: boolean } = {},
): DealerReceivableAging[] {
  const canonical = new Map(distributors.map(d => [d.id, d.outstandingAmount]));
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
  // Work per bill so "oldest" always names a bill that is still unpaid.
  const billsByDealer = new Map<string, Array<{ due: number; ageDays: number; partial: boolean }>>();
  for (const r of rows) {
    if (!byDealer.has(r.distributorId)) continue;
    const list = billsByDealer.get(r.distributorId) ?? [];
    list.push({ due: r.due, ageDays: r.ageDays, partial: r.received > 0 });
    billsByDealer.set(r.distributorId, list);
  }
  for (const [dealerId, bills] of billsByDealer) {
    const a = byDealer.get(dealerId)!;
    // Payments not linked to a bill and overpaid bills still reduce what the
    // dealer owes. Settle that spare credit against the oldest bills first so
    // the total equals the canonical dealer balance.
    const bal = canonical.get(dealerId);
    if (opts.settleToBalance && typeof bal === "number" && Number.isFinite(bal)) {
      let spare = bills.reduce((s, b) => s + b.due, 0) - Math.max(0, bal);
      bills.sort((x, y) => y.ageDays - x.ageDays);
      for (const b of bills) {
        if (spare <= 0.005) break;
        const take = Math.min(b.due, spare);
        b.due = roundPaise(b.due - take);
        b.partial = true;
        spare -= take;
      }
    }
    for (const b of bills) {
      if (b.due <= 0.005) continue;
      a[BUCKET_FIELD[bucketize(b.ageDays)]] += b.due;
      a.totalOutstanding += b.due;
      if (b.ageDays > a.oldestAgeDays) a.oldestAgeDays = b.ageDays;
      if (b.partial) a.partialCount += 1;
    }
  }
  return [...byDealer.values()]
    .filter(a => a.totalOutstanding > 0.005)
    .map(a => ({
      ...a,
      totalOutstanding: roundPaise(a.totalOutstanding),
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
    // Money that reached us counts, even if some must be given back (that leaves as its own money-out).
    if (r.status === "voided") return sum;
    const d = new Date(`${(r.paidOn || "").slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime()) || d < from || d > to) return sum;
    return sum + (r.amount || 0);
  }, 0);
  return roundPaise(total);
}
