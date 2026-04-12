import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function toCsvString(headers: string[], rows: string[][]): string {
  const BOM = "\uFEFF";
  const escape = (v: string) =>
    v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ];
  return BOM + lines.join("\r\n");
}

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

export async function exportFullBackup() {
  const zip = new JSZip();
  let fileCount = 0;

  const checkTruncation = (name: string, data: unknown[] | null) => {
    if (data && data.length === 1000) truncatedTables.push(name);
  };
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_lines(*)")
    .order("date", { ascending: false });

  checkTruncation("orders", orders);
  if (orders?.length) {
    const headers = [
      "Order #", "Date", "Dealer", "Salesperson", "Total (₹)",
      "Payment Mode", "Payment Status", "Delivery Status",
      "Dispatch Date", "Vehicle", "Driver", "Remarks",
    ];
    const rows = orders.map((o) => [
      s(o.order_number), s(o.date), s(o.distributor_name), s(o.salesperson_name),
      n(o.total), s(o.payment_mode), s(o.payment_status), s(o.delivery_status),
      s(o.dispatch_date), s(o.vehicle), s(o.driver_name), s(o.dispatch_remarks),
    ]);
    zip.file("orders.csv", toCsvString(headers, rows));

    const lineHeaders = ["Order #", "Product", "Qty", "Unit Price (₹)", "Line Total (₹)"];
    const lineRows = orders.flatMap((o) =>
      (o.order_lines as any[]).map((l) => [
        s(o.order_number), s(l.product_name), n(l.quantity), n(l.unit_price), n(l.line_total),
      ])
    );
    if (lineRows.length) {
      zip.file("order_lines.csv", toCsvString(lineHeaders, lineRows));
    }
    fileCount += 2;
  }

  // --- Dealers ---
  const { data: dealers } = await supabase.from("distributors").select("*").order("name");
  checkTruncation("dealers", dealers);
  if (dealers?.length) {
    const h = ["Name", "Location", "Contact", "Email", "GSTIN", "PAN", "Outstanding (₹)", "Credit Limit (₹)", "Total Orders", "Total Value (₹)"];
    const r = dealers.map((d) => [s(d.name), s(d.location), s(d.contact), s(d.email), s(d.gstin), s(d.pan), n(d.outstanding_amount), n(d.credit_limit), n(d.total_orders), n(d.total_value)]);
    zip.file("dealers.csv", toCsvString(h, r));
    fileCount++;
  }

  // --- Products ---
  const { data: products } = await supabase.from("products").select("*").order("name");
  checkTruncation("products", products);
  if (products?.length) {
    const h = ["Name", "SKU", "Unit", "Base Price (₹)", "HSN Code", "Total Sold"];
    const r = products.map((p) => [s(p.name), s(p.sku), s(p.unit), n(p.base_price), s(p.hsn_code), n(p.total_sold)]);
    zip.file("products.csv", toCsvString(h, r));
    fileCount++;
  }

  // --- Sales Team ---
  const { data: sales } = await supabase.from("salespersons").select("*").order("name");
  checkTruncation("sales team", sales);
  if (sales?.length) {
    const h = ["Name", "Phone", "Email", "Region", "Total Orders", "Total Value (₹)"];
    const r = sales.map((sp) => [s(sp.name), s(sp.phone), s(sp.email), s(sp.region), n(sp.total_orders), n(sp.total_value)]);
    zip.file("sales_team.csv", toCsvString(h, r));
    fileCount++;
  }

  // --- Stock ---
  const { data: stockItems } = await supabase.from("stock_items").select("*, products(name, sku), godowns(name)");
  checkTruncation("stock", stockItems);
  if (stockItems?.length) {
    const h = ["Product", "SKU", "Warehouse", "Quantity", "Threshold", "Last Deducted"];
    const r = stockItems.map((si: any) => [
      s(si.products?.name), s(si.products?.sku), s(si.godowns?.name),
      n(si.quantity), n(si.threshold), s(si.last_deducted_date),
    ]);
    zip.file("stock.csv", toCsvString(h, r));
    fileCount++;
  }

  // --- Warehouses ---
  const { data: godowns } = await supabase.from("godowns").select("*").order("name");
  checkTruncation("warehouses", godowns);
  if (godowns?.length) {
    const h = ["Name", "Address", "Active"];
    const r = godowns.map((g) => [s(g.name), s(g.address), g.is_active ? "Yes" : "No"]);
    zip.file("warehouses.csv", toCsvString(h, r));
    fileCount++;
  }

  // --- Schemes ---
  const { data: schemes } = await supabase.from("schemes").select("*").order("name");
  checkTruncation("schemes", schemes);
  if (schemes?.length) {
    const h = ["Name", "Type", "Active", "Valid From", "Valid Until", "Discount %", "Flat Amount (₹)", "Buy Qty", "Free Qty", "Min Qty", "Min Order Value (₹)"];
    const r = schemes.map((sc) => [s(sc.name), s(sc.scheme_type), sc.is_active ? "Yes" : "No", s(sc.valid_from), s(sc.valid_until), n(sc.discount_percent), n(sc.flat_amount), n(sc.buy_qty), n(sc.free_qty), n(sc.min_qty), n(sc.min_order_value)]);
    zip.file("schemes.csv", toCsvString(h, r));
    fileCount++;
  }

  // --- Invoices ---
  const { data: invoices } = await supabase.from("invoices").select("*, invoice_lines(*)").order("invoice_date", { ascending: false });
  checkTruncation("invoices", invoices);
  if (invoices?.length) {
    const h = ["Invoice #", "Date", "Buyer", "Subtotal (₹)", "Tax (₹)", "Grand Total (₹)", "Status"];
    const r = invoices.map((inv) => [s(inv.invoice_number), s(inv.invoice_date), s(inv.buyer_name), n(inv.subtotal), n(inv.total_tax), n(inv.grand_total), s(inv.status)]);
    zip.file("invoices.csv", toCsvString(h, r));
    fileCount++;
  }

  // --- Claims ---
  const { data: claims } = await supabase.from("claims").select("*, claim_lines(*)").order("created_at", { ascending: false });
  checkTruncation("claims", claims);
  if (claims?.length) {
    const h = ["Order #", "Dealer", "Type", "Status", "Claim Value (₹)", "Reason", "Created"];
    const r = claims.map((c) => [s(c.order_number), s(c.distributor_name), s(c.claim_type), s(c.status), n(c.total_claim_value), s(c.reason), s(c.created_at).slice(0, 10)]);
    zip.file("claims.csv", toCsvString(h, r));
    fileCount++;
  }

  // --- Targets ---
  const { data: targets } = await supabase.from("targets").select("*").order("period_start", { ascending: false });
  checkTruncation("targets", targets);
  if (targets?.length) {
    const h = ["Entity", "Type", "Period", "Period Start", "Target Orders", "Target Revenue (₹)"];
    const r = targets.map((t) => [s(t.entity_name), s(t.entity_type), s(t.period_type), s(t.period_start), n(t.target_orders), n(t.target_revenue)]);
    zip.file("targets.csv", toCsvString(h, r));
    fileCount++;
  }

  if (fileCount === 0) {
    toast.error("Nothing to export", { description: "No data found in your account." });
    return;
  }

  if (truncatedTables.length > 0) {
    toast.warning("Large dataset detected", {
      description: `Some tables (${truncatedTables.join(", ")}) may be truncated at 1,000 rows. Contact support for a full export.`,
      duration: 8000,
    });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const today = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ledge_backup_${today}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toast.success("Backup downloaded", {
    description: `${fileCount} file${fileCount === 1 ? "" : "s"} exported successfully.`,
  });
}
