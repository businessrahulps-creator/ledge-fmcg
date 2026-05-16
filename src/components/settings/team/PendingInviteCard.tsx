import { useState } from "react";
import { Clock, Copy, MessageCircle, MoreHorizontal, RefreshCw, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { buildInviteUrl, buildWhatsAppShare } from "@/lib/inviteLink";
import { JOB_BY_ROLE, type AppRole } from "./jobs";

export interface PendingInvite {
  id: string;
  email: string;
  role: AppRole;
  token: string;
  created_at: string;
  expires_at: string;
}

interface Props {
  invite: PendingInvite;
  companyName: string;
  onResend: (inviteId: string) => Promise<void>;
  onCancel: (inviteId: string) => Promise<void>;
}

export function PendingInviteCard({ invite, companyName, onResend, onCancel }: Props) {
  const job = JOB_BY_ROLE[invite.role];
  const Icon = job.icon;
  const [busy, setBusy] = useState(false);

  const expiresAt = new Date(invite.expires_at);
  const msLeft = expiresAt.getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.round(msLeft / (60 * 60 * 1000)));
  const expiresLabel =
    msLeft <= 0
      ? "Expired"
      : hoursLeft < 24
        ? `Expires in ${hoursLeft}h`
        : `Expires in ${Math.round(hoursLeft / 24)}d`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildInviteUrl(invite.token));
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleShare = () => {
    window.open(buildWhatsAppShare(companyName, invite.token), "_blank", "noreferrer");
  };

  const handleResend = async () => {
    setBusy(true);
    await onResend(invite.id);
    setBusy(false);
  };

  const handleCancel = async () => {
    setBusy(true);
    await onCancel(invite.id);
    setBusy(false);
  };

  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed border-border/70 bg-card/60 p-3 transition-[border-color] duration-normal ease-fluent md:p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground md:h-11 md:w-11">
        <Mail className="h-4 w-4" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{invite.email}</p>
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
            Pending
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          Will join as {job.label} · {job.oneLiner}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Icon className="h-3 w-3" strokeWidth={1.75} />
            {job.label}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {expiresLabel}
          </span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={busy}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copy link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleShare}>
            <MessageCircle className="mr-2 h-4 w-4" /> Share on WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleResend}>
            <RefreshCw className="mr-2 h-4 w-4" /> Resend
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={handleCancel}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Cancel invite
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
