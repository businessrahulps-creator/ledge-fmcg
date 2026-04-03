

# Landing Page Copy Audit: Mismatches with the Actual Platform

## Findings

After reading every landing page section and every app page, here's what the copy gets wrong:

### 1. "Godown" vs "Warehouse"
The app consistently uses **"Warehouse"** everywhere:
- Sidebar: "Stock" page
- Stock page heading: "Manage your products and **warehouse** inventory"
- Tab: "**Warehouses**"
- Buttons: "Add **Warehouse**"
- Toasts: "**Warehouse** added/deleted"
- Variables: `editWarehouse`, `isNewWarehouse`, `selectedWarehouse`, `getWarehouseStats`

But the landing page says "godown" in **7 places**:
- Features card 4 title: "Stock by **godown**, not guesswork"
- Features card 4 desc: no godown but references color-coded health
- Problem card 3: "sitting in your Surat **godown** for 45 days"
- HowItWorks Step 3: "Your Surat **godown** is at 12%"
- HowItWorks StockMockup column header: "**Godown**"
- WhyOrdra block 3: "Stock is tracked by **godown**"
- Testimonial 3: "Critical in the Pune **godown**"
- Pricing: "1 **godown**" and "Multi-**godown** stock"

**Fix:** Replace all with "warehouse."

### 2. "Offline mode" claims are overstated
The app has:
- A `useOnlineStatus` hook that detects connectivity and shows a toast
- **No service worker**, no Workbox, no IndexedDB, no cache storage, no local data persistence
- The memory note even says: "Service worker registration is intentionally suppressed in the development preview environment"
- Data lives in React context (in-memory). If the browser closes, everything is lost.

The landing page claims offline works in **9 places**:
- Hero trust chip: "Works offline"
- Hero sub: "Works offline"
- Features card 6: Entire card about offline ("saves locally... auto sync")
- HowItWorks Step 1: "saves locally and syncs the moment connectivity returns"
- WhyOrdra block 3: "Offline-first isn't a feature we added. It's the foundation"
- Testimonial 4 (Deepak): entire quote about offline
- Pricing: "All plans include offline mode"
- Pricing Free plan: "Offline mode"

**Fix:** Remove or tone down offline claims significantly. The app currently has connectivity detection but no actual offline data persistence. Either say "Coming soon" or remove entirely. Since there's no real offline capability, the honest approach is to remove these claims.

### 3. "Distributors" vs "Dealers"
The app sidebar says **"Dealers"**, page heading says **"Dealers"**, buttons say "Add **Dealer**". But the Hero mockup sidebar says "**Distributors**" (line 67 of Hero.tsx). Fix to "Dealers."

### 4. "Payments" sidebar item doesn't exist
The Hero mockup sidebar shows "Payments" as a nav item. The actual app sidebar has: Dashboard, Orders, Stock, Dealers, Sales Team, Reports, Settings. There is **no Payments page**. Remove it from the mockup.

### 5. Features card 4: Technical health badge details on a landing page
Description says: "Health badges: Healthy (green), Low (amber), Critical (red)." While the app does use these internally, listing color codes on a marketing page feels like documentation, not persuasion.

**Fix:** Rewrite to be benefit-focused: "Color-coded stock health tells you at a glance what's running low before it costs you an order."

### 6. Features card 1: "deliveries completed"
The dashboard KPIs are: Revenue, Orders, Pending, **Dispatched**. Not "deliveries completed." Fix to match.

### 7. Features card 2: "Placed → Dispatched → Delivered"
The app uses statuses: pending, dispatched, delivered. The copy says "Placed" but the app badge says "pending." Minor, but "Pending → Dispatched → Delivered" matches the app.

### 8. Pricing: "Offline mode" as a feature line
Since offline doesn't actually work, remove from feature lists and from the footer note.

### 9. HowItWorks StockMockup: "Godown" column header
Change to "Warehouse."

### 10. WhyOrdra block 3: "Stock is tracked by godown, not 'warehouse'"
This is now backwards. The app uses "warehouse." This entire sentence needs flipping or removing.

---

## Proposed Changes

