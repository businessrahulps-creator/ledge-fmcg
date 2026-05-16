import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { JOBS, type AppRole } from "./jobs";
import { Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * PR-D placeholder. UI is final; send logic arrives in PR-E.
 */
export function InviteSheet({ open, onOpenChange }: Props) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("salesperson");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isMobile ? "h-[92vh] rounded-t-xl" : "w-full sm:max-w-md",
        )}
      >
        <SheetHeader className="border-b border-border/60 p-5 text-left">
          <SheetTitle className="text-lg">Invite someone to Ledge</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            They'll get an email link to join your workspace.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="space-y-2">
            <Label htmlFor="invite-email" className="text-xs">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="priya@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">What will they do?</Label>
            <div className="space-y-2">
              {JOBS.map((j) => {
                const Icon = j.icon;
                const selected = j.role === role;
                return (
                  <button
                    key={j.role}
                    type="button"
                    onClick={() => setRole(j.role)}
                    className={cn(
                      "w-full rounded-md border p-3 text-left transition-[border-color,background-color] duration-fast ease-fluent",
                      selected
                        ? "border-primary bg-primary/5"
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
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-border/60 bg-muted/30 p-4">
          <p className="text-[11px] text-muted-foreground">
            Invite sending arrives in the next update. For now, ask them to sign up and a workspace
            admin can add them.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button className="flex-1" disabled title="Coming in the next update">
              Send invite
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
