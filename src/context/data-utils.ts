import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderLine, OrderScheme, Distributor, Salesperson, Product, Scheme } from "@/data/mock-data";
import type { GodownLocation, StockItem } from "@/data/godown-data";
import type { SecondarySale, Target, Claim, ClaimLine, Invoice, InvoiceLine } from "./data-types";
import { cacheData, enqueueMutation, type CacheableEntity } from "@/lib/offline-store";
import { sanitizeInput } from "@/utils/sanitize";
import { toast } from "sonner";

// --- Map DB rows to app types ---

export function mapOrders(ordersData: any[], allLines: any[], allOrderSchemes: any[] = []): Order[] {
  return ordersData.map(o => {
    const oLines: OrderLine[] = allLines
      .filter(l => l.order_id === o.id)
      .map(l => ({
        productId: l.product_id, productName: l.product_name,
        quantity: l.quantity, unitPrice: Number(l.unit_price), lineTotal: Number(l.line_total),
      }));
    const oSchemes: OrderScheme[] = allOrderSchemes
      .filter(s => s.order_id === o.id)
      .map(s => ({
        schemeId: s.scheme_id || null, schemeName: s.scheme_name,
        schemeLabel: s.scheme_label || "", savings: Number(s.savings || 0),
      }));
    return {
      id: o.id, orderNumber: o.order_number, date: o.date,
      distributorId: o.distributor_id, distributorName: o.distributor_name,
      salespersonId: o.salesperson_id, salesperson: o.salesperson_name,
      lines: oLines, total: Number(o.total),
      paymentMode: o.payment_mode as Order["paymentMode"],
      paymentStatus: o.payment_status as Order["paymentStatus"],
      dispatchDate: o.dispatch_date, vehicle: o.vehicle, driverName: o.driver_name,
      deliveryStatus: o.delivery_status as Order["deliveryStatus"],
      dispatchRemarks: o.dispatch_remarks, godownId: o.godown_id || undefined,
      schemeSavings: Number(o.scheme_savings || 0), appliedSchemes: oSchemes,
    };
  });
}

export function mapDistributor(d: any): Distributor {
  return {
    id: d.id, name: d.name, location: d.location, contact: d.contact,
    email: d.email || "", address: d.address || "",
    gstin: d.gstin || "", pan: d.pan || "", stateCode: d.state_code || "",
    bankName: d.bank_name || "", bankAccountName: d.bank_account_name || "",
    bankAccount: d.bank_account || "", bankIfsc: d.bank_ifsc || "",
    totalOrders: d.total_orders ?? 0, totalValue: Number(d.total_value ?? 0),
    creditLimit: Number(d.credit_limit ?? 0), outstandingAmount: Number(d.outstanding_amount ?? 0),
  };
}

export function mapSalesperson(s: any): Salesperson {
  return { id: s.id, name: s.name, phone: s.phone, email: s.email, region: s.region, totalOrders: s.total_orders ?? 0, totalValue: Number(s.total_value ?? 0) };
}

export function mapProduct(p: any): Product {
  return { id: p.id, name: p.name, sku: p.sku, unit: p.unit, basePrice: Number(p.base_price), totalSold: p.total_sold ?? 0 };
}

export function mapGodown(g: any): GodownLocation {
  return { id: g.id, name: g.name, address: g.address, isActive: g.is_active };
}

export function mapStockItem(si: any, prods: Product[], gds: GodownLocation[]): StockItem {
  const prod = prods.find(p => p.id === si.product_id);
  const gd = gds.find(g => g.id === si.godown_id);
  return {
    id: si.id, productId: si.product_id, godownId: si.godown_id,
    productName: prod?.name || "", sku: prod?.sku || "", unit: prod?.unit || "",
    godownName: gd?.name || "", quantity: si.quantity, threshold: si.threshold,
    basePrice: prod?.basePrice || 0, lastDeductedDate: si.last_deducted_date,
  };
}

