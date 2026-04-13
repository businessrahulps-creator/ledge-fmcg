

# Add Foreign Key Constraints Across All Tables

## Current State
All tables use UUID columns to reference other tables but have zero foreign key constraints. Data is currently clean (0 orphaned records across all 13 relationships checked).

## Migration — Single SQL migration adding all FK constraints

### Relationships to constrain:

| Child Table | Column | Parent Table | ON DELETE |
|---|---|---|---|
| `profiles` | `company_id` | `companies(id)` | SET NULL (user keeps profile if company deleted) |
| `profiles` | `user_id` | `auth.users(id)` | CASCADE |
| `user_roles` | `user_id` | `auth.users(id)` | CASCADE |
| `orders` | `company_id` | `companies(id)` | CASCADE |
| `orders` | `distributor_id` | `distributors(id)` | RESTRICT (can't delete dealer with orders) |
| `orders` | `salesperson_id` | `salespersons(id)` | RESTRICT (can't delete salesperson with orders) |
| `orders` | `godown_id` | `godowns(id)` | SET NULL |
| `order_lines` | `order_id` | `orders(id)` | CASCADE |
| `order_lines` | `product_id` | `products(id)` | RESTRICT |
| `order_schemes` | `order_id` | `orders(id)` | CASCADE |
| `order_schemes` | `scheme_id` | `schemes(id)` | SET NULL |
| `invoice_lines` | `invoice_id` | `invoices(id)` | CASCADE |
| `invoices` | `company_id` | `companies(id)` | CASCADE |
| `invoices` | `source_order_id` | `orders(id)` | SET NULL |
| `claims` | `company_id` | `companies(id)` | CASCADE |
| `claims` | `order_id` | `orders(id)` | RESTRICT |
| `claims` | `distributor_id` | `distributors(id)` | RESTRICT |
| `claim_lines` | `claim_id` | `claims(id)` | CASCADE |
| `claim_lines` | `product_id` | `products(id)` | RESTRICT |
| `stock_items` | `company_id` | `companies(id)` | CASCADE |
| `stock_items` | `product_id` | `products(id)` | CASCADE |
| `stock_items` | `godown_id` | `godowns(id)` | CASCADE |
| `stock_deductions` | `company_id` | `companies(id)` | CASCADE |
| `stock_deductions` | `order_id` | `orders(id)` | CASCADE |
| `stock_deductions` | `product_id` | `products(id)` | RESTRICT |
| `stock_deductions` | `godown_id` | `godowns(id)` | RESTRICT |
| `schemes` | `company_id` | `companies(id)` | CASCADE |
| `schemes` | `product_id` | `products(id)` | SET NULL |
| `schemes` | `dealer_id` | `distributors(id)` | SET NULL |
| `targets` | `company_id` | `companies(id)` | CASCADE |
| `distributors` | `company_id` | `companies(id)` | CASCADE |
| `salespersons` | `company_id` | `companies(id)` | CASCADE |
| `products` | `company_id` | `companies(id)` | CASCADE |
| `godowns` | `company_id` | `companies(id)` | CASCADE |
| `notifications` | `company_id` | `companies(id)` | CASCADE |
| `notifications` | `user_id` | `auth.users(id)` | CASCADE |
| `activity_log` | `company_id` | `companies(id)` | CASCADE |
| `activity_log` | `user_id` | `auth.users(id)` | CASCADE |
| `secondary_sales` | `company_id` | `companies(id)` | CASCADE |
| `secondary_sales` | `distributor_id` | `distributors(id)` | RESTRICT |
| `secondary_sales` | `product_id` | `products(id)` | RESTRICT |

### ON DELETE strategy
- **CASCADE**: Child records are meaningless without parent (order_lines without order, all company-scoped data if company deleted)
- **RESTRICT**: Prevent deleting a dealer/salesperson/product that has orders referencing it — forces user to handle dependencies first
- **SET NULL**: Optional references (godown on order, source_order on invoice, scheme on order_scheme)

### What changes in code
Nothing. The app already handles these relationships correctly via application logic. FKs add database-level enforcement as a safety net.

### Risk
Minimal — data is clean, no orphans exist. The migration is additive (adding constraints, not changing columns). Fully reversible by dropping the constraints.