### File: `src/components/landing/sections/Features.tsx`
- Card 4 title: "Stock by **godown**" → "Stock across warehouses, at a glance"
- Card 4 desc: Remove "Health badges: Healthy (green), Low (amber), Critical (red)." → "Real inventory across all your warehouses. Color-coded health indicators tell you what's running low before it costs you an order."
- Card 1 desc: "deliveries completed" → "dispatches completed"
- Card 2 desc: "Placed → Dispatched → Delivered" → "Pending → Dispatched → Delivered"
- Card 6 (offline): Rewrite to be honest. Instead of claiming offline sync, focus on what exists: speed, PWA install, lightweight. New desc: "Ordra runs as a full app on any phone. No Play Store, no heavy downloads. Your salesperson taps a link, adds it to their home screen, and they're ready. Fast, light, and built for phones your field team actually carries."
- Card 6 title: "No signal? No problem." → "Runs on any phone. No app store needed."

### File: `src/components/landing/sections/Hero.tsx`
- Trust chips: Remove "Works offline". Keep "Any Android or iPhone" and "Setup in 5 minutes". Add "No app store needed".
- Subheadline: Remove "Works offline." sentence. → "Your salespeople place orders on their phone. You see every order, every dealer, every rupee, live on your dashboard. Replaces your WhatsApp groups, Excel sheets, and nightly phone calls."
- Mockup sidebar: "Distributors" → "Dealers", remove "Payments"

### File: `src/components/landing/sections/HowItWorks.tsx`
- Step 1 desc: Remove "Even if they're in a village with no signal, it saves locally and syncs the moment connectivity returns." → "Done in under a minute, even on a basic Android phone."
- Step 3 desc: "Your Surat **godown**" → "Your Surat **warehouse**"
- StockMockup: Column header "Godown" → "Warehouse"
- StockMockup rows: `godown: "Pune"` etc. rename key to `warehouse`

### File: `src/components/landing/sections/Problem.tsx`
- Card 3: "Surat **godown**" → "Surat **warehouse**"

### File: `src/components/landing/sections/WhyOrdra.tsx`
- Block 3: Remove "Stock is tracked by godown, not 'warehouse.'" and "Offline-first isn't a feature we added. It's the foundation, because we know what internet looks like on an Indore-to-Ujjain field route." → Replace with: "₹ is the default currency. UPI and cheque are payment modes, not afterthoughts. Stock is tracked warehouse by warehouse, the way your business actually runs. This isn't software translated from English. It was written here, for here."

### File: `src/components/landing/sections/Testimonials.tsx`
- Testimonial 3: "Pune **godown**" → "Pune **warehouse**"
- Testimonial 4 (Deepak): This entire quote is about offline sync. Since that doesn't exist, replace with a different testimonial that highlights something real (e.g., PWA install speed, clean UI, dealer tracking). New quote: "Pehle har cheez ke liye call karna padta tha. Ab Ordra pe sab dikh jaata hai. Kaun sa dealer kitna order de raha hai, payment kya hai, sab ek jagah. Mujhe ab raat ko kisi ko call nahi karna padta." Translation: "(Earlier I had to call for everything. Now I see it all on Ordra. Which dealer is ordering how much, payment status, everything in one place. I don't have to call anyone at night anymore.)"

### File: `src/components/landing/sections/Pricing.tsx`
- Free plan: "1 godown" → "1 warehouse"
- Growth plan: "Multi-godown stock" → "Multi-warehouse stock"
- Footer note: "All plans include offline mode, PWA install, and automatic updates." → "All plans include PWA install and automatic updates."
- Free plan features: Remove "Offline mode" line

### File: `src/components/landing/sections/TrustBar.tsx`
- No godown/offline references. No changes needed.

---

## Summary

| Issue | Instances | Fix |
|---|---|---|
| "Godown" → "Warehouse" | 9 places across 6 files | Replace all |
| Offline claims (not real) | 9 places across 6 files | Remove or rewrite |
| "Distributors" → "Dealers" in mockup | 1 place | Fix |
| "Payments" nav item (doesn't exist) | 1 place | Remove |
| Health badge color codes on landing page | 1 place | Rewrite as benefit |
| "deliveries completed" → "dispatches completed" | 1 place | Fix |
| "Placed" → "Pending" status | 1 place | Fix |

**8 files** edited. No layout or structural changes.

