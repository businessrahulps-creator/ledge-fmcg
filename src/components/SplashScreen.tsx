export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground animate-pulse">
        Ledge
      </h1>
      <p className="mt-3 text-sm text-muted-foreground animate-fade-in">Loading…</p>
    </div>
  );
}
