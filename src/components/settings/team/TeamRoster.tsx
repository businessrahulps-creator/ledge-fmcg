import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Sparkles, Lock, UserPlus, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SmartTime } from "@/components/ui/smart-time";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/use-notifications";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

import { JOB_BY_ROLE, capLabels, type AppRole } from "./jobs";
import { useTeamRoster, rolesDefaultCaps, type RosterMember } from "./useTeamRoster";
import { JobPickerSheet } from "./JobPickerSheet";
import { InviteSheet } from "./InviteSheet";
import { OverrideDrawer } from "./OverrideDrawer";
import { PendingInviteCard, type PendingInvite } from "./PendingInviteCard";
import { useInvite } from "@/hooks/useInvite";

const INACTIVE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

interface Props {
  companyId: string | null;
}

export function TeamRoster({ companyId }: Props) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { members, pendingInvites, defaults, loading, refresh } = useTeamRoster(companyId);
  const { resendInvite, cancelInvite } = useInvite();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [overrideFor, setOverrideFor] = useState<RosterMember | null>(null);
  const [pickerFor, setPickerFor] = useState<RosterMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("salesperson");
  const [removeFor, setRemoveFor] = useState<RosterMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");

  useEffect(() => {
    if (!companyId) return;
    let alive = true;
    supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .maybeSingle()
      .then(({ data }) => {
        if (alive && data?.name) setCompanyName(data.name);
      });
    return () => {
      alive = false;
    };
  }, [companyId]);

  const handleResendInvite = async (inviteId: string) => {
    const token = await resendInvite(inviteId);
    if (token) {
      toast.success("Invite refreshed", { description: "A new 72-hour link is ready to share." });
      await refresh();
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    const ok = await cancelInvite(inviteId);
    if (ok) {
      toast.success("Invite cancelled");
      await refresh();
    }
  };

  const ownerCount = useMemo(
    () => members.filter((m) => m.role === "super_admin").length,
    [members],
  );

  const sorted = useMemo(() => {
    if (!user?.id) return members;
    const me = members.find((m) => m.userId === user.id);
    const others = members.filter((m) => m.userId !== user.id);
    return me ? [me, ...others] : members;
  }, [members, user?.id]);

  const openPicker = (m: RosterMember) => {
    setSelectedRole(m.role);
    setPickerFor(m);
  };

  const handleRoleChange = async (newRole: AppRole) => {
    if (!pickerFor) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("id", pickerFor.roleId);
      if (error) {
        handleSupabaseError(error, { source: "team:role.update", title: "Couldn't change job" });
      } else {
        toast.success(
          `${pickerFor.name || "Member"} is now ${article(JOB_BY_ROLE[newRole].label)} ${JOB_BY_ROLE[newRole].label}`,
        );
        addNotification(
          "team_update",
          "Team role changed",
          `${pickerFor.name} is now ${JOB_BY_ROLE[newRole].label}.`,
        );
        setPickerFor(null);
        await refresh();
      }
    } catch (err) {
      handleSupabaseError(err, { source: "team:role.update", title: "Couldn't change job" });
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    if (!removeFor) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("delete_member_atomic" as any, {
        member_id: removeFor.id,
      });
      if (error) {
        handleSupabaseError(error, { source: "team:member.delete", title: "Couldn't remove member" });
      } else {
        toast.success(`${removeFor.name} has been removed from the team.`);
        addNotification("team_update", "Team member removed", `${removeFor.name} was removed.`);
        setRemoveFor(null);
        await refresh();
      }
    } catch (err) {
      handleSupabaseError(err, { source: "team:member.delete", title: "Couldn't remove member" });
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 200 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Your team</p>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading…" : `${members.length} ${members.length === 1 ? "person" : "people"}`}
          </p>
        </div>
        <Button size="compact" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Invite someone</span>
          <span className="sm:hidden">Invite</span>
        </Button>
      </div>

      <div className="space-y-2">
        {loading && (
          <div className="rounded-md border border-border/70 bg-card p-6 text-center text-sm text-muted-foreground">
            Loading roster…
          </div>
        )}
        {!loading && sorted.length === 0 && (
          <div className="rounded-md border border-border/70 bg-card p-6 text-center text-sm text-muted-foreground">
            No team members yet.
          </div>
        )}
        {sorted.map((m) => (
          <RosterCard
            key={m.id}
            member={m}
            isSelf={m.userId === user?.id}
            isLastOwner={m.role === "super_admin" && ownerCount === 1}
            onChangeJob={() => openPicker(m)}
            onOpenOverrides={() => setOverrideFor(m)}
            onRemove={() => setRemoveFor(m)}
          />
        ))}
      </div>

      {pendingInvites.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground/80">Pending invites</p>
          {pendingInvites.map((inv) => (
            <PendingInviteCard
              key={inv.id}
              invite={inv}
              companyName={companyName}
              onResend={handleResendInvite}
              onCancel={handleCancelInvite}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border/70 bg-muted/20 p-4">
          <p className="text-xs font-medium text-foreground/80">Pending invites</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            No invites waiting. Send one above and share the link on WhatsApp.
          </p>
        </div>
      )}

      {pickerFor && (
        <JobPickerSheet
          open={!!pickerFor}
          onOpenChange={(o) => !o && setPickerFor(null)}
          memberName={pickerFor.name || "Member"}
          currentRole={pickerFor.role}
          defaults={defaults}
          saving={saving}
          onConfirm={handleRoleChange}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          disabledMessage={
            pickerFor.role === "super_admin" &&
            ownerCount === 1 &&
            selectedRole !== "super_admin"
              ? "You can't demote the last Owner. Promote someone else first."
              : undefined
          }
        />
      )}

      <InviteSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        companyName={companyName}
        onInviteSent={refresh}
      />

      {overrideFor && (
        <OverrideDrawer
          open={!!overrideFor}
          onOpenChange={(o) => !o && setOverrideFor(null)}
          member={overrideFor}
          defaults={defaults}
          onSaved={refresh}
        />
      )}

      <RemoveMemberDialog
        member={removeFor}
        defaults={defaults}
        onCancel={() => setRemoveFor(null)}
        onConfirm={handleRemove}
        saving={saving}
      />
    </motion.div>
  );
}

/* ---------- RosterCard ---------- */

interface RosterCardProps {
  member: RosterMember;
  isSelf: boolean;
  isLastOwner: boolean;
  onChangeJob: () => void;
  onOpenOverrides: () => void;
  onRemove: () => void;
}

function RosterCard({
  member,
  isSelf,
  isLastOwner,
  onChangeJob,
  onOpenOverrides,
  onRemove,
}: RosterCardProps) {
  const job = JOB_BY_ROLE[member.role];
  const Icon = job.icon;
  const initials = (member.name || member.email || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const lockedPill = isSelf || isLastOwner;
  const updatedAt = member.updatedAt ? new Date(member.updatedAt) : null;
  const isInactive =
    !!updatedAt && Date.now() - updatedAt.getTime() > INACTIVE_THRESHOLD_MS;

  return (
    <div className="flex items-start gap-3 rounded-md border border-border/70 bg-card p-3 shadow-depth-2 transition-[box-shadow,border-color] duration-normal ease-fluent md:p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary md:h-11 md:w-11 md:text-sm">
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{member.name || "Unnamed"}</p>
          {isSelf && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              you
            </span>
          )}
          {member.hasOverrides && member.role !== "super_admin" && (
            <button
              type="button"
              onClick={onOpenOverrides}
              className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent transition-colors hover:bg-accent/25"
            >
              <Sparkles className="h-3 w-3" strokeWidth={2} />
              Customised
            </button>
          )}
        </div>

        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{job.oneLiner}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="truncate">{member.email}</span>
          {updatedAt &&
            (isInactive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                <Clock className="h-3 w-3" strokeWidth={2} />
                Inactive · last seen {updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={1.75} />
                Active <SmartTime date={updatedAt} className="ml-0.5" />
              </span>
            ))}
          {!updatedAt && <span>Hasn't signed in yet</span>}
        </div>

        <div className="mt-2">
          <button
            type="button"
            disabled={lockedPill}
            onClick={onChangeJob}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-[background-color,border-color] duration-fast ease-fluent",
              lockedPill
                ? "cursor-not-allowed border-border/60 bg-muted text-muted-foreground"
                : "border-primary/30 bg-primary/5 text-primary hover:border-primary hover:bg-primary/10",
            )}
            title={
              isSelf
                ? "You can't change your own job"
                : isLastOwner
                  ? "Can't demote the last Owner"
                  : "Tap to change job"
            }
          >
            <Icon className="h-3 w-3" strokeWidth={2} />
            {job.label}
            {lockedPill && <Lock className="ml-0.5 h-2.5 w-2.5" />}
          </button>
        </div>
      </div>

      {!isSelf && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled={isLastOwner} onSelect={onChangeJob}>
              Change job
            </DropdownMenuItem>
            {member.role !== "super_admin" && (
              <DropdownMenuItem onSelect={onOpenOverrides}>
                Fine-tune access
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              disabled={isLastOwner}
              className="text-destructive focus:text-destructive"
              onSelect={onRemove}
            >
              Remove from team
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/* ---------- RemoveMemberDialog ---------- */

interface RemoveProps {
  member: RosterMember | null;
  defaults: ReturnType<typeof useTeamRoster>["defaults"];
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}

function RemoveMemberDialog({ member, defaults, onCancel, onConfirm, saving }: RemoveProps) {
  const open = !!member;
  const summary = useMemo(() => {
    if (!member) return "";
    const caps = Array.from(rolesDefaultCaps(defaults, member.role));
    const meaningful = caps.filter((c) => c !== "see_own_performance_only");
    if (meaningful.length === 0) {
      return `${firstName(member.name) || "They"} has read-only access. Removing them revokes all access to your workspace.`;
    }
    return `${firstName(member.name) || "They"} will lose access to ${capLabels(meaningful)}.`;
  }, [member, defaults]);

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {member?.name || "this member"} from your team?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            {summary} This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={saving}>Keep them</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={saving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {saving ? "Removing…" : "Remove from team"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function firstName(full: string): string {
  return (full || "").trim().split(/\s+/)[0] ?? "";
}

function article(label: string): string {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}
