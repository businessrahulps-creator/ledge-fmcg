# Optimize Landing Page Images & Polish Founder Section

## Problems
1. **`ledge-logo.png`** — 264 KB, 1920×570px, but rendered at ~28px tall. Massively oversized.
2. **`asha-ps-founder.jpg`** — 388 KB, 1023×1537px, loaded above-the-fold with only `loading="lazy"` (which doesn't help here) and a plain pulse skeleton.
3. The phone number in the Founder section needs to go.

## Fix

### 1. Compress assets (build new WebP versions)
- **Logo** → `src/assets/ledge-logo.webp` at ~480×142px (2× retina for a 28px render), quality 90. Target: **<8 KB**.
- **Founder photo** → `src/assets/asha-ps-founder.webp` at ~800×1200px (2× retina for the 400px max display), quality 82. Target: **<60 KB**.
- **Founder LQIP blur** → `src/assets/asha-ps-founder-blur.webp` at 24×36px, quality 40. Target: **<1 KB** — used as an instant background for a blur-up effect.

Replace original imports in:
- `src/components/landing/sections/Navbar.tsx` → use `ledge-logo.webp`, add `width`/`height` attrs + `decoding="async"` + `fetchpriority="high"` (it's above the fold).
- `src/components/layout/AppSidebar.tsx` → use the same `ledge-logo.webp`.
- `src/components/landing/sections/Founder.tsx` → use `asha-ps-founder.webp`.

After replacing, delete the old `ledge-logo.png` and `asha-ps-founder.jpg` files so they don't ship in the bundle.

### 2. Beautiful blur-up lazy load for the founder photo
In `Founder.tsx`, replace the current grey pulse skeleton with a proper LQIP (low-quality image placeholder) blur-up:
- Render the tiny `asha-ps-founder-blur.webp` as an absolutely-positioned `<img>` filling the frame, scaled with `filter: blur(20px) saturate(1.2)` and `transform: scale(1.1)` to hide blur edges.
- Layer the full `<img>` on top with `opacity-0 → opacity-100` transition (700ms ease-out) once `onLoad` fires.
- Keep `loading="lazy"` + add `decoding="async"`.
- Add explicit `width={800}` / `height={1200}` to prevent layout shift.

Result: instant colored blur preview → smooth crossfade to sharp image. Feels premium, not like a loading spinner.

### 3. Remove phone number from Founder section
In `Founder.tsx`, delete the separator dot (`·`) and the `<a href="https://wa.me/918138084689">` block — leave only the name, gradient underline accent, and "Founder, Ledge" subtitle.

## Files Changed
- **New:** `src/assets/ledge-logo.webp`, `src/assets/asha-ps-founder.webp`, `src/assets/asha-ps-founder-blur.webp`
- **Deleted:** `src/assets/ledge-logo.png`, `src/assets/asha-ps-founder.jpg`
- **Edited:** `src/components/landing/sections/Navbar.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/landing/sections/Founder.tsx`

## Expected Impact
- Logo: **264 KB → ~6 KB** (~98% reduction)
- Founder photo: **388 KB → ~60 KB sharp + 1 KB instant blur** (~84% reduction)
- Total landing page asset weight drops by **~580 KB**
- Founder image now loads with a tasteful blur-up effect instead of a grey skeleton
- No more phone number cluttering the founder card