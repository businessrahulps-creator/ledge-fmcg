
# The Ledge First-Run — Approved Build Plan

Vision approved. Decisions locked in:

1. **Google OAuth** = hero path (Lovable managed). Email/password collapses behind "Continue with email".
2. **3-step `/welcome` flow** = company name → role + team size → logo (skippable). The 15s is worth smarter defaults.
3. **"Your First Week"** = top of `/dashboard`, replaces existing `<SetupChecklist />` slot. Momentum stays visible.
4. **New: synchronized celebration.** When a chapter completes, the card flips *and* the top progress ribbon advances in the same beat — same easing, same duration, same Terracotta pulse. The ledger visibly fills.

Mobile-first. `prefers-reduced-motion` respected everywhere (opacity-only fallbacks). Zero new dependencies — only `framer-motion`, `zod`, `react-hook-form`, `sonner` (all installed).

---

## Build sequence (single sequenced pass)

### PR-1 · Foundation: Auth shell + motion primitives
- `src/components/auth/AuthShell.tsx` — persistent Bone panel, breathing Ledge mark, Terracotta progress ribbon (acts 2→4), cursor aura background.
- `src/components/auth/ActTransition.tsx` — `AnimatePresence` page-turn wrapper (24px slide + cross-fade, `ease-fluent`).
- `src/components/auth/useFocusFirstField.ts` — focus management across act transitions for a11y.
- `src/components/auth/useReducedMotion.ts` (or reuse framer's `useReducedMotion`) — gate every animation.

### PR-2 · `/auth` — Identity (Act 2)
- New `src/pages/Auth.tsx` with morphing tabs (sign in ↔ sign up — not swap, morph via shared layoutId).
- Google CTA full-width, primary, magnetic. Email form collapses behind "Continue with email" link.
- Reuse existing zod schemas. No validation changes.
- Email-verified return → `/auth?verified=1` triggers Act 3 recognition state.
- `/login` and `/signup` routes redirect to `/auth` (keep old URLs alive).

### PR-3 · Google OAuth wiring
- `supabase--configure_social_auth` providers: `["google"]`.
- Use `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- Update `mem://constraints/no-google-oauth` → archived; add `mem://auth/google-oauth-enabled` with the rationale.

### PR-4 · `/welcome` — Foundation (Act 4)
- New `src/pages/Welcome.tsx` — 3-step guided flow inside the same `AuthShell` (progress ribbon continues).
  - Step a: **Company name** with live "ledger cover" preview (Playfair name embossed on the striped-square mark).
  - Step b: **Role + team size** (segmented controls; persisted to `profiles` — needs a small migration to add `role_self_selected text`, `team_size text`).
  - Step c: **Logo upload** with a confident "Skip for now" (Forest checkmark on skip, no shame).
- Calls `setup_new_company` RPC on step a save (so the guard releases immediately); steps b+c patch the profile.
- Replace `NoCompanyGuard`'s blocking modal with `<Navigate to="/welcome" replace />`. Add lighter `WelcomeGuard` (auth required, no company required) around `/welcome`.

### PR-5 · `FirstWeek` momentum card (Act 5)
- `src/components/onboarding/FirstWeek.tsx` — replaces `SetupChecklist` mount on Dashboard.
- Chapter card stack: one **active** chapter highlighted, others dimmed but visible.
- Founder-voice "why this matters" line per chapter.
- **Synchronized celebration on completion:**
  - Card 3D flips (`rotateY` 180°) revealing Forest seal + next chapter slides in from right.
  - **Top progress ribbon advances in the same animation frame** — shared `useAnimationControls` orchestrates both. Terracotta pulse on both surfaces, same 600ms `ease-fluent`.
- Time-to-value ticker ("You're 4 min in · ~11 min to first invoice") computed from chapter completion timestamps.
- Smart deep-links: chapter click → target page with relevant drawer pre-opened and first field focused.
- 100% state: full-screen page-turn → "Your ledger is open." Terracotta seal. Click-anywhere dismiss. Persisted via `localStorage` key `ledge_first_week_sealed`.
- Reuses `useOnboarding` data unchanged — only presentation differs.

### PR-6 · Motion polish + reduced-motion pass
- Audit every transition for `prefers-reduced-motion`. Replace transforms with opacity-only or instant state.
- Tune all easings to `ease-fluent` token. No springs that overshoot.
- Verify focus rings remain visible through transitions.

### PR-7 · Mobile pass (<640px)
- Page-turn collapses to vertical card-stack.
- Welcome 3 steps become a vertical scroll with sticky progress ribbon at top.
- FirstWeek chapter stack becomes single full-width card with horizontal swipe (no scroll-jank).
- Touch targets ≥44px. Tested at 360×800 and 414×896.

### PR-8 · Cleanup
- Delete `NoCompanyGuard`'s modal body (keep file, simplify to redirect).
- Delete `SetupChecklist.tsx` after `FirstWeek` is live (verify no other consumers).
- Update `mem://style/aesthetic` and add `mem://style/auth-onboarding-experience` documenting the new motion language.

---

## Files touched (preview)

```text
New
  src/pages/Auth.tsx
  src/pages/Welcome.tsx
  src/components/auth/AuthShell.tsx
  src/components/auth/ActTransition.tsx
  src/components/auth/useFocusFirstField.ts
  src/components/onboarding/FirstWeek.tsx
  src/components/onboarding/ChapterCard.tsx
  src/components/onboarding/ProgressRibbon.tsx
  src/components/onboarding/LedgeSealMoment.tsx

Edited
  src/App.tsx            (routes: /auth, /welcome; redirect /login + /signup)
  src/components/onboarding/NoCompanyGuard.tsx  (modal → redirect)
  src/pages/Dashboard.tsx (SetupChecklist → FirstWeek)
  supabase migration: profiles.role_self_selected, profiles.team_size

Deleted (PR-8)
  src/pages/Login.tsx
  src/pages/Signup.tsx
  src/components/onboarding/SetupChecklist.tsx
```

---

## Non-negotiables

- `AuthContext` untouched. Plumbing stays.
- Existing `setup_new_company` RPC + auto-recovery untouched.
- Existing zod schemas reused as-is.
- No new dependencies.
- Reduced-motion = opacity only. Always.
- Mobile-first; desktop is the enhancement.
- Card + ribbon celebrate together — one orchestrator, one easing, one beat.

Hit **Implement plan** and I'll build PR-1 through PR-8 in that order, pausing only if a step uncovers something the plan didn't anticipate.
