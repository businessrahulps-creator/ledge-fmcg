import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Crown, CreditCard, AlertTriangle, Clock, Database, RotateCw, CheckCircle2, XCircle, Download, Share, Smartphone, Trash2 } from "lucide-react";
import { TeamRoster } from "@/components/settings/team/TeamRoster";
import { getQueue, clearQueue, removeFromQueue, replaySingleMutation, getRetryStatus, setRetryStatus as saveRetryStatus, QueuedMutation, OFFLINE_MODE_ENABLED } from "@/lib/offline-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout/AppLayout";
import { AboutSection } from "@/components/settings/AboutSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { supabase } from "@/integrations/supabase/client";
import { useInstallPrompt } from "@/hooks/use-install-prompt";


function InstallAppCard() {
  const { canInstall, isIOS, isStandalone, permanentlyDismissed, triggerInstall, dismissForever } = useInstallPrompt();

  if (isStandalone || permanentlyDismissed || !canInstall) return null;

  return (
    <div className="glass-card p-4 md:p-6 max-w-2xl md:hidden">
      <div className="flex items-start gap-3">
        <img src="/pwa-192.png" alt="Ledge" className="h-12 w-12 shrink-0 rounded-md shadow-sm" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Install Ledge App</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Fast offline access to orders, stock, and reports — even in godowns.
          </p>

          {isIOS ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <Share className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Tap the <strong className="text-foreground">Share</strong> button</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <Smartphone className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Select <strong className="text-foreground">Add to Home Screen</strong></span>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => triggerInstall()}>
                <Download className="h-3.5 w-3.5" />
                Install App
              </Button>
            </div>
          )}

          <button onClick={dismissForever} className="mt-2 text-[11px] text-muted-foreground/60 hover:text-muted-foreground">
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { signOut, companyId, user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const { exportFullBackup } = await import("@/utils/exportBackup");
      await exportFullBackup();
    } catch (e) {
      toast.error("Backup failed", { description: "Please try again." });
    } finally {
      setBackupLoading(false);
    }
  };

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
      .select("trial_ends_at")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (data?.trial_ends_at) setTrialEndsAt(new Date(data.trial_ends_at));
      });

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
          <h1 className="h1-display">Settings</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Manage your workspace and team
          </p>
        </div>

        <Tabs defaultValue="team" className="space-y-4 md:space-y-6">
          <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
            <TabsList className="h-10 w-max rounded-lg bg-muted/50 p-1 md:h-12 md:w-auto">
              <TabsTrigger value="team" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Team</TabsTrigger>
              <TabsTrigger value="subscription" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">Subscription</TabsTrigger>
              {OFFLINE_MODE_ENABLED && (
                <TabsTrigger value="sync" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm flex items-center gap-1.5">
                  <Database className="h-3 w-3" />
                  Sync Queue
                  {queuedMutations.length > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {queuedMutations.length}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="about" className="rounded-md px-3 py-1.5 text-xs md:px-4 md:py-2 md:text-sm">About</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="team">
            <TeamRoster companyId={companyId} />
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 26, stiffness: 200 }} className="max-w-2xl space-y-4 md:space-y-6">
              <div className={`rounded-md border p-4 md:p-6 ${trialExpired ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
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
                <Button className="w-full" size="lg" onClick={() => toast.info("Billing integration coming soon — contact support")}>
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
                                m.type === "insert" ? "bg-success/15 text-success" :
                                m.type === "update" ? "bg-warning/15 text-warning" :
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
                                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
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
                                      toast.error("You're offline — reconnect to retry");
                                      return;
                                    }
                                    const result = await replaySingleMutation(m);
                                    if (result.ok) {
                                      const updated = { ...retryStatus, [m.id]: "success" as const };
                                      setRetryStatus(updated);
                                      await saveRetryStatus(updated);
                                      toast.success("Mutation synced successfully");
                                    } else {
                                      const updated = { ...retryStatus, [m.id]: "failed" as const };
                                      setRetryStatus(updated);
                                      await saveRetryStatus(updated);
                                      const errMsg = "error" in result ? result.error : "Unknown error";
                                      toast.error("Sync failed", { description: errMsg });
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

          <TabsContent value="about">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 26, stiffness: 200 }} className="space-y-4">
              <AboutSection />
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Team edit/invite/remove flows live inside <TeamRoster /> */}
        {/* Install App Card — mobile only, shown when not installed */}
        <InstallAppCard />



        {/* Data Backup */}
        <div className="glass-card p-4 md:p-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary shrink-0" />
              <div>
                <h3 className="text-sm font-semibold md:text-base">Data Backup</h3>
                <p className="text-xs text-muted-foreground md:text-sm mt-0.5">Download all your company data as a ZIP file</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={backupLoading}
              onClick={handleBackup}
            >
              {backupLoading ? <RotateCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1">{backupLoading ? "Exporting…" : "Download"}</span>
            </Button>
          </div>
        </div>

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


        <AlertDialog open={showClearQueueConfirm} onOpenChange={setShowClearQueueConfirm}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
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
                  toast.success("Queue cleared", { description: "All pending changes have been discarded." });
                }}
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
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
