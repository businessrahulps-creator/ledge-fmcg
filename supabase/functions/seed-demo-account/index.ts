import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEMO_PASSWORD = Deno.env.get("DEMO_ACCOUNT_PASSWORD") ?? "";

// ── Demo identity ────────────────────────────────────────────────────
const DEMO_EMAIL = "demo@getledge.in";
const DEMO_OWNER_NAME = "Anuj Rakyan";

// ── Helpers ──────────────────────────────────────────────────────────
function uuid() { return crypto.randomUUID(); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function dateStr(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

// ── Company ──────────────────────────────────────────────────────────
const COMPANY = {
  name: "RAW Pressery Foods Pvt Ltd",
  gstin: "27AAKCR3478H1ZN",
  pan: "AAKCR3478H",
  state_code: "27",
  address: "Unit 401, Lotus Business Park, Off New Link Road, Andheri West, Mumbai 400053",
  phone: "+91 22 4890 5500",
  email: "hello@rawpressery.in",
  bank_name: "HDFC Bank",
  bank_account: "50200012345678",
  bank_account_name: "RAW Pressery Foods Pvt Ltd",
  bank_ifsc: "HDFC0000123",
  order_prefix: "RAW",
  invoice_prefix: "RAW/INV",
};

// ── Products (26 SKUs — mirrors RAW Pressery's real lineup) ──────────
const PRODUCTS = [
  // Cold-pressed juices (200ml & 250ml) — HSN 2009
  { name: "Valencia Orange Cold-Pressed Juice 200ml", sku: "RAW-ORG-200", unit: "Case", base_price: 1200, hsn: "2009" },
  { name: "Valencia Orange Cold-Pressed Juice 250ml", sku: "RAW-ORG-250", unit: "Case", base_price: 1500, hsn: "2009" },
  { name: "Alphonso Mango Cold-Pressed Juice 200ml", sku: "RAW-MNG-200", unit: "Case", base_price: 1320, hsn: "2009" },
  { name: "Alphonso Mango Cold-Pressed Juice 250ml", sku: "RAW-MNG-250", unit: "Case", base_price: 1650, hsn: "2009" },
  { name: "Pomegranate Cold-Pressed Juice 250ml", sku: "RAW-POM-250", unit: "Case", base_price: 1800, hsn: "2009" },
  { name: "Mixed Fruit Cold-Pressed Juice 200ml", sku: "RAW-MIX-200", unit: "Case", base_price: 1200, hsn: "2009" },
  { name: "Sugarcane Cold-Pressed Juice 250ml", sku: "RAW-SUG-250", unit: "Case", base_price: 1200, hsn: "2009" },
  { name: "Coconut Water 200ml", sku: "RAW-COC-200", unit: "Case", base_price: 1080, hsn: "2009" },
  { name: "Aam Panna Cold-Pressed 200ml", sku: "RAW-AAM-200", unit: "Case", base_price: 1200, hsn: "2009" },
  { name: "Pineapple Cold-Pressed Juice 250ml", sku: "RAW-PIN-250", unit: "Case", base_price: 1500, hsn: "2009" },
  { name: "Apple Cold-Pressed Juice 250ml", sku: "RAW-APL-250", unit: "Case", base_price: 1500, hsn: "2009" },
  { name: "Watermelon Cold-Pressed Juice 250ml", sku: "RAW-WTM-250", unit: "Case", base_price: 1380, hsn: "2009" },
  { name: "Kale Surprise Green Juice 250ml", sku: "RAW-KAL-250", unit: "Case", base_price: 1980, hsn: "2009" },
  { name: "Beetroot Booster Juice 250ml", sku: "RAW-BTR-250", unit: "Case", base_price: 1620, hsn: "2009" },

  // Protein milkshakes (200ml) — HSN 0403
  { name: "Cold Coffee Protein Milkshake 200ml", sku: "RAW-PCC-200", unit: "Case", base_price: 1680, hsn: "0403" },
  { name: "Choco Mint Protein Milkshake 200ml", sku: "RAW-PCM-200", unit: "Case", base_price: 1680, hsn: "0403" },
  { name: "Vanilla Protein Milkshake 200ml", sku: "RAW-PVN-200", unit: "Case", base_price: 1560, hsn: "0403" },
  { name: "Strawberry Protein Milkshake 200ml", sku: "RAW-PSB-200", unit: "Case", base_price: 1620, hsn: "0403" },

  // Lactose-free beverages (1L) — HSN 2202
  { name: "Unsweetened Almond Beverage 1L", sku: "RAW-ALM-1L", unit: "Case", base_price: 2160, hsn: "2202" },
  { name: "Vanilla Almond Beverage 1L", sku: "RAW-ALV-1L", unit: "Case", base_price: 2280, hsn: "2202" },
  { name: "Chocolate Almond Beverage 1L", sku: "RAW-ALC-1L", unit: "Case", base_price: 2280, hsn: "2202" },
  { name: "Oat Milk Original 1L", sku: "RAW-OAT-1L", unit: "Case", base_price: 2400, hsn: "2202" },
  { name: "Oat Milk Barista 1L", sku: "RAW-OTB-1L", unit: "Case", base_price: 2400, hsn: "2202" },

  // Wellness shots (60ml) — HSN 2009
  { name: "Ginger Wellness Shot 60ml", sku: "RAW-GNG-60", unit: "Case", base_price: 1440, hsn: "2009" },
  { name: "Turmeric Wellness Shot 60ml", sku: "RAW-TRM-60", unit: "Case", base_price: 1440, hsn: "2009" },
  { name: "Wheatgrass Wellness Shot 60ml", sku: "RAW-WHT-60", unit: "Case", base_price: 1560, hsn: "2009" },
];

// ── Dealers (28 — Mumbai / Pune / BLR / Delhi NCR / Hyd / Chennai) ───
const DEALER_TEMPLATES: Array<{ name: string; location: string; state: string; stateCode: string }> = [
  // Maharashtra — Mumbai (8)
  { name: "Sharma Beverages — Bandra", location: "Bandra West, Mumbai", state: "MH", stateCode: "27" },
  { name: "Andheri Modern Trade", location: "Andheri East, Mumbai", state: "MH", stateCode: "27" },
  { name: "Powai Cold Chain", location: "Powai, Mumbai", state: "MH", stateCode: "27" },
  { name: "Reliance Smart — Mumbai West", location: "Goregaon, Mumbai", state: "MH", stateCode: "27" },
  { name: "Nature's Basket — South Mumbai", location: "Worli, Mumbai", state: "MH", stateCode: "27" },
  { name: "Dadar Fresh Distributors", location: "Dadar, Mumbai", state: "MH", stateCode: "27" },
  { name: "Vashi Wholesale Beverages", location: "Vashi, Navi Mumbai", state: "MH", stateCode: "27" },
  { name: "Thane Cold Logistics", location: "Thane West, Thane", state: "MH", stateCode: "27" },
  // Maharashtra — Pune (4)
  { name: "Koregaon Park Premium Foods", location: "Koregaon Park, Pune", state: "MH", stateCode: "27" },
  { name: "Reliance Smart — Pune Hub", location: "Hinjewadi, Pune", state: "MH", stateCode: "27" },
  { name: "Baner Beverages Co.", location: "Baner, Pune", state: "MH", stateCode: "27" },
  { name: "Viman Nagar Cold Storage", location: "Viman Nagar, Pune", state: "MH", stateCode: "27" },
  // Karnataka — Bangalore (5)
  { name: "Karnataka Cold Supplies", location: "Indiranagar, Bangalore", state: "KA", stateCode: "29" },
  { name: "BigBasket — BLR CFA", location: "Whitefield, Bangalore", state: "KA", stateCode: "29" },
  { name: "Koramangala Modern Trade", location: "Koramangala, Bangalore", state: "KA", stateCode: "29" },
  { name: "HSR Layout Premium Foods", location: "HSR Layout, Bangalore", state: "KA", stateCode: "29" },
  { name: "Bommanahalli Wholesale", location: "Bommanahalli, Bangalore", state: "KA", stateCode: "29" },
  // Delhi NCR (5)
  { name: "NCR Modern Trade Pvt Ltd", location: "Connaught Place, New Delhi", state: "DL", stateCode: "07" },
  { name: "Gurugram Cold Chain", location: "Sector 29, Gurugram", state: "HR", stateCode: "06" },
  { name: "Manesar Distribution Hub", location: "Manesar, Gurugram", state: "HR", stateCode: "06" },
  { name: "Noida Premium Beverages", location: "Sector 18, Noida", state: "UP", stateCode: "09" },
  { name: "South Delhi Fresh Foods", location: "Saket, New Delhi", state: "DL", stateCode: "07" },
  // Telangana — Hyderabad (3)
  { name: "BigBasket — Hyderabad CFA", location: "Medchal, Hyderabad", state: "TS", stateCode: "36" },
  { name: "Banjara Hills Modern Trade", location: "Banjara Hills, Hyderabad", state: "TS", stateCode: "36" },
  { name: "Gachibowli Cold Supplies", location: "Gachibowli, Hyderabad", state: "TS", stateCode: "36" },
  // Tamil Nadu — Chennai (3)
  { name: "Chennai Premium Foods", location: "Nungambakkam, Chennai", state: "TN", stateCode: "33" },
  { name: "OMR Beverages Hub", location: "OMR, Chennai", state: "TN", stateCode: "33" },
  { name: "Anna Nagar Cold Chain", location: "Anna Nagar, Chennai", state: "TN", stateCode: "33" },
];

// ── Sales Team (12 reps across territories) ──────────────────────────
const SALES_TEAM = [
  { name: "Vikram Joshi", phone: "+91 98200 10001", email: "vikram.j@rawpressery.in", region: "Mumbai West" },
  { name: "Neha Kulkarni", phone: "+91 98200 10002", email: "neha.k@rawpressery.in", region: "Mumbai East" },
  { name: "Rohan Shetty", phone: "+91 98200 10003", email: "rohan.s@rawpressery.in", region: "Navi Mumbai & Thane" },
  { name: "Priya Deshmukh", phone: "+91 98220 10004", email: "priya.d@rawpressery.in", region: "Pune" },
  { name: "Arjun Iyer", phone: "+91 98450 20001", email: "arjun.i@rawpressery.in", region: "Bangalore North" },
  { name: "Divya Rao", phone: "+91 98450 20002", email: "divya.r@rawpressery.in", region: "Bangalore South" },
  { name: "Karan Malhotra", phone: "+91 98110 30001", email: "karan.m@rawpressery.in", region: "Delhi NCR" },
  { name: "Ritika Sharma", phone: "+91 98110 30002", email: "ritika.s@rawpressery.in", region: "Gurugram & Noida" },
  { name: "Aditya Reddy", phone: "+91 98480 40001", email: "aditya.r@rawpressery.in", region: "Hyderabad" },
  { name: "Sanya Krishnan", phone: "+91 98400 50001", email: "sanya.k@rawpressery.in", region: "Chennai" },
  { name: "Mohit Bansal", phone: "+91 98200 10005", email: "mohit.b@rawpressery.in", region: "Modern Trade — National" },
  { name: "Ananya Pillai", phone: "+91 98220 10006", email: "ananya.p@rawpressery.in", region: "HoReCa — West" },
];

// ── Godowns (4 — matches cold-chain footprint) ───────────────────────
const GODOWNS = [
  { name: "Mumbai CFA — Bhiwandi", address: "Plot 14, Mankoli Naka, Bhiwandi, Maharashtra 421302" },
  { name: "Bangalore DC — Bommanahalli", address: "No. 22, Hosur Road, Bommanahalli, Bangalore 560068" },
  { name: "Delhi NCR — Manesar", address: "Plot 8, IMT Manesar, Sector 7, Gurugram, Haryana 122050" },
  { name: "Hyderabad Spoke — Medchal", address: "Survey 112, Medchal Industrial Area, Hyderabad 501401" },
];

const VEHICLES = [
  "MH-04-AB-1234", "MH-04-CD-5678", "MH-12-EF-9012", "MH-14-GH-3456",
  "KA-05-IJ-7890", "KA-51-KL-1234", "DL-1L-MN-5678", "HR-26-OP-9012",
  "TS-09-QR-3456", "TN-09-ST-7890", "MH-43-UV-1234", "KA-03-WX-5678",
];
const DRIVERS = [
  "Ramesh", "Suresh", "Mahesh", "Dinesh", "Prakash", "Santosh",
  "Ashok", "Vinod", "Ravi", "Sunil", "Manoj", "Deepak",
];
const PAYMENT_MODES = ["cash", "bank_transfer", "upi", "cheque"] as const;
const CLAIM_TYPES = ["return", "shortage", "damage"] as const;
const CLAIM_REASONS = [
  "Damaged during transit — bottles broken",
  "Near-expiry stock — less than 21 days shelf life",
  "Short delivery — 3 cases missing",
  "Wrong product variant delivered",
  "Cold chain break — temperature excursion",
  "Customer rejection — label damage",
  "Quality issue — off taste reported by retailer",
  "Overcharged on invoice — scheme not applied",
  "Crate damaged — multiple SKUs affected",
  "Shelf-life dispute — buffer requested",
];

// ── Batch insert helper ──────────────────────────────────────────────
async function batchInsert(client: any, table: string, rows: any[], batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await client.from(table).insert(batch);
    if (error) throw new Error(`Insert ${table} batch ${i}: ${error.message}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Operator-only guard: require shared SEED_SECRET bearer.
  const SEED_SECRET = Deno.env.get("SEED_SECRET");
  if (!SEED_SECRET || req.headers.get("Authorization") !== `Bearer ${SEED_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  // `?force=1` deletes any existing demo workspace and re-seeds from scratch.
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up any pre-existing demo user
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingDemo = existingUsers.users.find((u: any) => u.email === DEMO_EMAIL);

    if (existingDemo) {
      const { data: prof } = await admin.from("profiles")
        .select("company_id").eq("user_id", existingDemo.id).maybeSingle();

      if (prof?.company_id && !force) {
        return new Response(JSON.stringify({
          status: "already_seeded",
          message: "Demo account already exists. Pass ?force=1 to wipe and re-seed.",
          email: DEMO_EMAIL,
          company_id: prof.company_id,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }

      if (force && prof?.company_id) {
        const cid = prof.company_id;
        // Wipe child rows then the workspace itself
        await admin.from("order_lines").delete().in("order_id",
          (await admin.from("orders").select("id").eq("company_id", cid)).data?.map((r: any) => r.id) ?? []);
        await admin.from("order_schemes").delete().in("order_id",
          (await admin.from("orders").select("id").eq("company_id", cid)).data?.map((r: any) => r.id) ?? []);
        await admin.from("invoice_lines").delete().in("invoice_id",
          (await admin.from("invoices").select("id").eq("company_id", cid)).data?.map((r: any) => r.id) ?? []);
        await admin.from("claim_lines").delete().in("claim_id",
          (await admin.from("claims").select("id").eq("company_id", cid)).data?.map((r: any) => r.id) ?? []);
        for (const t of [
          "activity_log", "signal_acknowledgements", "command_saved_views", "notifications",
          "dealer_aging_state", "team_invites", "secondary_sales", "targets",
          "claims", "invoices", "schemes", "stock_deductions", "stock_items",
          "orders", "products", "godowns", "distributors", "salespersons",
        ]) {
          await admin.from(t).delete().eq("company_id", cid);
        }
        await admin.from("user_roles").delete().eq("user_id", existingDemo.id);
        await admin.from("profiles").delete().eq("user_id", existingDemo.id);
        await admin.from("companies").delete().eq("id", cid);
        await admin.auth.admin.deleteUser(existingDemo.id);
      }
    }

    if (!DEMO_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "Server is missing DEMO_ACCOUNT_PASSWORD secret" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: DEMO_OWNER_NAME, company_name: COMPANY.name },
    });
    if (authErr && !authErr.message?.includes("already been registered")) throw authErr;

    let userId: string;
    if (authErr) {
      const { data: users } = await admin.auth.admin.listUsers();
      const existing = users.users.find((u: any) => u.email === DEMO_EMAIL);
      if (!existing) throw new Error("User not found after registration conflict");
      userId = existing.id;
    } else {
      userId = authData.user.id;
    }

    // 2. Create company
    const companyId = uuid();
    const { error: compErr } = await admin.from("companies").insert({
      id: companyId, ...COMPANY,
      next_order_sequence: 1,
      next_invoice_sequence: 1,
    });
    if (compErr) throw compErr;

    // 3. Link profile + role
    await admin.from("profiles")
      .upsert({
        user_id: userId, company_id: companyId,
        full_name: DEMO_OWNER_NAME, email: DEMO_EMAIL,
        role_self_selected: "Founder / CEO", team_size: "11-50",
      }, { onConflict: "user_id" });
    await admin.from("user_roles").upsert(
      { user_id: userId, role: "super_admin" },
      { onConflict: "user_id,role" }
    );

    // 4. Products
    const productIds: string[] = [];
    const productRows = PRODUCTS.map(p => {
      const id = uuid();
      productIds.push(id);
      return { id, company_id: companyId, name: p.name, sku: p.sku, unit: p.unit, base_price: p.base_price, hsn_code: p.hsn };
    });
    await batchInsert(admin, "products", productRows);

    // 5. Dealers
    const dealerIds: Array<{ id: string; stateCode: string; name: string; location: string }> = [];
    const dealerRows = DEALER_TEMPLATES.map((d, i) => {
      const id = uuid();
      const gstinNum = String(10001 + i).slice(-4);
      dealerIds.push({ id, stateCode: d.stateCode, name: d.name, location: d.location });
      const stateNameMap: Record<string, string> = {
        MH: "Maharashtra", KA: "Karnataka", DL: "Delhi", HR: "Haryana", UP: "Uttar Pradesh", TS: "Telangana", TN: "Tamil Nadu",
      };
      return {
        id, company_id: companyId, name: d.name, location: d.location,
        contact: `+91 ${randInt(94000, 99999)} ${randInt(10000, 99999)}`,
        email: d.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 14) + "@rawdealers.in",
        gstin: `${d.stateCode}AABCD${gstinNum}E1Z${randInt(1, 9)}`,
        pan: `AABCD${gstinNum}E`,
        state_code: d.stateCode,
        address: `${randInt(1, 200)}, ${d.location}, ${stateNameMap[d.state] ?? d.state}`,
        credit_limit: pick([50000, 100000, 200000, 300000, 500000, 750000, 1000000, 1500000]),
        bank_name: pick(["HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Bank", "Federal Bank"]),
        bank_account: String(randInt(10000000, 99999999)) + String(randInt(100, 999)),
        bank_account_name: d.name,
        bank_ifsc: pick(["HDFC0000234", "ICIC0000456", "UTIB0000789", "KKBK0000321", "FDRL0000567"]),
      };
    });
    await batchInsert(admin, "distributors", dealerRows);

    // 6. Sales Team
    const spIds: string[] = [];
    const spRows = SALES_TEAM.map(s => {
      const id = uuid();
      spIds.push(id);
      return { id, company_id: companyId, ...s };
    });
    await batchInsert(admin, "salespersons", spRows);

    // 7. Godowns
    const godownIds: string[] = [];
    const godownRows = GODOWNS.map(g => {
      const id = uuid();
      godownIds.push(id);
      return { id, company_id: companyId, name: g.name, address: g.address, is_active: true };
    });
    await batchInsert(admin, "godowns", godownRows);

    // 8. Stock Items (all products × all godowns)
    const stockRows: any[] = [];
    for (const gIdx of godownIds.keys()) {
      for (const pIdx of productIds.keys()) {
        const healthRoll = Math.random();
        let qty: number, threshold: number;
        if (healthRoll < 0.12) { threshold = randInt(40, 80); qty = randInt(0, threshold); } // critical
        else if (healthRoll < 0.32) { threshold = randInt(40, 80); qty = randInt(threshold + 1, Math.floor(threshold * 1.2)); } // low
        else { threshold = randInt(30, 60); qty = randInt(Math.floor(threshold * 1.5), threshold * 5); } // healthy
        stockRows.push({
          company_id: companyId, product_id: productIds[pIdx], godown_id: godownIds[gIdx],
          quantity: qty, threshold,
          last_deducted_date: dateStr(daysAgo(randInt(0, 7))),
        });
      }
    }
    await batchInsert(admin, "stock_items", stockRows);

    // 9. Schemes (6 — covers every type incl. dealer/product targeting + expired)
    const SCHEME_DEFS = [
      { name: "Monsoon 10% Off — Cold-Pressed Juices", type: "percentage", discount: 10, productIdx: 0, dealerIdx: -1, expired: false },
      { name: "Buy 10 Cases Get 1 Free — Mumbai Region", type: "buy_x_get_y", buy: 10, free: 1, productIdx: -1, dealerIdx: 0, expired: false },
      { name: "Flat ₹500 Off Above ₹10,000", type: "flat_discount", flat: 500, productIdx: -1, dealerIdx: -1, expired: false, minOrder: 10000 },
      { name: "BigBasket Q3 Trade Deal — 12% Off", type: "percentage", discount: 12, productIdx: -1, dealerIdx: 13, expired: false },
      { name: "Almond Beverage Launch Combo", type: "buy_x_get_y", buy: 5, free: 1, productIdx: 18, dealerIdx: -1, expired: false },
      { name: "Festive ₹2,000 Off Above ₹25,000", type: "flat_discount", flat: 2000, productIdx: -1, dealerIdx: -1, expired: true, minOrder: 25000 },
    ];
    const schemeIds: string[] = [];
    const schemeRows = SCHEME_DEFS.map((s) => {
      const id = uuid();
      schemeIds.push(id);
      return {
        id, company_id: companyId, name: s.name,
        scheme_type: s.type,
        description: s.name,
        is_active: !s.expired,
        valid_from: dateStr(daysAgo(s.expired ? 120 : 45)),
        valid_until: dateStr(daysAgo(s.expired ? 30 : -45)),
        discount_percent: s.type === "percentage" ? s.discount ?? 0 : 0,
        buy_qty: s.type === "buy_x_get_y" ? s.buy ?? 0 : 0,
        free_qty: s.type === "buy_x_get_y" ? s.free ?? 0 : 0,
        flat_amount: s.type === "flat_discount" ? s.flat ?? 0 : 0,
        min_qty: 0,
        min_order_value: s.minOrder ?? 0,
        product_id: s.productIdx >= 0 ? productIds[s.productIdx] : null,
        dealer_id: s.dealerIdx >= 0 ? dealerIds[s.dealerIdx].id : null,
      };
    });
    await batchInsert(admin, "schemes", schemeRows);

    // 10. Orders (~280 over the last 90 days, with seasonal spike in last 30d)
    const allOrders: any[] = [];
    const allOrderLines: any[] = [];
    const allOrderSchemes: any[] = [];
    const allInvoices: any[] = [];
    const allInvoiceLines: any[] = [];
    const allClaims: any[] = [];
    const allClaimLines: any[] = [];
    const allStockDeductions: any[] = [];
    const allActivityLog: any[] = [];

    let orderSeq = 1;
    let invoiceSeq = 1;

    for (let dayOffset = 90; dayOffset >= 0; dayOffset--) {
      const orderDate = daysAgo(dayOffset);
      // Seasonal spike: more orders in the last 30 days (summer)
      const ordersToday = dayOffset > 30 ? randInt(1, 3) : randInt(3, 6);

      for (let j = 0; j < ordersToday; j++) {
        const orderId = uuid();
        const dealer = pick(dealerIds);
        const spIdx = randInt(0, spIds.length - 1);
        const spName = SALES_TEAM[spIdx].name;
        const godownId = pick(godownIds);

        // 3-7 line items
        const lineCount = randInt(3, 7);
        const usedProducts = new Set<number>();
        let orderTotal = 0;
        const lines: any[] = [];

        for (let l = 0; l < lineCount; l++) {
          let pIdx: number;
          do { pIdx = randInt(0, productIds.length - 1); } while (usedProducts.has(pIdx));
          usedProducts.add(pIdx);
          const qty = randInt(2, 25);
          const price = PRODUCTS[pIdx].base_price;
          const lineTotal = qty * price;
          orderTotal += lineTotal;
          lines.push({
            order_id: orderId, product_id: productIds[pIdx],
            product_name: PRODUCTS[pIdx].name, quantity: qty,
            unit_price: price, line_total: lineTotal,
          });
        }

        // Payment & delivery status — tuned for ~70% delivered, 15% dispatched, 10% pending, 5% cancelled-like
        const isOld = dayOffset > 5;
        const deliveryStatus = isOld
          ? pick(["delivered", "delivered", "delivered", "delivered", "delivered", "dispatched"] as const)
          : dayOffset > 2 ? pick(["dispatched", "dispatched", "pending", "delivered"] as const)
            : pick(["pending", "pending", "dispatched"] as const);
        const paymentStatus = deliveryStatus === "delivered"
          ? pick(["paid", "paid", "paid", "partial", "pending"] as const)
          : pick(["pending", "partial", "paid"] as const);
        const paymentMode = pick(PAYMENT_MODES);

        const dispatchDate = deliveryStatus !== "pending" ? dateStr(new Date(orderDate.getTime() + 86400000 * randInt(0, 2))) : null;
        const vehicle = deliveryStatus !== "pending" ? pick(VEHICLES) : "";
        const driver = deliveryStatus !== "pending" ? pick(DRIVERS) : "";

        const orderNumber = `${COMPANY.order_prefix}-2026-${String(orderSeq).padStart(4, "0")}`;
        orderSeq++;

        // Scheme savings (~55% of orders, prefer active schemes)
        let schemeSavings = 0;
        if (Math.random() < 0.55 && schemeIds.length > 0) {
          const activeSchemes = schemeRows.filter(s => s.is_active);
          const scheme = pick(activeSchemes);
          schemeSavings = scheme.scheme_type === "percentage"
            ? Math.round(orderTotal * scheme.discount_percent / 100)
            : scheme.scheme_type === "flat_discount" ? scheme.flat_amount
            : Math.round(orderTotal * 0.05);
          if (schemeSavings > orderTotal * 0.4) schemeSavings = Math.round(orderTotal * 0.1);
          allOrderSchemes.push({
            order_id: orderId, scheme_id: scheme.id,
            scheme_name: scheme.name,
            scheme_label: scheme.scheme_type === "percentage" ? `${scheme.discount_percent}% off` :
              scheme.scheme_type === "flat_discount" ? `₹${scheme.flat_amount} off` : `Buy ${scheme.buy_qty} Get ${scheme.free_qty}`,
            savings: schemeSavings,
          });
        }

        allOrders.push({
          id: orderId, company_id: companyId, order_number: orderNumber,
          date: dateStr(orderDate),
          distributor_id: dealer.id, distributor_name: dealer.name,
          salesperson_id: spIds[spIdx], salesperson_name: spName,
          total: orderTotal, scheme_savings: schemeSavings,
          payment_mode: paymentMode, payment_status: paymentStatus,
          delivery_status: deliveryStatus,
          dispatch_date: dispatchDate, vehicle, driver_name: driver,
          dispatch_remarks: deliveryStatus === "pending" ? "Awaiting dispatch" : "",
          godown_id: godownId,
        });
        allOrderLines.push(...lines);

        // Stock deductions for dispatched/delivered
        if (deliveryStatus !== "pending") {
          for (const line of lines) {
            allStockDeductions.push({
              company_id: companyId,
              product_id: line.product_id,
              godown_id: godownId,
              order_id: orderId,
              quantity_deducted: line.quantity,
              date: dispatchDate || dateStr(orderDate),
              source: "auto_dispatch",
            });
          }
        }

        // GST invoice for delivered orders (regardless of payment, like real ops)
        if (deliveryStatus === "delivered") {
          const invoiceId = uuid();
          const dealerRow = dealerRows.find(d => d.id === dealer.id)!;
          const isInterState = dealer.stateCode !== COMPANY.state_code;
          const gstRate = 18;
          const subtotal = Math.max(orderTotal - schemeSavings, 0);
          const tax = Math.round(subtotal * gstRate / 100);
          const cgst = isInterState ? 0 : Math.round(tax / 2);
          const sgst = isInterState ? 0 : Math.round(tax / 2);
          const igst = isInterState ? tax : 0;
          const grandTotalRaw = subtotal + tax;
          const grandTotal = Math.round(grandTotalRaw);
          const roundOff = Math.round((grandTotal - grandTotalRaw) * 100) / 100;

          const invoiceNumber = `${COMPANY.invoice_prefix}-2026-${String(invoiceSeq).padStart(4, "0")}`;
          invoiceSeq++;

          allInvoices.push({
            id: invoiceId, company_id: companyId,
            invoice_number: invoiceNumber,
            invoice_date: dispatchDate || dateStr(orderDate),
            source_order_id: orderId,
            doc_type: "gst_invoice",
            buyer_name: dealer.name,
            buyer_address: dealerRow.address,
            buyer_gstin: dealerRow.gstin,
            buyer_state_code: dealer.stateCode,
            seller_name: COMPANY.name,
            seller_address: COMPANY.address,
            seller_gstin: COMPANY.gstin,
            seller_pan: COMPANY.pan,
            seller_state_code: COMPANY.state_code,
            seller_phone: COMPANY.phone,
            seller_email: COMPANY.email,
            seller_bank_name: COMPANY.bank_name,
            seller_bank_account_name: COMPANY.bank_account_name,
            seller_bank_account: COMPANY.bank_account,
            seller_bank_ifsc: COMPANY.bank_ifsc,
            seller_logo_url: "",
            supply_type: isInterState ? "inter_state" : "intra_state",
            gst_rate: gstRate, subtotal, cgst_amount: cgst, sgst_amount: sgst,
            igst_amount: igst, total_tax: tax,
            grand_total: grandTotal,
            round_off: roundOff,
            amount_in_words: "",
            vehicle, driver_name: driver,
            status: paymentStatus === "paid" ? "paid" : "sent",
          });

          for (const line of lines) {
            const prod = PRODUCTS.find((_, idx) => productIds[idx] === line.product_id);
            allInvoiceLines.push({
              invoice_id: invoiceId,
              product_name: line.product_name,
              hsn_code: prod?.hsn || "2009",
              quantity: line.quantity,
              unit: prod?.unit || "Case",
              unit_price: line.unit_price,
              taxable_value: line.line_total,
            });
          }
        }

        // Claims (~6% of delivered orders)
        if (deliveryStatus === "delivered" && Math.random() < 0.06) {
          const claimId = uuid();
          const claimType = pick(CLAIM_TYPES);
          const isResolved = Math.random() < 0.55;
          const claimLine = pick(lines);
          const claimQty = randInt(1, Math.max(1, Math.floor(claimLine.quantity * 0.3)));
          const claimValue = claimQty * claimLine.unit_price;

          allClaims.push({
            id: claimId, company_id: companyId,
            order_id: orderId, order_number: orderNumber,
            distributor_id: dealer.id, distributor_name: dealer.name,
            claim_type: claimType,
            reason: pick(CLAIM_REASONS),
            status: isResolved ? "resolved" : "open",
            total_claim_value: claimValue,
            restore_stock: isResolved && claimType === "return",
            resolution_notes: isResolved ? "Credit note issued and stock adjusted" : "",
            resolved_at: isResolved ? new Date(orderDate.getTime() + 86400000 * randInt(1, 5)).toISOString() : null,
          });
          allClaimLines.push({
            claim_id: claimId, product_id: claimLine.product_id,
            product_name: claimLine.product_name,
            quantity: claimQty, unit_price: claimLine.unit_price,
            line_total: claimValue,
          });
        }

        // Activity log
        allActivityLog.push({
          company_id: companyId, user_id: userId, user_name: DEMO_OWNER_NAME,
          action: "created", entity_type: "order", entity_id: orderId,
          summary: `Order ${orderNumber} placed for ${dealer.name}`,
          created_at: new Date(orderDate.getTime() + randInt(28800000, 64800000)).toISOString(),
          metadata: {},
        });

        if (deliveryStatus !== "pending") {
          allActivityLog.push({
            company_id: companyId, user_id: userId, user_name: DEMO_OWNER_NAME,
            action: "updated", entity_type: "order", entity_id: orderId,
            summary: `Order ${orderNumber} ${deliveryStatus}`,
            created_at: new Date(orderDate.getTime() + randInt(36000000, 72000000)).toISOString(),
            metadata: {},
          });
        }
      }
    }

    // Batch insert
    console.log(`Inserting: ${allOrders.length} orders, ${allOrderLines.length} lines`);
    await batchInsert(admin, "orders", allOrders);
    await batchInsert(admin, "order_lines", allOrderLines);
    if (allOrderSchemes.length) await batchInsert(admin, "order_schemes", allOrderSchemes);
    if (allStockDeductions.length) await batchInsert(admin, "stock_deductions", allStockDeductions);
    if (allInvoices.length) await batchInsert(admin, "invoices", allInvoices);
    if (allInvoiceLines.length) await batchInsert(admin, "invoice_lines", allInvoiceLines);
    if (allClaims.length) await batchInsert(admin, "claims", allClaims);
    if (allClaimLines.length) await batchInsert(admin, "claim_lines", allClaimLines);
    if (allActivityLog.length) await batchInsert(admin, "activity_log", allActivityLog);

    // 11. Targets — monthly per salesperson (current + last 2 months)
    const targetRows: any[] = [];
    for (const spIdx of spIds.keys()) {
      for (const monthOffset of [0, 1, 2]) {
        const pStart = new Date();
        pStart.setDate(1);
        pStart.setMonth(pStart.getMonth() - monthOffset);
        targetRows.push({
          company_id: companyId, entity_type: "salesperson",
          entity_id: spIds[spIdx], entity_name: SALES_TEAM[spIdx].name,
          period_type: "monthly", period_start: dateStr(pStart),
          target_orders: randInt(20, 45), target_revenue: randInt(800000, 2500000),
        });
      }
    }
    // Quarterly targets for top 15 dealers
    for (let i = 0; i < 15 && i < dealerIds.length; i++) {
      const qStart = new Date();
      qStart.setMonth(Math.floor(qStart.getMonth() / 3) * 3, 1);
      targetRows.push({
        company_id: companyId, entity_type: "distributor",
        entity_id: dealerIds[i].id, entity_name: dealerIds[i].name,
        period_type: "quarterly", period_start: dateStr(qStart),
        target_orders: randInt(30, 80), target_revenue: randInt(1500000, 5000000),
      });
    }
    await batchInsert(admin, "targets", targetRows);

    // 12. Secondary sales (~50 retailer offtake rows over last 30 days)
    const RETAILERS = [
      "Modern Bazaar — Bandra", "Nature's Basket — Worli", "More Megastore — Powai",
      "Local Kirana — Koregaon Park", "DMart — Hinjewadi", "Le Marche — Indiranagar",
      "Big Bazaar — Whitefield", "Spencer's — Saket", "Reliance Fresh — Noida",
      "Q-Mart — Gurugram", "Q-Mart — Banjara Hills", "Foodhall — Anna Nagar",
    ];
    const secondaryRows: any[] = [];
    for (let i = 0; i < 50; i++) {
      const dealer = pick(dealerIds);
      const pIdx = randInt(0, productIds.length - 1);
      secondaryRows.push({
        company_id: companyId,
        distributor_id: dealer.id,
        product_id: productIds[pIdx],
        product_name: PRODUCTS[pIdx].name,
        retailer_name: pick(RETAILERS),
        quantity: randInt(2, 15),
        date: dateStr(daysAgo(randInt(0, 30))),
        remarks: pick(["Strong pull", "Promo display", "Repeat order", "End-of-aisle push", ""]),
      });
    }
    await batchInsert(admin, "secondary_sales", secondaryRows);

    // 13. Notifications — 5 unread, mix of types
    const topDealer = dealerIds[0];
    const notifRows = [
      {
        company_id: companyId, user_id: userId, type: "credit_risk",
        title: `${topDealer.name} — CRITICAL`,
        message: `${topDealer.name} has ₹4,82,000 outstanding for 90+ days. Review credit limit.`,
        read: false,
      },
      {
        company_id: companyId, user_id: userId, type: "stock_low",
        title: "Alphonso Mango 250ml running low",
        message: "Mumbai CFA — Bhiwandi has only 8 cases left. Reorder recommended.",
        read: false,
      },
      {
        company_id: companyId, user_id: userId, type: "order_pending",
        title: "5 orders awaiting dispatch",
        message: "5 orders for Bangalore region are pending dispatch >48 hours.",
        read: false,
      },
      {
        company_id: companyId, user_id: userId, type: "general",
        title: "Monthly target hit by Karan Malhotra",
        message: "Delhi NCR rep hit ₹18.4 L this month — 112% of target.",
        read: false,
      },
      {
        company_id: companyId, user_id: userId, type: "general",
        title: "Weekly review ready",
        message: "Last week: ₹4.2 L revenue, 12 new orders, 3 dealers crossed credit limit.",
        read: false,
      },
    ];
    await batchInsert(admin, "notifications", notifRows);

    // 14. Pinned command palette saved views
    await batchInsert(admin, "command_saved_views", [
      {
        company_id: companyId, user_id: userId,
        name: "Overdue > 60 days",
        params: { entity: "dealers", filter: "aging_61plus" },
        is_pinned: true,
      },
      {
        company_id: companyId, user_id: userId,
        name: "This week's dispatches",
        params: { entity: "orders", filter: "dispatched_this_week" },
        is_pinned: true,
      },
    ]);

    // 15. Update company sequence
    await admin.from("companies").update({
      next_order_sequence: orderSeq,
      next_invoice_sequence: invoiceSeq,
    }).eq("id", companyId);

    const summary = {
      email: DEMO_EMAIL,
      userId,
      companyId,
      counts: {
        products: productRows.length,
        dealers: dealerRows.length,
        salespersons: spRows.length,
        godowns: godownRows.length,
        stockItems: stockRows.length,
        schemes: schemeRows.length,
        orders: allOrders.length,
        orderLines: allOrderLines.length,
        orderSchemes: allOrderSchemes.length,
        invoices: allInvoices.length,
        invoiceLines: allInvoiceLines.length,
        claims: allClaims.length,
        claimLines: allClaimLines.length,
        stockDeductions: allStockDeductions.length,
        targets: targetRows.length,
        secondarySales: secondaryRows.length,
        notifications: notifRows.length,
        activityLog: allActivityLog.length,
      },
    };

    return new Response(JSON.stringify(summary, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
