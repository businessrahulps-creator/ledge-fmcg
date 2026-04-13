

# Add Branded Splash Screen

## What
Replace the plain spinner shown during auth loading with a polished splash screen featuring the Ledge wordmark and a subtle fade-out animation. This applies to both the Index page and ProtectedRoute loading states.

## Changes

### 1. New component: `src/components/SplashScreen.tsx`
- Full-screen centered layout with the app's background color
- Ledge typographic wordmark (using existing `font-heading font-extrabold tracking-tight` classes)
- Subtle pulse animation on the wordmark
- A small "Loading..." text or minimal dot animation beneath

### 2. Update `src/pages/Index.tsx` (lines 18-24)
- Replace the spinner div with `<SplashScreen />`

### 3. Update `src/App.tsx` — `ProtectedRoute` (lines 57-63)
- Replace the spinner div with `<SplashScreen />`

## Files Changed
- `src/components/SplashScreen.tsx` — new branded splash component
- `src/pages/Index.tsx` — use SplashScreen for auth loading
- `src/App.tsx` — use SplashScreen in ProtectedRoute

