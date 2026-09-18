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

const PAGE = 1000;

/** Reads every page of a query so nothing is silently cut off at the 1,000-row cap. */
async function fetchAllPages(build: () => any): Promise<{ data: any[]; error: any }> {
  const rows: any[] = [];
  for (let page = 0; page < 200; page++) {
    const { data, error } = await build().range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) return { data: rows, error };
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return { data: rows, error: null };
}

type CollectionsSnapshot = {
  receipts: ReceiptRow[];
  creditNotes: CreditNoteRow[];
  loading: boolean;
};

const EMPTY: CollectionsSnapshot = { receipts: [], creditNotes: [], loading: false };

/**
 * One shared load per workspace. Several parts of a page read collections at
 * once (Insights alone mounts it four times); without this they would each run
 * the same two paginated queries.
 */
type Store = {
  snapshot: CollectionsSnapshot;
  listeners: Set<() => void>;
  inflight: Promise<void> | null;
  loaded: boolean;
};

const stores = new Map<string, Store>();

function getStore(companyId: string): Store {
  let s = stores.get(companyId);
  if (!s) {
    s = { snapshot: { receipts: [], creditNotes: [], loading: true }, listeners: new Set(), inflight: null, loaded: false };
    stores.set(companyId, s);
  }
  return s;
}

function publish(store: Store, next: Partial<CollectionsSnapshot>) {
  store.snapshot = { ...store.snapshot, ...next };
  store.listeners.forEach((l) => l());
}

async function loadCollections(companyId: string, force: boolean): Promise<void> {
  const store = getStore(companyId);
  if (store.inflight) return store.inflight;
  if (store.loaded && !force) return;
  publish(store, { loading: true });
  const run = (async () => {
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
    const next: Partial<CollectionsSnapshot> = { loading: false };
    if (paymentsRes.error) {
      handleSupabaseError(paymentsRes.error, { source: "collections:list", title: "Couldn't load payments" });
    } else {
      next.receipts = (paymentsRes.data || []).map(r => ({
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
      }));
    }
    if (notesRes.error) {
      handleSupabaseError(notesRes.error, { source: "collections:credit-notes", title: "Couldn't load credit notes" });
    } else {
      next.creditNotes = (notesRes.data || []).map(n => ({
        id: n.id,
        number: n.credit_note_number,
        noteDate: n.note_date,
        grandTotal: Number(n.grand_total || 0),
        reason: n.reason || "",
        invoiceId: n.invoice_id,
        orderId: n.order_id,
        distributorId: n.distributor_id,
      }));
    }
    store.loaded = true;
    publish(store, next);
  })();
  store.inflight = run.finally(() => { store.inflight = null; });
  return store.inflight;
}

/**
 * Every receipt in the workspace, plus how much has landed against each bill
 * and each order. One source for the money figures shown across Billing.
 */
export function useCollections(companyId?: string | null) {
  const [snapshot, setSnapshot] = useState<CollectionsSnapshot>(
    () => (companyId ? getStore(companyId).snapshot : EMPTY),
  );

  useEffect(() => {
    if (!companyId) { setSnapshot(EMPTY); return; }
    const store = getStore(companyId);
    const sync = () => setSnapshot(store.snapshot);
    store.listeners.add(sync);
    sync();
    void loadCollections(companyId, false);
    return () => { store.listeners.delete(sync); };
  }, [companyId]);

  const { receipts, creditNotes, loading } = snapshot;

  const load = useCallback(async () => {
    if (!companyId) return;
    await loadCollections(companyId, true);
  }, [companyId]);


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
