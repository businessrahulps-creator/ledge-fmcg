

# Fix Signup Page Button Issues

## Problems
1. The `<Link>` wrapping the button (line 62) is inside `space-y-5` but has no top margin — the button overlaps the password field.
2. The `<Sparkles>` icon (line 64) appears before "Start free trial" — needs to be removed.

## Fix

**File: `src/pages/Signup.tsx`** (lines 62–67)

Add `mt-2` to the Link wrapper, remove the Sparkles icon, and remove the unused `Sparkles` import.

```tsx
// Before
<Link to="/dashboard">
  <Button className="w-full" size="default">
    <Sparkles className="h-4 w-4" />
    Start free trial
  </Button>
</Link>

// After
<Link to="/dashboard" className="block mt-2">
  <Button className="w-full" size="default">
    Start free trial
  </Button>
</Link>
```

Also update the import on line 6 to remove `Sparkles`:
```tsx
import { Eye, EyeOff } from "lucide-react";
```

Two edits, one file.

