import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/services/api";
import { useReceivables } from "@/hooks/useReceivables";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { todayKey } from "@/utils/dateKey";
import {
  collectQueue, readyOrders, decliningDealers, stockRunway, rankTop3, isHidden,
  readIntelSettings, DEFAULT_INTEL_SETTINGS,
  type IntelAction, type IntelCard, type IntelSettings,
} from "@/lib/intelligence";

/** Everything "Today's work" needs: the cards, handled actions, and settings. */
export function useTodaysWork() {
  const { companyId } = useAuth();
  const api = useApi();
  const orders = api.orders.list();
  const distributors = api.dealers.list();
  const products = api.products.list();
  const stockItems = api.stock.items.list();
  const { rows, receipts, loading: moneyLoading } = useReceivables();

  const [actions, setActions] = useState<IntelAction[]>([]);
  const [settings, setSettings] = useState<IntelSettings>(DEFAULT_INTEL_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const load = useCallback(async () => {
    if (!companyId) return;
    const since = new Date(Date.now() - 120 * 86400000).toISOString();
    const [a, c] = await Promise.all([
      supabase.from("intel_actions").select("kind,subject_id,state,until_date,promised_amount,created_at")
        .eq("company_id", companyId).gte("created_at", since).order("created_at", { ascending: false }).limit(2000),
      supabase.from("companies").select("intel_settings").eq("id", companyId).maybeSingle(),
    ]);
    if (a.error) handleSupabaseError(a.error, { source: "intel:actions.load", title: "Couldn't load your handled items" });
    else setActions((a.data || []).map(r => ({
      kind: r.kind, subjectId: r.subject_id, state: r.state as IntelAction["state"],
      untilDate: r.until_date, promisedAmount: r.promised_amount, createdAt: r.created_at,
    })));
    if (!c.error) setSettings(readIntelSettings((c.data as any)?.intel_settings));
    setLoaded(true);
    setUpdatedAt(new Date());
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const today = todayKey();

  const sections = useMemo(() => {
    const posted = receipts.map(r => ({ distributorId: r.distributorId, amount: r.amount, paidOn: r.paidOn, status: r.status }));
    // Last money event per dealer — a new bill or payment brings a "Done" card back.
    const lastEvent = new Map<string, string>();
    const bump = (id: string, d: string) => { if (!lastEvent.has(id) || d > lastEvent.get(id)!) lastEvent.set(id, d); };
    rows.forEach(r => bump(r.distributorId, r.invoiceDate));
    posted.forEach(r => r.status === "posted" && bump(r.distributorId, r.paidOn));
    const visible = (cards: IntelCard[]) =>
      cards.filter(c => !isHidden(c, actions, today, c.dealerId ? lastEvent.get(c.dealerId) : undefined));

    const collect = visible(collectQueue({ rows, distributors, orders, receipts: posted, today }));
    const ordersCards = visible(readyOrders({ orders, stockItems, settings, today }));
    const dealers = visible(decliningDealers({ orders, distributors, settings, today }));
    const stock = stockRunway({ orders, stockItems, products, settings, today });
    const low = visible(stock.low);
    const slow = visible(stock.slow);
    const top = rankTop3([...collect, ...ordersCards, ...low, ...dealers]);
    return { collect, orders: ordersCards, dealers, low, slow, top };
  }, [rows, receipts, distributors, orders, stockItems, products, settings, actions, today]);

  const act = useCallback(async (card: IntelCard, state: IntelAction["state"], untilDate?: string, promisedAmount?: number) => {
    if (!companyId) return false;
    const row = {
      company_id: companyId, kind: card.kind, subject_id: card.subjectId, state,
      until_date: untilDate ?? null, promised_amount: promisedAmount ?? null,
    };
    const { data, error } = await supabase.from("intel_actions").insert(row).select("created_at").single();
    if (error) {
      handleSupabaseError(error, { source: "intel:actions.insert", title: "Couldn't save that" });
      return false;
    }
    setActions(prev => [{ kind: card.kind, subjectId: card.subjectId, state, untilDate: untilDate ?? null, promisedAmount: promisedAmount ?? null, createdAt: data.created_at }, ...prev]);
    return true;
  }, [companyId]);

  const saveSettings = useCallback(async (next: IntelSettings) => {
    if (!companyId) return false;
    const { error } = await supabase.from("companies").update({ intel_settings: next as any }).eq("id", companyId);
    if (error) {
      handleSupabaseError(error, { source: "intel:settings.save", title: "Couldn't save these settings" });
      return false;
    }
    setSettings(next);
    return true;
  }, [companyId]);

  return { ...sections, settings, saveSettings, act, loading: !loaded || moneyLoading, updatedAt, reload: load, today };
}
