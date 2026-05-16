import { Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
}

/** PR-F will render real capability toggles here. */
export function OverrideDrawerStub({ open, onOpenChange, memberName }: Props) {
  const isMobile = useIsMobile();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile ? "h-[70vh] rounded-t-xl" : "w-full sm:max-w-md",
        )}
      >
        <SheetHeader className="border-b border-border/60 p-5 text-left">
          <SheetTitle className="text-lg">Fine-tune {memberName}'s permissions</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Toggle individual capabilities on or off.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold">Coming soon</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Per-person fine-tuning lands in the next update. Today you can change their job from
            the roster.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
