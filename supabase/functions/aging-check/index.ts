// aging-check — cron-only. Triggers nightly via pg_cron.
// Gated by service-role JWT (sent by the cron job's Authorization header).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Only allow service-role callers (pg_cron sends the service role key).
  const authHeader = req.headers.get("Authorization") ?? "";
  const expected = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`;
  if (!expected || authHeader !== expected) {
    return jsonRes({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase.rpc("check_aging_transitions");
    if (error) throw error;
    return jsonRes(data ?? { ok: true });
  } catch (e) {
    console.error("aging-check error", e);
    return jsonRes({ error: "Internal error" }, 500);
  }
});
