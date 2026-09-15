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

export type CreditNoteRow = {
  id: string;
  number: string;
  noteDate: string;
  grandTotal: number;
  reason: string;
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
  const [creditNotes, setCreditNotes] = useState<CreditNoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) { setReceipts([]); setCreditNotes([]); setLoading(false); return; }
    setLoading(true);
    // Paged: past 1,000 receipts a plain select silently stops returning rows,
    // which would quietly hide money from the collections figures.
    const [paymentsRes, notesRes] = await Promise.all([
      fetchAllPages(() =>
        supabase
          .from("invoice_payments")
          .select("id, amount, mode, paid_on, reference, note, status, void_reason, invoice_id, order_id, distributor_id")
          .eq("company_id", companyId)
          .order("paid_on", { ascending: false })),
      fetchAllPages(() =>
        supabase
          .from("credit_notes")
          .select("id, credit_note_number, note_date, grand_total, reason, invoice_id, order_id, distributor_id")
          .eq("company_id", companyId)
          .order("note_date", { ascending: false })),
    ]);
    setLoading(false);
    if (paymentsRes.error) {
      handleSupabaseError(paymentsRes.error, { source: "collections:list", title: "Couldn't load payments" });
    } else {
      setReceipts((paymentsRes.data || []).map(r => ({
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
    }
    if (notesRes.error) {
      handleSupabaseError(notesRes.error, { source: "collections:credit-notes", title: "Couldn't load credit notes" });
    } else {
      setCreditNotes((notesRes.data || []).map(n => ({
        id: n.id,
        number: n.credit_note_number,
        noteDate: n.note_date,
        grandTotal: Number(n.grand_total || 0),
        reason: n.reason || "",
        invoiceId: n.invoice_id,
        orderId: n.order_id,
        distributorId: n.distributor_id,
      })));
    }
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

  /** Credit notes reduce what a bill can still collect. */
  const creditedByInvoice = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of creditNotes) {
      if (!n.invoiceId) continue;
      map.set(n.invoiceId, (map.get(n.invoiceId) || 0) + n.grandTotal);
    }
    return map;
  }, [creditNotes]);

  return {
    receipts,
    creditNotes,
    receivedByInvoice,
    receivedByOrder,
    creditedByInvoice,
    loading,
    reload: load,
  };
}


/** Whole days between the bill date and today, floored at 0. */
export function daysOld(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}
