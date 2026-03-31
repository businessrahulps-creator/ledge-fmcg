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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your workspace and team
          </p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="h-12 rounded-lg bg-muted/50 p-1">
            <TabsTrigger value="company" className="rounded-md px-4 py-2 text-sm">Company</TabsTrigger>
            <TabsTrigger value="team" className="rounded-md px-4 py-2 text-sm">Team</TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-md px-4 py-2 text-sm">Subscription</TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                    <Building2 className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-3.5 w-3.5" />
                      Upload Logo
                    </Button>
                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Company Name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-12 rounded-lg" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Address</Label>
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
                <p className="text-sm text-muted-foreground">{team.length} team members</p>
                <Button onClick={openNewMember}>
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {team.map((m) => (
                  <div key={m.id} className="flex items-center justify-between border-b border-border/50 px-6 py-4 last:border-b-0 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        m.role === "super_admin" ? "bg-primary/15 text-primary" :
                        m.role === "sales_manager" ? "bg-success/15 text-success" :
                        "bg-warning/15 text-warning"
                      }`}>
                        {roleLabels[m.role]}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditMember({ ...m }); setIsNewMember(false); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {m.role !== "super_admin" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMember(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-base font-semibold">Free Trial</h3>
                    <p className="text-sm text-muted-foreground">{trialDaysLeft} days remaining</p>
                  </div>
                </div>
                <div className="mt-4 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((14 - trialDaysLeft) / 14) * 100}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your 14-day free trial is active. All features are unlocked.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  <h3 className="text-base font-semibold">Plan Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <span className="text-xs text-muted-foreground">Current Plan</span>
                    <p className="mt-1 text-sm font-medium">Free Trial</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <span className="text-xs text-muted-foreground">Trial Ends</span>
                    <p className="mt-1 text-sm font-medium">April 11, 2026</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <span className="text-xs text-muted-foreground">Team Members</span>
                    <p className="mt-1 text-sm font-medium">Unlimited</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <span className="text-xs text-muted-foreground">Orders</span>
                    <p className="mt-1 text-sm font-medium">Unlimited</p>
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
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isNewMember ? "Add Team Member" : "Edit Team Member"}</DialogTitle>
            </DialogHeader>
            {editMember && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Full Name</Label>
                  <Input value={editMember.name} onChange={(e) => setEditMember({ ...editMember, name: e.target.value })} className="h-12 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input value={editMember.email} onChange={(e) => setEditMember({ ...editMember, email: e.target.value })} className="h-12 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Role</Label>
                  <Select value={editMember.role} onValueChange={(v) => setEditMember({ ...editMember, role: v as TeamMember["role"] })}>
                    <SelectTrigger className="h-12 rounded-lg">
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
              <Button onClick={saveMember}>{isNewMember ? "Add Member" : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
