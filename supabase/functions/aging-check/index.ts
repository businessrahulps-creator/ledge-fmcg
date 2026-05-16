// aging-check — cron-triggered. Validates a shared secret stored in Supabase Vault
// against the x-cron-secret header sent by the pg_cron job.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Cache the vault secret for the lifetime of the warm instance.
let cachedSecret: string | null = null;
async function getCronSecret(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  if (cachedSecret) return cachedSecret;
  const { data, error } = await supabase
    .schema("vault")
    .from("decrypted_secrets")
    .select("decrypted_secret")
    .eq("name", "cron_secret")
    .maybeSingle();
  if (error || !data?.decrypted_secret) return null;
  cachedSecret = data.decrypted_secret as string;
  return cachedSecret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const expected = await getCronSecret(supabase);
    if (!expected) {
      console.error("aging-check: cron_secret missing from vault");
      return jsonRes({ error: "Server not configured" }, 500);
    }

    const provided = req.headers.get("x-cron-secret");
    if (provided !== expected) {
      return jsonRes({ error: "Forbidden" }, 403);
    }

    const { data, error } = await supabase.rpc("check_aging_transitions");
    if (error) throw error;
    return jsonRes(data ?? { ok: true });
  } catch (e) {
    console.error("aging-check error", e);
    return jsonRes({ error: "Internal error" }, 500);
  }
});
