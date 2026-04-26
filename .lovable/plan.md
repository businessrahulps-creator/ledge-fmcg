# Footer Premium Upgrade — Nilavilakku ✦ Kerala Pride

## Goal
Replace the plain `© 2026 Ledge. All rights reserved.` line with an emotionally resonant, premium-feeling cultural signature — without disrupting the footer's clean, minimal balance.

## New Footer Composition

The bottom strip (`Footer.tsx`, lines 120–126) becomes a **two-line stack** under the `Ledge` wordmark:

- **Line 1 (cultural signature):** `🪔 Built in God's Own Country • Kerala`
- **Line 2 (legal):** `© 2026 Ledge. All rights reserved.`

The 🪔 is **not** an emoji — it's a custom-drawn SVG `Nilavilakku` placed inline before the text, vertically aligned to the cap-height. Emoji renders inconsistently across OS/browsers; an SVG guarantees the premium feel.

## The Nilavilakku SVG (new component)

**File:** `src/components/landing/Nilavilakku.tsx` (new, ~60 lines)

A hand-drawn brass lamp in a single inline SVG (~18×22px), composed of:
- **Stem & base:** layered ellipses with warm brass gradient (`#C9A227` → `#8B6F1F` → `#5C4A14`)
- **Oil bowl:** crescent shape at the top
- **Wick + flame:** teardrop flame in warm amber → white-hot core (`#FFD27A` → `#FFF4D6`)
- **Glow halo:** a soft radial blur behind the flame using SVG `<filter>` with `feGaussianBlur`

All stroke widths and gradients are tuned so the lamp reads clearly at 18px but stays elegant — not cartoonish.

## The Animation (premium, calm, permanent)

Two layered Framer Motion loops driven by `spring.gentle` + custom easing — both gated behind `useReducedMotion()`:

1. **Flame flicker** (the flame `<path>`):
   - `scaleY: [1, 1.06, 0.97, 1.04, 1]`
   - `scaleX: [1, 0.98, 1.02, 0.99, 1]`
   - `rotate: [0, 0.6, -0.4, 0.3, 0]` (origin at flame base)
   - Duration: **3.4s**, `ease: [0.45, 0, 0.55, 1]`, `repeat: Infinity`
   - Slow, organic, never aggressive.

2. **Halo glow pulse** (the radial-blur circle behind the flame):
   - `opacity: [0.55, 0.85, 0.6, 0.8, 0.55]`
   - `scale: [1, 1.12, 1.02, 1.08, 1]`
   - Duration: **3.4s** (synced to flicker), offset by 200ms for naturalism.

3. **Reduced motion fallback:** static lamp with a faint static glow — still beautiful, zero animation.

The whole assembly uses `transform-origin: bottom center` on the flame group so the flicker pivots realistically off the wick.

## Footer.tsx surgical edits

Replace lines **120–126** with:

```tsx
<div className="mt-16 pt-8 border-t border-[#0A0F1C]/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
  <div className="flex items-center gap-3">
    <Link to="/" className="font-heading font-extrabold text-lg tracking-[-0.04em] text-[#1A1A1A]">Ledge</Link>
    <div className="flex flex-col gap-0.5">
      <span className="font-body text-[12.5px] text-[#52525B] flex items-center gap-1.5">
        <Nilavilakku />
        <span>Built in God's Own Country · Kerala</span>
      </span>
      <span className="font-body text-[12px] text-[#A1A1AA]">
        © 2026 Ledge. All rights reserved.
      </span>
    </div>
  </div>
  {/* socials column unchanged */}
</div>
```

Mobile: the stack remains aligned, lamp stays inline with the cultural line. On `sm+`, the socials column floats right as today.

## Why this works (premium reasoning)

- **Custom SVG over emoji** = consistent rendering, brand-grade craft.
- **Two synced spring loops** = the flame and halo breathe together, mimicking real oil-lamp behavior — exactly the Apple/Framer-grade detail the user has been asking for.
- **Warm brass + amber** introduces a single warm accent into an otherwise cool/neutral footer — adds emotional warmth without breaking the palette (warm tones live only inside the 18px lamp).
- **Two-line stack** keeps visual weight balanced; the legal line recedes (`#A1A1AA`) so the cultural line leads.
- **`prefers-reduced-motion` respected** — accessibility-first, matches existing motion system memory.

## Suggestion (bonus, optional — included in same pass)

Add a **micro-tooltip on hover** over the lamp: `"നിലവിളക്ക് · Nilavilakku"` (Malayalam + transliteration) using the existing shadcn `Tooltip`. This rewards curious users with a tiny moment of delight and authenticity — entirely optional, can be skipped if you'd rather keep it pure.

## Files Touched

- **Create:** `src/components/landing/Nilavilakku.tsx`
- **Edit:** `src/components/landing/sections/Footer.tsx` (lines 120–126 only — surgical, no other changes)

No CSS file changes, no palette changes, no layout shifts elsewhere. One clean pass.