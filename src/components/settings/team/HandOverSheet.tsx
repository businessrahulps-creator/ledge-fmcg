import { useState } from "react";
import { toast } from "sonner";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { confirmMatches } from "@/lib/team-governance";
import { JOB_BY_ROLE } from "./jobs";
import type { RosterMember } from "./useTeamRoster";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  members: RosterMember[];
  businessName: string;
  onDone: () => void;
}

export function HandOverSheet({ open, onOpenChange, members, businessName, onDone }: Props) {
  const [target, setTarget] = useState<string>("");
  const [typed, setTyped] = useState("");
  const [saving, setSaving] = useState(false);
  const person = members.find((m) => m.userId === target);
  const ok = !!person && confirmMatches(typed, businessName);

  const close = (o: boolean) => {
    if (saving) return;
    if (!o) { setTarget(""); setTyped(""); }
    onOpenChange(o);
  };

  const submit = async () => {
    if (!ok || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("transfer_master_owner_atomic", {
        p_new_user: target,
        p_confirm_text: typed,
      });
      if (error) {
        handleSupabaseError(error, { source: "team:master.transfer", title: "Couldn't hand over" });
      } else {
        toast.success(`${person!.name || "They"} is now the Master Owner`, {
          description: "You stay an Owner.",
        });
        setTarget(""); setTyped("");
        onOpenChange(false);
        onDone();
      }
    } catch (err) {
      handleSupabaseError(err, { source: "team:master.transfer", title: "Couldn't hand over" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Crown className="h-4 w-4" /> Hand over Master Owner</DialogTitle>
          <DialogDescription className="text-xs">
            The Master Owner is the only person who can add, change or remove Owners. After the handover you stay an
            Owner, but the new Master Owner can change your job.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">New Master Owner</label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Choose a team member" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {(m.name || m.email) + " · " + JOB_BY_ROLE[m.role].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {person && person.role !== "super_admin" && (
              <p className="text-[11px] text-muted-foreground">
                {person.name || "They"} will also become an Owner. Any custom access they have is reset.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">
              Type <span className="font-semibold">{businessName}</span> to confirm
            </label>
            <Input className="h-10" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => close(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={!ok || saving}>
            {saving ? "Handing over…" : "Hand over"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
