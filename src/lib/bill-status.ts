/**
 * Bill (invoice) document state, in plain words.
 *
 * The database has carried several raw status values over time
 * ("draft", "sent", "final", "posted", "partial", "paid"). Only "draft" means the
 * document is not yet a real, locked bill — everything else is an issued document
 * that cannot be edited. This helper keeps one honest reading of that everywhere.
 *
 * IMPORTANT: never badge a bill "Paid" from the stored status alone. Older rows
 * carry a stale marker from before receipts were recorded. Work the state out from
 * the money actually received with `billStateFromMoney` and pass that in.
 */
export type BillStatusTone = "issued" | "paid" | "partial" | "draft";

export interface BillStatusView {
  label: string;
  tone: BillStatusTone;
  /** Tailwind classes for the badge, using semantic tokens only. */
  className: string;
  locked: boolean;
}

/**
 * The truthful state of a bill: what was billed, less receipts and credit notes.
 * Returns a raw status string that `billStatusView` understands.
 */
export function billStateFromMoney(grandTotal: number, received: number, credited: number): string {
  const due = Math.round((grandTotal - received - credited) * 100) / 100;
  if (due <= 0.5) return "paid";
  if (received > 0) return "partial";
  return "posted";
}

export function billStatusView(status: string | null | undefined): BillStatusView {
  const raw = (status || "").toLowerCase();

  if (raw === "draft") {
    return {
      label: "Draft",
      tone: "draft",
      className: "bg-warning/10 text-warning",
      locked: false,
    };
  }

  if (raw === "paid") {
    return {
      label: "Paid",
      tone: "paid",
      className: "bg-success/10 text-success",
      locked: true,
    };
  }

  if (raw === "partial") {
    return {
      label: "Part paid",
      tone: "partial",
      className: "bg-warning/10 text-warning",
      locked: true,
    };
  }

  // "sent", "final", "posted", or anything else that exists as a posted document.
  return {
    label: "Issued",
    tone: "issued",
    className: "bg-primary/10 text-primary",
    locked: true,
  };
}
