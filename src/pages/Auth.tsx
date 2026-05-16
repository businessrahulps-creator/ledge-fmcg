import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { logError } from "@/utils/errorLog";
import { AuthShell } from "@/components/auth/AuthShell";
import { ActTransition } from "@/components/auth/ActTransition";
import { useFocusFirstField } from "@/components/auth/useFocusFirstField";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { MagneticWrapper } from "@/components/landing/MagneticWrapper";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password is required").max(72),
});
type LoginValues = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Your name is required").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Min. 8 characters").max(72),
});
type SignupValues = z.infer<typeof signupSchema>;

type Mode = "signin" | "signup";
type Stage = "choice" | "email";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.36-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshProfile, user, companyId, authReady, profileLoaded } = useAuth();
  const reduce = useReducedMotion();

  const initialMode: Mode = params.get("mode") === "signin" ? "signin" : "signup";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [stage, setStage] = useState<Stage>("choice");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const verified = params.get("verified") === "1";

  const panelRef = useRef<HTMLDivElement>(null);
  useFocusFirstField(stage === "email", panelRef, [mode]);

  // Already signed in? Skip to dashboard or welcome.
  useEffect(() => {
    if (!authReady || !profileLoaded) return;
    if (!user) return;
    navigate(companyId ? "/dashboard" : "/welcome", { replace: true });
  }, [user, companyId, authReady, profileLoaded, navigate]);

  // ── Signup form ──────────────────────────────────────────────────────────
  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: { fullName: "", email: "", password: "" },
  });

  // ── Login form ───────────────────────────────────────────────────────────
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  // ── Google ───────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if ((result as any).error) {
        toast.error("Couldn't continue with Google", { description: "Please try again or use email." });
        logError({ source: "auth:google", error: (result as any).error });
        setGoogleLoading(false);
        return;
      }
      if ((result as any).redirected) return; // Browser is navigating to Google
      // Tokens received; AuthContext listener will pick up the session.
      await refreshProfile();
      // Navigation happens via the effect above once user/companyId resolve
    } catch (err: any) {
      toast.error("Couldn't continue with Google", { description: err?.message ?? "Please try again." });
      logError({ source: "auth:google", error: err });
      setGoogleLoading(false);
    }
  };

  // ── Email sign in ────────────────────────────────────────────────────────
  const onSignIn = async ({ email, password }: LoginValues) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid credentials", { description: "Check your email and password." });
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Email not verified", { description: "Check your inbox first." });
      } else {
        toast.error("Sign in failed", { description: error.message });
      }
      return;
    }
    // Navigation handled by the effect above
  };

  // ── Email sign up ────────────────────────────────────────────────────────
  const onSignUp = async ({ fullName, email, password }: SignupValues) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth?verified=1`,
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      if (!authData.session) {
        toast.success("Check your email", {
          description: "Confirm the link to finish setting up your workspace.",
        });
        setMode("signin");
        setStage("choice");
        return;
      }

      await refreshProfile();
      navigate("/welcome", { replace: true });
    } catch (err: any) {
      toast.error("Couldn't create your account", { description: err.message });
      logError({ source: "auth:signup", error: err });
    }
  };

  // ── Forgot password ──────────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return toast.error("Enter your email address");
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) toast.error("Something went wrong", { description: error.message });
      else {
        toast.success("Reset link sent — check your email");
        setForgotOpen(false);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setStage("choice");
  };

  const progress = stage === "email" ? 0.22 : 0.08;
  const ribbonLabel = mode === "signup" ? "Open your ledger" : "Welcome back";

  return (
    <>
      <AuthShell progress={progress} ribbonLabel={ribbonLabel}>
        <div ref={panelRef} className="space-y-6">
          {verified && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-[13px] text-success"
            >
              Email verified. Sign in to open your ledger.
            </motion.div>
          )}

          {/* Mode morphing tabs */}
          <div className="space-y-2">
            <h1 className="font-heading text-[34px] sm:text-[40px] leading-[1.05] tracking-tight text-foreground">
              {mode === "signup" ? (
                <>Open your <span className="italic text-accent">ledger</span>.</>
              ) : (
                <>Welcome <span className="italic text-accent">back</span>.</>
              )}
            </h1>
            <p className="text-[14px] text-muted-foreground">
              {mode === "signup" ? "30-day trial, no card." : "Pick up where you left off."}
              {" "}
              <button
                type="button"
                onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
                className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors"
              >
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>

          <ActTransition actKey={`${mode}-${stage}`} className="space-y-4">
            {stage === "choice" && (
              <div className="space-y-3">
                <MagneticWrapper strength={5} radius={60}>
                  <Button
                    onClick={handleGoogle}
                    disabled={googleLoading}
                    size="lg"
                    variant="outline"
                    className="w-full h-12 rounded-md bg-card border-border hover:bg-muted text-foreground gap-3 shadow-depth-2"
                  >
                    {googleLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleIcon className="h-[18px] w-[18px]" />
                    )}
                    <span className="font-medium">
                      {mode === "signup" ? "Continue with Google" : "Sign in with Google"}
                    </span>
                  </Button>
                </MagneticWrapper>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  onClick={() => setStage("email")}
                  variant="ghost"
                  size="lg"
                  className="w-full h-12 rounded-md text-foreground gap-2 hover:bg-muted"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                  <span className="font-medium">Continue with email</span>
                </Button>
              </div>
            )}

            {stage === "email" && mode === "signup" && (
              <form onSubmit={signupForm.handleSubmit(onSignUp)} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Your name</Label>
                  <Input
                    id="fullName"
                    placeholder="Rajesh Kumar"
                    className="h-12 rounded-md"
                    aria-invalid={!!signupForm.formState.errors.fullName}
                    {...signupForm.register("fullName")}
                  />
                  {signupForm.formState.errors.fullName && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-su">Work email</Label>
                  <Input
                    id="email-su"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.in"
                    className="h-12 rounded-md"
                    aria-invalid={!!signupForm.formState.errors.email}
                    {...signupForm.register("email")}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-su">Password</Label>
                  <div className="relative">
                    <Input
                      id="password-su"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className="h-12 rounded-md pr-10"
                      aria-invalid={!!signupForm.formState.errors.password}
                      {...signupForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
                <MagneticWrapper strength={4} radius={50}>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={signupForm.formState.isSubmitting || !signupForm.formState.isValid}
                    className="w-full h-12 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-depth-4"
                  >
                    {signupForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Start free trial
                  </Button>
                </MagneticWrapper>
                <button
                  type="button"
                  onClick={() => setStage("choice")}
                  className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </form>
            )}

            {stage === "email" && mode === "signin" && (
              <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email-si">Email</Label>
                  <Input
                    id="email-si"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.in"
                    className="h-12 rounded-md"
                    aria-invalid={!!loginForm.formState.errors.email}
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-si">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(loginForm.getValues("email")); setForgotOpen(true); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password-si"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-12 rounded-md pr-10"
                      aria-invalid={!!loginForm.formState.errors.password}
                      {...loginForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <MagneticWrapper strength={4} radius={50}>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loginForm.formState.isSubmitting || !loginForm.formState.isValid}
                    className="w-full h-12 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-depth-4"
                  >
                    {loginForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Sign in
                  </Button>
                </MagneticWrapper>
                <button
                  type="button"
                  onClick={() => setStage("choice")}
                  className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </form>
            )}
          </ActTransition>

          <p className="text-center text-[11px] text-muted-foreground/70 pt-2">
            <Link to="/" className="hover:text-foreground transition-colors">← Back to home</Link>
          </p>
        </div>
      </AuthShell>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>We'll email you a link to set a new one.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="h-12 rounded-md"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetLoading}>
              {resetLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send reset link
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
