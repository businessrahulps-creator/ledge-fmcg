import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function RefreshAppButton() {
  const [checking, setChecking] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  // Poll the global flag set by UpdatePrompt
  useEffect(() => {
    const id = setInterval(() => {
      setHasUpdate(!!window.__ledgeHasUpdate);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const handleClick = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const trigger = window.__ledgeTriggerUpdate;
      if (trigger) {
        const updated = await trigger();
        if (!updated) {
          toast.success("You're on the latest version");
        }
      } else {
        toast.message("Refreshing…");
        setTimeout(() => window.location.reload(), 300);
      }
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          aria-label="Check for updates"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        >
          <RefreshCw
            className={cn("h-[18px] w-[18px] text-muted-foreground", checking && "animate-spin")}
            strokeWidth={1.5}
          />
          {hasUpdate && !checking && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {hasUpdate ? "Update available — tap to install" : "Check for updates"}
      </TooltipContent>
    </Tooltip>
  );
}
