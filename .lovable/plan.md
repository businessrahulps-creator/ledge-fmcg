

# Rich Demo Account — asha@getledge.in (30× Volume)

## Summary
Create edge function `seed-demo-account` that provisions a richly-populated demo account with ~30× the originally planned data volume. Data is generated procedurally in loops to create a realistic, lived-in 30-day power-user account for Kerala & Tamil Nadu FMCG beverage distribution.

## Data Volumes

| Entity | Original | Now (30×) |
|--------|----------|-----------|
| Products | 15 | 45 beverage SKUs |
| Dealers | 8 | 80+ across KL/TN |
| Sales Team | 4 | 12 reps |
| Godowns | 3 | 5 warehouses |
| Orders | 20 | 500+ over 30 days |
| Order Lines | ~40 | 1,500+ |
| Schemes | 6 | 20 active schemes |
| Targets | 6 | 40+ (monthly + quarterly) |
| Claims | 4 | 50+ (mix of open/resolved) |
| Invoices | 5 | 150+ GST invoices |
| Invoice Lines | ~15 | 500+ |
| Stock Items | 30 | 200+ (products × godowns) |
| Activity Log | 15 | 400+ entries |
| Order Schemes | ~10 | 300+ applied schemes |

## Technical Approach

### Edge Function: `supabase/functions/seed-demo-account/index.ts`

Uses service role key to bypass RLS. All data inserted via admin client in a single invocation.

**Procedural generation strategy:**
- Pre-define arrays of realistic names, locations, SKUs, and prices
- Use nested loops to generate orders (15-20 per day × 30 days)
- Randomly assign dealers, salespersons, payment modes/statuses, delivery statuses
- Apply schemes to ~60% of orders with calculated savings
- Generate invoices for all delivered+paid orders
- Distribute stock across all godowns with realistic health spread (60% healthy, 25% low, 15% critical)
- Create claims for ~10% of delivered orders (damaged, expired, shortage)
- Set targets for all salespersons (monthly) and top 20 dealers (quarterly)
- Activity log entries for order placements, status changes, dealer additions, stock updates

**Products catalog** — 45 South Indian beverages:
- Packaged water (500ml, 1L, 2L, 5L, 20L)
- Fruit juices (mango, orange, mixed fruit, guava, pomegranate — 200ml, 500ml, 1L)
- Carbonated drinks (cola, lemon, orange, ginger — 300ml, 500ml, 2L)
- Energy drinks (250ml, 500ml)
- Traditional beverages (buttermilk, tender coconut, rose milk, jal jeera — 200ml, 500ml)
- Sparkling water, soda (300ml, 750ml)

**Dealers** — 80+ with real Kerala/Tamil Nadu locations:
- Kerala: Kochi (15), Trivandrum (12), Kollam (8), Alappuzha (8), Thrissur (6), Kozhikode (6)
- Tamil Nadu: Chennai (10), Madurai (5), Coimbatore (5), Tiruchirappalli (5)

**Godowns**: Main Warehouse Kochi, Hub Chennai, Depot Coimbatore, Depot Trivandrum, Depot Madurai

**Company details**: "Asha Beverages Distributors", GSTIN 32AABCA1234F1ZP, Kerala state code 32, full bank info

### Execution
1. Deploy edge function
2. Invoke once (with extended timeout — up to 60s for volume)
3. Query DB to verify row counts
4. Audit data consistency

## Files Changed
- `supabase/functions/seed-demo-account/index.ts` — NEW, ~800-1000 lines of procedural seed logic

## New Signups
No changes needed — `setup_new_company` creates empty workspace only. This seed function is invoked manually once.

