

# Replace Mock Data with Real Supabase Integration

## Overview
Replace the in-memory DataContext and mock API with real Supabase queries, wire up auth, and auto-seed sample data on first signup. All UI stays unchanged.

## Architecture

```text
Auth Flow:
  Signup → supabase.auth.signUp() → trigger creates profile
        → edge function seeds company + data + links profile
  Login  → supabase.auth.signInWithPassword()
  Session → AuthContext wraps app, redirects unauthenticated users

Data Flow:
  AuthContext (session/user/companyId)
    └─ DataContext (fetches from Supabase, provides same interface)
         └─ useApi() hook (unchanged API surface for all pages)
```

## Changes

### 1. Migration: Add INSERT policy + seed function
- Add INSERT policy on `companies` for authenticated users (needed for signup flow)
- Create a `seed_company_data(company_id uuid)` PL/pgSQL function (SECURITY DEFINER) that inserts 7 distributors, 4 salespersons, 8 products, 3 godowns, stock items, and 10 sample orders with order_lines. Updates `companies.next_order_sequence` to 11.
- Add INSERT policy on `profiles` for users to insert their own profile (the trigger handles it, but we need the policy for updates during signup)

### 2. New: `src/context/AuthContext.tsx`
- Manages Supabase auth session via `onAuthStateChange` + `getSession`
- Exposes: `user`, `session`, `profile` (with `company_id`), `companyId`, `loading`, `signOut`
- On session change, fetches profile from `profiles` table
- If profile has no `company_id`, shows onboarding or redirects

### 3. Refactor: `src/context/DataContext.tsx`
- Remove all mock data imports and `useState` with initial mock arrays
- Fetch all data from Supabase on mount using `companyId` from AuthContext
- Each entity (orders, distributors, salespersons, products, godowns, stock_items) fetched via `supabase.from(table).select()`
- Orders fetch includes a separate query for `order_lines`
- CRUD methods now call Supabase (`insert`, `update`, `delete`) then refresh local state
- `nextOrderNumber()` uses an atomic RPC: `UPDATE companies SET next_order_sequence = next_order_sequence + 1 WHERE id = $1 RETURNING order_prefix, next_order_sequence - 1`
- Computed values (totalOrders, totalValue, totalSold) still calculated client-side from fetched data
- Keep the same TypeScript interfaces exported from `mock-data.ts` (Distributor, Product, etc.) so pages don't need changes

### 4. Refactor: `src/pages/Login.tsx`
- Add real `supabase.auth.signInWithPassword()` call
- Show loading state, handle errors with toast
- Navigate to `/dashboard` on success

### 5. Refactor: `src/pages/Signup.tsx`
- Call `supabase.auth.signUp()` with `full_name` and `company_name` in metadata
- After signup: create company row, update profile with `company_id`, insert `user_roles` (super_admin), call `seed_company_data(company_id)` RPC
- Navigate to `/dashboard`
- Enable auto-confirm for email signups (since this is a trial flow)

### 6. Refactor: `src/App.tsx`
- Wrap routes with `AuthProvider`
- Protected routes (dashboard, orders, etc.) redirect to `/login` if not authenticated
- Public routes: `/`, `/login`, `/signup`

### 7. Update: `src/services/api.ts`
- Keep the same `useApi()` hook interface
- It still reads from DataContext (which now fetches from Supabase)
- No changes needed if DataContext exposes the same shape

### 8. Keep unchanged: `src/data/mock-data.ts`
- Keep interfaces and `formatCurrency`/`formatNumber` utility functions (used everywhere)
- Remove exported mock data arrays (or leave them unused)

## Migration SQL (key parts)
- `ALTER TABLE companies ENABLE ROW LEVEL SECURITY;` (already done)
- INSERT policy for companies: authenticated users can insert if no existing company
- `seed_company_data()` function with all realistic Indian FMCG data
- Atomic order number function: `get_next_order_number(company_id uuid)`

## Files Summary
| Action | File | What |
|--------|------|------|
| Create | Migration SQL | INSERT policies, seed function, order number RPC |
| Create | `src/context/AuthContext.tsx` | Auth state management |
| Rewrite | `src/context/DataContext.tsx` | Supabase-backed data fetching |
| Edit | `src/pages/Login.tsx` | Real auth |
| Edit | `src/pages/Signup.tsx` | Real auth + company creation + seed |
| Edit | `src/App.tsx` | AuthProvider wrapper + route protection |
| Edit | `src/data/mock-data.ts` | Keep interfaces/utils, remove mock arrays |
| Edit | `src/services/api.ts` | Minor adjustments if needed |
| Config | Auth settings | Enable auto-confirm email |

## Important Notes
- All existing UI components, animations, confetti, ₹ formatting, PWA behavior remain 100% untouched
- The `useApi()` hook surface stays identical — pages don't need changes
- Stock page helpers (`getStockHealth`, `generateSparklineData`) stay in `godown-data.ts`
- Order creation is atomic: prefix + sequence fetched and incremented in one DB call
- Sample seed data matches current mock data quality (Indian names, cities, FMCG products)

