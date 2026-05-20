## The pitch

A **fresh "RAW Pressery" demo workspace** at `demo@getledge.in` that looks and feels like a real, mature FMCG distributor operating in India for 8+ months — so when prospects log in, every page tells a story, every chart has shape, and your My Business page reads like a battle-tested HQ profile.

This is not a "test data dump." It's a **showroom**.

---

## Step 0 — Wipe & preserve (confirmed)

- **Keep:** `asha@getledge.in` (your owner login) + its workspace.
- **Wipe:** the other 17 accounts + their 17 workspaces, plus all child rows (orders, dealers, products, invoices, claims, schemes, targets, stock, notifications, activity, signal acks, saved views, invites, error logs, capability overrides) and their `company-logos` uploads.
- CSV backup of pre-wipe state to `/mnt/documents/pre-wipe-backup-2026-05-20/` first.

---

## Step 1 — The RAW Pressery workspace (the centerpiece)

### Company profile (My Business page hero)

This is where I'll spend the most care. Every field on Settings → Company will be filled — no placeholders, no empty states.

| Field | Value |
|---|---|
| Company name | **RAW Pressery Foods Pvt Ltd** |
| GSTIN | `27AAKCR3478H1ZN` (Maharashtra, valid checksum) |
| PAN | `AAKCR3478H` |
| State code | `27` (Maharashtra) |
| Registered address | Unit 401, Lotus Business Park, Off New Link Road, Andheri West, Mumbai 400053 |
| Phone | +91 22 4890 5500 |
| Email | hello@rawpressery.in |
| Bank name | HDFC Bank |
| Account name | RAW Pressery Foods Pvt Ltd |
| Account number | 50200012345678 |
| IFSC | HDFC0000123 |
| Order prefix | `RAW` → orders look like `RAW-2026-0001` |
| Invoice prefix | `RAW/INV` → invoices look like `RAW/INV-2026-0421` |
| **Logo** | **I'll generate a clean RAW Pressery–style wordmark + leaf mark** (premium imagegen) and upload it via the company-logos bucket so it appears on the dashboard, GST invoices, and the My Business hero. |

### Owner profile

