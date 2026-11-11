/**
 * Return amounts can be typed in any of a product's units, but are always saved
 * as whole main units. `factor` = how many of the picked unit make ONE main unit
 * (main unit itself = 1). Mirrors the check in record_return_and_credit_atomic;
 * the server stays the judge and looks the factor up itself.
 */
export interface ReturnUnitOption {
  id: string | null; // null = the product's main unit
  name: string;
  factor: number;
}

/** Whole main units for an entered amount, or null when it is not a whole main unit. */
export function toMainUnits(entered: number, factor: number): number | null {
  const e = Number(entered) || 0;
  const f = Number(factor) || 0;
  if (e < 0 || f <= 0) return null;
  const q = e / f;
  const whole = Math.round(q);
  return Math.abs(q - whole) < 1e-9 ? whole : null;
}

export interface ReturnLineCheck {
  good: number | null;
  damaged: number | null;
  noCredit: number | null;
  /** Main units used by this return line (0 while a part-unit is typed). */
  totalMain: number;
  partUnit: boolean;
  overLimit: boolean;
}

export function checkReturnLine(
  q: { good: number; damaged: number; noCredit: number },
  factor: number,
  remainingMain: number,
): ReturnLineCheck {
  const good = toMainUnits(q.good, factor);
  const damaged = toMainUnits(q.damaged, factor);
  const noCredit = toMainUnits(q.noCredit, factor);
  const partUnit = good === null || damaged === null || noCredit === null;
  const totalMain = partUnit ? 0 : (good! + damaged! + noCredit!);
  return { good, damaged, noCredit, totalMain, partUnit, overLimit: !partUnit && totalMain > remainingMain };
}
