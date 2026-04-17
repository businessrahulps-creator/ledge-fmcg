import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Hard guard that prevents users from using the app without a company.
 * If authReady && user && !companyId, force them through workspace setup.
 */
export function NoCompanyGuard({ children }: { children: ReactNode }) {
  const { user, companyId, authReady, refreshProfile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill from auth metadata when the modal becomes relevant
  useEffect(() => {
    if (user && !companyId) {
      const meta = (user.user_metadata || {}) as Record<string, string>;
      setCompanyName((prev) => prev || meta.company_name || "");
      setFullName((prev) => prev || meta.full_name || "");
    }
  }, [user, companyId]);

  // Don't render the guard until auth is settled or while user is signed-out
  if (!authReady || !user || companyId) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !fullName.trim()) {
      toast.error("Please fill in both fields");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("setup_new_company", {
        p_company_name: companyName.trim(),
        p_full_name: fullName.trim(),
      });
      if (error) throw error;
      await refreshProfile();
      toast.success("Workspace ready!", { description: "You're all set." });
      // Reload so DataContext picks up the new companyId cleanly
      setTimeout(() => window.location.reload(), 400);
    } catch (err: any) {
      toast.error("Setup failed", { description: err.message });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Finish setting up your workspace</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We just need a couple of details to get your workspace ready.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guard-company">Company name</Label>
            <Input
              id="guard-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme FMCG Pvt. Ltd."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guard-name">Your name</Label>
            <Input
              id="guard-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Rajesh Kumar"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create workspace
          </Button>
        </form>
      </div>
    </div>
  );
}
