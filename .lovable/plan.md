

# Remove Save Icon from Save Order Button

## Problem
The floppy-disk "Save" icon next to "Save Order" text feels dated and cluttered on the button, especially on mobile where space is tight.

## Change

### `src/pages/NewOrder.tsx`
- Remove the `<Save className="h-4 w-4" />` element from the Save Order button
- Remove the `Save` import from lucide-react

The button will simply read **Save Order** as text only, which is cleaner and more modern.

