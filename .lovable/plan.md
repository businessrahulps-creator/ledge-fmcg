

# Fix: Enable Full Order Editing (Dealer, Salesperson, Line Items)

## Problem

The Order Detail page currently only allows editing **payment/delivery status and dispatch fields**. The dealer, salesperson, and line items are displayed as read-only summary cards with no way to modify them. The `updateOrder` function in `DataContext.tsx` also only maps status-related fields to DB updates — it ignores `distributorId`, `salespersonId`, and line changes.

## Solution

Add inline editing for dealer, salesperson, and line items on the Order Detail page, and extend `updateOrder` in DataContext to persist those changes.

## Changes

### 1. `src/context/DataContext.tsx` — Extend `updateOrder`

- Add mappings for `distributor_id`, `distributor_name`, `salesperson_id`, `salesperson_name`, `total` to `dbUpdates`
- When line items are updated: delete existing `order_lines` for the order and re-insert the new set
- Recalculate and update `order_schemes` if lines change
- Update `scheme_savings` on the order row

### 2. `src/pages/OrderDetail.tsx` — Add editing UI

- **Dealer**: Replace the read-only card with a `Select` dropdown (populated from `api.dealers.list()`) that updates `editDistributor` state
- **Salesperson**: Replace the read-only card with a `Select` dropdown (populated from `api.salespersons.list()`) that updates `editSalesperson` state
- **Line Items**: Add editable quantity inputs, product selector for adding new lines, and remove buttons per line — similar to the NewOrder page but inline
- **Save Changes**: Extend `executeSaveOrder` to include dealer, salesperson, and line item updates in the update call
- Add new state variables: `editDistributorId`, `editSalesperson`, `editLines`

### 3. `src/services/api.ts` — Extend `orders.update`

- Pass through the new fields (dealer, salesperson, lines) to `data.updateOrder`

## What stays the same

- Order number remains immutable
- Order date remains immutable
- The claim, delete, WhatsApp, invoice flows are untouched
- Offline queueing pattern is preserved

## Technical detail

For line item updates, the approach is:
1. Delete all existing `order_lines` WHERE `order_id = id`
2. Insert the new set of lines
3. Update the `orders.total` with recalculated sum
4. Recalculate scheme eligibility and update `order_schemes` + `orders.scheme_savings`

This is wrapped in the same online/offline pattern used by the existing update logic.

