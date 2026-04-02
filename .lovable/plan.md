

# Increase Mobile Top Bar Height

## Change — `src/components/layout/AppLayout.tsx` (line 40)

Change the mobile header height from `h-12` (48px) to `h-14` (56px). This gives the top bar more breathing room on mobile, matching the comfortable touch-target sizing used elsewhere in the app.

```
Before: h-12 ... md:h-14
After:  h-14 ... md:h-16
```

Single class change on the `<header>` element.

