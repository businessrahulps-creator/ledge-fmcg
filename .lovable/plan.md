# SEO Setup — Final Pass

You're already in great shape. Most of the heavy lifting is done: `index.html` has title, meta description, canonical, full `og:*` / `twitter:*` set, theme-color, apple-touch, and a rich JSON-LD `@graph` (Organization + WebSite + SoftwareApplication + FAQPage). `robots.txt` exists. Lovable's SEO scanner currently reports **zero findings**.

Three concrete gaps remain — plus one in-product step on your side.

## What I'll do (code)

### 1. Generate a sitemap
No `public/sitemap.xml` exists today. Add a generator (the recommended pattern for this stack — keeps the sitemap in sync as routes change):

- Create `scripts/generate-sitemap.ts` listing the **6 public, indexable routes**:
  - `/` (priority 1.0)
  - `/about-us`
  - `/contact`
  - `/privacy-policy`
  - `/terms-of-service`
  - `/refund-policy`
- All app routes (`/dashboard`, `/orders`, `/stock`, etc.) are auth-gated → **deliberately excluded**.
- Wire `predev` + `prebuild` scripts in `package.json` so the file regenerates on every dev start and every publish.
- Base URL: `https://www.getledge.in` (matches your canonical).

### 2. Add `Sitemap:` directive to robots.txt
Append `Sitemap: https://www.getledge.in/sitemap.xml` so crawlers discover it without guessing the path.

### 3. Update the LinkedIn `sameAs`
The current `sameAs` in the Organization JSON-LD points at a personal LinkedIn (`asha-ps-6b0673207`). For brand SEO this should be the **company** LinkedIn page. If you don't have one yet, I'll remove the array entirely (better than pointing at a personal profile from the company schema). **Tell me which:** keep, swap for a company URL, or remove.

## What's NOT changing (and why)

- **Title / description / og tags** — already strong and keyword-tuned.
- **JSON-LD** — already structured for both Google rich results and AI search (ChatGPT, Perplexity, Gemini).
- **og:image** — already set; leaving it as-is.
- **`react-helmet-async`** — not needed. Per-route SEO only matters if you publish blog posts or product pages. Static landing + 5 policy pages don't need it. Skip until you launch content marketing.
- **Manifest, favicon, apple-touch** — all wired correctly with cache-bust query strings.

## What you do in Lovable (UI steps — 2 minutes)

After I ship the sitemap:

1. **Open the SEO & AI search view.**
   - **Desktop**: click the SEO icon in the navigation bar above the preview (or `Cmd+K` → "SEO").
   - **Mobile**: tap the **…** in the bottom-right (Chat mode) → **SEO & AI search**.
2. **Click "Run scan"** to get a fresh report.
3. **Connect Google Search Console** when prompted — Lovable will auto-verify your domain via meta tag (no DNS edits needed) and submit `sitemap.xml` to Google for you. This is the single biggest unlock for actually getting indexed.
4. Optionally: **Bing Webmaster Tools** — same idea, takes 1 minute, helps with Bing + ChatGPT search.

## After it's live

Publish once, then in the SEO view you'll see real impression/click data within ~2–4 days. From there I can:
- Run Semrush keyword research grounded in your actual landing copy
- Spot any pages that need rewriting for specific FMCG-distribution keywords
- Build a competitor gap analysis vs other FMCG-DMS tools

**Approve and I'll ship the three code changes. Tell me your LinkedIn preference (company URL / remove / keep) in the same reply.**
