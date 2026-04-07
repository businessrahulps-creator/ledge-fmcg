import { ReactNode } from "react";

/* ── Browser Frame (macOS-style) ── */
export function BrowserFrame({
  children,
  url = "app.ledge.in",
  className = "",
}: {
  children: ReactNode;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden bg-white border border-indigo-100/80 ${className}`}
      style={{
        boxShadow:
          "0 2px 8px rgba(99,102,241,0.06), 0 20px 60px -12px rgba(99,102,241,0.18), 0 0 0 1px rgba(99,102,241,0.04)",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-indigo-50 bg-gradient-to-b from-[#F9FAFB] to-[#F3F4F6]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-6">
          <div className="h-5 bg-white/80 rounded-md flex items-center justify-center border border-gray-200/60">
            <span className="text-[10px] text-gray-400 tracking-wide">{url}</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Phone Frame (modern bezel-less) ── */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto max-w-[280px] ${className}`}
      style={{
        boxShadow:
          "0 4px 12px rgba(99,102,241,0.08), 0 25px 60px -10px rgba(99,102,241,0.2), 0 0 0 1px rgba(99,102,241,0.05)",
        borderRadius: "32px",
        padding: "12px 6px 14px",
        background: "linear-gradient(145deg, #1E1B4B, #312E81)",
      }}
    >
      {/* Notch */}
      <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-20 h-[18px] bg-[#1E1B4B] rounded-b-xl z-10" />
      {/* Screen */}
      <div className="rounded-[22px] overflow-hidden bg-white">{children}</div>
      {/* Home indicator */}
      <div className="flex justify-center mt-2">
        <div className="w-16 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

/* ── Gradient Stage (ambient backdrop) ── */
export function GradientStage({
  children,
  variant = "indigo",
  className = "",
}: {
  children: ReactNode;
  variant?: "indigo" | "lavender" | "emerald";
  className?: string;
}) {
  const gradients: Record<string, string> = {
    indigo:
      "radial-gradient(ellipse at 30% 20%, rgba(129,140,248,0.25) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(167,139,250,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(224,231,255,0.6) 0%, rgba(238,242,255,0.3) 100%)",
    lavender:
      "radial-gradient(ellipse at 20% 30%, rgba(167,139,250,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(196,181,253,0.2) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(237,233,254,0.6) 0%, rgba(245,243,255,0.3) 100%)",
    emerald:
      "radial-gradient(ellipse at 30% 30%, rgba(110,231,183,0.2) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(167,243,208,0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(236,253,245,0.6) 0%, rgba(240,253,244,0.3) 100%)",
  };

  return (
    <div
      className={`relative rounded-3xl p-6 md:p-10 ${className}`}
      style={{ background: gradients[variant] }}
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 rounded-3xl opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #6366F1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
