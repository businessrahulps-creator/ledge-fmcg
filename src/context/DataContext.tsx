import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
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
  persistAllToCache, batchIn,
} from "./data-utils";
import type {
  DataContextType, CompanyInfo, DomainDeps,
  AddOrderResult, Invoice, SecondarySale, Target, Claim, ClaimLine, InvoiceLine,
} from "./data-types";

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

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { companyId, authReady, user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "", address: "", gstin: "", logoUrl: "", phone: "", email: "",
    pan: "", stateCode: "", bankName: "", bankAccountName: "", bankAccount: "", bankIfsc: "", invoicePrefix: "INV",
  });
  const fetchTokenRef = useRef(0);
  const isSyncingRef = useRef(false);

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

  // Clear data when no company
  useEffect(() => {
    if (authReady && !companyId) {
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
  }, [authReady, companyId]);

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

  // Fetch all data
  const fetchAll = useCallback(async (cId: string, token: number) => {
    setLoading(true);
    try {
      const { data: company } = await supabase
        .from("companies").select("order_prefix, next_order_sequence, name, address, gstin, logo_url, phone, email, pan, state_code, bank_name, bank_account, bank_account_name, bank_ifsc, invoice_prefix, next_invoice_sequence").eq("id", cId).single();
      if (token !== fetchTokenRef.current) return;
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

      const [distRes, spRes, prodRes, godownRes, stockRes, ordersRes, schemesRes, ssRes, targetsRes, claimsRes, invoicesRes] = await Promise.all([
        supabase.from("distributors").select("*").eq("company_id", cId).order("name").range(0, 9999),
        supabase.from("salespersons").select("*").eq("company_id", cId).order("name").range(0, 9999),
        supabase.from("products").select("*").eq("company_id", cId).order("name").range(0, 9999),
        supabase.from("godowns").select("*").eq("company_id", cId).order("name").range(0, 9999),
        supabase.from("stock_items").select("*").eq("company_id", cId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("orders").select("*").eq("company_id", cId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("schemes").select("*").eq("company_id", cId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("secondary_sales").select("*").eq("company_id", cId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("targets").select("*").eq("company_id", cId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("claims" as any).select("*").eq("company_id", cId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("invoices" as any).select("*").eq("company_id", cId).order("created_at", { ascending: false }).range(0, 9999),
      ]);

      const claimIds = ((claimsRes as any).data || []).map((c: any) => c.id);
      const invoiceIds = ((invoicesRes as any).data || []).map((i: any) => i.id);

      const [claimLinesData, invoiceLinesData] = await Promise.all([
        batchIn("claim_lines", "claim_id", claimIds),
        batchIn("invoice_lines", "invoice_id", invoiceIds),
      ]);
      if (token !== fetchTokenRef.current) return;

      const dists = (distRes.data || []).map(mapDistributor);
      dealers.setDistributors(dists);
      cacheData(cId, "distributors", dists);

      const sps = (spRes.data || []).map(mapSalesperson);
      salespersons.setSalespersons(sps);

      const prods = (prodRes.data || []).map(mapProduct);
      catalog.setProducts(prods);

      const gds = (godownRes.data || []).map(mapGodown);
      stock.setLocations(gds);

      const sis = (stockRes.data || []).map(si => mapStockItem(si, prods, gds));
      stock.setStockItems(sis);

      const mappedSchemes = (schemesRes.data || []).map((s: any) => mapScheme(s));
      catalog.setSchemes(mappedSchemes);

      const mappedSS = (ssRes.data || []).map((s: any) => mapSecondarySale(s));
      targets.setSecondarySales(mappedSS);

      const mappedTargets = ((targetsRes as any).data || []).map((t: any) => mapTarget(t));
      targets.setTargets(mappedTargets);

      const mappedClaims = ((claimsRes as any).data || []).map((c: any) => mapClaim(c, claimLinesData));
      billing.setClaims(mappedClaims);

      const mappedInvoices = ((invoicesRes as any).data || []).map((inv: any) => mapInvoice(inv, invoiceLinesData));
      billing.setInvoices(mappedInvoices);

      const orderIds = (ordersRes.data || []).map(o => o.id);
      const [allLines, allOrderSchemes] = await Promise.all([
        batchIn("order_lines", "order_id", orderIds),
        batchIn("order_schemes", "order_id", orderIds),
      ]);
      if (token !== fetchTokenRef.current) return;

      const mappedOrders = mapOrders(ordersRes.data || [], allLines, allOrderSchemes);
      orders.setOrders(mappedOrders);
      setIsOfflineData(false);

      persistAllToCache(cId, {
        orders: mappedOrders, distributors: dists, salespersons: sps,
        products: prods, locations: gds, stockItems: sis, schemes: mappedSchemes,
        orderPrefix: company?.order_prefix || "ORD",
        orderSequence: company?.next_order_sequence || 1,
      });
    } catch (err) {
      console.error("Data fetch error:", err);
      if (!navigator.onLine) await loadFromCache(cId);
    } finally {
      if (token === fetchTokenRef.current) setLoading(false);
    }
  }, [loadFromCache]);

  useEffect(() => {
    if (!companyId) return;
    const token = ++fetchTokenRef.current;
    fetchAll(companyId, token);
  }, [companyId, fetchAll]);

  // Sync queue on reconnect
  useEffect(() => {
    if (!companyId || !authReady) return;

    const syncQueue = async () => {
      if (isSyncingRef.current || !navigator.onLine) return;
      isSyncingRef.current = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { console.warn("No active session — skipping queue sync"); return; }

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
            console.error(`Sync failed (attempt ${attempt}/${MAX_RETRIES}):`, mutation.table, "error" in result ? result.error : "unknown");
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
          await fetchAll(companyId, token);
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

    const subscribe = () => {
      if (!navigator.onLine) return;
      channel = supabase
        .channel(`company-${companyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `company_id=eq.${companyId}` }, () => { orders.safeRefetch(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'distributors', filter: `company_id=eq.${companyId}` }, () => { dealers.safeRefetch(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'salespersons', filter: `company_id=eq.${companyId}` }, () => { salespersons.safeRefetch(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `company_id=eq.${companyId}` }, () => { catalog.safeRefetchProducts(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'godowns', filter: `company_id=eq.${companyId}` }, () => { stock.safeRefetchGodowns(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items', filter: `company_id=eq.${companyId}` }, () => { stock.safeRefetchStockItems(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schemes', filter: `company_id=eq.${companyId}` }, () => { catalog.safeRefetchSchemes(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'claims', filter: `company_id=eq.${companyId}` }, () => { billing.safeRefetchClaims(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `company_id=eq.${companyId}` }, () => { billing.safeRefetchInvoices(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'targets', filter: `company_id=eq.${companyId}` }, () => { targets.safeRefetchTargets(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'secondary_sales', filter: `company_id=eq.${companyId}` }, () => { targets.safeRefetchSecondarySales(); })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') console.warn('Realtime channel error — will retry automatically');
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
      if (channel) supabase.removeChannel(channel);
    };
  }, [companyId, authReady]);

  // Computed values
  const computedDistributors = useMemo(() =>
    dealers.rawDistributors.map(d => {
      const dOrders = orders.orders.filter(o => o.distributorId === d.id);
      return { ...d, totalOrders: dOrders.length, totalValue: dOrders.reduce((s, o) => s + o.total, 0) };
    }), [dealers.rawDistributors, orders.orders]);

  const computedSalespersons = useMemo(() =>
    salespersons.rawSalespersons.map(s => {
      const sOrders = orders.orders.filter(o => o.salespersonId === s.id);
      return { ...s, totalOrders: sOrders.length, totalValue: sOrders.reduce((sum, o) => sum + o.total, 0) };
    }), [salespersons.rawSalespersons, orders.orders]);

  const computedProducts = useMemo(() =>
    catalog.rawProducts.map(p => {
      const totalSold = orders.orders.reduce((sum, o) =>
        sum + o.lines.filter(l => l.productId === p.id).reduce((s, l) => s + l.quantity, 0), 0);
      return { ...p, totalSold };
    }), [catalog.rawProducts, orders.orders]);

  const refreshAll = useCallback(async () => {
    if (!companyId) return;
    const token = ++fetchTokenRef.current;
    await fetchAll(companyId, token);
  }, [companyId, fetchAll]);

  const updateCompanyInfo = useCallback((updates: Partial<CompanyInfo>) => {
    setCompanyInfo(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <DataContext.Provider
      value={{
        orders: orders.orders, distributors: computedDistributors, salespersons: computedSalespersons,
        products: computedProducts, locations: stock.locations, stockItems: stock.stockItems,
        schemes: catalog.schemes, loading, isOfflineData, companyInfo, updateCompanyInfo,
        orderPrefix: orders.orderPrefix, orderSequence: orders.orderSequence, setOrderPrefix: orders.setOrderPrefix,
        addOrder: orders.addOrder, updateOrder: orders.updateOrder, deleteOrder: orders.deleteOrder,
        addDistributor: dealers.add, updateDistributor: dealers.update, deleteDistributor: dealers.remove,
        addSalesperson: salespersons.add, updateSalesperson: salespersons.update, deleteSalesperson: salespersons.remove,
        addProduct: catalog.addProduct, updateProduct: catalog.updateProduct, deleteProduct: catalog.deleteProduct,
        addLocation: stock.addLocation, updateLocation: stock.updateLocation, deleteLocation: stock.deleteLocation,
        addStockItem: stock.addStockItem, updateStockItem: stock.updateStockItem, deleteStockItem: stock.deleteStockItem,
        setStockItems: stock.setStockItems,
        addScheme: catalog.addScheme, updateScheme: catalog.updateScheme, deleteScheme: catalog.deleteScheme,
        secondarySales: targets.secondarySales, addSecondarySale: targets.addSecondarySale, deleteSecondarySale: targets.deleteSecondarySale,
        targets: targets.targets, addTarget: targets.addTarget, updateTarget: targets.updateTarget, deleteTarget: targets.deleteTarget,
        claims: billing.claims, addClaim: billing.addClaim, updateClaim: billing.updateClaim,
        invoices: billing.invoices, addInvoice: billing.addInvoice, updateInvoice: billing.updateInvoice, deleteInvoice: billing.deleteInvoice,
        nextOrderNumber: orders.nextOrderNumber, previewOrderNumber: orders.previewOrderNumber, refreshAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
