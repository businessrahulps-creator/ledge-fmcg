import ledgeLogo from "@/assets/ledge-logo.webp";

export function SplashScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Soft Terracotta halo behind wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(19 56% 40% / 0.35), transparent 70%)" }}
      />
      <img
        src={ledgeLogo}
        alt="Ledge"
        className="relative h-14 w-auto animate-fade-in"
      />
      <p className="relative mt-4 text-sm text-muted-foreground animate-fade-in">Loading…</p>
    </div>
  );
}
