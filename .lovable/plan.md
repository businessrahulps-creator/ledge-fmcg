

# Change Primary Color to Blue

The uploaded image shows a vibrant blue (~`#2563EB` / HSL `217 91% 53%`), similar to Tailwind's `blue-600`. Currently the light-mode primary is a dark navy (`224 55% 22%`) and dark-mode is `224 100% 62%`.

## Changes

### `src/index.css`
- **Light mode**: Change `--primary: 224 55% 22%` → `--primary: 217 91% 53%` 
- **Light mode**: Change `--ring: 224 55% 22%` → `--ring: 217 91% 53%`
- **Dark mode**: Change `--primary: 224 100% 62%` → `--primary: 217 91% 60%` (slightly lighter for dark bg contrast)
- **Dark mode**: Change `--ring` to match

This single CSS variable change propagates globally — all buttons, links, sidebar highlights, focus rings, and badges that use `primary` will update automatically. No component files need editing.

