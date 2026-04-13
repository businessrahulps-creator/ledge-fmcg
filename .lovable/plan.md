

# Make Mobile Experience Feel Solid and App-Like (Android-First)

## Problem
The app still has several "webby" tells on mobile — text selection on buttons/nav, tap highlight flashes, instant page swaps, and no touch feedback on cards. 95% of users are on Android, so we prioritize Android Chrome behaviors while keeping iOS parity.

## Important: Text Selection Stays on Content
Text selection will **only** be disabled on UI chrome (navigation, buttons, headers, badges). All content areas — inputs, textareas, paragraphs, table cells with data — remain fully selectable. This is a targeted approach, not a blanket disable.

## Changes

### 1. `src/index.css` — Anti-web CSS rules

**Tap highlight removal (Android + iOS):**
```css
* { -webkit-tap-highlight-color: transparent; }
```
This removes the blue/gray rectangle flash that Android Chrome shows on every tap — the single biggest "website" tell.

**Selective text selection disable — only on UI chrome:**
```css
nav, button, [role="button"], .sidebar, header, label, badge {
  -webkit-user-select: none;
  user-select: none;
}
```
Inputs, textareas, paragraphs, and table content are untouched — users can still select, copy, and paste text in all content areas.

**Touch callout suppression (iOS long-press previews):**
```css
a, button { -webkit-touch-callout: none; }
```

**Overscroll containment on main scroll area:**
```css
main { overscroll-behavior-y: contain; }
```

### 2. `src/index.css` — Touch feedback utility class
Add a `.touch-bounce` utility:
```css
.touch-bounce {
  transition: transform 0.1s ease;
}
.touch-bounce:active {
  transform: scale(0.97);
}
```

### 3. `src/components/ui/card.tsx` — Tap feedback on cards
Add `active:scale-[0.98] transition-transform` to the Card component so all cards give physical press feedback on touch.

### 4. `src/components/layout/AppLayout.tsx` — Page crossfade transitions
Wrap `{children}` in a `motion.div` keyed to `location.pathname` with a fast fade transition (opacity 0→1, 150ms). This replaces instant page swaps with smooth native-feeling crossfades.

### 5. `src/components/layout/AppLayout.tsx` — Scroll-aware header shadow
Add a scroll listener to the main content area. When scrolled > 0, apply a subtle bottom shadow to the sticky header — matching how native Android/iOS toolbars behave.

## Android-Specific Considerations
- Tap highlight removal is the highest-impact fix for Android Chrome
- `overscroll-behavior-y: contain` already prevents Chrome's native pull-to-refresh (added earlier)
- `user-select: none` on nav/buttons prevents accidental text selection during fast tapping — very common on Android
- Page transitions use `will-change: opacity` for GPU acceleration on lower-end Android devices

## Files Changed
- `src/index.css` — tap highlight, selective user-select, touch-callout, overscroll, touch-bounce utility
- `src/components/ui/card.tsx` — active scale feedback
- `src/components/layout/AppLayout.tsx` — page crossfade + scroll-aware header shadow

