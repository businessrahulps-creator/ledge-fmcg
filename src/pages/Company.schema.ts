import { z } from "zod";
import { isValidGstin, isValidPan, isValidIfsc, isValidIndianPhone } from "@/utils/validators";

export const companySchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(120, "Company name is too long"),
  orderPrefix: z
    .string()
    .trim()
    .min(1, "Order prefix is required")
    .max(10, "Order prefix is too long")
    .regex(/^[A-Z0-9]+$/, "Only letters and numbers"),
  invoicePrefix: z
    .string()
    .trim()
    .min(1, "Invoice prefix is required")
    .max(10, "Invoice prefix is too long")
    .regex(/^[A-Z0-9]+$/, "Only letters and numbers"),
  companyAddress: z.string().trim().max(500, "Address is too long").optional().or(z.literal("")),
  companyGstin: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidGstin(v), "Invalid GSTIN — must be 15 chars (e.g. 27AAAAA0000A1Z5)"),
  companyPhone: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidIndianPhone(v), "Enter a valid 10-digit Indian mobile number"),
  companyEmail: z
    .string()
    .trim()
    .max(255, "Email is too long")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email"),
  companyPan: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidPan(v), "Invalid PAN — must be 10 chars (e.g. AAAAA0000A)"),
  companyStateCode: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{2}$/.test(v), "State code must be 2 digits"),
  bankName: z.string().trim().max(120, "Too long").optional().or(z.literal("")),
  bankAccountName: z.string().trim().max(120, "Too long").optional().or(z.literal("")),
  bankAccount: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{6,18}$/.test(v), "Account number must be 6–18 digits"),
  bankIfsc: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidIfsc(v), "Invalid IFSC — must be 11 chars (e.g. HDFC0001234)"),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
