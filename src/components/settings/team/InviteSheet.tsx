import { RoleAvatar } from "@/components/layout/RoleAvatar";
import { useMemo, useState } from "react";
import { Mail, Check, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { JOBS, type AppRole } from "./jobs";
import { useInvite } from "@/hooks/useInvite";
import { InviteShareSheet } from "./InviteShareSheet";
import type { DefaultsMap } from "./useTeamRoster";
import { defaultsForRole, type CapState } from "./useOverrideEditor";
import { AccessAreaList, diffFromDefaults } from "./AccessAreaList";
import { TOGGLEABLE_CAPS, buildAccessSummary, type CapabilityKey } from "./accessCopy";
import { JOB_BY_ROLE } from "./jobs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  onInviteSent: () => void;
  defaults: DefaultsMap;
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email")
  .max(255);

// Owner cannot be invited — promotion is an in-roster action.
const INVITABLE_JOBS = JOBS.filter((j) => j.role !== "super_admin");

export function InviteSheet({ open, onOpenChange, companyName, onInviteSent, defaults }: Props) {
  const isMobile = useIsMobile();
  const { sendInvite } = useInvite();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("salesperson");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const roleDefaults = useMemo(() => defaultsForRole(defaults, role), [defaults, role]);
  const [areas, setAreas] = useState<CapState | null>(null);
  const current = areas ?? roleDefaults;
  const summary = useMemo(() => {
    const s = new Set<CapabilityKey>();
    for (const { key } of TOGGLEABLE_CAPS) if (current[key]) s.add(key);
    const who = (email.split("@")[0] || "They").replace(/[._-]+/g, " ");
    return buildAccessSummary(who.charAt(0).toUpperCase() + who.slice(1), role, s);
  }, [current, email, role]);

  const reset = () => {
    setEmail("");
    setRole("salesperson");
    setEmailError(null);
    setShareToken(null);
    setSubmitting(false);
    setStep(1);
    setAreas(null);
  };

  const handleClose = (next: boolean) => {
    if (!next && submitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const goNext = () => {
    setEmailError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) { setStep(1); return; }
    if (submitting || defaults.size === 0) return;
    setSubmitting(true);
    const token = await sendInvite(parsed.data, role, diffFromDefaults(current, roleDefaults));
    setSubmitting(false);
    if (token) {
      setShareToken(token);
      onInviteSent();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile ? "h-[92vh] rounded-t-xl" : "w-full sm:max-w-md",
        )}
      >
        <SheetHeader className="border-b border-border/60 p-5 text-left">
          <SheetTitle className="text-lg">
            {shareToken ? "Share the invite" : step === 2 ? "What can they do?" : "Invite someone to Ledge"}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {shareToken
              ? "Send them the link — it works for 72 hours."
              : step === 2
                ? `Step 2 of 2 · ${JOB_BY_ROLE[role].label}. Areas that come with the job are already on.`
                : "Step 1 of 2 · Their email and job."}
          </SheetDescription>
        </SheetHeader>

        {shareToken ? (
          <InviteShareSheet
            token={shareToken}
            email={email}
            role={role}
            companyName={companyName}
            onDone={() => handleClose(false)}
          />
        ) : (
          <>
            {step === 2 ? (
              <div className="flex-1 overflow-y-auto p-5">
                <AccessAreaList
                  current={current}
                  roleDefaults={roleDefaults}
                  jobLabel={JOB_BY_ROLE[role].label}
                  onChange={(k, v) => { if (!submitting) setAreas({ ...current, [k]: v }); }}
                />
                <p className="mt-4 text-[11px] text-muted-foreground">
                  Team, plan and billing always stay with the owner. You can change this any time from the team list.
                </p>
              </div>
            ) : (
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="space-y-2">
                <Label htmlFor="invite-email" className="text-xs">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="priya@yourcompany.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className={cn("pl-9", emailError && "border-destructive")}
                    autoComplete="off"
                  />
                </div>
                {emailError && (
                  <p className="text-[11px] text-destructive">{emailError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">What will they do?</Label>
                <div className="space-y-2">
                  {INVITABLE_JOBS.map((j) => {
                    const selected = j.role === role;
                    return (
                      <button
                        key={j.role}
                        type="button"
                        onClick={() => { setRole(j.role); setAreas(null); }}
                        className={cn(
                          "w-full rounded-md border p-3 text-left transition-[border-color,background-color] duration-fast ease-fluent",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border/70 hover:border-foreground/30",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <RoleAvatar role={j.role} name={j.label} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{j.label}</p>
                              {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">{j.oneLiner}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            )}

            <div className="space-y-2 border-t border-border/60 bg-muted/30 p-4">
              {step === 2 && (
                <div className="rounded-md bg-card p-3 border border-border/60">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">In plain words</p>
                  <p className="mt-1 text-sm leading-snug" aria-live="polite">{summary}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => (step === 2 ? setStep(1) : handleClose(false))}
                  disabled={submitting}
                >
                  {step === 2 ? <><ArrowLeft className="h-4 w-4" /> Back</> : "Cancel"}
                </Button>
                {step === 1 ? (
                  <Button className="flex-1" onClick={goNext} disabled={!email}>Next: choose access</Button>
                ) : (
                <Button className="flex-1" onClick={handleSubmit} disabled={submitting || !email}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send invite"
                  )}
                </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
