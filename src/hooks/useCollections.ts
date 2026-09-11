import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

export type ReceiptRow = {
  id: string;
  amount: number;
  mode: string;
  paidOn: string;
  reference: string;
  note: string;
  status: "posted" | "voided";
  voidReason: string;
  invoiceId: string | null;
  orderId: string | null;
  distributorId: string;
};

/**
 * Every receipt in the workspace, plus how much has landed against each bill
 * and each order. One source for the money figures shown across Billing.
 */
export function useCollections(companyId?: string | null) {
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) { setReceipts([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("invoice_payments")
      .select("id, amount, mode, paid_on, reference, note, status, void_reason, invoice_id, order_id, distributor_id")
      .eq("company_id", companyId)
      .order("paid_on", { ascending: false });
    setLoading(false);
    if (error) {
      handleSupabaseError(error, { source: "collections:list", title: "Couldn't load payments" });
      return;
    }
    setReceipts((data || []).map(r => ({
      id: r.id,
      amount: Number(r.amount || 0),
      mode: r.mode as string,
      paidOn: r.paid_on,
      reference: r.reference || "",
      note: r.note || "",
      status: r.status as "posted" | "voided",
      voidReason: r.void_reason || "",
      invoiceId: r.invoice_id,
      orderId: r.order_id,
      distributorId: r.distributor_id,
    })));
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const receivedByInvoice = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of receipts) {
      if (r.status !== "posted" || !r.invoiceId) continue;
      map.set(r.invoiceId, (map.get(r.invoiceId) || 0) + r.amount);
    }
    return map;
  }, [receipts]);

  const receivedByOrder = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of receipts) {
      if (r.status !== "posted" || !r.orderId) continue;
      map.set(r.orderId, (map.get(r.orderId) || 0) + r.amount);
    }
    return map;
  }, [receipts]);

  return { receipts, receivedByInvoice, receivedByOrder, loading, reload: load };
}

/** Whole days between the bill date and today, floored at 0. */
export function daysOld(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}
