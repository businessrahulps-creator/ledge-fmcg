import { useMemo } from "react";
import { Sparkles } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { JOB_BY_ROLE } from "./jobs";
import type { RosterMember, DefaultsMap } from "./useTeamRoster";
import {
  TOGGLEABLE_CAPS,
  OWNER_ONLY_CAPS,
  buildAccessSummary,
  type CapabilityKey,
} from "./accessCopy";
import { CapabilityToggleRow } from "./CapabilityToggleRow";
import { useOverrideEditor } from "./useOverrideEditor";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: RosterMember;
  defaults: DefaultsMap;
  onSaved?: () => void;
}

export function OverrideDrawer({ open, onOpenChange, member, defaults, onSaved }: Props) {
  const isMobile = useIsMobile();
  const job = JOB_BY_ROLE[member.role];
  const { loading, saving, current, roleDefaults, setCap, dirty, save } = useOverrideEditor({
    member,
    defaults,
    onSaved: () => {
      onSaved?.();
      onOpenChange(false);
    },
  });

  const activeSet = useMemo(() => {
    const s = new Set<CapabilityKey>();
    for (const { key } of TOGGLEABLE_CAPS) if (current[key]) s.add(key);
    return s;
  }, [current]);

  const summary = useMemo(
    () => buildAccessSummary(member.name || "They", member.role, activeSet),
    [member.name, member.role, activeSet],
  );

  const initials = (member.name || member.email || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base leading-tight">
                Fine-tune {member.name || "this member"}'s access
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs text-muted-foreground">
                Currently {job.label}. Toggle what they can and can't do.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-2">
              {TOGGLEABLE_CAPS.map((c) => (
                <div key={c.key} className="h-14 animate-pulse rounded-md bg-muted/40" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {TOGGLEABLE_CAPS.map((cap) => (
                  <CapabilityToggleRow
                    key={cap.key}
                    label={cap.label}
                    description={cap.sub}
                    checked={!!current[cap.key]}
                    defaultOn={!!roleDefaults[cap.key]}
                    onChange={(v) => setCap(cap.key, v)}
                  />
                ))}
              </div>

              <div className="mt-6">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3 w-3" strokeWidth={2} />
                  Owner-only
                </p>
                <div className="space-y-2">
                  {OWNER_ONLY_CAPS.map((cap) => (
                    <CapabilityToggleRow
                      key={cap.key}
                      label={cap.label}
                      checked={false}
                      defaultOn={false}
                      locked
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-border/60 bg-background/95 p-4 backdrop-blur">
          <div className="mb-3 rounded-md bg-muted/40 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              In plain English
            </p>
            <p className="mt-1 text-sm leading-snug text-foreground">{summary}</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="compact" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              size="compact"
              onClick={() => void save()}
              disabled={!dirty || saving || loading}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
