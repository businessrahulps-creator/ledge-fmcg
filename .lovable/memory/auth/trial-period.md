---
name: Trial period is 30 days
description: New workspace free trial duration is 30 days, NOT 14 — overrides any spec text suggesting otherwise
type: constraint
---
Free trial for new companies is **30 days**, set in `setup_new_company` RPC and `companies.trial_ends_at` default.

**Why:** User explicitly confirmed 30 days is correct. Some spec text says "14 days" — ignore it; 30 is the source of truth.

**How to apply:** Never propose lowering to 14 days. If auditing trial logic, leave 30-day interval untouched.
