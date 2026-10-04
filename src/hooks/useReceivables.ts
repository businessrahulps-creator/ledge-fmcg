import { roundPaise } from "@/lib/money";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/services/api";
import { useCollections } from "@/hooks/useCollections";
import { useIstDay } from "@/hooks/useIstDay";
import {
  buildReceivables,
  advancesByDealer,
  agingFromReceivables,
  paymentStatusByOrder,
  type ReceivableRow,
} from "@/lib/receivables";

/**
 * Module-level memo: several components on one screen (Dashboard, My
 * Business, its cards) each call useReceivables(). The inputs are the same
 * array/map references, so compute once and hand everyone the same result.
 */
function memoLast<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  let lastArgs: A | null = null;
  let lastResult: R;
  return (...args: A) => {
    if (lastArgs && lastArgs.length === args.length && lastArgs.every((a, i) => a === args[i])) {
      return lastResult;
    }
    lastResult = fn(...args);
    lastArgs = args;
    return lastResult;
  };
}

const rowsFor = memoLast((invoices, orders, receivedByInvoice, creditedByInvoice, dealerCreditByDealer, _day: string) =>
  buildReceivables({ invoices, orders, receivedByInvoice, creditedByInvoice, dealerCreditByDealer, today: new Date() } as any) as ReceivableRow[]);
/**
 * Dealer credit = money with us that no open bill is using:
 * extra kept as dealer credit (no bill/order), advances kept on cancelled orders
 * ("keep against dues"), and bills paid + credited past their total (return after paying).
 */
const dealerCreditFor = memoLast((receipts: any[], invoices: any[], orders: any[], rbi: Map<string, number>, cbi: Map<string, number>, rbo: Map<string, number>) => {
  const m = new Map<string, number>();
  const add = (dealer: string | undefined, amt: number) => {
    if (!dealer || !(amt > 0.004)) return;
    m.set(dealer, roundPaise((m.get(dealer) || 0) + amt));
  };
  for (const r of receipts) {
    if (r.status !== "posted" || r.invoiceId || r.orderId) continue;
    add(r.distributorId, Number(r.amount || 0));
  }
  const byId = new Map(orders.map((o: any) => [o.id, o]));
  for (const o of orders) if (o.cancelledAt) add(o.distributorId, rbo.get(o.id) || 0);
  for (const inv of invoices) {
    if (inv.docType !== "gst_invoice" || inv.status === "draft") continue;
    const extra = (rbi.get(inv.id) || 0) + (cbi.get(inv.id) || 0) - Number(inv.grandTotal || 0);
    add((byId.get(inv.sourceOrderId) as any)?.distributorId, roundPaise(extra));
  }
  return m;
});
const agingFor = memoLast((rows: ReceivableRow[], distributors: any) => agingFromReceivables(rows, distributors, { settleToBalance: true }));
const advancesFor = memoLast((orders: any, invoices: any, receivedByOrder: any) =>
  advancesByDealer(orders, invoices, receivedByOrder));
const statusFor = memoLast((orders: any, invoices: any, rbi: any, rbo: any, cbi: any, rows: ReceivableRow[]) =>
  paymentStatusByOrder(orders, invoices, rbi, rbo, cbi, new Map(rows.map(r => [r.invoiceId, r.due]))));

/**
 * One place every screen reads money-owed from: unpaid GST bills, posted
 * receipts and credit notes. Never order totals, never payment flags.
 */
export function useReceivables() {
  const { companyId } = useAuth();
  const istDay = useIstDay();
  const api = useApi();
  const orders = api.orders.list();
  const invoices = api.invoices.list();
  const distributors = api.dealers.list();
  const {
    receipts, creditNotes, receivedByInvoice, receivedByOrder, creditedByInvoice, loading, reload,
  } = useCollections(companyId);

  const dealerCredit = useMemo(
    () => dealerCreditFor(receipts, invoices, orders, receivedByInvoice, creditedByInvoice, receivedByOrder),
    [receipts, invoices, orders, receivedByInvoice, creditedByInvoice, receivedByOrder],
  );
  const rows = useMemo(
    () => rowsFor(invoices, orders, receivedByInvoice, creditedByInvoice, dealerCredit, istDay),
    [invoices, orders, receivedByInvoice, creditedByInvoice, dealerCredit, istDay],
  );
  const aging = useMemo(() => agingFor(rows, distributors), [rows, distributors]);
  const advances = useMemo(
    () => advancesFor(orders, invoices, receivedByOrder),
    [orders, invoices, receivedByOrder],
  );
  /** Payment chip per order, derived from receipts — never `order.paymentStatus`. */
  const paymentStatus = useMemo(
    () => statusFor(orders, invoices, receivedByInvoice, receivedByOrder, creditedByInvoice, rows),
    [orders, invoices, receivedByInvoice, receivedByOrder, creditedByInvoice, rows],
  );

  return {
    rows, aging, advances, receipts, creditNotes, paymentStatus, dealerCredit,
    receivedByInvoice, receivedByOrder, creditedByInvoice,
    loading, reload,
  };
}
