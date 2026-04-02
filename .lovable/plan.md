

# Light Premium Dashboard — Preview Redesign

## Design Direction

Combining the TIDE-inspired layout (greeting header, floating nav, day indicators) with the MacroFactor reference (clean white background, bold black typography, generous whitespace, minimal color, premium feel).

**Color palette**: Pure white / off-white (`#FAFAFA`) background, near-black text (`#111`), light gray cards (`#F5F5F5`), subtle borders (`#E8E8E8`). Accent kept minimal — black primary, muted gray secondary. Status colors stay but softer/muted.

**Typography**: Large bold headings (system font / Inter weight 700), clean hierarchy with high contrast black-on-white. Larger sizes for KPI values.

## Changes to `src/pages/PreviewDashboard.tsx`

### Background & Text
- `bg-[#0a0a0f] text-white` → `bg-[#FAFAFA] text-[#111]`

### Header
- Date subtitle: `text-white/40` → `text-[#999]`
- Greeting: keep bold, black text
- Day circles: active = `bg-[#111] text-white`, inactive = `bg-[#F0F0F0] text-[#BBB]`

### KPI Cards
- `bg-white/[0.06] border-white/[0.08]` → `bg-white border border-[#EBEBEB] shadow-sm`
- Icon container: `bg-[#F5F5F5]` with dark icon
- Values: `text-[#111]`, labels: `text-[#888]`
- Change indicators: keep green/red but slightly muted

### Section Cards (Distributors, Products)
- Same white card treatment with `border-[#EBEBEB]`
- Section titles: `text-[#111]`, "View all" link: `text-[#888]` instead of blue
- Progress bars: softer tones — blue → `from-[#111] to-[#333]`, purple → `from-[#666] to-[#999]`
- Text inside: `text-[#333]` for names, `text-[#999]` for values

### Order Cards
- White background, subtle border, no backdrop-blur needed
- Status badges: softer backgrounds — paid: `bg-emerald-50 text-emerald-600`, pending: `bg-red-50 text-red-500`, etc.
- Order number text: `text-[#AAA]`

### Bottom Navigation
- `bg-white/[0.08] backdrop-blur-2xl` → `bg-white border-[#E8E8E8] shadow-lg shadow-black/5`
- Active icon: `text-[#111]` with subtle `bg-[#F0F0F0]` pill behind it
- Inactive: `text-[#BBBBBB]`

### File Changed
Only `src/pages/PreviewDashboard.tsx` — no other files touched.

