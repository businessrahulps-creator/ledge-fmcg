import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/services/api";
import { useCollections } from "@/hooks/useCollections";
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

const rowsFor = memoLast((invoices, orders, receivedByInvoice, creditedByInvoice) =>
  buildReceivables({ invoices, orders, receivedByInvoice, creditedByInvoice } as any) as ReceivableRow[]);
const agingFor = memoLast((rows: ReceivableRow[], distributors: any) => agingFromReceivables(rows, distributors, { settleToBalance: true }));
const advancesFor = memoLast((orders: any, invoices: any, receivedByOrder: any) =>
  advancesByDealer(orders, invoices, receivedByOrder));
const statusFor = memoLast((orders: any, invoices: any, rbi: any, rbo: any, cbi: any) =>
  paymentStatusByOrder(orders, invoices, rbi, rbo, cbi));

/**
 * One place every screen reads money-owed from: unpaid GST bills, posted
 * receipts and credit notes. Never order totals, never payment flags.
 */
export function useReceivables() {
  const { companyId } = useAuth();
  const api = useApi();
  const orders = api.orders.list();
  const invoices = api.invoices.list();
  const distributors = api.dealers.list();
  const {
    receipts, creditNotes, receivedByInvoice, receivedByOrder, creditedByInvoice, loading, reload,
  } = useCollections(companyId);

  const rows = useMemo(
    () => rowsFor(invoices, orders, receivedByInvoice, creditedByInvoice),
    [invoices, orders, receivedByInvoice, creditedByInvoice],
  );
  const aging = useMemo(() => agingFor(rows, distributors), [rows, distributors]);
  const advances = useMemo(
    () => advancesFor(orders, invoices, receivedByOrder),
    [orders, invoices, receivedByOrder],
  );
  /** Payment chip per order, derived from receipts — never `order.paymentStatus`. */
  const paymentStatus = useMemo(
    () => statusFor(orders, invoices, receivedByInvoice, receivedByOrder, creditedByInvoice),
    [orders, invoices, receivedByInvoice, receivedByOrder, creditedByInvoice],
  );

  return {
    rows, aging, advances, receipts, creditNotes, paymentStatus,
    receivedByInvoice, receivedByOrder, creditedByInvoice,
    loading, reload,
  };
}
