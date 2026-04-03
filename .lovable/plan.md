

# Build Navbar Section

Replace the placeholder `Navbar.tsx` with a fully styled, responsive navbar matching the spec.

## Implementation

### File: `src/components/landing/sections/Navbar.tsx`

**Structure:**
- Fixed, h-16, z-50, starts transparent, gains `bg-midnight/95 backdrop-blur-md border-b border-slate-border` on scroll (>16px)
- Max-width 1200px centered container

**Left — Logo:**
- 24px white circle with `border-2 border-white rounded-full` containing "O" text
- "Ordra" in `font-heading font-bold text-xl text-white`

**Center — Links (hidden on mobile):**
- "Features" → `#features`, "Pricing" → `#pricing`, "About" → `#about`
- `font-body font-medium text-[15px] text-silver hover:text-white transition-colors`

**Right — CTA (hidden on mobile):**
- "Start Free Trial" pill button: `bg-violet text-white px-6 py-2.5 rounded-full hover:bg-violet-hover font-semibold`

**Mobile (<768px):**
- Hamburger icon (Lucide `Menu`) replaces center+right
- Opens a slide-in drawer from right using existing Sheet component (shadcn)
- Drawer contains links stacked vertically + CTA at bottom
- Close via X button in drawer header

**Dependencies:** `useState`, `useEffect`, `Link` from react-router-dom, `Menu` from lucide-react, Sheet components from `@/components/ui/sheet`

No other files changed.

