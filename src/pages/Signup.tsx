import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !fullName || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, company_name: companyName },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      // If email confirmation is required, session will be null
      if (!authData.session) {
        toast.success("Check your email", { description: "We sent a verification link — confirm it, then sign in." });
        navigate("/login");
        return;
      }

      // 2. Single RPC handles company + profile + role + seed data
      const { error: setupError } = await supabase.rpc("setup_new_company", {
        p_company_name: companyName,
        p_full_name: fullName,
      });
      if (setupError) throw setupError;

      // Force profile reload so companyId is available before dashboard mounts
      await refreshProfile();

      toast.success("Welcome to Ledge!", { description: "Your workspace is ready." });
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Signup failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dot-grid-bg p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="mb-6">
            <span className="font-heading font-extrabold text-3xl tracking-[-0.04em] text-foreground">Ledge</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your 30-day free trial — no card required
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card/80 p-8 shadow-sm backdrop-blur-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">Company name</Label>
              <Input id="company" placeholder="Acme FMCG Pvt. Ltd." className="h-12 rounded-lg"
                value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Your name</Label>
              <Input id="name" placeholder="Rajesh Kumar" className="h-12 rounded-lg"
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
              <Input id="email" type="email" placeholder="rajesh@acmefmcg.in" className="h-12 rounded-lg"
                autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="h-12 rounded-lg pr-10"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button className="w-full mt-2" size="lg" type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Start free trial
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card/80 px-2 text-muted-foreground">or</span></div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            disabled={googleLoading}
            onClick={async () => {
              setGoogleLoading(true);
              try {
                const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                if (result.error) { toast.error("Google sign-up failed", { description: String(result.error) }); }
                if (result.redirected) return;
                navigate("/dashboard");
              } catch (err: any) {
                toast.error("Google sign-up failed", { description: err.message });
              } finally {
                setGoogleLoading(false);
              }
            }}
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            )}
            Continue with Google
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
