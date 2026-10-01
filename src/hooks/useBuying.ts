import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { supplierBalances } from "@/lib/payables";

export interface Supplier { id: string; name: string; phone: string; gstin: string; stateCode: string; address: string; openingBalance: number; createdAt: string }
export interface PurchaseBill {
  id: string; supplierId: string; supplierName: string; supplierBillNo: string; billDate: string; godownId: string;
  supplyType: string; subtotal: number; cgst: number; sgst: number; igst: number; totalTax: number; grandTotal: number;
  notes: string; status: "posted" | "cancelled"; cancelReason: string; createdAt: string;
}
export interface PurchaseReturn { id: string; billId: string; supplierId: string; returnDate: string; reason: string; grandTotal: number; createdAt: string }
export interface SupplierPayment { id: string; supplierId: string; amount: number; mode: string; paidOn: string; reference: string; note: string; status: "posted" | "voided"; voidReason: string; createdAt: string }

interface Snap { suppliers: Supplier[]; bills: PurchaseBill[]; returns: PurchaseReturn[]; payments: SupplierPayment[]; loading: boolean; loaded: boolean }
const EMPTY: Snap = { suppliers: [], bills: [], returns: [], payments: [], loading: true, loaded: false };

// One shared store per company so all Buying screens see the same data.
let store = { company: "", snap: EMPTY, listeners: new Set<() => void>(), inflight: null as Promise<void> | null };
const emit = () => store.listeners.forEach(l => l());
const n = (v: unknown) => Number(v) || 0;

async function load(company: string) {
  if (store.inflight) return store.inflight;
  store.snap = { ...store.snap, loading: true }; emit();
  store.inflight = (async () => {
    const [s, b, r, p] = await Promise.all([
      supabase.from("suppliers").select("*").eq("company_id", company).order("name").range(0, 4999),
      supabase.from("purchase_bills").select("*").eq("company_id", company).order("bill_date", { ascending: false }).order("created_at", { ascending: false }).range(0, 9999),
      supabase.from("purchase_returns").select("*").eq("company_id", company).range(0, 9999),
      supabase.from("supplier_payments").select("*").eq("company_id", company).order("paid_on", { ascending: false }).range(0, 9999),
    ]);
    const err = s.error || b.error || r.error || p.error;
    if (err) handleSupabaseError(err, { source: "buying:load", title: "Couldn't load your buying records" });
    if (store.company !== company) return;
    store.snap = {
      loading: false, loaded: true,
      suppliers: (s.data || []).map((x: any) => ({ id: x.id, name: x.name, phone: x.phone, gstin: x.gstin, stateCode: x.state_code, address: x.address, openingBalance: n(x.opening_balance), createdAt: x.created_at })),
      bills: (b.data || []).map((x: any) => ({
        id: x.id, supplierId: x.supplier_id, supplierName: x.supplier_name, supplierBillNo: x.supplier_bill_no, billDate: x.bill_date, godownId: x.godown_id,
        supplyType: x.supply_type, subtotal: n(x.subtotal), cgst: n(x.cgst_amount), sgst: n(x.sgst_amount), igst: n(x.igst_amount), totalTax: n(x.total_tax),
        grandTotal: n(x.grand_total), notes: x.notes, status: x.status, cancelReason: x.cancel_reason, createdAt: x.created_at,
      })),
      returns: (r.data || []).map((x: any) => ({ id: x.id, billId: x.bill_id, supplierId: x.supplier_id, returnDate: x.return_date, reason: x.reason, grandTotal: n(x.grand_total), createdAt: x.created_at })),
      payments: (p.data || []).map((x: any) => ({ id: x.id, supplierId: x.supplier_id, amount: n(x.amount), mode: x.mode, paidOn: x.paid_on, reference: x.reference, note: x.note, status: x.status, voidReason: x.void_reason, createdAt: x.created_at })),
    };
    emit();
  })().finally(() => { store.inflight = null; });
  return store.inflight;
}

/** Suppliers, purchase bills, returns and payments for the signed-in business. */
export function useBuying() {
  const { companyId } = useAuth();
  if (companyId && store.company !== companyId) store = { company: companyId, snap: EMPTY, listeners: store.listeners, inflight: null };
  const snap = useSyncExternalStore(
    useCallback((l: () => void) => { store.listeners.add(l); return () => { store.listeners.delete(l); }; }, []),
    () => store.snap,
  );
  useEffect(() => { if (companyId && !store.snap.loaded && !store.inflight) void load(companyId); }, [companyId]);
  const reload = useCallback(() => (companyId ? load(companyId) : Promise.resolve()), [companyId]);
  const balances = useMemo(() => supplierBalances(snap.suppliers, snap.bills, snap.returns, snap.payments), [snap]);
  const totalOwed = useMemo(() => Math.round([...balances.values()].reduce((a, b) => a + Math.max(0, b), 0) * 100) / 100, [balances]);
  return { ...snap, balances, totalOwed, reload };
}

/** Run a Buying RPC; shows a clear toast on refusal. Returns data or null. */
export async function buyingRpc<T = any>(fn: string, args: Record<string, unknown>, title: string): Promise<T | null> {
  const { data, error } = await (supabase.rpc as any)(fn, args);
  if (error) { handleSupabaseError(error, { source: `buying:${fn}`, title }); return null; }
  return data as T;
}