- Name: **Anuj Rakyan** (founder-style name — feels real, isn't your name)
- Role: Super admin
- Team size: 11–50
- Self-selected role: "Founder / CEO"

---

## Step 2 — A real team (Sales Team page)

**12 salespersons** across actual RAW Pressery distribution territory (Mumbai metro + Pune + Bangalore + Delhi NCR + Hyderabad). Each gets a name, phone, email, region. Their `total_orders` and `total_value` will populate naturally from the seeded orders, so leaderboards render correctly.

**Top performer** will be tuned to ~₹18 lakh delivered, bottom performer ~₹3 lakh — gives the Performance page a meaningful spread for charts.

---

## Step 3 — Products catalog (Stock → Products)

**26 SKUs** mirroring RAW Pressery's actual lineup:

- **Cold-pressed juices (200ml & 250ml):** Valencia Orange, Alphonso Mango, Pomegranate, Mixed Fruit, Sugarcane, Coconut Water, Aam Panna, Pineapple, Apple, Watermelon, Kale Surprise, Beetroot Booster
- **Protein milkshakes (200ml):** Cold Coffee, Choco Mint, Vanilla, Strawberry
- **Lactose-free beverages (1L):** Unsweetened Almond, Vanilla Almond, Chocolate Almond, Oat Milk Original, Oat Milk Barista
- **Wellness shots (60ml):** Ginger Shot, Turmeric Shot, Wheatgrass Shot
- **Variety packs:** Wellness Bundle, Detox Pack, Family Pack

Realistic MRPs (₹50–₹2,400 case), HSN codes (2009 for juices, 0403 for dairy alternatives, 2202 for beverages), proper units (Pack / Case / Bottle).

---

## Step 4 — Warehouses (Stock → Warehouses)

**4 godowns** — matches RAW Pressery's real cold-chain footprint:

1. **Mumbai CFA (Bhiwandi)** — primary, ~60% of stock
2. **Bangalore DC (Bommanahalli)** — south hub
3. **Delhi NCR (Manesar)** — north hub
4. **Hyderabad Spoke (Medchal)** — secondary

Stock_items will have realistic quantities + thresholds so the **Stock Health** badges show a healthy mix: most green, a few amber ("running low"), 2–3 red ("reorder now") — enough drama for the demo without looking broken.

---

## Step 5 — Dealers (Distributors page)

**28 dealers** across Mumbai / Pune / Bangalore / Delhi / Hyderabad / Chennai. Real-sounding names ("Sharma Beverages — Bandra", "Karnataka Cold Supplies", "NCR Modern Trade Pvt Ltd", "Big Basket — Hyderabad CFA", "Reliance Smart — Pune Hub"). Each gets:

- Full GSTIN (state-correct), PAN, address, contact, email, bank details
- Credit limit (₹50k–₹15L spread)
- Outstanding (auto-computed from delivered + unpaid orders)
- A realistic aging spread: **18 dealers current, 5 in 31–60, 3 in 61–90, 2 in 90+** → Credit-at-Risk signal lights up, dealer aging report has all four buckets populated.

---

## Step 6 — Schemes (Schemes page)

**6 active schemes** showing every scheme type:

- "Monsoon 10% off" — percentage on juices
- "Buy 10 cases get 1 free" — buy/free on Mumbai region
- "Flat ₹500 off above ₹10,000" — flat amount, min order
- "Big Basket Q3 deal" — dealer-specific
- "Almond launch combo" — product-specific
- "Festive ₹2,000 off above ₹25,000" — expired (shows history)

---

## Step 7 — Orders + line items + invoices (the engine)

**~240 orders spread across the last 180 days** with realistic seasonality (spike in Apr–May for summer juice demand):

- **Status mix:** ~70% delivered, ~15% dispatched, ~10% pending, ~5% cancelled
- **Payment mix:** ~55% paid, ~25% partial, ~20% pending
- **Each delivered order auto-generates a GST invoice** via the existing invoice flow — proper IGST/CGST+SGST split based on dealer state vs Maharashtra (27)
- Each order has 3–8 line items, scheme savings where applicable, dispatch dates, vehicle numbers, driver names
- **Stock deductions** fire correctly via `dispatch_order_atomic` so warehouse balances reconcile

**Result:** Dashboard KPIs show ~₹1.4 Cr revenue, ~₹22 L outstanding, ~240 orders, all sparklines populated. Today's Briefing (Gemini AI) has rich data to summarize.

---

## Step 8 — Secondary sales, claims, targets

- **~40 secondary sales rows** (retailer-level offtake) so the Secondary Sales report isn't empty
- **6 claims:** 3 resolved returns, 2 open damage claims, 1 short-supply — shows the full claim lifecycle including restore_stock
- **Monthly targets** for every salesperson + the company for the last 3 months → Performance page hits/misses render

---

## Step 9 — Activity feed + notifications

- ~80 activity_log rows so the recent-activity panel scrolls with real entries ("Anuj created order RAW-2026-0238", "Stock low: Alphonso Mango 200ml — 12 cases")
- 5 unread notifications including 1 critical credit-risk + 1 stock low + 1 dealer aging — bell icon shows a meaningful badge during the demo

---

## Step 10 — Demo polish & guard rails

- **Saved Command views:** 2 pre-pinned ("Overdue >60 days", "This week's dispatches") so Cmd+K already feels lived-in
- **Logo upload:** generate and upload a RAW Pressery–style mark to the company-logos bucket using the same path scheme the app expects
- Update the `seed-demo-account` edge function entirely — rename Asha Beverages → RAW Pressery, swap product list, dealer list, salesperson list, address, GSTIN, etc.
- Make the seed **idempotent and re-runnable** so we can refresh it in 2 months without re-engineering
- Save `mem://demo/account` documenting the canonical demo email, password secret name, and refresh procedure

---

## Step 11 — QA before handing over

After seeding, I'll log in as `demo@getledge.in` and walk every page:

| Page | What I'll verify |
|---|---|
| Dashboard | KPIs populated, Today's Briefing renders an AI sentence, signal cards lit |
| My Business | Logo visible, every field filled, bank + GST verified, looks pitch-ready |
| Orders | 240 rows, status badges varied, filters work, export PDF/CSV works |
| Order detail | Invoice generates with correct GST split |
| Dealers | All 28 visible, aging buckets populated, credit-at-risk lights up |
| Stock | 4 warehouses, 26 products, mix of green/amber/red health |
| Sales Team | 12 reps with non-zero totals, leaderboard renders |
| Schemes | 6 schemes, scheme savings show on orders |
| Reports | All 5 reports return data; charts have shape |
| Performance | Target vs actual bars render |
| Claims | 6 claims, open + resolved both present |
| Billing | Invoices listed, can download a PDF |
| Notifications | 5 unread, bell badge shows count |
| Cmd+K | Pinned views appear, search returns hits |

Screenshots of each page saved to `/mnt/documents/demo-qa-2026-05-20/` so you can review without logging in.

---

## Demo credentials (after Step 11)

- **URL:** https://www.getledge.in/auth
- **Email:** `demo@getledge.in`
- **Password:** (from `DEMO_ACCOUNT_PASSWORD` secret — already set, I won't expose it)
- **Workspace:** RAW Pressery Foods Pvt Ltd

You can hand these out to prospects. The data is fictional but realistic enough that nobody will guess.

---

## What I will NOT touch

- `asha@getledge.in` and its workspace.
- Any schema, RLS, edge functions other than the `seed-demo-account` rewrite.
- Auth settings, secrets, or storage policies.
- The landing page, app design, or any of the V2 work we've shipped.

---

## Time + risk

- Wipe: 1 migration, irreversible without the CSV backup → I take the backup first.
- Seed function rewrite: ~30 min of edits, then deploy + invoke + QA.
- Total: should be done in one go, single approval.

---

**Approve and I'll execute Step 0 → Step 11 in order. If you want any field changed (a different founder name, a different city mix, a different brand spelling), tell me now and I'll bake it in.**
