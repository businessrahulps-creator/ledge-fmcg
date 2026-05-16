import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Check, LogIn } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useInvite, type InvitePreview } from "@/hooks/useInvite";
import { supabase } from "@/integrations/supabase/client";
import { JOB_BY_ROLE } from "@/components/settings/team/jobs";
import { toast } from "sonner";

type ViewState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "expired"; preview: InvitePreview }
  | { kind: "already_accepted"; preview: InvitePreview }
  | { kind: "pending_signed_out"; preview: InvitePreview }
  | { kind: "auto_accepting"; preview: InvitePreview }
  | { kind: "accepted"; preview: InvitePreview }
  | { kind: "email_mismatch"; preview: InvitePreview; signedInEmail: string }
  | { kind: "wrong_workspace"; preview: InvitePreview; currentCompanyName: string }
  | { kind: "other_error"; preview: InvitePreview; message: string };

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, authReady, companyId, refreshProfile } = useAuth();
  const { previewInvite, acceptInvite } = useInvite();
  const [view, setView] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    if (!token) {
      setView({ kind: "not_found" });
      return;
    }
    if (!authReady) return;

    (async () => {
      const preview = await previewInvite(token);
      if (!alive) return;
      if (!preview) {
        setView({ kind: "not_found" });
        return;
      }
      if (preview.status === "expired") {
        setView({ kind: "expired", preview });
        return;
      }
      if (preview.status === "accepted") {
        setView({ kind: "already_accepted", preview });
        return;
      }

      // pending
      if (!user) {
        setView({ kind: "pending_signed_out", preview });
        return;
      }

      const signedInEmail = (user.email || "").toLowerCase();
      if (signedInEmail !== preview.email.toLowerCase()) {
        setView({ kind: "email_mismatch", preview, signedInEmail });
        return;
      }

      // email matches → attempt auto-accept
      setView({ kind: "auto_accepting", preview });
      const result = await acceptInvite(token);
      if (!alive) return;
      if (result.ok) {
        await refreshProfile();
        setView({ kind: "accepted", preview });
        setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
        return;
      }

      // Friendly error mapping (result is { ok: false; message: string })
      const rawMessage: string = (result as { ok: false; message: string }).message;
      const msg = rawMessage.toLowerCase();
      if (msg.includes("another workspace")) {
        let currentCompanyName = "another workspace";
        if (companyId) {
          const { data } = await supabase
            .from("companies")
            .select("name")
            .eq("id", companyId)
            .maybeSingle();
          if (data?.name) currentCompanyName = data.name;
        }
        setView({ kind: "wrong_workspace", preview, currentCompanyName });
        return;
      }
      if (msg.includes("different email")) {
        setView({ kind: "email_mismatch", preview, signedInEmail });
        return;
      }
      if (msg.includes("expired")) {
        setView({ kind: "expired", preview });
        return;
      }
      if (msg.includes("already been accepted")) {
        setView({ kind: "already_accepted", preview });
        return;
      }
      setView({ kind: "other_error", preview, message: rawMessage });
    })();

    return () => {
      alive = false;
    };
  }, [token, authReady, user, previewInvite, acceptInvite, companyId, navigate, refreshProfile]);

  return (
    <AuthShell progress={0.9} ribbonLabel="Team invite">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 200 }}
        className="mx-auto w-full max-w-md"
      >
        {renderView(view, token ?? "", navigate)}
      </motion.div>
    </AuthShell>
  );
}

