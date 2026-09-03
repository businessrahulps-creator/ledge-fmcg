import type { ReactNode } from "react";

export type LandingCardVariant =
  | "neutral"
  | "electric"
  | "ink"
  | "mist";

interface LandingCardProps {
  /** The graphic that fills the top well of the card. */
  visual: ReactNode;
  /** Short bold lede — the one thing the card says. */
  lede: string;
  /** Muted continuation sentence. */
  caption: string;
  variant?: LandingCardVariant;
  className?: string;
  /** Min height of the visual well, in px. */
  wellMinHeight?: number;
}
/** Explicit map — Tailwind must see full class names to keep these rules. */
const variantClass: Record<LandingCardVariant, string> = {
  neutral: "lp-vcard--neutral",
  electric: "lp-vcard--electric",
  ink: "lp-vcard--ink",
  mist: "lp-vcard--mist",
};


/**
 * Landing-only visual-first card: a soft 32px shell, a rounded visual well on
 * top, and a caption underneath (bold lede + muted continuation).
 * Never used inside /app — the product keeps the 6px Fluent surface.
 */
export function LandingCard({
  visual,
  lede,
  caption,
  variant = "neutral",
  className = "",
  wellMinHeight = 176,
}: LandingCardProps) {
  return (
    <div className={`lp-vcard ${variantClass[variant]} h-full ${className}`}>
      <div
        className="lp-well flex-1 flex flex-col justify-center"
        style={{ minHeight: wellMinHeight }}
      >
        {visual}
      </div>
      <p className="lp-caption">
        <b>{lede}</b> {caption}
      </p>
    </div>
  );
}
