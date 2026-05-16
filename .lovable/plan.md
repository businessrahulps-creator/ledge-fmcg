## QA & bug sweep → Linear

**Blocker:** Linear isn't connected yet. Connect it first (button above), then I'll run the sweep and file every finding.

### Sweep scope (full)

1. **Static checks**
   - TypeScript / build errors from dev-server logs
   - `rg` for raw color classes, `parseInt||0`, `console.error`, `TODO`/`FIXME`, dead imports
   - Supabase linter + security scan (RLS gaps, exposed columns)
   - Recent `error_log` table rows

2. **Landing site** (`/`) — desktop 1440 + mobile 390
   - Render, console errors, broken images / 404s
   - Hover states (verify sheen removed cleanly)
   - CTA links, pricing buttons, founder note, testimonials
   - Lighthouse-style spot check: LCP image, font flash

3. **Auth** (`/auth`)
   - Signup, login, validation errors, password reset link
   - Confirm Google OAuth is fully gone (per memory)

4. **`/app` pages — every one**
   Dashboard, Orders, NewOrder, OrderDetail, Distributors, Salespersons, Stock (Products + Warehouses), Billing, Claims, Schemes, Targets, Reports (all 5 sub-reports), Performance, Company, Settings, Help, Notifications.
   Per page: render, console, empty state, primary CRUD action, mobile layout (390px), keyboard focus, design-token drift.

5. **Cross-cutting**
   - PWA install + offline shell
   - Notification bell
   - PDF/invoice generation
   - RBAC behavior (accountant restrictions on stock/products)

### Linear ticket format (kept simple)

One issue per bug. Title = plain-English symptom, no jargon.

```
Title:      [Area] What's broken in one line
Priority:   Urgent | High | Medium | Low
Labels:     qa-sweep-2026-05, <area>, <type:bug|polish|a11y|perf|security>
Description:
  **What's wrong**   1–2 sentences, no code
  **Where**          Page / route / component
  **Steps**          1. … 2. … 3. …
  **Expected**       …
  **Actual**         …
  **Evidence**       screenshot link or file:line
  **Fix hint**       (optional, 1 line)
```

Areas: `Landing`, `Auth`, `Dashboard`, `Orders`, `Stock`, `Billing`, `Claims`, `Schemes`, `Targets`, `Reports`, `Settings`, `Backend`, `Design-system`, `PWA`.

Priorities:
- **Urgent** — crash, data loss, security, auth broken
- **High** — core flow broken (can't place order, can't view invoice)
- **Medium** — secondary flow broken or visible bug
- **Low** — polish, copy, minor a11y, design drift

If 20+ findings land in one area, I'll create a parent issue and link the rest as sub-issues so the board stays readable.

### Deliverable

After the sweep:
- Created Linear issues (count by priority + area)
- A short summary posted back in chat with the top 5 must-fix items
- No code changes in this loop — pure QA + filing

### Open questions

Once Linear is connected, I'll need to know:
- **Team** — which Linear team to file under (I'll list options after connecting)
- **Project** — existing project or create a new "QA Sweep — May 2026"?

I'll ask those two right after the connection succeeds.
