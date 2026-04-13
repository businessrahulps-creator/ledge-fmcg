import { ReactNode } from "react";

/* -- Browser Frame (macOS-style) -- */
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
      className={`rounded-3xl overflow-hidden bg-white border border-[#E8E5E0] ${className}`}
      style={{
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 20px 60px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E8E5E0] bg-[#F8F7F5]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-6">
          <div className="h-5 bg-white/80 rounded-md flex items-center justify-center border border-[#E8E5E0]">
            <span className="text-[10px] text-[#A8A29E] tracking-wide">{url}</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* -- Phone Frame (modern bezel-less) -- */
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
          "0 4px 12px rgba(0,0,0,0.06), 0 25px 60px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)",
        borderRadius: "32px",
        padding: "12px 6px 14px",
        background: "linear-gradient(145deg, #1A1A1A, #27272A)",
      }}
    >
      {/* Notch */}
      <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-20 h-[18px] bg-[#1A1A1A] rounded-b-xl z-10" />
      {/* Screen */}
      <div className="rounded-[22px] overflow-hidden bg-white">{children}</div>
      {/* Home indicator */}
      <div className="flex justify-center mt-2">
        <div className="w-16 h-1 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

/* -- Gradient Stage (ambient backdrop) -- */
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
      "radial-gradient(ellipse at 30% 20%, rgba(13,148,136,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(168,162,158,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(248,247,245,0.8) 0%, rgba(248,247,245,0.4) 100%)",
    lavender:
      "radial-gradient(ellipse at 20% 30%, rgba(13,148,136,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(168,162,158,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(248,247,245,0.8) 0%, rgba(248,247,245,0.4) 100%)",
    emerald:
      "radial-gradient(ellipse at 30% 30%, rgba(13,148,136,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(13,148,136,0.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(248,247,245,0.8) 0%, rgba(248,247,245,0.4) 100%)",
  };

  return (
    <div
      className={`relative rounded-3xl p-6 md:p-10 ${className}`}
      style={{ background: gradients[variant] }}
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 rounded-3xl opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1A1A1A 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
