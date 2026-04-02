

# Confetti Celebration on Order Save

## Concept
When a user taps "Save Order", a burst of confetti particles animates across the screen for ~2 seconds before navigating to `/orders`. Lightweight, no external libraries — pure canvas-based confetti using the small `canvas-confetti` package (~6KB gzipped).

## Changes

### Install `canvas-confetti`
- Add `canvas-confetti` package (tiny, well-maintained, zero dependencies)

### `src/pages/NewOrder.tsx`
- Import `confetti` from `canvas-confetti`
- In `handleSave()`: fire confetti burst, then delay navigation by ~1.5s so the user sees the celebration
- Fire from center-bottom with spread and particle count tuned for mobile (80-100 particles, 2-3 second gravity)

```
const handleSave = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
  });
  toast({ title: "Order saved ✓", description: "..." });
  setTimeout(() => navigate("/orders"), 1500);
};
```

## Result
A quick, satisfying confetti burst on every successful order — feels celebratory without being heavy or disruptive.