function renderView(view: ViewState, token: string, navigate: ReturnType<typeof useNavigate>) {
  switch (view.kind) {
    case "loading":
      return <Centered icon={<Loader2 className="h-5 w-5 animate-spin" />} title="Opening your invite…" />;
    case "not_found":
      return (
        <Card
          tone="warning"
          title="This invite link doesn't work"
          body="The link is invalid or has been cancelled. Ask the person who invited you to send a fresh one."
          cta={<Link to="/auth"><Button variant="outline">Go to sign in</Button></Link>}
        />
      );
    case "expired":
      return (
        <Card
          tone="warning"
          title="This invite has expired"
          body={`Invites are valid for 72 hours. Ask the owner of ${view.preview.company_name} to send you a new one.`}
          cta={<Link to="/auth"><Button variant="outline">Go to sign in</Button></Link>}
        />
      );
    case "already_accepted":
      return (
        <Card
          tone="info"
          title="You're already part of this team"
          body={`Sign in to continue to ${view.preview.company_name}.`}
          cta={
            <Link to="/auth?mode=signin">
              <Button>
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign in
              </Button>
            </Link>
          }
        />
      );
    case "pending_signed_out":
      return <SignedOutInviteCard preview={view.preview} token={token} />;
    case "auto_accepting":
      return (
        <Centered
          icon={<Loader2 className="h-5 w-5 animate-spin" />}
          title={`Joining ${view.preview.company_name}…`}
        />
      );
    case "accepted":
      return (
        <Card
          tone="success"
          title={`Welcome to ${view.preview.company_name}`}
          body={`You're in as ${JOB_BY_ROLE[view.preview.role].label}. Taking you to your dashboard…`}
          icon={<Check className="h-5 w-5 text-success" strokeWidth={2.25} />}
        />
      );
    case "email_mismatch":
      return (
        <Card
          tone="warning"
          title="This invite is for a different email address"
          body={`You're signed in as ${view.signedInEmail}, but this invite was sent to ${view.preview.email}. Sign out and sign in with the invited email to join.`}
          cta={
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate(`/invite/${token}`, { replace: true });
              }}
            >
              Sign out and try again
            </Button>
          }
        />
      );
    case "wrong_workspace":
      return (
        <Card
          tone="warning"
          title="This invite is for a different workspace"
          body={`You're currently signed in to ${view.currentCompanyName}. Sign out first if you want to join ${view.preview.company_name}.`}
          cta={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate(`/invite/${token}`, { replace: true });
                }}
              >
                Sign out
              </Button>
              <Link to="/dashboard">
                <Button variant="ghost">Stay in {view.currentCompanyName}</Button>
              </Link>
            </div>
          }
        />
      );
    case "other_error":
      return (
        <Card
          tone="warning"
          title="Couldn't accept this invite"
          body={view.message}
          cta={<Link to="/auth"><Button variant="outline">Go to sign in</Button></Link>}
        />
      );
  }
}

function SignedOutInviteCard({ preview, token }: { preview: InvitePreview; token: string }) {
  const job = JOB_BY_ROLE[preview.role];
  const redirect = `/invite/${token}`;
  // Stash the redirect target so /auth knows to come back here after sign-in.
  useEffect(() => {
    try {
      sessionStorage.setItem("ledge:postAuthRedirect", redirect);
    } catch {
      // ignore
    }
  }, [redirect]);

  return (
    <div className="rounded-md border border-border/70 bg-card p-6 shadow-depth-4 md:p-8">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        You're invited
      </p>
      <h1 className="mt-2 font-display text-2xl leading-tight md:text-3xl">
        Join {preview.company_name} on Ledge
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{preview.inviter_name}</span> has invited you to
        join as <span className="font-medium text-foreground">{job.label}</span>.
      </p>

      <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        {job.longDescription}
      </div>

      <div className="mt-6 space-y-2">
        <Link to={`/auth?mode=signin&redirect=${encodeURIComponent(redirect)}`} className="block">
          <Button className="w-full">Sign in with Google to accept</Button>
        </Link>
        <Link
          to={`/auth?mode=signup&redirect=${encodeURIComponent(redirect)}&email=${encodeURIComponent(preview.email)}`}
          className="block"
        >
          <Button variant="outline" className="w-full">
            Continue with email
          </Button>
        </Link>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        This invite is for <span className="font-medium text-foreground">{preview.email}</span>. Use the
        same email when you sign in.
      </p>
    </div>
  );
}

/* ───────── building blocks ───────── */

function Centered({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border/70 bg-card p-8 text-center shadow-depth-2">
      <div className="text-muted-foreground">{icon}</div>
      <p className="text-sm text-foreground/80">{title}</p>
    </div>
  );
}

interface CardProps {
  tone: "success" | "warning" | "info";
  title: string;
  body: string;
  icon?: React.ReactNode;
  cta?: React.ReactNode;
}

function Card({ tone, title, body, icon, cta }: CardProps) {
  const toneRing =
    tone === "success"
      ? "border-success/30 bg-success/5"
      : tone === "warning"
        ? "border-warning/30 bg-warning/5"
        : "border-border/70 bg-card";
  const defaultIcon =
    tone === "warning" ? (
      <AlertCircle className="h-5 w-5 text-warning" strokeWidth={2} />
    ) : tone === "success" ? (
      <Check className="h-5 w-5 text-success" strokeWidth={2.25} />
    ) : null;
  return (
    <div className={`rounded-md border ${toneRing} p-6 shadow-depth-4 md:p-8`}>
      <div className="flex items-start gap-3">
        {(icon ?? defaultIcon) && (
          <div className="mt-0.5 shrink-0">{icon ?? defaultIcon}</div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl leading-tight md:text-2xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          {cta && <div className="mt-5">{cta}</div>}
        </div>
      </div>
    </div>
  );
}
