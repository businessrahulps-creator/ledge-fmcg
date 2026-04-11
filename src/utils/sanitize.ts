/**
 * Sanitizes a text input before persisting to the database.
 * - Strips HTML / script tags
 * - Removes control characters (keeps tab, newline, carriage-return)
 * - Collapses multiple whitespace into a single space
 * - Trims leading / trailing whitespace
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
