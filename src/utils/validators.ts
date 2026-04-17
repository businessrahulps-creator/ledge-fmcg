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
  // Strip spaces, dashes, +91 / 91 prefix
  const cleaned = value.replace(/[\s-]/g, "").replace(/^(\+91|91)/, "");
  return PHONE_REGEX.test(cleaned);
}

export function isValidStateCode(value: string): boolean {
  if (!value) return true;
  return STATE_CODE_REGEX.test(value.trim());
}
