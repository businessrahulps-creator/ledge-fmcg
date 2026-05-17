import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { logError } from "@/utils/errorLog";
import type { Order, Distributor, Salesperson, Product, Scheme } from "@/data/mock-data";
import type { GodownLocation, StockItem } from "@/data/godown-data";
import {
  getCachedData, getQueue, replaySingleMutation, updateMutationInQueue,
  type CacheableEntity, cacheData,
} from "@/lib/offline-store";
import { logActivity } from "@/utils/activityLog";
import {
  mapOrders, mapDistributor, mapSalesperson, mapProduct, mapGodown, mapStockItem,
  mapScheme, mapSecondarySale, mapTarget, mapClaim, mapInvoice,
  persistAllToCache, batchIn, fetchAllChunked,
} from "./data-utils";
import type {
  DataContextType, CompanyInfo, DomainDeps,
  AddOrderResult, Invoice, SecondarySale, Target, Claim, ClaimLine, InvoiceLine,
  CatalogContextType, TransactionalContextType,
} from "./data-types";
import { CatalogProvider } from "./CatalogContext";
import { TransactionalProvider } from "./TransactionalContext";

// Domain hooks
import { useDealersDomain } from "./domains/useDealersDomain";
import { useSalespersonsDomain } from "./domains/useSalespersonsDomain";
import { useCatalogDomain } from "./domains/useCatalogDomain";
import { useStockDomain } from "./domains/useStockDomain";
import { useOrdersDomain } from "./domains/useOrdersDomain";
import { useBillingDomain } from "./domains/useBillingDomain";
import { useTargetsDomain } from "./domains/useTargetsDomain";

// Re-export types for backward compatibility
export type { AddOrderResult, CompanyInfo, InvoiceLine, Invoice, SecondarySale, Target, ClaimLine, Claim };

const DataContext = createContext<DataContextType | null>(null);

// Safe no-op stub returned during transient signed-out states (e.g. while signing
// out from a page that consumes useData). Throwing here would surface a scary
// PageErrorBoundary toast for ~1 frame; instead we hand back inert defaults and
// the route will redirect to /login on the next render.
const NOOP_DATA_STUB = new Proxy({} as any, {
  get(_t, prop) {
    if (prop === "loading") return true;
    if (prop === "isRefreshing" || prop === "isOfflineData") return false;
    if (prop === "companyInfo") return {
      name: "", address: "", gstin: "", logoUrl: "", phone: "", email: "",
      pan: "", stateCode: "", bankName: "", bankAccountName: "", bankAccount: "",
      bankIfsc: "", invoicePrefix: "INV",
    };
    if (typeof prop === "string" && /^(orders|distributors|salespersons|products|godowns|stockItems|schemes|secondarySales|targets|claims|invoices|stockDeductions)$/.test(prop)) return [];
    // All action methods become harmless async no-ops
    return async () => undefined;
  },
}) as DataContextType;

