import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderLine, OrderScheme, Distributor, Salesperson, Product, Scheme } from "@/data/mock-data";
import type { GodownLocation, StockItem } from "@/data/godown-data";
import type { SecondarySale, Target, Claim, ClaimLine, Invoice, InvoiceLine } from "./data-types";
import { cacheData, enqueueMutation, type CacheableEntity } from "@/lib/offline-store";
import { sanitizeInput } from "@/utils/sanitize";
import { toast } from "sonner";
import { logError } from "@/utils/errorLog";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

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
      deliveredAt: o.delivered_at || null,
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
  return { id: p.id, name: p.name, sku: p.sku, unit: p.unit, basePrice: Number(p.base_price), hsnCode: p.hsn_code || "", totalSold: p.total_sold ?? 0 };
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
    vehicle: inv.vehicle || "",
    driverName: inv.driver_name || "",
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

// Once-per-session dedupe so we don't spam the user with the same warning on
// every refetch. Cleared on page reload.
const paginationWarnedKeys = new Set<string>();
const truncationWarnedKeys = new Set<string>();

function warnPaginationOnce(key: string, detail: string) {
  if (paginationWarnedKeys.has(key)) return;
  paginationWarnedKeys.add(key);
  logError({
    source: `pagination:${key}`,
    error: `Pagination needed: ${detail}`,
    severity: "info",
    context: { key, detail },
  });
}

function warnTruncationOnce(key: string, detail: string) {
  if (truncationWarnedKeys.has(key)) return;
  truncationWarnedKeys.add(key);
  toast.warning("Some records may be missing", {
    description: `${key} hit the safety cap (${detail}). Reports and totals on this page may be incomplete — please contact support.`,
    duration: 12000,
  });
  logError({
    source: `truncation:${key}`,
    error: `Query truncated at safety cap: ${detail}`,
    severity: "warning",
    context: { key, detail },
  });
}

export async function batchIn(table: string, column: string, ids: string[]) {
  if (ids.length === 0) return [];
  const ID_CHUNK = 500;
  const PAGE = 1000;
  const MAX_PAGES = 200; // safety cap: 200k rows per id-chunk
  const PAGE_CONCURRENCY = 4;  // pages fetched in parallel within an id-chunk
  const CHUNK_CONCURRENCY = 4; // id-chunks fetched in parallel

  // Build id-chunks
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) chunks.push(ids.slice(i, i + ID_CHUNK));
  const totalChunks = chunks.length;

  let truncated = false;
  let totalPages = 0;

  // Fetch all pages for one id-chunk in waves of PAGE_CONCURRENCY. We don't know
  // up-front how many pages exist, so each wave fires N speculative range
  // requests at once. The wave loop stops as soon as any page returns < PAGE
  // rows (the natural end of the result set), preserving the early-exit
  // semantics of the previous sequential implementation while collapsing
  // round-trip latency.
  async function fetchChunk(chunk: string[]): Promise<any[]> {
    const chunkRows: any[] = [];
    let done = false;
    for (let wave = 0; wave < MAX_PAGES && !done; wave += PAGE_CONCURRENCY) {
      const waveSize = Math.min(PAGE_CONCURRENCY, MAX_PAGES - wave);
      const pages = await Promise.all(
        Array.from({ length: waveSize }, async (_, k) => {
          const page = wave + k;
          const from = page * PAGE;
          const to = from + PAGE - 1;
          const { data, error } = await supabase
            .from(table as any)
            .select("*")
            .in(column, chunk)
            .range(from, to) as any;
          if (error) throw error;
          return (data || []) as any[];
        }),
      );
      // Preserve order: append pages in request order, stop at the first short
      // page within this wave so we never count rows past the natural end.
      for (const rows of pages) {
        chunkRows.push(...rows);
        totalPages++;
        if (rows.length < PAGE) {
          done = true;
          break;
        }
      }
      // Safety cap: if we just finished the final wave and the last page was
      // still full, the result set is larger than we're willing to fetch.
      if (!done && wave + waveSize >= MAX_PAGES) truncated = true;
    }
    return chunkRows;
  }

  // Fetch id-chunks in parallel, capped at CHUNK_CONCURRENCY to avoid hammering
  // PostgREST. Results are pushed in completion order — caller code already
  // joins by id, never assumes order.
  const results: any[] = [];
  for (let i = 0; i < chunks.length; i += CHUNK_CONCURRENCY) {
    const slice = chunks.slice(i, i + CHUNK_CONCURRENCY);
    const settled = await Promise.all(slice.map(fetchChunk));
    for (const rows of settled) results.push(...rows);
  }

  if (truncated) {
    warnTruncationOnce(
      `${table}.${column}`,
      `>${MAX_PAGES * PAGE} rows per id-chunk`,
    );
  } else if (totalPages > 1 || totalChunks > 1) {
    warnPaginationOnce(
      `${table}.${column}`,
      `${ids.length} ids in ${totalChunks} chunk(s), ${results.length} rows across ${totalPages} page(s)`,
    );
  }
  return results;
}

