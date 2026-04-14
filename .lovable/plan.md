

# Fix Hero Section Mobile Spacing

## Problem
On mobile (390px), the hero section content sits too close to the fixed navbar. The section has `pt-16` (64px) but the navbar is `h-16` (64px), so content starts immediately below the nav with zero breathing room.

## Fix — `Hero.tsx` line 22

Change `pt-16` to `pt-28` on mobile, keeping the desktop padding unchanged:

```
- className="min-h-screen flex items-center pt-16 px-6 bg-[#F8F7F5] py-28 md:py-36"
+ className="min-h-screen flex items-center px-6 bg-[#F8F7F5] pt-32 pb-28 md:py-36"
```

This gives 128px top padding on mobile (64px nav + 64px breathing room), while desktop stays at `py-36`. The `items-center` vertical centering still works but content won't crowd the nav.

## What does NOT change
- All copy, buttons, mockup, animations, colors
- Desktop layout
- Navbar height or position

