/**
 * Bill (invoice) document state, in plain words.
 *
 * The database has carried several raw status values over time
 * ("draft", "sent", "final", "paid"). Only "draft" means the document is not
 * yet a real, locked bill — everything else is an issued document that cannot
 * be edited. This helper keeps one honest reading of that everywhere.
 */
export type BillStatusTone = "issued" | "paid" | "draft";

export interface BillStatusView {
  label: string;
  tone: BillStatusTone;
  /** Tailwind classes for the badge, using semantic tokens only. */
  className: string;
  locked: boolean;
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

  // "sent", "final", or anything else that exists as a posted document.
  return {
    label: "Issued",
    tone: "issued",
    className: "bg-primary/10 text-primary",
    locked: true,
  };
}
