import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildInviteUrl, buildWhatsAppShare } from "@/lib/inviteLink";
import { toast } from "sonner";
import { JOB_BY_ROLE, type AppRole } from "./jobs";

interface Props {
  token: string;
  email: string;
  role: AppRole;
  companyName: string;
  onDone: () => void;
}

export function InviteShareSheet({ token, email, role, companyName, onDone }: Props) {
  const link = buildInviteUrl(token);
  const waUrl = buildWhatsAppShare(companyName, token);
  const [copied, setCopied] = useState(false);
  const job = JOB_BY_ROLE[role];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied", { description: "Paste it anywhere to share." });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy link", {
        description: "Long-press the link below to copy it manually.",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="rounded-md border border-success/30 bg-success/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Invite ready to share</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {email} will join as <span className="font-medium text-foreground">{job.label}</span>.
                The link works for 72 hours.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground/80">Invite link</p>
          <div className="break-all rounded-md border border-border/70 bg-muted/30 p-3 font-mono text-[11px] text-muted-foreground">
            {link}
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" strokeWidth={2.25} />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy link
              </>
            )}
          </Button>

          <a href={waUrl} target="_blank" rel="noreferrer" className="block">
            <Button
              type="button"
              className="w-full justify-start gap-2 bg-[#25D366] text-white hover:bg-[#1ebd5b]"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              Share on WhatsApp
            </Button>
          </a>
        </div>
      </div>

      <div className="border-t border-border/60 bg-muted/30 p-4">
        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
