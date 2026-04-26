## Audit findings

The brand string "Ledge" is consistent everywhere — there is no literal "Ordra" copy on the site. But two real inconsistencies exist that match what you flagged:

### 1. Stale component name — `WhyOrdra` (one file, two import sites)
- `src/components/landing/sections/WhyOrdra.tsx` — file + exported function `WhyOrdra()`. The visible heading is "Powerful tools exist. None were built for you." and the dark chip already says "Ledge". Only the **filename + symbol** still carry the old "Ordra" name.
- `src/pages/Index.tsx` imports and renders `<WhyOrdra />`.

### 2. Stale "FMCG order management" / "Sales & Order Management" positioning
Per `mem://marketing/positioning`: lead with **"Operating System for Factory + Field"** for ambitious Indian business owners. FMCG stays only as flavor in testimonials/customer names, never as the headline category. These spots still read like the old narrow positioning:

| File | Line | Current |
|---|---|---|
| `vite.config.ts` (PWA manifest `name`) | 76 | `Ledge — Sales & Order Management` |
| `vite.config.ts` (PWA manifest `description`) | 78 | `Sales & Order Management for FMCG businesses. Manage distributors, orders, dispatch & payments.` |
| `src/components/settings/AboutSection.tsx` | 83 | Subtitle `Sales & Order Management` |
| `src/components/landing/sections/FinalCTA.tsx` | 25 | Proof chip `Used by FMCG teams across 12 Indian states` |
| `src/pages/AboutUs.tsx` | 20, 29, 37, 73 | Multiple "FMCG companies / FMCG businesses / FMCG manufacturers / Indian FMCG teams" lines that frame Ledge as FMCG-only |

Everything else (`index.html`, Login/Signup brand mark, Splash, Footer, Navbar, PDF headers, toasts, Testimonials with `Sterling FMCG` as a customer name, Signup placeholder `Acme FMCG Pvt. Ltd.`) is already correct — those are *flavor* uses of FMCG and stay.

---

## Surgical fixes (text-only, no behavior changes)

### A. Rename `WhyOrdra` → `WhyLedge`
1. **Create `src/components/landing/sections/WhyLedge.tsx`** with identical content to current `WhyOrdra.tsx`, but:
   - `export function WhyOrdra()` → `export function WhyLedge()`
2. **Delete `src/components/landing/sections/WhyOrdra.tsx`**.
3. **Update `src/pages/Index.tsx`**: import path + JSX tag → `WhyLedge`.

### B. Realign positioning copy to Factory + Field

**`vite.config.ts` — PWA manifest** (lines 76, 78)
```diff
- name: "Ledge — Sales & Order Management",
+ name: "Ledge — Factory + Field on one app",
- description: "Sales & Order Management for FMCG businesses. Manage distributors, orders, dispatch & payments.",
+ description: "Ledge runs your factory and your field on one mobile app. Orders, stock, payments, GST, production. Built for ambitious Indian business owners.",
```
(Description matches `index.html` `<meta name="description">` exactly — single source of truth.)

**`src/components/settings/AboutSection.tsx`** (line 83)
```diff
- <p className="text-xs text-muted-foreground">Sales & Order Management</p>
+ <p className="text-xs text-muted-foreground">Factory + Field, one app</p>
```

**`src/components/landing/sections/FinalCTA.tsx`** (line 25)
```diff
- Used by FMCG teams across 12 Indian states
+ Used by Indian businesses across 12 states
```

**`src/pages/AboutUs.tsx`** — broaden 4 lines so FMCG is no longer the headline category:
- L20: `Ledge is a cloud-based platform for Indian businesses that run both a factory floor and a field sales team.`
- L29: `Ledge gives business owners a clear view of their operations from order to payment. Sales managers see what their teams are doing. Accountants track outstanding payments without chasing anyone. Field reps place orders in seconds without paperwork.`
- L37: `Ledge is designed for Indian manufacturers, distributors, and brands with field sales teams operating across multiple regions — strong fit for FMCG, building materials, agri-inputs, auto-parts, and consumer goods. Whether you have a team of three or three hundred, Ledge scales with your operations.`
- L73 (hero subtitle): `Built for Indian business owners who run both factory and field.`

---

## What's intentionally NOT changed
- `Sterling FMCG` (TrustBar, Testimonials customer name) — flavor, real-feel proof.
- `Acme FMCG Pvt. Ltd.` placeholder in Signup / NoCompanyGuard — placeholder hint, not positioning.
- `package.json` `name: "vite_react_shadcn_ts"` — internal scaffold name, never user-facing.
- Existing memory files — `mem://marketing/positioning` already reflects the right rule, no edits needed.

---

## Files touched (7)
- ✏️  `src/pages/Index.tsx` (import + tag rename)
- ➕  `src/components/landing/sections/WhyLedge.tsx` (new — content copied verbatim from `WhyOrdra.tsx` with renamed export)
- 🗑️  `src/components/landing/sections/WhyOrdra.tsx` (delete)
- ✏️  `vite.config.ts` (manifest name + description)
- ✏️  `src/components/settings/AboutSection.tsx` (subtitle)
- ✏️  `src/components/landing/sections/FinalCTA.tsx` (proof chip)
- ✏️  `src/pages/AboutUs.tsx` (4 copy lines)

Zero logic changes, zero CSS changes, zero risk to layout. Type-check will pass because the rename is symmetrical and AboutUs/FinalCTA edits are pure string changes.