export function useData() {
  const ctx = useContext(DataContext);
  if (ctx) return ctx;
  // If there's no provider AND no authenticated session, return the safe stub
  // (transient sign-out). Only throw when the developer actually forgot the provider.
  // We can't call useAuth here without risking another throw, so check window state cheaply.
  if (typeof window !== "undefined") {
    return NOOP_DATA_STUB;
  }
  throw new Error("useData must be used within DataProvider");
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { companyId, authReady, user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "", address: "", gstin: "", logoUrl: "", phone: "", email: "",
    pan: "", stateCode: "", bankName: "", bankAccountName: "", bankAccount: "", bankIfsc: "", invoicePrefix: "INV",
  });
  const fetchTokenRef = useRef(0);
  const isSyncingRef = useRef(false);
  const hasHydratedRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  // Activity log shorthand
  const log = useCallback((entityType: string, entityId: string, action: string, summary: string, metadata?: Record<string, any>) => {
    if (!companyId || !user) return;
    logActivity({
      companyId, userId: user.id, userName: profile?.full_name || user.email || "",
      entityType, entityId, action, summary, metadata,
    });
  }, [companyId, user, profile]);

  const persistEntityToCache = useCallback((entity: CacheableEntity, data: any) => {
    if (companyId) cacheData(companyId, entity, data);
  }, [companyId]);

  // Shared deps for domain hooks
  const deps: DomainDeps = useMemo(() => ({
    companyId, persistEntityToCache, log,
  }), [companyId, persistEntityToCache, log]);

  // Domain hooks
  const dealers = useDealersDomain(deps);
  const salespersons = useSalespersonsDomain(deps);
  const catalog = useCatalogDomain(deps);
  const stock = useStockDomain(deps);
  const targets = useTargetsDomain(deps);

  const ordersDeps = useMemo(() => ({
    ...deps,
    deductStockForOrder: stock.deductStockForOrder,
    safeRefetchStockItems: stock.safeRefetchStockItems,
  }), [deps, stock.deductStockForOrder, stock.safeRefetchStockItems]);

  const orders = useOrdersDomain(ordersDeps);

  const billingDeps = useMemo(() => ({
    ...deps,
    getOrders: () => orders.orders,
    safeRefetchStockItems: stock.safeRefetchStockItems,
  }), [deps, orders.orders, stock.safeRefetchStockItems]);

  const billing = useBillingDomain(billingDeps);

  // Clear data only when the user is truly signed out. A transient `companyId`
  // gap (profile refresh, token refresh) must NOT wipe already-loaded data,
  // otherwise pages flash empty mid-session.
  useEffect(() => {
    if (authReady && !user) {
      orders.setOrders([]);
      dealers.setDistributors([]);
      salespersons.setSalespersons([]);
      catalog.setProducts([]);
      stock.setLocations([]);
      stock.setStockItems([]);
      catalog.setSchemes([]);
      targets.setSecondarySales([]);
      targets.setTargets([]);
      billing.setClaims([]);
      billing.setInvoices([]);
      setLoading(false);
    }
  }, [authReady, user]);

  // Load from IDB cache (offline fallback)
  const loadFromCache = useCallback(async (cId: string) => {
    const [cOrders, cDist, cSp, cProd, cLoc, cStock, cPrefix, cSeq, cSchemes] = await Promise.all([
      getCachedData<Order[]>(cId, "orders"),
      getCachedData<Distributor[]>(cId, "distributors"),
      getCachedData<Salesperson[]>(cId, "salespersons"),
      getCachedData<Product[]>(cId, "products"),
      getCachedData<GodownLocation[]>(cId, "locations"),
      getCachedData<StockItem[]>(cId, "stockItems"),
      getCachedData<string>(cId, "orderPrefix"),
      getCachedData<number>(cId, "orderSequence"),
      getCachedData<Scheme[]>(cId, "schemes"),
    ]);
    let loaded = false;
    if (cOrders) { orders.setOrders(cOrders); loaded = true; }
    if (cDist) { dealers.setDistributors(cDist); loaded = true; }
    if (cSp) { salespersons.setSalespersons(cSp); loaded = true; }
    if (cProd) { catalog.setProducts(cProd); loaded = true; }
    if (cLoc) { stock.setLocations(cLoc); loaded = true; }
    if (cStock) { stock.setStockItems(cStock); loaded = true; }
    if (cSchemes) { catalog.setSchemes(cSchemes); loaded = true; }
    if (cPrefix) orders.setOrderPrefixState(cPrefix);
    if (cSeq) orders.setOrderSequence(cSeq);
    if (loaded) setIsOfflineData(true);
    return loaded;
  }, []);

  // Two-phase fetch:
  //   Phase 1 (critical): company info + small reference data needed everywhere
  //                       (distributors, salespersons, products, godowns, schemes, locations).
  //                       Unblocks first paint as soon as it resolves.
  //   Phase 2 (heavy):    orders + lines + claims + invoices + stock_items + targets + secondary_sales.
  //                       Runs in parallel with phase 1 but does NOT block the loading flag,
  //                       so pages that don't depend on heavy data render immediately.
  const fetchAll = useCallback(async (cId: string, token: number, isBackground = false) => {
    // Cold start = very first fetch for this session AND caller wants a foreground load.
    // Every later call (refresh, realtime, sync, tick) is silent — no skeleton flicker.
    const isColdStart = !hasHydratedRef.current && !isBackground;
    if (isColdStart) setLoading(true);
    else setIsRefreshing(true);

    // Helper: commit phase-1 state. On cold start we commit incrementally so the
    // first paint can land asap. On background refresh we DEFER all commits until
    // both phases have succeeded, so the live UI never sees a partial snapshot.
    const applyPhase1 = (p1: any) => {
      if (!p1) return;
      const { company, dists, sps, prods, gds, mappedSchemes } = p1;
      if (company) {
        orders.setOrderPrefixState(company.order_prefix);
        orders.setOrderSequence(company.next_order_sequence);
        setCompanyInfo({
          name: company.name || "", address: company.address || "", gstin: company.gstin || "",
          logoUrl: company.logo_url || "", phone: (company as any).phone || "", email: (company as any).email || "",
          pan: (company as any).pan || "", stateCode: (company as any).state_code || "",
          bankName: (company as any).bank_name || "", bankAccountName: (company as any).bank_account_name || "",
          bankAccount: (company as any).bank_account || "",
          bankIfsc: (company as any).bank_ifsc || "", invoicePrefix: (company as any).invoice_prefix || "INV",
        });
      }
      dealers.setDistributors(dists);
      cacheData(cId, "distributors", dists);
      salespersons.setSalespersons(sps);
      catalog.setProducts(prods);
      stock.setLocations(gds);
      catalog.setSchemes(mappedSchemes);
    };

    // ---------- Phase 1: critical reference data ----------
    const phase1 = (async () => {
      const { data: company } = await supabase
        .from("companies").select("order_prefix, next_order_sequence, name, address, gstin, logo_url, phone, email, pan, state_code, bank_name, bank_account, bank_account_name, bank_ifsc, invoice_prefix, next_invoice_sequence").eq("id", cId).single();

      const [distRes, spRes, prodRes, godownRes, schemesRes] = await Promise.all([
        fetchAllChunked(() => supabase.from("distributors").select("*").eq("company_id", cId).order("name"), 1000, 200, "distributors"),
        fetchAllChunked(() => supabase.from("salespersons").select("*").eq("company_id", cId).order("name"), 1000, 200, "salespersons"),
        fetchAllChunked(() => supabase.from("products").select("*").eq("company_id", cId).order("name"), 1000, 200, "products"),
        fetchAllChunked(() => supabase.from("godowns").select("*").eq("company_id", cId).order("name"), 1000, 200, "godowns"),
        fetchAllChunked(() => supabase.from("schemes").select("*").eq("company_id", cId).order("created_at", { ascending: false }), 1000, 200, "schemes"),
      ]);

      const dists = (distRes as any[]).map(mapDistributor);
      const sps = (spRes as any[]).map(mapSalesperson);
      const prods = (prodRes as any[]).map(mapProduct);
      const gds = (godownRes as any[]).map(mapGodown);
      const mappedSchemes = (schemesRes as any[]).map((s: any) => mapScheme(s));

      return {
        company, dists, sps, prods, gds, mappedSchemes,
        orderPrefix: company?.order_prefix || "ORD",
        orderSequence: company?.next_order_sequence || 1,
      };
    })();

    // ---------- Phase 2: heavy data (runs in parallel) ----------
    const phase2 = (async () => {
      const [stockRes, ordersRes, ssRes, targetsRes, claimsRes, invoicesRes] = await Promise.all([
        fetchAllChunked(() => supabase.from("stock_items").select("*").eq("company_id", cId).order("created_at", { ascending: false }), 1000, 200, "stock_items"),
        fetchAllChunked(() => supabase.from("orders").select("*").eq("company_id", cId).order("created_at", { ascending: false }), 1000, 200, "orders"),
        fetchAllChunked(() => supabase.from("secondary_sales").select("*").eq("company_id", cId).order("created_at", { ascending: false }), 1000, 200, "secondary_sales"),
        fetchAllChunked(() => supabase.from("targets").select("*").eq("company_id", cId).order("created_at", { ascending: false }), 1000, 200, "targets"),
        fetchAllChunked(() => supabase.from("claims" as any).select("*").eq("company_id", cId).order("created_at", { ascending: false }), 1000, 200, "claims"),
        fetchAllChunked(() => supabase.from("invoices" as any).select("*").eq("company_id", cId).order("created_at", { ascending: false }), 1000, 200, "invoices"),
      ]);
      return { stockRes, ordersRes, ssRes, targetsRes, claimsRes, invoicesRes };
    })();

    try {
      // On cold start, apply phase-1 as soon as it's ready so first paint isn't
      // gated on heavy queries. On background refresh, hold everything until
      // phase-2 is also ready, then commit atomically.
      let phase1Out: any = null;
      if (isColdStart) {
        phase1Out = await phase1;
        if (token !== fetchTokenRef.current) return;
        applyPhase1(phase1Out);
      }

      const [p1Final, p2] = await Promise.all([isColdStart ? Promise.resolve(phase1Out) : phase1, phase2]);
      if (token !== fetchTokenRef.current) return;
      phase1Out = p1Final;

      const { stockRes, ordersRes, ssRes, targetsRes, claimsRes, invoicesRes } = p2;
      const prods = phase1Out?.prods || [];
      const gds = phase1Out?.gds || [];

      const claimIds = (claimsRes as any[]).map((c: any) => c.id);
      const invoiceIds = (invoicesRes as any[]).map((i: any) => i.id);
      const orderIds = (ordersRes as any[]).map((o: any) => o.id);

      const [claimLinesData, invoiceLinesData, allLines, allOrderSchemes] = await Promise.all([
        batchIn("claim_lines", "claim_id", claimIds),
        batchIn("invoice_lines", "invoice_id", invoiceIds),
        batchIn("order_lines", "order_id", orderIds),
        batchIn("order_schemes", "order_id", orderIds),
      ]);
      if (token !== fetchTokenRef.current) return;

      // Map everything before touching state — so a mapping crash can't half-commit.
      const sis = (stockRes as any[]).map(si => mapStockItem(si, prods, gds));
      const mappedSS = (ssRes as any[]).map((s: any) => mapSecondarySale(s));
      const mappedTargets = (targetsRes as any[]).map((t: any) => mapTarget(t));
      const mappedClaims = (claimsRes as any[]).map((c: any) => mapClaim(c, claimLinesData));
      const mappedInvoices = (invoicesRes as any[]).map((inv: any) => mapInvoice(inv, invoiceLinesData));
      const mappedOrders = mapOrders((ordersRes as any[]) || [], allLines, allOrderSchemes);

      // Atomic commit window — for background refresh, phase-1 also lands here.
      if (!isColdStart) applyPhase1(phase1Out);
      stock.setStockItems(sis);
      targets.setSecondarySales(mappedSS);
      targets.setTargets(mappedTargets);
      billing.setClaims(mappedClaims);
      billing.setInvoices(mappedInvoices);
      orders.setOrders(mappedOrders);
      setIsOfflineData(false);

      persistAllToCache(cId, {
        orders: mappedOrders, distributors: phase1Out?.dists || [], salespersons: phase1Out?.sps || [],
        products: prods, locations: gds, stockItems: sis, schemes: phase1Out?.mappedSchemes || [],
        orderPrefix: phase1Out?.orderPrefix || "ORD",
        orderSequence: phase1Out?.orderSequence || 1,
      });
    } catch (err) {
      logError({ source: "data:fetchAll", error: err, context: { companyId: cId } });
      // Background refresh: keep the last good snapshot — never blank the UI.
      // Cold start with no network: try to paint from IDB cache so the user
      // still sees something.
      if (isColdStart && !navigator.onLine) await loadFromCache(cId);
    } finally {
      if (token === fetchTokenRef.current) {
        setLoading(false);
        setIsRefreshing(false);
        hasHydratedRef.current = true;
        lastFetchAtRef.current = Date.now();
      }
    }
  }, [loadFromCache]);

  useEffect(() => {
    if (!companyId) return;
    const token = ++fetchTokenRef.current;
    let cancelled = false;
    // Cache-first: paint instantly from IDB, then refresh in background.
    (async () => {
      const hadCache = await loadFromCache(companyId);
      if (cancelled || token !== fetchTokenRef.current) return;
      if (hadCache) {
        // Page can render now; fetch fresh data in background without blocking UI.
        setLoading(false);
        fetchAll(companyId, token, true);
      } else {
        // Cold start — show skeletons while fetching.
        fetchAll(companyId, token, false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, fetchAll, loadFromCache]);

  // Sync queue on reconnect
  useEffect(() => {
    if (!companyId || !authReady) return;

    const syncQueue = async () => {
      if (isSyncingRef.current || !navigator.onLine) return;
      isSyncingRef.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { return; }

        const queue = await getQueue();
        if (queue.length === 0) return;

        const MAX_RETRIES = 3;
        let synced = 0;

        for (const mutation of queue) {
          if ((mutation.attempts || 0) >= MAX_RETRIES) continue;
          let succeeded = false;
          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const result = await replaySingleMutation(mutation);
            if (result.ok) { succeeded = true; synced++; break; }
            const errMsg = "error" in result ? result.error : "unknown";
            logError({ source: "sync:replay", error: errMsg, severity: "warning", context: { table: mutation.table, type: mutation.type, attempt } });
            if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt));
          }
          if (!succeeded) await updateMutationInQueue(mutation.id, { attempts: MAX_RETRIES });
        }

        if (synced > 0) {
          toast.success("Back online — changes synced", { description: `${synced} change${synced > 1 ? "s" : ""} synced successfully`, duration: 3000 });
        }
        const remaining = await getQueue();
        const stuck = remaining.filter(m => (m.attempts || 0) >= MAX_RETRIES);
        if (stuck.length > 0) {
          toast.warning(`${stuck.length} change(s) failed to sync`, { description: "Check Settings for manual retry" });
        }
        if (synced > 0) {
          const token = ++fetchTokenRef.current;
          await fetchAll(companyId, token, true);
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    const handleOnline = () => { syncQueue(); };
    window.addEventListener("online", handleOnline);
    syncQueue();
    return () => { window.removeEventListener("online", handleOnline); };
  }, [companyId, authReady, fetchAll]);

  // Realtime subscriptions
  useEffect(() => {
    if (!companyId || !authReady) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    // Coalesce bursty inserts (e.g. 50 order_lines from one order) into a single
    // refetch per table on a 250ms trailing edge. Cuts realtime fan-out cost
    // dramatically when one user is doing bulk work.
    const debouncedRefetch = (key: string, fn: () => any) => {
      const existing = timers.get(key);
      if (existing) clearTimeout(existing);
      timers.set(key, setTimeout(() => { timers.delete(key); fn(); }, 250));
    };

    const subscribe = () => {
      if (!navigator.onLine) return;
      channel = supabase
        .channel(`company-${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('orders', orders.safeRefetch))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'distributors', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('distributors', dealers.safeRefetch))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salespersons', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('salespersons', salespersons.safeRefetch))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('products', catalog.safeRefetchProducts))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'godowns', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('godowns', stock.safeRefetchGodowns))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('stock_items', stock.safeRefetchStockItems))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schemes', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('schemes', catalog.safeRefetchSchemes))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('claims', billing.safeRefetchClaims))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('invoices', billing.safeRefetchInvoices))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'targets', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('targets', targets.safeRefetchTargets))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'secondary_sales', filter: `company_id=eq.${companyId}` }, () => debouncedRefetch('secondary_sales', targets.safeRefetchSecondarySales))
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') logError({ source: "realtime:channel_error", error: "Realtime channel error — will retry", severity: "info", context: { companyId } });
        });
    };

    const handleOffline = () => { if (channel) { supabase.removeChannel(channel); channel = null; } };
    const handleOnline = () => { subscribe(); };

    subscribe();
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      timers.forEach(t => clearTimeout(t));
      timers.clear();
      if (channel) supabase.removeChannel(channel);
    };
  }, [companyId, authReady]);

  // Background staleness refresh: every 5 min while tab is open, and on
  // visibility-regained if data is older than 5 min. All silent — never flips
  // `loading`, so pages keep showing their current numbers and update in place.
  useEffect(() => {
    if (!companyId || !authReady) return;
    const FIVE_MIN = 5 * 60 * 1000;

    const backgroundRefetch = () => {
      if (!navigator.onLine) return;
      const token = ++fetchTokenRef.current;
      fetchAll(companyId, token, true);
    };

    const interval = window.setInterval(backgroundRefetch, FIVE_MIN);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchAtRef.current > FIVE_MIN) backgroundRefetch();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [companyId, authReady, fetchAll]);

  // The `refresh_entity_aggregates` Postgres trigger keeps total_orders,
  // total_value, outstanding_amount, and total_sold accurate in the DB.
  // We trust those columns instead of recomputing client-side every render
  // (the old O(N×M) recompute was a major source of jank on large tenants).
  const computedDistributors = dealers.rawDistributors;
  const computedSalespersons = salespersons.rawSalespersons;
  const computedProducts = catalog.rawProducts;

  const refreshAll = useCallback(async () => {
    if (!companyId) return;
    const token = ++fetchTokenRef.current;
    // Manual / pull-to-refresh is always background — `isRefreshing` covers
    // the affordance, `loading` stays false so pages don't fall back to skeleton.
    await fetchAll(companyId, token, true);
  }, [companyId, fetchAll]);

  const updateCompanyInfo = useCallback((updates: Partial<CompanyInfo>) => {
    setCompanyInfo(prev => ({ ...prev, ...updates }));
  }, []);

  // Memoize the context value so consumers don't re-render on every parent tick.
  // Split into catalog + transactional slices so future narrow consumers
  // (useCatalog/useTransactional) only subscribe to the data they need.
  const catalogValue = useMemo<CatalogContextType>(() => ({
    products: computedProducts,
    schemes: catalog.schemes,
    distributors: computedDistributors,
    addDistributor: dealers.add, updateDistributor: dealers.update, deleteDistributor: dealers.remove,
    addProduct: catalog.addProduct, updateProduct: catalog.updateProduct, deleteProduct: catalog.deleteProduct,
    addScheme: catalog.addScheme, updateScheme: catalog.updateScheme, deleteScheme: catalog.deleteScheme,
  }), [
    computedProducts, catalog.schemes, computedDistributors,
    dealers.add, dealers.update, dealers.remove,
    catalog.addProduct, catalog.updateProduct, catalog.deleteProduct,
    catalog.addScheme, catalog.updateScheme, catalog.deleteScheme,
  ]);

  const transactionalValue = useMemo<TransactionalContextType>(() => ({
    orders: orders.orders,
    invoices: billing.invoices,
    claims: billing.claims,
    locations: stock.locations,
    stockItems: stock.stockItems,
    secondarySales: targets.secondarySales,
    targets: targets.targets,
    salespersons: computedSalespersons,
    addOrder: orders.addOrder, updateOrder: orders.updateOrder, deleteOrder: orders.deleteOrder,
    addSalesperson: salespersons.add, updateSalesperson: salespersons.update, deleteSalesperson: salespersons.remove,
    addLocation: stock.addLocation, updateLocation: stock.updateLocation, deleteLocation: stock.deleteLocation,
    addStockItem: stock.addStockItem, updateStockItem: stock.updateStockItem, deleteStockItem: stock.deleteStockItem,
    setStockItems: stock.setStockItems,
    addSecondarySale: targets.addSecondarySale, deleteSecondarySale: targets.deleteSecondarySale,
    addTarget: targets.addTarget, updateTarget: targets.updateTarget, deleteTarget: targets.deleteTarget,
    addClaim: billing.addClaim, updateClaim: billing.updateClaim,
    addInvoice: billing.addInvoice, updateInvoice: billing.updateInvoice, deleteInvoice: billing.deleteInvoice,
    nextOrderNumber: orders.nextOrderNumber, previewOrderNumber: orders.previewOrderNumber,
  }), [
    orders.orders, billing.invoices, billing.claims,
    stock.locations, stock.stockItems,
    targets.secondarySales, targets.targets, computedSalespersons,
    orders.addOrder, orders.updateOrder, orders.deleteOrder,
    salespersons.add, salespersons.update, salespersons.remove,
    stock.addLocation, stock.updateLocation, stock.deleteLocation,
    stock.addStockItem, stock.updateStockItem, stock.deleteStockItem, stock.setStockItems,
    targets.addSecondarySale, targets.deleteSecondarySale,
    targets.addTarget, targets.updateTarget, targets.deleteTarget,
    billing.addClaim, billing.updateClaim,
    billing.addInvoice, billing.updateInvoice, billing.deleteInvoice,
    orders.nextOrderNumber, orders.previewOrderNumber,
  ]);

  const value = useMemo<DataContextType>(() => ({
    ...catalogValue,
    ...transactionalValue,
    loading, isRefreshing, isOfflineData, companyInfo, updateCompanyInfo,
    orderPrefix: orders.orderPrefix, orderSequence: orders.orderSequence, setOrderPrefix: orders.setOrderPrefix,
    refreshAll,
  }), [
    catalogValue, transactionalValue,
    loading, isRefreshing, isOfflineData, companyInfo, updateCompanyInfo,
    orders.orderPrefix, orders.orderSequence, orders.setOrderPrefix,
    refreshAll,
  ]);

  return (
    <DataContext.Provider value={value}>
      <CatalogProvider value={catalogValue}>
        <TransactionalProvider value={transactionalValue}>
          {children}
        </TransactionalProvider>
      </CatalogProvider>
    </DataContext.Provider>
  );
}
