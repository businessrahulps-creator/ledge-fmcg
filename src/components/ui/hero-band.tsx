import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface HeroFigure {
  /** Short label above the figure, e.g. "Total". */
  label: string;
  /** The figure itself — already formatted. */
  value: ReactNode;
  /** Tone of the figure. Colour is always paired with the label wording. */
  tone?: "default" | "good" | "attention";
  /** One short supporting line under the figure. */
  note?: ReactNode;
  /** Renders the figure at hero scale. Use for the single most important number. */
  primary?: boolean;
}

interface HeroBandProps {
  /** Small line above the title — where you are. */
  eyebrow?: ReactNode;
  /** Title inside the band, e.g. the order number. */
  title: ReactNode;
  /** Supporting line under the title, e.g. the dealer name. */
  subtitle?: ReactNode;
  /** Up to three figures. The first should normally be primary. */
  figures?: HeroFigure[];
  /** Optional trailing content (badges, one quiet action). */
  aside?: ReactNode;
  className?: string;
}

const toneClass: Record<NonNullable<HeroFigure["tone"]>, string> = {
  default: "text-primary-foreground",
  good: "text-[hsl(var(--hero-good))]",
  attention: "text-[hsl(var(--hero-attention))]",
};

/**
 * The one loud block on a screen: a dark Midnight band carrying the single most
 * important number. Only one of these may appear per screen — that rule is what
 * keeps the rest of the page quiet and readable.
 */
export function HeroBand({ eyebrow, title, subtitle, figures = [], aside, className }: HeroBandProps) {
  return (
    <section className={cn("hero-band", className)}>
      <div className="hero-band-inner">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <p className="hero-band-eyebrow">{eyebrow}</p>}
            <h1 className="hero-band-title">{title}</h1>
            {subtitle && <p className="hero-band-subtitle">{subtitle}</p>}
          </div>
          {aside && <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div>}
        </div>

        {figures.length > 0 && (
          <div className="hero-band-figures">
            {figures.map((f) => (
              <div key={f.label} className="hero-band-figure">
                <p className="hero-band-label">{f.label}</p>
                <p
                  className={cn(
                    "hero-band-value",
                    f.primary ? "hero-band-value-primary" : undefined,
                    toneClass[f.tone ?? "default"],
                  )}
                >
                  {f.value}
                </p>
                {f.note && <p className="hero-band-note">{f.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
