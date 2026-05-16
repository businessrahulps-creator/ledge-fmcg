// Inline "explain this number" — Gemini explains a KPI in plain English.
// Authenticated users only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExplainInput {
  metric: string;
  value: string;
  context?: string[];
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonRes({ error: "Unauthorized" }, 401);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return jsonRes({ error: "Unauthorized" }, 401);

    const { metric, value, context = [] } = (await req.json()) as ExplainInput;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonRes({ error: "AI not configured" }, 500);

    const prompt = `You're a calm advisor for an Indian FMCG distributor.
Explain the metric below in 1-2 short sentences of plain English.
Be specific. Reference the supporting context if it's informative. No markdown, no lists, no emojis.

Metric: ${metric}
Value: ${value}
Supporting context:
${context.map((c) => `- ${c}`).join("\n") || "- (none provided)"}`;

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
      const code = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      const msg = code === 429 ? "Rate limited" : code === 402 ? "AI credits exhausted" : "AI request failed";
      console.error("explain-metric AI error", aiRes.status, await aiRes.text().catch(() => ""));
      return jsonRes({ error: msg }, code);
    }

    const data = await aiRes.json();
    const explanation: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return jsonRes({ explanation });
  } catch (err) {
    console.error("explain-metric error", err);
    return jsonRes({ error: "Internal error" }, 500);
  }
});
