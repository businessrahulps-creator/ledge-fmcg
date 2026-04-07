import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Order, Distributor, Salesperson, Product, OrderLine } from "@/data/mock-data";
import type { GodownLocation, StockItem } from "@/data/godown-data";

export interface AddOrderResult {
  success: boolean;
  orderNumber?: string;
  error?: string;
}

interface DataContextType {
  orders: Order[];
  distributors: Distributor[];
  salespersons: Salesperson[];
  products: Product[];
  locations: GodownLocation[];
  stockItems: StockItem[];
  loading: boolean;

  orderPrefix: string;
  orderSequence: number;
  setOrderPrefix: (prefix: string) => void;

  addOrder: (order: Order) => Promise<AddOrderResult>;
  updateOrder: (id: string, updates: Partial<Order>) => void;

  addDistributor: (d: Distributor) => void;
  updateDistributor: (d: Distributor) => void;
  deleteDistributor: (id: string) => void;

  addSalesperson: (s: Salesperson) => void;
  updateSalesperson: (s: Salesperson) => void;
  deleteSalesperson: (id: string) => void;

  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;

  addLocation: (l: GodownLocation) => void;
  updateLocation: (l: GodownLocation) => void;
  deleteLocation: (id: string) => void;

  addStockItem: (si: StockItem) => void;
  updateStockItem: (si: StockItem) => void;
  deleteStockItem: (id: string) => void;
  setStockItems: React.Dispatch<React.SetStateAction<StockItem[]>>;

