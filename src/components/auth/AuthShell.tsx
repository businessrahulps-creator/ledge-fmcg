import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ledgeMark from "@/assets/ledge-mark.webp";
import ledgeLogo from "@/assets/ledge-logo.webp";
import { Link } from "react-router-dom";

interface Props {
  /** 0..1 progress through the auth → welcome arc */
  progress: number;
  /** Short caption shown next to the ribbon (e.g. "Step 2 of 3") */
  ribbonLabel?: string;
  children: ReactNode;
}

/**
 * Persistent Bone-toned panel shared across /auth and /welcome.
 * - Breathing Ledge mark (subtle, top-left on desktop, centered on mobile)
 * - Terracotta progress ribbon that fills as the user moves through acts
 * - Cursor-aware ambient halo (disabled for reduced motion / touch)
 * - Mobile-first: stacks vertically; desktop adds the side-panel chrome
 */
export function AuthShell({ progress, ribbonLabel, children }: Props) {
  const reduce = useReducedMotion();
  const shellRef = useRef<HTMLDivElement>(null);
  const [aura, setAura] = useState({ x: 50, y: 30 });

  // Cursor aura — write CSS vars; rAF-throttled
  useEffect(() => {
    if (reduce) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(hover: none)").matches) return;
    const el = shellRef.current;
    if (!el) return;

    let raf = 0;
    let lx = 50, ly = 30;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      lx = ((e.clientX - rect.left) / rect.width) * 100;
      ly = ((e.clientY - rect.top) / rect.height) * 100;
      if (!raf) raf = requestAnimationFrame(() => { setAura({ x: lx, y: ly }); raf = 0; });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div
      ref={shellRef}
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background"
    >
      {/* Cursor aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle 600px at ${aura.x}% ${aura.y}%, hsl(19 56% 40% / 0.10), transparent 60%)`,
          opacity: reduce ? 0 : 1,
        }}
      />

      {/* Subtle paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top ribbon */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={ledgeLogo} alt="Ledge" className="h-7 w-auto" decoding="async" />
        </Link>
        {ribbonLabel && (
          <span className="text-xs font-medium tracking-wide text-muted-foreground hidden sm:block">
            {ribbonLabel}
          </span>
        )}
      </header>

      {/* Progress ribbon */}
      <div className="relative z-20 mx-5 sm:mx-8 mb-4 h-[3px] rounded-full bg-foreground/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${clamped * 100}%` }}
          transition={{ duration: reduce ? 0.15 : 0.6, ease: [0.1, 0.9, 0.2, 1] }}
          style={{ boxShadow: clamped > 0 ? "0 0 12px hsl(19 56% 40% / 0.4)" : undefined }}
        />
      </div>

      {/* Body */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
        <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-[1fr_minmax(380px,440px)] md:gap-16">
          {/* Left — breathing mark (hidden on mobile, lives in form on mobile) */}
          <aside className="hidden md:flex flex-col items-start gap-6">
            <motion.img
              src={ledgeMark}
              alt=""
              aria-hidden
              className="h-24 w-24 select-none"
              decoding="async"
              animate={reduce ? undefined : { scale: [1, 1.025, 1], opacity: [0.94, 1, 0.94] }}
              transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="space-y-3 max-w-sm">
              <h2 className="font-heading text-3xl leading-tight text-foreground">
                The ledger,
                <br />
                <span className="italic text-accent">opened.</span>
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Built for the founders who run India's distribution networks. One place for orders, dealers, dispatches, and the money you're owed.
              </p>
            </div>
          </aside>

          {/* Right — content surface */}
          <section className="w-full">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
