import type * as XLSXType from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildWorksheet } from "./exportCsv";

const s = (v: unknown) => String(v ?? "");
const n = (v: unknown) => String(v ?? 0);

const PAGE_SIZE = 1000;

async function fetchAll<T>(
  queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await queryFn(offset, offset + PAGE_SIZE - 1);
    if (error || !data) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

function addSheet(XLSX: typeof XLSXType, wb: XLSXType.WorkBook, name: string, headers: string[], rows: string[][]) {
  if (!rows.length) return false;
  const ws = buildWorksheet(XLSX, headers, rows);
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  return true;
}

export async function exportFullBackup() {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  let sheetCount = 0;

  // --- Orders ---
  const orders = await fetchAll((from, to) =>
    supabase.from("orders").select("*, order_lines(*)").order("date", { ascending: false }).range(from, to)
  );
  if (orders.length) {
    const h = ["Order #", "Date", "Dealer", "Salesperson", "Total (₹)", "Payment Mode", "Payment Status", "Delivery Status", "Dispatch Date", "Vehicle", "Driver", "Remarks"];
    const r = orders.map((o) => [s(o.order_number), s(o.date), s(o.distributor_name), s(o.salesperson_name), n(o.total), s(o.payment_mode), s(o.payment_status), s(o.delivery_status), s(o.dispatch_date), s(o.vehicle), s(o.driver_name), s(o.dispatch_remarks)]);
    if (addSheet(XLSX, wb, "Orders", h, r)) sheetCount++;

    const lineH = ["Order #", "Product", "Qty", "Unit Price (₹)", "Line Total (₹)"];
    const lineR = orders.flatMap((o) =>
      (o.order_lines as any[]).map((l) => [s(o.order_number), s(l.product_name), n(l.quantity), n(l.unit_price), n(l.line_total)])
    );
    if (addSheet(XLSX, wb, "Order Lines", lineH, lineR)) sheetCount++;
  }

  // --- Dealers ---
  const dealers = await fetchAll((from, to) => supabase.from("distributors").select("*").order("name").range(from, to));
  if (addSheet(XLSX, wb, "Dealers", ["Name", "Location", "Contact", "Email", "GSTIN", "PAN", "Outstanding (₹)", "Credit Limit (₹)", "Total Orders", "Total Value (₹)"],
    dealers.map((d) => [s(d.name), s(d.location), s(d.contact), s(d.email), s(d.gstin), s(d.pan), n(d.outstanding_amount), n(d.credit_limit), n(d.total_orders), n(d.total_value)]))) sheetCount++;

  // --- Products ---
  const products = await fetchAll((from, to) => supabase.from("products").select("*").order("name").range(from, to));
  if (addSheet(XLSX, wb, "Products", ["Name", "SKU", "Unit", "Base Price (₹)", "HSN Code", "Total Sold"],
    products.map((p) => [s(p.name), s(p.sku), s(p.unit), n(p.base_price), s(p.hsn_code), n(p.total_sold)]))) sheetCount++;

  // --- Sales Team ---
  const sales = await fetchAll((from, to) => supabase.from("salespersons").select("*").order("name").range(from, to));
  if (addSheet(XLSX, wb, "Sales Team", ["Name", "Phone", "Email", "Region", "Total Orders", "Total Value (₹)"],
    sales.map((sp) => [s(sp.name), s(sp.phone), s(sp.email), s(sp.region), n(sp.total_orders), n(sp.total_value)]))) sheetCount++;

  // --- Stock ---
  const stockItems = await fetchAll((from, to) => supabase.from("stock_items").select("*, products(name, sku), godowns(name)").range(from, to));
  if (addSheet(XLSX, wb, "Stock", ["Product", "SKU", "Warehouse", "Quantity", "Threshold", "Last Deducted"],
    stockItems.map((si: any) => [s(si.products?.name), s(si.products?.sku), s(si.godowns?.name), n(si.quantity), n(si.threshold), s(si.last_deducted_date)]))) sheetCount++;

  // --- Warehouses ---
  const godowns = await fetchAll((from, to) => supabase.from("godowns").select("*").order("name").range(from, to));
  if (addSheet(XLSX, wb, "Warehouses", ["Name", "Address", "Active"],
    godowns.map((g) => [s(g.name), s(g.address), g.is_active ? "Yes" : "No"]))) sheetCount++;

  // --- Schemes ---
  const schemes = await fetchAll((from, to) => supabase.from("schemes").select("*").order("name").range(from, to));
  if (addSheet(XLSX, wb, "Schemes", ["Name", "Type", "Active", "Valid From", "Valid Until", "Discount %", "Flat Amount (₹)", "Buy Qty", "Free Qty", "Min Qty", "Min Order Value (₹)"],
    schemes.map((sc) => [s(sc.name), s(sc.scheme_type), sc.is_active ? "Yes" : "No", s(sc.valid_from), s(sc.valid_until), n(sc.discount_percent), n(sc.flat_amount), n(sc.buy_qty), n(sc.free_qty), n(sc.min_qty), n(sc.min_order_value)]))) sheetCount++;

  // --- Invoices ---
  const invoices = await fetchAll((from, to) => supabase.from("invoices").select("*, invoice_lines(*)").order("invoice_date", { ascending: false }).range(from, to));
  if (addSheet(XLSX, wb, "Invoices", ["Invoice #", "Date", "Buyer", "Subtotal (₹)", "Tax (₹)", "Grand Total (₹)", "Status"],
    invoices.map((inv) => [s(inv.invoice_number), s(inv.invoice_date), s(inv.buyer_name), n(inv.subtotal), n(inv.total_tax), n(inv.grand_total), s(inv.status)]))) sheetCount++;

  // --- Claims ---
  const claims = await fetchAll((from, to) => supabase.from("claims").select("*, claim_lines(*)").order("created_at", { ascending: false }).range(from, to));
  if (addSheet(XLSX, wb, "Claims", ["Order #", "Dealer", "Type", "Status", "Claim Value (₹)", "Reason", "Created"],
    claims.map((c) => [s(c.order_number), s(c.distributor_name), s(c.claim_type), s(c.status), n(c.total_claim_value), s(c.reason), s(c.created_at).slice(0, 10)]))) sheetCount++;

  // --- Targets ---
  const targets = await fetchAll((from, to) => supabase.from("targets").select("*").order("period_start", { ascending: false }).range(from, to));
  if (addSheet(XLSX, wb, "Targets", ["Entity", "Type", "Period", "Period Start", "Target Orders", "Target Revenue (₹)"],
    targets.map((t) => [s(t.entity_name), s(t.entity_type), s(t.period_type), s(t.period_start), n(t.target_orders), n(t.target_revenue)]))) sheetCount++;

  if (sheetCount === 0) {
    toast.error("Nothing to export", { description: "No data found in your account." });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ledge_backup_${today}.xlsx`);

  toast.success("Backup downloaded", {
    description: `${sheetCount} sheet${sheetCount === 1 ? "" : "s"} exported successfully.`,
  });
}
