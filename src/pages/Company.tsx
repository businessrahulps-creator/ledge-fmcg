import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sanitizeInput } from "@/utils/sanitize";
import { normalizeIndianPhone } from "@/utils/validators";
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
import { handleSupabaseError } from "@/utils/handleSupabaseError";
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
import { companySchema, type CompanyFormValues } from "./Company.schema";

const upper = (re: RegExp, max: number) => (v: string) =>
  v.toUpperCase().replace(re, "").slice(0, max);

export default function Company() {
  const api = useApi();
  const { companyId } = useAuth();
  const { updateCompanyInfo } = api;
  const savedPrefix = api.orders.prefix();

  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPrefixConfirm, setShowPrefixConfirm] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    watch,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    mode: "onChange",
    defaultValues: {
      companyName: "",
      orderPrefix: savedPrefix,
      invoicePrefix: "INV",
      companyAddress: "",
      companyGstin: "",
      companyPhone: "",
      companyEmail: "",
      companyPan: "",
      companyStateCode: "",
      bankName: "",
      bankAccountName: "",
      bankAccount: "",
      bankIfsc: "",
    },
  });

  const orderPrefix = watch("orderPrefix");
  const invoicePrefix = watch("invoicePrefix");

  useUnsavedChangesGuard(isDirty && !isSubmitting);

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("companies")
      .select("name, address, gstin, logo_url, phone, email, pan, state_code, bank_name, bank_account_name, bank_account, bank_ifsc, invoice_prefix")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setLogoUrl(data.logo_url || "");
          reset({
            companyName: data.name || "",
            orderPrefix: savedPrefix,
            invoicePrefix: data.invoice_prefix || "INV",
            companyAddress: data.address || "",
            companyGstin: data.gstin || "",
            companyPhone: data.phone || "",
            companyEmail: data.email || "",
            companyPan: data.pan || "",
            companyStateCode: data.state_code || "",
            bankName: data.bank_name || "",
            bankAccountName: data.bank_account_name || "",
            bankAccount: data.bank_account || "",
            bankIfsc: data.bank_ifsc || "",
          });
        }
      });
  }, [companyId, savedPrefix, reset]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast.error("Unsupported file type", { description: "Use JPG, PNG or WebP." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large", { description: "Logo must be under 2 MB." });
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
      if (error) {
        handleSupabaseError(error, { source: "crud:companies.removeLogo", title: "Failed to remove logo", context: { companyId } });
        return;
      }
      setLogoUrl("");
      updateCompanyInfo({ logoUrl: "" });
      toast.success("Logo removed", { description: "Company logo has been removed." });
    } catch (err: any) {
      handleSupabaseError(err, { source: "crud:companies.removeLogo", title: "Failed to remove logo", context: { companyId } });
    }
    setLogoUploading(false);
  };

  const handleSaveClick = handleSubmit((values) => {
    if (values.orderPrefix !== savedPrefix) {
      setShowPrefixConfirm(true);
      return;
    }
    return saveCompany(values);
  });

  const saveCompany = async (values: CompanyFormValues) => {
    if (!companyId) {
      toast.error("Workspace not set up", {
        description: "Please complete workspace setup before saving company details.",
      });
      logError({ source: "crud:companies.update", error: "Workspace not set up (companyId missing)", severity: "warning" });
      return;
    }
    if (values.orderPrefix !== savedPrefix) {
      api.orders.setPrefix(sanitizeInput(values.orderPrefix));
    }
    const payload = {
      name: sanitizeInput(values.companyName),
      address: sanitizeInput(values.companyAddress || ""),
      gstin: sanitizeInput(values.companyGstin),
      phone: normalizeIndianPhone(values.companyPhone) || sanitizeInput(values.companyPhone),
      email: sanitizeInput(values.companyEmail),
      pan: sanitizeInput(values.companyPan),
      state_code: sanitizeInput(values.companyStateCode),
      bank_name: sanitizeInput(values.bankName || ""),
      bank_account_name: sanitizeInput(values.bankAccountName || ""),
      bank_account: sanitizeInput(values.bankAccount),
      bank_ifsc: sanitizeInput(values.bankIfsc),
      invoice_prefix: sanitizeInput(values.invoicePrefix),
    };
    const { error } = await supabase.from("companies").update(payload).eq("id", companyId);
    if (error) {
      handleSupabaseError(error, { source: "crud:companies.update", title: "Couldn't save company details", context: { companyId } });
      return;
    }
    updateCompanyInfo({
      name: payload.name,
      address: payload.address,
      gstin: payload.gstin,
      phone: payload.phone,
      email: payload.email,
      pan: payload.pan,
      stateCode: payload.state_code,
      bankName: payload.bank_name,
      bankAccountName: payload.bank_account_name,
      bankAccount: payload.bank_account,
      bankIfsc: payload.bank_ifsc,
      invoicePrefix: payload.invoice_prefix,
    });
    // Reset RHF baseline so isDirty becomes false.
    reset(values);
    toast.success("Settings saved", { description: "Company profile has been updated." });
  };

  const errMsg = (k: keyof CompanyFormValues) => errors[k]?.message as string | undefined;

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="h1-display">Company</h1>
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
              <div className="relative flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 md:h-16 md:w-16 overflow-hidden">
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
              <Input {...register("companyName")} className="h-10 rounded-lg" aria-invalid={!!errors.companyName} />
              {errMsg("companyName") && <p className="text-xs text-destructive">{errMsg("companyName")}</p>}
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm">Address</Label>
              <Textarea {...register("companyAddress")} className="min-h-[100px] rounded-lg" aria-invalid={!!errors.companyAddress} />
              {errMsg("companyAddress") && <p className="text-xs text-destructive">{errMsg("companyAddress")}</p>}
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm">GSTIN</Label>
              <Controller
                control={control}
                name="companyGstin"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChange={(e) => field.onChange(upper(/[^A-Z0-9]/g, 15)(e.target.value))}
                    onBlur={field.onBlur}
                    maxLength={15}
                    className="h-10 rounded-lg max-w-[300px] font-mono"
                    placeholder="22AAAAA0000A1Z5"
                    aria-invalid={!!errors.companyGstin}
                  />
                )}
              />
              {errMsg("companyGstin")
                ? <p className="text-xs text-destructive">{errMsg("companyGstin")}</p>
                : <p className="text-[10px] text-muted-foreground md:text-xs">15-digit GST Identification Number</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">Phone</Label>
                <Input type="tel" inputMode="tel" autoComplete="tel" {...register("companyPhone")} className="h-10 rounded-lg" placeholder="+91 98100 12345" aria-invalid={!!errors.companyPhone} />
                {errMsg("companyPhone") && <p className="text-xs text-destructive">{errMsg("companyPhone")}</p>}
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">Email</Label>
                <Input type="email" {...register("companyEmail")} className="h-10 rounded-lg" placeholder="company@example.com" aria-invalid={!!errors.companyEmail} />
                {errMsg("companyEmail") && <p className="text-xs text-destructive">{errMsg("companyEmail")}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">PAN</Label>
                <Controller
                  control={control}
                  name="companyPan"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChange={(e) => field.onChange(upper(/[^A-Z0-9]/g, 10)(e.target.value))}
                      onBlur={field.onBlur}
                      maxLength={10}
                      className="h-10 rounded-lg max-w-[200px] font-mono"
                      placeholder="ABCDE1234F"
                      aria-invalid={!!errors.companyPan}
                    />
                  )}
                />
                {errMsg("companyPan") && <p className="text-xs text-destructive">{errMsg("companyPan")}</p>}
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">State Code</Label>
                <Controller
                  control={control}
                  name="companyStateCode"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
                      onBlur={field.onBlur}
                      maxLength={2}
                      className="h-10 rounded-lg max-w-[100px] font-mono"
                      placeholder="27"
                      aria-invalid={!!errors.companyStateCode}
                    />
                  )}
                />
                {errMsg("companyStateCode")
                  ? <p className="text-xs text-destructive">{errMsg("companyStateCode")}</p>
                  : <p className="text-[10px] text-muted-foreground md:text-xs">2-digit GST state code</p>}
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3">Bank Details</h3>
              <div className="space-y-4">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Bank Name</Label>
                    <Input {...register("bankName")} className="h-10 rounded-lg" placeholder="State Bank of India" aria-invalid={!!errors.bankName} />
                    {errMsg("bankName") && <p className="text-xs text-destructive">{errMsg("bankName")}</p>}
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Account Holder Name</Label>
                    <Input {...register("bankAccountName")} className="h-10 rounded-lg" placeholder="Your Company Pvt Ltd" aria-invalid={!!errors.bankAccountName} />
                    {errMsg("bankAccountName") && <p className="text-xs text-destructive">{errMsg("bankAccountName")}</p>}
                  </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">Account Number</Label>
                    <Controller
                      control={control}
                      name="bankAccount"
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                          onBlur={field.onBlur}
                          className="h-10 rounded-lg font-mono"
                          placeholder="1234567890"
                          aria-invalid={!!errors.bankAccount}
                        />
                      )}
                    />
                    {errMsg("bankAccount") && <p className="text-xs text-destructive">{errMsg("bankAccount")}</p>}
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="text-xs md:text-sm">IFSC Code</Label>
                    <Controller
                      control={control}
                      name="bankIfsc"
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={(e) => field.onChange(upper(/[^A-Z0-9]/g, 11)(e.target.value))}
                          onBlur={field.onBlur}
                          maxLength={11}
                          className="h-10 rounded-lg max-w-[200px] font-mono"
                          placeholder="SBIN0001234"
                          aria-invalid={!!errors.bankIfsc}
                        />
                      )}
                    />
                    {errMsg("bankIfsc") && <p className="text-xs text-destructive">{errMsg("bankIfsc")}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm">Order Prefix</Label>
              <Controller
                control={control}
                name="orderPrefix"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChange={(e) => field.onChange(upper(/[^A-Z0-9]/g, 10)(e.target.value))}
                    onBlur={field.onBlur}
                    maxLength={10}
                    className="h-10 rounded-lg max-w-[200px] font-mono"
                    placeholder="ORD"
                    aria-invalid={!!errors.orderPrefix}
                  />
                )}
              />
              {errMsg("orderPrefix")
                ? <p className="text-xs text-destructive">{errMsg("orderPrefix")}</p>
                : <p className="text-[10px] text-muted-foreground md:text-xs">
                    This will be used in all future order numbers (e.g. {orderPrefix || "ORD"}-2026-0042)
                  </p>}
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-xs md:text-sm">Invoice Prefix</Label>
              <Controller
                control={control}
                name="invoicePrefix"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChange={(e) => field.onChange(upper(/[^A-Z0-9]/g, 10)(e.target.value))}
                    onBlur={field.onBlur}
                    maxLength={10}
                    className="h-10 rounded-lg max-w-[200px] font-mono"
                    placeholder="INV"
                    aria-invalid={!!errors.invoicePrefix}
                  />
                )}
              />
              {errMsg("invoicePrefix")
                ? <p className="text-xs text-destructive">{errMsg("invoicePrefix")}</p>
                : <p className="text-[10px] text-muted-foreground md:text-xs">
                    Used for invoice numbers (e.g. {invoicePrefix || "INV"}-2026-0001)
                  </p>}
            </div>

            <Button onClick={handleSaveClick} disabled={isSubmitting || !isValid}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Prefix Change Confirmation Dialog */}
        <AlertDialog open={showPrefixConfirm} onOpenChange={setShowPrefixConfirm}>
          <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-md sm:max-w-md">
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
              <AlertDialogAction onClick={() => { saveCompany(getValues()); setShowPrefixConfirm(false); }}>
                Yes, Change Prefix
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AppLayout>
  );
}
