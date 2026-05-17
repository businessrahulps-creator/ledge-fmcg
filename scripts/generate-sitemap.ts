// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://www.getledge.in";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const today = new Date().toISOString().split("T")[0];

// Only public, indexable routes. App routes are auth-gated and excluded.
const entries: SitemapEntry[] = [
  { path: "/", lastmod: today, changefreq: "weekly", priority: "1.0" },
  { path: "/about-us", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/contact", lastmod: today, changefreq: "monthly", priority: "0.7" },
  { path: "/privacy-policy", lastmod: today, changefreq: "yearly", priority: "0.3" },
  { path: "/terms-of-service", lastmod: today, changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", lastmod: today, changefreq: "yearly", priority: "0.3" },
];

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