// --- Chunked full-table fetch ---
//
// Supabase silently caps any single SELECT at 1000 rows. We need every row for
// the in-memory DataContext, so we page through the result set 1000 rows at a
// time using `.range(from, to)` until we get a short page. Pass a `build`
// function that returns the base query (filters + ordering applied) — we'll
// add the range each iteration. `label` identifies the query in warnings.
export async function fetchAllChunked<T = any>(
  build: () => any,
  pageSize = 1000,
  maxPages = 200, // safety cap: 200 * 1000 = 200k rows per table
  label?: string,
): Promise<T[]> {
  const results: T[] = [];
  let pages = 0;
  let truncated = false;
  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await build().range(from, to);
    if (error) throw error;
    const rows = (data || []) as T[];
    results.push(...rows);
    pages++;
    if (rows.length < pageSize) break;
    if (page === maxPages - 1 && rows.length === pageSize) {
      truncated = true;
    }
  }
  const key = label || "fetchAllChunked";
  if (truncated) {
    warnTruncationOnce(key, `>${maxPages * pageSize} rows`);
  } else if (pages > 1) {
    warnPaginationOnce(key, `${results.length} rows across ${pages} page(s)`);
  }
  return results;
}

// --- FK error mapping ---

const FK_ERROR_MAP: Record<string, { title: string; description: string }> = {
  orders_distributor_id_fkey: { title: "Cannot remove dealer", description: "This dealer has orders linked to it. Remove or reassign those orders first." },
  orders_salesperson_id_fkey: { title: "Cannot remove team member", description: "This salesperson has orders linked to them. Remove or reassign those orders first." },
  order_lines_product_id_fkey: { title: "Cannot remove product", description: "This product is used in existing orders. Remove those orders first." },
  claims_distributor_id_fkey: { title: "Cannot remove dealer", description: "This dealer has claims linked to it. Resolve those claims first." },
  claims_order_id_fkey: { title: "Cannot remove order", description: "This order has claims linked to it. Resolve those claims first." },
  claim_lines_product_id_fkey: { title: "Cannot remove product", description: "This product is referenced in existing claims." },
  stock_deductions_product_id_fkey: { title: "Cannot remove product", description: "This product has stock deduction history." },
  stock_deductions_godown_id_fkey: { title: "Cannot remove warehouse", description: "This warehouse has stock deduction history." },
  secondary_sales_distributor_id_fkey: { title: "Cannot remove dealer", description: "This dealer has secondary sales records." },
  secondary_sales_product_id_fkey: { title: "Cannot remove product", description: "This product has secondary sales records." },
};

function mapFkError(message: string, entityType: string): { title: string; description: string } {
  for (const [key, val] of Object.entries(FK_ERROR_MAP)) {
    if (message.includes(key)) return val;
  }
  if (message.includes("violates foreign key constraint")) {
    return { title: `Cannot delete ${entityType}`, description: "Other records depend on this item. Remove them first." };
  }
  return { title: `Failed to delete ${entityType}`, description: message };
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
    if (!companyId) {
      toast.error("Workspace not set up", { description: "Please complete workspace setup before adding data." });
      logError({ source: `crud:${table}.add`, error: "Workspace not set up (companyId missing)", severity: "warning", context: { table } });
      return;
    }
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
    if (error) {
      handleSupabaseError(error, { source: `crud:${table}.add`, title: `Failed to add ${entityLogType || table}`, context: { table } });
      return;
    }
    if (data) {
      const newId = (data as any).id;
      setter(prev => [...prev, { ...item, id: newId }]);
      if (entityLogType) log(entityLogType, newId, "created", `Added ${getLabel?.(item) || table}`);
    }
  };

  const update = async (item: T) => {
    if (!companyId) {
      toast.error("Workspace not set up", { description: "Please complete workspace setup before saving changes." });
      logError({ source: `crud:${table}.update`, error: "Workspace not set up (companyId missing)", severity: "warning", context: { table, id: item.id } });
      return;
    }
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
    if (error) {
      handleSupabaseError(error, { source: `crud:${table}.update`, title: `Failed to update ${entityLogType || table}`, context: { table, id: item.id } });
      return;
    }
    setter(prev => prev.map(x => x.id === item.id ? item : x));
    if (entityLogType) log(entityLogType, item.id, "updated", `Updated ${getLabel?.(item) || table}`);
  };

  const remove = async (id: string): Promise<boolean> => {
    if (!companyId) {
      toast.error("Workspace not set up", { description: "Please complete workspace setup first." });
      logError({ source: `crud:${table}.remove`, error: "Workspace not set up (companyId missing)", severity: "warning", context: { table, id } });
      return false;
    }
    if (!navigator.onLine) {
      if (!allowOfflineDelete) {
        toast.error(`Cannot delete ${entityLogType || table} offline`, { description: "Please reconnect to delete." });
        return false;
      }
      setter(prev => {
        const updated = prev.filter(x => x.id !== id);
        persistEntityToCache(cacheEntity, updated);
        return updated;
      });
      await enqueueMutation({ type: "delete", table, payload: { id } });
      toast("Saved offline — will sync when back online", { duration: 3000 });
      return true;
    }
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) {
      const friendly = mapFkError(error.message, entityLogType || table);
      toast.error(friendly.title, { description: friendly.description });
      logError({ source: `crud:${table}.remove`, error, context: { table, id } });
      return false;
    }
    setter(prev => prev.filter(x => x.id !== id));
    if (entityLogType) log(entityLogType, id, "deleted", `Deleted ${entityLogType}`);
    return true;
  };

  return { add, update, remove };
}
