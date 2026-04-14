

# Elevate Landing Page Icons — On-Brand Circular Container Design

## What's changing
All landing page icons get a premium circular container treatment that uses the **existing warm palette** — no new colors introduced. The container uses `bg-[#F0FDFA]` (the same light teal wash already used in HowItWorks step badges) and icons stay `text-[#0D9488]` (the existing teal accent used throughout). This keeps icons feeling native to the page while dramatically elevating their visual weight.

## Design tokens (all existing on the page already)
- **Circle background**: `bg-[#F0FDFA]` — the light teal already used for HowItWorks badges
- **Icon color**: `text-[#0D9488]` — the existing teal accent
- **Icon size**: `28px`, `strokeWidth={1.5}`
- **Container**: `w-14 h-14 rounded-full flex items-center justify-center mb-5`

## Icon markup (replaces bare `<Icon>` everywhere)
```tsx
<div className="w-14 h-14 rounded-full bg-[#F0FDFA] flex items-center justify-center mb-5">
  <Icon size={28} strokeWidth={1.5} className="text-[#0D9488]" />
</div>
```

## Icon replacements (more contextual choices)

**Features.tsx**:
- `BarChart3` → `LayoutDashboard`
- `ClipboardCheck` → `Route`
- `Users` → `Contact`
- `Package` → `Warehouse`
- `IndianRupee` — keep
- `CloudOff` → `Layers`

**WhyOrdra.tsx**:
- `Shield` → `ShieldCheck`
- `FileText` → `Receipt`
- `Smartphone`, `WifiOff` — keep

**Problem.tsx** — keep all four icons, just wrap in containers

**Pricing.tsx** — wrap plan header icons (`Gift`, `TrendingUp`, `Layers`, `Building2`) in circular containers. Feature-list checkmarks stay inline teal as-is.

**HowItWorks.tsx** — the step badges already use `bg-[#F0FDFA]` with teal icons; no changes needed here since the format is different (inline badge + mockup layout).

## Files to edit (4)
1. `src/components/landing/sections/Problem.tsx` — wrap icons in circular container
2. `src/components/landing/sections/Features.tsx` — swap icons + wrap in container
3. `src/components/landing/sections/WhyOrdra.tsx` — swap 2 icons + wrap in container
4. `src/components/landing/sections/Pricing.tsx` — wrap plan icons in container

## What does NOT change
- All text/copy, section structure, layout, animations
- Teal checkmarks in pricing feature lists
- HowItWorks step badges (already styled)
- Button colors (charcoal, already updated)
- TrustBar section
- Color palette — everything uses existing `#F0FDFA` + `#0D9488`

