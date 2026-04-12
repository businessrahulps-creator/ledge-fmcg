import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Order, OrderScheme, Distributor, Salesperson, Product, OrderLine, Scheme } from "@/data/mock-data";
import type { GodownLocation, StockItem } from "@/data/godown-data";
import {
  cacheData, getCachedData, enqueueMutation, getQueue, removeFromQueue,
  replaySingleMutation, updateMutationInQueue,
  type CacheableEntity,
} from "@/lib/offline-store";
import { sanitizeInput } from "@/utils/sanitize";

export interface AddOrderResult {
  success: boolean;
  orderNumber?: string;
  error?: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  gstin: string;
  logoUrl: string;
  phone: string;
  email: string;
  pan: string;
  stateCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccount: string;
  bankIfsc: string;
  invoicePrefix: string;
}

export interface InvoiceLine {
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxableValue: number;
}

export interface Invoice {
  id: string;
  docType: "gst_invoice" | "estimate" | "proforma" | "credit_note";
  invoiceNumber: string;
  invoiceDate: string;
  sourceOrderId?: string;
  buyerName: string;
  buyerAddress: string;
  buyerGstin: string;
  buyerStateCode: string;
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerPan: string;
  sellerStateCode: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerBankName: string;
  sellerBankAccount: string;
  sellerBankIfsc: string;
  sellerLogoUrl: string;
  supplyType: "intra_state" | "inter_state";
  gstRate: number;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  roundOff: number;
  amountInWords: string;
  notes: string;
  status: "draft" | "final";
  lines: InvoiceLine[];
  createdAt: string;
}

export interface SecondarySale {
  id: string;
  distributorId: string;
  productId: string;
  productName: string;
  retailerName: string;
  quantity: number;
  date: string;
  remarks: string;
}

export interface Target {
  id: string;
  entityType: "salesperson" | "dealer";
  entityId: string;
  entityName: string;
  periodType: "daily" | "weekly" | "monthly";
  periodStart: string;
  targetRevenue: number;
  targetOrders: number;
}

export interface ClaimLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Claim {
  id: string;
  orderId: string;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  claimType: "return" | "damage";
  status: "open" | "resolved" | "rejected";
  reason: string;
  resolutionNotes: string;
  restoreStock: boolean;
  totalClaimValue: number;
  lines: ClaimLine[];
  createdAt: string;
  resolvedAt: string | null;
}

interface DataContextType {
  orders: Order[];
  distributors: Distributor[];
  salespersons: Salesperson[];
  products: Product[];
  locations: GodownLocation[];
  stockItems: StockItem[];
  schemes: Scheme[];
  secondarySales: SecondarySale[];
  loading: boolean;
  isOfflineData: boolean;
  companyInfo: CompanyInfo;

  orderPrefix: string;
  orderSequence: number;
  setOrderPrefix: (prefix: string) => void;

  addOrder: (order: Order) => Promise<AddOrderResult>;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => Promise<boolean>;

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

  addScheme: (s: Scheme) => void;
  updateScheme: (s: Scheme) => void;
  deleteScheme: (id: string) => void;

  addSecondarySale: (s: SecondarySale) => void;
  deleteSecondarySale: (id: string) => void;

  targets: Target[];
  addTarget: (t: Target) => void;
  updateTarget: (t: Target) => void;
  deleteTarget: (id: string) => void;

