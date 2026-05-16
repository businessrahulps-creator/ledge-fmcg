# Project Memory

## Core
Dark/light themed, glassmorphic cards, semantic tokens. Primary Electric Blue #2563EB. Warm stone neutrals (do NOT shift to cool grays).
Status semantics: success=Teal #06B6A4, warning=Amber #FFA800, destructive=Coral Pink #FF6B6B.
Brand gradient (Purple #7C3AED → Coral #FF8A3D) is rationed: ONLY splash, empty states, order celebration, sidebar wordmark. Never on buttons/badges/links/rows/cards.
Mobile-first PWA for Indian FMCG distribution. Ledge brand, typographic wordmark.
Lovable Cloud backend with RLS. DataContext for session state.
Modals for simple CRUD only; full pages for complex detail views.
No Google OAuth — user explicitly removed it.
Free trial is 30 days, NOT 14 — ignore any spec text saying otherwise.

## Memories
- [Route prefetch + LedgeLoader](mem://style/route-prefetch-loader) — Idle prefetch all authed routes, hover-prefetch NavLink, dynamic xlsx, vendor chunking, branded delayed Suspense loader
- [PR15 Performance/Schemes](mem://style/pr15-performance-schemes) — Performance KPI grid → SignalCard+KpiStrip with InsightLine; Schemes expiring-soon SignalCard
- [PR14 Dealers/Salespersons/Targets](mem://style/pr14-dealers-salespersons-targets) — Credit-risk SignalCard on Dealers, KpiStrip on Salespersons, named behind-target list on Targets
- [PR13 Stock/NewOrder](mem://style/pr13-stock-neworder) — Stock hero SignalCard+KpiStrip, NewOrder credit-limit promoted to SignalCard
- [Color tokens](mem://style/design-system) — Semantic token system; Electric Blue primary, brand status colors, warm stone neutrals retained
- [Brand moments](mem://style/brand-moments) — The 4 designated places where Gradient Purple/Coral may appear in-app
- [Landing page](mem://style/landing-page) — Light-themed landing page aligned with dashboard
- [Landing palette (cool)](mem://style/landing-palette) — Landing uses cool Navy/Purple/Electric Blue palette; coral excluded from landing only
- [Branding assets](mem://style/branding-assets) — Colorful checkmark graphic for favicon and app icon
- [Pricing tiers](mem://auth/pricing-tiers) — Four-tier pricing: Free, Growth, Scale, Enterprise
- [Marketing positioning](mem://marketing/positioning) — Founder-to-Founder tone for Indian FMCG
- [PWA support](mem://features/pwa-support) — Installable PWA with asset caching
- [Aesthetic](mem://style/aesthetic) — Typographic wordmark, minimal branding
- [Project metadata](mem://project/metadata) — Ledge brand, © 2026
- [Core concept](mem://project/core-concept) — Mobile-first sales order management platform
- [Technical architecture](mem://project/technical-architecture) — Centralized DataContext for state sync
- [Orders](mem://features/orders) — Multi-phase celebration flow on save
- [Dashboard style](mem://style/dashboard) — Minimal monochrome glass-card KPIs
- [Theming architecture](mem://style/theming-architecture) — Semantic tokens, frosted glass effects
- [Toast notifications](mem://style/toast-notifications) — Sonner, Apple-inspired aesthetic
- [Interactions](mem://style/interactions) — Standardized tactile feedback (.row-hover, .card-hover)
- [Mobile-first design](mem://style/mobile-first-design) — 72px top nav, liquid glass aesthetic
- [Technical status](mem://project/technical-status) — In-memory DataContext with mock data
- [Data protection](mem://safety/data-protection) — Comprehensive form-level validation
- [Notifications](mem://features/notifications) — Bell icon notification center
- [Stock management](mem://features/stock-management) — Unified Stock page with Products and Warehouses
- [Stock health](mem://logic/stock-health-calculation) — Color-coded badges based on thresholds
- [Badge settings](mem://project/settings/lovable-badge) — Edit badge disabled
- [Human-centric design](mem://style/human-centric-design) — Plain English for Indian FMCG
- [Reporting](mem://features/reporting) — Dealer, Product, Payment, Dispatch, Sales Team reports
- [Sales management](mem://features/sales-management) — Sales Team CRUD
- [Dealer management](mem://features/dealer-management) — Dealer CRUD with enriched profiles
- [Stock logic](mem://logic/stock-management-logic) — Auto deduction deferred for V1
- [RBAC inventory](mem://auth/rbac-inventory-access) — Accountants view stock value only
- [Multi-tenancy](mem://auth/multi-tenancy) — Isolated workspaces with RBAC
- [Modal strategy](mem://style/modal-strategy) — Full pages for complex entities, modals for simple CRUD
- [No Google OAuth](mem://constraints/no-google-oauth) — User does not want Google OAuth on login/signup
- [Order pricing engine](mem://logic/order-pricing-engine) — Centralized scheme calculations in src/lib/order-pricing.ts, single source of truth for all commercial math
