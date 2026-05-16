import { ReactNode } from "react";
import { MAC_DOTS } from "./constants";

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
      className={`rounded-md overflow-hidden bg-card border border-border ${className}`}
      style={{
        boxShadow:
          "0 1px 3px hsl(var(--primary) / 0.04), 0 30px 80px -16px hsl(var(--primary) / 0.14), 0 0 0 1px hsl(var(--primary) / 0.02), inset 0 1px 0 hsl(0 0% 100% / 0.7)",
      }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MAC_DOTS.red }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MAC_DOTS.yellow }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MAC_DOTS.green }} />
        </div>
        <div className="flex-1 mx-6">
          <div className="h-5 bg-background/80 rounded-md flex items-center justify-center border border-border">
            <span className="text-[10px] text-muted-foreground tracking-wide">{url}</span>
          </div>
        </div>
      </div>
      {/* Inner radius matches frame so the screenshot doesn't square-off the corners */}
      <div className="rounded-[4px] overflow-hidden">{children}</div>
    </div>
  );
}

/* -- Phone Frame (modern bezel-less, Midnight chassis) -- */
export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative mx-auto max-w-[320px] ${className}`}
      style={{
        boxShadow:
          "0 4px 12px hsl(var(--primary) / 0.06), 0 35px 80px -10px hsl(var(--primary) / 0.18), 0 0 0 1px hsl(var(--primary) / 0.04), inset 0 1px 0 hsl(0 0% 100% / 0.08)",
        borderRadius: "32px",
        padding: "12px 6px 14px",
        background:
          "linear-gradient(160deg, hsl(218 60% 14%) 0%, hsl(218 60% 18%) 50%, hsl(218 60% 20%) 100%)",
      }}
    >
      {/* Notch */}
      <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-20 h-[18px] rounded-b-xl z-10 bg-primary" />
      {/* Screen */}
      <div className="rounded-[22px] overflow-hidden bg-card">{children}</div>
      {/* Home indicator */}
      <div className="flex justify-center mt-2">
        <div className="w-16 h-1 rounded-full bg-background/30" />
      </div>
    </div>
  );
}

/* -- Gradient Stage (ambient backdrop) -- */
export function GradientStage({
  children,
  variant = "terracotta",
  className = "",
}: {
  children: ReactNode;
  variant?: "terracotta" | "bone" | "emerald";
  className?: string;
}) {
  const gradients: Record<string, string> = {
    terracotta:
      "radial-gradient(ellipse at 30% 20%, hsl(var(--accent) / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(var(--primary) / 0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.4) 100%)",
    bone:
      "radial-gradient(ellipse at 20% 30%, hsl(var(--accent) / 0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, hsl(var(--primary) / 0.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.4) 100%)",
    emerald:
      "radial-gradient(ellipse at 30% 30%, hsl(var(--success) / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, hsl(var(--success) / 0.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.4) 100%)",
  };

  return (
    <div
      className={`relative rounded-3xl p-6 md:p-10 ${className}`}
      style={{ background: gradients[variant] }}
    >
      {/* Ambient glow — subtle spotlight behind the mockup */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none z-0 animate-[ambientGlow_1.8s_ease-out_0.8s_forwards]"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, hsl(var(--primary) / 0.06), transparent 70%)",
          opacity: 0,
        }}
      />
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 rounded-3xl opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
