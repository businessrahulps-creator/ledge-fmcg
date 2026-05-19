import { cn } from "@/lib/utils";

interface EntityAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Deterministic colored initial chip used in list cards (dealers, salespeople).
 * Picks one of the brand-friendly tones based on the name hash so the same
 * entity always renders the same chip across the app.
 */
const TONES = [
  "bg-primary/10 text-primary ring-primary/20",
  "bg-success/10 text-success ring-success/25",
  "bg-warning/15 text-warning ring-warning/25",
  "bg-accent/15 text-accent ring-accent/25",
  "bg-muted text-foreground/70 ring-border",
] as const;

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const SIZES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
} as const;

export function EntityAvatar({ name, size = "md", className }: EntityAvatarProps) {
  const tone = TONES[hash(name) % TONES.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold ring-1 tracking-wide select-none",
        SIZES[size],
        tone,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
