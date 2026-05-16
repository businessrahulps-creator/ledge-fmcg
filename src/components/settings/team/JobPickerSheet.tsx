import { useMemo } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { JOBS, JOB_BY_ROLE, capLabels, type AppRole } from "./jobs";
import { rolesDefaultCaps, type DefaultsMap } from "./useTeamRoster";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  currentRole: AppRole;
  defaults: DefaultsMap;
  saving?: boolean;
  onConfirm: (newRole: AppRole) => void;
  selectedRole: AppRole;
  setSelectedRole: (r: AppRole) => void;
  /** Hide jobs that the current actor shouldn't be able to assign (none in PR-D). */
  excludeRoles?: AppRole[];
  /** Override title — used by Invite sheet. */
  title?: string;
  /** Override description copy. */
  description?: string;
  confirmLabel?: (job: { role: AppRole; label: string }) => string;
  /** Disable the change/confirm (e.g. last-owner safeguard). */
  disabledMessage?: string;
}

export function JobPickerSheet({
  open,
  onOpenChange,
  memberName,
  currentRole,
  defaults,
  saving = false,
  onConfirm,
  selectedRole,
  setSelectedRole,
  excludeRoles = [],
  title,
  description,
  confirmLabel,
  disabledMessage,
}: Props) {
  const isMobile = useIsMobile();
  const jobs = JOBS.filter((j) => !excludeRoles.includes(j.role));

  const diff = useMemo(() => {
    const before = rolesDefaultCaps(defaults, currentRole);
    const after = rolesDefaultCaps(defaults, selectedRole);
    const gained: string[] = [];
    const lost: string[] = [];
    after.forEach((c) => {
      if (!before.has(c)) gained.push(c);
    });
    before.forEach((c) => {
      if (!after.has(c)) lost.push(c);
    });
    return { gained, lost };
  }, [defaults, currentRole, selectedRole]);

  const noChange = selectedRole === currentRole;
  const sameAccess = !noChange && diff.gained.length === 0 && diff.lost.length === 0;
  const promotingToOwner = selectedRole === "super_admin" && currentRole !== "super_admin";

  const previewLine = (() => {
    if (noChange) return "No change — same job as today.";
    if (sameAccess) return "Same access, different title.";
    const first = memberName || "They";
    const parts: string[] = [];
    if (diff.gained.length) parts.push(`will gain access to ${capLabels(diff.gained)}`);
    if (diff.lost.length) parts.push(`will lose access to ${capLabels(diff.lost)}`);
    return `${first} ${parts.join(" and ")}.`;
  })();

  const selectedJob = JOB_BY_ROLE[selectedRole];
  const confirmText = confirmLabel
    ? confirmLabel(selectedJob)
    : `Make ${memberName || "them"} ${article(selectedJob.label)} ${selectedJob.label}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile ? "h-[88vh] rounded-t-xl" : "w-full sm:max-w-md",
        )}
      >
        <SheetHeader className="border-b border-border/60 p-5 text-left">
          <SheetTitle className="text-lg">{title ?? `Change ${memberName}'s job`}</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {description ?? "Pick what they should be able to do in Ledge."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {jobs.map((j) => {
            const Icon = j.icon;
            const selected = j.role === selectedRole;
            return (
              <button
                key={j.role}
                type="button"
                onClick={() => setSelectedRole(j.role)}
                className={cn(
                  "w-full rounded-md border p-3 text-left transition-[border-color,background-color,box-shadow] duration-fast ease-fluent",
                  selected
                    ? "border-primary bg-primary/5 shadow-depth-2"
                    : "border-border/70 hover:border-foreground/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{j.label}</p>
                      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{j.oneLiner}</p>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground/80">
                      {j.longDescription}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 border-t border-border/60 bg-muted/30 p-4">
          {promotingToOwner && (
            <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
              <span>
                They'll be able to manage billing and remove team members, including you.
              </span>
            </div>
          )}
          <p className="text-xs text-foreground/80">{previewLine}</p>
          {disabledMessage && (
            <p className="text-[11px] text-muted-foreground">{disabledMessage}</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => onConfirm(selectedRole)}
              disabled={saving || !!disabledMessage}
            >
              {saving ? "Saving…" : confirmText}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function article(label: string): string {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}
