import { useState, useEffect, useRef } from "react";
import { sanitizeInput } from "@/utils/sanitize";
import { isValidGstin, isValidPan, isValidIfsc, isValidIndianPhone } from "@/utils/validators";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Building2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";

import { useApi } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/errorLog";
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

export default function Company() {
  
  const api = useApi();
  const { companyId } = useAuth();
  const { updateCompanyInfo } = api;

  const [companyName, setCompanyName] = useState("");
  const savedPrefix = api.orders.prefix();
  const [orderPrefix, setOrderPrefix] = useState(savedPrefix);
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPan, setCompanyPan] = useState("");
  const [companyStateCode, setCompanyStateCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPrefixConfirm, setShowPrefixConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");

  // Build a stable string of all editable fields for dirty-detection.
  const currentSnapshot = JSON.stringify({
    companyName, orderPrefix, companyAddress, companyGstin, companyPhone,
    companyEmail, companyPan, companyStateCode, bankName, bankAccountName,
    bankAccount, bankIfsc, invoicePrefix, logoUrl,
  });
  const isDirty = savedSnapshot !== "" && currentSnapshot !== savedSnapshot;
  const guard = useUnsavedChangesGuard(isDirty && !isSaving);


  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("companies")
      .select("name, address, gstin, logo_url, phone, email, pan, state_code, bank_name, bank_account_name, bank_account, bank_ifsc, invoice_prefix")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCompanyName(data.name || "");
          setCompanyAddress(data.address || "");
          setCompanyGstin(data.gstin || "");
          setLogoUrl(data.logo_url || "");
          setCompanyPhone((data as any).phone || "");
          setCompanyEmail((data as any).email || "");
          setCompanyPan((data as any).pan || "");
          setCompanyStateCode((data as any).state_code || "");
          setBankName((data as any).bank_name || "");
          setBankAccountName((data as any).bank_account_name || "");
          setBankAccount((data as any).bank_account || "");
          setBankIfsc((data as any).bank_ifsc || "");
          setInvoicePrefix((data as any).invoice_prefix || "INV");
          // Seed dirty-tracking baseline once initial values are populated.
          setSavedSnapshot(JSON.stringify({
            companyName: data.name || "",
            orderPrefix: savedPrefix,
            companyAddress: data.address || "",
            companyGstin: data.gstin || "",
            companyPhone: (data as any).phone || "",
            companyEmail: (data as any).email || "",
            companyPan: (data as any).pan || "",
            companyStateCode: (data as any).state_code || "",
            bankName: (data as any).bank_name || "",
            bankAccountName: (data as any).bank_account_name || "",
            bankAccount: (data as any).bank_account || "",
            bankIfsc: (data as any).bank_ifsc || "",
            invoicePrefix: (data as any).invoice_prefix || "INV",
            logoUrl: data.logo_url || "",
          }));
        }
      });
  }, [companyId]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Logo must be under 2MB." });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type", { description: "Please upload an image file." });
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
      updateCompanyInfo({ logoUrl: publicUrl });
      toast.success("Logo uploaded", { description: "Company logo has been updated." });
    } catch (err: any) {
      toast.error("Upload failed", { description: err?.message || "Could not upload logo." });
    }
    setLogoUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLogo = async () => {
    if (!companyId) return;
    setLogoUploading(true);
    try {
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
      updateCompanyInfo({ logoUrl: "" });
      toast.success("Logo removed", { description: "Company logo has been removed." });
    } catch (err: any) {
      toast.error("Failed to remove logo", { description: err?.message || "Could not remove logo." });
    }
    setLogoUploading(false);
  };

  const handleSaveClick = () => {
    if (orderPrefix !== savedPrefix) {
      setShowPrefixConfirm(true);
      return;
    }
    saveCompany();
  };

  const saveCompany = async () => {
    if (!companyId) {
      toast.error("Workspace not set up", {
        description: "Please complete workspace setup before saving company details.",
      });
      logError({ source: "crud:companies.update", error: "Workspace not set up (companyId missing)", severity: "warning" });
      return;
    }
    if (!isValidGstin(companyGstin)) {
      toast.error("Invalid GSTIN", { description: "GSTIN must be 15 characters in the standard format (e.g. 27AAAAA0000A1Z5)." });
      return;
    }
    if (!isValidPan(companyPan)) {
      toast.error("Invalid PAN", { description: "PAN must be 10 characters (e.g. AAAAA0000A)." });
      return;
    }
    if (!isValidIndianPhone(companyPhone)) {
      toast.error("Invalid phone", { description: "Enter a valid 10-digit Indian mobile number." });
      return;
    }
    if (!isValidIfsc(bankIfsc)) {
      toast.error("Invalid IFSC", { description: "IFSC must be 11 characters (e.g. HDFC0001234)." });
      return;
    }
    setIsSaving(true);
    try {
    if (orderPrefix !== savedPrefix) {
      api.orders.setPrefix(sanitizeInput(orderPrefix));
    }
    {
      const { error } = await supabase
        .from("companies")
        .update({
          name: sanitizeInput(companyName),
          address: sanitizeInput(companyAddress),
          gstin: sanitizeInput(companyGstin),
          phone: sanitizeInput(companyPhone),
          email: sanitizeInput(companyEmail),
          pan: sanitizeInput(companyPan),
          state_code: sanitizeInput(companyStateCode),
          bank_name: sanitizeInput(bankName),
          bank_account_name: sanitizeInput(bankAccountName),
          bank_account: sanitizeInput(bankAccount),
          bank_ifsc: sanitizeInput(bankIfsc),
          invoice_prefix: sanitizeInput(invoicePrefix),
        } as any)
        .eq("id", companyId);
      if (error) {
        toast.error("Error saving", { description: error.message });
        logError({ source: "crud:companies.update", error, context: { companyId } });
        return;
      }
    }
    updateCompanyInfo({
      name: sanitizeInput(companyName),
      address: sanitizeInput(companyAddress),
      gstin: sanitizeInput(companyGstin),
      phone: sanitizeInput(companyPhone),
      email: sanitizeInput(companyEmail),
      pan: sanitizeInput(companyPan),
      stateCode: sanitizeInput(companyStateCode),
      bankName: sanitizeInput(bankName),
      bankAccountName: sanitizeInput(bankAccountName),
      bankAccount: sanitizeInput(bankAccount),
      bankIfsc: sanitizeInput(bankIfsc),
      invoicePrefix: sanitizeInput(invoicePrefix),
    });
    toast.success("Settings saved", { description: "Company profile has been updated." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Company</h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
            Manage your company profile, tax details, and bank information
          </p>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 26, stiffness: 200 }} className="max-w-2xl space-y-4 md:space-y-6">
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
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-10 rounded-lg" />
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
                className="h-10 rounded-lg max-w-[300px] font-mono"
                placeholder="22AAAAA0000A1Z5"
              />
              <p className="text-[10px] text-muted-foreground md:text-xs">
                15-digit GST Identification Number
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">Phone</Label>
                <Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="h-10 rounded-lg" placeholder="+91 98100 12345" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">Email</Label>
                <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="h-10 rounded-lg" placeholder="company@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">PAN</Label>
                <Input value={companyPan} onChange={(e) => setCompanyPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} maxLength={10} className="h-10 rounded-lg max-w-[200px] font-mono" placeholder="ABCDE1234F" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">State Code</Label>
                <Input value={companyStateCode} onChange={(e) => setCompanyStateCode(e.target.value.replace(/\D/g, "").slice(0, 2))} maxLength={2} className="h-10 rounded-lg max-w-[100px] font-mono" placeholder="27" />
                <p className="text-[10px] text-muted-foreground md:text-xs">2-digit GST state code</p>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3">Bank Details</h3>
              <div className="space-y-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Bank Name</Label>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-10 rounded-lg" placeholder="State Bank of India" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Account Holder Name</Label>
                    <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="h-10 rounded-lg" placeholder="Your Company Pvt Ltd" />
                  </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Account Number</Label>
                    <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))} className="h-10 rounded-lg font-mono" placeholder="1234567890" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">IFSC Code</Label>
                    <Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))} maxLength={11} className="h-10 rounded-lg max-w-[200px] font-mono" placeholder="SBIN0001234" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm">Order Prefix</Label>
              <Input
                value={orderPrefix}
                onChange={(e) => setOrderPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                maxLength={10}
                className="h-10 rounded-lg max-w-[200px] font-mono"
                placeholder="ORD"
              />
              <p className="text-[10px] text-muted-foreground md:text-xs">
                This will be used in all future order numbers (e.g. {orderPrefix || "ORD"}-2026-0042)
              </p>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm">Invoice Prefix</Label>
              <Input
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                maxLength={10}
                className="h-10 rounded-lg max-w-[200px] font-mono"
                placeholder="INV"
              />
              <p className="text-[10px] text-muted-foreground md:text-xs">
                Used for invoice numbers (e.g. {invoicePrefix || "INV"}-2026-0001)
              </p>
            </div>

            <Button onClick={handleSaveClick} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </motion.div>

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
      </div>
    </AppLayout>
  );
}
