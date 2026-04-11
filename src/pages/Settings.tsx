import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { sanitizeInput } from "@/utils/sanitize";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Building2, Upload, Users, Plus, Pencil, Trash2, Crown, CreditCard, X, AlertTriangle, Clock, Database, RotateCw, CheckCircle2, XCircle } from "lucide-react";
import { getQueue, clearQueue, removeFromQueue, replaySingleMutation, getRetryStatus, setRetryStatus as saveRetryStatus, QueuedMutation } from "@/lib/offline-store";
import { Button } from "@/components/ui/button";
import { toast as sonnerToast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/use-notifications";
import { useApi } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: "super_admin" | "sales_manager" | "accountant";
  roleId: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  sales_manager: "Sales Manager",
  accountant: "Accountant",
};

export default function Settings() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const api = useApi();
  const { signOut, companyId, user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPrefixConfirm, setShowPrefixConfirm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const savedPrefix = api.orders.prefix();
  const [orderPrefix, setOrderPrefix] = useState(savedPrefix);
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [queuedMutations, setQueuedMutations] = useState<QueuedMutation[]>([]);
  const [showClearQueueConfirm, setShowClearQueueConfirm] = useState(false);
  const [retryStatus, setRetryStatus] = useState<Record<string, "success" | "failed">>({});

  useEffect(() => {
    const loadQueue = async () => {
      const queue = await getQueue();
      setQueuedMutations(queue);
      const stored = await getRetryStatus();
      // Clean up statuses for mutations no longer in queue
      const queueIds = new Set(queue.map(m => m.id));
      const cleaned: Record<string, "success" | "failed"> = {};
      for (const [id, status] of Object.entries(stored)) {
        if (queueIds.has(id)) cleaned[id] = status;
      }
      setRetryStatus(cleaned);
      if (Object.keys(cleaned).length !== Object.keys(stored).length) {
        await saveRetryStatus(cleaned);
      }
    };
    loadQueue();
    const interval = setInterval(loadQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("companies")
      .select("name, address, gstin, logo_url, trial_ends_at")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCompanyName(data.name || "");
          setCompanyAddress(data.address || "");
          setCompanyGstin(data.gstin || "");
          setLogoUrl(data.logo_url || "");
          if (data.trial_ends_at) setTrialEndsAt(new Date(data.trial_ends_at));
        }
      });

    // Realtime subscription for trial updates
    const channel = supabase
      .channel(`settings-trial-${companyId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "companies", filter: `id=eq.${companyId}` },
        (payload) => {
          const d = payload.new as any;
          if (d.trial_ends_at) setTrialEndsAt(new Date(d.trial_ends_at));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    if (file.size > 2 * 1024 * 1024) {
      sonnerToast.error("File too large", { description: "Logo must be under 2MB." });
      return;
    }
    if (!file.type.startsWith("image/")) {
      sonnerToast.error("Invalid file type", { description: "Please upload an image file." });
      return;
    }
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logos/${companyId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("company-logos")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: publicUrl })
        .eq("id", companyId);
      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      sonnerToast.success("Logo uploaded", { description: "Company logo has been updated." });
    } catch (err: any) {
      sonnerToast.error("Upload failed", { description: err?.message || "Could not upload logo." });
    }
    setLogoUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLogo = async () => {
    if (!companyId) return;
    setLogoUploading(true);
    try {
      // List and delete all files in the company's logo folder
      const { data: files } = await supabase.storage
        .from("company-logos")
        .list(`logos/${companyId}`);
      if (files && files.length > 0) {
        await supabase.storage
          .from("company-logos")
          .remove(files.map((f) => `logos/${companyId}/${f.name}`));
      }
      const { error } = await supabase
        .from("companies")
        .update({ logo_url: "" })
        .eq("id", companyId);
      if (error) throw error;
      setLogoUrl("");
      sonnerToast.success("Logo removed", { description: "Company logo has been removed." });
    } catch (err: any) {
      sonnerToast.error("Failed to remove logo", { description: err?.message || "Could not remove logo." });
    }
    setLogoUploading(false);
  };

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadTeam = useCallback(async () => {
    if (!companyId) return;
    setTeamLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, phone")
        .eq("company_id", companyId);

      if (!profiles || profiles.length === 0) {
        setTeam([]);
        setTeamLoading(false);
        return;
      }

      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("id, user_id, role")
        .in("user_id", userIds);

      const roleMap = new Map<string, { roleId: string; role: string }>(
        (roles || []).map((r) => [r.user_id, { roleId: r.id, role: r.role }])
      );

      const members: TeamMember[] = profiles
        .filter((p) => roleMap.has(p.user_id))
        .map((p) => {
          const r = roleMap.get(p.user_id)!;
          return {
            id: p.id,
            userId: p.user_id,
            name: p.full_name || "",
            email: p.email || "",
            phone: p.phone || "",
            role: r.role as TeamMember["role"],
            roleId: r.roleId,
          };
        });

      setTeam(members);
    } catch {
      // silent
    }
    setTeamLoading(false);
  }, [companyId]);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  const handleSaveClick = () => {
    if (orderPrefix !== savedPrefix) {
      setShowPrefixConfirm(true);
      return;
    }
    saveCompany();
  };

  const saveCompany = async () => {
    if (orderPrefix !== savedPrefix) {
      api.orders.setPrefix(sanitizeInput(orderPrefix));
    }
    if (companyId) {
      const { error } = await supabase
        .from("companies")
        .update({ name: sanitizeInput(companyName), address: sanitizeInput(companyAddress), gstin: sanitizeInput(companyGstin) })
        .eq("id", companyId);
      if (error) {
        toast({ title: "Error saving", description: error.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: "Settings saved", description: "Company profile has been updated." });
  };

  const openNewMember = () => {
    setEditMember({ id: "", userId: "", name: "", email: "", phone: "", role: "sales_manager", roleId: "" });
    setIsNewMember(true);
  };

  const saveMember = async () => {
    if (!editMember?.name || !editMember?.email || !companyId) return;
    setSaving(true);
    try {
      if (isNewMember) {
        const newUserId = crypto.randomUUID();
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: newUserId,
          full_name: sanitizeInput(editMember.name),
          email: sanitizeInput(editMember.email),
          phone: sanitizeInput(editMember.phone),
          company_id: companyId,
        });
        if (profileError) throw profileError;

        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: newUserId,
          role: editMember.role,
        });
        if (roleError) throw roleError;

        toast({ title: "Member added", description: `${editMember.name} has been added.` });
        addNotification("team_update", "Team Member Added", `${editMember.name} was added to the team.`);
      } else {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ full_name: sanitizeInput(editMember.name), phone: sanitizeInput(editMember.phone) })
          .eq("id", editMember.id);
        if (profileError) throw profileError;

        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: editMember.role })
          .eq("id", editMember.roleId);
        if (roleError) throw roleError;

        toast({ title: "Member updated", description: `${editMember.name} has been updated.` });
      }
      setEditMember(null);
      await loadTeam();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save member", variant: "destructive" });
    }
    setSaving(false);
  };

  const confirmRemoveMember = async () => {
    if (!deleteMember) return;
    setSaving(true);
    try {
      await supabase.from("user_roles").delete().eq("id", deleteMember.roleId);
      await supabase.from("profiles").delete().eq("id", deleteMember.id);
      toast({ title: "Member removed", description: `${deleteMember.name} has been removed.` });
      addNotification("team_update", "Team Member Removed", `${deleteMember.name} was removed from the team.`);
      setDeleteMember(null);
      await loadTeam();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to remove member", variant: "destructive" });
    }
    setSaving(false);
  };

  const trialDaysLeft = useMemo(() => {
    if (!trialEndsAt) return 0;
    return Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000));
  }, [trialEndsAt]);

  const trialExpired = trialDaysLeft === 0;
  const trialProgressPercent = Math.max(0, Math.min(100, (trialDaysLeft / 30) * 100));
  const trialProgressColor = trialExpired ? "bg-destructive" : trialDaysLeft <= 3 ? "bg-destructive" : trialDaysLeft <= 7 ? "bg-warning" : "bg-success";
  const trialEndFormatted = trialEndsAt
    ? trialEndsAt.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Settings</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Manage your workspace and team
          </p>
        </div>

        <Tabs defaultValue="company" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <TabsList className="h-10 w-max rounded-lg bg-muted/50 p-1 md:h-12 md:w-auto">
              <TabsTrigger value="company" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Company</TabsTrigger>
              <TabsTrigger value="team" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Team</TabsTrigger>
              <TabsTrigger value="subscription" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Subscription</TabsTrigger>
              <TabsTrigger value="sync" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm flex items-center gap-1.5">
                <Database className="h-3 w-3" />
                Sync Queue
                {queuedMutations.length > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {queuedMutations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Company Tab */}
          <TabsContent value="company">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-4 md:space-y-6">
              <div className="glass-card p-4 space-y-4 md:p-6 md:space-y-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 md:h-16 md:w-16 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Company logo" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground md:h-7 md:w-7" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={logoUploading} onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5" />
                      {logoUploading ? "Uploading…" : "Upload Logo"}
                    </Button>
                    {logoUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={logoUploading} onClick={handleRemoveLogo}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                  </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Company Name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-11 rounded-lg md:h-12" />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Address</Label>
                  <Textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="min-h-[100px] rounded-lg" />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">GSTIN</Label>
                  <Input
                    value={companyGstin}
                    onChange={(e) => setCompanyGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
                    maxLength={15}
                    className="h-11 rounded-lg md:h-12 max-w-[300px] font-mono"
                    placeholder="22AAAAA0000A1Z5"
                  />
                  <p className="text-[10px] text-muted-foreground md:text-xs">
                    15-digit GST Identification Number
                  </p>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Order Prefix</Label>
                  <Input
                    value={orderPrefix}
                    onChange={(e) => setOrderPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                    maxLength={10}
                    className="h-11 rounded-lg md:h-12 max-w-[200px] font-mono"
                    placeholder="ORD"
                  />
                  <p className="text-[10px] text-muted-foreground md:text-xs">
                    This will be used in all future order numbers (e.g. {orderPrefix || "ORD"}-2026-0042)
                  </p>
                </div>

                <Button onClick={handleSaveClick}>Save Changes</Button>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="team">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground md:text-sm">
                  {teamLoading ? "Loading…" : `${team.length} team members`}
                </p>
                <Button onClick={openNewMember} size="sm" className="md:size-default">
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              </div>

              <div className="glass-card overflow-hidden">
                {team.length === 0 && !teamLoading && (
                  <div className="px-6 py-8 text-center text-sm text-muted-foreground">No team members found.</div>
                )}
                {team.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-b border-border/50 px-3 py-3 last:border-b-0 row-hover md:px-6 md:py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary md:h-10 md:w-10 md:text-sm">
                        {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-muted-foreground truncate md:text-xs">{m.email}</p>
                          {m.phone && <p className="hidden sm:block text-[10px] text-muted-foreground md:text-xs">· {m.phone}</p>}
                          <span className={`hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium md:px-3 md:text-xs ${
                            m.role === "super_admin" ? "bg-primary/15 text-primary" :
                            m.role === "sales_manager" ? "bg-success/15 text-success" :
                            "bg-warning/15 text-warning"
                          }`}>
                            {roleLabels[m.role]}
                          </span>
                        </div>
                        <span className={`sm:hidden inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5 ${
                          m.role === "super_admin" ? "bg-primary/15 text-primary" :
                          m.role === "sales_manager" ? "bg-success/15 text-success" :
                          "bg-warning/15 text-warning"
                        }`}>
                          {roleLabels[m.role]}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10" onClick={() => { setEditMember({ ...m }); setIsNewMember(false); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {m.userId !== user?.id && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive md:h-10 md:w-10" onClick={() => setDeleteMember(m)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-4 md:space-y-6">
              <div className={`rounded-xl border p-4 md:p-6 ${trialExpired ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
                <div className="flex items-center gap-3">
                  {trialExpired ? (
                    <AlertTriangle className="h-5 w-5 text-destructive md:h-6 md:w-6" strokeWidth={1.5} />
                  ) : (
                    <Crown className="h-5 w-5 text-primary md:h-6 md:w-6" strokeWidth={1.5} />
                  )}
                  <div>
                    <h3 className="text-sm font-semibold md:text-base">
                      {trialExpired ? "Trial Expired" : "Free Trial"}
                    </h3>
                    <p className="text-xs text-muted-foreground md:text-sm">
                      {trialExpired ? "Your free trial has ended" : `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} remaining`}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted md:mt-4">
                  <div className={`h-2 rounded-full ${trialProgressColor} transition-all`} style={{ width: `${trialProgressPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground md:mt-3 md:text-sm">
                  {trialExpired
                    ? "Upgrade to a paid plan to continue using all features."
                    : "Your 30-day free trial is active. All features are unlocked."}
                </p>
              </div>

              <div className="glass-card p-4 space-y-3 md:p-6 md:space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold md:text-base">Plan Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Current Plan</span>
                    <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{trialExpired ? "Trial Expired" : "Free Trial"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Trial Ends</span>
                    <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">{trialEndFormatted}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Team Members</span>
                    <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">Unlimited</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Orders</span>
                    <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">Unlimited</p>
                  </div>
                </div>
                <Button className="w-full" size="lg" onClick={() => sonnerToast.info("Billing integration coming soon — contact support")}>
                  Upgrade Plan
                </Button>
              </div>
            </motion.div>
          </TabsContent>
          {/* Sync Queue Tab */}
          <TabsContent value="sync">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-4 md:space-y-6">
              <div className="glass-card p-4 space-y-4 md:p-6 md:space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <h3 className="text-sm font-semibold md:text-base">Pending Offline Changes</h3>
                  </div>
                  {queuedMutations.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setShowClearQueueConfirm(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear Queue
                    </Button>
                  )}
                </div>

                {queuedMutations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-muted-foreground">No pending changes</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Offline mutations will appear here when you're disconnected</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 px-4 md:-mx-6 md:px-6">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground md:px-3">Type</th>
                          <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground md:px-3">Table</th>
                          <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground md:px-3">Timestamp</th>
                          <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground md:px-3 hidden sm:table-cell">Payload</th>
                          <th className="h-10 px-2 text-left align-middle text-xs font-medium text-muted-foreground md:px-3 w-20">Status</th>
                          <th className="h-10 px-2 text-right align-middle text-xs font-medium text-muted-foreground md:px-3 w-10">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queuedMutations.map((m) => (
                          <tr key={m.id} className="border-b last:border-b-0 row-hover">
                            <td className="p-2 align-middle md:p-3">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                m.type === "insert" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                                m.type === "update" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                                "bg-destructive/15 text-destructive"
                              }`}>
                                {m.type}
                              </span>
                            </td>
                            <td className="p-2 align-middle text-xs font-mono md:p-3">{m.table}</td>
                            <td className="p-2 align-middle text-xs text-muted-foreground md:p-3">
                              {new Date(m.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}
                            </td>
                            <td className="p-2 align-middle text-xs text-muted-foreground font-mono truncate max-w-[200px] hidden sm:table-cell md:p-3">
                              {JSON.stringify(m.payload).slice(0, 80)}{JSON.stringify(m.payload).length > 80 ? "…" : ""}
                            </td>
                            <td className="p-2 align-middle md:p-3">
                              {retryStatus[m.id] === "success" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> Synced
                                </span>
                              ) : retryStatus[m.id] === "failed" ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
                                  <XCircle className="h-3 w-3" /> Failed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="p-2 align-middle text-right md:p-3">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  title="Retry"
                                  onClick={async () => {
                                    if (!navigator.onLine) {
                                      sonnerToast.error("You're offline — reconnect to retry");
                                      return;
                                    }
                                    const result = await replaySingleMutation(m);
                                    if (result.ok) {
                                      const updated = { ...retryStatus, [m.id]: "success" as const };
                                      setRetryStatus(updated);
                                      await saveRetryStatus(updated);
                                      sonnerToast.success("Mutation synced successfully");
                                    } else {
                                      const updated = { ...retryStatus, [m.id]: "failed" as const };
                                      setRetryStatus(updated);
                                      await saveRetryStatus(updated);
                                      const errMsg = "error" in result ? result.error : "Unknown error";
                                      sonnerToast.error("Sync failed", { description: errMsg });
                                    }
                                    const queue = await getQueue();
                                    setQueuedMutations(queue);
                                  }}
                                >
                                  <RotateCw className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Delete"
                                  onClick={async () => {
                                    await removeFromQueue(m.id);
                                    const queue = await getQueue();
                                    setQueuedMutations(queue);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Member Dialog */}
        <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">{isNewMember ? "Add Team Member" : "Edit Team Member"}</DialogTitle>
            </DialogHeader>
            {editMember && (
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Full Name</Label>
                  <Input value={editMember.name} onChange={(e) => setEditMember({ ...editMember, name: e.target.value })} className="h-11 rounded-lg md:h-12" />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Email</Label>
                  <Input
                    value={editMember.email}
                    onChange={(e) => setEditMember({ ...editMember, email: e.target.value })}
                    className="h-11 rounded-lg md:h-12"
                    disabled={!isNewMember}
                  />
                  {!isNewMember && <p className="text-[10px] text-muted-foreground">Email cannot be changed after creation</p>}
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Phone</Label>
                  <Input
                    value={editMember.phone}
                    onChange={(e) => setEditMember({ ...editMember, phone: e.target.value })}
                    className="h-11 rounded-lg md:h-12"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="text-xs md:text-sm">Role</Label>
                  <Select value={editMember.role} onValueChange={(v) => setEditMember({ ...editMember, role: v as TeamMember["role"] })}>
                    <SelectTrigger className="h-11 rounded-lg md:h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="sales_manager">Sales Manager</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
              <Button onClick={saveMember} disabled={saving}>{isNewMember ? "Add Member" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Logout Section */}
        <div className="glass-card p-4 md:p-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold md:text-base">Log Out</h3>
              <p className="text-xs text-muted-foreground md:text-sm mt-0.5">Sign out of your account on this device</p>
            </div>
            <Button variant="outline" size="sm" className="text-muted-foreground" onClick={() => setShowLogoutConfirm(true)}>
              Log Out
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteMember} onOpenChange={(open) => !open && setDeleteMember(null)}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base md:text-lg">Remove Team Member</AlertDialogTitle>
              <AlertDialogDescription className="text-xs md:text-sm">
                Are you sure you want to remove <span className="font-semibold text-foreground">{deleteMember?.name}</span> from the team? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Prefix Change Confirmation Dialog */}
        <AlertDialog open={showPrefixConfirm} onOpenChange={setShowPrefixConfirm}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base md:text-lg">⚠️ Change Order Prefix</AlertDialogTitle>
              <AlertDialogDescription className="text-xs md:text-sm space-y-2">
                <span className="block">Changing the Order Prefix will only apply to <strong className="text-foreground">NEW</strong> orders from now on.</span>
                <span className="block">All existing orders will keep their current numbers forever.</span>
                <span className="block">This change cannot be undone for past orders.</span>
                <span className="block mt-2 font-mono text-[11px] rounded-md bg-muted/50 px-2 py-1.5 border border-border/50">
                  Current: {savedPrefix}-2026-{String(api.orders.previewNumber().split("-").pop()).padStart(4, "0")}<br />
                  New: {orderPrefix}-2026-{String(api.orders.previewNumber().split("-").pop()).padStart(4, "0")}
                </span>
                <span className="block font-medium text-foreground">Are you sure?</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { saveCompany(); setShowPrefixConfirm(false); }}>
                Yes, Change Prefix
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Clear Queue Confirmation Dialog */}
        <AlertDialog open={showClearQueueConfirm} onOpenChange={setShowClearQueueConfirm}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base md:text-lg">Clear Sync Queue</AlertDialogTitle>
              <AlertDialogDescription className="text-xs md:text-sm">
                This will permanently discard <span className="font-semibold text-foreground">{queuedMutations.length}</span> pending offline change{queuedMutations.length !== 1 ? "s" : ""}. These changes will not be synced to the server. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  await clearQueue();
                  setQueuedMutations([]);
                  setShowClearQueueConfirm(false);
                  sonnerToast.success("Queue cleared", { description: "All pending changes have been discarded." });
                }}
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base md:text-lg">Log Out</AlertDialogTitle>
              <AlertDialogDescription className="text-xs md:text-sm">
                Are you sure you want to log out? You'll need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={async () => { await signOut(); navigate("/login"); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Log Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
