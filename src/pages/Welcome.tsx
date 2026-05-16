import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { ActTransition } from "@/components/auth/ActTransition";
import { useFocusFirstField } from "@/components/auth/useFocusFirstField";
import ledgeMark from "@/assets/ledge-mark.webp";

const ROLES = [
  { id: "founder", label: "Founder / Owner" },
  { id: "sales_lead", label: "Sales Lead" },
  { id: "ops", label: "Operations" },
  { id: "accountant", label: "Accountant" },
  { id: "other", label: "Other" },
] as const;

const TEAM_SIZES = [
  { id: "solo", label: "Just me" },
  { id: "2-5", label: "2–5" },
  { id: "6-20", label: "6–20" },
  { id: "20+", label: "20+" },
] as const;

const companyStepSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(120),
});

const profileStepSchema = z.object({
  role: z.string().min(1, "Pick a role"),
  teamSize: z.string().min(1, "Pick a team size"),
});

type Step = 0 | 1 | 2;

export default function Welcome() {
  const navigate = useNavigate();
  const { user, companyId, profile, refreshProfile, authReady, profileLoaded } = useAuth();
  const reduce = useReducedMotion();

  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusFirstField(true, panelRef, [step]);

  // Step 1 — company name
  const companyForm = useForm<z.infer<typeof companyStepSchema>>({
    resolver: zodResolver(companyStepSchema),
    mode: "onChange",
    defaultValues: { companyName: "" },
  });

  // Step 2 — role + team size
  const profileForm = useForm<z.infer<typeof profileStepSchema>>({
    resolver: zodResolver(profileStepSchema),
    mode: "onChange",
    defaultValues: { role: "", teamSize: "" },
  });

  // Prefill name from auth metadata for the cover preview
  const fullName = (profile?.full_name?.trim() || (user?.user_metadata as any)?.full_name?.trim() || "").toString();
  const companyNamePreview = companyForm.watch("companyName") || "Your Company";

  // Guards: must be logged in; if company already exists, skip ahead
  useEffect(() => {
    if (!authReady || !profileLoaded) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    if (companyId && step === 0) {
      // Company already created — jump to profile step
      setStep(1);
    }
  }, [user, companyId, authReady, profileLoaded, navigate, step]);

  // ── Step 0: create company ────────────────────────────────────────────────
  const onCompanySubmit = async ({ companyName }: z.infer<typeof companyStepSchema>) => {
    setSubmitting(true);
    try {
      const nameForRpc = fullName || "Founder";
      const { error } = await supabase.rpc("setup_new_company", {
        p_company_name: companyName,
        p_full_name: nameForRpc,
      });
      if (error) {
        handleSupabaseError(error, { source: "rpc:setup_new_company", title: "Couldn't create your workspace" });
        setSubmitting(false);
        return;
      }
      await refreshProfile();
      setStep(1);
    } catch (err: any) {
      handleSupabaseError(err, { source: "rpc:setup_new_company", title: "Couldn't create your workspace" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 1: role + team size ─────────────────────────────────────────────
  const onProfileSubmit = async ({ role, teamSize }: z.infer<typeof profileStepSchema>) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role_self_selected: role, team_size: teamSize })
        .eq("user_id", user!.id);
      if (error) {
        handleSupabaseError(error, { source: "profiles.update", title: "Couldn't save your details" });
        setSubmitting(false);
        return;
      }
      await refreshProfile();
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2: logo upload (optional) ───────────────────────────────────────
  const onLogoSelected = async (file: File) => {
    if (!companyId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo too large", { description: "Max 2 MB." });
      return;
    }
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${companyId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
      if (upErr) {
        handleSupabaseError(upErr, { source: "storage.upload:company-logos", title: "Couldn't upload logo" });
        return;
      }
      const { data: pub } = supabase.storage.from("company-logos").getPublicUrl(path);
      const { error: updErr } = await supabase.from("companies").update({ logo_url: pub.publicUrl }).eq("id", companyId);
      if (updErr) {
        handleSupabaseError(updErr, { source: "companies.update:logo_url", title: "Couldn't save logo" });
        return;
      }
      toast.success("Logo saved");
      finish();
    } finally {
      setLogoUploading(false);
    }
  };

  const skipLogo = () => finish();
  const finish = () => {
    toast.success("Welcome aboard", { description: "Your ledger is ready." });
    navigate("/dashboard", { replace: true });
  };

  const progress = step === 0 ? 0.35 : step === 1 ? 0.65 : 0.9;
  const ribbonLabel = `Step ${step + 1} of 3`;

  return (
    <AuthShell progress={progress} ribbonLabel={ribbonLabel}>
      <div ref={panelRef} className="space-y-6">
        <ActTransition actKey={`step-${step}`} className="space-y-6">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">First page</p>
                <h1 className="font-heading text-[34px] sm:text-[40px] leading-[1.05] tracking-tight text-foreground">
                  What's the <span className="italic text-accent">name</span> on the cover?
                </h1>
                <p className="text-[14px] text-muted-foreground">
                  Your company's name will appear on every invoice and dispatch slip.
                </p>
              </div>

              {/* Live ledger cover preview */}
              <div className="relative rounded-md border border-border bg-card p-6 shadow-depth-4 overflow-hidden">
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 h-32 w-32 opacity-[0.06]"
                  style={{
                    background: "repeating-linear-gradient(135deg, hsl(var(--foreground)) 0 6px, transparent 6px 12px)",
                  }}
                />
                <div className="relative flex items-center gap-4">
                  <img src={ledgeMark} alt="" className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ledger of</p>
                    <p className="font-heading text-xl truncate text-foreground">{companyNamePreview}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company name</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme FMCG Pvt. Ltd."
                    className="h-12 rounded-md"
                    aria-invalid={!!companyForm.formState.errors.companyName}
                    {...companyForm.register("companyName")}
                  />
                  {companyForm.formState.errors.companyName && (
                    <p className="text-xs text-destructive">{companyForm.formState.errors.companyName.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || !companyForm.formState.isValid}
                  className="w-full h-12 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-depth-4 gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continue
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">A little context</p>
                <h1 className="font-heading text-[34px] sm:text-[40px] leading-[1.05] tracking-tight text-foreground">
                  So we can <span className="italic text-accent">tailor</span> things.
                </h1>
                <p className="text-[14px] text-muted-foreground">
                  Two quick taps — we'll set smarter defaults from day one.
                </p>
              </div>

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5" noValidate>
                <fieldset className="space-y-2">
                  <legend className="text-[12px] font-medium text-foreground mb-2">Your role</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ROLES.map((r) => {
                      const selected = profileForm.watch("role") === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => profileForm.setValue("role", r.id, { shouldValidate: true })}
                          className={[
                            "h-11 px-3 rounded-md border text-[13px] font-medium transition-all duration-normal ease-fluent",
                            selected
                              ? "border-foreground bg-foreground text-background shadow-depth-4"
                              : "border-border bg-card text-foreground hover:border-foreground/40",
                          ].join(" ")}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="text-[12px] font-medium text-foreground mb-2">Team size</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {TEAM_SIZES.map((t) => {
                      const selected = profileForm.watch("teamSize") === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => profileForm.setValue("teamSize", t.id, { shouldValidate: true })}
                          className={[
                            "h-11 rounded-md border text-[13px] font-medium transition-all duration-normal ease-fluent",
                            selected
                              ? "border-foreground bg-foreground text-background shadow-depth-4"
                              : "border-border bg-card text-foreground hover:border-foreground/40",
                          ].join(" ")}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || !profileForm.formState.isValid}
                  className="w-full h-12 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-depth-4 gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continue
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Last page</p>
                <h1 className="font-heading text-[34px] sm:text-[40px] leading-[1.05] tracking-tight text-foreground">
                  Make it <span className="italic text-accent">yours</span>.
                </h1>
                <p className="text-[14px] text-muted-foreground">
                  Drop your logo. It'll appear on every invoice. You can skip and add it later.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={logoUploading}
                  className="group w-full rounded-md border-2 border-dashed border-border bg-card/50 hover:bg-card hover:border-foreground/40 transition-all duration-normal ease-fluent px-6 py-10 flex flex-col items-center justify-center gap-3"
                >
                  {logoUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" strokeWidth={1.75} />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-[14px] font-medium text-foreground">
                      {logoUploading ? "Uploading…" : "Upload your logo"}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-1">PNG or JPG · up to 2 MB</p>
                  </div>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onLogoSelected(f);
                  }}
                />

                <button
                  type="button"
                  onClick={skipLogo}
                  disabled={logoUploading}
                  className="block w-full text-center text-[13px] text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Skip for now — I'll add it later
                </button>
              </div>
            </>
          )}
        </ActTransition>
      </div>
    </AuthShell>
  );
}