  claims: Claim[];
  addClaim: (claim: Claim) => Promise<boolean>;
  updateClaim: (id: string, updates: Partial<Claim>) => Promise<void>;

  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">) => Promise<Invoice | null>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  nextOrderNumber: () => string;
  previewOrderNumber: () => string;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

// Helper to map DB rows to app types
function mapOrders(ordersData: any[], allLines: any[], allOrderSchemes: any[] = []): Order[] {
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
    const oSchemes: OrderScheme[] = allOrderSchemes
      .filter(s => s.order_id === o.id)
      .map(s => ({
        schemeId: s.scheme_id || null,
        schemeName: s.scheme_name,
        schemeLabel: s.scheme_label || "",
        savings: Number(s.savings || 0),
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
      godownId: o.godown_id || undefined,
      schemeSavings: Number(o.scheme_savings || 0),
      appliedSchemes: oSchemes,
    };
  });
}

// --- Helper: persist all entities to IDB ---
function persistAllToCache(
  companyId: string,
  data: {
    orders: Order[];
    distributors: Distributor[];
    salespersons: Salesperson[];
    products: Product[];
    locations: GodownLocation[];
    stockItems: StockItem[];
    schemes: Scheme[];
    orderPrefix: string;
    orderSequence: number;
  }
) {
  const entries: [CacheableEntity, any][] = [
    ["orders", data.orders],
    ["distributors", data.distributors],
    ["salespersons", data.salespersons],
    ["products", data.products],
    ["locations", data.locations],
    ["stockItems", data.stockItems],
    ["schemes", data.schemes],
    ["orderPrefix", data.orderPrefix],
    ["orderSequence", data.orderSequence],
  ];
  entries.forEach(([k, v]) => cacheData(companyId, k, v));
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { companyId, authReady } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [rawDistributors, setDistributors] = useState<Distributor[]>([]);
  const [rawSalespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [rawProducts, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<GodownLocation[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [orderPrefix, setOrderPrefixState] = useState("ORD");
  const [orderSequence, setOrderSequence] = useState(1);
  const [secondarySales, setSecondarySales] = useState<SecondarySale[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ name: "", address: "", gstin: "", logoUrl: "", phone: "", email: "", pan: "", stateCode: "", bankName: "", bankAccountName: "", bankAccount: "", bankIfsc: "", invoicePrefix: "INV" });
  const fetchTokenRef = useRef(0);
  const isSyncingRef = useRef(false);

  // Clear data when no company
  useEffect(() => {
    if (authReady && !companyId) {
      setOrders([]);
      setDistributors([]);
      setSalespersons([]);
      setProducts([]);
      setLocations([]);
      setStockItems([]);
      setSchemes([]);
      setSecondarySales([]);
      setTargets([]);
      setClaims([]);
      setLoading(false);
    }
  }, [authReady, companyId]);

  // --- Load from IDB cache (offline fallback) ---
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
    if (cOrders) { setOrders(cOrders); loaded = true; }
    if (cDist) { setDistributors(cDist); loaded = true; }
    if (cSp) { setSalespersons(cSp); loaded = true; }
    if (cProd) { setProducts(cProd); loaded = true; }
    if (cLoc) { setLocations(cLoc); loaded = true; }
    if (cStock) { setStockItems(cStock); loaded = true; }
    if (cSchemes) { setSchemes(cSchemes); loaded = true; }
    if (cPrefix) setOrderPrefixState(cPrefix);
    if (cSeq) setOrderSequence(cSeq);
    if (loaded) setIsOfflineData(true);
    return loaded;
  }, []);

  // Fetch all data when companyId is available
  const fetchAll = useCallback(async (cId: string, token: number) => {
    setLoading(true);
    try {
      const { data: company } = await supabase
        .from("companies").select("order_prefix, next_order_sequence, name, address, gstin, logo_url, phone, email, pan, state_code, bank_name, bank_account, bank_ifsc, invoice_prefix, next_invoice_sequence").eq("id", cId).single();
      if (token !== fetchTokenRef.current) return;
      if (company) {
        setOrderPrefixState(company.order_prefix);
        setOrderSequence(company.next_order_sequence);
        setCompanyInfo({
          name: company.name || "", address: company.address || "", gstin: company.gstin || "",
          logoUrl: company.logo_url || "", phone: (company as any).phone || "", email: (company as any).email || "",
          pan: (company as any).pan || "", stateCode: (company as any).state_code || "",
          bankName: (company as any).bank_name || "", bankAccountName: (company as any).bank_account_name || "",
          bankAccount: (company as any).bank_account || "",
          bankIfsc: (company as any).bank_ifsc || "", invoicePrefix: (company as any).invoice_prefix || "INV",
        });
      }

      const [distRes, spRes, prodRes, godownRes, stockRes, ordersRes, schemesRes, ssRes, targetsRes, claimsRes, claimLinesRes, invoicesRes, invoiceLinesRes] = await Promise.all([
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
        supabase.from("claim_lines" as any).select("*").range(0, 9999) as any,
        supabase.from("invoices" as any).select("*").eq("company_id", cId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("invoice_lines" as any).select("*").range(0, 9999) as any,
      ]);
      if (token !== fetchTokenRef.current) return;

      const dists: Distributor[] = (distRes.data || []).map(d => ({
        id: d.id, name: d.name, location: d.location, contact: d.contact,
        email: (d as any).email || "", address: (d as any).address || "",
        gstin: (d as any).gstin || "", pan: (d as any).pan || "", stateCode: (d as any).state_code || "",
        bankName: (d as any).bank_name || "", bankAccountName: (d as any).bank_account_name || "",
        bankAccount: (d as any).bank_account || "", bankIfsc: (d as any).bank_ifsc || "",
        totalOrders: (d as any).total_orders ?? 0, totalValue: Number((d as any).total_value ?? 0),
        creditLimit: Number((d as any).credit_limit ?? 0), outstandingAmount: Number((d as any).outstanding_amount ?? 0),
      }));
      setDistributors(dists);
      cacheData(cId, "distributors", dists);

      const sps: Salesperson[] = (spRes.data || []).map(s => ({
        id: s.id, name: s.name, phone: s.phone, email: s.email, region: s.region, totalOrders: (s as any).total_orders ?? 0, totalValue: Number((s as any).total_value ?? 0),
      }));
      setSalespersons(sps);

      const prods: Product[] = (prodRes.data || []).map(p => ({
        id: p.id, name: p.name, sku: p.sku, unit: p.unit, basePrice: Number(p.base_price), totalSold: (p as any).total_sold ?? 0,
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

      // Map schemes
      const mappedSchemes: Scheme[] = (schemesRes.data || []).map((s: any) => ({
        id: s.id, name: s.name, description: s.description || "",
        schemeType: s.scheme_type as Scheme["schemeType"],
        discountPercent: Number(s.discount_percent || 0), buyQty: s.buy_qty || 0, freeQty: s.free_qty || 0,
        flatAmount: Number(s.flat_amount || 0), minOrderValue: Number(s.min_order_value || 0), minQty: s.min_qty || 0,
        productId: s.product_id || null, dealerId: s.dealer_id || null,
        isActive: s.is_active, validFrom: s.valid_from, validUntil: s.valid_until || null,
      }));
      setSchemes(mappedSchemes);

      // Map secondary sales
      const mappedSS: SecondarySale[] = (ssRes.data || []).map((s: any) => ({
        id: s.id, distributorId: s.distributor_id, productId: s.product_id,
        productName: s.product_name || "", retailerName: s.retailer_name || "",
        quantity: s.quantity || 0, date: s.date, remarks: s.remarks || "",
      }));
      setSecondarySales(mappedSS);

      // Map targets
      const mappedTargets: Target[] = ((targetsRes as any).data || []).map((t: any) => ({
        id: t.id, entityType: t.entity_type as Target["entityType"],
        entityId: t.entity_id, entityName: t.entity_name || "",
        periodType: t.period_type as Target["periodType"],
        periodStart: t.period_start,
        targetRevenue: Number(t.target_revenue || 0),
        targetOrders: t.target_orders || 0,
      }));
      setTargets(mappedTargets);

      // Map claims
      const allClaimLines = (claimLinesRes as any).data || [];
      const mappedClaims: Claim[] = ((claimsRes as any).data || []).map((c: any) => ({
        id: c.id, orderId: c.order_id, orderNumber: c.order_number || "",
        distributorId: c.distributor_id, distributorName: c.distributor_name || "",
        claimType: c.claim_type as Claim["claimType"],
        status: c.status as Claim["status"],
        reason: c.reason || "", resolutionNotes: c.resolution_notes || "",
        restoreStock: c.restore_stock || false,
        totalClaimValue: Number(c.total_claim_value || 0),
        lines: allClaimLines
          .filter((cl: any) => cl.claim_id === c.id)
          .map((cl: any) => ({
            productId: cl.product_id, productName: cl.product_name || "",
            quantity: cl.quantity || 0, unitPrice: Number(cl.unit_price || 0),
            lineTotal: Number(cl.line_total || 0),
          })),
        createdAt: c.created_at, resolvedAt: c.resolved_at || null,
      }));
      setClaims(mappedClaims);

      // Map invoices
      const allInvoiceLines = (invoiceLinesRes as any).data || [];
      const mappedInvoices: Invoice[] = ((invoicesRes as any).data || []).map((inv: any) => ({
        id: inv.id, docType: inv.doc_type, invoiceNumber: inv.invoice_number,
        invoiceDate: inv.invoice_date, sourceOrderId: inv.source_order_id || undefined,
        buyerName: inv.buyer_name || "", buyerAddress: inv.buyer_address || "",
        buyerGstin: inv.buyer_gstin || "", buyerStateCode: inv.buyer_state_code || "",
        sellerName: inv.seller_name || "", sellerAddress: inv.seller_address || "",
        sellerGstin: inv.seller_gstin || "", sellerPan: inv.seller_pan || "",
        sellerStateCode: inv.seller_state_code || "", sellerPhone: inv.seller_phone || "",
        sellerEmail: inv.seller_email || "", sellerBankName: inv.seller_bank_name || "",
        sellerBankAccount: inv.seller_bank_account || "", sellerBankIfsc: inv.seller_bank_ifsc || "",
        sellerLogoUrl: inv.seller_logo_url || "",
        supplyType: inv.supply_type as Invoice["supplyType"],
        gstRate: Number(inv.gst_rate || 0), subtotal: Number(inv.subtotal || 0),
        cgstAmount: Number(inv.cgst_amount || 0), sgstAmount: Number(inv.sgst_amount || 0),
        igstAmount: Number(inv.igst_amount || 0), totalTax: Number(inv.total_tax || 0),
        grandTotal: Number(inv.grand_total || 0), roundOff: Number(inv.round_off || 0),
        amountInWords: inv.amount_in_words || "", notes: inv.notes || "",
        status: inv.status as Invoice["status"],
        lines: allInvoiceLines
          .filter((l: any) => l.invoice_id === inv.id)
          .map((l: any) => ({
            productName: l.product_name || "", hsnCode: l.hsn_code || "",
            quantity: l.quantity || 0, unit: l.unit || "Pack",
            unitPrice: Number(l.unit_price || 0), taxableValue: Number(l.taxable_value || 0),
          })),
        createdAt: inv.created_at,
      }));
      setInvoices(mappedInvoices);

      const orderIds = (ordersRes.data || []).map(o => o.id);
      let allLines: any[] = [];
      let allOrderSchemes: any[] = [];
      if (orderIds.length > 0) {
        const [linesRes, osRes] = await Promise.all([
          supabase.from("order_lines").select("*").in("order_id", orderIds).range(0, 9999),
          supabase.from("order_schemes").select("*").in("order_id", orderIds).range(0, 9999),
        ]);
        allLines = linesRes.data || [];
        allOrderSchemes = osRes.data || [];
      }
      if (token !== fetchTokenRef.current) return;

      const mappedOrders = mapOrders(ordersRes.data || [], allLines, allOrderSchemes);
      setOrders(mappedOrders);
      setIsOfflineData(false);

      persistAllToCache(cId, {
        orders: mappedOrders, distributors: dists, salespersons: sps,
        products: prods, locations: gds, stockItems: sis, schemes: mappedSchemes,
        orderPrefix: company?.order_prefix || "ORD",
        orderSequence: company?.next_order_sequence || 1,
      });
    } catch (err) {
      console.error("Data fetch error:", err);
      if (!navigator.onLine) {
        await loadFromCache(cId);
      }
    } finally {
      if (token === fetchTokenRef.current) setLoading(false);
    }
  }, [loadFromCache]);

  useEffect(() => {
    if (!companyId) return;
    const token = ++fetchTokenRef.current;
    fetchAll(companyId, token);
  }, [companyId, fetchAll]);

  // --- Sync queue on reconnect ---
  useEffect(() => {
    if (!companyId || !authReady) return;

    const syncQueue = async () => {
      if (isSyncingRef.current || !navigator.onLine) return;
      isSyncingRef.current = true;
      try {
        // Verify auth session is valid before replaying
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn("No active session — skipping queue sync");
          return;
        }

        const queue = await getQueue();
        if (queue.length === 0) return;

        const MAX_RETRIES = 3;
        let synced = 0;

        for (const mutation of queue) {
          // Skip mutations that have already exceeded max retries
          if ((mutation.attempts || 0) >= MAX_RETRIES) continue;

          let succeeded = false;
          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const result = await replaySingleMutation(mutation);
            if (result.ok) {
              succeeded = true;
              synced++;
              break;
            }
            console.error(`Sync failed (attempt ${attempt}/${MAX_RETRIES}):`, mutation.table, "error" in result ? result.error : "unknown");
            if (attempt < MAX_RETRIES) {
              await new Promise(r => setTimeout(r, 1000 * attempt));
            }
          }

          if (!succeeded) {
            // Mark as max-retried so we don't loop endlessly
            await updateMutationInQueue(mutation.id, { attempts: MAX_RETRIES });
          }
        }

        if (synced > 0) {
          toast.success("Back online — changes synced", {
            description: `${synced} change${synced > 1 ? "s" : ""} synced successfully`,
            duration: 3000,
          });
        }

        const remaining = await getQueue();
        const stuck = remaining.filter(m => (m.attempts || 0) >= MAX_RETRIES);
        if (stuck.length > 0) {
          toast.warning(`${stuck.length} change(s) failed to sync`, {
            description: "Check Settings for manual retry",
          });
        }

        // Full refresh from server after sync
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
    // Also sync immediately on mount if online
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `company_id=eq.${companyId}` }, () => {
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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schemes', filter: `company_id=eq.${companyId}` }, () => {
          safeRefetchSchemes();
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Realtime channel error — will retry automatically');
          }
        });
    };

    const handleOffline = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };

    const handleOnline = () => {
      subscribe();
    };

    subscribe();
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (channel) supabase.removeChannel(channel);
    };
  }, [companyId, authReady]);

  // Safe refetch helpers
  const safeRefetchOrders = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data: ordersData } = await supabase.from("orders").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).range(0, 9999);
      if (!ordersData) return;
      const orderIds = ordersData.map(o => o.id);
      let allLines: any[] = [];
      let allOrderSchemes: any[] = [];
      if (orderIds.length > 0) {
        const [linesRes, osRes] = await Promise.all([
          supabase.from("order_lines").select("*").in("order_id", orderIds).range(0, 9999),
          supabase.from("order_schemes").select("*").in("order_id", orderIds).range(0, 9999),
        ]);
        allLines = linesRes.data || [];
        allOrderSchemes = osRes.data || [];
      }
      const mapped = mapOrders(ordersData, allLines, allOrderSchemes);
      setOrders(mapped);
      if (companyId) cacheData(companyId, "orders", mapped);
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchDistributors = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("distributors").select("*").eq("company_id", companyId).order("name").range(0, 9999);
      if (data) {
        const mapped: Distributor[] = data.map(d => ({
          id: d.id, name: d.name, location: d.location, contact: d.contact,
          email: (d as any).email || "", address: (d as any).address || "",
          gstin: (d as any).gstin || "", pan: (d as any).pan || "", stateCode: (d as any).state_code || "",
          bankName: (d as any).bank_name || "", bankAccountName: (d as any).bank_account_name || "",
          bankAccount: (d as any).bank_account || "", bankIfsc: (d as any).bank_ifsc || "",
          totalOrders: (d as any).total_orders ?? 0, totalValue: Number((d as any).total_value ?? 0),
          creditLimit: Number((d as any).credit_limit ?? 0), outstandingAmount: Number((d as any).outstanding_amount ?? 0),
        }));
        setDistributors(mapped);
        cacheData(companyId, "distributors", mapped);
      }
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchSalespersons = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("salespersons").select("*").eq("company_id", companyId).order("name").range(0, 9999);
      if (data) {
        const mapped = data.map(s => ({ id: s.id, name: s.name, phone: s.phone, email: s.email, region: s.region, totalOrders: (s as any).total_orders ?? 0, totalValue: Number((s as any).total_value ?? 0) }));
        setSalespersons(mapped);
        cacheData(companyId, "salespersons", mapped);
      }
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchProducts = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("products").select("*").eq("company_id", companyId).order("name").range(0, 9999);
      if (data) {
        const mapped = data.map(p => ({ id: p.id, name: p.name, sku: p.sku, unit: p.unit, basePrice: Number(p.base_price), totalSold: (p as any).total_sold ?? 0 }));
        setProducts(mapped);
        cacheData(companyId, "products", mapped);
      }
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchGodowns = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("godowns").select("*").eq("company_id", companyId).order("name").range(0, 9999);
      if (data) {
        const mapped = data.map(g => ({ id: g.id, name: g.name, address: g.address, isActive: g.is_active }));
        setLocations(mapped);
        cacheData(companyId, "locations", mapped);
      }
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchStockItems = useCallback(async () => {
    if (!companyId) return;
    try {
      const [siRes, prodRes, gdRes] = await Promise.all([
        supabase.from("stock_items").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).range(0, 9999),
        supabase.from("products").select("*").eq("company_id", companyId).order("name").range(0, 9999),
        supabase.from("godowns").select("*").eq("company_id", companyId).order("name").range(0, 9999),
      ]);
      const freshProducts = (prodRes.data || []).map(p => ({ id: p.id, name: p.name, sku: p.sku, unit: p.unit, basePrice: Number(p.base_price) }));
      const freshGodowns = (gdRes.data || []).map(g => ({ id: g.id, name: g.name }));
      const siData = siRes.data;
      if (siData) {
        const mapped = siData.map(si => {
          const prod = freshProducts.find(p => p.id === si.product_id);
          const gd = freshGodowns.find(g => g.id === si.godown_id);
          return {
            id: si.id, productId: si.product_id, godownId: si.godown_id,
            productName: prod?.name || "", sku: prod?.sku || "", unit: prod?.unit || "",
            godownName: gd?.name || "",
            quantity: si.quantity, threshold: si.threshold, basePrice: prod?.basePrice || 0,
            lastDeductedDate: si.last_deducted_date,
          };
        });
        setStockItems(mapped);
        cacheData(companyId, "stockItems", mapped);
      }
    } catch { /* ignore */ }
  }, [companyId]);

  const safeRefetchSchemes = useCallback(async () => {
    if (!companyId) return;
    try {
      const { data } = await supabase.from("schemes").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).range(0, 9999);
      if (data) {
        const mapped: Scheme[] = data.map((s: any) => ({
          id: s.id, name: s.name, description: s.description || "",
          schemeType: s.scheme_type as Scheme["schemeType"],
          discountPercent: Number(s.discount_percent || 0), buyQty: s.buy_qty || 0, freeQty: s.free_qty || 0,
          flatAmount: Number(s.flat_amount || 0), minOrderValue: Number(s.min_order_value || 0), minQty: s.min_qty || 0,
          productId: s.product_id || null, dealerId: s.dealer_id || null,
          isActive: s.is_active, validFrom: s.valid_from, validUntil: s.valid_until || null,
        }));
        setSchemes(mapped);
        cacheData(companyId, "schemes", mapped);
      }
    } catch { /* ignore */ }
  }, [companyId]);

  // --- Stock deduction helper ---
  const deductStockForOrder = useCallback(async (
    orderId: string, lines: OrderLine[], godownId: string, cId: string
  ) => {
    const today = new Date().toISOString().split("T")[0];
    let hasNegative = false;

    const { data: freshStockData } = await supabase
      .from("stock_items").select("*").eq("company_id", cId).eq("godown_id", godownId);
    const freshStock = freshStockData || [];

    for (const line of lines) {
      await supabase.from("stock_deductions").insert({
        company_id: cId,
        order_id: orderId,
        product_id: line.productId,
        godown_id: godownId,
        quantity_deducted: line.quantity,
        date: today,
      });

      const existing = freshStock.find(
        si => si.product_id === line.productId && si.godown_id === godownId
      );
      if (existing) {
        const newQty = existing.quantity - line.quantity;
        if (newQty < 0) hasNegative = true;
        await supabase.from("stock_items").update({
          quantity: newQty,
          last_deducted_date: today,
        }).eq("id", existing.id);
        existing.quantity = newQty;
      } else {
        hasNegative = true;
        await supabase.from("stock_items").insert({
          company_id: cId,
          product_id: line.productId,
          godown_id: godownId,
          quantity: -line.quantity,
          threshold: 0,
          last_deducted_date: today,
        });
      }
    }

    await safeRefetchStockItems();

    if (hasNegative) {
      toast.warning("Negative stock warning", {
        description: "Some products now have negative stock in this warehouse. This is allowed but please reconcile inventory.",
      });
    }
  }, [safeRefetchStockItems]);

  // --- Helper: persist single entity to IDB cache after offline mutation ---
  const persistEntityToCache = useCallback((entity: CacheableEntity, data: any) => {
    if (companyId) cacheData(companyId, entity, data);
  }, [companyId]);

  // --- Offline-aware CRUD operations ---

  const addOrder = useCallback(async (order: Order): Promise<AddOrderResult> => {
    if (!companyId) return { success: false, error: "No company" };

    // Offline: optimistic local + queue + persist to IDB
    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      const year = new Date().getFullYear();
      const offlineNumber = `${orderPrefix}-${year}-${String(orderSequence).padStart(4, "0")}`;
      const newOrder: Order = { ...order, id: tempId, orderNumber: offlineNumber };
      setOrders(prev => {
        const updated = [newOrder, ...prev];
        persistEntityToCache("orders", updated);
        return updated;
      });
      setOrderSequence(prev => {
        const next = prev + 1;
        persistEntityToCache("orderSequence", next);
        return next;
      });
      await enqueueMutation({
        type: "insert_order_atomic",
        table: "orders",
        clientTempId: tempId,
        payload: {
          companyId,
          date: order.date,
          distributorId: order.distributorId,
          distributorName: order.distributorName,
          salespersonId: order.salespersonId,
          salesperson: order.salesperson,
          total: order.total,
          paymentMode: order.paymentMode,
          paymentStatus: order.paymentStatus,
          dispatchDate: order.dispatchDate || null,
          vehicle: order.vehicle,
          driverName: order.driverName,
          deliveryStatus: order.deliveryStatus,
          dispatchRemarks: order.dispatchRemarks,
          godownId: order.godownId || null,
          lines: order.lines,
        },
      });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return { success: true, orderNumber: offlineNumber };
    }

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("insert_order_atomic", {
        p_company_id: companyId,
        p_date: order.date,
        p_distributor_id: order.distributorId,
        p_distributor_name: sanitizeInput(order.distributorName),
        p_salesperson_id: order.salespersonId,
        p_salesperson_name: sanitizeInput(order.salesperson),
        p_total: order.total,
        p_payment_mode: order.paymentMode,
        p_payment_status: order.paymentStatus,
        p_dispatch_date: order.dispatchDate || null,
        p_vehicle: sanitizeInput(order.vehicle),
        p_driver_name: sanitizeInput(order.driverName),
        p_delivery_status: order.deliveryStatus,
        p_dispatch_remarks: sanitizeInput(order.dispatchRemarks),
        p_godown_id: order.godownId || null,
      });

      if (rpcError) throw rpcError;

      const inserted = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (!inserted) throw new Error("Atomic insert returned no data");

      const orderNumber = inserted.order_number;
      setOrderSequence(inserted.seq + 1);

      if (order.lines.length > 0) {
        const { error: linesError } = await supabase.from("order_lines").insert(
          order.lines.map(l => ({
            order_id: inserted.id,
            product_id: l.productId,
            product_name: sanitizeInput(l.productName),
            quantity: l.quantity,
            unit_price: l.unitPrice,
            line_total: l.lineTotal,
          }))
        );
        if (linesError) throw linesError;
      }

      // Persist scheme savings
      if (order.schemeSavings > 0) {
        await supabase.from("orders").update({ scheme_savings: order.schemeSavings } as any).eq("id", inserted.id);
      }
      if (order.appliedSchemes && order.appliedSchemes.length > 0) {
        await supabase.from("order_schemes").insert(
          order.appliedSchemes.map(s => ({
            order_id: inserted.id,
            scheme_id: s.schemeId || null,
            scheme_name: s.schemeName,
            scheme_label: s.schemeLabel,
            savings: s.savings,
          }))
        );
      }

      if (order.godownId && (order.deliveryStatus === "dispatched" || order.deliveryStatus === "delivered")) {
        await deductStockForOrder(inserted.id, order.lines, order.godownId, companyId);
      }

      const newOrder: Order = { ...order, id: inserted.id, orderNumber };
      setOrders(prev => [newOrder, ...prev]);

      return { success: true, orderNumber };
    } catch (err: any) {
      const msg = err?.message || "Unknown error";
      toast.error("Failed to create order", { description: msg });
      return { success: false, error: msg };
    }
  }, [companyId, deductStockForOrder, orderPrefix, orderSequence, persistEntityToCache]);

  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    const currentOrder = ordersRef.current.find(o => o.id === id);
    const previousDelivery = currentOrder?.deliveryStatus || "pending";
    const newDelivery = updates.deliveryStatus || previousDelivery;

    const dbUpdates: Record<string, any> = {};
    if (updates.paymentMode !== undefined) dbUpdates.payment_mode = updates.paymentMode;
    if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.deliveryStatus !== undefined) dbUpdates.delivery_status = updates.deliveryStatus;
    if (updates.dispatchDate !== undefined) dbUpdates.dispatch_date = updates.dispatchDate;
    if (updates.vehicle !== undefined) dbUpdates.vehicle = sanitizeInput(updates.vehicle);
    if (updates.driverName !== undefined) dbUpdates.driver_name = sanitizeInput(updates.driverName);
    if (updates.dispatchRemarks !== undefined) dbUpdates.dispatch_remarks = sanitizeInput(updates.dispatchRemarks);
    if (updates.godownId !== undefined) dbUpdates.godown_id = updates.godownId || null;
    if (updates.distributorId !== undefined) dbUpdates.distributor_id = updates.distributorId;
    if (updates.distributorName !== undefined) dbUpdates.distributor_name = updates.distributorName;
    if (updates.salespersonId !== undefined) dbUpdates.salesperson_id = updates.salespersonId;
    if (updates.salesperson !== undefined) dbUpdates.salesperson_name = updates.salesperson;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.schemeSavings !== undefined) dbUpdates.scheme_savings = updates.schemeSavings;

    const linesChanged = updates.lines !== undefined;

    // Offline: optimistic + queue + persist
    if (!navigator.onLine) {
      setOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, ...updates } : o);
        persistEntityToCache("orders", updated);
        return updated;
      });
      if (Object.keys(dbUpdates).length > 0) {
        await enqueueMutation({ type: "update", table: "orders", payload: { id, ...dbUpdates } });
      }
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from("orders").update(dbUpdates as any).eq("id", id);
      if (error) { toast.error("Failed to update order", { description: error.message }); return; }
    }

    // Update line items: delete old, insert new
    if (linesChanged && updates.lines) {
      const { error: delErr } = await supabase.from("order_lines").delete().eq("order_id", id);
      if (delErr) { toast.error("Failed to update line items", { description: delErr.message }); return; }
      if (updates.lines.length > 0) {
        const lineRows = updates.lines.map(l => ({
          order_id: id,
          product_id: l.productId,
          product_name: l.productName,
          quantity: l.quantity,
          unit_price: l.unitPrice,
          line_total: l.lineTotal,
        }));
        const { error: insErr } = await supabase.from("order_lines").insert(lineRows);
        if (insErr) { toast.error("Failed to insert line items", { description: insErr.message }); return; }
      }

      // Update order_schemes: delete old and re-insert if appliedSchemes provided
      await supabase.from("order_schemes").delete().eq("order_id", id);
      if (updates.appliedSchemes && updates.appliedSchemes.length > 0) {
        const schemeRows = updates.appliedSchemes.map(s => ({
          order_id: id,
          scheme_id: s.schemeId || null,
          scheme_name: s.schemeName,
          scheme_label: s.schemeLabel || "",
          savings: s.savings,
        }));
        await supabase.from("order_schemes").insert(schemeRows);
      }
    }

    const godownId = updates.godownId || currentOrder?.godownId;
    if (
      previousDelivery === "pending" &&
      (newDelivery === "dispatched" || newDelivery === "delivered") &&
      godownId && currentOrder && companyId
    ) {
      const linesToUse = updates.lines || currentOrder.lines;
      await deductStockForOrder(id, linesToUse, godownId, companyId);
    }

    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, [companyId, deductStockForOrder, persistEntityToCache]);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    if (!navigator.onLine) {
      toast.error("Cannot delete orders while offline", {
        description: "Please reconnect to delete orders.",
      });
      return false;
    }

    try {
      const { error: sdErr } = await supabase.from("stock_deductions").delete().eq("order_id", id);
      if (sdErr) throw sdErr;
      const { error: osErr } = await supabase.from("order_schemes").delete().eq("order_id", id);
      if (osErr) throw osErr;
      const { error: olErr } = await supabase.from("order_lines").delete().eq("order_id", id);
      if (olErr) throw olErr;
      const { data: deleted, error: oErr } = await supabase.from("orders").delete().eq("id", id).select("id");
      if (oErr) throw oErr;
      if (!deleted || deleted.length === 0) {
        throw new Error("Order could not be deleted — you may not have permission.");
      }
      setOrders(prev => prev.filter(o => o.id !== id));
      await safeRefetchStockItems();
      return true;
    } catch (err: any) {
      toast.error("Failed to delete order", { description: err?.message || "Unknown error" });
      return false;
    }
  }, [safeRefetchStockItems]);

  // --- Generic offline-aware CRUD wrapper for simple entities ---
  function makeOfflineCrud<T extends { id: string }>(
    table: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    cacheEntity: CacheableEntity,
    toDbInsert: (item: T) => Record<string, any>,
    toDbUpdate: (item: T) => Record<string, any>,
  ) {
    const add = async (item: T) => {
      if (!companyId) return;
      if (!navigator.onLine) {
        const tempId = crypto.randomUUID();
        setter(prev => {
          const updated = [...prev, { ...item, id: tempId }];
          persistEntityToCache(cacheEntity, updated);
          return updated;
        });
        await enqueueMutation({ type: "insert", table, clientTempId: tempId, payload: { ...toDbInsert(item), company_id: companyId } });
        toast("Saved offline — will sync when back online", { duration: 3000 });
        return;
      }
      const { data, error } = await supabase.from(table as any).insert({ ...toDbInsert(item), company_id: companyId }).select().single();
      if (error) { toast.error(`Failed to add ${table}`, { description: error.message }); return; }
      if (data) setter(prev => [...prev, { ...item, id: (data as any).id }]);
    };

    const update = async (item: T) => {
      if (!navigator.onLine) {
        setter(prev => {
          const updated = prev.map(x => x.id === item.id ? item : x);
          persistEntityToCache(cacheEntity, updated);
          return updated;
        });
        await enqueueMutation({ type: "update", table, payload: { id: item.id, ...toDbUpdate(item) } });
        toast("Saved offline — will sync when back online", { duration: 3000 });
        return;
      }
      const { error } = await supabase.from(table as any).update(toDbUpdate(item)).eq("id", item.id);
      if (error) { toast.error(`Failed to update ${table}`, { description: error.message }); return; }
      setter(prev => prev.map(x => x.id === item.id ? item : x));
    };

    const remove = async (id: string) => {
      if (!navigator.onLine) {
        setter(prev => {
          const updated = prev.filter(x => x.id !== id);
          persistEntityToCache(cacheEntity, updated);
          return updated;
        });
        await enqueueMutation({ type: "delete", table, payload: { id } });
        toast("Saved offline — will sync when back online", { duration: 3000 });
        return;
      }
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) { toast.error(`Failed to delete ${table}`, { description: error.message }); return; }
      setter(prev => prev.filter(x => x.id !== id));
    };

    return { add, update, remove };
  }

  // Distributors
  const distCrud = useMemo(() => makeOfflineCrud<Distributor>(
    "distributors", setDistributors, "distributors",
    d => ({ name: sanitizeInput(d.name), location: sanitizeInput(d.location), contact: sanitizeInput(d.contact), credit_limit: d.creditLimit || 0, email: sanitizeInput(d.email || ""), address: sanitizeInput(d.address || ""), gstin: sanitizeInput(d.gstin || ""), pan: sanitizeInput(d.pan || ""), state_code: sanitizeInput(d.stateCode || ""), bank_name: sanitizeInput(d.bankName || ""), bank_account_name: sanitizeInput(d.bankAccountName || ""), bank_account: sanitizeInput(d.bankAccount || ""), bank_ifsc: sanitizeInput(d.bankIfsc || "") }),
    d => ({ name: sanitizeInput(d.name), location: sanitizeInput(d.location), contact: sanitizeInput(d.contact), credit_limit: d.creditLimit || 0, email: sanitizeInput(d.email || ""), address: sanitizeInput(d.address || ""), gstin: sanitizeInput(d.gstin || ""), pan: sanitizeInput(d.pan || ""), state_code: sanitizeInput(d.stateCode || ""), bank_name: sanitizeInput(d.bankName || ""), bank_account_name: sanitizeInput(d.bankAccountName || ""), bank_account: sanitizeInput(d.bankAccount || ""), bank_ifsc: sanitizeInput(d.bankIfsc || "") }),
  ), [companyId, persistEntityToCache]);

  // Salespersons
  const spCrud = useMemo(() => makeOfflineCrud<Salesperson>(
    "salespersons", setSalespersons, "salespersons",
    s => ({ name: sanitizeInput(s.name), phone: sanitizeInput(s.phone), email: sanitizeInput(s.email), region: sanitizeInput(s.region) }),
    s => ({ name: sanitizeInput(s.name), phone: sanitizeInput(s.phone), email: sanitizeInput(s.email), region: sanitizeInput(s.region) }),
  ), [companyId, persistEntityToCache]);

  // Products
  const prodCrud = useMemo(() => makeOfflineCrud<Product>(
    "products", setProducts, "products",
    p => ({ name: sanitizeInput(p.name), sku: sanitizeInput(p.sku), unit: sanitizeInput(p.unit), base_price: p.basePrice }),
    p => ({ name: sanitizeInput(p.name), sku: sanitizeInput(p.sku), unit: sanitizeInput(p.unit), base_price: p.basePrice }),
  ), [companyId, persistEntityToCache]);

  // Locations (Godowns)
  const locCrud = useMemo(() => makeOfflineCrud<GodownLocation>(
    "godowns", setLocations, "locations",
    l => ({ name: sanitizeInput(l.name), address: sanitizeInput(l.address), is_active: l.isActive }),
    l => ({ name: sanitizeInput(l.name), address: sanitizeInput(l.address), is_active: l.isActive }),
  ), [companyId, persistEntityToCache]);

  // Schemes
  const schemeCrud = useMemo(() => makeOfflineCrud<Scheme>(
    "schemes", setSchemes, "schemes",
    s => ({
      name: sanitizeInput(s.name), description: sanitizeInput(s.description),
      scheme_type: s.schemeType, discount_percent: s.discountPercent,
      buy_qty: s.buyQty, free_qty: s.freeQty, flat_amount: s.flatAmount,
      min_order_value: s.minOrderValue, min_qty: s.minQty,
      product_id: s.productId || null, dealer_id: s.dealerId || null,
      is_active: s.isActive, valid_from: s.validFrom, valid_until: s.validUntil || null,
    }),
    s => ({
      name: sanitizeInput(s.name), description: sanitizeInput(s.description),
      scheme_type: s.schemeType, discount_percent: s.discountPercent,
      buy_qty: s.buyQty, free_qty: s.freeQty, flat_amount: s.flatAmount,
      min_order_value: s.minOrderValue, min_qty: s.minQty,
      product_id: s.productId || null, dealer_id: s.dealerId || null,
      is_active: s.isActive, valid_from: s.validFrom, valid_until: s.validUntil || null,
    }),
  ), [companyId, persistEntityToCache]);

  // Stock Items — special (upsert online, upsert-type offline)
  const addStockItem = useCallback(async (si: StockItem) => {
    if (!companyId) return;
    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      setStockItems(prev => {
        const updated = [...prev, { ...si, id: tempId }];
        persistEntityToCache("stockItems", updated);
        return updated;
      });
      await enqueueMutation({
        type: "upsert", table: "stock_items",
        clientTempId: tempId,
        payload: {
          _onConflict: "company_id,product_id,godown_id",
          company_id: companyId, product_id: si.productId, godown_id: si.godownId,
          quantity: si.quantity, threshold: si.threshold, last_deducted_date: si.lastDeductedDate,
        },
      });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    const { data, error } = await supabase.from("stock_items").upsert({
      company_id: companyId, product_id: si.productId, godown_id: si.godownId,
      quantity: si.quantity, threshold: si.threshold, last_deducted_date: si.lastDeductedDate,
    }, { onConflict: "company_id,product_id,godown_id" }).select().single();
    if (error) { toast.error("Failed to add stock item", { description: error.message }); return; }
    if (data) {
      setStockItems(prev => {
        const exists = prev.some(x => x.id === data.id);
        if (exists) return prev.map(x => x.id === data.id ? { ...si, id: data.id } : x);
        return [...prev, { ...si, id: data.id }];
      });
    }
  }, [companyId, persistEntityToCache]);

  const updateStockItem = useCallback(async (si: StockItem) => {
    if (!navigator.onLine) {
      setStockItems(prev => {
        const updated = prev.map(x => x.id === si.id ? si : x);
        persistEntityToCache("stockItems", updated);
        return updated;
      });
      await enqueueMutation({
        type: "update", table: "stock_items",
        payload: { id: si.id, quantity: si.quantity, threshold: si.threshold, last_deducted_date: si.lastDeductedDate },
      });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    const { error } = await supabase.from("stock_items").update({
      quantity: si.quantity, threshold: si.threshold,
      last_deducted_date: si.lastDeductedDate,
    }).eq("id", si.id);
    if (error) { toast.error("Failed to update stock item", { description: error.message }); return; }
    setStockItems(prev => prev.map(x => x.id === si.id ? si : x));
  }, [persistEntityToCache]);

  const deleteStockItemFn = useCallback(async (id: string) => {
    if (!navigator.onLine) {
      setStockItems(prev => {
        const updated = prev.filter(x => x.id !== id);
        persistEntityToCache("stockItems", updated);
        return updated;
      });
      await enqueueMutation({ type: "delete", table: "stock_items", payload: { id } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    const { error } = await supabase.from("stock_items").delete().eq("id", id);
    if (error) { toast.error("Failed to delete stock item", { description: error.message }); return; }
    setStockItems(prev => prev.filter(x => x.id !== id));
  }, [persistEntityToCache]);

  // Prefix update
  const setOrderPrefix = useCallback(async (prefix: string) => {
    if (!companyId) return;
    setOrderPrefixState(prefix);
    if (!navigator.onLine) {
      persistEntityToCache("orderPrefix", prefix);
      await enqueueMutation({ type: "update", table: "companies", payload: { id: companyId, order_prefix: prefix } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    await supabase.from("companies").update({ order_prefix: prefix }).eq("id", companyId);
  }, [companyId, persistEntityToCache]);

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

  // Secondary Sales CRUD
  const addSecondarySale = useCallback(async (sale: SecondarySale) => {
    if (!companyId) return;
    const { data, error } = await supabase.from("secondary_sales").insert({
      company_id: companyId,
      distributor_id: sale.distributorId,
      product_id: sale.productId,
      product_name: sanitizeInput(sale.productName),
      retailer_name: sanitizeInput(sale.retailerName),
      quantity: sale.quantity,
      date: sale.date,
      remarks: sanitizeInput(sale.remarks),
    } as any).select().single();
    if (error) { toast.error("Failed to record secondary sale", { description: error.message }); return; }
    if (data) {
      const mapped: SecondarySale = {
        id: (data as any).id, distributorId: sale.distributorId, productId: sale.productId,
        productName: sale.productName, retailerName: sale.retailerName,
        quantity: sale.quantity, date: sale.date, remarks: sale.remarks,
      };
      setSecondarySales(prev => [mapped, ...prev]);
    }
  }, [companyId]);

  const deleteSecondarySale = useCallback(async (id: string) => {
    const { error } = await supabase.from("secondary_sales").delete().eq("id", id);
    if (error) { toast.error("Failed to delete secondary sale", { description: error.message }); return; }
    setSecondarySales(prev => prev.filter(s => s.id !== id));
  }, []);

  // Targets CRUD
  const addTarget = useCallback(async (target: Target) => {
    if (!companyId) return;
    const { data, error } = await supabase.from("targets").insert({
      company_id: companyId,
      entity_type: target.entityType,
      entity_id: target.entityId,
      entity_name: sanitizeInput(target.entityName),
      period_type: target.periodType,
      period_start: target.periodStart,
      target_revenue: target.targetRevenue,
      target_orders: target.targetOrders,
    } as any).select().single();
    if (error) { toast.error("Failed to save target", { description: error.message }); return; }
    if (data) {
      const mapped: Target = {
        id: (data as any).id, entityType: target.entityType, entityId: target.entityId,
        entityName: target.entityName, periodType: target.periodType, periodStart: target.periodStart,
        targetRevenue: target.targetRevenue, targetOrders: target.targetOrders,
      };
      setTargets(prev => [mapped, ...prev]);
    }
  }, [companyId]);

  const updateTarget = useCallback(async (target: Target) => {
    const { error } = await supabase.from("targets").update({
      target_revenue: target.targetRevenue,
      target_orders: target.targetOrders,
      entity_name: sanitizeInput(target.entityName),
    } as any).eq("id", target.id);
    if (error) { toast.error("Failed to update target", { description: error.message }); return; }
    setTargets(prev => prev.map(t => t.id === target.id ? target : t));
  }, []);

  const deleteTarget = useCallback(async (id: string) => {
    const { error } = await supabase.from("targets").delete().eq("id", id);
    if (error) { toast.error("Failed to delete target", { description: error.message }); return; }
    setTargets(prev => prev.filter(t => t.id !== id));
  }, []);

  // Claims CRUD
  const addClaim = useCallback(async (claim: Claim): Promise<boolean> => {
    if (!companyId) return false;
    try {
      const { data, error } = await supabase.from("claims" as any).insert({
        company_id: companyId,
        order_id: claim.orderId,
        order_number: claim.orderNumber,
        distributor_id: claim.distributorId,
        distributor_name: sanitizeInput(claim.distributorName),
        claim_type: claim.claimType,
        status: "open",
        reason: sanitizeInput(claim.reason),
        restore_stock: claim.restoreStock,
        total_claim_value: claim.totalClaimValue,
      }).select().single();
      if (error) throw error;
      const claimId = (data as any).id;

      if (claim.lines.length > 0) {
        const { error: linesErr } = await supabase.from("claim_lines" as any).insert(
          claim.lines.map(l => ({
            claim_id: claimId,
            product_id: l.productId,
            product_name: sanitizeInput(l.productName),
            quantity: l.quantity,
            unit_price: l.unitPrice,
            line_total: l.lineTotal,
          }))
        );
        if (linesErr) throw linesErr;
      }

      // Restore stock if requested
      if (claim.restoreStock) {
        const order = orders.find(o => o.id === claim.orderId);
        const godownId = order?.godownId;
        if (godownId) {
          for (const line of claim.lines) {
            const { data: siData } = await supabase.from("stock_items").select("*")
              .eq("company_id", companyId).eq("product_id", line.productId).eq("godown_id", godownId).single();
            if (siData) {
              await supabase.from("stock_items").update({ quantity: siData.quantity + line.quantity } as any).eq("id", siData.id);
            }
          }
          await safeRefetchStockItems();
        }
      }

      const newClaim: Claim = { ...claim, id: claimId, status: "open", createdAt: new Date().toISOString(), resolvedAt: null };
      setClaims(prev => [newClaim, ...prev]);
      return true;
    } catch (err: any) {
      toast.error("Failed to record claim", { description: err?.message || "Unknown error" });
      return false;
    }
  }, [companyId, orders, safeRefetchStockItems]);

  const updateClaim = useCallback(async (id: string, updates: Partial<Claim>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.resolutionNotes !== undefined) dbUpdates.resolution_notes = sanitizeInput(updates.resolutionNotes);
    if (updates.status === "resolved") dbUpdates.resolved_at = new Date().toISOString();

    const { error } = await supabase.from("claims" as any).update(dbUpdates).eq("id", id);
    if (error) { toast.error("Failed to update claim", { description: error.message }); return; }
    setClaims(prev => prev.map(c => c.id === id ? { ...c, ...updates, resolvedAt: updates.status === "resolved" ? new Date().toISOString() : c.resolvedAt } : c));
  }, []);

  // Invoice CRUD
  const addInvoice = useCallback(async (invoice: Omit<Invoice, "id" | "invoiceNumber" | "createdAt">): Promise<Invoice | null> => {
    if (!companyId) return null;
    try {
      // Get atomic invoice number
      const { data: seqData, error: seqErr } = await supabase.rpc("get_next_invoice_number", { target_company_id: companyId });
      if (seqErr) throw seqErr;
      const seq = Array.isArray(seqData) ? seqData[0] : seqData;
      const invoiceNumber = `${seq.prefix}-${new Date().getFullYear()}-${String(seq.seq).padStart(4, "0")}`;

      const { data, error } = await supabase.from("invoices" as any).insert({
        company_id: companyId,
        doc_type: invoice.docType,
        invoice_number: invoiceNumber,
        invoice_date: invoice.invoiceDate,
        source_order_id: invoice.sourceOrderId || null,
        buyer_name: sanitizeInput(invoice.buyerName),
        buyer_address: sanitizeInput(invoice.buyerAddress),
        buyer_gstin: sanitizeInput(invoice.buyerGstin),
        buyer_state_code: sanitizeInput(invoice.buyerStateCode),
        seller_name: sanitizeInput(invoice.sellerName),
        seller_address: sanitizeInput(invoice.sellerAddress),
        seller_gstin: sanitizeInput(invoice.sellerGstin),
        seller_pan: sanitizeInput(invoice.sellerPan),
        seller_state_code: sanitizeInput(invoice.sellerStateCode),
        seller_phone: sanitizeInput(invoice.sellerPhone),
        seller_email: sanitizeInput(invoice.sellerEmail),
        seller_bank_name: sanitizeInput(invoice.sellerBankName),
        seller_bank_account: sanitizeInput(invoice.sellerBankAccount),
        seller_bank_ifsc: sanitizeInput(invoice.sellerBankIfsc),
        seller_logo_url: invoice.sellerLogoUrl || "",
        supply_type: invoice.supplyType,
        gst_rate: invoice.gstRate,
        subtotal: invoice.subtotal,
        cgst_amount: invoice.cgstAmount,
        sgst_amount: invoice.sgstAmount,
        igst_amount: invoice.igstAmount,
        total_tax: invoice.totalTax,
        grand_total: invoice.grandTotal,
        round_off: invoice.roundOff,
        amount_in_words: invoice.amountInWords,
        notes: sanitizeInput(invoice.notes),
        status: invoice.status,
      }).select().single();
      if (error) throw error;

      const invId = (data as any).id;

      // Insert lines
      if (invoice.lines.length > 0) {
        const { error: lErr } = await supabase.from("invoice_lines" as any).insert(
          invoice.lines.map(l => ({
            invoice_id: invId,
            product_name: sanitizeInput(l.productName),
            hsn_code: sanitizeInput(l.hsnCode),
            quantity: l.quantity,
            unit: l.unit,
            unit_price: l.unitPrice,
            taxable_value: l.taxableValue,
          }))
        );
        if (lErr) throw lErr;
      }

      const newInvoice: Invoice = {
        ...invoice,
        id: invId,
        invoiceNumber,
        createdAt: new Date().toISOString(),
      };
      setInvoices(prev => [newInvoice, ...prev]);
      return newInvoice;
    } catch (err: any) {
      toast.error("Failed to create document", { description: err?.message || "Unknown error" });
      return null;
    }
  }, [companyId]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.notes !== undefined) dbUpdates.notes = sanitizeInput(updates.notes);

    const { error } = await supabase.from("invoices" as any).update(dbUpdates).eq("id", id);
    if (error) { toast.error("Failed to update document", { description: error.message }); return; }
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (inv?.status === "final") {
      toast.error("Cannot delete finalized document");
      return;
    }
    const { error } = await supabase.from("invoices" as any).delete().eq("id", id);
    if (error) { toast.error("Failed to delete document", { description: error.message }); return; }
    setInvoices(prev => prev.filter(i => i.id !== id));
  }, [invoices]);

  const refreshAll = useCallback(async () => {
    if (!companyId) return;
    const token = ++fetchTokenRef.current;
    await fetchAll(companyId, token);
  }, [companyId, fetchAll]);

  return (
    <DataContext.Provider
       value={{
        orders, distributors: computedDistributors, salespersons: computedSalespersons,
        products: computedProducts, locations, stockItems, schemes, loading, isOfflineData,
        companyInfo,
        orderPrefix, orderSequence, setOrderPrefix,
        addOrder, updateOrder, deleteOrder,
        addDistributor: distCrud.add, updateDistributor: distCrud.update, deleteDistributor: distCrud.remove,
        addSalesperson: spCrud.add, updateSalesperson: spCrud.update, deleteSalesperson: spCrud.remove,
        addProduct: prodCrud.add, updateProduct: prodCrud.update, deleteProduct: prodCrud.remove,
        addLocation: locCrud.add, updateLocation: locCrud.update, deleteLocation: locCrud.remove,
        addStockItem, updateStockItem, deleteStockItem: deleteStockItemFn, setStockItems,
        addScheme: schemeCrud.add, updateScheme: schemeCrud.update, deleteScheme: schemeCrud.remove,
        secondarySales, addSecondarySale, deleteSecondarySale,
        targets, addTarget, updateTarget, deleteTarget,
        claims, addClaim, updateClaim,
        invoices, addInvoice, updateInvoice, deleteInvoice,
        nextOrderNumber, previewOrderNumber, refreshAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