export function mapScheme(s: any): Scheme {
  return {
    id: s.id, name: s.name, description: s.description || "",
    schemeType: s.scheme_type as Scheme["schemeType"],
    discountPercent: Number(s.discount_percent || 0), buyQty: s.buy_qty || 0, freeQty: s.free_qty || 0,
    flatAmount: Number(s.flat_amount || 0), minOrderValue: Number(s.min_order_value || 0), minQty: s.min_qty || 0,
    productId: s.product_id || null, dealerId: s.dealer_id || null,
    isActive: s.is_active, validFrom: s.valid_from, validUntil: s.valid_until || null,
  };
}

export function mapSecondarySale(s: any): SecondarySale {
  return {
    id: s.id, distributorId: s.distributor_id, productId: s.product_id,
    productName: s.product_name || "", retailerName: s.retailer_name || "",
    quantity: s.quantity || 0, date: s.date, remarks: s.remarks || "",
  };
}

export function mapTarget(t: any): Target {
  return {
    id: t.id, entityType: t.entity_type as Target["entityType"],
    entityId: t.entity_id, entityName: t.entity_name || "",
    periodType: t.period_type as Target["periodType"], periodStart: t.period_start,
    targetRevenue: Number(t.target_revenue || 0), targetOrders: t.target_orders || 0,
  };
}

export function mapClaim(c: any, claimLines: any[]): Claim {
  return {
    id: c.id, orderId: c.order_id, orderNumber: c.order_number || "",
    distributorId: c.distributor_id, distributorName: c.distributor_name || "",
    claimType: c.claim_type as Claim["claimType"], status: c.status as Claim["status"],
    reason: c.reason || "", resolutionNotes: c.resolution_notes || "",
    restoreStock: c.restore_stock || false, totalClaimValue: Number(c.total_claim_value || 0),
    lines: claimLines
      .filter((cl: any) => cl.claim_id === c.id)
      .map((cl: any) => ({
        productId: cl.product_id, productName: cl.product_name || "",
        quantity: cl.quantity || 0, unitPrice: Number(cl.unit_price || 0),
        lineTotal: Number(cl.line_total || 0),
      })),
    createdAt: c.created_at, resolvedAt: c.resolved_at || null,
  };
}

export function mapInvoice(inv: any, invoiceLines: any[]): Invoice {
  return {
    id: inv.id, docType: inv.doc_type, invoiceNumber: inv.invoice_number,
    invoiceDate: inv.invoice_date, sourceOrderId: inv.source_order_id || undefined,
    buyerName: inv.buyer_name || "", buyerAddress: inv.buyer_address || "",
    buyerGstin: inv.buyer_gstin || "", buyerStateCode: inv.buyer_state_code || "",
    sellerName: inv.seller_name || "", sellerAddress: inv.seller_address || "",
    sellerGstin: inv.seller_gstin || "", sellerPan: inv.seller_pan || "",
    sellerStateCode: inv.seller_state_code || "", sellerPhone: inv.seller_phone || "",
    sellerEmail: inv.seller_email || "", sellerBankName: inv.seller_bank_name || "",
    sellerBankAccountName: (inv as any).seller_bank_account_name || "",
    sellerBankAccount: inv.seller_bank_account || "", sellerBankIfsc: inv.seller_bank_ifsc || "",
    sellerLogoUrl: inv.seller_logo_url || "",
    supplyType: inv.supply_type as Invoice["supplyType"],
    gstRate: Number(inv.gst_rate || 0), subtotal: Number(inv.subtotal || 0),
    cgstAmount: Number(inv.cgst_amount || 0), sgstAmount: Number(inv.sgst_amount || 0),
    igstAmount: Number(inv.igst_amount || 0), totalTax: Number(inv.total_tax || 0),
    grandTotal: Number(inv.grand_total || 0), roundOff: Number(inv.round_off || 0),
    amountInWords: inv.amount_in_words || "", notes: inv.notes || "",
    status: inv.status as Invoice["status"],
    lines: invoiceLines
      .filter((l: any) => l.invoice_id === inv.id)
      .map((l: any) => ({
        productName: l.product_name || "", hsnCode: l.hsn_code || "",
        quantity: l.quantity || 0, unit: l.unit || "Pack",
        unitPrice: Number(l.unit_price || 0), taxableValue: Number(l.taxable_value || 0),
      })),
    createdAt: inv.created_at,
  };
}

