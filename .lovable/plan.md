

# Site-Wide QA, CTO Review & Production Readiness Audit

## Audit Methodology

Code-first review of every page, component, and flow. Organized by severity: Critical (blocks launch) → High (degrades UX) → Medium (polish) → Low (minor).

---

## 1. Console Errors & React Warnings

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 1.1 | `forwardRef` warning: "Function components cannot be given refs — Check the render method of `Help`" and `App` | Medium | `Help.tsx`, `App.tsx` | The `Help` page is a plain function component rendered inside `PageErrorBoundary` which may attempt to pass a ref. No functional impact but pollutes console. Either wrap `Help` in `forwardRef` or ensure `PageErrorBoundary` doesn't pass refs to children. |

## 2. UI/UX Audit

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 2.1 | **Mobile "More" sheet missing Help link** — Help is in sidebar's bottom nav but not in mobile's "More" sheet groups | High | `AppLayout.tsx` | Add `{ title: "Help", url: "/help", icon: BookOpen }` to the "Settings" group in `moreGroups` |
| 2.2 | **Onboarding celebration persists across sessions** — `celebrationDismissed` is React state only, resets on page refresh. User sees celebration banner every time they visit Dashboard after completing all steps | High | `SetupChecklist.tsx` | Store celebration dismissal in `localStorage` (e.g., `ledge_onboarding_celebration_dismissed`) |
| 2.3 | **Onboarding: "brand new" check is unreliable** — `isBrandNew` = `completedCount === 0` but seeded accounts from `setup_new_company` RPC may already have data, so `isBrandNew` is never true for real signups | Low | `use-onboarding.ts` | Acceptable — the checklist still shows "Finish setting up" which is correct. No action needed. |
| 2.4 | **Dashboard "Recent Orders" section has `pb-24 md:pb-8`** — the `pb-24` adds excessive bottom padding on mobile above the bottom nav, but `AppLayout` already has `pb-28`. This creates ~208px of dead space at the bottom on mobile | Medium | `Dashboard.tsx` L209 | Remove `pb-24` from the section — `AppLayout`'s `main` already handles bottom padding |
| 2.5 | **Empty `kpiAccents` array** — Lines 63-68 define 4 empty strings, adding no value | Low | `Dashboard.tsx` | Remove unused array and references |

## 3. Navigation & Routing

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 3.1 | **"Claims" in mobile "More" vs "Returns" in sidebar** — Sidebar calls it "Returns" (`/claims`), mobile More sheet calls it "Claims" | Medium | `AppLayout.tsx` L48 | Change mobile label from "Claims" to "Returns" for consistency with sidebar |

## 4. Data Integrity & Logic

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 4.1 | **Offline sync: `setSyncing(true)` triggers on any `pendingCount > 0` regardless of actual sync** — Lines 89-96 in `AppLayout.tsx` show a "Syncing" banner for 3 seconds when coming online with pending mutations, but don't actually verify sync completed | Medium | `AppLayout.tsx` | Cosmetic only — the actual replay happens in `DataContext`. The banner is just visual feedback. Acceptable for V1. |
| 4.2 | **exportFullBackup doesn't handle the 1000-row Supabase limit** — Large companies with >1000 orders will get truncated backups silently | High | `exportBackup.ts` | Add pagination or `.range()` calls for each table query, or at minimum warn the user |

## 5. Security

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 5.1 | **Signup auto-confirms and immediately logs in** — `setup_new_company` runs right after `signUp` without waiting for email confirmation. If auto-confirm is disabled (which it should be per guidelines), the RPC call fails because the user isn't fully authenticated yet | Critical | `Signup.tsx` | Need to verify auth configuration. If email confirmation is required, the flow should show a "check your email" screen instead of immediately calling `setup_new_company` |

## 6. Performance & PWA

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 6.1 | **DataContext is 1592 lines** — While functional, this is a maintenance risk. Not a launch blocker but flagged for post-launch refactor | Low | `DataContext.tsx` | No action for launch |

## 7. PDF/Export

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 7.1 | **Backup export file count off-by-one** — `fileCount` starts at 0, orders + lines adds 2, but if orders exist but have no lines, it still counts 2 files | Low | `exportBackup.ts` | Minor — lines file is still created (just empty). No user impact. |

---

## Implementation Plan (ordered by severity)

### Pass 1: Mobile nav consistency (High)
- Add "Help" to mobile More sheet in `AppLayout.tsx`
- Rename "Claims" to "Returns" in mobile More sheet

### Pass 2: Onboarding celebration persistence (High)
- Store celebration dismissal in `localStorage` in `SetupChecklist.tsx`

### Pass 3: Backup export row limit warning (High)
- Add a warning toast in `exportBackup.ts` if any table returns exactly 1000 rows (suggesting truncation)

### Pass 4: Dashboard cleanup (Medium)
- Remove redundant `pb-24` from Recent Orders section
- Remove empty `kpiAccents` array

### Pass 5: Console warning (Medium)
- No code change needed — the `forwardRef` warning is a React 18 dev-mode artifact from `PageErrorBoundary` and has zero production impact

### Pass 6: Auth flow verification (Critical — investigate)
- Check `cloud--configure_auth` settings to understand if auto-confirm is enabled
- If email confirmation is required, the signup flow needs a "check your email" intermediate step

---

**6 passes, 4 files modified, 0 new files, 0 database changes. Pure fixes — no new features.**

