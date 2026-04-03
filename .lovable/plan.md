

# Set Up Ordra Landing Page Shell

Replace the current landing page with a clean scaffolded shell — new design system, fonts, placeholder sections with correct backgrounds, no content yet.

---

## What Changes

### 1. Google Fonts in `index.html`
Add Plus Jakarta Sans (700, 800) and Inter (400, 500, 600) via Google Fonts link tags.

### 2. Landing page CSS variables in `src/index.css`
Add a new block of landing-page-specific custom properties under `:root`:
```
--midnight, --charcoal, --violet, --violet-hover, --violet-wash,
--violet-glow, --snow, --cream, --white, --onyx, --graphite,
--zinc, --silver, --fog, --slate-border, --emerald, --amber, --rose
```
Existing app variables remain untouched.

### 3. Tailwind config (`tailwind.config.ts`)
Extend `fontFamily` with `heading` (Plus Jakarta Sans) and `body` (Inter). Add landing color tokens referencing the new CSS vars. Existing config untouched.

### 4. Replace `src/pages/Index.tsx`
New shell with 11 labeled placeholder `<section>` elements in correct order, each with the specified background color, correct vertical padding (py-32 desktop / py-16 mobile), and max-w-7xl centered content area. Each placeholder shows the section name in muted text.

Sections and their backgrounds:
1. **Navbar** — dark sticky (--midnight), rendered as a simple fixed bar
2. **Hero** — --midnight
3. **Trust Bar** — --snow
4. **Problem** — --cream
5. **How It Works** — white
6. **Features** — --midnight (dark)
7. **Why Ordra** — --snow
8. **Testimonials** — --cream
9. **Pricing** — white
10. **Final CTA** — --midnight
11. **Footer** — --charcoal

### 5. Create stub section components
Create 11 new files in `src/components/landing/sections/`:
- `Navbar.tsx`, `Hero.tsx`, `TrustBar.tsx`, `Problem.tsx`, `HowItWorks.tsx`, `Features.tsx`, `WhyOrdra.tsx`, `Testimonials.tsx`, `Pricing.tsx`, `FinalCTA.tsx`, `Footer.tsx`

Each is a simple placeholder div with the correct bg color class and a centered label. This keeps architecture clean for the section-by-section build.

### 6. Keep old landing components
The existing `src/components/landing/*.tsx` files stay in the codebase but are no longer imported from Index. They can be removed later or referenced for content.

---

## Files Touched
| File | Action |
|---|---|
| `index.html` | Add Google Fonts links |
| `src/index.css` | Add landing CSS custom properties |
| `tailwind.config.ts` | Add font families + landing colors |
| `src/pages/Index.tsx` | Replace with new shell |
| `src/components/landing/sections/*.tsx` (11 files) | Create placeholder stubs |

No existing app functionality is affected. All authenticated routes remain unchanged.

