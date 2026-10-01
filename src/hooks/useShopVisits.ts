import { useCallback, useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { addDaysToKey } from "@/utils/dateKey";

export type VisitOutcome =
  | "gave_order" | "paid" | "enough_stock" | "owner_away" | "shop_closed"
  | "promised_payment" | "promised_order" | "other";
export type PromiseStatus = "none" | "open" | "kept" | "broken";
export type ProspectStage = "found" | "talked" | "converted" | "not_interested";

/** Plain words shown on buttons and history. */
export const OUTCOME_LABEL: Record<VisitOutcome, string> = {
  gave_order: "Gave an order",
  paid: "Paid money",
  enough_stock: "Has enough stock",
  owner_away: "Owner not there",
  shop_closed: "Shop was closed",
  promised_payment: "Promised to pay",
  promised_order: "Promised to order",
  other: "Just a note",
};
export const STAGE_LABEL: Record<ProspectStage, string> = {
  found: "Found",
  talked: "Talked to them",
  converted: "Became a dealer",
  not_interested: "Not interested",
};

export interface ShopVisit {
  id: string; distributorId: string; outcome: VisitOutcome; promiseDate: string | null; promiseAmount: number | null;
  promiseStatus: PromiseStatus; note: string; createdBy: string; createdByName: string; createdAt: string;
}
export interface ShopProspect {
  id: string; name: string; ownerName: string; phone: string; area: string; shopType: string; note: string;
  stage: ProspectStage; convertedDistributorId: string | null; createdByName: string; createdAt: string; updatedAt: string;
}

interface Snap { visits: ShopVisit[]; prospects: ShopProspect[]; loading: boolean; loaded: boolean }
const EMPTY: Snap = { visits: [], prospects: [], loading: true, loaded: false };
let store = { company: "", snap: EMPTY, listeners: new Set<() => void>(), inflight: null as Promise<void> | null };
const emit = () => store.listeners.forEach(l => l());

const mapVisit = (x: any): ShopVisit => ({
  id: x.id, distributorId: x.distributor_id, outcome: x.outcome, promiseDate: x.promise_date,
  promiseAmount: x.promise_amount == null ? null : Number(x.promise_amount), promiseStatus: x.promise_status,
  note: x.note, createdBy: x.created_by, createdByName: x.created_by_name, createdAt: x.created_at,
});
const mapProspect = (x: any): ShopProspect => ({
  id: x.id, name: x.name, ownerName: x.owner_name, phone: x.phone, area: x.area, shopType: x.shop_type, note: x.note,
  stage: x.stage, convertedDistributorId: x.converted_distributor_id, createdByName: x.created_by_name,
  createdAt: x.created_at, updatedAt: x.updated_at,
});

async function load(company: string) {
  if (store.inflight) return store.inflight;
  store.snap = { ...store.snap, loading: true }; emit();
  store.inflight = (async () => {
    const since = new Date(Date.now() - 365 * 86400000).toISOString();
    const [v, p] = await Promise.all([
      supabase.from("shop_visits").select("*").eq("company_id", company).gte("created_at", since)
        .order("created_at", { ascending: false }).range(0, 4999),
      supabase.from("shop_prospects").select("*").eq("company_id", company)
        .order("created_at", { ascending: false }).range(0, 4999),
    ]);
    const err = v.error || p.error;
    if (err) handleSupabaseError(err, { source: "visits:load", title: "Couldn't load shop visits" });
    if (store.company !== company) return;
    store.snap = { loading: false, loaded: true, visits: (v.data || []).map(mapVisit), prospects: (p.data || []).map(mapProspect) };
    emit();
  })().finally(() => { store.inflight = null; });
  return store.inflight;
}

export function useShopVisits() {
  const { companyId, user, profile } = useAuth() as any;
  if (companyId && store.company !== companyId) store = { company: companyId, snap: EMPTY, listeners: store.listeners, inflight: null };
  const snap = useSyncExternalStore(
    useCallback((l: () => void) => { store.listeners.add(l); return () => { store.listeners.delete(l); }; }, []),
    () => store.snap,
  );
  useEffect(() => { if (companyId && !store.snap.loaded && !store.inflight) void load(companyId); }, [companyId]);
  const reload = useCallback(() => (companyId ? load(companyId) : Promise.resolve()), [companyId]);
  const myName: string = profile?.full_name || user?.email || "";

  const addVisit = useCallback(async (input: {
    distributorId: string; outcome: VisitOutcome; note: string; promiseDate?: string | null; promiseAmount?: number | null;
  }) => {
    if (!companyId) return false;
    const isPromise = input.outcome === "promised_payment" || input.outcome === "promised_order";
    const { data, error } = await supabase.from("shop_visits").insert({
      company_id: companyId, distributor_id: input.distributorId, outcome: input.outcome,
      note: input.note.trim().slice(0, 500), created_by_name: myName,
      promise_date: isPromise ? input.promiseDate ?? null : null,
      promise_amount: input.outcome === "promised_payment" ? input.promiseAmount ?? null : null,
      promise_status: isPromise ? "open" : "none",
    }).select("*").single();
    if (error) { handleSupabaseError(error, { source: "visits:add", title: "Couldn't save this visit" }); return false; }
    // A promise to pay quiets the "Collect" card in Today's work until the promised day,
    // when it comes back on top. Best-effort: only roles that see money can write this.
    if (input.outcome === "promised_payment" && input.promiseDate) {
      const { error: intelErr } = await supabase.from("intel_actions").insert({
        company_id: companyId, kind: "collect", subject_id: `collect:${input.distributorId}`, state: "promised",
        until_date: addDaysToKey(input.promiseDate, -1), promised_amount: input.promiseAmount ?? null,
      });
      // Roles without money access can't write this (by design); the promise itself is still saved.
      if (intelErr && intelErr.code !== "42501") console.warn("[visits] Today's work link not saved", intelErr.message);
    }
    store.snap = { ...store.snap, visits: [mapVisit(data), ...store.snap.visits] }; emit();
    return true;
  }, [companyId, myName]);

  const setPromiseStatus = useCallback(async (id: string, status: "kept" | "broken") => {
    const { error } = await supabase.from("shop_visits").update({ promise_status: status }).eq("id", id);
    if (error) { handleSupabaseError(error, { source: "visits:promise", title: "Couldn't update this promise" }); return false; }
    store.snap = { ...store.snap, visits: store.snap.visits.map(v => v.id === id ? { ...v, promiseStatus: status } : v) }; emit();
    return true;
  }, []);

  const addProspect = useCallback(async (input: { name: string; ownerName: string; phone: string; area: string; shopType: string; note: string }) => {
    if (!companyId) return false;
    const { data, error } = await supabase.from("shop_prospects").insert({
      company_id: companyId, name: input.name.trim(), owner_name: input.ownerName.trim(), phone: input.phone.trim(),
      area: input.area.trim(), shop_type: input.shopType.trim(), note: input.note.trim().slice(0, 500), created_by_name: myName,
    }).select("*").single();
    if (error) { handleSupabaseError(error, { source: "visits:prospect.add", title: "Couldn't save this shop" }); return false; }
    store.snap = { ...store.snap, prospects: [mapProspect(data), ...store.snap.prospects] }; emit();
    return true;
  }, [companyId, myName]);

  const setStage = useCallback(async (id: string, stage: "found" | "talked" | "not_interested") => {
    const { data, error } = await supabase.from("shop_prospects").update({ stage }).eq("id", id).select("*").single();
    if (error) { handleSupabaseError(error, { source: "visits:prospect.stage", title: "Couldn't move this shop" }); return false; }
    store.snap = { ...store.snap, prospects: store.snap.prospects.map(p => p.id === id ? mapProspect(data) : p) }; emit();
    return true;
  }, []);

  const convert = useCallback(async (id: string): Promise<string | null> => {
    const { data, error } = await (supabase.rpc as any)("convert_prospect_to_dealer_atomic", { p_prospect_id: id });
    if (error) { handleSupabaseError(error, { source: "visits:prospect.convert", title: "Couldn't make this shop a dealer" }); return null; }
    const dealerId = (data as any)?.distributor_id as string;
    store.snap = { ...store.snap, prospects: store.snap.prospects.map(p => p.id === id ? { ...p, stage: "converted", convertedDistributorId: dealerId } : p) }; emit();
    return dealerId;
  }, []);

  return { ...snap, reload, addVisit, setPromiseStatus, addProspect, setStage, convert };
}
