# Sync Linear + Cursor + Lovable

Goal: one queue (Linear), two builders (Lovable for features/UI/backend, Cursor for logic/bugs/refactors), one repo (GitHub) that keeps everything in sync automatically.

---

## Step 1 — Connect GitHub to Lovable (the backbone)

Everything syncs through GitHub. This is non-negotiable — without it, Cursor and Lovable can't share code.

1. In Lovable: chat input → **+** menu (bottom left) → **GitHub** → **Connect project**
2. Authorize the Lovable GitHub App, pick your org, click **Create Repository**
3. Sync is bidirectional and real-time: Lovable pushes commits as it works, Cursor pushes commits when you save — both pull automatically

After this, the Ledge codebase lives in GitHub. Lovable and Cursor are just two editors looking at the same repo.

---

## Step 2 — Clone the repo locally for Cursor

In your terminal:
```
git clone <your-new-github-repo-url> ledge
cd ledge
bun install
bun run dev
```

Open the `ledge` folder in Cursor. You now have the full project locally.

---

## Step 3 — Connect Linear to Cursor (issue → branch → PR)

Cursor has native Linear support via MCP.

1. In Cursor: **Settings** → **Tools & Integrations** → **MCP**
2. Add Linear (one-click OAuth, no API key needed)
3. Now in Cursor's chat, type `@Linear` and you can:
   - Pull issue details into context: *"Fix LED-42"* → Cursor reads the full issue
   - Auto-create branches named `mahesh/led-42-fix-pricing-bug`
   - Update issue status when you commit/push

This is the killer flow: **Linear issue → Cursor reads it → Cursor fixes it → PR opens → issue auto-moves to "In Review"**.

---

## Step 4 — Connect Linear to GitHub (auto status updates)

So Linear knows when issues ship.

1. In Linear: **Settings** → **Integrations** → **GitHub** → Connect
2. Pick your Ledge repo
3. Configure auto-transitions:
   - PR opened with "LED-42" in title/branch → issue moves to **In Progress**
   - PR merged → issue moves to **Done**

Now Linear is always accurate without you touching it.

---

## Step 5 — Connect Linear to Lovable (so I can read issues too)

Linear has an MCP server. Lovable can connect to it via the **mcp_knowledge** connector.

When you want me to work on a Linear ticket, I'll prompt you to authorize Linear MCP. Once connected, you can say *"Lovable, pick up LED-42"* and I'll read the issue, build the feature, push to GitHub. Linear status updates automatically via Step 4.

I'll trigger this connection on-demand the first time you ask me to read a Linear ticket — no setup needed now.

---

## Step 6 — The daily workflow

```text
                    ┌─────────────┐
                    │   Linear    │  ← single source of truth
                    │  (backlog)  │     you triage here every morning
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        Logic / bug /              Feature / UI /
        refactor / test            Cloud / design
              │                         │
              ▼                         ▼
       ┌──────────┐              ┌──────────┐
       │  Cursor  │              │ Lovable  │
       │ (local)  │              │ (cloud)  │
       └────┬─────┘              └────┬─────┘
            │                         │
            └────────────┬────────────┘
                         ▼
                   ┌──────────┐
                   │  GitHub  │  ← single source of code
                   └────┬─────┘
                        │ auto-sync
                        ▼
                   Linear updates status
```

**Rule of thumb (already established last turn):**
- **Cursor** → bug fix, logic in `src/lib/`, tests in `__tests__/`, multi-file refactors, anything with a stack trace
- **Lovable** → new pages, design system tweaks, Cloud schema/edge functions, "make it look better"
- **Both can run at the same time** — just don't edit the same file in both. Use Linear to coordinate which tool owns which ticket.

---

## Step 7 — Two small files I'll add to the repo (when you approve build)

These make Cursor respect Ledge's conventions instead of fighting them:

1. **`.cursorrules`** at repo root — tells Cursor: use `useApi()` from `src/services/api.ts`, never raw `supabase` calls in pages; use `NumberInput` not `type=number`; use semantic tokens not hex colors; pricing math always goes through `src/lib/order-pricing.ts`; tests live next to source in `__tests__/`.
2. **`.cursor/mcp.json`** — pre-registers Linear MCP so anyone cloning the repo gets the same Cursor setup.

---

## Acceptance check (you'll know it's working when…)

- You create issue **LED-99** in Linear → Cursor `@Linear LED-99` pulls it in → Cursor commits with `LED-99` in branch name → PR opens → Linear shows "In Review" → merge → Linear shows "Done" → Lovable preview rebuilds with the fix
- You ask Lovable to "build the WhatsApp settings page from LED-50" → I read the ticket via MCP → push commits → Linear auto-updates → you pull in Cursor and see the new files

---

## What I need from you to proceed

Switch to **Build mode** and confirm which of these you want me to do now:

- **(A)** Just add `.cursorrules` + `.cursor/mcp.json` to the repo (5 min, unlocks Cursor immediately)
- **(B)** Also trigger the Lovable→Linear MCP connection so I can read tickets (1 OAuth click from you)
- **(C)** Both

Steps 1–4 (GitHub connect, clone, Cursor↔Linear, Linear↔GitHub) are things only you can do in those external apps — I'll wait for your "done" before adding the repo files in Step 7.