// --- Persist helpers ---

export function persistAllToCache(
  companyId: string,
  data: {
    orders: Order[]; distributors: Distributor[]; salespersons: Salesperson[];
    products: Product[]; locations: GodownLocation[]; stockItems: StockItem[];
    schemes: Scheme[]; orderPrefix: string; orderSequence: number;
  }
) {
  const entries: [CacheableEntity, any][] = [
    ["orders", data.orders], ["distributors", data.distributors],
    ["salespersons", data.salespersons], ["products", data.products],
    ["locations", data.locations], ["stockItems", data.stockItems],
    ["schemes", data.schemes], ["orderPrefix", data.orderPrefix],
    ["orderSequence", data.orderSequence],
  ];
  entries.forEach(([k, v]) => cacheData(companyId, k, v));
}

// --- Batch IN queries ---

export async function batchIn(table: string, column: string, ids: string[]) {
  if (ids.length === 0) return [];
  const CHUNK = 500;
  const results: any[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data } = await supabase.from(table as any).select("*").in(column, chunk) as any;
    if (data) results.push(...data);
  }
  return results;
}

// --- Generic offline-aware CRUD factory ---

export function makeOfflineCrud<T extends { id: string }>(
  deps: {
    companyId: string | null;
    persistEntityToCache: (entity: CacheableEntity, data: any) => void;
    log: (entityType: string, entityId: string, action: string, summary: string, metadata?: Record<string, any>) => void;
  },
  table: string,
  setter: React.Dispatch<React.SetStateAction<T[]>>,
  cacheEntity: CacheableEntity,
  toDbRow: (item: T) => Record<string, any>,
  entityLogType?: string,
  getLabel?: (item: T) => string,
  options?: { allowOfflineDelete?: boolean },
) {
  const { companyId, persistEntityToCache, log } = deps;
  const allowOfflineDelete = options?.allowOfflineDelete !== false; // default true

  const add = async (item: T) => {
    if (!companyId) return;
    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      setter(prev => {
        const updated = [...prev, { ...item, id: tempId }];
        persistEntityToCache(cacheEntity, updated);
        return updated;
      });
      await enqueueMutation({ type: "insert", table, clientTempId: tempId, payload: { ...toDbRow(item), company_id: companyId } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    const { data, error } = await supabase.from(table as any).insert({ ...toDbRow(item), company_id: companyId }).select().single();
    if (error) { toast.error(`Failed to add ${table}`, { description: error.message }); return; }
    if (data) {
      const newId = (data as any).id;
      setter(prev => [...prev, { ...item, id: newId }]);
      if (entityLogType) log(entityLogType, newId, "created", `Added ${getLabel?.(item) || table}`);
    }
  };

  const update = async (item: T) => {
    if (!navigator.onLine) {
      setter(prev => {
        const updated = prev.map(x => x.id === item.id ? item : x);
        persistEntityToCache(cacheEntity, updated);
        return updated;
      });
      await enqueueMutation({ type: "update", table, payload: { id: item.id, ...toDbRow(item) } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return;
    }
    const { error } = await supabase.from(table as any).update(toDbRow(item)).eq("id", item.id);
    if (error) { toast.error(`Failed to update ${table}`, { description: error.message }); return; }
    setter(prev => prev.map(x => x.id === item.id ? item : x));
    if (entityLogType) log(entityLogType, item.id, "updated", `Updated ${getLabel?.(item) || table}`);
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
    if (entityLogType) log(entityLogType, id, "deleted", `Deleted ${entityLogType}`);
  };

  return { add, update, remove };
}
