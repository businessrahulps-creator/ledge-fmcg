import { useEffect, useState } from "react";
import { RotateCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { APP_VERSION, PRETTY_VERSION } from "@/lib/app-version";

const IST_OPTS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
};

const TIME_ONLY_OPTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
};

function tsToDate(ts: string): Date | null {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n);
  return isNaN(d.getTime()) ? null : d;
}

function formatBuildDate(ts: string): string {
  const d = tsToDate(ts);
  if (!d) return ts;
  return new Intl.DateTimeFormat("en-IN", IST_OPTS).format(d);
}

export function AboutSection() {
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<number | null>(null);
  const [runningSince] = useState<Date>(() => new Date());

  const version = APP_VERSION;
  const prettyVersion = PRETTY_VERSION;

  // Pick up the global last-check timestamp set by UpdatePrompt.
  useEffect(() => {
    const id = setInterval(() => {
      const t = window.__ledgeLastCheck;
      if (t && t !== lastCheck) setLastCheck(t);
    }, 1000);
    return () => clearInterval(id);
  }, [lastCheck]);

  const handleCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const trigger = window.__ledgeTriggerUpdate;
      if (trigger) {
        const updated = await trigger();
        if (!updated) toast.success("You're on the latest version");
        if (window.__ledgeLastCheck) setLastCheck(window.__ledgeLastCheck);
      } else {
        toast.message("Refreshing…");
        setTimeout(() => window.location.reload(), 300);
      }
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  const lastCheckLabel = lastCheck
    ? new Intl.DateTimeFormat("en-IN", TIME_ONLY_OPTS).format(new Date(lastCheck))
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold md:text-base">Ledge</h3>
            <p className="text-xs text-muted-foreground">Sales & Order Management</p>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono text-xs">{prettyVersion}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Released</span>
            <span className="text-xs">{formatBuildDate(version)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Running since</span>
            <span className="text-xs">
              {new Intl.DateTimeFormat("en-IN", IST_OPTS).format(runningSince)}
            </span>
          </div>
          {lastCheckLabel && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last checked</span>
              <span className="text-xs">{lastCheckLabel}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Build ID</span>
            <span className="font-mono text-[10px] text-muted-foreground">{version}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Updates install automatically. You can also check manually.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCheck}
            disabled={checking}
            className="gap-2"
          >
            <RotateCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} strokeWidth={1.5} />
            {checking ? "Checking…" : "Check for updates"}
          </Button>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        © 2026 Ledge. All rights reserved.
      </p>
    </div>
  );
}
