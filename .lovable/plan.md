

# Font Consistency Audit

## Findings

After reviewing every page and component, here are the inconsistencies:

### 1. Page Title (h1) — Inconsistent size and weight

| Page | Mobile | Desktop | Weight |
|------|--------|---------|--------|
| Dashboard | `text-[28px]` | `text-[28px]` | `font-bold` |
| Orders | `text-xl` (20px) | `text-2xl` (32px) | `font-bold` |
| New Order | `text-xl` (20px) | `text-2xl` (32px) | `font-bold` |
| Stock | `text-xl` (20px) | `text-2xl` (32px) | `font-bold` |
| Dealers | `text-xl` (20px) | `text-2xl` (32px) | `font-bold` |
| Sales Team | `text-xl` (20px) | `text-2xl` (32px) | `font-bold` |
| Settings | `text-xl` (20px) | `text-2xl` (32px) | `font-bold` |
| **Reports** | **`text-lg` (20px)** | **`text-xl` (24px)** | **`font-semibold`** |

**Issue**: Dashboard uses a custom `28px` while others use `text-xl`. Reports uses `text-lg`/`text-xl` with `font-semibold` instead of `font-bold` — both size and weight are off.

### 2. Section Headings (h2) — Mostly consistent but Dashboard differs

| Context | Size |
|---------|------|
| Dashboard sections | `text-[15px] font-semibold` |
| NewOrder sections | `text-sm font-semibold md:text-base` (14px → 16px) |
| Settings sections | `text-sm font-semibold md:text-base` |
| NotificationCenter | `text-sm font-semibold` |

**Issue**: Dashboard uses non-standard `text-[15px]` instead of `text-sm` (14px). Should unify to `text-sm md:text-base`.

### 3. "View all" links on Dashboard

Uses `text-[12px]` (custom arbitrary) instead of the design system's `text-xs` (12px). While numerically identical, it bypasses the Tailwind scale and won't respond to any future base-size changes.

### 4. KPI values on Dashboard

Uses `text-[22px]` — not in the type scale. Closest standard size is `text-xl` (24px) or `text-lg` (20px).

### 5. KPI change badge

Uses `text-[11px]` — not in the type scale. Should be `text-[10px]` (matching other micro-text) or `text-xs` (12px).

### 6. KPI label

Uses `text-[11px]` — same issue as above.

### 7. Dashboard greeting date

Uses `text-[13px]` — not in the scale. Should be `text-xs` (12px).

### 8. Dashboard day-of-week circles

Uses `text-[13px]` — not in the scale.

### 9. Dashboard mobile order cards

- Dealer name: `text-[14px] font-semibold` — should be `text-sm font-semibold`
- Amount: `text-[14px] font-bold` — should be `text-sm font-bold`
- Meta text: `text-[11px]` — not in the scale

### 10. StatusBadge

Uses `text-xs font-medium` — consistent across all uses. No issue.

### 11. Stock page HealthBadge

Uses `text-[10px] font-semibold` — this micro-size is used elsewhere too (settings role badges, meta text). Acceptable as a "micro" tier, but it's arbitrary rather than in the scale.

### 12. Dialog titles — Minor inconsistency

- Some: `text-base md:text-lg` (16→20px)
- Some: `text-base md:text-xl` (16→24px)
- Should pick one. `text-base md:text-lg` is better for dialogs.

---

## Proposed Standard (Type Scale)

```text
Micro label:     text-[10px]  font-medium     (metadata, timestamps)
Body small:      text-xs      font-medium      (12px — labels, secondary)
Body:            text-sm      font-medium      (14px — default body)
Section head:    text-sm      font-semibold    (14px mobile)
                 md:text-base font-semibold    (16px desktop)
Page title:      text-xl      font-bold        (20px mobile)
                 md:text-2xl  font-bold        (32px desktop)
Dialog title:    text-base    md:text-lg       (16→20px)
KPI value:       text-xl      font-bold        (24px — standardized)
```

## Changes

### `src/pages/Dashboard.tsx`
- h1: `text-[28px] font-bold` → `text-xl font-bold tracking-tight md:text-2xl`
- Date: `text-[13px]` → `text-xs`
- Day circles: `text-[13px]` → `text-xs`
- KPI value: `text-[22px]` → `text-xl`
- KPI change: `text-[11px]` → `text-[10px]`
- KPI label: `text-[11px]` → `text-[10px]`
- Section headings: `text-[15px] font-semibold` → `text-sm font-semibold md:text-base`
- "View all": `text-[12px]` → `text-xs`
- Mobile card dealer: `text-[14px]` → `text-sm`
- Mobile card amount: `text-[14px]` → `text-sm`
- Mobile card meta: `text-[11px]` → `text-[10px]`

### `src/pages/Reports.tsx`
- h1: `text-lg font-semibold` → `text-xl font-bold tracking-tight md:text-2xl`

### `src/pages/Orders.tsx`
- Dialog title: `text-base md:text-xl` → `text-base md:text-lg` (match other dialogs)

### `src/pages/Distributors.tsx`
- Profile dialog title: `text-base md:text-xl` → `text-base md:text-lg`

### `src/pages/Salespersons.tsx`
- Profile dialog title: `text-base md:text-xl` → `text-base md:text-lg`

## Result
Every screen follows the same type scale — page titles, section heads, body text, labels, and micro-text all use consistent sizes and weights. No more arbitrary pixel values scattered across pages.

