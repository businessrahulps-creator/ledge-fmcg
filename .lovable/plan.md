

# Fix Order Save Celebration Flow

## Problem
Confetti fires instantly, then 1.5s later the page navigates away — feels abrupt. The particles barely have time to animate before the screen disappears.

## Solution
Create a **two-phase celebration** that feels intentional:

1. **Phase 1 — Button feedback** (0ms): Disable button, show "Saving..." state
2. **Phase 2 — Confetti + success overlay** (300ms): Fire confetti with a second delayed burst, show a centered success message (checkmark + "Order Created!") that fades in over the form
3. **Phase 3 — Navigate** (2500ms): Navigate to `/orders` after the user has time to enjoy the celebration

### Changes to `src/pages/NewOrder.tsx`

- Add `isSaving` state to disable the button and show a loading/success state
- Fire **two confetti bursts** (staggered by 400ms) for a richer effect
- Add a **full-screen success overlay** using `AnimatePresence` + `motion.div` that fades in with a large checkmark icon and "Order Created!" text
- Extend total delay to ~2.5s so confetti has time to fall naturally
- The overlay uses the existing frosted glass style (`backdrop-blur`) to obscure the form underneath gracefully

```tsx
const [isSaving, setIsSaving] = useState(false);

const handleSave = () => {
  setIsSaving(true);
  
  // First burst
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: [...] });
  }, 300);
  
  // Second burst  
  setTimeout(() => {
    confetti({ particleCount: 50, spread: 90, origin: { y: 0.5 }, colors: [...] });
  }, 700);
  
  toast({ title: "Order saved ✓", ... });
  setTimeout(() => navigate("/orders"), 2500);
};
```

- The success overlay renders when `isSaving` is true — a centered `motion.div` with scale-in animation showing a green checkmark circle and "Order Created!" text
- Save button shows "Saving..." with a spinner when `isSaving` is true

## Result
A smooth flow: tap Save → button shows saving → confetti bursts cascade → success overlay fades in → navigate after celebration completes naturally.

