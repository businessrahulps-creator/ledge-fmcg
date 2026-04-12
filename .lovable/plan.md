

# Audit Trail / Activity Log

## Problem
The app has no record of *who* changed *what* and *when*. The only history is ephemeral notifications. For Indian FMCG businesses, an audit trail is critical for accountability (order edits, payment status changes, stock adjustments, dealer modifications).

## Solution
A database-backed `activity_log` table that captures entity-level changes, surfaced via a simple Activity History panel.

## Database

### New table: `activity_log`
```text
id           uuid  PK  default gen_random_uuid()
company_id   uuid  NOT NULL
user_id      uuid  NOT NULL
user_name    text  NOT NULL default ''
entity_type  text  NOT NULL   -- 'order','dealer','product','stock_item','salesperson','scheme','claim','invoice'
entity_id    uuid  NOT NULL
action       text  NOT NULL   -- 'created','updated','deleted','status_changed'
summary      text  NOT NULL   -- human-readable: "Changed payment status from pending to paid"
metadata     jsonb NOT NULL default '{}'  -- old/new values for key fields
created_at   timestamptz NOT NULL default now()
```

### RLS
- SELECT: `company_id = get_company_id()`
- INSERT: `company_id = get_company_id()`
- No UPDATE/DELETE (append-only)

### Index
- `(company_id, entity_type, entity_id, created_at DESC)` for fast entity-scoped lookups
- `(company_id, created_at DESC)` for global feed

## Code Changes

### 1. `src/context/DataContext.tsx` — logging helper
Add a `logActivity()` function that inserts into `activity_log` after each mutation (create/update/delete) for orders, dealers, salespersons, products, stock items, schemes, claims, and invoices. Each existing mutation function gets a single `logActivity(...)` call appended. The summary is auto-generated (e.g., "Created order ORD-2026-0009", "Updated delivery status to dispatched").

### 2. `src/components/layout/ActivityLog.tsx` — new component
A slide-out Sheet (triggered from the sidebar or header) showing a reverse-chronological feed of recent activity. Each entry shows: icon by entity type, summary text, user name, and relative timestamp. Filterable by entity type. Loads the most recent 50 entries with a "Load more" button.

### 3. `src/components/layout/AppSidebar.tsx`
Add an "Activity" link in the sidebar navigation (History/ClockIcon).

### 4. Entity detail pages (OrderDetail, DealerDetail, SalespersonDetail)
Add a collapsible "History" section at the bottom showing activity entries filtered to that specific entity.

## What gets logged
| Action | Summary example |
|--------|----------------|
| Order created | "Created order ORD-2026-0009 for Sharma Traders — ₹40,500" |
| Order status changed | "Changed payment status from pending to paid" |
| Order deleted | "Deleted order ORD-2026-0009" |
| Dealer created/updated/deleted | "Added dealer Patel Distributors" |
| Product price changed | "Updated Premium Basmati Rice 5kg — price ₹450 → ₹480" |
| Stock adjusted | "Adjusted Sunflower Oil 1L at Main Warehouse: 280 → 250" |

## Impact
- Append-only, no performance impact on reads (indexed queries)
- ~1 extra INSERT per mutation — negligible overhead
- No changes to existing mutation logic beyond appending the log call

