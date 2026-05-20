// Dashboard "Today" digest — 2-3 sentence English summary of business state.
// Uses Lovable AI Gateway (Gemini). Authenticated users only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/getledge\.in$/,
  /^https:\/\/www\.getledge\.in$/,
  /^https:\/\/ledge-fmcg\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function resolveCors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin)) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

interface DigestInput {
  context: {
    todayOrders: number;
    todayRevenue: number;
    monthOrders: number;
    monthRevenue: number;
    outstanding: number;
    overdueDealers: number;
    lowStockSkus: number;
    topDealer?: string;
    currency?: string;
  };
}

function jsonRes(body: unknown, corsHeaders: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = resolveCors(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require authenticated user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonRes({ error: "Unauthorized" }, corsHeaders, 401);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return jsonRes({ error: "Unauthorized" }, 401);

    const { context } = (await req.json()) as DigestInput;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonRes({ error: "AI not configured" }, 500);

    const currency = context.currency ?? "₹";
    const fmt = (n: number) => {
      if (n >= 10_000_000) return `${currency}${(n / 10_000_000).toFixed(1)}Cr`;
      if (n >= 100_000) return `${currency}${(n / 100_000).toFixed(1)}L`;
      if (n >= 1000) return `${currency}${(n / 1000).toFixed(1)}K`;
      return `${currency}${n}`;
    };

    const prompt = `You are a calm, plain-spoken business advisor for an Indian FMCG distributor.
Write a 2-sentence "Today" briefing in conversational English. No lists, no markdown, no emojis.
Be specific with numbers. Use Indian currency conventions (Cr, L, K). Tone: confident, factual, founder-to-founder.

Snapshot:
- Today: ${context.todayOrders} orders, ${fmt(context.todayRevenue)} revenue
- This month: ${context.monthOrders} orders, ${fmt(context.monthRevenue)} revenue
- Outstanding: ${fmt(context.outstanding)} across receivables
- Overdue dealers: ${context.overdueDealers}
- Low/critical stock SKUs: ${context.lowStockSkus}
${context.topDealer ? `- Top dealer this month: ${context.topDealer}` : ""}

Lead with the most important signal (revenue trend, overdue risk, or stock risk). End with one concrete suggestion only if it's clearly warranted.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      // Pass through 429/402 status so the UI can show the right message; don't leak detail.
      const code = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      const msg = code === 429 ? "Rate limited" : code === 402 ? "AI credits exhausted" : "AI request failed";
      console.error("dashboard-digest AI error", aiRes.status, await aiRes.text().catch(() => ""));
      return jsonRes({ error: msg }, code);
    }

    const data = await aiRes.json();
    const summary: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return jsonRes({ summary });
  } catch (err) {
    console.error("dashboard-digest error", err);
    return jsonRes({ error: "Internal error" }, 500);
  }
});
