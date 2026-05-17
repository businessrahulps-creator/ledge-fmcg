
# Wave 1 — Surgical Build Plan

Scope locked. **Dropped:** dual-language labels, voice input. **Everything else from Wave 1 + panel notes — in.** Surgical edits only, no architectural churn, no new dependencies.

---

## What ships in this wave

### 1 · Dashboard hero — one sentence, one number
**File:** `src/pages/Dashboard.tsx` (+ small helper in `src/components/dashboard/`)

Replace the existing top hero block with a single Playfair line that answers the only question that matters at 9am:

> **₹2,42,000** to collect today
> *5 orders waiting to send · 3 invoices overdue*

- Big number = Playfair Display, semantic `text-primary`, computed live from existing `DataContext` selectors (no new queries).
- Subtitle = Inter, muted, **clickable fragments** that deep-link: "5 orders waiting to send" → `/orders?status=not-sent`, "3 invoices overdue" → `/billing?filter=overdue`.
- Empty state (new user, zero data): *"Your day starts here. Add your first dealer to begin."* + single CTA.
- Existing KPI tiles below stay — but visually demoted (smaller, lighter weight) so the hero owns the eye.

### 2 · "Money to Collect" as a bottom-nav surface (mobile) + sidebar promotion (desktop)
**Files:** `src/components/layout/AppSidebar.tsx`, `src/components/layout/AppLayout.tsx`

- Desktop sidebar: **rename "Insights" group → keep, but add a new top-of-Work item: "Money to Collect"** (`/billing?filter=outstanding`, icon: `Wallet`). Sits between Orders and Billing.
- Mobile: the current mobile nav (if present in AppLayout) gets the same "Money to Collect" entry as a first-class destination, not nested.
- Uses existing Billing page with a pre-applied filter — **no new page**.

### 3 · Plain-English status pills + glyph per status
**File:** `src/components/ui/status-badge.tsx`

Rewrite labels and add a leading glyph (Lucide icon, 10px, inherits color). No new variants, no API change — same `StatusType` union.

| Current | New label | Glyph |
|---|---|---|
| Paid | Paid | ✓ `Check` |
| Partial | Part paid | `CircleDashed` |
| Pending | Not paid yet | `Clock` |
| Dispatched | On the way | `Truck` |
| Delivered | Delivered | ✓ `Check` |

Susan's refinement (inline "next verb") deferred to Wave 3 — keeps this PR surgical.

### 4 · Kill LiveClock on mobile, put search in its place
**Files:** `src/components/layout/AppLayout.tsx`, `src/components/layout/LiveClock.tsx` (kept, only desktop usage)

- On `<640px`, render a search affordance ("Find a dealer or order") that opens the **existing** `CommandPalette` with `dealers` scope pre-selected. Zero new search infra.
- Desktop unchanged — LiveClock stays as a quiet bottom-of-topbar element.

### 5 · WhatsApp button on every dealer card
**Files:** `src/pages/Distributors.tsx`, `src/pages/DealerDetail.tsx`, possibly `src/components/dashboard/TodayDigest.tsx`

- Reuse existing `src/components/ui/WhatsAppIcon.tsx` and `src/utils/shareWhatsApp.ts`.
- One-tap button per dealer row → opens WhatsApp with pre-filled text using dealer name + current outstanding from `useDealersDomain`:
  *"Namaste {name} ji, ₹{outstanding} pending. Please pay when convenient. Thank you."*
- Hidden if dealer has no phone OR outstanding ≤ 0.

### 6 · Indian comma formatting + ₹ prefix in every money input
**Files:** `src/components/ui/number-input.tsx` (extend, don't fork), one new prop `currency?: boolean`

- When `currency` is true: render ₹ as a leading adornment, format the **displayed** draft with Indian commas on blur (keep raw digits while editing — don't fight the cursor).
- Sweep `NewOrder.tsx`, `Billing.tsx`, `Targets.tsx`, `Schemes.tsx` to add `currency` where the field is rupees.
- Right-align money columns in `data-table.tsx` consumers (one util class pass, no schema change).

---

## What's explicitly NOT in this wave

- Dual-language labels — dropped per your instruction
- Voice search — dropped per your instruction
- New Order three-section refactor → Wave 2
- "Schemes" rename / inline explainers → Wave 3
- Destructive-copy rewrite → Wave 4
- Empty-state micro-previews → Wave 5
- Reports/Performance tab merge → Wave 5

---

## Order of edits (one PR, six commits in this sequence)

```text
1. status-badge.tsx          ← lowest risk, visible everywhere
2. number-input.tsx + sweep  ← additive prop, no breakage
3. AppSidebar.tsx            ← add "Money to Collect" entry
4. AppLayout.tsx             ← mobile topbar swap
5. Distributors.tsx + DealerDetail.tsx ← WhatsApp button
6. Dashboard.tsx             ← hero rewrite (last, biggest visual delta)
```

After each commit: visual check at 390×844 and 1280×720, then move on.

---

## Verification before closing

- All five existing e2e specs pass (`auth`, `billing`, `order-lifecycle`).
- StatusBadge snapshot tests — if any exist — updated with new labels.
- Dashboard renders on a brand-new account (zero data) without errors.
- Linter warning count unchanged from baseline (20).
- Mobile preview: thumb can reach hero CTA, WhatsApp button, and Money-to-Collect tab one-handed.

---

## Non-negotiables (carry-overs from project memory)

- No raw color classes — semantic tokens only.
- No new npm dependencies.
- `prefers-reduced-motion` respected on any new transition.
- All Supabase calls already go through `handleSupabaseError` — don't reinvent.
- `NumberInput` extension stays backwards-compatible (existing callers unaffected).

Approve and I'll build commits 1→6 in order, pausing only if a step uncovers something this plan didn't anticipate.
