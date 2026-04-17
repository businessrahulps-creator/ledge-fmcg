import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TEST_PASSWORD = Deno.env.get("TEST_ACCOUNT_PASSWORD") ?? "";

const TEST_ACCOUNTS = [
  { email: "test1@getledge.in", fullName: "Arun Menon", companyName: "TestCo Kerala" },
  { email: "test2@getledge.in", fullName: "Priya Rao", companyName: "TestCo Bangalore" },
  { email: "test3@getledge.in", fullName: "Vikram Singh", companyName: "TestCo Mumbai" },
  { email: "test4@getledge.in", fullName: "Neha Sharma", companyName: "TestCo Delhi" },
  { email: "test5@getledge.in", fullName: "Karthik Rajan", companyName: "TestCo Chennai" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Refuse to run unless the password secret is configured.
  if (!TEST_PASSWORD) {
    return new Response(
      JSON.stringify({ error: "Server is missing TEST_ACCOUNT_PASSWORD secret" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  // Auth guard: caller must be a logged-in super_admin.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }
  const authClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(
    authHeader.replace("Bearer ", "")
  );
  if (claimsErr || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }
  const callerId = claimsData.claims.sub;
  const adminCheck = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: roleRow } = await adminCheck
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: "Forbidden: super_admin required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }

  try {
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const account of TEST_ACCOUNTS) {
      try {
        // 1. Create auth user (auto-confirm email)
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: account.email,
          password: TEST_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: account.fullName, company_name: account.companyName },
        });

        if (authError) {
          // User might already exist
          if (authError.message?.includes("already been registered")) {
            results.push({ email: account.email, status: "skipped", error: "Already exists" });
            continue;
          }
          throw authError;
        }

        const userId = authData.user.id;

        // 2. Call setup_new_company as the user (impersonate via service role)
        // Since setup_new_company uses auth.uid(), we need to call it with the user's JWT
        // Instead, we'll do the setup manually with admin privileges

        // Create company
        const { data: company, error: compErr } = await adminClient
          .from("companies")
          .insert({ name: account.companyName })
          .select("id")
          .single();

        if (compErr) throw compErr;

        // Link profile to company
        const { error: profErr } = await adminClient
          .from("profiles")
          .update({ company_id: company.id, full_name: account.fullName })
          .eq("user_id", userId);

        if (profErr) throw profErr;

        // Assign super_admin role
        const { error: roleErr } = await adminClient
          .from("user_roles")
          .insert({ user_id: userId, role: "super_admin" })
          .select()
          .single();

        if (roleErr && !roleErr.message?.includes("duplicate")) throw roleErr;

        // Seed company data
        const { error: seedErr } = await adminClient.rpc("seed_company_data", {
          p_company_id: company.id,
        });

        if (seedErr) throw seedErr;

        results.push({ email: account.email, status: "created" });
      } catch (err: any) {
        results.push({ email: account.email, status: "error", error: err.message });
      }
    }

    return new Response(JSON.stringify({ results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
