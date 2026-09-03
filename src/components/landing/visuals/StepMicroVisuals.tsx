import { motion, useReducedMotion } from "framer-motion";
import { Check, PackageCheck } from "lucide-react";
import { ease, duration } from "@/lib/motion";

/* ═══════════════════════════════════════════════════════════════
   How It Works — image-free micro-visuals.
   Pure HTML/CSS/SVG. Each plays once on scroll-in and collapses
   to its final state under prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════════ */

const well =
  "relative w-full rounded-2xl bg-secondary/60 border border-border/70 p-4 overflow-hidden";

const rowClass =
  "flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-card";

const rowShadow = {
  boxShadow: "inset 0 1px 0 hsl(0 0% 100%), 0 1px 2px hsl(220 30% 15% / 0.05)",
} as const;

const viewport = { once: true, margin: "-80px" } as const;

const wellMin = 176;

/** Step 01 — an order assembling itself, then stamped saved. */
export function OrderBuildVisual() {
  const still = useReducedMotion();
  const lines = [
    { name: "Cold Pressed · Orange 250ml", qty: "24" },
    { name: "Coconut Water 200ml", qty: "12" },
  ];

  return (
    <div className={well} style={{ minHeight: wellMin }}>
      <div className="space-y-2">
        <motion.div
          className={rowClass}
          style={rowShadow}
          initial={still ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: duration.short, ease: ease.decelerate }}
        >
          <span className="font-body text-[12.5px] font-medium text-foreground truncate">
            Aryan Beverages
          </span>
          <span className="font-body text-[11px] text-muted-foreground shrink-0">Dealer</span>
        </motion.div>

        {lines.map((l, i) => (
          <motion.div
            key={l.name}
            className={rowClass}
            style={rowShadow}
            initial={still ? false : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{
              duration: duration.short,
              ease: ease.decelerate,
              delay: still ? 0 : 0.18 + i * 0.14,
            }}
          >
            <span className="font-body text-[12.5px] text-muted-foreground truncate">{l.name}</span>
            <span className="font-body text-[12px] font-semibold text-foreground tabular-nums shrink-0">
              ×{l.qty}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5"
        initial={still ? false : { opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={viewport}
        transition={{
          duration: duration.short,
          ease: ease.emphasized,
          delay: still ? 0 : 0.56,
        }}
      >
        <Check size={12} strokeWidth={3} className="text-background" />
        <span className="font-body text-[11.5px] font-semibold text-background tracking-[0.02em]">
          Saved · ORD-1042
        </span>
      </motion.div>
    </div>
  );
}

/** Step 02 — stock health bars filling; one lands low and pulses. */
export function StockHealthVisual() {
  const still = useReducedMotion();
  const bars = [
    { sku: "Orange 250ml", pct: 78, label: "48 in stock", low: false },
    { sku: "Coconut 200ml", pct: 46, label: "22 in stock", low: false },
    { sku: "Sugarcane 300ml", pct: 12, label: "Low · reorder", low: true },
  ];

  return (
    <div className={well} style={{ minHeight: wellMin }}>
      <div className="space-y-3.5">
        {bars.map((b, i) => (
          <div key={b.sku}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="font-body text-[12.5px] text-foreground truncate">{b.sku}</span>
              <span
                className={`font-body text-[11px] shrink-0 tabular-nums ${
                  b.low ? "text-foreground font-semibold" : "text-muted-foreground"
                }`}
              >
                {b.label}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border/80 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${b.low ? "bg-foreground" : "bg-muted-foreground/55"}`}
                initial={still ? false : { width: 0 }}
                whileInView={{ width: `${b.pct}%` }}
                viewport={viewport}
                transition={{
                  duration: duration.long,
                  ease: ease.emphasized,
                  delay: still ? 0 : i * 0.12,
                }}
                style={still ? { width: `${b.pct}%` } : undefined}
              />
            </div>
          </div>
        ))}
      </div>

      {!still && (
        <motion.span
          aria-hidden
          className="absolute right-4 bottom-4 w-2 h-2 rounded-full bg-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: [0, 1, 0.35, 1] }}
          viewport={viewport}
          transition={{ duration: 1.4, delay: 0.7, ease: ease.standard }}
        />
      )}
    </div>
  );
}

/** Step 03 — dispatch tick → stock counts down → GST total counts up. */
export function DispatchInvoiceVisual() {
  const still = useReducedMotion();

  return (
    <div className={well} style={{ minHeight: wellMin }}>
      <motion.div
        className={rowClass}
        style={rowShadow}
        initial={still ? false : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: duration.short, ease: ease.decelerate }}
      >
        <span className="inline-flex items-center gap-2">
          <PackageCheck size={14} strokeWidth={2} className="text-foreground" />
          <span className="font-body text-[12.5px] font-medium text-foreground">Dispatched</span>
        </span>
        <span className="font-body text-[11px] text-muted-foreground tabular-nums">ORD-1042</span>
      </motion.div>

      <motion.svg
        viewBox="0 0 200 28"
        className="w-full h-7 my-1.5 block"
        aria-hidden
        initial={still ? false : "hidden"}
        whileInView="shown"
        viewport={viewport}
      >
        <motion.path
          d="M22 2 V10 Q22 22 100 22 Q178 22 178 10 V2"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
          strokeLinecap="round"
          variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1 } }}
          transition={{ duration: duration.long, ease: ease.standard, delay: 0.18 }}
        />
      </motion.svg>

      <div className="grid grid-cols-2 gap-2">
        <motion.div
          className="rounded-xl bg-card px-3 py-2.5"
          style={rowShadow}
          initial={still ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: duration.short, ease: ease.decelerate, delay: still ? 0 : 0.6 }}
        >
          <p className="font-body text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
            Stock
          </p>
          <p className="font-heading text-[17px] font-semibold text-foreground tabular-nums leading-tight mt-0.5">
            48 → 24
          </p>
        </motion.div>
        <motion.div
          className="rounded-xl bg-foreground px-3 py-2.5"
          initial={still ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: duration.short, ease: ease.decelerate, delay: still ? 0 : 0.72 }}
        >
          <p className="font-body text-[10.5px] uppercase tracking-[0.12em] text-background/65">
            GST invoice
          </p>
          <p className="font-heading text-[17px] font-semibold text-background tabular-nums leading-tight mt-0.5">
            ₹50,150
          </p>
        </motion.div>
      </div>
    </div>
  );
}
