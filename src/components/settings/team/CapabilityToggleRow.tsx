import { Lock, type LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  defaultOn: boolean;
  /** e.g. "Accountant" — shown as "Included with Accountant". */
  jobLabel?: string;
  icon?: LucideIcon;
  locked?: boolean;
  lockedReason?: string;
  onChange?: (value: boolean) => void;
}

export function CapabilityToggleRow({
  label, description, checked, defaultOn, jobLabel, icon: Icon, locked = false, lockedReason, onChange,
}: Props) {
  if (locked) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-border/50 bg-muted/30 p-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/80">
            {lockedReason ?? "Only the Owner can do this."}
          </p>
        </div>
      </div>
    );
  }

  const badge = checked
    ? defaultOn ? { text: jobLabel ? `Included with ${jobLabel}` : "Included", tone: "bg-muted text-muted-foreground" }
                : { text: "Extra", tone: "bg-success/15 text-success" }
    : defaultOn ? { text: "Removed", tone: "bg-destructive/10 text-destructive" } : null;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md border bg-card p-3 transition-[background-color,border-color] duration-fast ease-fluent hover:border-primary/40",
        checked ? "border-primary/40 bg-primary/[0.03]" : "border-border/70",
      )}
    >
      {Icon && (
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors",
          checked ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/60")}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium">{label}</p>
          {badge && <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", badge.tone)}>{badge.text}</span>}
        </div>
        {description && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={(v) => onChange?.(!!v)} className="shrink-0" aria-label={label} />
    </label>
  );
}
