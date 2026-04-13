

# Fix: Ugly Skeleton Loading States

## Problems

1. **Skeleton styling too faint** — `bg-muted/50` (50% opacity on an already-muted color) makes skeleton cards nearly invisible against the background, looking washed out and unprofessional
2. **300ms artificial minimum delay** — `usePageLoading` forces skeletons to show for at least 300ms even when data is ready sooner, creating an unnecessary flash of skeleton content
3. **No smooth crossfade** — When loading finishes, content just pops in abruptly with no transition from skeleton to real content

## Fix

### 1. Improve skeleton styling (`src/components/ui/page-skeleton.tsx`)
- Change `bg-muted/50` to `bg-muted` (full opacity) for visible, professional skeleton bones
- Add subtle shimmer/pulse that looks polished

### 2. Reduce artificial delay (`src/hooks/use-loading.ts`)
- Reduce default delay from 300ms to 0ms — only show skeleton when data is actually loading
- Keep the `dataLoading` parameter as the sole driver: if data is loading, show skeleton; if not, show content immediately

### 3. Add crossfade transition on pages
- Wrap page content in a `motion.div` with `fadeIn` animation from `src/lib/motion.ts` so content fades in smoothly instead of popping

## Files Changed
- `src/components/ui/page-skeleton.tsx` — change `bg-muted/50` to `bg-muted`
- `src/hooks/use-loading.ts` — reduce default delay to 0ms (show skeleton only while data is genuinely loading)

