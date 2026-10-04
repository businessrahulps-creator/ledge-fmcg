# Extra access for each team member

## The idea
Each access level (Manager, Accountant, Salesperson, Viewer) keeps giving a sensible starting point. On top of that, the owner can switch on (or off) a few clear **areas** for one person. This works while inviting and at any time later. It's one screen, plain words, and nothing to learn.

## What the owner sees

**1. Inviting someone (the "Invite someone to Ledge" sheet)**
- Step 1: email and access level (same as today).
- Step 2 is new: **"What can they do?"** It shows a list of area cards. Areas that come with their access level are already on and say "Included with Accountant". The owner can turn extra areas on or turn included ones off.
- A live sentence at the bottom reads like "Priya can see money, buy from suppliers and manage stock." The owner can see exactly what they're giving before they send it.
- **Send invite.** The person gets exactly that access the moment they join.

**2. Changing access later (Team list)**
- Each person's row shows small chips for their areas, plus a **"+2 extra"** tag when they have more than their access level gives.
- Tapping **"Change access"** opens the same area list, with **Save** and **Reset to Accountant defaults**.
- Changes take effect for that person straight away, with no sign-out needed.

```text
+------------------------------------------+
| What can Priya do?          Accountant v |
|------------------------------------------|
| [Rs] Money            Included     [on]  |
|      Bills, payments, returns, dues      |
| [Cart] Buying         Extra        [on]  |
|      Suppliers, purchase bills           |
| [Box] Stock & godowns              [off] |
| [Tag] Offers & schemes             [off] |
| [Map] All dealers     Included     [on]  |
| [Bag] Place orders                 [off] |
| [!]  Approve credit limits         [off] |
| [Bldg] Business settings           [off] |
|      Company details, GST, bank, Tally   |
|------------------------------------------|
| "Priya can see money, buy from suppliers |
|  and see all dealers."                   |
|           [Reset]          [Save]        |
+------------------------------------------+
```

## The areas (plain words)
| Area | What it opens |
|---|---|
| Money | Bills, collecting payments, returns and credit notes, dues |
| Buying | Suppliers, purchase bills, supplier payments |
| Stock & godowns | Add and adjust stock, godowns |
| Offers & schemes | Create and edit offers |
| All dealers | See every dealer, not just their own |
| Place orders | Make new orders |
| Approve credit limits | Let an order go past a dealer's credit limit |
| Business settings (new) | Company details, GST, bank, invoice settings |

The following always stay with the owner and are never shown as switches: managing the team, the plan and billing, and system errors.

## Safety rules
- Only the owner can change anyone's access. Nobody can change their own access or the owner's.
- Every change is recorded in Activity and the bell (for example, "Access changed for Priya: + Buying").
- Every area is checked by the server, not just hidden in the app. Turning an area off really blocks it, even for someone who has the app open.
- If an invite is sent and the person's access level is changed later, the extras the owner picked are kept.

## Review and testing
- Astra reviews the plan before building and the finished work after. I'll fix every real finding.
- Live test: invite with extras, accept on a second account, and check the area really opens or stays blocked. Then turn it off and confirm it's blocked straight away.
- All automatic checks still pass.

## Technical details
- New capability `manage_business` (default: owner). The `companies` UPDATE policy changes to `manage_team OR manage_business`. The Settings page shows a "Business" tab to `manage_business` holders, while Team, plan and billing stay `manage_team`-only. The Settings route guard accepts either capability.
- `team_invites` gets an additive `capability_overrides jsonb not null default '{}'` column. `send_team_invite` gets a new overload with `p_overrides jsonb`, validated against the toggleable list (owner-only keys refused). `accept_team_invite` writes `user_capability_overrides` rows in the same transaction.
- New RPC `set_member_access_atomic(p_user uuid, p_overrides jsonb)`: SECURITY DEFINER, requires manage_team, same company, not self, not a super_admin target. Upserts or deletes overrides so they differ from the role defaults. Also add `user_capability_overrides` to `tg_audit_row` with a readable summary.
- Frontend: reuse `CapabilityToggleRow`/`OverrideDrawer`/`useOverrideEditor`. Replace `TOGGLEABLE_CAPS` copy with the area list (icon, label, one-line sub, "Included / Extra" badge from `role_capabilities_default`). Add an "access" step to `InviteSheet`. Add roster chips. Live refresh comes from the existing `my_capabilities` query invalidated by realtime on `user_capability_overrides`.
- Update the `AGENTS.md` rule: per-person access = role defaults + overrides, written only through the atomic RPC or invite acceptance.
