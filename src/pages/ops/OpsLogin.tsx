import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useIsPlatformStaff } from "@/hooks/useIsPlatformStaff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Staff usernames map to a real account in the normal login system. */
const STAFF_EMAIL_DOMAIN = "ops.getledge.in";

function toStaffEmail(username: string) {
  const normalised = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return normalised ? `${normalised}@${STAFF_EMAIL_DOMAIN}` : "";
}

/**
 * Internal sign-in for the Ledge team. Deliberately plain: no marketing,
 * no sign-up, no social buttons, no password reset — this is not a
 * customer surface and should never look like one.
 */
export default function OpsLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authReady } = useAuth();
  const { isStaff, ready } = useIsPlatformStaff();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/ops";

  // Already signed in as staff — don't make them type it again.
  useEffect(() => {
    if (authReady && user && ready && isStaff) navigate(from, { replace: true });
  }, [authReady, user, ready, isStaff, from, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const email = toStaffEmail(username);
    if (!email || !password) {
      setError("Enter your username and password.");
      return;
    }

    setBusy(true);
    setError(null);
    // Any failure reads the same, so the form never reveals which
    // usernames exist.
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !data.session) {
      setBusy(false);
      setError("That username or password is not right.");
      return;
    }

    const { data: staff } = await supabase.rpc("is_platform_staff", { _user_id: data.session.user.id });
    if (!staff) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("That username or password is not right.");
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-primary p-5">
      <div className="w-full max-w-sm rounded-md bg-card p-6 shadow-depth-16">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={2} />
          <div>
            <p className="text-sm font-semibold tracking-tight">Ledge Ops</p>
            <p className="text-xs text-muted-foreground">Internal use only</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="ops-username">Username</Label>
            <Input
              id="ops-username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ops-password">Password</Label>
            <Input
              id="ops-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
