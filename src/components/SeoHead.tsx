import { Helmet } from "react-helmet-async";

const SITE = "https://getledge.in";

interface SeoHeadProps {
  title: string;
  description: string;
  path: string; // e.g. "/about-us"
  ogType?: "website" | "article";
}

/**
 * Per-route SEO head. Overrides title/description/canonical/og:* from index.html
 * for JS-executing crawlers (Googlebot). Static og:* in index.html remain as the
 * social-preview fallback for crawlers that don't execute JS.
 */
export function SeoHead({ title, description, path, ogType = "website" }: SeoHeadProps) {
  const url = `${SITE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
