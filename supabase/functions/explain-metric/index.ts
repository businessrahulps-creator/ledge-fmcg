// Inline "explain this number" — Gemini explains a KPI in plain English.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExplainInput {
  /** Short metric name. e.g. "Outstanding". */
  metric: string;
  /** Formatted value. e.g. "₹2.4L". */
  value: string;
  /** Free-form context lines the UI already knows. */
  context?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { metric, value, context = [] } = (await req.json()) as ExplainInput;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      const text = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI request failed", detail: text }), {
        status: aiRes.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await aiRes.json();
    const explanation: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
