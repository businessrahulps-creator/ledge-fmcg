import { useState } from "react";
import { RotateCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

declare const __APP_VERSION__: string;

function formatBuildDate(ts: string): string {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return ts;
  const d = new Date(n);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AboutSection() {
  const [checking, setChecking] = useState(false);
  const version = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

  const handleCheck = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const trigger = window.__ledgeTriggerUpdate;
      if (trigger) {
        const updated = await trigger();
        if (!updated) toast.success("You're on the latest version");
      } else {
        toast.message("Refreshing…");
        setTimeout(() => window.location.reload(), 300);
      }
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

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
            <span className="text-muted-foreground">Build</span>
            <span className="font-mono text-xs">{version}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Released</span>
            <span className="text-xs">{formatBuildDate(version)}</span>
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
