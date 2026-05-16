## The Ledge Toaster — Editorial Serif edition

A single, global Sonner restyle that becomes the most refined notification surface in the app. White card, Midnight ink, Playfair title + Inter body, semantic left bar, and a Terracotta progress thread that drains as the toast lives. Slide + soft scale in with Fluent decel, fade + accel out.

### Anatomy

```text
┌─┬───────────────────────────────────────────┐
│ │  ◐  Order saved                       ✕   │   ← Playfair title (16/22, Midnight)
│▌│      Invoice #1042 sent to Ramesh & Sons. │   ← Inter description (13/18, muted)
│ │      ────────────  Undo                   │   ← optional action (Terracotta link)
└─┴───────────────────────────────────────────┘
   ━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░  ← Terracotta progress, drains over duration
```

- 4px colored **left bar** (Forest / Terracotta / Destructive / Midnight for default)
- 18px lucide icon, weight 1.75, color-matched to the bar
- White card (`bg-card`), 1px `surface-border`, `rounded-md` (6px), `shadow-depth-16`
- 1px hairline divider between body and progress
- 360px wide desktop, full-width minus 16px on mobile
- Stack: bottom-right desktop, top-center mobile (already in sonner.tsx)

### Motion

- **Enter**: `translateX(16px) scale(0.98) opacity:0 → 0 1 1`, 220ms `ease-fluent-decel`
- **Sit**: hover deepens to `shadow-depth-28` and **pauses** the progress thread
- **Exit**: `translateX(24px) opacity:0`, 160ms `ease-fluent-accel`
- **Progress**: CSS `@keyframes drain` from `scaleX(1)` → `scaleX(0)` over `--toast-duration` (default 4000ms), `transform-origin:left`, paused via `animation-play-state` on hover/focus-within
- Stack stagger: each subsequent toast offsets 6px and dims 4% (Sonner native, kept)

### Variants (semantic)

| Variant     | Bar / Icon color           | Icon            |
| ----------- | -------------------------- | --------------- |
| default     | `--primary` (Midnight)     | `Info`          |
| success     | `--success` (Forest)       | `CheckCircle2`  |
| warning     | `--warning` (Terracotta)   | `AlertTriangle` |
| error       | `--destructive`            | `XCircle`       |
| loading     | Midnight + spinner         | `Loader2` spin  |

All colors via semantic tokens — no raw hex.

### Files to change

1. **`src/components/ui/sonner.tsx`** — rewrite `toastOptions.classNames` to apply the new layout, left bar (`before:` pseudo with semantic color), Playfair title (`font-heading`), Inter body, hairline divider, and the progress wrapper. Pass `icons={{ success, error, warning, info, loading }}` from lucide-react so every toast gets the right glyph. Set `duration: 4000`, `closeButton: true`, `gap: 10`.
2. **`src/index.css`** — add a small block:
   - `@keyframes ledge-toast-drain { from { transform: scaleX(1) } to { transform: scaleX(0) } }`
   - `.ledge-toast-progress { animation: ledge-toast-drain var(--toast-duration,4000ms) linear forwards; transform-origin:left }`
   - `[data-sonner-toast]:hover .ledge-toast-progress { animation-play-state: paused }`
   - Optional `[data-sonner-toast][data-styled="true"]` overrides to reset Sonner's default padding so our layout owns spacing.
3. **No changes** to `toast.tsx` / `toaster.tsx` (legacy Radix) — per scope, Sonner only. Existing `toast.success/error/...` callers across the app keep working unchanged.

### Accessibility & polish

- `role="status"` for default/success, `role="alert"` for error/warning (Sonner default, preserved)
- Focus ring on close + action uses `--ring` (Midnight) via `shadow-focus`
- Respect `prefers-reduced-motion`: disable drain animation and enter scale, keep opacity fade only
- Tap target: close = 32×32 (matches `--control-h-compact`)
- Max 3 visible toasts (Sonner `visibleToasts={3}`), rest queue

### Out of scope

- Legacy `useToast` / Radix toast (kept as-is; nothing in the app currently uses it for new code)
- Landing-page-only toast variants — global Sonner already covers the landing
- New `toast.promise()` styling beyond inheriting loading variant
- Memory file update — will append a short note to `mem://style/toast-notifications` after implementation lands

### Verification

- Trigger one of each variant from `AdminErrors` or `Settings` dev hook → screenshot at 1202×875 and 390×844
- Confirm progress drains, pauses on hover, resumes on leave
- Confirm `prefers-reduced-motion: reduce` collapses to a quiet fade
- Build passes, no console warnings from Sonner about unknown classNames keys
