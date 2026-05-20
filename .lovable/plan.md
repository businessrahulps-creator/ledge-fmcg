## Set demo password to `demo123`

Two steps, both one-click:

### 1. Update the `DEMO_ACCOUNT_PASSWORD` secret
I'll trigger the secure secret form — you paste `demo123` and save. This is the value the seed function uses when creating `demo@getledge.in`.

### 2. Re-seed the demo account so the new password takes effect
The existing `demo@getledge.in` auth user (if any) still holds the old password. To apply `demo123`, we re-run the seed function with `?force=1`, which wipes and recreates the demo workspace with the new password:

```
curl -X POST "https://wnvkqsxgfnuwowdzicno.supabase.co/functions/v1/seed-demo-account?force=1" \
  -H "Authorization: Bearer $SEED_SECRET"
```

I'll run this for you right after the secret is updated.

### Heads-up
`demo123` is intentionally weak — fine for a demo login you share in pitches, but anyone with the email can sign in. If you ever want to tighten it later, just tell me a new value.

### Result
- Login: `demo@getledge.in` / `demo123`
- Full RAW Pressery workspace: 26 SKUs, 28 dealers, 12 reps, 4 warehouses, ~280 orders, GST invoices, schemes, claims, targets, notifications.
