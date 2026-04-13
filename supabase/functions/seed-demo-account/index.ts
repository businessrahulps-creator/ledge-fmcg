import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Helpers ──────────────────────────────────────────────────────────
function uuid() { return crypto.randomUUID(); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function dateStr(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

// ── Company ──────────────────────────────────────────────────────────
const COMPANY = {
  name: "Asha Beverages Distributors",
  gstin: "32AABCA1234F1ZP",
  pan: "AABCA1234F",
  state_code: "32",
  address: "42/1, Industrial Estate, Kalamassery, Ernakulam, Kerala 683109",
  phone: "+91 484 2555 100",
  email: "info@ashabeverages.in",
  bank_name: "Federal Bank",
  bank_account: "16720200012345",
  bank_account_name: "Asha Beverages Distributors",
  bank_ifsc: "FDRL0001672",
  order_prefix: "ABD",
  invoice_prefix: "ABD-INV",
};

// ── Products (45 SKUs) ───────────────────────────────────────────────
const PRODUCTS = [
  // Water
  { name: "AquaPure Packaged Water 500ml", sku: "APW-500", unit: "Case", base_price: 120, hsn: "2201" },
  { name: "AquaPure Packaged Water 1L", sku: "APW-1L", unit: "Case", base_price: 180, hsn: "2201" },
  { name: "AquaPure Packaged Water 2L", sku: "APW-2L", unit: "Case", base_price: 240, hsn: "2201" },
  { name: "AquaPure Packaged Water 5L", sku: "APW-5L", unit: "Case", base_price: 360, hsn: "2201" },
  { name: "AquaPure Packaged Water 20L Can", sku: "APW-20L", unit: "Can", base_price: 45, hsn: "2201" },
  { name: "AquaPure Sparkling Water 300ml", sku: "APS-300", unit: "Case", base_price: 240, hsn: "2201" },
  { name: "AquaPure Sparkling Water 750ml", sku: "APS-750", unit: "Case", base_price: 360, hsn: "2201" },
  { name: "AquaPure Soda 300ml", sku: "APD-300", unit: "Case", base_price: 180, hsn: "2201" },
  // Juices
  { name: "TropiFresh Mango Juice 200ml", sku: "TFM-200", unit: "Case", base_price: 240, hsn: "2202" },
  { name: "TropiFresh Mango Juice 500ml", sku: "TFM-500", unit: "Case", base_price: 480, hsn: "2202" },
  { name: "TropiFresh Mango Juice 1L", sku: "TFM-1L", unit: "Case", base_price: 720, hsn: "2202" },
  { name: "TropiFresh Orange Juice 200ml", sku: "TFO-200", unit: "Case", base_price: 240, hsn: "2202" },
  { name: "TropiFresh Orange Juice 500ml", sku: "TFO-500", unit: "Case", base_price: 480, hsn: "2202" },
  { name: "TropiFresh Orange Juice 1L", sku: "TFO-1L", unit: "Case", base_price: 720, hsn: "2202" },
  { name: "TropiFresh Mixed Fruit 200ml", sku: "TFMX-200", unit: "Case", base_price: 260, hsn: "2202" },
  { name: "TropiFresh Mixed Fruit 500ml", sku: "TFMX-500", unit: "Case", base_price: 500, hsn: "2202" },
  { name: "TropiFresh Mixed Fruit 1L", sku: "TFMX-1L", unit: "Case", base_price: 780, hsn: "2202" },
  { name: "TropiFresh Guava Juice 200ml", sku: "TFG-200", unit: "Case", base_price: 230, hsn: "2202" },
  { name: "TropiFresh Guava Juice 500ml", sku: "TFG-500", unit: "Case", base_price: 460, hsn: "2202" },
  { name: "TropiFresh Pomegranate Juice 200ml", sku: "TFP-200", unit: "Case", base_price: 300, hsn: "2202" },
  { name: "TropiFresh Pomegranate Juice 500ml", sku: "TFP-500", unit: "Case", base_price: 580, hsn: "2202" },
  { name: "TropiFresh Litchi Juice 200ml", sku: "TFL-200", unit: "Case", base_price: 260, hsn: "2202" },
  { name: "TropiFresh Pineapple Juice 200ml", sku: "TFPN-200", unit: "Case", base_price: 250, hsn: "2202" },
  { name: "TropiFresh Pineapple Juice 1L", sku: "TFPN-1L", unit: "Case", base_price: 750, hsn: "2202" },
  // Carbonated
  { name: "FizzUp Cola 300ml", sku: "FUC-300", unit: "Case", base_price: 200, hsn: "2202" },
  { name: "FizzUp Cola 500ml", sku: "FUC-500", unit: "Case", base_price: 360, hsn: "2202" },
  { name: "FizzUp Cola 2L", sku: "FUC-2L", unit: "Case", base_price: 480, hsn: "2202" },
  { name: "FizzUp Lemon 300ml", sku: "FUL-300", unit: "Case", base_price: 200, hsn: "2202" },
  { name: "FizzUp Lemon 500ml", sku: "FUL-500", unit: "Case", base_price: 360, hsn: "2202" },
  { name: "FizzUp Orange 300ml", sku: "FUO-300", unit: "Case", base_price: 200, hsn: "2202" },
  { name: "FizzUp Orange 2L", sku: "FUO-2L", unit: "Case", base_price: 480, hsn: "2202" },
  { name: "FizzUp Ginger 300ml", sku: "FUG-300", unit: "Case", base_price: 210, hsn: "2202" },
  { name: "FizzUp Ginger 500ml", sku: "FUG-500", unit: "Case", base_price: 380, hsn: "2202" },
  // Energy
  { name: "VoltCharge Energy Drink 250ml", sku: "VCE-250", unit: "Case", base_price: 600, hsn: "2202" },
  { name: "VoltCharge Energy Drink 500ml", sku: "VCE-500", unit: "Case", base_price: 960, hsn: "2202" },
  { name: "VoltCharge Sugar-Free 250ml", sku: "VCSF-250", unit: "Case", base_price: 640, hsn: "2202" },
  // Traditional
  { name: "Desi Chaas Buttermilk 200ml", sku: "DCB-200", unit: "Case", base_price: 160, hsn: "0403" },
  { name: "Desi Chaas Buttermilk 500ml", sku: "DCB-500", unit: "Case", base_price: 320, hsn: "0403" },
  { name: "Kerala Tender Coconut Water 200ml", sku: "KTC-200", unit: "Case", base_price: 280, hsn: "2009" },
  { name: "Kerala Tender Coconut Water 500ml", sku: "KTC-500", unit: "Case", base_price: 520, hsn: "2009" },
  { name: "Nannari Rose Milk 200ml", sku: "NRM-200", unit: "Case", base_price: 200, hsn: "2202" },
  { name: "Nannari Rose Milk 500ml", sku: "NRM-500", unit: "Case", base_price: 400, hsn: "2202" },
  { name: "Jal Jeera Masala Drink 200ml", sku: "JJM-200", unit: "Case", base_price: 180, hsn: "2202" },
  { name: "Jal Jeera Masala Drink 500ml", sku: "JJM-500", unit: "Case", base_price: 340, hsn: "2202" },
  { name: "Paneer Soda 250ml", sku: "PNS-250", unit: "Case", base_price: 160, hsn: "2202" },
];

// ── Dealers (80+) ────────────────────────────────────────────────────
const DEALER_TEMPLATES: Array<{ name: string; location: string; state: string; stateCode: string }> = [
  // Kerala – Kochi (15)
  { name: "Anand Beverages", location: "Ernakulam, Kochi", state: "KL", stateCode: "32" },
  { name: "Malabar Cold Drinks", location: "Edappally, Kochi", state: "KL", stateCode: "32" },
  { name: "Kochi Wholesale Beverages", location: "Kaloor, Kochi", state: "KL", stateCode: "32" },
  { name: "Sree Krishna Traders", location: "Fort Kochi", state: "KL", stateCode: "32" },
  { name: "Mattancherry Store House", location: "Mattancherry, Kochi", state: "KL", stateCode: "32" },
  { name: "Marine Drive Distributors", location: "Marine Drive, Kochi", state: "KL", stateCode: "32" },
  { name: "Cochin Beverages Hub", location: "Vytilla, Kochi", state: "KL", stateCode: "32" },
  { name: "Thoppumpady Cold Storage", location: "Thoppumpady, Kochi", state: "KL", stateCode: "32" },
  { name: "Aluva Beverages Centre", location: "Aluva, Kochi", state: "KL", stateCode: "32" },
  { name: "Perumbavoor Drinks Depot", location: "Perumbavoor, Kochi", state: "KL", stateCode: "32" },
  { name: "Kakkanad Refreshments", location: "Kakkanad, Kochi", state: "KL", stateCode: "32" },
  { name: "Tripunithura Beverages", location: "Tripunithura, Kochi", state: "KL", stateCode: "32" },
  { name: "Cheranalloor Traders", location: "Cheranalloor, Kochi", state: "KL", stateCode: "32" },
  { name: "Palarivattom Wholesale", location: "Palarivattom, Kochi", state: "KL", stateCode: "32" },
  { name: "Angamaly Drinks Agency", location: "Angamaly, Kochi", state: "KL", stateCode: "32" },
  // Kerala – Trivandrum (12)
  { name: "Thiruvananthapuram Beverages", location: "Pattom, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Technopark Refreshments", location: "Technopark, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Kazhakkoottam Traders", location: "Kazhakkoottam, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Kowdiar Drinks Centre", location: "Kowdiar, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Sreekaryam Cold Drinks", location: "Sreekaryam, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Varkala Beverages", location: "Varkala, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Attingal Drinks Depot", location: "Attingal, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Neyyattinkara Store", location: "Neyyattinkara, Trivandrum", state: "KL", stateCode: "32" },
  { name: "East Fort Traders", location: "East Fort, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Kesavadasapuram Agency", location: "Kesavadasapuram, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Ulloor Beverages Centre", location: "Ulloor, Trivandrum", state: "KL", stateCode: "32" },
  { name: "Vazhuthacaud Wholesale", location: "Vazhuthacaud, Trivandrum", state: "KL", stateCode: "32" },
  // Kerala – Kollam (8)
  { name: "Kollam City Beverages", location: "Chinnakada, Kollam", state: "KL", stateCode: "32" },
  { name: "Paravur Drinks Depot", location: "Paravur, Kollam", state: "KL", stateCode: "32" },
  { name: "Karunagappally Traders", location: "Karunagappally, Kollam", state: "KL", stateCode: "32" },
  { name: "Punalur Cold Drinks", location: "Punalur, Kollam", state: "KL", stateCode: "32" },
  { name: "Kottarakkara Beverages", location: "Kottarakkara, Kollam", state: "KL", stateCode: "32" },
  { name: "Anchal Refreshments", location: "Anchal, Kollam", state: "KL", stateCode: "32" },
  { name: "Chavara Trading Co.", location: "Chavara, Kollam", state: "KL", stateCode: "32" },
  { name: "Kundara Wholesale Drinks", location: "Kundara, Kollam", state: "KL", stateCode: "32" },
  // Kerala – Alappuzha (8)
  { name: "Alappuzha Beverages", location: "Beach Road, Alappuzha", state: "KL", stateCode: "32" },
  { name: "Cherthala Drinks Centre", location: "Cherthala, Alappuzha", state: "KL", stateCode: "32" },
  { name: "Kayamkulam Traders", location: "Kayamkulam, Alappuzha", state: "KL", stateCode: "32" },
  { name: "Haripad Cold Storage", location: "Haripad, Alappuzha", state: "KL", stateCode: "32" },
  { name: "Mavelikkara Beverages", location: "Mavelikkara, Alappuzha", state: "KL", stateCode: "32" },
  { name: "Ambalapuzha Refreshments", location: "Ambalapuzha, Alappuzha", state: "KL", stateCode: "32" },
  { name: "Mannancherry Traders", location: "Mannancherry, Alappuzha", state: "KL", stateCode: "32" },
  { name: "Kuttanad Beverages Hub", location: "Kuttanad, Alappuzha", state: "KL", stateCode: "32" },
  // Kerala – Thrissur (6)
  { name: "Thrissur Central Beverages", location: "Swaraj Round, Thrissur", state: "KL", stateCode: "32" },
  { name: "Kunnamkulam Drinks Agency", location: "Kunnamkulam, Thrissur", state: "KL", stateCode: "32" },
  { name: "Irinjalakuda Traders", location: "Irinjalakuda, Thrissur", state: "KL", stateCode: "32" },
  { name: "Chalakudy Beverages", location: "Chalakudy, Thrissur", state: "KL", stateCode: "32" },
  { name: "Guruvayoor Cold Drinks", location: "Guruvayoor, Thrissur", state: "KL", stateCode: "32" },
  { name: "Wadakkanchery Wholesale", location: "Wadakkanchery, Thrissur", state: "KL", stateCode: "32" },
  // Kerala – Kozhikode (6)
  { name: "Kozhikode Beverages Mart", location: "S.M. Street, Kozhikode", state: "KL", stateCode: "32" },
  { name: "Mankavu Drinks Depot", location: "Mankavu, Kozhikode", state: "KL", stateCode: "32" },
  { name: "Feroke Beverages Centre", location: "Feroke, Kozhikode", state: "KL", stateCode: "32" },
  { name: "Vadakara Cold Drinks", location: "Vadakara, Kozhikode", state: "KL", stateCode: "32" },
  { name: "Beypore Trading Company", location: "Beypore, Kozhikode", state: "KL", stateCode: "32" },
  { name: "Koyilandy Beverages", location: "Koyilandy, Kozhikode", state: "KL", stateCode: "32" },
  // Tamil Nadu – Chennai (10)
  { name: "T. Nagar Beverages", location: "T. Nagar, Chennai", state: "TN", stateCode: "33" },
  { name: "Anna Nagar Drinks Hub", location: "Anna Nagar, Chennai", state: "TN", stateCode: "33" },
  { name: "Adyar Wholesale Beverages", location: "Adyar, Chennai", state: "TN", stateCode: "33" },
  { name: "Tambaram Cold Drinks", location: "Tambaram, Chennai", state: "TN", stateCode: "33" },
  { name: "Velachery Refreshments", location: "Velachery, Chennai", state: "TN", stateCode: "33" },
  { name: "Porur Beverages Centre", location: "Porur, Chennai", state: "TN", stateCode: "33" },
  { name: "Chromepet Traders", location: "Chromepet, Chennai", state: "TN", stateCode: "33" },
  { name: "Guindy Drinks Agency", location: "Guindy, Chennai", state: "TN", stateCode: "33" },
  { name: "Ambattur Beverages Mart", location: "Ambattur, Chennai", state: "TN", stateCode: "33" },
  { name: "Sholinganallur Wholesale", location: "Sholinganallur, Chennai", state: "TN", stateCode: "33" },
  // Tamil Nadu – Madurai (5)
  { name: "Madurai Central Beverages", location: "Meenakshi Amman, Madurai", state: "TN", stateCode: "33" },
  { name: "Thirunagar Cold Drinks", location: "Thirunagar, Madurai", state: "TN", stateCode: "33" },
  { name: "Anna Bus Stand Traders", location: "Anna Bus Stand, Madurai", state: "TN", stateCode: "33" },
  { name: "Palanganatham Beverages", location: "Palanganatham, Madurai", state: "TN", stateCode: "33" },
  { name: "Usilampatti Drinks Depot", location: "Usilampatti, Madurai", state: "TN", stateCode: "33" },
  // Tamil Nadu – Coimbatore (5)
  { name: "Gandhipuram Beverages", location: "Gandhipuram, Coimbatore", state: "TN", stateCode: "33" },
  { name: "RS Puram Cold Drinks", location: "RS Puram, Coimbatore", state: "TN", stateCode: "33" },
  { name: "Peelamedu Traders", location: "Peelamedu, Coimbatore", state: "TN", stateCode: "33" },
  { name: "Saibaba Colony Beverages", location: "Saibaba Colony, Coimbatore", state: "TN", stateCode: "33" },
  { name: "Singanallur Drinks Hub", location: "Singanallur, Coimbatore", state: "TN", stateCode: "33" },
  // Tamil Nadu – Tiruchirappalli (5)
  { name: "Trichy Beverages Centre", location: "Cantonment, Tiruchirappalli", state: "TN", stateCode: "33" },
  { name: "Srirangam Cold Drinks", location: "Srirangam, Tiruchirappalli", state: "TN", stateCode: "33" },
  { name: "Thillai Nagar Traders", location: "Thillai Nagar, Tiruchirappalli", state: "TN", stateCode: "33" },
  { name: "KK Nagar Beverages", location: "KK Nagar, Tiruchirappalli", state: "TN", stateCode: "33" },
  { name: "Woraiyur Wholesale Drinks", location: "Woraiyur, Tiruchirappalli", state: "TN", stateCode: "33" },
];

// ── Sales Team (12) ──────────────────────────────────────────────────
const SALES_TEAM = [
  { name: "Rajesh Nair", phone: "+91 94470 10001", email: "rajesh.nair@ashabev.in", region: "Kochi" },
  { name: "Suresh Menon", phone: "+91 94470 10002", email: "suresh.menon@ashabev.in", region: "Kochi" },
  { name: "Anil Kumar V", phone: "+91 94470 10003", email: "anil.v@ashabev.in", region: "Trivandrum" },
  { name: "Bindu Lakshmi", phone: "+91 94470 10004", email: "bindu.l@ashabev.in", region: "Trivandrum" },
  { name: "Dileep Krishnan", phone: "+91 94470 10005", email: "dileep.k@ashabev.in", region: "Kollam-Alappuzha" },
  { name: "Gopika S", phone: "+91 94470 10006", email: "gopika.s@ashabev.in", region: "Thrissur-Kozhikode" },
  { name: "Karthikeyan P", phone: "+91 98410 20001", email: "karthi.p@ashabev.in", region: "Chennai North" },
  { name: "Murugan R", phone: "+91 98410 20002", email: "murugan.r@ashabev.in", region: "Chennai South" },
  { name: "Priya Selvam", phone: "+91 98410 20003", email: "priya.s@ashabev.in", region: "Madurai" },
  { name: "Senthil Kumar", phone: "+91 98410 20004", email: "senthil.k@ashabev.in", region: "Coimbatore" },
  { name: "Lakshmi Devi T", phone: "+91 98410 20005", email: "lakshmi.t@ashabev.in", region: "Tiruchirappalli" },
  { name: "Vijayakumar M", phone: "+91 94470 10007", email: "vijay.m@ashabev.in", region: "Kerala Rural" },
];

// ── Godowns (5) ──────────────────────────────────────────────────────
const GODOWNS = [
  { name: "Main Warehouse — Kochi", address: "Plot 12, CSEZ, Kakkanad, Kochi, Kerala 682037" },
  { name: "Hub — Chennai", address: "No. 45, Ambattur Industrial Estate, Chennai, TN 600058" },
  { name: "Depot — Coimbatore", address: "SF 22, SIDCO, Coimbatore, TN 641021" },
  { name: "Depot — Trivandrum", address: "TC 4/1200, Kazhakkoottam, Trivandrum, Kerala 695582" },
  { name: "Depot — Madurai", address: "Plot 8, SIPCOT, Kappalur, Madurai, TN 625008" },
];

const VEHICLES = [
  "KL-07-AB-1234", "KL-07-CD-5678", "KL-01-EF-9012", "KL-01-GH-3456",
  "KL-10-IJ-7890", "KL-14-KL-1234", "TN-01-MN-5678", "TN-01-OP-9012",
  "TN-09-QR-3456", "TN-38-ST-7890", "TN-45-UV-1234", "TN-59-WX-5678",
];
const DRIVERS = [
  "Babu", "Sajan", "Unni", "Manoj", "Vijayan", "Rajan",
  "Kumar", "Selvam", "Murugesan", "Arumugam", "Dasan", "Kannan",
];
const PAYMENT_MODES = ["cash", "bank_transfer", "upi", "cheque"] as const;
const CLAIM_TYPES = ["return", "shortage", "damage"] as const;
const CLAIM_REASONS = [
  "Damaged during transit — bottles broken",
  "Expired stock delivered — manufacturing date issue",
  "Short delivery — 3 cases missing",
  "Wrong product delivered",
  "Leaking packages — seal failure",
  "Customer rejection — label damage",
  "Quality issue — off taste",
  "Overcharged on invoice",
  "Transport damage — carton crushed",
  "Near-expiry stock — less than 30 days shelf life",
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

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: "asha@getledge.in",
      password: "LedgeDemo2026",
      email_confirm: true,
      user_metadata: { full_name: "Asha Menon", company_name: COMPANY.name },
    });
    if (authErr && !authErr.message?.includes("already been registered")) throw authErr;

    let userId: string;
    if (authErr) {
      const { data: users } = await admin.auth.admin.listUsers();
      const existing = users.users.find((u: any) => u.email === "asha@getledge.in");
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
    const { error: profErr } = await admin.from("profiles")
      .update({ company_id: companyId, full_name: "Asha Menon" })
      .eq("user_id", userId);
    if (profErr) throw profErr;

    await admin.from("user_roles").insert({ user_id: userId, role: "super_admin" });

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
      return {
        id, company_id: companyId, name: d.name, location: d.location,
        contact: `+91 ${randInt(94000, 99999)} ${randInt(10000, 99999)}`,
        email: d.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 12) + "@gmail.com",
        gstin: `${d.stateCode}AABCD${gstinNum}E1Z${randInt(1, 9)}`,
        state_code: d.stateCode,
        address: `${randInt(1, 200)}, ${d.location}, ${d.state === "KL" ? "Kerala" : "Tamil Nadu"}`,
        credit_limit: pick([50000, 100000, 150000, 200000, 300000, 500000]),
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

    // 8. Stock Items (all products × all godowns = 225)
    const stockRows: any[] = [];
    for (const gIdx of godownIds.keys()) {
      for (const pIdx of productIds.keys()) {
        const healthRoll = Math.random();
        let qty: number, threshold: number;
        if (healthRoll < 0.15) { threshold = randInt(40, 80); qty = randInt(0, threshold); } // critical
        else if (healthRoll < 0.40) { threshold = randInt(40, 80); qty = randInt(threshold + 1, Math.floor(threshold * 1.2)); } // low
        else { threshold = randInt(30, 60); qty = randInt(Math.floor(threshold * 1.5), threshold * 5); } // healthy
        stockRows.push({
          company_id: companyId, product_id: productIds[pIdx], godown_id: godownIds[gIdx],
          quantity: qty, threshold,
          last_deducted_date: dateStr(daysAgo(randInt(0, 7))),
        });
      }
    }
    await batchInsert(admin, "stock_items", stockRows);

    // 9. Schemes (20)
    const schemeIds: string[] = [];
    const schemeNames = [
      "Summer Splash Water Combo", "Monsoon Mango Mania", "Festival Fizz Fiesta",
      "Bulk Juice Bonanza", "Energy Boost Bundle", "Desi Drinks Deal",
      "Coconut Water Cash Back", "Rose Milk Mega Offer", "Retailer Volume Reward",
      "New Dealer Welcome Bonus", "Quarterly Target Bonus", "Water Tanker Special",
      "Fruit Juice 10+1 Free", "Cola Buy 5 Get 1", "Weekend Special Combo",
      "Channel Partner Discount", "Buttermilk Summer Push", "Soda Season Scheme",
      "Premium Energy Trade Offer", "Pineapple Juice Launch Offer",
    ];
    const schemeTypes = ["percentage", "buy_x_get_y", "flat_amount", "percentage", "buy_x_get_y"];
    const schemeRows = schemeNames.map((name, i) => {
      const id = uuid();
      schemeIds.push(id);
      const sType = schemeTypes[i % schemeTypes.length];
      return {
        id, company_id: companyId, name,
        scheme_type: sType,
        description: `${name} — valid this season`,
        is_active: i < 16,
        valid_from: dateStr(daysAgo(30)),
        valid_until: i < 16 ? dateStr(daysAgo(-60)) : dateStr(daysAgo(5)),
        discount_percent: sType === "percentage" ? pick([5, 8, 10, 12, 15]) : 0,
        buy_qty: sType === "buy_x_get_y" ? pick([5, 10, 12]) : 0,
        free_qty: sType === "buy_x_get_y" ? pick([1, 2]) : 0,
        flat_amount: sType === "flat_amount" ? pick([200, 500, 1000, 1500]) : 0,
        min_qty: pick([0, 5, 10, 20]),
        min_order_value: pick([0, 5000, 10000, 25000]),
        product_id: i < 15 ? productIds[i % productIds.length] : null,
        dealer_id: i >= 15 ? dealerIds[i % dealerIds.length].id : null,
      };
    });
    await batchInsert(admin, "schemes", schemeRows);

    // 10. Orders (500+) over 30 days
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

    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const orderDate = daysAgo(dayOffset);
      const ordersToday = randInt(14, 20);

      for (let j = 0; j < ordersToday; j++) {
        const orderId = uuid();
        const dealer = pick(dealerIds);
        const spIdx = randInt(0, spIds.length - 1);
        const spName = SALES_TEAM[spIdx].name;
        const godownId = pick(godownIds);

        // 2-5 line items
        const lineCount = randInt(2, 5);
        const usedProducts = new Set<number>();
        let orderTotal = 0;
        const lines: any[] = [];

        for (let l = 0; l < lineCount; l++) {
          let pIdx: number;
          do { pIdx = randInt(0, productIds.length - 1); } while (usedProducts.has(pIdx));
          usedProducts.add(pIdx);
          const qty = randInt(5, 80);
          const price = PRODUCTS[pIdx].base_price;
          const lineTotal = qty * price;
          orderTotal += lineTotal;
          lines.push({
            order_id: orderId, product_id: productIds[pIdx],
            product_name: PRODUCTS[pIdx].name, quantity: qty,
            unit_price: price, line_total: lineTotal,
          });
        }

        // Payment & delivery status
        const isOld = dayOffset > 3;
        const deliveryStatus = isOld ? pick(["delivered", "delivered", "delivered", "dispatched"]) :
          dayOffset > 1 ? pick(["dispatched", "dispatched", "pending", "delivered"]) : pick(["pending", "pending", "dispatched"]);
        const paymentStatus = deliveryStatus === "delivered" ? pick(["paid", "paid", "paid", "partial"]) :
          pick(["pending", "partial", "paid"]);
        const paymentMode = pick(PAYMENT_MODES);

        const dispatchDate = deliveryStatus !== "pending" ? dateStr(new Date(orderDate.getTime() + 86400000 * randInt(0, 2))) : null;
        const vehicle = deliveryStatus !== "pending" ? pick(VEHICLES) : "";
        const driver = deliveryStatus !== "pending" ? pick(DRIVERS) : "";

        const orderNumber = `${COMPANY.order_prefix}-2026-${String(orderSeq).padStart(4, "0")}`;
        orderSeq++;

        // Scheme savings (~60% of orders)
        let schemeSavings = 0;
        if (Math.random() < 0.6 && schemeIds.length > 0) {
          const schemeIdx = randInt(0, schemeIds.length - 1);
          const scheme = schemeRows[schemeIdx];
          schemeSavings = scheme.scheme_type === "percentage"
            ? Math.round(orderTotal * scheme.discount_percent / 100)
            : scheme.scheme_type === "flat_amount" ? scheme.flat_amount
            : Math.round(orderTotal * 0.05);
          allOrderSchemes.push({
            order_id: orderId, scheme_id: schemeIds[schemeIdx],
            scheme_name: scheme.name,
            scheme_label: scheme.scheme_type === "percentage" ? `${scheme.discount_percent}% off` :
              scheme.scheme_type === "flat_amount" ? `₹${scheme.flat_amount} off` : `Buy ${scheme.buy_qty} Get ${scheme.free_qty}`,
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
            });
          }
        }

        // Invoice for delivered+paid
        if (deliveryStatus === "delivered" && paymentStatus === "paid") {
          const invoiceId = uuid();
          const isInterState = dealer.stateCode !== COMPANY.state_code;
          const gstRate = 18;
          const subtotal = orderTotal;
          const tax = Math.round(subtotal * gstRate / 100);
          const cgst = isInterState ? 0 : Math.round(tax / 2);
          const sgst = isInterState ? 0 : Math.round(tax / 2);
          const igst = isInterState ? tax : 0;
          const grandTotal = subtotal + tax;
          const roundOff = Math.round(grandTotal) - grandTotal;

          const invoiceNumber = `${COMPANY.invoice_prefix}-2026-${String(invoiceSeq).padStart(4, "0")}`;
          invoiceSeq++;

          allInvoices.push({
            id: invoiceId, company_id: companyId,
            invoice_number: invoiceNumber,
            invoice_date: dispatchDate || dateStr(orderDate),
            source_order_id: orderId,
            doc_type: "gst_invoice",
            buyer_name: dealer.name,
            buyer_address: `${dealer.location}`,
            buyer_gstin: dealerRows.find(d => d.id === dealer.id)?.gstin || "",
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
            grand_total: Math.round(grandTotal + roundOff),
            round_off: Math.round(roundOff * 100) / 100,
            amount_in_words: "",
            status: "sent",
          });

          for (const line of lines) {
            const prod = PRODUCTS.find((_, idx) => productIds[idx] === line.product_id);
            allInvoiceLines.push({
              invoice_id: invoiceId,
              product_name: line.product_name,
              hsn_code: prod?.hsn || "2202",
              quantity: line.quantity,
              unit: prod?.unit || "Case",
              unit_price: line.unit_price,
              taxable_value: line.line_total,
            });
          }
        }

        // Claims (~10% of delivered orders)
        if (deliveryStatus === "delivered" && Math.random() < 0.10) {
          const claimId = uuid();
          const claimType = pick(CLAIM_TYPES);
          const isResolved = Math.random() < 0.5;
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
          company_id: companyId, user_id: userId, user_name: "Asha Menon",
          action: "created", entity_type: "order", entity_id: orderId,
          summary: `Order ${orderNumber} placed for ${dealer.name}`,
          created_at: new Date(orderDate.getTime() + randInt(28800000, 64800000)).toISOString(),
          metadata: {},
        });

        if (deliveryStatus !== "pending") {
          allActivityLog.push({
            company_id: companyId, user_id: userId, user_name: "Asha Menon",
            action: "updated", entity_type: "order", entity_id: orderId,
            summary: `Order ${orderNumber} ${deliveryStatus}`,
            created_at: new Date(orderDate.getTime() + randInt(36000000, 72000000)).toISOString(),
            metadata: {},
          });
        }
      }
    }

    // Batch insert all generated data
    console.log(`Inserting: ${allOrders.length} orders, ${allOrderLines.length} lines, ${allOrderSchemes.length} schemes`);
    await batchInsert(admin, "orders", allOrders);
    await batchInsert(admin, "order_lines", allOrderLines);
    if (allOrderSchemes.length) await batchInsert(admin, "order_schemes", allOrderSchemes);
    if (allStockDeductions.length) await batchInsert(admin, "stock_deductions", allStockDeductions);
    if (allInvoices.length) await batchInsert(admin, "invoices", allInvoices);
    if (allInvoiceLines.length) await batchInsert(admin, "invoice_lines", allInvoiceLines);
    if (allClaims.length) await batchInsert(admin, "claims", allClaims);
    if (allClaimLines.length) await batchInsert(admin, "claim_lines", allClaimLines);
    if (allActivityLog.length) await batchInsert(admin, "activity_log", allActivityLog);

    // 11. Targets (40+)
    const targetRows: any[] = [];
    // Monthly targets for each salesperson (current + last month)
    for (const spIdx of spIds.keys()) {
      for (const monthOffset of [0, 1]) {
        const pStart = new Date();
        pStart.setMonth(pStart.getMonth() - monthOffset, 1);
        targetRows.push({
          company_id: companyId, entity_type: "salesperson",
          entity_id: spIds[spIdx], entity_name: SALES_TEAM[spIdx].name,
          period_type: "monthly", period_start: dateStr(pStart),
          target_orders: randInt(30, 60), target_revenue: randInt(500000, 2000000),
        });
      }
    }
    // Quarterly targets for top 20 dealers
    for (let i = 0; i < 20 && i < dealerIds.length; i++) {
      const qStart = new Date();
      qStart.setMonth(Math.floor(qStart.getMonth() / 3) * 3, 1);
      targetRows.push({
        company_id: companyId, entity_type: "distributor",
        entity_id: dealerIds[i].id, entity_name: dealerIds[i].name,
        period_type: "quarterly", period_start: dateStr(qStart),
        target_orders: randInt(40, 100), target_revenue: randInt(1000000, 5000000),
      });
    }
    await batchInsert(admin, "targets", targetRows);

    // 12. Update company sequence
    await admin.from("companies").update({
      next_order_sequence: orderSeq,
      next_invoice_sequence: invoiceSeq,
    }).eq("id", companyId);

    const summary = {
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
