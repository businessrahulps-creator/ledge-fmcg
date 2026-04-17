import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function RefreshAppButton() {
  const [checking, setChecking] = useState(false);

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
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        >
          <RefreshCw
            className={cn("h-[18px] w-[18px] text-muted-foreground", checking && "animate-spin")}
            strokeWidth={1.5}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Check for updates</TooltipContent>
    </Tooltip>
  );
}