  nextOrderNumber: () => string;
  previewOrderNumber: () => string;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

// Helper to map DB rows to app types
function mapOrders(ordersData: any[], allLines: any[]): Order[] {
  return ordersData.map(o => {
    const oLines: OrderLine[] = allLines
      .filter(l => l.order_id === o.id)
      .map(l => ({
        productId: l.product_id,
        productName: l.product_name,
        quantity: l.quantity,
        unitPrice: Number(l.unit_price),
        lineTotal: Number(l.line_total),
      }));
    return {
      id: o.id, orderNumber: o.order_number, date: o.date,
      distributorId: o.distributor_id, distributorName: o.distributor_name,
      salespersonId: o.salesperson_id, salesperson: o.salesperson_name,
      lines: oLines, total: Number(o.total),
      paymentMode: o.payment_mode as Order["paymentMode"],
      paymentStatus: o.payment_status as Order["paymentStatus"],
      dispatchDate: o.dispatch_date, vehicle: o.vehicle,
      driverName: o.driver_name,
      deliveryStatus: o.delivery_status as Order["deliveryStatus"],
      dispatchRemarks: o.dispatch_remarks,
    };
  });
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { companyId, authReady } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rawDistributors, setDistributors] = useState<Distributor[]>([]);
  const [rawSalespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [rawProducts, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<GodownLocation[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [orderPrefix, setOrderPrefixState] = useState("ORD");
  const [orderSequence, setOrderSequence] = useState(1);
  const [loading, setLoading] = useState(true);
  const fetchTokenRef = useRef(0);

  // Clear data when no company
  useEffect(() => {
    if (authReady && !companyId) {
      setOrders([]);
      setDistributors([]);
      setSalespersons([]);
      setProducts([]);
      setLocations([]);
      setStockItems([]);
      setLoading(false);
    }
  }, [authReady, companyId]);

  // Fetch all data when companyId is available
  useEffect(() => {
    if (!companyId) return;
    const token = ++fetchTokenRef.current;

    async function fetchAll() {
      setLoading(true);
      try {
        const { data: company } = await supabase
          .from("companies").select("order_prefix, next_order_sequence").eq("id", companyId).single();
        if (token !== fetchTokenRef.current) return;
        if (company) {
          setOrderPrefixState(company.order_prefix);
          setOrderSequence(company.next_order_sequence);
        }

        const [distRes, spRes, prodRes, godownRes, stockRes, ordersRes] = await Promise.all([
          supabase.from("distributors").select("*").eq("company_id", companyId),
          supabase.from("salespersons").select("*").eq("company_id", companyId),
          supabase.from("products").select("*").eq("company_id", companyId),
          supabase.from("godowns").select("*").eq("company_id", companyId),
          supabase.from("stock_items").select("*").eq("company_id", companyId),
          supabase.from("orders").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
        ]);
        if (token !== fetchTokenRef.current) return;

        const dists: Distributor[] = (distRes.data || []).map(d => ({
          id: d.id, name: d.name, location: d.location, contact: d.contact, totalOrders: 0, totalValue: 0,
        }));
        setDistributors(dists);

        const sps: Salesperson[] = (spRes.data || []).map(s => ({
          id: s.id, name: s.name, phone: s.phone, email: s.email, region: s.region, totalOrders: 0, totalValue: 0,
        }));
        setSalespersons(sps);

        const prods: Product[] = (prodRes.data || []).map(p => ({
          id: p.id, name: p.name, sku: p.sku, unit: p.unit, basePrice: Number(p.base_price), totalSold: 0,
        }));
        setProducts(prods);

        const gds: GodownLocation[] = (godownRes.data || []).map(g => ({
          id: g.id, name: g.name, address: g.address, isActive: g.is_active,
        }));
        setLocations(gds);

        const sis: StockItem[] = (stockRes.data || []).map(si => {
          const prod = prods.find(p => p.id === si.product_id);
          const gd = gds.find(g => g.id === si.godown_id);
          return {
            id: si.id, productId: si.product_id, godownId: si.godown_id,
            productName: prod?.name || "", sku: prod?.sku || "", unit: prod?.unit || "",
            godownName: gd?.name || "",
            quantity: si.quantity, threshold: si.threshold,
            basePrice: prod?.basePrice || 0,
            lastDeductedDate: si.last_deducted_date,
          };
        });
        setStockItems(sis);

        const orderIds = (ordersRes.data || []).map(o => o.id);
        let allLines: any[] = [];
        if (orderIds.length > 0) {
          const { data: linesData } = await supabase
            .from("order_lines").select("*").in("order_id", orderIds);
          allLines = linesData || [];
        }
        if (token !== fetchTokenRef.current) return;

        setOrders(mapOrders(ordersRes.data || [], allLines));
      } catch (err) {
        // Data fetch errors must never affect auth
        console.error("Data fetch error:", err);
      } finally {
        if (token === fetchTokenRef.current) setLoading(false);
      }
    }

    fetchAll();
  }, [companyId]);

  // Realtime subscriptions — only after auth ready + companyId
  useEffect(() => {
    if (!companyId || !authReady) return;

    const channel = supabase
      .channel(`company-${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `company_id=eq.${companyId}` }, () => {
        safeRefetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_lines' }, () => {
        safeRefetchOrders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'distributors', filter: `company_id=eq.${companyId}` }, () => {
        safeRefetchDistributors();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salespersons', filter: `company_id=eq.${companyId}` }, () => {
        safeRefetchSalespersons();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `company_id=eq.${companyId}` }, () => {
        safeRefetchProducts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'godowns', filter: `company_id=eq.${companyId}` }, () => {
        safeRefetchGodowns();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items', filter: `company_id=eq.${companyId}` }, () => {
        safeRefetchStockItems();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel error — will retry automatically');
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [companyId, authReady]);

  // Safe refetch helpers wrapped in try/catch
  const safeRefetchOrders = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data: ordersData } = await supabase.from("orders").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
      if (!ordersData) return;
      const orderIds = ordersData.map(o => o.id);
      let allLines: any[] = [];
      if (orderIds.length > 0) {
        const { data: linesData } = await supabase.from("order_lines").select("*").in("order_id", orderIds);
        allLines = linesData || [];
      }
      setOrders(mapOrders(ordersData, allLines));
    } catch { /* ignore — never affect auth */ }
  }, [companyId]);

  const safeRefetchDistributors = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("distributors").select("*").eq("company_id", companyId);
      if (data) setDistributors(data.map(d => ({ id: d.id, name: d.name, location: d.location, contact: d.contact, totalOrders: 0, totalValue: 0 })));
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchSalespersons = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("salespersons").select("*").eq("company_id", companyId);
      if (data) setSalespersons(data.map(s => ({ id: s.id, name: s.name, phone: s.phone, email: s.email, region: s.region, totalOrders: 0, totalValue: 0 })));
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchProducts = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("products").select("*").eq("company_id", companyId);
      if (data) setProducts(data.map(p => ({ id: p.id, name: p.name, sku: p.sku, unit: p.unit, basePrice: Number(p.base_price), totalSold: 0 })));
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchGodowns = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("godowns").select("*").eq("company_id", companyId);
      if (data) setLocations(data.map(g => ({ id: g.id, name: g.name, address: g.address, isActive: g.is_active })));
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchStockItems = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("stock_items").select("*").eq("company_id", companyId);
      if (data) setStockItems(data.map(si => {
        const prod = rawProducts.find(p => p.id === si.product_id);
        const gd = locations.find(g => g.id === si.godown_id);
        return {
          id: si.id, productId: si.product_id, godownId: si.godown_id,
          productName: prod?.name || "", sku: prod?.sku || "", unit: prod?.unit || "",
          godownName: gd?.name || "",
          quantity: si.quantity, threshold: si.threshold, basePrice: prod?.basePrice || 0,
          lastDeductedDate: si.last_deducted_date,
        };
      }));
    } catch { /* ignore */ }
  }, [companyId, rawProducts, locations]);

  // --- CRUD operations ---

  const addOrder = useCallback(async (order: Order): Promise<AddOrderResult> => {
    if (!companyId) return { success: false, error: "No company" };
    try {
      // Get atomic order number
      const { data: seqData, error: seqError } = await supabase.rpc("get_next_order_number", {
        target_company_id: companyId,
      });
      if (seqError) throw seqError;

      let orderNumber = order.orderNumber;
      if (seqData && seqData.length > 0) {
        const { prefix, seq } = seqData[0];
        const year = new Date().getFullYear();
        orderNumber = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
        setOrderSequence(seq + 1);
      }

      const { data: inserted, error } = await supabase.from("orders").insert({
        company_id: companyId,
        order_number: orderNumber,
        date: order.date,
        distributor_id: order.distributorId,
        distributor_name: order.distributorName,
        salesperson_id: order.salespersonId,
        salesperson_name: order.salesperson,
        total: order.total,
        payment_mode: order.paymentMode,
        payment_status: order.paymentStatus,
        dispatch_date: order.dispatchDate || null,
        vehicle: order.vehicle,
        driver_name: order.driverName,
        delivery_status: order.deliveryStatus,
        dispatch_remarks: order.dispatchRemarks,
      }).select().single();

      if (error || !inserted) {
        throw error || new Error("Insert returned no data");
      }

      // Insert order lines
      if (order.lines.length > 0) {
        const { error: linesError } = await supabase.from("order_lines").insert(
          order.lines.map(l => ({
            order_id: inserted.id,
            product_id: l.productId,
            product_name: l.productName,
            quantity: l.quantity,
            unit_price: l.unitPrice,
            line_total: l.lineTotal,
          }))
        );
        if (linesError) throw linesError;
      }

      // Add to local state optimistically
      const newOrder: Order = { ...order, id: inserted.id, orderNumber };
      setOrders(prev => [newOrder, ...prev]);

      return { success: true, orderNumber };
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      toast.error("Failed to create order", { description: msg });
      return { success: false, error: msg };
    }
  }, [companyId]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.paymentMode !== undefined) dbUpdates.payment_mode = updates.paymentMode;
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.deliveryStatus !== undefined) dbUpdates.delivery_status = updates.deliveryStatus;
    if (updates.dispatchDate !== undefined) dbUpdates.dispatch_date = updates.dispatchDate;
    if (updates.vehicle !== undefined) dbUpdates.vehicle = updates.vehicle;
    if (updates.driverName !== undefined) dbUpdates.driver_name = updates.driverName;
    if (updates.dispatchRemarks !== undefined) dbUpdates.dispatch_remarks = updates.dispatchRemarks;

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from("orders").update(dbUpdates as any).eq("id", id);
      if (error) { toast.error("Failed to update order", { description: error.message }); return; }
    }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  // Distributors
  const addDistributor = useCallback(async (d: Distributor) => {
    if (!companyId) return;
    const { data, error } = await supabase.from("distributors").insert({
      company_id: companyId, name: d.name, location: d.location, contact: d.contact,
    }).select().single();
    if (error) { toast.error("Failed to add dealer", { description: error.message }); return; }
    if (data) setDistributors(prev => [...prev, { ...d, id: data.id }]);
  }, [companyId]);

  const updateDistributor = useCallback(async (d: Distributor) => {
    const { error } = await supabase.from("distributors").update({
      name: d.name, location: d.location, contact: d.contact,
    }).eq("id", d.id);
    if (error) { toast.error("Failed to update dealer", { description: error.message }); return; }
    setDistributors(prev => prev.map(x => x.id === d.id ? d : x));
  }, []);

  const deleteDistributor = useCallback(async (id: string) => {
    const { error } = await supabase.from("distributors").delete().eq("id", id);
    if (error) { toast.error("Failed to delete dealer", { description: error.message }); return; }
    setDistributors(prev => prev.filter(x => x.id !== id));
  }, []);

  // Salespersons
  const addSalesperson = useCallback(async (s: Salesperson) => {
    if (!companyId) return;
    const { data, error } = await supabase.from("salespersons").insert({
      company_id: companyId, name: s.name, phone: s.phone, email: s.email, region: s.region,
    }).select().single();
    if (error) { toast.error("Failed to add salesperson", { description: error.message }); return; }
    if (data) setSalespersons(prev => [...prev, { ...s, id: data.id }]);
  }, [companyId]);

  const updateSalesperson = useCallback(async (s: Salesperson) => {
    const { error } = await supabase.from("salespersons").update({
      name: s.name, phone: s.phone, email: s.email, region: s.region,
    }).eq("id", s.id);
    if (error) { toast.error("Failed to update salesperson", { description: error.message }); return; }
    setSalespersons(prev => prev.map(x => x.id === s.id ? s : x));
  }, []);

  const deleteSalesperson = useCallback(async (id: string) => {
    const { error } = await supabase.from("salespersons").delete().eq("id", id);
    if (error) { toast.error("Failed to delete salesperson", { description: error.message }); return; }
    setSalespersons(prev => prev.filter(x => x.id !== id));
  }, []);

  // Products
  const addProduct = useCallback(async (p: Product) => {
    if (!companyId) return;
    const { data, error } = await supabase.from("products").insert({
      company_id: companyId, name: p.name, sku: p.sku, unit: p.unit, base_price: p.basePrice,
    }).select().single();
    if (error) { toast.error("Failed to add product", { description: error.message }); return; }
    if (data) setProducts(prev => [...prev, { ...p, id: data.id }]);
  }, [companyId]);

  const updateProduct = useCallback(async (p: Product) => {
    const { error } = await supabase.from("products").update({
      name: p.name, sku: p.sku, unit: p.unit, base_price: p.basePrice,
    }).eq("id", p.id);
    if (error) { toast.error("Failed to update product", { description: error.message }); return; }
    setProducts(prev => prev.map(x => x.id === p.id ? p : x));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Failed to delete product", { description: error.message }); return; }
    setProducts(prev => prev.filter(x => x.id !== id));
  }, []);

  // Locations (Godowns)
  const addLocation = useCallback(async (l: GodownLocation) => {
    if (!companyId) return;
    const { data, error } = await supabase.from("godowns").insert({
      company_id: companyId, name: l.name, address: l.address, is_active: l.isActive,
    }).select().single();
    if (error) { toast.error("Failed to add warehouse", { description: error.message }); return; }
    if (data) setLocations(prev => [...prev, { ...l, id: data.id }]);
  }, [companyId]);

  const updateLocation = useCallback(async (l: GodownLocation) => {
    const { error } = await supabase.from("godowns").update({
      name: l.name, address: l.address, is_active: l.isActive,
    }).eq("id", l.id);
    if (error) { toast.error("Failed to update warehouse", { description: error.message }); return; }
    setLocations(prev => prev.map(x => x.id === l.id ? l : x));
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    const { error } = await supabase.from("godowns").delete().eq("id", id);
    if (error) { toast.error("Failed to delete warehouse", { description: error.message }); return; }
    setLocations(prev => prev.filter(x => x.id !== id));
  }, []);

  // Stock Items
  const addStockItem = useCallback(async (si: StockItem) => {
    if (!companyId) return;
    const { data, error } = await supabase.from("stock_items").insert({
      company_id: companyId, product_id: si.productId, godown_id: si.godownId,
      quantity: si.quantity, threshold: si.threshold, last_deducted_date: si.lastDeductedDate,
    }).select().single();
    if (error) { toast.error("Failed to add stock item", { description: error.message }); return; }
    if (data) setStockItems(prev => [...prev, { ...si, id: data.id }]);
  }, [companyId]);

  const updateStockItem = useCallback(async (si: StockItem) => {
    const { error } = await supabase.from("stock_items").update({
      quantity: si.quantity, threshold: si.threshold,
      last_deducted_date: si.lastDeductedDate,
    }).eq("id", si.id);
    if (error) { toast.error("Failed to update stock item", { description: error.message }); return; }
    setStockItems(prev => prev.map(x => x.id === si.id ? si : x));
  }, []);

  const deleteStockItemFn = useCallback(async (id: string) => {
    const { error } = await supabase.from("stock_items").delete().eq("id", id);
    if (error) { toast.error("Failed to delete stock item", { description: error.message }); return; }
    setStockItems(prev => prev.filter(x => x.id !== id));
  }, []);

  // Prefix update
  const setOrderPrefix = useCallback(async (prefix: string) => {
    if (!companyId) return;
    setOrderPrefixState(prefix);
    await supabase.from("companies").update({ order_prefix: prefix }).eq("id", companyId);
  }, [companyId]);

  // Computed values
  const computedDistributors = useMemo(() =>
    rawDistributors.map(d => {
      const dOrders = orders.filter(o => o.distributorId === d.id);
      return { ...d, totalOrders: dOrders.length, totalValue: dOrders.reduce((s, o) => s + o.total, 0) };
    }), [rawDistributors, orders]);

  const computedSalespersons = useMemo(() =>
    rawSalespersons.map(s => {
      const sOrders = orders.filter(o => o.salespersonId === s.id);
      return { ...s, totalOrders: sOrders.length, totalValue: sOrders.reduce((sum, o) => sum + o.total, 0) };
    }), [rawSalespersons, orders]);

  const computedProducts = useMemo(() =>
    rawProducts.map(p => {
      const totalSold = orders.reduce((sum, o) =>
        sum + o.lines.filter(l => l.productId === p.id).reduce((s, l) => s + l.quantity, 0), 0);
      return { ...p, totalSold };
    }), [rawProducts, orders]);

  const previewOrderNumber = useCallback(() => {
    const year = new Date().getFullYear();
    return `${orderPrefix}-${year}-${String(orderSequence).padStart(4, "0")}`;
  }, [orderPrefix, orderSequence]);

  const nextOrderNumber = useCallback(() => {
    const year = new Date().getFullYear();
    return `${orderPrefix}-${year}-${String(orderSequence).padStart(4, "0")}`;
  }, [orderPrefix, orderSequence]);

  return (
    <DataContext.Provider
      value={{
        orders, distributors: computedDistributors, salespersons: computedSalespersons,
        products: computedProducts, locations, stockItems, loading,
        orderPrefix, orderSequence, setOrderPrefix,
        addOrder, updateOrder,
        addDistributor, updateDistributor, deleteDistributor,
        addSalesperson, updateSalesperson, deleteSalesperson,
        addProduct, updateProduct, deleteProduct,
        addLocation, updateLocation, deleteLocation,
        addStockItem, updateStockItem, deleteStockItem: deleteStockItemFn, setStockItems,
        nextOrderNumber, previewOrderNumber,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
