import { Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  defaultOn: boolean;
  locked?: boolean;
  lockedReason?: string;
  onChange?: (value: boolean) => void;
}

export function CapabilityToggleRow({
  label,
  description,
  checked,
  defaultOn,
  locked = false,
  lockedReason,
  onChange,
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

  const differsFromDefault = checked !== defaultOn;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border border-border/70 bg-card p-3 transition-[background-color,border-color] duration-fast ease-fluent hover:border-primary/40 hover:bg-primary/5",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{label}</p>
          {differsFromDefault && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
              {checked ? "added" : "removed"}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(v) => onChange?.(!!v)}
        className="mt-0.5 shrink-0"
      />
    </label>
  );
}
