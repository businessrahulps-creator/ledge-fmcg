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

  const rows: ReceivableRow[] = useMemo(
    () => buildReceivables({ invoices, orders, receivedByInvoice, creditedByInvoice }),
    [invoices, orders, receivedByInvoice, creditedByInvoice],
  );

  const aging = useMemo(() => agingFromReceivables(rows, distributors), [rows, distributors]);

  const advances = useMemo(
    () => advancesByDealer(orders, invoices, receivedByOrder),
    [orders, invoices, receivedByOrder],
  );

  /** Payment chip per order, derived from receipts — never `order.paymentStatus`. */
  const paymentStatus = useMemo(
    () => paymentStatusByOrder(orders, invoices, receivedByInvoice, receivedByOrder, creditedByInvoice),
    [orders, invoices, receivedByInvoice, receivedByOrder, creditedByInvoice],
  );

  return {
    rows, aging, advances, receipts, creditNotes, paymentStatus,
    receivedByInvoice, receivedByOrder, creditedByInvoice,
    loading, reload,
  };
}
