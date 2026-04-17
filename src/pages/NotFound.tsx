import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Keep diagnostic for analytics; not user-facing.
    // eslint-disable-next-line no-console
    console.warn("404 — non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dot-grid-bg p-4">
      <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
        <div>
          <span className="font-heading font-extrabold text-3xl tracking-[-0.04em] text-foreground">
            Ledge
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-10 shadow-sm backdrop-blur-sm space-y-6">
          <p className="text-7xl font-bold tracking-tight text-foreground/90 tabular-nums">404</p>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
            <p className="text-sm text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </Button>
            <Button asChild className="rounded-full">
              <Link to="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
