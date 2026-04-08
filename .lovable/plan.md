

# Fix Post-Signup Race Condition and Settings Hardcoded Company Name

## Problem A: Race Condition

After signup, `navigate("/dashboard")` fires immediately. The `AuthContext` has already set the user, but `profile` (and thus `companyId`) hasn't been refreshed yet — `onAuthStateChange` fires a deferred `fetchProfile`, but the dashboard renders before it completes. `DataContext` sees `companyId === null` and shows empty state.

**Fix**: In `Signup.tsx`, after `setup_new_company` succeeds, call `refreshProfile()` from `useAuth()` before navigating. This ensures `companyId` is populated in context before the dashboard mounts.

```
// In Signup.tsx handleSubmit, after setup_new_company RPC:
await refreshProfile();   // <-- forces profile reload, sets companyId
navigate("/dashboard");
```

**File**: `src/pages/Signup.tsx` — import `useAuth`, call `refreshProfile()` before `navigate`.

## Problem B: Hardcoded Company Name in Settings

Line 61 of `Settings.tsx`: `useState("Acme FMCG Pvt. Ltd.")` is static. The company name, address, and GSTIN should be fetched from the `companies` table.

**Fix**: Add a `useEffect` that fetches the company record using `companyId` from `useAuth()`, then populates the form fields. The save button should also persist changes back to the `companies` table via Supabase update.

```
// In Settings.tsx:
const { companyId } = useAuth();

useEffect(() => {
  if (!companyId) return;
  supabase.from("companies").select("name, address, gstin").eq("id", companyId).single()
    .then(({ data }) => {
      if (data) {
        setCompanyName(data.name);
        setCompanyAddress(data.address);
      }
    });
}, [companyId]);
```

Also update `saveCompany` to persist name/address/GSTIN back:
```
await supabase.from("companies").update({ name: companyName, address: companyAddress }).eq("id", companyId);
```

**File**: `src/pages/Settings.tsx` — add `useEffect` for fetch, update `saveCompany` to write back.

## Changes Summary

| File | Change |
|------|--------|
| `src/pages/Signup.tsx` | Import `useAuth`, call `refreshProfile()` before navigate |
| `src/pages/Settings.tsx` | Fetch company from DB on mount, persist on save |

Two files, minimal changes, no schema modifications needed.

