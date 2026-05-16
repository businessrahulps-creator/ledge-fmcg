// Dashboard "Today" digest — 2-3 sentence English summary of business state.
// Uses Lovable AI Gateway (Gemini). No API key needed.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context } = (await req.json()) as DigestInput;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      const text = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI request failed", detail: text }), {
        status: aiRes.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const summary: string = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
