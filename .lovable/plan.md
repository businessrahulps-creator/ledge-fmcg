## Plan: End-to-end PRD for Ledge (Markdown artifact)

### Deliverable
A single comprehensive PRD document saved to `/mnt/documents/Ledge-PRD.md`, ready for brainstorming. No code changes to the app.

### How I’ll build it
1. **Deep codebase sweep** — read every page in `src/pages` (Dashboard, Orders, NewOrder, OrderDetail, Distributors, DealerDetail, Salespersons, SalespersonDetail, Stock, Billing, Claims, Schemes, Targets, Reports, Performance, Company, Settings, Help, auth pages, marketing pages), the seven domain hooks in `src/context/domains/*`, the landing sections, the PDF/report components, the notification + offline + PWA layers, and the security/data utilities.
2. **Backend sweep** — inspect all 22 Lovable Cloud tables (companies, profiles, user_roles, distributors, salespersons, products, godowns, stock_items, stock_deductions, orders, order_lines, order_schemes, schemes, invoices, invoice_lines, claims, claim_lines, targets, secondary_sales, notifications, activity_log, error_log), their RLS policies, and any edge functions. Capture multi-tenancy, RBAC, and data lineage.
3. **Marketing + positioning** — pull tone, pricing tiers, target persona, and value props from landing sections and memory.
4. **Roadmap** — fold in the approved AI features roadmap and any deferred items (e.g. auto stock deduction).

### PRD sections (in order)
1. **Executive Summary** — what Ledge is, who it’s for, the wedge.
2. **Vision & Problem Statement** — the 5–10% leak between factory and field; why existing tools (Tally + Excel + WhatsApp) fail Indian FMCG super-stockists.
3. **Target Users & Personas** — Owner, Operations Head, Accountant, Sales Executive, Warehouse Lead.
4. **Jobs-to-be-Done** — per persona, mapped to product surfaces.
5. **Product Principles** — mobile-first, offline-ready, GST-native, plain English, Fluent 2 visual system.
6. **Information Architecture** — sitemap of `/app` (Dashboard, Orders, Distributors, Salespersons, Stock, Billing, Claims, Schemes, Targets, Reports, Performance, Company, Settings, Help) + marketing site.
7. **Feature Modules (deep dive per module)** — each contains: purpose, key flows, primary screens, data entities, business rules, edge cases, RBAC, current state vs gaps.
   - Auth & Onboarding (signup, login, reset, company creation, splash, PWA install)
   - Multi-tenancy & RBAC (companies, profiles, user_roles, has_role)
   - Dashboard (KPIs, sparkline, recent activity, notifications)
   - Orders (NewOrder capture, OrderDetail, status lifecycle, celebration flow, schemes attach)
   - Dealers/Distributors (CRUD, enriched profile, credit at risk, secondary sales)
   - Salespersons (CRUD, performance, targets)
   - Stock (products + godowns, stock health calc, deductions, accountant-only valuation)
   - Billing & Invoices (GST CGST/SGST/IGST, invoice lines, PDF generation, paid/pending/partial)
   - Claims (claim + claim lines, approval flow)
   - Schemes (definition, attach to orders)
   - Targets (per-salesperson, period, achievement)
   - Reports (Dealer, Product, Payment, Dispatch, Sales Team) + export
   - Performance analytics
   - Notifications (bell center, realtime)
   - Activity & Error log (audit)
   - Settings (company profile, branding, badge)
   - Help & Support
8. **Data Model** — table-by-table summary, key columns, relationships, RLS posture.
9. **Permissions Matrix** — role × module × action.
10. **Non-functional Requirements** — performance budget, offline behavior (idb-keyval, PWA, NetworkFirst HTML), accessibility, security (RLS-only roles, no client-side admin checks), reliability, observability (error_log, activity_log).
11. **Design System** — V2 tokens (Midnight, Forest, Terracotta, Bone), Playfair + Inter, Fluent 2 depth/motion, landing tinted cards, Motion v3.
12. **Pricing & Packaging** — Free, Growth, Scale, enterprise via WhatsApp.
13. **Marketing Surfaces** — landing IA, founder note, testimonials, pricing, contact.
14. **Roadmap** — Now / Next / Later including the approved 10-feature Gemini AI roadmap and deferred items like auto stock deduction.
15. **Open Questions & Risks** — multi-tenant edge cases, GSTIN validation, dispatch automation, Tally interop, regional language, WhatsApp ordering.
16. **Glossary** — FMCG distribution terms (super-stockist, godown, secondary sales, scheme, claim, dispatch, GSTIN).
17. **Appendix** — file/route map, env/config, tech stack.

### Output
- File path: `/mnt/documents/Ledge-PRD.md`
- Format: long-form Markdown (target ~3,000–5,000 words, structured with H2/H3, tables where helpful).
- After generation, surface it as a downloadable artifact.