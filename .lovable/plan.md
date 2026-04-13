

# QA & CTO Review — Bugs Found

After reviewing the codebase, here are the issues found ranked by severity:

---

## Bug 1 (High): Pull-to-Refresh Broken — Nested Scroll Container

**Pages affected**: Dashboard, Orders, Performance, Schemes

The `containerRef` div (with `overflow-y-auto`) is nested inside AppLayout's `<main>` which also has `overflow-y-auto`. Since `<main>` is the actual scroll container (bounded by `h-dvh`), the inner div never scrolls — its `scrollTop` is always 0. This means:
- Pull-to-refresh triggers even when the user is scrolled halfway down the page
- Two nested `overflow-y-auto` containers fight each other

**Fix**: Remove `overflow-y-auto` from the inner `containerRef` divs. Change them from `<div ref={containerRef} className="relative overflow-y-auto">` to `<div ref={containerRef} className="relative">`. The pull-to-refresh hook should check the parent scroll container (`<main>`) instead, or the ref should be moved to `<main>`.

Better approach: Update `usePullToRefresh` to accept an optional `scrollContainerRef` or walk up to find the nearest scroll ancestor, so the `scrollTop > 0` check works correctly.

**Files**: `src/pages/Dashboard.tsx`, `src/pages/Orders.tsx`, `src/pages/Performance.tsx`, `src/pages/Schemes.tsx`, `src/hooks/use-pull-to-refresh.ts`

---

## Bug 2 (Medium): Landing Page Hardcoded Light Colors — Breaks in Dark Mode

The landing page sections (Hero, Navbar, Footer, etc.) use hardcoded light-theme colors (`bg-white`, `text-midnight`, `bg-[#FAFAFA]`) instead of semantic tokens. If a user has dark mode enabled system-wide and visits the landing page, the navbar and other elements will still render with white backgrounds but the `Index` page wrapper has no explicit `className="light"` or color scheme override.

**Fix**: Add `className="light"` or `data-theme="light"` to the landing page wrapper in `src/pages/Index.tsx` to force light mode, since the landing page is designed to be light-only.

**File**: `src/pages/Index.tsx`

---

## Bug 3 (Low): Footer Social Link Uses `Icon.displayName` as Key

In `src/components/landing/sections/Footer.tsx` line 74, the social links use `key={Icon.displayName}` — Lucide icons may not always have `displayName` set (it can be `undefined`), which would cause React key warnings and potential rendering issues if more socials are added.

**Fix**: Use the `href` as the key instead.

**File**: `src/components/landing/sections/Footer.tsx`

---

## Bug 4 (Low): Redundant Label Ternary

In `src/pages/Billing.tsx` line 715: `{isEditMode ? "Document Type" : "Document Type"}` — both branches return the same string. Harmless but sloppy.

**Fix**: Replace with just `"Document Type"`.

**File**: `src/pages/Billing.tsx`

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/hooks/use-pull-to-refresh.ts` | Add scroll-ancestor detection so `scrollTop` check works when ref is on a non-scrolling child |
| `src/pages/Dashboard.tsx` | Remove `overflow-y-auto` from containerRef div |
| `src/pages/Orders.tsx` | Same |
| `src/pages/Performance.tsx` | Same |
| `src/pages/Schemes.tsx` | Same |
| `src/pages/Index.tsx` | Force light color scheme on landing page wrapper |
| `src/components/landing/sections/Footer.tsx` | Use `href` as key for social links |
| `src/pages/Billing.tsx` | Remove redundant ternary on line 715 |

Total: 8 files, all minor surgical edits.

