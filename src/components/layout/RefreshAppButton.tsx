import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
        // If updated === true, the page will reload momentarily
      } else {
        // No SW registered (preview/iframe) — just reload
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          aria-label="Check for updates"
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn("h-4 w-4", checking && "animate-spin")} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Check for updates</TooltipContent>
    </Tooltip>
  );
}
