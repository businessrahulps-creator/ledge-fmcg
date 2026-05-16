# Project Memory

## Core
Ledge V2 brand: Midnight `#0F1F3A` (primary), Forest (success), Terracotta (accent/warning), Bone (bg). Playfair Display H1/H2 only + Inter everywhere else. 6px radius. Fluent 2 depth/motion/density tokens. No glassmorphism in `/app`. Dark mode archived. Mobile-first PWA for Indian FMCG distribution. Lovable Cloud + RLS. No Google OAuth. Max font weight `font-semibold`. All colors via semantic tokens — no raw hex in components.

## Memories

### Design system (read these for any visual work)
- [Landing pill system](mem://style/landing-pill-system) — lp-pill/lp-pill-metric/lp-insight primitives; one pill cluster per section.
- [Design system tokens (V2)](mem://style/design-system) — Live token reference: palette, type, radius, shadow, motion, density. Source of truth.
- [App visual language](mem://style/app-visual-language) — Primitives (SignalCard/KpiStrip/InsightLine/StatusBadge), utilities (`.h1-display`, `.num`, `.card-hover`, `.glass-card`, `.status-*`), composition rules.
- [Landing parity checklist](mem://style/landing-parity-checklist) — 2-pass refit playbook to bring landing onto V2 with grep regression gates.
- [Landing palette (LEGACY)](mem://style/landing-palette) — Pre-rebrand landing language. Kept for historical PR context only.
- [Brand moments (RETIRED)](mem://style/brand-moments) — Rationing rule retired in V2; tokens are now used semantically.

### Recent PR notes
- [PR15 Performance + Schemes](mem://style/pr15-performance-schemes) — SignalCard hero on Performance; expiring-soon SignalCard on Schemes.
- [PR14 Dealers / Salespersons / Targets](mem://style/pr14-dealers-salespersons-targets) — KpiStrip + SignalCard across CRM and target pages.
- [PR13 Stock + NewOrder](mem://style/pr13-stock-neworder) — Stock low/critical SignalCard; credit-limit breach SignalCard on NewOrder.
- [Route prefetch + LedgeLoader](mem://style/route-prefetch-loader) — Idle/hover route prefetch, dynamic xlsx, vendor chunking, branded delayed Suspense loader.

### Features / domain
- [Trial period](mem://auth/trial-period) — Trial flow rules.
- [Order pricing engine](mem://logic/order-pricing-engine) — Pricing/scheme calculation rules.

## Constraints (always-on)
- No Google OAuth on login/signup — user explicitly removed it.
- Roles in a separate `user_roles` table with a `SECURITY DEFINER has_role()` function. Never store roles on profiles/users.
- Never modify `src/integrations/supabase/client.ts` or `src/integrations/supabase/types.ts` — auto-generated.
