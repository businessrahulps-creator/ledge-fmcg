

# Production-Ready PostgreSQL Schema for Ledge

## Overview
A complete Supabase-native schema derived from the current codebase: 10 tables, 4 enums, RLS on every table, a security-definer role-check function, proper indexes, and an `updated_at` trigger.

## Tables (mapped from TypeScript interfaces)

| Table | Source Interface | Key Fields |
|-------|-----------------|------------|
| `companies` | Settings Company tab | name, address, gstin, order_prefix, next_order_sequence |
| `profiles` | TeamMember in Settings | user_id → auth.users, company_id, full_name, phone, email |
| `user_roles` | Settings role system | user_id, role (app_role enum) |
| `distributors` | Distributor | name, location, contact, company_id |
| `salespersons` | Salesperson | name, phone, email, region, company_id |
| `products` | Product | name, sku (unique per company), unit, base_price, company_id |
| `godowns` | GodownLocation | name, address, is_active, company_id |
| `stock_items` | StockItem | product_id, godown_id, quantity, threshold, company_id |
| `orders` | Order | order_number (unique), distributor_id, salesperson_id, total, payment/delivery enums, company_id |
| `order_lines` | OrderLine | order_id, product_id, quantity, unit_price, line_total |
| `stock_deductions` | StockDeduction | product_id, godown_id, order_id, quantity_deducted |

## Enums (from TypeScript union types)
- `app_role`: super_admin, sales_manager, accountant, salesperson
- `payment_mode`: cash, bank_transfer, cheque, upi
- `payment_status`: paid, partial, pending
- `delivery_status`: pending, dispatched, delivered

## Security Architecture
1. **`has_role()` security-definer function** — prevents recursive RLS on user_roles
2. **`get_company_id()` helper** — returns the caller's company_id from profiles (security definer)
3. **Every business table** gets a SELECT/INSERT/UPDATE/DELETE policy scoped to `company_id = get_company_id(auth.uid())`
4. `user_roles` readable by same-company users via `has_role` check, writable only by super_admin
5. `profiles` — users can read own-company profiles, update only their own row

## Constraints & Indexes
- `orders.order_number` UNIQUE
- `products(company_id, sku)` UNIQUE
- `stock_items(product_id, godown_id)` UNIQUE (one stock record per product per warehouse)
- `CHECK(quantity >= 0)` on stock_items, `CHECK(quantity > 0)` on order_lines
- `CHECK(base_price >= 0)`, `CHECK(total >= 0)`, `CHECK(line_total >= 0)`
- `CHECK(char_length(order_prefix) <= 10)`
- Indexes on all `company_id` columns, `orders(distributor_id)`, `orders(salesperson_id)`, `order_lines(order_id)`, `stock_items(godown_id)`

## Other
- `updated_at` auto-trigger on all tables via a shared `update_updated_at()` function
- `on_auth_user_created()` trigger creates a profile row automatically
- All FKs use `ON DELETE CASCADE` for order_lines→orders; `ON DELETE RESTRICT` for orders→distributors/salespersons (prevent accidental data loss)
- `next_order_sequence` defaults to 1 in companies table; app increments atomically

## Migration
Single migration file with the complete SQL. No seed data — the app will continue using mock data in-memory until the Supabase integration layer is wired up.

## File
| Action | File |
|--------|------|
| Create | `supabase/migrations/[timestamp]_initial_schema.sql` |

