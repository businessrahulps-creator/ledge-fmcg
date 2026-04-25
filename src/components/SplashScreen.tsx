export function SplashScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Soft brand gradient halo behind wordmark */}
      <div
        aria-hidden
        className="brand-gradient-bg pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
      />
      <h1 className="relative font-heading text-4xl font-extrabold tracking-tight animate-pulse">
        <span className="brand-gradient-text">Ledge</span>
      </h1>
      <p className="relative mt-3 text-sm text-muted-foreground animate-fade-in">Loading…</p>
    </div>
  );
}
