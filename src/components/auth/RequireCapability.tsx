import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useCan, type CapabilityKey } from "@/hooks/useCan";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { SplashScreen } from "@/components/SplashScreen";

interface RequireCapabilityProps {
  capability: CapabilityKey;
  message: string;
  children: React.ReactNode;
}

/**
 * Route-level capability gate. Shows a plain-English "ask your Owner"
 * card instead of a generic forbidden screen.
 *
 * We gate by capability, not role, so per-user overrides keep working.
 */
export function RequireCapability({ capability, message, children }: RequireCapabilityProps) {
  const navigate = useNavigate();
  const { profileLoaded } = useAuth();
  const allowed = useCan(capability);

  // Wait for profile + role + capability fetch to settle so we don't flash
  // the denial card to users who actually have access.
  if (!profileLoaded) return <SplashScreen />;

  if (allowed) return <>{children}</>;

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <h1 className="mt-5 text-lg font-semibold tracking-tight">
          You don't have access to this
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
