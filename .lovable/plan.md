

# Dashboard: Replace Emoji with User's Name in Greeting

## Change

Replace `👋` emoji in the greeting with the logged-in user's first name from `profile.full_name`.

- **Current**: "Good morning 👋"
- **New**: "Good morning, Rahul" (or just "Good morning" if no profile loaded yet)

## Implementation

**`src/pages/Dashboard.tsx`** — single line change:

1. Extract first name: `const firstName = profile?.full_name?.split(" ")[0]`
2. Replace greeting line:
   ```tsx
   <h1 className="text-xl font-bold tracking-tight mt-1 md:text-2xl">
     {getGreeting()}{firstName ? `, ${firstName}` : ""}
   </h1>
   ```

**1 file, 1 line changed. No new dependencies. No database changes.**

