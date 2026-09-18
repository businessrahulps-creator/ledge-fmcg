/**
 * How much a dealer is allowed to owe.
 *
 * A limit of 0 used to mean "unlimited", which silently let cash-only dealers
 * run up any balance. Credit is now explicit:
 *   unlimited  — no ceiling
 *   limited    — ceiling is the credit limit
 *   cash_only  — no credit at all; every rupee must be collected up front
 */
export type CreditMode = "unlimited" | "limited" | "cash_only";

export interface CreditDealer {
  creditMode?: CreditMode | null;
  creditLimit?: number | null;
}

/** Returns the maximum the dealer may owe, or null when there is no ceiling. */
export function creditCeiling(dealer: CreditDealer | null | undefined): number | null {
  if (!dealer) return null;
  const mode: CreditMode = dealer.creditMode ?? (Number(dealer.creditLimit || 0) > 0 ? "limited" : "unlimited");
  if (mode === "cash_only") return 0;
  if (mode === "limited") return Math.max(0, Number(dealer.creditLimit || 0));
  return null;
}

/** True when the projected balance goes past what the dealer is allowed to owe. */
export function exceedsCredit(dealer: CreditDealer | null | undefined, projected: number): boolean {
  const ceiling = creditCeiling(dealer);
  if (ceiling === null) return false;
  return Math.round(projected * 100) / 100 > ceiling;
}

/** Plain-English reason shown when an order is blocked. */
export function creditBlockMessage(dealer: CreditDealer | null | undefined, name: string): string {
  return creditCeiling(dealer) === 0
    ? `${name} is set to no credit. Collect payment first, or ask someone who can approve an override.`
    : `${name} would owe more than their credit limit. Ask someone who can approve it.`;
}
