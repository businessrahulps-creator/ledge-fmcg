

# Make Day-of-Week Row Interactive

## What changes
Add a `selectedDay` state (defaults to today). Tapping a day circle filters the orders list, and the KPIs recompute based on orders matching that day of the week. The active circle gets the existing dark highlight style.

## Technical details

### `src/pages/Dashboard.tsx`

1. Add `useState` import and a `selectedDay` state initialized to `today.getDay()`
2. Make each day circle a `button` with `onClick={() => setSelectedDay(i)}`
3. Change the highlight condition from `i === dayOfWeek` to `i === selectedDay`
4. Filter orders by selected day of week:
   ```ts
   const filteredOrders = orders.filter((o) => {
     const orderDay = new Date(o.date).getDay();
     return orderDay === selectedDay;
   });
   ```
5. Compute KPIs from `filteredOrders` instead of `orders`
6. Derive `recentOrders` from `filteredOrders.slice(0, 6)`
7. Show empty state text ("No orders on this day") when `filteredOrders` is empty, for both the Recent Orders section and the KPI values (which will naturally show 0/₹0)

No new files or dependencies needed.

