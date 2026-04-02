import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Upload, Users, Plus, Pencil, Trash2, Crown, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "sales_manager" | "accountant";
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  sales_manager: "Sales Manager",
  accountant: "Accountant",
};

export default function Settings() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("Acme FMCG Pvt. Ltd.");
  const [companyAddress, setCompanyAddress] = useState("42, Industrial Area, Phase 2\nGurgaon, Haryana 122001");
  const [team, setTeam] = useState<TeamMember[]>([
    { id: "t1", name: "Admin User", email: "admin@acmefmcg.in", role: "super_admin" },
    { id: "t2", name: "Rajesh Kumar", email: "rajesh@acmefmcg.in", role: "sales_manager" },
    { id: "t3", name: "Sneha Agarwal", email: "sneha@acmefmcg.in", role: "accountant" },
  ]);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);

  const saveCompany = () => {
    toast({ title: "Settings saved", description: "Company profile has been updated." });
  };

  const openNewMember = () => {
    setEditMember({ id: `t${Date.now()}`, name: "", email: "", role: "sales_manager" });
    setIsNewMember(true);
  };

  const saveMember = () => {
    if (!editMember?.name || !editMember?.email) return;
    if (isNewMember) {
      setTeam((prev) => [...prev, editMember]);
      toast({ title: "Member added", description: `${editMember.name} has been added.` });
    } else {
      setTeam((prev) => prev.map((m) => (m.id === editMember.id ? editMember : m)));
      toast({ title: "Member updated", description: `${editMember.name} has been updated.` });
    }
    setEditMember(null);
  };

  const removeMember = (id: string) => {
    const m = team.find((t) => t.id === id);
    setTeam((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Member removed", description: `${m?.name} has been removed.` });
  };

  const trialDaysLeft = 11;

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
            </TabsList>
          </div>

          {/* Company Tab */}
          <TabsContent value="company">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-4 md:space-y-6">
              <div className="rounded-xl border border-border bg-card p-4 space-y-4 md:p-6 md:space-y-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 md:h-16 md:w-16">
                    <Building2 className="h-6 w-6 text-muted-foreground md:h-7 md:w-7" strokeWidth={1.5} />
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-3.5 w-3.5" />
                      Upload Logo
                    </Button>
                    <p className="mt-1 text-[10px] text-muted-foreground md:text-xs">PNG, JPG up to 2MB</p>
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

                <Button onClick={saveCompany}>Save Changes</Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground md:text-sm">{team.length} team members</p>
                <Button onClick={openNewMember} size="sm" className="md:size-default">
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {team.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-b border-border/50 px-3 py-3 last:border-b-0 hover:bg-muted/30 transition-colors md:px-6 md:py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary md:h-10 md:w-10 md:text-sm">
                        {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-muted-foreground truncate md:text-xs">{m.email}</p>
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
                      {m.role !== "super_admin" && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive md:h-10 md:w-10" onClick={() => removeMember(m.id)}>
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
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Crown className="h-5 w-5 text-primary md:h-6 md:w-6" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-sm font-semibold md:text-base">Free Trial</h3>
                    <p className="text-xs text-muted-foreground md:text-sm">{trialDaysLeft} days remaining</p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted md:mt-4">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((14 - trialDaysLeft) / 14) * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground md:mt-3 md:text-sm">
                  Your 14-day free trial is active. All features are unlocked.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-3 md:p-6 md:space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground md:h-5 md:w-5" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold md:text-base">Plan Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Current Plan</span>
                    <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">Free Trial</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3 md:p-4">
                    <span className="text-[10px] text-muted-foreground md:text-xs">Trial Ends</span>
                    <p className="mt-0.5 text-xs font-medium md:mt-1 md:text-sm">April 11, 2026</p>
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
                <Button className="w-full" size="lg">
                  Upgrade Plan
                </Button>
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
                  <Input value={editMember.email} onChange={(e) => setEditMember({ ...editMember, email: e.target.value })} className="h-11 rounded-lg md:h-12" />
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
              <Button onClick={saveMember}>{isNewMember ? "Add Member" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
