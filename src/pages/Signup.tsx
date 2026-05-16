import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { logError } from "@/utils/errorLog";
import ledgeLogo from "@/assets/ledge-logo.webp";

const signupSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required").max(120, "Company name is too long"),
  fullName: z.string().trim().min(2, "Your name is required").max(80, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"),
});

type SignupValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: { companyName: "", fullName: "", email: "", password: "" },
  });

  const onSubmit = async ({ companyName, fullName, email, password }: SignupValues) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, company_name: companyName },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      if (!authData.session) {
        toast.success("Check your email to verify", {
          description: "Confirm the link, then sign in — your workspace will be ready.",
        });
        navigate("/login");
        return;
      }

      const { error: setupError } = await supabase.rpc("setup_new_company", {
        p_company_name: companyName,
        p_full_name: fullName,
      });
      if (setupError) throw setupError;

      await refreshProfile();

      // Safety net: confirm the profile actually has company_id before navigating.
      // If the rare race happens, NoCompanyGuard will take over from the dashboard.
      const { data: confirmed } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("user_id", authData.user.id)
        .single();
      if (!confirmed?.company_id) {
        logError({
          source: "auth:signup:company-id-missing-post-setup",
          error: new Error("Profile has no company_id after setup_new_company"),
          severity: "warning",
          context: { userId: authData.user.id },
        });
      }

      toast.success("Welcome to Ledge!", { description: "Your workspace is ready." });
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Signup failed", { description: err.message });
      logError({ source: "auth:signup", error: err, context: { hasCompanyName: !!companyName } });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background dot-grid-bg p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <img src={ledgeLogo} alt="Ledge" className="h-10 w-auto" decoding="async" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your 30-day free trial — no card required
          </p>
        </div>

        {/* Form */}
        <div className="rounded-md border border-border bg-card/80 p-8 shadow-sm backdrop-blur-sm">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">Company name</Label>
              <Input id="company" placeholder="Acme FMCG Pvt. Ltd." className="h-12 rounded-lg"
                aria-invalid={!!errors.companyName} {...register("companyName")} />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Your name</Label>
              <Input id="name" placeholder="Rajesh Kumar" className="h-12 rounded-lg"
                aria-invalid={!!errors.fullName} {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
              <Input id="email" type="email" placeholder="rajesh@acmefmcg.in" className="h-12 rounded-lg"
                autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button className="w-full mt-2 bg-[#27272A] hover:bg-[#1A1A1A] text-white rounded-full" size="lg" type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Start free trial
            </Button>
          </form>
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
