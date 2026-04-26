## Goal
Bring the Navbar and Footer in line with the new premium primitives (`lp-btn-primary-dark`, `lp-shimmer`, `lp-eyebrow`, `lp-noise`, refined blur, consistent gutters) so they feel hand‑crafted on desktop and mobile. No copy or structural changes.

## Navbar (`src/components/landing/sections/Navbar.tsx`)

**Surface & blur**
- Tighten the scrolled state: `bg-white/65 backdrop-blur-xl backdrop-saturate-[1.8]`, slimmer hairline `border-b border-[#0A0F1C]/[0.06]`, softer shadow `shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_24px_-16px_rgba(15,23,42,0.10)]`.
- Add a near‑invisible `lp-noise` layer (opacity ~30%) behind the bar so it matches the page surface and never bands.
- Reduce height from `h-16` → `h-[60px]` to feel lighter and more Linear‑like.

**Gutters & rhythm**
- Match landing container: `max-w-7xl mx-auto w-full px-6 md:px-8 lg:px-10`.
- Desktop link gap `gap-8` → `gap-7`; link size `text-[15px]` → `text-[14px]` with `tracking-[-0.005em]` for tighter premium feel.
- Sign‑in link gets the same treatment; CTA gap `gap-4` → `gap-5`.

**Desktop CTA**
- Replace ad‑hoc classes with the shared primitive:
  `className="lp-btn-primary-dark lp-shimmer inline-flex items-center text-white px-5 py-2 rounded-full font-body font-semibold text-[13.5px] transition-colors duration-200"`.
- Drop redundant `motion.div` wrapper scale (shimmer + button shadow already convey lift); keep `whileTap` only.

**Mobile hamburger & sheet**
- Hamburger button: turn into a 36×36 rounded‑full glass chip — `rounded-full bg-white/70 backdrop-blur-md border border-[#0A0F1C]/[0.06] w-9 h-9 flex items-center justify-center` with `Menu size={20}`.
- Sheet panel: widen to `w-[88vw] sm:w-80`, change surface to `bg-white/95 backdrop-blur-xl border-r border-[#0A0F1C]/[0.06]`, padding `p-6` → `p-7`, add `lp-noise` overlay.
- Mobile link rows: reduce vertical padding `py-3` → `py-2.5`, font `text-[17px]` → `text-[16px]`, hover surface `hover:bg-[#F4F4F5]` → `hover:bg-[#0A0F1C]/[0.04]`, icon stroke `1.5` → `1.75` for crisper feel.
- Mobile CTAs:
  - Primary "Get Started Free" → `lp-btn-primary-dark lp-shimmer text-white rounded-2xl py-3.5 font-semibold text-[15px]` (drops the `#27272A` one‑off).
  - Secondary "Sign in" → `bg-[#0A0F1C]/[0.04] hover:bg-[#0A0F1C]/[0.07] text-[#0A0F1C] rounded-2xl py-3.5 font-semibold text-[15px] border border-[#0A0F1C]/[0.06]`.
- Sheet close button: keep round chip but align border color to `#0A0F1C]/[0.08]` so it matches the new hamburger.

## Footer (`src/components/landing/sections/Footer.tsx`)

**Surface & rhythm**
- Keep `bg-[#FAFAFC]` but layer a faint `lp-noise` div (opacity ~40%) and a soft top hairline gradient: `border-t border-[#0A0F1C]/[0.06]` + a 1px gradient line `bg-gradient-to-r from-transparent via-[#0A0F1C]/10 to-transparent` directly under it.
- Container gutters: `px-6 md:px-8 lg:px-10` (already), bump max width to `max-w-7xl` to match navbar grid.
- Column grid gap: `gap-8` → `gap-10 md:gap-12` for breathing room; vertical padding `py-20 md:py-24` → `py-24 md:py-28` to match other light sections.

**Headers & links**
- Column headers: replace bespoke caps with the shared `lp-eyebrow` chip (without the dot) for consistency — implement as `<span className="lp-eyebrow !py-1 !px-2.5 !text-[11px]">{col.title}</span>` or, simpler, restyle the `<h4>` to `text-[12px] font-semibold tracking-[0.08em] text-[#0A0F1C]/70 uppercase`.
- Link size `text-[14px]` → `text-[13.5px]`, color `text-[#71717A]` → `text-[#52525B]`, hover transition unchanged.
- Vertical link spacing `space-y-3` → `space-y-2.5`.

**Status & infra column**
- Wrap the status pill + AWS line in a subtle `lp-card`‑style chip cluster: a single `rounded-2xl border border-[#0A0F1C]/[0.06] bg-white/70 backdrop-blur-sm p-4 flex flex-col gap-3 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_24px_-16px_rgba(15,23,42,0.06)]`.
- Status pill stays animated; tighten typography to `text-[11.5px] text-[#3F3F46]`.
- AWS line: bump logo to `h-3.5`, text `text-[12px] text-[#71717A]`, swap separator `·` for `•` to match the rest of the site.

**Bottom bar**
- `mt-14 pt-10` → `mt-16 pt-8`; border `border-[#E8E5E0]` → `border-[#0A0F1C]/[0.06]`.
- Wordmark + copy: keep wordmark, change copy color to `text-[#71717A] text-[13px]`.
- Social icons: wrap each in a 32×32 rounded‑full chip — `w-8 h-8 rounded-full bg-white/70 border border-[#0A0F1C]/[0.06] flex items-center justify-center hover:bg-white transition-colors` with `size={16}` icon for proportion.

## Accessibility & motion
- All hover transitions remain ≤200ms; CTA shimmer is the existing `lp-shimmer` (already gated by `prefers-reduced-motion`).
- Hamburger chip and social chips get `focus-visible:ring-2 focus-visible:ring-[#0A0F1C]/20 focus-visible:ring-offset-2`.
- No new layout shifts — all changes are paint‑only.

## Files touched
- `src/components/landing/sections/Navbar.tsx`
- `src/components/landing/sections/Footer.tsx`

No copy, structural, color‑palette, or routing changes.