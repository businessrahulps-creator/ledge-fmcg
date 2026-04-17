/**
 * India-specific format validators used across forms (Company, Dealers).
 * All validators treat empty strings as valid — fields are optional unless the
 * caller checks for presence separately. Trim before calling.
 */

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/; // Indian mobile: 10 digits, starts 6-9
const STATE_CODE_REGEX = /^[0-9]{2}$/;

export function isValidGstin(value: string): boolean {
  if (!value) return true;
  return GSTIN_REGEX.test(value.toUpperCase().trim());
}

export function isValidPan(value: string): boolean {
  if (!value) return true;
  return PAN_REGEX.test(value.toUpperCase().trim());
}

export function isValidIfsc(value: string): boolean {
  if (!value) return true;
  return IFSC_REGEX.test(value.toUpperCase().trim());
}

export function isValidIndianPhone(value: string): boolean {
  if (!value) return true;
  return PHONE_REGEX.test(normalizeIndianPhone(value));
}

/**
 * Normalize an Indian phone number to canonical 10-digit form.
 * Strips spaces, dashes, parentheses, dots, and any +91 / 91 / 0 prefix.
 * Returns the cleaned digits — caller decides whether to validate.
 * Examples:
 *   "+91 98765 43210"  -> "9876543210"
 *   "098765-43210"     -> "9876543210"
 *   "(91) 9876543210"  -> "9876543210"
 */
export function normalizeIndianPhone(value: string): string {
  if (!value) return "";
  const digits = value.replace(/[^\d]/g, "");
  // Strip leading 91 (country code) or 0 (STD prefix) if it leaves a 10-digit number
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isValidStateCode(value: string): boolean {
  if (!value) return true;
  return STATE_CODE_REGEX.test(value.trim());
}

/**
 * GSTIN state-code → Indian state/UT name lookup.
 * The first 2 digits of every GSTIN encode the state of registration.
 * Source: GST council notified state codes (01–38).
 */
export const INDIAN_STATE_CODES: Readonly<Record<string, string>> = Object.freeze({
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "25": "Daman and Diu", "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra", "28": "Andhra Pradesh (Old)", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman and Nicobar Islands", "36": "Telangana",
  "37": "Andhra Pradesh", "38": "Ladakh",
});

/** Returns the state name for a GSTIN's first 2 digits, or null if unknown. */
export function stateFromGstin(gstin: string): string | null {
  const code = (gstin || "").trim().slice(0, 2);
  return INDIAN_STATE_CODES[code] || null;
}
